import api from './api';

export const apiClient = api;

export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return 'Une erreur est survenue';
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('fr-FR');
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND' }).format(amount);
};
