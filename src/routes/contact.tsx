import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  Clock,
  Facebook,
  Instagram,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSiteSettings } from "@/hooks/use-site-settings";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "联系我们 — 147 Snooker Club" },
      {
        name: "description",
        content: "147 Snooker Club 地址、电话、营业时间与在线咨询表单。Jalan Tebrau, Johor Bahru。",
      },
      { property: "og:title", content: "联系我们 — 147 Snooker Club" },
      {
        property: "og:description",
        content: "Jalan Tebrau, JB · 12:00 — 02:00 · +60 7-147 1470",
      },
    ],
  }),
  component: ContactPage,
});

const formSchema = z.object({
  name: z.string().trim().min(2, "请输入姓名").max(50, "姓名过长"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{8,20}$/, "请输入有效手机号"),
  subject: z.string().trim().min(2, "请填写主题").max(100),
  message: z.string().trim().min(5, "请至少输入 5 个字").max(500, "不超过 500 字"),
});

function ContactPage() {
  const { get } = useSiteSettings();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const phone = get("contact_phone", "+60 7-147 1470");
  const whatsapp = get("contact_whatsapp", "60123456789");
  const email = get("contact_email", "hello@147snooker.club");
  const facebook = get("contact_facebook", "https://facebook.com/147snooker");
  const instagram = get("contact_instagram", "https://instagram.com/147snooker");
  const address = get("contact_address", "Jalan Tebrau, 80300 Johor Bahru");
  const hours = get("business_hours", "12:00 — 02:00");

  const contactInfo = [
    { icon: MapPin, label: "会所地址", value: address, sub: "欢迎到店体验" },
    { icon: Phone, label: "联系电话", value: phone, sub: "预订 / 课程咨询" },
    { icon: Mail, label: "邮箱", value: email, sub: "商务合作 / 媒体" },
    { icon: Clock, label: "营业时间", value: hours, sub: "会员通宵延时" },
  ];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const result = formSchema.safeParse({
      name: fd.get("name"),
      phone: fd.get("phone"),
      subject: fd.get("subject"),
      message: fd.get("message"),
    });
    if (!result.success) {
      const fe: Record<string, string> = {};
      for (const issue of result.error.issues) fe[issue.path[0] as string] = issue.message;
      setErrors(fe);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const form = e.currentTarget;
    // 通过 WhatsApp 直接发送
    const waMsg = encodeURIComponent(
      `[${result.data.subject}]\n姓名：${result.data.name}\n电话：${result.data.phone}\n\n${result.data.message}`,
    );
    setTimeout(() => {
      setSubmitting(false);
      toast.success("正在跳转 WhatsApp 发送您的留言");
      window.open(`https://wa.me/${whatsapp}?text=${waMsg}`, "_blank");
      form.reset();
    }, 400);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-24 pt-28">
        <section className="mx-auto max-w-4xl px-4 text-center lg:px-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Contact · 联系我们
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
            来 147 <span className="text-gradient-neon">打一杆</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm text-muted-foreground md:text-base">
            预订球台 · 报名赛事 · 教练咨询 · 场地租用——任何问题，随时联系
          </p>
        </section>

        <section className="mx-auto mt-12 max-w-6xl px-4 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {contactInfo.map((c) => (
              <div
                key={c.label}
                className="group rounded-xl border border-border bg-gradient-card p-5 transition-smooth hover:border-primary/60 hover:shadow-neon-sm"
              >
                <div className="mb-3 inline-flex size-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary transition-smooth group-hover:scale-110">
                  <c.icon className="size-5" />
                </div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {c.label}
                </p>
                <p className="mt-1 font-display text-base font-semibold leading-tight">{c.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-12 max-w-6xl px-4 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-border bg-gradient-card p-6 md:p-8">
              <div className="mb-5 flex items-center gap-3">
                <MessageCircle className="size-6 text-primary" />
                <h2 className="font-display text-2xl font-bold">在线留言</h2>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="c-name">姓名 *</Label>
                    <Input id="c-name" name="name" placeholder="您的姓名" />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-phone">手机号 *</Label>
                    <Input id="c-phone" name="phone" placeholder="+60 12-345 6789" />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-subject">主题 *</Label>
                  <Input id="c-subject" name="subject" placeholder="例如：教练课程咨询" />
                  {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-message">留言 *</Label>
                  <Textarea
                    id="c-message"
                    name="message"
                    rows={5}
                    placeholder="请详细描述您的需求..."
                    maxLength={500}
                  />
                  {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
                </div>
                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" /> 准备中...
                    </>
                  ) : (
                    <>
                      通过 WhatsApp 发送 <Send />
                    </>
                  )}
                </Button>
                <p className="text-center text-[11px] text-muted-foreground">
                  我们承诺 24 小时内回复您的留言
                </p>
              </form>
            </div>

            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-border bg-gradient-card">
                <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3">
                  <MapPin className="size-4 text-primary" />
                  <span className="text-sm font-medium">会所位置</span>
                </div>
                <iframe
                  title="147 Snooker Club 地图"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
                  className="h-[320px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="rounded-2xl border border-border bg-gradient-card p-6">
                <h3 className="font-display text-lg font-semibold">关注我们</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  获取赛事直播、教学视频、会员专属优惠
                </p>
                <div className="mt-4 flex gap-3">
                  <SocialBtn icon={Facebook} label="Facebook" href={facebook} />
                  <SocialBtn icon={Instagram} label="Instagram" href={instagram} />
                  <SocialBtn
                    icon={MessageCircle}
                    label="WhatsApp"
                    href={`https://wa.me/${whatsapp}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function SocialBtn({
  icon: Icon,
  label,
  href,
}: {
  icon: typeof Phone;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-1 flex-col items-center gap-1.5 rounded-lg border border-border bg-card/50 px-3 py-3 text-xs transition-smooth hover:border-primary/60 hover:bg-primary/5"
    >
      <Icon className="size-5 text-primary transition-smooth group-hover:scale-110" />
      <span className="text-muted-foreground">{label}</span>
    </a>
  );
}
