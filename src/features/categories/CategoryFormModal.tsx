import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { categoryApi } from "./api";
import { toast } from "@/lib/toast";
import type { Category } from "../../../electron/shared/types/category";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Category | null;
};

export function CategoryFormModal({ open, onClose, onSaved, initial }: Props) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setNameError(null);
    }
  }, [open, initial]);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Name is required");
      return;
    }
    setSaving(true);
    try {
      if (initial) {
        await categoryApi.update({ id: initial.id, name: trimmed });
        toast.success("Category updated");
      } else {
        await categoryApi.create({ name: trimmed });
        toast.success("Category added");
      }
      onSaved();
      onClose();
    } catch (e) {
      const msg = (e as Error).message ?? "Failed to save";
      toast.error(msg);
      // Surface duplicate-name errors inline too
      if (msg.toLowerCase().includes("already exists")) setNameError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Category" : "New Category"}
      description={
        initial
          ? "Update the category name."
          : "Group similar products together."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            {initial ? "Save Changes" : "Add Category"}
          </Button>
        </>
      }
    >
      <div className="space-y-1.5">
        <Label htmlFor="category-name">Name *</Label>
        <Input
          id="category-name"
          autoFocus
          placeholder="e.g. Beverages"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSave();
          }}
        />
        {nameError && <p className="text-xs text-red-600">{nameError}</p>}
      </div>
    </Modal>
  );
}