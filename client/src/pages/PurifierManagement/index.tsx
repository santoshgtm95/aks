import React, { useEffect, useState } from 'react';
import { purifiersAPI, warehousesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { Purifier, Warehouse, CreatePurifierDto, UpdatePurifierDto } from '../../types';
import { UserPlus, Pencil, Trash2, X, Save, Users, Warehouse as WarehouseIcon } from 'lucide-react';
import './index.css';

const PurifierManagement: React.FC = () => {
    const { hasPermission } = useAuth();
    const [purifiers, setPurifiers] = useState<Purifier[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPurifier, setEditingPurifier] = useState<Purifier | null>(null);
    const [formData, setFormData] = useState<CreatePurifierDto>({
        name: '',
        warehouseId: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [purifierData, warehouseData] = await Promise.all([
                purifiersAPI.getAll(),
                warehousesAPI.getAll()
            ]);
            setPurifiers(purifierData);
            setWarehouses(warehouseData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'warehouseId' ? parseInt(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPurifier) {
                const updateDto: UpdatePurifierDto = {
                    ...formData,
                    isActive: editingPurifier.isActive
                };
                await purifiersAPI.update(editingPurifier.id, updateDto);
            } else {
                await purifiersAPI.create(formData);
            }
            setShowModal(false);
            setEditingPurifier(null);
            setFormData({ name: '', warehouseId: 0 });
            loadData();
        } catch (error) {
            console.error('Failed to save purifier:', error);
            alert('Failed to save purifier');
        }
    };

    const handleEdit = (purifier: Purifier) => {
        setEditingPurifier(purifier);
        setFormData({
            name: purifier.name,
            warehouseId: purifier.warehouseId
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this purifier?')) {
            try {
                await purifiersAPI.delete(id);
                loadData();
            } catch (error) {
                console.error('Failed to delete purifier:', error);
            }
        }
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="purifiers-container fade-in">
            <div className="page-header">
                <div className="header-info">
                    <Users size={32} className="text-primary" />
                    <div>
                        <h1>Purifier Management</h1>
                        <p>Manage purifiers and their assigned warehouses</p>
                    </div>
                </div>
                {hasPermission('Warehouse.Create') && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <UserPlus size={20} />
                        Register Purifier
                    </button>
                )}
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Warehouse</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purifiers.map(purifier => (
                                <tr key={purifier.id}>
                                    <td style={{ fontWeight: 600 }}>{purifier.name}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <WarehouseIcon size={14} style={{ color: '#64748b' }} />
                                            {purifier.warehouseName}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${purifier.isActive ? 'badge-success' : 'badge-danger'}`}>
                                            {purifier.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            {hasPermission('Warehouse.Edit') && (
                                                <button className="btn-icon" onClick={() => handleEdit(purifier)}>
                                                    <Pencil size={18} />
                                                </button>
                                            )}
                                            {hasPermission('Warehouse.Delete') && (
                                                <button className="btn-icon text-danger" onClick={() => handleDelete(purifier.id)}>
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content card" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>{editingPurifier ? 'Edit Purifier' : 'Register New Purifier'}</h2>
                            <button className="btn-icon" onClick={() => { setShowModal(false); setEditingPurifier(null); }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-control"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Enter purifier name"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Assigned Warehouse</label>
                                <select
                                    name="warehouseId"
                                    className="form-select"
                                    value={formData.warehouseId}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="0">-- Select Warehouse --</option>
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingPurifier(null); }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Save size={20} />
                                    {editingPurifier ? 'Update' : 'Register'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurifierManagement;
