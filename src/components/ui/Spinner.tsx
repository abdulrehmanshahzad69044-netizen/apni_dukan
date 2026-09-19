import { cn } from "@/lib/cn";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-5 h-5 border-2 border-[rgb(var(--muted-fg))]/30 border-t-[rgb(var(--fg))] rounded-full animate-spin",
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

/** Skeleton loader row — use instead of spinner for list pages */
export function RowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border bg-[rgb(var(--card))] p-4 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg skeleton shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded skeleton" />
            <div className="h-3 w-1/2 rounded skeleton" />
          </div>
          <div className="h-8 w-20 rounded skeleton shrink-0" />
        </div>
      ))}
    </div>
  );
}