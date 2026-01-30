import React, { useEffect, useState } from 'react';
import { salesAPI, productsAPI } from '../services/api';
import type { Sale, Product, CreateSaleDto } from '../types';
import './Sales6.css';

const PAGE_CATEGORY = 'Sales6';

const Sales6: React.FC = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<CreateSaleDto>({
        date: new Date().toISOString().split('T')[0],
        productId: 0,
        marker: '',
        unit: 'kg',
        weight: 0,
        price: 0,
        currency: 'MMK',
        category: PAGE_CATEGORY,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [salesData, productsData] = await Promise.all([
                salesAPI.getAll(PAGE_CATEGORY),
                productsAPI.getAll(),
            ]);
            setSales(salesData);
            setProducts(productsData.filter(p => p.remainingWeight > 0));
        } catch (error) {
            console.error('Failed to load sales data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'productId') {
            const selectedProduct = products.find(p => p.id === parseInt(value));
            if (selectedProduct) {
                setFormData(prev => ({
                    ...prev,
                    productId: selectedProduct.id,
                    marker: selectedProduct.marker,
                    unit: selectedProduct.unit,
                    price: selectedProduct.price,
                    currency: selectedProduct.currency,
                }));
            }
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: name === 'weight' || name === 'price'
                    ? (value === '' ? 0 : parseFloat(value))
                    : value,
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await salesAPI.create(formData);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                productId: 0,
                marker: '',
                unit: 'kg',
                weight: 0,
                price: 0,
                currency: 'MMK',
                category: PAGE_CATEGORY,
            });
            loadData();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to create sale');
        }
    };

    const getRemainingAfterSale = () => {
        const product = products.find(p => p.id === formData.productId);
        if (!product) return 0;
        return product.remainingWeight - formData.weight;
    };

    if (loading) {
        return <div className="spinner"></div>;
    }

    return (
        <div className="sales fade-in">
            <h1 className="page-title">Sales6</h1>

            <div className="card registration-card">
                <h2 className="card-title">New Sale Transaction</h2>
                <form onSubmit={handleSubmit} className="sale-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Date</label>
                            <input
                                type="date"
                                name="date"
                                className="form-control"
                                value={formData.date}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Select Product (Marker)</label>
                            <select
                                name="productId"
                                className="form-select"
                                value={formData.productId}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="0">-- Select Product --</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.marker} ({p.remainingWeight} {p.unit} available)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Weight to Sell</label>
                            <input
                                type="number"
                                name="weight"
                                step="0.01"
                                className="form-control"
                                value={formData.weight || ''}
                                onChange={handleInputChange}
                                required
                                min="0.01"
                                placeholder="0"
                                onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Price</label>
                            <div className="price-input-group">
                                <input
                                    type="number"
                                    name="price"
                                    step="0.01"
                                    className="form-control"
                                    value={formData.price || ''}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="0"
                                    onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                                />
                                <select
                                    name="currency"
                                    className="form-select currency-select"
                                    value={formData.currency}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="MMK">MMK</option>
                                    <option value="CNY">CNY</option>
                                    <option value="INR">INR</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Total Remaining (After Sale)</label>
                            <input
                                type="text"
                                className="form-control"
                                value={`${getRemainingAfterSale().toFixed(2)} ${formData.unit}`}
                                disabled
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                            Complete Sale
                        </button>
                    </div>
                </form>
            </div>

            <div className="card list-card">
                <h2 className="card-title">Sales History</h2>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Marker</th>
                                <th>Weight</th>
                                <th>Price</th>
                                <th>Total</th>
                                <th>Seller</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map((sale) => (
                                <tr key={sale.id}>
                                    <td>{new Date(sale.date).toLocaleDateString()}</td>
                                    <td>{sale.marker}</td>
                                    <td>{sale.weight} {sale.unit}</td>
                                    <td>{sale.price} {sale.currency}</td>
                                    <td>{(sale.weight * sale.price).toFixed(2)} {sale.currency}</td>
                                    <td>{sale.sellerName}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Sales6;
