type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
  className?: string;
};

export function Button({ variant = "default", className = "", ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm font-semibold transition-all";
  const variantStyles =
    variant === "outline"
      ? "bg-transparent border-white/40 text-white hover:border-white hover:bg-white/10"
      : "bg-white text-slate-900 border-transparent shadow";

  return <button className={`${base} ${variantStyles} ${className}`} {...props} />;
}
