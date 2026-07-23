import Link from "next/link";

const LINK_CLASS = "text-sm hover:text-on-surface transition-colors";
const HEADING_CLASS = "text-xs font-semibold tracking-widest uppercase";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface">
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="col-span-2 sm:col-span-1 space-y-2">
            <p className="text-base font-extrabold tracking-tight text-primary">QOAT</p>
            <p className="text-sm" style={{ color: "#6B6B6B" }}>Know before you pay.</p>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <p className={HEADING_CLASS} style={{ color: "#AAAAAA" }}>Product</p>
            <ul className="space-y-2.5">
              <li><Link href="/categories" className={LINK_CLASS} style={{ color: "#6B6B6B" }}>Categories</Link></li>
              <li><Link href="/browse" className={LINK_CLASS} style={{ color: "#6B6B6B" }}>Browse quotes</Link></li>
              <li><Link href="/methodology" className={LINK_CLASS} style={{ color: "#6B6B6B" }}>Methodology</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <p className={HEADING_CLASS} style={{ color: "#AAAAAA" }}>Support</p>
            <ul className="space-y-2.5">
              <li><Link href="/faq" className={LINK_CLASS} style={{ color: "#6B6B6B" }}>FAQ</Link></li>
              <li><Link href="/contact" className={LINK_CLASS} style={{ color: "#6B6B6B" }}>Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <p className={HEADING_CLASS} style={{ color: "#AAAAAA" }}>Legal</p>
            <ul className="space-y-2.5">
              <li><Link href="/terms" className={LINK_CLASS} style={{ color: "#6B6B6B" }}>Terms</Link></li>
              <li><Link href="/privacy" className={LINK_CLASS} style={{ color: "#6B6B6B" }}>Privacy</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom row */}
        <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-xs" style={{ color: "#AAAAAA" }}>© {year} QOAT. All rights reserved.</p>
          <p className="text-xs" style={{ color: "#AAAAAA" }}>Made in Melbourne.</p>
        </div>
      </div>
    </footer>
  );
}
