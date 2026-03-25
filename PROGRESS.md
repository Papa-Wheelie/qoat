# QOAT — Progress Tracker

## Project
- Repo: github.com/YOUR_ORG/qoat
- Live: your-qoat-url.vercel.app
- Supabase: db.iotmnxydsnvirfrefuyk.supabase.co
- Stack: Next.js 14, TypeScript, Prisma, Supabase, NextAuth, tRPC, Claude API, Vercel

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

## Up Next
### Session 3.1 — AI extraction with Claude API
- [ ] Add ANTHROPIC_API_KEY to .env.local
- [ ] Send uploaded PDF/image to Claude vision API
- [ ] Extract line items, total price, category, supplier, timeframe
- [ ] Return structured JSON validated with zod