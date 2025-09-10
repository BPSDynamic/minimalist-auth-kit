import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AuthButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export const AuthButton = ({
  children,
  variant = "primary",
  loading = false,
  className,
  ...props
}: AuthButtonProps) => {
  const baseStyles = "h-12 w-full font-medium text-base transition-all duration-200 ease-smooth";
  
  const variantStyles = {
    primary: cn(
      "bg-auth-gradient text-primary-foreground",
      "hover:shadow-lg hover:shadow-primary/25",
      "active:scale-[0.98]",
      "disabled:opacity-50 disabled:hover:shadow-none disabled:active:scale-100"
    ),
    secondary: cn(
      "bg-secondary text-secondary-foreground border border-border",
      "hover:bg-secondary/80 hover:border-border/80",
      "active:scale-[0.98]"
    ),
    ghost: cn(
      "bg-transparent text-muted-foreground",
      "hover:text-foreground hover:bg-muted",
      "active:scale-[0.98]"
    )
  };

  return (
    <Button
      className={cn(
        baseStyles,
        variantStyles[variant],
        loading && "cursor-not-allowed",
        className
      )}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      ) : (
        children
      )}
    </Button>
  );
};