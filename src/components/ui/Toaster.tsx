'use client';
import { createContext, useCallback, useContext, useState } from "react";
import * as Toast from "@radix-ui/react-toast";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: "success" | "error" | "info";
}

const ToastContext = createContext<{ toast: (t: Omit<ToastItem, "id">) => void }>({
  toast: () => {},
});

export const useToast = () => useContext(ToastContext);

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((t: Omit<ToastItem, "id">) => {
    const id = nextId++;
    setItems((s) => [...s, { ...t, id }]);
    setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 4500);
  }, []);

  const color =
    (v: ToastItem["variant"]) =>
      v === "success" ? "border-green-500" : v === "error" ? "border-red-500" : "border-teal-400";

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Toast.Provider swipeDirection="right">
        {items.map((t) => (
          <Toast.Root
            key={t.id}
            className={`grid gap-1 rounded-lg border-l-4 border border-slate-200 bg-white p-4 shadow-lg ${color(t.variant)}`}
            role={t.variant === "error" ? "alert" : "status"}
          >
            <Toast.Title className="text-sm font-semibold">{t.title}</Toast.Title>
            {t.description && <Toast.Description className="text-sm text-slate-500">{t.description}</Toast.Description>}
          </Toast.Root>
        ))}
        <Toast.Viewport className="fixed bottom-4 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-80 flex-col gap-2" aria-label="Notifications" />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}
