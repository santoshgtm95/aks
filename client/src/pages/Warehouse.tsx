import React, { useEffect, useState } from 'react';
import { productsAPI } from '../services/api';
import type { Product, CreateProductDto } from '../types';
import './Warehouse.css';

const Warehouse: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<CreateProductDto>({
        date: new Date().toISOString().split('T')[0],
        packages: 0,
        marker: '',
        unit: 'kg',
        weight: 0,
        price: 0,
        currency: 'MMK',
    });

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await productsAPI.getAll();
            setProducts(data);
        } catch (error) {
            console.error('Failed to load products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'packages' || name === 'weight' || name === 'price'
                ? (value === '' ? 0 : parseFloat(value))
                : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await productsAPI.update(editingId, formData);
                setEditingId(null);
            } else {
                await productsAPI.create(formData);
            }
            setFormData({
                date: new Date().toISOString().split('T')[0],
                packages: 0,
                marker: '',
                unit: 'kg',
                weight: 0,
                price: 0,
                currency: 'MMK',
            });
            loadProducts();
        } catch (error) {
            console.error('Failed to save product:', error);
        }
    };

    const handleEdit = (product: Product) => {
        setEditingId(product.id);
        setFormData({
            date: new Date(product.date).toISOString().split('T')[0],
            packages: product.packages,
            marker: product.marker,
            unit: product.unit,
            weight: product.weight,
            price: product.price,
            currency: product.currency,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await productsAPI.delete(id);
                loadProducts();
            } catch (error) {
                console.error('Failed to delete product:', error);
            }
        }
    };

    if (loading) {
        return <div className="spinner"></div>;
    }

    return (
        <div className="warehouse fade-in">
            <h1 className="page-title">Warehouse Management</h1>

            <div className="card registration-card">
                <h2 className="card-title">{editingId ? 'Edit Product' : 'Register New Product'}</h2>
                <form onSubmit={handleSubmit} className="product-form">
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
                            <label className="form-label">Packages</label>
                            <input
                                type="number"
                                name="packages"
                                className="form-control"
                                value={formData.packages || ''}
                                onChange={handleInputChange}
                                required
                                min="0"
                                placeholder="0"
                                onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Marker</label>
                            <input
                                type="text"
                                name="marker"
                                className="form-control"
                                value={formData.marker}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter marker"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Unit</label>
                            <select
                                name="unit"
                                className="form-select"
                                value={formData.unit}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="kg">kg</option>
                                <option value="viss">viss</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Weight</label>
                            <input
                                type="number"
                                name="weight"
                                step="0.01"
                                className="form-control"
                                value={formData.weight || ''}
                                onChange={handleInputChange}
                                required
                                min="0"
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
                                    min="0"
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
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                            {editingId ? 'Update Product' : 'Register Product'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    setEditingId(null);
                                    setFormData({
                                        date: new Date().toISOString().split('T')[0],
                                        packages: 0,
                                        marker: '',
                                        unit: 'kg',
                                        weight: 0,
                                        price: 0,
                                        currency: 'MMK',
                                    });
                                }}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="card list-card">
                <h2 className="card-title">Product List</h2>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Marker</th>
                                <th>Packages</th>
                                <th>Weight</th>
                                <th>Price</th>
                                <th>Remaining</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id}>
                                    <td>{new Date(product.date).toLocaleDateString()}</td>
                                    <td>{product.marker}</td>
                                    <td>{product.packages}</td>
                                    <td>{product.weight} {product.unit}</td>
                                    <td>{product.price} {product.currency}</td>
                                    <td>
                                        <span className={`badge ${product.remainingWeight < product.weight * 0.2 ? 'badge-danger' : 'badge-success'}`}>
                                            {product.remainingWeight.toFixed(2)} {product.unit}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn-icon" onClick={() => handleEdit(product)} title="Edit">
                                                ✏️
                                            </button>
                                            <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(product.id)} title="Delete">
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Warehouse;
