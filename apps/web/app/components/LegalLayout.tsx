import Link from "next/link";

export default function LegalLayout({
  title,
  lastUpdated,
  intro,
  children,
}: {
  title: string;
  lastUpdated?: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{ background: "#060B18", color: "#F1F5F9", minHeight: "100vh" }}
    >
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-28 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-4 border" style={{ background: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.3)', color: '#A5B4FC' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Legal
        </div>
        <h1 className="font-bold text-white mb-3" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.03em' }}>
          {title}
        </h1>
        {lastUpdated && (
          <p className="text-slate-500 text-sm mb-3">Last Updated: {lastUpdated}</p>
        )}
        {intro && (
          <p className="text-slate-400 text-base leading-relaxed max-w-2xl">{intro}</p>
        )}
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
        <div
          className="rounded-2xl border border-[#1A2642] px-7 sm:px-10 py-9"
          style={{ background: "#0D1421" }}
        >
          <div className="space-y-8">{children}</div>
        </div>

        {/* Contact CTA */}
        <div className="mt-12 rounded-xl p-8 text-center border border-[#2A3D64]" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))' }}>
          <p className="font-bold text-white mb-2 text-lg">Questions about this policy?</p>
          <p className="text-slate-400 text-sm mb-6">
            Our engineers are one email away.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="mailto:hello@bluejoinet.com" className="inline-flex items-center gap-2 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              hello@bluejoinet.com
            </a>
            <Link href="/" className="inline-flex items-center gap-2 text-slate-300 font-medium text-sm px-6 py-2.5 rounded-lg border border-[#1A2642] hover:border-[#2A3D64] transition-all">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LegalSection({ num, title, children }: { num?: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-semibold text-white mb-3" style={{ fontSize: '1.15rem' }}>
        {num && (
          <span className="gradient-text font-mono text-xs tracking-widest uppercase mr-3">{num}</span>
        )}
        {title}
      </h2>
      <div className="text-slate-400 text-sm leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export function LegalBullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 list-none">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span className="text-indigo-400 mt-0.5 text-xs">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
