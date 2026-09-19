import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full h-10 px-3 rounded-lg border bg-[rgb(var(--bg))] text-sm",
          "placeholder:text-[rgb(var(--muted-fg))]",
          "transition-all duration-150 ease-out",
          "hover:border-[rgb(var(--muted-fg))]/40",
          "focus:outline-none focus:border-[rgb(var(--fg))] focus:ring-2 focus:ring-[rgb(var(--fg))]/15",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";