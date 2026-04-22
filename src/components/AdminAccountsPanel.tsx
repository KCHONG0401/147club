/**
 * 仅 admin147（超管）可见：管理其他管理员账号 + 细分权限开关
 */
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Shield, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ACCOUNT_ID_HINT, ACCOUNT_ID_REGEX, PASSWORD_HINT, PASSWORD_REGEX } from "@/lib/account";
import { createAdminAccount, deleteAdminAccount } from "@/lib/admin-functions";

interface AdminRow {
  user_id: string;
  account_id: string | null;
  name: string;
  is_super: boolean;
  perms: {
    can_manage_bookings: boolean;
    can_give_discount: boolean;
    can_manage_members: boolean;
    can_edit_site: boolean;
    can_publish_posts: boolean;
  };
}

const PERM_LABEL: Record<keyof AdminRow["perms"], string> = {
  can_manage_bookings: "管理预订",
  can_give_discount: "折扣 / 改价",
  can_manage_members: "管理会员",
  can_edit_site: "修改网页内容",
  can_publish_posts: "发布内容",
};

export function AdminAccountsPanel() {
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const createFn = useServerFn(createAdminAccount);
  const deleteFn = useServerFn(deleteAdminAccount);

  async function load() {
    setLoading(true);
    // 拉所有 admin user_id
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
    const ids = (roles ?? []).map((r) => r.user_id);
    if (ids.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    const [{ data: profs }, { data: perms }] = await Promise.all([
      supabase.from("profiles").select("id,account_id,name").in("id", ids),
      supabase.from("admin_permissions").select("*").in("user_id", ids),
    ]);
    const merged: AdminRow[] = ids.map((id) => {
      const p = (profs ?? []).find((x) => x.id === id);
      const perm = (perms ?? []).find((x) => x.user_id === id);
      return {
        user_id: id,
        account_id: p?.account_id ?? null,
        name: p?.name ?? "",
        is_super: p?.account_id === "admin147",
        perms: {
          can_manage_bookings: perm?.can_manage_bookings ?? true,
          can_give_discount: perm?.can_give_discount ?? true,
          can_manage_members: perm?.can_manage_members ?? true,
          can_edit_site: perm?.can_edit_site ?? true,
          can_publish_posts: (perm as { can_publish_posts?: boolean })?.can_publish_posts ?? true,
        },
      };
    });
    // admin147 排前面
    merged.sort((a, b) => Number(b.is_super) - Number(a.is_super));
    setRows(merged);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function togglePerm(row: AdminRow, key: keyof AdminRow["perms"], val: boolean) {
    if (row.is_super) return;
    const patch = { [key]: val } as Partial<AdminRow["perms"]>;
    const { error } = await supabase
      .from("admin_permissions")
      .update(patch)
      .eq("user_id", row.user_id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.user_id === row.user_id ? { ...r, perms: { ...r.perms, [key]: val } } : r,
      ),
    );
    toast.success(`${PERM_LABEL[key]} 已${val ? "开启" : "关闭"}`);
  }

  async function handleDelete(row: AdminRow) {
    if (row.is_super) return;
    if (!confirm(`确定删除管理员 ${row.account_id}？此操作无法撤销。`)) return;
    try {
      await deleteFn({ data: { userId: row.user_id } });
      toast.success("已删除");
      setRows((prev) => prev.filter((r) => r.user_id !== row.user_id));
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  // 创建表单
  const [accountId, setAccountId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!ACCOUNT_ID_REGEX.test(accountId)) {
      toast.error(`账号 ID 不符合规则：${ACCOUNT_ID_HINT}`);
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      toast.error(`密码不符合规则：${PASSWORD_HINT}`);
      return;
    }
    setCreating(true);
    try {
      await createFn({ data: { accountId, password, name: name || undefined } });
      toast.success(`已创建管理员 ${accountId}`);
      setAccountId("");
      setPassword("");
      setName("");
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="size-5 text-gold" />
        <h2 className="text-xl font-bold">管理员账号</h2>
        <span className="text-xs text-muted-foreground">仅超级管理员可见</span>
      </div>

      {/* 新增表单 */}
      <Card className="mb-6 border-gold/30 bg-gold/5 p-5">
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">账号 ID</Label>
            <Input
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="例 admin200"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">密码</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={PASSWORD_HINT}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">姓名（选填）</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={creating} className="w-full">
              {creating ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : (
                <UserPlus className="mr-1 size-4" />
              )}
              创建管理员
            </Button>
          </div>
        </form>
        <p className="mt-3 text-[11px] text-muted-foreground">账号 ID：{ACCOUNT_ID_HINT}</p>
      </Card>

      {/* 列表 */}
      {loading ? (
        <Card className="p-8 text-center">
          <Loader2 className="mx-auto size-6 animate-spin text-primary" />
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card
              key={row.user_id}
              className={`border p-4 ${
                row.is_super ? "border-gold/40 bg-gold/5" : "border-border/60"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-10 items-center justify-center rounded-lg ${
                      row.is_super ? "bg-gold/20 text-gold" : "bg-primary/15 text-primary"
                    }`}
                  >
                    <Shield className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-bold">
                      {row.account_id}
                      {row.is_super && (
                        <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gold">
                          超级管理员
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{row.name || "—"}</div>
                  </div>
                </div>
                {!row.is_super && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(row)}
                  >
                    <Trash2 className="mr-1 size-4" /> 删除
                  </Button>
                )}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {(Object.keys(PERM_LABEL) as Array<keyof AdminRow["perms"]>).map((k) => (
                  <label
                    key={k}
                    className={`flex items-center justify-between rounded-md border border-border/60 bg-background/50 px-3 py-2 ${
                      row.is_super ? "opacity-70" : "cursor-pointer hover:bg-muted/30"
                    }`}
                  >
                    <span className="text-sm">{PERM_LABEL[k]}</span>
                    <Switch
                      checked={row.is_super ? true : row.perms[k]}
                      disabled={row.is_super}
                      onCheckedChange={(v) => togglePerm(row, k, v)}
                    />
                  </label>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
