import { BadRequestException } from '@nestjs/common';
import type { Expense } from './entities/expense.entity';

/**
 * Complète une dépense incomplète : taux de TVA, TVA, montant HT et date sont obligatoires en base. Quand le site (ou un
 * appel d'API) n'en fournit qu'une partie, le reste se déduit du montant TTC ; une TVA supérieure au montant est refusée.
 */
export function completeExpense(input: Partial<Expense>): Partial<Expense> {
  const round3 = (n: number) => Math.round(n * 1000) / 1000;
  const amount = Number(input.amount);
  const taxRate = input.taxRate === undefined || input.taxRate === null ? 0 : Number(input.taxRate);
  let taxAmount = input.taxAmount === undefined || input.taxAmount === null ? undefined : Number(input.taxAmount);
  let amountHT = input.amountHT === undefined || input.amountHT === null ? undefined : Number(input.amountHT);
  if (taxAmount === undefined && amountHT !== undefined) taxAmount = round3(amount - amountHT);
  else if (amountHT === undefined && taxAmount !== undefined) amountHT = round3(amount - taxAmount);
  else if (taxAmount === undefined && amountHT === undefined) {
    amountHT = round3(amount / (1 + taxRate / 100));
    taxAmount = round3(amount - amountHT);
  }
  if ((taxAmount as number) < 0 || (taxAmount as number) > amount) throw new BadRequestException('La TVA ne peut pas dépasser le montant de la dépense.');
  return { taxRate, taxAmount, amountHT, date: (input.date || new Date().toISOString().slice(0, 10)) as unknown as Date };
}
