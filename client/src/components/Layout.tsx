import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { exchangeRatesAPI } from "../services/api";
import type { ExchangeRate } from "../types";
import {
  LayoutDashboard,
  Warehouse,
  ShoppingCart,
  Users,
  LogOut,
  Menu,
  X,
  Shield,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import "./Layout.css";

const Layout: React.FC = () => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeRates, setActiveRates] = useState<ExchangeRate[]>([]);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const data = await exchangeRatesAPI.getActive();
        setActiveRates(data);
      } catch (error) {
        console.error("Failed to fetch active exchange rates", error);
      }
    };
    fetchRates();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="layout">
      <button className="mobile-toggle" onClick={toggleMobileMenu}>
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={closeMobileMenu}></div>
      )}

      <aside className={`sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <h2>AKZ System</h2>
          <p>{user?.roleName}</p>
        </div>

        <nav className="sidebar-nav">
          {hasPermission("Dashboard.View") && (
            <Link
              to="/dashboard"
              className={`nav-item ${isActive("/dashboard") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <LayoutDashboard className="nav-icon" size={24} />
              Dashboard
            </Link>
          )}
          {(hasPermission("Warehouse.View") ||
            hasPermission("Warehouse.Create") ||
            hasPermission("Warehouse.Edit") ||
            hasPermission("Warehouse.Delete")) && (
            <>
              <Link
                to="/warehouses"
                className={`nav-item ${isActive("/warehouses") ? "active" : ""}`}
                onClick={closeMobileMenu}
              >
                <Warehouse className="nav-icon" size={24} />
                Warehouses
              </Link>
            </>
          )}

          {(hasPermission("Inventory.View") ||
            hasPermission("Inventory.Create") ||
            hasPermission("Inventory.Edit") ||
            hasPermission("Inventory.Delete")) && (
            <Link
              to="/warehouse"
              className={`nav-item ${isActive("/warehouse") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <ShoppingCart className="nav-icon" size={24} />
              Inventory
            </Link>
          )}
          {(hasPermission("Sales.View") || hasPermission("Sales.Create")) && (
            <Link
              to="/sales"
              className={`nav-item ${isActive("/sales") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <ShoppingCart className="nav-icon" size={24} />
              Raw Material Sale List
            </Link>
          )}

          {(hasPermission("MessLabour.View") ||
            hasPermission("MessLabour.Create")) && (
            <Link
              to="/mess-labour"
              className={`nav-item ${isActive("/mess-labour") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <ShoppingCart className="nav-icon" size={24} />
              Mess-Labour List
            </Link>
          )}

          {(hasPermission("Sales2.View") || hasPermission("Sales2.Create")) && (
            <Link
              to="/purification"
              className={`nav-item ${isActive("/purification") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <ShoppingCart className="nav-icon" size={24} />
              Purification
            </Link>
          )}

          {(hasPermission("Refinement.View") ||
            hasPermission("Refinement.Create")) && (
            <Link
              to="/refinement"
              className={`nav-item ${isActive("/refinement") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <ShoppingCart className="nav-icon" size={24} />
              Girdle-bush List
            </Link>
          )}

          {(hasPermission("SingleDoubleDrawn.View") ||
            hasPermission("SingleDoubleDrawn.Create")) && (
            <Link
              to="/single-double-drawn"
              className={`nav-item ${isActive("/single-double-drawn") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <ShoppingCart className="nav-icon" size={24} />
              Single & Double Drawn List
            </Link>
          )}

          {(hasPermission("Sales5.View") || hasPermission("Sales5.Create")) && (
            <Link
              to="/sales5"
              className={`nav-item ${isActive("/sales5") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <ShoppingCart className="nav-icon" size={24} />
              Semi Export
            </Link>
          )}

          {(hasPermission("Sales6.View") || hasPermission("Sales6.Create")) && (
            <Link
              to="/sales6"
              className={`nav-item ${isActive("/sales6") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <ShoppingCart className="nav-icon" size={24} />
              Export List
            </Link>
          )}

          {(hasPermission("Staff.View") || hasPermission("Staff.Create")) && (
            <Link
              to="/staff"
              className={`nav-item ${isActive("/staff") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <Users className="nav-icon" size={24} />
              Staff
            </Link>
          )}

          {hasPermission("Permissions.Manage") && (
            <Link
              to="/permissions"
              className={`nav-item ${isActive("/permissions") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <Shield className="nav-icon" size={24} />
              Permissions
            </Link>
          )}

          {hasPermission("Permissions.Manage") && (
            <Link
              to="/exchange-rates"
              className={`nav-item ${isActive("/exchange-rates") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <DollarSign className="nav-icon" size={24} />
              Exchange Rates
            </Link>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.fullName.charAt(0)}</div>
            <div className="user-details">
              <p className="user-name">{user?.fullName}</p>
              <p className="user-email">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-danger btn-block">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
        {(isActive("/dashboard") || isActive("/")) && (
          <div className="bottom-rates-widget">
            <div className="rates-container">
              <TrendingUp size={18} className="rates-icon" />
              <span className="rates-label">Current Rates:</span>
              {activeRates.map((rate) => (
                <span key={rate.id} className="rate-badge">
                  <span className="rate-currency">1 {rate.fromCurrency}</span> ={" "}
                  <span className="rate-value">
                    {rate.rate.toLocaleString()} MMK
                  </span>
                </span>
              ))}
              {activeRates.length === 0 && (
                <span className="rate-empty">No active rates</span>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Layout;
