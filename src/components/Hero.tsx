import { Link } from "@tanstack/react-router";
import { ArrowRight, Award, Calendar, Sparkles } from "lucide-react";
import heroImg from "@/assets/hero-snooker.jpg";
import { Button } from "./ui/button";
import { useLang } from "@/contexts/LanguageContext";

export function Hero() {
  const { t } = useLang();
  return (
    <section className="relative isolate min-h-screen overflow-hidden">
      {/* 背景图 */}
      <div className="absolute inset-0 -z-20">
        <img
          src={heroImg}
          alt={t("hero.imgAlt")}
          width={1920}
          height={1080}
          className="h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>

      {/* 网格 + 光晕 */}
      <div className="absolute inset-0 -z-10 grid-bg opacity-30" />
      <div className="absolute left-1/2 top-1/3 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-4 pb-20 pt-32 text-center lg:px-8">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur animate-float-up">
          <Sparkles className="size-3.5" />
          {t("hero.badge")}
        </div>

        {/* 147 巨型数字 */}
        <div className="relative mb-4 animate-float-up" style={{ animationDelay: "0.1s" }}>
          <h1 className="font-display text-[20vw] font-bold leading-none tracking-tighter text-gradient-neon animate-neon-pulse md:text-[180px] lg:text-[220px]">
            147
          </h1>
          <span className="absolute -right-2 top-4 rounded border border-gold/50 bg-card/80 px-2 py-0.5 font-display text-[10px] font-bold tracking-widest text-gold backdrop-blur md:right-4 md:top-8 md:text-xs">
            MAX BREAK
          </span>
        </div>

        <h2
          className="mb-5 max-w-4xl font-display text-3xl font-bold leading-tight md:text-5xl lg:text-6xl animate-float-up"
          style={{ animationDelay: "0.2s" }}
        >
          专业斯诺克 · <span className="text-gradient-neon">完美一杆</span>
        </h2>

        <p
          className="mb-10 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg animate-float-up"
          style={{ animationDelay: "0.3s" }}
        >
          {t("hero.desc")}
        </p>

        <div
          className="flex flex-col items-center gap-3 sm:flex-row animate-float-up"
          style={{ animationDelay: "0.4s" }}
        >
          <Button asChild variant="hero" size="xl">
            <Link to="/booking">
              <Calendar className="mr-1" />
              {t("hero.cta1")}
              <ArrowRight className="ml-1" />
            </Link>
          </Button>
          <Button asChild variant="neon" size="xl">
            <Link to="/membership">
              <Award className="mr-1" />
              {t("hero.cta2")}
            </Link>
          </Button>
        </div>

        {/* 数据 */}
        <div
          className="mt-20 grid w-full max-w-3xl grid-cols-3 gap-4 border-t border-border/60 pt-10 animate-float-up"
          style={{ animationDelay: "0.5s" }}
        >
          {[
            { num: "12", label: t("hero.stat1") },
            { num: "5,000+", label: t("hero.stat2") },
            { num: "147", label: t("hero.stat3") },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-2xl font-bold text-gradient-neon md:text-4xl">
                {s.num}
              </div>
              <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground md:text-sm">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
