import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Warehouse, ShoppingCart, Users, LogOut, Menu, X } from 'lucide-react';
import './Layout.css';

const Layout: React.FC = () => {
    const { user, logout } = useAuth();
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
                    <Link
                        to="/dashboard"
                        className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
                        onClick={closeMobileMenu}
                    >
                        <LayoutDashboard className="nav-icon" size={24} />
                        Dashboard
                    </Link>

                    <Link
                        to="/warehouse"
                        className={`nav-item ${isActive('/warehouse') ? 'active' : ''}`}
                        onClick={closeMobileMenu}
                    >
                        <Warehouse className="nav-icon" size={24} />
                        Warehouse
                    </Link>

                    <Link
                        to="/sales"
                        className={`nav-item ${isActive('/sales') ? 'active' : ''}`}
                        onClick={closeMobileMenu}
                    >
                        <ShoppingCart className="nav-icon" size={24} />
                        အပွရောင်းစာရင်း
                    </Link>
                    <Link
                        to="/sales1"
                        className={`nav-item ${isActive('/sales1') ? 'active' : ''}`}
                        onClick={closeMobileMenu}
                    >
                        <ShoppingCart className="nav-icon" size={24} />
                        အပွရွေးစာရင်း
                    </Link>

                    <Link
                        to="/sales2"
                        className={`nav-item ${isActive('/sales2') ? 'active' : ''}`}
                        onClick={closeMobileMenu}
                    >
                        <ShoppingCart className="nav-icon" size={24} />
                        အပွရုံစာရင်း
                    </Link>

                    <Link
                        to="/sales3"
                        className={`nav-item ${isActive('/sales3') ? 'active' : ''}`}
                        onClick={closeMobileMenu}
                    >
                        <ShoppingCart className="nav-icon" size={24} />
                        ခါးစီး/အကြမ်းရိုက်စာရင်း
                    </Link>

                    <Link
                        to="/sales4"
                        className={`nav-item ${isActive('/sales4') ? 'active' : ''}`}
                        onClick={closeMobileMenu}
                    >
                        <ShoppingCart className="nav-icon" size={24} />
                        အချောဆွဲစာရင်း
                    </Link>

                    <Link
                        to="/sales5"
                        className={`nav-item ${isActive('/sales5') ? 'active' : ''}`}
                        onClick={closeMobileMenu}
                    >
                        <ShoppingCart className="nav-icon" size={24} />
                        Semi Export
                    </Link>

                    <Link
                        to="/sales6"
                        className={`nav-item ${isActive('/sales6') ? 'active' : ''}`}
                        onClick={closeMobileMenu}
                    >
                        <ShoppingCart className="nav-icon" size={24} />
                        Export စာရင်း
                    </Link>

                    <Link
                        to="/staff"
                        className={`nav-item ${isActive('/staff') ? 'active' : ''}`}
                        onClick={closeMobileMenu}
                    >
                        <Users className="nav-icon" size={24} />
                        Staff
                    </Link>
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
