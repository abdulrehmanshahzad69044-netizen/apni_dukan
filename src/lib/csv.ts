/**
 * Convert rows of objects to a CSV string and trigger a browser download.
 * In Electron, this works because the renderer has access to Blob + URL.
 */
export function downloadCsv(
  filename: string,
  headers: { key: string; label: string }[],
  rows: Record<string, unknown>[]
): void {
  const escape = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    const s = String(value);
    // Escape quotes + wrap in quotes if contains comma/quote/newline
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const headerLine = headers.map((h) => escape(h.label)).join(",");
  const dataLines = rows.map((row) =>
    headers.map((h) => escape(row[h.key])).join(",")
  );

  const csv = [headerLine, ...dataLines].join("\r\n");
  // BOM for Excel compatibility
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format a date range for filenames: "2026-09-01_to_2026-09-15"
 */
export function dateRangeFilename(fromUnixSec: number, toUnixSec: number): string {
  const from = new Date(fromUnixSec * 1000);
  const to = new Date(toUnixSec * 1000);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  return `${fmt(from)}_to_${fmt(to)}`;
}