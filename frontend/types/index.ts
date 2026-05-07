// Types globaux pour Inovexa ERP

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'client';
  companyName?: string;
  phone?: string;
  businessCategory?: string;
  subscriptionEnd?: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface Product {
  id: number;
  userId: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  categoryId?: number;
  category?: Category;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: number;
  userId: number;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface Client {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: Date;
}

export interface Order {
  id: number;
  userId: number;
  clientId?: number;
  clientName?: string;
  productId?: number;
  quantity: number;
  total: number;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  createdAt: Date;
  client?: Client;
  product?: Product;
}

export interface Invoice {
  id: number;
  userId: number;
  clientId?: number;
  amountHT: number;
  amountTTC: number;
  tax: number;
  status: 'pending' | 'paid' | 'cancelled';
  dueDate?: Date;
  createdAt: Date;
  client?: Client;
}

export interface Sale {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  total: number;
  createdAt: Date;
  product?: Product;
}

export interface Purchase {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  total: number;
  createdAt: Date;
  product?: Product;
}

export interface Notification {
  id: number;
  userId: number;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface Stats {
  totalSales: number;
  totalPurchases: number;
  totalClients: number;
  totalProducts: number;
  pendingInvoices: number;
  lowStock: number;
}

export type CategoryId = 'pme' | 'commerce' | 'restaurant' | 'industrie' | 'logistique' | 'services' | 'ecommerce' | 'btp' | 'sante' | 'education';

export interface CategoryConfig {
  id: CategoryId;
  name: string;
  icon: string;
  color: string;
  description: string;
}
