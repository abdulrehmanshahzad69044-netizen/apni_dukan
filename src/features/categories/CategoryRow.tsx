import { Tag, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Category } from "../../../electron/shared/types/category";

type Props = {
  category: Category;
  onEdit: () => void;
  onDelete: () => void;
};

export function CategoryRow({ category, onEdit, onDelete }: Props) {
  return (
    <div className="rounded-xl border bg-[rgb(var(--card))] p-4 flex items-center gap-4 transition-all duration-200 ease-out hover:shadow-md hover:-translate-y-[1px] hover:border-[rgb(var(--fg))]/15">
      <div className="w-10 h-10 rounded-lg bg-[rgb(var(--muted))] flex items-center justify-center shrink-0">
        <Tag className="w-5 h-5 text-[rgb(var(--muted-fg))]" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">{category.name}</h3>
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