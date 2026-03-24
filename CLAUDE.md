Read CLAUDE.md and src/design/DESIGN.md to understand the project 
and design system. Then read src/design/login.html to understand 
the visual style.

Task: Set up NextAuth v5 with email and password authentication.

Steps:
1. Install any missing NextAuth dependencies including bcryptjs
2. Create the NextAuth config at src/auth.ts
3. Create the API route at src/app/api/auth/[...nextauth]/route.ts
4. Add a register API route at src/app/api/register/route.ts that 
   hashes passwords with bcryptjs and saves to the User table
5. Confirm NEXTAUTH_SECRET exists in .env.local

Use the existing Prisma User model. Do not change the schema yet.
Do not build any UI yet — backend wiring only.