import axios from 'axios';
import type { LoginRequest, LoginResponse, Product, CreateProductDto, Sale, CreateSaleDto, DashboardStats, User, CreateUserDto, Role } from '../types';

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
    getAll: async (): Promise<Product[]> => {
        const response = await api.get<Product[]>('/products');
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
    getAll: async (): Promise<Sale[]> => {
        const response = await api.get<Sale[]>('/sales');
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
    update: async (id: number, data: Partial<CreateUserDto>): Promise<void> => {
        await api.put(`/users/${id}`, data);
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/users/${id}`);
    },
    getRoles: async (): Promise<Role[]> => {
        const response = await api.get<Role[]>('/users/roles');
        return response.data;
    },
};

export default api;
