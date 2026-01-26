import React, { useEffect, useState } from 'react';
import { usersAPI } from '../services/api';
import type { User, Role, CreateUserDto } from '../types';
import './Staff.css';

const Staff: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<CreateUserDto>({
        username: '',
        password: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        roleId: 0,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [usersData, rolesData] = await Promise.all([
                usersAPI.getAll(),
                usersAPI.getRoles(),
            ]);
            setUsers(usersData);
            setRoles(rolesData);
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
            [name]: name === 'roleId' ? parseInt(value) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await usersAPI.create(formData);
            setFormData({
                username: '',
                password: '',
                fullName: '',
                email: '',
                phoneNumber: '',
                roleId: 0,
            });
            loadData();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to create staff member');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to deactivate this staff member?')) {
            try {
                await usersAPI.delete(id);
                loadData();
            } catch (error) {
                console.error('Failed to deactivate staff:', error);
            }
        }
    };

    if (loading) {
        return <div className="spinner"></div>;
    }

    return (
        <div className="staff fade-in">
            <h1 className="page-title">Staff Management</h1>

            <div className="card registration-card">
                <h2 className="card-title">Create New Staff Member</h2>
                <form onSubmit={handleSubmit} className="staff-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                className="form-control"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter full name"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input
                                type="text"
                                name="username"
                                className="form-control"
                                value={formData.username}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter username"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                name="password"
                                className="form-control"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter password"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                name="email"
                                className="form-control"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter email"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input
                                type="text"
                                name="phoneNumber"
                                className="form-control"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                placeholder="Enter phone number"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <select
                                name="roleId"
                                className="form-select"
                                value={formData.roleId}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="0">-- Select Role --</option>
                                {roles.map(role => (
                                    <option key={role.id} value={role.id}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                            Create Staff
                        </button>
                    </div>
                </form>
            </div>

            <div className="card list-card">
                <h2 className="card-title">Staff List</h2>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Permissions</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.fullName}</td>
                                    <td>{user.username}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className="badge badge-info">{user.roleName}</span>
                                    </td>
                                    <td>
                                        <div className="permissions-list">
                                            {user.permissions.slice(0, 3).map((p, i) => (
                                                <span key={i} className="permission-tag">{p}</span>
                                            ))}
                                            {user.permissions.length > 3 && <span>...</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(user.id)} title="Deactivate">
                                            🚫
                                        </button>
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

export default Staff;
