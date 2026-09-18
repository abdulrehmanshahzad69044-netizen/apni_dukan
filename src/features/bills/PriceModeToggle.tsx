import { Tag } from "lucide-react";
import { cn } from "@/lib/cn";

export type PriceMode = "retail" | "wholesale";

type Props = {
  mode: PriceMode;
  onChange: (mode: PriceMode) => void;
  /** If wholesale is not available for this variant, disable switching to it */
  wholesaleAvailable: boolean;
};

export function PriceModeToggle({
  mode,
  onChange,
  wholesaleAvailable,
}: Props) {
  const canSwitch = wholesaleAvailable;
  const isWholesale = mode === "wholesale";

  return (
    <button
      type="button"
      disabled={!canSwitch && mode === "retail"}
      title={
        !canSwitch
          ? "No wholesale price on this batch"
          : isWholesale
          ? "Switch to Retail"
          : "Switch to Wholesale"
      }
      onClick={() => {
        if (!canSwitch && !isWholesale) return;
        onChange(isWholesale ? "retail" : "wholesale");
      }}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide transition-colors",
        isWholesale
          ? "bg-purple-500/15 text-purple-700 dark:text-purple-400 hover:bg-purple-500/25"
          : "bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/25",
        !canSwitch && mode === "retail" && "opacity-50 cursor-not-allowed"
      )}
    >
      <Tag className="w-2.5 h-2.5" />
      {isWholesale ? "Wholesale" : "Retail"}
    </button>
  );
}