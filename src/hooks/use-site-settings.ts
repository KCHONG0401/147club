/**
 * 网站设置 hook — 从 site_settings 表读取键值对，供前台展示使用。
 * 全局缓存 + Realtime 订阅，管理员改动后所有页面自动刷新。
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSetting {
  key: string;
  value: string;
  category: string;
  label: string;
}

type SettingsMap = Record<string, string>;

// 模块级缓存，避免每个组件都查一次
let cache: SettingsMap | null = null;
let inflight: Promise<SettingsMap> | null = null;
const subscribers = new Set<(m: SettingsMap) => void>();
let channelStarted = false;

async function fetchAll(): Promise<SettingsMap> {
  const { data, error } = await supabase.from("site_settings").select("key,value");
  if (error) throw error;
  const map: SettingsMap = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return map;
}

function startRealtime() {
  if (channelStarted || typeof window === "undefined") return;
  channelStarted = true;
  supabase
    .channel("site_settings_changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, async () => {
      const fresh = await fetchAll();
      cache = fresh;
      subscribers.forEach((cb) => cb(fresh));
    })
    .subscribe();
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SettingsMap>(cache ?? {});
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let cancelled = false;
    const cb = (m: SettingsMap) => {
      if (!cancelled) setSettings(m);
    };
    subscribers.add(cb);
    startRealtime();

    if (!cache) {
      inflight ??= fetchAll();
      inflight
        .then((m) => {
          cache = m;
          if (!cancelled) {
            setSettings(m);
            setLoading(false);
          }
          inflight = null;
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      setSettings(cache);
      setLoading(false);
    }

    return () => {
      cancelled = true;
      subscribers.delete(cb);
    };
  }, []);

  function get(key: string, fallback = ""): string {
    return settings[key] ?? fallback;
  }

  return { settings, get, loading };
}

/** 管理员保存：写入数据库，Realtime 会广播给其他组件 */
export async function saveSiteSetting(key: string, value: string) {
  const { error } = await supabase.from("site_settings").update({ value }).eq("key", key);
  if (error) throw error;
  // 立刻更新本地缓存，无需等 Realtime
  if (cache) {
    cache = { ...cache, [key]: value };
    subscribers.forEach((cb) => cb(cache!));
  }
}
