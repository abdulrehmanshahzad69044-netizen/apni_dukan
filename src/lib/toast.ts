/**
 * Imperative toast API. The ToastProvider registers a handler on mount.
 * Outside React, call `toast.success("...")`.
 */
type Kind = "success" | "error" | "info";
type Handler = (kind: Kind, message: string) => void;

let handler: Handler | null = null;

export function registerToastHandler(h: Handler) {
  handler = h;
}

function emit(kind: Kind, message: string) {
  if (handler) handler(kind, message);
  else console.warn(`[toast:${kind}]`, message);
}

export const toast = {
  success: (m: string) => emit("success", m),
  error: (m: string) => emit("error", m),
  info: (m: string) => emit("info", m),
};