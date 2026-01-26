export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  roleName: string;
  permissions: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Product {
  id: number;
  date: string;
  packages: number;
  marker: string;
  unit: string;
  weight: number;
  price: number;
  currency: string;
  remainingWeight: number;
  isActive: boolean;
}

export interface CreateProductDto {
  date: string;
  packages: number;
  marker: string;
  unit: string;
  weight: number;
  price: number;
  currency: string;
}

export interface Sale {
  id: number;
  date: string;
  productId: number;
  productMarker: string;
  marker: string;
  unit: string;
  weight: number;
  price: number;
  currency: string;
  sellerId: number;
  sellerName: string;
  totalRemaining: number;
}

export interface CreateSaleDto {
  date: string;
  productId: number;
  marker: string;
  unit: string;
  weight: number;
  price: number;
  currency: string;
}

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalInventoryWeight: number;
  totalSales: number;
  totalSalesAmount: number;
  todaySales: number;
  todaySalesAmount: number;
  recentSales: Sale[];
  lowStockProducts: Product[];
}

export interface CreateUserDto {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  roleId: number;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}
