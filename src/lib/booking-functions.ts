import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { type TimeSlot, type Duration, TIME_SLOTS } from "./snooker-tables";
import { calcPoints, getLevel } from "./points";

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

    // 2. 计算积分（会员才有）
    let pointsAwarded = 0;
    let currentPoints = 0;

    if (data.userId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("level, points")
        .eq("id", data.userId)
        .maybeSingle();

      if (profile) {
        pointsAwarded = calcPoints(data.totalPrice, profile.level);
        currentPoints = profile.points;
      }
    }

    // 3. 插入数据库
    const startHour = parseInt(data.startSlot.split(":")[0], 10);
    const endHour = (startHour + data.duration) % 24;
    const endSlot = `${String(endHour).padStart(2, "0")}:00`;

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
      points_awarded: pointsAwarded,
    });

    if (error) throw new Error(error.message);

    // 4. 更新积分 + 自动升级
    if (data.userId && pointsAwarded > 0) {
      const newPoints = currentPoints + pointsAwarded;
      const newLevel = getLevel(newPoints);
      const { error: pointsError } = await supabaseAdmin
        .from("profiles")
        .update({ points: newPoints, level: newLevel })
        .eq("id", data.userId);
      if (pointsError) throw new Error(`积分更新失败：${pointsError.message}`);
    }

    return { success: true, bookingCode: data.bookingCode, pointsAwarded };
  });

/**
 * 管理员手动调整会员积分（绕过 RLS）
 */
const AdjustPointsSchema = z.object({
  profileId: z.string().uuid(),
  delta: z.number().int(),
});

export const adminAdjustPoints = createServerFn({ method: "POST" })
  .handler(async ({ data: rawData }) => {
    const { profileId, delta } = AdjustPointsSchema.parse(rawData);
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("points")
      .eq("id", profileId)
      .maybeSingle();
    if (fetchError || !profile) throw new Error(fetchError?.message ?? "找不到该用户");
    const newPoints = Math.max(0, profile.points + delta);
    const newLevel = getLevel(newPoints);
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ points: newPoints, level: newLevel })
      .eq("id", profileId);
    if (error) throw new Error(error.message);
    return { points: newPoints, level: newLevel };
  });

/**
 * 管理员拉取指定日期全部预订（绕过 RLS）
 */
export const adminGetBookings = createServerFn({ method: "GET" })
  .handler(async ({ data: date }) => {
    z.string().parse(date);
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("booking_date", date as string)
      .order("start_slot");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/**
 * 管理员取消预订（绕过 RLS）
 */
const CancelBookingSchema = z.object({
  bookingId: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  pointsAwarded: z.number().int(),
});

export const adminCancelBooking = createServerFn({ method: "POST" })
  .handler(async ({ data: rawData }) => {
    const { bookingId, userId, pointsAwarded } = CancelBookingSchema.parse(rawData);
    const { error } = await supabaseAdmin
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);
    if (error) throw new Error(error.message);
    if (userId && pointsAwarded > 0) {
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("points")
        .eq("id", userId)
        .maybeSingle();
      if (prof) {
        const newPoints = Math.max(0, prof.points - pointsAwarded);
        await supabaseAdmin
          .from("profiles")
          .update({ points: newPoints, level: getLevel(newPoints) })
          .eq("id", userId);
      }
    }
    return { success: true };
  });
