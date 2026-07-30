const TWILIO_ACCOUNT_SID = process.env.EXPO_PUBLIC_TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.EXPO_PUBLIC_TWILIO_AUTH_TOKEN || "";
const TWILIO_VERIFY_SERVICE_SID = process.env.EXPO_PUBLIC_TWILIO_VERIFY_SERVICE_SID || "";

const base64Auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

export const sendTwilioOTP = async (phoneNumber: string) => {
  try {
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/\D/g, '')}`;

    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${base64Auth}`,
        },
        body: new URLSearchParams({
          To: formattedPhone,
          Channel: 'sms',
        }).toString(),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Dështoi dërgimi i SMS.');
    }
    return data;
  } catch (error) {
    console.error('Twilio Send OTP Error:', error);
    throw error;
  }
};

export const verifyTwilioOTP = async (phoneNumber: string, code: string) => {
  try {
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/\D/g, '')}`;

    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${base64Auth}`,
        },
        body: new URLSearchParams({
          To: formattedPhone,
          Code: code,
        }).toString(),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Kodi i verifikimit është i pasaktë.');
    }

    if (data.status !== 'approved') {
      throw new Error('Kodi i verifikimit nuk është i vlefshëm.');
    }

    return data;
  } catch (error) {
    console.error('Twilio Verify OTP Error:', error);
    throw error;
  }
};
