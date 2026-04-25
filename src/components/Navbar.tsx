import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, LogOut, Menu, Star, User, X } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { LanguageToggle } from "./LanguageToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, profile, isAdmin, signOut } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const navItems = [
    { to: "/", label: t("nav.home") },
    { to: "/booking", label: t("nav.booking") },
    { to: "/membership", label: t("nav.membership") },
    { to: "/events", label: t("nav.events") },
    { to: "/about", label: t("nav.about") },
    { to: "/contact", label: t("nav.contact") },
  ] as const;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleSignOut() {
    await signOut();
    toast.success(t("nav.signedOut"));
    navigate({ to: "/" });
    setOpen(false);
  }

  const displayName = profile?.name || user?.email?.split("@")[0] || t("nav.member");

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-smooth ${
        scrolled ? "border-b border-border/60 bg-background/80 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:text-primary"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className="ml-1 inline-flex items-center gap-1 rounded-md border border-gold/40 bg-gold/10 px-3 py-2 text-sm font-medium text-gold transition-smooth hover:bg-gold/20"
            >
              <LayoutDashboard className="size-4" />
              {t("nav.admin")}
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageToggle />
          {user ? (
            <>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                {isAdmin && (
                  <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gold">
                    Admin
                  </span>
                )}
                {displayName}
                {!isAdmin && profile && (
                  <span className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    <Star className="size-3 fill-primary" />
                    {profile.points}
                  </span>
                )}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-1 size-4" /> {t("nav.logout")}
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">
                <User className="mr-1" /> {t("nav.login")}
              </Link>
            </Button>
          )}
          <Button asChild variant="hero" size="sm">
            <Link to="/booking">{t("nav.bookNow")}</Link>
          </Button>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <LanguageToggle />
          <button
            className="rounded-md p-2 text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label="menu"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background/95 backdrop-blur-xl lg:hidden">
          <nav className="flex flex-col px-4 py-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-primary"
                activeProps={{ className: "text-primary bg-accent" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="mt-1 inline-flex items-center gap-2 rounded-md border border-gold/40 bg-gold/10 px-3 py-3 text-sm font-medium text-gold"
              >
                <LayoutDashboard className="size-4" /> {t("nav.admin")}
              </Link>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/60 pt-3">
              {user ? (
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="mr-1 size-4" /> {t("nav.logout")}
                </Button>
              ) : (
                <Button asChild variant="outline" size="sm" onClick={() => setOpen(false)}>
                  <Link to="/login">{t("nav.login")}</Link>
                </Button>
              )}
              <Button asChild variant="hero" size="sm" onClick={() => setOpen(false)}>
                <Link to="/booking">{t("nav.bookNow")}</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
