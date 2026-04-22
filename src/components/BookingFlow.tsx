import { useMemo, useState } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  CalendarIcon,
  Check,
  ChevronRight,
  Clock,
  Crown,
  Loader2,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { z } from "zod";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  calculatePrice,
  DURATIONS,
  generateBookingId,
  TABLES,
  TIME_SLOTS,
  type Duration,
  type SnookerTable,
  type TimeSlot,
} from "@/lib/snooker-tables";
import { saveBooking } from "@/lib/booking-store";
import { useAuth } from "@/contexts/AuthContext";
import { getAllTablesOccupancy, submitBooking } from "@/lib/booking-functions";

const TYPE_META: Record<SnookerTable["type"], { icon: typeof Crown; label: string; chip: string }> =
  {
    Standard: { icon: Sparkles, label: "标准", chip: "bg-muted text-muted-foreground" },
    Pro: { icon: Trophy, label: "专业", chip: "bg-primary/20 text-primary" },
    VIP: { icon: Crown, label: "VIP", chip: "bg-gold/20 text-gold" },
  };

const formSchema = z.object({
  name: z.string().trim().min(2, "请输入姓名").max(50),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{8,20}$/, "请输入有效手机号"),
  guests: z.coerce.number().int().min(1, "至少 1 人").max(8, "最多 8 人"),
});

export function BookingFlow() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [date, setDate] = useState<Date>(() => new Date());
  const [duration, setDuration] = useState<Duration>(2);
  const [startSlot, setStartSlot] = useState<TimeSlot | null>(null);
  const [tableId, setTableId] = useState<number | null>(null);
  // 自动识别会员状态与折扣
  const isMember = !!profile;
  const discount = useMemo(() => {
    if (!profile) return 1.0;
    const map: Record<string, number> = { bronze: 0.95, silver: 0.9, gold: 0.8 };
    return map[profile.level] || 1.0;
  }, [profile]);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const dateStr = format(date, "yyyy-MM-dd");

  // Fetch real occupancy from server
  const { data: occupancyMap = {} } = useQuery({
    queryKey: ["occupancy", dateStr],
    queryFn: () => getAllTablesOccupancy({ data: dateStr }),
  });

  // Helper to check if a range is available based on real data
  const isAvailable = (tblCode: string, slot: TimeSlot, dur: number) => {
    const occupied = new Set(occupancyMap[tblCode] || []);
    const startIdx = TIME_SLOTS.indexOf(slot);
    if (startIdx === -1 || startIdx + dur > TIME_SLOTS.length) return false;
    for (let i = 0; i < dur; i++) {
      if (occupied.has(TIME_SLOTS[startIdx + i])) return false;
    }
    return true;
  };

  // 计算每张桌当前选择下是否可预订
  const tableAvailability = useMemo(() => {
    const map = new Map<number, boolean>();
    for (const t of TABLES) {
      map.set(t.id, startSlot ? isAvailable(t.code, startSlot, duration) : true);
    }
    return map;
  }, [occupancyMap, startSlot, duration]);

  // 当前球台在当天所有时段的占用情况，用于时段网格按钮颜色
  const slotsOccupiedAcrossAllTables = useMemo(() => {
    const result = new Map<TimeSlot, number>(); // slot -> 占用台数
    for (const slot of TIME_SLOTS) result.set(slot, 0);

    Object.values(occupancyMap).forEach((slots) => {
      slots.forEach((s) => {
        const timeSlot = s as TimeSlot;
        result.set(timeSlot, (result.get(timeSlot) ?? 0) + 1);
      });
    });
    return result;
  }, [occupancyMap]);

  const selectedTable = tableId ? (TABLES.find((t) => t.id === tableId) ?? null) : null;

  const totalPrice = selectedTable ? calculatePrice(selectedTable, duration, isMember ? discount : 1.0) : 0;

  function handleSlotClick(slot: TimeSlot) {
    setStartSlot(slot);
    // 若当前球台变得不可用，则取消选中
    if (tableId && selectedTable && !isAvailable(selectedTable.code, slot, duration)) {
      setTableId(null);
    }
  }

  function handleDurationChange(d: Duration) {
    setDuration(d);
    if (startSlot && tableId && selectedTable && !isAvailable(selectedTable.code, startSlot, d)) {
      setTableId(null);
    }
  }

  function handleTableSelect(id: number) {
    if (!startSlot) {
      toast.warning("请先选择开始时段");
      return;
    }
    if (!tableAvailability.get(id)) return;
    setTableId(id);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedTable || !startSlot) {
      toast.error("请完成时段和球台选择");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const result = formSchema.safeParse({
      name: fd.get("name"),
      phone: fd.get("phone"),
      guests: fd.get("guests"),
    });
    if (!result.success) {
      const fe: Record<string, string> = {};
      for (const issue of result.error.issues) fe[issue.path[0] as string] = issue.message;
      setErrors(fe);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const bookingId = generateBookingId();

    try {
      await submitBooking({
        data: {
          name: result.data.name,
          phone: result.data.phone,
          guests: result.data.guests,
          tableCode: selectedTable.code,
          tableType: selectedTable.type,
          date: dateStr,
          startSlot,
          duration,
          totalPrice,
          userId: user?.id,
          bookingCode: bookingId,
        },
      });

      // Cache locally for instant confirm-page read
      saveBooking({
        bookingId,
        tableId: selectedTable.id,
        tableName: selectedTable.name,
        tableCode: selectedTable.code,
        tableType: selectedTable.type,
        date: dateStr,
        startSlot,
        duration,
        guests: result.data.guests,
        customerName: result.data.name,
        customerPhone: result.data.phone,
        totalPrice,
        isMember,
        createdAt: new Date().toISOString(),
      });

      navigate({ to: "/booking/confirm", search: { id: bookingId } });
    } catch (err: any) {
      toast.error(`预订失败：${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-10">
      {/* Step 1 — 日期 + 时长 + 时段 */}
      <Step number={1} title="选择日期与时段">
        <div className="grid gap-5 md:grid-cols-[auto_1fr]">
          {/* 日期 */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">
              预订日期
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start md:w-[220px]">
                  <CalendarIcon className="mr-2 size-4 text-primary" />
                  {format(date, "PPP", { locale: zhCN })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    if (d) {
                      setDate(d);
                      setStartSlot(null);
                      setTableId(null);
                    }
                  }}
                  disabled={(d) =>
                    d < new Date(new Date().setHours(0, 0, 0, 0)) ||
                    d > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  }
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 时长 */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">时长</Label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDurationChange(d)}
                  className={cn(
                    "flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-smooth md:flex-none md:min-w-[100px]",
                    duration === d
                      ? "border-primary bg-primary/10 text-primary shadow-neon-sm"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  {d} 小时
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 时段网格 */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">
              开始时段
            </Label>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary animate-pulse" /> 多桌可订
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-gold" /> 紧张
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-muted-foreground/40" /> 已满
              </span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {TIME_SLOTS.map((slot) => {
              const occupiedCount = slotsOccupiedAcrossAllTables.get(slot) ?? 0;
              const available = TABLES.length - occupiedCount;
              const idx = TIME_SLOTS.indexOf(slot);
              const tooLate = idx + duration > TIME_SLOTS.length;
              const fullyBooked = available === 0 || tooLate;
              const tight = available > 0 && available <= 2;
              const selected = startSlot === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={fullyBooked}
                  onClick={() => handleSlotClick(slot)}
                  className={cn(
                    "relative rounded-md border px-2 py-2.5 text-sm font-medium transition-smooth",
                    selected
                      ? "border-primary bg-primary text-primary-foreground shadow-neon-sm"
                      : fullyBooked
                        ? "cursor-not-allowed border-border bg-muted/30 text-muted-foreground/50 line-through"
                        : tight
                          ? "border-gold/40 bg-card text-foreground hover:border-gold"
                          : "border-border bg-card text-foreground hover:border-primary/60 hover:bg-primary/5",
                  )}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      </Step>

      {/* Step 2 — 球台 */}
      <Step
        number={2}
        title="选择球台"
        subtitle={startSlot ? `${startSlot} 起 · ${duration} 小时` : "请先选择开始时段"}
      >
        {/* 会员价开关 */}
        <div className="mb-5 flex items-center justify-between rounded-xl border border-border bg-gradient-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
              <Crown className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold">
                {isMember ? `${profile?.level?.toUpperCase()} 会员优惠` : "未登录 (标准价)"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isMember ? `已根据等级自动应用 ${Math.round(discount * 100) / 10} 折优惠` : "登录后可享受等级专属折扣"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TABLES.map((t) => {
            const meta = TYPE_META[t.type];
            const Icon = meta.icon;
            const isAvailable = tableAvailability.get(t.id) ?? true;
            const isSelected = tableId === t.id;
            const price = isMember ? t.pricePerHour * discount : t.pricePerHour;

            return (
              <button
                key={t.id}
                type="button"
                disabled={!isAvailable || !startSlot}
                onClick={() => handleTableSelect(t.id)}
                className={cn(
                  "group relative overflow-hidden rounded-xl border p-5 text-left transition-smooth",
                  !startSlot
                    ? "cursor-not-allowed border-border bg-card/30 opacity-50"
                    : !isAvailable
                      ? "cursor-not-allowed border-border bg-card/40 opacity-60"
                      : isSelected
                        ? "border-primary bg-primary/10 shadow-neon"
                        : "border-border bg-gradient-card hover:border-primary/60 hover:shadow-neon-sm",
                )}
              >
                {isSelected && (
                  <div className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" />
                  </div>
                )}
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-[10px] font-bold tracking-wider",
                      meta.chip,
                    )}
                  >
                    <Icon className="mr-1 inline size-3" />
                    {meta.label}
                  </span>
                  <span
                    className={cn(
                      "ml-auto flex items-center gap-1.5 text-[11px]",
                      isAvailable && startSlot ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        isAvailable && startSlot
                          ? "bg-primary animate-pulse"
                          : "bg-muted-foreground/50",
                      )}
                    />
                    {!startSlot ? "选时段" : isAvailable ? "可预订" : "已占用"}
                  </span>
                </div>
                <h3 className="mb-1 font-display text-lg font-semibold">{t.name}</h3>
                <p className="mb-3 line-clamp-1 text-xs text-muted-foreground">{t.description}</p>
                <div className="mb-3 flex flex-wrap gap-1">
                  {t.features.slice(0, 2).map((f) => (
                    <span
                      key={f}
                      className="rounded bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {f}
                    </span>
                  ))}
                </div>
                <div className="flex items-end justify-between border-t border-border/60 pt-3">
                  <div>
                    {isMember && (
                      <div className="text-[10px] text-muted-foreground line-through">
                        RM {t.pricePerHour}/h
                      </div>
                    )}
                    <div>
                      <span className="text-xl font-bold text-foreground">RM {price}</span>
                      <span className="ml-0.5 text-xs text-muted-foreground">/小时</span>
                    </div>
                  </div>
                  {isMember && (
                    <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold">
                      会员价
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Step>

      {/* Step 3 — 信息 + 提交 */}
      <Step number={3} title="确认预订信息">
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">姓名 *</Label>
                <Input id="name" name="name" placeholder="您的姓名" />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">手机号 *</Label>
                <Input id="phone" name="phone" placeholder="+60 12-345 6789" />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="guests">人数 *</Label>
              <Input id="guests" name="guests" type="number" min={1} max={8} defaultValue={2} />
              {errors.guests && <p className="text-xs text-destructive">{errors.guests}</p>}
            </div>
            <p className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
              💡 提交后我们将通过 SMS 短信发送预订确认。请准时到场，迟到 15
              分钟以上系统将自动释放球台。
            </p>
          </div>

          {/* 订单摘要 */}
          <div className="rounded-xl border border-border bg-gradient-card p-5">
            <h4 className="mb-4 font-display text-sm font-semibold tracking-widest text-primary">
              订单摘要
            </h4>
            <SummaryRow icon={CalendarIcon} label="日期">
              {format(date, "yyyy-MM-dd")}
            </SummaryRow>
            <SummaryRow icon={Clock} label="时段">
              {startSlot ? `${startSlot} · ${duration}h` : "未选择"}
            </SummaryRow>
            <SummaryRow icon={Sparkles} label="球台">
              {selectedTable ? `${selectedTable.name}` : "未选择"}
            </SummaryRow>
            <SummaryRow icon={Users} label="价格">
              {isMember ? "会员价" : "标准价"}
            </SummaryRow>
            <div className="my-4 border-t border-border/60" />
            <div className="flex items-end justify-between">
              <span className="text-sm text-muted-foreground">合计</span>
              <span className="font-display text-3xl font-bold text-gradient-neon">
                RM {totalPrice}
              </span>
            </div>
            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="mt-5 w-full"
              disabled={!selectedTable || !startSlot || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" /> 提交中...
                </>
              ) : (
                <>
                  确认预订 <ChevronRight />
                </>
              )}
            </Button>
            {(!selectedTable || !startSlot) && (
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                请完成时段与球台选择
              </p>
            )}
          </div>
        </form>
      </Step>
    </div>
  );
}

function Step({
  number,
  title,
  subtitle,
  children,
}: {
  number: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur md:p-8">
      <header className="mb-6 flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-full border border-primary/40 bg-primary/10 font-display text-sm font-bold text-primary">
          {number}
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold md:text-2xl">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Crown;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span className="font-medium text-foreground">{children}</span>
    </div>
  );
}
