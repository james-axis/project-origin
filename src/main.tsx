import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { HomeScreen } from "@/pages/home-screen";
import { TasksPage } from "@/pages/tasks";
import { ClientsPage } from "@/pages/clients";
import { ClientProfilePage } from "@/pages/client-profile";
import { ApplicationsPage } from "@/pages/applications";
import { ApplicationProfilePage } from "@/pages/application-profile";
import { NotFound } from "@/pages/not-found";
import { Login } from "@/pages/login";
import { RouteProvider } from "@/providers/router-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { RequireAuth } from "@/providers/auth-provider";
import { ToastProvider } from "@/components/toast";
import "@/styles/globals.css";

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
              <Route path="/client/:id" element={<RequireAuth><ClientProfilePage /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><HomeScreen /></RequireAuth>} />
              <Route path="/settings/*" element={<RequireAuth><HomeScreen /></RequireAuth>} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ToastProvider>
        </RouteProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
