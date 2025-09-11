import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthCard } from "./AuthCard";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/authService";

interface LoginFormProps {
  onToggleMode: (mode: "login" | "register" | "forgot") => void;
}

export const LoginForm = ({ onToggleMode }: LoginFormProps) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const result = await authService.signIn({
        email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        toast({
          title: "Welcome back!",
          description: result.message,
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Sign in failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <AuthCard>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Welcome back</h1>
        <p className="text-muted-foreground" id="login-description">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" role="form" aria-label="Login form">
        <AuthInput
          id="email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          error={errors.email}
          placeholder="Enter your email"
        />

        <AuthInput
          id="password"
          label="Password"
          type="password"
          value={formData.password}
          onChange={(e) => handleInputChange("password", e.target.value)}
          error={errors.password}
          placeholder="Enter your password"
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onToggleMode("forgot")}
            className="text-sm text-primary hover:text-primary-hover transition-colors"
          >
            Forgot password?
          </button>
        </div>

        <AuthButton type="submit" loading={loading} aria-describedby="login-description">
          Sign in
        </AuthButton>
      </form>

      <div className="mt-8 text-center">
        <p className="text-muted-foreground text-sm">
          Don't have an account?{" "}
          <button
            onClick={() => onToggleMode("register")}
            className="text-primary hover:text-primary-hover font-medium transition-colors"
          >
            Create account
          </button>
        </p>
      </div>
    </AuthCard>
  );
};