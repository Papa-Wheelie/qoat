import { type Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact — QOAT",
  description: "Get in touch with the QOAT team.",
};

export default async function ContactPage() {
  const session = await auth();
  const defaultName = session?.user?.name ?? "";
  const defaultEmail = session?.user?.email ?? "";

  return (
    <main className="min-h-screen bg-surface pt-14 py-16 px-6 flex flex-col items-center">
      <div className="w-full max-w-xl space-y-10">

        {/* Header */}
        <header className="space-y-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">
            Contact
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">
            Get in touch
          </h1>
          <p className="text-on-surface-variant leading-relaxed">
            Have a question, feedback, or a partnership idea? We&apos;d love to hear from you.
          </p>
        </header>

        {/* Form */}
        <div className="bg-surface-container-lowest rounded-[20px] px-6 py-7">
          <ContactForm defaultName={defaultName} defaultEmail={defaultEmail} />
        </div>

        {/* Back */}
        <div className="pb-4">
          <Link href="/faq" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">
            ← Back to FAQ
          </Link>
        </div>

      </div>
    </main>
  );
}
