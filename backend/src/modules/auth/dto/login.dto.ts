import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'Mot de passe requis' })
  @MaxLength(128)
  password: string;
}
