import { useState } from "react";
import { AuthCard } from "./AuthCard";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

interface ForgotPasswordFormProps {
  onToggleMode: (mode: "login" | "register" | "forgot") => void;
}

export const ForgotPasswordForm = ({ onToggleMode }: ForgotPasswordFormProps) => {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [formData, setFormData] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const validateResetForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = "Verification code is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      setErrors({ email: "Email is required" });
      return;
    }

    if (!validateEmail(formData.email)) {
      setErrors({ email: "Please enter a valid email" });
      return;
    }

    setLoading(true);
    setErrors({});
    
    // Simulate API call to send OTP
    setTimeout(() => {
      setLoading(false);
      setStep("reset");
      toast({
        title: "Code sent!",
        description: "Check your email for the verification code.",
      });
    }, 1500);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateResetForm()) return;

    setLoading(true);
    
    // Simulate API call to reset password
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Password reset successful!",
        description: "You can now sign in with your new password.",
      });
      onToggleMode("login");
    }, 2000);
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    
    // Simulate API call to resend OTP
    setTimeout(() => {
      setResendLoading(false);
      toast({
        title: "Code resent!",
        description: "Check your email for the new verification code.",
      });
    }, 1000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (step === "email") {
    return (
      <AuthCard>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Forgot password?</h1>
          <p className="text-muted-foreground">Enter your email to reset your password</p>
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-6">
          <AuthInput
            id="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            error={errors.email}
            placeholder="Enter your email"
          />

          <div className="space-y-4">
            <AuthButton type="submit" loading={loading}>
              Send verification code
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
  }

  return (
    <AuthCard>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Reset Password</h1>
        <p className="text-muted-foreground">
          Enter the code sent to <span className="font-medium text-foreground">{formData.email}</span>
        </p>
      </div>

      <form onSubmit={handleResetSubmit} className="space-y-6">
        <AuthInput
          id="code"
          label="Code *"
          value={formData.code}
          onChange={(e) => handleInputChange("code", e.target.value)}
          error={errors.code}
          placeholder="Enter verification code"
        />

        <div className="relative">
          <AuthInput
            id="newPassword"
            label="New Password"
            type={showPassword ? "text" : "password"}
            value={formData.newPassword}
            onChange={(e) => handleInputChange("newPassword", e.target.value)}
            error={errors.newPassword}
            placeholder="Enter new password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="relative">
          <AuthInput
            id="confirmPassword"
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
            error={errors.confirmPassword}
            placeholder="Confirm new password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <AuthButton type="submit" loading={loading}>
          Submit
        </AuthButton>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendLoading}
            className="text-primary hover:text-primary-hover font-medium transition-colors disabled:opacity-50"
          >
            {resendLoading ? "Sending..." : "Resend Code"}
          </button>
        </div>
      </form>
    </AuthCard>
  );
};