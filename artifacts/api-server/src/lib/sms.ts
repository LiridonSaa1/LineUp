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

export async function sendVerificationSms(to: string): Promise<boolean> {
  if (!client || !TWILIO_VERIFY_SERVICE_SID) {
    logger.warn("Twilio Verify not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_VERIFY_SERVICE_SID missing) — SMS OTP skipped");
    return false;
  }
  try {
    await client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID).verifications.create({
      to,
      channel: "sms",
    });
    logger.info({ to }, "OTP verification SMS sent via Twilio Verify");
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
  try {
    const check = await client.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to, code });
    return check.status === "approved";
  } catch (err) {
    logger.error({ err }, "Twilio Verify check failed");
    return false;
  }
}
