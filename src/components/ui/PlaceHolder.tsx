import { Construction } from "lucide-react";

export function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
      <div className="w-16 h-16 rounded-2xl bg-[rgb(var(--muted))] flex items-center justify-center mb-4">
        <Construction className="w-7 h-7 text-[rgb(var(--muted-fg))]" />
      </div>
      <h2 className="text-lg font-medium">{title}</h2>
      <p className="text-sm text-[rgb(var(--muted-fg))] mt-1">
        This module will be built in a later phase.
      </p>
    </div>
  );
}