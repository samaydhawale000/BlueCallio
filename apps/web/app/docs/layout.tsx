import type { Metadata } from "next";
import { pageMetadata } from "../lib/seo";
export const metadata: Metadata = pageMetadata({ title: "Documentation", description: "BlueCallio documentation for real-time communication APIs, hosted UI, React components, the JavaScript SDK, calls, webhooks, and usage billing.", path: "/docs" });
export default function DocsLayout({ children }: { children: React.ReactNode }) { return children; }
