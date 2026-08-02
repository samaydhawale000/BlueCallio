"use client";

import Link from "next/link";

const links = [
  {
    label: "Features",
    href: "/#features",
  },
  {
    label: "Pricing",
    href: "/#pricing",
  },
  {
    label: "Docs",
    href: "/docs",
  },
];

export default function NavLinks({
  mobile = false,
  onClick,
}) {
  return (
    <>
      {links.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          onClick={onClick}
          className={`
            relative
            transition-all
            duration-300
            hover:text-white

            ${
              mobile
                ? "block py-3 text-lg text-slate-300"
                : "text-sm text-slate-400 after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-sky-400 after:transition-all hover:after:w-full"
            }
          `}
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}