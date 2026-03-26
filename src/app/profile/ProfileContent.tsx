"use client";

import { useState } from "react";
import Link from "next/link";

type ProfileData = {
  name: string | null;
  email: string;
  createdAt: string;
  stats: { quoteCount: number; commentCount: number; voteCount: number };
};

function Avatar({ name, image }: { name: string | null; image?: string | null }) {
  const initials = (name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (image) {
    return (
      <img src={image} alt={name ?? "Avatar"} className="w-20 h-20 rounded-full object-cover" />
    );
  }

  return (
    <div className="w-20 h-20 rounded-full bg-primary text-on-primary flex items-center justify-center text-2xl font-extrabold tracking-tight">
      {initials}
    </div>
  );
}

export default function ProfileContent({
  profile,
  image,
}: {
  profile: ProfileData;
  image: string | null;
}) {
  const [name, setName] = useState(profile.name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric",
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save");
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-10">
      {/* Identity */}
      <section className="bg-surface-container-lowest rounded-[16px] px-6 py-8 flex items-center gap-6">
        <Avatar name={profile.name} image={image} />
        <div>
          <p className="text-xl font-bold text-on-surface">{profile.name ?? "No name set"}</p>
          <p className="text-sm text-on-surface-variant mt-0.5">{profile.email}</p>
          <p className="text-xs text-on-surface-variant mt-1">Member since {memberSince}</p>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-4">
        {[
          { label: "Quotes", value: profile.stats.quoteCount, href: "/my-quotes" },
          { label: "Comments", value: profile.stats.commentCount, href: null },
          { label: "Votes cast", value: profile.stats.voteCount, href: null },
        ].map(({ label, value, href }) => (
          <div key={label} className="bg-surface-container-lowest rounded-[16px] px-6 py-6 text-center">
            <p className="text-3xl font-extrabold tracking-tight text-primary">{value}</p>
            <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant mt-1">
              {href ? (
                <Link href={href} className="hover:text-primary transition-colors">{label}</Link>
              ) : label}
            </p>
          </div>
        ))}
      </section>

      {/* Edit name */}
      <section className="bg-surface-container-lowest rounded-[16px] px-6 py-8 space-y-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">Edit profile</p>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-semibold tracking-wide text-primary/70 uppercase px-1">
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="w-full bg-surface border border-outline-variant rounded-[12px] p-4 text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            />
          </div>

          {error && <p className="text-sm text-error font-medium px-1">{error}</p>}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-[#111111] text-white rounded-[12px] text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            {saved && <p className="text-sm font-medium text-green-700">Changes saved</p>}
          </div>
        </form>
      </section>
    </div>
  );
}
