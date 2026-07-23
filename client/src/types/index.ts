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
  customerName?: string;
  customerContact?: string;
  remark?: string;
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
  customerName?: string;
  customerContact?: string;
  remark?: string;
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
  washGradingRecordId?: number;
  productMarker: string;
  workerNames: string;
  count: number;
  remainingCount: number;
  unitWeight: number;
  redWeight: number;
  redCount: number;
  whiteWeight: number;
  whiteCount: number;
  naturalWeight: number;
  naturalCount: number;
  naturalWhiteWeight: number;
  naturalWhiteCount: number;
  artificialWeight: number;
  artificialCount: number;
  regularWeight: number;
  regularCount: number;
  blackWeight: number;
  blackCount: number;
  regularExtraWeight: number;
  regularExtraCount: number;
  blackExtraWeight: number;
  blackExtraCount: number;
  whiteExtraWeight: number;
  whiteExtraCount: number;
  naturalWhiteExtraWeight: number;
  naturalWhiteExtraCount: number;
  offCutsWeight: number;
  offCutsCount: number;
  reclaimedWeight: number;
  reclaimedCount: number;
  fluffWeight: number;
  fluffCount: number;
  lossWeight: number;
  totalWeight: number;
  remainingWeight: number;
  remainingWeightKg?: number;
  difference: number;
  remRedCount: number;
  remWhiteCount: number;
  remNaturalCount: number;
  remNaturalWhiteCount: number;
  remArtificialCount: number;
  remRegularCount: number;
  remBlackCount: number;
  remRegularExtraCount: number;
  remBlackExtraCount: number;
  remWhiteExtraCount: number;
  remNaturalWhiteExtraCount: number;
  remOffCutsCount: number;
  remReclaimedCount: number;
  remFluffCount: number;
  remRedWeight: number;
  remWhiteWeight: number;
  remNaturalWeight: number;
  remNaturalWhiteWeight: number;
  remArtificialWeight: number;
  remRegularWeight: number;
  remBlackWeight: number;
  remRegularExtraWeight: number;
  remBlackExtraWeight: number;
  remWhiteExtraWeight: number;
  remNaturalWhiteExtraWeight: number;
  remOffCutsWeight: number;
  remReclaimedWeight: number;
  remFluffWeight: number;
  warehouseName?: string;
  isLocked?: boolean;
  workerFees?: number;
  workers?: {
    messLabourWorkerId: number;
    messLabourWorkerName?: string;
    workerFee: number;
  }[];
}

export interface CreateProcessingRecordDto {
  date: string;
  productId: number;
  washGradingRecordId?: number;
  workerNames: string;
  workers?: { messLabourWorkerId: number; workerFee: number }[];
  count: number;
  remainingCount: number;
  unitWeight: number;
  redWeight: number;
  redCount: number;
  whiteWeight: number;
  whiteCount: number;
  naturalWeight: number;
  naturalCount: number;
  naturalWhiteWeight: number;
  naturalWhiteCount: number;
  artificialWeight: number;
  artificialCount: number;
  regularWeight: number;
  regularCount: number;
  blackWeight: number;
  blackCount: number;
  regularExtraWeight: number;
  regularExtraCount: number;
  blackExtraWeight: number;
  blackExtraCount: number;
  whiteExtraWeight: number;
  whiteExtraCount: number;
  naturalWhiteExtraWeight: number;
  naturalWhiteExtraCount: number;
  offCutsWeight: number;
  offCutsCount: number;
  reclaimedWeight: number;
  reclaimedCount: number;
  fluffWeight: number;
  fluffCount: number;
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
  assignWashGrading?: boolean;
  assignMessLabour?: boolean;
  assignGirdleBush?: boolean;
  assignSingleDoubleDrawn?: boolean;
  assignSemiExportPurchase?: boolean;
  warehouseId?: number;
  warehouseName?: string;
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
  placeId?: number;
  placeName?: string;
  supervisorName?: string;
  isWeightFull: boolean;
  workerFees?: number;
  supervisorFees?: number;
  workers?: {
    id: number;
    purifierId: number;
    purifierName: string;
    count: number;
    workerFees: number;
  }[];
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
  placeId?: number;
  placeName?: string;
  supervisorName?: string;
  isWeightFull: boolean;
  workerFees?: number;
  supervisorFees?: number;
  workers?: {
    id: number;
    purifierId: number;
    purifierName: string;
    count: number;
    workerFees: number;
  }[];
  isLocked?: boolean;
}

export interface CreatePurificationProcessDto {
  date: string;
  processingRecordId: number;
  category: string;
  purifyCount: number;
  placeId?: number;
  purifierId?: number;
  isWeightFull: boolean;
  workerFees?: number;
  supervisorFees?: number;
  workers?: { purifierId: number; count: number; workerFees: number }[];
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
  placeId?: number;
  placeName?: string;
  isActive: boolean;
}

export interface Place {
  id: number;
  name: string;
  supervisorName?: string;
  warehouseId: number;
  warehouseName: string;
}

export interface CreatePlaceDto {
  name: string;
  supervisorName: string;
  warehouseId: number;
}

export interface UpdatePlaceDto {
  name: string;
  supervisorName: string;
  warehouseId: number;
}

export interface CreatePurifierDto {
  name: string;
  warehouseId: number;
  placeId?: number;
}

export interface UpdatePurifierDto {
  name: string;
  warehouseId: number;
  placeId?: number;
  isActive: boolean;
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
  originalCount: number;
  originalWeight: number;
  remainingCountAfter: number;
  remainingWeightAfter: number;
  warehouseName?: string;
  refinementWorkerId?: number;
  refinementWorkerName?: string;
  workerFees?: number;
}

export interface RefiningProcess {
  id: number;
  date: string;
  purifiedRecordId: number;
  productMarker: string;
  warehouseName?: string;
  category: string;
  count: number;
  weight: number;
  assignedWeight?: number;
  refinementWorkerId?: number;
  refinementWorkerName?: string;
  lostWeight: number;
  spoilageWeight: number;
  returnWeight: number;
  increasedWeight?: number;
  refinementProcessId?: number;
  remainingCount: number;
  remainingWeight: number;
  workerFees: number;
}

export interface RefinementRecord {
  placeName: string;
  id: number;
  date: string;
  purifiedRecordId: number;
  productMarker: string;
  category: string;
  count: number;
  weight: number;
  assignedWeight?: number;
  lostWeight: number;
  spoilageWeight: number;
  returnWeight: number;
  dryWeight?: number;
  increasedWeight?: number;
  warehouseName?: string;
  refinementWorkerId?: number;
  refinementWorkerName?: string;
  workerFees?: number;
  refinementProcessId?: number;
  refiningProcessId?: number;
  isLocked: boolean;
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
  dryWeight?: number;
  increasedWeight?: number;
  refinementWorkerId?: number;
  workerFees?: number;
  refiningProcessId?: number;
}

export interface WashGradingWorker {
  id: number;
  name: string;
  warehouseId: number;
  warehouseName: string;
  isActive: boolean;
}

export interface CreateWashGradingWorkerDto {
  name: string;
  warehouseId: number;
}

export interface UpdateWashGradingWorkerDto {
  name: string;
  warehouseId: number;
  isActive: boolean;
}

export interface AvailableProductDto {
  productId: number;
  productMarker: string;
  warehouseName: string;
  warehouseId?: number;
  remainingWeight: number;
  unit: string;
}

export interface WashGradingProcess {
  id: number;
  date: string;
  productId: number;
  productMarker: string;
  weight: number;
  remainingWeightAfter: number;
  warehouseName?: string;
  warehouseId?: number;
  washGradingWorkerId?: number;
  washGradingWorkerName?: string;
  workerFees?: number;
}

export interface WashGradingRecord {
  id: number;
  date: string;
  productId: number;
  productMarker: string;
  weight: number;
  lostWeight: number;
  remainingWeight: number;
  unit?: string;
  warehouseName?: string;
  warehouseId?: number;
  washGradingWorkerId?: number;
  washGradingWorkerName?: string;
  workerFees?: number;
  isUsedInMessLabour?: boolean;
}

export interface CreateWashGradingProcessDto {
  date: string;
  productId: number;
  weight: number;
  lostWeight: number;
  washGradingWorkerId?: number;
  workerFees?: number;
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
  workerFees?: number;
  messLabourWorkerNames?: string;
  messLabourWorkerFees?: number;
  purificationWorkerName?: string;
  purificationWorkerFees?: number;
  purificationSupervisorName?: string;
  purificationSupervisorFees?: number;
  purifiedRecordId?: number;
  refinementWorkerName?: string;
  refinementWorkerFees?: number;
  washGradingWorkerName?: string;
  washGradingWorkerFees?: number;
  washGradingLostWeight?: number;
  washGradingRecordId?: number;
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
  isLocked: boolean;
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
  singleDoubleDrawnRecordId?: number | null;
  semiExportPurchaseRecordId?: number | null;
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

export interface UpsertSemiExportPurchaseRecordsDto {
  semiExportPurchaseRecordIds: number[];
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

export interface ImportedSemiExport {
  id: number;
  markerName: string;
  totalSortedWeight: number;
  date: string;
  dataJson: string;
}

export interface CreateImportedSemiExportDto {
  markerName: string;
  totalSortedWeight: number;
  date: string;
  dataJson: string;
}

export interface SemiExportPurchase {
  id: number;
  customerName: string;
  contact: string;
  totalReceiveWeight: number;
  receiveDateTime: string;
  color: string;
  createdAt: string;
}

export interface CreateSemiExportPurchaseDto {
  customerName: string;
  contact: string;
  totalReceiveWeight: number;
  receiveDateTime: string;
  color: string;
}

export interface MessLabourWorker {
  id: number;
  name: string;
  warehouseId: number;
  warehouseName: string;
  isActive: boolean;
}

export interface CreateMessLabourWorkerDto {
  name: string;
  warehouseId: number;
}

export interface UpdateMessLabourWorkerDto {
  name: string;
  warehouseId: number;
  isActive: boolean;
}

// Report Types
export interface MarkerByDateDto {
  id: number;
  markerName: string;
  date: string;
  warehouseName: string;
  weight: number;
}

export interface ExportedMarkerDto {
  markerId: number;
  markerName: string;
  exportDate: string;
  totalWeightExported: number;
  ledgerId: number;
  ledgerName: string;
  exportStatus: string;
}

export interface WorkerFeeDetailDto {
  workerId: number;
  workerName: string;
  feeAmount: number;
  remarks?: string;
}

export interface StageDetailDto {
  stageName: string;
  stageDate: string;
  inputWeight: number;
  outputWeight: number;
  weightLossKg: number;
  weightLossPercent: number;
  workers: WorkerFeeDetailDto[];
  totalWorkerFees: number;
  supervisorName: string;
  supervisorFees: number;
  status: string;
  missingDataWarning?: string;
}

export interface InventoryReportDto {
  markerName: string;
  startDate: string;
  endDate: string;
  sourceWarehouse: string;
  initialRawMaterialWeight: number;
  rawMaterialUnit: string;
  rawMaterialCategory: string;
  stages: StageDetailDto[];
  finalExportedWeight: number;
  totalWeightLossKg: number;
  totalWeightLossPercent: number;
  totalWorkerFeesAllStages: number;
  totalSupervisorFeesAllStages: number;
  grandTotalCostAllStages: number;
  completionStatus: string;
}

export interface SalesHistoryDto {
  date: string;
  weight: number;
  price: number;
  total: number;
  customerName?: string;
  customerContact?: string;
  remark?: string;
}

export interface RawMaterialReportDto {
  markerName: string;
  inputDate: string;
  rawMaterialQuantity: number;
  unit: string;
  category: string;
  sourceWarehouse: string;
  rawMaterialCostPerUnit?: number;
  totalRawMaterialCost?: number;
  qualityGrade: string;
  processingStartDate: string;
  status: string;
  notes?: string;
  missingDataWarning?: string;
  salesHistory: SalesHistoryDto[];
}

export interface MessLabourReportDto {
  markerName: string;
  processingDate: string;
  quantityProcessed: number;
  unit: string;
  workers: WorkerFeeDetailDto[];
  totalWorkerFees: number;
  feePerUnitKg: number;
  paymentStatus: string;
  missingDataWarning?: string;
  redWeight: number;
  whiteWeight: number;
  specialWeight: number;
  naturalWeight: number;
  naturalWhiteWeight: number;
  naturalRedWeight: number;
  shortCutWeight: number;
  artificialWeight: number;
  shortWeight: number;
  lossWeight: number;
}

export interface PurifiedRecordEntryDto {
  id: number;
  category: string;
  date: string;
  place: string;
  inputWeight: number;
  outputWeight: number;
  weightLossKg: number;
  weightLossPercent: number;
  purifierName: string;
  purifierFees: number;
  supervisorName: string;
  supervisorFees: number;
  totalCost: number;
}

export interface PurifiedStockReportDto {
  markerName: string;
  records: PurifiedRecordEntryDto[];
  totalInputWeight: number;
  totalOutputWeight: number;
  totalWeightLossKg: number;
  totalSupervisorFees: number;
  totalPurificationWorkerFees: number;
  totalPurificationCost: number;
  missingDataWarning?: string;
}

export interface RefinementReportDto {
  markerName: string;
  refinementDate: string;
  inputWeight: number;
  outputWeight: number;
  weightLossKg: number;
  weightLossPercent: number;
  workers: WorkerFeeDetailDto[];
  totalRefinementFees: number;
  refinementDuration: string;
  status: string;
  qualityGrade: string;
  missingDataWarning?: string;
}

export interface RefinedRecordEntryDto {
  id: number;
  category: string;
  date: string;
  inputWeight: number;
  outputWeight: number;
  lostWeight: number;
  spoilageWeight: number;
  returnWeight: number;
  refinementWorkerName: string;
  workerFees: number;
  totalCost: number;
}

export interface RefinedStockReportDto {
  markerName: string;
  records: RefinedRecordEntryDto[];
  totalInputWeight: number;
  totalOutputWeight: number;
  totalLostWeight: number;
  totalSpoilageWeight: number;
  totalReturnWeight: number;
  totalWorkerFees: number;
  totalRefinementCost: number;
  availableWeightForExport: number;
  weightInStock: number;
  dateAvailable: string;
  qualityStatus: string;
  readyForExport: boolean;
  pendingProcesses?: string;
  missingDataWarning?: string;
}

export interface SizeDetailDto {
  sizeName: string;
  weight: number;
  price: number;
}

export interface SingleDoubleDrawnRecordEntryDto {
  id: number;
  date: string;
  category: string;
  categoryColor: string;
  sizes: SizeDetailDto[];
  lostWeight: number;
  spoilageWeight: number;
  returnWeight: number;
  workerName: string;
  workerFees: number;
  totalAmount: number;
}

export interface SingleDoubleDrawnReportDto {
  markerName: string;
  records: SingleDoubleDrawnRecordEntryDto[];
  totalWeight: number;
  totalLostWeight: number;
  totalSpoilageWeight: number;
  totalReturnWeight: number;
  totalWorkerFees: number;
  totalAmountCny: number;
  missingDataWarning?: string;
}

export interface GlobalSortingReportDto {
  markerName: string;
  sortingDate: string;
  inputWeightRefinedStock: number;
  outputWeightExported: number;
  weightLossKg: number;
  weightLossPercent: number;
  sortingWorkers: WorkerFeeDetailDto[];
  totalSortingFees: number;
  washGradingWorkers: WorkerFeeDetailDto[];
  totalWashGradingFees: number;
  finalGradeCategory: string;
  exportReadyStatus: boolean;
  totalSortingCost: number;
  missingDataWarning?: string;
}

export interface MarkerReportDataDto {
  markerName: string;
  markerId: number;
  inventoryReport?: InventoryReportDto;
  rawMaterialReport?: RawMaterialReportDto;
  messLabourReport?: MessLabourReportDto;
  purifiedStockReport?: PurifiedStockReportDto;
  refinementReport?: RefinementReportDto;
  refinedStockReport?: RefinedStockReportDto;
  globalSortingReport?: GlobalSortingReportDto;
  singleDoubleDrawnReport?: SingleDoubleDrawnReportDto;
}

export interface ReportDataRequestDto {
  markerIds: number[];
  reportTypes: string[];
}

export interface ReportDataResponseDto {
  generatedDate: string;
  markersData: MarkerReportDataDto[];
  totalWeightAllMarkers?: number;
  totalWorkerFeesAllMarkers?: number;
  totalCostAllMarkers?: number;
}
