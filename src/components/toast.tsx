// ─────────────────────────────────────────────────────────────────────────────
// Axis Toast System
// Usage: import { useToast, ToastContainer } from "@/components/toast"
// const { toast } = useToast();
// toast({ title: "Task completed", description: "Next: Quote Review", actions: [...] })
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { X, Check, RefreshCcw01, AlertCircle, InfoCircle } from "@untitledui/icons";

export type ToastVariant = "default" | "success" | "warning" | "error" | "info";

export interface ToastAction {
  label: string;
  variant?: "primary" | "ghost";
  onClick: () => void;
}

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;        // ms, default 5000. 0 = persist
  icon?: ReactNode;
  actions?: ToastAction[];
}

interface ToastItem extends ToastOptions {
  id: string;
  exiting: boolean;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
  }, []);

  const dismissAll = useCallback(() => {
    setToasts(prev => prev.map(t => ({ ...t, exiting: true })));
    setTimeout(() => setToasts([]), 350);
  }, []);

  const toast = useCallback((options: ToastOptions): string => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    const item: ToastItem = { ...options, id, exiting: false, duration: options.duration ?? 5000 };
    setToasts(prev => [item, ...prev].slice(0, 5)); // max 5 stacked
    return id;
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss, dismissAll }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// ─── Individual toast ─────────────────────────────────────────────────────────
const VARIANT_STYLES: Record<ToastVariant, { bar: string; icon: string; iconBg: string }> = {
  default: { bar: "bg-[#D34108]",    icon: "text-white",  iconBg: "bg-[#D34108]" },
  success: { bar: "bg-[#22C55E]",  icon: "text-white",  iconBg: "bg-[#16A34A]" },
  warning: { bar: "bg-[#F59E0B]",  icon: "text-white",  iconBg: "bg-[#D97706]" },
  error:   { bar: "bg-[#EF4444]",  icon: "text-white",    iconBg: "bg-[#DC2626]" },
  info:    { bar: "bg-[#6366F1]",      icon: "text-[#6366F1]",        iconBg: "bg-[#EEF2FF]" },
};

const DEFAULT_ICONS: Record<ToastVariant, ReactNode> = {
  default: <Check className="size-4" />,
  success: <Check className="size-4" />,
  warning: <RefreshCcw01 className="size-4" />,
  error:   <AlertCircle className="size-4" />,
  info:    <InfoCircle className="size-4" />,
};

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [progress, setProgress] = useState(100);
  const duration = item.duration ?? 5000;
  const variant = item.variant ?? "default";
  const styles = VARIANT_STYLES[variant];
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (duration === 0) return;
    startRef.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) onDismiss(item.id);
    };

    const interval = setInterval(tick, 50);
    timerRef.current = setTimeout(() => onDismiss(item.id), duration);
    return () => { clearInterval(interval); if (timerRef.current) clearTimeout(timerRef.current); };
  }, [duration, item.id, onDismiss]);

  return (
    <div className={
      "relative w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl " +
      "transition-all duration-300 ease-out " +
      (item.exiting ? "opacity-0 translate-x-full scale-95" : "opacity-100 translate-x-0 scale-100")
    } style={{ background: "#1A2535", border: "1px solid rgba(255,255,255,0.1)" }}>
      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 h-0.5 w-full" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div className={"h-full transition-none " + styles.bar} style={{ width: progress + "%" }} />
        </div>
      )}

      <div className="flex items-start gap-3 px-4 py-4">
        {/* Icon */}
        <div className={"flex size-9 shrink-0 items-center justify-center rounded-xl " + styles.iconBg}>
          <span className={styles.icon}>
            {item.icon ?? DEFAULT_ICONS[variant]}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm font-semibold leading-snug" style={{ color: "#FFFFFF" }}>{item.title}</p>
          {item.description && (
            <p className="text-sm mt-0.5 leading-snug" style={{ color: "rgba(255,255,255,0.6)" }}>{item.description}</p>
          )}

          {/* Actions */}
          {item.actions && item.actions.length > 0 && (
            <div className="flex items-center gap-3 mt-3">
              {item.actions.map((action, i) => (
                <button key={i} onClick={() => { action.onClick(); onDismiss(item.id); }}
                  className={
                    "text-sm font-semibold transition-colors " +
                    (action.variant === "ghost"
                      ? "hover:opacity-70"
                      : "font-semibold")
                  } style={{ color: action.variant === "ghost" ? "rgba(255,255,255,0.5)" : "#FF8C52" }}>
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dismiss */}
        <button onClick={() => onDismiss(item.id)}
          className="flex size-6 shrink-0 items-center justify-center rounded-md transition-colors mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}

// ─── Container ────────────────────────────────────────────────────────────────
function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none" style={{ maxWidth: "calc(100vw - 2rem)" }}>
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto w-full">
          <Toast item={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
