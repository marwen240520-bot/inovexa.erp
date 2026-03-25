export const currencies = {
  TND: { code: 'TND', symbol: 'DT', name: 'Dinar Tunisien' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
};

export function formatCurrency(amount: number, currency: string = 'TND'): string {
  const currencyConfig = currencies[currency as keyof typeof currencies] || currencies.TND;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}
