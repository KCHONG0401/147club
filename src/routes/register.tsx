import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Lock, Phone, User as UserIcon } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  ACCOUNT_ID_REGEX,
  ACCOUNT_ID_HINT,
  PASSWORD_REGEX,
  PASSWORD_HINT,
  accountIdToEmail,
} from "@/lib/account";

const schema = z.object({
  accountId: z.string().trim().regex(ACCOUNT_ID_REGEX, { message: ACCOUNT_ID_HINT }),
  name: z.string().trim().min(2, { message: "请输入姓名" }).max(50),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^[0-9+\-\s]{8,20}$/.test(v), { message: "手机号格式无效" }),
  password: z.string().regex(PASSWORD_REGEX, { message: PASSWORD_HINT }).max(72),
});

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "注册 — 147 Snooker Club" },
      { name: "description", content: "免费注册 147 Snooker Club 会员，开启专业斯诺克体验。" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = schema.safeParse({
      accountId: form.get("accountId"),
      name: form.get("name"),
      phone: form.get("phone") || "",
      password: form.get("password"),
    });
    if (!result.success) {
      const fe: Record<string, string> = {};
      for (const issue of result.error.issues) fe[issue.path[0] as string] = issue.message;
      setErrors(fe);
      return;
    }
    setErrors({});
    setLoading(true);
    const accountIdLower = result.data.accountId.toLowerCase();
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email: accountIdToEmail(accountIdLower),
      password: result.data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          account_id: accountIdLower,
          name: result.data.name,
          phone: result.data.phone || null,
        },
      },
    });
    setLoading(false);
    if (error) {
      const msg = error.message.includes("already registered")
        ? "该账号 ID 已被注册，请直接登录"
        : error.message;
      toast.error(msg);
      return;
    }
    toast.success("注册成功！欢迎加入 147 Snooker Club");
    navigate({ to: "/" });
  }

  return (
    <AuthShell
      title="加入 147"
      subtitle="创建账号，享受会员专属特权"
      footer={
        <>
          已有账号？{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            立即登录
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="accountId">
            账号 ID <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="accountId"
              name="accountId"
              placeholder="6-12 位，字母+数字组合"
              className="pl-10"
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>
          {errors.accountId && <p className="text-xs text-destructive">{errors.accountId}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">
            姓名 <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="name" name="name" placeholder="您的姓名" className="pl-10" />
          </div>
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">手机号（选填）</Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="phone" name="phone" placeholder="+60 12-345 6789" className="pl-10" />
          </div>
          {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            密码 <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type={showPwd ? "text" : "password"}
              placeholder="字母+数字+标点，至少 8 位"
              className="pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          点击注册即表示您同意 147 Snooker Club 的 <span className="text-primary">服务条款</span> 与{" "}
          <span className="text-primary">隐私政策</span>。
        </p>

        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> 创建中...
            </>
          ) : (
            "免费注册"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
