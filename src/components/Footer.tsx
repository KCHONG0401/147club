import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Facebook, Instagram, MapPin, Phone } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function Footer() {
  const { t } = useLang();
  const { get } = useSiteSettings();

  const address = get("contact_address", "Jalan Tebrau, 80300 Johor Bahru, Malaysia");
  const phone = get("contact_phone", "+60 7-147 1470");
  const hours = get("business_hours", "12:00 — 02:00");
  const facebook = get("contact_facebook", "#");
  const instagram = get("contact_instagram", "#");

  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-muted-foreground">{t("ft.tagline")}</p>
          </div>

          <div>
            <h4 className="mb-4 font-display text-sm font-semibold tracking-widest text-primary">
              {t("ft.quick")}
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/booking" className="hover:text-primary">
                  {t("ft.booking")}
                </Link>
              </li>
              <li>
                <Link to="/membership" className="hover:text-primary">
                  {t("ft.membership")}
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-primary">
                  {t("ft.events")}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary">
                  {t("ft.coaches")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display text-sm font-semibold tracking-widest text-primary">
              {t("ft.contact")}
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-primary" />
                <span>{phone}</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display text-sm font-semibold tracking-widest text-primary">
              {t("ft.hours")}
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>{t("ft.daily")}</li>
              <li className="text-foreground">{hours}</li>
              <li className="pt-2">{t("ft.overnight")}</li>
            </ul>
            <div className="mt-4 flex gap-3">
              <a
                href={facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border p-2 text-muted-foreground transition-smooth hover:border-primary hover:text-primary"
              >
                <Facebook className="size-4" />
              </a>
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border p-2 text-muted-foreground transition-smooth hover:border-primary hover:text-primary"
              >
                <Instagram className="size-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground md:flex-row">
          <p>
            © {new Date().getFullYear()} 147 Snooker Club. {t("ft.rights")}
          </p>
          <p>{t("ft.crafted")}</p>
        </div>
      </div>
    </footer>
  );
}
