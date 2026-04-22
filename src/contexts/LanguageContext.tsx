import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "zh" | "en";

type Dict = Record<string, { zh: string; en: string }>;

const dict: Dict = {
  // Navbar
  "nav.home": { zh: "首页", en: "Home" },
  "nav.booking": { zh: "球台预订", en: "Booking" },
  "nav.membership": { zh: "会员中心", en: "Membership" },
  "nav.events": { zh: "赛事", en: "Events" },
  "nav.about": { zh: "关于我们", en: "About" },
  "nav.contact": { zh: "联系我们", en: "Contact" },
  "nav.admin": { zh: "管理后台", en: "Admin" },
  "nav.login": { zh: "登录", en: "Sign in" },
  "nav.logout": { zh: "退出", en: "Sign out" },
  "nav.bookNow": { zh: "立即预订", en: "Book Now" },
  "nav.member": { zh: "会员", en: "Member" },
  "nav.signedOut": { zh: "已退出登录", en: "Signed out" },

  // Hero
  "hero.badge": { zh: "Johor Bahru · 顶级斯诺克会所", en: "Johor Bahru · Premier Snooker Club" },
  "hero.titleA": { zh: "专业斯诺克 ·", en: "Pro Snooker ·" },
  "hero.titleB": { zh: "完美一杆", en: "Perfect Cue" },
  "hero.desc": {
    zh: "147 Snooker Club —— Johor Bahru 最顶级斯诺克俱乐部。英式专业球台、Strachan 6811 台呢、专业教练团队，为每一位球友打造世界级体验。",
    en: "147 Snooker Club — Johor Bahru's most premium snooker venue. English championship tables, Strachan 6811 cloth, and pro coaches delivering a world-class experience.",
  },
  "hero.cta1": { zh: "立即预订球台", en: "Book a Table" },
  "hero.cta2": { zh: "加入会员", en: "Join Membership" },
  "hero.stat1": { zh: "专业球台", en: "Pro Tables" },
  "hero.stat2": { zh: "注册会员", en: "Members" },
  "hero.stat3": { zh: "满杆梦想", en: "Max Break Dream" },
  "hero.imgAlt": { zh: "斯诺克球台", en: "Snooker table" },

  // Featured
  "feat.todayKicker": { zh: "Today · 实时状态", en: "Today · Live Status" },
  "feat.todayTitleA": { zh: "今日", en: "Today's " },
  "feat.todayTitleB": { zh: "可用球台", en: "Available Tables" },
  "feat.viewAll": { zh: "查看全部 →", en: "View all →" },
  "feat.available": { zh: "可预订", en: "Available" },
  "feat.occupied": { zh: "占用中", en: "Occupied" },
  "feat.perHour": { zh: "/小时", en: "/hour" },
  "feat.tbl1": { zh: "VIP 包厢 1 号台", en: "VIP Suite #1" },
  "feat.tbl2": { zh: "专业 2 号台", en: "Pro Table #2" },
  "feat.tbl3": { zh: "专业 3 号台", en: "Pro Table #3" },
  "feat.tbl4": { zh: "标准 4 号台", en: "Standard #4" },
  "feat.memberKicker": { zh: "Member Benefits", en: "Member Benefits" },
  "feat.memberTitleA": { zh: "成为", en: "Become a " },
  "feat.memberTitleB": { zh: "147 会员", en: "147 Member" },
  "feat.memberSub": {
    zh: "尊享专属特权,体验真正的高端",
    en: "Exclusive perks, true premium experience",
  },
  "feat.b1.title": { zh: "优先预订", en: "Priority Booking" },
  "feat.b1.desc": {
    zh: "提前 7 天预订专业球台、VIP 包厢,热门时段优先保障",
    en: "Book up to 7 days ahead with priority on prime hours",
  },
  "feat.b1.hl": { zh: "8 折球台费用", en: "20% off table rates" },
  "feat.b2.title": { zh: "赛事特权", en: "Event Perks" },
  "feat.b2.desc": {
    zh: "免费参加月度俱乐部联赛,专业教练 1V1 指导课程",
    en: "Free monthly league entry and 1-on-1 coaching",
  },
  "feat.b2.hl": { zh: "免费教练课 / 月", en: "Free coaching / month" },
  "feat.b3.title": { zh: "积分回馈", en: "Points Rewards" },
  "feat.b3.desc": {
    zh: "消费即积分,可兑换球台时长、品牌球杆周边、限定礼品",
    en: "Earn points on spend, redeem for table time, gear & gifts",
  },
  "feat.b3.hl": { zh: "1:1 积分兑换", en: "1:1 point redemption" },
  "feat.viewPlans": { zh: "查看会员方案", en: "View Plans" },

  // CTA
  "cta.kicker": { zh: "Ready for the perfect cue?", en: "Ready for the perfect cue?" },
  "cta.titleA": { zh: "等你", en: "is waiting" },
  "cta.titleB": { zh: "来打出", en: "for you" },
  "cta.desc1": {
    zh: "每一次出杆,都是对完美的追求。",
    en: "Every shot is a pursuit of perfection.",
  },
  "cta.desc2": {
    zh: "加入我们,一起追逐那满分的 147。",
    en: "Join us and chase the maximum break.",
  },
  "cta.btn1": { zh: "立即预订球台", en: "Book a Table" },
  "cta.btn2": { zh: "注册账号", en: "Create account" },

  // Footer
  "ft.tagline": {
    zh: "Johor Bahru 最顶级斯诺克俱乐部。专业球台、舒适环境、专业教练,为每一位球友提供完美一杆。",
    en: "Johor Bahru's premier snooker club — pro tables, premium ambience, expert coaches.",
  },
  "ft.quick": { zh: "快速链接", en: "Quick Links" },
  "ft.booking": { zh: "球台预订", en: "Booking" },
  "ft.membership": { zh: "会员方案", en: "Membership" },
  "ft.events": { zh: "赛事活动", en: "Events" },
  "ft.coaches": { zh: "教练团队", en: "Coaches" },
  "ft.contact": { zh: "联系我们", en: "Contact" },
  "ft.hours": { zh: "营业时间", en: "Opening Hours" },
  "ft.daily": { zh: "周一至周日", en: "Mon — Sun" },
  "ft.overnight": { zh: "会员专享通宵服务", en: "Members-only overnight service" },
  "ft.rights": { zh: "保留所有权利。", en: "All rights reserved." },
  "ft.crafted": {
    zh: "Crafted with precision · 完美一杆,147",
    en: "Crafted with precision · The Perfect Cue, 147",
  },

  // Lang toggle
  "lang.label": { zh: "EN", en: "中" },
  "lang.aria": { zh: "Switch to English", en: "切换到中文" },
};

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: keyof typeof dict | string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "app.lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("zh");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved === "zh" || saved === "en") setLangState(saved);
    } catch {}
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
    } catch {}
  }

  function toggle() {
    setLang(lang === "zh" ? "en" : "zh");
  }

  function t(key: string) {
    const entry = dict[key];
    if (!entry) return key;
    return entry[lang];
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
