"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Menu } from "lucide-react";
import logo from "../../assets/images/logo.png";
import NavLinks from "./NavLinks";
import MobileMenu from "./MobileMenu";
import { useAuthStore } from "../../store/auth.store";

export default function Header() {
  const { token, user, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

const isLoggedIn = !!token;
  const displayName = user?.name || user?.email || 'Account';
  const avatarUrl = user?.avatarUrl || '';
// /call is a full-screen meeting page — hide the marketing nav there.
  const isCallPage = pathname?.startsWith("/call") ?? false;
  // Dashboard has its own app layout with a sidebar — hide the marketing nav.
  const isAppPage =
    pathname?.startsWith("/dashboard") ?? false;
  // Login/signup are auth pages — hide the marketing nav there too.
  const isAuthPage =
    pathname?.startsWith("/login") || pathname?.startsWith("/signup") || false;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

if (isCallPage || isAppPage || isAuthPage) {
    return null;
  }

  return (
    <>
      <header
        className={`
          fixed
          top-0
          left-0
          right-0
          z-40
          transition-all
          duration-300
          ${
            scrolled
              ? "border-b border-[#1A2642] bg-[#050816]/80 backdrop-blur-xl shadow-lg"
              : "bg-transparent"
          }
        `}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          {/* Logo */}

          <Link href="/" className="flex items-center gap-3">
            <Image
              src={logo}
              alt="BlueCallio"
              width={36}
              height={36}
              className="object-contain"
            />

            <span className="font-mono text-xl font-bold tracking-tight text-white">
              BlueCallio
            </span>
          </Link>

          {/* Desktop Navigation */}

          <nav className="hidden items-center gap-8 lg:flex">
            <NavLinks />
          </nav>

          {/* Desktop Actions */}

          <div className="hidden items-center gap-3 lg:flex">
{isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
                  title={displayName}
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                    >
                      {(displayName || 'U')[0].toUpperCase()}
                    </span>
                  )}
                  Dashboard
                </Link>

                <button
                  onClick={() => {
                    logout();
                    router.push("/");
                  }}
                  className="rounded-lg border border-[#1A2642] px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-slate-400 transition hover:text-white"
                >
                  Log In
                </Link>

                <Link
                  href="/signup"
                  className="btn-primary rounded-lg px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}

          <button
            onClick={() => setMenuOpen(true)}
            className="group flex h-11 w-11 items-center justify-center rounded-lg border border-[#1A2642] transition hover:border-[#2A3D64] lg:hidden"
            aria-label="Open Menu"
          >
            <Menu
              size={22}
              className="text-slate-300 transition group-hover:text-white"
            />
          </button>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </>
  );
}