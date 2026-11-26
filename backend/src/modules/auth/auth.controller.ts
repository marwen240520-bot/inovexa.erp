import { Body, Controller, Get, HttpCode, Post, Req, Request, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ForgotPasswordDto, LoginWithOtpDto, ResetPasswordDto, TwoFactorCodeDto, TwoFactorDisableDto } from './dto/auth-security.dto';
import { AppleAuthDto, GoogleAuthDto, RegisterDto, VerifyEmailCodeDto, VerifyEmailDto } from './dto/register.dto';

const actor = (req: any): number => req.user.actorId ?? req.user.userId;
const ipOf = (req: any): string => (req.ip || '').toString();
/** Liste de champs fermée : tout champ inconnu (role, modules, subscriptionEnd…) fait échouer la requête. */
const STRICT = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });

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

  @Post('register')
  @HttpCode(201)
  @Throttle({ default: { limit: 20, ttl: 600_000 } })
  @UsePipes(STRICT)
  @ApiOperation({ summary: 'Crée une société et son propriétaire : l’essai gratuit démarre, un code de vérification part par email' })
  register(@Body() body: RegisterDto, @Req() req: any) {
    return this.authService.register(body, ipOf(req));
  }

  @Post('google')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UsePipes(STRICT)
  @ApiOperation({ summary: 'Connexion ou inscription avec Google (jeton d’identité vérifié côté serveur)' })
  google(@Body() body: GoogleAuthDto, @Req() req: any) {
    return this.authService.google(body, ipOf(req));
  }

  @Post('apple')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UsePipes(STRICT)
  @ApiOperation({ summary: 'Connexion ou inscription avec Apple (jeton d’identité vérifié côté serveur)' })
  apple(@Body() body: AppleAuthDto, @Req() req: any) {
    return this.authService.apple(body, ipOf(req));
  }

  @Post('verify-email')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UsePipes(STRICT)
  @ApiOperation({ summary: 'Confirme l’adresse email avec un ancien lien de confirmation (les nouveaux comptes reçoivent un code)' })
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.email, body.token);
  }

  @Post('verify-email-code')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 20, ttl: 600_000 } })
  @UsePipes(STRICT)
  @ApiOperation({ summary: 'Confirme l’adresse email avec le code à 6 chiffres reçu par email (5 essais par code)' })
  verifyEmailCode(@Request() req: any, @Body() body: VerifyEmailCodeDto) {
    return this.authService.verifyEmailCode(actor(req), body.code);
  }

  @Post('resend-verification')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 600_000 } })
  @ApiOperation({ summary: 'Envoie un nouveau code de vérification (un envoi par minute)' })
  resendVerification(@Request() req: any) {
    return this.authService.resendVerification(actor(req));
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
