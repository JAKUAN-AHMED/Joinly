export const AUTH_ROUTES = {
  ROOT: 'auth',
  REGISTER: 'register',
  VERIFY_OTP: 'verify-otp',
  RESEND_OTP: 'resend-otp',
  LOGIN: 'login',
  FORGOT_PASSWORD: 'forgot-password',
  RESET_PASSWORD: 'reset-password',
  CHANGE_PASSWORD: 'change-password',
  REFRESH_TOKEN: 'refresh-token',
  LOGOUT: 'logout',
  ADMIN_LOGIN: 'admin/login',
} as const;
