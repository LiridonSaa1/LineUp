import { Router, type IRouter } from "express";
import { promises as dns } from "dns";

const router: IRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com","guerrillamail.com","throwam.com","trashmail.com",
  "tempmail.com","10minutemail.com","yopmail.com","sharklasers.com",
  "guerrillamailblock.com","grr.la","guerrillamail.info","spam4.me",
  "maildrop.cc","dispostable.com","fakeinbox.com","mailnull.com",
  "spamgourmet.com","trashmail.at","trashmail.me","discard.email",
  "mailsac.com","getnada.com","mohmal.com","temp-mail.org","tempr.email",
]);

async function verifyViaDns(email: string): Promise<{ valid: boolean; reason?: string }> {
  const domain = email.split("@")[1].toLowerCase();

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, reason: "Disposable email addresses are not allowed" };
  }

  try {
    const mx = await dns.resolveMx(domain);
    if (!mx || mx.length === 0) {
      return { valid: false, reason: "Email domain has no mail server" };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: "Email domain does not exist" };
  }
}

async function verifyViaAbstract(email: string, apiKey: string): Promise<{ valid: boolean; reason?: string }> {
  const url = `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });

  if (!res.ok) throw new Error(`Abstract API error: ${res.status}`);

  const data = (await res.json()) as {
    deliverability: string;
    is_valid_format: { value: boolean };
    is_disposable_email: { value: boolean };
    is_mx_found: { value: boolean };
    is_smtp_valid: { value: boolean };
  };

  if (!data.is_valid_format?.value) {
    return { valid: false, reason: "Invalid email format" };
  }
  if (data.is_disposable_email?.value) {
    return { valid: false, reason: "Disposable email addresses are not allowed" };
  }
  if (!data.is_mx_found?.value) {
    return { valid: false, reason: "Email domain has no mail server" };
  }
  if (data.deliverability === "UNDELIVERABLE") {
    return { valid: false, reason: "Email address does not exist" };
  }

  return { valid: true };
}

router.post("/verify-email", async (req, res) => {
  const { email } = req.body as { email?: string };

  if (!email || typeof email !== "string") {
    return res.status(400).json({ valid: false, reason: "Email is required" });
  }

  const trimmed = email.trim().toLowerCase();

  if (!EMAIL_RE.test(trimmed)) {
    return res.status(200).json({ valid: false, reason: "Invalid email format" });
  }

  const apiKey = process.env.EMAIL_VERIFY_API_KEY;

  try {
    const result = apiKey
      ? await verifyViaAbstract(trimmed, apiKey)
      : await verifyViaDns(trimmed);

    return res.status(200).json(result);
  } catch (err: any) {
    req.log?.warn({ err }, "Email verification service unavailable");
    return res.status(503).json({
      valid: false,
      reason: "We couldn't verify your email at the moment. Please try again later.",
      serviceDown: true,
    });
  }
});

export default router;
