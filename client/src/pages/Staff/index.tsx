import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usersAPI, warehousesAPI } from '../../services/api';
import type { User, Role, CreateUserDto, UpdateUserDto, Warehouse } from '../../types';
import Modal from '../../components/Modal';
import { useNotification } from '../../context/NotificationContext';
import {
    Users,
    UserPlus,
    ClipboardList,
    Search,
    User as UserIcon,
    AtSign,
    Lock,
    Phone,
    ShieldCheck,
    Building2,
    Pencil,
    UserX,
    AlertCircle,
} from 'lucide-react';
import './index.css';

const Staff: React.FC = () => {
    const { hasPermission } = useAuth();
    const { showAlert, showConfirm } = useNotification();
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [editError, setEditError] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState<CreateUserDto>({
        username: '',
        password: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        roleId: 0,
        warehouseId: undefined,
    });
    const [editFormData, setEditFormData] = useState<UpdateUserDto>({
        fullName: '',
        email: '',
        phoneNumber: '',
        roleId: 0,
        isActive: true,
        warehouseId: undefined,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [usersData, rolesData, warehousesData] = await Promise.all([
                usersAPI.getAll(),
                usersAPI.getRoles(),
                warehousesAPI.getAll(),
            ]);
            setUsers(usersData);
            setRoles(rolesData);
            setWarehouses(warehousesData);
        } catch (error) {
            console.error('Failed to load staff data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'roleId' ? parseInt(value) :
                    name === 'warehouseId' ? (value === '' ? undefined : parseInt(value)) :
                    value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        // Client-side validation
        if (!formData.fullName.trim()) { setFormError('Full name is required.'); return; }
        if (!formData.username.trim()) { setFormError('Username is required.'); return; }
        if (!formData.password.trim()) { setFormError('Password is required.'); return; }
        if (!formData.email.trim()) { setFormError('Email is required.'); return; }
        if (!formData.roleId || formData.roleId === 0) { setFormError('Please select a role.'); return; }

        setSubmitting(true);
        try {
            await usersAPI.create(formData);
            await loadData();
            setFormData({ username: '', password: '', fullName: '', email: '', phoneNumber: '', roleId: 0, warehouseId: undefined });
            showAlert('Success', 'Staff member created successfully!', 'success');
        } catch (error: any) {
            const msg = error?.response?.data?.message
                || error?.response?.data
                || error?.message
                || 'Failed to create staff member.';
            setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (user: User) => {
        setEditingUserId(user.id);
        // Find the roleId by matching roleName from the loaded roles list
        const matchedRole = roles.find(r => r.name === user.roleName);
        setEditFormData({
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber || '',
            roleId: matchedRole?.id ?? 0,
            isActive: true,
            warehouseId: user.warehouseId,
        });
        setIsEditModalOpen(true);
    };

    const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditFormData((prev) => ({
            ...prev,
            [name]: name === 'roleId' ? parseInt(value) :
                    name === 'warehouseId' ? (value === '' ? undefined : parseInt(value)) :
                    value,
        }));
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUserId) return;
        setEditError('');

        if (!editFormData.roleId || editFormData.roleId === 0) { setEditError('Please select a role.'); return; }

        setSubmitting(true);
        try {
            await usersAPI.update(editingUserId, editFormData);
            await loadData();
            setIsEditModalOpen(false);
            setEditingUserId(null);
            showAlert('Success', 'Staff member updated successfully!', 'success');
        } catch (error: any) {
            const msg = error?.response?.data?.message
                || error?.response?.data
                || error?.message
                || 'Failed to update staff member.';
            setEditError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        showConfirm(
            'Remove Staff Member',
            'Are you sure you want to remove this staff member?',
            async () => {
                try {
                    await usersAPI.delete(id);
                    await loadData();
                } catch (error: any) {
                    const msg = error?.response?.data?.message || error?.message || 'Failed to remove staff member.';
                    showAlert('Error', typeof msg === 'string' ? msg : 'Failed to remove staff member.', 'error');
                }
            }
        );
    };

    const filteredUsers = users.filter((u) =>
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b', fontFamily: 'Inter, sans-serif', fontSize: 15 }}>
                Loading...
            </div>
        );
    }

    return (
        <div className="staff fade-in">
            {/* Hero Header */}
            <div className="staff-hero">
                <div className="staff-hero-left">
                    <div className="staff-hero-icon">
                        <Users size={26} strokeWidth={1.8} />
                    </div>
                    <div className="staff-hero-text">
                        <h1>Staff Management</h1>
                        <p>Manage user accounts, roles, and warehouse assignments</p>
                    </div>
                </div>
                <div className="staff-hero-right">
                    <div className="staff-stat-pill">
                        <span className="stat-num">{users.length}</span>
                        <span className="stat-label">{users.length === 1 ? 'Member' : 'Members'}</span>
                    </div>
                </div>
            </div>

            {/* Main Split Layout */}
            <div className="staff-main-layout">

                {/* Left Column — Create Staff */}
                {hasPermission('Staff.Create') && (
                    <div className="staff-card">
                        <div className="staff-card-header">
                            <div className="staff-card-title-wrap">
                                <UserPlus className="staff-card-icon" size={20} />
                                <h2 className="staff-card-title">Create Staff Member</h2>
                            </div>
                        </div>
                        <div className="staff-card-body">
                            <form onSubmit={handleSubmit} className="staff-form">
                                <div className="staff-form-section-title">Account Details</div>
                                <div className="staff-form-grid">

                                    <div className="staff-input-group">
                                        <label className="staff-label">Full Name</label>
                                        <div className="staff-input-field-wrapper">
                                            <UserIcon className="staff-input-icon" size={16} />
                                            <input
                                                type="text"
                                                name="fullName"
                                                className="staff-control staff-control-with-icon"
                                                value={formData.fullName}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="Enter full name"
                                            />
                                        </div>
                                    </div>

                                    <div className="staff-input-group">
                                        <label className="staff-label">Username</label>
                                        <div className="staff-input-field-wrapper">
                                            <AtSign className="staff-input-icon" size={16} />
                                            <input
                                                type="text"
                                                name="username"
                                                className="staff-control staff-control-with-icon"
                                                value={formData.username}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="Enter username"
                                            />
                                        </div>
                                    </div>

                                    <div className="staff-input-group">
                                        <label className="staff-label">Password</label>
                                        <div className="staff-input-field-wrapper">
                                            <Lock className="staff-input-icon" size={16} />
                                            <input
                                                type="password"
                                                name="password"
                                                className="staff-control staff-control-with-icon"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="Enter password"
                                            />
                                        </div>
                                    </div>

                                    <div className="staff-input-group">
                                        <label className="staff-label">Email</label>
                                        <div className="staff-input-field-wrapper">
                                            <AtSign className="staff-input-icon" size={16} />
                                            <input
                                                type="email"
                                                name="email"
                                                className="staff-control staff-control-with-icon"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="Enter email"
                                            />
                                        </div>
                                    </div>

                                    <div className="staff-input-group">
                                        <label className="staff-label">Phone Number</label>
                                        <div className="staff-input-field-wrapper">
                                            <Phone className="staff-input-icon" size={16} />
                                            <input
                                                type="text"
                                                name="phoneNumber"
                                                className="staff-control staff-control-with-icon"
                                                value={formData.phoneNumber}
                                                onChange={handleInputChange}
                                                placeholder="Enter phone number"
                                            />
                                        </div>
                                    </div>

                                    <div className="staff-input-group">
                                        <label className="staff-label">Role</label>
                                        <div className="staff-input-field-wrapper">
                                            <ShieldCheck className="staff-input-icon" size={16} />
                                            <select
                                                name="roleId"
                                                className="staff-control staff-control-with-icon staff-control-select"
                                                value={formData.roleId}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="0">-- Select Role --</option>
                                                {roles.map(role => (
                                                    <option key={role.id} value={role.id}>{role.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="staff-input-group">
                                        <label className="staff-label">Warehouse</label>
                                        <div className="staff-input-field-wrapper">
                                            <Building2 className="staff-input-icon" size={16} />
                                            <select
                                                name="warehouseId"
                                                className="staff-control staff-control-with-icon staff-control-select"
                                                value={formData.warehouseId ?? ''}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">-- All Warehouses (Admin) --</option>
                                                {warehouses.map(w => (
                                                    <option key={w.id} value={w.id}>{w.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

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

                                <button type="submit" className="btn-register-staff" disabled={submitting}>
                                    <UserPlus size={16} /> {submitting ? 'Creating...' : 'Create Staff Member'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Right Column — Staff List */}
                <div
                    className="staff-card"
                    style={{ gridColumn: !hasPermission('Staff.Create') ? '1 / -1' : undefined }}
                >
                    <div className="staff-card-header">
                        <div className="staff-card-title-wrap">
                            <ClipboardList className="staff-card-icon" size={20} />
                            <h2 className="staff-card-title">Staff List</h2>
                        </div>
                        <span className="staff-count-badge">{filteredUsers.length} Members</span>
                    </div>

                    <div className="staff-history-controls">
                        <div className="staff-search-box">
                            <Search className="staff-search-icon" size={16} />
                            <input
                                type="text"
                                className="staff-search-control"
                                placeholder="Search name, username, email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="staff-table-wrap">
                        <table className="staff-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Warehouse</th>
                                    <th>Permissions</th>
                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7}>
                                            <div className="staff-empty-state">
                                                <Users className="staff-empty-icon" size={48} strokeWidth={1} />
                                                <p className="staff-empty-text">
                                                    {searchTerm ? 'No staff members match your search.' : 'No staff members yet.'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td>
                                                <span className="staff-badge-name">{user.fullName}</span>
                                            </td>
                                            <td>
                                                <span className="staff-badge-username">{user.username}</span>
                                            </td>
                                            <td style={{ color: '#64748b', fontSize: '13px' }}>{user.email}</td>
                                            <td>
                                                <span className="staff-badge-role">{user.roleName}</span>
                                            </td>
                                            <td>
                                                {user.warehouseName
                                                    ? <span className="staff-badge-warehouse">{user.warehouseName}</span>
                                                    : <span className="staff-badge-all-access">All Access</span>
                                                }
                                            </td>
                                            <td>
                                                <div className="staff-permissions-list">
                                                    {user.permissions.slice(0, 3).map((p, i) => (
                                                        <span key={i} className="staff-permission-tag">{p}</span>
                                                    ))}
                                                    {user.permissions.length > 3 && (
                                                        <span className="staff-permission-tag">+{user.permissions.length - 3}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="staff-action-buttons">
                                                    {hasPermission('Staff.Edit') && (
                                                        <button
                                                            className="btn-staff-edit"
                                                            onClick={() => handleEdit(user)}
                                                            title="Edit"
                                                        >
                                                            <Pencil size={14} /> Edit
                                                        </button>
                                                    )}
                                                    {hasPermission('Staff.Delete') && (
                                                        <button
                                                            className="btn-staff-delete"
                                                            onClick={() => handleDelete(user.id)}
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
                onClose={() => { setIsEditModalOpen(false); setEditingUserId(null); }}
                title="Edit Staff Member"
            >
                <form onSubmit={handleUpdateSubmit} className="staff-form">
                    <div className="staff-modal-grid">

                        <div className="staff-input-group">
                            <label className="staff-label">Full Name</label>
                            <div className="staff-input-field-wrapper">
                                <UserIcon className="staff-input-icon" size={16} />
                                <input type="text" name="fullName" className="staff-control staff-control-with-icon"
                                    value={editFormData.fullName} onChange={handleEditFormChange} required />
                            </div>
                        </div>

                        <div className="staff-input-group">
                            <label className="staff-label">Email</label>
                            <div className="staff-input-field-wrapper">
                                <AtSign className="staff-input-icon" size={16} />
                                <input type="email" name="email" className="staff-control staff-control-with-icon"
                                    value={editFormData.email} onChange={handleEditFormChange} required />
                            </div>
                        </div>

                        <div className="staff-input-group">
                            <label className="staff-label">Phone Number</label>
                            <div className="staff-input-field-wrapper">
                                <Phone className="staff-input-icon" size={16} />
                                <input type="text" name="phoneNumber" className="staff-control staff-control-with-icon"
                                    value={editFormData.phoneNumber ?? ''} onChange={handleEditFormChange} />
                            </div>
                        </div>

                        <div className="staff-input-group">
                            <label className="staff-label">Role</label>
                            <div className="staff-input-field-wrapper">
                                <ShieldCheck className="staff-input-icon" size={16} />
                                <select name="roleId" className="staff-control staff-control-with-icon staff-control-select"
                                    value={editFormData.roleId} onChange={handleEditFormChange} required>
                                    <option value="0">-- Select Role --</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="staff-input-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="staff-label">Warehouse</label>
                            <div className="staff-input-field-wrapper">
                                <Building2 className="staff-input-icon" size={16} />
                                <select name="warehouseId" className="staff-control staff-control-with-icon staff-control-select"
                                    value={editFormData.warehouseId ?? ''} onChange={handleEditFormChange}>
                                    <option value="">-- All Warehouses (Admin) --</option>
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                    </div>

                    <div className="staff-modal-actions">
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
                        <button type="button" className="btn-staff-modal-cancel"
                            onClick={() => { setIsEditModalOpen(false); setEditingUserId(null); setEditError(''); }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-staff-modal-submit" disabled={submitting}>
                            {submitting ? 'Updating...' : 'Update Staff'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Staff;
