import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Objective } from './entities/objective.entity';
import { toNumber } from '../../common/import-utils';

export const OBJECTIVE_METRICS = [
  'revenue', 'profit', 'sales_count', 'new_clients', 'orders_count', 'purchases_count',
  'invoices_paid_amount', 'invoices_paid_count', 'shipments_delivered', 'average_basket', 'manual',
] as const;
export const OBJECTIVE_PERIODS = ['month', 'quarter', 'year', 'custom'] as const;

const DAY = 86_400_000;
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const utcDay = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const validIso = (v: any): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(utcDay(v));

/** Début et fin (inclus) de la période qui contient la date de référence */
export function periodBounds(period: string, ref: Date): { start: string; end: string } {
  const y = ref.getUTCFullYear(), m = ref.getUTCMonth();
  if (period === 'year') return { start: isoDay(new Date(Date.UTC(y, 0, 1))), end: isoDay(new Date(Date.UTC(y, 11, 31))) };
  if (period === 'quarter') { const q = Math.floor(m / 3) * 3; return { start: isoDay(new Date(Date.UTC(y, q, 1))), end: isoDay(new Date(Date.UTC(y, q + 3, 0))) }; }
  return { start: isoDay(new Date(Date.UTC(y, m, 1))), end: isoDay(new Date(Date.UTC(y, m + 1, 0))) };
}

export type ObjectiveStatus = 'achieved' | 'on_track' | 'behind' | 'missed' | 'upcoming';

@Injectable()
export class ObjectivesService {
  constructor(
    @InjectRepository(Objective) private readonly repo: Repository<Objective>,
    private readonly dataSource: DataSource,
  ) {}

  /** Valeur réelle de la métrique entre deux dates (incluses) — mêmes définitions que le tableau de bord */
  private async actual(userId: number, metric: string, start: string, end: string): Promise<number> {
    const range = `"createdAt" >= $2::date AND "createdAt" < ($3::date + INTERVAL '1 day')`;
    const one = async (sql: string) => Number((await this.dataSource.query(sql, [userId, start, end]))[0]?.v || 0);
    switch (metric) {
      case 'revenue': return one(`SELECT COALESCE(SUM(total), 0) AS v FROM sales WHERE "userId" = $1 AND ${range}`);
      case 'sales_count': return one(`SELECT COUNT(*) AS v FROM sales WHERE "userId" = $1 AND ${range}`);
      case 'new_clients': return one(`SELECT COUNT(*) AS v FROM clients WHERE "userId" = $1 AND ${range}`);
      case 'orders_count': return one(`SELECT COUNT(*) AS v FROM orders WHERE "userId" = $1 AND ${range}`);
      case 'purchases_count': return one(`SELECT COUNT(*) AS v FROM purchases WHERE "userId" = $1 AND ${range}`);
      case 'invoices_paid_amount': return one(`SELECT COALESCE(SUM(amount), 0) AS v FROM invoices WHERE "userId" = $1 AND status = 'paid' AND ${range}`);
      case 'invoices_paid_count': return one(`SELECT COUNT(*) AS v FROM invoices WHERE "userId" = $1 AND status = 'paid' AND ${range}`);
      // Les expéditions sont rattachées au client par `clientId` (= id de l'utilisateur)
      case 'shipments_delivered': return one(`SELECT COUNT(*) AS v FROM shipments WHERE "clientId" = $1 AND status = 'delivered' AND ${range}`);
      case 'average_basket': {
        const rev = await one(`SELECT COALESCE(SUM(total), 0) AS v FROM sales WHERE "userId" = $1 AND ${range}`);
        const n = await one(`SELECT COUNT(*) AS v FROM sales WHERE "userId" = $1 AND ${range}`);
        return n > 0 ? rev / n : 0;
      }
      case 'profit': {
        const rev = await one(`SELECT COALESCE(SUM(total), 0) AS v FROM sales WHERE "userId" = $1 AND ${range}`);
        const cost = await one(`SELECT COALESCE(SUM(total), 0) AS v FROM purchases WHERE "userId" = $1 AND ${range}`);
        return rev - cost; // bénéfice = ventes - achats (comme le tableau de bord)
      }
      default: return 0;
    }
  }

  private async withProgress(o: Objective, today = new Date()) {
    const current = round2(o.metric === 'manual' ? Number(o.currentValue) || 0 : await this.actual(o.userId, o.metric, o.startDate, o.endDate));
    const target = Number(o.targetValue);
    const t0 = utcDay(o.startDate), t1 = utcDay(o.endDate), now = utcDay(isoDay(today));
    const totalDays = Math.round((t1 - t0) / DAY) + 1;
    const elapsedDays = Math.min(Math.max(Math.round((now - t0) / DAY) + 1, 0), totalDays);
    const daysLeft = Math.max(Math.round((t1 - now) / DAY), 0);
    const percent = target > 0 ? round2((current / target) * 100) : 0;
    const elapsedPercent = round2((elapsedDays / totalDays) * 100);

    let status: ObjectiveStatus;
    if (current >= target) status = 'achieved';
    else if (now > t1) status = 'missed';
    else if (now < t0) status = 'upcoming';
    else status = percent >= elapsedPercent * 0.9 ? 'on_track' : 'behind';

    return {
      ...o,
      progress: {
        current, target, percent, remaining: round2(Math.max(target - current, 0)),
        totalDays, elapsedDays, daysLeft, elapsedPercent, status,
        // Rythme nécessaire pour atteindre l'objectif d'ici la fin de la période
        neededPerDay: daysLeft > 0 ? round2(Math.max(target - current, 0) / daysLeft) : 0,
      },
    };
  }

  async findAll(userId: number) {
    const rows = await this.repo.find({ where: { userId }, order: { endDate: 'DESC', id: 'DESC' } });
    const list = await Promise.all(rows.map((o) => this.withProgress(o)));
    const todayIso = isoDay(new Date());
    // En cours / à venir d'abord (fin la plus proche en premier), puis les périodes terminées
    return list.sort((a, b) => {
      const aa = a.endDate >= todayIso ? 0 : 1, bb = b.endDate >= todayIso ? 0 : 1;
      return aa - bb || (aa === 0 ? a.endDate.localeCompare(b.endDate) : b.endDate.localeCompare(a.endDate));
    });
  }

  private clean(body: any) {
    const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 120) : '';
    if (!title) throw new BadRequestException("Le titre de l'objectif est obligatoire");
    const metric = String(body?.metric || '');
    if (!(OBJECTIVE_METRICS as readonly string[]).includes(metric)) throw new BadRequestException(`Indicateur invalide (${OBJECTIVE_METRICS.join(', ')})`);
    const targetValue = toNumber(body?.targetValue, NaN);
    if (!Number.isFinite(targetValue) || targetValue <= 0 || targetValue > 1e12) throw new BadRequestException('La valeur cible doit être un nombre supérieur à 0');
    const period = String(body?.period || 'month');
    if (!(OBJECTIVE_PERIODS as readonly string[]).includes(period)) throw new BadRequestException('Période invalide (month, quarter, year ou custom)');

    let startDate: string, endDate: string;
    if (period === 'custom') {
      if (!validIso(body?.startDate) || !validIso(body?.endDate)) throw new BadRequestException('Dates de début et de fin obligatoires (AAAA-MM-JJ)');
      startDate = body.startDate; endDate = body.endDate;
      if (utcDay(endDate) < utcDay(startDate)) throw new BadRequestException('La date de fin doit suivre la date de début');
      if ((utcDay(endDate) - utcDay(startDate)) / DAY > 3660) throw new BadRequestException('Période trop longue (10 ans maximum)');
    } else {
      // La période contenant la date donnée (aujourd'hui par défaut)
      const ref = validIso(body?.startDate) ? new Date(utcDay(body.startDate)) : new Date();
      ({ start: startDate, end: endDate } = periodBounds(period, ref));
    }
    // Objectif libre : progression saisie à la main ; indicateurs automatiques : calculée d'après les données
    let currentValue = 0;
    if (metric === 'manual') {
      currentValue = toNumber(body?.currentValue, 0);
      if (!Number.isFinite(currentValue) || currentValue < 0 || currentValue > 1e12) throw new BadRequestException('La valeur actuelle doit être un nombre positif ou nul');
    }
    const unit = typeof body?.unit === 'string' && body.unit.trim() ? body.unit.trim().slice(0, 20) : null;
    return { title, metric, period, startDate, endDate, targetValue: round2(targetValue), currentValue: round2(currentValue), unit };
  }

  async create(userId: number, body: any) {
    const saved = await this.repo.save(this.repo.create({ ...this.clean(body), userId }));
    return this.withProgress(saved);
  }

  async update(userId: number, id: number, body: any) {
    const obj = await this.repo.findOne({ where: { id, userId } });
    if (!obj) throw new NotFoundException('Objectif introuvable');
    Object.assign(obj, this.clean({ ...obj, ...body }));
    return this.withProgress(await this.repo.save(obj));
  }

  async remove(userId: number, id: number) {
    const obj = await this.repo.findOne({ where: { id, userId } });
    if (!obj) throw new NotFoundException('Objectif introuvable');
    await this.repo.delete(id);
    return { success: true };
  }
}
