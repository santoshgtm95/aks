import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login/index';
import Dashboard from './pages/Dashboard/index';
import Inventory from './pages/Inventory/index';
import WarehouseManagement from './pages/WarehouseManagement/index';
import Sales from './pages/Sales/index';
import Staff from './pages/Staff/index';
import PermissionManagement from './pages/PermissionManagement/index';

import Sales1 from './pages/Sales1/index';
import Purification from './pages/Purification/index';
import PurifierManagement from './pages/PurifierManagement/index';
import Sales3 from './pages/Sales3/index';
import Sales4 from './pages/Sales4/index';
import Sales5 from './pages/Sales5/index';
import Sales6 from './pages/Sales6/index';

const ProtectedRoute: React.FC<{ children: React.ReactNode; permission?: string }> = ({ children, permission }) => {
  const { isAuthenticated, hasPermission, loading } = useAuth();

  if (loading) {
    return <div className="spinner"></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" />} />
            <Route 
              path="dashboard" 
              element={
                <ProtectedRoute permission="Dashboard.View">
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="warehouse" 
              element={
                <ProtectedRoute permission="Inventory.View">
                  <Inventory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="warehouses" 
              element={
                <ProtectedRoute permission="Warehouse.View">
                  <WarehouseManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="purifiers" 
              element={
                <ProtectedRoute permission="Warehouse.View">
                  <PurifierManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="sales" 
              element={
                <ProtectedRoute permission="Sales.View">
                  <Sales />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="sales1" 
              element={
                <ProtectedRoute permission="Sales1.View">
                  <Sales1 />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="purification" 
              element={
                <ProtectedRoute permission="Sales2.View">
                  <Purification />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="sales3" 
              element={
                <ProtectedRoute permission="Sales3.View">
                  <Sales3 />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="sales4" 
              element={
                <ProtectedRoute permission="Sales4.View">
                  <Sales4 />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="sales5" 
              element={
                <ProtectedRoute permission="Sales5.View">
                  <Sales5 />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="sales6" 
              element={
                <ProtectedRoute permission="Sales6.View">
                  <Sales6 />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="staff" 
              element={
                <ProtectedRoute permission="Staff.View">
                  <Staff />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="permissions" 
              element={
                <ProtectedRoute permission="Permissions.Manage">
                  <PermissionManagement />
                </ProtectedRoute>
              } 
            />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
