import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthenticatedUser } from '../../common/interfaces/api-response.interface';
import { AuthService } from './auth.service';
import { AUTH_ROUTES } from './auth.routes';
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

@Controller(AUTH_ROUTES.ROOT)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Create Account */
  @Public()
  @Post(AUTH_ROUTES.REGISTER)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /** OTP verification */
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post(AUTH_ROUTES.VERIFY_OTP)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  /** Didn't get the code? */
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post(AUTH_ROUTES.RESEND_OTP)
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }

  /** Welcome Back — Sign in */
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post(AUTH_ROUTES.LOGIN)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /** Admin Login */
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post(AUTH_ROUTES.ADMIN_LOGIN)
  adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto);
  }

  /** Forget password? */
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post(AUTH_ROUTES.FORGOT_PASSWORD)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  /** Reset Password */
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post(AUTH_ROUTES.RESET_PASSWORD)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  /** Change Password (authenticated) */
  @HttpCode(HttpStatus.OK)
  @Post(AUTH_ROUTES.CHANGE_PASSWORD)
  changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user, dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post(AUTH_ROUTES.REFRESH_TOKEN)
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post(AUTH_ROUTES.LOGOUT)
  logout(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.logout(user);
  }
}
