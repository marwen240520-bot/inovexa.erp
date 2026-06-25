"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const expense_entity_1 = require("./entities/expense.entity");
const budget_entity_1 = require("./entities/budget.entity");
const bank_account_entity_1 = require("./entities/bank-account.entity");
let FinanceService = class FinanceService {
    constructor(expenseRepository, budgetRepository, bankAccountRepository) {
        this.expenseRepository = expenseRepository;
        this.budgetRepository = budgetRepository;
        this.bankAccountRepository = bankAccountRepository;
    }
    async getExpenses(userId, year, month) {
        let where = { userId };
        if (year !== undefined && month !== undefined) {
            const start = new Date(year, month, 1);
            const end = new Date(year, month + 1, 0);
            where.date = (0, typeorm_2.Between)(start, end);
        }
        else if (year !== undefined) {
            const start = new Date(year, 0, 1);
            const end = new Date(year, 11, 31);
            where.date = (0, typeorm_2.Between)(start, end);
        }
        return this.expenseRepository.find({ where, order: { date: 'DESC' } });
    }
    async addExpense(userId, data) {
        const expense = this.expenseRepository.create({ ...data, userId });
        return this.expenseRepository.save(expense);
    }
    async deleteExpense(id, userId) {
        await this.expenseRepository.delete({ id, userId });
        return { success: true };
    }
    async getBudgets(userId, year) {
        return this.budgetRepository.find({ where: { userId, year } });
    }
    async setBudget(userId, data) {
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
    async getBankAccounts(userId) {
        return this.bankAccountRepository.find({ where: { userId } });
    }
    async addBankAccount(userId, data) {
        const account = this.bankAccountRepository.create({ ...data, userId });
        return this.bankAccountRepository.save(account);
    }
    async deleteBankAccount(id, userId) {
        await this.bankAccountRepository.delete({ id, userId });
        return { success: true };
    }
    async getFinancialStats(userId, year, month) {
        const expenses = await this.getExpenses(userId, year, month);
        const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
        const expensesByCategory = {};
        expenses.forEach(e => {
            expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + (e.amount || 0);
        });
        const bankAccounts = await this.getBankAccounts(userId);
        const totalCash = bankAccounts.reduce((s, a) => s + (a.balance || 0), 0);
        return { totalExpenses, expensesByCategory, totalCash, bankAccounts };
    }
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(expense_entity_1.Expense)),
    __param(1, (0, typeorm_1.InjectRepository)(budget_entity_1.Budget)),
    __param(2, (0, typeorm_1.InjectRepository)(bank_account_entity_1.BankAccount)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], FinanceService);
//# sourceMappingURL=finance.service.js.map