import React, { useEffect, useState } from 'react';
import { productsAPI, processingAPI } from '../../services/api';
import type { Product, ProcessingRecord } from '../../types';
import './index.css';

const Sales2: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [records, setRecords] = useState<ProcessingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingRecord, setViewingRecord] = useState<ProcessingRecord | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [productsData, recordsData] = await Promise.all([
                productsAPI.getAll(),
                processingAPI.getAll(),
            ]);
            setProducts(productsData);
            setRecords(recordsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="spinner"></div>;
    }

    return (
        <div className="sales fade-in">
            <h1 className="page-title">အပွရုံစာရင်း</h1>

            <div className="card list-card">
                <h2 className="card-title">လတ်တလော မှတ်တမ်းများ</h2>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Marker</th>
                                <th>Staff</th>
                                <th>Categories</th>
                                <th>Total Weight</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.slice(0, 20).map((record) => (
                                <tr key={record.id} onClick={() => setViewingRecord(record)} style={{ cursor: 'pointer' }}>
                                    <td>{new Date(record.date).toLocaleDateString()}</td>
                                    <td>{record.productMarker}</td>
                                    <td>{record.workerNames}</td>
                                    <td>
                                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", maxWidth: "450px" }}>
                                            {record.redCount > 0 && <span className="card-badge" style={{ color: "#c53030", background: "#fff5f5", border: "1px solid #fc8181", padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Red: {record.redCount}</span>}
                                            {record.whiteCount > 0 && <span className="card-badge" style={{ color: "#4a5568", background: "#f7fafc", border: "1px solid #cbd5e0", padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>White: {record.whiteCount}</span>}
                                            {record.specialCount > 0 && <span className="card-badge" style={{ color: "#6b46c1", background: "#faf5ff", border: "1px solid #b794f4", padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Simple: {record.specialCount}</span>}
                                            {record.naturalCount > 0 && <span className="card-badge" style={{ color: "#276749", background: "#f0fff4", border: "1px solid #68d391", padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Natural: {record.naturalCount}</span>}
                                            {record.naturalWhiteCount > 0 && <span className="card-badge" style={{ color: "#2b6cb0", background: "#ebf8ff", border: "1px solid #63b3ed", padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>N.White: {record.naturalWhiteCount}</span>}
                                            {record.naturalRedCount > 0 && <span className="card-badge" style={{ color: "#c05621", background: "#fff8f1", border: "1px solid #f6ad55", padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>N.Red: {record.naturalRedCount}</span>}
                                            {record.shortCutCount > 0 && <span className="card-badge" style={{ color: "#975a16", background: "#fffff0", border: "1px solid #f6e05e", padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>S.Cut: {record.shortCutCount}</span>}
                                            {record.artificialCount > 0 && <span className="card-badge" style={{ color: "#702459", background: "#fdf2f8", border: "1px solid #d6bcfa", padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Art: {record.artificialCount}</span>}
                                            {record.shortCount > 0 && <span className="card-badge" style={{ color: "#92400e", background: "#fef3c7", border: "1px solid #f59e0b", padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Short: {record.shortCount}</span>}
                                            {record.lossWeight > 0 && <span className="card-badge" style={{ color: "#975a16", background: "#fffaf0", border: "1px solid #fbd38d", padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Loss: {record.lossWeight.toFixed(2)}v</span>}
                                        </div>
                                    </td>
                                    <td>{record.totalWeight.toFixed(4)} viss</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {viewingRecord && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewingRecord(null); }}>
                    <div className="modal-content" style={{ maxWidth: '800px', background: 'white', padding: '28px', borderRadius: '16px', position: 'relative' }}>
                        <button onClick={() => setViewingRecord(null)} style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifySelf: 'center', lineHeight: 1 }}>×</button>

                        <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '16px', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '22px', color: '#1e293b' }}>မှတ်တမ်း အသေးစိတ် — <span style={{ color: '#3b82f6' }}>{viewingRecord.productMarker}</span></h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                            <div className="detail-item">
                                <label style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, display: 'block', marginBottom: '4px' }}>ရက်စွဲ (Date)</label>
                                <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>{new Date(viewingRecord.date).toLocaleDateString()}</div>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, display: 'block', marginBottom: '4px' }}>အပွရွေးသူများ (Workers)</label>
                                <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>{viewingRecord.workerNames}</div>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Unit Weight</label>
                                <div style={{ fontSize: '16px', fontWeight: 600, color: '#3b82f6' }}>{viewingRecord.unitWeight.toFixed(4)} <span style={{ fontSize: '12px' }}>viss</span></div>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, display: 'block', marginBottom: '4px' }}>စုစုပေါင်း ထုပ် (Total Count)</label>
                                <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>{viewingRecord.count}</div>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, display: 'block', marginBottom: '4px' }}>ကျန်ရှိ ထုပ် (Rem. Count)</label>
                                <div style={{ fontSize: '16px', fontWeight: 600, color: '#10b981' }}>{viewingRecord.remainingCount}</div>
                            </div>
                            <div className="detail-item">
                                <label style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, display: 'block', marginBottom: '4px' }}>ကျန်ရှိ အလေးချိန် (Rem. Weight)</label>
                                <div style={{ fontSize: '16px', fontWeight: 600, color: '#10b981' }}>{viewingRecord.remainingWeight.toFixed(4)} <span style={{ fontSize: '12px' }}>viss</span></div>
                            </div>
                        </div>

                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#334155', marginBottom: '16px', borderLeft: '4px solid #3b82f6', paddingLeft: '12px' }}>Categories Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
                            {viewingRecord.redCount > 0 && (
                                <div style={{ padding: '12px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#c53030', fontWeight: 600 }}>Red (နီ)</div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#9b1c1c' }}>{viewingRecord.redCount} <span style={{ fontSize: '12px' }}>ထုပ်</span></div>
                                    <div style={{ fontSize: '11px', color: '#c53030' }}>{viewingRecord.redWeight.toFixed(3)} v</div>
                                </div>
                            )}
                            {viewingRecord.whiteCount > 0 && (
                                <div style={{ padding: '12px', background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#4a5568', fontWeight: 600 }}>White (ဖြူ)</div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#2d3748' }}>{viewingRecord.whiteCount} <span style={{ fontSize: '12px' }}>ထုပ်</span></div>
                                    <div style={{ fontSize: '11px', color: '#4a5568' }}>{viewingRecord.whiteWeight.toFixed(3)} v</div>
                                </div>
                            )}
                            {viewingRecord.specialCount > 0 && (
                                <div style={{ padding: '12px', background: '#faf5ff', border: '1px solid #e9d8fd', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#6b46c1', fontWeight: 600 }}>Simple (ရှယ်)</div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#553c9a' }}>{viewingRecord.specialCount} <span style={{ fontSize: '12px' }}>ထုပ်</span></div>
                                    <div style={{ fontSize: '11px', color: '#6b46c1' }}>{viewingRecord.specialWeight.toFixed(3)} v</div>
                                </div>
                            )}
                            {viewingRecord.naturalCount > 0 && (
                                <div style={{ padding: '12px', background: '#f0fff4', border: '1px solid #c6f6d5', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#276749', fontWeight: 600 }}>Natural (သဘာဝ)</div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#22543d' }}>{viewingRecord.naturalCount} <span style={{ fontSize: '12px' }}>ထုပ်</span></div>
                                    <div style={{ fontSize: '11px', color: '#276749' }}>{viewingRecord.naturalWeight.toFixed(3)} v</div>
                                </div>
                            )}
                            {viewingRecord.naturalWhiteCount > 0 && (
                                <div style={{ padding: '12px', background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#2b6cb0', fontWeight: 600 }}>N.White (သဘာဝဖြူ)</div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#2a4365' }}>{viewingRecord.naturalWhiteCount} <span style={{ fontSize: '12px' }}>ထုပ်</span></div>
                                    <div style={{ fontSize: '11px', color: '#2b6cb0' }}>{viewingRecord.naturalWhiteWeight.toFixed(3)} v</div>
                                </div>
                            )}
                            {viewingRecord.naturalRedCount > 0 && (
                                <div style={{ padding: '12px', background: '#fff8f1', border: '1px solid #feebc8', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#c05621', fontWeight: 600 }}>N.Red (သဘာဝနီ)</div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#7b341e' }}>{viewingRecord.naturalRedCount} <span style={{ fontSize: '12px' }}>ထုပ်</span></div>
                                    <div style={{ fontSize: '11px', color: '#c05621' }}>{viewingRecord.naturalRedWeight.toFixed(3)} v</div>
                                </div>
                            )}
                            {viewingRecord.shortCutCount > 0 && (
                                <div style={{ padding: '12px', background: '#fffff0', border: '1px solid #fefcbf', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#975a16', fontWeight: 600 }}>S.Cut (အတိုဖြတ်)</div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#744210' }}>{viewingRecord.shortCutCount} <span style={{ fontSize: '12px' }}>ထုပ်</span></div>
                                    <div style={{ fontSize: '11px', color: '#975a16' }}>{viewingRecord.shortCutWeight.toFixed(3)} v</div>
                                </div>
                            )}
                            {viewingRecord.artificialCount > 0 && (
                                <div style={{ padding: '12px', background: '#fdf2f8', border: '1px solid #fed7e7', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#b83280', fontWeight: 600 }}>Art (တုပ်ကုန်)</div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#702459' }}>{viewingRecord.artificialCount} <span style={{ fontSize: '12px' }}>ထုပ်</span></div>
                                    <div style={{ fontSize: '11px', color: '#b83280' }}>{viewingRecord.artificialWeight.toFixed(3)} v</div>
                                </div>
                            )}
                            {viewingRecord.shortCount > 0 && (
                                <div style={{ padding: '12px', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#92400e', fontWeight: 600 }}>Short (အတို)</div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#78350f' }}>{viewingRecord.shortCount} <span style={{ fontSize: '12px' }}>ထုပ်</span></div>
                                    <div style={{ fontSize: '11px', color: '#92400e' }}>{viewingRecord.shortWeight.toFixed(3)} v</div>
                                </div>
                            )}
                            {viewingRecord.lossWeight > 0 && (
                                <div style={{ padding: '12px', background: '#fffaf0', border: '1px solid #fbd38d', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#975a16', fontWeight: 600 }}>Loss (အလျော့)</div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#744210' }}>{viewingRecord.lossWeight.toFixed(3)} <span style={{ fontSize: '12px' }}>viss</span></div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #f1f5f9', paddingTop: '24px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '40px' }}>
                                <div>
                                    <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>စုစုပေါင်း အလေးချိန် (Total Weight)</div>
                                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{viewingRecord.totalWeight.toFixed(4)} <span style={{ fontSize: '16px' }}>viss</span></div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>ကွာခြားချက် (Difference)</div>
                                    <div style={{ fontSize: '24px', fontWeight: 800, color: Math.abs(viewingRecord.difference) > 0.1 ? '#ef4444' : '#10b981' }}>
                                        {viewingRecord.difference > 0 ? '+' : ''}{viewingRecord.difference.toFixed(4)} <span style={{ fontSize: '16px' }}>viss</span>
                                    </div>
                                </div>
                            </div>
                            {viewingRecord.remainingWeightKg && (
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>KG ဖြင့် (Remaining)</div>
                                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>{viewingRecord.remainingWeightKg.toFixed(3)} <span style={{ fontSize: '14px' }}>kg</span></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales2;
