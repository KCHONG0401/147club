import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarIcon, Clock, Crown, Edit2, Phone, Save, Sparkles, Star, Trophy, User, X } from "lucide-react";
import { toast } from "sonner";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { nextLevelInfo, LEVEL_THRESHOLDS } from "@/lib/points";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "我的账号 — 147 Snooker Club" }] }),
  component: AccountPage,
});

interface BookingRecord {
  id: string;
  booking_code: string;
  table_id: string;
  table_type: string;
  booking_date: string;
  start_slot: string;
  end_slot: string;
  duration_minutes: number;
  total_price: number;
  status: "active" | "completed" | "cancelled";
  points_awarded: number;
  created_at: string;
}

const LEVEL_ICON = { bronze: Star, silver: Trophy, gold: Crown } as const;
const LEVEL_COLOR = { bronze: "text-amber-600", silver: "text-slate-400", gold: "text-gold" } as const;
const STATUS_LABEL = { active: "进行中", completed: "已完成", cancelled: "已取消" } as const;
const STATUS_CLASS = {
  active: "bg-primary/20 text-primary",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/20 text-destructive",
} as const;

function AccountPage() {
  const { user, profile, isAdmin, loading, refreshProfile } = useAuth();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("bookings")
      .select("id,booking_code,table_id,table_type,booking_date,start_slot,end_slot,duration_minutes,total_price,status,points_awarded,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setBookings((data ?? []) as BookingRecord[]);
        setLoadingBookings(false);
      });
  }, [user]);

  if (loading) return null;
  if (!user) throw redirect({ to: "/login" });

  async function handleSave() {
    if (!name.trim()) { toast.error("姓名不能为空"); return; }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim(), phone: phone.trim() || null })
      .eq("id", user!.id);
    if (error) { toast.error(error.message); setSaving(false); return; }
    await refreshProfile();
    toast.success("资料已更新");
    setEditing(false);
    setSaving(false);
  }

  const next = profile ? nextLevelInfo(profile.level, profile.points) : null;
  const LevelIcon = profile ? LEVEL_ICON[profile.level] : Star;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-24 pt-28 lg:px-8">
        <h1 className="mb-8 font-display text-2xl font-bold">我的账号</h1>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          {/* 左栏：个人资料 + 预订记录 */}
          <div className="space-y-6">

            {/* 个人资料卡 */}
            <Card className="border-border/60 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">个人资料</h2>
                {!editing ? (
                  <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                    <Edit2 className="mr-1 size-3.5" /> 编辑
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setName(profile?.name ?? ""); setPhone(profile?.phone ?? ""); }}>
                      <X className="size-3.5" />
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      <Save className="mr-1 size-3.5" /> 保存
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1"><User className="size-3" /> 账号 ID</Label>
                  <p className="font-mono text-sm font-semibold text-primary">{profile?.account_id || "—"}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">姓名</Label>
                  {editing ? (
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
                  ) : (
                    <p className="text-sm">{profile?.name || "—"}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="size-3" /> 手机号</Label>
                  {editing ? (
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+60 12-345 6789" className="h-8 text-sm" />
                  ) : (
                    <p className="text-sm">{profile?.phone || "未填写"}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* 预订记录 */}
            <Card className="border-border/60 overflow-hidden">
              <div className="border-b border-border/60 px-5 py-4">
                <h2 className="font-semibold">预订记录</h2>
              </div>
              {loadingBookings ? (
                <div className="p-8 text-center text-muted-foreground text-sm">加载中...</div>
              ) : bookings.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground text-sm">还没有预订记录</p>
                  <Button asChild variant="neon" size="sm" className="mt-4">
                    <Link to="/booking">立即预订</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {bookings.map((b) => (
                    <div key={b.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-muted-foreground">{b.booking_code}</span>
                          <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_CLASS[b.status]}`}>
                            {STATUS_LABEL[b.status]}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{b.table_id} · {b.table_type}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="size-3" />
                            {format(new Date(b.booking_date + "T00:00:00"), "MM月dd日 EEEE", { locale: zhCN })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {b.start_slot} · {b.duration_minutes / 60}h
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">RM {Number(b.total_price).toFixed(0)}</p>
                        {b.points_awarded > 0 && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-0.5 justify-end mt-0.5">
                            <Star className="size-3 fill-primary text-primary" /> +{b.points_awarded} 分
                          </p>
                        )}
                        {b.status === "cancelled" && b.points_awarded > 0 && (
                          <p className="text-[11px] text-destructive/70">-{b.points_awarded} 分（已扣）</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* 右栏：积分 + 等级 */}
          {!isAdmin && profile && (
            <div className="space-y-4">
              <Card className="border-primary/30 bg-gradient-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <LevelIcon className={`size-5 ${LEVEL_COLOR[profile.level]}`} />
                  <span className="font-bold uppercase">{profile.level}</span>
                </div>
                <p className="text-xs text-muted-foreground">当前积分</p>
                <p className="font-display text-4xl font-bold text-gradient-neon">{profile.points}</p>

                {next ? (
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>距 {next.label}</span>
                      <span>{next.needed} 分</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted/50">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${next.progress}%` }} />
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-xs font-semibold text-gold">🏆 最高等级</p>
                )}

                <div className="mt-4 space-y-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1"><Star className="size-3" /> Silver 门槛</span>
                    <span>{LEVEL_THRESHOLDS.silver} 分</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1"><Crown className="size-3" /> Gold 门槛</span>
                    <span>{LEVEL_THRESHOLDS.gold} 分</span>
                  </div>
                </div>
              </Card>

              <Card className="border-border/60 p-4 text-xs text-muted-foreground space-y-1.5">
                <p className="font-semibold text-foreground text-sm mb-2">积分倍率</p>
                <div className="flex justify-between"><span>🥉 Bronze</span><span>×1（1 RM = 1 分）</span></div>
                <div className="flex justify-between"><span>🥈 Silver</span><span>×2（1 RM = 2 分）</span></div>
                <div className="flex justify-between"><span>🥇 Gold</span><span>×3（1 RM = 3 分）</span></div>
                <p className="pt-2 border-t border-border/40">积分可兑换饮品、零食等，每 100 分 = RM 1</p>
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
