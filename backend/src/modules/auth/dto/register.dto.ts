import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * Inscription d'une société. La liste des champs est fermée (ValidationPipe whitelist + forbidNonWhitelisted dans le
 * contrôleur) : envoyer « role », « modules » ou « subscriptionEnd » est refusé avant même d'atteindre le service.
 */
export class RegisterDto {
  @IsString() @MinLength(2, { message: 'Indiquez votre nom complet.' }) @MaxLength(120) name: string;
  @IsString() @MinLength(2, { message: 'Indiquez le nom de votre société.' }) @MaxLength(160) companyName: string;
  @IsEmail({}, { message: 'Email invalide' }) @MaxLength(190) email: string;
  @IsString() @MinLength(8, { message: 'Numéro de téléphone requis.' }) @MaxLength(30) phone: string;
  @IsString() @MinLength(8) @MaxLength(128) password: string;
  /** Code du secteur d'activité (GET /public/sectors). */
  @IsString() @MinLength(2) @MaxLength(40) sector: string;
  @IsBoolean({ message: 'Vous devez accepter les conditions d’utilisation.' }) acceptTerms: boolean;

  // Informations facultatives sur la société (complétables ensuite dans Paramètres › Société & fiscalité).
  @IsOptional() @IsString() @MaxLength(80) city?: string;
  @IsOptional() @IsString() @MaxLength(300) address?: string;
  @IsOptional() @IsString() @MaxLength(60) legalForm?: string;
  @IsOptional() @IsString() @MaxLength(40) taxId?: string;
  /** Pays de la société (code ISO 3166-1 alpha-2 : FR, MA, TN…). Défaut : TN. */
  @IsOptional() @IsString() @Length(2, 2) countryCode?: string;
  /** Devise des comptes (code ISO 4217 : EUR, USD, MAD…). Défaut : celle du pays ; toujours TND pour une société tunisienne. */
  @IsOptional() @IsString() @Length(3, 3) currency?: string;
  /** Langue de l'écran d'inscription : celle des emails du compte (code de vérification, mot de passe oublié…). */
  @IsOptional() @IsString() @MaxLength(10) language?: string;
}

export class GoogleAuthDto {
  /** Jeton d'identité remis par Google au navigateur (JWT). */
  @IsString() @MinLength(20) @MaxLength(4096) credential: string;
  /** login = se connecter ; register = créer la société si aucun compte n'existe pour cette adresse. */
  @IsOptional() @IsIn(['login', 'register']) intent?: 'login' | 'register';
  @IsOptional() @IsString() @MaxLength(160) companyName?: string;
  @IsOptional() @IsString() @MaxLength(40) sector?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsString() @Length(2, 2) countryCode?: string;
  @IsOptional() @IsString() @Length(3, 3) currency?: string;
  @IsOptional() @IsBoolean() acceptTerms?: boolean;
  @IsOptional() @IsString() @MaxLength(10) otp?: string;
  @IsOptional() @IsString() @MaxLength(10) language?: string;
}

export class AppleAuthDto {
  /** Jeton d'identité remis par Apple au navigateur (JWT « id_token »). */
  @IsString() @MinLength(20) @MaxLength(4096) identityToken: string;
  /** login = se connecter ; register = créer la société si aucun compte n'existe pour cet identifiant. */
  @IsOptional() @IsIn(['login', 'register']) intent?: 'login' | 'register';
  /** Nom communiqué par Apple au navigateur à la première autorisation (absent ensuite) : affichage seulement. */
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(160) companyName?: string;
  @IsOptional() @IsString() @MaxLength(40) sector?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsString() @Length(2, 2) countryCode?: string;
  @IsOptional() @IsString() @Length(3, 3) currency?: string;
  @IsOptional() @IsBoolean() acceptTerms?: boolean;
  @IsOptional() @IsString() @MaxLength(10) otp?: string;
  @IsOptional() @IsString() @MaxLength(10) language?: string;
}

export class VerifyEmailDto {
  @IsEmail({}, { message: 'Email invalide' }) email: string;
  @IsString() @MinLength(20) @MaxLength(200) token: string;
}

export class VerifyEmailCodeDto {
  /** Code à 6 chiffres reçu par email. */
  @IsString() @Matches(/^\d{6}$/, { message: 'Le code comporte 6 chiffres.' }) code: string;
}

/** Corrige l'adresse email (faute de frappe à l'inscription) : le mot de passe confirme que c'est bien le titulaire. */
export class ChangeEmailDto {
  @IsEmail({}, { message: 'Email invalide' }) @MaxLength(190) email: string;
  @IsString() @MinLength(1, { message: 'Mot de passe requis' }) @MaxLength(128) password: string;
  @IsOptional() @IsString() @MaxLength(10) language?: string;
}

/** Renvoi d'un code : la langue de l'écran peut être précisée. */
export class ResendVerificationDto {
  @IsOptional() @IsString() @MaxLength(10) language?: string;
}
