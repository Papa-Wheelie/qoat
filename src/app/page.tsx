import { auth } from "@/auth";
import { type Metadata } from "next";
import HomepageMarketing from "@/components/HomepageMarketing";
import HomepageDashboard from "@/components/HomepageDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "QOAT — Know before you pay. AI analysis for trade quotes.",
  description:
    "Upload your trade or supplier quote and get an instant iron triangle analysis plus community insight from Australian homeowners.",
  openGraph: {
    title: "QOAT — Know before you pay. AI analysis for trade quotes.",
    description:
      "Upload your trade or supplier quote and get an instant iron triangle analysis plus community insight from Australian homeowners.",
    url: "https://getqoat.com",
    siteName: "QOAT",
    type: "website",
  },
};

export default async function HomePage() {
  const session = await auth();

  if (session?.user?.id) {
    return <HomepageDashboard userId={session.user.id} />;
  }

  return <HomepageMarketing />;
}
