import { IsEmail, IsOptional, MaxLength } from 'class-validator';
import { Text, Trim } from '../../common/dto';

/** Message du formulaire « Écrivez-nous » du site public (page Contact). */
export class ContactMessageDto {
  @Text({ label: 'Prénom', required: true, max: 80 }) firstName: string;
  @Text({ label: 'Nom', required: true, max: 80 }) lastName: string;
  @Text({ label: 'Société', required: true, max: 160 }) company: string;
  @Trim() @IsEmail({}, { message: 'Adresse email invalide.' }) @MaxLength(160, { message: 'Adresse email : 160 caractères au maximum.' }) email: string;
  @IsOptional() @Text({ label: 'Téléphone', max: 40 }) phone?: string;
  @IsOptional() @Text({ label: 'Taille de l’entreprise', max: 80 }) size?: string;
  @IsOptional() @Text({ label: 'Message', max: 4_000 }) message?: string;
  @IsOptional() @Text({ label: 'Langue', max: 10 }) language?: string;
  /** Champ piège : invisible pour une personne, rempli par les robots (le message est alors ignoré sans erreur). */
  @IsOptional() @Text({ label: 'Site', max: 200 }) website?: string;
}
