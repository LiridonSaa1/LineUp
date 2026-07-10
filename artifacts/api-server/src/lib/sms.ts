import twilio from "twilio";
import { logger } from "./logger";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

const client =
  TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
    ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    : null;

export function isSmsConfigured(): boolean {
  return Boolean(client && TWILIO_VERIFY_SERVICE_SID);
}

/**
 * Converts a Kosovo local phone number to E.164 format required by Twilio.
 * Examples:
 *   045370650  → +38345370650
 *   044123456  → +38344123456
 *   +38345...  → unchanged (already E.164)
 */
function toE164(phone: string): string {
  const p = phone.trim().replace(/\s+/g, "");
  if (p.startsWith("+")) return p;
  if (p.startsWith("00")) return "+" + p.slice(2);
  // Kosovo local: 04xxxxxxx → +38304xxxxxxx  (remove leading 0, prepend +383)
  if (p.startsWith("0")) return "+383" + p.slice(1);
  return p;
}

export async function sendVerificationSms(to: string): Promise<boolean> {
  if (!client || !TWILIO_VERIFY_SERVICE_SID) {
    logger.warn("Twilio Verify not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_VERIFY_SERVICE_SID missing) — SMS OTP skipped");
    return false;
  }
  const e164 = toE164(to);
  try {
    await client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID).verifications.create({
      to: e164,
      channel: "sms",
    });
    logger.info({ to: e164 }, "OTP verification SMS sent via Twilio Verify");
    return true;
  } catch (err) {
    logger.error({ err }, "Twilio Verify send failed");
    return false;
  }
}

export async function checkVerificationSms(to: string, code: string): Promise<boolean> {
  if (!client || !TWILIO_VERIFY_SERVICE_SID) {
    logger.warn("Twilio Verify not configured — SMS OTP check skipped");
    return false;
  }
  const e164 = toE164(to);
  try {
    const check = await client.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: e164, code });
    return check.status === "approved";
  } catch (err) {
    logger.error({ err }, "Twilio Verify check failed");
    return false;
  }
}
