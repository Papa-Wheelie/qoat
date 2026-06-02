import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — QOAT",
  description: "The terms that govern your use of QOAT, the AI-powered trade quote analysis service.",
};

const LAST_UPDATED = "02 June 2026";

// Governing law jurisdiction — update if needed
const GOVERNING_STATE = "Victoria";

const TOC = [
  { id: "s1",  title: "Acceptance of terms" },
  { id: "s2",  title: "What QOAT does" },
  { id: "s3",  title: "What QOAT is not" },
  { id: "s4",  title: "Eligibility" },
  { id: "s5",  title: "Accounts" },
  { id: "s6",  title: "Your content" },
  { id: "s7",  title: "Community content rules" },
  { id: "s8",  title: "AI limitations" },
  { id: "s9",  title: "Pricing data" },
  { id: "s10", title: "Intellectual property" },
  { id: "s11", title: "Liability" },
  { id: "s12", title: "Termination" },
  { id: "s13", title: "Changes to these terms" },
  { id: "s14", title: "Governing law" },
  { id: "s15", title: "Contact" },
];

function Section({ id, n, title, children }: { id: string; n: number; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-4 pt-2">
      <h2 className="text-xl font-bold text-primary tracking-tight">
        {n}. {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: "#444444" }}>
        {children}
      </div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-5 space-y-1">{children}</ul>;
}

function Li({ children }: { children: React.ReactNode }) {
  return <li>{children}</li>;
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-surface pt-14 py-16 px-6 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-10">

        {/* Header */}
        <header className="space-y-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">Legal</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">Terms of Service</h1>
          <p className="text-sm text-on-surface-variant">Last updated: {LAST_UPDATED}</p>
        </header>

        {/* Draft callout */}
        <div className="rounded-[12px] px-5 py-4 text-sm leading-relaxed" style={{ backgroundColor: "#FAEEDA", color: "#633806", border: "1px solid #F4D4A0" }}>
          <strong>Draft — pending legal review.</strong> These terms will be finalised before launch. If anything is unclear or you have questions, <Link href="/contact" className="underline hover:opacity-80">contact us</Link>.
        </div>

        {/* Table of contents */}
        <nav className="bg-white rounded-[16px] px-6 py-5 space-y-2">
          <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-3">Contents</p>
          <ol className="space-y-1.5">
            {TOC.map(({ id, title }, i) => (
              <li key={id}>
                <a href={`#${id}`} className="text-sm text-on-surface hover:text-primary transition-colors hover:underline underline-offset-2">
                  {i + 1}. {title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Sections */}
        <div className="space-y-10">

          <Section id="s1" n={1} title="Acceptance of terms">
            <P>By accessing or using QOAT (&ldquo;the Service&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, please do not use QOAT.</P>
            <P>These terms apply to all visitors, users, and anyone who accesses the Service — whether or not they have an account.</P>
          </Section>

          <Section id="s2" n={2} title="What QOAT does">
            <P>QOAT is an online platform that helps users evaluate trade and supplier quotes. When you upload a quote document, QOAT:</P>
            <Ul>
              <Li>Extracts structured data using AI (supplier name, line items, totals, timeframe, and other details)</Li>
              <Li>Scores the quote across three dimensions — Price, Reputation, and Time — using the &ldquo;iron triangle&rdquo; framework</Li>
              <Li>Identifies potential red flags, suggests questions to ask, and provides an overall recommendation</Li>
              <Li>Benchmarks the price against community-submitted comparable quotes where available</Li>
              <Li>Checks for common Australian permit and compliance requirements relevant to the work described</Li>
              <Li>Provides community engagement features: comments, votes, reactions, and shared pricing data</Li>
            </Ul>
          </Section>

          <Section id="s3" n={3} title="What QOAT is not">
            <P>These are important limitations you should understand before relying on QOAT:</P>
            <Ul>
              <Li><strong>Not legal advice</strong> — nothing on QOAT constitutes legal advice. The compliance check is general guidance only. Confirm permit requirements with your local council and seek legal advice for complex situations.</Li>
              <Li><strong>Not financial advice</strong> — QOAT does not provide financial advice. Quote analysis is for informational purposes only and should not be the sole basis for financial decisions.</Li>
              <Li><strong>Not a guarantee of accuracy</strong> — AI analysis may be incorrect, incomplete, or outdated. Pricing data reflects the AI&apos;s training knowledge and community submissions, both of which have limitations. Always verify important details independently.</Li>
              <Li><strong>Not a party to your contracts</strong> — QOAT has no involvement in any agreement between you and a supplier. We do not verify suppliers, guarantee their work, or accept any liability for outcomes from contracts you enter into.</Li>
              <Li><strong>Not a licensed trade referral service</strong> — QOAT does not vet, recommend, or endorse any specific supplier.</Li>
            </Ul>
          </Section>

          <Section id="s4" n={4} title="Eligibility">
            <P>You must be at least 16 years old to use QOAT. By using the Service, you represent that you meet this requirement.</P>
            <P>QOAT is designed for the Australian market. The Service is available globally, but pricing benchmarks, compliance guidance, and trade standards are based on Australian conditions and may not be relevant in other jurisdictions.</P>
          </Section>

          <Section id="s5" n={5} title="Accounts">
            <Ul>
              <Li>You are responsible for keeping your account password secure. Do not share your credentials.</Li>
              <Li>You may create one account per person. Creating multiple accounts to circumvent moderation actions is prohibited.</Li>
              <Li>You are responsible for all activity that occurs under your account.</Li>
              <Li>We may suspend or terminate accounts that breach these terms, engage in fraud, or are used to harm other users or the Service.</Li>
              <Li>Notify us promptly at <Link href="/contact" className="underline hover:opacity-80">/contact</Link> if you suspect unauthorised access to your account.</Li>
            </Ul>
          </Section>

          <Section id="s6" n={6} title="Your content">
            <P>You retain ownership of the quote documents you upload and any comments or contributions you make.</P>
            <P>By uploading content, you grant QOAT a non-exclusive, royalty-free licence to store, process, and display that content as necessary to provide the Service — including sending it to our AI providers for analysis and displaying public-facing elements to other users as described in our <Link href="/privacy" className="underline hover:opacity-80">Privacy Policy</Link>.</P>
            <P>You represent and warrant that:</P>
            <Ul>
              <Li>You have the right to upload the content (e.g. you received the quote or have permission to share it)</Li>
              <Li>The content does not infringe any third-party intellectual property rights</Li>
              <Li>The content does not contain personal information about others that you do not have authority to share</Li>
            </Ul>
          </Section>

          <Section id="s7" n={7} title="Community content rules">
            <P>When contributing to the QOAT community (comments, reports, reactions, similar-quote submissions), you must not:</P>
            <Ul>
              <Li>Post content that is offensive, abusive, defamatory, discriminatory, or harassing</Li>
              <Li>Share false or misleading information designed to damage a supplier&apos;s reputation</Li>
              <Li>Post personal information about others (suppliers, tradespeople, or other users) without their consent</Li>
              <Li>Impersonate any person or organisation</Li>
              <Li>Post spam, promotional content, or links to third-party services</Li>
              <Li>Attempt to manipulate scores, votes, or community data</Li>
              <Li>Use QOAT to engage in any illegal activity</Li>
            </Ul>
            <P>We reserve the right to moderate, edit, or remove any content at our discretion, and to suspend or terminate accounts that repeatedly violate these rules.</P>
          </Section>

          <Section id="s8" n={8} title="AI limitations">
            <P>QOAT&apos;s analysis is generated by AI (Anthropic Claude) and is subject to the inherent limitations of large language models:</P>
            <Ul>
              <Li>The AI may misread, misinterpret, or fail to extract data from uploaded documents — particularly unusual formats, poor-quality scans, or handwritten quotes</Li>
              <Li>The AI may &ldquo;hallucinate&rdquo; — producing plausible-sounding but incorrect information</Li>
              <Li>Pricing knowledge is based on the AI&apos;s training data, which has a cutoff date and may not reflect current market conditions</Li>
              <Li>The AI does not independently verify supplier credentials, ABNs, licence numbers, or insurance claims</Li>
            </Ul>
            <P>We work to improve the quality of our analysis continuously, but we do not warrant that any analysis is accurate, complete, or fit for any particular purpose. Re-analysing a quote with the Re-analyse function will use the latest model and community data.</P>
          </Section>

          <Section id="s9" n={9} title="Pricing data">
            <P>Price assessments on QOAT combine AI market knowledge with real community-submitted quotes. Both data sources have limitations:</P>
            <Ul>
              <Li>The AI&apos;s pricing knowledge has a training cutoff and may not reflect recent cost changes (material price spikes, labour market shifts)</Li>
              <Li>Community benchmarking is only as accurate as the volume and quality of similar quotes submitted by users</Li>
              <Li>Prices vary significantly by location, scope, materials, and market conditions</Li>
            </Ul>
            <P>QOAT pricing data should be used as one input among many — not as the sole basis for accepting or rejecting a quote. We recommend obtaining multiple quotes from licensed tradespeople for high-value work.</P>
          </Section>

          <Section id="s10" n={10} title="Intellectual property">
            <P>The QOAT name, brand, methodology, interface, code, and all other content we produce are owned by QOAT and protected by intellectual property laws.</P>
            <P>You must not:</P>
            <Ul>
              <Li>Scrape, crawl, or systematically download content from QOAT without our permission</Li>
              <Li>Reverse engineer, decompile, or attempt to extract source code from the Service</Li>
              <Li>Use QOAT&apos;s brand, name, or methodology without authorisation</Li>
              <Li>Use automated tools to access or interact with the Service at scale</Li>
            </Ul>
          </Section>

          <Section id="s11" n={11} title="Liability">
            <P>To the extent permitted by Australian Consumer Law, QOAT is provided &ldquo;as is&rdquo; without warranties of any kind, either express or implied — including but not limited to accuracy, fitness for a particular purpose, or uninterrupted availability.</P>
            <P>We do not accept liability for any loss or damage arising from:</P>
            <Ul>
              <Li>Decisions made in reliance on QOAT analysis</Li>
              <Li>Contracts entered into with suppliers based on QOAT recommendations</Li>
              <Li>Inaccurate, incomplete, or outdated AI analysis</Li>
              <Li>Service downtime or data loss</Li>
            </Ul>
            <P>Nothing in these terms excludes or limits rights that cannot be excluded under the <em>Australian Consumer Law</em> (Schedule 2 of the <em>Competition and Consumer Act 2010</em> (Cth)). Where consumer guarantees apply, our liability is limited to the extent permitted by law.</P>
          </Section>

          <Section id="s12" n={12} title="Termination">
            <P>You can delete your account at any time from <Link href="/settings" className="underline hover:opacity-80">Account Settings</Link>. Deleting your account removes your personal data as described in our Privacy Policy.</P>
            <P>We may suspend or terminate your access to QOAT at any time if you breach these terms, engage in harmful conduct, or if we discontinue the Service. Where reasonably practicable, we will give you notice before termination.</P>
            <P>Upon termination, clauses that by their nature should survive (including Sections 3, 8, 9, 10, and 11) will continue to apply.</P>
          </Section>

          <Section id="s13" n={13} title="Changes to these terms">
            <P>We may update these Terms of Service from time to time. When we do, we will update the &ldquo;Last updated&rdquo; date at the top of this page.</P>
            <P>For material changes, we will notify account holders via email before the change takes effect. Continuing to use QOAT after that date constitutes acceptance of the updated terms.</P>
          </Section>

          <Section id="s14" n={14} title="Governing law">
            <P>These terms are governed by and construed in accordance with the laws of {GOVERNING_STATE}, Australia. Any disputes arising under or in connection with these terms are subject to the exclusive jurisdiction of the courts of {GOVERNING_STATE}.</P>
          </Section>

          <Section id="s15" n={15} title="Contact">
            <P>For questions about these Terms of Service, contact us at <Link href="/contact" className="underline hover:opacity-80">/contact</Link>.</P>
          </Section>

        </div>

        {/* Back */}
        <div className="pt-4 pb-8 flex gap-6">
          <Link href="/" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">← Home</Link>
          <Link href="/privacy" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">Privacy Policy →</Link>
        </div>

      </div>
    </main>
  );
}
