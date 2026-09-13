import { useMemo, useState } from "react";
import { Search, Package, Plus } from "lucide-react";
import { Page } from "@/components/ui/Page";
import { Fab } from "@/components/ui/Fab";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { CenterSpinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ProductRow } from "./ProductRow";
import { ProductFormModal } from "./ProductFormModal";
import { useProducts } from "./hooks";
import { useCategories } from "../categories/hooks";
import { productApi } from "./api";
import { toast } from "@/lib/toast";
import type { Product } from "../../../electron/shared/types/product";

export function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | "">("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const { data: categories } = useCategories();

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      categoryId: categoryFilter === "" ? undefined : Number(categoryFilter),
    }),
    [search, categoryFilter]
  );
  const { data, loading, reload } = useProducts(query);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await productApi.remove(deleting.id);
      toast.success("Product deleted");
      await reload();
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to delete");
    }
  }

  return (
    <>
      <Page
        title="Products"
        description="Your product catalog."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className="h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
              <Input
                placeholder="Search products…"
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
              search || categoryFilter !== ""
                ? "No products match"
                : "No products yet"
            }
            description={
              search || categoryFilter !== ""
                ? "Try a different search or filter."
                : "Add your first product to start building variants."
            }
            action={
              !search &&
              categoryFilter === "" && (
                <button
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-[rgb(var(--fg))] text-[rgb(var(--bg))] text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
              )
            }
          />
        ) : (
          <div className="space-y-2">
            {data.map((p) => (
              <ProductRow
                key={p.id}
                product={p}
                onEdit={() => openEdit(p)}
                onDelete={() => setDeleting(p)}
              />
            ))}
          </div>
        )}
      </Page>

      <Fab onClick={openCreate} label="Add Product" />

      <ProductFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
        initial={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete product?"
        description={
          deleting
            ? `"${deleting.name}" will be hidden from lists. Variants and stock records remain intact.`
            : ""
        }
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}