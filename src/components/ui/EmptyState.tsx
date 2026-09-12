import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-[rgb(var(--muted))] flex items-center justify-center mb-4 text-[rgb(var(--muted-fg))]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-medium">{title}</h3>
      {description && (
        <p className="text-sm text-[rgb(var(--muted-fg))] mt-1 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}