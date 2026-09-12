import type { ReactNode } from "react";
import { HashRouter } from "react-router-dom";
import { ToastProvider } from "@/components/ui/Toast";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <HashRouter>
      <ToastProvider>{children}</ToastProvider>
    </HashRouter>
  );
}