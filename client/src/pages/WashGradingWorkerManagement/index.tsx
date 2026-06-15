import React, { useEffect, useState } from 'react';
import { washGradingWorkersAPI, warehousesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { WashGradingWorker, Warehouse, CreateWashGradingWorkerDto, UpdateWashGradingWorkerDto } from '../../types';
import { UserPlus, Pencil, Trash2, X, Save, Users, Warehouse as WarehouseIcon } from 'lucide-react';
import './index.css';

const WashGradingWorkerManagement: React.FC = () => {
    const { hasPermission } = useAuth();
    const [workers, setWorkers] = useState<WashGradingWorker[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingWorker, setEditingWorker] = useState<WashGradingWorker | null>(null);
    const [formData, setFormData] = useState<CreateWashGradingWorkerDto>({
        name: '',
        warehouseId: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [workerData, warehouseData] = await Promise.all([
                washGradingWorkersAPI.getAll(),
                warehousesAPI.getAll()
            ]);
            setWorkers(workerData);
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
            if (editingWorker) {
                const updateDto: UpdateWashGradingWorkerDto = {
                    ...formData,
                    isActive: editingWorker.isActive
                };
                await washGradingWorkersAPI.update(editingWorker.id, updateDto);
            } else {
                await washGradingWorkersAPI.create(formData);
            }
            setShowModal(false);
            setEditingWorker(null);
            setFormData({ name: '', warehouseId: 0 });
            loadData();
        } catch (error) {
            console.error('Failed to save wash/grading worker:', error);
            alert('Failed to save wash/grading worker');
        }
    };

    const handleEdit = (worker: WashGradingWorker) => {
        setEditingWorker(worker);
        setFormData({
            name: worker.name,
            warehouseId: worker.warehouseId
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this wash/grading worker?')) {
            try {
                await washGradingWorkersAPI.delete(id);
                loadData();
            } catch (error) {
                console.error('Failed to delete wash/grading worker:', error);
            }
        }
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="washgrading-workers-container fade-in">
            <div className="page-header">
                <div className="header-info">
                    <Users size={32} className="text-primary" />
                    <div>
                        <h1>Wash/Grading Worker Management</h1>
                        <p>Manage wash/grading workers and their assigned warehouses</p>
                    </div>
                </div>
                {hasPermission('Warehouse.Create') && (
                    <button className="btn btn-primary" onClick={() => { setEditingWorker(null); setFormData({ name: '', warehouseId: 0 }); setShowModal(true); }}>
                        <UserPlus size={18} />
                        Add Worker
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
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center' }}>No workers registered yet.</td>
                                </tr>
                            ) : (
                                workers.map(worker => (
                                    <tr key={worker.id}>
                                        <td>{worker.name}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <WarehouseIcon size={16} className="text-muted" />
                                                {worker.warehouseName}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${worker.isActive ? 'badge-success' : 'badge-danger'}`}>
                                                {worker.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                {hasPermission('Warehouse.Edit') && (
                                                    <button className="btn-icon" onClick={() => handleEdit(worker)}>
                                                        <Pencil size={16} />
                                                    </button>
                                                )}
                                                {hasPermission('Warehouse.Delete') && (
                                                    <button className="btn-icon text-danger" onClick={() => handleDelete(worker.id)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '400px' }}>
                        <div className="modal-header">
                            <h2>{editingWorker ? 'Edit Worker' : 'Add New Worker'}</h2>
                            <button className="btn-icon" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="name">Worker Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    className="form-control"
                                    required
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter worker name..."
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="warehouseId">Warehouse</label>
                                <select
                                    id="warehouseId"
                                    name="warehouseId"
                                    className="form-select"
                                    required
                                    value={formData.warehouseId || ''}
                                    onChange={handleInputChange}
                                >
                                    <option value="">-- Select Warehouse --</option>
                                    {warehouses.filter(w => w.isActive).map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                            {editingWorker && (
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px' }}>
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={editingWorker.isActive}
                                        onChange={(e) => setEditingWorker(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                                        style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                                    />
                                    <label htmlFor="isActive" style={{ cursor: 'pointer', userSelect: 'none' }}>Active Status</label>
                                </div>
                            )}
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Save size={16} />
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WashGradingWorkerManagement;
