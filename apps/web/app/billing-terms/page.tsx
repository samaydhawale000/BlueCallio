"use client";

import { useEffect, useState } from "react";
import LegalLayout, { LegalSection, LegalBullets } from "../components/LegalLayout";
import { api } from "../lib/api";

export default function BillingTermsPage() {
  const [rates, setRates] = useState<{
    audioPaise: number;
    videoPaise: number;
    screenSharePaise: number;
    freeAudioMins: number;
    freeVideoMins: number;
    taxPercent: number;
  } | null>(null);

  useEffect(() => {
    let active = true;
    api
      .get("/billing/rates")
      .then((res) => { if (active) setRates(res.data); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const paiseToINR = (p: number) => `₹${((p ?? 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const gst = rates?.taxPercent ?? 18;

  return (
    <LegalLayout
      title="Billing & Usage Terms"
      lastUpdated="24 August 2025"
      intro="These Billing & Usage Terms explain how BlueCallio measures, calculates, and charges for usage-based services."
    >
      <LegalSection num="1" title="Usage-Based Pricing">
        <p>
          BlueCallio charges customers based on the services they consume according to the rates
          displayed on the applicable pricing page.
        </p>
        <p>There are no subscription fees or up-front costs — you only pay for what you use.</p>
      </LegalSection>

      <LegalSection num="2" title="Participant-Minute Billing">
        <p>
          For communication services billed per participant-minute, one participant using the
          applicable service for one minute equals one participant-minute.
        </p>
        <p>For example:</p>
        <LegalBullets items={[
          "Audio: 2 participants × 10 minutes = 20 audio participant-minutes",
          "Video: 3 participants × 20 minutes = 60 video participant-minutes",
        ]} />
        <p>
          This is important because the per-minute rate (e.g. {rates ? paiseToINR(rates.videoPaise) : "₹0.80"} for
          video) applies per participant, not per room.
        </p>
      </LegalSection>

      <LegalSection num="3" title="Different Communication Types">
        <p>BlueCallio may apply different rates to:</p>
        <LegalBullets items={[
          "Audio",
          "Video",
          "Screen sharing",
        ]} />
        <p>
          The applicable rates are displayed on the pricing page and may vary by currency, region,
          product, or service.
        </p>
        <p>
          Current rates: Audio {rates ? paiseToINR(rates.audioPaise) : "₹0.20"}/participant-min, Video{" "}
          {rates ? paiseToINR(rates.videoPaise) : "₹0.80"}/participant-min, Screen share +{" "}
          {rates ? paiseToINR(rates.screenSharePaise) : "₹0.10"}/participant-min on top of Video.
        </p>
      </LegalSection>

      <LegalSection num="4" title="Usage Transitions">
        <p>
          If a session changes communication modes during a call, BlueCallio may calculate usage
          separately for the applicable periods.
        </p>
        <p>For example: 10 minutes of Audio + 5 minutes of Video + 3 minutes of Screen Sharing.</p>
        <p>Each applicable usage segment is rated according to its applicable rate.</p>
      </LegalSection>

      <LegalSection num="5" title="Participant Changes">
        <p>
          If participants join or leave a session, usage is calculated according to the number of
          participants using the service during the applicable period.
        </p>
        <p>
          Therefore, a single call can produce different participant-minute totals over its lifetime.
        </p>
      </LegalSection>

      <LegalSection num="6" title="Usage Records">
        <p>BlueCallio's backend usage records are the authoritative source for billing calculations.</p>
        <p>
          Customer dashboards may display estimated or current usage, but final invoices are generated
          from BlueCallio's billing records.
        </p>
      </LegalSection>

      <LegalSection num="7" title="Usage Rounding">
        <p>BlueCallio tracks usage in per-second increments.</p>
        <p>
          For invoice display, usage is rounded up to the nearest minute per usage segment. Billing is
          calculated on the underlying per-second usage.
        </p>
      </LegalSection>

      <LegalSection num="8" title="Free Allowance">
        <p>
          Every account receives a monthly free allowance of{" "}
          {rates?.freeAudioMins ?? 500} audio and {rates?.freeVideoMins ?? 200} video
          participant-minutes, plus unlimited projects and developers.
        </p>
        <p>
          Screen sharing has no free allowance and is always billable. Usage beyond the free allowance
          is billed at the applicable rates.
        </p>
      </LegalSection>

      <LegalSection num="9" title="Usage Alerts">
        <p>
          BlueCallio may provide usage notifications when customers approach configured usage or
          spending thresholds.
        </p>
        <p>Customers are responsible for monitoring their usage.</p>
      </LegalSection>

      <LegalSection num="10" title="Payment Authorization">
        <p>Customers must maintain a valid payment method for paid usage.</p>
        <p>
          Where supported, BlueCallio may automatically charge the customer's payment method for
          billable usage.
        </p>
        <p>A {gst}% GST applies on billable usage.</p>
      </LegalSection>

      <LegalSection num="11" title="Failed Payments">
        <p>
          If a payment fails, BlueCallio retries and notifies you, then enters a 7-day grace period.
        </p>
        <p>
          During the grace period existing calls continue uninterrupted, but new calls are paused until
          the payment succeeds.
        </p>
      </LegalSection>

      <LegalSection num="12" title="Billing Disputes">
        <p>Customers should report suspected billing errors within 30 days of the applicable invoice.</p>
        <p>BlueCallio may review:</p>
        <LegalBullets items={[
          "Call records",
          "Participant events",
          "Usage segments",
          "Pricing rules",
          "Payment records",
        ]} />
      </LegalSection>
    </LegalLayout>
  );
}
