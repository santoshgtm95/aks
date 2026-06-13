import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import Layout from "./components/Layout";
import Login from "./pages/Login/index";
import Dashboard from "./pages/Dashboard/index";
import Inventory from "./pages/Inventory/index";
import WarehouseManagement from "./pages/WarehouseManagement/index";
import Sales from "./pages/Sales/index";
import Staff from "./pages/Staff/index";
import PermissionManagement from "./pages/PermissionManagement/index";

import MessLabour from "./pages/MessLabour/index";
import Purification from "./pages/Purification/index";
import PurifierManagement from "./pages/PurifierManagement/index";
import Refinement from "./pages/Refinement/index";
import RefinementWorkerManagement from "./pages/RefinementWorkerManagement/index";
import MessLabourWorkerManagement from "./pages/MessLabourWorkerManagement/index";
import SingleDoubleDrawnWorkerManagement from "./pages/SingleDoubleDrawnWorkerManagement/index";
import SingleDoubleDrawn from "./pages/SingleDoubleDrawn/index";
import SemiExport from "./pages/SemiExport/index";
import Sales6 from "./pages/Sales6/index";
import ExchangeRates from "./pages/ExchangeRates/index";
import CashFlow from "./pages/CashFlow/index";
import AuditLogs from "./pages/AuditLogs/index";

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  permission?: string;
  adminOnly?: boolean;
}> = ({ children, permission, adminOnly }) => {
  const { user, isAuthenticated, hasPermission, loading } = useAuth();

  if (loading) {
    return <div className="spinner"></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user?.roleName !== "Owner") {
    return <Navigate to="/dashboard" />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
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
                path="single-double-drawn-workers"
                element={
                  <ProtectedRoute permission="Warehouse.View">
                    <SingleDoubleDrawnWorkerManagement />
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
                path="mess-labour"
                element={
                  <ProtectedRoute permission="MessLabour.View">
                    <MessLabour />
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
                path="refinement"
                element={
                  <ProtectedRoute permission="Refinement.View">
                    <Refinement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="refinement-workers"
                element={
                  <ProtectedRoute permission="Warehouse.View">
                    <RefinementWorkerManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="mess-labour-workers"
                element={
                  <ProtectedRoute permission="Warehouse.View">
                    <MessLabourWorkerManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="single-double-drawn"
                element={
                  <ProtectedRoute permission="SingleDoubleDrawn.View">
                    <SingleDoubleDrawn />
                  </ProtectedRoute>
                }
              />
              <Route
                path="semi-export"
                element={
                  <ProtectedRoute permission="SemiExport.View">
                    <SemiExport />
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
                path="cash-flow"
                element={
                  <ProtectedRoute permission="Staff.View">
                    <CashFlow />
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
              <Route
                path="exchange-rates"
                element={
                  <ProtectedRoute permission="Permissions.Manage">
                    <ExchangeRates />
                  </ProtectedRoute>
                }
              />
              <Route
                path="audit-logs"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
