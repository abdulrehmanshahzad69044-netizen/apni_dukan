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
          "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--fg))] focus:ring-offset-0",
          "disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";