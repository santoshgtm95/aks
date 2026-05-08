import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { purificationAPI, purifiersAPI } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import type { AvailableCategory, PurificationProcess, PurifiedRecord, Purifier } from '../../types';
import { Package, Send, History, Loader2, Search, User, Settings, X, Pencil, Trash2 } from 'lucide-react';
import PurifierManagement from '../PurifierManagement';
import { formatDateTime, getMyanmarNow, combineDateWithMyanmarTime } from '../../utils/format';
import './index.css';

const Purification: React.FC = () => {
    const { hasPermission } = useAuth();
    const { showAlert, showConfirm } = useNotification();
    const [availableCategories, setAvailableCategories] = useState<AvailableCategory[]>([]);
    const [processes, setProcesses] = useState<PurificationProcess[]>([]);
    const [purifiedRecords, setPurifiedRecords] = useState<PurifiedRecord[]>([]);
    const [activeTab, setActiveTab] = useState<'history' | 'stock'>('history');
    const [purifiers, setPurifiers] = useState<Purifier[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [inputCounts, setInputCounts] = useState<Record<string, string>>({});
    const [selectedPurifiers, setSelectedPurifiers] = useState<Record<string, number>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [showPurifierManagement, setShowPurifierManagement] = useState(false);
    const [showPurifyModal, setShowPurifyModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<AvailableCategory | null>(null);
    const [editingProcess, setEditingProcess] = useState<PurificationProcess | null>(null);
    const [editingRecord, setEditingRecord] = useState<PurifiedRecord | null>(null);
    const [purifyForm, setPurifyForm] = useState({
        count: '',
        purifierId: 0,
        isWeightFull: true,
        date: getMyanmarNow()
    });

    useEffect(() => {
        loadData();
    }, []);

    const handleInputChance = (recordId: number, category: string, value: string) => {
        const key = `${recordId}-${category}`;
        setInputCounts(prev => ({ ...prev, [key]: value }));
    };

    const handlePurify = async (avail: AvailableCategory) => {
        const key = `${avail.processingRecordId}-${avail.category}`;
        const countStr = inputCounts[key];
        const count = parseInt(countStr);
        const purifierId = selectedPurifiers[key];

        if (!count || count <= 0) return alert('ပမာဏ မှန်ကန်စွာ ထည့်သွင်းပါ');
        if (!purifierId) return alert('Purifier ရွေးချယ်ပါ');

        setSubmitting(key);
        try {
            await purificationAPI.create({
                date: new Date().toISOString(),
                processingRecordId: avail.processingRecordId,
                category: avail.category,
                purifyCount: count,
                purifierId: purifierId,
                isWeightFull: true // Default for inline
            });
            await loadData();
            setInputCounts(prev => ({ ...prev, [key]: '' }));
        } catch (error) {
            console.error('Purification failed:', error);
            alert('အဆင်မပြေပါ');
        } finally {
            setSubmitting(null);
        }
    };

    const loadData = async () => {
        try {
            const [availData, processData, purifiedData, purifierData] = await Promise.all([
                purificationAPI.getAvailableCategories(),
                purificationAPI.getAll(),
                purificationAPI.getPurifiedRecords(),
                purifiersAPI.getAll(),
            ]);
            setAvailableCategories(availData);
            setProcesses(processData);
            setPurifiedRecords(purifiedData);
            setPurifiers(purifierData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: number) => {
        showConfirm(
            'အတည်ပြုရန်',
            'ဤမှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?',
            async () => {
                try {
                    await purificationAPI.delete(id);
                    await loadData();
                } catch (error) {
                    console.error('Delete failed:', error);
                    showAlert('Error', 'ဖျက်၍ မရပါ', 'error');
                }
            }
        );
    };

    const handleClosePurifierManagement = () => {
        setShowPurifierManagement(false);
        loadData(); // Refresh purifiers list
    };
    const handleDeleteRecord = (id: number) => {
        showConfirm(
            'အတည်ပြုရန်',
            'ဤမှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?',
            async () => {
                try {
                    await purificationAPI.deletePurifiedRecord(id);
                    await loadData();
                } catch (error) {
                    console.error('Delete failed:', error);
                    showAlert('Error', 'ဖျက်၍ မရပါ', 'error');
                }
            }
        );
    };

    const handleEditClick = (p: PurificationProcess) => {
        setEditingProcess(p);
        setEditingRecord(null);
        setSelectedCategory(null);
        
        const dateStr = p.date ? (p.date.includes('T') ? p.date.slice(0, 16) : p.date + 'T00:00') : getMyanmarNow();
        
        setPurifyForm({
            count: p.purifyCount.toString(),
            date: dateStr,
            purifierId: p.purifierId || 0,
            isWeightFull: p.isWeightFull
        });
        setShowPurifyModal(true);
    };

    const handleEditRecord = (p: PurifiedRecord) => {
        setEditingRecord(p);
        setEditingProcess(null);
        setSelectedCategory(null);
        
        const dateStr = p.date ? (p.date.includes('T') ? p.date.slice(0, 16) : p.date + 'T00:00') : getMyanmarNow();
        
        setPurifyForm({
            count: p.count.toString(),
            date: dateStr,
            purifierId: p.purifierId || 0,
            isWeightFull: p.isWeightFull
        });
        setShowPurifyModal(true);
    };

    const handleSubmitPurify = async (e: React.FormEvent) => {
        e.preventDefault();
        const count = parseInt(purifyForm.count);
        if (!count || count <= 0) return alert('ပမာဏ မှန်ကန်စွာ ထည့်သွင်းပါ');
        if (!purifyForm.purifierId) return alert('Purifier ရွေးချယ်ပါ');

        // Validation
        if (selectedCategory) {
            if (count > selectedCategory.remainingCount) {
                alert(`လက်ကျန်ပမာဏ (${selectedCategory.remainingCount}) ထက် မကျော်ရပါ`);
                return;
            }
        } else if (editingProcess || editingRecord) {
            const procId = editingProcess?.processingRecordId || editingRecord?.processingRecordId;
            const cat = editingProcess?.category || editingRecord?.category;
            const currentRecordCount = editingProcess?.purifyCount || editingRecord?.count || 0;
            
            // Find the current available stock for this bag/category
            const avail = availableCategories.find(a => a.processingRecordId === procId && a.category === cat);
            const currentStockInBag = avail?.remainingCount || 0;
            
            const maxAllowed = currentStockInBag + currentRecordCount;
            if (count > maxAllowed) {
                alert(`လက်ကျန်ပမာဏ (${maxAllowed}) ထက် မကျော်ရပါ`);
                return;
            }
        }

        try {
            if (editingProcess) {
                await purificationAPI.update(editingProcess.id, {
                    date: combineDateWithMyanmarTime(purifyForm.date),
                    processingRecordId: editingProcess.processingRecordId,
                    category: editingProcess.category,
                    purifyCount: count,
                    purifierId: purifyForm.purifierId,
                    isWeightFull: purifyForm.isWeightFull
                });
            } else if (editingRecord) {
                await purificationAPI.updatePurifiedRecord(editingRecord.id, {
                    date: combineDateWithMyanmarTime(purifyForm.date),
                    processingRecordId: editingRecord.processingRecordId,
                    category: editingRecord.category,
                    purifyCount: count,
                    purifierId: purifyForm.purifierId,
                    isWeightFull: purifyForm.isWeightFull
                });
            } else if (selectedCategory) {
                await purificationAPI.create({
                    date: combineDateWithMyanmarTime(purifyForm.date),
                    processingRecordId: selectedCategory.processingRecordId,
                    category: selectedCategory.category,
                    purifyCount: count,
                    purifierId: purifyForm.purifierId,
                    isWeightFull: purifyForm.isWeightFull
                });
            }
            setShowPurifyModal(false);
            await loadData();
        } catch (error: any) {
            console.error('Submit failed:', error);
            const msg = error.response?.data?.message || 'အဆင်မပြေပါ (လက်ကျန် မလုံလောက်ခြင်း ဖြစ်နိုင်သည်)';
            showAlert('Error', msg, 'error');
        }
    };
    
    const filteredAvailable = availableCategories.filter(a => 
        a.productMarker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="spinner"></div>;
    }

    return (
        <div className="processing-container fade-in">
            {/* Left Sidebar: Available Categories for Purification */}
            <aside className="product-sidebar" style={{ width: '400px' }}>
                <h2 className="sidebar-title">
                    <Package size={20} />
                    ဖွရန် အိတ်တစ်ခု ရွေးချယ်ပေးပါ
                </h2>

                <div className="search-box">
                    <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="အိတ်အမှတ် ရှာဖွေရန်..."
                        className="form-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="product-list" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: '4px' }}>
                    {filteredAvailable.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                            {searchTerm ? 'ရှာမတွေ့ပါ' : 'ရွေးချယ်စရာ မရှိသေးပါ'}
                        </div>
                    ) : (
                        filteredAvailable.map((avail) => {
                            const key = `${avail.processingRecordId}-${avail.category}`;
                            return (
                                <div key={key} className="product-card" style={{ cursor: 'default' }}>
                                    <div className="card-header">
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span className="card-marker">{avail.productMarker}</span>
                                            <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}> {avail.warehouseName || '---'}</span>
                                        </div>
                                        <span className={`card-badge category-${avail.category.toLowerCase().replace('.', '')}`}>
                                            {avail.category}
                                        </span>
                                    </div>
                                    <div className="card-details" style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>လက်ကျန်</div>
                                            <div style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>
                                                {avail.remainingCount} <span style={{ fontSize: '12px', fontWeight: 500 }}>ထုပ်</span> / {avail.remainingWeight.toFixed(3)} <span style={{ fontSize: '12px', fontWeight: 500 }}>v</span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Unit Wt</div>
                                            <div style={{ fontWeight: 600, color: '#3b82f6' }}>{avail.unitWeight.toFixed(4)}</div>
                                        </div>
                                    </div>

                                    <div className="purifier-selection" style={{ marginBottom: '12px' }}>
                                        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Purifier</div>
                                        <select 
                                            className="form-select" 
                                            style={{ width: '100%', padding: '6px 12px', borderRadius: '8px', fontSize: '13px' }}
                                            value={selectedPurifiers[key] || ''}
                                            onChange={(e) => setSelectedPurifiers(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                                        >
                                            <option value="">-- Purifier ရွေးပါ --</option>
                                            {purifiers
                                                .filter(p => p.warehouseId === avail.warehouseId && p.isActive)
                                                .map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))
                                            }
                                        </select>
                                    </div>

                                    <div className="purify-input-group" style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                                        <input
                                            type="number"
                                            placeholder="ထုပ်အရေအတွက်"
                                            className="form-input"
                                            style={{ padding: '8px 12px', borderRadius: '8px', flex: 1 }}
                                            value={inputCounts[key] || ''}
                                            onChange={(e) => handleInputChance(avail.processingRecordId, avail.category, e.target.value)}
                                            min="1"
                                            max={avail.remainingCount}
                                        />
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: '8px', borderRadius: '8px' }}
                                            onClick={() => handlePurify(avail)}
                                            disabled={submitting === key}
                                        >
                                            {submitting === key ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </aside>

            {/* Main Content: Purification History */}
            <main className="processing-main">
                <div className="record-details-view fade-in">
                    <div className="main-header">
                        <div className="header-title">
                            <div className="icon-box" style={{ background: '#eff6ff', padding: '12px', borderRadius: '12px' }}>
                                <History size={32} className="text-primary" />
                            </div>
                            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
                                <div 
                                    onClick={() => setActiveTab('history')}
                                    style={{ 
                                        cursor: 'pointer', borderBottom: activeTab === 'history' ? '3px solid #3b82f6' : '3px solid transparent',
                                        paddingBottom: '8px', transition: 'all 0.2s'
                                    }}
                                >
                                    <h1 style={{ fontSize: '24px', color: activeTab === 'history' ? '#0f172a' : '#94a3b8', margin: 0 }}>Purification မှတ်တမ်းများ</h1>
                                    <p className="header-subtitle" style={{ display: activeTab === 'history' ? 'block' : 'none' }}>လုပ်ဆောင်မှုမှတ်တမ်း</p>
                                </div>
                                <div 
                                    onClick={() => setActiveTab('stock')}
                                    style={{ 
                                        cursor: 'pointer', borderBottom: activeTab === 'stock' ? '3px solid #10b981' : '3px solid transparent',
                                        paddingBottom: '8px', transition: 'all 0.2s'
                                    }}
                                >
                                    <h1 style={{ fontSize: '24px', color: activeTab === 'stock' ? '#0f172a' : '#94a3b8', margin: 0 }}>ဖွပြီးမှတ်တမ်း</h1>
                                    <p className="header-subtitle" style={{ display: activeTab === 'stock' ? 'block' : 'none' }}>Inventory စာရင်း</p>
                                </div>
                            </div>
                        </div>
                        <button 
                            className="btn btn-secondary" 
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '10px' }}
                            onClick={() => setShowPurifierManagement(true)}
                        >
                            <Settings size={18} />
                            Purifier စာရင်းစီမံရန်
                        </button>
                    </div>

                    <div className="table-responsive" style={{ background: '#f8fafc', padding: '1px', borderRadius: '16px', overflow: 'hidden' }}>
                        <table className="data-table" style={{ background: 'white' }}>
                            <thead>
                                {activeTab === 'history' ? (
                                    <tr>
                                        <th>နေ့စွဲ</th>
                                        <th>အိတ်အမှတ်</th>
                                        <th>အမျိုးအစား</th>
                                        <th>ထုပ်အရေအတွက်</th>
                                        <th>အလေးချိန် (viss)</th>
                                        <th>Purifier</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th>နေ့စွဲ</th>
                                        <th>အိတ်အမှတ်</th>
                                        <th>အမျိုးအစား</th>
                                        <th>ထုပ်အရေအတွက် (Output)</th>
                                        <th>အလေးချိန် (Output)</th>
                                        <th>Purifier</th>
                                        <th>အလေးချိန်အခြေအနေ</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {activeTab === 'history' ? (
                                    processes.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                                    <History size={48} style={{ opacity: 0.2 }} />
                                                    <span>မှတ်တမ်း မရှိသေးပါ</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        processes.map((p) => (
                                            <tr key={p.id} onClick={() => handleEditClick(p)} style={{ cursor: 'pointer' }}>
                                                <td>{formatDateTime(p.date)}</td>
                                                <td style={{ fontWeight: 600, color: '#0f172a' }}>
                                                    <div>{p.productMarker}</div>
                                                    <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 500 }}>{p.warehouseName || '---'}</div>
                                                </td>
                                                <td>
                                                    <span className={`card-badge category-${p.category.toLowerCase().replace('.', '')}`}>
                                                        {p.category}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>{p.purifyCount}</td>
                                                <td style={{ fontWeight: 500 }}>{p.purifyWeight.toFixed(3)}</td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                                            <User size={14} style={{ color: '#64748b' }} />
                                                            {p.purifierName || '---'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleEditClick(p); }}>
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button className="btn-icon text-danger" onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )
                                ) : (
                                    purifiedRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                                    <Package size={48} style={{ opacity: 0.2 }} />
                                                    <span>ဖွပြီးမှတ်တမ်း မရှိသေးပါ</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        purifiedRecords.map((p) => (
                                            <tr key={p.id}>
                                                <td>{formatDateTime(p.date)}</td>
                                                <td style={{ fontWeight: 600, color: '#0f172a' }}>
                                                    <div>{p.productMarker}</div>
                                                    <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 500 }}>{p.warehouseName || '---'}</div>
                                                </td>
                                                <td>
                                                    <span className={`card-badge category-${p.category.toLowerCase().replace('.', '')}`}>
                                                        {p.category}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 800, color: '#10b981', fontSize: '15px' }}>{p.count}</td>
                                                <td style={{ fontWeight: 500 }}>{p.weight.toFixed(3)}</td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                                        <User size={14} style={{ color: '#64748b' }} />
                                                        {p.purifierName || '---'}
                                                    </div>
                                                </td>
                                                <td>
                                                    {p.isWeightFull ? (
                                                        <span style={{ padding: '4px 10px', background: '#dcfce7', color: '#15803d', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>ပြည့်</span>
                                                    ) : (
                                                        <span style={{ padding: '4px 10px', background: '#fee2e2', color: '#b91c1c', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>မပြည့်</span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <button className="btn-icon text-danger" onClick={(e) => { e.stopPropagation(); handleDeleteRecord(p.id); }}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {showPurifierManagement && (
                <div className="modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="modal-content" style={{ maxWidth: '1000px', width: '95%', background: 'white', borderRadius: '20px', padding: '20px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button 
                            className="btn-icon" 
                            style={{ position: 'absolute', right: '20px', top: '20px', zIndex: 10 }}
                            onClick={handleClosePurifierManagement}
                        >
                            <X size={24} />
                        </button>
                        <PurifierManagement />
                    </div>
                </div>
            )}

            {showPurifyModal && (selectedCategory || editingProcess || editingRecord) && (
                <div className="modal-overlay" style={{ zIndex: 1200 }}>
                    <div className="modal-content premium-purify-modal" style={{ maxWidth: '480px', width: '95%', background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ background: '#ecfdf5', padding: '10px', borderRadius: '12px' }}>
                                <Send size={24} style={{ color: '#059669' }} />
                            </div>
                            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                {editingProcess || editingRecord ? 'ဖွပြီးမှတ်တမ်း ပြင်ဆင်ရန်' : 'ဖွပြီးအထုပ်များစာရင်းသွင်းရန်'}
                            </h2>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '18px', marginBottom: '24px', border: '1px solid #f1f5f9' }}>
                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px', fontWeight: 500 }}>ပြုလုပ်သည့် မူရံ</div>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
                                {selectedCategory?.warehouseName || editingProcess?.warehouseName || editingRecord?.warehouseName || '---'}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '14px', color: '#475569' }}>
                                    အပွထုပ်အသုတ် ID: <span style={{ fontWeight: 600 }}>{selectedCategory?.productMarker || editingProcess?.productMarker || editingRecord?.productMarker}</span>
                                </div>
                                <span style={{ background: '#fef9c3', color: '#854d0e', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>
                                    {editingRecord ? editingRecord.count : (editingProcess ? editingProcess.purifyCount : selectedCategory?.remainingCount)} ကျန်
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitPurify}>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label className="form-label" style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>ဆံပင်ဖွသူ</label>
                                <div style={{ 
                                    height: '48px', 
                                    borderRadius: '12px', 
                                    background: '#f1f5f9', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    padding: '0 16px',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    color: '#334155',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    {purifiers.find(p => p.id === purifyForm.purifierId)?.name || '---'}
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label className="form-label" style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>အမျိုးအစား</label>
                                <div style={{ 
                                    height: '48px', 
                                    borderRadius: '12px', 
                                    background: '#f8fafc', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    padding: '0 16px',
                                    fontSize: '15px',
                                    fontWeight: 700,
                                    color: '#0f172a',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <span className={`card-badge category-${(selectedCategory?.category || editingProcess?.category || editingRecord?.category || '').toLowerCase().replace('.', '')}`} style={{ margin: 0 }}>
                                        {selectedCategory?.category || editingProcess?.category || editingRecord?.category}
                                    </span>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label className="form-label" style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>ဖွပြီးသော အပွထုပ်အရေအတွက်</label>
                                <input 
                                    type="number" 
                                    className="form-control" 
                                    style={{ height: '48px', borderRadius: '12px', fontSize: '16px', fontWeight: 600 }}
                                    placeholder="0"
                                    value={purifyForm.count}
                                    onChange={(e) => setPurifyForm(prev => ({ ...prev, count: e.target.value }))}
                                    required 
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '28px' }}>
                                <label className="form-label" style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '12px', display: 'block' }}>ပေါင်ချိန် စစ်ဆေးခြင်း</label>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button 
                                        type="button"
                                        style={{ 
                                            flex: 1, height: '44px', borderRadius: '10px', border: purifyForm.isWeightFull ? 'none' : '1.5px solid #e2e8f0',
                                            background: purifyForm.isWeightFull ? '#dcfce7' : 'white', color: purifyForm.isWeightFull ? '#15803d' : '#64748b',
                                            fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                        onClick={() => setPurifyForm(prev => ({ ...prev, isWeightFull: true }))}
                                    >
                                        ပြည့်
                                    </button>
                                    <button 
                                        type="button"
                                        style={{ 
                                            flex: 1, height: '44px', borderRadius: '10px', border: !purifyForm.isWeightFull ? 'none' : '1.5px solid #e2e8f0',
                                            background: !purifyForm.isWeightFull ? '#fee2e2' : 'white', color: !purifyForm.isWeightFull ? '#b91c1c' : '#64748b',
                                            fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                        onClick={() => setPurifyForm(prev => ({ ...prev, isWeightFull: false }))}
                                    >
                                        မပြည့် (ပိတ်သာမပြည့်)
                                    </button>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label className="form-label" style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>နေ့စွဲ</label>
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    style={{ height: '48px', borderRadius: '12px', fontSize: '15px' }}
                                    value={purifyForm.date.split('T')[0]}
                                    onChange={(e) => setPurifyForm(prev => ({ ...prev, date: e.target.value }))}
                                    required 
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="btn btn-primary" 
                                style={{ width: '100%', height: '54px', borderRadius: '16px', fontSize: '18px', fontWeight: 700, background: '#10b981', border: 'none', marginBottom: '16px' }}
                            >
                                {editingRecord || editingProcess ? 'ပြင်ဆင်မည်' : 'စာရင်းသွင်းမည်'}
                            </button>
                            <button 
                                type="button" 
                                style={{ width: '100%', background: 'none', border: 'none', color: '#94a3b8', fontSize: '15px', cursor: 'pointer', fontWeight: 500 }}
                                onClick={() => setShowPurifyModal(false)}
                            >
                                မလုပ်တော့ပါ
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Purification;
