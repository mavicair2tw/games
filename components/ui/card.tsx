import { ReactNode } from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: CardProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>{children}</div>
  );
}

export function CardTitle({ children, className = "" }: CardProps) {
  return <h2 className={`text-2xl font-bold ${className}`}>{children}</h2>;
}

export function CardContent({ children, className = "" }: CardProps) {
  return <div className={`mt-4 ${className}`}>{children}</div>;
}
