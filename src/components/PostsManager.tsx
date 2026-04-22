/**
 * 管理员「内容发布」面板：创建/删除帖子，上传图片，外链视频
 * 仅拥有 can_publish_posts 权限的管理员可见
 */
import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Loader2, Megaphone, Plus, Trash2, Video, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { uploadPostImage, type Post } from "@/lib/posts";
import { format } from "date-fns";

interface AdminPost {
  id: string;
  title: string;
  content: string;
  video_url: string | null;
  is_published: boolean;
  published_at: string;
  images: { id: string; url: string }[];
}

export function PostsManager() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);

  // 表单
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [published, setPublished] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const { data: ps } = await supabase
      .from("posts")
      .select("id,title,content,video_url,is_published,published_at")
      .order("published_at", { ascending: false });
    const list = (ps ?? []) as AdminPost[];
    if (list.length) {
      const ids = list.map((p) => p.id);
      const { data: imgs } = await supabase
        .from("post_images")
        .select("id,url,post_id,position")
        .in("post_id", ids)
        .order("position");
      const map = new Map<string, { id: string; url: string }[]>();
      (imgs ?? []).forEach((i) => {
        const arr = map.get(i.post_id) ?? [];
        arr.push({ id: i.id, url: i.url });
        map.set(i.post_id, arr);
      });
      list.forEach((p) => (p.images = map.get(p.id) ?? []));
    }
    setPosts(list);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...list].slice(0, 6));
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) {
      toast.error("请填写标题");
      return;
    }
    setSubmitting(true);
    try {
      // 1) 上传图片
      const urls: string[] = [];
      for (const f of files) {
        if (f.size > 5 * 1024 * 1024) {
          toast.warning(`已跳过过大文件（>5MB）：${f.name}`);
          continue;
        }
        urls.push(await uploadPostImage(f));
      }

      // 2) 创建帖子
      const { data: post, error } = await supabase
        .from("posts")
        .insert({
          author_id: user.id,
          title: title.trim(),
          content: content.trim(),
          video_url: videoUrl.trim() || null,
          is_published: published,
        })
        .select("id")
        .single();
      if (error) throw error;

      // 3) 关联图片
      if (urls.length && post) {
        const rows = urls.map((url, i) => ({ post_id: post.id, url, position: i }));
        const { error: imgErr } = await supabase.from("post_images").insert(rows);
        if (imgErr) throw imgErr;
      }

      toast.success("已发布");
      setTitle("");
      setContent("");
      setVideoUrl("");
      setFiles([]);
      setPublished(true);
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePublish(p: AdminPost) {
    const { error } = await supabase
      .from("posts")
      .update({ is_published: !p.is_published })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      toast.success(p.is_published ? "已下架" : "已上架");
      setPosts((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, is_published: !p.is_published } : x)),
      );
    }
  }

  async function handleDelete(p: AdminPost) {
    if (!confirm(`确定删除「${p.title}」？此操作无法撤销。`)) return;
    const { error } = await supabase.from("posts").delete().eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      toast.success("已删除");
      setPosts((prev) => prev.filter((x) => x.id !== p.id));
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <Megaphone className="size-5 text-primary" />
        <h2 className="text-xl font-bold">内容发布</h2>
        <span className="text-xs text-muted-foreground">在首页「最新动态」展示</span>
      </div>

      {/* 创建表单 */}
      <Card className="mb-6 border-primary/30 bg-primary/5 p-5">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">标题 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="例：本周末赛事公告"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">正文</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="支持多行文字。详细说明…"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-xs">
                <Video className="size-3" /> 视频链接（YouTube / Vimeo，选填）
              </Label>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-xs">
                <ImageIcon className="size-3" /> 图片（最多 6 张，每张 ≤ 5MB）
              </Label>
              <Input ref={fileRef} type="file" accept="image/*" multiple onChange={onPickFiles} />
            </div>
          </div>

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="relative h-20 w-20 overflow-hidden rounded-md border border-border/60"
                >
                  <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute right-0.5 top-0.5 rounded-full bg-background/80 p-0.5 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={published} onCheckedChange={setPublished} />
              立即发布（关闭则保存为草稿）
            </label>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : (
                <Plus className="mr-1 size-4" />
              )}
              发布
            </Button>
          </div>
        </form>
      </Card>

      {/* 帖子列表 */}
      {loading ? (
        <Card className="p-8 text-center">
          <Loader2 className="mx-auto size-6 animate-spin text-primary" />
        </Card>
      ) : posts.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          暂无内容，发布第一条吧 ✨
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <Card key={p.id} className="border border-border/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-bold">{p.title}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        p.is_published
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.is_published ? "已发布" : "草稿"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(new Date(p.published_at), "yyyy-MM-dd HH:mm")}
                  </p>
                  {p.content && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.content}</p>
                  )}
                  {(p.images.length > 0 || p.video_url) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {p.images.slice(0, 4).map((i) => (
                        <img
                          key={i.id}
                          src={i.url}
                          alt=""
                          className="h-12 w-12 rounded object-cover"
                        />
                      ))}
                      {p.video_url && (
                        <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                          <Video className="size-3" /> 视频
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => togglePublish(p)}>
                    {p.is_published ? "下架" : "上架"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(p)}
                  >
                    <Trash2 className="mr-1 size-4" /> 删除
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
