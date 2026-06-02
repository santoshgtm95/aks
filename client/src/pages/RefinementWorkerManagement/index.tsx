import React, { useEffect, useState } from 'react';
import { refinementWorkersAPI, warehousesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { RefinementWorker, Warehouse, CreateRefinementWorkerDto, UpdateRefinementWorkerDto } from '../../types';
import { UserPlus, Pencil, Trash2, X, Save, Users, Warehouse as WarehouseIcon } from 'lucide-react';
import './index.css';

const RefinementWorkerManagement: React.FC = () => {
    const { hasPermission } = useAuth();
    const [refinementWorkers, setRefinementWorkers] = useState<RefinementWorker[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRefinementWorker, setEditingRefinementWorker] = useState<RefinementWorker | null>(null);
    const [formData, setFormData] = useState<CreateRefinementWorkerDto>({
        name: '',
        warehouseId: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [refinementWorkerData, warehouseData] = await Promise.all([
                refinementWorkersAPI.getAll(),
                warehousesAPI.getAll()
            ]);
            setRefinementWorkers(refinementWorkerData);
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
            if (editingRefinementWorker) {
                const updateDto: UpdateRefinementWorkerDto = {
                    ...formData,
                    isActive: editingRefinementWorker.isActive
                };
                await refinementWorkersAPI.update(editingRefinementWorker.id, updateDto);
            } else {
                await refinementWorkersAPI.create(formData);
            }
            setShowModal(false);
            setEditingRefinementWorker(null);
            setFormData({ name: '', warehouseId: 0 });
            loadData();
        } catch (error) {
            console.error('Failed to save refinement worker:', error);
            alert('Failed to save refinement worker');
        }
    };

    const handleEdit = (refinementWorker: RefinementWorker) => {
        setEditingRefinementWorker(refinementWorker);
        setFormData({
            name: refinementWorker.name,
            warehouseId: refinementWorker.warehouseId
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this refinement worker?')) {
            try {
                await refinementWorkersAPI.delete(id);
                loadData();
            } catch (error) {
                console.error('Failed to delete refinement worker:', error);
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
                        <h1>Refinement Worker Management</h1>
                        <p>Manage refinement workers and their assigned warehouses</p>
                    </div>
                </div>
                {hasPermission('Warehouse.Create') && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <UserPlus size={20} />
                        Register Refinement Worker
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
                            {refinementWorkers.map(refinementWorker => (
                                <tr key={refinementWorker.id}>
                                    <td style={{ fontWeight: 600 }}>{refinementWorker.name}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <WarehouseIcon size={14} style={{ color: '#64748b' }} />
                                            {refinementWorker.warehouseName}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${refinementWorker.isActive ? 'badge-success' : 'badge-danger'}`}>
                                            {refinementWorker.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            {hasPermission('Warehouse.Edit') && (
                                                <button className="btn-icon" onClick={() => handleEdit(refinementWorker)}>
                                                    <Pencil size={18} />
                                                </button>
                                            )}
                                            {hasPermission('Warehouse.Delete') && (
                                                <button className="btn-icon text-danger" onClick={() => handleDelete(refinementWorker.id)}>
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
                            <h2>{editingRefinementWorker ? 'Edit Refinement Worker' : 'Register New Refinement Worker'}</h2>
                            <button className="btn-icon" onClick={() => { setShowModal(false); setEditingRefinementWorker(null); }}>
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
                                    placeholder="Enter refinement worker name"
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
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingRefinementWorker(null); }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Save size={20} />
                                    {editingRefinementWorker ? 'Update' : 'Register'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RefinementWorkerManagement;
