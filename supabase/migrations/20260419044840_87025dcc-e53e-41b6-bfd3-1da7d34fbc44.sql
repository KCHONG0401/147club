-- 1. 清空所有数据（按依赖顺序）
DELETE FROM public.bookings;
DELETE FROM public.user_roles;
DELETE FROM public.profiles;
-- 删除所有 auth 用户（级联清理）
DELETE FROM auth.users;

-- 2. profiles 表加 account_id 字段（登录 ID）
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_id text UNIQUE;

-- 3. 新建网站设置表（键值对）
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  label text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 任何人可读（前台展示）
CREATE POLICY "Anyone can read site settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- 管理员可写
CREATE POLICY "Admins manage site settings"
  ON public.site_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at 触发器
CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. 预填默认设置
INSERT INTO public.site_settings (key, value, category, label) VALUES
  ('contact_phone',       '+60 12-345 6789',                'contact',  '联系电话'),
  ('contact_whatsapp',    '60123456789',                    'contact',  'WhatsApp 号码（不含 +）'),
  ('contact_email',       'hello@147snooker.club',          'contact',  '联系邮箱'),
  ('contact_facebook',    'https://facebook.com/147snooker','contact',  'Facebook 主页'),
  ('contact_instagram',   'https://instagram.com/147snooker','contact', 'Instagram 主页'),
  ('contact_address',     'No. 147, Jalan Bukit Bintang, 55100 Kuala Lumpur', 'contact', '门店地址'),
  ('business_hours',      '每日 11:00 — 02:00',             'contact',  '营业时间'),
  ('about_tagline',       '马来西亚顶级斯诺克俱乐部',         'about',    '关于我们 — 标语'),
  ('about_story',         '147 Snooker Club 创立于 2018 年，致力于为斯诺克爱好者提供专业级的对局环境与赛事级球台。我们拥有马来西亚最齐全的 Standard、Pro 和 VIP 球台配置，日均接待超过百位球友。', 'about', '关于我们 — 品牌故事'),
  ('about_mission',       '让每一位走进 147 的客人，都感受到职业级的体验与社群温度。', 'about', '关于我们 — 使命'),
  ('hero_slogan',         '专业球台 · 沉浸体验',            'home',     '首页标语'),
  ('price_standard',      '15',                             'pricing',  'Standard 球台 / 小时（RM）'),
  ('price_pro',           '25',                             'pricing',  'Pro 球台 / 小时（RM）'),
  ('price_vip',           '40',                             'pricing',  'VIP 球台 / 小时（RM）')
ON CONFLICT (key) DO NOTHING;

-- 5. 改造注册触发器：支持 account_id 模式
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_account_id text;
BEGIN
  -- 从 metadata 提取 account_id；若无则从 email 前缀回退
  v_account_id := COALESCE(
    NEW.raw_user_meta_data->>'account_id',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, name, phone, account_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', v_account_id),
    NEW.raw_user_meta_data->>'phone',
    v_account_id
  );

  -- admin147 自动成为管理员
  IF v_account_id = 'admin147' OR NEW.email = 'admin147@147snooker.local' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member');
  END IF;

  RETURN NEW;
END;
$function$;

-- 6. 确保 auth 触发器存在
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();