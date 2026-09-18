import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Modal } from "@/components/ui/Modal";
import { CenterSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrendingUp } from "lucide-react";
import { inventoryApi } from "./api";
import {
  formatMoney,
  formatQuantity,
  formatDate,
  formatStockDisplay,
  paisaToRupees,
} from "@/lib/format";
import { toast } from "@/lib/toast";
import type { PriceHistoryEntry } from "../../../electron/shared/types/inventory";

type Props = {
  open: boolean;
  onClose: () => void;
  variantId: number | null;
  productName: string;
  variantName: string;
  baseUnitShortName: string;
  purchaseUnitShortName?: string | null;
  purchaseUnitFactor?: number | null;
};

export function PriceHistoryModal({
  open,
  onClose,
  variantId,
  productName,
  variantName,
  baseUnitShortName,
  purchaseUnitShortName,
  purchaseUnitFactor,
}: Props) {
  const [entries, setEntries] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || variantId === null) return;

    let cancelled = false;
    setLoading(true);
    inventoryApi
      .priceHistory(variantId)
      .then((rows) => {
        if (!cancelled) setEntries(rows);
      })
      .catch((e) => {
        if (!cancelled) {
          toast.error((e as Error).message ?? "Failed to load price history");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, variantId]);

  const unitInfo = {
    baseUnitShortName,
    purchaseUnitShortName,
    purchaseUnitFactor,
  };

  const chartData = entries.map((e) => ({
    date: formatDate(e.purchaseDate),
    price: paisaToRupees(e.purchasePrice),
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Price History"
      description={`${productName} — ${variantName} (${baseUnitShortName})`}
      size="lg"
    >
      {loading ? (
        <CenterSpinner />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="w-6 h-6" />}
          title="No purchase history"
          description="This variant has no purchase records yet."
        />
      ) : (
        <div className="space-y-5">
          {entries.length >= 2 && (
            <div className="rounded-lg border bg-[rgb(var(--bg))] p-3">
              <p className="text-xs text-[rgb(var(--muted-fg))] mb-2">
                Purchase price over time (Rs. per {baseUnitShortName})
              </p>
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      stroke="currentColor"
                      opacity={0.5}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="currentColor"
                      opacity={0.5}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgb(var(--card))",
                        border: "1px solid rgb(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(value) => [`Rs. ${value}`, "Price"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="rgb(var(--fg))"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Date</th>
                  <th className="text-left px-3 py-2 font-medium">Company</th>
                  <th className="text-right px-3 py-2 font-medium">
                    Purchase Price
                  </th>
                  <th className="text-right px-3 py-2 font-medium">Qty</th>
                  <th className="text-right px-3 py-2 font-medium">
                    Remaining
                  </th>
                  <th className="text-right px-3 py-2 font-medium">Retail</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.batchId} className="border-t">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatDate(e.purchaseDate)}
                    </td>
                    <td className="px-3 py-2">
                      {e.companyName ?? "—"}
                      {e.purchaseNumber && (
                        <div className="text-xs text-[rgb(var(--muted-fg))]">
                          {e.purchaseNumber}
                        </div>
                      )}
                    </td>
                    <td className="text-right px-3 py-2 font-medium">
                      {formatMoney(e.purchasePrice)}
                    </td>
                    <td className="text-right px-3 py-2">
                      {formatStockDisplay(e.quantityPurchased, unitInfo)}
                    </td>
                    <td className="text-right px-3 py-2">
                      <span
                        className={
                          e.remainingQuantity < e.quantityPurchased
                            ? "text-amber-600 dark:text-amber-400"
                            : ""
                        }
                      >
                        {formatStockDisplay(e.remainingQuantity, unitInfo)}
                      </span>
                    </td>
                    <td className="text-right px-3 py-2">
                      {e.suggestedRetailPrice
                        ? formatMoney(e.suggestedRetailPrice)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-[rgb(var(--muted-fg))]">
            {entries.length} purchase{entries.length !== 1 ? "s" : ""} total.
          </p>
        </div>
      )}
    </Modal>
  );
}

// Silence unused import
void formatQuantity;