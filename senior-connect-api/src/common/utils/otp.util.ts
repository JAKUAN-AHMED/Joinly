import { randomInt } from 'crypto';

export const generateOtpCode = (): string =>
  randomInt(0, 1_000_000).toString().padStart(6, '0');

export const otpExpiryDate = (): Date => {
  const minutes = Number(process.env.OTP_EXPIRES_IN_MINUTES) || 5;
  return new Date(Date.now() + minutes * 60 * 1000);
};
