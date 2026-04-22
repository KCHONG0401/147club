/**
 * 通用路由切换骨架屏 — 路由 chunk 加载期间替代空白。
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-8 space-y-8 animate-pulse">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded-full bg-primary/20" />
          <div className="h-10 w-2/3 rounded-md bg-muted/60" />
          <div className="h-4 w-1/2 rounded-md bg-muted/40" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl border border-border/40 bg-card/40" />
          ))}
        </div>
      </div>
    </div>
  );
}
