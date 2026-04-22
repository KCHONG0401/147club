import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* 背景效果 */}
      <div className="absolute inset-0 -z-10 grid-bg opacity-30" />
      <div className="absolute left-1/4 top-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-primary/15 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-[300px] w-[300px] rounded-full bg-gold/10 blur-[100px]" />

      <div className="absolute left-6 top-6">
        <Logo size="sm" />
      </div>

      <div className="w-full max-w-md animate-float-up">
        <div className="rounded-2xl border border-border bg-gradient-card p-8 shadow-elegant backdrop-blur">
          <div className="mb-7 text-center">
            <h1 className="font-display text-3xl font-bold">
              <span className="text-gradient-neon">{title}</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
        <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary">
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
