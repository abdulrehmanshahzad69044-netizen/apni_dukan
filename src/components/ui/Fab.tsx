import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";

type FabProps = {
  onClick: () => void;
  label?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
};

export function Fab({ onClick, label, icon: Icon = Plus, className }: FabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-40",
        "flex items-center gap-2",
        "h-14 px-5 rounded-full",
        "bg-[rgb(var(--fg))] text-[rgb(var(--bg))]",
        "shadow-[0_8px_24px_-4px_rgb(0_0_0_/_0.3)]",
        "hover:shadow-[0_12px_32px_-6px_rgb(0_0_0_/_0.35)]",
        "hover:scale-[1.02] active:scale-95",
        "transition-all duration-200 ease-out",
        "animate-scale-in",
        label ? "min-w-[3.5rem]" : "w-14 justify-center",
        className
      )}
      aria-label={label ?? "Action"}
    >
      <Icon className="w-5 h-5" />
      {label && <span className="font-medium">{label}</span>}
    </button>
  );
}