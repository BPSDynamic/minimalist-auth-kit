import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <Label 
          htmlFor={props.id} 
          className="text-sm font-medium text-foreground"
        >
          {label}
        </Label>
        <Input
          ref={ref}
          className={cn(
            "h-12 px-4 text-base",
            "bg-input border-input-border",
            "transition-all duration-200 ease-smooth",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            "hover:border-input-border/80",
            error && "border-destructive focus:border-destructive focus:ring-destructive/20",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive animate-in slide-in-from-left-2 duration-200">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = "AuthInput";