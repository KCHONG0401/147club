import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolve } from "path";

// 加载环境变量
dotenv.config({ path: resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ 错误: 请在 .env 中配置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setup() {
  console.log("🚀 开始初始化应用数据...");

  // 1. 创建超级管理员账号 (admin147)
  const adminEmail = process.env.ADMIN_EMAIL || "admin147@147snooker.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin147$$"; // 注意: 生产环境请在.env中配置ADMIN_PASSWORD

  console.log(`👤 正在创建超管账号: ${adminEmail}...`);

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { account_id: "admin147", name: "Super Admin" },
  });

  if (authError) {
    if (authError.message.includes("already registered")) {
      console.log("ℹ️ 超管账号已存在，跳过创建。");
    } else {
      console.error("❌ 创建超管失败:", authError.message);
    }
  } else {
    const uid = authUser.user.id;
    // 提升为 admin 角色
    await supabase.from("user_roles").upsert({ user_id: uid, role: "admin" });
    // 修正 Profile
    await supabase
      .from("profiles")
      .update({ account_id: "admin147", name: "Super Admin" })
      .eq("id", uid);
    console.log("✅ 超管账号创建成功！");
  }

  // 2. 初始化系统设置
  console.log("⚙️ 正在初始化系统设置...");
  const settings = [
    { key: "site_name", value: "147 Snooker Club", label: "网站名称", category: "general" },
    { key: "contact_phone", value: "+60 7-147 1470", label: "联系电话", category: "contact" },
    { key: "opening_hours", value: "12:00 PM - 02:00 AM", label: "营业时间", category: "general" },
    { key: "member_discount", value: "0.8", label: "会员折扣率", category: "pricing" },
  ];

  for (const s of settings) {
    await supabase.from("site_settings").upsert(s);
  }
  console.log("✅ 系统设置初始化完成！");

  // 3. 创建示例动态
  console.log("📝 正在创建示例动态...");
  const { data: adminUser } = await supabase
    .from("profiles")
    .select("id")
    .eq("account_id", "admin147")
    .single();

  if (adminUser) {
    const { data: post, error: postErr } = await supabase
      .from("posts")
      .upsert({
        author_id: adminUser.id,
        title: "欢迎来到 147 Snooker Club!",
        content: "我们为您提供最专业的斯诺克体验。顶级球台、舒适环境、专业教练，一切尽在 147。",
        is_published: true,
      })
      .select()
      .single();

    if (post) {
      await supabase.from("post_images").upsert({
        post_id: post.id,
        url: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80",
        position: 0,
      });
    }
  }
  console.log("✅ 示例动态创建完成！");

  console.log("\n✨ 所有功能已就绪！");
  console.log("--------------------------------------------------");
  console.log("账号: admin147");
  console.log(`密码: ${adminPassword}`);
  console.log("--------------------------------------------------");
}

setup().catch(console.error);
