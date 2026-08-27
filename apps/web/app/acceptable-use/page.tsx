import LegalLayout, { LegalSection, LegalBullets } from "../components/LegalLayout";

export const metadata = {
  title: "Acceptable Use Policy | BlueCallio",
};

export default function AcceptableUsePage() {
  return (
    <LegalLayout
      title="Acceptable Use Policy"
      intro="BlueCallio provides communication infrastructure intended for legitimate business and software applications. You must not use BlueCallio for activities that are illegal, abusive, fraudulent, or harmful."
    >
      <LegalSection num="1" title="Prohibited Activities">
        <p className="font-semibold text-slate-300">Illegal Activity</p>
        <p>You may not use BlueCallio to facilitate or promote illegal activities.</p>

        <p className="font-semibold text-slate-300">Fraud</p>
        <p>You may not use BlueCallio for:</p>
        <LegalBullets items={[
          "Phishing",
          "Scams",
          "Identity theft",
          "Payment fraud",
          "Impersonation",
          "Deceptive schemes",
        ]} />

        <p className="font-semibold text-slate-300">Malware</p>
        <p>You may not use the Service to distribute:</p>
        <LegalBullets items={[
          "Malware",
          "Viruses",
          "Ransomware",
          "Trojans",
          "Malicious scripts",
        ]} />

        <p className="font-semibold text-slate-300">Abuse</p>
        <p>You may not use BlueCallio to:</p>
        <LegalBullets items={[
          "Harass",
          "Threaten",
          "Intimidate",
          "Stalk",
          "Abuse other individuals",
        ]} />

        <p className="font-semibold text-slate-300">Unauthorized Access</p>
        <p>You may not:</p>
        <LegalBullets items={[
          "Attack BlueCallio infrastructure",
          "Attempt to bypass authentication",
          "Access another customer's account",
          "Exploit vulnerabilities without authorization",
          "Interfere with the Service",
        ]} />

        <p className="font-semibold text-slate-300">Infrastructure Abuse</p>
        <p>You may not intentionally:</p>
        <LegalBullets items={[
          "Create excessive connections",
          "Generate abusive traffic",
          "Circumvent rate limits",
          "Create automated workloads designed to degrade the Service",
          "Use the Service to attack third-party infrastructure",
        ]} />

        <p className="font-semibold text-slate-300">Spam</p>
        <p>You may not use BlueCallio to facilitate unlawful or abusive spam campaigns.</p>

        <p className="font-semibold text-slate-300">Misuse of Communication Features</p>
        <p>Customers must ensure that their applications comply with applicable laws relating to:</p>
        <LegalBullets items={[
          "User consent",
          "Privacy",
          "Recording",
          "Communication monitoring",
          "Data protection",
        ]} />
      </LegalSection>

      <LegalSection num="2" title="Security Research">
        <p>
          Responsible security research may be permitted under BlueCallio's vulnerability disclosure
          process.
        </p>
        <p>Researchers must not:</p>
        <LegalBullets items={[
          "Access customer data",
          "Disrupt production services",
          "Conduct denial-of-service attacks",
          "Destroy or modify data",
        ]} />
      </LegalSection>

      <LegalSection num="3" title="Enforcement">
        <p>If we reasonably believe an account violates this policy, BlueCallio may:</p>
        <LegalBullets items={[
          "Investigate the activity",
          "Request additional information",
          "Restrict functionality",
          "Suspend the account",
          "Terminate the account",
          "Report activity to appropriate authorities where legally required",
        ]} />
        <p>We may take immediate action where necessary to protect users or infrastructure.</p>
      </LegalSection>
    </LegalLayout>
  );
}
