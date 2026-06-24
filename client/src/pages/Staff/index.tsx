import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usersAPI, warehousesAPI } from '../../services/api';
import type { User, Role, CreateUserDto, Warehouse } from '../../types';
import Modal from '../../components/Modal';
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
} from 'lucide-react';
import './index.css';

const Staff: React.FC = () => {
    const { hasPermission } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
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
        try {
            await usersAPI.create(formData);
            await loadData();
            setFormData({
                username: '',
                password: '',
                fullName: '',
                email: '',
                phoneNumber: '',
                roleId: 0,
                warehouseId: undefined,
            });
        } catch (error) {
            console.error('Failed to create staff:', error);
        }
    };

    const handleEdit = (user: User) => {
        setEditingUserId(user.id);
        setFormData({
            username: user.username,
            password: '',
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber || '',
            roleId: user.roleId,
            warehouseId: user.warehouseId,
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUserId) return;
        try {
            await usersAPI.update(editingUserId, formData);
            await loadData();
            setIsEditModalOpen(false);
            setEditingUserId(null);
            setFormData({
                username: '',
                password: '',
                fullName: '',
                email: '',
                phoneNumber: '',
                roleId: 0,
                warehouseId: undefined,
            });
        } catch (error) {
            console.error('Failed to update staff:', error);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await usersAPI.delete(id);
            await loadData();
        } catch (error) {
            console.error('Failed to delete staff:', error);
        }
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

                                <button type="submit" className="btn-register-staff">
                                    <UserPlus size={16} /> Create Staff Member
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
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingUserId(null);
                    setFormData({ username: '', password: '', fullName: '', email: '', phoneNumber: '', roleId: 0, warehouseId: undefined });
                }}
                title="Edit Staff Member"
            >
                <form onSubmit={handleUpdateSubmit} className="staff-form">
                    <div className="staff-modal-grid">

                        <div className="staff-input-group">
                            <label className="staff-label">Full Name</label>
                            <div className="staff-input-field-wrapper">
                                <UserIcon className="staff-input-icon" size={16} />
                                <input type="text" name="fullName" className="staff-control staff-control-with-icon"
                                    value={formData.fullName} onChange={handleInputChange} required />
                            </div>
                        </div>

                        <div className="staff-input-group">
                            <label className="staff-label">Email</label>
                            <div className="staff-input-field-wrapper">
                                <AtSign className="staff-input-icon" size={16} />
                                <input type="email" name="email" className="staff-control staff-control-with-icon"
                                    value={formData.email} onChange={handleInputChange} required />
                            </div>
                        </div>

                        <div className="staff-input-group">
                            <label className="staff-label">Phone Number</label>
                            <div className="staff-input-field-wrapper">
                                <Phone className="staff-input-icon" size={16} />
                                <input type="text" name="phoneNumber" className="staff-control staff-control-with-icon"
                                    value={formData.phoneNumber} onChange={handleInputChange} />
                            </div>
                        </div>

                        <div className="staff-input-group">
                            <label className="staff-label">Role</label>
                            <div className="staff-input-field-wrapper">
                                <ShieldCheck className="staff-input-icon" size={16} />
                                <select name="roleId" className="staff-control staff-control-with-icon staff-control-select"
                                    value={formData.roleId} onChange={handleInputChange} required>
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
                                    value={formData.warehouseId ?? ''} onChange={handleInputChange}>
                                    <option value="">-- All Warehouses (Admin) --</option>
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                    </div>

                    <div className="staff-modal-actions">
                        <button type="button" className="btn-staff-modal-cancel"
                            onClick={() => { setIsEditModalOpen(false); setEditingUserId(null); }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-staff-modal-submit">
                            Update Staff
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Staff;
