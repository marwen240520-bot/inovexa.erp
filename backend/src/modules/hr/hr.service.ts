import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import PDFDocument = require('pdfkit');
import { Employee } from '../employees/entities/employee.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { Payslip } from './entities/payslip.entity';
import { CompanyService } from '../company/company.service';
import { AccountingService } from '../accounting/accounting.service';
import { computePayslip, mergePayrollSettings, workingDaysBetween, PayrollSettings } from './payroll';
import { round } from '../../common/money';

const EPS = 0.0005;
const today = () => new Date().toISOString().slice(0, 10);
const LEAVE_KINDS = ['paid', 'sick', 'unpaid', 'maternity', 'other'];
const pad = (n: number) => String(n).padStart(2, '0');
const lastDay = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

@Injectable()
export class HrService {
  constructor(@InjectDataSource() private readonly ds: DataSource, private readonly company: CompanyService, private readonly accounting: AccountingService) {}

  async settings(userId: number): Promise<PayrollSettings> {
    const c = await this.company.getOrCreate(userId);
    return mergePayrollSettings(c.payrollSettings);
  }

  async updateSettings(userId: number, patch: Partial<PayrollSettings>) {
    const current = await this.settings(userId);
    const next: any = { ...current };
    const rates = ['cnssEmployeeRate', 'cnssEmployerRate', 'workAccidentRate', 'professionalExpensesRate', 'solidarityRate'];
    const amounts = ['professionalExpensesCap', 'headOfFamilyDeduction', 'childDeduction', 'maxChildrenDeducted', 'leaveDaysPerMonth', 'solidarityExemptionThreshold'];
    for (const k of rates) if ((patch as any)[k] !== undefined) {
      const v = Number((patch as any)[k]);
      if (!Number.isFinite(v) || v < 0 || v > 100) throw new BadRequestException(`${k} doit être un pourcentage entre 0 et 100.`);
      next[k] = v;
    }
    for (const k of amounts) if ((patch as any)[k] !== undefined) {
      const v = Number((patch as any)[k]);
      if (!Number.isFinite(v) || v < 0 || v > 1e7) throw new BadRequestException(`${k} invalide.`);
      next[k] = v;
    }
    if (patch.brackets !== undefined) {
      const b = patch.brackets;
      if (!Array.isArray(b) || !b.length || b.length > 12) throw new BadRequestException('Barème : 1 à 12 tranches.');
      let prev = 0;
      b.forEach((t, i) => {
        const last = i === b.length - 1;
        if (!(Number(t.rate) >= 0 && Number(t.rate) <= 100)) throw new BadRequestException('Taux de tranche invalide.');
        if (last ? t.upTo !== null : !(Number(t.upTo) > prev)) throw new BadRequestException('Les plafonds de tranche doivent être croissants, la dernière tranche sans plafond (null).');
        if (!last) prev = Number(t.upTo);
      });
      next.brackets = b.map((t) => ({ upTo: t.upTo === null ? null : Number(t.upTo), rate: Number(t.rate) }));
    }
    if (patch.workingWeek !== undefined) {
      if (!Array.isArray(patch.workingWeek) || !patch.workingWeek.length || patch.workingWeek.some((d) => !Number.isInteger(d) || d < 1 || d > 7)) throw new BadRequestException('workingWeek : jours de 1 (lundi) à 7 (dimanche).');
      next.workingWeek = [...new Set(patch.workingWeek)];
    }
    if (patch.validated !== undefined) next.validated = !!patch.validated;
    await this.company.update(userId, { payrollSettings: next } as any);
    return next as PayrollSettings;
  }

  // ═════════════════════════════ Congés ═════════════════════════════

  private async employee(userId: number, id: number) {
    const e = await this.ds.getRepository(Employee).findOne({ where: { id, userId } });
    if (!e) throw new NotFoundException('Employé introuvable');
    return e;
  }

  async leaveBalance(userId: number, employeeId: number) {
    const emp = await this.employee(userId, employeeId);
    const s = await this.settings(userId);
    const start = String(emp.createdAt || today()).slice(0, 10);
    const [y0, m0, d0] = start.split('-').map(Number);
    const now = new Date();
    let months = (now.getUTCFullYear() - y0) * 12 + (now.getUTCMonth() + 1 - m0);
    if (now.getUTCDate() < d0) months -= 1;
    months = Math.max(0, months);
    const [row] = await this.ds.query(
      `SELECT COALESCE(SUM("days") FILTER (WHERE "status" = 'approved'),0) AS taken, COALESCE(SUM("days") FILTER (WHERE "status" = 'pending'),0) AS pending
         FROM "leave_requests" WHERE "userId" = $1 AND "employeeId" = $2 AND "kind" = 'paid'`,
      [userId, employeeId],
    );
    const accrued = round(Number(emp.leaveBalanceStart || 0) + months * s.leaveDaysPerMonth, 2);
    const taken = Number(row.taken), pending = Number(row.pending);
    return { employeeId, trackingSince: start, startBalance: Number(emp.leaveBalanceStart || 0), accrued, taken, pending, balance: round(accrued - taken, 2), available: round(accrued - taken - pending, 2) };
  }

  async listLeaves(userId: number, f: { employeeId?: number; status?: string; from?: string; to?: string }) {
    const params: any[] = [userId];
    let where = `l."userId" = $1`;
    if (f.employeeId) { params.push(f.employeeId); where += ` AND l."employeeId" = $${params.length}`; }
    if (f.status) { params.push(f.status); where += ` AND l."status" = $${params.length}`; }
    if (f.from) { params.push(f.from); where += ` AND l."endDate" >= $${params.length}`; }
    if (f.to) { params.push(f.to); where += ` AND l."startDate" <= $${params.length}`; }
    const rows = await this.ds.query(
      `SELECT l.*, to_char(l."startDate",'YYYY-MM-DD') AS "startDate", to_char(l."endDate",'YYYY-MM-DD') AS "endDate", e."name" AS "employeeName"
         FROM "leave_requests" l JOIN "employees" e ON e."id" = l."employeeId" WHERE ${where} ORDER BY l."startDate" DESC LIMIT 500`,
      params,
    );
    return rows.map((r: any) => ({ ...r, days: Number(r.days) }));
  }

  async requestLeave(userId: number, dto: { employeeId: number; kind: string; startDate: string; endDate: string; reason?: string }) {
    await this.employee(userId, dto.employeeId);
    if (!LEAVE_KINDS.includes(dto.kind)) throw new BadRequestException(`Type de congé inconnu (${LEAVE_KINDS.join(', ')}).`);
    if (dto.endDate < dto.startDate) throw new BadRequestException('La date de fin précède la date de début.');
    const s = await this.settings(userId);
    const days = workingDaysBetween(dto.startDate, dto.endDate, s.workingWeek);
    if (days <= 0) throw new BadRequestException('Aucun jour ouvré dans cette période.');
    return this.ds.transaction(async (em) => {
      const [overlap] = await em.query(
        `SELECT 1 FROM "leave_requests" WHERE "userId" = $1 AND "employeeId" = $2 AND "status" IN ('pending','approved') AND "startDate" <= $4 AND "endDate" >= $3 LIMIT 1`,
        [userId, dto.employeeId, dto.startDate, dto.endDate],
      );
      if (overlap) throw new ConflictException('Cet employé a déjà un congé demandé ou approuvé sur cette période.');
      if (dto.kind === 'paid') {
        const b = await this.leaveBalance(userId, dto.employeeId);
        if (days - b.available > EPS) throw new BadRequestException(`Solde de congés insuffisant : ${b.available} jour(s) disponible(s), ${days} demandé(s).`);
      }
      return em.getRepository(LeaveRequest).save(em.getRepository(LeaveRequest).create({ userId, employeeId: dto.employeeId, kind: dto.kind, startDate: dto.startDate, endDate: dto.endDate, days, status: 'pending', reason: dto.reason?.slice(0, 300) || null, decidedBy: null }));
    });
  }

  async decideLeave(userId: number, actorId: number, id: number, decision: 'approved' | 'rejected' | 'cancelled') {
    const repo = this.ds.getRepository(LeaveRequest);
    const leave = await repo.findOne({ where: { id, userId } });
    if (!leave) throw new NotFoundException('Demande introuvable');
    if (decision === 'cancelled') {
      if (!['pending', 'approved'].includes(leave.status)) throw new BadRequestException('Cette demande ne peut plus être annulée.');
    } else if (leave.status !== 'pending') {
      throw new BadRequestException(`Demande déjà ${leave.status === 'approved' ? 'approuvée' : leave.status === 'rejected' ? 'refusée' : 'annulée'}.`);
    }
    if (decision === 'approved' && leave.kind === 'paid') {
      const b = await this.leaveBalance(userId, leave.employeeId);
      if (leave.days - (b.balance) > EPS) throw new BadRequestException(`Solde insuffisant (${b.balance} j) pour approuver ${leave.days} jour(s).`);
    }
    leave.status = decision;
    leave.decidedBy = actorId;
    return repo.save(leave);
  }

  // ═════════════════════════════ Paie ═════════════════════════════

  private monthRange(year: number, month: number) {
    if (!Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) throw new BadRequestException('Période invalide.');
    return { start: `${year}-${pad(month)}-01`, end: `${year}-${pad(month)}-${pad(lastDay(year, month))}` };
  }

  private async absenceDeduction(userId: number, emp: Employee, year: number, month: number, s: PayrollSettings) {
    const { start, end } = this.monthRange(year, month);
    const leaves = await this.ds.query(
      `SELECT to_char("startDate",'YYYY-MM-DD') AS s, to_char("endDate",'YYYY-MM-DD') AS e FROM "leave_requests"
        WHERE "userId" = $1 AND "employeeId" = $2 AND "kind" = 'unpaid' AND "status" = 'approved' AND "startDate" <= $4 AND "endDate" >= $3`,
      [userId, emp.id, start, end],
    );
    const monthDays = workingDaysBetween(start, end, s.workingWeek);
    let unpaid = 0;
    for (const l of leaves) unpaid += workingDaysBetween(l.s < start ? start : l.s, l.e > end ? end : l.e, s.workingWeek);
    const salary = Number(emp.salary) || 0;
    return { unpaidDays: unpaid, monthDays, amount: monthDays > 0 ? round((salary * Math.min(unpaid, monthDays)) / monthDays, 3) : 0 };
  }

  private async buildPayslip(userId: number, emp: Employee, year: number, month: number, s: PayrollSettings, bonuses = 0, otherDeductions = 0) {
    const abs = await this.absenceDeduction(userId, emp, year, month, s);
    const salary = round(Math.max(0, (Number(emp.salary) || 0) - abs.amount), 3);
    const r = computePayslip({ grossSalary: salary, bonuses, otherDeductions, headOfFamily: emp.headOfFamily, childrenCount: emp.childrenCount }, s);
    return { r, abs, baseSalary: Number(emp.salary) || 0 };
  }

  async generate(userId: number, year: number, month: number) {
    this.monthRange(year, month);
    const s = await this.settings(userId);
    const employees = await this.ds.getRepository(Employee).find({ where: { userId, status: 'active' } });
    const out = { created: 0, updated: 0, skipped: 0, ignored: [] as string[] };
    for (const emp of employees) {
      if (!(Number(emp.salary) > 0)) { out.ignored.push(`${emp.name} : salaire non renseigné`); continue; }
      await this.ds.transaction(async (em) => {
        const existing = await em.getRepository(Payslip).findOne({ where: { userId, employeeId: emp.id, year, month }, lock: { mode: 'pessimistic_write' } });
        if (existing && existing.status !== 'draft') { out.skipped++; return; }
        const { r, abs, baseSalary } = await this.buildPayslip(userId, emp, year, month, s, existing?.bonuses || 0, existing?.otherDeductions || 0);
        const data = {
          userId, employeeId: emp.id, year, month, grossSalary: r.grossSalary, bonuses: r.bonuses, employeeCnss: r.employeeCnss, taxableIncome: r.taxableIncome,
          incomeTax: r.incomeTax, solidarityContribution: r.solidarityContribution, otherDeductions: r.otherDeductions, netSalary: r.netSalary,
          employerCnss: r.employerCnss, employerCost: r.employerCost, status: 'draft', parameters: s,
          details: { ...r.details, baseSalary, absenceDeduction: abs.amount, unpaidDays: abs.unpaidDays },
        };
        if (existing) { await em.getRepository(Payslip).save(Object.assign(existing, data)); out.updated++; }
        else { await em.getRepository(Payslip).save(em.getRepository(Payslip).create(data as any)); out.created++; }
      });
    }
    return { year, month, ...out, notice: s.validated ? undefined : 'Paramètres de paie non validés : faites valider les taux et le barème par votre expert-comptable.' };
  }

  async listPayslips(userId: number, year: number, month?: number) {
    const params: any[] = [userId, year];
    let where = `p."userId" = $1 AND p."year" = $2`;
    if (month) { params.push(month); where += ` AND p."month" = $3`; }
    const rows = await this.ds.query(
      `SELECT p.*, e."name" AS "employeeName", e."position" FROM "payslips" p JOIN "employees" e ON e."id" = p."employeeId" WHERE ${where} ORDER BY p."month", e."name"`,
      params,
    );
    const num = ['grossSalary', 'bonuses', 'employeeCnss', 'taxableIncome', 'incomeTax', 'solidarityContribution', 'otherDeductions', 'netSalary', 'employerCnss', 'employerCost'];
    const items = rows.map((r: any) => { const o = { ...r }; for (const k of num) o[k] = Number(o[k]); return o; });
    const totals: Record<string, number> = {};
    for (const k of num) totals[k] = round(items.reduce((s: number, i: any) => s + i[k], 0), 3);
    return { items, totals };
  }

  async updateDraft(userId: number, id: number, dto: { bonuses?: number; otherDeductions?: number }) {
    return this.ds.transaction(async (em) => {
      const p = await em.getRepository(Payslip).findOne({ where: { id, userId }, lock: { mode: 'pessimistic_write' } });
      if (!p) throw new NotFoundException('Bulletin introuvable');
      if (p.status !== 'draft') throw new ConflictException('Un bulletin validé n’est plus modifiable.');
      const emp = await this.employee(userId, p.employeeId);
      const s = await this.settings(userId);
      const { r, abs, baseSalary } = await this.buildPayslip(userId, emp, p.year, p.month, s, dto.bonuses ?? p.bonuses, dto.otherDeductions ?? p.otherDeductions);
      Object.assign(p, { grossSalary: r.grossSalary, bonuses: r.bonuses, employeeCnss: r.employeeCnss, taxableIncome: r.taxableIncome, incomeTax: r.incomeTax, solidarityContribution: r.solidarityContribution, otherDeductions: r.otherDeductions, netSalary: r.netSalary, employerCnss: r.employerCnss, employerCost: r.employerCost, parameters: s, details: { ...r.details, baseSalary, absenceDeduction: abs.amount, unpaidDays: abs.unpaidDays } });
      return em.getRepository(Payslip).save(p);
    });
  }

  /** Valide (fige) le bulletin et passe l'écriture de paie. */
  async validate(userId: number, actorId: number, id: number) {
    return this.ds.transaction(async (em) => {
      const p = await em.getRepository(Payslip).findOne({ where: { id, userId }, lock: { mode: 'pessimistic_write' } });
      if (!p) throw new NotFoundException('Bulletin introuvable');
      if (p.status !== 'draft') throw new ConflictException('Bulletin déjà validé.');
      const emp = await this.employee(userId, p.employeeId);
      const cnss = round(p.employeeCnss + p.employerCnss, 3);
      const taxes = round(p.incomeTax + p.solidarityContribution, 3);
      const gross = round(p.grossSalary + p.bonuses, 3);
      await this.accounting.postEntry(em, userId, {
        journal: 'OD', date: `${p.year}-${pad(p.month)}-${pad(lastDay(p.year, p.month))}`, label: `Paie ${pad(p.month)}/${p.year} — ${emp.name}`, refType: 'payslip', refId: p.id, actorId,
        lines: [
          { accountCode: '641', debit: gross, label: 'Salaire brut' },
          { accountCode: '645', debit: p.employerCnss, label: 'Charges patronales' },
          { accountCode: '421', credit: round(p.netSalary + p.otherDeductions, 3), label: emp.name },
          { accountCode: '431', credit: cnss, label: 'CNSS' },
          { accountCode: '4369', credit: taxes, label: 'IRPP et contribution de solidarité' },
        ],
      });
      p.status = 'validated';
      return em.getRepository(Payslip).save(p);
    });
  }

  async markPaid(userId: number, actorId: number, id: number, method: 'cash' | 'transfer', date?: string) {
    return this.ds.transaction(async (em) => {
      const p = await em.getRepository(Payslip).findOne({ where: { id, userId }, lock: { mode: 'pessimistic_write' } });
      if (!p) throw new NotFoundException('Bulletin introuvable');
      if (p.status !== 'validated') throw new BadRequestException(p.status === 'paid' ? 'Bulletin déjà payé.' : 'Validez le bulletin avant de le payer.');
      const emp = await this.employee(userId, p.employeeId);
      const d = (date || today()).slice(0, 10);
      const company = await this.company.getOrCreate(userId, em);
      const map = this.accounting.accountMap(company);
      const treasury = method === 'cash' ? map.cash : map.bank;
      await this.accounting.postEntry(em, userId, {
        journal: method === 'cash' ? 'CA' : 'BQ', date: d, label: `Paiement salaire ${pad(p.month)}/${p.year} — ${emp.name}`, refType: 'payslip_payment', refId: p.id, actorId,
        lines: [{ accountCode: '421', debit: p.netSalary, label: emp.name }, { accountCode: treasury, credit: p.netSalary }],
      });
      p.status = 'paid';
      return em.getRepository(Payslip).save(p);
    });
  }

  async remove(userId: number, id: number) {
    const repo = this.ds.getRepository(Payslip);
    const p = await repo.findOne({ where: { id, userId } });
    if (!p) throw new NotFoundException('Bulletin introuvable');
    if (p.status !== 'draft') throw new ForbiddenException('Seul un bulletin brouillon peut être supprimé.');
    await repo.delete({ id });
    return { deleted: true };
  }

  async payslipPdf(userId: number, id: number): Promise<{ buffer: Buffer; filename: string }> {
    const p = await this.ds.getRepository(Payslip).findOne({ where: { id, userId } });
    if (!p) throw new NotFoundException('Bulletin introuvable');
    const emp = await this.employee(userId, p.employeeId);
    const company = await this.company.getOrCreate(userId);
    const fmt = (n: number) => { const [i, d] = Math.abs(Number(n)).toFixed(3).split('.'); return `${i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${d}`; };
    const clean = (s: unknown) => String(s ?? '').replace(/[^\x20-\x7E -ÿ’]/g, '?');
    const buffer: Buffer = await new Promise((resolve, reject) => {
      const pdf = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];
      pdf.on('data', (c: Buffer) => chunks.push(c)); pdf.on('end', () => resolve(Buffer.concat(chunks))); pdf.on('error', reject);
      pdf.font('Helvetica-Bold').fontSize(14).text(clean(company.legalName || 'Société'), 40, 40);
      pdf.font('Helvetica').fontSize(8.5).fillColor('#6b7280').text(clean([company.address, company.city].filter(Boolean).join(', ')));
      pdf.text(clean([company.taxId ? `MF : ${company.taxId}` : '', company.cnssNumber ? `CNSS : ${company.cnssNumber}` : ''].filter(Boolean).join('  -  ')));
      pdf.fillColor('#1d4ed8').font('Helvetica-Bold').fontSize(18).text('BULLETIN DE PAIE', 300, 40, { width: 255, align: 'right' });
      pdf.fillColor('#1f2937').fontSize(10).text(`Période : ${pad(p.month)}/${p.year}`, 300, pdf.y, { width: 255, align: 'right' });
      pdf.font('Helvetica-Bold').fontSize(10).fillColor('#1f2937').text(clean(emp.name), 40, 130);
      pdf.font('Helvetica').fontSize(9).fillColor('#374151');
      pdf.text(clean([emp.position, emp.cin ? `CIN : ${emp.cin}` : '', emp.cnssNumber ? `CNSS : ${emp.cnssNumber}` : '', emp.contractType || ''].filter(Boolean).join('  -  ')));
      let y = 190;
      const rows: Array<[string, number, boolean?]> = [
        ['Salaire de base', p.grossSalary], ['Primes', p.bonuses], ['Salaire brut', round(p.grossSalary + p.bonuses, 3), true],
        ['Cotisation CNSS salarié', -p.employeeCnss], ['IRPP (retenue mensuelle)', -p.incomeTax], ['Contribution sociale de solidarité', -p.solidarityContribution], ['Autres retenues', -p.otherDeductions],
        ['NET À PAYER', p.netSalary, true],
      ];
      for (const [label, value, bold] of rows) {
        pdf.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10).fillColor('#1f2937').text(label, 40, y, { width: 300 }).text(`${value < 0 ? '-' : ''}${fmt(value)} ${company.currency}`, 340, y, { width: 215, align: 'right' });
        y += 20;
      }
      pdf.font('Helvetica').fontSize(8).fillColor('#6b7280').text(`Charges patronales : ${fmt(p.employerCnss)} - Coût employeur : ${fmt(p.employerCost)} ${company.currency}`, 40, y + 10);
      pdf.text('Bulletin établi avec les paramètres de paie de la société ; à contrôler par votre expert-comptable.', 40, y + 24);
      pdf.end();
    });
    return { buffer, filename: `bulletin-${p.year}-${pad(p.month)}-${emp.id}.pdf` };
  }
}
