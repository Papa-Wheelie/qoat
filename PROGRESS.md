# QOAT — Progress Tracker

## Project
- Repo: github.com/Papa-Wheelie/qoat
- Live: qoat.vercel.app (custom domain getqoat.com)
- Supabase: db.iotmnxydsnvirfrefuyk.supabase.co
- Admin: joseph@papawheelie.com.au
- Target market: Australia
- Stack: Next.js 16 (App Router, Turbopack), TypeScript, Prisma 6,
  Supabase (Postgres + pgvector), NextAuth v5, Tailwind CSS,
  Anthropic Claude API, Voyage AI embeddings, Google Places API,
  Resend, Recharts, Vercel

## Design System (wireframe quality — dedicated sprint pending)
- Font: Plus Jakarta Sans
- Background: #F9F9F7
- Inputs: white bg, #C6C6C6 border, 12px radius, 16px padding
- Primary button: black #111111, white text, 12px radius
- Iron triangle accents: #7DD4C0 (Price), #F4A7C3 (Reputation),
  #89CFF0 (Time)
- Error styling: soft pink #FDF0F0 bg, #791F1F text, 12px radius
- No divider lines — whitespace only

## Key Decisions
- Categories: 6 top / 54 sub taxonomy. Each sub tagged with a
  pricingModel: scope-variant (3 size bands), per-unit (unit rate),
  or fixed-job (single band).
- PRODUCT SHAPE: category-hub model, NOT quote-feed. Upload = the
  hero action. Category dashboards = market intelligence. Community
  lives at the category level, not the quote level. Individual
  quotes = private analysis for the owner + optional anonymised
  community input.
- Homepage: split — HomepageMarketing (logged-out) vs
  HomepageDashboard (logged-in). page.tsx routes by session.
- Voice principle: everything QOAT says is framed around what the
  USER gets, never what QOAT gets. ("Know if your quote is fair",
  not "Got a quote?")
- Community: category-level threads (reused Comment model with
  subcategoryId). Quote-level public comments being retired in
  favour of opt-in "Ask the Community" (Step 3.d).
- Pricing display: owners see exact; public sees 10% range for
  services, exact for products. Line items also ranged for public.
- Privacy: supplier name, iron triangle, red flags, recommendation
  owner-only. Public: total (ranged), category, location
  (suburb+state), public summary, line items.
- AI model: claude-sonnet-4-6 (single source: src/lib/methodology.ts).
- Methodology version: v1.2 (seed data + curated market reference
  disclosed).
- Auth/routing: proxy.ts (NOT middleware.ts) for Next.js 16.
- DB: Session pooler connection (aws-1-ap-southeast-2.pooler...:5432),
  IPv4.

## Working rhythm (locked in for every session)
- Pinch-hitter: 2-3 hours per day, drop-in / drop-out
- Experienced engineer, NEW TO TYPESCRIPT — plain types, no clever
  generics
- Bite-size steps: one prompt → one test → one commit
- Status header at top of each session: where we are, what's done,
  what's next
- Re-orient at the start of every session (don't assume continuity)
- Recurring re-entry checks:
  * Phone hotspot on (work firewall blocks DB ports)
  * Supabase awake (free tier pauses when idle — restart from
    dashboard)
  * Use `npx prisma ...` (prisma isn't a global command)
  * Stop dev server before `prisma db push` (pool exhaustion)
  * `npx prisma generate` after every schema change
  * Re-login after auth schema changes (JWT carries fields)
  * Hard-refresh browser (Cmd+Shift+R) after UI changes — Turbopack
    caches
  * Before starting dev: `lsof -i :3000` — kill orphaned
    servers. Stale processes serve old code and cause phantom
    bugs (undefined Prisma models, unrendered markdown, etc)
  * Quote paths with brackets in shell commands:
    "src/app/quotes/[id]/file.tsx" — zsh globs [id] otherwise

## Env Vars
DATABASE_URL (pooler), NEXTAUTH_SECRET, NEXTAUTH_URL,
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, GOOGLE_CLIENT_ID,
GOOGLE_CLIENT_SECRET, GOOGLE_PLACES_API_KEY, RESEND_API_KEY,
VOYAGE_API_KEY, EXAMPLE_QUOTE_ID

## Key Files
- prisma/schema.prisma — data model
- src/lib/prisma.ts — singleton client
- src/lib/methodology.ts — MODEL_VERSION, CURRENT_METHODOLOGY_VERSION
  (v1.2), CHANGELOG
- src/lib/categories.ts — taxonomy (6 top / 54 sub), pricingModel +
  unitLabel, LEGACY_CATEGORY_TO_TOP fallback map, helper functions
- src/lib/extractQuote.ts — Claude vision extraction (infers top +
  sub category + qualityTier + jobSize)
- src/lib/scoreQuote.ts — iron triangle scoring (comparables +
  reputation + curated market reference)
- src/lib/getComparables.ts — 3-tier lookup (sub+size → sub → embedding)
- src/lib/pricingReference.ts — reads reference JSON into scoring prompt
- src/lib/getReputationSignals.ts, assessCompliance.ts,
  googlePlaces.ts, embeddings.ts, moderateText.ts
- src/lib/categoryStats.ts — dashboard aggregation (getCategoryStats,
  getTopCategoryStats)
- src/lib/subcategoryContent.ts — hand-written blurbs/drivers/
  questions/permits (kitchen-renovation only so far)
- src/lib/getCategoryComments.ts — shared category-thread query
- data/reference-prices.draft.json — curated AU market pricing (54 subs)
- src/auth.ts, src/proxy.ts
- Homepage: src/app/page.tsx (router), HomepageMarketing.tsx,
  HomepageDashboard.tsx
- Categories: src/app/categories/page.tsx, [topSlug]/page.tsx,
  [topSlug]/[subSlug]/page.tsx, PriceDistributionChart.tsx,
  CategoryCommentsSection.tsx, CategoryCommentsInteractive.tsx
- Scripts: seed-quotes.ts, seed-categories.ts,
  migrate-legacy-categories.ts, backfill-embeddings.ts,
  test-category-stats.ts, diagnose-google-matches.ts

---

## COMPLETED

### Phase 1 + Phase 2 foundation ✅
Full auth (email/password + Google OAuth, NextAuth v5, JWT with role),
profiles + account settings, quote upload (PDF/image to Supabase
Storage), AI extraction (supplier, total, line items, timeframe, red
flags, AU date format), iron triangle scoring (Price/Reputation/Time
+ weighted QOAT score), community comments/votes/reactions, privacy
model, quote status/edit/delete/re-analyse/share, Google Places
supplier reputation (3 rounds of match tuning — composite confidence,
token-recall name similarity, multi-query, ambiguity guard),
semantic comparables (Voyage embeddings + pgvector HNSW), richer
community engagement (helpful marks, similar-quote submissions),
permit/compliance flagging, search/sort/filter feed, compare quotes,
report + moderation with admin role, methodology versioning + source
attribution, scale-aware Time scoring, marketing landing + FAQ +
contact + terms + privacy (draft, awaiting lawyer review), mobile
responsive + PWA basics, login validation polish.
Lighthouse baseline: Perf 75, A11y 95, Best Practices 100, SEO 91.

### Step 1 ✅ — Category overhaul
- Taxonomy: 6 top / 54 sub in src/lib/categories.ts, each with
  pricingModel (27 scope-variant, 19 per-unit, 8 fixed-job) + unitLabel
- DB: TopCategory + Subcategory tables, seeded
- AI extraction infers top + sub on upload
- UI: detail page shows "TOP · Sub", editable inline by owner
- Feed cards + filter pills use new taxonomy (legacy fallback map)
- Migrated all 11 legacy quotes via AI categorisation

### Step 2 ✅ — Database seeding + scoring upgrade
- Schema: isSeed, seedBatch, seedNotes on Quote; qualityTier on
  QuoteAnalysis
- Curated 54-sub pricing reference (data/reference-prices.draft.json):
  min/median/max per size band (scope-variant), unit rates (per-unit),
  call-out + hourly rates for electrical/plumbing/hvac/carpentry,
  market-signal notes throughout
- Seeder script (scripts/seed-quotes.ts) with retry logic
- Generated 351 seed quotes across 4 batches (credit limit stopped
  us at 351 of 500 target — accepted; ~6-7 per sub, above the
  3-comparable benchmark threshold)
- Reference badge + transparency banner on seed quotes; community
  engagement disabled on them
- Comparables lookup: 3-tier (sub+size exact → sub-only → embedding)
- AI scoring reasons with curated market reference + comparables +
  reputation
- Methodology page updated to v1.2 disclosing both

## Phase 3 — Product restructure (IN PROGRESS)

Reframe from quote-feed to category-hub model. Triggered by the
realisation that browsing individual quotes is the wrong primary
interface — QOAT's job is "is my quote fair?", not "browse other
people's quotes". Merged Claude + ChatGPT insights: hero upload,
category dashboards as market intelligence, community at category
level, individual quotes as private analysis + optional anonymised
community input.

### Step 3.b ✅ — Category hub system
- 3.b.i — categoryStats.ts (median, distribution buckets, common
  line items, state/quality/size distributions, hasEnoughData flag,
  always-3 size bands)
- 3.b.ii — sub-category dashboard (kitchen-renovation end-to-end):
  hero + value-forward CTA at top, Recharts price distribution,
  what drives price, common line items, regional breakdown,
  questions to ask, permits, recent quotes (real preferred over
  seed), community section, bottom CTA. Chart tooltip on hover.
- 3.b.iii — hierarchical URLs /categories/[top]/[sub] + top-level
  directory pages + breadcrumbs
- 3.b.iv — /categories index (6 top-category cards)
- 3.b.v — nav wiring (Categories link; "Submit a Quote" →
  "Upload quote")
- CONTENT: hand-written for kitchen-renovation only. Other 53 subs
  use placeholder fallback. Full content batch still TODO (Step 3.g).

### Step 3.a ✅ — Homepage restructure
- Split: HomepageMarketing (logged-out) + HomepageDashboard
  (logged-in); page.tsx routes by session
- Marketing: hero + iron triangle mock + how it works + see it in
  action (EXAMPLE_QUOTE_ID) + browse categories + why trust + CTA
- Dashboard: compact welcome + quick actions + your recent quotes
  + continue exploring + browse categories (NO marketing pitch —
  user already converted)
- 0-quote users: dashboard with empty state
- Killed the old recent-community-quotes homepage grid

### Step 3.c ✅ — Category-level community threads
- Reused Comment model with subcategoryId field (XOR with quoteId,
  enforced at API layer)
- API: GET + POST /api/categories/[subSlug]/comments
- getCategoryComments.ts shared helper (API + server component)
- Embedded discussion component on sub-category dashboards
- Votes, reactions, one-level replies, report/moderation all reused
- Cross-category isolation verified; auth-gated compose; empty state
  invites first comment

### Step 3.d ✅ — Ask QOAT AI chatbot
- ChatConversation + ChatMessage models (one conversation per
  quote, cascade delete)
- POST/GET /api/quotes/[id]/chat — owner-only, non-streaming
- Full quote context fed to Claude: extraction, iron triangle
  + reasoning, red flags, recommendation, comparables count,
  reputation signals, compliance flags, curated market reference
- Excluded from context: PDF URL, raw extraction JSON,
  embeddings, seed fields, other users' data
- UI: owner-only section after analysis, suggested starter
  chips, persisted history, markdown rendering (react-markdown
  + remark-gfm)
- Guardrails: stays on-topic, declines off-topic politely,
  never fabricates, short answers (max_tokens 600)

### Step 3.e ✅ — Retire the public quote feed
- Quietly re-plumb: old /feed → /browse (kept for the curious).
  No announcement.
- Individual quote pages become owner-primary + anonymised evidence

## Up Next — Phase 3 remaining

### Step 3.f — Content batch (before launch)
- Hand-write description + price drivers + questions + permit
  notes for the other 53 sub-categories + 6 top-category
  descriptions
- AI-generate first drafts, human-polish top ~10 subs

## Strategic decision — community cold-start (logged this session)
- Community features depend on traffic liquidity; QOAT launches
  with little/no traffic. An empty community reads as "abandoned"
  and would poison trust in the analysis (which works from day 1).
- KEEP at launch (zero-traffic viable): AI analysis, category
  dashboards (data, not community), category-level threads
  (durable general questions — an unanswered general question is
  "not answered yet", not "nobody cares about me"), "Ask QOAT"
  AI chatbot.
- DEFER to Phase 4/5 (need traffic): quote-level "Ask the
  Community" anonymised-post flow, experience badges (both
  require a responding community to have value).
- Category threads kept but framed dormant-friendly: empty states
  invite ("Be the first to ask..."), no active push, no
  dead-end disappointment.

## Step 4 — Design sprint (after restructure)
- Targets the NEW structure (category hubs, dashboards, homepage split)
- Discovery: references (Stripe precision + Monzo warmth + own)
- Design principles + voice + token system
- Apply across marketing, dashboards, quote detail
- Goal: trustworthy "made by people who care" feel

## Step 5 — Launch readiness
- End-to-end functional walk (PRELAUNCH_CHECKLIST.md)
- Fix issues found; FAQ voice review
- Lawyer review of Terms + Privacy (external dependency)
- Performance pass (Lighthouse 75 → 90+) — deferred here from Phase 2
- DECISION PENDING: hold launch for Brief Builder (Phase 4) or ship
  without — decide closer to launch

## Deferred until after launch
- Native iOS/Android apps (Phase 4+)

## Parked — waiting on external dependency
- ABN Lookup verification (ABR GUID — 5 day approval). When it
  arrives: add ABR_API_GUID env var, verify ABN active + capture
  registered name for name-mismatch flag, Verified/Claimed/Not found
  model.
- Multi-state licence verification (Phase 5, with contractor onboarding)

## Future phases

### Phase 4 — Freemium (~6 months) — $9-19/mo
- Video upload (film space, AI extracts dimensions + scope)
- Unlimited submissions (free tier: 3/month)
- AI chatbot, quote history/portfolio, priority analysis
- Stripe subscription billing
- **Brief Builder — headline paid feature**
  * Assistant walks user through structured brief creation
  * Generates dimensioned drawings + spec sheet for supplier RFQs
  * Categories with clear physical outputs first (windows, doors,
    fencing, decking, custom cabinetry, blinds); text-only structured
    briefs for services
  * $5-15 per brief or bundled into Freemium
  * Rationale: attacks upstream cause of bad quotes (unclear briefs).
    Validated by Joseph's own use case (ChatGPT generated black steel
    window drawing for Chinese supplier RFQ).
  * NOTE: Joseph may hold Phase 2 launch for this — decision deferred.
    Waitlist teaser on category hubs is the fallback.

### Phase 5 — Send to tender (~12 months) — B2B leads
- Consumer publishes brief, contractors compete
- Contractor onboarding + licence verification
- Contractor subscription $99-299/mo; bid management (iron triangle
  auto-scores each bid)
- B2B for property managers / strata / agents

- Quote-level "Ask the Community" (anonymised quote summary posted
  to category thread) + experience badges — deferred from Phase 3
  due to cold-start; revisit when tender/contractor side brings
  traffic.

### Phase 6 — QOAT Guarantee (~18 months) — insurance-backed
- AU underwriter partnership, AFS licence required

### Phase 7 — Scale (~24 months)
- Pricing API, white label, React Native, NZ expansion

## Phase 3 (deferred features, not the restructure)
- Email notifications (was 2B.3)
- AI chatbot — ask about your quote (was 2C.3)
- Email digest — similar quotes in your area

## Parked ideas (need data density or experiments)
- Seasonal pricing intelligence
- Homeowner-bids-for-contractor experiment
- Council permit API integration
- Brief Builder waitlist teaser on category hubs (validate demand
  during Phase 2 launch)