import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "隐私政策 — 147 Snooker Club" },
      { name: "description", content: "147 Snooker Club 个人资料保护声明，符合马来西亚 PDPA 2010。" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-28 lg:px-8">
        <h1 className="mb-2 font-display text-3xl font-bold">隐私政策</h1>
        <p className="mb-8 text-sm text-muted-foreground">最后更新：2026 年 4 月 · 依据马来西亚《个人资料保护法》（PDPA 2010）</p>

        <div className="prose prose-invert max-w-none space-y-8 text-sm leading-relaxed text-muted-foreground">

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">1. 我们收集的资料</h2>
            <p>当您在 147 Snooker Club 注册账号或进行预订时，我们会收集以下个人资料：</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>账号 ID（用户名）</li>
              <li>姓名</li>
              <li>手机号码</li>
              <li>预订信息（日期、时段、球台、人数、金额）</li>
            </ul>
            <p>我们<strong className="text-foreground">不收集</strong>您的真实电子邮箱地址、身份证号或支付卡信息。</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">2. 收集目的</h2>
            <p>您的个人资料仅用于以下目的：</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>处理和确认球台预订</li>
              <li>管理会员账号及等级折扣</li>
              <li>通过短信发送预订确认通知</li>
              <li>内部运营分析与服务改善</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">3. 资料披露</h2>
            <p>我们不会向任何第三方出售您的个人资料。我们仅在以下情况下共享资料：</p>
            <ul className="ml-4 list-disc space-y-1">
              <li><strong className="text-foreground">Supabase</strong>（数据库托管服务）— 安全存储您的账号与预订数据</li>
              <li><strong className="text-foreground">Cloudflare</strong>（网站托管与安全）— 处理网络请求</li>
              <li>法律要求或监管机关强制索取时</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">4. 资料保留期限</h2>
            <p>预订记录保留 <strong className="text-foreground">3 年</strong>，用于财务记录与争议解决。账号资料在您主动删除账号后 30 天内清除。</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">5. 数据安全</h2>
            <p>我们采用以下安全措施保护您的资料：</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>全站 HTTPS 加密传输</li>
              <li>密码经 bcrypt 哈希存储，从不明文保存</li>
              <li>数据库行级安全策略（RLS）限制访问权限</li>
              <li>管理功能需双重身份验证</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">6. 您的权利</h2>
            <p>依据 PDPA 2010，您有权：</p>
            <ul className="ml-4 list-disc space-y-1">
              <li><strong className="text-foreground">查阅</strong>我们持有的您的个人资料</li>
              <li><strong className="text-foreground">更正</strong>不准确的资料</li>
              <li><strong className="text-foreground">撤回同意</strong>并申请删除账号</li>
              <li><strong className="text-foreground">投诉</strong>至马来西亚个人资料保护专员</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">7. 联系我们</h2>
            <p>如需行使上述权利或有任何隐私相关疑问，请通过以下方式联系：</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>电话：+60 7-147 1470</li>
              <li>到店咨询：请参阅<Link to="/contact" className="text-primary hover:underline ml-1">联系页面</Link>地址</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">8. 政策变更</h2>
            <p>本政策如有重大变更，我们将在网站首页显著位置提前 7 天通知。继续使用我们的服务视为接受更新后的政策。</p>
          </section>
        </div>

        <div className="mt-10 border-t border-border/60 pt-6 text-center">
          <Link to="/" className="text-sm text-primary hover:underline">← 返回首页</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
