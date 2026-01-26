import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Warehouse from './pages/Warehouse';
import Sales from './pages/Sales';
import Staff from './pages/Staff';

import Sales1 from './pages/Sales1';
import Sales2 from './pages/Sales2';
import Sales3 from './pages/Sales3';
import Sales4 from './pages/Sales4';
import Sales5 from './pages/Sales5';
import Sales6 from './pages/Sales6';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="spinner"></div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
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
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="warehouse" element={<Warehouse />} />
            <Route path="sales" element={<Sales />} />
            <Route path="sales1" element={<Sales1 />} />
            <Route path="sales2" element={<Sales2 />} />
            <Route path="sales3" element={<Sales3 />} />
            <Route path="sales4" element={<Sales4 />} />
            <Route path="sales5" element={<Sales5 />} />
            <Route path="sales6" element={<Sales6 />} />
            <Route path="staff" element={<Staff />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
