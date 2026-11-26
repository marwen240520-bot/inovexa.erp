import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Appointment, APPOINTMENT_STATUSES } from './entities/appointment.entity';

const DAY = 24 * 3_600_000;
/** États qui occupent réellement le créneau (un rendez-vous annulé ou manqué libère la ressource). */
const BUSY = ['scheduled', 'confirmed', 'done'];

const text = (v: unknown, max: number): string | null => {
  const s = String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim();
  return s ? s.slice(0, max) : null;
};

/**
 * Agenda de la société : rendez-vous, réservations, séances.
 * Toutes les lectures et écritures sont filtrées sur `userId` (la société de la personne connectée).
 */
@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment) private readonly repo: Repository<Appointment>,
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  private date(value: unknown, label: string): Date {
    const d = new Date(String(value ?? ''));
    if (!value || Number.isNaN(d.getTime())) throw new BadRequestException(`${label} invalide.`);
    return d;
  }

  /** Nettoie et vérifie les champs reçus du navigateur (liste fermée : rien d'autre n'est enregistré). */
  private async clean(userId: number, body: any, current?: Appointment): Promise<Partial<Appointment>> {
    const out: Partial<Appointment> = {};
    const has = (k: string) => body && Object.prototype.hasOwnProperty.call(body, k);

    if (!current || has('title')) {
      const title = text(body?.title, 160);
      if (!title || title.length < 2) throw new BadRequestException('Indiquez l’objet du rendez-vous.');
      out.title = title;
    }
    if (!current || has('startAt')) out.startAt = this.date(body?.startAt, 'Date de début');
    const start = out.startAt ?? current!.startAt;
    if (!current || has('endAt') || has('durationMinutes') || has('startAt')) {
      if (has('endAt') && body.endAt) out.endAt = this.date(body.endAt, 'Date de fin');
      else {
        // Durée donnée, ou durée actuelle conservée quand seul le début change (30 minutes pour une création).
        const kept = current ? Math.round((new Date(current.endAt).getTime() - new Date(current.startAt).getTime()) / 60_000) : 30;
        const minutes = has('durationMinutes') ? Number(body.durationMinutes) : kept;
        if (!Number.isFinite(minutes) || minutes < 5 || minutes > 24 * 60) throw new BadRequestException('Durée invalide (5 minutes à 24 heures).');
        out.endAt = new Date(new Date(start).getTime() + Math.round(minutes) * 60_000);
      }
    }
    const end = out.endAt ?? current!.endAt;
    if (new Date(end).getTime() <= new Date(start).getTime()) throw new BadRequestException('La fin doit être après le début.');
    if (new Date(end).getTime() - new Date(start).getTime() > 7 * DAY) throw new BadRequestException('Un rendez-vous ne peut pas durer plus de 7 jours.');

    if (has('clientId')) {
      const id = Number(body.clientId);
      if (!id) out.clientId = null;
      else {
        const [client] = await this.ds.query(`SELECT "id", "name", "phone" FROM "clients" WHERE "id" = $1 AND "userId" = $2`, [id, userId]);
        if (!client) throw new BadRequestException('Client introuvable.');
        out.clientId = client.id;
        if (!text(body.clientName, 160)) out.clientName = text(client.name, 160);
        if (!text(body.clientPhone, 40) && !current?.clientPhone) out.clientPhone = text(client.phone, 40);
      }
    }
    if (has('clientName') && text(body.clientName, 160)) out.clientName = text(body.clientName, 160);
    else if (has('clientName') && !out.clientName) out.clientName = null;
    if (has('clientPhone')) out.clientPhone = text(body.clientPhone, 40) ?? out.clientPhone ?? null;
    if (has('service')) out.service = text(body.service, 160);
    if (has('resource')) out.resource = text(body.resource, 120);
    if (has('notes')) out.notes = text(body.notes, 2000);
    if (has('status')) {
      if (!(APPOINTMENT_STATUSES as readonly string[]).includes(String(body.status))) throw new BadRequestException('État invalide.');
      out.status = String(body.status);
    }
    if (has('partySize')) {
      const n = body.partySize === null || body.partySize === '' ? null : Number(body.partySize);
      if (n !== null && (!Number.isInteger(n) || n < 1 || n > 10_000)) throw new BadRequestException('Nombre de personnes invalide.');
      out.partySize = n;
    }
    if (has('price')) {
      const n = body.price === null || body.price === '' ? null : Number(body.price);
      if (n !== null && (!Number.isFinite(n) || n < 0 || n > 1_000_000_000)) throw new BadRequestException('Montant invalide.');
      out.price = n === null ? null : Math.round(n * 1000) / 1000;
    }
    return out;
  }

  /** Rendez-vous qui occupe déjà la même ressource sur le créneau demandé (null = créneau libre). */
  private async overlap(userId: number, resource: string | null | undefined, start: Date, end: Date, exceptId?: number): Promise<Appointment | null> {
    if (!resource) return null;
    const qb = this.repo.createQueryBuilder('a')
      .where('a.userId = :userId AND LOWER(a.resource) = LOWER(:resource) AND a.status IN (:...busy) AND a.startAt < :end AND a.endAt > :start', { userId, resource, busy: BUSY, start, end });
    if (exceptId) qb.andWhere('a.id <> :exceptId', { exceptId });
    return qb.orderBy('a.startAt', 'ASC').getOne();
  }

  private async assertFree(userId: number, a: Pick<Appointment, 'resource' | 'startAt' | 'endAt' | 'status'>, allowOverlap: boolean, exceptId?: number) {
    if (allowOverlap || !BUSY.includes(a.status)) return;
    const taken = await this.overlap(userId, a.resource, a.startAt, a.endAt, exceptId);
    if (taken) {
      throw new ConflictException({
        statusCode: 409, error: 'Conflict', code: 'SLOT_TAKEN', conflictId: taken.id,
        message: `« ${a.resource} » est déjà pris sur ce créneau (${taken.title}).`,
      });
    }
  }

  /** Liste sur une période (par défaut : de 7 jours avant à 60 jours après aujourd'hui), triée par date. */
  async findAll(userId: number, q: { from?: string; to?: string; status?: string; resource?: string; q?: string }) {
    const now = Date.now();
    const from = q.from ? this.date(q.from, 'Date de début') : new Date(now - 7 * DAY);
    const to = q.to ? this.date(q.to, 'Date de fin') : new Date(now + 60 * DAY);
    if (to.getTime() < from.getTime()) throw new BadRequestException('Période invalide.');
    if (q.to && /^\d{4}-\d{2}-\d{2}$/.test(q.to)) to.setUTCHours(23, 59, 59, 999);
    const qb = this.repo.createQueryBuilder('a').where('a.userId = :userId AND a.startAt <= :to AND a.endAt >= :from', { userId, from, to });
    if (q.status) qb.andWhere('a.status = :status', { status: String(q.status) });
    if (q.resource) qb.andWhere('LOWER(a.resource) = LOWER(:resource)', { resource: String(q.resource) });
    if (q.q) qb.andWhere(`(LOWER(a.title) LIKE :s OR LOWER(COALESCE(a.clientName, '')) LIKE :s OR COALESCE(a.clientPhone, '') LIKE :s OR LOWER(COALESCE(a.service, '')) LIKE :s)`, { s: `%${String(q.q).trim().toLowerCase()}%` });
    return qb.orderBy('a.startAt', 'ASC').addOrderBy('a.id', 'ASC').take(2000).getMany();
  }

  async findOne(id: number, userId: number) {
    const row = Number.isInteger(id) ? await this.repo.findOne({ where: { id, userId } }) : null;
    if (!row) throw new NotFoundException('Rendez-vous introuvable');
    return row;
  }

  async create(userId: number, body: any) {
    const data = await this.clean(userId, body);
    const row = this.repo.create({ ...data, userId, status: data.status || 'scheduled' });
    await this.assertFree(userId, row, body?.allowOverlap === true);
    return this.repo.save(row);
  }

  async update(id: number, userId: number, body: any) {
    const row = await this.findOne(id, userId);
    Object.assign(row, await this.clean(userId, body, row));
    await this.assertFree(userId, row, body?.allowOverlap === true, row.id);
    return this.repo.save(row);
  }

  async setStatus(id: number, userId: number, status: string) {
    if (!(APPOINTMENT_STATUSES as readonly string[]).includes(String(status))) throw new BadRequestException('État invalide.');
    const row = await this.findOne(id, userId);
    row.status = String(status);
    // Rouvrir un rendez-vous annulé : le créneau doit être encore libre.
    await this.assertFree(userId, row, false, row.id);
    return this.repo.save(row);
  }

  async delete(id: number, userId: number) {
    await this.findOne(id, userId);
    await this.repo.delete({ id, userId });
    return { success: true };
  }

  /** Ressources déjà utilisées (propositions de saisie) et chiffres du jour. */
  async summary(userId: number, now = new Date()) {
    const resources: Array<{ resource: string }> = await this.ds.query(
      `SELECT "resource" FROM "appointments" WHERE "userId" = $1 AND "resource" IS NOT NULL GROUP BY "resource" ORDER BY MAX("startAt") DESC LIMIT 50`, [userId]);
    const services: Array<{ service: string }> = await this.ds.query(
      `SELECT "service" FROM "appointments" WHERE "userId" = $1 AND "service" IS NOT NULL GROUP BY "service" ORDER BY COUNT(*) DESC LIMIT 50`, [userId]);
    // « Aujourd'hui » à l'heure de Tunis (UTC+1, sans changement d'heure).
    const local = new Date(now.getTime() + 3_600_000);
    const dayStart = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - 3_600_000);
    const dayEnd = new Date(dayStart.getTime() + DAY);
    const [today] = await this.ds.query(
      `SELECT COUNT(*) FILTER (WHERE "status" IN ('scheduled','confirmed','done'))::int AS "planned",
              COUNT(*) FILTER (WHERE "status" = 'done')::int AS "done",
              COUNT(*) FILTER (WHERE "status" = 'cancelled')::int AS "cancelled",
              COUNT(*) FILTER (WHERE "status" = 'no_show')::int AS "noShow"
         FROM "appointments" WHERE "userId" = $1 AND "startAt" >= $2 AND "startAt" < $3`, [userId, dayStart, dayEnd]);
    const [{ upcoming }] = await this.ds.query(
      `SELECT COUNT(*)::int AS "upcoming" FROM "appointments" WHERE "userId" = $1 AND "status" IN ('scheduled','confirmed') AND "startAt" >= $2 AND "startAt" < $3`,
      [userId, now, new Date(now.getTime() + 7 * DAY)]);
    return { resources: resources.map((r) => r.resource), services: services.map((s) => s.service), today, upcoming7Days: upcoming, serverTime: now.toISOString() };
  }
}
