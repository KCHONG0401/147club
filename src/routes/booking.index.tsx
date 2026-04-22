import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BookingFlow } from "@/components/BookingFlow";

export const Route = createFileRoute("/booking/")({
  head: () => ({
    meta: [
      { title: "球台预订 — 147 Snooker Club" },
      {
        name: "description",
        content:
          "在线预订 147 Snooker Club 专业斯诺克球台。8 张球台可选 · 实时可用状态 · 会员价优惠 · 即时确认。",
      },
      { property: "og:title", content: "球台预订 — 147 Snooker Club" },
      { property: "og:description", content: "在线预订 Johor Bahru 顶级斯诺克球台。" },
    ],
  }),
  component: BookingPage,
});

function BookingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-20 pt-28">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <header className="mb-10 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Online Booking · 即时预订
            </p>
            <h1 className="font-display text-3xl font-bold md:text-5xl">
              预订<span className="text-gradient-neon">专属球台</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
              选择日期、时段与球台 — 三步完成预订，立即获取专属二维码入场凭证
            </p>
          </header>
          <BookingFlow />
        </div>
      </main>
      <Footer />
    </div>
  );
}
