import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { unitApi } from "./api";
import { toast } from "@/lib/toast";
import type { Unit } from "../../../electron/shared/types/unit";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Unit | null;
};

export function UnitFormModal({ open, onClose, onSaved, initial }: Props) {
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setShortName(initial?.shortName ?? "");
      setError(null);
    }
  }, [open, initial]);

  async function handleSave() {
    const n = name.trim();
    const s = shortName.trim();
    if (!n) return setError("Name is required");
    if (!s) return setError("Short name is required");

    setSaving(true);
    setError(null);
    try {
      if (initial) {
        await unitApi.update({ id: initial.id, name: n, shortName: s });
        toast.success("Unit updated");
      } else {
        await unitApi.create({ name: n, shortName: s });
        toast.success("Unit added");
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
      title={initial ? "Edit Unit" : "New Unit"}
      description={
        initial
          ? "Update this unit of measurement."
          : "Add a unit like Piece, Kg, Carton."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            {initial ? "Save Changes" : "Add Unit"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="unit-name">Name *</Label>
          <Input
            id="unit-name"
            autoFocus
            placeholder="e.g. Carton"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="unit-short">Short Name *</Label>
          <Input
            id="unit-short"
            placeholder="e.g. ctn"
            value={shortName}
            onChange={(e) => {
              setShortName(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSave();
            }}
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}