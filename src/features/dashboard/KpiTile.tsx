import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  tone?: "neutral" | "positive" | "negative" | "warning";
  onClick?: () => void;
};

const toneStyles = {
  neutral: "",
  positive: "text-green-600 dark:text-green-400",
  negative: "text-red-600 dark:text-red-400",
  warning: "text-amber-600 dark:text-amber-400",
};

export function KpiTile({
  label,
  value,
  sub,
  icon,
  tone = "neutral",
  onClick,
}: Props) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-[rgb(var(--card))] p-4 text-left",
        onClick && "hover:shadow-sm hover:border-[rgb(var(--fg))]/30 transition-all"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-xs text-[rgb(var(--muted-fg))]">{label}</p>
        {icon && <div className="text-[rgb(var(--muted-fg))]">{icon}</div>}
      </div>
      <p className={cn("text-2xl font-semibold", toneStyles[tone])}>{value}</p>
      {sub && (
        <p className="text-xs text-[rgb(var(--muted-fg))] mt-1">{sub}</p>
      )}
    </Comp>
  );
}