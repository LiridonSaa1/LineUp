import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

router.post("/contact", async (req, res): Promise<void> => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !message) {
    res.status(400).json({ error: "Emri, email-i dhe mesazhi janë të detyrueshëm" });
    return;
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_API_KEY) {
    logger.warn("BREVO_API_KEY not set — contact form email skipped");
    res.status(200).json({ ok: true, note: "Email skipped (no API key)" });
    return;
  }

  const subjectLine = subject
    ? `[TRIM Contact] ${subject}`
    : `[TRIM Contact] Mesazh nga ${name}`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="sq">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;min-height:100vh;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#12151e;border-radius:20px;overflow:hidden;border:1px solid #1e2330;">
        <tr>
          <td style="background:linear-gradient(135deg,#1a1e2e 0%,#12151e 100%);padding:32px 40px;text-align:center;">
            <span style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.5px;">
              TRIM<span style="color:#e8a020;">.</span>
            </span>
            <p style="color:#8892a0;font-size:14px;margin:8px 0 0;">Mesazh i ri nga forma e kontaktit</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:8px 0;color:#8892a0;font-size:13px;width:120px;">👤 Emri</td>
                <td style="padding:8px 0;color:#fff;font-size:14px;font-weight:600;">${name}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#8892a0;font-size:13px;">📧 Email</td>
                <td style="padding:8px 0;color:#e8a020;font-size:14px;font-weight:600;">
                  <a href="mailto:${email}" style="color:#e8a020;text-decoration:none;">${email}</a>
                </td>
              </tr>
              ${phone ? `
              <tr>
                <td style="padding:8px 0;color:#8892a0;font-size:13px;">📞 Telefon</td>
                <td style="padding:8px 0;color:#fff;font-size:14px;">${phone}</td>
              </tr>` : ""}
              ${subject ? `
              <tr>
                <td style="padding:8px 0;color:#8892a0;font-size:13px;">📌 Tema</td>
                <td style="padding:8px 0;color:#fff;font-size:14px;">${subject}</td>
              </tr>` : ""}
            </table>

            <div style="margin-top:24px;padding:20px;background:#1a1e2e;border-radius:14px;border-left:3px solid #e8a020;">
              <p style="color:#8892a0;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;font-weight:600;">Mesazhi</p>
              <p style="color:#e2e8f0;font-size:15px;line-height:1.7;margin:0;white-space:pre-wrap;">${message}</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px 28px;border-top:1px solid #1e2330;text-align:center;">
            <p style="color:#4a5568;font-size:12px;margin:0;">© ${new Date().getFullYear()} TRIM Kosovo · Forma e kontaktit</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: "TRIM Kosovo", email: "noreply@trimkosova.com" },
        to: [{ name: "TRIM Support", email: "info@trimkosova.com" }],
        replyTo: { name, email },
        subject: subjectLine,
        htmlContent,
      }),
    });

    if (!brevoRes.ok) {
      const err = await brevoRes.text();
      logger.error({ status: brevoRes.status, err }, "Brevo contact email failed");
      res.status(500).json({ error: "Email nuk u dërgua. Provoni përsëri." });
      return;
    }

    logger.info({ from: email, subject: subjectLine }, "Contact form email sent");
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Contact form Brevo error");
    res.status(500).json({ error: "Gabim i brendshëm. Provoni përsëri." });
  }
});

export default router;
