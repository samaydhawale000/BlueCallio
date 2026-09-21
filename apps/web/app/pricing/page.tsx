import type { Metadata } from "next";
import { ContentSection, PublicPage } from "../components/marketing/PublicPage";
import PricingSection from "../components/PricingSection";
import { PricingCalculator } from "../components/marketing/InteractiveTools";
import { PricingAuthority } from "../components/PricingAuthority";
import { pageMetadata } from "../lib/seo";

export const metadata: Metadata = pageMetadata({
   title: "PurpleCallio Pricing | Usage-Based Audio & Video API",
   description:
      "PurpleCallio offers usage-based pricing for audio, video, and screen sharing participant-minutes, with a free monthly allowance.",
   path: "/pricing",
});
export default function PricingPage() {
   return (
      <main className="min-h-screen bg-[#060B18] pt-20">
         <PublicPage
            eyebrow="Pricing"
            title="Simple, usage-based pricing for real-time communication"
            intro="PurpleCallio uses usage-based participant-minute pricing. Wall-clock call duration and billable participant-minutes are different: two participants in a ten-minute call use twenty participant-minutes."
            crumbs={[
               { label: "Home", href: "/" },
               { label: "Pricing", href: "/pricing" },
            ]}
         >
            <ContentSection title="Current rates and billing categories">
               <PricingAuthority />
            </ContentSection>
            <ContentSection title="How participant-minute billing works">
               <p>
                  Each connected participant contributes one participant-minute
                  per minute in the applicable media category. Audio, video, and
                  screen sharing are separate usage categories; your dashboard
                  shows usage and invoices for your account.
               </p>
               <PricingCalculator />
            </ContentSection>
         </PublicPage>
         <PricingSection />
      </main>
   );
}
