import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DashboardOverview from "./pages/DashboardOverview";
import LocationsPage from "./pages/LocationsPage";
import LabsPage from "./pages/LabsPage";
import DevicesPage from "./pages/DevicesPage";
import PCDetailPage from "./pages/PCDetailPage";
import PCHistoryDetailPage from "./pages/PCHistoryDetailPage";

import LabDashboard from "./pages/LabDashboard";
import LabSummaryPage from "./pages/LabSummaryPage";
import NotFound from "./pages/NotFound";
import { GlobalFailsafe } from "@/components/GlobalFailsafe";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <GlobalFailsafe />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<LabDashboard />} />
              <Route path="cities" element={<LocationsPage />} />
              <Route path="labs" element={<LabsPage />} />
              <Route path="devices" element={<DevicesPage />} />
              <Route path="overview" element={<DashboardOverview />} />
              <Route path="lab-summary/:city/:lab" element={<LabSummaryPage />} />
              <Route path="pc/:id" element={<PCDetailPage />} />
              <Route path="pc/:id/history/:date" element={<PCHistoryDetailPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;