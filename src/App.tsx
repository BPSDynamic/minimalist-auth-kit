import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ProfileSettings from "./pages/ProfileSettings";
import Settings from "./pages/Settings";
import StorageSettings from "./pages/StorageSettings";
import ShareFiles from "./pages/ShareFiles";
import SharedFiles from "./pages/SharedFiles";
import Folders from "./pages/Folders";
import Trash from "./pages/Trash";
import EnterpriseDashboard from "./pages/EnterpriseDashboard";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthGuard } from "./components/auth/AuthGuard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<AuthGuard><DashboardLayout><Dashboard /></DashboardLayout></AuthGuard>} />
              <Route path="/dashboard/share" element={<AuthGuard><DashboardLayout><ShareFiles /></DashboardLayout></AuthGuard>} />
              <Route path="/dashboard/profile" element={<AuthGuard><DashboardLayout><ProfileSettings /></DashboardLayout></AuthGuard>} />
              <Route path="/dashboard/settings" element={<AuthGuard><DashboardLayout><Settings /></DashboardLayout></AuthGuard>} />
              <Route path="/dashboard/shared" element={<AuthGuard><DashboardLayout><SharedFiles /></DashboardLayout></AuthGuard>} />
              <Route path="/dashboard/folders" element={<AuthGuard><DashboardLayout><Folders /></DashboardLayout></AuthGuard>} />
              <Route path="/dashboard/trash" element={<AuthGuard><DashboardLayout><Trash /></DashboardLayout></AuthGuard>} />
              <Route path="/dashboard/storage" element={<AuthGuard><DashboardLayout><StorageSettings /></DashboardLayout></AuthGuard>} />
              <Route path="/dashboard/enterprise" element={<AuthGuard><DashboardLayout><EnterpriseDashboard /></DashboardLayout></AuthGuard>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
