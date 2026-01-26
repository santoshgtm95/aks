import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../services/api';
import type { DashboardStats } from '../types';
import { Package, CheckCircle2, Scale, TrendingUp, ShoppingCart, AlertTriangle } from 'lucide-react';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await dashboardAPI.getStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="spinner"></div>;
    }

    return (
        <div className="dashboard fade-in">
            <h1 className="page-title">Dashboard</h1>

            <div className="stats-grid">
                <div className="stat-card stat-primary">
                    <div className="stat-icon-wrapper">
                        <Package className="stat-icon-svg" size={32} />
                    </div>
                    <div className="stat-content">
                        <h3>{stats?.totalProducts || 0}</h3>
                        <p>Total Products</p>
                    </div>
                </div>

                <div className="stat-card stat-success">
                    <div className="stat-icon-wrapper">
                        <CheckCircle2 className="stat-icon-svg" size={32} />
                    </div>
                    <div className="stat-content">
                        <h3>{stats?.activeProducts || 0}</h3>
                        <p>Active Products</p>
                    </div>
                </div>

                <div className="stat-card stat-info">
                    <div className="stat-icon-wrapper">
                        <Scale className="stat-icon-svg" size={32} />
                    </div>
                    <div className="stat-content">
                        <h3>{stats?.totalInventoryWeight.toFixed(2) || 0}</h3>
                        <p>Total Inventory (kg)</p>
                    </div>
                </div>

                <div className="stat-card stat-warning">
                    <div className="stat-icon-wrapper">
                        <TrendingUp className="stat-icon-svg" size={32} />
                    </div>
                    <div className="stat-content">
                        <h3>{stats?.totalSales || 0}</h3>
                        <p>Total Sales</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header">
                        <ShoppingCart className="card-icon" size={24} />
                        <h2 className="card-title">Recent Sales</h2>
                    </div>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Product</th>
                                    <th>Weight</th>
                                    <th>Price</th>
                                    <th>Seller</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.recentSales.slice(0, 5).map((sale) => (
                                    <tr key={sale.id}>
                                        <td>{new Date(sale.date).toLocaleDateString()}</td>
                                        <td>{sale.productMarker}</td>
                                        <td>{sale.weight} {sale.unit}</td>
                                        <td>{sale.price} {sale.currency}</td>
                                        <td>{sale.sellerName}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <AlertTriangle className="card-icon warning-icon" size={24} />
                        <h2 className="card-title">Low Stock Alert</h2>
                    </div>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Marker</th>
                                    <th>Remaining</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.lowStockProducts.slice(0, 5).map((product) => (
                                    <tr key={product.id}>
                                        <td>{product.marker}</td>
                                        <td>{product.remainingWeight} {product.unit}</td>
                                        <td>
                                            <span className="badge badge-warning">Low Stock</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="sales-summary card">
                <h2 className="card-title">Sales Summary</h2>
                <div className="summary-grid">
                    <div className="summary-item">
                        <p className="summary-label">Today's Sales</p>
                        <h3 className="summary-value">{stats?.todaySales || 0}</h3>
                    </div>
                    <div className="summary-item">
                        <p className="summary-label">Today's Revenue</p>
                        <h3 className="summary-value">{stats?.todaySalesAmount.toFixed(2) || 0} MMK</h3>
                    </div>
                    <div className="summary-item">
                        <p className="summary-label">Total Revenue</p>
                        <h3 className="summary-value">{stats?.totalSalesAmount.toFixed(2) || 0} MMK</h3>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
