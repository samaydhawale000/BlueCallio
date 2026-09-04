"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Mail,
  ArrowUpRight,
} from "lucide-react";

import logo from "../../assets/images/logo.png";

const footerLinks = {
  Product: [
    { name: "Features", href: "/#features" },
    { name: "Products", href: "/#products" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Documentation", href: "/docs" },
    { name: "Playground", href: "/dashboard/playground" },
  ],

Resources: [
    { name: "FAQ", href: "/faq" },
    { name: "Support", href: "mailto:hello@bluecallio.com" },
    { name: "Docs", href: "/docs" },
    { name: "Roadmap", href: "/docs#faq" },
  ],

  Legal: [
    { name: "Terms of Service", href: "/terms" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Refund & Cancellation", href: "/refund" },
    { name: "Acceptable Use", href: "/acceptable-use" },
    { name: "Billing & Usage", href: "/billing-terms" },
  ],
};

export default function Footer() {
const pathname = usePathname();
  // Dashboard has its own app layout — hide the marketing footer there.
  if (pathname?.startsWith("/dashboard")) {
    return null;
  }
  // Login/signup are auth pages — hide the marketing footer there too.
  if (pathname?.startsWith("/login") || pathname?.startsWith("/signup")) {
    return null;
  }

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#050816]">

      {/* Glow */}

      <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-sky-500/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-6 py-20">

        <div className="grid gap-16 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">

          {/* Left */}

          <div>

            <Link
              href="/"
              className="flex items-center gap-3"
            >
              <Image
                src={logo}
                alt="BlueCallio"
                width={46}
                height={46}
              />

              <span className="text-2xl font-bold text-white">
                BlueCallio
              </span>
            </Link>

            <p className="mt-6 max-w-sm leading-8 text-slate-400">
              Communication infrastructure for modern software.
              Build secure video meetings with APIs,
              WebSocket signaling and hosted UI.
            </p>

            <div className="mt-8 flex gap-3">

              <Social href="mailto:hello@bluecallio.com">
                <Mail size={18} />
              </Social>

            </div>

          </div>

          {Object.entries(footerLinks).map(([title, items]) => (
            <div key={title}>

              <h3 className="mb-5 font-semibold text-white">
                {title}
              </h3>

              <div className="space-y-4">

                {items.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="group flex items-center gap-1 text-sm text-slate-400 transition hover:text-white"
                  >
                    {item.name}

                    <ArrowUpRight
                      size={14}
                      className="opacity-0 transition group-hover:opacity-100"
                    />

                  </Link>
                ))}

              </div>

            </div>
          ))}

        </div>

        <div className="my-12 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="flex flex-col items-center justify-between gap-4 text-sm text-slate-500 md:flex-row">

          <span>
            © {new Date().getFullYear()} BlueCallio. All rights reserved.
          </span>

<div className="flex items-center gap-6">

            <Link
              href="/privacy"
              className="transition hover:text-white"
            >
              Privacy
            </Link>

            <Link
              href="/terms"
              className="transition hover:text-white"
            >
              Terms
            </Link>

            <Link
              href="/refund"
              className="transition hover:text-white"
            >
              Refund Policy
            </Link>

            <Link
              href="/billing-terms"
              className="transition hover:text-white"
            >
              Billing &amp; Usage
            </Link>

          </div>

        </div>

      </div>

    </footer>
  );
}

function Social({ href, children }) {
  return (
    <Link
      href={href}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-slate-400 transition-all duration-300 hover:-translate-y-1 hover:border-sky-500 hover:text-white"
    >
      {children}
    </Link>
  );
}