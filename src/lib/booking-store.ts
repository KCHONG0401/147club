/**
 * 简易 sessionStorage 预订草稿存储 — 仅用于把"已确认订单"传给确认页展示。
 * 实际订单已经写入数据库，这里只是 UX 缓存。
 */
import type { BookingDraft } from "./snooker-tables";

const KEY = "snooker_booking_drafts_v2";

function read(): Record<string, BookingDraft> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function write(data: Record<string, BookingDraft>) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(data));
}

export function saveBooking(b: BookingDraft) {
  const all = read();
  all[b.bookingId] = b;
  write(all);
}

export function getBooking(id: string): BookingDraft | null {
  return read()[id] ?? null;
}

export function clearAllBookings() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
  // 同时清掉旧 key
  sessionStorage.removeItem("snooker_booking_drafts");
}
