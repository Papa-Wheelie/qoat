"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Category = { id: string; name: string; slug: string };

const ACCEPTED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

export default function UploadPage() {
  const { status } = useSession();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  // Fetch categories
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  function pickFile(f: File) {
    setError("");
    if (!ACCEPTED.includes(f.type)) {
      setError("Only PDF, JPG, PNG, or WebP files are accepted.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("File must be under 10 MB.");
      return;
    }
    setFile(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!file) { setError("Please select a file."); return; }
    if (!title.trim()) { setError("Title is required."); return; }
    if (!categoryId) { setError("Please select a category."); return; }

    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("title", title.trim());
    form.append("categoryId", categoryId);
    if (description.trim()) form.append("description", description.trim());

    try {
      const res = await fetch("/api/quotes/upload", { method: "POST", credentials: "include", body: form });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Upload failed."); setLoading(false); return; }
      router.push(`/quotes/${data.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (status === "loading" || status === "unauthenticated") return null;

  const inputClass =
    "w-full bg-surface-container-lowest border border-outline-variant rounded-[12px] p-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all duration-200";
  const labelClass =
    "block text-sm font-semibold tracking-wide text-primary/70 uppercase px-1 mb-2";

  return (
    <main className="min-h-screen bg-surface py-16 px-6 flex flex-col items-center">
      <div className="w-full max-w-lg">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tighter text-primary">
            Submit a Quote
          </h1>
          <p className="mt-3 text-on-surface-variant font-medium">
            Know before you pay.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Drop zone */}
          <div className="space-y-2">
            <label className={labelClass}>Quote File</label>
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={[
                "relative flex flex-col items-center justify-center gap-3 rounded-[12px] border-2 border-dashed px-6 py-10 cursor-pointer transition-all duration-200 select-none",
                dragging
                  ? "border-primary bg-surface-container-low"
                  : "border-outline-variant bg-surface-container-lowest hover:border-primary/50",
              ].join(" ")}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
              />
              {file ? (
                <>
                  <FileIcon />
                  <p className="text-sm font-semibold text-on-surface text-center break-all">
                    {file.name}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {(file.size / 1024 / 1024).toFixed(2)} MB — click to change
                  </p>
                </>
              ) : (
                <>
                  <UploadIcon />
                  <p className="text-sm font-semibold text-on-surface">
                    Drag &amp; drop or{" "}
                    <span className="text-primary underline underline-offset-2">browse</span>
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    PDF, JPG, PNG, WebP — max 10 MB
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className={labelClass}>
              Title
            </label>
            <input
              id="title"
              type="text"
              required
              placeholder="e.g. Kitchen renovation quote"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label htmlFor="category" className={labelClass}>
              Category
            </label>
            <select
              id="category"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>
                Select a category
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className={labelClass}>
              Description{" "}
              <span className="normal-case font-normal text-on-surface-variant tracking-normal">
                (optional)
              </span>
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Any context that might help the analysis…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass + " resize-none"}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-error font-medium px-1">{error}</p>
          )}

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary py-4 rounded-[12px] font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-black/5 disabled:opacity-60"
            >
              {loading ? "Submitting…" : "Submit Quote"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function UploadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-on-surface-variant"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
