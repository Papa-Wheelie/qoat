import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { anthropic } from "@/lib/claude";
import { MODEL_VERSION } from "@/lib/methodology";
import { getReferenceBlock } from "@/lib/pricingReference";
import { NextRequest } from "next/server";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAUD(n: number | null | undefined): string {
  if (n == null) return "unknown";
  return "$" + n.toLocaleString("en-AU");
}

function nullStr(v: string | null | undefined): string {
  return v?.trim() || "not provided";
}

// ── Load quote with all context ───────────────────────────────────────────────

async function loadQuote(quoteId: string) {
  return prisma.quote.findUnique({
    where: { id: quoteId },
    select: {
      id: true,
      title: true,
      suburb: true,
      state: true,
      userId: true,
      subcategory: {
        select: {
          name: true,
          slug: true,
          topCategory: { select: { name: true, slug: true } },
        },
      },
      analysis: {
        select: {
          supplierName: true,
          totalAmount: true,
          lineItems: true,
          redFlags: true,
          estimatedTimeframe: true,
          priceScore: true,
          priceVerdict: true,
          priceExplanation: true,
          reputationScore: true,
          reputationVerdict: true,
          reputationExplanation: true,
          timeScore: true,
          timeVerdict: true,
          timeExplanation: true,
          recommendation: true,
          overallSummary: true,
          qualityTier: true,
          jobSize: true,
          reputationSignals: true,
          complianceFlags: true,
          priceSampleSize: true,
          googleRating: true,
          googleReviewCount: true,
        },
      },
    },
  });
}

// ── Build system prompt ───────────────────────────────────────────────────────

function buildSystemPrompt(
  quote: NonNullable<Awaited<ReturnType<typeof loadQuote>>>
): string {
  const a = quote.analysis;
  const sub = quote.subcategory;
  const top = sub?.topCategory;

  const lines: string[] = [];

  lines.push(
    "You are QOAT, an assistant helping an Australian homeowner understand a specific quote they received. " +
    "Answer their questions using ONLY the quote data and market reference provided below. " +
    "Be honest, direct, and practical."
  );
  lines.push(
    "If you don't know something or it's not in the data, say so — never fabricate prices or facts."
  );
  lines.push(
    "Stay on topic: this quote, this category, and Australian home improvement. " +
    "If asked something off-topic, politely redirect to the quote."
  );
  lines.push(
    "Give practical, actionable answers. When discussing price, reference the market data. " +
    "When suggesting negotiation, be specific."
  );
  lines.push(
    "Keep answers concise — a few sentences to a short paragraph. This is a chat, not an essay."
  );
  lines.push(
    "Use Australian English spelling and refer to amounts in Australian dollars. " +
    "Reflect Australian market norms and regulations."
  );
  lines.push(
    "Don't volunteer the supplier's ABN or licence number in your answers unless the user specifically asks about them. " +
    "You can reference whether they're present ('the quote includes an ABN') without reciting the number."
  );

  lines.push("\n--- QUOTE DATA ---\n");

  // Basics
  lines.push(`Quote title: ${quote.title}`);
  if (sub) lines.push(`Category: ${top?.name ?? ""} › ${sub.name}`);
  lines.push(`Location: ${[quote.suburb, quote.state].filter(Boolean).join(", ") || "not provided"}`);

  if (a) {
    lines.push(`Supplier: ${nullStr(a.supplierName)}`);
    lines.push(`Total quoted: ${formatAUD(a.totalAmount)}`);
    lines.push(`Estimated timeframe: ${nullStr(a.estimatedTimeframe)}`);

    // Quality / size
    if (a.qualityTier) lines.push(`Quality tier: ${a.qualityTier}`);
    if (a.jobSize && typeof a.jobSize === "object") {
      const js = a.jobSize as Record<string, unknown>;
      const parts = [js.descriptor, js.sizeBand ? `(${js.sizeBand})` : null]
        .filter(Boolean)
        .join(" ");
      if (parts) lines.push(`Job size: ${parts}`);
    }

    // Line items
    if (Array.isArray(a.lineItems) && a.lineItems.length > 0) {
      lines.push("\nLine items:");
      for (const item of a.lineItems as Array<{ description?: string; amount?: number; unit?: string }>) {
        const desc = item.description || "unlabelled";
        const amt = item.amount != null ? formatAUD(item.amount) : "—";
        lines.push(`  • ${desc}: ${amt}`);
      }
    }

    // Red flags
    if (Array.isArray(a.redFlags) && a.redFlags.length > 0) {
      lines.push("\nRed flags identified:");
      for (const flag of a.redFlags as string[]) {
        lines.push(`  • ${flag}`);
      }
    } else {
      lines.push("\nRed flags: none identified");
    }

    // Iron triangle scores
    lines.push("\n--- QOAT ANALYSIS ---\n");
    if (a.priceScore != null) {
      lines.push(
        `Price score: ${a.priceScore}/10 (${a.priceVerdict ?? ""})\n  ${a.priceExplanation ?? ""}`
      );
    }
    if (a.reputationScore != null) {
      lines.push(
        `Reputation score: ${a.reputationScore}/10 (${a.reputationVerdict ?? ""})\n  ${a.reputationExplanation ?? ""}`
      );
    }
    if (a.timeScore != null) {
      lines.push(
        `Time score: ${a.timeScore}/10 (${a.timeVerdict ?? ""})\n  ${a.timeExplanation ?? ""}`
      );
    }
    if (a.recommendation) {
      lines.push(`Recommendation: ${a.recommendation}`);
    }
    if (a.overallSummary) {
      lines.push(`Overall summary: ${a.overallSummary}`);
    }

    // Comparables
    if (a.priceSampleSize != null) {
      lines.push(`\nPrice benchmarked against ${a.priceSampleSize} comparable quote${a.priceSampleSize !== 1 ? "s" : ""} in QOAT's database.`);
    }

    // Reputation signals
    if (a.reputationSignals && typeof a.reputationSignals === "object") {
      const rs = a.reputationSignals as Record<string, unknown>;
      lines.push("\nReputation signals:");
      if (a.googleRating != null) {
        lines.push(`  • Google rating: ${a.googleRating}/5 from ${a.googleReviewCount ?? "?"} reviews`);
      } else {
        lines.push("  • Google: not found");
      }
      if (rs.hasABN != null) lines.push(`  • ABN provided: ${rs.hasABN ? `yes (${rs.abnNumber ?? ""})` : "no"}`);
      if (rs.hasLicence != null) {
        lines.push(`  • Licence provided: ${rs.hasLicence ? `yes (${rs.licenceNumber ?? ""})` : "no"}${rs.licenceRequired ? " (required for this trade)" : ""}`);
      }
      if (rs.hasInsurance != null) lines.push(`  • Insurance mentioned: ${rs.hasInsurance ? "yes" : "no"}`);
    }

    // Compliance flags
    if (Array.isArray(a.complianceFlags) && a.complianceFlags.length > 0) {
      lines.push("\nCompliance flags:");
      for (const flag of a.complianceFlags as string[]) {
        lines.push(`  • ${flag}`);
      }
    }
  }

  // Market reference
  if (top?.slug && sub?.slug) {
    const refBlock = getReferenceBlock(top.slug, sub.slug);
    if (refBlock) {
      lines.push("\n--- MARKET REFERENCE ---\n");
      lines.push(refBlock);
    }
  }

  return lines.join("\n");
}

// ── Auth + ownership check ────────────────────────────────────────────────────

async function getAuthedOwner(quoteId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "unauthenticated" as const };

  const quote = await loadQuote(quoteId);
  if (!quote) return { error: "not_found" as const };
  if (quote.userId !== session.user.id) return { error: "forbidden" as const };

  return { quote, userId: session.user.id };
}

// ── GET /api/quotes/[id]/chat ─────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await getAuthedOwner(id);

  if (result.error === "unauthenticated") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (result.error === "not_found") {
    return Response.json({ error: "Quote not found" }, { status: 404 });
  }
  if (result.error === "forbidden") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const conversation = await prisma.chatConversation.findUnique({
    where: { quoteId: id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: { role: true, content: true, createdAt: true },
      },
    },
  });

  const messages = conversation?.messages.map((m) => ({
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  })) ?? [];

  return Response.json({ messages });
}

// ── POST /api/quotes/[id]/chat ────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await getAuthedOwner(id);

  if (result.error === "unauthenticated") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (result.error === "not_found") {
    return Response.json({ error: "Quote not found" }, { status: 404 });
  }
  if (result.error === "forbidden") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { quote, userId } = result;

  // Parse + validate body
  let body: { message?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userMessage = body.message?.trim() ?? "";
  if (!userMessage) {
    return Response.json({ error: "message is required" }, { status: 400 });
  }
  if (userMessage.length > 1000) {
    return Response.json({ error: "Message must be under 1000 characters" }, { status: 400 });
  }

  // Find or create conversation
  let conversation = await prisma.chatConversation.findUnique({
    where: { quoteId: id },
    select: { id: true },
  });

  if (!conversation) {
    conversation = await prisma.chatConversation.create({
      data: { quoteId: id, userId },
      select: { id: true },
    });
  }

  // Save user message
  await prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      role: "user",
      content: userMessage,
    },
  });

  // Load full history (including the message just saved)
  const history = await prisma.chatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true },
  });

  // Build system prompt
  const systemPrompt = buildSystemPrompt(quote);

  // Call Claude
  let replyContent: string;
  try {
    const response = await anthropic.messages.create({
      model: MODEL_VERSION,
      max_tokens: 1024,
      system: systemPrompt,
      messages: history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const firstBlock = response.content[0];
    if (firstBlock?.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }
    replyContent = firstBlock.text;
  } catch (err) {
    console.error("[chat] Claude call failed:", err);
    return Response.json(
      { error: "Something went wrong getting a response. Please try again." },
      { status: 500 }
    );
  }

  // Save assistant reply
  const saved = await prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      role: "assistant",
      content: replyContent,
    },
    select: { role: true, content: true, createdAt: true },
  });

  // Touch updatedAt on conversation
  await prisma.chatConversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  return Response.json({
    message: {
      role: saved.role,
      content: saved.content,
      createdAt: saved.createdAt.toISOString(),
    },
  });
}
