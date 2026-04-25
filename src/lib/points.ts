export const POINTS_MULTIPLIER: Record<string, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
};

export const LEVEL_THRESHOLDS = { silver: 500, gold: 2000 };

export function calcPoints(totalPrice: number, level: string): number {
  return Math.floor(totalPrice * (POINTS_MULTIPLIER[level] ?? 0));
}

export function getLevel(points: number): "bronze" | "silver" | "gold" {
  if (points >= LEVEL_THRESHOLDS.gold) return "gold";
  if (points >= LEVEL_THRESHOLDS.silver) return "silver";
  return "bronze";
}

export function nextLevelInfo(level: string, points: number): { label: string; needed: number; progress: number } | null {
  if (level === "silver") {
    const needed = LEVEL_THRESHOLDS.gold - points;
    const progress = Math.min(100, ((points - LEVEL_THRESHOLDS.silver) / (LEVEL_THRESHOLDS.gold - LEVEL_THRESHOLDS.silver)) * 100);
    return { label: "Gold", needed, progress };
  }
  if (level === "bronze") {
    const needed = LEVEL_THRESHOLDS.silver - points;
    const progress = Math.min(100, (points / LEVEL_THRESHOLDS.silver) * 100);
    return { label: "Silver", needed, progress };
  }
  return null;
}
