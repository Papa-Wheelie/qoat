import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-surface pt-14 flex flex-col items-center justify-center px-6">
      <div className="text-center space-y-4 max-w-md">
        <p className="text-8xl font-extrabold tracking-tighter text-on-surface-variant/20">404</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary">Page not found</h1>
        <p className="text-on-surface-variant">The page you&apos;re looking for doesn&apos;t exist.</p>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-[#111111] text-white rounded-[12px] text-sm font-bold hover:opacity-90 transition-opacity"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
