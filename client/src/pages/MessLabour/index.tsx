import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  washGradingAPI,
  messLabourWorkersAPI,
  processingAPI,
} from "../../services/api";
import type {
  WashGradingRecord,
  MessLabourWorker,
  ProcessingRecord,
  CreateProcessingRecordDto,
} from "../../types";
import {
  Package,
  Users,
  Calculator,
  ArrowRight,
  Scissors,
  Pencil,
  Trash2,
  X,
  Save,
  Search,
  AlertCircle,
  Settings,
} from "lucide-react";
import MessLabourWorkerManagement from "../MessLabourWorkerManagement";
import { combineDateWithMyanmarTime, formatDateTime } from "../../utils/format";
import { useNotification } from "../../context/NotificationContext";
import "./index.css";

const MessLabour: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showAlert, showConfirm } = useNotification();
  const [washRecords, setWashRecords] = useState<WashGradingRecord[]>([]);
  const [workers, setWorkers] = useState<MessLabourWorker[]>([]);
  const [records, setRecords] = useState<ProcessingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWashRecordId, setSelectedWashRecordId] = useState<number | null>(
    null,
  );
  const [selectedWorkers, setSelectedWorkers] = useState<
    { messLabourWorkerId: number; workerFee: number }[]
  >([]);

  const [activeTab, setActiveTab] = useState<"processing" | "history">(
    "processing",
  );
  const [showMessLabourWorkerManagement, setShowMessLabourWorkerManagement] =
    useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleCloseMessLabourWorkerManagement = () => {
    setShowMessLabourWorkerManagement(false);
    loadData();
  };

  const filteredWashRecords = useMemo(() => {
    return washRecords.filter((record) => {
      // Don't show records with no remaining weight
      if (record.remainingWeight <= 0.0001) {
        return false;
      }
      return (
        record.productMarker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.warehouseName || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    });
  }, [washRecords, searchTerm]);

  // Edit/View modal state
  const [editingRecord, setEditingRecord] = useState<ProcessingRecord | null>(
    null,
  );
  const [viewingRecord, setViewingRecord] = useState<ProcessingRecord | null>(
    null,
  );
  const [editFormData, setEditFormData] = useState({
    workers: [] as { messLabourWorkerId: number; workerFee: number }[],
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
    lossWeight: 0,
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
    lossWeight: "",
  });

  const selectedWashRecord = useMemo(
    () => washRecords.find((r) => r.id === selectedWashRecordId),
    [washRecords, selectedWashRecordId],
  );

  useEffect(() => {
    loadData();
  }, []);

  // Auto-calculate total count from remaining weight (always viss) and unit weight
  useEffect(() => {
    if (selectedWashRecord && Number(formData.unitWeight) > 0) {
      // WashGradingRecord.remainingWeight is always in viss
      const rwViss = selectedWashRecord.remainingWeight;
      const calcCount = Number(
        (rwViss / Number(formData.unitWeight)).toFixed(4),
      );
      setFormData((prev) => ({ ...prev, count: calcCount.toString() }));
    } else {
      setFormData((prev) => ({ ...prev, count: "0" }));
    }
  }, [selectedWashRecord, formData.unitWeight]);

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
      const [washData, workersData, recordsData] = await Promise.all([
        washGradingAPI.getAvailableForMessLabour(),
        messLabourWorkersAPI.getAll(),
        processingAPI.getAll(),
      ]);
      setWashRecords(washData);
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
    if (!selectedWashRecord || !formData.unitWeight) return undefined;
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

  const totals = useMemo(() => {
    const uw = Number(formData.unitWeight) || 0;

    // WashGradingRecord.remainingWeight is always in viss
    const rwViss = selectedWashRecord ? selectedWashRecord.remainingWeight : 0;

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
    const lossWeight = Number(formData.lossWeight) || 0;

    const categorizedWeight =
      redWeight +
      whiteWeight +
      specialWeight +
      naturalWeight +
      naturalWhiteWeight +
      naturalRedWeight +
      shortCutWeight +
      artificialWeight +
      shortWeight +
      lossWeight;
    const remainingWeight = rwViss - categorizedWeight;

    const total = totalWeightFromCount;
    const diff = selectedWashRecord ? rwViss - total : 0;

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
      lossWeight,
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
      remainingCount: uw > 0 ? Math.max(0, remainingWeight / uw) : 0,
    };
  }, [formData, selectedWashRecord]);

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
      workers:
        record.workers?.map((w) => ({
          messLabourWorkerId: w.messLabourWorkerId,
          workerFee: w.workerFee,
        })) || [],
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
      lossWeight: record.lossWeight,
    });
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
    const lossWeight = Number(editFormData.lossWeight) || 0;

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

    const normalWeight = Math.max(
      0,
      (originalTotal - catSum) * uw - lossWeight,
    );
    const normalCount = uw > 0 ? normalWeight / uw : 0;

    const categoryWeight =
      redWeight +
      whiteWeight +
      specialWeight +
      naturalWeight +
      naturalWhiteWeight +
      naturalRedWeight +
      shortCutWeight +
      artificialWeight +
      shortWeight +
      lossWeight;
    const totalWeight = normalWeight + categoryWeight;

    const dto: CreateProcessingRecordDto = {
      date: editingRecord.date,
      productId: editingRecord.productId,
      workerNames: "",
      workers: editFormData.workers,
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
      lossWeight,
      totalWeight,
      remainingWeight: normalWeight, // normalWeight is the remaining weight for sale
      remainingWeightKg: undefined,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWashRecordId || !selectedWashRecord || selectedWorkers.length === 0) {
      showAlert(
        "Validation",
        "Please select a washed item and at least one worker",
        "error",
      );
      return;
    }

    try {
      const dto: CreateProcessingRecordDto = {
        date: combineDateWithMyanmarTime(
          new Date().toISOString().split("T")[0],
        ),
        productId: selectedWashRecord.productId,
        washGradingRecordId: selectedWashRecord.id,
        workerNames: "",
        workers: selectedWorkers,
        count: Number(formData.count),
        remainingCount: totals.remainingCount,
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
        lossWeight: totals.lossWeight,
        totalWeight: totals.total,
        remainingWeight: totals.remainingWeight,
        remainingWeightKg: undefined,
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
        lossWeight: "",
      });
      setSelectedWorkers([]);
      setSelectedWashRecordId(null);

      loadData();
      showAlert("Success", "Record saved successfully!", "success");
    } catch (error) {
      console.error("Failed to save record:", error);
      showAlert("Error", "Failed to save record", "error");
    }
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="rf-container fade-in">
      {/* Left Sidebar: Product List */}
      <aside className="rf-sidebar">
        <div className="rf-sidebar-header">
          <Package size={18} />
          <span>Select a bag to sort</span>
        </div>

        {/* Search in rf-sidebar */}
        <div className="rf-search-box">
          <Search size={16} className="rf-search-icon" />
          <input
            type="text"
            placeholder="Search marker..."
            className="rf-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="rf-card-list">
          {filteredWashRecords.length === 0 ? (
            <div className="rf-empty-sidebar">No washed items found</div>
          ) : (
            filteredWashRecords.map((record) => (
              <div
                key={record.id}
                className={`product-card ${selectedWashRecordId === record.id ? "selected" : ""}`}
                onClick={() => {
                  setSelectedWashRecordId(record.id);
                  setActiveTab("processing");
                }}
              >
                <div className="card-header">
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span className="card-marker">{record.productMarker}</span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#64748b",
                        fontWeight: 500,
                      }}
                    >
                      {record.warehouseName}
                    </span>
                  </div>
                  <span className="rf-badge category-natural">
                    Washed
                  </span>
                </div>
                <div className="card-details">
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    {record.washGradingWorkerName || "No worker"}
                  </span>
                  <span
                    style={{
                      fontWeight: "700",
                      color: "#2563eb",
                    }}
                  >
                    {record.remainingWeight.toFixed(4)} viss
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Right Main Content */}
      <main className="rf-main">
        <div className="rf-main-card">
          {/* Header & Tabs */}
          <div className="rf-main-header">
            <div className="rf-header-left">
              <div
                className="rf-header-icon"
                style={{
                  background: "linear-gradient(135deg, #dbeafe, #eff6ff)",
                  color: "#2563eb",
                }}
              >
                <Scissors size={26} />
              </div>
              <div className="rf-tab-group">
                <button
                  className={`rf-tab ${activeTab === "processing" ? "rf-tab-active rf-tab-green" : ""}`}
                  onClick={() => setActiveTab("processing")}
                >
                  <span className="rf-tab-title">Processing</span>
                  <span className="rf-tab-sub">Sort selected bag</span>
                </button>
                <button
                  className={`rf-tab ${activeTab === "history" ? "rf-tab-active rf-tab-green" : ""}`}
                  onClick={() => setActiveTab("history")}
                >
                  <span className="rf-tab-title">Mess-Labour History</span>
                  <span className="rf-tab-sub">View recent records</span>
                </button>
              </div>
            </div>

            <div className="rf-header-right">
              <button
                className="btn-manage-messlabour-workers"
                onClick={() => setShowMessLabourWorkerManagement(true)}
              >
                <Settings size={16} />
                Manage Mess-Labour Workers
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "processing" ? (
            selectedWashRecord ? (
              <div
                className="fade-in"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: "20px",
                        fontWeight: "800",
                        color: "#0f172a",
                        margin: 0,
                      }}
                    >
                      Mess-Labour sorting
                    </h2>
                    <p
                      style={{
                        fontSize: "13.5px",
                        color: "#64748b",
                        margin: "6px 0 0 0",
                        fontWeight: "500",
                      }}
                    >
                      Bag Marker: <strong>{selectedWashRecord.productMarker}</strong>
                      <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "8px" }}>
                        (from Wash/Grading)
                      </span>
                    </p>
                  </div>
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                      borderRadius: "12px",
                      padding: "10px 16px",
                      border: "1.5px solid #e2e8f0",
                      textAlign: "right",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10.5px",
                        fontWeight: "700",
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: "4px",
                      }}
                    >
                      Original Weight
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "800",
                        color: "#0f172a",
                      }}
                    >
                      {selectedWashRecord.remainingWeight.toFixed(4)}{" "}
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#64748b",
                        }}
                      >
                        viss
                      </span>
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={handleSubmit}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  {/* 2. Count & Unit Weight */}
                  <section className="form-section">
                    <h3
                      className="section-label"
                      style={{ marginBottom: "16px" }}
                    >
                      1. Count &amp; Unit Weight
                    </h3>
                    <div className="count-unit-cards">
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
                          <p className="cu-hint">
                            Auto-calculated from remaining weight ÷ unit weight
                          </p>
                        </div>
                      </div>
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
                      <div className="cu-card cu-card-total">
                        <div className="cu-card-icon">
                          <ArrowRight size={22} />
                        </div>
                        <div className="cu-card-body">
                          <label className="cu-label">Total Weight</label>
                          <div className="cu-value-wrapper">
                            <span className="cu-computed">
                              {totals.total.toFixed(4)}
                            </span>
                            <span className="cu-unit">viss</span>
                          </div>
                          {selectedWashRecord && (
                            <p
                              className="cu-hint"
                              style={{
                                color:
                                  Math.abs(totals.diff) > 0.01
                                    ? "#e53e3e"
                                    : "#38a169",
                              }}
                            >
                              Diff: {totals.diff > 0 ? "+" : ""}
                              {totals.diff.toFixed(4)} viss
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 3. Categories */}
                  <section className="form-section">
                    <h3 className="section-label">
                      2. Short / Deduction Categories
                    </h3>
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
                          {totals.redWeight.toFixed(3)} viss
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
                          {totals.whiteWeight.toFixed(3)} viss
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
                          {totals.specialWeight.toFixed(3)} viss
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
                          {totals.naturalWeight.toFixed(3)} viss
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
                          {totals.naturalWhiteWeight.toFixed(3)} viss
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
                          {totals.naturalRedWeight.toFixed(3)} viss
                        </span>
                      </div>
                      <div className="category-input-box box-shortcut">
                        <span className="box-label label-shortcut">
                          short cut
                        </span>
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
                          {totals.shortCutWeight.toFixed(3)} viss
                        </span>
                      </div>
                      <div className="category-input-box box-artificial">
                        <span className="box-label label-artificial">
                          artificial
                        </span>
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
                          {totals.artificialWeight.toFixed(3)} viss
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
                          {totals.shortWeight.toFixed(3)} viss
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* Lost Weight Section */}
                  <section className="form-section">
                    <h3 className="section-label">Lost Weight</h3>
                    <div className="lost-weight-container">
                      <div className="lost-weight-icon-wrapper">
                        <AlertCircle size={20} className="lost-icon" />
                      </div>
                      <div className="lost-weight-content">
                        <label>Lost (viss)</label>
                        <p className="lost-weight-msg">
                          This is the box to input lost weight. Input Lost
                          Weight in Viss only. Do not input the bundles count
                        </p>
                        <input
                          type="number"
                          name="lossWeight"
                          step="0.0001"
                          min="0"
                          className="rw-form-control lost-weight-input"
                          value={formData.lossWeight || ""}
                          onChange={handleInputChange}
                          placeholder="0.0000"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Weight Balance Summary */}
                  <div className="summary-section">
                    <div
                      className="summary-calc"
                      style={{
                        marginBottom: "20px",
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
                        {totals.remainingWeight.toFixed(3)} viss
                      </div>
                    </div>

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
                          {formData.count} - {totals.catSum.toFixed(4)}
                        </span>
                        <span>=</span>
                      </div>
                      <div className="calc-right">
                        {totals.remainingCount.toFixed(4)}
                      </div>
                    </div>
                  </div>

                  {/* 1. Worker Names */}
                  <section className="form-section">
                    <div
                      className="section-header"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <h3 className="section-label" style={{ margin: 0 }}>
                        3. Mess-Labour Workers & Fees
                      </h3>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        maxWidth: "600px",
                      }}
                    >
                      {selectedWorkers.map((sw, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            gap: "10px",
                            alignItems: "center",
                          }}
                        >
                          <select
                            className="rw-form-control"
                            value={sw.messLabourWorkerId || ""}
                            onChange={(e) => {
                              const newWorkers = [...selectedWorkers];
                              newWorkers[index].messLabourWorkerId = parseInt(
                                e.target.value,
                              );
                              setSelectedWorkers(newWorkers);
                            }}
                            style={{
                              padding: "0.75rem 1rem",
                              fontSize: "1.1rem",
                              flex: 1,
                            }}
                          >
                            <option value="" disabled>
                              Select a worker...
                            </option>
                            {workers.map((worker) => (
                              <option key={worker.id} value={worker.id}>
                                {worker.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            className="rw-form-control"
                            value={sw.workerFee || ""}
                            onChange={(e) => {
                              const newWorkers = [...selectedWorkers];
                              newWorkers[index].workerFee =
                                Number(e.target.value) || 0;
                              setSelectedWorkers(newWorkers);
                            }}
                            placeholder="Fee (MMK)"
                            style={{
                              padding: "0.75rem 1rem",
                              fontSize: "1.1rem",
                              width: "150px",
                            }}
                          />
                          <button
                            type="button"
                            className="rf-action-btn rf-action-delete"
                            onClick={() => {
                              const newWorkers = selectedWorkers.filter(
                                (_, i) => i !== index,
                              );
                              setSelectedWorkers(newWorkers);
                            }}
                            style={{ height: "42px", width: "42px" }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedWorkers([
                            ...selectedWorkers,
                            { messLabourWorkerId: 0, workerFee: 0 },
                          ])
                        }
                        style={{
                          alignSelf: "flex-start",
                          background: "#eff6ff",
                          color: "#2563eb",
                          border: "1.5px dashed #bfdbfe",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: 600,
                          transition: "all 0.2s",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = "#dbeafe";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = "#eff6ff";
                        }}
                      >
                        + Add Worker
                      </button>
                    </div>
                  </section>

                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={
                      !selectedWashRecordId ||
                      selectedWorkers.length === 0 ||
                      totals.diff < -(Number(formData.unitWeight) || 0) + 0.0001
                    }
                  >
                    {totals.diff < -(Number(formData.unitWeight) || 0) + 0.0001
                      ? "Weight exceeded — cannot save"
                      : "Confirm & Save Record"}
                    <ArrowRight size={20} />
                  </button>
                </form>
              </div>
            ) : (
              <div className="rf-empty-state">
                <Package
                  size={48}
                  style={{ color: "#cbd5e1", marginBottom: "16px" }}
                />
                <p
                  style={{
                    color: "#94a3b8",
                    fontWeight: 600,
                    fontSize: "15px",
                  }}
                >
                  No bag selected
                </p>
                <p style={{ color: "#cbd5e1", fontSize: "13px" }}>
                  Pick a bag from the sidebar to begin sorting
                </p>
              </div>
            )
          ) : (
            /* History Tab */
            <div className="rf-table-wrap fade-in">
              {selectedWashRecord && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "14px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    Showing records for:{" "}
                    <strong>{selectedWashRecord.productMarker}</strong>
                  </span>
                  <button
                    onClick={() => setSelectedWashRecordId(null)}
                    style={{
                      fontSize: "12px",
                      color: "#2563eb",
                      background: "none",
                      border: "1.5px solid #bfdbfe",
                      borderRadius: "8px",
                      padding: "4px 12px",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Clear Selection &amp; Show All
                  </button>
                </div>
              )}
              <table className="rf-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Marker</th>
                    <th>Worker</th>
                    <th>Worker Fees</th>
                    <th>Categories</th>
                    <th style={{ textAlign: "center" }}>Lost (viss)</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedWashRecordId
                    ? records.filter((r) => r.washGradingRecordId === selectedWashRecordId)
                    : records
                  ).map((record) => (
                    <tr
                      key={record.id}
                      onClick={() => setViewingRecord(record)}
                      style={{ cursor: "pointer" }}
                      className="hover-row"
                    >
                      <td>{formatDateTime(record.date)}</td>
                      <td>{record.productMarker}</td>
                      <td>
                        {record.workers && record.workers.length > 0
                          ? record.workers
                              .map((w) => w.messLabourWorkerName)
                              .join(", ")
                          : (record as any).messLabourWorkerName || "---"}
                      </td>
                      <td>
                        {(record.workers && record.workers.length > 0
                          ? record.workers.reduce(
                              (sum, w) => sum + w.workerFee,
                              0,
                            )
                          : record.workerFees || 0
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
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
                            <span className="rf-badge category-red">
                              Red: {record.redCount}
                            </span>
                          )}
                          {record.whiteCount > 0 && (
                            <span className="rf-badge category-white">
                              White: {record.whiteCount}
                            </span>
                          )}
                          {record.specialCount > 0 && (
                            <span className="rf-badge category-special">
                              Simple: {record.specialCount}
                            </span>
                          )}
                          {record.naturalCount > 0 && (
                            <span className="rf-badge category-natural">
                              Natural: {record.naturalCount}
                            </span>
                          )}
                          {record.naturalWhiteCount > 0 && (
                            <span className="rf-badge category-9r">
                              N.White: {record.naturalWhiteCount}
                            </span>
                          )}
                          {record.naturalRedCount > 0 && (
                            <span className="rf-badge category-red">
                              N.Red: {record.naturalRedCount}
                            </span>
                          )}
                          {record.shortCutCount > 0 && (
                            <span className="rf-badge category-special">
                              S.Cut: {record.shortCutCount}
                            </span>
                          )}
                          {record.artificialCount > 0 && (
                            <span className="rf-badge category-white">
                              Artif: {record.artificialCount}
                            </span>
                          )}
                          {record.shortCount > 0 && (
                            <span className="rf-badge category-9r">
                              Short: {record.shortCount}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {record.lossWeight > 0 ? (
                          <span
                            style={{
                              background: "#f1f5f9",
                              color: "#475569",
                              fontWeight: 700,
                              fontSize: "13px",
                              padding: "3px 10px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                            }}
                          >
                            {Number(record.lossWeight).toFixed(3)}
                          </span>
                        ) : (
                          <span style={{ color: "#cbd5e1", fontSize: "12px" }}>
                            —
                          </span>
                        )}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            justifyContent: "center",
                          }}
                        >
                          {hasPermission("MessLabour.Edit") && (
                            <button
                              className="rf-action-btn rf-action-edit"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(record);
                              }}
                              disabled={record.isLocked}
                              style={{
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
                              className="rf-action-btn rf-action-delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRecord(record);
                              }}
                              disabled={record.isLocked}
                              style={{
                                cursor: record.isLocked
                                  ? "not-allowed"
                                  : "pointer",
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* â”€â”€â”€ Edit Record Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                  <h2 className="em-header-title">
                    {editingRecord.productMarker}
                  </h2>
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
                <span className="em-info-value">
                  {editingRecord.unitWeight.toFixed(4)} viss
                </span>
              </div>
              <div className="em-info-chip">
                <span className="em-info-label">Total Count</span>
                <span className="em-info-value">
                  {getOriginalTotalCount(editingRecord)} bundles
                </span>
              </div>
              <div className="em-info-chip">
                <span className="em-info-label">Date</span>
                <span className="em-info-value">
                  {formatDateTime(editingRecord.date)}
                </span>
              </div>
            </div>

            <div className="em-body">
              {/* Category Inputs */}
              <div className="em-section">
                <p className="em-section-title">
                  <Scissors size={15} /> Category Bundles
                </p>
                <div className="em-cat-grid">
                  {(
                    [
                      { name: "red", label: "Red", cls: "em-cat-red" },
                      { name: "white", label: "White", cls: "em-cat-white" },
                      {
                        name: "special",
                        label: "Simple",
                        cls: "em-cat-special",
                      },
                      {
                        name: "natural",
                        label: "Natural",
                        cls: "em-cat-natural",
                      },
                      {
                        name: "naturalWhite",
                        label: "Nat. White",
                        cls: "em-cat-nwhite",
                      },
                      {
                        name: "naturalRed",
                        label: "Nat. Red",
                        cls: "em-cat-nred",
                      },
                      {
                        name: "shortCut",
                        label: "Short Cut",
                        cls: "em-cat-scut",
                      },
                      {
                        name: "artificial",
                        label: "Artificial",
                        cls: "em-cat-art",
                      },
                      { name: "short", label: "Short", cls: "em-cat-short" },
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
                        {(
                          (editFormData as any)[name] * editingRecord.unitWeight
                        ).toFixed(3)}{" "}
                        v
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edit Lost Weight Section */}
              <div className="em-section">
                <p className="em-section-title">
                  <AlertCircle size={15} /> Lost Weight
                </p>
                <div
                  className="lost-weight-container"
                  style={{ maxWidth: "100%" }}
                >
                  <div className="lost-weight-icon-wrapper">
                    <AlertCircle size={20} className="lost-icon" />
                  </div>
                  <div className="lost-weight-content">
                    <label>Lost (viss)</label>
                    <p className="lost-weight-msg">
                      This is the box to input lost weight. Input Lost Weight in
                      Viss only. Do not input the bundles count
                    </p>
                    <input
                      type="number"
                      name="lossWeight"
                      step="0.0001"
                      min="0"
                      className="rw-form-control lost-weight-input"
                      value={editFormData.lossWeight || ""}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          lossWeight: Number(e.target.value) || 0,
                        }))
                      }
                      placeholder="0.0000"
                    />
                  </div>
                </div>
              </div>

              {/* Worker Selection */}
              <div className="em-section">
                <p className="em-section-title">
                  <Users size={15} /> Mess-Labour Workers
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    maxWidth: "600px",
                  }}
                >
                  {editFormData.workers.map((sw, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                      }}
                    >
                      <select
                        className="rw-form-control"
                        value={sw.messLabourWorkerId || ""}
                        onChange={(e) => {
                          const newWorkers = [...editFormData.workers];
                          newWorkers[index].messLabourWorkerId = parseInt(
                            e.target.value,
                          );
                          setEditFormData((prev) => ({
                            ...prev,
                            workers: newWorkers,
                          }));
                        }}
                        style={{
                          padding: "0.75rem 1rem",
                          fontSize: "1.1rem",
                          flex: 1,
                        }}
                      >
                        <option value="" disabled>
                          Select a worker...
                        </option>
                        {workers.map((worker) => (
                          <option key={worker.id} value={worker.id}>
                            {worker.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        className="rw-form-control"
                        value={sw.workerFee || ""}
                        onChange={(e) => {
                          const newWorkers = [...editFormData.workers];
                          newWorkers[index].workerFee =
                            Number(e.target.value) || 0;
                          setEditFormData((prev) => ({
                            ...prev,
                            workers: newWorkers,
                          }));
                        }}
                        placeholder="Fee (MMK)"
                        style={{
                          padding: "0.75rem 1rem",
                          fontSize: "1.1rem",
                          width: "150px",
                        }}
                      />
                      <button
                        type="button"
                        className="rf-action-btn rf-action-delete"
                        onClick={() => {
                          const newWorkers = editFormData.workers.filter(
                            (_, i) => i !== index,
                          );
                          setEditFormData((prev) => ({
                            ...prev,
                            workers: newWorkers,
                          }));
                        }}
                        style={{ height: "42px", width: "42px" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setEditFormData((prev) => ({
                        ...prev,
                        workers: [
                          ...prev.workers,
                          { messLabourWorkerId: 0, workerFee: 0 },
                        ],
                      }))
                    }
                    style={{
                      alignSelf: "flex-start",
                      background: "#eff6ff",
                      color: "#2563eb",
                      border: "1.5px dashed #bfdbfe",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#dbeafe";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#eff6ff";
                    }}
                  >
                    + Add Worker
                  </button>
                </div>
              </div>

              {/* Summary */}
              {(() => {
                const uw = editingRecord.unitWeight || 1;
                const originalTotal = getOriginalTotalCount(editingRecord);
                const catSum =
                  (editFormData.red || 0) +
                  (editFormData.white || 0) +
                  (editFormData.special || 0) +
                  (editFormData.natural || 0) +
                  (editFormData.naturalWhite || 0) +
                  (editFormData.naturalRed || 0) +
                  (editFormData.shortCut || 0) +
                  (editFormData.artificial || 0) +
                  (editFormData.short || 0);
                const remainingCount = originalTotal - catSum;
                const remainingWeight = remainingCount * uw;
                // WashGrading records are always in viss
                const isKg = false;

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
                      <span className="em-sum-val">
                        {remainingWeight.toFixed(4)}
                      </span>
                      <span className="em-sum-sub">
                        viss
                        {isKg
                          ? ` (${(remainingWeight * 1.633).toFixed(4)} kg)`
                          : ""}
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
                  <h2 className="vm-header-title">
                    {viewingRecord.productMarker}
                  </h2>
                </div>
              </div>
              <button
                className="vm-close-btn"
                onClick={() => setViewingRecord(null)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Stats Grid */}
            <div className="vm-stats-grid">
              <div className="vm-stat-card">
                <span className="vm-stat-label">Date</span>
                <span className="vm-stat-value">
                  {formatDateTime(viewingRecord.date)}
                </span>
              </div>
              <div className="vm-stat-card vm-stat-span-2">
                <span className="vm-stat-label">Workers</span>
                <span className="vm-stat-value">
                  {viewingRecord.workers && viewingRecord.workers.length > 0
                    ? viewingRecord.workers
                        .map((w) => w.messLabourWorkerName)
                        .join(", ")
                    : (viewingRecord as any).messLabourWorkerName ||
                      viewingRecord.workerNames ||
                      "---"}
                </span>
              </div>
              <div className="vm-stat-card">
                <span className="vm-stat-label">Unit Weight</span>
                <span className="vm-stat-value">
                  {viewingRecord.unitWeight.toFixed(4)} viss
                </span>
              </div>
              <div className="vm-stat-card">
                <span className="vm-stat-label">Worker Fees</span>
                <span
                  className="vm-stat-value"
                  style={{ color: "var(--amber)", fontWeight: 700 }}
                >
                  {(viewingRecord.workers && viewingRecord.workers.length > 0
                    ? viewingRecord.workers.reduce(
                        (sum, w) => sum + w.workerFee,
                        0,
                      )
                    : viewingRecord.workerFees || 0
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  MMK
                </span>
              </div>
            </div>

            {/* Remaining Stock Highlight */}
            <div className="vm-highlights">
              <div className="vm-highlight-box highlight-blue">
                <div className="vm-hl-label">Remaining Count</div>
                <div className="vm-hl-value">
                  {viewingRecord.remainingCount}{" "}
                  <span className="vm-hl-unit">bundles</span>
                </div>
                <div className="vm-hl-desc">
                  of {viewingRecord.count} original packages
                </div>
              </div>
              <div className="vm-highlight-box highlight-green">
                <div className="vm-hl-label">Remaining Weight</div>
                <div className="vm-hl-value">
                  {viewingRecord.remainingWeight.toFixed(4)}{" "}
                  <span className="vm-hl-unit">viss</span>
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
                      {
                        count: viewingRecord.redCount,
                        weight: viewingRecord.redWeight,
                        label: "Red",
                        cls: "vm-cat-red",
                      },
                      {
                        count: viewingRecord.whiteCount,
                        weight: viewingRecord.whiteWeight,
                        label: "White",
                        cls: "vm-cat-white",
                      },
                      {
                        count: viewingRecord.specialCount,
                        weight: viewingRecord.specialWeight,
                        label: "Simple",
                        cls: "vm-cat-special",
                      },
                      {
                        count: viewingRecord.naturalCount,
                        weight: viewingRecord.naturalWeight,
                        label: "Natural",
                        cls: "vm-cat-natural",
                      },
                      {
                        count: viewingRecord.naturalWhiteCount,
                        weight: viewingRecord.naturalWhiteWeight,
                        label: "Nat. White",
                        cls: "vm-cat-nwhite",
                      },
                      {
                        count: viewingRecord.naturalRedCount,
                        weight: viewingRecord.naturalRedWeight,
                        label: "Nat. Red",
                        cls: "vm-cat-nred",
                      },
                      {
                        count: viewingRecord.shortCutCount,
                        weight: viewingRecord.shortCutWeight,
                        label: "Short Cut",
                        cls: "vm-cat-scut",
                      },
                      {
                        count: viewingRecord.artificialCount,
                        weight: viewingRecord.artificialWeight,
                        label: "Artificial",
                        cls: "vm-cat-art",
                      },
                      {
                        count: viewingRecord.shortCount,
                        weight: viewingRecord.shortWeight,
                        label: "Short",
                        cls: "vm-cat-short",
                      },
                    ] as const
                  )
                    .filter((cat) => cat.count > 0)
                    .map(({ count, weight, label, cls }) => (
                      <div key={label} className={`vm-cat-card ${cls}`}>
                        <span className="vm-cat-label">{label}</span>
                        <span className="vm-cat-count">{count} bundles</span>
                        <span className="vm-cat-weight">
                          {weight.toFixed(3)} viss
                        </span>
                      </div>
                    ))}
                  {/* Lost — weight only, no bundle count */}
                  {viewingRecord.lossWeight > 0 && (
                    <div className="vm-cat-card vm-cat-lost">
                      <span className="vm-cat-label">Lost</span>
                      <span className="vm-cat-count">—</span>
                      <span className="vm-cat-weight">
                        {Number(viewingRecord.lossWeight).toFixed(3)} viss
                      </span>
                    </div>
                  )}
                  {viewingRecord.redCount === 0 &&
                    viewingRecord.whiteCount === 0 &&
                    viewingRecord.specialCount === 0 &&
                    viewingRecord.naturalCount === 0 &&
                    viewingRecord.naturalWhiteCount === 0 &&
                    viewingRecord.naturalRedCount === 0 &&
                    viewingRecord.shortCutCount === 0 &&
                    viewingRecord.artificialCount === 0 &&
                    viewingRecord.shortCount === 0 &&
                    viewingRecord.lossWeight === 0 && (
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
                  {viewingRecord.totalWeight.toFixed(4)}{" "}
                  <span className="vm-total-unit">viss</span>
                </span>
              </div>
              <div className="vm-total-item" style={{ alignItems: "flex-end" }}>
                <span className="vm-total-label">Weight Difference</span>
                <span
                  className={`vm-total-diff ${viewingRecord.difference > 0.1 || viewingRecord.difference < -0.1 ? "diff-error" : "diff-success"}`}
                >
                  {viewingRecord.difference > 0 ? "+" : ""}
                  {viewingRecord.difference.toFixed(4)} viss
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="vm-footer">
              <button
                className="vm-btn-close"
                onClick={() => setViewingRecord(null)}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Worker Management Modal */}
      {showMessLabourWorkerManagement && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1200 }}
          onClick={handleCloseMessLabourWorkerManagement}
        >
          <div
            className="worker-manager-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#f8fafc",
              borderRadius: "16px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              width: "90%",
              maxWidth: "1100px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                padding: "16px 16px 0 16px",
              }}
            >
              <button
                className="pm-close-btn"
                style={{
                  background: "#e2e8f0",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onClick={handleCloseMessLabourWorkerManagement}
              >
                <X size={20} color="#475569" />
              </button>
            </div>
            <div
              style={{
                overflowY: "auto",
                paddingBottom: "16px",
              }}
            >
              <MessLabourWorkerManagement />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessLabour;
