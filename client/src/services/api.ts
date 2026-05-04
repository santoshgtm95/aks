import axios from 'axios';
import type { LoginRequest, LoginResponse, Product, CreateProductDto, Sale, CreateSaleDto, DashboardStats, User, CreateUserDto, UpdateUserDto, Role, ProcessingRecord, CreateProcessingRecordDto, Worker, Warehouse, CreateWarehouseDto, UpdateWarehouseDto } from '../types';

const API_BASE_URL = 'http://localhost:5159/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
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
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: async (data: LoginRequest): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>('/auth/login', data);
        return response.data;
    },
    changePassword: async (currentPassword: string, newPassword: string) => {
        const response = await api.post('/auth/change-password', {
            currentPassword,
            newPassword,
        });
        return response.data;
    },
};

// Products API
export const productsAPI = {
    getAll: async (all = false): Promise<Product[]> => {
        const response = await api.get<Product[]>('/products', { params: { all } });
        return response.data;
    },
    getById: async (id: number): Promise<Product> => {
        const response = await api.get<Product>(`/products/${id}`);
        return response.data;
    },
    create: async (data: CreateProductDto): Promise<Product> => {
        const response = await api.post<Product>('/products', data);
        return response.data;
    },
    update: async (id: number, data: Partial<CreateProductDto>): Promise<void> => {
        await api.put(`/products/${id}`, data);
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/products/${id}`);
    },
};

// Sales API
export const salesAPI = {
    getAll: async (category?: string): Promise<Sale[]> => {
        const response = await api.get<Sale[]>('/sales', {
            params: { category }
        });
        return response.data;
    },
    getById: async (id: number): Promise<Sale> => {
        const response = await api.get<Sale>(`/sales/${id}`);
        return response.data;
    },
    create: async (data: CreateSaleDto): Promise<Sale> => {
        const response = await api.post<Sale>('/sales', data);
        return response.data;
    },
};

// Processing API
export const processingAPI = {
    getAll: async (): Promise<ProcessingRecord[]> => {
        const response = await api.get<ProcessingRecord[]>('/processing');
        return response.data;
    },
    create: async (data: CreateProcessingRecordDto): Promise<ProcessingRecord> => {
        const response = await api.post<ProcessingRecord>('/processing', data);
        return response.data;
    },
    update: async (id: number, data: CreateProcessingRecordDto): Promise<ProcessingRecord> => {
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
        const response = await api.get<Worker[]>('/workers');
        return response.data;
    },
    create: async (data: Partial<Worker>): Promise<Worker> => {
        const response = await api.post<Worker>('/workers', data);
        return response.data;
    },
};

// Dashboard API
export const dashboardAPI = {
    getStats: async (): Promise<DashboardStats> => {
        const response = await api.get<DashboardStats>('/dashboard/stats');
        return response.data;
    },
};

// Users API
export const usersAPI = {
    getAll: async (): Promise<User[]> => {
        const response = await api.get<User[]>('/users');
        return response.data;
    },
    getById: async (id: number): Promise<User> => {
        const response = await api.get<User>(`/users/${id}`);
        return response.data;
    },
    create: async (data: CreateUserDto): Promise<User> => {
        const response = await api.post<User>('/users', data);
        return response.data;
    },
    update: async (id: number, data: UpdateUserDto): Promise<void> => {
        await api.put(`/users/${id}`, data);
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/users/${id}`);
    },
    getRoles: async (): Promise<Role[]> => {
        const response = await api.get<Role[]>('/users/roles');
        return response.data;
    },
    getPermissions: async (id: number): Promise<number[]> => {
        const response = await api.get<number[]>(`/users/${id}/permissions`);
        return response.data;
    },
    updatePermissions: async (id: number, permissionIds: number[]): Promise<void> => {
        await api.post(`/users/${id}/permissions`, { permissionIds });
    },
};

// Permissions API
export const permissionsAPI = {
    getAll: async (): Promise<any[]> => {
        const response = await api.get<any[]>('/permissions');
        return response.data;
    },
};

// Warehouses API
export const warehousesAPI = {
    getAll: async (): Promise<Warehouse[]> => {
        const response = await api.get<Warehouse[]>('/warehouses');
        return response.data;
    },
    getById: async (id: number): Promise<Warehouse> => {
        const response = await api.get<Warehouse>(`/warehouses/${id}`);
        return response.data;
    },
    create: async (data: CreateWarehouseDto): Promise<Warehouse> => {
        const response = await api.post<Warehouse>('/warehouses', data);
        return response.data;
    },
    update: async (id: number, data: UpdateWarehouseDto): Promise<void> => {
        await api.put(`/warehouses/${id}`, data);
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/warehouses/${id}`);
    },
};

export default api;
