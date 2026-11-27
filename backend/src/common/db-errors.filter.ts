import { ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { QueryFailedError } from 'typeorm';

/**
 * Erreurs de base de données causées par ce que la personne a envoyé (identifiant « abc », date « zzz », nombre énorme,
 * texte trop long, caractère nul…) : ce ne sont pas des pannes du serveur. On répond 400 (ou 409 pour un doublon /
 * une fiche encore utilisée) avec un message lisible, au lieu d'un 500 « Internal server error » qui fait croire à un bogue.
 *
 * Toute autre erreur imprévue (base injoignable, verrou, bogue) garde le comportement par défaut de Nest : 500 + journal.
 * Les validations explicites (DTO, ParseIntPipe, BadRequestException…) passent avant et ne sont pas concernées.
 */

type Mapped = { status: number; message: string };

const BAD_INPUT: Record<string, string> = {
  '22P02': 'Valeur invalide : vérifiez les identifiants, nombres et dates envoyés.',
  '22003': 'Valeur numérique trop grande ou trop petite.',
  '22007': 'Date invalide.',
  '22008': 'Date invalide.',
  '22001': 'Texte trop long pour ce champ.',
  '22021': 'Le texte contient un caractère non autorisé.',
  '22P05': 'Le texte contient un caractère non autorisé.',
  '22023': 'Valeur invalide.',
  '23502': 'Un champ obligatoire est manquant.',
  '23514': 'Valeur refusée : elle ne respecte pas les règles de ce champ.',
};

/** Traduit un code d'erreur PostgreSQL en réponse HTTP ; null = erreur du serveur à laisser en 500. */
export function mapDbError(err: any): Mapped | null {
  const code: string | undefined = err?.driverError?.code ?? err?.code;
  if (!code) return null;
  if (BAD_INPUT[code]) return { status: HttpStatus.BAD_REQUEST, message: BAD_INPUT[code] };
  if (code === '23505') return { status: HttpStatus.CONFLICT, message: 'Cet élément existe déjà.' };
  if (code === '23503') {
    const detail = String(err?.driverError?.detail ?? err?.detail ?? '');
    return /is still referenced/i.test(detail)
      ? { status: HttpStatus.CONFLICT, message: 'Impossible : cet élément est encore utilisé ailleurs.' }
      : { status: HttpStatus.BAD_REQUEST, message: 'Référence inconnue : l’élément lié n’existe pas.' };
  }
  return null;
}

@Catch(QueryFailedError, RangeError)
export class DbErrorsFilter extends BaseExceptionFilter {
  private readonly log = new Logger('Requête refusée');

  catch(exception: unknown, host: ArgumentsHost) {
    // new Date('zzz').toISOString() lève « RangeError: Invalid time value » : c'est une date mal saisie.
    const mapped = exception instanceof RangeError
      ? (/invalid time value/i.test(exception.message) ? { status: HttpStatus.BAD_REQUEST, message: 'Date invalide.' } : null)
      : mapDbError(exception);
    if (!mapped) return super.catch(exception, host);

    const http = host.switchToHttp();
    const req = http.getRequest();
    this.log.warn(`${req?.method ?? ''} ${req?.url ?? ''} → ${mapped.status} (${(exception as any)?.driverError?.code ?? (exception as Error)?.name})`);
    http.getResponse().status(mapped.status).json({
      statusCode: mapped.status,
      message: mapped.message,
      error: mapped.status === HttpStatus.CONFLICT ? 'Conflict' : 'Bad Request',
    });
  }
}
