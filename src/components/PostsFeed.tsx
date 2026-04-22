/**
 * 首页「最新动态」展示区
 * - 任何人可浏览图文 + 视频
 * - 仅登录会员可点赞 / 评论
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, Loader2, MessageCircle, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { fetchComments, fetchPosts, toEmbedUrl, type Post, type PostComment } from "@/lib/posts";

export function PostsFeed() {
  const { user, isAdmin } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, PostComment[]>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  async function reload() {
    setLoading(true);
    try {
      const list = await fetchPosts(user?.id ?? null);
      setPosts(list);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function toggleLike(p: Post) {
    if (!user) {
      toast.info("请先登录会员账号");
      return;
    }
    setBusy((b) => ({ ...b, [`like-${p.id}`]: true }));
    if (p.liked_by_me) {
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", p.id)
        .eq("user_id", user.id);
      if (error) toast.error(error.message);
      else
        setPosts((prev) =>
          prev.map((x) =>
            x.id === p.id ? { ...x, liked_by_me: false, like_count: x.like_count - 1 } : x,
          ),
        );
    } else {
      const { error } = await supabase
        .from("post_likes")
        .insert({ post_id: p.id, user_id: user.id });
      if (error) toast.error(error.message);
      else
        setPosts((prev) =>
          prev.map((x) =>
            x.id === p.id ? { ...x, liked_by_me: true, like_count: x.like_count + 1 } : x,
          ),
        );
    }
    setBusy((b) => ({ ...b, [`like-${p.id}`]: false }));
  }

  async function toggleComments(p: Post) {
    const open = !openComments[p.id];
    setOpenComments((s) => ({ ...s, [p.id]: open }));
    if (open && !commentsMap[p.id]) {
      try {
        const list = await fetchComments(p.id);
        setCommentsMap((s) => ({ ...s, [p.id]: list }));
      } catch (e) {
        toast.error((e as Error).message);
      }
    }
  }

  async function submitComment(p: Post) {
    if (!user) {
      toast.info("请先登录会员账号");
      return;
    }
    const text = (draft[p.id] ?? "").trim();
    if (!text) return;
    if (text.length > 500) {
      toast.error("评论最多 500 字");
      return;
    }
    setBusy((b) => ({ ...b, [`c-${p.id}`]: true }));
    const { data, error } = await supabase
      .from("post_comments")
      .insert({ post_id: p.id, user_id: user.id, content: text })
      .select("id,user_id,content,created_at")
      .single();
    setBusy((b) => ({ ...b, [`c-${p.id}`]: false }));
    if (error) {
      toast.error(error.message);
      return;
    }
    const newC: PostComment = { ...(data as PostComment), author_name: "你" };
    setCommentsMap((s) => ({ ...s, [p.id]: [newC, ...(s[p.id] ?? [])] }));
    setPosts((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, comment_count: x.comment_count + 1 } : x)),
    );
    setDraft((d) => ({ ...d, [p.id]: "" }));
  }

  async function deleteComment(p: Post, c: PostComment) {
    if (!confirm("删除该评论？")) return;
    const { error } = await supabase.from("post_comments").delete().eq("id", c.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCommentsMap((s) => ({ ...s, [p.id]: (s[p.id] ?? []).filter((x) => x.id !== c.id) }));
    setPosts((prev) =>
      prev.map((x) =>
        x.id === p.id ? { ...x, comment_count: Math.max(0, x.comment_count - 1) } : x,
      ),
    );
  }

  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-5xl px-4 lg:px-8">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Latest Updates
          </p>
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            最新<span className="text-gradient-neon">动态</span>
          </h2>
          <p className="mt-3 text-muted-foreground">赛事、影片、活动公告 — 第一时间看见</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            暂时还没有发布的内容，敬请期待 ✨
          </Card>
        ) : (
          <div className="space-y-6">
            {posts.map((p) => {
              const embed = toEmbedUrl(p.video_url);
              const open = !!openComments[p.id];
              return (
                <Card
                  key={p.id}
                  className="overflow-hidden border border-border/60 bg-gradient-card p-0 transition-smooth hover:border-primary/40"
                >
                  <div className="p-6">
                    <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(p.published_at), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </span>
                    </div>
                    <h3 className="font-display text-2xl font-bold">{p.title}</h3>
                    {p.content && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {p.content}
                      </p>
                    )}
                  </div>

                  {embed && (
                    <div className="aspect-video w-full bg-black">
                      <iframe
                        src={embed}
                        title={p.title}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}

                  {p.images.length > 0 && (
                    <div
                      className={`grid gap-1 ${
                        p.images.length === 1
                          ? "grid-cols-1"
                          : p.images.length === 2
                            ? "grid-cols-2"
                            : "grid-cols-2 sm:grid-cols-3"
                      }`}
                    >
                      {p.images.map((img) => (
                        <a
                          key={img.id}
                          href={img.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block aspect-square overflow-hidden bg-muted"
                        >
                          <img
                            src={img.url}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform hover:scale-105"
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 border-t border-border/40 px-6 py-3">
                    <button
                      onClick={() => toggleLike(p)}
                      disabled={busy[`like-${p.id}`]}
                      className={`inline-flex items-center gap-1.5 text-sm transition-colors ${
                        p.liked_by_me
                          ? "text-destructive"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Heart className={`size-5 ${p.liked_by_me ? "fill-current" : ""}`} />
                      <span className="font-medium">{p.like_count}</span>
                    </button>
                    <button
                      onClick={() => toggleComments(p)}
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <MessageCircle className="size-5" />
                      <span className="font-medium">{p.comment_count}</span>
                    </button>
                    {!user && (
                      <Link
                        to="/login"
                        className="ml-auto text-xs text-primary underline-offset-4 hover:underline"
                      >
                        登录后参与互动 →
                      </Link>
                    )}
                  </div>

                  {open && (
                    <div className="border-t border-border/40 bg-background/40 px-6 py-4">
                      {user ? (
                        <div className="mb-4 flex gap-2">
                          <Textarea
                            value={draft[p.id] ?? ""}
                            onChange={(e) => setDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                            placeholder="留下你的评论…"
                            rows={2}
                            maxLength={500}
                            className="resize-none"
                          />
                          <Button
                            size="sm"
                            onClick={() => submitComment(p)}
                            disabled={busy[`c-${p.id}`] || !(draft[p.id] ?? "").trim()}
                          >
                            {busy[`c-${p.id}`] ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Send className="size-4" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <p className="mb-4 text-xs text-muted-foreground">
                          仅会员可评论，
                          <Link to="/login" className="text-primary hover:underline">
                            前往登录
                          </Link>
                        </p>
                      )}
                      <div className="space-y-3">
                        {(commentsMap[p.id] ?? []).length === 0 ? (
                          <p className="text-center text-xs text-muted-foreground">还没有评论</p>
                        ) : (
                          (commentsMap[p.id] ?? []).map((c) => (
                            <div
                              key={c.id}
                              className="group flex items-start justify-between gap-2 rounded-md border border-border/40 bg-card/60 p-3"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="font-medium text-foreground">
                                    {c.author_name}
                                  </span>
                                  <span>·</span>
                                  <span>
                                    {formatDistanceToNow(new Date(c.created_at), {
                                      addSuffix: true,
                                      locale: zhCN,
                                    })}
                                  </span>
                                </div>
                                <p className="mt-1 whitespace-pre-wrap text-sm">{c.content}</p>
                              </div>
                              {(isAdmin || c.user_id === user?.id) && (
                                <button
                                  onClick={() => deleteComment(p, c)}
                                  className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
