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
  packages: string;
  marker: string;
  unit: string;
  weight: number;
  price: number;
  currency: string;
  remainingWeight: number;
  isActive: boolean;
  warehouseId?: number;
  warehouseName?: string;
}

export interface Warehouse {
  id: number;
  name: string;
  location?: string;
  isActive: boolean;
}

export interface CreateProductDto {
  date: string;
  packages: string;
  marker: string;
  unit: string;
  weight: number;
  price: number;
  currency: string;
  remainingWeight?: number;
  warehouseId?: number;
}

export interface CreateWarehouseDto {
  name: string;
  location?: string;
}

export interface UpdateWarehouseDto {
  name: string;
  location?: string;
  isActive: boolean;
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
  category: string;
}

export interface CreateSaleDto {
  date: string;
  productId: number;
  marker: string;
  unit: string;
  weight: number;
  price: number;
  currency: string;
  category: string;
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

export interface UpdateUserDto {
  fullName: string;
  email: string;
  phoneNumber?: string;
  roleId: number;
  isActive: boolean;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface ProcessingRecord {
  id: number;
  date: string;
  productId: number;
  productMarker: string;
  workerNames: string;
  count: number;
  remainingCount: number;
  unitWeight: number;
  redWeight: number;
  redCount: number;
  whiteWeight: number;
  whiteCount: number;
  specialWeight: number;
  specialCount: number;
  naturalWeight: number;
  naturalCount: number;
  naturalWhiteWeight: number;
  naturalWhiteCount: number;
  naturalRedWeight: number;
  naturalRedCount: number;
  shortCutWeight: number;
  shortCutCount: number;
  artificialWeight: number;
  artificialCount: number;
  shortWeight: number;
  shortCount: number;
  lossWeight: number;
  totalWeight: number;
  remainingWeight: number;
  remainingWeightKg?: number;
  difference: number;
}

export interface CreateProcessingRecordDto {
  date: string;
  productId: number;
  workerNames: string;
  count: number;
  remainingCount: number;
  unitWeight: number;
  redWeight: number;
  redCount: number;
  whiteWeight: number;
  whiteCount: number;
  specialWeight: number;
  specialCount: number;
  naturalWeight: number;
  naturalCount: number;
  naturalWhiteWeight: number;
  naturalWhiteCount: number;
  naturalRedWeight: number;
  naturalRedCount: number;
  shortCutWeight: number;
  shortCutCount: number;
  artificialWeight: number;
  artificialCount: number;
  shortWeight: number;
  shortCount: number;
  lossWeight: number;
  totalWeight: number;
  remainingWeight: number;
  remainingWeightKg?: number;
  difference: number;
}

export interface Worker {
  id: number;
  name: string;
  phoneNumber?: string;
  isActive: boolean;
}
