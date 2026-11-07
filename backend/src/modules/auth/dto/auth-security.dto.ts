import { IsEmail, IsOptional, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class LoginWithOtpDto {
  @IsEmail({}, { message: 'Email invalide' }) email: string;
  @IsString() @MinLength(1, { message: 'Mot de passe requis' }) @MaxLength(128) password: string;
  /** Code à 6 chiffres de l'application d'authentification (si la double authentification est activée). */
  @IsOptional() @IsString() @MaxLength(10) otp?: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Email invalide' }) email: string;
}

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Email invalide' }) email: string;
  @IsString() @MinLength(20) @MaxLength(200) token: string;
  @IsString() @MinLength(8) @MaxLength(128) newPassword: string;
}

export class TwoFactorCodeDto {
  @IsString() @Length(6, 8) code: string;
}

export class TwoFactorDisableDto {
  @IsString() @MaxLength(128) password: string;
  @IsString() @Length(6, 8) code: string;
}
