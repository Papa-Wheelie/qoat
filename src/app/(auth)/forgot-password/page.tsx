"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value;

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Something went wrong. Please try again.");
      return;
    }

    setSubmitted(true);
  }

  return (
    <main className="w-full max-w-md px-8 pt-24 pb-12 flex-grow flex flex-col">
      <header className="mb-20 text-center md:text-left">
        <h1 className="text-4xl font-extrabold tracking-tighter text-primary">QOAT</h1>
        <p className="mt-4 text-on-surface-variant font-medium leading-relaxed">
          Know before you pay.
        </p>
      </header>

      {submitted ? (
        <section className="flex-grow">
          <div className="space-y-4">
            <h2 className="text-2xl font-extrabold tracking-tight text-primary">Check your email</h2>
            <p className="text-on-surface-variant leading-relaxed">
              If an account exists for that address, we&apos;ve sent a password reset link. It expires in 1 hour.
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
              >
                ← Back to sign in
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="flex-grow">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold tracking-tight text-primary">Forgot password?</h2>
              <p className="text-sm text-on-surface-variant">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

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
                required
                autoComplete="email"
                placeholder="hello@qoat.com"
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
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </div>
          </form>
        </section>
      )}

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
