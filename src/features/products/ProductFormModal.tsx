import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { productApi } from "./api";
import { useCategories } from "../categories/hooks";
import { useCompanies } from "../companies/hooks";
import { toast } from "@/lib/toast";
import type { Product } from "../../../electron/shared/types/product";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Product | null;
};

export function ProductFormModal({ open, onClose, onSaved, initial }: Props) {
  const isEdit = !!initial;

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [companyId, setCompanyId] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const { data: categories } = useCategories();
  const { data: companies } = useCompanies();

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setCategoryId(initial?.categoryId ?? "");
      setCompanyId(initial?.companyId ?? "");
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
      const payload = {
        name: trimmed,
        categoryId: categoryId === "" ? null : Number(categoryId),
        companyId: companyId === "" ? null : Number(companyId),
      };

      if (isEdit && initial) {
        await productApi.update({ id: initial.id, ...payload });
        toast.success("Product updated");
      } else {
        await productApi.create(payload);
        toast.success("Product added");
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
      title={isEdit ? "Edit Product" : "New Product"}
      description={
        isEdit
          ? "Update the product details."
          : "Add a product to your catalog."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            {isEdit ? "Save Changes" : "Add Product"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="product-name">Name *</Label>
          <Input
            id="product-name"
            autoFocus
            placeholder="e.g. Coca Cola"
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

        {/* Category */}
        <div className="space-y-1.5">
          <Label>Category</Label>
          <select
            value={categoryId}
            onChange={(e) =>
              setCategoryId(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm"
          >
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Company */}
        <div className="space-y-1.5">
          <Label>Company</Label>
          <select
            value={companyId}
            onChange={(e) =>
              setCompanyId(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm"
          >
            <option value="">— None —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
}