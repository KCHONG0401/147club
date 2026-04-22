import { createFileRoute } from "@tanstack/react-router";
import {
  Award,
  Building2,
  Coffee,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Wifi,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useSiteSettings } from "@/hooks/use-site-settings";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "关于我们 — 147 Snooker Club" },
      {
        name: "description",
        content:
          "147 Snooker Club 是 Johor Bahru 顶级斯诺克俱乐部，拥有 6 张赛事级球台、专业教练团队与全天候服务。",
      },
      { property: "og:title", content: "关于我们 — 147 Snooker Club" },
      {
        property: "og:description",
        content: "Johor Bahru 顶级斯诺克会所 · 6 张赛事级球台 · 专业教练团队。",
      },
    ],
  }),
  component: AboutPage,
});

const FACILITIES = [
  { icon: Trophy, title: "赛事级球台", desc: "Strachan 6811 Tournament 台呢，世锦赛同款规格" },
  { icon: Lightbulb, title: "专业灯光", desc: "无影锦标赛级照明系统，零反光、零阴影" },
  { icon: Coffee, title: "精品酒水", desc: "现磨咖啡、单一麦芽威士忌、健康轻食" },
  { icon: Wifi, title: "高速 Wi-Fi", desc: "千兆光纤覆盖全场，会议直播无压力" },
  { icon: ShieldCheck, title: "VIP 包厢", desc: "独立私密空间，专属服务员 1 对 1 服务" },
  { icon: Building2, title: "通宵营业", desc: "12:00 — 02:00，会员可申请通宵延时" },
];

const COACHES = [
  {
    name: "Adrian Tan",
    title: "总教练 · WPBSA 认证",
    badge: "147 满杆 ×3",
    bio: "前马来西亚国手，14 年职业经验，擅长基础动作矫正与心理博弈训练。",
  },
  {
    name: "李 Wei Ming",
    title: "技术教练 · 国家二级",
    badge: "最高单杆 142",
    bio: "青少年组别冠军教练，曾带领新秀斩获东南亚杯季军。",
  },
  {
    name: "Sarah Chen",
    title: "女子组教练",
    badge: "全国女子前 8",
    bio: "专攻女子学员发力技巧与赛事策略，推动 JB 女子斯诺克社区发展。",
  },
];

function AboutPage() {
  const { get } = useSiteSettings();
  const tagline = get(
    "about_tagline",
    "147 Snooker Club 创立于 2018 年，坐落于 Johor Bahru 市中心。我们以世锦赛级标准打造每一张球台、训练每一位教练。",
  );
  const story = get(
    "about_story",
    "147 Snooker Club 创立于 2018 年，致力于为斯诺克爱好者提供专业级的对局环境与赛事级球台。",
  );
  const mission = get("about_mission", "");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-24 pt-28">
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 lg:px-8">
          <div className="text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              About · 关于 147
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
              一杆完美 <span className="text-gradient-neon">147</span>
              <br />
              是我们对极致的承诺
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {tagline}
            </p>
          </div>

          {/* 数据条 */}
          <div className="mt-12 grid grid-cols-2 gap-4 rounded-2xl border border-border bg-gradient-card p-6 md:grid-cols-4 md:p-8">
            {[
              { num: "6", label: "赛事级球台" },
              { num: "12,000+", label: "注册会员" },
              { num: "8 年", label: "运营经验" },
              { num: "147", label: "已诞生满杆数" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-3xl font-bold text-gradient-neon md:text-5xl">
                  {s.num}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground md:text-xs">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 故事 */}
        <section className="mx-auto mt-24 max-w-5xl px-4 lg:px-8">
          <div className="grid gap-8 md:grid-cols-[1fr_2fr] md:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-widest text-primary">
                <Target className="size-3" /> Our Story
              </div>
              <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
                我们的<span className="text-primary">故事</span>
              </h2>
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              {story
                .split(/\n+/)
                .filter(Boolean)
                .map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              {mission && (
                <p className="border-l-2 border-primary/60 pl-4 italic text-foreground">
                  {mission}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 设施 */}
        <section className="mx-auto mt-24 max-w-6xl px-4 lg:px-8">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-widest text-primary">
              <Sparkles className="size-3" /> Facilities
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
              顶级<span className="text-gradient-neon">设施</span>
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FACILITIES.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-border bg-gradient-card p-6 transition-smooth hover:border-primary/60 hover:shadow-neon-sm"
              >
                <div className="mb-4 inline-flex size-12 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary transition-smooth group-hover:scale-110">
                  <f.icon className="size-6" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 教练团队 */}
        <section className="mx-auto mt-24 max-w-6xl px-4 lg:px-8">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[10px] uppercase tracking-widest text-gold">
              <Users className="size-3" /> Coaches
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
              冠军<span className="text-gold">教练团</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              三位 WPBSA 认证教练，从动作矫正到心理博弈，全方位陪伴你成长
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {COACHES.map((c) => (
              <div
                key={c.name}
                className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-card p-6 transition-smooth hover:border-gold/60 hover:shadow-gold-sm"
              >
                <div className="mb-5 flex size-20 items-center justify-center rounded-full border-2 border-gold/40 bg-gold/10">
                  <Award className="size-10 text-gold" />
                </div>
                <h3 className="font-display text-xl font-bold">{c.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-widest text-primary">{c.title}</p>
                <span className="mt-3 inline-block rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-bold text-gold">
                  {c.badge}
                </span>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{c.bio}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
