export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  roleName: string;
  permissions: string[];
  warehouseId?: number;
  warehouseName?: string;
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
  isUsed: boolean;
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
  plusMinusWeight: number;
  price: number;
  currency: string;
  sellerId: number;
  sellerName: string;
  totalRemaining: number;
  category: string;
  warehouseName?: string;
}

export interface CreateSaleDto {
  date: string;
  productId: number;
  marker: string;
  unit: string;
  weight: number;
  plusMinusWeight: number;
  price: number;
  currency: string;
  category: string;
}

export interface MarkerSortingStats {
  marker: string;
  warehouseName: string;
  category: string;
  totalSorted: number;
  totalLost: number;
  totalSpoilage: number;
  totalReturns: number;
  recordCount: number;
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
  markerSortingStats: MarkerSortingStats[];
}

export interface CreateUserDto {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  roleId: number;
  warehouseId?: number;
}

export interface UpdateUserDto {
  fullName: string;
  email: string;
  phoneNumber?: string;
  roleId: number;
  isActive: boolean;
  warehouseId?: number;
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
  remRedCount: number;
  remWhiteCount: number;
  remSpecialCount: number;
  remNaturalCount: number;
  remNaturalWhiteCount: number;
  remNaturalRedCount: number;
  remShortCutCount: number;
  remArtificialCount: number;
  remShortCount: number;
  remRedWeight: number;
  remWhiteWeight: number;
  remSpecialWeight: number;
  remNaturalWeight: number;
  remNaturalWhiteWeight: number;
  remNaturalRedWeight: number;
  remShortCutWeight: number;
  remArtificialWeight: number;
  remShortWeight: number;
  warehouseName?: string;
  isLocked?: boolean;
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

export interface PurificationProcess {
  id: number;
  date: string;
  processingRecordId: number;
  productMarker: string;
  category: string;
  purifyCount: number;
  purifyWeight: number;
  remainingCountAfter: number;
  remainingWeightAfter: number;
  warehouseName?: string;
  purifierId?: number;
  purifierName?: string;
  isWeightFull: boolean;
}

export interface PurifiedRecord {
  id: number;
  date: string;
  processingRecordId: number;
  productMarker: string;
  category: string;
  count: number;
  weight: number;
  warehouseName?: string;
  purifierId?: number;
  purifierName?: string;
  isWeightFull: boolean;
}

export interface CreatePurificationProcessDto {
  date: string;
  processingRecordId: number;
  category: string;
  purifyCount: number;
  purifierId?: number;
  isWeightFull: boolean;
}

export interface AvailableCategory {
  processingRecordId: number;
  productId: number;
  productMarker: string;
  category: string;
  remainingCount: number;
  remainingWeight: number;
  unitWeight: number;
  warehouseName?: string;
  warehouseId?: number;
}

export interface RefinementWorker {
  id: number;
  name: string;
  warehouseId: number;
  warehouseName: string;
  isActive: boolean;
}

export interface CreateRefinementWorkerDto {
  name: string;
  warehouseId: number;
}

export interface UpdateRefinementWorkerDto {
  name: string;
  warehouseId: number;
  isActive: boolean;
}

export interface Purifier {
  id: number;
  name: string;
  warehouseId: number;
  warehouseName: string;
  isActive: boolean;
}

export interface CreatePurifierDto {
  name: string;
  warehouseId: number;
}
export interface SingleDoubleDrawnWorker {
  id: number;
  name: string;
  warehouseId: number;
  warehouseName: string;
}

export interface CreateSingleDoubleDrawnWorkerDto {
  name: string;
  warehouseId: number;
}

export interface UpdateSingleDoubleDrawnWorkerDto {
  name: string;
  warehouseId: number;
}
export interface UpdatePurifierDto {
  name: string;
  warehouseId: number;
  isActive: boolean;
}

export interface AvailablePurifiedCategory {
  purifiedRecordId: number;
  productMarker: string;
  category: string;
  remainingCount: number;
  remainingWeight: number;
  unitWeight: number;
  warehouseName?: string;
  warehouseId?: number;
}

export interface RefinementProcess {
  id: number;
  date: string;
  purifiedRecordId: number;
  productMarker: string;
  category: string;
  count: number;
  weight: number;
  remainingCountAfter: number;
  remainingWeightAfter: number;
  warehouseName?: string;
  refinementWorkerId?: number;
  refinementWorkerName?: string;
}

export interface RefinementRecord {
  purifierName: string;
  id: number;
  date: string;
  purifiedRecordId: number;
  productMarker: string;
  category: string;
  count: number;
  weight: number;
  lostWeight: number;
  spoilageWeight: number;
  returnWeight: number;
  warehouseName?: string;
  refinementWorkerId?: number;
  refinementWorkerName?: string;
}

export interface CreateRefinementProcessDto {
  date: string;
  purifiedRecordId: number;
  category: string;
  count: number;
  weight: number;
  lostWeight: number;
  spoilageWeight?: number;
  returnWeight?: number;
  refinementWorkerId?: number;
}

export interface SingleDoubleDrawnRecord {
  id: number;
  date: string;
  refinementRecordId: number;
  refinementRecordMarker?: string;
  refinementRecordCategory?: string;
  refinementRecordWarehouseName?: string;
  size6: number;
  size7: number;
  size8: number;
  size9: number;
  size10: number;
  size10B: number;
  size12: number;
  size14: number;
  size16: number;
  size18: number;
  size20: number;
  size22: number;
  size24: number;
  size26: number;
  size28: number;
  sizeBar: number;
  lostWeight: number;
  spoilageWeight: number;
  returnWeight: number;
  singleDoubleLostWeight: number;
  workerId?: number;
  workerName?: string;
  note?: string;
  processingLossWeight: number;
  processingRecordId?: number;
  price6: number;
  price7: number;
  price8: number;
  price9: number;
  price10: number;
  price10B: number;
  price12: number;
  price14: number;
  price16: number;
  price18: number;
  price20: number;
  price22: number;
  price24: number;
  price26: number;
  price28: number;
  priceBar: number;
  spoilageSize: number;
  returnSize: number;
  priceSpoilageSize: number;
  priceReturnSize: number;
}

export interface LedgerDto {
  id: number;
  ledgerName: string;
  date: string;
  description: string;
  markers: LedgerMarkerDto[];
}

export interface CreateLedgerDto {
  ledgerName: string;
  date: string;
  description: string;
  markers: LedgerMarkerDto[];
}

export interface LedgerMarkerDto {
  productId?: number;
  markerName: string;
}

export interface CreateSingleDoubleDrawnRecordDto {
  date: string;
  refinementRecordId: number;
  size6: number;
  size7: number;
  size8: number;
  size9: number;
  size10: number;
  size10B: number;
  size12: number;
  size14: number;
  size16: number;
  size18: number;
  size20: number;
  size22: number;
  size24: number;
  size26: number;
  size28: number;
  sizeBar: number;
  lostWeight: number;
  spoilageWeight: number;
  returnWeight: number;
  singleDoubleLostWeight?: number;
  workerId?: number;
  note?: string;
  price6: number;
  price7: number;
  price8: number;
  price9: number;
  price10: number;
  price10B: number;
  price12: number;
  price14: number;
  price16: number;
  price18: number;
  price20: number;
  price22: number;
  price24: number;
  price26: number;
  price28: number;
  priceBar: number;
  spoilageSize: number;
  returnSize: number;
  priceSpoilageSize: number;
  priceReturnSize: number;
}

export interface SemiExportRecord {
  id: number;
  date: string;
  singleDoubleDrawnRecordId: number;
  refinementRecordMarker: string;
  refinementRecordCategory: string;
  refinementRecordWarehouseName: string;
  workerFees: number;
  remark: string;
  exchangeRateId?: number | null;
  exchangeRateRate?: number | null;
}

export interface UpsertSemiExportRecordDto {
  singleDoubleDrawnRecordId: number;
  workerFees: number;
  remark: string;
  exchangeRateId?: number | null;
}

export interface ExchangeRate {
  id: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  activeStatus: boolean;
  createDate: string;
  createBy: string;
}

export interface CreateExchangeRateDto {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  activeStatus: boolean;
}

export interface Export {
  id: number;
  ledgerId: number;
  ledgerName: string;
  date: string;
  selectedColors: string;
  selectedWeight: number;
  totalExportWeightViss: number;
  totalExportWeightKg: number;
  productAmountMMK: number;
  productAmountCNY: number;
  workerFees: number;
  grandTotalMMK: number;
  exchangeRateId?: number | null;
  exchangeRateRate?: number | null;
  sellingPrice: number;
  sizeSellingPrices: string;
}

export interface CreateExportDto {
  ledgerId: number;
  date: string;
  selectedColors: string;
  selectedWeight: number;
  totalExportWeightViss: number;
  totalExportWeightKg: number;
  productAmountMMK: number;
  productAmountCNY: number;
  workerFees: number;
  grandTotalMMK: number;
  exchangeRateId?: number | null;
  sellingPrice: number;
  sizeSellingPrices: string;
}
