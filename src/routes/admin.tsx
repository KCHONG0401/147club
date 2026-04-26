import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Activity,
  Award,
  Clock,
  Crown,
  LayoutDashboard,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Sparkles,
  StopCircle,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TABLES, TIME_SLOTS } from "@/lib/snooker-tables";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { adminAdjustPoints } from "@/lib/booking-functions";
import { getLevel } from "@/lib/points";
import { saveSiteSetting, type SiteSetting } from "@/hooks/use-site-settings";
import { AdminAccountsPanel } from "@/components/AdminAccountsPanel";
import { PostsManager } from "@/components/PostsManager";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "管理后台 — 147 Snooker Club" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

interface BookingRow {
  id: string;
  booking_code: string;
  user_id: string | null;
  guest_name: string;
  guest_phone: string;
  table_id: string;
  table_type: string;
  booking_date: string;
  start_slot: string;
  end_slot: string;
  duration_minutes: number;
  total_price: number;
  status: "active" | "completed" | "cancelled";
  notes: string | null;
  points_awarded: number;
}

interface ProfileRow {
  id: string;
  account_id: string | null;
  name: string;
  phone: string | null;
  level: "bronze" | "silver" | "gold";
  points: number;
}

const TYPE_ICON = { Standard: Sparkles, Pro: Trophy, VIP: Crown } as const;

function AdminPage() {
  const { user, profile, isAdmin, loading: authLoading } = useAuth();
  const isSuperAdmin = profile?.account_id === "admin147";
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [members, setMembers] = useState<ProfileRow[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const nowSlot = useMemo(() => {
    const h = new Date().getHours();
    return `${String(h).padStart(2, "0")}:00`;
  }, []);

  // ---- Fetch data ----
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: b }, { data: m }, { data: s }] = await Promise.all([
        supabase.from("bookings").select("*").eq("booking_date", today).order("start_slot"),
        supabase
          .from("profiles")
          .select("id,account_id,name,phone,level,points")
          .order("created_at", { ascending: false }),
        supabase
          .from("site_settings")
          .select("key,value,category,label")
          .order("category")
          .order("key"),
      ]);
      if (!cancelled) {
        setBookings((b ?? []) as BookingRow[]);
        setMembers((m ?? []) as ProfileRow[]);
        setSiteSettings((s ?? []) as SiteSetting[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, today, refreshKey]);

  // ---- Realtime subscription ----
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("admin-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () =>
        setRefreshKey((k) => k + 1),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  // ---- Auth gate ----
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) {
    throw redirect({ to: "/login" });
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-md px-4 pt-32 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <LayoutDashboard className="size-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">权限不足</h1>
          <p className="mt-2 text-muted-foreground">该页面仅限管理员访问。</p>
          <Button asChild className="mt-6">
            <Link to="/">返回首页</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ---- Compute table real-time status ----
  const tableStatus = TABLES.map((t) => {
    const tableCode = t.code;
    const dayBookings = bookings.filter((b) => b.table_id === tableCode && b.status === "active");
    const current = dayBookings.find((b) => b.start_slot <= nowSlot && b.end_slot > nowSlot);
    const next = dayBookings
      .filter((b) => b.start_slot > nowSlot)
      .sort((a, b) => a.start_slot.localeCompare(b.start_slot))[0];
    return { table: t, current, next, all: dayBookings };
  });

  const occupiedCount = tableStatus.filter((s) => s.current).length;
  const todayRevenue = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + Number(b.total_price), 0);

  // ---- Actions ----
  async function extendBooking(b: BookingRow, addMinutes: number) {
    const idx = TIME_SLOTS.indexOf(b.end_slot as (typeof TIME_SLOTS)[number]);
    const newIdx = idx + Math.round(addMinutes / 60);
    if (idx < 0 || newIdx >= TIME_SLOTS.length) {
      toast.error("已达营业结束时间，无法延长");
      return;
    }
    const newEnd = TIME_SLOTS[newIdx];
    // Check conflict with next booking on same table
    const conflict = bookings.find(
      (other) =>
        other.id !== b.id &&
        other.table_id === b.table_id &&
        other.status === "active" &&
        other.start_slot < newEnd &&
        other.start_slot >= b.end_slot,
    );
    if (conflict) {
      toast.error(`与 ${conflict.start_slot} 的预订冲突，无法延长`);
      return;
    }
    const { error } = await supabase
      .from("bookings")
      .update({
        end_slot: newEnd,
        duration_minutes: b.duration_minutes + addMinutes,
      })
      .eq("id", b.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`已延长 ${addMinutes} 分钟`);
      setRefreshKey((k) => k + 1);
    }
  }

  async function endBooking(b: BookingRow) {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "completed" })
      .eq("id", b.id);
    if (error) toast.error(error.message);
    else {
      toast.success("已结束");
      setRefreshKey((k) => k + 1);
    }
  }

  async function cancelBooking(b: BookingRow) {
    if (!confirm(`确定取消 ${b.guest_name} 的预订？积分将被扣回。`)) return;
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", b.id);
    if (error) { toast.error(error.message); return; }

    if (b.user_id && b.points_awarded > 0) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", b.user_id)
        .maybeSingle();
      if (prof) {
        const newPoints = Math.max(0, prof.points - b.points_awarded);
        await supabase
          .from("profiles")
          .update({ points: newPoints, level: getLevel(newPoints) })
          .eq("id", b.user_id);
      }
    }
    toast.success("预订已取消，积分已扣回");
    setRefreshKey((k) => k + 1);
  }

  async function updateMember(m: ProfileRow, patch: Partial<ProfileRow>) {
    const { error } = await supabase.from("profiles").update(patch).eq("id", m.id);
    if (error) toast.error(error.message);
    else {
      toast.success("会员资料已更新");
      setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...patch } : x)));
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-24 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold">
              <LayoutDashboard className="size-3.5" /> Admin Dashboard
            </div>
            <h1 className="mt-3 text-3xl font-bold lg:text-4xl">运营看板</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {format(new Date(), "yyyy 年 M 月 d 日 EEEE", { locale: zhCN })} · 实时数据
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setRefreshKey((k) => k + 1)}>
            <RefreshCw className="mr-1 size-4" /> 刷新
          </Button>
        </div>

        {/* KPI cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={Activity}
            label="使用中球台"
            value={`${occupiedCount} / ${TABLES.length}`}
            accent="primary"
          />
          <KpiCard
            icon={Clock}
            label="今日预订数"
            value={String(bookings.length)}
            accent="primary"
          />
          <KpiCard
            icon={Award}
            label="今日营收"
            value={`RM ${todayRevenue.toFixed(0)}`}
            accent="gold"
          />
          <KpiCard icon={Users} label="注册会员" value={String(members.length)} accent="gold" />
        </div>

        {/* Tables real-time status */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold">球台实时状态</h2>
          {loading ? (
            <SkeletonGrid />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tableStatus.map(({ table, current, next }) => {
                const Icon = TYPE_ICON[table.type];
                const isOccupied = !!current;
                return (
                  <Card
                    key={table.id}
                    className={`relative overflow-hidden border p-5 transition-all ${
                      isOccupied
                        ? "border-destructive/40 bg-destructive/5"
                        : "border-primary/40 bg-primary/5"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex size-9 items-center justify-center rounded-lg ${
                            table.type === "VIP"
                              ? "bg-gold/20 text-gold"
                              : table.type === "Pro"
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <div className="font-bold">{table.name}</div>
                          <div className="text-[11px] text-muted-foreground">{table.code}</div>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          isOccupied
                            ? "bg-destructive/20 text-destructive"
                            : "bg-primary/20 text-primary"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            isOccupied ? "bg-destructive animate-pulse" : "bg-primary"
                          }`}
                        />
                        {isOccupied ? "使用中" : "空闲"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      {current ? (
                        <>
                          <div className="text-foreground">
                            <span className="text-muted-foreground">客人：</span>
                            <span className="font-medium">{current.guest_name}</span>
                          </div>
                          <div className="text-foreground">
                            <span className="text-muted-foreground">时段：</span>
                            <span className="font-mono">
                              {current.start_slot} → {current.end_slot}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => extendBooking(current, 30)}
                            >
                              <Plus className="mr-0.5 size-3" /> 30 分
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => extendBooking(current, 60)}
                            >
                              <Plus className="mr-0.5 size-3" /> 60 分
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 px-2 text-xs"
                              onClick={() => endBooking(current)}
                            >
                              <StopCircle className="mr-0.5 size-3" /> 结束
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                              onClick={() => cancelBooking(current)}
                            >
                              取消
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-muted-foreground">当前无人使用</div>
                      )}
                      {next && (
                        <div className="mt-2 rounded-md border border-border/60 bg-muted/30 p-2 text-xs">
                          <div className="text-muted-foreground">下一场</div>
                          <div className="mt-0.5 font-mono text-foreground">
                            {next.start_slot} · {next.guest_name}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Today's bookings timeline */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold">今日预订时间轴</h2>
          <Card className="overflow-hidden border-border/60">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">订单号</th>
                    <th className="px-4 py-3 text-left">球台</th>
                    <th className="px-4 py-3 text-left">时段</th>
                    <th className="px-4 py-3 text-left">客人</th>
                    <th className="px-4 py-3 text-right">价格</th>
                    <th className="px-4 py-3 text-center">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        今日暂无预订
                      </td>
                    </tr>
                  ) : (
                    bookings.map((b) => (
                      <tr key={b.id} className="border-b border-border/40 last:border-0">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {b.booking_code}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">{b.table_id}</span>
                          <span className="ml-1 text-xs text-muted-foreground">{b.table_type}</span>
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {b.start_slot} → {b.end_slot}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{b.guest_name}</div>
                          <div className="text-xs text-muted-foreground">{b.guest_phone}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-primary">
                          RM {Number(b.total_price).toFixed(0)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Badge
                              variant={b.status === "active" ? "default" : "secondary"}
                              className={
                                b.status === "active"
                                  ? "bg-primary/20 text-primary"
                                  : b.status === "completed"
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-destructive/20 text-destructive"
                              }
                            >
                              {b.status === "active" ? "进行中" : b.status === "completed" ? "已完成" : "已取消"}
                            </Badge>
                            {b.status === "active" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-[11px] text-destructive hover:bg-destructive/10"
                                onClick={() => cancelBooking(b)}
                              >
                                取消
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* Members management */}
        <section>
          <h2 className="mb-4 text-xl font-bold">会员管理</h2>
          <Card className="overflow-hidden border-border/60">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">账号 ID</th>
                    <th className="px-4 py-3 text-left">姓名</th>
                    <th className="px-4 py-3 text-left">手机</th>
                    <th className="px-4 py-3 text-left">等级</th>
                    <th className="px-4 py-3 text-left">积分</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                        暂无会员
                      </td>
                    </tr>
                  ) : (
                    members.map((m) => (
                      <tr key={m.id} className="border-b border-border/40 last:border-0">
                        <td className="px-4 py-3 font-mono text-xs text-primary">
                          {m.account_id || "—"}
                        </td>
                        <td className="px-4 py-3 font-medium">{m.name || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{m.phone || "—"}</td>
                        <td className="px-4 py-3">
                          <Select
                            value={m.level}
                            onValueChange={(v) =>
                              updateMember(m, { level: v as ProfileRow["level"] })
                            }
                          >
                            <SelectTrigger className="h-8 w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bronze">Bronze</SelectItem>
                              <SelectItem value="silver">Silver</SelectItem>
                              <SelectItem value="gold">Gold</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          <PointsEditor
                            member={m}
                            onSave={(pts) => updateMember(m, { points: pts })}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* Site settings editor */}
        <section className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <Settings className="size-5 text-gold" />
            <h2 className="text-xl font-bold">网站信息</h2>
            <span className="text-xs text-muted-foreground">修改后实时同步到所有页面</span>
          </div>
          <SiteSettingsEditor settings={siteSettings} onUpdate={(next) => setSiteSettings(next)} />
        </section>

        {/* 积分管理 */}
        <MemberPointsPanel />

        <PostsManager />

        {isSuperAdmin && <AdminAccountsPanel />}
      </main>

      <Footer />
    </div>
  );
}

function MemberPointsPanel() {
  const [accountId, setAccountId] = useState("");
  const [found, setFound] = useState<ProfileRow | null>(null);
  const [searching, setSearching] = useState(false);
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!accountId.trim()) return;
    setSearching(true);
    setFound(null);
    const { data } = await supabase
      .from("profiles")
      .select("id,account_id,name,phone,level,points")
      .eq("account_id", accountId.toLowerCase().trim())
      .maybeSingle();
    setFound(data as ProfileRow | null);
    if (!data) toast.error("找不到该账号 ID");
    setSearching(false);
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!found) return;
    const pts = parseInt(delta, 10);
    if (isNaN(pts) || pts === 0) { toast.error("请输入有效积分数字"); return; }
    setSaving(true);
    try {
      const result = await adminAdjustPoints({ data: { profileId: found.id, delta: pts } });
      toast.success(`已${pts > 0 ? "增加" : "扣除"} ${Math.abs(pts)} 积分${note ? `（${note}）` : ""}`);
      setFound({ ...found, points: result.points, level: result.level });
      setDelta("");
      setNote("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "积分更新失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <Award className="size-5 text-primary" />
        <h2 className="text-xl font-bold">积分管理</h2>
        <span className="text-xs text-muted-foreground">按账号 ID 查找会员并手动调整积分</span>
      </div>
      <Card className="border-border/60 p-5">
        <form onSubmit={handleSearch} className="flex gap-3">
          <Input
            placeholder="输入账号 ID，例如 soon121"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="max-w-xs"
          />
          <Button type="submit" variant="outline" disabled={searching}>
            {searching ? <Loader2 className="size-4 animate-spin" /> : "搜索"}
          </Button>
        </form>

        {found && (
          <div className="mt-5 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground">账号 ID</p>
                <p className="font-mono font-semibold text-primary">{found.account_id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">姓名</p>
                <p className="font-medium">{found.name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">等级</p>
                <p className="font-semibold uppercase">{found.level}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">当前积分</p>
                <p className="text-2xl font-bold text-primary">{found.points}</p>
              </div>
            </div>
            <form onSubmit={handleAdjust} className="flex flex-wrap gap-3">
              <div className="space-y-1">
                <Label className="text-xs">积分变动（正数加，负数扣）</Label>
                <Input
                  type="number"
                  placeholder="例 +50 或 -20"
                  value={delta}
                  onChange={(e) => setDelta(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs">备注（选填）</Label>
                <Input
                  placeholder="例：等候补偿、生日礼遇"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
                  确认调整
                </Button>
              </div>
            </form>
          </div>
        )}
      </Card>
    </section>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  accent: "primary" | "gold";
}) {
  return (
    <Card
      className={`border p-5 ${
        accent === "gold" ? "border-gold/30 bg-gold/5" : "border-primary/30 bg-primary/5"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex size-10 items-center justify-center rounded-lg ${
            accent === "gold" ? "bg-gold/20 text-gold" : "bg-primary/20 text-primary"
          }`}
        >
          <Icon className="size-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </div>
    </Card>
  );
}

function PointsEditor({ member, onSave }: { member: ProfileRow; onSave: (pts: number) => void }) {
  const [val, setVal] = useState(String(member.points));
  const dirty = val !== String(member.points);
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="h-8 w-24"
      />
      {dirty && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs"
          onClick={() => {
            const n = Math.max(0, Math.floor(Number(val) || 0));
            onSave(n);
            setVal(String(n));
          }}
        >
          保存
        </Button>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-44 animate-pulse rounded-lg border border-border/40 bg-card/40" />
      ))}
    </div>
  );
}

// 网站设置编辑器：按 category 分组，多行/单行自适应
const CATEGORY_LABEL: Record<string, string> = {
  contact: "联系方式",
  about: "关于我们",
  home: "首页",
  pricing: "价格",
  general: "其他",
};
const LONG_TEXT_KEYS = new Set(["about_story", "about_mission", "about_tagline"]);

function SiteSettingsEditor({
  settings,
  onUpdate,
}: {
  settings: SiteSetting[];
  onUpdate: (next: SiteSetting[]) => void;
}) {
  const grouped = useMemo(() => {
    const map: Record<string, SiteSetting[]> = {};
    for (const s of settings) {
      (map[s.category] ??= []).push(s);
    }
    return map;
  }, [settings]);

  if (settings.length === 0) {
    return <Card className="p-8 text-center text-muted-foreground">暂无可编辑项</Card>;
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([cat, items]) => (
        <Card key={cat} className="border-border/60 p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
            {CATEGORY_LABEL[cat] ?? cat}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((s) => (
              <SettingField
                key={s.key}
                setting={s}
                long={LONG_TEXT_KEYS.has(s.key)}
                onSaved={(v) =>
                  onUpdate(settings.map((x) => (x.key === s.key ? { ...x, value: v } : x)))
                }
              />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function SettingField({
  setting,
  long,
  onSaved,
}: {
  setting: SiteSetting;
  long: boolean;
  onSaved: (value: string) => void;
}) {
  const [val, setVal] = useState(setting.value);
  const [saving, setSaving] = useState(false);
  const dirty = val !== setting.value;

  async function save() {
    setSaving(true);
    try {
      await saveSiteSetting(setting.key, val);
      onSaved(val);
      toast.success(`已保存：${setting.label}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={long ? "sm:col-span-2 space-y-2" : "space-y-2"}>
      <Label className="text-xs">
        {setting.label}
        <span className="ml-2 font-mono text-[10px] text-muted-foreground">{setting.key}</span>
      </Label>
      {long ? (
        <Textarea
          value={val}
          onChange={(e) => setVal(e.target.value)}
          rows={4}
          className="resize-y"
        />
      ) : (
        <Input value={val} onChange={(e) => setVal(e.target.value)} />
      )}
      {dirty && (
        <Button size="sm" variant="outline" onClick={save} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-1 size-3 animate-spin" />
          ) : (
            <Save className="mr-1 size-3" />
          )}
          保存
        </Button>
      )}
    </div>
  );
}
