/**
 * 球台数据 + 时段可用性模拟
 * 真实数据将在接入 Lovable Cloud 后替换为数据库查询
 */

export type TableType = "Standard" | "Pro" | "VIP";

export interface SnookerTable {
  id: number;
  name: string;
  code: string;
  type: TableType;
  description: string;
  features: string[];
  pricePerHour: number;
  memberPricePerHour: number;
}

export const TABLES: SnookerTable[] = [
  // 3 张 Standard
  {
    id: 1,
    name: "标准 1 号台",
    code: "S-01",
    type: "Standard",
    description: "经典英式标准球台，舒适体验",
    features: ["Strachan 6811 台呢", "标准 12ft", "环境照明"],
    pricePerHour: 35,
    memberPricePerHour: 28,
  },
  {
    id: 2,
    name: "标准 2 号台",
    code: "S-02",
    type: "Standard",
    description: "经典英式标准球台，舒适体验",
    features: ["Strachan 6811 台呢", "标准 12ft", "环境照明"],
    pricePerHour: 35,
    memberPricePerHour: 28,
  },
  {
    id: 3,
    name: "标准 3 号台",
    code: "S-03",
    type: "Standard",
    description: "经典英式标准球台，舒适体验",
    features: ["Strachan 6811 台呢", "标准 12ft", "环境照明"],
    pricePerHour: 35,
    memberPricePerHour: 28,
  },
  // 2 张 Pro
  {
    id: 4,
    name: "专业 4 号台",
    code: "P-04",
    type: "Pro",
    description: "赛事级专业球台，世锦赛同款规格",
    features: ["Strachan 6811 Tournament", "锦标赛灯光", "石板桌面"],
    pricePerHour: 50,
    memberPricePerHour: 40,
  },
  {
    id: 5,
    name: "专业 5 号台",
    code: "P-05",
    type: "Pro",
    description: "赛事级专业球台，世锦赛同款规格",
    features: ["Strachan 6811 Tournament", "锦标赛灯光", "石板桌面"],
    pricePerHour: 50,
    memberPricePerHour: 40,
  },
  // 1 张 VIP
  {
    id: 6,
    name: "VIP 至尊包厢",
    code: "V-06",
    type: "VIP",
    description: "独立包厢，私密尊享，配 VIP 专属服务",
    features: ["独立包厢", "皮质沙发", "专属服务员", "免费饮品"],
    pricePerHour: 80,
    memberPricePerHour: 60,
  },
];

/** 营业时间 12:00 - 02:00（次日），按 1 小时切片 */
export const TIME_SLOTS = [
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
  "00:00",
  "01:00",
] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number];

export const DURATIONS = [1, 2, 3] as const;
export type Duration = (typeof DURATIONS)[number];

/**
 * 基于 (日期 + 球台ID) 的伪随机占用时段。
 * 同一天同一球台的占用结果是稳定的 — 用户切换日期能看到不同状态。
 */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function dateSeed(date: Date, tableId: number): number {
  const dayKey = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  return dayKey * 100 + tableId;
}

/** 返回某一天某球台的已占用时段集合 */
export function getOccupiedSlots(date: Date, tableId: number): Set<TimeSlot> {
  const rand = seededRandom(dateSeed(date, tableId));
  const occupied = new Set<TimeSlot>();
  // VIP 占用率较低 (id=6)，Standard 较高
  const occupancyRate = tableId === 6 ? 0.25 : tableId <= 3 ? 0.5 : 0.4;
  for (const slot of TIME_SLOTS) {
    if (rand() < occupancyRate) occupied.add(slot);
  }
  return occupied;
}

/** 检查指定起始时段 + 时长在某球台是否可预订（连续时段都空） */
export function isSlotRangeAvailable(
  date: Date,
  tableId: number,
  startSlot: TimeSlot,
  duration: Duration,
): boolean {
  const startIdx = TIME_SLOTS.indexOf(startSlot);
  if (startIdx < 0 || startIdx + duration > TIME_SLOTS.length) return false;
  const occupied = getOccupiedSlots(date, tableId);
  for (let i = 0; i < duration; i++) {
    if (occupied.has(TIME_SLOTS[startIdx + i])) return false;
  }
  return true;
}

/** 计算价格 */
export function calculatePrice(table: SnookerTable, duration: Duration, discountFactor: number = 1.0): number {
  const rate = table.pricePerHour * discountFactor;
  return rate * duration;
}

/** 生成预订号 */
export function generateBookingId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `147-${ts}-${rnd}`;
}

export interface BookingDraft {
  bookingId: string;
  tableId: number;
  tableName: string;
  tableCode: string;
  tableType: TableType;
  date: string; // ISO yyyy-MM-dd
  startSlot: TimeSlot;
  duration: Duration;
  guests: number;
  customerName: string;
  customerPhone: string;
  totalPrice: number;
  isMember: boolean;
  createdAt: string;
}
