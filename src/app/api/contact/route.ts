import { z } from "zod";
import { Resend } from "resend";
import { auth } from "@/auth";

const resend = new Resend(process.env.RESEND_API_KEY);

const SUBJECT_OPTIONS = [
  "General question",
  "Feedback",
  "Partnership",
  "Bug report",
  "Other",
] as const;

const ContactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.enum(SUBJECT_OPTIONS),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message must be under 2000 characters"),
  _hp: z.string().max(0, "Bot detected"), // honeypot — must be empty
});

// In-memory rate limit: email → [timestamps]
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3;

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const window = now - RATE_LIMIT_WINDOW_MS;
  const hits = (rateLimitMap.get(email) ?? []).filter((t) => t > window);
  if (hits.length >= RATE_LIMIT_MAX) return false;
  rateLimitMap.set(email, [...hits, now]);
  return true;
}

export async function POST(request: Request) {
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return Response.json({ error: first.message }, { status: 400 });
  }

  const { name, email, subject, message } = parsed.data;

  if (!checkRateLimit(email)) {
    return Response.json(
      { error: "Too many submissions. Please wait before trying again." },
      { status: 429 }
    );
  }

  const timestamp = new Date().toLocaleString("en-AU", {
    timeZone: "Australia/Sydney",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background-color:#f9f9f7;color:#111111;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="padding-bottom:32px;">
              <span style="font-size:22px;font-weight:800;letter-spacing:-0.04em;color:#111111;">QOAT</span>
              <span style="font-size:14px;color:#888888;margin-left:10px;">Contact form submission</span>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:12px;padding:28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:20px;border-bottom:1px solid #ebebeb;">
                    <p style="margin:0 0 4px;font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:0.05em;">Subject</p>
                    <p style="margin:0;font-size:18px;font-weight:700;color:#111111;">${subject}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 0;border-bottom:1px solid #ebebeb;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:50%;padding-right:16px;vertical-align:top;">
                          <p style="margin:0 0 4px;font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:0.05em;">From</p>
                          <p style="margin:0;font-size:14px;font-weight:600;color:#111111;">${name}</p>
                        </td>
                        <td style="width:50%;vertical-align:top;">
                          <p style="margin:0 0 4px;font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:0.05em;">Email</p>
                          <p style="margin:0;font-size:14px;font-weight:600;color:#111111;">${email}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 0;">
                    <p style="margin:0 0 8px;font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:0.05em;">Message</p>
                    <p style="margin:0;font-size:14px;color:#444444;line-height:1.6;white-space:pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#888888;">
                Submitted ${timestamp} · ${isLoggedIn ? `Logged-in user (${session!.user!.email ?? "no email"})` : "Not logged in"}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: "QOAT Contact <noreply@getqoat.com>",
      to: "joseph@papawheelie.com.au",
      replyTo: email,
      subject: `[QOAT Contact] ${subject} — ${name}`,
      html,
    });
  } catch (err) {
    console.error("[contact] Resend error:", err);
    return Response.json({ error: "Failed to send message. Please try again." }, { status: 500 });
  }

  return Response.json({ success: true });
}
