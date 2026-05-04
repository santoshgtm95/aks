import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { warehousesAPI } from '../../services/api';
import type { Warehouse, CreateWarehouseDto } from '../../types';
import Modal from '../../components/Modal';
import { Plus, Edit2, Trash2, MapPin, Warehouse as WarehouseIcon } from 'lucide-react';
import './index.css'; // Reusing inventory styles for consistency

const WarehouseManagement: React.FC = () => {
    const { hasPermission } = useAuth();
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<CreateWarehouseDto>({
        name: '',
        location: '',
    });

    useEffect(() => {
        loadWarehouses();
    }, []);

    const loadWarehouses = async () => {
        try {
            const data = await warehousesAPI.getAll();
            setWarehouses(data);
        } catch (error) {
            console.error('Failed to load warehouses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await warehousesAPI.update(editingId, { ...formData, isActive: true });
            } else {
                await warehousesAPI.create(formData);
            }
            setIsModalOpen(false);
            setEditingId(null);
            setFormData({ name: '', location: '' });
            loadWarehouses();
        } catch (error) {
            console.error('Failed to save warehouse:', error);
        }
    };

    const handleEdit = (warehouse: Warehouse) => {
        setEditingId(warehouse.id);
        setFormData({
            name: warehouse.name,
            location: warehouse.location || '',
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this warehouse?')) {
            try {
                await warehousesAPI.delete(id);
                loadWarehouses();
            } catch (error) {
                if (error instanceof Error && (error as any).response?.data) {
                    alert((error as any).response.data);
                } else {
                    console.error('Failed to delete warehouse:', error);
                }
            }
        }
    };

    if (loading) {
        return <div className="spinner"></div>;
    }

    return (
        <div className="warehouse fade-in">
            <div className="header-actions">
                <h1 className="page-title">Warehouse Management</h1>
                {hasPermission('Warehouse.Create') && (
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setEditingId(null);
                            setFormData({ name: '', location: '' });
                            setIsModalOpen(true);
                        }}
                    >
                        <Plus size={20} />
                        Create Warehouse
                    </button>
                )}
            </div>

            <div className="warehouse-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginTop: '24px' }}>
                {warehouses.map((wh) => (
                    <div key={wh.id} className="card warehouse-card" style={{ padding: '24px', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                            <div className="icon-badge" style={{ background: 'var(--gradient-primary)', padding: '12px', borderRadius: '12px', color: 'white' }}>
                                <WarehouseIcon size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{wh.name}</h3>
                                {wh.location && (
                                    <p style={{ margin: '4px 0 0', color: 'var(--gray)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <MapPin size={14} />
                                        {wh.location}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="card-actions" style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                            {hasPermission('Warehouse.Edit') && (
                                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => handleEdit(wh)}>
                                    <Edit2 size={16} />
                                    Edit
                                </button>
                            )}
                            {hasPermission('Warehouse.Delete') && (
                                <button className="btn btn-danger" style={{ padding: '10px' }} onClick={() => handleDelete(wh.id)}>
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? 'Edit Warehouse' : 'Create Warehouse'}
            >
                <form onSubmit={handleSubmit} className="product-form">
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label className="form-label">Warehouse Name</label>
                        <input
                            type="text"
                            name="name"
                            className="form-control"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            placeholder="e.g. Main Warehouse"
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label className="form-label">Location / Description</label>
                        <input
                            type="text"
                            name="location"
                            className="form-control"
                            value={formData.location}
                            onChange={handleInputChange}
                            placeholder="e.g. Building A, Ground Floor"
                        />
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                            {editingId ? 'Update Warehouse' : 'Create Warehouse'}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default WarehouseManagement;
