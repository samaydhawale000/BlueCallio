'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

/**
 * Global marketing header. Hidden on internal section routes
 * (admin + dashboard) which provide their own chrome.
 */
export default function SiteHeader() {
  const pathname = usePathname();

const hidden =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/call');

  if (hidden) return null;

  return <Header />;
}
