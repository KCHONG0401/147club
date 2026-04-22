import { supabase } from "@/integrations/supabase/client";

export interface PostImage {
  id: string;
  url: string;
  position: number;
}

export interface PostAuthor {
  id: string;
  name: string;
  account_id: string | null;
}

export interface PostComment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

export interface Post {
  id: string;
  author_id: string;
  title: string;
  content: string;
  video_url: string | null;
  is_published: boolean;
  published_at: string;
  created_at: string;
  images: PostImage[];
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
}

/** YouTube / 通用视频 URL → 嵌入地址 */
export function toEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    // YouTube
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.slice(1);
      return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      // /shorts/xxx
      const m = u.pathname.match(/\/shorts\/([^/?#]+)/);
      if (m) return `https://www.youtube.com/embed/${m[1]}`;
    }
    // Vimeo
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  } catch {
    return null;
  }
}

/** 拉取已发布帖子（含图片、计数、当前用户是否点赞） */
export async function fetchPosts(currentUserId: string | null): Promise<Post[]> {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  if (!posts || posts.length === 0) return [];

  const ids = posts.map((p) => p.id);
  const [{ data: imgs }, { data: likes }, { data: comments }, mineRes] = await Promise.all([
    supabase.from("post_images").select("*").in("post_id", ids).order("position"),
    supabase.from("post_likes").select("post_id").in("post_id", ids),
    supabase.from("post_comments").select("post_id").in("post_id", ids),
    currentUserId
      ? supabase
          .from("post_likes")
          .select("post_id")
          .in("post_id", ids)
          .eq("user_id", currentUserId)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ]);

  const likeCount = new Map<string, number>();
  (likes ?? []).forEach((r) => likeCount.set(r.post_id, (likeCount.get(r.post_id) ?? 0) + 1));
  const commentCount = new Map<string, number>();
  (comments ?? []).forEach((r) =>
    commentCount.set(r.post_id, (commentCount.get(r.post_id) ?? 0) + 1),
  );
  const mine = new Set((mineRes.data ?? []).map((r) => r.post_id));
  const imageMap = new Map<string, PostImage[]>();
  (imgs ?? []).forEach((i) => {
    const arr = imageMap.get(i.post_id) ?? [];
    arr.push({ id: i.id, url: i.url, position: i.position });
    imageMap.set(i.post_id, arr);
  });

  return posts.map((p) => ({
    ...p,
    images: imageMap.get(p.id) ?? [],
    like_count: likeCount.get(p.id) ?? 0,
    comment_count: commentCount.get(p.id) ?? 0,
    liked_by_me: mine.has(p.id),
  })) as Post[];
}

export async function fetchComments(postId: string): Promise<PostComment[]> {
  const { data, error } = await supabase
    .from("post_comments")
    .select("id,user_id,content,created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  const list = (data ?? []) as PostComment[];
  if (list.length === 0) return [];
  const userIds = Array.from(new Set(list.map((c) => c.user_id)));
  const { data: profs } = await supabase
    .from("profiles")
    .select("id,name,account_id")
    .in("id", userIds);
  const nameMap = new Map((profs ?? []).map((p) => [p.id, p.name || p.account_id || "用户"]));
  return list.map((c) => ({ ...c, author_name: nameMap.get(c.user_id) ?? "用户" }));
}

export async function uploadPostImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `posts/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("post-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("post-media").getPublicUrl(path);
  return data.publicUrl;
}
