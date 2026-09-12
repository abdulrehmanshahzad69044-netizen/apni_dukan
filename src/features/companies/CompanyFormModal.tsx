import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { companyApi } from "./api";
import { toast } from "@/lib/toast";
import type { Company } from "../../../electron/shared/types/company";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Company | null;
};

export function CompanyFormModal({ open, onClose, onSaved, initial }: Props) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setContact(initial?.contactNumber ?? "");
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
        await companyApi.update({
          id: initial.id,
          name: trimmed,
          contactNumber: contact.trim(),
        });
        toast.success("Company updated");
      } else {
        await companyApi.create({
          name: trimmed,
          contactNumber: contact.trim(),
        });
        toast.success("Company added");
      }
      onSaved();
      onClose();
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Company" : "New Company"}
      description={
        initial
          ? "Update the company details."
          : "Add a supplier or manufacturer."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            {initial ? "Save Changes" : "Add Company"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="company-name">Name *</Label>
          <Input
            id="company-name"
            autoFocus
            placeholder="e.g. Nestle Pakistan"
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

        <div className="space-y-1.5">
          <Label htmlFor="company-contact">Contact Number</Label>
          <Input
            id="company-contact"
            placeholder="Optional"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}