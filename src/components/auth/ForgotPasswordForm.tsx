import { useState } from "react";
import { AuthCard } from "./AuthCard";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

interface ForgotPasswordFormProps {
  onToggleMode: (mode: "login" | "register" | "forgot") => void;
}

export const ForgotPasswordForm = ({ onToggleMode }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);
    setError("");
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSent(true);
      toast({
        title: "Reset link sent!",
        description: "Check your email for password reset instructions.",
      });
    }, 1500);
  };

  const handleInputChange = (value: string) => {
    setEmail(value);
    if (error) setError("");
  };

  if (sent) {
    return (
      <AuthCard>
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 bg-auth-gradient rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
          <p className="text-muted-foreground mb-8">
            We've sent a password reset link to<br />
            <span className="font-medium text-foreground">{email}</span>
          </p>
          <AuthButton 
            variant="secondary" 
            onClick={() => onToggleMode("login")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to sign in
          </AuthButton>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Forgot password?</h1>
        <p className="text-muted-foreground">Enter your email to reset your password</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthInput
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => handleInputChange(e.target.value)}
          error={error}
          placeholder="Enter your email"
        />

        <div className="space-y-4">
          <AuthButton type="submit" loading={loading}>
            Send reset link
          </AuthButton>
          
          <AuthButton 
            variant="ghost" 
            type="button"
            onClick={() => onToggleMode("login")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to sign in
          </AuthButton>
        </div>
      </form>
    </AuthCard>
  );
};