import { Navigate, useLocation } from "react-router";
import type { PropsWithChildren } from "react";

const AUTH_KEY = "axis_authenticated";

export function setAuthenticated() {
  sessionStorage.setItem(AUTH_KEY, "1");
}

export function clearAuthenticated() {
  sessionStorage.removeItem(AUTH_KEY);
}

export function isAuthenticated() {
  return sessionStorage.getItem(AUTH_KEY) === "1";
}

export function RequireAuth({ children }: PropsWithChildren) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
