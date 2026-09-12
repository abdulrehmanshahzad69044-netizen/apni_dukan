import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { unitConversionApi } from "./api";
import { toast } from "@/lib/toast";
import type {
  Unit,
  UnitConversion,
} from "../../../electron/shared/types/unit";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  units: Unit[];
  initial?: UnitConversion | null;
};

export function ConversionFormModal({
  open,
  onClose,
  onSaved,
  units,
  initial,
}: Props) {
  const isEdit = !!initial;
  const [fromUnitId, setFromUnitId] = useState<number | "">("");
  const [toUnitId, setToUnitId] = useState<number | "">("");
  const [factor, setFactor] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (initial) {
        setFromUnitId(initial.fromUnitId);
        setToUnitId(initial.toUnitId);
        setFactor(String(initial.factor / 1000));
      } else {
        setFromUnitId("");
        setToUnitId("");
        setFactor("");
      }
      setError(null);
    }
  }, [open, initial]);

  async function handleSave() {
    const f = Number(factor);
    if (!Number.isFinite(f) || f <= 0) {
      return setError("Factor must be a positive number");
    }

    setSaving(true);
    setError(null);
    try {
      if (isEdit && initial) {
        await unitConversionApi.update({ id: initial.id, factor: f });
        toast.success("Conversion updated");
      } else {
        if (fromUnitId === "" || toUnitId === "") {
          return setError("Select both units");
        }
        if (fromUnitId === toUnitId) {
          return setError("From and To units must be different");
        }
        await unitConversionApi.create({
          fromUnitId: Number(fromUnitId),
          toUnitId: Number(toUnitId),
          factor: f,
        });
        toast.success("Conversion added");
      }
      onSaved();
      onClose();
    } catch (e) {
      const msg = (e as Error).message ?? "Failed to save";
      toast.error(msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Conversion" : "New Unit Conversion"}
      description={
        isEdit
          ? "Update the conversion factor."
          : "Define how one unit relates to another."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            {isEdit ? "Save Changes" : "Add Conversion"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* FROM unit */}
        <div className="space-y-1.5">
          <Label>From Unit *</Label>
          <select
            disabled={isEdit}
            value={fromUnitId}
            onChange={(e) =>
              setFromUnitId(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm disabled:opacity-60"
          >
            <option value="">— Select unit —</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.shortName})
              </option>
            ))}
          </select>
        </div>

        {/* Factor */}
        <div className="space-y-1.5">
          <Label htmlFor="conv-factor">Equals (Factor) *</Label>
          <Input
            id="conv-factor"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            placeholder="e.g. 12"
            value={factor}
            onChange={(e) => {
              setFactor(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSave();
            }}
          />
        </div>

        {/* TO unit */}
        <div className="space-y-1.5">
          <Label>To Unit *</Label>
          <select
            disabled={isEdit}
            value={toUnitId}
            onChange={(e) =>
              setToUnitId(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm disabled:opacity-60"
          >
            <option value="">— Select unit —</option>
            {units.map((u) => (
              <option key={u.id} value={u.id} disabled={u.id === fromUnitId}>
                {u.name} ({u.shortName})
              </option>
            ))}
          </select>
        </div>

        {/* Live preview */}
        {fromUnitId !== "" && toUnitId !== "" && factor && !error && (
          <div className="rounded-lg bg-[rgb(var(--muted))] p-3 text-sm">
            <span className="text-[rgb(var(--muted-fg))]">Preview: </span>
            <span className="font-medium">
              1 {units.find((u) => u.id === fromUnitId)?.name} = {factor}{" "}
              {units.find((u) => u.id === toUnitId)?.name}
            </span>
          </div>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}