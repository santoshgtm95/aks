import React, { useEffect, useState } from 'react';
import { usersAPI, permissionsAPI } from '../../services/api';
import type { User } from '../../types';
import { Shield, User as UserIcon, Save, ChevronRight, Lock,} from 'lucide-react';
import './index.css';

interface Permission {
    id: number;
    name: string;
    description: string;
}

const PermissionManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [userPermissionIds, setUserPermissionIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [usersData, permsData] = await Promise.all([
                usersAPI.getAll(),
                permissionsAPI.getAll()
            ]);
            setUsers(usersData);
            setAllPermissions(permsData);
            if (usersData.length > 0) {
                handleUserSelect(usersData[0]);
            }
        } catch (error) {
            console.error('Failed to load permission data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUserSelect = async (user: User) => {
        setSelectedUser(user);
        try {
            const permissionIds = await usersAPI.getPermissions(user.id);
            setUserPermissionIds(permissionIds);
        } catch (error) {
            console.error('Failed to load user permissions:', error);
        }
    };

    const togglePermission = (id: number) => {
        setUserPermissionIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        if (!selectedUser) return;
        setSaving(true);
        try {
            await usersAPI.updatePermissions(selectedUser.id, userPermissionIds);
            alert('Permissions updated successfully!');
            // Reload users to update permission names in staff list if needed
            const usersData = await usersAPI.getAll();
            setUsers(usersData);
        } catch (error) {
            console.error('Failed to save permissions:', error);
            alert('Failed to save permissions');
        } finally {
            setSaving(false);
        }
    };

    const groups = [
        { title: 'Dashboard', prefix: 'Dashboard.' },
        { title: 'Inventory', prefix: 'Inventory.' },
        { title: 'အပွရောင်းစာရင်း', prefix: 'Sales.' },
        { title: 'အပွရွေးစာရင်း', prefix: 'Sales1.' },
        { title: 'အပွရုံစာရင်း', prefix: 'Sales2.' },
        { title: 'ခါးစီး/အကြမ်းရိုက်စာရင်း', prefix: 'Sales3.' },
        { title: 'အချောဆွဲစာရင်း', prefix: 'Sales4.' },
        { title: 'Semi Export', prefix: 'Sales5.' },
        { title: 'Export စာရင်း', prefix: 'Sales6.' },
        { title: 'Warehouse', prefix: 'Warehouse.' },
        { title: 'Staff', prefix: 'Staff.' },
        { title: 'Permissions', prefix: 'Permissions.' },
    ];

    const actions = ['View', 'Create', 'Edit', 'Delete'];

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="permissions-page fade-in">
            <h1 className="page-title">Permission Management</h1>

            <div className="permissions-container">
                {/* User Sidebar */}
                <aside className="users-sidebar">
                    <div className="sidebar-header">
                        <UserIcon size={18} />
                        <span>Staff Members</span>
                    </div>
                    <div className="users-list">
                        {users.map(user => (
                            <div
                                key={user.id}
                                className={`user-item ${selectedUser?.id === user.id ? 'active' : ''}`}
                                onClick={() => handleUserSelect(user)}
                            >
                                <div className="user-info">
                                    <span className="user-name">{user.fullName}</span>
                                    <span className="user-role">{user.roleName}</span>
                                </div>
                                <ChevronRight size={16} />
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Permissions Grid */}
                <main className="permissions-main">
                    {selectedUser ? (
                        <div className="card">
                            <div className="card-header">
                                <div className="header-info">
                                    <Shield size={24} className="text-primary" />
                                    <div>
                                        <h2>Access Control: {selectedUser.fullName}</h2>
                                        <p>Assign module-level permissions for this user.</p>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    <Save size={18} />
                                    {saving ? 'Saving...' : 'Save Permissions'}
                                </button>
                            </div>

                            <div className="permissions-grid">
                                <div className="grid-header">
                                    <div className="module-col">Module</div>
                                    {actions.map(action => (
                                        <div key={action} className="action-col">{action}</div>
                                    ))}
                                </div>
                                {groups.map(group => (
                                    <div key={group.title} className="grid-row">
                                        <div className="module-col">
                                            <strong>{group.title}</strong>
                                        </div>
                                        {actions.map(action => {
                                            const permName = `${group.prefix}${action}`;
                                            const perm = allPermissions.find(p => p.name === permName);
                                            if (!perm && action !== 'View' && group.title === 'Dashboard') return <div key={action} className="action-col empty"></div>;
                                            
                                            // Special case for Permissions.Manage which doesn't follow prefix.Action strictly
                                            let targetPerm = perm;
                                            if (group.title === 'Permissions' && action === 'Edit') {
                                                targetPerm = allPermissions.find(p => p.name === 'Permissions.Manage');
                                            }

                                            return (
                                                <div key={action} className="action-col">
                                                    {targetPerm ? (
                                                        <label className="checkbox-container">
                                                            <input
                                                                type="checkbox"
                                                                checked={userPermissionIds.includes(targetPerm.id)}
                                                                onChange={() => togglePermission(targetPerm!.id)}
                                                            />
                                                            <span className="checkmark"></span>
                                                        </label>
                                                    ) : (
                                                        <span className="no-perm">-</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="no-selection">
                            <Lock size={48} />
                            <h3>No User Selected</h3>
                            <p>Please select a staff member from the left to manage their permissions.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default PermissionManagement;
