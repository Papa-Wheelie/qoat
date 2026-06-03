"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const ACCEPTED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

export default function UploadPage() {
  const { status } = useSession();
  const router = useRouter();

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  async function handleFile(f: File) {
    setError("");
    if (!ACCEPTED.includes(f.type)) {
      setError("Only PDF, JPG, PNG, or WebP files are accepted.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("File must be under 10 MB.");
      return;
    }

    setFileName(f.name);
    setUploading(true);

    const form = new FormData();
    form.append("file", f);

    try {
      const res = await fetch("/api/quotes/upload", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        setUploading(false);
        setFileName(null);
        return;
      }
      router.push(`/quotes/${data.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setUploading(false);
      setFileName(null);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (uploading) return;
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  if (status === "loading" || status === "unauthenticated") return null;

  return (
    <main className="min-h-screen bg-surface pt-14 flex flex-col items-center justify-center px-6 pb-20">
      <div className="w-full max-w-lg">
        {/* Header */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tighter text-primary">
            Upload your quote
          </h1>
          <p className="mt-3 text-on-surface-variant font-medium text-lg">
            Take a photo or upload a PDF — we&apos;ll do the rest.
          </p>
        </header>

        {/* Dropzone */}
        <div
          role="button"
          tabIndex={uploading ? -1 : 0}
          onClick={() => !uploading && inputRef.current?.click()}
          onKeyDown={(e) => !uploading && e.key === "Enter" && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={[
            "relative flex flex-col items-center justify-center gap-4 rounded-[20px] border-2 border-dashed px-8 py-16 transition-all duration-200 select-none",
            uploading
              ? "border-primary/40 bg-surface-container-low cursor-default"
              : dragging
                ? "border-primary bg-[#E8F5F2] cursor-pointer"
                : "border-outline-variant bg-white hover:border-primary/50 hover:bg-surface-container-lowest cursor-pointer",
          ].join(" ")}
        >
          {/* Hidden file input — no capture so PDF + gallery + camera all work */}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />

          {uploading ? (
            <>
              <Spinner />
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-on-surface break-all max-w-xs">
                  {fileName}
                </p>
                <p className="text-sm text-on-surface-variant font-medium">
                  Analysing your quote…
                </p>
              </div>
            </>
          ) : (
            <>
              <UploadIcon active={dragging} />
              <div className="text-center space-y-1">
                <p className="text-base font-bold text-on-surface">
                  {dragging ? "Drop to upload" : (
                    <>
                      Drag &amp; drop, or{" "}
                      <span className="text-primary underline underline-offset-2">choose a file</span>
                    </>
                  )}
                </p>
                <p className="text-sm text-on-surface-variant">
                  PDF, JPG, PNG, WebP — max 10 MB
                </p>
              </div>
            </>
          )}
        </div>

        {/* Mobile camera shortcut */}
        {!uploading && (
          <div className="mt-4 flex justify-center sm:hidden">
            <label className="flex items-center gap-2 px-5 py-3 bg-primary text-on-primary rounded-[12px] font-bold text-sm cursor-pointer active:scale-[0.98] transition-all shadow-md shadow-black/10">
              <CameraIcon />
              Take a photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </label>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-error font-medium text-center">{error}</p>
        )}
      </div>
    </main>
  );
}

function UploadIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={active ? "text-primary" : "text-on-surface-variant"}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="text-primary animate-spin"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
