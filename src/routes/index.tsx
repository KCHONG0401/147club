import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { FeaturedSection } from "@/components/FeaturedSection";
import { PostsFeed } from "@/components/PostsFeed";
import { CTASection } from "@/components/CTASection";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "147 Snooker Club — Johor Bahru 最顶级斯诺克俱乐部" },
      {
        name: "description",
        content:
          "147 Snooker Club 位于 Johor Bahru，提供 12 张专业斯诺克球台、VIP 包厢、专业教练团队和会员俱乐部。立即在线预订，体验完美一杆。",
      },
      { property: "og:title", content: "147 Snooker Club — 完美一杆" },
      { property: "og:description", content: "Johor Bahru 最顶级斯诺克俱乐部，立即在线预订球台。" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <FeaturedSection />
        <PostsFeed />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
