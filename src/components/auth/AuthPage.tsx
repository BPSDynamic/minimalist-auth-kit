import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

type AuthMode = "login" | "register" | "forgot";

export const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>("login");

  const renderForm = () => {
    switch (mode) {
      case "login":
        return <LoginForm onToggleMode={setMode} />;
      case "register":
        return <RegisterForm onToggleMode={setMode} />;
      case "forgot":
        return <ForgotPasswordForm onToggleMode={setMode} />;
      default:
        return <LoginForm onToggleMode={setMode} />;
    }
  };

  return (
    <div className="min-h-screen bg-auth-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 ease-spring">
          {renderForm()}
        </div>
      </div>
    </div>
  );
};