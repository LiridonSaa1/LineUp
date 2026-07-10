import twilio from "twilio";
import { logger } from "./logger";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const client =
  TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
    ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    : null;

export function isSmsConfigured(): boolean {
  return Boolean(client && TWILIO_PHONE_NUMBER);
}

export async function sendOtpSms(to: string, otpCode: string): Promise<boolean> {
  if (!client || !TWILIO_PHONE_NUMBER) {
    logger.warn("Twilio not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER missing) — SMS OTP skipped");
    return false;
  }
  try {
    await client.messages.create({
      from: TWILIO_PHONE_NUMBER,
      to,
      body: `LineUP: Kodi juaj i verifikimit është ${otpCode}. Skadon pas 15 minutave.`,
    });
    logger.info({ to }, "OTP SMS sent via Twilio");
    return true;
  } catch (err) {
    logger.error({ err }, "Twilio SMS send failed");
    return false;
  }
}
