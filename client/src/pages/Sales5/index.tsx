import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { singleDoubleDrawnAPI, semiExportAPI } from '../../services/api';
import type { SingleDoubleDrawnRecord, SemiExportRecord } from '../../types';
import { Package, Search, Sparkles, Send, DollarSign, Trash2, LayoutGrid, Weight, FileText, CheckCircle } from 'lucide-react';
import { formatDateTime } from '../../utils/format';
import './index.css';

const PAGE_CATEGORY = 'Sales5';

const Sales5: React.FC = () => {
    const { hasPermission } = useAuth();
    const [sddRecords, setSddRecords] = useState<SingleDoubleDrawnRecord[]>([]);
    const [savedExports, setSavedExports] = useState<SemiExportRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSddId, setSelectedSddId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);
    const [remark, setRemark] = useState('');

    const [prices, setPrices] = useState({
        priceB: 0,
        price28: 0,
        price26: 0,
        price24: 0,
        price22: 0,
        price20: 0,
        price18: 0,
        price16: 0,
        price14: 0,
        price12: 0,
        price10B: 0,
        price10: 0,
        price9: 0,
        price8: 0,
        price7: 0,
        price6: 0,
        priceLeftover: 0,
        priceSpoil: 0,
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedSddId) {
            loadSelectedSemiExport(selectedSddId);
        } else {
            resetForm();
        }
    }, [selectedSddId]);

    const loadData = async () => {
        try {
            const [sddData, exportData] = await Promise.all([
                singleDoubleDrawnAPI.getAll(),
                semiExportAPI.getAll()
            ]);
            setSddRecords(sddData);
            setSavedExports(exportData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSelectedSemiExport = async (id: number) => {
        try {
            const record = await semiExportAPI.getBySingleDoubleDrawn(id);
            if (record) {
                setPrices({
                    priceB: record.priceB,
                    price28: record.price28,
                    price26: record.price26,
                    price24: record.price24,
                    price22: record.price22,
                    price20: record.price20,
                    price18: record.price18,
                    price16: record.price16,
                    price14: record.price14,
                    price12: record.price12,
                    price10B: record.price10B,
                    price10: record.price10,
                    price9: record.price9,
                    price8: record.price8,
                    price7: record.price7,
                    price6: record.price6,
                    priceLeftover: record.priceLeftover,
                    priceSpoil: record.priceSpoil,
                });
                setRemark(record.remark);
            } else {
                resetForm();
            }
        } catch (e) {
            console.error('Failed to load semi export record:', e);
            resetForm();
        }
    };

    const resetForm = () => {
        setPrices({
            priceB: 0,
            price28: 0,
            price26: 0,
            price24: 0,
            price22: 0,
            price20: 0,
            price18: 0,
            price16: 0,
            price14: 0,
            price12: 0,
            price10B: 0,
            price10: 0,
            price9: 0,
            price8: 0,
            price7: 0,
            price6: 0,
            priceLeftover: 0,
            priceSpoil: 0,
        });
        setRemark('');
        setFormError('');
    };

    const selectedRecord = useMemo(
        () => sddRecords.find(r => r.id === selectedSddId),
        [sddRecords, selectedSddId]
    );

    // Filter sidebar list
    const filteredRecords = useMemo(() => {
        return sddRecords.filter(r => {
            const search = searchTerm.toLowerCase();
            const marker = (r.refinementRecordMarker || '').toLowerCase();
            const category = (r.refinementRecordCategory || '').toLowerCase();
            const warehouse = (r.refinementRecordWarehouseName || '').toLowerCase();
            const dateStr = r.date ? new Date(r.date).toLocaleDateString().toLowerCase() : '';

            return marker.includes(search) ||
                category.includes(search) ||
                warehouse.includes(search) ||
                dateStr.includes(search);
        });
    }, [sddRecords, searchTerm]);

    // Calculate grouped weights for the selected record
    const calculations = useMemo(() => {
        if (!selectedRecord) return null;

        const wB = selectedRecord.sizeBar || 0;
        const w28 = selectedRecord.size28 || 0;
        const w26 = selectedRecord.size26 || 0;
        const w24 = selectedRecord.size24 || 0;
        const w22 = selectedRecord.size22 || 0;
        const w20 = selectedRecord.size20 || 0;
        const w18 = selectedRecord.size18 || 0;
        const w16 = selectedRecord.size16 || 0;
        const w14 = selectedRecord.size14 || 0;
        const w12 = selectedRecord.size12 || 0;
        const w10B = selectedRecord.size10B || 0;
        const w10 = selectedRecord.size10 || 0;
        const w9 = selectedRecord.size9 || 0;
        const w8 = selectedRecord.size8 || 0;
        const w7 = selectedRecord.size7 || 0;
        const w6 = selectedRecord.size6 || 0;
        const wLeftover = selectedRecord.returnWeight || 0;
        const wSpoil = selectedRecord.spoilageWeight || 0;
        const wLoss = selectedRecord.lostWeight || 0;

        const totalWeight = wB + w28 + w26 + w24 + w22 + w20 + w18 + w16 + w14 + w12 + w10B + w10 + w9 + w8 + w7 + w6 + wLeftover + wSpoil;
        const denominator = totalWeight - wLoss > 0 ? totalWeight - wLoss : 1;

        return {
            wB, w28, w26, w24, w22, w20, w18, w16, w14, w12, w10B, w10, w9, w8, w7, w6, wLeftover, wSpoil, wLoss,
            totalWeight,
            denominator
        };
    }, [selectedRecord]);

    const handlePriceChange = (field: keyof typeof prices, val: string) => {
        const numVal = val === '' ? 0 : parseFloat(val);
        setPrices(prev => ({
            ...prev,
            [field]: numVal >= 0 ? numVal : 0
        }));
    };

    // Calculate row Amounts
    const rowAmounts = useMemo(() => {
        if (!calculations) return null;
        const { wB, w28, w26, w24, w22, w20, w18, w16, w14, w12, w10B, w10, w9, w8, w7, w6, wLeftover, wSpoil } = calculations;

        const amtB = wB * prices.priceB;
        const amt28 = w28 * prices.price28;
        const amt26 = w26 * prices.price26;
        const amt24 = w24 * prices.price24;
        const amt22 = w22 * prices.price22;
        const amt20 = w20 * prices.price20;
        const amt18 = w18 * prices.price18;
        const amt16 = w16 * prices.price16;
        const amt14 = w14 * prices.price14;
        const amt12 = w12 * prices.price12;
        const amt10B = w10B * prices.price10B;
        const amt10 = w10 * prices.price10;
        const amt9 = w9 * prices.price9;
        const amt8 = w8 * prices.price8;
        const amt7 = w7 * prices.price7;
        const amt6 = w6 * prices.price6;
        const amtLeftover = wLeftover * prices.priceLeftover;
        const amtSpoil = wSpoil * prices.priceSpoil;

        const totalAmount = amtB + amt28 + amt26 + amt24 + amt22 + amt20 + amt18 + amt16 + amt14 + amt12 + amt10B + amt10 + amt9 + amt8 + amt7 + amt6 + amtLeftover + amtSpoil;

        return {
            amtB, amt28, amt26, amt24, amt22, amt20, amt18, amt16, amt14, amt12, amt10B, amt10, amt9, amt8, amt7, amt6, amtLeftover, amtSpoil,
            totalAmount
        };
    }, [calculations, prices]);

    // Calculate the total sorted weights for sidebar display
    const getSortedTotal = (record: SingleDoubleDrawnRecord) => {
        return record.size6 + record.size7 + record.size8 + record.size9 + record.size10 +
            record.size10B + record.size12 + record.size14 + record.size16 + record.size18 +
            record.size20 + record.size22 + record.size24 + record.size26 + record.size28 + record.sizeBar;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSddId) return;
        setSaving(true);
        setFormError('');

        try {
            const dto = {
                singleDoubleDrawnRecordId: selectedSddId,
                priceB: prices.priceB,
                price28: prices.price28,
                price26: prices.price26,
                price24: prices.price24,
                price22: prices.price22,
                price20: prices.price20,
                price18: prices.price18,
                price16: prices.price16,
                price14: prices.price14,
                price12: prices.price12,
                price10B: prices.price10B,
                price10: prices.price10,
                price9: prices.price9,
                price8: prices.price8,
                price7: prices.price7,
                price6: prices.price6,
                priceLeftover: prices.priceLeftover,
                priceSpoil: prices.priceSpoil,
                remark
            };

            await semiExportAPI.upsert(dto);
            await loadData();
            // Clear selection after saving
            setSelectedSddId(null);
        } catch (err) {
            console.error('Failed to save export prices:', err);
            setFormError('Failed to save Semi Export transaction. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteExport = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this Semi Export record?')) return;
        try {
            await semiExportAPI.delete(id);
            await loadData();
        } catch (err) {
            console.error('Failed to delete export:', err);
            alert('Failed to delete record');
        }
    };

    if (loading) {
        return <div className="spinner"></div>;
    }

    return (
        <div className="processing-container fade-in">
            {/* Left Sidebar: Single Double Drawn Sorting List */}
            <aside className="product-sidebar">
                <h2 className="sidebar-title">
                    <Package size={20} />
                    Sorted Batches
                </h2>

                <div className="sidebar-search" style={{ marginBottom: '20px', position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search marker, warehouse..."
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
                            No sorted batches found
                        </div>
                    ) : filteredRecords.map(record => {
                        const totalSorted = getSortedTotal(record);
                        const isSaved = savedExports.some(x => x.singleDoubleDrawnRecordId === record.id);
                        return (
                            <div
                                key={record.id}
                                className={`product-card ${selectedSddId === record.id ? 'selected' : ''}`}
                                onClick={() => setSelectedSddId(record.id)}
                            >
                                <div className="card-header">
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span className="card-marker">{record.refinementRecordMarker || '---'}</span>
                                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                                            {record.refinementRecordWarehouseName || '---'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        {isSaved && (
                                            <span style={{ background: '#d1fae5', color: '#065f46', fontSize: '10.0px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                                <CheckCircle size={10} /> Saved
                                            </span>
                                        )}
                                        <span className={`rf-badge category-${(record.refinementRecordCategory || '').toLowerCase().replace('.', '')}`}>
                                            {record.refinementRecordCategory}
                                        </span>
                                    </div>
                                </div>
                                <div className="card-details">
                                    <span>Sorted: <strong style={{ color: '#059669' }}>{totalSorted.toFixed(3)}</strong> viss</span>
                                    <span>Date: <span style={{ color: '#475569', fontWeight: 500 }}>{new Date(record.date).toLocaleDateString()}</span></span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </aside>

            {/* Right Main Content */}
            <main className="processing-main">
                {selectedRecord && calculations && rowAmounts ? (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        
                        {/* Header details */}
                        <div className="main-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #f1f5f9' }}>
                            <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <DollarSign size={32} style={{ color: '#2563eb' }} />
                                <div>
                                    <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#0f172a' }}>Semi Export (Simi Export) Pricing</h1>
                                    <p className="header-subtitle" style={{ fontSize: '13.5px', color: '#64748b', margin: '6px 0 0 0', fontWeight: '500' }}>
                                        Sorted Record: <strong>{selectedRecord.refinementRecordMarker}</strong> ({selectedRecord.refinementRecordCategory}) • Warehouse: <strong>{selectedRecord.refinementRecordWarehouseName || '---'}</strong>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Excel Spreadsheet like Pricing Table */}
                        <form onSubmit={handleSave}>
                            <div className="table-container" style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: 'white', marginBottom: '24px' }}>
                                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                                            <th style={{ padding: '12px 20px', fontWeight: '700', color: '#475569' }}>SIZE</th>
                                            <th style={{ padding: '12px 20px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>WEIGHT (viss)</th>
                                            <th style={{ padding: '12px 20px', fontWeight: '700', color: '#475569', width: '160px' }}>BUY PRICES</th>
                                            <th style={{ padding: '12px 20px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>AMOUNT</th>
                                            <th style={{ padding: '12px 20px', fontWeight: '700', color: '#475569', textAlign: 'right', width: '110px' }}>AVG %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Dynamic Rows mapping sizes */}
                                        {[
                                            { label: 'B', key: 'priceB', w: calculations.wB, amt: rowAmounts.amtB },
                                            { label: '28', key: 'price28', w: calculations.w28, amt: rowAmounts.amt28 },
                                            { label: '26', key: 'price26', w: calculations.w26, amt: rowAmounts.amt26 },
                                            { label: '24', key: 'price24', w: calculations.w24, amt: rowAmounts.amt24 },
                                            { label: '22', key: 'price22', w: calculations.w22, amt: rowAmounts.amt22 },
                                            { label: '20', key: 'price20', w: calculations.w20, amt: rowAmounts.amt20 },
                                            { label: '18', key: 'price18', w: calculations.w18, amt: rowAmounts.amt18 },
                                            { label: '16', key: 'price16', w: calculations.w16, amt: rowAmounts.amt16 },
                                            { label: '14', key: 'price14', w: calculations.w14, amt: rowAmounts.amt14 },
                                            { label: '12', key: 'price12', w: calculations.w12, amt: rowAmounts.amt12 },
                                            { label: '10B', key: 'price10B', w: calculations.w10B, amt: rowAmounts.amt10B },
                                            { label: '10', key: 'price10', w: calculations.w10, amt: rowAmounts.amt10 },
                                            { label: '9', key: 'price9', w: calculations.w9, amt: rowAmounts.amt9 },
                                            { label: '8', key: 'price8', w: calculations.w8, amt: rowAmounts.amt8 },
                                            { label: '7', key: 'price7', w: calculations.w7, amt: rowAmounts.amt7 },
                                            { label: '6', key: 'price6', w: calculations.w6, amt: rowAmounts.amt6 },
                                            { label: 'Leftover', key: 'priceLeftover', w: calculations.wLeftover, amt: rowAmounts.amtLeftover },
                                            { label: 'Spoil', key: 'priceSpoil', w: calculations.wSpoil, amt: rowAmounts.amtSpoil },
                                        ].map((row, index) => {
                                            const avgPercent = (row.w / calculations.denominator) * 100;
                                            const isSpoil = row.label === 'Spoil';
                                            return (
                                                <tr key={row.label} style={{ borderBottom: '1px solid #f1f5f9', background: index % 2 === 0 ? 'white' : '#fdfdfd' }}>
                                                    <td style={{ padding: '10px 20px', fontWeight: '700', color: '#1e293b' }}>{row.label}</td>
                                                    <td style={{ padding: '10px 20px', textAlign: 'right', fontWeight: '500', color: '#475569' }}>
                                                        {row.w.toFixed(3)}
                                                    </td>
                                                    <td style={{ padding: '8px 20px' }}>
                                                        {isSpoil ? (
                                                            <div style={{ padding: '8px 12px', fontSize: '14px', color: '#94a3b8', fontWeight: 600, background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>0</div>
                                                        ) : (
                                                            <input
                                                                type="number"
                                                                value={prices[row.key as keyof typeof prices] || ''}
                                                                onChange={e => handlePriceChange(row.key as keyof typeof prices, e.target.value)}
                                                                placeholder="0"
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '8px 12px',
                                                                    borderRadius: '8px',
                                                                    border: '1.5px solid #cbd5e1',
                                                                    fontSize: '13.5px',
                                                                    fontWeight: '600',
                                                                    color: '#0f172a',
                                                                    outline: 'none',
                                                                    transition: 'border-color 0.2s',
                                                                    boxSizing: 'border-box'
                                                                }}
                                                                onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                                                                onBlur={(e) => e.target.value === '' && handlePriceChange(row.key as keyof typeof prices, '0')}
                                                            />
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '10px 20px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                                                        {row.amt.toFixed(2)}
                                                    </td>
                                                    <td style={{ padding: '10px 20px', textAlign: 'right', fontWeight: '600', color: '#64748b' }}>
                                                        {avgPercent.toFixed(2)}%
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {/* TOTAL ROW */}
                                        <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1', borderBottom: '2.5px double #cbd5e1' }}>
                                            <td style={{ padding: '12px 20px', fontWeight: '800', color: '#0f172a' }}>TOTAL</td>
                                            <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: '800', color: '#0f172a' }}>
                                                {calculations.totalWeight.toFixed(3)}
                                            </td>
                                            <td style={{ padding: '12px 20px' }}></td>
                                            <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: '800', color: '#2563eb' }}>
                                                {rowAmounts.totalAmount.toFixed(2)}
                                            </td>
                                            <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: '800', color: '#475569' }}>
                                                {((calculations.totalWeight / calculations.denominator) * 100).toFixed(2)}%
                                            </td>
                                        </tr>

                                        {/* LOSS ROW */}
                                        <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#fffbeb' }}>
                                            <td style={{ padding: '10px 20px', fontWeight: '700', color: '#b45309' }}>Loss</td>
                                            <td style={{ padding: '10px 20px', textAlign: 'right', fontWeight: '700', color: '#b45309' }}>
                                                {calculations.wLoss.toFixed(3)}
                                            </td>
                                            <td style={{ padding: '10px 20px' }}></td>
                                            <td style={{ padding: '10px 20px' }}></td>
                                            <td style={{ padding: '10px 20px', textAlign: 'right', fontWeight: '700', color: '#b45309' }}>
                                                {((calculations.wLoss / calculations.denominator) * 100).toFixed(2)}%
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Remark section */}
                            <div className="remark-section" style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1.5px solid #e2e8f0', marginBottom: '24px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                                    <FileText size={16} /> REMARK:
                                </label>
                                <textarea
                                    value={remark}
                                    onChange={e => setRemark(e.target.value)}
                                    placeholder="Enter remark here..."
                                    rows={2}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1.5px solid #cbd5e1',
                                        fontSize: '13.5px',
                                        color: '#0f172a',
                                        outline: 'none',
                                        resize: 'vertical',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button type="submit" disabled={saving} className="submit-btn" style={{
                                    flex: 1, padding: '14px',
                                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                    color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
                                    opacity: saving ? 0.7 : 1,
                                    transition: 'all 0.3s ease'
                                }}>
                                    <Send size={16} /> {saving ? 'Saving...' : 'Save Semi Export Details'}
                                </button>
                                <button type="button" onClick={() => setSelectedSddId(null)} className="btn btn-secondary" style={{
                                    padding: '0 24px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer'
                                }}>
                                    Cancel
                                </button>
                            </div>

                            {formError && (
                                <p style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600, marginTop: '10px', textAlign: 'center' }}>{formError}</p>
                            )}
                        </form>

                    </div>
                ) : (
                    // Placeholder when no selection + Global History
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', padding: '40px 20px', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                            <Sparkles size={40} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
                            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#64748b', margin: '0 0 4px 0' }}>No Selection</h3>
                            <p style={{ fontSize: '13.0px', margin: 0 }}>Select a sorted batch from the sidebar to calculate pricing and amounts.</p>
                        </div>

                        <div className="history-section">
                            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>Semi Export History</h2>
                            <div className="table-container" style={{ border: '1.5px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                                            <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Sorted Batch</th>
                                            <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Export Date</th>
                                            <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Total Amount</th>
                                            <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569' }}>Remark</th>
                                            <th style={{ padding: '12px 16px', fontWeight: '700', color: '#475569', textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {savedExports.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                                                    No export history recorded.
                                                </td>
                                            </tr>
                                        ) : savedExports.map(record => {
                                            // Calculate total amount from saved prices and the linked SDD record
                                            const sdd = sddRecords.find(x => x.id === record.singleDoubleDrawnRecordId);
                                            let totalAmount = 0;
                                            if (sdd) {
                                                const wB = sdd.sizeBar || 0;
                                                const w28 = sdd.size28 || 0;
                                                const w26 = sdd.size26 || 0;
                                                const w24 = sdd.size24 || 0;
                                                const w22 = sdd.size22 || 0;
                                                const w20 = sdd.size20 || 0;
                                                const w18 = sdd.size18 || 0;
                                                const w16 = sdd.size16 || 0;
                                                const w14 = sdd.size14 || 0;
                                                const w12 = sdd.size12 || 0;
                                                const w10B = sdd.size10B || 0;
                                                const w10 = sdd.size10 || 0;
                                                const w9 = sdd.size9 || 0;
                                                const w8 = sdd.size8 || 0;
                                                const w7 = sdd.size7 || 0;
                                                const w6 = sdd.size6 || 0;
                                                const wLeftover = sdd.returnWeight || 0;
                                                const wSpoil = sdd.spoilageWeight || 0;

                                                totalAmount = (wB * record.priceB) + (w28 * record.price28) + (w26 * record.price26) +
                                                              (w24 * record.price24) + (w22 * record.price22) + (w20 * record.price20) +
                                                              (w18 * record.price18) + (w16 * record.price16) + (w14 * record.price14) +
                                                              (w12 * record.price12) + (w10B * record.price10B) + (w10 * record.price10) +
                                                              (w9 * record.price9) + (w8 * record.price8) + (w7 * record.price7) + (w6 * record.price6) +
                                                              (wLeftover * record.priceLeftover) + (wSpoil * record.priceSpoil);
                                            }

                                            return (
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
                                                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: '#10b981' }}>
                                                        {totalAmount.toFixed(2)} MMK
                                                    </td>
                                                    <td style={{ padding: '12px 16px', color: '#475569', fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={record.remark}>
                                                        {record.remark || '—'}
                                                    </td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                        {hasPermission('Sales5.Delete') && (
                                                            <button onClick={() => handleDeleteExport(record.id)} className="btn btn-danger" style={{ padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <Trash2 size={13} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
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

export default Sales5;
