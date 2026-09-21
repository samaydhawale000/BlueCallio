import type { Metadata } from "next";
import { pageMetadata } from "../lib/seo";
export const metadata: Metadata = pageMetadata({ title: "Billing & Usage Terms", description: "PurpleCallio billing and usage terms, including participant-minute measurement and payment information.", path: "/billing-terms" });
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
