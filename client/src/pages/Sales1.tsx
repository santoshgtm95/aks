import React, { useEffect, useState, useMemo } from 'react';
import { productsAPI, workersAPI, processingAPI } from '../services/api';
import type { Product, Worker, ProcessingRecord, CreateProcessingRecordDto } from '../types';
import { Package, Users, Calculator, CheckCircle, AlertCircle, ArrowRight, Scissors, Plus } from 'lucide-react';
import './Sales1.css';

const Sales1: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [records, setRecords] = useState<ProcessingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
    const [showWorkerModal, setShowWorkerModal] = useState(false);
    const [newWorkerName, setNewWorkerName] = useState('');

    const [formData, setFormData] = useState({
        unitWeight: 0,
        red: 0,
        white: 0,
        special: 0,
        natural: 0,
        short: 0,
        loss: 0
    });

    const selectedProduct = useMemo(() =>
        products.find(p => p.id === selectedProductId),
        [products, selectedProductId]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedProduct) {
            const calculatedUnitWeight = selectedProduct.packages > 0
                ? selectedProduct.weight / selectedProduct.packages
                : 0;

            setFormData(prev => ({
                ...prev,
                unitWeight: calculatedUnitWeight
            }));
        }
    }, [selectedProduct]);

    const loadData = async () => {
        try {
            const [productsData, workersData, recordsData] = await Promise.all([
                productsAPI.getAll(),
                workersAPI.getAll(),
                processingAPI.getAll()
            ]);
            setProducts(productsData.filter(p => p.remainingWeight > 0));
            setWorkers(workersData);
            setRecords(recordsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numValue = value === '' ? 0 : parseFloat(value);

        setFormData(prev => ({
            ...prev,
            [name]: numValue
        }));
    };

    const calculatedCount = useMemo(() => {
        if (!selectedProduct) return 0;
        const categorySum = formData.red + formData.white + formData.special + formData.natural;
        return selectedProduct.packages - categorySum;
    }, [selectedProduct, formData]);

    const toggleStaff = (name: string) => {
        setSelectedStaff(prev =>
            prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
        );
    };

    const totals = useMemo(() => {
        const normalWeight = calculatedCount * formData.unitWeight;
        const redWeight = formData.red * formData.unitWeight;
        const whiteWeight = formData.white * formData.unitWeight;
        const specialWeight = formData.special * formData.unitWeight;
        const naturalWeight = formData.natural * formData.unitWeight;

        const categoryWeight = redWeight + whiteWeight + specialWeight + naturalWeight + formData.short + formData.loss;
        const total = normalWeight + categoryWeight;
        const diff = selectedProduct ? selectedProduct.remainingWeight - total : 0;

        return {
            normalWeight,
            redWeight,
            whiteWeight,
            specialWeight,
            naturalWeight,
            categoryWeight,
            total,
            diff
        };
    }, [formData, selectedProduct, calculatedCount]);

    const handleRegisterWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWorkerName.trim()) return;
        try {
            await workersAPI.create({ name: newWorkerName });
            setNewWorkerName('');
            setShowWorkerModal(false);
            const workersData = await workersAPI.getAll();
            setWorkers(workersData);
        } catch (error) {
            console.error('Failed to register worker:', error);
            alert('Failed to register worker');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProductId || selectedStaff.length === 0) return;

        try {
            const dto: CreateProcessingRecordDto = {
                date: new Date().toISOString(),
                productId: selectedProductId,
                workerNames: selectedStaff.join(', '),
                count: calculatedCount,
                unitWeight: formData.unitWeight,
                redWeight: totals.redWeight,
                whiteWeight: totals.whiteWeight,
                specialWeight: totals.specialWeight,
                naturalWeight: totals.naturalWeight,
                shortWeight: formData.short,
                lossWeight: formData.loss,
                totalWeight: totals.total,
                difference: totals.diff
            };

            await processingAPI.create(dto);

            // Reset form
            setFormData({
                unitWeight: 0,
                red: 0,
                white: 0,
                special: 0,
                natural: 0,
                short: 0,
                loss: 0
            });
            setSelectedStaff([]);
            setSelectedProductId(null);

            loadData();
            alert('Record saved successfully!');
        } catch (error) {
            console.error('Failed to save record:', error);
            alert('Failed to save record');
        }
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="processing-container fade-in">
            {/* Left Sidebar: Product List */}
            <aside className="product-sidebar">
                <h2 className="sidebar-title">
                    <Package size={20} />
                    အပုရွေးရန် အိတ်တစ်ခု ရွေးချယ်ပေးပါ
                </h2>
                <div className="product-list">
                    {products.map(product => (
                        <div
                            key={product.id}
                            className={`product-card ${selectedProductId === product.id ? 'selected' : ''}`}
                            onClick={() => setSelectedProductId(product.id)}
                        >
                            <div className="card-header">
                                <span className="card-marker">{product.marker}</span>
                                <span className="card-badge">New</span>
                            </div>
                            <div className="card-details">
                                <span>{product.packages}</span>
                                <span className="card-weight">{product.remainingWeight.toFixed(4)} {product.unit}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Content: Processing Form */}
            <main className="processing-main">
                <div className="main-header">
                    <div className="header-title">
                        <Scissors size={32} className="text-primary" />
                        <div>
                            <h1>အလုပ်ခွင်</h1>
                            <p className="header-subtitle">
                                အိတ်အိတ်အမှတ်/နံပါတ်: <strong>{selectedProduct?.marker || '---'}</strong>
                            </p>
                        </div>
                    </div>
                    {selectedProduct && (
                        <div className="original-weight-box">
                            <p className="weight-label">ပုရင်း အလေးချိန်</p>
                            <p className="weight-value">
                                {selectedProduct.remainingWeight.toFixed(4)}
                                <span className="weight-unit">{selectedProduct.unit}</span>
                            </p>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    {/* 1. Staff Selection */}
                    <section className="form-section">
                        <div className="section-header">
                            <h3 className="section-label">၁. အပုရွေးသူများအမည်</h3>
                            <button
                                type="button"
                                className="btn-add-worker"
                                onClick={() => setShowWorkerModal(true)}
                            >
                                <Plus size={14} />
                                Register Worker
                            </button>
                        </div>
                        <div className="staff-grid">
                            {workers.map(worker => (
                                <div
                                    key={worker.id}
                                    className={`staff-chip ${selectedStaff.includes(worker.name) ? 'selected' : ''}`}
                                    onClick={() => toggleStaff(worker.name)}
                                >
                                    <Users size={14} />
                                    {worker.name}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 2. Count & Unit Weight */}
                    <section className="form-section">
                        <div className="input-row">
                            <div>
                                <h3 className="section-label">၂. ရိုးရိုး(အပုတုတ်)</h3>
                                <div className="form-group">
                                    <label className="form-label">Count (ထုပ်)</label>
                                    <div className="form-control-static" style={{
                                        padding: '10px 16px',
                                        background: '#f8fafc',
                                        borderRadius: '8px',
                                        fontSize: '24px',
                                        fontWeight: '700',
                                        color: 'var(--primary)',
                                        border: '1px solid var(--border)'
                                    }}>
                                        {calculatedCount}
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: '35px' }}>
                                <div className="form-group">
                                    <label className="form-label">Unit Weight</label>
                                    <div className="form-control-static" style={{
                                        padding: '10px 16px',
                                        background: '#f8fafc',
                                        borderRadius: '8px',
                                        fontSize: '24px',
                                        fontWeight: '700',
                                        color: 'var(--primary)',
                                        border: '1px solid var(--border)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span>{formData.unitWeight.toFixed(4)}</span>
                                        <span style={{ fontSize: '14px', color: 'var(--gray)' }}>{selectedProduct?.unit || '---'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. Categories */}
                    <section className="form-section">
                        <h3 className="section-label">၃. အတိုအပြတ် နှင့် အလျော့တွက်</h3>
                        <div className="category-grid">
                            <div className="category-input-box box-red">
                                <span className="box-label label-red">အနီ</span>
                                <input
                                    type="number"
                                    name="red"
                                    className="box-input"
                                    value={formData.red || ''}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                />
                                <span className="box-weight-hint hint-red">{totals.redWeight.toFixed(3)} {selectedProduct?.unit || 'V'}</span>
                            </div>
                            <div className="category-input-box box-white">
                                <span className="box-label label-white">အဖြူ</span>
                                <input
                                    type="number"
                                    name="white"
                                    className="box-input"
                                    value={formData.white || ''}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                />
                                <span className="box-weight-hint hint-white">{totals.whiteWeight.toFixed(3)} {selectedProduct?.unit || 'V'}</span>
                            </div>
                            <div className="category-input-box box-special">
                                <span className="box-label label-special">ရှယ်</span>
                                <input
                                    type="number"
                                    name="special"
                                    className="box-input"
                                    value={formData.special || ''}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                />
                                <span className="box-weight-hint hint-special">{totals.specialWeight.toFixed(3)} {selectedProduct?.unit || 'V'}</span>
                            </div>
                            <div className="category-input-box box-natural">
                                <span className="box-label label-natural">သဘာဝ</span>
                                <input
                                    type="number"
                                    name="natural"
                                    className="box-input"
                                    value={formData.natural || ''}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                />
                                <span className="box-weight-hint hint-natural">{totals.naturalWeight.toFixed(3)} {selectedProduct?.unit || 'V'}</span>
                            </div>
                        </div>

                        <div className="extra-grid">
                            <div className="extra-input-box">
                                <span className="box-label label-extra">အတို (VISS)</span>
                                <input
                                    type="number"
                                    name="short"
                                    step="0.001"
                                    className="box-input"
                                    value={formData.short || ''}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="extra-input-box">
                                <span className="box-label label-extra">အလျော့ (VISS)</span>
                                <input
                                    type="number"
                                    name="loss"
                                    step="0.001"
                                    className="box-input"
                                    value={formData.loss || ''}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Summary & Verification */}
                    <div className="summary-section">
                        <div className="summary-calc">
                            <div className="calc-left">
                                <Calculator size={24} />
                                <span>အလေးချိန် ချိန်ကိုက်ခြင်း:</span>
                                <span>{totals.normalWeight.toFixed(3)} + {totals.categoryWeight.toFixed(3)}</span>
                                <span>=</span>
                            </div>
                            <div className="calc-right">
                                {totals.total.toFixed(4)}
                            </div>
                        </div>

                        <div className={`verification-bar ${Math.abs(totals.diff) < 0.1 ? 'bar-success' : 'bar-warning'}`}>
                            <div className="flex items-center gap-2">
                                {Math.abs(totals.diff) < 0.1 ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                {Math.abs(totals.diff) < 0.1 ? 'Balance Verified' : 'Weight Mismatch'}
                            </div>
                            <div>Diff: {totals.diff.toFixed(4)} {selectedProduct?.unit || 'v'}</div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={!selectedProductId || selectedStaff.length === 0}
                    >
                        အတည်ပြုပြီး စာရင်းထည့်မည်
                        <ArrowRight size={20} />
                    </button>
                </form>

                {/* History Table */}
                <div className="history-section">
                    <h2 className="card-title">လတ်တလော မှတ်တမ်းများ</h2>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Marker</th>
                                    <th>Staff</th>
                                    <th>Total Weight</th>
                                    <th>Diff</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.slice(0, 10).map(record => (
                                    <tr key={record.id}>
                                        <td>{new Date(record.date).toLocaleDateString()}</td>
                                        <td>{record.productMarker}</td>
                                        <td>{record.workerNames}</td>
                                        <td>{record.totalWeight.toFixed(4)}</td>
                                        <td>
                                            <span className={Math.abs(record.difference) > 0.1 ? 'text-danger' : 'text-success'}>
                                                {record.difference.toFixed(4)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Worker Registration Modal */}
            {showWorkerModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="modal-title">Register New Worker</h2>
                        <form onSubmit={handleRegisterWorker}>
                            <div className="form-group">
                                <label className="form-label">Worker Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={newWorkerName}
                                    onChange={(e) => setNewWorkerName(e.target.value)}
                                    placeholder="Enter worker name"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => setShowWorkerModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Register
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales1;
