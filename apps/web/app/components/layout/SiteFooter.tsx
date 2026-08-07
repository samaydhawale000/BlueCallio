'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

/**
 * Global marketing footer. Hidden on internal section routes
 * (admin + dashboard) which provide their own chrome.
 */
export default function SiteFooter() {
  const pathname = usePathname();

const hidden =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/call');

  if (hidden) return null;

  return <Footer />;
}
