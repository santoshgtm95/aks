import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { workersAPI, warehousesAPI } from '../../services/api';
import type { Worker, Warehouse } from '../../types';
import Modal from '../../components/Modal';
import { useNotification } from '../../context/NotificationContext';
import {
    Users,
    UserPlus,
    ClipboardList,
    Search,
    User as UserIcon,
    Phone,
    Pencil,
    UserX,
    AlertCircle,
    Briefcase,
    Home as WarehouseIcon,
} from 'lucide-react';
import './index.css';

const WorkerPage: React.FC = () => {
    const { hasPermission } = useAuth();
    const { showAlert, showConfirm } = useNotification();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [editError, setEditError] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingWorkerId, setEditingWorkerId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState<{
        name: string;
        phoneNumber: string;
        assignWashGrading: boolean;
        assignMessLabour: boolean;
        assignGirdleBush: boolean;
        assignSingleDoubleDrawn: boolean;
        assignSemiExportPurchase: boolean;
        warehouseId?: number;
    }>({
        name: '',
        phoneNumber: '',
        assignWashGrading: false,
        assignMessLabour: false,
        assignGirdleBush: false,
        assignSingleDoubleDrawn: false,
        assignSemiExportPurchase: false,
        warehouseId: undefined,
    });
    const [editFormData, setEditFormData] = useState<{
        name: string;
        phoneNumber: string;
        assignWashGrading: boolean;
        assignMessLabour: boolean;
        assignGirdleBush: boolean;
        assignSingleDoubleDrawn: boolean;
        assignSemiExportPurchase: boolean;
        warehouseId?: number;
    }>({
        name: '',
        phoneNumber: '',
        assignWashGrading: false,
        assignMessLabour: false,
        assignGirdleBush: false,
        assignSingleDoubleDrawn: false,
        assignSemiExportPurchase: false,
        warehouseId: undefined,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [workersData, warehousesData] = await Promise.all([
                workersAPI.getAll(),
                warehousesAPI.getAll(),
            ]);
            setWorkers(workersData);
            setWarehouses(warehousesData);
        } catch (error) {
            console.error('Failed to load worker data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'warehouseId' ? (value ? Number(value) : undefined) : value),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!formData.name.trim()) { setFormError('Worker name is required.'); return; }

        setSubmitting(true);
        try {
            await workersAPI.create({
                name: formData.name,
                phoneNumber: formData.phoneNumber || undefined,
                isActive: true,
                assignWashGrading: formData.assignWashGrading,
                assignMessLabour: formData.assignMessLabour,
                assignGirdleBush: formData.assignGirdleBush,
                assignSingleDoubleDrawn: formData.assignSingleDoubleDrawn,
                assignSemiExportPurchase: formData.assignSemiExportPurchase,
                warehouseId: formData.warehouseId,
            });
            await loadData();
            setFormData({
                name: '', phoneNumber: '',
                assignWashGrading: false, assignMessLabour: false,
                assignGirdleBush: false, assignSingleDoubleDrawn: false,
                assignSemiExportPurchase: false,
                warehouseId: undefined,
            });
            showAlert('Success', 'Worker created successfully!', 'success');
        } catch (error: any) {
            const msg = error?.response?.data?.message
                || error?.response?.data
                || error?.message
                || 'Failed to create worker.';
            setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (worker: Worker) => {
        setEditingWorkerId(worker.id);
        setEditFormData({
            name: worker.name,
            phoneNumber: worker.phoneNumber || '',
            assignWashGrading: worker.assignWashGrading ?? false,
            assignMessLabour: worker.assignMessLabour ?? false,
            assignGirdleBush: worker.assignGirdleBush ?? false,
            assignSingleDoubleDrawn: worker.assignSingleDoubleDrawn ?? false,
            assignSemiExportPurchase: worker.assignSemiExportPurchase ?? false,
            warehouseId: worker.warehouseId,
        });
        setIsEditModalOpen(true);
    };

    const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setEditFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'warehouseId' ? (value ? Number(value) : undefined) : value),
        }));
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingWorkerId) return;
        setEditError('');

        if (!editFormData.name.trim()) { setEditError('Worker name is required.'); return; }

        setSubmitting(true);
        try {
            await workersAPI.update(editingWorkerId, {
                name: editFormData.name,
                phoneNumber: editFormData.phoneNumber || undefined,
                isActive: true,
                assignWashGrading: editFormData.assignWashGrading,
                assignMessLabour: editFormData.assignMessLabour,
                assignGirdleBush: editFormData.assignGirdleBush,
                assignSingleDoubleDrawn: editFormData.assignSingleDoubleDrawn,
                assignSemiExportPurchase: editFormData.assignSemiExportPurchase,
                warehouseId: editFormData.warehouseId,
            });
            await loadData();
            setIsEditModalOpen(false);
            setEditingWorkerId(null);
            showAlert('Success', 'Worker updated successfully!', 'success');
        } catch (error: any) {
            const msg = error?.response?.data?.message
                || error?.response?.data
                || error?.message
                || 'Failed to update worker.';
            setEditError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        showConfirm(
            'Remove Worker',
            'Are you sure you want to remove this worker?',
            async () => {
                try {
                    await workersAPI.delete(id);
                    await loadData();
                } catch (error: any) {
                    const msg = error?.response?.data?.message || error?.message || 'Failed to remove worker.';
                    showAlert('Error', typeof msg === 'string' ? msg : 'Failed to remove worker.', 'error');
                }
            }
        );
    };

    const filteredWorkers = workers.filter((w) =>
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.phoneNumber && w.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b', fontFamily: 'Inter, sans-serif', fontSize: 15 }}>
                Loading...
            </div>
        );
    }

    return (
        <div className="worker fade-in">
            {/* Hero Header */}
            <div className="worker-hero">
                <div className="worker-hero-left">
                    <div className="worker-hero-icon">
                        <Briefcase size={26} strokeWidth={1.8} />
                    </div>
                    <div className="worker-hero-text">
                        <h1>Worker Management</h1>
                        <p>Manage worker accounts and assignments</p>
                    </div>
                </div>
                <div className="worker-hero-right">
                    <div className="worker-stat-pill">
                        <span className="stat-num">{workers.length}</span>
                        <span className="stat-label">{workers.length === 1 ? 'Worker' : 'Workers'}</span>
                    </div>
                </div>
            </div>

            {/* Main Split Layout */}
            <div className="worker-main-layout">

                {/* Left Column — Create Worker */}
                {hasPermission('Staff.Create') && (
                    <div className="worker-card">
                        <div className="worker-card-header">
                            <div className="worker-card-title-wrap">
                                <UserPlus className="worker-card-icon" size={20} />
                                <h2 className="worker-card-title">Create Worker</h2>
                            </div>
                        </div>
                        <div className="worker-card-body">
                            <form onSubmit={handleSubmit} className="worker-form">
                                <div className="worker-form-section-title">Worker Details</div>
                                <div className="worker-form-grid">

                                    <div className="worker-input-group">
                                        <label className="worker-label">Full Name</label>
                                        <div className="worker-input-field-wrapper">
                                            <UserIcon className="worker-input-icon" size={16} />
                                            <input
                                                type="text"
                                                name="name"
                                                className="worker-control worker-control-with-icon"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="Enter full name"
                                            />
                                        </div>
                                    </div>

                                    <div className="worker-input-group">
                                        <label className="worker-label">Phone Number</label>
                                        <div className="worker-input-field-wrapper">
                                            <Phone className="worker-input-icon" size={16} />
                                            <input
                                                type="text"
                                                name="phoneNumber"
                                                className="worker-control worker-control-with-icon"
                                                value={formData.phoneNumber}
                                                onChange={handleInputChange}
                                                placeholder="Enter phone number"
                                            />
                                        </div>
                                    </div>

                                    <div className="worker-input-group">
                                        <label className="worker-label">Warehouse</label>
                                        <div className="worker-input-field-wrapper">
                                            <WarehouseIcon className="worker-input-icon" size={16} />
                                            <select
                                                name="warehouseId"
                                                className="worker-control worker-control-with-icon"
                                                value={formData.warehouseId || ''}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">Select Warehouse</option>
                                                {warehouses.map((w) => (
                                                    <option key={w.id} value={w.id}>
                                                        {w.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                </div>

                                {/* Assign Section */}
                                <div className="worker-form-section-title">Assign</div>
                                <div className="worker-assign-grid">
                                    <label className="worker-assign-checkbox">
                                        <input
                                            type="checkbox"
                                            name="assignWashGrading"
                                            checked={formData.assignWashGrading}
                                            onChange={handleInputChange}
                                        />
                                        <span className="worker-assign-checkmark"></span>
                                        Wash/Grading
                                    </label>
                                    <label className="worker-assign-checkbox">
                                        <input
                                            type="checkbox"
                                            name="assignMessLabour"
                                            checked={formData.assignMessLabour}
                                            onChange={handleInputChange}
                                        />
                                        <span className="worker-assign-checkmark"></span>
                                        Mess-Labour
                                    </label>
                                    <label className="worker-assign-checkbox">
                                        <input
                                            type="checkbox"
                                            name="assignGirdleBush"
                                            checked={formData.assignGirdleBush}
                                            onChange={handleInputChange}
                                        />
                                        <span className="worker-assign-checkmark"></span>
                                        Girdle-Bush
                                    </label>
                                    <label className="worker-assign-checkbox">
                                        <input
                                            type="checkbox"
                                            name="assignSingleDoubleDrawn"
                                            checked={formData.assignSingleDoubleDrawn}
                                            onChange={handleInputChange}
                                        />
                                        <span className="worker-assign-checkmark"></span>
                                        Single & Double Drawn
                                    </label>
                                    <label className="worker-assign-checkbox">
                                        <input
                                            type="checkbox"
                                            name="assignSemiExportPurchase"
                                            checked={formData.assignSemiExportPurchase}
                                            onChange={handleInputChange}
                                        />
                                        <span className="worker-assign-checkmark"></span>
                                        Semi Export Purchase
                                    </label>
                                </div>

                                {formError && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        background: '#fef2f2', border: '1px solid #fecaca',
                                        borderRadius: 10, padding: '10px 14px',
                                        color: '#dc2626', fontSize: 13, fontWeight: 600,
                                    }}>
                                        <AlertCircle size={15} />
                                        {formError}
                                    </div>
                                )}

                                <button type="submit" className="btn-register-worker" disabled={submitting}>
                                    <UserPlus size={16} /> {submitting ? 'Creating...' : 'Create Worker'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Right Column — Worker List */}
                <div
                    className="worker-card"
                    style={{ gridColumn: !hasPermission('Staff.Create') ? '1 / -1' : undefined }}
                >
                    <div className="worker-card-header">
                        <div className="worker-card-title-wrap">
                            <ClipboardList className="worker-card-icon" size={20} />
                            <h2 className="worker-card-title">Worker List</h2>
                        </div>
                        <span className="worker-count-badge">{filteredWorkers.length} Workers</span>
                    </div>

                    <div className="worker-history-controls">
                        <div className="worker-search-box">
                            <Search className="worker-search-icon" size={16} />
                            <input
                                type="text"
                                className="worker-search-control"
                                placeholder="Search name, phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="worker-table-wrap">
                        <table className="worker-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Phone Number</th>
                                    <th>Warehouse</th>
                                    <th>Assign</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredWorkers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6}>
                                            <div className="worker-empty-state">
                                                <Users className="worker-empty-icon" size={48} strokeWidth={1} />
                                                <p className="worker-empty-text">
                                                    {searchTerm ? 'No workers match your search.' : 'No workers yet.'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredWorkers.map((worker) => (
                                        <tr key={worker.id}>
                                            <td>
                                                <span className="worker-badge-name">{worker.name}</span>
                                            </td>
                                            <td style={{ color: '#64748b', fontSize: '13px' }}>
                                                {worker.phoneNumber || '—'}
                                            </td>
                                            <td style={{ color: '#64748b', fontSize: '13px' }}>
                                                {worker.warehouseName || '—'}
                                            </td>
                                            <td>
                                                <div className="worker-assign-tags">
                                                    {worker.assignWashGrading && <span className="worker-assign-tag">Wash/Grading</span>}
                                                    {worker.assignMessLabour && <span className="worker-assign-tag">Mess-Labour</span>}
                                                    {worker.assignGirdleBush && <span className="worker-assign-tag">Girdle-Bush</span>}
                                                    {worker.assignSingleDoubleDrawn && <span className="worker-assign-tag">S&D Drawn</span>}
                                                    {worker.assignSemiExportPurchase && <span className="worker-assign-tag">Semi Export</span>}
                                                    {!worker.assignWashGrading && !worker.assignMessLabour && !worker.assignGirdleBush && !worker.assignSingleDoubleDrawn && !worker.assignSemiExportPurchase && (
                                                         <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`worker-badge-role ${worker.isActive ? '' : 'worker-inactive-role'}`}>
                                                    {worker.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="worker-action-buttons">
                                                    {hasPermission('Staff.Edit') && (
                                                        <button
                                                            className="btn-worker-edit"
                                                            onClick={() => handleEdit(worker)}
                                                            title="Edit"
                                                        >
                                                            <Pencil size={14} /> Edit
                                                        </button>
                                                    )}
                                                    {hasPermission('Staff.Delete') && (
                                                        <button
                                                            className="btn-worker-delete"
                                                            onClick={() => handleDelete(worker.id)}
                                                            title="Deactivate"
                                                        >
                                                            <UserX size={14} /> Remove
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
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setEditingWorkerId(null); }}
                title="Edit Worker"
            >
                <form onSubmit={handleUpdateSubmit} className="worker-form">
                    <div className="worker-modal-grid">

                        <div className="worker-input-group">
                            <label className="worker-label">Full Name</label>
                            <div className="worker-input-field-wrapper">
                                <UserIcon className="worker-input-icon" size={16} />
                                <input type="text" name="name" className="worker-control worker-control-with-icon"
                                    value={editFormData.name} onChange={handleEditFormChange} required />
                            </div>
                        </div>

                        <div className="worker-input-group">
                            <label className="worker-label">Phone Number</label>
                            <div className="worker-input-field-wrapper">
                                <Phone className="worker-input-icon" size={16} />
                                <input type="text" name="phoneNumber" className="worker-control worker-control-with-icon"
                                    value={editFormData.phoneNumber} onChange={handleEditFormChange} />
                            </div>
                        </div>

                        <div className="worker-input-group">
                            <label className="worker-label">Warehouse</label>
                            <div className="worker-input-field-wrapper">
                                <WarehouseIcon className="worker-input-icon" size={16} />
                                <select
                                    name="warehouseId"
                                    className="worker-control worker-control-with-icon"
                                    value={editFormData.warehouseId || ''}
                                    onChange={handleEditFormChange}
                                >
                                    <option value="">Select Warehouse</option>
                                    {warehouses.map((w) => (
                                        <option key={w.id} value={w.id}>
                                            {w.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                    </div>

                    {/* Assign Section */}
                    <div className="worker-form-section-title">Assign</div>
                    <div className="worker-assign-grid">
                        <label className="worker-assign-checkbox">
                            <input
                                type="checkbox"
                                name="assignWashGrading"
                                checked={editFormData.assignWashGrading}
                                onChange={handleEditFormChange}
                            />
                            <span className="worker-assign-checkmark"></span>
                            Wash/Grading
                        </label>
                        <label className="worker-assign-checkbox">
                            <input
                                type="checkbox"
                                name="assignMessLabour"
                                checked={editFormData.assignMessLabour}
                                onChange={handleEditFormChange}
                            />
                            <span className="worker-assign-checkmark"></span>
                            Mess-Labour
                        </label>
                        <label className="worker-assign-checkbox">
                            <input
                                type="checkbox"
                                name="assignGirdleBush"
                                checked={editFormData.assignGirdleBush}
                                onChange={handleEditFormChange}
                            />
                            <span className="worker-assign-checkmark"></span>
                            Girdle-Bush
                        </label>
                        <label className="worker-assign-checkbox">
                            <input
                                type="checkbox"
                                name="assignSingleDoubleDrawn"
                                checked={editFormData.assignSingleDoubleDrawn}
                                onChange={handleEditFormChange}
                            />
                            <span className="worker-assign-checkmark"></span>
                            Single & Double Drawn
                        </label>
                        <label className="worker-assign-checkbox">
                            <input
                                type="checkbox"
                                name="assignSemiExportPurchase"
                                checked={editFormData.assignSemiExportPurchase}
                                onChange={handleEditFormChange}
                            />
                            <span className="worker-assign-checkmark"></span>
                            Semi Export Purchase
                        </label>
                    </div>

                    <div className="worker-modal-actions">
                        {editError && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: '#fef2f2', border: '1px solid #fecaca',
                                borderRadius: 8, padding: '8px 12px',
                                color: '#dc2626', fontSize: 13, fontWeight: 600, flex: 1,
                            }}>
                                <AlertCircle size={14} />
                                {editError}
                            </div>
                        )}
                        <button type="button" className="btn-worker-modal-cancel"
                            onClick={() => { setIsEditModalOpen(false); setEditingWorkerId(null); setEditError(''); }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-worker-modal-submit" disabled={submitting}>
                            {submitting ? 'Updating...' : 'Update Worker'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default WorkerPage;
