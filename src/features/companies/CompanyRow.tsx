import { Phone, Pencil, Trash2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Company } from "../../../electron/shared/types/company";

type Props = {
  company: Company;
  onEdit: () => void;
  onDelete: () => void;
};

export function CompanyRow({ company, onEdit, onDelete }: Props) {
  return (
    <div className="rounded-xl border bg-[rgb(var(--card))] p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
      <div className="w-10 h-10 rounded-lg bg-[rgb(var(--muted))] flex items-center justify-center shrink-0">
        <Building2 className="w-5 h-5 text-[rgb(var(--muted-fg))]" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">{company.name}</h3>
        <div className="flex items-center gap-4 mt-1 text-xs text-[rgb(var(--muted-fg))]">
          {company.contactNumber ? (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {company.contactNumber}
            </span>
          ) : (
            <span className="italic">No contact info</span>
          )}
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