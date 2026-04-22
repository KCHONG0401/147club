-- 1. 权限表
CREATE TABLE public.admin_permissions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  can_manage_bookings boolean NOT NULL DEFAULT true,
  can_give_discount boolean NOT NULL DEFAULT true,
  can_manage_members boolean NOT NULL DEFAULT true,
  can_edit_site boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- 2. 判断是否为超级管理员（admin147）
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND account_id = 'admin147'
  )
$$;

-- 3. 判断管理员是否拥有某权限
CREATE OR REPLACE FUNCTION public.has_admin_permission(_user_id uuid, _perm text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_is_super boolean;
  v_allowed boolean;
BEGIN
  SELECT public.has_role(_user_id, 'admin') INTO v_is_admin;
  IF NOT v_is_admin THEN RETURN false; END IF;

  SELECT public.is_super_admin(_user_id) INTO v_is_super;
  IF v_is_super THEN RETURN true; END IF;

  EXECUTE format(
    'SELECT %I FROM public.admin_permissions WHERE user_id = $1',
    CASE _perm
      WHEN 'bookings' THEN 'can_manage_bookings'
      WHEN 'discount' THEN 'can_give_discount'
      WHEN 'members'  THEN 'can_manage_members'
      WHEN 'site'     THEN 'can_edit_site'
      ELSE NULL
    END
  ) INTO v_allowed USING _user_id;

  RETURN COALESCE(v_allowed, false);
END;
$$;

-- 4. RLS：仅超管可写，所有管理员可读
CREATE POLICY "Super admin manages permissions"
ON public.admin_permissions
FOR ALL
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins view permissions"
ON public.admin_permissions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own permissions"
ON public.admin_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- 5. 锁定 admin147：阻止其 admin 角色被删除/修改
CREATE OR REPLACE FUNCTION public.protect_super_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target uuid;
BEGIN
  v_target := COALESCE(OLD.user_id, NEW.user_id);
  IF public.is_super_admin(v_target) AND TG_OP IN ('DELETE','UPDATE') THEN
    -- 仅当尝试移除/降级 admin 角色时阻止
    IF TG_OP = 'DELETE' AND OLD.role = 'admin' THEN
      RAISE EXCEPTION 'Cannot remove admin role from super admin (admin147)';
    END IF;
    IF TG_OP = 'UPDATE' AND OLD.role = 'admin' AND NEW.role <> 'admin' THEN
      RAISE EXCEPTION 'Cannot downgrade super admin (admin147)';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_super_admin ON public.user_roles;
CREATE TRIGGER trg_protect_super_admin
BEFORE UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin_role();

-- 6. 阻止删除 admin147 的 profile
CREATE OR REPLACE FUNCTION public.protect_super_admin_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.account_id = 'admin147' THEN
    RAISE EXCEPTION 'Cannot delete super admin profile (admin147)';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_super_admin_profile ON public.profiles;
CREATE TRIGGER trg_protect_super_admin_profile
BEFORE DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin_profile();

-- 7. 新管理员自动获得权限行（默认全部启用，超管可关）
CREATE OR REPLACE FUNCTION public.handle_new_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    INSERT INTO public.admin_permissions (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_new_admin_perms ON public.user_roles;
CREATE TRIGGER trg_new_admin_perms
AFTER INSERT ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin_role();

-- 8. 为现有 admin 补建权限行
INSERT INTO public.admin_permissions (user_id)
SELECT user_id FROM public.user_roles WHERE role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- 9. updated_at trigger
DROP TRIGGER IF EXISTS trg_admin_perms_updated ON public.admin_permissions;
CREATE TRIGGER trg_admin_perms_updated
BEFORE UPDATE ON public.admin_permissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();