import { useMemo, useState } from "react";
import { Search, Ruler, Plus } from "lucide-react";
import { Page } from "@/components/ui/Page";
import { Fab } from "@/components/ui/Fab";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { CenterSpinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { UnitRow } from "./UnitRow";
import { UnitFormModal } from "./UnitFormModal";
import { useUnits } from "./hooks";
import { unitApi } from "./api";
import { toast } from "@/lib/toast";
import type { Unit } from "../../../electron/shared/types/unit";

export function UnitsPage() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [deleting, setDeleting] = useState<Unit | null>(null);

  const query = useMemo(
    () => ({ search: search.trim() || undefined }),
    [search]
  );
  const { data, loading, reload } = useUnits(query);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(u: Unit) {
    setEditing(u);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await unitApi.remove(deleting.id);
      toast.success("Unit deleted");
      await reload();
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to delete");
    }
  }

  return (
    <>
      <Page
        title="Units"
        description="Units of measurement (Piece, Kg, Carton, etc.)."
        actions={
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
            <Input
              placeholder="Search units…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        }
      >
        {loading ? (
          <CenterSpinner />
        ) : data.length === 0 ? (
          <EmptyState
            icon={<Ruler className="w-6 h-6" />}
            title={search ? "No units match" : "No units yet"}
            description={
              search
                ? "Try a different search term."
                : "Add units like Piece, Kg, or Carton."
            }
            action={
              !search && (
                <button
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-[rgb(var(--fg))] text-[rgb(var(--bg))] text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Unit
                </button>
              )
            }
          />
        ) : (
          <div className="space-y-2">
            {data.map((u) => (
              <UnitRow
                key={u.id}
                unit={u}
                onEdit={() => openEdit(u)}
                onDelete={() => setDeleting(u)}
              />
            ))}
          </div>
        )}
      </Page>

      <Fab onClick={openCreate} label="Add Unit" />

      <UnitFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
        initial={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete unit?"
        description={
          deleting
            ? `"${deleting.name}" will be hidden. Any conversions using it will be removed.`
            : ""
        }
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}