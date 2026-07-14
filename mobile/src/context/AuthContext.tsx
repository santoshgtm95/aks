import React, { createContext, useContext, useState, useEffect } from "react";
import type { User, LoginRequest } from "../types";
import { authAPI, setOnUnauthorized } from "../services/api";
import { storage } from "../services/storage";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = await storage.getItem("token");
      const storedUser = await storage.getItem("user");

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Failed to parse stored user:", error);
          await storage.deleteItem("token");
          await storage.deleteItem("user");
        }
      }
      setLoading(false);
    };

    initializeAuth();

    // Hook up unauthorized 401 callback to trigger automatic logout
    setOnUnauthorized(async () => {
      setToken(null);
      setUser(null);
    });
  }, []);

  const login = async (credentials: LoginRequest) => {
    const response = await authAPI.login(credentials);
    setToken(response.token);
    setUser(response.user);
    await storage.setItem("token", response.token);
    await storage.setItem("user", JSON.stringify(response.user));
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {} // ignore
    setToken(null);
    setUser(null);
    await storage.deleteItem("token");
    await storage.deleteItem("user");
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions.includes(permission) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        loading,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
