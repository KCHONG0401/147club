import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronRight, Crown, Sparkles, Star, Trophy, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/membership")({
  head: () => ({
    meta: [
      { title: "会员方案 — 147 Snooker Club" },
      {
        name: "description",
        content:
          "147 Snooker Club 三档会员卡：Bronze / Silver / Gold，享专属球台优惠、免费参赛、教练课程折扣。",
      },
      { property: "og:title", content: "会员方案 — 147 Snooker Club" },
      {
        property: "og:description",
        content: "三档会员卡 · 球台 7-8 折 · 免费参赛 · VIP 专属包厢。",
      },
    ],
  }),
  component: MembershipPage,
});

const TIERS = [
  {
    id: "bronze",
    name: "Bronze",
    title: "青铜会员",
    price: 99,
    period: "/ 年",
    desc: "新手入门首选，开启你的 147 之旅",
    icon: Star,
    color: "muted",
    accent: "border-border hover:border-primary/40",
    button: "neon" as const,
    features: [
      { ok: true, text: "球台 9 折预订" },
      { ok: true, text: "积分制（1 RM = 1 分）" },
      { ok: true, text: "生日免费 2 小时球台" },
      { ok: true, text: "月度联赛 5 折报名" },
      { ok: false, text: "VIP 包厢使用" },
      { ok: false, text: "教练 1 对 1 课程" },
      { ok: false, text: "通宵延时服务" },
    ],
  },
  {
    id: "silver",
    name: "Silver",
    title: "白银会员",
    price: 299,
    period: "/ 年",
    desc: "活跃球友首选，性价比之王",
    icon: Trophy,
    color: "primary",
    accent: "border-primary shadow-neon",
    button: "hero" as const,
    badge: "MOST POPULAR",
    features: [
      { ok: true, text: "球台 8 折预订" },
      { ok: true, text: "积分双倍（1 RM = 2 分）" },
      { ok: true, text: "生日免费 4 小时球台" },
      { ok: true, text: "月度联赛免费报名" },
      { ok: true, text: "VIP 包厢享 9 折" },
      { ok: true, text: "教练课程 8 折" },
      { ok: false, text: "通宵延时服务" },
    ],
  },
  {
    id: "gold",
    name: "Gold",
    title: "黄金会员",
    price: 899,
    period: "/ 年",
    desc: "顶级体验，专属管家级服务",
    icon: Crown,
    color: "gold",
    accent: "border-gold/60 shadow-gold-sm",
    button: "gold" as const,
    badge: "VIP",
    features: [
      { ok: true, text: "球台 7 折预订" },
      { ok: true, text: "积分三倍 + 兑换豪礼" },
      { ok: true, text: "生日免费 VIP 包厢 4h" },
      { ok: true, text: "所有赛事免费 + 优先报名" },
      { ok: true, text: "VIP 包厢免费使用" },
      { ok: true, text: "每月 2 节 1 对 1 课程" },
      { ok: true, text: "通宵延时无限次" },
    ],
  },
];

const FAQ = [
  { q: "会员卡可以转赠他人吗？", a: "不可以。会员卡为实名制，仅限本人使用。" },
  { q: "积分如何使用？", a: "积分可在前台兑换饮品、训练时长或周边商品，每 100 分 = RM 1 折抵。" },
  { q: "可以中途升级吗？", a: "可以。补差价即可升级，新等级权益从升级当日生效。" },
];

function MembershipPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-24 pt-28">
        <section className="mx-auto max-w-4xl px-4 text-center lg:px-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Membership · 会员特权
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
            选择属于你的 <span className="text-gradient-neon">147 等级</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm text-muted-foreground md:text-base">
            三档会员，覆盖从新手到资深玩家的全部需求 · 一年内回本无压力
          </p>
        </section>

        <section className="mx-auto mt-14 max-w-6xl px-4 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {TIERS.map((t) => {
              const Icon = t.icon;
              return (
                <article
                  key={t.id}
                  className={`relative flex flex-col rounded-2xl border bg-gradient-card p-6 transition-smooth md:p-8 ${t.accent}`}
                >
                  {t.badge && (
                    <span
                      className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider ${
                        t.color === "gold"
                          ? "bg-gold text-background"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {t.badge}
                    </span>
                  )}

                  <div
                    className={`mb-4 inline-flex size-14 items-center justify-center rounded-xl ${
                      t.color === "gold"
                        ? "border border-gold/40 bg-gold/10 text-gold"
                        : t.color === "primary"
                          ? "border border-primary/40 bg-primary/10 text-primary"
                          : "border border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-7" />
                  </div>

                  <h2 className="font-display text-2xl font-bold">{t.title}</h2>
                  <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                    {t.name} Membership
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">{t.desc}</p>

                  <div className="mt-5 flex items-end gap-1 border-b border-border/60 pb-5">
                    <span className="text-sm text-muted-foreground">RM</span>
                    <span
                      className={`font-display text-5xl font-bold leading-none ${
                        t.color === "gold"
                          ? "text-gold"
                          : t.color === "primary"
                            ? "text-gradient-neon"
                            : "text-foreground"
                      }`}
                    >
                      {t.price}
                    </span>
                    <span className="text-sm text-muted-foreground">{t.period}</span>
                  </div>

                  <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                    {t.features.map((f) => (
                      <li
                        key={f.text}
                        className={`flex items-start gap-2 ${
                          f.ok ? "text-foreground" : "text-muted-foreground/50 line-through"
                        }`}
                      >
                        {f.ok ? (
                          <Check
                            className={`mt-0.5 size-4 shrink-0 ${
                              t.color === "gold" ? "text-gold" : "text-primary"
                            }`}
                          />
                        ) : (
                          <X className="mt-0.5 size-4 shrink-0 text-muted-foreground/40" />
                        )}
                        <span>{f.text}</span>
                      </li>
                    ))}
                  </ul>

                  <Button asChild variant={t.button} size="lg" className="mt-6 w-full">
                    <Link to="/register">
                      立即开通 <ChevronRight />
                    </Link>
                  </Button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto mt-20 max-w-4xl px-4 lg:px-8">
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 md:p-8">
            <div className="flex items-center gap-3">
              <Sparkles className="size-6 text-primary" />
              <h2 className="font-display text-2xl font-bold">为什么选择 147 会员？</h2>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {[
                { num: "30%+", label: "球台预订平均省" },
                { num: "12 场", label: "免费赛事 / 年" },
                { num: "2-3 个月", label: "平均回本周期" },
              ].map((v) => (
                <div
                  key={v.label}
                  className="rounded-xl border border-border bg-card/50 p-4 text-center"
                >
                  <div className="font-display text-3xl font-bold text-gradient-neon">{v.num}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{v.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-20 max-w-3xl px-4 lg:px-8">
          <h2 className="mb-6 text-center font-display text-2xl font-bold md:text-3xl">
            常见<span className="text-primary">问题</span>
          </h2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-border bg-gradient-card p-5 transition-smooth open:border-primary/40"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium marker:hidden">
                  {f.q}
                  <ChevronRight className="size-4 text-primary transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
