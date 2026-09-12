import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";


import { registerToastHandler } from "@/lib/toast";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; message: string };

type ToastContextValue = {
    push: (kind: ToastKind, message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
    return ctx;
}

const kindStyles: Record<ToastKind, string> = {
    success: "border-green-500/40 bg-green-500/10",
    error: "border-red-500/40 bg-red-500/10",
    info: "border-blue-500/40 bg-blue-500/10",
};

const kindIcons: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    
    const remove = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);
    
    const push = useCallback(
        (kind: ToastKind, message: string) => {
            const id = Date.now() + Math.random();
            setToasts((prev) => [...prev, { id, kind, message }]);
            setTimeout(() => remove(id), 3500);
        },
        [remove]
    );
    // ... inside ToastProvider, after push is defined:
    useEffect(() => {
      registerToastHandler(push);
    }, [push]);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const Icon = kindIcons[t.kind];
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur",
                "min-w-[280px] max-w-md shadow-lg",
                kindStyles[t.kind]
              )}
            >
              <Icon className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-sm flex-1">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                className="opacity-60 hover:opacity-100"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}