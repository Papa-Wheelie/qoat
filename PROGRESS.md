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

## Up Next
### Session 2.1 — Quote upload backend
- [ ] Update Prisma schema — add Quote, Category models
- [ ] Run migration
- [ ] File upload endpoint — accept PDF and images
- [ ] Store files in Supabase Storage
- [ ] Save quote record + file reference to DB