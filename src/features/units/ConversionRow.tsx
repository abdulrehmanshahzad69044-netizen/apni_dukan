import { ArrowRight, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { UnitConversion } from "../../../electron/shared/types/unit";

type Props = {
  conversion: UnitConversion;
  onEdit: () => void;
  onDelete: () => void;
};

export function ConversionRow({ conversion, onEdit, onDelete }: Props) {
  // factor is stored as milli-factor; display as normal number
  const displayFactor = conversion.factor / 1000;

  return (
    <div className="rounded-xl border bg-[rgb(var(--card))] p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm">
            <span className="font-medium">1 {conversion.fromUnitName}</span>
            <span className="text-[rgb(var(--muted-fg))]"> ({conversion.fromUnitShortName})</span>
          </span>

          <span className="text-[rgb(var(--muted-fg))]">=</span>

          <span className="font-semibold text-base">
            {displayFactor}
          </span>

          <span className="text-sm">
            <span className="font-medium">{conversion.toUnitName}</span>
            <span className="text-[rgb(var(--muted-fg))]"> ({conversion.toUnitShortName})</span>
          </span>

          <ArrowRight className="w-3.5 h-3.5 text-[rgb(var(--muted-fg))]" />
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit">
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          aria-label="Delete"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </Button>
      </div>
    </div>
  );
}