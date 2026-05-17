"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ToastTone = "success" | "error";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastContextValue = {
  pushToast: (toast: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<
  ToastTone,
  {
    icon: typeof CheckCircle2;
    card: string;
    iconWrap: string;
    eyebrow: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    card:
      "border-emerald-300/25 bg-[linear-gradient(135deg,rgba(6,78,59,0.92),rgba(10,24,20,0.96))]",
    iconWrap: "bg-emerald-300/14 text-emerald-100",
    eyebrow: "text-emerald-200",
  },
  error: {
    icon: CircleAlert,
    card:
      "border-rose-300/25 bg-[linear-gradient(135deg,rgba(127,29,29,0.92),rgba(28,12,16,0.96))]",
    iconWrap: "bg-rose-300/14 text-rose-100",
    eyebrow: "text-rose-200",
  },
};

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    setToasts((current) => [...current, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-20 right-4 z-120 flex w-full max-w-md flex-col gap-3 sm:right-6">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  onClose,
}: {
  toast: ToastItem;
  onClose: (id: string) => void;
}) {
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    timeoutRef.current = window.setTimeout(() => onClose(toast.id), 3600);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [onClose, toast.id]);

  const tone = toneStyles[toast.tone];
  const Icon = tone.icon;

  return (
    <div
      className={`pointer-events-auto overflow-hidden rounded-[1.75rem] border p-4 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl ${tone.card}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl ${tone.iconWrap}`}
        >
          <Icon className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${tone.eyebrow}`}>
            {toast.tone === "success" ? "Success" : "Attention"}
          </p>
          <p className="mt-1 text-sm font-semibold text-white">{toast.title}</p>
          {toast.description ? (
            <p className="mt-1 text-sm leading-6 text-slate-200/90">{toast.description}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => onClose(toast.id)}
          className="rounded-full border border-white/10 p-2 text-slate-300 transition hover:border-white/20 hover:text-white"
          aria-label="Dismiss toast"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function useAdminToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useAdminToast must be used within AdminToastProvider.");
  }

  return context;
}

type AdminStatusToastProps = {
  successMessage?: string | null;
  errorMessage?: string | null;
};

export function AdminStatusToast({
  successMessage,
  errorMessage,
}: AdminStatusToastProps) {
  const { pushToast } = useAdminToast();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasShownRef = useRef(false);

  useEffect(() => {
    if (hasShownRef.current) {
      return;
    }

    if (!successMessage && !errorMessage) {
      return;
    }

    hasShownRef.current = true;

    if (successMessage) {
      pushToast({
        tone: "success",
        title: successMessage,
      });
    }

    if (errorMessage) {
      pushToast({
        tone: "error",
        title: errorMessage,
      });
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("success");
    params.delete("error");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [errorMessage, pathname, pushToast, router, searchParams, successMessage]);

  return null;
}
