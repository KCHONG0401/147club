import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  ChevronRight,
  Crown,
  Flame,
  MapPin,
  Medal,
  Trophy,
  Users,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "赛事活动 — 147 Snooker Club" },
      {
        name: "description",
        content: "147 Snooker Club 业余赛、月度联赛、教练公开课与名人表演赛日程。",
      },
      { property: "og:title", content: "赛事活动 — 147 Snooker Club" },
      { property: "og:description", content: "JB 最热闹的斯诺克赛事社区 · 月赛 · 联赛 · 公开课。" },
    ],
  }),
  component: EventsPage,
});

const UPCOMING = [
  {
    id: "spring-open-2026",
    type: "公开赛",
    name: "147 春季公开赛 2026",
    date: "2026 年 5 月 10 日",
    time: "10:00 — 22:00",
    fee: "RM 80",
    prize: "RM 5,000",
    slots: "32 / 48",
    badge: "报名中",
    color: "primary",
    icon: Trophy,
    desc: "南马地区最大业余赛事，单淘汰赛制，冠军直通马来西亚业余总决赛。",
  },
  {
    id: "monthly-may",
    type: "月度联赛",
    name: "5 月 · 月度联赛",
    date: "每周三 19:00",
    time: "19:00 — 23:00",
    fee: "RM 30 / 场",
    prize: "RM 1,200",
    slots: "16 / 24",
    badge: "报名中",
    color: "primary",
    icon: Medal,
    desc: "积分循环赛制，4 周决出当月冠军，会员专享免报名费。",
  },
  {
    id: "ladies-cup",
    type: "女子赛",
    name: "Ladies Cup · 女子杯",
    date: "2026 年 5 月 25 日",
    time: "14:00 — 20:00",
    fee: "免费",
    prize: "RM 800",
    slots: "8 / 16",
    badge: "热门",
    color: "gold",
    icon: Crown,
    desc: "推动女子斯诺克社区发展，所有女性球友均可参加，提供专业陪练。",
  },
  {
    id: "pro-exhibition",
    type: "表演赛",
    name: "国手 vs. 会员表演赛",
    date: "2026 年 6 月 8 日",
    time: "20:00 — 22:30",
    fee: "免费观赛",
    prize: "—",
    slots: "—",
    badge: "明星嘉宾",
    color: "gold",
    icon: Flame,
    desc: "前马来西亚国手 Moh Keen Hoo 现场对决会员冠军，限量 80 名观众。",
  },
];

const PAST_CHAMPIONS = [
  { event: "2026 春季公开赛", winner: "Adrian Lee", score: "5-3" },
  { event: "4 月月度联赛", winner: "Tan Wei Jie", score: "12 胜 1 负" },
  { event: "2026 新年杯", winner: "Sarah Lim", score: "4-2" },
];

function EventsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-24 pt-28">
        <section className="mx-auto max-w-5xl px-4 text-center lg:px-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Events · 赛事日历
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
            来一场属于你的 <span className="text-gradient-neon">高光时刻</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm text-muted-foreground md:text-base">
            从月度联赛到国手表演赛，147 全年举办 30+
            场赛事——无论你是新手还是高手，都有属于自己的舞台
          </p>
        </section>

        <section className="mx-auto mt-16 max-w-6xl px-4 lg:px-8">
          <div className="grid gap-5 md:grid-cols-2">
            {UPCOMING.map((e) => {
              const Icon = e.icon;
              const accent =
                e.color === "gold"
                  ? "border-gold/40 hover:border-gold hover:shadow-gold-sm"
                  : "border-primary/30 hover:border-primary/70 hover:shadow-neon-sm";
              const chip =
                e.color === "gold" ? "bg-gold/20 text-gold" : "bg-primary/20 text-primary";
              return (
                <article
                  key={e.id}
                  className={`group relative overflow-hidden rounded-2xl border bg-gradient-card p-6 transition-smooth ${accent}`}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-12 items-center justify-center rounded-lg ${
                          e.color === "gold"
                            ? "border border-gold/40 bg-gold/10 text-gold"
                            : "border border-primary/40 bg-primary/10 text-primary"
                        }`}
                      >
                        <Icon className="size-6" />
                      </div>
                      <div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${chip}`}
                        >
                          {e.type}
                        </span>
                        <h3 className="mt-1.5 font-display text-xl font-bold leading-tight">
                          {e.name}
                        </h3>
                      </div>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                        e.color === "gold"
                          ? "border-gold/40 text-gold"
                          : "border-primary/40 text-primary"
                      }`}
                    >
                      {e.badge}
                    </span>
                  </div>

                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{e.desc}</p>

                  <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-4 text-xs">
                    <Info label="日期" value={e.date} />
                    <Info label="时间" value={e.time} />
                    <Info label="报名费" value={e.fee} />
                    <Info
                      label="奖金"
                      value={e.prize}
                      highlight={e.color === "gold" ? "gold" : "neon"}
                    />
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      <Users className="mr-1 inline size-3" />
                      报名 {e.slots}
                    </span>
                    <Button size="sm" variant={e.color === "gold" ? "gold" : "hero"}>
                      立即报名 <ChevronRight />
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto mt-20 max-w-4xl px-4 lg:px-8">
          <div className="rounded-2xl border border-border bg-gradient-card p-6 md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <Trophy className="size-6 text-gold" />
              <h2 className="font-display text-2xl font-bold">历届冠军榜</h2>
            </div>
            <div className="divide-y divide-border/60">
              {PAST_CHAMPIONS.map((c) => (
                <div key={c.event} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{c.event}</p>
                    <p className="text-xs text-muted-foreground">
                      <CalendarDays className="mr-1 inline size-3" /> 已结束
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-base font-bold text-gold">{c.winner}</p>
                    <p className="text-[11px] text-muted-foreground">{c.score}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-3xl px-4 text-center lg:px-8">
          <p className="text-sm text-muted-foreground">
            <MapPin className="mr-1 inline size-4 text-primary" /> 所有赛事均在 147 主会场举办 ·
            Jalan Tebrau, JB
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="hero" size="lg">
              <Link to="/booking">预订练习球台</Link>
            </Button>
            <Button asChild variant="neon" size="lg">
              <Link to="/membership">加入会员享免费参赛</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Info({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "neon" | "gold";
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p
        className={`mt-0.5 font-semibold ${
          highlight === "gold"
            ? "text-gold"
            : highlight === "neon"
              ? "text-primary"
              : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
