import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { MoreThan, Repository } from 'typeorm';
import { OtpType, UserRole, UserStatus } from '../../common/enums';
import {
  AuthenticatedUser,
  JwtPayload,
  ServiceResponse,
} from '../../common/interfaces/api-response.interface';
import { MailService } from '../../common/services/mail.service';
import { generateOtpCode, otpExpiryDate } from '../../common/utils/otp.util';
import { UserProfile } from '../users/interfaces/users.interface';
import { User } from '../users/entities';
import { AuthResponse, AuthTokens, RegisterResponse } from './interfaces/auth.interface';
import { Otp } from './entities';
import {
  AdminLoginDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResendOtpDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from './dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  /** Figma "Create Account" */
  async register(dto: RegisterDto): Promise<ServiceResponse<RegisterResponse>> {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });

    // Only a fully verified account blocks re-registration. An email that was
    // registered but never verified can be re-submitted any number of times —
    // we refresh its details and send a fresh OTP each time.
    if (existing && existing.isEmailVerified) {
      throw new ConflictException('An account with this email already exists');
    }

    const user =
      existing ??
      this.userRepository.create({
        email: dto.email,
      });

    user.firstName = dto.firstName;
    user.lastName = dto.lastName;
    user.password = await bcrypt.hash(dto.password, 10);
    user.phoneNumber = dto.phoneNumber ?? null;
    user.dateOfBirth = dto.dateOfBirth ?? null;
    user.language = dto.language ?? user.language ?? 'English (United States)';
    user.status = UserStatus.Pending;
    user.isEmailVerified = false;
    await this.userRepository.save(user);
    await this.issueOtp(dto.email, OtpType.VerifyEmail);

    return {
      message: "We've sent a verification code to your email.",
      data: { email: dto.email, otpSent: true },
    };
  }

  /** Figma "OTP verification" */
  async verifyOtp(dto: VerifyOtpDto): Promise<ServiceResponse<AuthResponse | { verified: boolean }>> {
    const type = dto.type ?? OtpType.VerifyEmail;
    await this.consumeOtp(dto.email, dto.otpCode, type);

    if (type === OtpType.ResetPassword) {
      return { message: 'OTP verified successfully', data: { verified: true } };
    }

    const user = await this.getUserByEmail(dto.email, true);
    user.isEmailVerified = true;
    if (user.status === UserStatus.Pending) user.status = UserStatus.Active;
    const tokens = await this.issueTokens(user);
    await this.userRepository.save(user);

    return {
      message: 'Account verified successfully',
      data: { ...tokens, user: this.toProfile(user) },
    };
  }

  /** "Didn't get the code?" */
  async resendOtp(dto: ResendOtpDto): Promise<ServiceResponse<RegisterResponse>> {
    await this.getUserByEmail(dto.email);
    const type = dto.type ?? OtpType.VerifyEmail;

    const lastOtp = await this.otpRepository.findOne({
      where: { email: dto.email, type },
      order: { createdAt: 'DESC' },
    });
    if (lastOtp && Date.now() - lastOtp.createdAt.getTime() < 60_000) {
      throw new BadRequestException('Please wait a minute before requesting a new code');
    }
    await this.issueOtp(dto.email, type);
    return {
      message: "We've sent a verification code to your email.",
      data: { email: dto.email, otpSent: true },
    };
  }

  /** Figma "Welcome Back" — mobile sign in */
  async login(dto: LoginDto): Promise<ServiceResponse<AuthResponse>> {
    const user = await this.validateCredentials(dto.email, dto.password);
    const tokens = await this.issueTokens(user);
    await this.userRepository.save(user);
    return {
      message: 'Signed in successfully',
      data: { ...tokens, user: this.toProfile(user) },
    };
  }

  /** Figma "Admin Login" */
  async adminLogin(dto: AdminLoginDto): Promise<ServiceResponse<AuthResponse>> {
    const user = await this.validateCredentials(dto.email, dto.password);
    if (user.role !== UserRole.Admin) {
      throw new ForbiddenException('This account does not have admin access');
    }
    const tokens = await this.issueTokens(user, dto.rememberMe ? '90d' : undefined);
    await this.userRepository.save(user);
    return {
      message: 'Admin signed in successfully',
      data: { ...tokens, user: this.toProfile(user) },
    };
  }

  /** Figma "Forget password?" */
  async forgotPassword(dto: ForgotPasswordDto): Promise<ServiceResponse<RegisterResponse>> {
    await this.getUserByEmail(dto.email);
    await this.issueOtp(dto.email, OtpType.ResetPassword);
    return {
      message: "We've sent a verification code to your email.",
      data: { email: dto.email, otpSent: true },
    };
  }

  /** Figma "Reset Password" */
  async resetPassword(dto: ResetPasswordDto): Promise<ServiceResponse<null>> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('newPassword and confirmPassword do not match');
    }
    await this.consumeOtp(dto.email, dto.otpCode, OtpType.ResetPassword);
    const user = await this.getUserByEmail(dto.email, true);
    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.refreshToken = null;
    await this.userRepository.save(user);
    return { message: 'Your password has been changed successfully', data: null };
  }

  /** Figma "Change Password" */
  async changePassword(
    currentUser: AuthenticatedUser,
    dto: ChangePasswordDto,
  ): Promise<ServiceResponse<null>> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('newPassword and confirmPassword do not match');
    }
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: currentUser.userId })
      .getOne();
    if (!user) throw new UnauthorizedException('User not found');
    if (!(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw new BadRequestException('Current Password is incorrect');
    }
    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.save(user);
    return { message: 'Your password has been changed successfully', data: null };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<ServiceResponse<AuthTokens>> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh-secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshToken')
      .where('user.id = :id', { id: payload.sub })
      .getOne();
    if (!user || !user.refreshToken || !(await bcrypt.compare(dto.refreshToken, user.refreshToken))) {
      throw new UnauthorizedException('Refresh token is no longer valid');
    }
    const tokens = await this.issueTokens(user);
    await this.userRepository.save(user);
    return { message: 'Token refreshed successfully', data: tokens };
  }

  async logout(currentUser: AuthenticatedUser): Promise<ServiceResponse<null>> {
    await this.userRepository.update(currentUser.userId, { refreshToken: null });
    return { message: 'Logged out successfully', data: null };
  }

  // ---------- helpers ----------

  private async validateCredentials(email: string, password: string): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.status === UserStatus.Blocked || user.status === UserStatus.Suspended) {
      throw new ForbiddenException(`Your account is ${user.status.toLowerCase()}`);
    }
    if (!user.isEmailVerified && user.role !== UserRole.Admin) {
      throw new ForbiddenException('Please verify your email first');
    }
    return user;
  }

  private async getUserByEmail(email: string, selectPassword = false): Promise<User> {
    const qb = this.userRepository.createQueryBuilder('user').where('user.email = :email', { email });
    if (selectPassword) qb.addSelect('user.password');
    const user = await qb.getOne();
    if (!user) throw new BadRequestException('No account found with this email');
    return user;
  }

  private async issueOtp(email: string, type: OtpType): Promise<void> {
    const otpCode = generateOtpCode();
    await this.otpRepository.save(
      this.otpRepository.create({ email, otpCode, type, expiresAt: otpExpiryDate() }),
    );
    await this.mailService.sendOtpEmail(
      email,
      otpCode,
      type === OtpType.VerifyEmail ? 'OTP verification' : 'Reset Password',
    );
  }

  private async consumeOtp(email: string, otpCode: string, type: OtpType): Promise<void> {
    const otp = await this.otpRepository.findOne({
      where: { email, otpCode, type, isUsed: false, expiresAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
    });
    if (!otp) throw new BadRequestException('Invalid or expired verification code');
    otp.isUsed = true;
    await this.otpRepository.save(otp);
  }

  private async issueTokens(user: User, refreshExpiry?: string): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh-secret',
      expiresIn: refreshExpiry || process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    });
    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    return { accessToken, refreshToken };
  }

  private toProfile(user: User): UserProfile {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      dateOfBirth: user.dateOfBirth,
      language: user.language,
      profilePhoto: user.profilePhoto,
      country: user.country,
      region: user.region,
      city: user.city,
      latitude: user.latitude,
      longitude: user.longitude,
      role: user.role,
      status: user.status,
      dateFormat: user.dateFormat,
      notificationSounds: user.notificationSounds,
      allowNotifications: user.allowNotifications,
      isEmailVerified: user.isEmailVerified,
      memberSince: user.createdAt,
    };
  }
}
