import { logger } from "./logger";

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = "noreply@trimkosova.com";
const FROM_NAME = "TRIM Kosovo";

interface SendEmailOptions {
  to: { email: string; name: string };
  subject: string;
  htmlContent: string;
}

async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  if (!BREVO_API_KEY) {
    logger.warn("BREVO_API_KEY not set — email skipped");
    return false;
  }
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [opts.to],
        subject: opts.subject,
        htmlContent: opts.htmlContent,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      logger.error({ status: res.status, err }, "Brevo send failed");
      return false;
    }
    logger.info({ to: opts.to.email, subject: opts.subject }, "Email sent via Brevo");
    return true;
  } catch (err) {
    logger.error({ err }, "Brevo request error");
    return false;
  }
}

/* ── Templates ──────────────────────────────────────────── */

export async function sendOtpEmail(opts: {
  to: { email: string; name: string };
  otp: string;
  shopName: string;
  scheduledAt: Date;
  serviceName: string;
  barberName: string;
}): Promise<boolean> {
  const dateStr = opts.scheduledAt.toLocaleString("sq-AL", {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return sendEmail({
    to: opts.to,
    subject: `Kodi juaj OTP — ${opts.shopName}`,
    htmlContent: `
<!DOCTYPE html>
<html lang="sq">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;min-height:100vh;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#12151e;border-radius:20px;overflow:hidden;border:1px solid #1e2330;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1e2e 0%,#12151e 100%);padding:40px 40px 30px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:8px;">
              <div style="width:36px;height:36px;background:#e8a020;border-radius:10px;display:inline-block;line-height:36px;text-align:center;font-size:18px;">✂</div>
              <span style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.5px;">TRIM<span style="color:#e8a020;">.</span></span>
            </div>
          </td>
        </tr>
        <!-- OTP box -->
        <tr>
          <td style="padding:40px 40px 30px;">
            <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 8px;">Konfirmoni rezervimin tuaj</h1>
            <p style="color:#8892a0;font-size:15px;margin:0 0 32px;">Përshëndetje ${opts.to.name}, rezervimi juaj pret konfirmimin.</p>

            <!-- Appointment details -->
            <div style="background:#1a1e2e;border-radius:14px;padding:20px;margin-bottom:28px;border:1px solid #1e2330;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;color:#8892a0;font-size:13px;">Dyqani</td>
                  <td style="padding:6px 0;color:#fff;font-size:13px;font-weight:600;text-align:right;">${opts.shopName}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#8892a0;font-size:13px;">Shërbimi</td>
                  <td style="padding:6px 0;color:#fff;font-size:13px;font-weight:600;text-align:right;">${opts.serviceName}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#8892a0;font-size:13px;">Berberi</td>
                  <td style="padding:6px 0;color:#fff;font-size:13px;font-weight:600;text-align:right;">${opts.barberName}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#8892a0;font-size:13px;">Data & Ora</td>
                  <td style="padding:6px 0;color:#e8a020;font-size:13px;font-weight:600;text-align:right;">${dateStr}</td>
                </tr>
              </table>
            </div>

            <!-- OTP code -->
            <p style="color:#8892a0;font-size:13px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Kodi juaj OTP</p>
            <div style="text-align:center;background:#1a1e2e;border:2px solid #e8a020;border-radius:16px;padding:24px;margin-bottom:24px;">
              <span style="font-size:48px;font-weight:900;letter-spacing:12px;color:#e8a020;font-variant-numeric:tabular-nums;">${opts.otp}</span>
            </div>
            <p style="color:#8892a0;font-size:13px;text-align:center;margin:0 0 28px;">Ky kod skadon pas <strong style="color:#fff;">15 minutave</strong>. Mos e ndani me askënd.</p>

            <div style="background:#1a1e2e;border-radius:12px;padding:14px 16px;border-left:3px solid #e8a020;">
              <p style="color:#8892a0;font-size:12px;margin:0;">Nëse nuk ju keni bërë këtë rezervim, inoroni këtë email.</p>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 30px;border-top:1px solid #1e2330;text-align:center;">
            <p style="color:#4a5568;font-size:12px;margin:0;">© ${new Date().getFullYear()} TRIM Kosovo · Platforma e berbertëve premium</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendBookingConfirmedEmail(opts: {
  to: { email: string; name: string };
  shopName: string;
  scheduledAt: Date;
  serviceName: string;
  barberName: string;
  totalPrice: number;
}): Promise<boolean> {
  const dateStr = opts.scheduledAt.toLocaleString("sq-AL", {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return sendEmail({
    to: opts.to,
    subject: `✅ Rezervimi konfirmuar — ${opts.shopName}`,
    htmlContent: `
<!DOCTYPE html>
<html lang="sq">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;min-height:100vh;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#12151e;border-radius:20px;overflow:hidden;border:1px solid #1e2330;">
        <tr>
          <td style="background:linear-gradient(135deg,#1a1e2e 0%,#12151e 100%);padding:40px;text-align:center;">
            <div style="width:60px;height:60px;background:#16a34a;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:16px;">✓</div>
            <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0 0 8px;">Rezervimi u konfirmua!</h1>
            <p style="color:#8892a0;font-size:15px;margin:0;">Shihemi, ${opts.to.name}!</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <div style="background:#1a1e2e;border-radius:14px;padding:24px;border:1px solid #1e2330;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;color:#8892a0;font-size:14px;">📍 Dyqani</td>
                  <td style="padding:8px 0;color:#fff;font-size:14px;font-weight:700;text-align:right;">${opts.shopName}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#8892a0;font-size:14px;">✂️ Shërbimi</td>
                  <td style="padding:8px 0;color:#fff;font-size:14px;font-weight:600;text-align:right;">${opts.serviceName}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#8892a0;font-size:14px;">👤 Berberi</td>
                  <td style="padding:8px 0;color:#fff;font-size:14px;font-weight:600;text-align:right;">${opts.barberName}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#8892a0;font-size:14px;">🗓️ Data & Ora</td>
                  <td style="padding:8px 0;color:#e8a020;font-size:14px;font-weight:700;text-align:right;">${dateStr}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top:16px;border-top:1px solid #1e2330;"></td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#8892a0;font-size:14px;">💳 Çmimi total</td>
                  <td style="padding:4px 0;color:#e8a020;font-size:18px;font-weight:800;text-align:right;">${opts.totalPrice.toFixed(2)}€</td>
                </tr>
              </table>
            </div>
            <p style="color:#8892a0;font-size:13px;text-align:center;margin:24px 0 0;">Faleminderit që zgjodhët <strong style="color:#fff;">TRIM Kosovo</strong>.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px 30px;border-top:1px solid #1e2330;text-align:center;">
            <p style="color:#4a5568;font-size:12px;margin:0;">© ${new Date().getFullYear()} TRIM Kosovo · Platforma e berbertëve premium</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendWelcomeEmail(opts: {
  to: { email: string; name: string };
  role: string;
}): Promise<boolean> {
  const isOwner = opts.role === "owner";
  return sendEmail({
    to: opts.to,
    subject: `Mirë se vini te TRIM Kosovo! 🎉`,
    htmlContent: `
<!DOCTYPE html>
<html lang="sq">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;min-height:100vh;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#12151e;border-radius:20px;overflow:hidden;border:1px solid #1e2330;">
        <tr>
          <td style="background:linear-gradient(135deg,#1a1e2e 0%,#0f1117 100%);padding:48px 40px;text-align:center;">
            <div style="display:inline-block;margin-bottom:20px;">
              <div style="width:44px;height:44px;background:#e8a020;border-radius:12px;display:inline-block;line-height:44px;text-align:center;font-size:22px;">✂</div>
              <span style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px;vertical-align:middle;margin-left:10px;">TRIM<span style="color:#e8a020;">.</span></span>
            </div>
            <h1 style="color:#fff;font-size:28px;font-weight:800;margin:0 0 10px;line-height:1.2;">
              ${isOwner ? "Mirë se vini, Partner! 🤝" : "Mirë se vini, " + opts.to.name.split(" ")[0] + "! 👋"}
            </h1>
            <p style="color:#8892a0;font-size:16px;margin:0;">
              ${isOwner ? "Llogaria juaj e pronarit u krijua me sukses." : "Llogaria juaj u krijua me sukses."}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            ${isOwner ? `
            <h2 style="color:#fff;font-size:18px;font-weight:700;margin:0 0 20px;">Si të filloni:</h2>
            <div style="background:#1a1e2e;border-radius:14px;padding:20px;margin-bottom:16px;border:1px solid #1e2330;display:flex;align-items:flex-start;gap:16px;">
              <div style="width:32px;height:32px;background:#e8a020;border-radius:8px;flex-shrink:0;text-align:center;line-height:32px;font-weight:800;color:#0f1117;">1</div>
              <div><p style="color:#fff;font-size:14px;font-weight:600;margin:0 0 4px;">Shtoni sallon tuaj</p><p style="color:#8892a0;font-size:13px;margin:0;">Shkoni te Dashboard dhe plotësoni profilin e sallonit.</p></div>
            </div>
            <div style="background:#1a1e2e;border-radius:14px;padding:20px;margin-bottom:16px;border:1px solid #1e2330;display:flex;align-items:flex-start;gap:16px;">
              <div style="width:32px;height:32px;background:#e8a020;border-radius:8px;flex-shrink:0;text-align:center;line-height:32px;font-weight:800;color:#0f1117;">2</div>
              <div><p style="color:#fff;font-size:14px;font-weight:600;margin:0 0 4px;">Shtoni berberët dhe shërbimet</p><p style="color:#8892a0;font-size:13px;margin:0;">Menaxhoni ekipin dhe çmimet tuaja.</p></div>
            </div>
            <div style="background:#1a1e2e;border-radius:14px;padding:20px;margin-bottom:24px;border:1px solid #1e2330;display:flex;align-items:flex-start;gap:16px;">
              <div style="width:32px;height:32px;background:#e8a020;border-radius:8px;flex-shrink:0;text-align:center;line-height:32px;font-weight:800;color:#0f1117;">3</div>
              <div><p style="color:#fff;font-size:14px;font-weight:600;margin:0 0 4px;">Prisni rezervimet!</p><p style="color:#8892a0;font-size:13px;margin:0;">Klientët do t'ju gjejnë dhe rezervojnë online.</p></div>
            </div>
            ` : `
            <p style="color:#8892a0;font-size:15px;line-height:1.6;margin:0 0 28px;">
              Tani mund të gjeni dhe rezervoni te berberët më të mirë të Kosovës — pa pritje, pa telefonata.
            </p>
            <div style="background:#1a1e2e;border-radius:14px;padding:20px;margin-bottom:24px;border:1px solid #1e2330;">
              <p style="color:#fff;font-size:14px;font-weight:700;margin:0 0 12px;">Çfarë mund të bëni:</p>
              <p style="color:#8892a0;font-size:13px;margin:0 0 8px;">✅ Rezervoni termin në 30 sekonda</p>
              <p style="color:#8892a0;font-size:13px;margin:0 0 8px;">✅ Konfirmoni me OTP të sigurt</p>
              <p style="color:#8892a0;font-size:13px;margin:0 0 8px;">✅ Blini produkte grooming premium</p>
              <p style="color:#8892a0;font-size:13px;margin:0;">✅ Menaxhoni të gjitha terminet tuaja</p>
            </div>
            `}
            <div style="text-align:center;">
              <p style="color:#4a5568;font-size:12px;margin:0;">Nëse keni pyetje, na kontaktoni në <a href="mailto:support@trimkosova.com" style="color:#e8a020;text-decoration:none;">support@trimkosova.com</a></p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px 30px;border-top:1px solid #1e2330;text-align:center;">
            <p style="color:#4a5568;font-size:12px;margin:0;">© ${new Date().getFullYear()} TRIM Kosovo · Platforma e berbertëve premium</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}
