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

## Up Next
### Session 1.4 — Build auth UI with Claude Code
- [ ] Login screen (match src/design/login.html)
- [ ] Register screen (same design system)
- [ ] Protected route middleware
- [ ] Test full register → login flow end to end