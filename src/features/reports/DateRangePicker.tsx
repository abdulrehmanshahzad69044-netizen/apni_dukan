import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/cn";
import { toDateInputValue } from "@/lib/format";

export type RangePreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "custom";

type Range = { from: string; to: string }; // yyyy-mm-dd

type Props = {
  from: string;
  to: string;
  onChange: (from: string, to: string, preset: RangePreset) => void;
  preset: RangePreset;
};

export function getPresetRange(preset: RangePreset): Range {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const fmt = (d: Date) => toDateInputValue(d);

  switch (preset) {
    case "today": {
      const t = new Date(y, m, now.getDate());
      return { from: fmt(t), to: fmt(t) };
    }
    case "yesterday": {
      const yd = new Date(y, m, now.getDate() - 1);
      return { from: fmt(yd), to: fmt(yd) };
    }
    case "this_week": {
      const day = now.getDay(); // 0 = Sun
      const start = new Date(y, m, now.getDate() - day);
      return { from: fmt(start), to: fmt(now) };
    }
    case "this_month": {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0);
      return { from: fmt(start), to: fmt(end) };
    }
    case "last_month": {
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      return { from: fmt(start), to: fmt(end) };
    }
    case "this_year": {
      const start = new Date(y, 0, 1);
      const end = new Date(y, 11, 31);
      return { from: fmt(start), to: fmt(end) };
    }
    default:
      return { from: fmt(now), to: fmt(now) };
  }
}

const PRESETS: { key: RangePreset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "this_week", label: "This Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "this_year", label: "This Year" },
];

export function DateRangePicker({ from, to, onChange, preset }: Props) {
  const [showCustom, setShowCustom] = useState(preset === "custom");

  function pick(p: RangePreset) {
    setShowCustom(false);
    const r = getPresetRange(p);
    onChange(r.from, r.to, p);
  }

  function pickCustom() {
    setShowCustom(true);
    onChange(from, to, "custom");
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => pick(p.key)}
            className={cn(
              "px-2.5 py-1.5 text-xs rounded-md border transition-colors",
              preset === p.key
                ? "bg-[rgb(var(--fg))] text-[rgb(var(--bg))] border-transparent"
                : "hover:bg-[rgb(var(--muted))]"
            )}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={pickCustom}
          className={cn(
            "px-2.5 py-1.5 text-xs rounded-md border transition-colors",
            preset === "custom"
              ? "bg-[rgb(var(--fg))] text-[rgb(var(--bg))] border-transparent"
              : "hover:bg-[rgb(var(--muted))]"
          )}
        >
          Custom
        </button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-2 ml-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-[rgb(var(--muted-fg))]">From</Label>
            <Input
              type="date"
              value={from}
              onChange={(e) => onChange(e.target.value, to, "custom")}
              className="h-8 text-xs w-[130px]"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-[rgb(var(--muted-fg))]">To</Label>
            <Input
              type="date"
              value={to}
              onChange={(e) => onChange(from, e.target.value, "custom")}
              className="h-8 text-xs w-[130px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}