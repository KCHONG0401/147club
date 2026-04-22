import { Link } from "@tanstack/react-router";
import { Check, Clock, Crown, Trophy, Users } from "lucide-react";
import { Button } from "./ui/button";
import { useLang } from "@/contexts/LanguageContext";

export function FeaturedSection() {
  const { t } = useLang();
  const tables = [
    { id: 1, name: t("feat.tbl1"), type: "VIP", available: true, price: 80 },
    { id: 2, name: t("feat.tbl2"), type: "Pro", available: true, price: 50 },
    { id: 3, name: t("feat.tbl3"), type: "Pro", available: false, price: 50 },
    { id: 4, name: t("feat.tbl4"), type: "Standard", available: true, price: 35 },
  ];

  const benefits = [
    { icon: Crown, title: t("feat.b1.title"), desc: t("feat.b1.desc"), highlight: t("feat.b1.hl") },
    {
      icon: Trophy,
      title: t("feat.b2.title"),
      desc: t("feat.b2.desc"),
      highlight: t("feat.b2.hl"),
    },
    { icon: Users, title: t("feat.b3.title"), desc: t("feat.b3.desc"), highlight: t("feat.b3.hl") },
  ];

  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-20">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                {t("feat.todayKicker")}
              </p>
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                {t("feat.todayTitleA")}
                <span className="text-gradient-neon">{t("feat.todayTitleB")}</span>
              </h2>
            </div>
            <Button asChild variant="neon" size="sm" className="hidden sm:inline-flex">
              <Link to="/booking">{t("feat.viewAll")}</Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tables.map((tbl) => (
              <div
                key={tbl.id}
                className="group relative overflow-hidden rounded-xl border border-border bg-gradient-card p-5 transition-smooth hover:border-primary/60 hover:shadow-neon-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${
                      tbl.type === "VIP"
                        ? "bg-gold/20 text-gold"
                        : tbl.type === "Pro"
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tbl.type}
                  </span>
                  <span
                    className={`flex items-center gap-1.5 text-xs ${tbl.available ? "text-primary" : "text-muted-foreground"}`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${tbl.available ? "bg-primary animate-pulse" : "bg-muted-foreground"}`}
                    />
                    {tbl.available ? t("feat.available") : t("feat.occupied")}
                  </span>
                </div>
                <h3 className="mb-3 font-display text-lg font-semibold">{tbl.name}</h3>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-bold text-foreground">RM {tbl.price}</span>
                    <span className="ml-1 text-xs text-muted-foreground">{t("feat.perHour")}</span>
                  </div>
                  <Clock className="size-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              {t("feat.memberKicker")}
            </p>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              {t("feat.memberTitleA")}
              <span className="text-gradient-gold">{t("feat.memberTitleB")}</span>
            </h2>
            <p className="mt-3 text-muted-foreground">{t("feat.memberSub")}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {benefits.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-card p-7 transition-smooth hover:border-primary/60 hover:shadow-neon-sm"
              >
                <div className="mb-5 inline-flex size-12 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-primary transition-smooth group-hover:shadow-neon-sm">
                  <f.icon className="size-6" />
                </div>
                <h3 className="mb-2 font-display text-xl font-semibold">{f.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Check className="size-4" />
                  {f.highlight}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button asChild variant="gold" size="lg">
              <Link to="/membership">{t("feat.viewPlans")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
