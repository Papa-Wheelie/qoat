"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirm = (form.elements.namedItem("confirm") as HTMLInputElement).value;

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    setSuccess(true);
  }

  if (!token) {
    return (
      <section className="flex-grow space-y-4">
        <h2 className="text-2xl font-extrabold tracking-tight text-primary">Invalid link</h2>
        <p className="text-on-surface-variant">This reset link is missing or malformed.</p>
        <Link href="/forgot-password" className="text-sm font-semibold text-primary hover:underline underline-offset-4">
          Request a new reset link
        </Link>
      </section>
    );
  }

  if (success) {
    return (
      <section className="flex-grow space-y-4">
        <h2 className="text-2xl font-extrabold tracking-tight text-primary">Password reset</h2>
        <p className="text-on-surface-variant">Your password has been updated.</p>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-block bg-primary text-on-primary px-6 py-3 rounded-[12px] font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Sign in now
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-grow">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold tracking-tight text-primary">Choose a new password</h2>
          <p className="text-sm text-on-surface-variant">Must be at least 8 characters.</p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-semibold tracking-wide text-primary/70 uppercase px-1"
          >
            New password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="off"
              placeholder="••••••••"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-[12px] p-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all duration-200"
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
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confirm"
            className="block text-sm font-semibold tracking-wide text-primary/70 uppercase px-1"
          >
            Confirm password
          </label>
          <input
            id="confirm"
            name="confirm"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="off"
            placeholder="••••••••"
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-[12px] p-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all duration-200"
          />
        </div>

        {error && <p className="text-sm text-error font-medium px-1">{error}</p>}

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-4 rounded-[12px] font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-black/5 disabled:opacity-60"
          >
            {loading ? "Resetting…" : "Reset password"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="w-full max-w-md px-8 pt-24 pb-12 flex-grow flex flex-col">
      <header className="mb-20 text-center md:text-left">
        <h1 className="text-4xl font-extrabold tracking-tighter text-primary">QOAT</h1>
        <p className="mt-4 text-on-surface-variant font-medium leading-relaxed">
          Know before you pay.
        </p>
      </header>

      <Suspense>
        <ResetPasswordForm />
      </Suspense>

      <footer className="mt-12 text-center pb-8">
        <p className="text-on-surface-variant font-medium">
          Remember your password?{" "}
          <Link href="/login" className="text-primary font-bold hover:underline underline-offset-4 ml-1">
            Sign in
          </Link>
        </p>
      </footer>
    </main>
  );
}
