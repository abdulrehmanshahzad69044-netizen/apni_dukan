import { useState } from "react";
import { ArrowRightLeft, Plus } from "lucide-react";
import { Page } from "@/components/ui/Page";
import { Fab } from "@/components/ui/Fab";
import { EmptyState } from "@/components/ui/EmptyState";
import { CenterSpinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ConversionRow } from "./ConversionRow";
import { ConversionFormModal } from "./ConversionFormModal";
import { useUnits, useUnitConversions } from "./hooks";
import { unitConversionApi } from "./api";
import { toast } from "@/lib/toast";
import type { UnitConversion } from "../../../electron/shared/types/unit";

export function UnitConversionsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UnitConversion | null>(null);
  const [deleting, setDeleting] = useState<UnitConversion | null>(null);

  const { data: conversions, loading, reload } = useUnitConversions();
  const { data: units } = useUnits();

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(c: UnitConversion) {
    setEditing(c);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await unitConversionApi.remove(deleting.id);
      toast.success("Conversion deleted");
      await reload();
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to delete");
    }
  }

  const noUnits = units.length < 2;

  return (
    <>
      <Page
        title="Unit Conversions"
        description="Define how units relate — e.g. 1 Carton = 12 Packs."
      >
        {loading ? (
          <CenterSpinner />
        ) : noUnits ? (
          <EmptyState
            icon={<ArrowRightLeft className="w-6 h-6" />}
            title="Add at least 2 units first"
            description="You need at least two units (e.g. Carton and Pack) to create a conversion."
          />
        ) : conversions.length === 0 ? (
          <EmptyState
            icon={<ArrowRightLeft className="w-6 h-6" />}
            title="No conversions yet"
            description="Create a conversion to relate two units."
            action={
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-[rgb(var(--fg))] text-[rgb(var(--bg))] text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Conversion
              </button>
            }
          />
        ) : (
          <div className="space-y-2">
            {conversions.map((c) => (
              <ConversionRow
                key={c.id}
                conversion={c}
                onEdit={() => openEdit(c)}
                onDelete={() => setDeleting(c)}
              />
            ))}
          </div>
        )}
      </Page>

      {!noUnits && <Fab onClick={openCreate} label="Add Conversion" />}

      <ConversionFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
        units={units}
        initial={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete conversion?"
        description={
          deleting
            ? `This will remove the conversion between ${deleting.fromUnitName} and ${deleting.toUnitName}.`
            : ""
        }
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}