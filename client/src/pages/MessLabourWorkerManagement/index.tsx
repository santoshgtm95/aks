import React, { useEffect, useState } from 'react';
import { messLabourWorkersAPI, warehousesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { MessLabourWorker, Warehouse, CreateMessLabourWorkerDto, UpdateMessLabourWorkerDto } from '../../types';
import { UserPlus, Pencil, Trash2, X, Save, Users, Warehouse as WarehouseIcon } from 'lucide-react';
import './index.css';

const MessLabourWorkerManagement: React.FC = () => {
    const { hasPermission } = useAuth();
    const [MessLabourWorkers, setMessLabourWorkers] = useState<MessLabourWorker[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMessLabourWorker, setEditingMessLabourWorker] = useState<MessLabourWorker | null>(null);
    const [formData, setFormData] = useState<CreateMessLabourWorkerDto>({
        name: '',
        warehouseId: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [MessLabourWorkerData, warehouseData] = await Promise.all([
                messLabourWorkersAPI.getAll(),
                warehousesAPI.getAll()
            ]);
            setMessLabourWorkers(MessLabourWorkerData);
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
            if (editingMessLabourWorker) {
                const updateDto: UpdateMessLabourWorkerDto = {
                    ...formData,
                    isActive: editingMessLabourWorker.isActive
                };
                await messLabourWorkersAPI.update(editingMessLabourWorker.id, updateDto);
            } else {
                await messLabourWorkersAPI.create(formData);
            }
            setShowModal(false);
            setEditingMessLabourWorker(null);
            setFormData({ name: '', warehouseId: 0 });
            loadData();
        } catch (error) {
            console.error('Failed to save Mess-Labour Worker:', error);
            alert('Failed to save Mess-Labour Worker');
        }
    };

    const handleEdit = (MessLabourWorker: MessLabourWorker) => {
        setEditingMessLabourWorker(MessLabourWorker);
        setFormData({
            name: MessLabourWorker.name,
            warehouseId: MessLabourWorker.warehouseId
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this Mess-Labour Worker?')) {
            try {
                await messLabourWorkersAPI.delete(id);
                loadData();
            } catch (error) {
                console.error('Failed to delete Mess-Labour Worker:', error);
            }
        }
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="refinement-workers-container fade-in">
            <div className="page-header">
                <div className="header-info">
                    <Users size={32} className="text-primary" />
                    <div>
                        <h1>Mess-Labour Worker Management</h1>
                        <p>Manage Mess-Labour Workers and their assigned warehouses</p>
                    </div>
                </div>
                {hasPermission('Warehouse.Create') && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <UserPlus size={20} />
                        Register Mess-Labour Worker
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
                            {MessLabourWorkers.map(MessLabourWorker => (
                                <tr key={MessLabourWorker.id}>
                                    <td style={{ fontWeight: 600 }}>{MessLabourWorker.name}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <WarehouseIcon size={14} style={{ color: '#64748b' }} />
                                            {MessLabourWorker.warehouseName}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${MessLabourWorker.isActive ? 'badge-success' : 'badge-danger'}`}>
                                            {MessLabourWorker.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            {hasPermission('Warehouse.Edit') && (
                                                <button className="btn-icon" onClick={() => handleEdit(MessLabourWorker)}>
                                                    <Pencil size={18} />
                                                </button>
                                            )}
                                            {hasPermission('Warehouse.Delete') && (
                                                <button className="btn-icon text-danger" onClick={() => handleDelete(MessLabourWorker.id)}>
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
                            <h2>{editingMessLabourWorker ? 'Edit Mess-Labour Worker' : 'Register New Mess-Labour Worker'}</h2>
                            <button className="btn-icon" onClick={() => { setShowModal(false); setEditingMessLabourWorker(null); }}>
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
                                    placeholder="Enter Mess-Labour Worker name"
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
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingMessLabourWorker(null); }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Save size={20} />
                                    {editingMessLabourWorker ? 'Update' : 'Register'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessLabourWorkerManagement;
