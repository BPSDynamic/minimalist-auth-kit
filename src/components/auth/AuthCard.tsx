import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: ReactNode;
  className?: string;
}

export const AuthCard = ({ children, className }: AuthCardProps) => {
  return (
    <div className={cn(
      "w-full max-w-md mx-auto",
      "bg-auth-card border border-border",
      "rounded-2xl shadow-lg shadow-auth-shadow/5",
      "p-8",
      "transition-all duration-300 ease-smooth",
      "hover:shadow-xl hover:shadow-auth-shadow/10",
      className
    )}>
      {children}
    </div>
  );
};