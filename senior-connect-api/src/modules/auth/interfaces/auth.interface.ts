import { UserProfile } from '../../users/interfaces/users.interface';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: UserProfile;
}

export interface RegisterResponse {
  email: string;
  otpSent: boolean;
}
