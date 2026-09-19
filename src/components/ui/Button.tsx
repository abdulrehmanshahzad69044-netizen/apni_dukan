import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-[rgb(var(--fg))] text-[rgb(var(--bg))] hover:opacity-90 active:opacity-80 shadow-sm hover:shadow",
  secondary:
    "bg-[rgb(var(--muted))] text-[rgb(var(--fg))] hover:bg-[rgb(var(--border))] active:bg-[rgb(var(--border))]",
  outline:
    "border bg-transparent hover:bg-[rgb(var(--muted))] active:bg-[rgb(var(--border))]",
  ghost:
    "hover:bg-[rgb(var(--muted))] active:bg-[rgb(var(--border))]",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm hover:shadow",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-9 w-9 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium",
          "transition-all duration-150 ease-out",
          "disabled:opacity-50 disabled:pointer-events-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--fg))] focus-visible:ring-offset-1 focus-visible:ring-offset-[rgb(var(--bg))]",
          "active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";