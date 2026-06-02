export type FaqItem = {
  question: string;
  answer: string;
  category: string;
};

export const FAQ: FaqItem[] = [
  // ── About QOAT ──────────────────────────────────────────────────────────────
  {
    category: "About QOAT",
    question: "What is QOAT?",
    answer:
      "QOAT is a free tool that helps Australian homeowners make sense of trade and supplier quotes. Upload a quote and get an instant AI-powered analysis of the price, supplier reputation, and timeframe — plus insight from the community. The name stands for Quote Open Analysis Tool.",
  },
  {
    category: "About QOAT",
    question: "Is QOAT free?",
    answer:
      "Yes. Browsing and viewing community quotes requires no account. Uploading and analysing your own quotes is also free — you just need to create an account so you can access your results later.",
  },
  {
    category: "About QOAT",
    question: "Who is QOAT for?",
    answer:
      "QOAT is for anyone who has received a trade quote and wants to know if it's reasonable — homeowners, renters, landlords, property managers, and small business owners. If you've ever wondered \"is this quote fair?\", QOAT is for you.",
  },
  {
    category: "About QOAT",
    question: "How is QOAT different from HiPages, ServiceSeeking, or Word of Mouth?",
    answer:
      "QOAT doesn't connect you with tradespeople — we help you evaluate quotes you've already received. Think of it as a second opinion rather than a marketplace. We're also community-first: every quote contributes to a growing dataset that improves everyone's benchmarking.",
  },

  // ── How analysis works ───────────────────────────────────────────────────────
  {
    category: "How analysis works",
    question: "How accurate is the AI analysis?",
    answer:
      "The AI is useful for flagging obvious issues and providing market context, but it isn't infallible. Prices vary significantly by location, scope, and market conditions. The analysis improves as more community quotes are uploaded for benchmarking. Treat it as informed guidance — not a definitive ruling.",
  },
  {
    category: "How analysis works",
    question: "What's the iron triangle?",
    answer:
      "The iron triangle is a project management concept that says every project is constrained by cost, quality, and time — you can usually optimise two at most. QOAT applies this to trade quotes: Price, Reputation, and Time each get a score from 1–10. These combine into your QOAT Score (Price 40%, Reputation 35%, Time 25%).",
  },
  {
    category: "How analysis works",
    question: "How is the Price score calculated?",
    answer:
      "The AI estimates a fair market price range for the job based on the type, scope, and location. When at least 3 comparable community quotes exist for similar work, those real prices are weighted into the score. A 10 means genuine value; a 1 means significantly above market. You can read the full methodology on the Methodology page.",
  },
  {
    category: "How analysis works",
    question: "How is the Reputation score calculated?",
    answer:
      "Reputation reflects verifiable signals found in or about the quote: ABN present, trade licence number provided (and whether one is legally required for this work), insurance mentioned, Google Reviews rating and review count, and how many times the supplier has appeared in QOAT quotes. Note that licence and ABN validity is inferred from the quote document — we don't yet verify with government registries.",
  },
  {
    category: "How analysis works",
    question: "How is the Time score calculated?",
    answer:
      "The AI extracts the job size (e.g. \"3 skylights\" or \"full kitchen renovation\") and scores the quoted timeframe against what is typical for a job of that size and type. A slow timeframe for a small job scores poorly; the same timeframe for a large job might be perfectly reasonable. Where possible, the explanation references time-per-unit.",
  },
  {
    category: "How analysis works",
    question: "What happens if the AI gets something wrong?",
    answer:
      "AI makes mistakes, especially on unusual document formats or niche trades. You can re-analyse your quote at any time using the Re-analyse button on your quote's detail page. The community section also lets others add context. If you spot a significant error, contact us.",
  },
  {
    category: "How analysis works",
    question: "Can I re-analyse a quote after uploading it?",
    answer:
      "Yes. From your quote's detail page, use the \"Re-analyse\" button (visible to you as the owner). This re-runs the full AI extraction and scoring pipeline using the latest community data and model improvements.",
  },

  // ── Privacy & data ───────────────────────────────────────────────────────────
  {
    category: "Privacy & data",
    question: "What happens to my quote document?",
    answer:
      "Your file is stored securely in Supabase storage. Only you (the owner) can access the original document via a signed URL. The AI extracts structured data from it, which is stored separately in our database.",
  },
  {
    category: "Privacy & data",
    question: "Is my supplier's name shared publicly?",
    answer:
      "No. The supplier name is always owner-only. Public views only show the job type, scope, location, and an anonymised price range. We do this to protect suppliers from being unfairly named publicly.",
  },
  {
    category: "Privacy & data",
    question: "Who can see my quote details?",
    answer:
      "You (the owner) can see everything: supplier name, iron triangle scores, red flags, and the AI recommendation. The public can see the job type and scope, a price range, line items, and community discussion. Sensitive details stay private.",
  },
  {
    category: "Privacy & data",
    question: "Can I delete my quote?",
    answer:
      "Yes. From your quote's detail page or My Quotes, use the delete option. This permanently removes the quote and its analysis from QOAT, including the stored file.",
  },
  {
    category: "Privacy & data",
    question: "Can I delete my account?",
    answer:
      "Yes. Go to Account Settings and scroll to the bottom. Deleting your account is permanent and removes all your quotes, analysis, and personal data from QOAT.",
  },

  // ── Community ────────────────────────────────────────────────────────────────
  {
    category: "Community",
    question: "Why are some quote details hidden from me?",
    answer:
      "The iron triangle scores, red flags, supplier name, and recommendation are only visible to the quote owner. This is intentional — it keeps analysis private to the person who uploaded the quote and prevents supplier details being used unfairly.",
  },
  {
    category: "Community",
    question: "Can I report inappropriate content?",
    answer:
      "Yes. Every quote and comment has a report button. Reports are reviewed by our moderation team. Content that violates our guidelines can be hidden from public view.",
  },
  {
    category: "Community",
    question: "How do upvotes and reactions work?",
    answer:
      "Upvoting a quote signals that it's useful or that you think the analysis is fair. Comment reactions (👍 💡 😱) let you respond to specific comments without a full reply. These signals help surface the most helpful content in the community.",
  },
  {
    category: "Community",
    question: "What is \"I got a similar quote\" for?",
    answer:
      "This lets you contribute your own pricing data anonymously. If you've received a quote for similar work, adding your price (even approximately) helps improve QOAT's benchmarking for everyone. Your name is never shown alongside the price.",
  },

  // ── Compliance & limitations ─────────────────────────────────────────────────
  {
    category: "Compliance & limitations",
    question: "Does QOAT give legal advice about permits or licences?",
    answer:
      "No. The compliance check is guidance only — it flags when work typically requires a permit or certificate of compliance in Australia, and prompts you to ask the right questions. Requirements vary by council and scope. Always confirm with your local council or a licensed professional before proceeding.",
  },
  {
    category: "Compliance & limitations",
    question: "How current is the pricing data?",
    answer:
      "The AI's general market knowledge has a training cutoff and may not reflect recent cost changes (e.g. material price spikes). Community benchmarking improves accuracy as more quotes are uploaded, but the dataset is still growing. For high-value work, always get multiple quotes from tradespeople.",
  },
  {
    category: "Compliance & limitations",
    question: "What types of quotes can I upload?",
    answer:
      "Any trade, home services, or supplier quote. This includes plumbing, electrical, building, landscaping, flooring, painting, roofing, tiling, and more. Product quotes (e.g. solar, HVAC, appliances) also work well. If it has a price, scope, and supplier, QOAT can analyse it.",
  },
  {
    category: "Compliance & limitations",
    question: "What file formats are supported?",
    answer:
      "PDF, JPEG, PNG, and WebP. Maximum file size is 10MB. Multi-page PDFs are fully supported.",
  },
];

// Group by category in insertion order
export function groupedFaq(): { category: string; items: FaqItem[] }[] {
  const map = new Map<string, FaqItem[]>();
  for (const item of FAQ) {
    if (!map.has(item.category)) map.set(item.category, []);
    map.get(item.category)!.push(item);
  }
  return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
}
