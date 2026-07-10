import twilio from "twilio";
import { logger } from "./logger";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const client =
  TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
    ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    : null;

export async function sendOtpSms(opts: { to: string; otp: string; shopName: string }): Promise<boolean> {
  if (!client || !TWILIO_PHONE_NUMBER) {
    logger.warn("Twilio not configured — SMS skipped");
    return false;
  }
  try {
    await client.messages.create({
      to: opts.to,
      from: TWILIO_PHONE_NUMBER,
      body: `LineUP: Kodi juaj OTP per rezervimin ne ${opts.shopName} eshte ${opts.otp}. Skadon pas 15 minutash.`,
    });
    logger.info({ to: opts.to }, "OTP SMS sent via Twilio");
    return true;
  } catch (err) {
    logger.error({ err }, "Twilio SMS send failed");
    return false;
  }
}
