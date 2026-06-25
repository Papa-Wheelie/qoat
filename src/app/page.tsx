import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { type Metadata } from "next";
import QuoteFeed, { type FeedQuote, type SortOption } from "./QuoteFeed";
import { formatPublicPrice } from "@/lib/formatPrice";
import { CATEGORIES } from "@/lib/categories";

// ─── Config ──────────────────────────────────────────────────────────────────
// Set EXAMPLE_QUOTE_ID in .env.local to a real public quote ID.
// This quote appears in the "See it in action" section on the marketing page.
// If unset or the quote no longer exists, the section is hidden gracefully.
const EXAMPLE_QUOTE_ID = process.env.EXAMPLE_QUOTE_ID ?? "";

// ─── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "QOAT — Know before you pay. AI analysis for trade quotes.",
  description:
    "Upload your trade or supplier quote and get an instant iron triangle analysis plus community insight from Australian homeowners.",
  openGraph: {
    title: "QOAT — Know before you pay. AI analysis for trade quotes.",
    description:
      "Upload your trade or supplier quote and get an instant iron triangle analysis plus community insight from Australian homeowners.",
    url: "https://getqoat.com",
    siteName: "QOAT",
    type: "website",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 8) return "#27500A";
  if (s >= 5) return "#633806";
  return "#791F1F";
}

// ─── Iron triangle illustration ───────────────────────────────────────────────

function IronTriangleIllustration() {
  const dims = [
    { label: "Price", score: 8, accent: "#7DD4C0" },
    { label: "Reputation", score: 7, accent: "#F4A7C3" },
    { label: "Time", score: 9, accent: "#89CFF0" },
  ];
  return (
    <div
      className="bg-white rounded-[20px] p-5 space-y-4 w-full"
      style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.06)" }}
    >
      <p className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">
        Iron triangle analysis
      </p>
      <div className="flex gap-3">
        {dims.map(({ label, score, accent }) => (
          <div
            key={label}
            className="flex-1 rounded-[12px] px-3 py-3 space-y-2"
            style={{ backgroundColor: "#F9F9F7", borderLeft: `3px solid ${accent}` }}
          >
            <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "#AAAAAA" }}>
              {label}
            </p>
            <p className="text-2xl font-extrabold leading-none" style={{ color: scoreColor(score) }}>
              {score}
            </p>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full"
                  style={{ backgroundColor: i < score ? accent : `${accent}26` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div
        className="rounded-[10px] px-4 py-3 flex items-center gap-2"
        style={{ backgroundColor: "#E1F5EE" }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#085041"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <p className="text-xs font-semibold" style={{ color: "#085041" }}>
          Looks good to proceed
        </p>
      </div>
      <p className="text-[10px] text-center" style={{ color: "#CCCCCC" }}>
        Example analysis · not a real quote
      </p>
    </div>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorksSection() {
  const steps = [
    {
      n: 1,
      title: "Upload your quote",
      text: "Upload a PDF or photo. QOAT's AI extracts line items, totals, supplier details, and timeframes automatically.",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <polyline points="9 15 12 12 15 15" />
        </svg>
      ),
    },
    {
      n: 2,
      title: "Get your iron triangle score",
      text: "Price, Reputation, and Time each scored 1–10 with plain-English explanations — benchmarked against community quotes and live supplier data.",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      n: 3,
      title: "Compare with the community",
      text: "See what Australian homeowners paid for similar jobs and contribute your own data to help others.",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20">
      <div className="mb-12">
        <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-3">
          How it works
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight text-primary">
          Three steps to clarity.
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {steps.map(({ n, title, text, icon }) => (
          <div key={n} className="bg-white rounded-[16px] px-6 py-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-primary text-on-primary text-sm font-bold flex items-center justify-center shrink-0">
                {n}
              </span>
              <span className="text-on-surface-variant">{icon}</span>
            </div>
            <p className="text-base font-bold text-on-surface">{title}</p>
            <p className="text-sm text-on-surface-variant leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Why trust QOAT ───────────────────────────────────────────────────────────

function WhyTrustSection() {
  const items = [
    {
      heading: "Transparent methodology",
      text: "Every score links to a public explainer — exactly which signals feed each dimension.",
      href: "/methodology" as string | null,
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
    },
    {
      heading: "Source attribution",
      text: "See which comparable community quotes informed each price assessment.",
      href: null,
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
    },
    {
      heading: "Privacy by default",
      text: "Your supplier details stay private. Only the job scope and anonymised pricing are shared publicly.",
      href: null,
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    },
  ];

  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <div className="mb-12">
        <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-3">
          Trust
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight text-primary">
          Built to be transparent.
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {items.map(({ heading, text, href, icon }) => (
          <div key={heading} className="bg-white rounded-[16px] px-6 py-6 space-y-3">
            <span className="text-on-surface-variant">{icon}</span>
            <p className="text-base font-bold text-on-surface">
              {href ? (
                <Link href={href} className="hover:underline">
                  {heading}
                </Link>
              ) : (
                heading
              )}
            </p>
            <p className="text-sm text-on-surface-variant leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Mini quote card (marketing feed) ─────────────────────────────────────────

type MiniQuote = {
  id: string;
  title: string;
  category: { name: string; slug: string };
  suburb: string | null;
  state: string | null;
  totalAmount: number | null;
  priceScore: number | null;
  reputationScore: number | null;
  timeScore: number | null;
};

function MiniQuoteCard({ q }: { q: MiniQuote }) {
  return (
    <Link
      href={`/quotes/${q.id}`}
      className="block bg-white rounded-[14px] px-5 py-5 space-y-3 hover:shadow-sm transition-shadow group"
    >
      <div>
        <p className="text-[10px] font-semibold tracking-widest uppercase text-on-surface-variant">
          {q.category.name}
          {(q.suburb || q.state) && (
            <span className="font-normal normal-case tracking-normal">
              {" · "}
              {[q.suburb, q.state].filter(Boolean).join(", ")}
            </span>
          )}
        </p>
        <p className="text-sm font-bold text-on-surface mt-1 group-hover:underline line-clamp-2">
          {q.title}
        </p>
      </div>
      {q.totalAmount != null && (
        <p className="text-base font-extrabold tracking-tight text-primary">
          {formatPublicPrice(q.totalAmount, q.category.slug)}
        </p>
      )}
      {q.priceScore != null && (
        <div className="flex gap-2">
          {[
            { label: "P", score: q.priceScore, accent: "#7DD4C0" },
            { label: "R", score: q.reputationScore ?? 0, accent: "#F4A7C3" },
            { label: "T", score: q.timeScore ?? 0, accent: "#89CFF0" },
          ].map(({ label, score, accent }) => (
            <span
              key={label}
              className="px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: `${accent}26`, color: scoreColor(score) }}
            >
              {label} {score}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

// ─── Example score badge ───────────────────────────────────────────────────────

function ExampleScoreBadge({
  label,
  score,
  verdict,
  accent,
}: {
  label: string;
  score: number;
  verdict: string | null;
  accent: string;
}) {
  return (
    <div
      className="flex-1 rounded-[12px] px-4 py-4 space-y-1"
      style={{ backgroundColor: "#F9F9F7", borderLeft: `3px solid ${accent}` }}
    >
      <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#AAAAAA" }}>
        {label}
      </p>
      <p className="text-2xl font-extrabold leading-none" style={{ color: scoreColor(score) }}>
        {score}
        <span className="text-sm font-semibold text-on-surface-variant">/10</span>
      </p>
      {verdict && (
        <p className="text-xs font-semibold capitalize" style={{ color: "#888888" }}>
          {verdict}
        </p>
      )}
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function MarketingFooter() {
  return (
    <footer style={{ backgroundColor: "#F4F4F2" }}>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div className="space-y-1.5">
            <p className="text-lg font-extrabold tracking-tight text-primary">QOAT</p>
            <p className="text-sm text-on-surface-variant">Know before you pay.</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-on-surface-variant">
            <a href="#how-it-works" className="hover:text-on-surface transition-colors">
              How it works
            </a>
            <Link href="/methodology" className="hover:text-on-surface transition-colors">
              Methodology
            </Link>
            <Link href="/faq" className="hover:text-on-surface transition-colors">
              FAQ
            </Link>
            <Link href="/privacy" className="hover:text-on-surface transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-on-surface transition-colors">
              Terms
            </Link>
          </nav>
        </div>
        <div className="mt-10 pt-6 border-t border-outline-variant/20">
          <p className="text-xs text-on-surface-variant">© 2026 QOAT. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    sort?: string;
    category?: string;
    state?: string;
  }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const currentUserId = session?.user?.id ?? null;
  const role = (session?.user as { role?: string } | undefined)?.role ?? "user";
  const isPrivileged = role === "admin" || role === "moderator";

  // ── Logged in → feed experience ──────────────────────────────────────────

  if (isLoggedIn) {
    const visibilityWhere = {
      OR: [{ hidden: false }, ...(currentUserId ? [{ userId: currentUserId }] : [])],
    };

    const categories = CATEGORIES.map((c) => ({ slug: c.slug, name: c.name }));

    const [initialData, totalCount] = await Promise.all([
      prisma.quote.findMany({
        where: visibilityWhere,
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          userId: true,
          title: true,
          hidden: true,
          suburb: true,
          state: true,
          createdAt: true,
          category: { select: { name: true, slug: true } },
          analysis: {
            select: { totalAmount: true, priceScore: true, reputationScore: true, timeScore: true },
          },
          _count: { select: { votes: true, comments: true, helpfulMarks: true, similarQuotes: true } },
        },
      }),
      prisma.quote.count({ where: visibilityWhere }),
    ]);

    const initialQuotes: FeedQuote[] = initialData.map((q) => ({
      id: q.id,
      userId: q.userId,
      title: q.title,
      hidden: q.hidden,
      suburb: q.suburb,
      state: q.state,
      createdAt: q.createdAt.toISOString(),
      category: q.category,
      totalAmount: q.analysis?.totalAmount ?? null,
      priceScore: q.analysis?.priceScore ?? null,
      reputationScore: q.analysis?.reputationScore ?? null,
      timeScore: q.analysis?.timeScore ?? null,
      voteCount: q._count.votes,
      commentCount: q._count.comments,
      helpfulCount: q._count.helpfulMarks,
      similarCount: q._count.similarQuotes,
      analysisComplete: q.analysis !== null,
    }));

    const validSorts = ["newest", "oldest", "price-high", "price-low", "most-helpful", "most-discussed"];
    const initialSort = (validSorts.includes(sp.sort ?? "") ? sp.sort : "newest") as SortOption;

    return (
      <main className="min-h-screen bg-surface pt-14">
        <section className="max-w-5xl mx-auto px-6 pt-12 pb-20">
          <QuoteFeed
            initialQuotes={initialQuotes}
            initialTotalPages={Math.ceil(totalCount / 20)}
            initialTotalCount={totalCount}
            categories={categories}
            currentUserId={currentUserId}
            isPrivileged={isPrivileged}
            initialSearch={sp.search ?? ""}
            initialSort={initialSort}
            initialCategory={sp.category ?? null}
            initialState={sp.state ?? ""}
          />
        </section>
      </main>
    );
  }

  // ── Logged out → marketing page ──────────────────────────────────────────

  const [exampleQuote, recentData] = await Promise.all([
    EXAMPLE_QUOTE_ID
      ? prisma.quote.findUnique({
          where: { id: EXAMPLE_QUOTE_ID, hidden: false },
          select: {
            id: true,
            title: true,
            suburb: true,
            state: true,
            category: { select: { name: true, slug: true } },
            analysis: {
              select: {
                totalAmount: true,
                publicSummary: true,
                priceScore: true,
                priceVerdict: true,
                reputationScore: true,
                reputationVerdict: true,
                timeScore: true,
                timeVerdict: true,
              },
            },
          },
        })
      : Promise.resolve(null),
    prisma.quote.findMany({
      where: { hidden: false },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        suburb: true,
        state: true,
        category: { select: { name: true, slug: true } },
        analysis: {
          select: { totalAmount: true, priceScore: true, reputationScore: true, timeScore: true },
        },
      },
    }),
  ]);

  const showExample = !!exampleQuote?.analysis?.priceScore;

  const recentQuotes: MiniQuote[] = recentData.map((q) => ({
    id: q.id,
    title: q.title,
    suburb: q.suburb,
    state: q.state,
    category: q.category,
    totalAmount: q.analysis?.totalAmount ?? null,
    priceScore: q.analysis?.priceScore ?? null,
    reputationScore: q.analysis?.reputationScore ?? null,
    timeScore: q.analysis?.timeScore ?? null,
  }));

  return (
    <main className="min-h-screen bg-surface pt-14">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: copy */}
          <div className="space-y-6">
            <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
              Know before you pay.
            </p>
            <h1 className="text-[42px] sm:text-5xl font-extrabold tracking-tight text-primary leading-[1.08]">
              Make sense of any trade quote in seconds.
            </h1>
            <p className="text-lg text-on-surface-variant leading-relaxed max-w-md">
              Upload a quote and get an instant analysis of price, supplier reputation, and timeframe — backed by AI and the QOAT community.
            </p>
            <div className="space-y-3 pt-2">
              <div>
                <Link
                  href="/upload"
                  className="inline-block px-8 py-4 bg-[#111111] text-white rounded-[12px] font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  Upload your quote
                </Link>
              </div>
              <p className="text-xs text-on-surface-variant">Free · No signup needed to browse</p>
            </div>
          </div>

          {/* Right: iron triangle illustration */}
          <div className="w-full max-w-sm mx-auto lg:mx-0 lg:ml-auto">
            <IronTriangleIllustration />
          </div>

        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <HowItWorksSection />

      {/* ── Example quote ─────────────────────────────────────────────────── */}
      {showExample && exampleQuote && (
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-3">
              See it in action
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-primary">
              A real quote, analysed by QOAT.
            </h2>
            <p className="text-on-surface-variant mt-2">
              This is what you get after uploading. No login required to view.
            </p>
          </div>

          <div className="bg-white rounded-[20px] px-6 py-6 space-y-5">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
                {exampleQuote.category.name}
                {(exampleQuote.suburb || exampleQuote.state) && (
                  <span className="font-normal normal-case tracking-normal">
                    {" · "}
                    {[exampleQuote.suburb, exampleQuote.state].filter(Boolean).join(", ")}
                  </span>
                )}
              </p>
              <p className="text-xl font-extrabold tracking-tight text-primary mt-1">
                {exampleQuote.title}
              </p>
            </div>

            {exampleQuote.analysis!.totalAmount != null && (
              <p className="text-3xl font-extrabold tracking-tight text-primary">
                {formatPublicPrice(exampleQuote.analysis!.totalAmount, exampleQuote.category.slug)}
              </p>
            )}

            {exampleQuote.analysis!.publicSummary && (
              <p className="text-sm text-on-surface leading-relaxed">
                {exampleQuote.analysis!.publicSummary}
              </p>
            )}

            <div className="flex gap-3">
              <ExampleScoreBadge
                label="Price"
                score={exampleQuote.analysis!.priceScore!}
                verdict={exampleQuote.analysis!.priceVerdict}
                accent="#7DD4C0"
              />
              <ExampleScoreBadge
                label="Reputation"
                score={exampleQuote.analysis!.reputationScore!}
                verdict={exampleQuote.analysis!.reputationVerdict}
                accent="#F4A7C3"
              />
              <ExampleScoreBadge
                label="Time"
                score={exampleQuote.analysis!.timeScore!}
                verdict={exampleQuote.analysis!.timeVerdict}
                accent="#89CFF0"
              />
            </div>

            <Link
              href={`/quotes/${exampleQuote.id}`}
              className="inline-block text-sm font-semibold text-primary hover:underline"
            >
              View full analysis →
            </Link>
          </div>
        </section>
      )}

      {/* ── Why trust QOAT ────────────────────────────────────────────────── */}
      <WhyTrustSection />

      {/* ── Recent community quotes ───────────────────────────────────────── */}
      {recentQuotes.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-3">
                Community
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight text-primary">
                Recent quotes from the community.
              </h2>
            </div>
            <Link
              href="/feed"
              className="text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors whitespace-nowrap"
            >
              See all →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentQuotes.map((q) => (
              <MiniQuoteCard key={q.id} q={q} />
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/feed"
              className="inline-block px-6 py-3 rounded-[12px] text-sm font-semibold border border-outline-variant/40 text-on-surface hover:bg-surface-container-low transition-colors"
            >
              See all quotes
            </Link>
          </div>
        </section>
      )}

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <div className="max-w-lg mx-auto space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-primary">
            Ready to analyse your quote?
          </h2>
          <p className="text-on-surface-variant leading-relaxed">
            Get an instant iron triangle score — price, reputation, and timeframe — in under a minute.
          </p>
          <div className="space-y-3">
            <div>
              <Link
                href="/upload"
                className="inline-block px-8 py-4 bg-[#111111] text-white rounded-[12px] font-bold text-sm hover:opacity-90 transition-opacity"
              >
                Upload your quote
              </Link>
            </div>
            <p className="text-xs text-on-surface-variant">
              Free to use. Sign in only required to upload.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <MarketingFooter />

    </main>
  );
}
