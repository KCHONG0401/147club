import { Link } from "@tanstack/react-router";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { num: "text-xl", text: "text-xs", dot: "h-1.5 w-1.5" },
    md: { num: "text-2xl", text: "text-[10px]", dot: "h-2 w-2" },
    lg: { num: "text-4xl", text: "text-sm", dot: "h-3 w-3" },
  }[size];

  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <div className="relative flex items-center justify-center rounded-lg border border-primary/40 bg-card px-2.5 py-1 shadow-neon-sm transition-smooth group-hover:shadow-neon">
        <span className={`font-display font-bold text-gradient-neon ${sizes.num} leading-none`}>
          147
        </span>
        <span
          className={`absolute -right-0.5 -top-0.5 ${sizes.dot} rounded-full bg-primary animate-pulse`}
        />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-display text-sm font-semibold tracking-widest text-foreground">
          SNOOKER
        </span>
        <span className={`tracking-[0.3em] text-muted-foreground ${sizes.text}`}>CLUB · JB</span>
      </div>
    </Link>
  );
}
