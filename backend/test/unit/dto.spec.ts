import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateClientDto, UpdateClientDto } from '../../src/modules/clients/clients.dto';
import { CreateEmployeeDto } from '../../src/modules/employees/employees.dto';
import { CreateOrderDto } from '../../src/modules/orders/orders.dto';
import { CreateSaleDto } from '../../src/modules/sales/sales.dto';
import { ExpenseDto, YearMonthQuery } from '../../src/modules/finance/finance.dto';
import { completeExpense } from '../../src/modules/finance/expense-defaults';
import { mapDbError } from '../../src/common/db-errors.filter';

async function check<T extends object>(cls: new () => T, plain: Record<string, unknown>) {
  const dto = plainToInstance(cls, plain);
  const errors = await validate(dto as object);
  return { dto: dto as any, messages: errors.flatMap((e) => Object.values(e.constraints || {})) };
}

describe('DTO des anciens modules', () => {
  it('refuse un client sans nom et nettoie les espaces', async () => {
    expect((await check(CreateClientDto, {})).messages).toContain('Nom obligatoire.');
    expect((await check(CreateClientDto, { name: '   ' })).messages).toContain('Nom obligatoire.');
    const ok = await check(CreateClientDto, { name: '  Ali  ', email: '' });
    expect(ok.messages).toEqual([]);
    expect(ok.dto.name).toBe('Ali');
  });

  it('accepte les nombres saisis en texte et refuse le reste', async () => {
    const cases: Array<[unknown, number | 'bad']> = [['12,5', 12.5], ['1 200,50 DT', 1200.5], ['1.200,50', 1200.5], ['1,200.50', 1200.5], [7, 7], ['0', 0], ['abc', 'bad'], ['12abc', 'bad'], [true, 'bad'], [{ a: 1 }, 'bad'], ['-3', 'bad']];
    for (const [input, expected] of cases) {
      const r = await check(CreateClientDto, { name: 'X', totalSpent: input });
      if (expected === 'bad') expect(r.messages.join(' ')).toMatch(/Total dépensé/);
      else { expect(r.messages).toEqual([]); expect(r.dto.totalSpent).toBe(expected); }
    }
  });

  it('une valeur vide ou absente reste facultative, null efface', async () => {
    const r = await check(CreateClientDto, { name: 'X', totalSpent: '', creditLimit: null });
    expect(r.messages).toEqual([]);
    expect(r.dto.totalSpent).toBeUndefined();
    expect(r.dto.creditLimit).toBeNull();
  });

  it('une modification partielle ne peut pas vider le nom', async () => {
    expect((await check(UpdateClientDto, { phone: '1' })).messages).toEqual([]);
    expect((await check(UpdateClientDto, { name: '' })).messages).toContain('Nom obligatoire.');
  });

  it('employé : statut, date, salaire et booléen en texte', async () => {
    const ok = await check(CreateEmployeeDto, { name: 'E', salary: '1 500', status: 'leave', hireDate: '2026-01-15', headOfFamily: 'true', createdAt: '2026-01-01T00:00:00.000Z' });
    expect(ok.messages).toEqual([]);
    expect(ok.dto.salary).toBe(1500);
    expect(ok.dto.headOfFamily).toBe(true);
    expect((await check(CreateEmployeeDto, { name: 'E', hireDate: 'zzz' })).messages.join()).toMatch(/embauche/);
    expect((await check(CreateEmployeeDto, { name: 'E', status: 'banana' })).messages.join()).toMatch(/Statut/);
    expect((await check(CreateEmployeeDto, { name: 'E', salary: -1 })).messages.join()).toMatch(/Salaire/);
  });

  it('commande : quantité entière, noms obligatoires', async () => {
    expect((await check(CreateOrderDto, {})).messages.join()).toMatch(/Client obligatoire/);
    expect((await check(CreateOrderDto, { clientName: 'C', productName: 'P', quantity: 1.5 })).messages.join()).toMatch(/Quantité/);
    expect((await check(CreateOrderDto, { clientName: 'C', productName: 'P', quantity: 2, unitPrice: '10,5', clientId: null })).messages).toEqual([]);
  });

  it('vente : le produit est obligatoire', async () => {
    expect((await check(CreateSaleDto, { quantity: 1 })).messages.join()).toMatch(/Produit/);
    expect((await check(CreateSaleDto, { productId: 3, quantity: 0.5, unitPrice: 0 })).messages).toEqual([]);
  });

  it('dépense et requête année/mois', async () => {
    expect((await check(ExpenseDto, { amount: 119.5, category: 'Loyer' })).messages).toEqual([]);
    expect((await check(ExpenseDto, { category: 'Loyer' })).messages.join()).toMatch(/Montant/);
    expect((await check(YearMonthQuery, { year: 'abc' })).messages.join()).toMatch(/Année/);
    expect((await check(YearMonthQuery, { year: '2026', month: '11' })).dto).toMatchObject({ year: 2026, month: 11 });
  });
});

describe('completeExpense', () => {
  it('déduit HT, TVA et date du montant TTC', () => {
    expect(completeExpense({ amount: 119, taxRate: 19 } as any)).toMatchObject({ amountHT: 100, taxAmount: 19, taxRate: 19 });
    expect(completeExpense({ amount: 100 } as any)).toMatchObject({ amountHT: 100, taxAmount: 0, taxRate: 0 });
    expect(completeExpense({ amount: 100, amountHT: 84.034 } as any)).toMatchObject({ amountHT: 84.034, taxAmount: 15.966 });
    expect(typeof completeExpense({ amount: 10 } as any).date).toBe('string');
  });
  it('refuse une TVA supérieure au montant', () => {
    expect(() => completeExpense({ amount: 100, taxAmount: 150 } as any)).toThrow(/TVA/);
  });
});

describe('mapDbError', () => {
  it('traduit les erreurs de saisie en 400 et les doublons en 409', () => {
    expect(mapDbError({ driverError: { code: '22P02' } })?.status).toBe(400);
    expect(mapDbError({ code: '22007' })?.status).toBe(400);
    expect(mapDbError({ driverError: { code: '22021' } })?.status).toBe(400);
    expect(mapDbError({ driverError: { code: '23505' } })?.status).toBe(409);
    expect(mapDbError({ driverError: { code: '23503', detail: 'Key (id)=(1) is still referenced from table "x".' } })?.status).toBe(409);
    expect(mapDbError({ driverError: { code: '23503', detail: 'Key (categoryId)=(9) is not present in table "categories".' } })?.status).toBe(400);
  });
  it('laisse les vraies pannes en 500', () => {
    expect(mapDbError({ driverError: { code: '57014' } })).toBeNull();
    expect(mapDbError({ driverError: { code: '08006' } })).toBeNull();
    expect(mapDbError(new Error('boom'))).toBeNull();
  });
});
