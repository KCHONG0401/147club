import { Languages } from "lucide-react";
import { Button } from "./ui/button";
import { useLang } from "@/contexts/LanguageContext";

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, toggle, t } = useLang();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label={t("lang.aria")}
      title={t("lang.aria")}
      className={className}
    >
      <Languages className="mr-1 size-4" />
      <span className="font-semibold tracking-wide">{lang === "zh" ? "EN" : "中"}</span>
    </Button>
  );
}
