import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { productsAPI, workersAPI, processingAPI } from "../../services/api";
import type {
  Product,
  Worker,
  ProcessingRecord,
  CreateProcessingRecordDto,
} from "../../types";
import {
  Package,
  Users,
  Calculator,
  ArrowRight,
  Scissors,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
} from "lucide-react";
import { combineDateWithMyanmarTime, formatDateTime } from "../../utils/format";
import { useNotification } from "../../context/NotificationContext";
import "./index.css";

const MessLabour: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showAlert, showConfirm } = useNotification();
  const [products, setProducts] = useState<Product[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [records, setRecords] = useState<ProcessingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState("");

  // Edit/View modal state
  const [editingRecord, setEditingRecord] = useState<ProcessingRecord | null>(
    null,
  );
  const [viewingRecord, setViewingRecord] = useState<ProcessingRecord | null>(
    null,
  );
  const [editFormData, setEditFormData] = useState({
    workerNames: "",
    red: 0,
    white: 0,
    special: 0,
    natural: 0,
    naturalWhite: 0,
    naturalRed: 0,
    shortCut: 0,
    artificial: 0,
    short: 0,
    selectedStaff: [] as string[],
  });

  const [formData, setFormData] = useState({
    count: "0",
    unitWeight: "0.05",
    red: "",
    white: "",
    special: "",
    natural: "",
    naturalWhite: "",
    naturalRed: "",
    shortCut: "",
    artificial: "",
    short: "",
  });

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId],
  );

  useEffect(() => {
    loadData();
  }, []);

  // Auto-calculate total count from original weight, unit weight and loss
  useEffect(() => {
    if (selectedProduct && Number(formData.unitWeight) > 0) {
      const isKg =
        selectedProduct.unit?.toLowerCase() === "kg" ||
        selectedProduct.unit?.toLowerCase() === "kilogram";
      const rwViss = isKg
        ? selectedProduct.remainingWeight * 1.62
        : selectedProduct.remainingWeight;
      const calcCount = Math.ceil(rwViss / Number(formData.unitWeight));
      setFormData((prev) => ({ ...prev, count: calcCount.toString() }));
    } else {
      setFormData((prev) => ({ ...prev, count: "0" }));
    }
  }, [selectedProduct, formData.unitWeight]);

  // Clamping categories if total count decreases (e.g. due to loss increase)
  useEffect(() => {
    const totalCount = Number(formData.count) || 0;
    const categoryFields: (keyof typeof formData)[] = [
      "red",
      "white",
      "special",
      "natural",
      "naturalWhite",
      "naturalRed",
      "shortCut",
      "artificial",
      "short",
    ];

    let currentSum = 0;
    let needsUpdate = false;
    const newFormData = { ...formData };

    for (const field of categoryFields) {
      let val = Number(newFormData[field]) || 0;
      if (currentSum + val > totalCount) {
        val = Math.max(0, totalCount - currentSum);
        newFormData[field] = val.toString();
        needsUpdate = true;
      }
      currentSum += val;
    }

    if (needsUpdate) {
      setFormData(newFormData);
    }
  }, [formData.count]);

  const loadData = async () => {
    try {
      const [productsData, workersData, recordsData] = await Promise.all([
        productsAPI.getAll(),
        workersAPI.getAll(),
        processingAPI.getAll(),
      ]);
      setProducts(productsData);
      setWorkers(workersData);
      setRecords(recordsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const categoryFields = [
      "red",
      "white",
      "special",
      "natural",
      "naturalWhite",
      "naturalRed",
      "shortCut",
      "artificial",
      "short",
    ];

    if (categoryFields.includes(name)) {
      const numValue = value === "" ? 0 : parseInt(value);
      const maxValStr = getFieldMax(name as any);
      if (maxValStr) {
        const maxVal = parseInt(maxValStr);
        if (!isNaN(numValue) && numValue > maxVal) {
          setFormData((prev) => ({ ...prev, [name]: maxVal.toString() }));
          return;
        }
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getFieldMax = (fieldName: keyof typeof formData) => {
    if (!selectedProduct || !formData.unitWeight) return undefined;
    const uw = Number(formData.unitWeight) || 0;

    if (uw <= 0) return undefined;

    const categoryFields: (keyof typeof formData)[] = [
      "red",
      "white",
      "special",
      "natural",
      "naturalWhite",
      "naturalRed",
      "shortCut",
      "artificial",
      "short",
    ];

    if (categoryFields.includes(fieldName)) {
      const totalCount = Number(formData.count) || 0;
      const otherCategoriesSum = categoryFields
        .filter((f) => f !== fieldName)
        .reduce((sum, f) => sum + (Number(formData[f]) || 0), 0);
      return Math.max(0, totalCount - otherCategoriesSum).toString();
    }

    const currentVal = Number(formData[fieldName]) || 0;
    return Math.ceil((currentVal * uw + totals.diff) / uw).toString();
  };

  // Count is now in formData
  const toggleStaff = (name: string) => {
    setSelectedStaff((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );
  };

  const totals = useMemo(() => {
    const uw = Number(formData.unitWeight) || 0;

    // Calculate remaining weight in Viss for comparison
    const isKg =
      selectedProduct?.unit?.toLowerCase() === "kg" ||
      selectedProduct?.unit?.toLowerCase() === "kilogram";
    const rwViss = selectedProduct
      ? isKg
        ? selectedProduct.remainingWeight * 1.62
        : selectedProduct.remainingWeight
      : 0;

    const totalPackages = Number(formData.count) || 0;
    const totalWeightFromCount = totalPackages * uw;

    const redWeight = Number(formData.red) * uw;
    const whiteWeight = Number(formData.white) * uw;
    const specialWeight = Number(formData.special) * uw;
    const naturalWeight = Number(formData.natural) * uw;
    const naturalWhiteWeight = Number(formData.naturalWhite) * uw;
    const naturalRedWeight = Number(formData.naturalRed) * uw;
    const shortCutWeight = Number(formData.shortCut) * uw;
    const artificialWeight = Number(formData.artificial) * uw;
    const shortWeight = Number(formData.short) * uw;

    const categorizedWeight =
      redWeight +
      whiteWeight +
      specialWeight +
      naturalWeight +
      naturalWhiteWeight +
      naturalRedWeight +
      shortCutWeight +
      artificialWeight +
      shortWeight;
    const remainingWeight = rwViss - categorizedWeight;

    const total = totalWeightFromCount;
    const diff = selectedProduct ? rwViss - total : 0;

    return {
      rwViss,
      normalWeight: totalWeightFromCount,
      redWeight,
      whiteWeight,
      specialWeight,
      naturalWeight,
      naturalWhiteWeight,
      naturalRedWeight,
      shortCutWeight,
      artificialWeight,
      shortWeight,
      categorizedWeight,
      remainingWeight,
      total,
      diff,
      catSum:
        Number(formData.red) +
        Number(formData.white) +
        Number(formData.special) +
        Number(formData.natural) +
        Number(formData.naturalWhite) +
        Number(formData.naturalRed) +
        Number(formData.shortCut) +
        Number(formData.artificial) +
        Number(formData.short),
      remainingCount:
        (Number(formData.count) || 0) -
        (Number(formData.red) +
          Number(formData.white) +
          Number(formData.special) +
          Number(formData.natural) +
          Number(formData.naturalWhite) +
          Number(formData.naturalRed) +
          Number(formData.shortCut) +
          Number(formData.artificial) +
          Number(formData.short)),
    };
  }, [formData, selectedProduct]);

  // ─── Edit record helpers ───────────────────────────────────────────────────

  const openEditModal = (record: ProcessingRecord) => {
    setEditingRecord(record);
    const uw = record.unitWeight;
    const red = uw > 0 ? Math.round(record.redWeight / uw) : 0;
    const white = uw > 0 ? Math.round(record.whiteWeight / uw) : 0;
    const special = uw > 0 ? Math.round(record.specialWeight / uw) : 0;
    const natural = uw > 0 ? Math.round(record.naturalWeight / uw) : 0;
    const naturalWhite =
      uw > 0 ? Math.round(record.naturalWhiteWeight / uw) : 0;
    const naturalRed = uw > 0 ? Math.round(record.naturalRedWeight / uw) : 0;
    const shortCut = uw > 0 ? Math.round(record.shortCutWeight / uw) : 0;
    const artificial = uw > 0 ? Math.round(record.artificialWeight / uw) : 0;
    const short = uw > 0 ? Math.round(record.shortWeight / uw) : 0;
    setEditFormData({
      workerNames: record.workerNames,
      red,
      white,
      special,
      natural,
      naturalWhite,
      naturalRed,
      shortCut,
      artificial,
      short,
      selectedStaff: record.workerNames
        ? record.workerNames.split(", ").filter((n) => n.trim() !== "")
        : [],
    });
  };

  const toggleEditStaff = (name: string) => {
    setEditFormData((prev) => ({
      ...prev,
      selectedStaff: prev.selectedStaff.includes(name)
        ? prev.selectedStaff.filter((s) => s !== name)
        : [...prev.selectedStaff, name],
    }));
  };

  const getOriginalTotalCount = (record: ProcessingRecord) => {
    const uw = record.unitWeight || 1;
    const origCatSum =
      Math.round(record.redWeight / uw) +
      Math.round(record.whiteWeight / uw) +
      Math.round(record.specialWeight / uw) +
      Math.round(record.naturalWeight / uw) +
      Math.round(record.naturalWhiteWeight / uw) +
      Math.round(record.naturalRedWeight / uw) +
      Math.round(record.shortCutWeight / uw) +
      Math.round(record.artificialWeight / uw) +
      Math.round(record.shortWeight / uw);

    const hasCategoryCounts =
      record.redCount > 0 ||
      record.whiteCount > 0 ||
      record.specialCount > 0 ||
      record.naturalCount > 0 ||
      record.naturalWhiteCount > 0 ||
      record.naturalRedCount > 0 ||
      record.shortCutCount > 0 ||
      record.artificialCount > 0 ||
      record.shortCount > 0;

    const hasCategoryWeights = origCatSum > 0;
    const isNewRecord =
      (record.remainingCount !== undefined && record.remainingCount > 0) ||
      hasCategoryCounts ||
      !hasCategoryWeights;

    return isNewRecord ? record.count : record.count + origCatSum;
  };

  const getEditFieldMax = (fieldName: keyof typeof editFormData) => {
    if (!editingRecord) return undefined;

    const origTotal = getOriginalTotalCount(editingRecord);

    const categoryFields: (keyof typeof editFormData)[] = [
      "red",
      "white",
      "special",
      "natural",
      "naturalWhite",
      "naturalRed",
      "shortCut",
      "artificial",
      "short",
    ];

    if (categoryFields.includes(fieldName)) {
      const otherCategoriesSum = categoryFields
        .filter((f) => f !== fieldName)
        .reduce((sum, f) => sum + (Number(editFormData[f]) || 0), 0);

      return Math.max(0, origTotal - otherCategoriesSum).toString();
    }

    return undefined;
  };

  const closeEditModal = () => {
    setEditingRecord(null);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let numValue = value === "" ? 0 : parseFloat(value);

    const categoryFields = [
      "red",
      "white",
      "special",
      "natural",
      "naturalWhite",
      "naturalRed",
      "shortCut",
      "artificial",
      "short",
    ];

    if (categoryFields.includes(name)) {
      const maxValStr = getEditFieldMax(name as any);
      if (maxValStr) {
        const maxVal = parseInt(maxValStr);
        if (!isNaN(numValue) && numValue > maxVal) {
          numValue = maxVal;
        }
      }
    }

    setEditFormData((prev) => ({ ...prev, [name]: numValue }));
  };

  const handleEditSave = async () => {
    if (!editingRecord) return;
    const uw = editingRecord.unitWeight;
    const redWeight = editFormData.red * uw;
    const whiteWeight = editFormData.white * uw;
    const specialWeight = editFormData.special * uw;
    const naturalWeight = editFormData.natural * uw;
    const naturalWhiteWeight = editFormData.naturalWhite * uw;
    const naturalRedWeight = editFormData.naturalRed * uw;
    const shortCutWeight = editFormData.shortCut * uw;
    const artificialWeight = editFormData.artificial * uw;
    const shortWeight = editFormData.short * uw;

    const catSum =
      editFormData.red +
      editFormData.white +
      editFormData.special +
      editFormData.natural +
      editFormData.naturalWhite +
      editFormData.naturalRed +
      editFormData.shortCut +
      editFormData.artificial +
      editFormData.short;
    const originalTotal = getOriginalTotalCount(editingRecord);

    const normalCount = originalTotal - catSum;

    const normalWeight = normalCount * uw;
    const categoryWeight =
      redWeight +
      whiteWeight +
      specialWeight +
      naturalWeight +
      naturalWhiteWeight +
      naturalRedWeight +
      shortCutWeight +
      artificialWeight +
      shortWeight;
    const totalWeight = normalWeight + categoryWeight;

    const dto: CreateProcessingRecordDto = {
      date: editingRecord.date,
      productId: editingRecord.productId,
      workerNames: editFormData.selectedStaff.join(", "),
      count: originalTotal,
      remainingCount: normalCount,
      unitWeight: uw,
      redWeight,
      redCount: editFormData.red,
      whiteWeight,
      whiteCount: editFormData.white,
      specialWeight,
      specialCount: editFormData.special,
      naturalWeight,
      naturalCount: editFormData.natural,
      naturalWhiteWeight,
      naturalWhiteCount: editFormData.naturalWhite,
      naturalRedWeight,
      naturalRedCount: editFormData.naturalRed,
      shortCutWeight,
      shortCutCount: editFormData.shortCut,
      artificialWeight,
      artificialCount: editFormData.artificial,
      shortWeight: shortWeight,
      shortCount: editFormData.short,
      lossWeight: 0,
      totalWeight,
      remainingWeight: normalWeight, // normalWeight is the remaining weight for sale
      remainingWeightKg: (() => {
        const productForEdit = products.find(
          (p) => p.id === editingRecord.productId,
        );
        const isEditProductKg =
          productForEdit?.unit?.toLowerCase() === "kg" ||
          productForEdit?.unit?.toLowerCase() === "kilogram";
        return isEditProductKg
          ? Number((normalWeight / 1.62).toFixed(4))
          : undefined;
      })(),
      difference: editingRecord.difference,
    };

    try {
      await processingAPI.update(editingRecord.id, dto);
      closeEditModal();
      await loadData();
    } catch (error) {
      console.error("Failed to update record:", error);
      showAlert("Error", "မှတ်တမ်း ပြင်ဆင်ရာတွင် အမှားဖြစ်သည်", "error");
    }
  };

  const handleDeleteRecord = async (record: ProcessingRecord) => {
    showConfirm(
      "Confirm Delete",
      `မှတ်တမ်း (${record.productMarker}) ကို ဖျက်မည်လား?\nဤလုပ်ဆောင်ချက်ကို ပြောင်းပြန်ဆောင်ရွက်၍ မရပါ။`,
      async () => {
        try {
          await processingAPI.delete(record.id);
          await loadData();
          showAlert(
            "Success",
            "မှတ်တမ်းကို အောင်မြင်စွာ ဖျက်ပြီးပါပြီ",
            "success",
          );
        } catch (error) {
          console.error("Failed to delete record:", error);
          showAlert("Error", "မှတ်တမ်း ဖျက်ရာတွင် အမှားဖြစ်သည်", "error");
        }
      },
    );
  };

  // ──────────────────────────────────────────────────────────────────────────

  const handleRegisterWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerName.trim()) return;
    try {
      await workersAPI.create({ name: newWorkerName });
      setNewWorkerName("");
      setShowWorkerModal(false);
      const workersData = await workersAPI.getAll();
      setWorkers(workersData);
    } catch (error) {
      console.error("Failed to register worker:", error);
      showAlert("Error", "Failed to register worker", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || selectedStaff.length === 0) return;

    try {
      const catSum =
        Number(formData.red) +
        Number(formData.white) +
        Number(formData.special) +
        Number(formData.natural) +
        Number(formData.naturalWhite) +
        Number(formData.naturalRed) +
        Number(formData.shortCut) +
        Number(formData.artificial) +
        Number(formData.short);
      const normalCount = Number(formData.count) - catSum;

      const dto: CreateProcessingRecordDto = {
        date: combineDateWithMyanmarTime(
          new Date().toISOString().split("T")[0],
        ),
        productId: selectedProductId,
        workerNames: selectedStaff.join(", "),
        count: Number(formData.count),
        remainingCount: normalCount,
        unitWeight: Number(formData.unitWeight),
        redWeight: totals.redWeight,
        redCount: Number(formData.red) || 0,
        whiteWeight: totals.whiteWeight,
        whiteCount: Number(formData.white) || 0,
        specialWeight: totals.specialWeight,
        specialCount: Number(formData.special) || 0,
        naturalWeight: totals.naturalWeight,
        naturalCount: Number(formData.natural) || 0,
        naturalWhiteWeight: totals.naturalWhiteWeight,
        naturalWhiteCount: Number(formData.naturalWhite) || 0,
        naturalRedWeight: totals.naturalRedWeight,
        naturalRedCount: Number(formData.naturalRed) || 0,
        shortCutWeight: totals.shortCutWeight,
        shortCutCount: Number(formData.shortCut) || 0,
        artificialWeight: totals.artificialWeight,
        artificialCount: Number(formData.artificial) || 0,
        shortWeight: totals.shortWeight,
        shortCount: Number(formData.short) || 0,
        lossWeight: 0,
        totalWeight: totals.total,
        remainingWeight: totals.remainingWeight,
        remainingWeightKg:
          selectedProduct?.unit?.toLowerCase() === "kg" ||
          selectedProduct?.unit?.toLowerCase() === "kilogram"
            ? Number((totals.remainingWeight / 1.62).toFixed(4))
            : undefined,
        difference: totals.diff,
      };

      await processingAPI.create(dto);

      // Reset form
      setFormData({
        count: "0",
        unitWeight: "0.05",
        red: "",
        white: "",
        special: "",
        natural: "",
        naturalWhite: "",
        naturalRed: "",
        shortCut: "",
        artificial: "",
        short: "",
      });
      setSelectedStaff([]);
      setSelectedProductId(null);

      loadData();
      showAlert("Success", "Record saved successfully!", "success");
    } catch (error) {
      console.error("Failed to save record:", error);
      showAlert("Error", "Failed to save record", "error");
    }
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="processing-container fade-in">
      {/* Left Sidebar: Product List */}
      <aside className="product-sidebar">
        <h2 className="sidebar-title">
          <Package size={20} />
          Select a bag to sort
        </h2>
        <div className="product-list">
          {products.map((product) => (
            <div
              key={product.id}
              className={`product-card ${selectedProductId === product.id ? "selected" : ""} ${product.remainingWeight <= 0.0001 ? "used" : ""}`}
              onClick={() => setSelectedProductId(product.id)}
            >
              <div className="card-header">
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span className="card-marker">{product.marker}</span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                      fontWeight: 500,
                    }}
                  >
                    {product.warehouseName}
                  </span>
                </div>
                <span
                  className={`card-badge ${product.remainingWeight <= 0.0001 ? "badge-used" : ""}`}
                >
                  {product.remainingWeight <= 0.0001 ? "Used" : "New"}
                </span>
              </div>
              <div className="card-details">
                <span>{product.packages}</span>
                <span className="card-weight">
                  {product.remainingWeight.toFixed(4)} {product.unit}
                </span>
                {product.remainingWeight < 0 && (
                  <button
                    className="btn-repair"
                    onClick={(e) => {
                      e.stopPropagation();
                      showConfirm(
                        "Reset Weight",
                        "Reset this product weight to 0?",
                        () => {
                          productsAPI
                            .update(product.id, {
                              ...product,
                              remainingWeight: 0,
                            })
                            .then(() => loadData());
                        },
                      );
                    }}
                  >
                    Reset to 0
                  </button>
                )}
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
              <h1>Mess-Labour</h1>
              <p className="header-subtitle">
                Bag Marker: <strong>{selectedProduct?.marker || "---"}</strong>
                {selectedProduct &&
                  selectedProduct.remainingWeight <= 0.0001 && (
                    <span className="status-badge used"> (Used)</span>
                  )}
              </p>
            </div>
          </div>
          {selectedProduct && (
            <div className="original-weight-box">
              <p className="weight-label">Original Weight</p>
              <p className="weight-value">
                {selectedProduct.remainingWeight.toFixed(4)}
                <span className="weight-unit">{selectedProduct.unit}</span>
              </p>
              {(selectedProduct.unit?.toLowerCase() === "kg" ||
                selectedProduct.unit?.toLowerCase() === "kilogram") && (
                <p className="weight-secondary-value">
                  {(selectedProduct.remainingWeight * 1.62).toFixed(4)}
                  <span className="weight-unit">viss</span>
                </p>
              )}
            </div>
          )}
        </div>

        {hasPermission("MessLabour.Create") && (
          <form onSubmit={handleSubmit}>
            {/* 1. Staff Selection */}
            <section className="form-section">
              <div className="section-header">
                <h3 className="section-label">1. Worker Names</h3>
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
                {workers.map((worker) => (
                  <div
                    key={worker.id}
                    className={`staff-chip ${selectedStaff.includes(worker.name) ? "selected" : ""}`}
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
              <h3 className="section-label" style={{ marginBottom: "16px" }}>2. Count &amp; Unit Weight</h3>
              <div className="count-unit-cards">
                {/* Count Card */}
                <div className="cu-card cu-card-count">
                  <div className="cu-card-icon">
                    <Package size={22} />
                  </div>
                  <div className="cu-card-body">
                    <label className="cu-label">Total Count</label>
                    <div className="cu-value-wrapper">
                      <input
                        type="number"
                        name="count"
                        min="0"
                        className="cu-input"
                        value={formData.count || ""}
                        readOnly
                        placeholder="0"
                      />
                      <span className="cu-unit">bundles</span>
                    </div>
                    <p className="cu-hint">Auto-calculated from remaining weight ÷ unit weight</p>
                  </div>
                </div>

                {/* Unit Weight Card */}
                <div className="cu-card cu-card-weight">
                  <div className="cu-card-icon">
                    <Calculator size={22} />
                  </div>
                  <div className="cu-card-body">
                    <label className="cu-label">Unit Weight</label>
                    <div className="cu-value-wrapper">
                      <input
                        type="number"
                        name="unitWeight"
                        step="0.000001"
                        min="0"
                        className="cu-input"
                        value={formData.unitWeight || ""}
                        onChange={handleInputChange}
                        placeholder="0.0000"
                      />
                      <span className="cu-unit">viss</span>
                    </div>
                    <p className="cu-hint">Weight per bundle in viss</p>
                  </div>
                </div>

                {/* Computed Total Weight */}
                <div className="cu-card cu-card-total">
                  <div className="cu-card-icon">
                    <ArrowRight size={22} />
                  </div>
                  <div className="cu-card-body">
                    <label className="cu-label">Total Weight</label>
                    <div className="cu-value-wrapper">
                      <span className="cu-computed">{totals.total.toFixed(4)}</span>
                      <span className="cu-unit">viss</span>
                    </div>
                    {selectedProduct && (
                      <p className="cu-hint" style={{ color: Math.abs(totals.diff) > 0.01 ? "#e53e3e" : "#38a169" }}>
                        Diff: {totals.diff > 0 ? "+" : ""}{totals.diff.toFixed(4)} viss
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Categories */}
            <section className="form-section">
              <h3 className="section-label">3. Short / Deduction Categories</h3>
              <div className="category-grid">
                <div className="category-input-box box-red">
                  <span className="box-label label-red">red</span>
                  <input
                    type="number"
                    name="red"
                    className="box-input"
                    max={getFieldMax("red")}
                    value={formData.red || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                  <span className="box-weight-hint hint-red">
                    {totals.redWeight.toFixed(3)} {"viss"}
                  </span>
                </div>
                <div className="category-input-box box-white">
                  <span className="box-label label-white">white</span>
                  <input
                    type="number"
                    name="white"
                    className="box-input"
                    max={getFieldMax("white")}
                    value={formData.white || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                  <span className="box-weight-hint hint-white">
                    {totals.whiteWeight.toFixed(3)} {"viss"}
                  </span>
                </div>
                <div className="category-input-box box-special">
                  <span className="box-label label-special">simple</span>
                  <input
                    type="number"
                    name="special"
                    className="box-input"
                    max={getFieldMax("special")}
                    value={formData.special || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                  <span className="box-weight-hint hint-special">
                    {totals.specialWeight.toFixed(3)} {"viss"}
                  </span>
                </div>
                <div className="category-input-box box-natural">
                  <span className="box-label label-natural">natural</span>
                  <input
                    type="number"
                    name="natural"
                    className="box-input"
                    max={getFieldMax("natural")}
                    value={formData.natural || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                  <span className="box-weight-hint hint-natural">
                    {totals.naturalWeight.toFixed(3)} {"viss"}
                  </span>
                </div>
                <div className="category-input-box box-natural-white">
                  <span className="box-label label-natural-white">
                    natural white
                  </span>
                  <input
                    type="number"
                    name="naturalWhite"
                    className="box-input"
                    max={getFieldMax("naturalWhite")}
                    value={formData.naturalWhite || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                  <span className="box-weight-hint hint-natural-white">
                    {totals.naturalWhiteWeight.toFixed(3)} {"viss"}
                  </span>
                </div>
                <div className="category-input-box box-natural-red">
                  <span className="box-label label-natural-red">
                    natural red
                  </span>
                  <input
                    type="number"
                    name="naturalRed"
                    className="box-input"
                    max={getFieldMax("naturalRed")}
                    value={formData.naturalRed || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                  <span className="box-weight-hint hint-natural-red">
                    {totals.naturalRedWeight.toFixed(3)} {"viss"}
                  </span>
                </div>
                <div className="category-input-box box-shortcut">
                  <span className="box-label label-shortcut">short cut</span>
                  <input
                    type="number"
                    name="shortCut"
                    className="box-input"
                    max={getFieldMax("shortCut")}
                    value={formData.shortCut || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                  <span className="box-weight-hint hint-shortcut">
                    {totals.shortCutWeight.toFixed(3)} {"viss"}
                  </span>
                </div>
                <div className="category-input-box box-artificial">
                  <span className="box-label label-artificial">artificial</span>
                  <input
                    type="number"
                    name="artificial"
                    className="box-input"
                    max={getFieldMax("artificial")}
                    value={formData.artificial || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                  <span className="box-weight-hint hint-artificial">
                    {totals.artificialWeight.toFixed(3)} {"viss"}
                  </span>
                </div>
                <div className="category-input-box box-short">
                  <span className="box-label label-short">short</span>
                  <input
                    type="number"
                    name="short"
                    className="box-input"
                    max={getFieldMax("short")}
                    value={formData.short || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                  <span className="box-weight-hint hint-short">
                    {totals.shortWeight.toFixed(3)} {"viss"}
                  </span>
                </div>
              </div>
            </section>

            {/* Summary & Verification */}
            <div className="summary-section">
              <div
                className="summary-calc"
                style={{
                  marginBottom:
                    selectedProduct?.unit?.toLowerCase() === "kg" ||
                    selectedProduct?.unit?.toLowerCase() === "kilogram"
                      ? "4px"
                      : "20px",
                }}
              >
                <div className="calc-left">
                  <Calculator size={24} />
                  <span>Weight Balance:</span>
                  <span>
                    {totals.rwViss.toFixed(3)} -{" "}
                    {totals.categorizedWeight.toFixed(3)}
                  </span>
                  <span>=</span>
                </div>
                <div className="calc-right">
                  {totals.remainingWeight.toFixed(4)}
                </div>
              </div>
              {(selectedProduct?.unit?.toLowerCase() === "kg" ||
                selectedProduct?.unit?.toLowerCase() === "kilogram") && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    color: "var(--gray)",
                    fontSize: "18px",
                    fontWeight: 600,
                    marginBottom: "20px",
                  }}
                >
                  ({(totals.remainingWeight / 1.62).toFixed(4)} kg)
                </div>
              )}

              <div
                className="summary-calc"
                style={{
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "1px dashed var(--border)",
                }}
              >
                <div className="calc-left">
                  <Calculator size={24} />
                  <span>Remaining Count:</span>
                  <span>
                    {formData.count} - {totals.catSum}
                  </span>
                  <span>=</span>
                </div>
                <div className="calc-right">{totals.remainingCount}</div>
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={
                !selectedProductId ||
                selectedStaff.length === 0 ||
                totals.diff < -(Number(formData.unitWeight) || 0) + 0.0001
              }
            >
              {totals.diff < -(Number(formData.unitWeight) || 0) + 0.0001
                ? "Weight exceeded — cannot save"
                : "Confirm & Save Record"}
              <ArrowRight size={20} />
            </button>
          </form>
        )}

        {/* History Table */}
        <div className="history-section">
          <h2 className="card-title">Recent Records</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Marker</th>
                  <th>Staff</th>
                  <th>Categories</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records
                  .filter(
                    (r) =>
                      !selectedProductId || r.productId === selectedProductId,
                  )
                  .slice(0, 10)
                  .map((record) => (
                    <tr
                      key={record.id}
                      onClick={() => setViewingRecord(record)}
                      style={{ cursor: "pointer" }}
                      className="hover-row"
                    >
                      <td>{formatDateTime(record.date)}</td>
                      <td>{record.productMarker}</td>
                      <td>{record.workerNames}</td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            flexWrap: "wrap",
                            maxWidth: "450px",
                          }}
                        >
                          {record.redCount > 0 && (
                            <span
                              className="card-badge"
                              style={{
                                color: "#c53030",
                                background: "#fff5f5",
                                border: "1px solid #fc8181",
                              }}
                            >
                              Red: {record.redCount}
                            </span>
                          )}
                          {record.whiteCount > 0 && (
                            <span
                              className="card-badge"
                              style={{
                                color: "#4a5568",
                                background: "#f7fafc",
                                border: "1px solid #cbd5e0",
                              }}
                            >
                              White: {record.whiteCount}
                            </span>
                          )}
                          {record.specialCount > 0 && (
                            <span
                              className="card-badge"
                              style={{
                                color: "#6b46c1",
                                background: "#faf5ff",
                                border: "1px solid #b794f4",
                              }}
                            >
                              Simple: {record.specialCount}
                            </span>
                          )}
                          {record.naturalCount > 0 && (
                            <span
                              className="card-badge"
                              style={{
                                color: "#276749",
                                background: "#f0fff4",
                                border: "1px solid #68d391",
                              }}
                            >
                              Natural: {record.naturalCount}
                            </span>
                          )}
                          {record.naturalWhiteCount > 0 && (
                            <span
                              className="card-badge"
                              style={{
                                color: "#2b6cb0",
                                background: "#ebf8ff",
                                border: "1px solid #63b3ed",
                              }}
                            >
                              N.White: {record.naturalWhiteCount}
                            </span>
                          )}
                          {record.naturalRedCount > 0 && (
                            <span
                              className="card-badge"
                              style={{
                                color: "#c05621",
                                background: "#fff8f1",
                                border: "1px solid #f6ad55",
                              }}
                            >
                              N.Red: {record.naturalRedCount}
                            </span>
                          )}
                          {record.shortCutCount > 0 && (
                            <span
                              className="card-badge"
                              style={{
                                color: "#975a16",
                                background: "#fffff0",
                                border: "1px solid #f6e05e",
                              }}
                            >
                              S.Cut: {record.shortCutCount}
                            </span>
                          )}
                          {record.artificialCount > 0 && (
                            <span
                              className="card-badge"
                              style={{
                                color: "#702459",
                                background: "#fdf2f8",
                                border: "1px solid #d6bcfa",
                              }}
                            >
                              Art: {record.artificialCount}
                            </span>
                          )}
                          {record.shortCount > 0 && (
                            <span
                              className="card-badge"
                              style={{
                                color: "#92400e",
                                background: "#fef3c7",
                                border: "1px solid #f59e0b",
                              }}
                            >
                              Short: {record.shortCount}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                        {hasPermission("MessLabour.Edit") && (
                          <button
                            className={`rec-action-btn edit-btn ${record.isLocked ? "disabled" : ""}`}
                            title={
                              record.isLocked
                                ? "purification တွင် အသုံးပြုထားသောကြောင့် ပြင်ဆင်၍မရပါ"
                                : "ပြင်ဆင်မည်"
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              if (record.isLocked) return;
                              openEditModal(record);
                            }}
                            style={{
                              opacity: record.isLocked ? 0.5 : 1,
                              cursor: record.isLocked
                                ? "not-allowed"
                                : "pointer",
                            }}
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {hasPermission("MessLabour.Delete") && (
                          <button
                            className={`rec-action-btn delete-btn ${record.isLocked ? "disabled" : ""}`}
                            title={
                              record.isLocked
                                ? "purification တွင် အသုံးပြုထားသောကြောင့် ဖျက်၍မရပါ"
                                : "ဖျက်မည်"
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              if (record.isLocked) return;
                              handleDeleteRecord(record);
                            }}
                            style={{
                              opacity: record.isLocked ? 0.5 : 1,
                              cursor: record.isLocked
                                ? "not-allowed"
                                : "pointer",
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
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
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowWorkerModal(false);
          }}
        >
          <div className="rw-modal">
            {/* Header */}
            <div className="rw-header">
              <div className="rw-header-left">
                <div className="rw-header-icon">
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="rw-header-title">Worker Directory</h2>
                  <p className="rw-header-pre">Manage and register workers</p>
                </div>
              </div>
              <button className="rw-close-btn" onClick={() => setShowWorkerModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="rw-body">
              {/* Left Panel: Register Form */}
              <div className="rw-panel rw-form-panel">
                <h3 className="rw-panel-title">Add New Worker</h3>
                <form onSubmit={handleRegisterWorker} className="rw-form">
                  <div className="rw-form-group">
                    <label className="rw-form-label">Worker Name</label>
                    <input
                      type="text"
                      className="rw-form-control"
                      value={newWorkerName}
                      onChange={(e) => setNewWorkerName(e.target.value)}
                      placeholder="e.g. Aung Aung"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="rw-form-actions">
                    <button type="submit" className="rw-btn-submit">
                      <Plus size={15} /> Add to Directory
                    </button>
                  </div>
                </form>
              </div>

              {/* Divider */}
              <div className="rw-panel-divider" />

              {/* Right Panel: Registered List */}
              <div className="rw-panel rw-list-panel">
                <div className="rw-list-header">
                  <h3 className="rw-panel-title">Registered List</h3>
                  <span className="rw-count-badge">{workers.length} Total</span>
                </div>
                <div className="rw-workers-scroll">
                  {workers.length === 0 ? (
                    <div className="rw-empty-state">No workers registered yet.</div>
                  ) : (
                    <div className="rw-workers-list">
                      {workers.map((worker) => (
                        <div key={worker.id} className="rw-worker-card">
                          <div className="rw-worker-avatar">
                            {worker.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="rw-worker-name">{worker.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Record Modal ─────────────────────────────────────── */}
      {editingRecord && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEditModal();
          }}
        >
          <div className="em-modal">
            {/* Header */}
            <div className="em-header">
              <div className="em-header-left">
                <div className="em-header-icon">
                  <Pencil size={20} />
                </div>
                <div>
                  <p className="em-header-pre">Edit Record</p>
                  <h2 className="em-header-title">{editingRecord.productMarker}</h2>
                </div>
              </div>
              <button className="em-close-btn" onClick={closeEditModal}>
                <X size={20} />
              </button>
            </div>

            {/* Info bar */}
            <div className="em-info-bar">
              <div className="em-info-chip">
                <span className="em-info-label">Unit Weight</span>
                <span className="em-info-value">{editingRecord.unitWeight.toFixed(4)} viss</span>
              </div>
              <div className="em-info-chip">
                <span className="em-info-label">Total Count</span>
                <span className="em-info-value">{getOriginalTotalCount(editingRecord)} bundles</span>
              </div>
              <div className="em-info-chip">
                <span className="em-info-label">Date</span>
                <span className="em-info-value">{formatDateTime(editingRecord.date)}</span>
              </div>
            </div>

            <div className="em-body">
              {/* Worker Selection */}
              <div className="em-section">
                <p className="em-section-title">
                  <Users size={15} /> Worker Names
                </p>
                <div className="em-worker-grid">
                  {workers.map((worker) => (
                    <div
                      key={worker.id}
                      className={`em-worker-chip ${editFormData.selectedStaff.includes(worker.name) ? "em-worker-selected" : ""}`}
                      onClick={() => toggleEditStaff(worker.name)}
                    >
                      <Users size={13} />
                      {worker.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Inputs */}
              <div className="em-section">
                <p className="em-section-title">
                  <Scissors size={15} /> Category Bundles
                </p>
                <div className="em-cat-grid">
                  {(
                    [
                      { name: "red",          label: "Red",          cls: "em-cat-red"    },
                      { name: "white",        label: "White",        cls: "em-cat-white"  },
                      { name: "special",      label: "Simple",       cls: "em-cat-special"},
                      { name: "natural",      label: "Natural",      cls: "em-cat-natural"},
                      { name: "naturalWhite", label: "Nat. White",   cls: "em-cat-nwhite" },
                      { name: "naturalRed",   label: "Nat. Red",     cls: "em-cat-nred"   },
                      { name: "shortCut",     label: "Short Cut",    cls: "em-cat-scut"   },
                      { name: "artificial",   label: "Artificial",   cls: "em-cat-art"    },
                      { name: "short",        label: "Short",        cls: "em-cat-short"  },
                    ] as const
                  ).map(({ name, label, cls }) => (
                    <div key={name} className={`em-cat-card ${cls}`}>
                      <span className="em-cat-label">{label}</span>
                      <input
                        type="number"
                        name={name}
                        className="em-cat-input"
                        value={(editFormData as any)[name] || ""}
                        onChange={handleEditInputChange}
                        placeholder="0"
                        min="0"
                        max={getEditFieldMax(name as any)}
                      />
                      <span className="em-cat-weight">
                        {((editFormData as any)[name] * editingRecord.unitWeight).toFixed(3)} v
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              {(() => {
                const uw = editingRecord.unitWeight || 1;
                const originalTotal = getOriginalTotalCount(editingRecord);
                const catSum =
                  (editFormData.red || 0) + (editFormData.white || 0) +
                  (editFormData.special || 0) + (editFormData.natural || 0) +
                  (editFormData.naturalWhite || 0) + (editFormData.naturalRed || 0) +
                  (editFormData.shortCut || 0) + (editFormData.artificial || 0) +
                  (editFormData.short || 0);
                const remainingCount = originalTotal - catSum;
                const remainingWeight = remainingCount * uw;
                const productForEdit = products.find((p) => p.id === editingRecord.productId);
                const isKg = productForEdit?.unit?.toLowerCase() === "kg" || productForEdit?.unit?.toLowerCase() === "kilogram";

                return (
                  <div className="em-summary-bar">
                    <div className="em-sum-chip em-sum-count">
                      <span className="em-sum-label">Remaining Count</span>
                      <span className="em-sum-val">{remainingCount}</span>
                      <span className="em-sum-sub">bundles</span>
                    </div>
                    <div className="em-sum-divider" />
                    <div className="em-sum-chip em-sum-weight">
                      <span className="em-sum-label">Remaining Weight</span>
                      <span className="em-sum-val">{remainingWeight.toFixed(4)}</span>
                      <span className="em-sum-sub">
                        viss{isKg ? ` (${(remainingWeight / 1.62).toFixed(4)} kg)` : ""}
                      </span>
                    </div>
                    <div className="em-sum-divider" />
                    <div className="em-sum-chip em-sum-sorted">
                      <span className="em-sum-label">Sorted</span>
                      <span className="em-sum-val">{catSum}</span>
                      <span className="em-sum-sub">of {originalTotal}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="em-footer">
              <button className="em-btn-cancel" onClick={closeEditModal}>
                <X size={15} /> Cancel
              </button>
              <button className="em-btn-save" onClick={handleEditSave}>
                <Save size={15} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ─── View Record Modal ─────────────────────────────────────── */}
      {viewingRecord && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingRecord(null);
          }}
        >
          <div className="vm-modal">
            {/* Header */}
            <div className="vm-header">
              <div className="vm-header-left">
                <div className="vm-header-icon">
                  <Package size={22} />
                </div>
                <div>
                  <p className="vm-header-pre">Record Details</p>
                  <h2 className="vm-header-title">{viewingRecord.productMarker}</h2>
                </div>
              </div>
              <button className="vm-close-btn" onClick={() => setViewingRecord(null)}>
                <X size={20} />
              </button>
            </div>

            {/* Main Stats Grid */}
            <div className="vm-stats-grid">
              <div className="vm-stat-card">
                <span className="vm-stat-label">Date</span>
                <span className="vm-stat-value">{formatDateTime(viewingRecord.date)}</span>
              </div>
              <div className="vm-stat-card vm-stat-span-2">
                <span className="vm-stat-label">Workers</span>
                <span className="vm-stat-value">{viewingRecord.workerNames || "---"}</span>
              </div>
              <div className="vm-stat-card">
                <span className="vm-stat-label">Unit Weight</span>
                <span className="vm-stat-value">{viewingRecord.unitWeight.toFixed(4)} viss</span>
              </div>
            </div>

            {/* Remaining Stock Highlight */}
            <div className="vm-highlights">
              <div className="vm-highlight-box highlight-blue">
                <div className="vm-hl-label">Remaining Count</div>
                <div className="vm-hl-value">
                  {viewingRecord.remainingCount} <span className="vm-hl-unit">bundles</span>
                </div>
                <div className="vm-hl-desc">of {viewingRecord.count} original packages</div>
              </div>
              <div className="vm-highlight-box highlight-green">
                <div className="vm-hl-label">Remaining Weight</div>
                <div className="vm-hl-value">
                  {viewingRecord.remainingWeight.toFixed(4)} <span className="vm-hl-unit">viss</span>
                </div>
                <div className="vm-hl-desc">weight available for sales</div>
              </div>
            </div>

            <div className="vm-body">
              {/* Category Details */}
              <div className="vm-section">
                <p className="vm-section-title">
                  <Scissors size={15} /> Categorized Distribution
                </p>
                <div className="vm-cat-grid">
                  {(
                    [
                      { count: viewingRecord.redCount,          weight: viewingRecord.redWeight,          label: "Red",          cls: "vm-cat-red"    },
                      { count: viewingRecord.whiteCount,        weight: viewingRecord.whiteWeight,        label: "White",        cls: "vm-cat-white"  },
                      { count: viewingRecord.specialCount,      weight: viewingRecord.specialWeight,      label: "Simple",       cls: "vm-cat-special"},
                      { count: viewingRecord.naturalCount,      weight: viewingRecord.naturalWeight,      label: "Natural",      cls: "vm-cat-natural"},
                      { count: viewingRecord.naturalWhiteCount, weight: viewingRecord.naturalWhiteWeight, label: "Nat. White",   cls: "vm-cat-nwhite" },
                      { count: viewingRecord.naturalRedCount,   weight: viewingRecord.naturalRedWeight,   label: "Nat. Red",     cls: "vm-cat-nred"   },
                      { count: viewingRecord.shortCutCount,     weight: viewingRecord.shortCutWeight,     label: "Short Cut",    cls: "vm-cat-scut"   },
                      { count: viewingRecord.artificialCount,   weight: viewingRecord.artificialWeight,   label: "Artificial",   cls: "vm-cat-art"    },
                      { count: viewingRecord.shortCount,        weight: viewingRecord.shortWeight,        label: "Short",        cls: "vm-cat-short"  },
                    ] as const
                  )
                    .filter((cat) => cat.count > 0)
                    .map(({ count, weight, label, cls }) => (
                      <div key={label} className={`vm-cat-card ${cls}`}>
                        <span className="vm-cat-label">{label}</span>
                        <span className="vm-cat-count">{count} bundles</span>
                        <span className="vm-cat-weight">{weight.toFixed(3)} viss</span>
                      </div>
                    ))}
                  {viewingRecord.redCount === 0 &&
                    viewingRecord.whiteCount === 0 &&
                    viewingRecord.specialCount === 0 &&
                    viewingRecord.naturalCount === 0 &&
                    viewingRecord.naturalWhiteCount === 0 &&
                    viewingRecord.naturalRedCount === 0 &&
                    viewingRecord.shortCutCount === 0 &&
                    viewingRecord.artificialCount === 0 &&
                    viewingRecord.shortCount === 0 && (
                      <div className="vm-empty-cats">
                        No bundles were sorted into categories.
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Bottom Total Alert Bar */}
            <div className="vm-totals-bar">
              <div className="vm-total-item">
                <span className="vm-total-label">Total Weight</span>
                <span className="vm-total-value">
                  {viewingRecord.totalWeight.toFixed(4)} <span className="vm-total-unit">viss</span>
                </span>
              </div>
              <div className="vm-total-item" style={{ alignItems: "flex-end" }}>
                <span className="vm-total-label">Weight Difference</span>
                <span className={`vm-total-diff ${viewingRecord.difference > 0.1 || viewingRecord.difference < -0.1 ? "diff-error" : "diff-success"}`}>
                  {viewingRecord.difference > 0 ? "+" : ""}
                  {viewingRecord.difference.toFixed(4)} viss
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="vm-footer">
              <button className="vm-btn-close" onClick={() => setViewingRecord(null)}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessLabour;
