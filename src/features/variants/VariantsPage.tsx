import { useMemo, useState } from "react";
import { Search, Package, Plus } from "lucide-react";
import { Page } from "@/components/ui/Page";
import { Fab } from "@/components/ui/Fab";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { CenterSpinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { VariantRow } from "./VariantRow";
import { VariantFormModal } from "./VariantFormModal";
import { useVariants } from "./hooks";
import { useProducts } from "../products/hooks";
import { variantApi } from "./api";
import { toast } from "@/lib/toast";
import type { Variant } from "../../../electron/shared/types/variant";

export function VariantsPage() {
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState<number | "">("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Variant | null>(null);
  const [deleting, setDeleting] = useState<Variant | null>(null);

  const { data: products } = useProducts();

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      productId: productFilter === "" ? undefined : Number(productFilter),
    }),
    [search, productFilter]
  );
  const { data, loading, reload } = useVariants(query);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(v: Variant) {
    setEditing(v);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await variantApi.remove(deleting.id);
      toast.success("Variant deleted");
      await reload();
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to delete");
    }
  }

  async function handleToggleVolatile(v: Variant) {
    try {
      await variantApi.setPriceVolatile(v.id, !v.priceVolatile);
      toast.success(
        v.priceVolatile
          ? "Removed from Update Prices"
          : "Added to Update Prices"
      );
      await reload();
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to update");
    }
  }

  return (
    <>
      <Page
        title="Variants"
        description="Specific SKUs of your products (250ml, 1L, etc.)."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={productFilter}
              onChange={(e) =>
                setProductFilter(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className="h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm"
            >
              <option value="">All products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
              <Input
                placeholder="Search variants…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        }
      >
        {loading ? (
          <CenterSpinner />
        ) : data.length === 0 ? (
          <EmptyState
            icon={<Package className="w-6 h-6" />}
            title={
              search || productFilter !== ""
                ? "No variants match"
                : "No variants yet"
            }
            description={
              search || productFilter !== ""
                ? "Try a different search or filter."
                : "Add variants for your products to start tracking stock."
            }
            action={
              !search &&
              productFilter === "" && (
                <button
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-[rgb(var(--fg))] text-[rgb(var(--bg))] text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Variant
                </button>
              )
            }
          />
        ) : (
          <div className="space-y-2">
            {data.map((v) => (
              <VariantRow
                key={v.id}
                variant={v}
                onEdit={() => openEdit(v)}
                onDelete={() => setDeleting(v)}
                onToggleVolatile={() => handleToggleVolatile(v)}
              />
            ))}
          </div>
        )}
      </Page>

      <Fab onClick={openCreate} label="Add Variant" />

      <VariantFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
        initial={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete variant?"
        description={
          deleting
            ? `${deleting.productName} — ${deleting.name} will be hidden. Stock and bill records remain intact.`
            : ""
        }
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}