import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { HomeScreen } from "@/pages/home-screen";
import { NotFound } from "@/pages/not-found";
import { Login } from "@/pages/login";
import { Navigate } from "react-router";
import { RouteProvider } from "@/providers/router-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "@/styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <RouteProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/workbench" element={<HomeScreen />} />
            <Route path="/settings" element={<HomeScreen />} />
            <Route path="/settings/*" element={<HomeScreen />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </RouteProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
