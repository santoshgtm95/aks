import React, { useEffect, useState } from 'react';
import { refinementAPI, purifiersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import type { AvailablePurifiedCategory, RefinementProcess, RefinementRecord, Purifier } from '../../types';
import { Package, Send, History, Loader2, Search, User, Pencil, Trash2 } from 'lucide-react';
import { formatDateTime, getMyanmarNow, combineDateWithMyanmarTime } from '../../utils/format';
import '../Purification/index.css';

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
    const [form, setForm] = useState({ weight: '', lostWeight: '', purifierId: 0, date: getMyanmarNow() });

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
        if (!purifierId) return showAlert('Error', 'Refinement Worker ရွေးချယ်ပါ', 'error');
        setSubmitting(key);
        try {
            await refinementAPI.create({ date: new Date().toISOString(), purifiedRecordId: avail.purifiedRecordId, category: avail.category, count, weight: avail.remainingWeight, lostWeight: 0, purifierId });
            await loadData();
        } catch (e: any) {
            showAlert('Error', e.response?.data?.message || 'အဆင်မပြေပါ', 'error');
        } finally { setSubmitting(null); }
    };

    const handleDelete = (id: number) => showConfirm('အတည်ပြုရန်', 'ဤမှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?', async () => {
        try { await refinementAPI.delete(id); await loadData(); }
        catch { showAlert('Error', 'ဖျက်၍ မရပါ', 'error'); }
    });

    const handleDeleteRecord = (id: number) => showConfirm('အတည်ပြုရန်', 'ဤမှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?', async () => {
        try { await refinementAPI.deleteRefinementRecord(id); await loadData(); }
        catch { showAlert('Error', 'ဖျက်၍ မရပါ', 'error'); }
    });

    const handleEditProcess = (p: RefinementProcess) => {
        setEditingProcess(p); setEditingRecord(null); setSelectedCategory(null);
        const dateStr = p.date ? (p.date.includes('T') ? p.date.slice(0, 16) : p.date + 'T00:00') : getMyanmarNow();
        setForm({ weight: p.weight.toString(), lostWeight: '0', date: dateStr, purifierId: p.purifierId || 0 });
        setShowModal(true);
    };

    const handleSubmitModal = async (e: React.FormEvent) => {
        e.preventDefault();
        const weight = parseFloat(form.weight);
        const lostWeight = parseFloat(form.lostWeight) || 0;
        if (!weight || weight <= 0) return showAlert('Error', 'အလေးချိန် မှန်ကန်စွာ ထည့်သွင်းပါ', 'error');
        if (!form.purifierId) return showAlert('Error', 'Refinement Worker ရွေးချယ်ပါ', 'error');

        if (selectedCategory && weight > selectedCategory.remainingWeight) {
            showAlert('Error', `လက်ကျန်အလေးချိန် (${selectedCategory.remainingWeight.toFixed(3)}) ထက် မကျော်ရပါ`, 'error');
            return;
        }
        try {
            const dto = { date: combineDateWithMyanmarTime(form.date), purifiedRecordId: editingProcess?.purifiedRecordId || editingRecord?.purifiedRecordId || selectedCategory!.purifiedRecordId, category: editingProcess?.category || editingRecord?.category || selectedCategory!.category, count: 0, weight, lostWeight, purifierId: form.purifierId };
            if (editingProcess) await refinementAPI.update(editingProcess.id, dto);
            else if (editingRecord) await refinementAPI.updateRefinementRecord(editingRecord.id, dto);
            else await refinementAPI.create(dto);
            setShowModal(false);
            await loadData();
        } catch (e: any) {
            showAlert('Error', e.response?.data?.message || 'အဆင်မပြေပါ', 'error');
        }
    };

    const filtered = availableCategories.filter(a =>
        a.productMarker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="processing-container fade-in">
            {/* Sidebar */}
            <aside className="product-sidebar" style={{ width: '400px' }}>
                <h2 className="sidebar-title"><Package size={20} /> ဖွပြီးသော အိတ် ရွေးချယ်ပေးပါ</h2>
                <div className="search-box">
                    <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input type="text" placeholder="အိတ်အမှတ် ရှာဖွေရန်..." className="form-input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="product-list" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: '4px' }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>{searchTerm ? 'ရှာမတွေ့ပါ' : 'ရွေးချယ်စရာ မရှိသေးပါ'}</div>
                    ) : filtered.map(avail => {
                        const key = `${avail.purifiedRecordId}-${avail.category}`;
                        return (
                            <div key={key} className="product-card" style={{ cursor: 'default' }}>
                                <div className="card-header">
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span className="card-marker">{avail.productMarker}</span>
                                        <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}>{avail.warehouseName || '---'}</span>
                                    </div>
                                    <span className={`card-badge category-${avail.category.toLowerCase().replace('.', '')}`}>{avail.category}</span>
                                </div>
                                <div className="card-details" style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>လက်ကျန်</div>
                                        <div style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>{avail.remainingCount} <span style={{ fontSize: '12px' }}>ထုပ်</span> / {avail.remainingWeight.toFixed(3)} <span style={{ fontSize: '12px' }}>v</span></div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Unit Wt</div>
                                        <div style={{ fontWeight: 600, color: '#3b82f6' }}>{avail.unitWeight.toFixed(4)}</div>
                                    </div>
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Refinement Worker</div>
                                    <select className="form-select" style={{ width: '100%', padding: '6px 12px', borderRadius: '8px', fontSize: '13px' }} value={selectedPurifiers[key] || ''} onChange={e => setSelectedPurifiers(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}>
                                        <option value="">-- Worker ရွေးပါ --</option>
                                        {purifiers.filter(p => p.warehouseId === avail.warehouseId && p.isActive).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                                    <button className="btn btn-primary" style={{ width: '100%', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => handleInlineSubmit(avail)} disabled={submitting === key}>
                                        {submitting === key ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Assign</>}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </aside>

            {/* Main Content */}
            <main className="processing-main">
                <div className="record-details-view fade-in">
                    <div className="main-header">
                        <div className="header-title">
                            <div className="icon-box" style={{ background: '#eff6ff', padding: '12px', borderRadius: '12px' }}><History size={32} className="text-primary" /></div>
                            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
                                <div onClick={() => setActiveTab('history')} style={{ cursor: 'pointer', borderBottom: activeTab === 'history' ? '3px solid #3b82f6' : '3px solid transparent', paddingBottom: '8px', transition: 'all 0.2s' }}>
                                    <h1 style={{ fontSize: '24px', color: activeTab === 'history' ? '#0f172a' : '#94a3b8', margin: 0 }}>Refinement မှတ်တမ်းများ</h1>
                                    <p className="header-subtitle" style={{ display: activeTab === 'history' ? 'block' : 'none' }}>လုပ်ဆောင်မှုမှတ်တမ်း</p>
                                </div>
                                <div onClick={() => setActiveTab('stock')} style={{ cursor: 'pointer', borderBottom: activeTab === 'stock' ? '3px solid #10b981' : '3px solid transparent', paddingBottom: '8px', transition: 'all 0.2s' }}>
                                    <h1 style={{ fontSize: '24px', color: activeTab === 'stock' ? '#0f172a' : '#94a3b8', margin: 0 }}>Refinement ပြီးမှတ်တမ်း</h1>
                                    <p className="header-subtitle" style={{ display: activeTab === 'stock' ? 'block' : 'none' }}>Refinement စာရင်း</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="table-responsive" style={{ background: '#f8fafc', padding: '1px', borderRadius: '16px', overflow: 'hidden' }}>
                        <table className="data-table" style={{ background: 'white' }}>
                            <thead>
                                {activeTab === 'history' ? (
                                    <tr><th>နေ့စွဲ</th><th>အိတ်အမှတ်</th><th>အမျိုးအစား</th><th>အလေးချိန် (viss)</th><th>Refinement Worker</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
                                ) : (
                                    <tr><th>နေ့စွဲ</th><th>အိတ်အမှတ်</th><th>အမျိုးအစား</th><th>အလေးချိန် (Output)</th><th>Lost Weight</th><th>Refinement Worker</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
                                )}
                            </thead>
                            <tbody>
                                {activeTab === 'history' ? (
                                    processes.length === 0 ? (
                                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}><History size={48} style={{ opacity: 0.2 }} /><span>မှတ်တမ်း မရှိသေးပါ</span></div></td></tr>
                                    ) : processes.map(p => (
                                        <tr key={p.id} onClick={() => handleEditProcess(p)} style={{ cursor: 'pointer' }}>
                                            <td>{formatDateTime(p.date)}</td>
                                            <td style={{ fontWeight: 600, color: '#0f172a' }}><div>{p.productMarker}</div><div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 500 }}>{p.warehouseName || '---'}</div></td>
                                            <td><span className={`card-badge category-${p.category.toLowerCase().replace('.', '')}`}>{p.category}</span></td>
                                            <td style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>{p.weight.toFixed(3)}</td>
                                            <td><div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}><User size={14} style={{ color: '#64748b' }} />{p.purifierName || '---'}</div></td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    {hasPermission('Refinement.Edit') && (
                                                        <button className="btn-icon" onClick={e => { e.stopPropagation(); handleEditProcess(p); }}><Pencil size={16} /></button>
                                                    )}
                                                    {hasPermission('Refinement.Delete') && (
                                                        <button className="btn-icon text-danger" onClick={e => { e.stopPropagation(); handleDelete(p.id); }}><Trash2 size={16} /></button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    refinementRecords.length === 0 ? (
                                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}><Package size={48} style={{ opacity: 0.2 }} /><span>Refinement ပြီးမှတ်တမ်း မရှိသေးပါ</span></div></td></tr>
                                    ) : refinementRecords.map(p => (
                                        <tr key={p.id}>
                                            <td>{formatDateTime(p.date)}</td>
                                            <td style={{ fontWeight: 600, color: '#0f172a' }}><div>{p.productMarker}</div><div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 500 }}>{p.warehouseName || '---'}</div></td>
                                            <td><span className={`card-badge category-${p.category.toLowerCase().replace('.', '')}`}>{p.category}</span></td>
                                            <td style={{ fontWeight: 800, color: '#10b981', fontSize: '15px' }}>{p.weight.toFixed(3)}</td>
                                            <td style={{ color: '#ef4444', fontWeight: 600 }}>{p.lostWeight.toFixed(3)}</td>
                                            <td><div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}><User size={14} style={{ color: '#64748b' }} />{p.purifierName || '---'}</div></td>
                                            <td style={{ textAlign: 'right' }}>
                                                {hasPermission('Refinement.Delete') && (
                                                    <button className="btn-icon text-danger" onClick={e => { e.stopPropagation(); handleDeleteRecord(p.id); }}><Trash2 size={16} /></button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Edit Modal */}
            {showModal && (editingProcess || editingRecord || selectedCategory) && (
                <div className="modal-overlay" style={{ zIndex: 1200 }}>
                    <div className="modal-content premium-purify-modal" style={{ maxWidth: '480px', width: '95%', background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ background: '#ecfdf5', padding: '10px', borderRadius: '12px' }}><Send size={24} style={{ color: '#059669' }} /></div>
                            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{editingProcess || editingRecord ? 'မှတ်တမ်း ပြင်ဆင်ရန်' : 'Refinement စာရင်းသွင်းရန်'}</h2>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '18px', marginBottom: '24px', border: '1px solid #f1f5f9' }}>
                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px', fontWeight: 500 }}>အိတ်အမှတ်</div>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>{editingProcess?.productMarker || editingRecord?.productMarker || selectedCategory?.productMarker}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className={`card-badge category-${(editingProcess?.category || editingRecord?.category || selectedCategory?.category || '').toLowerCase().replace('.', '')}`}>{editingProcess?.category || editingRecord?.category || selectedCategory?.category}</span>
                                <span style={{ background: '#fef9c3', color: '#854d0e', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>{editingRecord ? editingRecord.weight.toFixed(3) : editingProcess ? editingProcess.weight.toFixed(3) : selectedCategory?.remainingWeight.toFixed(3)} viss ကျန်</span>
                            </div>
                        </div>
                        <form onSubmit={handleSubmitModal}>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label className="form-label" style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>Refinement Worker ရွေးချယ်ပါ</label>
                                <select className="form-select" style={{ width: '100%', height: '48px', borderRadius: '12px' }} value={form.purifierId} onChange={e => setForm(prev => ({ ...prev, purifierId: parseInt(e.target.value) }))} required>
                                    <option value={0}>-- Worker ရွေးပါ --</option>
                                    {purifiers.filter(p => p.isActive).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label" style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>အလေးချိန် (Weight)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type="number" step="0.001" className="form-control" style={{ height: '48px', borderRadius: '12px', fontSize: '16px', fontWeight: 600, paddingRight: '50px' }} placeholder="0.000" value={form.weight} onChange={e => setForm(prev => ({ ...prev, weight: e.target.value }))} required />
                                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 600, fontSize: '14px' }}>viss</span>
                                    </div>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label" style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>Lost Weight</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type="number" step="0.001" className="form-control" style={{ height: '48px', borderRadius: '12px', fontSize: '16px', fontWeight: 600, paddingRight: '50px', borderColor: '#fee2e2' }} placeholder="0.000" value={form.lostWeight} onChange={e => setForm(prev => ({ ...prev, lostWeight: e.target.value }))} />
                                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#ef4444', fontWeight: 600, fontSize: '14px' }}>viss</span>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label className="form-label" style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>နေ့စွဲ</label>
                                <input type="date" className="form-control" style={{ height: '48px', borderRadius: '12px', fontSize: '15px' }} value={form.date.split('T')[0]} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))} required />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '54px', borderRadius: '16px', fontSize: '18px', fontWeight: 700, background: '#10b981', border: 'none', marginBottom: '16px' }}>{editingRecord || editingProcess ? 'ပြင်ဆင်မည်' : 'စာရင်းသွင်းမည်'}</button>
                            <button type="button" style={{ width: '100%', background: 'none', border: 'none', color: '#94a3b8', fontSize: '15px', cursor: 'pointer', fontWeight: 500 }} onClick={() => setShowModal(false)}>မလုပ်တော့ပါ</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Refinement;
