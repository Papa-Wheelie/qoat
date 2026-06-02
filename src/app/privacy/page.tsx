import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — QOAT",
  description: "How QOAT collects, uses, and protects your personal information under Australian privacy law.",
};

const LAST_UPDATED = "02 June 2026";

const TOC = [
  { id: "s1",  title: "Who we are" },
  { id: "s2",  title: "What information we collect" },
  { id: "s3",  title: "How we use your information" },
  { id: "s4",  title: "Third parties we share data with" },
  { id: "s5",  title: "What's public vs private" },
  { id: "s6",  title: "How we store and protect data" },
  { id: "s7",  title: "Cookies and similar technologies" },
  { id: "s8",  title: "Data retention" },
  { id: "s9",  title: "Your rights under Australian privacy law" },
  { id: "s10", title: "International data transfers" },
  { id: "s11", title: "Children" },
  { id: "s12", title: "Changes to this policy" },
  { id: "s13", title: "Contact" },
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

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-surface pt-14 py-16 px-6 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-10">

        {/* Header */}
        <header className="space-y-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">Legal</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">Privacy Policy</h1>
          <p className="text-sm text-on-surface-variant">Last updated: {LAST_UPDATED}</p>
        </header>

        {/* Draft callout */}
        <div className="rounded-[12px] px-5 py-4 text-sm leading-relaxed" style={{ backgroundColor: "#FAEEDA", color: "#633806", border: "1px solid #F4D4A0" }}>
          <strong>Draft — pending legal review.</strong> This policy will be finalised before launch. We&apos;ve written it in plain English to explain how we actually handle your data. If anything is unclear, <Link href="/contact" className="underline hover:opacity-80">contact us</Link>.
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

          <Section id="s1" n={1} title="Who we are">
            <P>QOAT is an Australian online service that helps homeowners and property owners evaluate trade and supplier quotes. We are based in Australia and operate under Australian law.</P>
            <P>This Privacy Policy explains how we collect, use, and handle personal information in accordance with the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles (APPs) contained in Schedule 1 of that Act.</P>
            <P>For privacy questions, contact us via <Link href="/contact" className="underline hover:opacity-80">our contact page</Link>.</P>
          </Section>

          <Section id="s2" n={2} title="What information we collect">
            <P>We collect the following categories of information:</P>
            <Ul>
              <Li><strong>Account information</strong> — when you register: your name, email address, and a hashed (not plain-text) password. We never store your password in readable form.</Li>
              <Li><strong>OAuth profile</strong> — if you sign in with Google, we receive your email address, display name, and profile photo URL from Google. We do not receive your Google password.</Li>
              <Li><strong>Quote documents</strong> — the PDF or image files you upload. We store these in secure private cloud storage.</Li>
              <Li><strong>Extracted quote data</strong> — information the AI extracts from your documents: supplier name, line items, totals, timeframes, ABN, licence number, whether insurance is mentioned, and a plain-English summary. This is stored in our database.</Li>
              <Li><strong>Job location</strong> — the suburb and state you provide when uploading a quote. This is optional.</Li>
              <Li><strong>Community contributions</strong> — comments you write, votes, emoji reactions, &ldquo;helpful&rdquo; marks, similar-quote price contributions, and content reports you submit.</Li>
              <Li><strong>Technical data</strong> — standard web server logs including IP address, browser type, and session information. We use this for security and debugging.</Li>
            </Ul>
            <P>We only collect information that is reasonably necessary for providing the QOAT service.</P>
          </Section>

          <Section id="s3" n={3} title="How we use your information">
            <P>We use the information we collect to:</P>
            <Ul>
              <Li><strong>Provide the analysis service</strong> — extract data from your uploaded quotes, run AI scoring, and display the results to you.</Li>
              <Li><strong>Send transactional email</strong> — account verification, password reset, and contact form replies via Resend. We do not send marketing email without your consent.</Li>
              <Li><strong>Process AI analysis</strong> — your quote documents are sent to the Anthropic Claude API for data extraction and scoring. See Section 4 for details.</Li>
              <Li><strong>Generate semantic embeddings</strong> — quote descriptions are sent to the Voyage AI API to create vector embeddings that power our &ldquo;similar jobs&rdquo; price benchmarking.</Li>
              <Li><strong>Supplier reputation lookups</strong> — the supplier name and job location are sent to the Google Places API to retrieve public review data. No personal user data is sent to Google in this process.</Li>
              <Li><strong>Community features</strong> — displaying public quotes, comments, votes, and community pricing signals.</Li>
              <Li><strong>Moderation</strong> — reviewing user-submitted reports of inappropriate content.</Li>
              <Li><strong>Improving our service</strong> — analysing aggregated, anonymised pricing trends over time to improve benchmarking accuracy for the community.</Li>
            </Ul>
          </Section>

          <Section id="s4" n={4} title="Third parties we share data with">
            <P>We use the following third-party services. Where we send your data to them, we do so only as needed to provide the service:</P>
            <Ul>
              <Li><strong>Supabase</strong> — our database and file storage provider. Quote documents and account data are stored on Supabase infrastructure hosted in AWS (Sydney region where available).</Li>
              <Li><strong>Vercel</strong> — our web hosting provider. Your requests are served and processed by Vercel&apos;s infrastructure.</Li>
              <Li><strong>Anthropic</strong> — your quote documents are processed by the Anthropic Claude API to extract data and generate analysis. Anthropic processes this via API; your data is not used to train Anthropic&apos;s models under their API usage policy.</Li>
              <Li><strong>Voyage AI</strong> — quote descriptions are sent to Voyage AI to generate semantic embeddings for similarity matching. No personally identifying information is included in these requests.</Li>
              <Li><strong>Google</strong> — we send the supplier name and job location to the Google Places API to retrieve public Google Business Profile and review data. User account information is never sent to Google via this process.</Li>
              <Li><strong>Resend</strong> — transactional email delivery (account verification, password resets, contact form notifications).</Li>
            </Ul>
            <P><strong>We do not sell, rent, or trade personal information to third parties for their own marketing or commercial purposes.</strong></P>
          </Section>

          <Section id="s5" n={5} title="What's public vs private">
            <P>A core design principle of QOAT is that sensitive details stay with the quote owner. Here is exactly what is visible to whom:</P>
            <P><strong>Visible to everyone (public):</strong></P>
            <Ul>
              <Li>Quote title, category, and job location (suburb + state)</Li>
              <Li>Total price — shown as a ±10% range for service quotes, or exact for product quotes</Li>
              <Li>Line items and job scope description</Li>
              <Li>AI-generated public summary (written to exclude the supplier name)</Li>
              <Li>Community engagement signals: vote count, comment count, helpful marks</Li>
              <Li>Community comments and first-name-only reviewer attribution</Li>
            </Ul>
            <P><strong>Visible to the quote owner only:</strong></P>
            <Ul>
              <Li>Supplier name and full business details</Li>
              <Li>Full AI extraction (ABN, licence, insurance signals)</Li>
              <Li>Iron triangle scores (Price, Reputation, Time) with explanations</Li>
              <Li>Red flags and questions to ask</Li>
              <Li>QOAT recommendation (accept / negotiate / reject / get more quotes)</Li>
              <Li>Compliance check results (permit and certificate flags)</Li>
              <Li>Which comparable community quotes were used in benchmarking</Li>
            </Ul>
            <P>Google review snippets, when shown, display first names only. Full reviewer names are not stored.</P>
          </Section>

          <Section id="s6" n={6} title="How we store and protect data">
            <Ul>
              <Li><strong>Passwords</strong> are hashed using bcrypt before storage. We never store or transmit plain-text passwords.</Li>
              <Li><strong>Quote files</strong> are stored in private Supabase storage. Access requires a short-lived signed URL generated on request. Files are never directly publicly accessible.</Li>
              <Li><strong>Transport security</strong> — all connections use HTTPS (TLS). Data in transit is encrypted.</Li>
              <Li><strong>Access controls</strong> — admin and moderator roles are required for privileged operations. Row-level checks enforce that users can only access their own data.</Li>
              <Li><strong>API keys</strong> are stored as server-side environment variables and are never exposed to the browser.</Li>
            </Ul>
            <P>While we take reasonable steps to protect your information, no system is perfectly secure. If we become aware of a data breach that may affect you, we will notify you promptly in accordance with our obligations under the Privacy Act.</P>
          </Section>

          <Section id="s7" n={7} title="Cookies and similar technologies">
            <P>QOAT uses a small number of strictly necessary cookies and browser storage mechanisms to operate the service. We do not use advertising trackers, analytics cookies, or any third-party tracking technologies.</P>
            <Ul>
              <Li><strong>Authentication cookies</strong> — when you sign in, NextAuth sets a session cookie to keep you logged in. This cookie is strictly necessary for the service to function. It expires when you sign out or after a period of inactivity. No personal data beyond a session identifier is stored in the cookie itself.</Li>
              <Li><strong>Session storage</strong> — we use browser <code>sessionStorage</code> (cleared when you close your tab) for temporary UI state such as your quote compare selections and moderation filter preferences. This data never leaves your browser and is not transmitted to our servers.</Li>
            </Ul>
            <P>We do not use Google Analytics, Meta Pixel, advertising networks, or any other third-party analytics or tracking services.</P>
            <P>Under Australian law, a cookie consent banner is not currently required for strictly necessary cookies. If we add any non-essential cookies in the future, we will update this section and implement an appropriate consent mechanism.</P>
          </Section>

          <Section id="s8" n={8} title="Data retention">
            <P>We retain your personal information for as long as your account is active or as needed to provide the service.</P>
            <P>When you delete your account, we permanently delete your profile, uploaded quote files, extracted analysis data, comments, votes, and other account-linked data — in dependency order. Some data may persist in database backups for up to 30 days before being fully purged during the backup rotation cycle.</P>
            <P>If you delete a specific quote without deleting your account, that quote and its analysis are permanently removed immediately.</P>
          </Section>

          <Section id="s9" n={9} title="Your rights under Australian privacy law">
            <P>Under the Australian Privacy Principles, you have the right to:</P>
            <Ul>
              <Li><strong>Access your personal information</strong> — view your account details at <Link href="/profile" className="underline hover:opacity-80">/profile</Link>, your quotes at <Link href="/my-quotes" className="underline hover:opacity-80">/my-quotes</Link>.</Li>
              <Li><strong>Correct your personal information</strong> — update your name and email via <Link href="/settings" className="underline hover:opacity-80">Account Settings</Link>, and edit quote details from your quote pages.</Li>
              <Li><strong>Delete your account and data</strong> — from <Link href="/settings" className="underline hover:opacity-80">Account Settings</Link>, scroll to &ldquo;Delete account.&rdquo;</Li>
              <Li><strong>Lodge a complaint</strong> — if you believe we have mishandled your personal information, you can contact us first via <Link href="/contact" className="underline hover:opacity-80">/contact</Link>. If unresolved, you may lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at <a href="https://www.oaic.gov.au/" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">www.oaic.gov.au</a>.</Li>
            </Ul>
          </Section>

          <Section id="s10" n={10} title="International data transfers">
            <P>QOAT is based in Australia, but some of the third-party services we use (including Anthropic, Voyage AI, and Vercel) may process data in the United States or other countries. These transfers are made under the service providers&apos; own privacy commitments and data processing agreements.</P>
            <P>By using QOAT, you acknowledge that your information may be transferred to and processed in countries outside Australia. We take reasonable steps to ensure that our service providers maintain appropriate protections.</P>
          </Section>

          <Section id="s11" n={11} title="Children">
            <P>QOAT is not directed at children under the age of 16. We do not knowingly collect personal information from anyone under 16. If you are under 16, please do not use QOAT.</P>
            <P>If you believe we have collected information from a child under 16, please contact us and we will delete it promptly.</P>
          </Section>

          <Section id="s12" n={12} title="Changes to this policy">
            <P>We may update this Privacy Policy from time to time. When we do, we will update the &ldquo;Last updated&rdquo; date at the top of this page.</P>
            <P>For material changes — those that significantly affect how we handle your data — we will notify account holders via email before the change takes effect, giving you a reasonable opportunity to review it.</P>
          </Section>

          <Section id="s13" n={13} title="Contact">
            <P>For any questions about this Privacy Policy or how we handle your data, contact us at <Link href="/contact" className="underline hover:opacity-80">/contact</Link>.</P>
          </Section>

        </div>

        {/* Back */}
        <div className="pt-4 pb-8 flex gap-6">
          <Link href="/" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">← Home</Link>
          <Link href="/terms" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">Terms of Service →</Link>
        </div>

      </div>
    </main>
  );
}
