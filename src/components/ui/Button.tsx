import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed",
          variant === "primary" &&
            "bg-accent text-white hover:bg-accent-dark shadow-lg shadow-accent/20 hover:shadow-accent/30 hover:-translate-y-0.5",
          variant === "secondary" &&
            "bg-surface text-foreground border border-border hover:bg-white hover:shadow-md",
          variant === "ghost" &&
            "text-accent hover:bg-accent-light",
          variant === "outline" &&
            "border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm",
          size === "sm" && "px-4 py-2 text-sm rounded-lg",
          size === "md" && "px-6 py-3 text-sm rounded-xl",
          size === "lg" && "px-8 py-4 text-base rounded-xl",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
