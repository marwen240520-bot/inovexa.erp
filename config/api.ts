// config/api.ts
// ⚠️ Utilise directement le backend sur le port 3001
export const API_BASE_URL = 'http://localhost:3001/api';

export const endpoints = {
  login: `${API_BASE_URL}/auth/login`,
  me: `${API_BASE_URL}/auth/me`,
  clients: `${API_BASE_URL}/clients`,
  sales: `${API_BASE_URL}/sales`,
  invoices: `${API_BASE_URL}/invoices`,
  products: `${API_BASE_URL}/products`,
  employees: `${API_BASE_URL}/employees`,
  suppliers: `${API_BASE_URL}/suppliers`,
  purchases: `${API_BASE_URL}/purchases`,
  expenses: `${API_BASE_URL}/expenses`,
  orders: `${API_BASE_URL}/orders`,
  reports: `${API_BASE_URL}/reports`,
};
