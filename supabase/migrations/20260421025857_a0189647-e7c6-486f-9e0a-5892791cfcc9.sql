-- 1) 在 admin_permissions 增加发布权限字段
ALTER TABLE public.admin_permissions
  ADD COLUMN IF NOT EXISTS can_publish_posts boolean NOT NULL DEFAULT true;

-- 2) 扩展 has_admin_permission 函数支持 'publish'
CREATE OR REPLACE FUNCTION public.has_admin_permission(_user_id uuid, _perm text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_admin boolean;
  v_is_super boolean;
  v_allowed boolean;
  v_col text;
BEGIN
  SELECT public.has_role(_user_id, 'admin') INTO v_is_admin;
  IF NOT v_is_admin THEN RETURN false; END IF;

  SELECT public.is_super_admin(_user_id) INTO v_is_super;
  IF v_is_super THEN RETURN true; END IF;

  v_col := CASE _perm
    WHEN 'bookings' THEN 'can_manage_bookings'
    WHEN 'discount' THEN 'can_give_discount'
    WHEN 'members'  THEN 'can_manage_members'
    WHEN 'site'     THEN 'can_edit_site'
    WHEN 'publish'  THEN 'can_publish_posts'
    ELSE NULL
  END;
  IF v_col IS NULL THEN RETURN false; END IF;

  EXECUTE format('SELECT %I FROM public.admin_permissions WHERE user_id = $1', v_col)
    INTO v_allowed USING _user_id;

  RETURN COALESCE(v_allowed, false);
END;
$$;

-- 3) posts 表
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  video_url text,
  is_published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_posts_published ON public.posts (is_published, published_at DESC);

CREATE TRIGGER trg_posts_updated
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Anyone can view published posts"
ON public.posts FOR SELECT
USING (is_published = true OR public.has_admin_permission(auth.uid(), 'publish'));

CREATE POLICY "Publishers can insert posts"
ON public.posts FOR INSERT TO authenticated
WITH CHECK (public.has_admin_permission(auth.uid(), 'publish') AND author_id = auth.uid());

CREATE POLICY "Publishers can update posts"
ON public.posts FOR UPDATE TO authenticated
USING (public.has_admin_permission(auth.uid(), 'publish'))
WITH CHECK (public.has_admin_permission(auth.uid(), 'publish'));

CREATE POLICY "Publishers can delete posts"
ON public.posts FOR DELETE TO authenticated
USING (public.has_admin_permission(auth.uid(), 'publish'));

-- 4) post_images 表
CREATE TABLE public.post_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_post_images_post ON public.post_images(post_id, position);

CREATE POLICY "Anyone can view post images"
ON public.post_images FOR SELECT
USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND (p.is_published OR public.has_admin_permission(auth.uid(), 'publish'))));

CREATE POLICY "Publishers manage post images"
ON public.post_images FOR ALL TO authenticated
USING (public.has_admin_permission(auth.uid(), 'publish'))
WITH CHECK (public.has_admin_permission(auth.uid(), 'publish'));

-- 5) post_likes 表
CREATE TABLE public.post_likes (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
ON public.post_likes FOR SELECT USING (true);

CREATE POLICY "Members can like"
ON public.post_likes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can unlike own"
ON public.post_likes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- 6) post_comments 表
CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_post_comments_post ON public.post_comments(post_id, created_at DESC);

CREATE POLICY "Anyone can view comments"
ON public.post_comments FOR SELECT USING (true);

CREATE POLICY "Members can comment"
ON public.post_comments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND length(trim(content)) BETWEEN 1 AND 500);

CREATE POLICY "Author or admin can delete comment"
ON public.post_comments FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 7) Storage bucket: post-media (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read post-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-media');

CREATE POLICY "Publishers upload post-media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-media' AND public.has_admin_permission(auth.uid(), 'publish'));

CREATE POLICY "Publishers update post-media"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'post-media' AND public.has_admin_permission(auth.uid(), 'publish'));

CREATE POLICY "Publishers delete post-media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'post-media' AND public.has_admin_permission(auth.uid(), 'publish'));