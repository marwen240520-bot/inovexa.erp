import { Body, Controller, Get, HttpCode, Post, Req, Request, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ForgotPasswordDto, LoginWithOtpDto, ResetPasswordDto, TwoFactorCodeDto, TwoFactorDisableDto } from './dto/auth-security.dto';

const actor = (req: any): number => req.user.actorId ?? req.user.userId;

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Connexion (code à 6 chiffres requis si la double authentification est activée)' })
  async login(@Body() body: LoginWithOtpDto, @Req() req: any) {
    return this.authService.login(body.email, body.password, body.otp, (req.ip || '').toString());
  }

  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Envoie un lien de réinitialisation par email (réponse identique que le compte existe ou non)' })
  forgot(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Choisit un nouveau mot de passe avec le lien reçu par email' })
  reset(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.email, body.token, body.newPassword);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil de la personne connectée et ses droits' })
  me(@Request() req: any) {
    return this.authService.me(actor(req));
  }

  @Post('logout-all')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Déconnecte toutes les sessions ouvertes de cette personne' })
  logoutAll(@Request() req: any) {
    return this.authService.logoutEverywhere(actor(req));
  }

  @Post('2fa/setup')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Démarre la double authentification : clé secrète et QR code à scanner' })
  setup2fa(@Request() req: any) {
    return this.authService.twoFactorSetup(actor(req));
  }

  @Post('2fa/enable')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  enable2fa(@Request() req: any, @Body() body: TwoFactorCodeDto) {
    return this.authService.twoFactorEnable(actor(req), body.code);
  }

  @Post('2fa/disable')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  disable2fa(@Request() req: any, @Body() body: TwoFactorDisableDto) {
    return this.authService.twoFactorDisable(actor(req), body.password, body.code);
  }
}
