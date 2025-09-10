import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ProfileSettings from "./pages/ProfileSettings";
import StorageSettings from "./pages/StorageSettings";
import ShareFiles from "./pages/ShareFiles";
import SharedFiles from "./pages/SharedFiles";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
          <Route path="/dashboard/share" element={<DashboardLayout><ShareFiles /></DashboardLayout>} />
          <Route path="/dashboard/profile" element={<DashboardLayout><ProfileSettings /></DashboardLayout>} />
          <Route path="/dashboard/settings" element={<DashboardLayout><ProfileSettings /></DashboardLayout>} />
          <Route path="/dashboard/recent" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
          <Route path="/dashboard/starred" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
          <Route path="/dashboard/shared" element={<DashboardLayout><SharedFiles /></DashboardLayout>} />
          <Route path="/dashboard/trash" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
          <Route path="/dashboard/storage" element={<DashboardLayout><StorageSettings /></DashboardLayout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
