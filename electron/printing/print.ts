import { BrowserWindow, shell } from "electron";

export type PrintSize = "thermal_80" | "thermal_58" | "a4";

export type PrintOptions = {
  /** The HTML string to print */
  html: string;
  /** Receipt size — controls window dimensions and CSS */
  size: PrintSize;
  /** Optional file title for "Save as PDF" default name */
  documentTitle?: string;
};

/**
 * Opens a hidden window, loads the HTML, and triggers the print dialog.
 * The print dialog on every OS includes "Save as PDF" — so this single
 * path handles both printing AND PDF export.
 */
export async function printHtml(opts: PrintOptions): Promise<void> {
  const { html, size, documentTitle } = opts;

  // Window dimensions based on paper size
  const dims = getWindowDimensions(size);

  const win = new BrowserWindow({
    width: dims.width,
    height: dims.height,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Wrap the HTML with our print CSS
  const fullHtml = wrapHtml(html, size);

  // Load via data URL (no file system needed)
  await win.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`
  );

  // Wait for fonts / images to settle
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Print
  return new Promise((resolve, reject) => {
    win.webContents.print(
      {
        silent: false,       // show OS dialog (allows Save-as-PDF)
        printBackground: true,
        margins: { marginType: "none" },
        // Size hints for A4; thermal sizes are handled by the printer driver
        pageSize: size === "a4" ? "A4" : undefined,
      },
      (success, failureReason) => {
        if (!success && failureReason !== "Print job canceled") {
          reject(new Error(failureReason || "Print failed"));
        } else {
          resolve();
        }
        // Clean up after a short delay
        setTimeout(() => {
          if (!win.isDestroyed()) win.close();
        }, 300);
      }
    );
  });
}

function getWindowDimensions(size: PrintSize): {
  width: number;
  height: number;
} {
  switch (size) {
    case "thermal_80":
      return { width: 302, height: 900 }; // 80mm ≈ 302px at 96dpi
    case "thermal_58":
      return { width: 219, height: 900 }; // 58mm ≈ 219px
    case "a4":
    default:
      return { width: 794, height: 1123 }; // A4 at 96dpi
  }
}

/**
 * Wraps the user HTML with a <style> block appropriate to the paper size.
 * Base fonts: monospace for thermal, sans-serif for A4.
 *
 * Note: We rely on system fonts only (offline-first). Windows ships with
 * 'Jameel Noori Nastaleeq' if the Urdu font pack is installed; otherwise
 * we fall back to 'Segoe UI' which renders Urdu readably but not in
 * Nastaliq style. The critical part for Urdu is `direction: rtl`.
 */
function wrapHtml(html: string, size: PrintSize): string {
  const baseCss = getBaseCss(size);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Print</title>
  <style>${baseCss}</style>
</head>
<body>
${html}
</body>
</html>`;
}

function getBaseCss(size: PrintSize): string {
  if (size === "a4") {
    return `
      @page { size: A4; margin: 12mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: 'Segoe UI', system-ui, sans-serif;
        font-size: 12px;
        color: #000;
      }
      h1 { font-size: 22px; margin: 0 0 4px; }
      h2 { font-size: 14px; margin: 16px 0 6px; }
      .muted { color: #555; }
      .right { text-align: right; }
      .center { text-align: center; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { padding: 6px 8px; border-bottom: 1px solid #ddd; }
      th { text-align: left; background: #f4f4f5; font-weight: 600; }
      .total-row td { font-weight: 700; border-top: 2px solid #000; border-bottom: none; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 12px; }
      .shop-name { font-size: 22px; font-weight: 700; }
      .meta { font-size: 11px; color: #555; text-align: right; }
      .divider { border-top: 1px dashed #999; margin: 10px 0; }
      .summary { margin-top: 12px; display: flex; justify-content: flex-end; }
      .summary table { width: auto; min-width: 260px; }
      .summary td { border: none; padding: 2px 8px; }
      .summary .label { text-align: right; color: #555; }
      .summary .value { text-align: right; font-weight: 600; }

      .shop-name-urdu {
        font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Segoe UI', sans-serif;
        font-size: 18px;
        font-weight: 700;
        direction: rtl;
        color: #333;
        margin-top: 2px;
      }
      .urdu-footer {
        font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Segoe UI', sans-serif;
        font-size: 12px;
        direction: rtl;
        margin-top: 6px;
      }
    `;
  }
  // Thermal CSS (58mm and 80mm share most styles)
  const maxWidth = size === "thermal_80" ? "72mm" : "50mm";
  const baseFont = size === "thermal_80" ? "12px" : "11px";
  return `
    @page { margin: 0; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 4mm 3mm;
      font-family: 'Courier New', monospace;
      font-size: ${baseFont};
      line-height: 1.35;
      color: #000;
      max-width: ${maxWidth};
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: 700; }
    h1 { font-size: 1.2em; margin: 0 0 2px; }
    .shop-name { font-size: 1.3em; font-weight: 700; text-align: center; }
    .shop-meta { text-align: center; font-size: 0.9em; margin-bottom: 4px; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; gap: 4px; }
    .row .label { flex: 0 0 auto; }
    .row .value { flex: 1 1 auto; text-align: right; }
    table { width: 100%; border-collapse: collapse; font-size: 1em; }
    th, td { padding: 2px 0; vertical-align: top; }
    th { text-align: left; font-weight: 700; border-bottom: 1px solid #000; }
    td.qty { text-align: center; width: 14%; }
    td.price, td.total { text-align: right; width: 26%; }
    .total-line { font-weight: 700; border-top: 1px solid #000; padding-top: 3px; margin-top: 3px; }
    .footer { text-align: center; font-size: 0.9em; margin-top: 6px; }

    .shop-name-urdu {
      text-align: center;
      font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Segoe UI', sans-serif;
      font-size: 1.1em;
      font-weight: 700;
      direction: rtl;
      margin-bottom: 4px;
    }
    .footer-urdu {
      text-align: center;
      font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Segoe UI', sans-serif;
      font-size: 0.9em;
      direction: rtl;
      margin-top: 4px;
    }
  `;
}

/**
 * Open an external URL in the user's default browser (used for Help / Docs).
 */
export async function openExternal(url: string): Promise<void> {
  await shell.openExternal(url);
}