import { useState } from "react";
import { AuthCard } from "./AuthCard";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/authService";

interface EmailVerificationProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

export const EmailVerification = ({ email, onVerified, onBack }: EmailVerificationProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError("Verification code is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await authService.confirmSignUp({
        email,
        code,
      });

      if (result.success) {
        // Clear any existing session after email verification
        try {
          await authService.signOut();
        } catch (error) {
          // Ignore errors - this is just cleanup
        }
        
        toast({
          title: "Email verified!",
          description: result.message,
        });
        onVerified();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    
    try {
      const result = await authService.resendVerificationCode(email);
      
      if (result.success) {
        toast({
          title: "Code resent!",
          description: result.message,
        });
      } else {
        toast({
          title: "Failed to resend code",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to resend code",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthCard>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Verify your email</h1>
        <p className="text-muted-foreground">
          We've sent a verification code to <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthInput
          id="code"
          label="Verification Code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError("");
          }}
          error={error}
          placeholder="Enter verification code"
        />

        <AuthButton type="submit" loading={loading}>
          Verify Email
        </AuthButton>

        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendLoading}
            className="text-primary hover:text-primary-hover font-medium transition-colors disabled:opacity-50"
          >
            {resendLoading ? "Sending..." : "Resend Code"}
          </button>
          
          <div className="text-sm text-muted-foreground">
            Didn't receive the code?{" "}
            <button
              type="button"
              onClick={onBack}
              className="text-primary hover:text-primary-hover font-medium transition-colors"
            >
              Go back
            </button>
          </div>
        </div>
      </form>
    </AuthCard>
  );
};
