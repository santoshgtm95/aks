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
  Purifier,
  CreatePurifierDto,
  UpdatePurifierDto,
  RefinementWorker,
  CreateRefinementWorkerDto,
  UpdateRefinementWorkerDto,
  PurifiedRecord,
  AvailablePurifiedCategory,
  RefinementProcess,
  RefinementRecord,
  CreateRefinementProcessDto,
  SingleDoubleDrawnRecord,
  CreateSingleDoubleDrawnRecordDto,
  SemiExportRecord,
  UpsertSemiExportRecordDto,
  LedgerDto,
  CreateLedgerDto,
  ExchangeRate,
  CreateExchangeRateDto,
  Export,
  CreateExportDto,
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
  create: async (data: Partial<Worker>): Promise<Worker> => {
    const response = await api.post<Worker>("/workers", data);
    return response.data;
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

export default api;
