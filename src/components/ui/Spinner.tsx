import { cn } from "@/lib/cn";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-5 h-5 border-2 border-[rgb(var(--muted-fg))] border-t-[rgb(var(--fg))] rounded-full animate-spin",
        className
      )}
    />
  );
}

export function CenterSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-16", className)}>
      <Spinner />
    </div>
  );
}