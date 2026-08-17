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
  Layers,
  Briefcase,
  Wrench,
} from "lucide-react";
import AnimatedBackground from "./AnimatedBackground";
import Logo from "../assets/Logo.png";
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
      <AnimatedBackground />
      <button className="mobile-toggle" onClick={toggleMobileMenu}>
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={closeMobileMenu}></div>
      )}

      <aside className={`app-sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="app-sidebar-header">
          <div className="app-sidebar-brand">
            <div className="app-sidebar-brand-icon" aria-hidden="true">
              <img src={Logo} alt="King Panthera Logo" className="app-sidebar-brand-logo-img" />
            </div>
            <div className="app-sidebar-title-group">

              <h2>King Panthera</h2>
              {user?.roleName && (
                <span className="app-role-badge-pill">{user.roleName}</span>
              )}
            </div>
          </div>
        </div>

        <nav className="app-sidebar-nav">
          {/* Main Menu Section */}
          <div className="app-nav-section-title">Main Overview</div>

          {hasPermission("Dashboard.View") && (
            <Link
              to="/dashboard"
              className={`app-nav-item ${isActive("/dashboard") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <LayoutDashboard className="app-nav-icon" size={20} />
              <span>Dashboard</span>
            </Link>
          )}

          {(hasPermission("Warehouse.View") ||
            hasPermission("Warehouse.Create") ||
            hasPermission("Warehouse.Edit") ||
            hasPermission("Warehouse.Delete")) && (
            <Link
              to="/warehouses"
              className={`app-nav-item ${isActive("/warehouses") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <Warehouse className="app-nav-icon" size={20} />
              <span>Warehouses</span>
            </Link>
          )}

          {(hasPermission("Inventory.View") ||
            hasPermission("Inventory.Create") ||
            hasPermission("Inventory.Edit") ||
            hasPermission("Inventory.Delete")) && (
            <Link
              to="/warehouse"
              className={`app-nav-item ${isActive("/warehouse") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <Warehouse className="app-nav-icon" size={20} />
              <span>Inventory</span>
            </Link>
          )}

          {/* Operations Section */}
          <div className="app-nav-section-title">Operations &amp; Processing</div>

          {(hasPermission("Sales.View") ||
            hasPermission("Sales.Create") ||
            hasPermission("Sales.Edit") ||
            hasPermission("Sales.Delete")) && (
            <Link
              to="/sales"
              className={`app-nav-item ${isActive("/sales") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <ShoppingCart className="app-nav-icon" size={20} />
              <span>Raw Material Sale List</span>
            </Link>
          )}

          {(hasPermission("WashGrading.View") ||
            hasPermission("WashGrading.Create")) && (
            <Link
              to="/wash-grading"
              className={`app-nav-item ${isActive("/wash-grading") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <Layers className="app-nav-icon" size={20} />
              <span>Wash/Grading</span>
            </Link>
          )}

          {hasPermission("MessLabour.View") && (
            <Link
              to="/mess-labour"
              className={`app-nav-item ${isActive("/mess-labour") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <Wrench className="app-nav-icon" size={20} />
              <span>Mess Labour</span>
            </Link>
          )}

          {hasPermission("Sales2.View") && (
            <Link
              to="/purification"
              className={`app-nav-item ${isActive("/purification") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <Layers className="app-nav-icon" size={20} />
              <span>Purification</span>
            </Link>
          )}

          {hasPermission("Refinement.View") && (
            <Link
              to="/refinement"
              className={`app-nav-item ${isActive("/refinement") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <Wrench className="app-nav-icon" size={20} />
              <span>Gridle-bush</span>
            </Link>
          )}

          {(hasPermission("SingleDoubleDrawn.View") ||
            hasPermission("SingleDoubleDrawn.Create")) && (
            <Link
              to="/single-double-drawn"
              className={`app-nav-item ${isActive("/single-double-drawn") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <TrendingUp className="app-nav-icon" size={20} />
              <span>Single &amp; Double Drawn</span>
            </Link>
          )}

          {hasPermission("SemiExportPurchase.View") && (
            <Link
              to="/semi-export-purchase"
              className={`app-nav-item ${isActive("/semi-export-purchase") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <ShoppingCart className="app-nav-icon" size={20} />
              <span>Semi Export Purchase</span>
            </Link>
          )}

          {hasPermission("SemiExport.View") && (
            <Link
              to="/semi-export"
              className={`app-nav-item ${isActive("/semi-export") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <Briefcase className="app-nav-icon" size={20} />
              <span>Semi Export</span>
            </Link>
          )}

          {hasPermission("Sales6.View") && (
            <Link
              to="/sales6"
              className={`app-nav-item ${isActive("/sales6") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <ShoppingCart className="app-nav-icon" size={20} />
              <span>Export List</span>
            </Link>
          )}

          {/* Finance & Reports Section */}
          <div className="app-nav-section-title">Finance &amp; Analytics</div>

          {hasPermission("CashFlow.View") && (
            <Link
              to="/cash-flow"
              className={`app-nav-item ${isActive("/cash-flow") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <DollarSign className="app-nav-icon" size={20} />
              <span>Cash Flow</span>
            </Link>
          )}

          {hasPermission("Dashboard.View") && (
            <Link
              to="/report"
              className={`app-nav-item ${isActive("/report") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <TrendingUp className="app-nav-icon" size={20} />
              <span>Reports</span>
            </Link>
          )}

          {/* Administration Section */}
          <div className="app-nav-section-title">Administration</div>

          {hasPermission("Staff.View") && (
            <Link
              to="/staff"
              className={`app-nav-item ${isActive("/staff") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <Users className="app-nav-icon" size={20} />
              <span>Staff</span>
            </Link>
          )}

          {hasPermission("Workers.View") && (
            <Link
              to="/workers"
              className={`app-nav-item ${isActive("/workers") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <Users className="app-nav-icon" size={20} />
              <span>Workers</span>
            </Link>
          )}

          {hasPermission("Permissions.Manage") && (
            <Link
              to="/permissions"
              className={`app-nav-item ${isActive("/permissions") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <Shield className="app-nav-icon" size={20} />
              <span>Permissions</span>
            </Link>
          )}

          {hasPermission("Permissions.Manage") && (
            <Link
              to="/exchange-rates"
              className={`app-nav-item ${isActive("/exchange-rates") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <DollarSign className="app-nav-icon" size={20} />
              <span>Exchange Rates</span>
            </Link>
          )}

          {user?.roleName === "Owner" && (
            <Link
              to="/audit-logs"
              className={`app-nav-item ${isActive("/audit-logs") ? "active" : ""}`}
              onClick={closeMobileMenu}
            >
              <Shield className="app-nav-icon" size={20} />
              <span>Audit Logs</span>
            </Link>
          )}
        </nav>

        <div className="app-sidebar-footer">
          <div className="app-user-info">
            <div className="app-user-avatar">
              {user?.fullName?.charAt(0) || "U"}
            </div>
            <div className="app-user-details">
              <p className="app-user-name">{user?.fullName}</p>
              <p className="app-user-email">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="app-logout-btn">
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
