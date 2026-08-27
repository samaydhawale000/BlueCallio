"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import NavLinks from "./NavLinks";
import { useAuthStore } from "../../store/auth.store";

export default function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { token, logout } = useAuthStore();
  const isLoggedIn = !!token;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              duration: 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="fixed right-0 top-0 z-50 flex h-screen w-[320px] max-w-[85vw] flex-col border-l border-[#1A2642] bg-[#050816]/95 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1A2642] px-6 py-5">
              <span className="font-mono text-lg font-bold text-white">
                BlueCallio
              </span>

              <button
                onClick={onClose}
                aria-label="Close menu"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <X size={22} />
              </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-6 py-8">
              <nav className="flex flex-col gap-2">
                <NavLinks mobile onClick={onClose} />
              </nav>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-[#1A2642] p-6">
              <div className="flex flex-col gap-3">
                {isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    onClick={onClose}
                    className="btn-primary rounded-lg py-3 text-center text-sm font-medium text-white transition hover:opacity-90"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="rounded-lg border border-[#1A2642] py-3 text-center text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
                  >
                    Log In
                  </Link>
                )}

                {isLoggedIn ? (
                  <button
                    onClick={() => {
                      onClose();
                      logout();
                      window.location.href = "/";
                    }}
                    className="rounded-lg border border-[#1A2642] py-3 text-center text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
                  >
                    Logout
                  </button>
                ) : (
                  <Link
                    href="/signup"
                    onClick={onClose}
                    className="btn-primary rounded-lg py-3 text-center text-sm font-medium text-white transition hover:opacity-90"
                  >
                    Get Started Free
                  </Link>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}