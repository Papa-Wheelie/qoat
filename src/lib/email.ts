import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "QOAT <noreply@getqoat.com>";

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color: #f9f9f7;
  color: #111111;
`;

function emailShell(content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;${baseStyle}">
  <table width="100%" cellpadding="0" cellspacing="0" style="${baseStyle}">
    <tr>
      <td align="center" style="padding: 48px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
          <tr>
            <td style="padding-bottom:40px;">
              <span style="font-size:24px;font-weight:800;letter-spacing:-0.04em;color:#111111;">QOAT</span>
            </td>
          </tr>
          ${content}
          <tr>
            <td style="padding-top:40px;border-top:1px solid #ebebeb;">
              <p style="margin:0;font-size:12px;color:#888888;">
                You received this email because of your QOAT account.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const content = `
    <tr>
      <td style="padding-bottom:24px;">
        <h2 style="margin:0 0 8px;font-size:28px;font-weight:800;letter-spacing:-0.02em;color:#111111;">
          Reset your password
        </h2>
        <p style="margin:0;font-size:15px;color:#555555;line-height:1.6;">
          You requested a password reset for your QOAT account. Click the button below to choose a new password.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding-bottom:24px;">
        <a href="${resetUrl}"
          style="display:inline-block;background-color:#111111;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:12px;">
          Reset my password
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding-bottom:16px;">
        <p style="margin:0;font-size:13px;color:#888888;">This link expires in 1 hour.</p>
      </td>
    </tr>
    <tr>
      <td>
        <p style="margin:0;font-size:13px;color:#888888;">If you didn&apos;t request this, you can safely ignore this email.</p>
      </td>
    </tr>
  `;

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Reset your QOAT password",
    html: emailShell(content),
  });
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
  return data;
}

export async function sendVerificationEmail(email: string, verifyUrl: string) {
  const content = `
    <tr>
      <td style="padding-bottom:8px;">
        <h2 style="margin:0 0 8px;font-size:28px;font-weight:800;letter-spacing:-0.02em;color:#111111;">
          Welcome to QOAT
        </h2>
        <p style="margin:0 0 24px;font-size:15px;color:#555555;line-height:1.6;">
          Know before you pay.
        </p>
        <p style="margin:0;font-size:15px;color:#555555;line-height:1.6;">
          Verify your email address to complete your account setup.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 0;">
        <a href="${verifyUrl}"
          style="display:inline-block;background-color:#111111;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:12px;">
          Verify my email
        </a>
      </td>
    </tr>
    <tr>
      <td>
        <p style="margin:0;font-size:13px;color:#888888;">This link expires in 24 hours.</p>
      </td>
    </tr>
  `;

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Verify your QOAT email",
    html: emailShell(content),
  });
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
  return data;
}
