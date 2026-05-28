import React, { useEffect, useState } from 'react';
import { refinementAPI, purifiersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import type { AvailablePurifiedCategory, RefinementProcess, RefinementRecord, Purifier } from '../../types';
import { Package, Send, History, Loader2, Search, User, Pencil, Trash2, X, Sparkles } from 'lucide-react';
import { formatDateTime, getMyanmarNow, combineDateWithMyanmarTime } from '../../utils/format';
import './index.css';

const Refinement: React.FC = () => {
    const { hasPermission } = useAuth();
    const { showAlert, showConfirm } = useNotification();
    const [availableCategories, setAvailableCategories] = useState<AvailablePurifiedCategory[]>([]);
    const [processes, setProcesses] = useState<RefinementProcess[]>([]);
    const [refinementRecords, setRefinementRecords] = useState<RefinementRecord[]>([]);
    const [activeTab, setActiveTab] = useState<'history' | 'stock'>('history');
    const [purifiers, setPurifiers] = useState<Purifier[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [selectedPurifiers, setSelectedPurifiers] = useState<Record<string, number>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<AvailablePurifiedCategory | null>(null);
    const [editingProcess, setEditingProcess] = useState<RefinementProcess | null>(null);
    const [editingRecord, setEditingRecord] = useState<RefinementRecord | null>(null);
    const [form, setForm] = useState({ weight: '', spoilageWeight: '', returnWeight: '', purifierId: 0, date: getMyanmarNow() });
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [avail, procs, recs, purif] = await Promise.all([
                refinementAPI.getAvailableCategories(),
                refinementAPI.getAll(),
                refinementAPI.getRefinementRecords(),
                purifiersAPI.getAll(),
            ]);
            setAvailableCategories(avail);
            setProcesses(procs);
            setRefinementRecords(recs);
            setPurifiers(purif);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleInlineSubmit = async (avail: AvailablePurifiedCategory) => {
        const key = `${avail.purifiedRecordId}-${avail.category}`;
        const count = avail.remainingCount;
        const purifierId = selectedPurifiers[key];
        if (!purifierId) return showAlert('Validation', 'Please select a refinement worker', 'error');
        setSubmitting(key);
        try {
            await refinementAPI.create({
                date: new Date().toISOString(),
                purifiedRecordId: avail.purifiedRecordId,
                category: avail.category,
                count,
                weight: avail.remainingWeight,
                lostWeight: 0,
                purifierId
            });
            await loadData();
        } catch (e: any) {
            showAlert('Error', e.response?.data?.message || 'Failed to assign refinement', 'error');
        } finally { setSubmitting(null); }
    };

    const handleDelete = (id: number) => showConfirm(
        'Confirm Delete',
        'Are you sure you want to delete this record?',
        async () => {
            try { await refinementAPI.delete(id); await loadData(); }
            catch { showAlert('Error', 'Failed to delete record', 'error'); }
        }
    );

    const handleDeleteRecord = (id: number) => showConfirm(
        'Confirm Delete',
        'Are you sure you want to delete this refinement record?',
        async () => {
            try { await refinementAPI.deleteRefinementRecord(id); await loadData(); }
            catch { showAlert('Error', 'Failed to delete record', 'error'); }
        }
    );

    const handleEditProcess = (p: RefinementProcess) => {
        setEditingProcess(p); setEditingRecord(null); setSelectedCategory(null);
        const dateStr = p.date ? (p.date.includes('T') ? p.date.slice(0, 16) : p.date + 'T00:00') : getMyanmarNow();
        setForm({ weight: '', spoilageWeight: '', returnWeight: '', date: dateStr, purifierId: p.purifierId || 0 });
        setValidationError(null);
        setShowModal(true);
    };

    const handleSubmitModal = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);
        const weight = parseFloat(form.weight) || 0;
        const spoilageWeight = parseFloat(form.spoilageWeight) || 0;
        const returnWeight = parseFloat(form.returnWeight) || 0;
        const available = editingRecord?.weight ?? editingProcess?.weight ?? selectedCategory?.remainingWeight ?? 0;
        const lostWeight = Math.max(0, available - weight - spoilageWeight - returnWeight);
        if (!weight || weight <= 0) {
            setValidationError('Please enter a valid weight');
            return;
        }
        if (!form.purifierId) {
            setValidationError('Please select a refinement worker');
            return;
        }

        if (weight + spoilageWeight + returnWeight > available) {
            setValidationError(
                `Total weights (Output + Spoilage + Return = ${(weight + spoilageWeight + returnWeight).toFixed(3)}) cannot exceed Available weight (${available.toFixed(3)} viss)`
            );
            return;
        }

        if (selectedCategory && weight > selectedCategory.remainingWeight) {
            setValidationError(`Cannot exceed remaining weight (${selectedCategory.remainingWeight.toFixed(3)} viss)`);
            return;
        }
        try {
            const dto = {
                date: combineDateWithMyanmarTime(form.date),
                purifiedRecordId: editingProcess?.purifiedRecordId || editingRecord?.purifiedRecordId || selectedCategory!.purifiedRecordId,
                category: editingProcess?.category || editingRecord?.category || selectedCategory!.category,
                count: 0,
                weight,
                lostWeight,
                spoilageWeight,
                returnWeight,
                purifierId: form.purifierId
            };
            if (editingProcess) await refinementAPI.update(editingProcess.id, dto);
            else if (editingRecord) await refinementAPI.updateRefinementRecord(editingRecord.id, dto);
            else await refinementAPI.create(dto);
            setShowModal(false);
            setValidationError(null);
            await loadData();
        } catch (e: any) {
            showAlert('Error', e.response?.data?.message || 'Failed to save record', 'error');
        }
    };

    const filtered = availableCategories.filter(a =>
        a.productMarker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.warehouseName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="rf-loading">
                <Loader2 className="rf-spin" size={28} />
                <span>Loading refinement data...</span>
            </div>
        );
    }

    return (
        <div className="rf-container fade-in">

            {/* ── LEFT SIDEBAR ── */}
            <aside className="rf-sidebar">
                <div className="rf-sidebar-header">
                    <Sparkles size={18} />
                    <span>Select Bag to Refine</span>
                </div>

                <div className="rf-search-box">
                    <Search size={16} className="rf-search-icon" />
                    <input
                        type="text"
                        placeholder="Search bag marker or warehouse..."
                        className="rf-search-input"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="rf-card-list">
                    {filtered.length === 0 ? (
                        <div className="rf-empty-sidebar">
                            {searchTerm ? 'No matching bags found' : 'No bags available for refinement'}
                        </div>
                    ) : filtered.map(avail => {
                        const key = `${avail.purifiedRecordId}-${avail.category}`;
                        return (
                            <div key={key} className="rf-bag-card">
                                {/* Card Top */}
                                <div className="rf-card-top">
                                    <div className="rf-card-info">
                                        <span className="rf-card-marker">{avail.productMarker}</span>
                                        <span className="rf-card-warehouse">{avail.warehouseName || '---'}</span>
                                    </div>
                                    <span className={`rf-badge category-${avail.category.toLowerCase().replace('.', '')}`}>
                                        {avail.category}
                                    </span>
                                </div>

                                {/* Stats Row */}
                                <div className="rf-stats-row">
                                    <div className="rf-stat">
                                        <span className="rf-stat-label">Remaining</span>
                                        <span className="rf-stat-value">
                                            {avail.remainingCount} <span className="rf-stat-unit">bundles</span>
                                        </span>
                                    </div>
                                    <div className="rf-stat rf-stat-right">
                                        <span className="rf-stat-label">Weight</span>
                                        <span className="rf-stat-value rf-stat-blue">
                                            {avail.remainingWeight.toFixed(3)} <span className="rf-stat-unit">viss</span>
                                        </span>
                                    </div>
                                    <div className="rf-stat rf-stat-right">
                                        <span className="rf-stat-label">Unit Wt</span>
                                        <span className="rf-stat-value rf-stat-purple">{avail.unitWeight.toFixed(4)}</span>
                                    </div>
                                </div>

                                {/* Worker Select */}
                                <div className="rf-worker-select-wrap">
                                    <label className="rf-field-label">Refinement Worker</label>
                                    <select
                                        className="rf-select"
                                        value={selectedPurifiers[key] || ''}
                                        onChange={e => setSelectedPurifiers(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                                    >
                                        <option value="">-- Select Worker --</option>
                                        {purifiers
                                            .filter(p => p.warehouseId === avail.warehouseId && p.isActive)
                                            .map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                                        }
                                    </select>
                                </div>

                                {/* Assign Button */}
                                <button
                                    className="rf-assign-btn"
                                    onClick={() => handleInlineSubmit(avail)}
                                    disabled={submitting === key}
                                >
                                    {submitting === key
                                        ? <><Loader2 className="rf-spin" size={16} /> Processing...</>
                                        : <><Send size={16} /> Assign to Refine</>
                                    }
                                </button>
                            </div>
                        );
                    })}
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main className="rf-main">
                <div className="rf-main-card">
                    {/* Header */}
                    <div className="rf-main-header">
                        <div className="rf-header-left">
                            <div className="rf-header-icon">
                                <History size={28} />
                            </div>
                            <div className="rf-tab-group">
                                <button
                                    className={`rf-tab ${activeTab === 'history' ? 'rf-tab-active' : ''}`}
                                    onClick={() => setActiveTab('history')}
                                >
                                    <span className="rf-tab-title">Refinement History</span>
                                    <span className="rf-tab-sub">Process log of purified bundles</span>
                                </button>
                                <button
                                    className={`rf-tab ${activeTab === 'stock' ? 'rf-tab-active rf-tab-green' : ''}`}
                                    onClick={() => setActiveTab('stock')}
                                >
                                    <span className="rf-tab-title">Refined Stock</span>
                                    <span className="rf-tab-sub">Completed refinement records</span>
                                </button>
                            </div>
                        </div>

                        <div className="rf-header-badge">
                            <span className="rf-count-badge">
                                {activeTab === 'history' ? processes.length : refinementRecords.length} records
                            </span>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rf-table-wrap">
                        <table className="rf-table">
                            <thead>
                                {activeTab === 'history' ? (
                                    <tr>
                                        <th>Date</th>
                                        <th>Bag Marker</th>
                                        <th>Category</th>
                                        <th>Weight (viss)</th>
                                        <th>Refinement Worker</th>
                                        <th className="rf-th-right">Actions</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th>Date</th>
                                        <th>Bag Marker</th>
                                        <th>Category</th>
                                        <th>Output Weight</th>
                                        <th>Lost Weight</th>
                                        <th>Spoilage Weight</th>
                                        <th>Return Weight</th>
                                        <th>Refinement Worker</th>
                                        <th className="rf-th-right">Actions</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {activeTab === 'history' ? (
                                    processes.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="rf-empty-row">
                                                <History size={44} className="rf-empty-icon" />
                                                <span>No refinement processes registered yet</span>
                                            </td>
                                        </tr>
                                    ) : processes.map(p => (
                                        <tr key={p.id} className="rf-clickable-row" onClick={() => handleEditProcess(p)}>
                                            <td className="rf-td-date">{formatDateTime(p.date)}</td>
                                            <td>
                                                <div className="rf-marker">{p.productMarker}</div>
                                                <div className="rf-warehouse">{p.warehouseName || '---'}</div>
                                            </td>
                                            <td>
                                                <span className={`rf-badge category-${p.category.toLowerCase().replace('.', '')}`}>
                                                    {p.category}
                                                </span>
                                            </td>
                                            <td className="rf-td-weight">{p.weight.toFixed(3)}</td>
                                            <td>
                                                <div className="rf-worker-cell">
                                                    <User size={13} />
                                                    {p.purifierName || '---'}
                                                </div>
                                            </td>
                                            <td onClick={e => e.stopPropagation()}>
                                                <div className="rf-actions">
                                                    {hasPermission('Refinement.Edit') && (
                                                        <button className="rf-action-btn rf-edit-btn" onClick={() => handleEditProcess(p)}>
                                                            <Pencil size={14} />
                                                        </button>
                                                    )}
                                                    {hasPermission('Refinement.Delete') && (
                                                        <button className="rf-action-btn rf-delete-btn" onClick={() => handleDelete(p.id)}>
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    refinementRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="rf-empty-row">
                                                <Package size={44} className="rf-empty-icon" />
                                                <span>No refined stock records yet</span>
                                            </td>
                                        </tr>
                                    ) : refinementRecords.map(p => (
                                        <tr key={p.id}>
                                            <td className="rf-td-date">{formatDateTime(p.date)}</td>
                                            <td>
                                                <div className="rf-marker">{p.productMarker}</div>
                                                <div className="rf-warehouse">{p.warehouseName || '---'}</div>
                                            </td>
                                            <td>
                                                <span className={`rf-badge category-${p.category.toLowerCase().replace('.', '')}`}>
                                                    {p.category}
                                                </span>
                                            </td>
                                            <td className="rf-td-weight rf-green">{p.weight.toFixed(3)}</td>
                                            <td className="rf-td-lost">{p.lostWeight.toFixed(3)}</td>
                                            <td className="rf-td-lost" style={{ color: '#ea580c' }}>{p.spoilageWeight.toFixed(3)}</td>
                                            <td className="rf-td-weight" style={{ color: '#3b82f6' }}>{p.returnWeight.toFixed(3)}</td>
                                            <td>
                                                <div className="rf-worker-cell">
                                                    <User size={13} />
                                                    {p.purifierName || '---'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="rf-actions">
                                                    {hasPermission('Refinement.Delete') && (
                                                        <button className="rf-action-btn rf-delete-btn" onClick={() => handleDeleteRecord(p.id)}>
                                                            <Trash2 size={14} />
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
            </main>

            {/* ── EDIT / CREATE MODAL ── */}
            {showModal && (editingProcess || editingRecord || selectedCategory) && (
                <div className="rf-overlay" onClick={() => { setShowModal(false); setValidationError(null); }}>
                    <div className="rf-modal" onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div className="rf-modal-header">
                            <div className="rf-modal-header-left">
                                <div className="rf-modal-icon">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <p className="rf-modal-pre">Refinement Process</p>
                                    <h2 className="rf-modal-title">
                                        {editingProcess || editingRecord ? 'Edit Record' : 'Record Refinement'}
                                    </h2>
                                </div>
                            </div>
                            <button className="rf-modal-close" onClick={() => { setShowModal(false); setValidationError(null); }}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* Info Bar */}
                        <div className="rf-modal-info-bar">
                            <div className="rf-modal-chip">
                                <span className="rf-chip-label">Bag Marker</span>
                                <span className="rf-chip-value">
                                    {editingProcess?.productMarker || editingRecord?.productMarker || selectedCategory?.productMarker}
                                </span>
                            </div>
                            <div className="rf-modal-chip">
                                <span className="rf-chip-label">Category</span>
                                <span className={`rf-badge category-${(editingProcess?.category || editingRecord?.category || selectedCategory?.category || '').toLowerCase().replace('.', '')}`} style={{ margin: 0 }}>
                                    {editingProcess?.category || editingRecord?.category || selectedCategory?.category}
                                </span>
                            </div>
                            <div className="rf-modal-chip">
                                <span className="rf-chip-label">Available</span>
                                <span className="rf-chip-value rf-chip-orange">
                                    {editingRecord
                                        ? editingRecord.weight.toFixed(3)
                                        : editingProcess
                                            ? editingProcess.weight.toFixed(3)
                                            : selectedCategory?.remainingWeight.toFixed(3)
                                    } viss
                                </span>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmitModal} className="rf-modal-body">

                            {/* Worker */}
                            <div className="rf-form-group">
                                <label className="rf-form-label">Refinement Worker</label>
                                <select
                                    className="rf-form-control"
                                    value={form.purifierId}
                                    onChange={e => {
                                        setValidationError(null);
                                        setForm(prev => ({ ...prev, purifierId: parseInt(e.target.value) }));
                                    }}
                                    required
                                >
                                    <option value={0}>-- Select Worker --</option>
                                    {purifiers.filter(p => p.isActive).map(p =>
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    )}
                                </select>
                            </div>

                            {/* Weight Fields - Row 1: Output Weight + Spoilage Weight */}
                            <div className="rf-form-row">
                                <div className="rf-form-group">
                                    <label className="rf-form-label">Output Weight</label>
                                    <div className="rf-input-unit-wrap">
                                        <input
                                            type="number"
                                            step="0.001"
                                            className="rf-form-control"
                                            placeholder="0.000"
                                            value={form.weight}
                                            onChange={e => {
                                                setValidationError(null);
                                                setForm(prev => ({ ...prev, weight: e.target.value }));
                                            }}
                                            required
                                        />
                                        <span className="rf-input-unit">viss</span>
                                    </div>
                                </div>
                                <div className="rf-form-group">
                                    <label className="rf-form-label">Spoilage Weight</label>
                                    <div className="rf-input-unit-wrap">
                                        <input
                                            type="number"
                                            step="0.001"
                                            className="rf-form-control"
                                            placeholder="0.000"
                                            value={form.spoilageWeight}
                                            onChange={e => {
                                                setValidationError(null);
                                                setForm(prev => ({ ...prev, spoilageWeight: e.target.value }));
                                            }}
                                        />
                                        <span className="rf-input-unit">viss</span>
                                    </div>
                                </div>
                            </div>

                            {/* Weight Fields - Row 2: Return Weight (editable) + Lost Weight (auto) */}
                            {(() => {
                                const available = editingRecord?.weight ?? editingProcess?.weight ?? selectedCategory?.remainingWeight ?? 0;
                                const computedLost = Math.max(0, available - (parseFloat(form.weight) || 0) - (parseFloat(form.spoilageWeight) || 0) - (parseFloat(form.returnWeight) || 0));
                                return (
                                    <div className="rf-form-row">
                                        <div className="rf-form-group">
                                            <label className="rf-form-label">Return Weight</label>
                                            <div className="rf-input-unit-wrap">
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    className="rf-form-control"
                                                    placeholder="0.000"
                                                    value={form.returnWeight}
                                                    onChange={e => {
                                                        setValidationError(null);
                                                        setForm(prev => ({ ...prev, returnWeight: e.target.value }));
                                                    }}
                                                />
                                                <span className="rf-input-unit">viss</span>
                                            </div>
                                        </div>
                                        <div className="rf-form-group">
                                            <label className="rf-form-label" style={{ color: '#ef4444' }}>Lost Weight <span style={{ fontSize: '9px', fontWeight: 400, color: '#94a3b8', textTransform: 'none' }}>(auto)</span></label>
                                            <div className="rf-input-unit-wrap">
                                                <input
                                                    type="number"
                                                    readOnly
                                                    className="rf-form-control"
                                                    style={{ background: '#fef2f2', color: '#ef4444', fontWeight: 700, cursor: 'not-allowed', borderColor: '#fecaca' }}
                                                    value={computedLost.toFixed(3)}
                                                />
                                                <span className="rf-input-unit rf-unit-red">viss</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Date */}
                            <div className="rf-form-group">
                                <label className="rf-form-label">Date</label>
                                <input
                                    type="date"
                                    className="rf-form-control"
                                    value={form.date.split('T')[0]}
                                    onChange={e => {
                                        setValidationError(null);
                                        setForm(prev => ({ ...prev, date: e.target.value }));
                                    }}
                                    required
                                />
                            </div>

                            {/* Footer */}
                            <div className="rf-modal-footer">
                                <button type="button" className="rf-btn-cancel" onClick={() => { setShowModal(false); setValidationError(null); }}>
                                    <X size={15} /> Cancel
                                </button>
                                <button type="submit" className="rf-btn-save">
                                    <Send size={15} />
                                    {editingRecord || editingProcess ? 'Save Changes' : 'Submit Record'}
                                </button>
                            </div>
                            {validationError && (
                                <div className="rf-modal-error-msg">
                                    {validationError}
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Refinement;
