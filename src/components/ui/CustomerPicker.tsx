import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, UserPlus, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Input } from "./Input";
import type { Customer } from "../../../electron/shared/types/customer";

type Props = {
  customers: Customer[];
  selectedId: number | null;
  onSelect: (customer: Customer | null) => void;
  onQuickAdd: () => void;
  placeholder?: string;
};

export function CustomerPicker({
  customers,
  selectedId,
  onSelect,
  onQuickAdd,
  placeholder = "— Walk-in (cash) —",
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => customers.find((c) => c.id === selectedId) ?? null,
    [customers, selectedId]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers.slice(0, 200);
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          (c.contactNumber ?? "").toLowerCase().includes(term)
      )
      .slice(0, 200);
  }, [customers, search]);

  // Reset search + highlight when opening
  useEffect(() => {
    if (open) {
      setSearch("");
      setHighlightIndex(0);
      // Focus the search input after a tick
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  // Click outside → close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function pick(c: Customer | null) {
    onSelect(c);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlightIndex]) pick(filtered[highlightIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div className="relative flex-1" ref={containerRef}>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex-1 h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm text-left",
            "flex items-center justify-between gap-2",
            "hover:bg-[rgb(var(--muted))] transition-colors"
          )}
        >
          <span className="truncate">
            {selected ? (
              <>
                <span className="font-medium">{selected.name}</span>
                {selected.contactNumber && (
                  <span className="text-[rgb(var(--muted-fg))] ml-2">
                    {selected.contactNumber}
                  </span>
                )}
              </>
            ) : (
              <span className="text-[rgb(var(--muted-fg))]">
                {placeholder}
              </span>
            )}
          </span>
          {selected && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                pick(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                  pick(null);
                }
              }}
              className="text-[rgb(var(--muted-fg))] hover:text-[rgb(var(--fg))] p-0.5"
              aria-label="Clear customer"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onQuickAdd}
          className="h-10 w-10 rounded-lg border bg-[rgb(var(--bg))] hover:bg-[rgb(var(--muted))] flex items-center justify-center shrink-0"
          title="Quick add customer"
          aria-label="Quick add customer"
        >
          <UserPlus className="w-4 h-4" />
        </button>
      </div>

      {open && (
        <div className="absolute z-40 top-full left-0 right-0 mt-1 rounded-lg border bg-[rgb(var(--card))] shadow-lg overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[rgb(var(--muted-fg))]" />
              <Input
                ref={inputRef}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlightIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search by name or phone…"
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="p-3 text-sm text-[rgb(var(--muted-fg))] text-center">
                No customers match "{search}"
              </p>
            ) : (
              filtered.map((c, idx) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pick(c)}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm",
                    idx === highlightIndex
                      ? "bg-[rgb(var(--muted))]"
                      : "hover:bg-[rgb(var(--muted))]",
                    c.id === selectedId && "font-medium"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{c.name}</div>
                    {c.contactNumber && (
                      <div className="text-xs text-[rgb(var(--muted-fg))]">
                        {c.contactNumber}
                      </div>
                    )}
                  </div>
                  {c.cachedOutstanding > 0 && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 shrink-0">
                      Due Rs {(c.cachedOutstanding / 100).toFixed(0)}
                    </span>
                  )}
                  {c.id === selectedId && (
                    <Check className="w-4 h-4 text-[rgb(var(--fg))] shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}