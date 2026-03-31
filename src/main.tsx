import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { HomeScreen } from "@/pages/home-screen";
import { TasksPage } from "@/pages/tasks";
import { ClientsPage } from "@/pages/clients";
import { ClientProfilePage } from "@/pages/client-profile";
import { ApplicationsPage } from "@/pages/applications";
import { ApplicationProfilePage } from "@/pages/application-profile";
import { ClaimsPage } from "@/pages/claims";
import { ClaimProfilePage } from "@/pages/claim-profile";
import { DishonoursPage } from "@/pages/dishonours";
import { DishonourProfilePage } from "@/pages/dishonour-profile";
import { ComplaintsPage } from "@/pages/complaints";
import { ComplaintProfilePage } from "@/pages/complaint-profile";
import { CampaignsPage } from "@/pages/campaigns";
import { InsuranceBookPage } from "@/pages/insurance-book";
import { PaymentsPage } from "@/pages/payments";
import { ReportsPage } from "@/pages/reports";
import { ExportsPage } from "@/pages/exports";
import { DocumentsPage } from "@/pages/documents";
import { Settings } from "@/pages/settings";
import { ProfilePage } from "@/pages/profile";
import { NotFound } from "@/pages/not-found";
import { Login } from "@/pages/login";
import { RouteProvider } from "@/providers/router-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { RequireAuth } from "@/providers/auth-provider";
import { ToastProvider } from "@/components/toast";
import { Softphone, SoftphoneButton } from "@/components/Softphone";
import "@/styles/globals.css";

// Softphone wrapper - only shows on authenticated routes
function SoftphoneWrapper() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  
  // Don't show on login page
  if (location.pathname === '/login') return null;
  
  return open ? (
    <Softphone onClose={() => setOpen(false)} />
  ) : (
    <SoftphoneButton onClick={() => setOpen(true)} />
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <RouteProvider>
          <ToastProvider>
            <Routes>
              <Route path="/" element={<RequireAuth><HomeScreen /></RequireAuth>} />
              <Route path="/workbench" element={<RequireAuth><HomeScreen /></RequireAuth>} />
              <Route path="/tasks" element={<RequireAuth><TasksPage /></RequireAuth>} />
              <Route path="/tasks/*" element={<RequireAuth><TasksPage /></RequireAuth>} />
              <Route path="/clients" element={<RequireAuth><ClientsPage /></RequireAuth>} />
              <Route path="/clients/*" element={<RequireAuth><ClientsPage /></RequireAuth>} />
              <Route path="/applications" element={<RequireAuth><ApplicationsPage /></RequireAuth>} />
              <Route path="/applications/*" element={<RequireAuth><ApplicationsPage /></RequireAuth>} />
              <Route path="/application/:id" element={<RequireAuth><ApplicationProfilePage /></RequireAuth>} />
              <Route path="/claims" element={<RequireAuth><ClaimsPage /></RequireAuth>} />
              <Route path="/claims/*" element={<RequireAuth><ClaimsPage /></RequireAuth>} />
              <Route path="/claim/:id" element={<RequireAuth><ClaimProfilePage /></RequireAuth>} />
              <Route path="/dishonours" element={<RequireAuth><DishonoursPage /></RequireAuth>} />
              <Route path="/dishonours/*" element={<RequireAuth><DishonoursPage /></RequireAuth>} />
              <Route path="/dishonour/:id" element={<RequireAuth><DishonourProfilePage /></RequireAuth>} />
              <Route path="/complaints" element={<RequireAuth><ComplaintsPage /></RequireAuth>} />
              <Route path="/complaints/*" element={<RequireAuth><ComplaintsPage /></RequireAuth>} />
              <Route path="/complaint/:id" element={<RequireAuth><ComplaintProfilePage /></RequireAuth>} />
              <Route path="/campaigns" element={<RequireAuth><CampaignsPage /></RequireAuth>} />
              <Route path="/campaigns/*" element={<RequireAuth><CampaignsPage /></RequireAuth>} />
              <Route path="/insurance" element={<RequireAuth><InsuranceBookPage /></RequireAuth>} />
              <Route path="/insurance/*" element={<RequireAuth><InsuranceBookPage /></RequireAuth>} />
              <Route path="/payments" element={<RequireAuth><PaymentsPage /></RequireAuth>} />
              <Route path="/payments/*" element={<RequireAuth><PaymentsPage /></RequireAuth>} />
              <Route path="/reports" element={<RequireAuth><ReportsPage /></RequireAuth>} />
              <Route path="/reports/*" element={<RequireAuth><ReportsPage /></RequireAuth>} />
              <Route path="/exports" element={<RequireAuth><ExportsPage /></RequireAuth>} />
              <Route path="/exports/*" element={<RequireAuth><ExportsPage /></RequireAuth>} />
              <Route path="/documents" element={<RequireAuth><DocumentsPage /></RequireAuth>} />
              <Route path="/documents/*" element={<RequireAuth><DocumentsPage /></RequireAuth>} />
              <Route path="/client/:id" element={<RequireAuth><ClientProfilePage /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
              <Route path="/settings/*" element={<RequireAuth><Settings /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <SoftphoneWrapper />
          </ToastProvider>
        </RouteProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
