/**
 * 管理员账号管理 — 服务端函数
 * 仅 admin147（超管）可创建/删除管理员账号。
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ACCOUNT_DOMAIN, ACCOUNT_ID_REGEX, PASSWORD_REGEX } from "@/lib/account";

const SUPER_ADMIN = "admin147";

async function assertSuperAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("account_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data?.account_id !== SUPER_ADMIN) {
    throw new Error("仅超级管理员（admin147）可执行此操作");
  }
}

const CreateSchema = z.object({
  accountId: z.string().regex(ACCOUNT_ID_REGEX, "账号 ID 格式不符"),
  password: z.string().regex(PASSWORD_REGEX, "密码强度不足"),
  name: z.string().min(1).max(50).optional(),
});

export const createAdminAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }) => {
    const data = CreateSchema.parse(rawData);
    await assertSuperAdmin(context.supabase, context.userId);

    const accountId = data.accountId.toLowerCase().trim();
    if (accountId === SUPER_ADMIN) {
      throw new Error("不能创建与超级管理员相同的账号 ID");
    }
    const email = `${accountId}@${ACCOUNT_DOMAIN}`;

    // 1) 创建用户（绕过邮箱验证）
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { account_id: accountId, name: data.name ?? accountId },
    });
    if (createErr) throw new Error(createErr.message);
    const newUserId = created.user!.id;

    // 2) handle_new_user 触发器会写默认 member 角色 + profile，需要升级为 admin
    await supabaseAdmin.from("user_roles").delete().eq("user_id", newUserId);
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUserId, role: "admin" });
    if (roleErr) throw new Error(roleErr.message);

    return { userId: newUserId, accountId };
  });

const DeleteSchema = z.object({ userId: z.string().uuid() });

export const deleteAdminAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: rawData, context }) => {
    const data = DeleteSchema.parse(rawData);
    await assertSuperAdmin(context.supabase, context.userId);

    // 检查目标
    const { data: target } = await supabaseAdmin
      .from("profiles")
      .select("account_id")
      .eq("id", data.userId)
      .maybeSingle();
    if (target?.account_id === SUPER_ADMIN) {
      throw new Error("不能删除超级管理员（admin147）");
    }
    if (data.userId === context.userId) {
      throw new Error("不能删除自己");
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });
