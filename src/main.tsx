import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { HomeScreen } from "@/pages/home-screen";
import { NotFound } from "@/pages/not-found";
import { Login } from "@/pages/login";
import { Navigate } from "react-router";
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
              <Route path="/" element={<Navigate to="/workbench" replace />} />
              <Route path="/workbench" element={<RequireAuth><HomeScreen /></RequireAuth>} />
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
