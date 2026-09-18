import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { customerApi } from "./api";
import { toast } from "@/lib/toast";
import { RecordUdhaarModal } from "../udhaar/RecordUdhaarModal";
import type { Customer } from "../../../electron/shared/types/customer";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Customer | null;
};

export function CustomerFormModal({ open, onClose, onSaved, initial }: Props) {
  const isEdit = !!initial;

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [showUdhaarOption, setShowUdhaarOption] = useState(false);
  const [createdCustomer, setCreatedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setContact(initial?.contactNumber ?? "");
      setAddress(initial?.address ?? "");
      setNameError(null);
      setShowUdhaarOption(false);
      setCreatedCustomer(null);
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
        await customerApi.update({
          id: initial.id,
          name: trimmed,
          contactNumber: contact.trim(),
          address: address.trim(),
        });
        toast.success("Customer updated");
        onSaved();
        onClose();
      } else {
        const created = await customerApi.create({
          name: trimmed,
          contactNumber: contact.trim(),
          address: address.trim(),
        });
        toast.success("Customer added");
        onSaved();

        // Offer to add a udhaar immediately
        setCreatedCustomer(created);
        setShowUdhaarOption(true);
      }
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  // When the udhaar sub-modal is done, close everything
  if (showUdhaarOption && createdCustomer) {
    return (
      <RecordUdhaarModal
        open
        onClose={() => {
          setShowUdhaarOption(false);
          setCreatedCustomer(null);
          onClose();
        }}
        onSaved={onSaved}
        presetCustomer={createdCustomer}
      />
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Customer" : "New Customer"}
      description={
        initial
          ? "Update the customer details."
          : "Add a new customer to your shop."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            {initial ? "Save Changes" : "Add Customer"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="cust-name">Name *</Label>
          <Input
            id="cust-name"
            autoFocus
            placeholder="e.g. Ali Raza"
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
          <Label htmlFor="cust-contact">Contact Number</Label>
          <Input
            id="cust-contact"
            placeholder="e.g. 03001234567"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cust-address">Address</Label>
          <Input
            id="cust-address"
            placeholder="Optional"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        {!isEdit && (
          <p className="text-xs text-[rgb(var(--muted-fg))] border-t pt-3">
            <strong>Note:</strong> After saving, you'll be able to record any
            existing pending due (udhaar) for this customer.
          </p>
        )}
      </div>
    </Modal>
  );
}