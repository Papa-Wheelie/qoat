import { anthropic } from "./claude";

// Quick-block patterns (no AI call needed)
const PHONE_RE = /(\+61|0)[2-478]\d{8}|\b04\d{8}\b/;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const DIGIT_RUN_RE = /\b\d{9,16}\b/; // TFNs, credit card sequences
const PROFANITY = ["fuck", "shit", "cunt", "bitch", "asshole", "arsehole", "bastard", "dickhead"];

export async function moderateText(
  text: string,
  fieldType: "title" | "supplier" | "location" | "description"
): Promise<{ ok: boolean; reason?: string }> {
  if (!text.trim()) return { ok: true };

  const lower = text.toLowerCase();

  if (PHONE_RE.test(text)) {
    return { ok: false, reason: "Phone numbers can't be included here." };
  }
  if (EMAIL_RE.test(text)) {
    return { ok: false, reason: "Email addresses can't be included here." };
  }
  if (DIGIT_RUN_RE.test(text) && fieldType !== "description") {
    return { ok: false, reason: "Long number sequences can't be included here." };
  }
  if (PROFANITY.some((w) => lower.split(/\W+/).includes(w))) {
    return { ok: false, reason: "That content isn't allowed." };
  }

  // AI pass — fast, cheap, catches edge cases
  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 128,
      messages: [
        {
          role: "user",
          content: `Content moderation for an Australian quote platform. Field: ${fieldType}. Value: "${text}"

Reject ONLY if it contains: PII about a specific person (phone/email/TFN/home address), profanity, harassment, defamatory claims about a named individual, or obvious spam.

IMPORTANT: For supplier/location fields, business names and suburb/state names are completely legitimate. For title/description, trade job descriptions are expected.

Return JSON only, no explanation outside JSON: {"ok":true} or {"ok":false,"reason":"brief user-facing reason"}`,
        },
      ],
    });

    const block = msg.content[0];
    if (block.type !== "text") return { ok: true };

    const raw = block.text.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
    const result = JSON.parse(raw) as { ok: boolean; reason?: string };
    return { ok: result.ok, reason: result.reason };
  } catch {
    // Fail open — don't block valid edits if Haiku is unavailable
    return { ok: true };
  }
}
