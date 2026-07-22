import axios from "axios";
import type {
  LoginRequest,
  LoginResponse,
  Product,
  CreateProductDto,
  Sale,
  CreateSaleDto,
  DashboardStats,
  User,
  CreateUserDto,
  UpdateUserDto,
  Role,
  ProcessingRecord,
  CreateProcessingRecordDto,
  Worker,
  Warehouse,
  CreateWarehouseDto,
  UpdateWarehouseDto,
  PurificationProcess,
  CreatePurificationProcessDto,
  AvailableCategory,
  Place,
  CreatePlaceDto,
  UpdatePlaceDto,
  Purifier,
  CreatePurifierDto,
  UpdatePurifierDto,
  SingleDoubleDrawnWorker,
  CreateSingleDoubleDrawnWorkerDto,
  UpdateSingleDoubleDrawnWorkerDto,
  RefinementWorker,
  CreateRefinementWorkerDto,
  UpdateRefinementWorkerDto,
  PurifiedRecord,
  AvailablePurifiedCategory,
  RefinementProcess,
  RefiningProcess,
  RefinementRecord,
  CreateRefinementProcessDto,
  SingleDoubleDrawnRecord,
  CreateSingleDoubleDrawnRecordDto,
  SemiExportRecord,
  UpsertSemiExportRecordDto,
  UpsertSemiExportPurchaseRecordsDto,
  LedgerDto,
  CreateLedgerDto,
  ExchangeRate,
  CreateExchangeRateDto,
  Export,
  CreateExportDto,
  WashGradingWorker,
  CreateWashGradingWorkerDto,
  UpdateWashGradingWorkerDto,
  MessLabourWorker,
  AvailableProductDto,
  WashGradingProcess,
  WashGradingRecord,
  CreateWashGradingProcessDto,
  MarkerByDateDto,
} from "../types";

const API_BASE_URL = "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", data);
    return response.data;
  },
  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

// Products API
export const productsAPI = {
  getAll: async (all = false): Promise<Product[]> => {
    const response = await api.get<Product[]>("/products", { params: { all } });
    return response.data;
  },
  getById: async (id: number): Promise<Product> => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },
  create: async (data: CreateProductDto): Promise<Product> => {
    const response = await api.post<Product>("/products", data);
    return response.data;
  },
  update: async (
    id: number,
    data: Partial<CreateProductDto>,
  ): Promise<void> => {
    await api.put(`/products/${id}`, data);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};

// Sales API
export const salesAPI = {
  getAll: async (category?: string): Promise<Sale[]> => {
    const response = await api.get<Sale[]>("/sales", {
      params: { category },
    });
    return response.data;
  },
  getById: async (id: number): Promise<Sale> => {
    const response = await api.get<Sale>(`/sales/${id}`);
    return response.data;
  },
  create: async (data: CreateSaleDto): Promise<Sale> => {
    const response = await api.post<Sale>("/sales", data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/sales/${id}`);
  },
};

// Processing API
export const processingAPI = {
  getAll: async (): Promise<ProcessingRecord[]> => {
    const response = await api.get<ProcessingRecord[]>("/processing");
    return response.data;
  },
  create: async (
    data: CreateProcessingRecordDto,
  ): Promise<ProcessingRecord> => {
    const response = await api.post<ProcessingRecord>("/processing", data);
    return response.data;
  },
  update: async (
    id: number,
    data: CreateProcessingRecordDto,
  ): Promise<ProcessingRecord> => {
    const response = await api.put<ProcessingRecord>(`/processing/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/processing/${id}`);
  },
};

// Workers API
export const workersAPI = {
  getAll: async (): Promise<Worker[]> => {
    const response = await api.get<Worker[]>("/workers");
    return response.data;
  },
  getAllIncludingInactive: async (): Promise<Worker[]> => {
    const response = await api.get<Worker[]>("/workers/all");
    return response.data;
  },
  toggleActive: async (id: number): Promise<{ isActive: boolean }> => {
    const response = await api.patch<{ isActive: boolean }>(`/workers/${id}/toggle-active`);
    return response.data;
  },
  getWashGradingWorkers: async (): Promise<WashGradingWorker[]> => {
    const response = await api.get<WashGradingWorker[]>("/workers/washgrading");
    return response.data;
  },
  getMessLabourWorkers: async (): Promise<MessLabourWorker[]> => {
    const response = await api.get<MessLabourWorker[]>("/workers/messlabour");
    return response.data;
  },
  getGirdleBushWorkers: async (): Promise<RefinementWorker[]> => {
    const response = await api.get<RefinementWorker[]>("/workers/girdlebush");
    return response.data;
  },
  getSingleDoubleDrawnWorkers: async (): Promise<SingleDoubleDrawnWorker[]> => {
    const response = await api.get<SingleDoubleDrawnWorker[]>("/workers/singledoubledrawn");
    return response.data;
  },
  getSemiExportPurchaseWorkers: async (): Promise<SingleDoubleDrawnWorker[]> => {
    const response = await api.get<SingleDoubleDrawnWorker[]>("/workers/semiexportpurchase");
    return response.data;
  },
  create: async (data: Partial<Worker>): Promise<Worker> => {
    const response = await api.post<Worker>("/workers", data);
    return response.data;
  },
  update: async (id: number, data: Partial<Worker>): Promise<void> => {
    await api.put(`/workers/${id}`, data);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/workers/${id}`);
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>("/dashboard/stats");
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get<User[]>("/users");
    return response.data;
  },
  getById: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },
  create: async (data: CreateUserDto): Promise<User> => {
    const response = await api.post<User>("/users", data);
    return response.data;
  },
  update: async (id: number, data: UpdateUserDto): Promise<void> => {
    await api.put(`/users/${id}`, data);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
  getRoles: async (): Promise<Role[]> => {
    const response = await api.get<Role[]>("/users/roles");
    return response.data;
  },
  getPermissions: async (id: number): Promise<number[]> => {
    const response = await api.get<number[]>(`/users/${id}/permissions`);
    return response.data;
  },
  updatePermissions: async (
    id: number,
    permissionIds: number[],
  ): Promise<void> => {
    await api.post(`/users/${id}/permissions`, { permissionIds });
  },
};

// Permissions API
export const permissionsAPI = {
  getAll: async (): Promise<any[]> => {
    const response = await api.get<any[]>("/permissions");
    return response.data;
  },
};

// Warehouses API
export const warehousesAPI = {
  getAll: async (): Promise<Warehouse[]> => {
    const response = await api.get<Warehouse[]>("/warehouses");
    return response.data;
  },
  getById: async (id: number): Promise<Warehouse> => {
    const response = await api.get<Warehouse>(`/warehouses/${id}`);
    return response.data;
  },
  create: async (data: CreateWarehouseDto): Promise<Warehouse> => {
    const response = await api.post<Warehouse>("/warehouses", data);
    return response.data;
  },
  update: async (id: number, data: UpdateWarehouseDto): Promise<void> => {
    await api.put(`/warehouses/${id}`, data);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/warehouses/${id}`);
  },
};

export const purificationAPI = {
  getAvailableCategories: async () => {
    const response = await api.get<AvailableCategory[]>(
      "/purification/available-categories",
    );
    return response.data;
  },
  getAll: async () => {
    const response = await api.get<PurificationProcess[]>("/purification");
    return response.data;
  },
  getPurifiedRecords: async () => {
    const response = await api.get<PurifiedRecord[]>(
      "/purification/purified-records",
    );
    return response.data;
  },
  create: async (data: CreatePurificationProcessDto) => {
    const response = await api.post<PurificationProcess>("/purification", data);
    return response.data;
  },
  update: async (id: number, data: CreatePurificationProcessDto) => {
    await api.put(`/purification/${id}`, data);
  },
  delete: async (id: number) => {
    await api.delete(`/purification/${id}`);
  },
  updatePurifiedRecord: async (
    id: number,
    data: CreatePurificationProcessDto,
  ) => {
    await api.put(`/purification/purified-records/${id}`, data);
  },
  deletePurifiedRecord: async (id: number) => {
    await api.delete(`/purification/purified-records/${id}`);
  },
};

// Wash/Grading Workers API
export const washGradingWorkersAPI = {
  getAll: async (): Promise<WashGradingWorker[]> => {
    const response = await api.get<WashGradingWorker[]>("/washgradingworkers");
    return response.data;
  },
  getByWarehouse: async (warehouseId: number): Promise<WashGradingWorker[]> => {
    const response = await api.get<WashGradingWorker[]>(
      `/washgradingworkers/warehouse/${warehouseId}`,
    );
    return response.data;
  },
  create: async (
    data: CreateWashGradingWorkerDto,
  ): Promise<WashGradingWorker> => {
    const response = await api.post<WashGradingWorker>(
      "/washgradingworkers",
      data,
    );
    return response.data;
  },
  update: async (
    id: number,
    data: UpdateWashGradingWorkerDto,
  ): Promise<void> => {
    await api.put(`/washgradingworkers/${id}`, data);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/washgradingworkers/${id}`);
  },
};

// Refinement Workers API
export const refinementWorkersAPI = {
  getAll: async (): Promise<RefinementWorker[]> => {
    const response = await api.get<RefinementWorker[]>("/refinementworkers");
    return response.data;
  },
  getByWarehouse: async (warehouseId: number): Promise<RefinementWorker[]> => {
    const response = await api.get<RefinementWorker[]>(
      `/refinementworkers/warehouse/${warehouseId}`,
    );
    return response.data;
  },
  create: async (
    data: CreateRefinementWorkerDto,
  ): Promise<RefinementWorker> => {
    const response = await api.post<RefinementWorker>(
      "/refinementworkers",
      data,
    );
    return response.data;
  },
  update: async (
    id: number,
    data: UpdateRefinementWorkerDto,
  ): Promise<void> => {
    await api.put(`/refinementworkers/${id}`, data);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/refinementworkers/${id}`);
  },
};

// Places API
export const placesAPI = {
  getAll: async (): Promise<Place[]> => {
    const response = await api.get<Place[]>("/places");
    return response.data;
  },
  create: async (data: CreatePlaceDto): Promise<Place> => {
    const response = await api.post<Place>("/places", data);
    return response.data;
  },
  update: async (id: number, data: UpdatePlaceDto): Promise<void> => {
    await api.put(`/places/${id}`, data);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/places/${id}`);
  },
};

// Purifiers API
export const purifiersAPI = {
  getAll: async (): Promise<Purifier[]> => {
    const response = await api.get<Purifier[]>("/purifiers");
    return response.data;
  },
  getByWarehouse: async (warehouseId: number): Promise<Purifier[]> => {
    const response = await api.get<Purifier[]>(
      `/purifiers/warehouse/${warehouseId}`,
    );
    return response.data;
  },
  create: async (data: CreatePurifierDto): Promise<Purifier> => {
    const response = await api.post<Purifier>("/purifiers", data);
    return response.data;
  },
  update: async (id: number, data: UpdatePurifierDto): Promise<void> => {
    await api.put(`/purifiers/${id}`, data);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/purifiers/${id}`);
  },
};

export const singleDoubleDrawnWorkersAPI = {
  getAll: async (): Promise<SingleDoubleDrawnWorker[]> => {
    const response = await api.get<SingleDoubleDrawnWorker[]>(
      "/singledoubledrawnworkers",
    );
    return response.data;
  },
  getByWarehouse: async (
    warehouseId: number,
  ): Promise<SingleDoubleDrawnWorker[]> => {
    const response = await api.get<SingleDoubleDrawnWorker[]>(
      `/singledoubledrawnworkers/warehouse/${warehouseId}`,
    );
    return response.data;
  },
  create: async (
    data: CreateSingleDoubleDrawnWorkerDto,
  ): Promise<SingleDoubleDrawnWorker> => {
    const response = await api.post<SingleDoubleDrawnWorker>(
      "/singledoubledrawnworkers",
      data,
    );
    return response.data;
  },
  update: async (
    id: number,
    data: UpdateSingleDoubleDrawnWorkerDto,
  ): Promise<void> => {
    await api.put(`/singledoubledrawnworkers/${id}`, data);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/singledoubledrawnworkers/${id}`);
  },
};

export const refinementAPI = {
  getAvailableCategories: async (): Promise<AvailablePurifiedCategory[]> => {
    const response = await api.get<AvailablePurifiedCategory[]>(
      "/refinement/available-categories",
    );
    return response.data;
  },
  getAll: async (): Promise<RefinementProcess[]> => {
    const response = await api.get<RefinementProcess[]>("/refinement");
    return response.data;
  },
  getRefinementRecords: async (): Promise<RefinementRecord[]> => {
    const response = await api.get<RefinementRecord[]>(
      "/refinement/refinement-records",
    );
    return response.data;
  },
  getRefiningProcesses: async (): Promise<RefiningProcess[]> => {
    const response = await api.get<RefiningProcess[]>(
      "/refinement/refining-processes",
    );
    return response.data;
  },
  create: async (
    data: CreateRefinementProcessDto,
  ): Promise<RefinementProcess> => {
    const response = await api.post<RefinementProcess>("/refinement", data);
    return response.data;
  },
  update: async (
    id: number,
    data: CreateRefinementProcessDto,
  ): Promise<void> => {
    await api.put(`/refinement/${id}`, data);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/refinement/${id}`);
  },
  updateRefiningProcess: async (
    id: number,
    data: CreateRefinementProcessDto,
  ): Promise<void> => {
    await api.put(`/refinement/refining-processes/${id}`, data);
  },
  deleteRefiningProcess: async (id: number): Promise<void> => {
    await api.delete(`/refinement/refining-processes/${id}`);
  },
  updateRefinementRecord: async (
    id: number,
    data: CreateRefinementProcessDto,
  ): Promise<void> => {
    await api.put(`/refinement/refinement-records/${id}`, data);
  },
  deleteRefinementRecord: async (id: number): Promise<void> => {
    await api.delete(`/refinement/refinement-records/${id}`);
  },
};

// Wash/Grading API
export const washGradingAPI = {
  getAvailableProducts: async (): Promise<AvailableProductDto[]> => {
    const response = await api.get<AvailableProductDto[]>(
      "/washgrading/available-products",
    );
    return response.data;
  },
  getAvailableForMessLabour: async (): Promise<WashGradingRecord[]> => {
    const response = await api.get<WashGradingRecord[]>(
      "/washgrading/available-for-messlabour",
    );
    return response.data;
  },
  getAll: async (): Promise<WashGradingProcess[]> => {
    const response = await api.get<WashGradingProcess[]>("/washgrading");
    return response.data;
  },
  getRecords: async (): Promise<WashGradingRecord[]> => {
    const response = await api.get<WashGradingRecord[]>("/washgrading/records");
    return response.data;
  },
  create: async (
    data: CreateWashGradingProcessDto,
  ): Promise<WashGradingProcess> => {
    const response = await api.post<WashGradingProcess>("/washgrading", data);
    return response.data;
  },
  createRecord: async (
    data: CreateWashGradingProcessDto,
  ): Promise<WashGradingRecord> => {
    const response = await api.post<WashGradingRecord>(
      "/washgrading/records",
      data,
    );
    return response.data;
  },
  update: async (
    id: number,
    data: CreateWashGradingProcessDto,
  ): Promise<void> => {
    await api.put(`/washgrading/${id}`, data);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/washgrading/${id}`);
  },
  updateRecord: async (
    id: number,
    data: CreateWashGradingProcessDto,
  ): Promise<void> => {
    await api.put(`/washgrading/records/${id}`, data);
  },
  deleteRecord: async (id: number): Promise<void> => {
    await api.delete(`/washgrading/records/${id}`);
  },
};

export const singleDoubleDrawnAPI = {
  getAll: async (
    refinementRecordId?: number,
  ): Promise<SingleDoubleDrawnRecord[]> => {
    const response = await api.get<SingleDoubleDrawnRecord[]>(
      "/singledoubledrawn",
      {
        params: refinementRecordId ? { refinementRecordId } : {},
      },
    );
    return response.data;
  },
  create: async (
    data: CreateSingleDoubleDrawnRecordDto,
  ): Promise<SingleDoubleDrawnRecord> => {
    const response = await api.post<SingleDoubleDrawnRecord>(
      "/singledoubledrawn",
      data,
    );
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/singledoubledrawn/${id}`);
  },
};

export const semiExportAPI = {
  getAll: async (): Promise<SemiExportRecord[]> => {
    const response = await api.get<SemiExportRecord[]>("/semiexport");
    return response.data;
  },
  getBySingleDoubleDrawn: async (
    id: number,
  ): Promise<SemiExportRecord | null> => {
    const response = await api.get<SemiExportRecord | null>(
      `/semiexport/by-singledoubledrawn/${id}`,
    );
    return response.data;
  },
  upsert: async (
    data: UpsertSemiExportRecordDto,
  ): Promise<SemiExportRecord> => {
    const response = await api.post<SemiExportRecord>("/semiexport", data);
    return response.data;
  },
  upsertPurchaseRecords: async (
    data: UpsertSemiExportPurchaseRecordsDto,
  ): Promise<SemiExportRecord[]> => {
    const response = await api.post<SemiExportRecord[]>(
      "/semiexport/purchase-records",
      data,
    );
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/semiexport/${id}`);
  },
};

export const ledgerAPI = {
  getAll: async (): Promise<LedgerDto[]> => {
    const response = await api.get<LedgerDto[]>("/ledger");
    return response.data;
  },
  create: async (data: CreateLedgerDto): Promise<LedgerDto> => {
    const response = await api.post<LedgerDto>("/ledger", data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/ledger/${id}`);
  },
};

export const exchangeRatesAPI = {
  getAll: async (): Promise<ExchangeRate[]> => {
    const response = await api.get<ExchangeRate[]>("/ExchangeRates");
    return response.data;
  },
  getActive: async (): Promise<ExchangeRate[]> => {
    const response = await api.get<ExchangeRate[]>("/ExchangeRates/active");
    return response.data;
  },
  create: async (data: CreateExchangeRateDto): Promise<ExchangeRate> => {
    const response = await api.post<ExchangeRate>("/ExchangeRates", data);
    return response.data;
  },
};

export const exportAPI = {
  getAll: async (): Promise<Export[]> => {
    const response = await api.get<Export[]>("/Export");
    return response.data;
  },
  getByLedger: async (ledgerId: number): Promise<Export[]> => {
    const response = await api.get<Export[]>(`/Export/by-ledger/${ledgerId}`);
    return response.data;
  },
  create: async (data: CreateExportDto): Promise<Export> => {
    const response = await api.post<Export>("/Export", data);
    return response.data;
  },
};

export const importedSemiExportAPI = {
  getAll: async (): Promise<any[]> => {
    const response = await api.get<any[]>("/ImportedSemiExport");
    return response.data;
  },
  create: async (data: any): Promise<any> => {
    const response = await api.post<any>("/ImportedSemiExport", data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/ImportedSemiExport/${id}`);
  },
};

export const semiExportPurchaseAPI = {
  getAll: async (): Promise<any[]> => {
    const response = await api.get<any[]>("/SemiExportPurchase");
    return response.data;
  },
  getByDate: async (fromDate: string, toDate: string): Promise<any[]> => {
    const response = await api.get<any[]>("/SemiExportPurchase/by-date", {
      params: { fromDate, toDate },
    });
    return response.data;
  },
  create: async (data: any): Promise<any> => {
    const response = await api.post<any>("/SemiExportPurchase", data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/SemiExportPurchase/${id}`);
  },
};

export const semiExportPurchaseProcessingAPI = {
  getAll: async (): Promise<any[]> => {
    const response = await api.get<any[]>("/SemiExportPurchaseProcessing");
    return response.data;
  },
  create: async (data: any): Promise<any> => {
    const response = await api.post<any>("/SemiExportPurchaseProcessing", data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/SemiExportPurchaseProcessing/${id}`);
  },
};

export const semiExportPurchaseRecordsAPI = {
  getAll: async (): Promise<any[]> => {
    const response = await api.get<any[]>("/SemiExportPurchaseRecords");
    return response.data;
  },
  create: async (data: any): Promise<any> => {
    const response = await api.post<any>("/SemiExportPurchaseRecords", data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/SemiExportPurchaseRecords/${id}`);
  },
};

// Reports API
export const reportsAPI = {
  getMarkersByDate: async (fromDate: string, toDate: string): Promise<MarkerByDateDto[]> => {
    const response = await api.get<MarkerByDateDto[]>("/reports/markers-by-date", {
      params: { fromDate, toDate },
    });
    return response.data;
  },
};

export default api;
export const cashFlowAPI = {
  getAll: async (placeId?: number, fromDate?: string, toDate?: string): Promise<any[]> => {
    const response = await api.get<any[]>("/cashFlow", { params: { placeId, fromDate, toDate } });
    return response.data;
  },
  downloadExcel: async (placeId?: number, fromDate?: string, toDate?: string): Promise<void> => {
    const response = await api.get("/cashFlow/download-excel", {
      params: { placeId, fromDate, toDate },
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    const cd = response.headers["content-disposition"] || "";
    const match = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    link.download = match ? match[1].replace(/['"]/g, "") : "CashFlow.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  getBreakdown: async (workerId: number | null, purifierId: number | null, workerName: string): Promise<any[]> => {
    const response = await api.get<any[]>("/cashFlow/breakdown", { params: { workerId, purifierId, workerName } });
    return response.data;
  },
  makePayment: async (data: {
    workerName: string;
    amount: number;
    note?: string;
  }): Promise<any> => {
    const response = await api.post<any>("/cashFlow/pay", data);
    return response.data;
  },
};

export const messLabourWorkersAPI = {
  getAll: async (): Promise<any[]> => {
    const response = await api.get<any[]>("/messlabourworkers");
    return response.data;
  },
  getByWarehouse: async (warehouseId: number): Promise<any[]> => {
    const response = await api.get<any[]>(
      `/messlabourworkers/warehouse/${warehouseId}`,
    );
    return response.data;
  },
  create: async (data: any): Promise<any> => {
    const response = await api.post<any>("/messlabourworkers", data);
    return response.data;
  },
  update: async (id: number, data: any): Promise<void> => {
    await api.put(`/messlabourworkers/${id}`, data);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/messlabourworkers/${id}`);
  },
};

export const pollAPI = {
  getVersion: async (): Promise<{ version: number }> => {
    const response = await api.get<{ version: number }>("/poll/version");
    return response.data;
  },
  getChanges: async (
    lastVersion: number,
    signal?: AbortSignal
  ): Promise<{ version: number; changed: boolean }> => {
    const response = await api.get<{ version: number; changed: boolean }>(
      "/poll/changes",
      {
        params: { lastVersion },
        signal,
      }
    );
    return response.data;
  },
};
