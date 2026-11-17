import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CartDrawer } from './CartDrawer';
import { Footer } from './Footer';
import { Header } from './Header';

export function Layout({ children }: { children: React.ReactNode }) {
  const { toast } = useStore();

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF8] text-[#111111]">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 border px-4 py-3 text-sm shadow-lg ${
            toast.type === 'error'
              ? 'border-[#991B1B] bg-[#FEF2F2] text-[#991B1B]'
              : 'border-[#111111] bg-[#111111] text-white'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
}
