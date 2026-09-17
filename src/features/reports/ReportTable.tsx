import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { downloadCsv } from "@/lib/csv";

export type Column<T> = {
  key: keyof T | string;
  label: string;
  align?: "left" | "right";
  /**
   * Render for the table UI.
   * Return a string or number. Use `cell` if you need JSX styling.
   */
  render?: (row: T) => string | number;
  /** Custom JSX cell for the table UI (takes precedence over render) */
  cell?: (row: T) => React.ReactNode;
  /**
   * Raw value for CSV export.
   * If provided, this is used instead of render for CSV.
   * Use this to export numbers instead of formatted strings.
   */
  csvValue?: (row: T) => string | number | null | undefined;
  /** Exclude from CSV export entirely */
  hideInCsv?: boolean;
};

type Props<T> = {
  title: string;
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
  csvFilename?: string;
};

export function ReportTable<T extends Record<string, unknown>>({
  title,
  columns,
  rows,
  emptyMessage = "No data for this period.",
  csvFilename,
}: Props<T>) {
  const csvColumns = columns
    .filter((c) => !c.hideInCsv)
    .map((c) => ({ key: c.key as string, label: c.label }));

  const csvRows = rows.map((r) => {
    const out: Record<string, unknown> = {};
    for (const c of columns.filter((cc) => !cc.hideInCsv)) {
      const key = c.key as string;
      if (c.csvValue) {
        out[key] = c.csvValue(r);
      } else if (c.render) {
        out[key] = c.render(r);
      } else {
        out[key] = r[key];
      }
    }
    return out;
  });

  return (
    <div className="rounded-xl border bg-[rgb(var(--card))] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-sm font-medium">{title}</h3>
        {csvFilename && rows.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => downloadCsv(csvFilename, csvColumns, csvRows)}
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-[rgb(var(--muted-fg))] px-4 py-6 text-center">
          {emptyMessage}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">
              <tr>
                {columns.map((c) => (
                  <th
                    key={String(c.key)}
                    className={`px-4 py-2 font-medium ${
                      c.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-t">
                  {columns.map((c) => (
                    <td
                      key={String(c.key)}
                      className={`px-4 py-2 ${
                        c.align === "right" ? "text-right" : "text-left"
                      }`}
                    >
                      {c.cell
                        ? c.cell(row)
                        : c.render
                        ? c.render(row)
                        : String(row[c.key as keyof T] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}