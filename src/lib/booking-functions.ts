import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { type TimeSlot, type Duration, TIME_SLOTS } from "./snooker-tables";

/**
 * 获取特定日期和球台的实际占用时段
 */
const GetOccupiedSchema = z.object({
  date: z.string(), // yyyy-MM-dd
  tableCode: z.string(),
});

export const getActualOccupiedSlots = createServerFn({ method: "GET" })
  .handler(async ({ data: rawData }) => {
    const data = GetOccupiedSchema.parse(rawData);
    const { data: bookings, error } = await supabaseAdmin
      .from("bookings")
      .select("start_slot, duration_minutes")
      .eq("booking_date", data.date)
      .eq("table_id", data.tableCode)
      .neq("status", "cancelled");

    if (error) throw new Error(error.message);

    const occupied = new Set<string>();

    (bookings ?? []).forEach((b) => {
      const startIdx = TIME_SLOTS.indexOf(b.start_slot as TimeSlot);
      const durationHours = b.duration_minutes / 60;
      if (startIdx !== -1) {
        for (let i = 0; i < durationHours; i++) {
          if (TIME_SLOTS[startIdx + i]) {
            occupied.add(TIME_SLOTS[startIdx + i]);
          }
        }
      }
    });

    return Array.from(occupied);
  });

/**
 * 获取特定日期所有球台的占用情况
 */
export const getAllTablesOccupancy = createServerFn({ method: "GET" })
  .handler(async ({ data: date }) => {
    z.string().parse(date);
    const { data: bookings, error } = await supabaseAdmin
      .from("bookings")
      .select("table_id, start_slot, duration_minutes")
      .eq("booking_date", date)
      .neq("status", "cancelled");

    if (error) throw new Error(error.message);

    const occupancyMap: Record<string, string[]> = {};

    (bookings ?? []).forEach((b) => {
      if (!occupancyMap[b.table_id]) occupancyMap[b.table_id] = [];

      const startIdx = TIME_SLOTS.indexOf(b.start_slot as TimeSlot);
      const durationHours = b.duration_minutes / 60;
      if (startIdx !== -1) {
        for (let i = 0; i < durationHours; i++) {
          if (TIME_SLOTS[startIdx + i]) {
            occupancyMap[b.table_id].push(TIME_SLOTS[startIdx + i]);
          }
        }
      }
    });

    return occupancyMap;
  });

/**
 * 提交预订 (服务器端验证)
 */
const CreateBookingSchema = z.object({
  name: z.string().min(2),
  phone: z.string(),
  guests: z.number().min(1),
  tableCode: z.string(),
  tableType: z.string(),
  date: z.string(),
  startSlot: z.string(),
  duration: z.number(),
  totalPrice: z.number(),
  userId: z.string().uuid().optional().nullable(),
  bookingCode: z.string(),
});

export const submitBooking = createServerFn({ method: "POST" })
  .handler(async ({ data: rawData }) => {
    const data = CreateBookingSchema.parse(rawData);
    // 1. 再次验证可用性 (防止并发冲突)
    const occupied = await getActualOccupiedSlots({
      data: { date: data.date, tableCode: data.tableCode },
    });

    const occupiedSet = new Set(occupied);
    const startIdx = TIME_SLOTS.indexOf(data.startSlot as TimeSlot);

    for (let i = 0; i < data.duration; i++) {
      if (occupiedSet.has(TIME_SLOTS[startIdx + i])) {
        throw new Error("该时段刚刚被抢占，请选择其他时段或球台");
      }
    }

    // 2. 插入数据库
    const endSlot = TIME_SLOTS[startIdx + data.duration] ?? TIME_SLOTS[TIME_SLOTS.length - 1];

    const { error } = await supabaseAdmin.from("bookings").insert({
      booking_code: data.bookingCode,
      user_id: data.userId ?? null,
      guest_name: data.name,
      guest_phone: data.phone,
      table_id: data.tableCode,
      table_type: data.tableType,
      booking_date: data.date,
      start_slot: data.startSlot,
      end_slot: endSlot,
      duration_minutes: data.duration * 60,
      total_price: data.totalPrice,
      status: "active",
    });

    if (error) throw new Error(error.message);

    return { success: true, bookingCode: data.bookingCode };
  });
