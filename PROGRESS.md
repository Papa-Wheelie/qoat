# QOAT — Progress Tracker

## Project
- Repo: github.com/Papa-Wheelie/qoat
- Live: qoat.vercel.app
- Supabase: db.iotmnxydsnvirfrefuyk.supabase.co
- Stack: Next.js 16, TypeScript, Prisma 6, Supabase, 
  NextAuth v5, Tailwind CSS, Anthropic Claude API, Vercel

## Design System
- Font: Plus Jakarta Sans
- Background: #F9F9F7
- Inputs: white bg, #C6C6C6 border, 12px radius, 16px padding
- Primary button: black #111111, white text, 12px radius
- Accent colours: #7DD4C0 (price), #F4A7C3 (reputation), 
  #89CFF0 (time)
- No divider lines — whitespace only
- Reference: src/design/DESIGN.md + src/design/login.html

## Key Decisions
- Pricing: exact for owners, 10% range for services publicly,
  exact for products publicly
- Privacy: supplier name, iron triangle, red flags, 
  recommendation owner-only
- Public: total, line items, public summary, community
- Location: suburb + state captured on upload
- Dates: Australian format DD/MM/YYYY in all AI prompts
- Categories: 10 AU trade categories seeded in DB
- Auth: proxy.ts (not middleware.ts) for Next.js 16
- DB: pooler connection string for Vercel production



## Sessions

### Session 1.1 ✅ — Project scaffold + first deploy
- Next.js app created with Tailwind + TypeScript
- Prisma initialised, User model created
- Supabase connected, schema pushed
- Deployed to Vercel on personal hobby account (public repo)
- Env vars: DATABASE_URL + NEXTAUTH_SECRET set in Vercel

### Session 1.2 ✅ — Design reference established
- Stitch login screen exported to src/design/login.html
- Design system documented in src/design/DESIGN.md
- Colours locked: #7DD4C0 (price), #F4A7C3 (quality), #89CFF0 (time)
- Font: Plus Jakarta Sans
- Stitch removed from build plan — Claude Code builds UI directly

### Session 1.3 ✅ — Auth backend wiring
- NextAuth v5 configured at src/auth.ts
- API route created at src/app/api/auth/[...nextauth]/route.ts
- Register API route at src/app/api/register/route.ts
- Passwords hashed with bcryptjs
- NEXTAUTH_SECRET confirmed in .env.local

### Session 1.4 ✅ — Auth UI with Claude Code
- Login screen built matching Stitch design
- Register screen built with same design system
- Font: Plus Jakarta Sans applied globally
- Input focus ring updated to black #111111
- Tagline updated to "Know before you pay."
- Protected routes working — unauthenticated users → /login
- Temporary logout button on homepage for testing
- Full register → login → protected route flow tested ✅

### Session 2.1 ✅ — Quote upload backend
- Prisma schema updated — Quote and Category models added
- 10 categories seeded to database
- Supabase Storage bucket "quotes" created
- Upload API route at /api/quotes/upload
- File validation — PDF, jpg, png, webp, max 10MB
- Unauthorized requests correctly blocked
- Tested and confirmed ✅

### Session 2.2 ✅ — Quote upload UI
- Upload page at /upload with drag and drop
- Category dropdown populated from DB
- File validated — PDF, jpg, png, webp, max 10MB
- Files stored in Supabase Storage quotes bucket
- Quote record saved to database
- Placeholder quote detail page at /quotes/:id
- SessionProvider fix applied
- Full upload flow tested end to end ✅

### Session 3.1 ✅ — AI extraction with Claude API
- Anthropic client configured at src/lib/claude.ts
- extractQuote.ts sends PDF/image to Claude vision API
- Extracts supplier, total, line items, timeframe, red flags
- QuoteAnalysis model added to Prisma schema
- Quote detail page displays full extraction results
- Tested with real skylight quote — working perfectly ✅
- Fixed Australian date format (DD/MM/YYYY) in extraction prompt
- Red flags no longer incorrectly flag past dates as future dated

### Session 3.2 ✅ — Iron triangle scoring
- scoreQuote.ts built using Claude API
- Three dimensions: Price, Reputation, Time
- Quality renamed to Reputation — assesses provider 
  trustworthiness (ABN, licence, insurance, payment terms)
- Price benchmarked against AU market rates with $ specifics
- Time scores realistic timeframe vs industry standard
- Overall recommendation: accept/negotiate/reject/get-more-quotes
- Iron triangle cards displayed on quote detail page
- Tested with real skylight quote ✅

### Session 4.1 ✅ — Community comments + upvotes
- Comment model with one level of replies
- Vote model with unique constraints (no double voting)
- Community confidence score calculated from votes
- Optimistic upvote updates on the client
- Unauthenticated users see Sign in prompts

### Session 4.2 ✅ — Privacy model + location + questions
- Supplier name owner-only
- Iron triangle, red flags, recommendation owner-only
- Public summary generated separately (no supplier mention)
- Public view shows: total, category, location, line items, 
  community
- Suburb + state captured on upload
- Location-aware price benchmarking in scoring prompt
- "Questions to ask your supplier" section added
- AI never mentions supplier in public-facing content

### Session 5.1 ✅ — Quote feed homepage
- Public feed with category pills and state filter
- Quote cards with scores, vote count, comment count
- Nav component reused across pages
- Hero section for logged out users
- Smart pricing model:
  * Owners always see exact prices
  * Services show 10% range publicly (e.g. $8,500-$10,500)
  * Products show exact price publicly
- Privacy model complete:
  * Supplier name owner only
  * Iron triangle, red flags, recommendation owner only
  * Total, line items, community section public

### Session 6.1 ✅ — End to end test + bug sweep
- [ ] Walk full user journey end to end
- [ ] Fix any broken flows
- [ ] Deploy to Vercel and confirm production works
- [ ] Add ANTHROPIC_API_KEY to Vercel env vars



## Phase 2 Plan
### 2A — Auth + accounts (4 sessions)

### Session 2A.1 ✅ — Forgot password + email verification
- Resend configured for transactional email
- Domain getqoat.com verified in Resend
- Sending from noreply@getqoat.com
- Forgot password flow — email with reset link, 1hr expiry
- Reset password page — validates token, updates password
- Email verification on register — 24hr expiry
- Verification banner in nav for unverified users
- Resend/verify endpoints working end to end ✅

### Session 2A.2 ✅ — Google OAuth
- Google provider added to NextAuth v5
- Account model added to Prisma schema
- Account linking — existing email/password users can 
  sign in with Google without duplicate user created
- Google OAuth users get emailVerified set automatically
- Prisma singleton pattern fixed in src/lib/prisma.ts
- Google button on login + register pages ✅

### Session 2A.3 ✅ — User profile + account settings
- My Quotes page at /my-quotes
- Profile page — avatar, stats, edit name
- Account settings — email verified badge, change password,
  delete account with confirmation modal
- Nav dropdown — initials avatar, My Quotes, Profile, 
  Settings, Sign Out
- Prisma singleton pattern applied globally
- Nav wrapped in Suspense boundary in layout ✅

### Session 2A.4 ✅ — Global flows polish
- Custom 404 page
- Global error boundary with retry
- Loading spinner
- QOAT favicon (bold Q on off-white)
- SEO metadata + OpenGraph tags
- Title: "QOAT — Know before you pay"


### 2B — Quote management (3 sessions)

### Session 2B.1 ✅ — Quote status + edit + delete
- Status field: pending / accepted / rejected
- Status pill selector on quote detail (owner only)
- Optimistic status updates
- Status badge on My Quotes cards
- Edit quote page at /quotes/:id/edit
- Delete quote with cascade + Supabase Storage cleanup
- Owner actions component — edit, delete, status pills ✅

### Session 2B.2 ✅ — Re-analyse + quote sharing
- Re-analyse button — reruns extraction + scoring, 
  refreshes page on complete
- Copy URL button — copies quote link to clipboard
- Download button — generates signed Supabase URL, 
  opens original file in new tab
- OpenGraph metadata on quote detail pages
- Share button visible to non-owners too ✅

### Session 2B.3 → Moved to Phase 3 (email notifications)

### Session 2C.1 ✅ — Rework score UI
- White cards with 4px accent left border (colour = dimension)
- Score number colour-coded: green ≥8, amber 5-7, red ≤4
- 10-segment progress bar per score
- Verdict badges with semantic colours (positive/neutral/negative)
- QOAT Score — weighted average (Price 40%, Rep 35%, Time 25%)
- Recommendation section — icon + sentiment-coloured heading
- Feed cards use neutral grey score badges ✅

### Session 2C.2 ✅ — Supplier social proof + Google Reviews
- Google Places API integrated
- Rating, review count, review snippets fetched
- Dedicated "Supplier reputation" section on quote detail
- Shows: star rating, review count, 3 review snippets
- First names only for reviewer privacy
- "View on Google Maps" and "See all reviews" links
- Feeds into Reputation score prompt
- Owner only — supplier data stays private ✅

### Session 2C.3 → Moved to Phase 3 (AI chatbot)

### Session 2C.4 ✅ — Community data feeds price scoring
- Semantic job-type matching via Voyage AI embeddings
- pgvector(1024) column + HNSW index in Supabase
- getComparables uses cosine similarity (threshold 0.75)
- Comparable price stats fed into scoreQuote prompt
- Data confidence line: "Benchmarked against N similar jobs"
- Verified working at 0.5 threshold (3 matches found)
- Reverted to 0.75 for accuracy during testing phase
- Switched embeddings OpenAI → Voyage (Anthropic ecosystem)
- NOTE: local dev needs hotspot — work firewall blocks DB ports
- NOTE: Supabase free tier pauses when idle — restore before dev

## Up Next
### 2C — AI + scoring improvements
- 2C.4 Community data feeds price scoring
- 2C.7 NEW — Contractor reputation scoring (composite:
  Google rating + years in business + licence status +
  QOAT job-completion data)
- 2C.6 NEW — Permits + certification compliance flagging
  (does job need a council permit? is it in the quote?
  electrical/plumbing certificate of compliance referenced?)
- 2C.5 Richer community engagement:
  * Upvote only on quotes, up/down on comments
  * Comment reactions (👍 💡 😱)
  * "I got a similar quote" button with price input
  * "This helped me" counter on quotes
  * Sort comments by most helpful

### 2D — Discovery + search (2 sessions)
- 2D.1 Search + sort feed
- 2D.2 Compare quotes side by side

### 2E — Trust + safety (2 sessions)
- 2E.1 Report + moderation tools
- 2E.2 Verified professional badge

### 2F — Marketing + legal (3 sessions)
- 2F.1 Landing + how it works page
- 2F.2 FAQ + contact form
- 2F.3 Terms of service + privacy policy

### 2G — Mobile + polish (2 sessions)
- 2G.1 Full mobile responsive polish
- 2G.2 Performance + launch checklist

## Revised build order:
2C.4 → 2C.7 → 2C.6 → 2C.5 → 2D → 2E → 2F → 2G

## Phase 3 (deferred from Phase 2)
- Email notifications (was 2B.3)
- AI chatbot — ask about your quote (was 2C.3)
- Email digest — similar quotes in your area

## Future phases (noted, not now)
### Phase 4 — Freemium (~6 months) — $9-19/mo
- Video upload — film space, AI extracts dimensions + scope
- Unlimited submissions (free tier: 3/month)
- AI chatbot, quote history/portfolio, priority analysis
- Stripe subscription billing

### Phase 5 — Send to tender (~12 months) — B2B leads
- Consumer publishes job brief, contractors compete
- Contractor onboarding + licence verification
- Contractor subscription $99-299/mo for tender invites
- Bid management — iron triangle auto-scores each bid
- B2B for property managers / strata / agents (consumer first, then B2B)

### Phase 6 — QOAT Guarantee (~18 months) — insurance
- Partner with AU underwriter, risk from QOAT data
- Consumer pays 1-2% premium for price + completion guarantee
- AFS licence required — begin BD at Phase 5 launch

### Phase 7 — Scale (~24 months) — enterprise
- QOAT Pricing API for banks, conveyancers, insurers
- White label for home loan apps, property platforms
- React Native mobile app, NZ expansion

## Parked ideas (need data density or experiments)
- Seasonal pricing intelligence (e.g. "plumbers 30% pricier
  in winter") — marketing flywheel, needs 1000s of quotes
- Homeowner-bids-for-contractor-attention — test inside
  tender platform, not standalone
- Council permit API integration — deeper version of 2C.6


## Parked — waiting on external dependency
### ABN Lookup verification (part of 2C.6)
- Registered for ABR Web Services GUID — 5 day approval wait
- When GUID arrives: add ABR_API_GUID to .env.local + Vercel
- Build: verify ABN valid + active via ABR API
- Capture registered name → name-mismatch flag + better Google search
- Confidence model: Verified / Claimed / Not found
- Currently: licence/ABN signals reflect quote contents only

### Licence verification (future dedicated project)
- Multi-state, fragmented (NSW Fair Trading, VIC VBA, QLD QBCC...)
- No national registry — significant ongoing integration
- Reuse the Verified/Claimed/Not found pattern from ABN
- Likely Phase 5 (pairs with contractor onboarding)