"use client";

import { Toaster, toast } from "sonner";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster 
        position="bottom-center" 
        expand={true} 
        richColors 
        closeButton
        toastOptions={{
          style: {
             borderRadius: '1.5rem',
             padding: '1rem 1.5rem',
             border: '1px solid var(--outline-variant)',
             fontFamily: 'var(--font-headline)',
             fontWeight: 800,
             letterSpacing: '-0.02em',
             boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
             background: 'rgba(255, 255, 255, 0.9)',
             backdropFilter: 'blur(10px)',
          }
        }}
      />
    </>
  );
}

export const useToast = () => {
  return {
    showToast: (message: string, type: "success" | "error" | "info" = "info") => {
      if (type === "success") toast.success(message);
      else if (type === "error") toast.error(message);
      else toast(message);
    }
  };
};
