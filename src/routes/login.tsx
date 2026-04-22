import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Lock, User as UserIcon } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ACCOUNT_ID_REGEX, ACCOUNT_ID_HINT, accountIdToEmail } from "@/lib/account";

const schema = z.object({
  accountId: z.string().trim().regex(ACCOUNT_ID_REGEX, { message: ACCOUNT_ID_HINT }),
  password: z.string().min(1, { message: "请输入密码" }).max(72),
});

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "登录 — 147 Snooker Club" },
      { name: "description", content: "登录 147 Snooker Club 会员账号，预订球台、查看会员特权。" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ accountId?: string; password?: string }>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const result = schema.safeParse({
      accountId: form.get("accountId"),
      password: form.get("password"),
    });
    if (!result.success) {
      const fe: typeof errors = {};
      for (const issue of result.error.issues) {
        fe[issue.path[0] as keyof typeof errors] = issue.message;
      }
      setErrors(fe);
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: accountIdToEmail(result.data.accountId),
      password: result.data.password,
    });
    setLoading(false);
    if (error) {
      const msg = error.message.includes("Invalid login") ? "账号或密码错误" : error.message;
      toast.error(msg);
      return;
    }
    toast.success("欢迎回来！");
    navigate({ to: "/" });
  }

  return (
    <AuthShell
      title="欢迎回来"
      subtitle="使用账号 ID 登录，开启你的完美一杆"
      footer={
        <>
          还没有账号？{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            立即注册
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="accountId">账号 ID</Label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="accountId"
              name="accountId"
              placeholder=""
              className="pl-10"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>
          {errors.accountId && <p className="text-xs text-destructive">{errors.accountId}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">密码</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type={showPwd ? "text" : "password"}
              placeholder="••••••••"
              className="pl-10 pr-10"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="显示密码"
            >
              {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>

        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> 登录中...
            </>
          ) : (
            "登录"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
