import { type Metadata } from "next";
import Link from "next/link";
import { CHANGELOG, CURRENT_METHODOLOGY_VERSION } from "@/lib/methodology";

export const metadata: Metadata = {
  title: "QOAT methodology — Know before you pay",
  description:
    "How QOAT scores trade quotes using the iron triangle of Price, Reputation, and Time — and what AI does and doesn't do.",
};

function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[16px] px-6 py-6 space-y-3" style={{ borderLeft: `4px solid ${accent}` }}>
      <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: accent === "#7DD4C0" ? "#085041" : accent === "#F4A7C3" ? "#7a2f52" : "#1a4a6e" }}>
        {title}
      </p>
      <div className="space-y-2 text-sm leading-relaxed" style={{ color: "#444444" }}>
        {children}
      </div>
    </div>
  );
}

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-surface pt-14 py-16 px-6 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-10">

        {/* Header */}
        <header className="space-y-4">
          <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
            Transparency
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">
            QOAT methodology
          </h1>
          <p className="text-on-surface-variant leading-relaxed max-w-lg">
            Every quote analysis on QOAT is scored using the same framework. Here&apos;s exactly what goes into each score, where the data comes from, and what the AI does and doesn&apos;t do.
          </p>
        </header>

        {/* Iron triangle intro */}
        <section className="bg-surface-container-lowest rounded-[16px] px-6 py-6 space-y-4">
          <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
            The iron triangle
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#444444" }}>
            Project management has a concept called the iron triangle: every project is constrained by <strong>cost</strong>, <strong>quality</strong>, and <strong>time</strong>. You can optimise two at most — not all three.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#444444" }}>
            QOAT applies this to trade quotes. We score each dimension independently, then combine them into a single QOAT Score — weighted to reflect what matters most to consumers:
          </p>
          <div className="flex flex-col gap-2 pt-1">
            {[
              { label: "Price", weight: "40%", color: "#7DD4C0" },
              { label: "Reputation", weight: "35%", color: "#F4A7C3" },
              { label: "Time", weight: "25%", color: "#89CFF0" },
            ].map(({ label, weight, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-sm font-semibold text-on-surface">{label}</span>
                <span className="text-sm text-on-surface-variant">{weight} of overall score</span>
              </div>
            ))}
          </div>
        </section>

        {/* Score sections */}
        <div className="space-y-4">
          <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
            How each dimension is scored
          </p>

          <Section title="Price scoring" accent="#7DD4C0">
            <p>
              The AI estimates a fair market price range for the described job based on its knowledge of Australian trade rates, adjusted for location (suburb and state) when provided.
            </p>
            <p>
              When enough similar quotes exist in the QOAT community (minimum 3), the scoring is benchmarked against real comparable jobs using semantic similarity matching. Community data is weighted more heavily as the sample size grows.
            </p>
            <p>
              A score of 10 means the price is a genuine bargain. A score of 1 means it&apos;s significantly above market. A &quot;fair&quot; verdict sits in the middle, reflecting typical market pricing.
            </p>
          </Section>

          <Section title="Reputation scoring" accent="#F4A7C3">
            <p>
              Reputation reflects the trustworthiness and professionalism of the supplier based on verifiable signals found in or about the quote:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>ABN provided and formatted correctly</li>
              <li>Trade licence number present (and whether one is legally required for this work)</li>
              <li>Public liability or professional indemnity insurance mentioned</li>
              <li>Google Reviews rating and review count (fetched live from Google Places)</li>
              <li>Number of times this supplier has appeared in other QOAT quotes</li>
            </ul>
            <p>
              A supplier with a valid ABN, required licence, insurance, and strong Google reviews will score high. Missing a legally-required licence is a significant red flag.
            </p>
          </Section>

          <Section title="Time scoring" accent="#89CFF0">
            <p>
              Time scores the realism of the estimated timeframe relative to the size and complexity of the job.
            </p>
            <p>
              QOAT extracts the job size from the quote — the quantity, unit, and overall scale (small / medium / large). The AI then assesses whether the quoted timeframe is fast, typical, or slow for a job of that size.
            </p>
            <p>
              A 16-week timeframe for replacing 3 skylights would score poorly. The same timeframe for a full home renovation would score well. Where possible, the explanation references time-per-unit (e.g. &quot;typical pace is 2–3 weeks for 3 skylights&quot;).
            </p>
          </Section>

          <div className="bg-white rounded-[16px] px-6 py-6 space-y-3" style={{ borderLeft: "4px solid #E0E0E0" }}>
            <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
              Compliance check
            </p>
            <div className="space-y-2 text-sm leading-relaxed" style={{ color: "#444444" }}>
              <p>
                Separate from the iron triangle, QOAT runs a compliance check to flag whether the type of work typically requires a council permit or certificate of compliance (electrical, plumbing, gas) under Australian regulations.
              </p>
              <p>
                This is guidance only — permit requirements vary by council, scope, and state. QOAT&apos;s assessment is designed to prompt the right questions, not replace professional advice. Always confirm with your local council.
              </p>
            </div>
          </div>
        </div>

        {/* What AI does and doesn't do */}
        <section className="bg-surface-container-lowest rounded-[16px] px-6 py-6 space-y-4">
          <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
            What AI does and doesn&apos;t do
          </p>
          <div className="space-y-3 text-sm leading-relaxed" style={{ color: "#444444" }}>
            <div>
              <p className="font-semibold text-on-surface mb-1">AI does:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Extract structured data from uploaded quote documents (PDF or image)</li>
                <li>Score each iron triangle dimension based on extracted data and market knowledge</li>
                <li>Flag red flags, missing information, and questions to ask</li>
                <li>Assess permit and compliance requirements for the job type</li>
                <li>Incorporate community comparable data and live reputation signals into scoring</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-on-surface mb-1">AI doesn&apos;t:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Verify licence or ABN validity with government registries (signals reflect what&apos;s on the quote)</li>
                <li>Guarantee price accuracy — market rates vary and AI knowledge has a training cutoff</li>
                <li>Give legal or financial advice — always consult a professional for high-value decisions</li>
                <li>Access private supplier information beyond what appears in the document</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Changelog */}
        <section className="space-y-4">
          <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
            Changelog
          </p>
          <div className="space-y-3">
            {CHANGELOG.map((entry) => (
              <div key={entry.version} className="bg-surface-container-lowest rounded-[16px] px-6 py-5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-on-surface">{entry.version}</span>
                  <span className="text-xs text-on-surface-variant">{entry.date}</span>
                  {entry.version === CURRENT_METHODOLOGY_VERSION && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#E1F5EE", color: "#085041" }}>
                      Current
                    </span>
                  )}
                </div>
                <ul className="space-y-1">
                  {entry.changes.map((change, i) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: "#444444" }}>
                      <span className="shrink-0" style={{ color: "#888888" }}>—</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Footer nav */}
        <div className="pt-2 pb-4">
          <Link
            href="/"
            className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            ← Back to quotes
          </Link>
        </div>

      </div>
    </main>
  );
}
