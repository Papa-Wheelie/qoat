"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

function GoogleButton({ label }: { label: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => { setLoading(true); signIn("google", { callbackUrl: "/" }); }}
      className="w-full flex items-center justify-center gap-3 bg-white border border-[#dadce0] rounded-[12px] px-4 py-4 text-[#111111] font-semibold text-sm hover:bg-[#f8f8f8] active:scale-[0.98] transition-all disabled:opacity-60"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      {loading ? "Redirecting…" : label}
    </button>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  function clearFieldError(field: "email" | "password") {
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const errors = { email: "", password: "" };
    if (!email) errors.email = "Email is required";
    else if (!EMAIL_RE.test(email)) errors.email = "Please enter a valid email address";
    if (!password) errors.password = "Password is required";

    if (errors.email || errors.password) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    let result;
    try {
      result = await signIn("credentials", { email, password, redirect: false });
    } catch {
      setLoading(false);
      setError("Something went wrong. Please try again.");
      return;
    }

    setLoading(false);

    if (result?.error || !result?.ok) {
      setError("Invalid email or password. Try again.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="w-full max-w-md px-8 pt-24 pb-12 flex-grow flex flex-col">
      {/* Brand */}
      <header className="mb-20 text-center md:text-left">
        <h1 className="text-4xl font-extrabold tracking-tighter text-primary">QOAT</h1>
        <p className="mt-4 text-on-surface-variant font-medium leading-relaxed max-w-[280px] md:max-w-none">
        Know before you pay.
        </p>
      </header>

      {/* Form */}
      <section className="flex-grow">
        <div className="space-y-5 mb-6">
          <GoogleButton label="Continue with Google" />
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-outline-variant/40" />
            <span className="text-xs font-semibold tracking-wide uppercase text-on-surface-variant">or continue with email</span>
            <div className="flex-1 h-px bg-outline-variant/40" />
          </div>
        </div>
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-semibold tracking-wide text-primary/70 uppercase px-1"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="hello@qoat.com"
              onChange={() => clearFieldError("email")}
              className={`w-full bg-surface-container-lowest border rounded-[12px] p-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all duration-200 ${fieldErrors.email ? "border-red-400" : "border-outline-variant"}`}
            />
            {fieldErrors.email && (
              <p className="text-xs font-medium text-[#791F1F] px-1 pt-1">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-semibold tracking-wide text-primary/70 uppercase px-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="off"
                placeholder="••••••••"
                onChange={() => clearFieldError("password")}
                className={`w-full bg-surface-container-lowest border rounded-[12px] p-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all duration-200 ${fieldErrors.password ? "border-red-400" : "border-outline-variant"}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-xs font-medium text-[#791F1F] px-1 pt-1">{fieldErrors.password}</p>
            )}
            <div className="flex justify-end pt-1">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="bg-[#FDF0F0] border border-[#F4C4C4] text-[#791F1F] text-xs font-medium rounded-[12px] px-4 py-3">
              {error}
            </p>
          )}

          {/* Submit */}
          <div className="pt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary py-4 rounded-[12px] font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-black/5 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </div>
        </form>
      </section>

      {/* Footer */}
      <footer className="mt-12 text-center pb-8">
        <p className="text-on-surface-variant font-medium">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-primary font-bold hover:underline underline-offset-4 ml-1"
          >
            Register
          </Link>
        </p>
      </footer>
    </main>
  );
}
