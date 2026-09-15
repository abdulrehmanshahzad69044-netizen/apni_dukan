import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { customerApi } from "../customers/api";
import { toast } from "@/lib/toast";
import type { Customer } from "../../../electron/shared/types/customer";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (customer: Customer) => void;
};

export function QuickAddCustomerModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setContact("");
      setAddress("");
      setError(null);
    }
  }, [open]);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return setError("Name is required");

    setSaving(true);
    setError(null);
    try {
      const created = await customerApi.create({
        name: trimmed,
        contactNumber: contact.trim(),
        address: address.trim(),
      });
      toast.success("Customer added");
      onCreated(created);
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
      title="New Customer"
      description="Quickly add a customer without leaving the bill."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Add Customer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="qc-name">Name *</Label>
          <Input
            id="qc-name"
            autoFocus
            placeholder="e.g. Ali Raza"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSave();
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qc-contact">Contact</Label>
          <Input
            id="qc-contact"
            placeholder="Optional"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qc-address">Address</Label>
          <Input
            id="qc-address"
            placeholder="Optional"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}