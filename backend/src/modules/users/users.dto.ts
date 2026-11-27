import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Text } from '../../common/dto';

/**
 * Modification de son propre profil. Seuls ces champs sont lus ; le rôle, les modules, l'abonnement et le mot de passe
 * ne passent jamais par ici. Le nom doit être du texte (un objet s'enregistrait avant comme « [object Object] »).
 */
export class UpdateProfileDto {
  @IsOptional() @Text({ label: 'Nom', required: true, max: 120 }) name?: string;
  @IsOptional() @IsString({ message: 'Adresse email : texte attendu.' }) @MaxLength(160, { message: 'Adresse email : 160 caractères au maximum.' }) email?: string;
  @IsOptional() @Text({ label: 'Téléphone', max: 40 }) phone?: string;
  @IsOptional() @Text({ label: 'Société', max: 160 }) companyName?: string;
  /** Mot de passe actuel : exigé pour changer d'adresse email. */
  @IsOptional() @IsString({ message: 'Mot de passe : texte attendu.' }) @MaxLength(128, { message: 'Mot de passe : 128 caractères au maximum.' }) currentPassword?: string;
  @IsOptional() @IsString({ message: 'Langue : texte attendu.' }) @MaxLength(10, { message: 'Langue : 10 caractères au maximum.' }) language?: string;
}
