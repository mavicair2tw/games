import { ReactNode } from "react";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: "default" | "secondary" | "outline";
};

export function Badge({ children, variant = "default", className = "", ...props }: BadgeProps) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  const variants = {
    default: "bg-slate-900 text-white",
    secondary: "bg-amber-500 text-slate-950",
    outline: "border border-white/40 text-white",
  };

  return (
    <span className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}
