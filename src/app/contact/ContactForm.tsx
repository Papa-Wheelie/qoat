"use client";

import { useState, useRef } from "react";
import Link from "next/link";

const SUBJECTS = [
  "General question",
  "Feedback",
  "Partnership",
  "Bug report",
  "Other",
] as const;

type Props = {
  defaultName: string;
  defaultEmail: string;
};

export default function ContactForm({ defaultName, defaultEmail }: Props) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState<string>("");
  const [message, setMessage] = useState("");
  const [honey, setHoney] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!subject) {
      setError("Please select a subject.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, _hp: honey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-[16px] px-6 py-10 text-center space-y-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
          style={{ backgroundColor: "#E1F5EE" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#085041" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <p className="text-base font-bold text-on-surface">Message sent</p>
          <p className="text-sm text-on-surface-variant mt-1">
            Thanks — we&apos;ll get back to you soon.
          </p>
        </div>
        <button
          onClick={() => {
            setSuccess(false);
            setMessage("");
            setSubject("");
            setError(null);
          }}
          className="text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors underline underline-offset-2"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <div
          className="rounded-[12px] px-4 py-3 text-sm font-medium"
          style={{ backgroundColor: "#FCEBEB", color: "#791F1F" }}
        >
          {error}
        </div>
      )}

      {/* Honeypot — hidden from real users */}
      <div style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }} aria-hidden="true">
        <label htmlFor="contact-hp">Leave this empty</label>
        <input
          id="contact-hp"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honey}
          onChange={(e) => setHoney(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="contact-name" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
            Name <span style={{ color: "#791F1F" }}>*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 rounded-[12px] bg-white border border-[#C6C6C6] text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="contact-email" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
            Email <span style={{ color: "#791F1F" }}>*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-[12px] bg-white border border-[#C6C6C6] text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contact-subject" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
          Subject <span style={{ color: "#791F1F" }}>*</span>
        </label>
        <select
          id="contact-subject"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-4 py-3 rounded-[12px] bg-white border border-[#C6C6C6] text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors appearance-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center" }}
        >
          <option value="" disabled>Select a subject…</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="contact-message" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
            Message <span style={{ color: "#791F1F" }}>*</span>
          </label>
          <span className="text-xs text-on-surface-variant">
            {message.length}/2000
          </span>
        </div>
        <textarea
          id="contact-message"
          required
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={2000}
          placeholder="Tell us what's on your mind…"
          className="w-full px-4 py-3 rounded-[12px] bg-white border border-[#C6C6C6] text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors resize-y"
          style={{ minHeight: "140px" }}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="sm:w-auto w-full px-8 py-3 bg-[#111111] text-white rounded-[12px] font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send message"}
        </button>
        <p className="text-xs text-on-surface-variant">
          We typically reply within 1–2 business days.
        </p>
      </div>

      <p className="text-xs text-on-surface-variant">
        Already checked our{" "}
        <Link href="/faq" className="underline hover:text-on-surface transition-colors">
          FAQ
        </Link>
        ?
      </p>
    </form>
  );
}
