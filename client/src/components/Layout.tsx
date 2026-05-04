import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Warehouse, ShoppingCart, Users, LogOut, Menu, X, Shield } from 'lucide-react';
import './Layout.css';

const Layout: React.FC = () => {
    const { user, logout, hasPermission } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
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

            {isMobileMenuOpen && <div className="mobile-overlay" onClick={closeMobileMenu}></div>}

            <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <h2>AKZ System</h2>
                    <p>{user?.roleName}</p>
                </div>

                <nav className="sidebar-nav">
                    {hasPermission('Dashboard.View') && (
                        <Link
                            to="/dashboard"
                            className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
                            onClick={closeMobileMenu}
                        >
                            <LayoutDashboard className="nav-icon" size={24} />
                            Dashboard
                        </Link>
                    )}

                    {(hasPermission('Inventory.View') || hasPermission('Inventory.Create') || hasPermission('Inventory.Edit') || hasPermission('Inventory.Delete')) && (
                        <Link
                            to="/warehouse"
                            className={`nav-item ${isActive('/warehouse') ? 'active' : ''}`}
                            onClick={closeMobileMenu}
                        >
                            <ShoppingCart className="nav-icon" size={24} />
                            Inventory
                        </Link>
                    )}
                    {(hasPermission('Sales.View') || hasPermission('Sales.Create')) && (
                        <Link
                            to="/sales"
                            className={`nav-item ${isActive('/sales') ? 'active' : ''}`}
                            onClick={closeMobileMenu}
                        >
                            <ShoppingCart className="nav-icon" size={24} />
                            အပွရောင်းစာရင်း
                        </Link>
                    )}

                    {(hasPermission('Sales1.View') || hasPermission('Sales1.Create')) && (
                        <Link
                            to="/sales1"
                            className={`nav-item ${isActive('/sales1') ? 'active' : ''}`}
                            onClick={closeMobileMenu}
                        >
                            <ShoppingCart className="nav-icon" size={24} />
                            အပွရွေးစာရင်း
                        </Link>
                    )}

                    {(hasPermission('Sales2.View') || hasPermission('Sales2.Create')) && (
                        <Link
                            to="/purification"
                            className={`nav-item ${isActive('/purification') ? 'active' : ''}`}
                            onClick={closeMobileMenu}
                        >
                            <ShoppingCart className="nav-icon" size={24} />
                            Purification
                        </Link>
                    )}

                    {(hasPermission('Sales3.View') || hasPermission('Sales3.Create')) && (
                        <Link
                            to="/sales3"
                            className={`nav-item ${isActive('/sales3') ? 'active' : ''}`}
                            onClick={closeMobileMenu}
                        >
                            <ShoppingCart className="nav-icon" size={24} />
                            ခါးစီး/အကြမ်းရိုက်စာရင်း
                        </Link>
                    )}

                    {(hasPermission('Sales4.View') || hasPermission('Sales4.Create')) && (
                        <Link
                            to="/sales4"
                            className={`nav-item ${isActive('/sales4') ? 'active' : ''}`}
                            onClick={closeMobileMenu}
                        >
                            <ShoppingCart className="nav-icon" size={24} />
                            အချောဆွဲစာရင်း
                        </Link>
                    )}

                    {(hasPermission('Sales5.View') || hasPermission('Sales5.Create')) && (
                        <Link
                            to="/sales5"
                            className={`nav-item ${isActive('/sales5') ? 'active' : ''}`}
                            onClick={closeMobileMenu}
                        >
                            <ShoppingCart className="nav-icon" size={24} />
                            Semi Export
                        </Link>
                    )}

                    {(hasPermission('Sales6.View') || hasPermission('Sales6.Create')) && (
                        <Link
                            to="/sales6"
                            className={`nav-item ${isActive('/sales6') ? 'active' : ''}`}
                            onClick={closeMobileMenu}
                        >
                            <ShoppingCart className="nav-icon" size={24} />
                            Export စာရင်း
                        </Link>
                    )}

                    {(hasPermission('Warehouse.View') || hasPermission('Warehouse.Create') || hasPermission('Warehouse.Edit') || hasPermission('Warehouse.Delete')) && (
                        <>
                            <Link
                                to="/warehouses"
                                className={`nav-item ${isActive('/warehouses') ? 'active' : ''}`}
                                onClick={closeMobileMenu}
                            >
                                <Warehouse className="nav-icon" size={24} />
                                Warehouses
                            </Link>
                        </>
                    )}

                    {(hasPermission('Staff.View') || hasPermission('Staff.Create')) && (
                        <Link
                            to="/staff"
                            className={`nav-item ${isActive('/staff') ? 'active' : ''}`}
                            onClick={closeMobileMenu}
                        >
                            <Users className="nav-icon" size={24} />
                            Staff
                        </Link>
                    )}

                    {hasPermission('Permissions.Manage') && (
                        <Link
                            to="/permissions"
                            className={`nav-item ${isActive('/permissions') ? 'active' : ''}`}
                            onClick={closeMobileMenu}
                        >
                            <Shield className="nav-icon" size={24} />
                            Permissions
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
            </main>
        </div>
    );
};

export default Layout;
