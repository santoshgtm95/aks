import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { refinementAPI, singleDoubleDrawnAPI } from '../../services/api';
import type { RefinementRecord, SingleDoubleDrawnRecord } from '../../types';
import { Package, Search, Sparkles, Send, Scissors, Trash2, LayoutGrid, Weight, User, CheckCircle2 } from 'lucide-react';
import { formatDateTime } from '../../utils/format';
import './index.css';

// Helper: sum all 16 size fields of a SingleDoubleDrawnRecord
const sumRecordSizes = (r: SingleDoubleDrawnRecord): number =>
    r.size6 + r.size7 + r.size8 + r.size9 + r.size10 +
    r.size10B + r.size12 + r.size14 + r.size16 + r.size18 +
    r.size20 + r.size22 + r.size24 + r.size26 + r.size28 + r.sizeBar;

const SingleDoubleDrawn: React.FC = () => {
    const { hasPermission } = useAuth();
    const [refinedRecords, setRefinedRecords] = useState<RefinementRecord[]>([]);
    const [savedRecords, setSavedRecords] = useState<SingleDoubleDrawnRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formError, setFormError] = useState('');

    // Two Inches Category sizes: 6, 7, 8, 9, 10
    const [twoInchesForm, setTwoInchesForm] = useState({
        size6: '',
        size7: '',
        size8: '',
        size9: '',
        size10: '',
    });

    // B to Ten Category sizes: 10B, 12, 14, 16, 18, 20, 22, 24, 26, 28, Bar
    const [bToTenForm, setBToTenForm] = useState({
        size10B: '',
        size12: '',
        size14: '',
        size16: '',
        size18: '',
        size20: '',
        size22: '',
        size24: '',
        size26: '',
        size28: '',
        sizeBar: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [recordsData, savedData] = await Promise.all([
                refinementAPI.getRefinementRecords(),
                singleDoubleDrawnAPI.getAll()
            ]);
            setRefinedRecords(recordsData);
            setSavedRecords(savedData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectedRecord = useMemo(
        () => refinedRecords.find(r => r.id === selectedRecordId),
        [refinedRecords, selectedRecordId]
    );

    // Calculate saved total per refinement record (for sidebar filtering & remaining weight)
    const savedTotalByRefinement = useMemo(() => {
        const map: Record<number, number> = {};
        savedRecords.forEach(sr => {
            const total = sumRecordSizes(sr);
            map[sr.refinementRecordId] = (map[sr.refinementRecordId] || 0) + total;
        });
        return map;
    }, [savedRecords]);

    // Already-sorted weight for the selected record
    const alreadySortedWeight = useMemo(() => {
        if (!selectedRecordId) return 0;
        return savedTotalByRefinement[selectedRecordId] || 0;
    }, [selectedRecordId, savedTotalByRefinement]);

    // Real-time current form total
    const currentFormTotal = useMemo(() => {
        const twoInchesTotal = Object.values(twoInchesForm).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
        const bToTenTotal = Object.values(bToTenForm).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
        return twoInchesTotal + bToTenTotal;
    }, [twoInchesForm, bToTenForm]);

    // Remaining weight = Output Weight - already saved - current form input
    const remainingWeight = useMemo(() => {
        if (!selectedRecord) return 0;
        return selectedRecord.weight - alreadySortedWeight - currentFormTotal;
    }, [selectedRecord, alreadySortedWeight, currentFormTotal]);

    // Filter sidebar: hide fully sorted, apply search
    const filteredRecords = useMemo(() => {
        return refinedRecords.filter(r => {
            // Hide if saved total matches output weight (fully sorted)
            const savedTotal = savedTotalByRefinement[r.id] || 0;
            const isFullySorted = r.weight > 0 && Math.abs(savedTotal - r.weight) < 0.001;
            if (isFullySorted) return false;

            // Search filter
            return r.productMarker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (r.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (r.warehouseName || '').toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [refinedRecords, searchTerm, savedTotalByRefinement]);

    const handleTwoInchesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTwoInchesForm(prev => ({ ...prev, [name]: value }));
    };

    const handleBToTenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBToTenForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        if (!selectedRecordId || !selectedRecord) return;

        // Validate: current form total + already saved must equal output weight
        if (currentFormTotal <= 0) {
            setFormError('Please enter at least one size value.');
            return;
        }

        if (Math.abs(remainingWeight) > 0.001) {
            setFormError(`Total sizes must equal remaining weight. Remaining: ${remainingWeight.toFixed(3)} viss`);
            return;
        }

        try {
            const dto = {
                date: new Date().toISOString(),
                refinementRecordId: selectedRecordId,
                
                // Two Inches
                size6: parseFloat(twoInchesForm.size6) || 0,
                size7: parseFloat(twoInchesForm.size7) || 0,
                size8: parseFloat(twoInchesForm.size8) || 0,
                size9: parseFloat(twoInchesForm.size9) || 0,
                size10: parseFloat(twoInchesForm.size10) || 0,

                // B to Ten
                size10B: parseFloat(bToTenForm.size10B) || 0,
                size12: parseFloat(bToTenForm.size12) || 0,
                size14: parseFloat(bToTenForm.size14) || 0,
                size16: parseFloat(bToTenForm.size16) || 0,
                size18: parseFloat(bToTenForm.size18) || 0,
                size20: parseFloat(bToTenForm.size20) || 0,
                size22: parseFloat(bToTenForm.size22) || 0,
                size24: parseFloat(bToTenForm.size24) || 0,
                size26: parseFloat(bToTenForm.size26) || 0,
                size28: parseFloat(bToTenForm.size28) || 0,
                sizeBar: parseFloat(bToTenForm.sizeBar) || 0,
                lostWeight: selectedRecord.lostWeight || 0,
                spoilageWeight: selectedRecord.spoilageWeight || 0,
                returnWeight: selectedRecord.returnWeight || 0,
            };

            await singleDoubleDrawnAPI.create(dto);
            
            // Clear forms
            setTwoInchesForm({ size6: '', size7: '', size8: '', size9: '', size10: '' });
            setBToTenForm({ size10B: '', size12: '', size14: '', size16: '', size18: '', size20: '', size22: '', size24: '', size26: '', size28: '', sizeBar: '' });
            setFormError('');
            setSelectedRecordId(null);
            
            await loadData();
        } catch (error) {
            console.error('Failed to save record:', error);
            setFormError('Failed to save record. Please try again.');
        }
    };

    const handleDeleteRecord = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;
        try {
            await singleDoubleDrawnAPI.delete(id);
            await loadData();
        } catch (error) {
            console.error('Failed to delete record:', error);
            alert('Failed to delete record');
        }
    };

    if (loading) {
        return <div className="spinner"></div>;
    }

    return (
        <div className="processing-container fade-in">
            {/* Left Sidebar: Refined Stock List */}
            <aside className="product-sidebar">
                <h2 className="sidebar-title">
                    <Package size={20} />
                    Refined Stock
                </h2>
                
                {/* Search in product-sidebar */}
                <div className="sidebar-search" style={{ marginBottom: '20px', position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search marker, category..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px 10px 36px',
                            borderRadius: '10px',
                            border: '1.5px solid #e2e8f0',
                            fontSize: '13.5px',
                            outline: 'none',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                <div className="product-list" style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
                    {filteredRecords.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px', fontSize: '13.5px' }}>
                            No refined stock found
                        </div>
                    ) : filteredRecords.map(record => (
                        <div
                            key={record.id}
                            className={`product-card ${selectedRecordId === record.id ? 'selected' : ''}`}
                            onClick={() => setSelectedRecordId(record.id)}
                        >
                            <div className="card-header">
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span className="card-marker">{record.productMarker}</span>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                                        {record.warehouseName || '---'}
                                    </span>
                                </div>
                                <span className={`rf-badge category-${(record.category || '').toLowerCase().replace('.', '')}`}>
                                    {record.category}
                                </span>
                            </div>
                            <div className="card-details">
                                <span>Output: <strong style={{ color: '#059669' }}>{record.weight.toFixed(3)}</strong> viss</span>
                                <span>Return: <strong style={{ color: '#2563eb' }}>{record.returnWeight.toFixed(3)}</strong> viss</span>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Right Main Content */}
            <main className="processing-main">
                {selectedRecord ? (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        
                        {/* Selected Record Header details */}
                        <div className="main-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', paddingBottom: '24px', borderBottom: '2px solid #f1f5f9' }}>
                            <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <Scissors size={32} style={{ color: '#2563eb' }} />
                                <div>
                                    <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#0f172a' }}>Single &amp; Double Drawn Sorting</h1>
                                    <p className="header-subtitle" style={{ fontSize: '13.5px', color: '#64748b', margin: '6px 0 0 0', fontWeight: '500' }}>
                                        Refined Record: <strong>{selectedRecord.productMarker}</strong> ({selectedRecord.category})
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Detail Info Cards: Output, Lost, Spoilage, Return, Worker */}
                        <div className="record-detail-section">
                            <div className="detail-info-card card-output">
                                <div className="detail-label">Output Weight</div>
                                <div className="detail-value">{selectedRecord.weight.toFixed(3)} <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>viss</span></div>
                            </div>
                            <div className="detail-info-card card-lost">
                                <div className="detail-label">Lost Weight</div>
                                <div className="detail-value">{selectedRecord.lostWeight.toFixed(3)} <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>viss</span></div>
                            </div>
                            <div className="detail-info-card card-spoilage">
                                <div className="detail-label">Spoilage Weight</div>
                                <div className="detail-value">{selectedRecord.spoilageWeight.toFixed(3)} <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>viss</span></div>
                            </div>
                            <div className="detail-info-card card-return">
                                <div className="detail-label">Return Weight</div>
                                <div className="detail-value">{selectedRecord.returnWeight.toFixed(3)} <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>viss</span></div>
                            </div>
                            <div className="detail-info-card card-worker">
                                <div className="detail-label">Refinement Worker</div>
                                <div className="detail-value">{selectedRecord.purifierName || '—'}</div>
                            </div>
                        </div>

                        {/* Category Size forms (vertical layout) */}
                        {hasPermission('SingleDoubleDrawn.Create') && (
                            <form onSubmit={handleSubmit}>
                                <div className="categories-container">
                                    
                                    {/* Column 1: Two Inches Category (6,7,8,9,10) */}
                                    <div className="category-column category-column-two">
                                        <h3 className="category-title">
                                            <LayoutGrid size={18} style={{ color: '#2563eb' }} />
                                            Two Inches Category
                                        </h3>
                                        <div className="size-grid">
                                            {['6', '7', '8', '9', '10'].map(size => (
                                                <div key={size} className="size-input-box">
                                                    <label className="size-label">Size {size}</label>
                                                    <input
                                                        type="number"
                                                        step="0.001"
                                                        name={`size${size}`}
                                                        className="size-input"
                                                        placeholder="0.000"
                                                        value={twoInchesForm[`size${size}` as keyof typeof twoInchesForm]}
                                                        onChange={handleTwoInchesChange}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Column 2: B to Ten Category (10,12,14,16,18,20,22,24,26,28,Bar) */}
                                    <div className="category-column category-column-b">
                                        <h3 className="category-title">
                                            <LayoutGrid size={18} style={{ color: '#8b5cf6' }} />
                                            B to Ten Category
                                        </h3>
                                        <div className="size-grid">
                                            {['10B', '12', '14', '16', '18', '20', '22', '24', '26', '28', 'Bar'].map(size => {
                                                const fieldName = size === '10B' ? 'size10B' : size === 'Bar' ? 'sizeBar' : `size${size}`;
                                                const displayLabel = size === '10B' ? 'Size 10' : `Size ${size}`;
                                                return (
                                                    <div key={size} className="size-input-box">
                                                        <label className="size-label">{displayLabel}</label>
                                                        <input
                                                            type="number"
                                                            step="0.001"
                                                            name={fieldName}
                                                            className="size-input"
                                                            placeholder="0.000"
                                                            value={bToTenForm[fieldName as keyof typeof bToTenForm]}
                                                            onChange={handleBToTenChange}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                </div>

                                {/* Remaining Weight live indicator */}
                                <div className="remaining-weight-bar" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '16px 20px',
                                    borderRadius: '12px',
                                    marginBottom: '16px',
                                    border: `2px solid ${Math.abs(remainingWeight) < 0.001 ? '#10b981' : remainingWeight < 0 ? '#ef4444' : '#f59e0b'}`,
                                    background: Math.abs(remainingWeight) < 0.001 ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' : remainingWeight < 0 ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {Math.abs(remainingWeight) < 0.001 ? (
                                            <CheckCircle2 size={22} style={{ color: '#10b981' }} />
                                        ) : (
                                            <Weight size={22} style={{ color: remainingWeight < 0 ? '#ef4444' : '#f59e0b' }} />
                                        )}
                                        <div>
                                            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: Math.abs(remainingWeight) < 0.001 ? '#059669' : remainingWeight < 0 ? '#dc2626' : '#d97706', marginBottom: '2px' }}>
                                                {Math.abs(remainingWeight) < 0.001 ? 'Fully Matched' : remainingWeight < 0 ? 'Exceeded' : 'Remaining Weight'}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                                                Output: {selectedRecord.weight.toFixed(3)} — Already Saved: {alreadySortedWeight.toFixed(3)} — Current Input: {currentFormTotal.toFixed(3)}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: '24px',
                                        fontWeight: 800,
                                        color: Math.abs(remainingWeight) < 0.001 ? '#10b981' : remainingWeight < 0 ? '#ef4444' : '#f59e0b'
                                    }}>
                                        {remainingWeight.toFixed(3)} <span style={{ fontSize: '12px', fontWeight: 700 }}>viss</span>
                                    </div>
                                </div>

                                <button type="submit" className="submit-btn" disabled={Math.abs(remainingWeight) > 0.001 || currentFormTotal <= 0} style={{
                                    width: '100%', padding: '14px',
                                    background: (Math.abs(remainingWeight) > 0.001 || currentFormTotal <= 0) ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                    color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700',
                                    cursor: (Math.abs(remainingWeight) > 0.001 || currentFormTotal <= 0) ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    boxShadow: (Math.abs(remainingWeight) > 0.001 || currentFormTotal <= 0) ? 'none' : '0 4px 12px rgba(37,99,235,0.2)',
                                    opacity: (Math.abs(remainingWeight) > 0.001 || currentFormTotal <= 0) ? 0.7 : 1,
                                    transition: 'all 0.3s ease'
                                }}>
                                    <Send size={16} /> Confirm &amp; Save Sorting Record
                                </button>

                                {formError && (
                                    <p style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600, marginTop: '10px', textAlign: 'center' }}>{formError}</p>
                                )}
                            </form>
                        )}

                        {/* Recent History Table for Single Selection */}
                        <div className="history-section" style={{ marginTop: '40px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>Sorting History (Selected Stock)</h2>
                            <div className="table-container" style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                                            <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Date</th>
                                            <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Two Inches Sizes (6,7,8,9,10)</th>
                                            <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>B to Ten Sizes (10,12,14...Bar)</th>
                                            <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Lost Weight</th>
                                            <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Spoilage Weight</th>
                                            <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Return Weight</th>
                                            <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569', textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {savedRecords.filter(r => r.refinementRecordId === selectedRecordId).length === 0 ? (
                                            <tr>
                                                <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                                                    No sorting history recorded for this stock item.
                                                </td>
                                            </tr>
                                        ) : savedRecords.filter(r => r.refinementRecordId === selectedRecordId).map(record => (
                                            <tr key={record.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontWeight: '500', color: '#0f172a' }}>{formatDateTime(record.date)}</td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        {record.size6 > 0 && <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>6": {record.size6.toFixed(3)}</span>}
                                                        {record.size7 > 0 && <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>7": {record.size7.toFixed(3)}</span>}
                                                        {record.size8 > 0 && <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>8": {record.size8.toFixed(3)}</span>}
                                                        {record.size9 > 0 && <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>9": {record.size9.toFixed(3)}</span>}
                                                        {record.size10 > 0 && <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>10": {record.size10.toFixed(3)}</span>}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        {record.size10B > 0 && <span style={{ background: '#faf5ff', color: '#8b5cf6', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>10B: {record.size10B.toFixed(3)}</span>}
                                                        {record.size12 > 0 && <span style={{ background: '#faf5ff', color: '#8b5cf6', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>12": {record.size12.toFixed(3)}</span>}
                                                        {record.size14 > 0 && <span style={{ background: '#faf5ff', color: '#8b5cf6', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>14": {record.size14.toFixed(3)}</span>}
                                                        {record.size16 > 0 && <span style={{ background: '#faf5ff', color: '#8b5cf6', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>16": {record.size16.toFixed(3)}</span>}
                                                        {record.size18 > 0 && <span style={{ background: '#faf5ff', color: '#8b5cf6', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>18": {record.size18.toFixed(3)}</span>}
                                                        {record.size20 > 0 && <span style={{ background: '#faf5ff', color: '#8b5cf6', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>20": {record.size20.toFixed(3)}</span>}
                                                        {record.size22 > 0 && <span style={{ background: '#faf5ff', color: '#8b5cf6', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>22": {record.size22.toFixed(3)}</span>}
                                                        {record.size24 > 0 && <span style={{ background: '#faf5ff', color: '#8b5cf6', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>24": {record.size24.toFixed(3)}</span>}
                                                        {record.size26 > 0 && <span style={{ background: '#faf5ff', color: '#8b5cf6', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>26": {record.size26.toFixed(3)}</span>}
                                                        {record.size28 > 0 && <span style={{ background: '#faf5ff', color: '#8b5cf6', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>28": {record.size28.toFixed(3)}</span>}
                                                        {record.sizeBar > 0 && <span style={{ background: '#faf5ff', color: '#8b5cf6', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>Bar: {record.sizeBar.toFixed(3)}</span>}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>
                                                        {record.lostWeight ? record.lostWeight.toFixed(3) : '0.000'} viss
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={{ background: '#ffedd5', color: '#ea580c', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>
                                                        {record.spoilageWeight ? record.spoilageWeight.toFixed(3) : '0.000'} viss
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={{ background: '#dbeafe', color: '#2563eb', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>
                                                        {record.returnWeight ? record.returnWeight.toFixed(3) : '0.000'} viss
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                    {hasPermission('SingleDoubleDrawn.Delete') && (
                                                        <button onClick={() => handleDeleteRecord(record.id)} className="btn btn-danger" style={{ padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                ) : (
                    // Placeholder when no selection + Global History
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', padding: '40px 20px', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                            <Sparkles size={40} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
                            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#64748b', margin: '0 0 4px 0' }}>No Selection</h3>
                            <p style={{ fontSize: '13.0px', margin: 0 }}>Select a refined stock record from the sidebar to start sorting sizes.</p>
                        </div>

                        <div className="history-section">
                            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>Global Sorting History</h2>
                            <div className="table-container" style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                                            <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Stock Item</th>
                                            <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Date</th>
                                            <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Two Inches Sizes (6,7,8,9,10)</th>
                                            <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>B to Ten Sizes (10,12,14...Bar)</th>
                                            <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Lost Weight</th>
                                            <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Spoilage Weight</th>
                                            <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Return Weight</th>
                                            <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569', textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {savedRecords.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                                                    No sorting history recorded.
                                                </td>
                                            </tr>
                                        ) : savedRecords.map(record => (
                                            <tr key={record.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '12px 16px', fontWeight: '600', color: '#334155' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: '700' }}>{record.refinementRecordMarker || '---'}</span>
                                                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                                                            {record.refinementRecordWarehouseName || '---'} • {record.refinementRecordCategory || '---'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontWeight: '500', color: '#0f172a' }}>{formatDateTime(record.date)}</td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        {record.size6 > 0 && <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>6": {record.size6.toFixed(3)}</span>}
                                                        {record.size7 > 0 && <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>7": {record.size7.toFixed(3)}</span>}
                                                        {record.size8 > 0 && <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>8": {record.size8.toFixed(3)}</span>}
                                                        {record.size9 > 0 && <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>9": {record.size9.toFixed(3)}</span>}
                                                        {record.size10 > 0 && <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>10": {record.size10.toFixed(3)}</span>}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        {record.size10B > 0 && <span style={{ background: '#faf5ff', color: '#8b5cf6', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>10B: {record.size10B.toFixed(3)}</span>}
                                                        {record.size12 > 0 && <span style={{ background: '#faf5ff', color: '#8b5cf6', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>12": {record.size12.toFixed(3)}</span>}
                                                        {record.size14 > 0 && <span style={{ background: '#faf5ff', color: '#8b5cf6', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>14": {record.size14.toFixed(3)}</span>}
                                                        {record.size16 > 0 && <span style={{ background: '#faf5ff', color: '#8b5cf6', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>16": {record.size16.toFixed(3)}</span>}
                                                        {record.size18 > 0 && <span style={{ background: '#faf5ff', color: '#8b5cf6', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>18": {record.size18.toFixed(3)}</span>}
                                                        {record.size20 > 0 && <span style={{ background: '#faf5ff', color: '#8b5cf6', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>20": {record.size20.toFixed(3)}</span>}
                                                        {record.size22 > 0 && <span style={{ background: '#faf5ff', color: '#8b5cf6', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>22": {record.size22.toFixed(3)}</span>}
                                                        {record.size24 > 0 && <span style={{ background: '#faf5ff', color: '#8b5cf6', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>24": {record.size24.toFixed(3)}</span>}
                                                        {record.size26 > 0 && <span style={{ background: '#faf5ff', color: '#8b5cf6', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>26": {record.size26.toFixed(3)}</span>}
                                                        {record.size28 > 0 && <span style={{ background: '#faf5ff', color: '#8b5cf6', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>28": {record.size28.toFixed(3)}</span>}
                                                        {record.sizeBar > 0 && <span style={{ background: '#faf5ff', color: '#8b5cf6', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>Bar: {record.sizeBar.toFixed(3)}</span>}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>
                                                        {record.lostWeight ? record.lostWeight.toFixed(3) : '0.000'} viss
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={{ background: '#ffedd5', color: '#ea580c', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>
                                                        {record.spoilageWeight ? record.spoilageWeight.toFixed(3) : '0.000'} viss
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={{ background: '#dbeafe', color: '#2563eb', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700' }}>
                                                        {record.returnWeight ? record.returnWeight.toFixed(3) : '0.000'} viss
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                    {hasPermission('SingleDoubleDrawn.Delete') && (
                                                        <button onClick={() => handleDeleteRecord(record.id)} className="btn btn-danger" style={{ padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default SingleDoubleDrawn;
