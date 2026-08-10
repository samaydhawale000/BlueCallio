import LegalLayout, { LegalSection, LegalBullets } from "../components/LegalLayout";

export const metadata = {
  title: "Refund & Cancellation Policy | BlueJoinet",
};

export default function RefundPage() {
  return (
    <LegalLayout
      title="Refund & Cancellation Policy"
      intro="This policy explains how cancellations and refunds work for BlueJoinet usage-based services."
    >
      <LegalSection num="1" title="Cancellation">
        <p>
          Customers may cancel their BlueJoinet account or paid services through the available
          billing controls or by contacting support.
        </p>
        <p>Cancellation does not automatically erase charges already incurred.</p>
      </LegalSection>

      <LegalSection num="2" title="Usage-Based Charges">
        <p>BlueJoinet may use usage-based billing.</p>
        <p>
          Charges are calculated based on actual billable usage recorded by BlueJoinet's systems.
        </p>
        <p>
          Because usage-based services are consumed in real time, charges for usage that has already
          occurred are generally non-refundable.
        </p>
      </LegalSection>

      <LegalSection num="3" title="Incorrect Charges">
        <p>If you believe your account was incorrectly charged, contact:</p>
        <LegalBullets items={["hello@bluejoinet.com"]} />
        <p>within 30 days of the charge.</p>
        <p>Please provide:</p>
        <LegalBullets items={[
          "Account email",
          "Invoice number",
          "Transaction ID",
          "Description of the issue",
        ]} />
        <p>We will review the usage records and billing information.</p>
      </LegalSection>

      <LegalSection num="4" title="Duplicate Payments">
        <p>
          If a duplicate payment occurs because of a technical or processing error, BlueJoinet will
          investigate and, where appropriate, issue a refund or adjustment.
        </p>
      </LegalSection>

      <LegalSection num="5" title="Failed Payments">
        <p>
          If a payment fails, BlueJoinet may retry the payment or restrict paid functionality.
        </p>
        <p>Customers remain responsible for valid charges incurred before the payment failure.</p>
      </LegalSection>

      <LegalSection num="6" title="Promotional Credits">
        <p>Promotional or complimentary credits:</p>
        <LegalBullets items={[
          "Have no cash value",
          "Cannot be transferred",
          "Cannot normally be refunded",
          "May expire according to the applicable promotion",
        ]} />
      </LegalSection>

      <LegalSection num="7" title="Account Termination">
        <p>
          If an account is terminated because of a violation of our Terms or Acceptable Use Policy,
          previously incurred charges generally remain payable.
        </p>
      </LegalSection>

      <LegalSection num="8" title="Refund Processing">
        <p>Approved refunds will be processed through the applicable payment provider.</p>
        <p>
          The time required for the funds to appear in your account may depend on the payment
          provider and customer's financial institution.
        </p>
      </LegalSection>

      <LegalSection num="9" title="Policy Changes">
        <p>BlueJoinet may update this policy from time to time.</p>
      </LegalSection>
    </LegalLayout>
  );
}
