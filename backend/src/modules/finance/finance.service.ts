import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Between } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { Budget } from './entities/budget.entity';
import { BankAccount } from './entities/bank-account.entity';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    @InjectRepository(BankAccount)
    private bankAccountRepository: Repository<BankAccount>,
    @InjectDataSource() private readonly ds: DataSource,
    private readonly accounting: AccountingService,
  ) {}

  // Expenses
  async getExpenses(userId: number, year?: number, month?: number) {
    let where: any = { userId };
    if (year !== undefined && month !== undefined) {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      where.date = Between(start, end);
    } else if (year !== undefined) {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      where.date = Between(start, end);
    }
    return this.expenseRepository.find({ where, order: { date: 'DESC' } });
  }

  /** Enregistre la dépense et son écriture comptable (charge HT + TVA déductible, réglée par caisse ou banque). */
  async addExpense(userId: number, data: Partial<Expense>, actorId: number | null = null) {
    return this.ds.transaction(async (em) => {
      const { id: _ignored, ...input } = data || {};
      const expense = await em.getRepository(Expense).save(em.getRepository(Expense).create({ ...input, userId } as Partial<Expense>));
      const entry = await this.accounting.postExpense(em, userId, actorId, expense);
      return { ...expense, journalEntry: entry ? { id: entry.id, number: entry.number, journal: entry.journal } : null };
    });
  }

  /** Supprime la dépense ; son écriture est contre-passée (jamais effacée). */
  async deleteExpense(id: number, userId: number, actorId: number | null = null) {
    return this.ds.transaction(async (em) => {
      const expense = await em.getRepository(Expense).findOne({ where: { id, userId } });
      if (!expense) return { success: true };
      await this.accounting.reverseByRef(em, userId, actorId, 'expense', id, `Suppression de la dépense ${expense.description || expense.category || id}`);
      await em.getRepository(Expense).delete({ id, userId });
      return { success: true };
    });
  }

  // Budgets
  async getBudgets(userId: number, year: number) {
    return this.budgetRepository.find({ where: { userId, year } });
  }

  async setBudget(userId: number, data: { category: string; amount: number; year: number; department?: string }) {
    const existing = await this.budgetRepository.findOne({
      where: { 
        userId, 
        category: data.category, 
        year: data.year, 
        department: data.department || 'all' 
      }
    });
    
    if (existing) {
      existing.amount = data.amount;
      return this.budgetRepository.save(existing);
    }
    
    const budget = this.budgetRepository.create({ 
      userId, 
      category: data.category, 
      amount: data.amount, 
      year: data.year, 
      department: data.department || 'all' 
    });
    return this.budgetRepository.save(budget);
  }

  // Bank Accounts
  async getBankAccounts(userId: number) {
    return this.bankAccountRepository.find({ where: { userId } });
  }

  async addBankAccount(userId: number, data: Partial<BankAccount>) {
    const account = this.bankAccountRepository.create({ ...data, userId });
    return this.bankAccountRepository.save(account);
  }

  async deleteBankAccount(id: number, userId: number) {
    await this.bankAccountRepository.delete({ id, userId });
    return { success: true };
  }

  /** Synthèse : dépenses saisies + factures (clients et fournisseurs) validées sur la période, encours à encaisser / à payer. */
  async getFinancialStats(userId: number, year: number, month?: number) {
    const expenses = await this.getExpenses(userId, year, month);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach(e => {
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + (e.amount || 0);
    });
    const bankAccounts = await this.getBankAccounts(userId);
    const totalCash = bankAccounts.reduce((s, a) => s + (a.balance || 0), 0);

    const from = month !== undefined ? `${year}-${String(month + 1).padStart(2, '0')}-01` : `${year}-01-01`;
    const to = month !== undefined ? `${year}-${String(month + 1).padStart(2, '0')}-31` : `${year}-12-31`;
    const [docs] = await this.ds.query(
      `SELECT
         COALESCE(SUM("totalHT") FILTER (WHERE "type" = 'invoice'),0)::float - COALESCE(SUM("totalHT") FILTER (WHERE "type" = 'credit_note'),0)::float AS "revenueHT",
         COALESCE(SUM("totalTTC") FILTER (WHERE "type" = 'invoice'),0)::float - COALESCE(SUM("totalTTC") FILTER (WHERE "type" = 'credit_note'),0)::float AS "revenueTTC",
         COALESCE(SUM("totalHT") FILTER (WHERE "type" = 'supplier_invoice'),0)::float - COALESCE(SUM("totalHT") FILTER (WHERE "type" = 'supplier_credit_note'),0)::float AS "purchasesHT",
         COALESCE(SUM("totalTTC") FILTER (WHERE "type" = 'supplier_invoice'),0)::float - COALESCE(SUM("totalTTC") FILTER (WHERE "type" = 'supplier_credit_note'),0)::float AS "purchasesTTC",
         COUNT(*) FILTER (WHERE "type" = 'supplier_invoice')::int AS "supplierInvoices",
         COUNT(*) FILTER (WHERE "type" = 'invoice')::int AS "clientInvoices"
       FROM "documents" WHERE "userId" = $1 AND "lockedAt" IS NOT NULL AND "status" <> 'cancelled' AND "issueDate" BETWEEN $2 AND $3`,
      [userId, from, to],
    );
    const [open] = await this.ds.query(
      `SELECT COALESCE(SUM("balanceDue") FILTER (WHERE "type" = 'invoice'),0)::float AS "receivables",
              COALESCE(SUM("balanceDue") FILTER (WHERE "type" = 'supplier_invoice'),0)::float AS "payables"
         FROM "documents" WHERE "userId" = $1 AND "lockedAt" IS NOT NULL AND "status" <> 'cancelled' AND "paymentStatus" IN ('unpaid','partial')`,
      [userId],
    );
    const [cash] = await this.ds.query(
      `SELECT COALESCE(SUM("salesTotal"),0)::float AS "posSales", COUNT(*)::int AS "sessions"
         FROM (SELECT ("report"->>'salesTotal')::float AS "salesTotal" FROM "cash_sessions" WHERE "userId" = $1 AND "status" = 'closed' AND "closedAt"::date BETWEEN $2 AND $3) z`,
      [userId, from, to],
    );
    return {
      totalExpenses, expensesByCategory, totalCash, bankAccounts,
      documents: {
        revenueHT: docs.revenueHT, revenueTTC: docs.revenueTTC, clientInvoices: docs.clientInvoices,
        purchasesHT: docs.purchasesHT, purchasesTTC: docs.purchasesTTC, supplierInvoices: docs.supplierInvoices,
        receivables: open.receivables, payables: open.payables,
      },
      pos: { sales: cash.posSales, sessions: cash.sessions },
      totalOutflows: Math.round((totalExpenses + docs.purchasesTTC) * 1000) / 1000,
      note: 'Dépenses = saisies dans Finances ; achats = factures fournisseurs validées ; ventes = factures validées et caisse clôturée.',
    };
  }
}
