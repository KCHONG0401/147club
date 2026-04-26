import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  ArrowLeft,
  CalendarIcon,
  Check,
  Clock,
  Crown,
  Hash,
  Phone,
  Sparkles,
  Trophy,
  User as UserIcon,
  Users,
} from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { getBooking } from "@/lib/booking-store";
import type { BookingDraft } from "@/lib/snooker-tables";
import { useAuth } from "@/contexts/AuthContext";

const searchSchema = z.object({
  id: z.string().min(1),
});

export const Route = createFileRoute("/booking/confirm")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "预订成功 — 147 Snooker Club" },
      { name: "description", content: "您的 147 Snooker Club 预订已确认。" },
    ],
  }),
  component: ConfirmPage,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-3xl font-bold">预订未找到</h1>
        <p className="mt-2 text-sm text-muted-foreground">该预订记录不存在或已过期，请重新预订。</p>
        <Button asChild variant="hero" className="mt-6">
          <Link to="/booking">返回预订</Link>
        </Button>
      </main>
      <Footer />
    </div>
  ),
});

function ConfirmPage() {
  const { id } = Route.useSearch();
  const [booking, setBooking] = useState<BookingDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const { refreshProfile } = useAuth();

  useEffect(() => {
    const b = getBooking(id);
    setBooking(b);
    setLoading(false);
    refreshProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="flex min-h-[60vh] items-center justify-center">
          <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </main>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
          <h1 className="font-display text-3xl font-bold">预订未找到</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            该预订记录不存在或已过期，请重新预订。
          </p>
          <Button asChild variant="hero" className="mt-6">
            <Link to="/booking">返回预订</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const typeMeta = {
    Standard: { icon: Sparkles, color: "text-muted-foreground" },
    Pro: { icon: Trophy, color: "text-primary" },
    VIP: { icon: Crown, color: "text-gold" },
  }[booking.tableType];
  const TypeIcon = typeMeta.icon;

  // 二维码 payload
  const qrPayload = JSON.stringify({
    bookingId: booking.bookingId,
    table: booking.tableCode,
    date: booking.date,
    time: booking.startSlot,
    duration: booking.duration,
  });

  const dateObj = new Date(booking.date + "T00:00:00");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-20 pt-28">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          {/* 成功状态 */}
          <div className="mb-8 text-center animate-float-up">
            <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full border-2 border-primary bg-primary/10 shadow-neon">
              <Check className="size-10 text-primary" strokeWidth={3} />
            </div>
            <h1 className="font-display text-3xl font-bold md:text-4xl">
              预订<span className="text-gradient-neon">成功</span>!
            </h1>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              确认短信已发送至 {booking.customerPhone}，请准时到场
            </p>
          </div>

          {/* 票券卡 */}
          <div
            className="overflow-hidden rounded-2xl border border-primary/40 bg-gradient-card shadow-neon-sm animate-float-up"
            style={{ animationDelay: "0.1s" }}
          >
            {/* 顶部 */}
            <div className="flex items-center justify-between border-b border-border/60 bg-card/60 px-6 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Booking ID
                </p>
                <p className="font-mono text-sm font-semibold text-primary">{booking.bookingId}</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                已确认
              </div>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:gap-8">
              {/* 详情 */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                    <TypeIcon className={`size-3 ${typeMeta.color}`} /> {booking.tableType}
                  </div>
                  <h2 className="mt-1 font-display text-2xl font-bold">{booking.tableName}</h2>
                  <p className="text-xs text-muted-foreground">球台编号 · {booking.tableCode}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-dashed border-border/60 pt-4">
                  <Field icon={CalendarIcon} label="日期">
                    {format(dateObj, "MM月dd日 EEEE", { locale: zhCN })}
                  </Field>
                  <Field icon={Clock} label="时段">
                    {booking.startSlot} · {booking.duration}h
                  </Field>
                  <Field icon={UserIcon} label="预订人">
                    {booking.customerName}
                  </Field>
                  <Field icon={Phone} label="联系电话">
                    {booking.customerPhone}
                  </Field>
                  <Field icon={Users} label="人数">
                    {booking.guests} 人
                  </Field>
                  <Field icon={Hash} label="价格类型">
                    {booking.isMember ? "会员价" : "标准价"}
                  </Field>
                </div>

                <div className="flex items-end justify-between border-t border-dashed border-border/60 pt-4">
                  <span className="text-sm text-muted-foreground">应付金额</span>
                  <div className="text-right">
                    <span className="font-display text-3xl font-bold text-gradient-neon">
                      RM {booking.totalPrice}
                    </span>
                    <p className="text-[10px] text-muted-foreground">到店支付</p>
                  </div>
                </div>
              </div>

              {/* 二维码 */}
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-white p-4 md:w-[200px]">
                <QRCodeSVG
                  value={qrPayload}
                  size={160}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#0a1410"
                  marginSize={1}
                />
                <p className="text-center text-[10px] font-medium text-neutral-700">
                  到店出示此二维码核销
                </p>
              </div>
            </div>
          </div>

          {/* 操作 */}
          <div
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row animate-float-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Button asChild variant="neon" size="lg">
              <Link to="/booking">
                <ArrowLeft /> 继续预订
              </Link>
            </Button>
            <Button asChild variant="hero" size="lg">
              <Link to="/membership">查看我的预订</Link>
            </Button>
          </div>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            如需取消或修改预订，请提前 2 小时联系{" "}
            <span className="text-primary">+60 7-147 1470</span>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Crown;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <p className="mt-1 text-sm font-medium text-foreground">{children}</p>
    </div>
  );
}
