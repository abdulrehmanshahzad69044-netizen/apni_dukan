import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PageProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Page({
  title,
  description,
  actions,
  children,
  className,
}: PageProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 animate-slide-up">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-[rgb(var(--muted-fg))] mt-1">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      <div className="flex-1 overflow-y-auto px-6 pb-24 animate-slide-up">
        {children}
      </div>
    </div>
  );
}