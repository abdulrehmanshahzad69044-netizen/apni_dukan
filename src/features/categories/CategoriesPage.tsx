import { useMemo, useState } from "react";
import { Search, Tag, Plus } from "lucide-react";
import { Page } from "@/components/ui/Page";
import { Fab } from "@/components/ui/Fab";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { CenterSpinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CategoryRow } from "./CategoryRow";
import { CategoryFormModal } from "./CategoryFormModal";
import { useCategories } from "./hooks";
import { categoryApi } from "./api";
import { toast } from "@/lib/toast";
import type { Category } from "../../../electron/shared/types/category";

export function CategoriesPage() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const query = useMemo(
    () => ({ search: search.trim() || undefined }),
    [search]
  );
  const { data, loading, reload } = useCategories(query);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(c: Category) {
    setEditing(c);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await categoryApi.remove(deleting.id);
      toast.success("Category deleted");
      await reload();
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to delete");
    }
  }

  return (
    <>
      <Page
        title="Categories"
        description="Group your products."
        actions={
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-fg))]" />
            <Input
              placeholder="Search categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        }
      >
        {loading ? (
          <CenterSpinner />
        ) : data.length === 0 ? (
          <EmptyState
            icon={<Tag className="w-6 h-6" />}
            title={search ? "No categories match" : "No categories yet"}
            description={
              search
                ? "Try a different search term."
                : "Add a category to organize your products."
            }
            action={
              !search && (
                <button
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-[rgb(var(--fg))] text-[rgb(var(--bg))] text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Category
                </button>
              )
            }
          />
        ) : (
          <div className="space-y-2">
            {data.map((c) => (
              <CategoryRow
                key={c.id}
                category={c}
                onEdit={() => openEdit(c)}
                onDelete={() => setDeleting(c)}
              />
            ))}
          </div>
        )}
      </Page>

      <Fab onClick={openCreate} label="Add Category" />

      <CategoryFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
        initial={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete category?"
        description={
          deleting
            ? `"${deleting.name}" will be hidden from lists. Products using it remain linked.`
            : ""
        }
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}