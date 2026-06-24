import React, { useEffect, useState } from "react";
import { refinementAPI, refinementWorkersAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import type {
  AvailablePurifiedCategory,
  RefinementProcess,
  RefinementRecord,
  RefinementWorker,
} from "../../types";
import {
  Package,
  Send,
  History,
  Loader2,
  Search,
  User,
  Pencil,
  Trash2,
  X,
  Sparkles,
  Settings,
} from "lucide-react";
import RefinementWorkerManagement from "../RefinementWorkerManagement";
import {
  formatDateTime,
  getMyanmarNow,
  combineDateWithMyanmarTime,
} from "../../utils/format";
import "./index.css";

const Refinement: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showAlert, showConfirm } = useNotification();
  const [availableCategories, setAvailableCategories] = useState<
    AvailablePurifiedCategory[]
  >([]);
  const [processes, setProcesses] = useState<RefinementProcess[]>([]);
  const [refinementRecords, setRefinementRecords] = useState<
    RefinementRecord[]
  >([]);
  const [activeTab, setActiveTab] = useState<"history" | "stock">("history");
  const [refinementWorkers, setRefinementWorkers] = useState<
    RefinementWorker[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [selectedWorkers, setSelectedWorkers] = useState<
    Record<string, number>
  >({});
  const [inputCounts, setInputCounts] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showRefinementWorkerManagement, setShowRefinementWorkerManagement] =
    useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<AvailablePurifiedCategory | null>(null);
  const [editingProcess, setEditingProcess] =
    useState<RefinementProcess | null>(null);
  const [editingRecord, setEditingRecord] = useState<RefinementRecord | null>(
    null,
  );
  const [form, setForm] = useState({
    weight: "",
    spoilageWeight: "",
    returnWeight: "",
    refinementWorkerId: 0,
    date: getMyanmarNow(),
    workerFees: "",
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [avail, procs, recs, workers] = await Promise.all([
        refinementAPI.getAvailableCategories(),
        refinementAPI.getAll(),
        refinementAPI.getRefinementRecords(),
        refinementWorkersAPI.getAll(),
      ]);
      setAvailableCategories(avail);
      setProcesses(procs);
      setRefinementRecords(recs);
      setRefinementWorkers(workers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseRefinementWorkerManagement = () => {
    setShowRefinementWorkerManagement(false);
    loadData();
  };

  const handleInputChance = (
    recordId: number,
    category: string,
    value: string,
  ) => {
    const key = `${recordId}-${category}`;
    setInputCounts((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleInlineSubmit = async (avail: AvailablePurifiedCategory) => {
    const key = `${avail.purifiedRecordId}-${avail.category}`;
    const inputVal = inputCounts[key];
    const count = parseFloat(inputVal || "0");

    if (!count || count <= 0) {
      return showAlert("Validation", "Please enter a valid count", "error");
    }
    if (count > avail.remainingCount) {
      return showAlert(
        "Validation",
        `Cannot exceed remaining count (${avail.remainingCount})`,
        "error",
      );
    }

    const refinementWorkerId = selectedWorkers[key];
    if (!refinementWorkerId)
      return showAlert(
        "Validation",
        "Please select a refinement worker",
        "error",
      );
    setSubmitting(key);
    try {
      // Calculate weight based on unit weight if count is less than remaining
      const weight =
        count === avail.remainingCount
          ? avail.remainingWeight
          : count * avail.unitWeight;

      await refinementAPI.create({
        date: new Date().toISOString(),
        purifiedRecordId: avail.purifiedRecordId,
        category: avail.category,
        count,
        weight,
        lostWeight: 0,
        refinementWorkerId,
      });
      setInputCounts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      await loadData();
    } catch (e: any) {
      showAlert(
        "Error",
        e.response?.data?.message || "Failed to assign refinement",
        "error",
      );
    } finally {
      setSubmitting(null);
    }
  };

  const handleDelete = (id: number) =>
    showConfirm(
      "Confirm Delete",
      "Are you sure you want to delete this record?",
      async () => {
        try {
          await refinementAPI.delete(id);
          await loadData();
        } catch {
          showAlert("Error", "Failed to delete record", "error");
        }
      },
    );

  const handleDeleteRecord = (id: number) =>
    showConfirm(
      "Confirm Delete",
      "Are you sure you want to delete this refinement record?",
      async () => {
        try {
          await refinementAPI.deleteRefinementRecord(id);
          await loadData();
        } catch {
          showAlert("Error", "Failed to delete record", "error");
        }
      },
    );

  const handleEditProcess = (p: RefinementProcess) => {
    setEditingProcess(p);
    setEditingRecord(null);
    setSelectedCategory(null);
    const dateStr = p.date
      ? p.date.includes("T")
        ? p.date.slice(0, 16)
        : p.date + "T00:00"
      : getMyanmarNow();
    setForm({
      weight: "",
      spoilageWeight: "",
      returnWeight: "",
      date: dateStr,
      refinementWorkerId: p.refinementWorkerId || 0,
      workerFees: p.workerFees !== undefined ? p.workerFees.toString() : "",
    });
    setValidationError(null);
    setShowModal(true);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const weight = parseFloat(form.weight) || 0;
    const spoilageWeight = parseFloat(form.spoilageWeight) || 0;
    const returnWeight = parseFloat(form.returnWeight) || 0;
    const available =
      editingRecord?.weight ??
      editingProcess?.weight ??
      selectedCategory?.remainingWeight ??
      0;
    const lostWeight = Math.max(
      0,
      available - weight - spoilageWeight - returnWeight,
    );
    if (!weight || weight <= 0) {
      setValidationError("Please enter a valid weight");
      return;
    }
    if (!form.refinementWorkerId) {
      setValidationError("Please select a refinement worker");
      return;
    }

    if (weight + spoilageWeight + returnWeight > available) {
      setValidationError(
        `Total weights (Output + Spoilage + Return = ${(weight + spoilageWeight + returnWeight).toFixed(3)}) cannot exceed Available weight (${available.toFixed(3)} viss)`,
      );
      return;
    }

    if (selectedCategory && weight > selectedCategory.remainingWeight) {
      setValidationError(
        `Cannot exceed remaining weight (${selectedCategory.remainingWeight.toFixed(3)} viss)`,
      );
      return;
    }
    try {
      const dto = {
        date: combineDateWithMyanmarTime(form.date),
        purifiedRecordId:
          editingProcess?.purifiedRecordId ||
          editingRecord?.purifiedRecordId ||
          selectedCategory!.purifiedRecordId,
        category:
          editingProcess?.category ||
          editingRecord?.category ||
          selectedCategory!.category,
        count: 0,
        weight,
        lostWeight,
        spoilageWeight,
        returnWeight,
        refinementWorkerId: form.refinementWorkerId,
        workerFees: Number(form.workerFees) || 0,
      };
      if (editingProcess) await refinementAPI.update(editingProcess.id, dto);
      else if (editingRecord)
        await refinementAPI.updateRefinementRecord(editingRecord.id, dto);
      else await refinementAPI.create(dto);
      setShowModal(false);
      setValidationError(null);
      await loadData();
    } catch (e: any) {
      showAlert(
        "Error",
        e.response?.data?.message || "Failed to save record",
        "error",
      );
    }
  };

  const filtered = availableCategories.filter(
    (a) =>
      a.remainingWeight >= 0.001 &&
      (a.productMarker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.warehouseName || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())),
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
    <div className="ref-container fade-in">
      {/* Hero Header */}
      <div className="ref-hero">
        <div className="ref-hero-left">
          <div className="ref-hero-icon">
            <Sparkles size={30} strokeWidth={1.8} />
          </div>
          <div className="ref-hero-text">
            <h1>Girdle-bush List</h1>
            <p>Track refinement processes, worker fees, and bag outputs</p>
          </div>
        </div>
        <div className="ref-hero-right">
          <div className="ref-stat-pill">
            <span className="stat-num">{refinementRecords.length}</span>
            <span className="stat-label">{refinementRecords.length === 1 ? 'Record' : 'Records'}</span>
          </div>
        </div>
      </div>

      <div className="ref-layout">
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
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="rf-card-list">
          {filtered.length === 0 ? (
            <div className="rf-empty-sidebar">
              {searchTerm
                ? "No matching bags found"
                : "No bags available for refinement"}
            </div>
          ) : (
            filtered.map((avail) => {
              const key = `${avail.purifiedRecordId}-${avail.category}`;
              return (
                <div key={key} className="rf-bag-card">
                  {/* Card Top */}
                  <div className="rf-card-top">
                    <div className="rf-card-info">
                      <span className="rf-card-marker">
                        {avail.productMarker}
                      </span>
                      <span className="rf-card-warehouse">
                        {avail.warehouseName || "---"}
                      </span>
                    </div>
                    <span
                      className={`rf-badge category-${avail.category.toLowerCase().replace(".", "")}`}
                    >
                      {avail.category}
                    </span>
                  </div>

                  {/* Stats Row */}
                  <div className="rf-stats-row">
                    <div className="rf-stat">
                      <span className="rf-stat-label">Remaining</span>
                      <span className="rf-stat-value">
                        {avail.remainingCount % 1 === 0
                          ? avail.remainingCount
                          : avail.remainingCount.toFixed(4)}{" "}
                        <span className="rf-stat-unit">bundles</span>
                      </span>
                    </div>
                    <div className="rf-stat rf-stat-right">
                      <span className="rf-stat-label">Weight</span>
                      <span className="rf-stat-value rf-stat-blue">
                        {avail.remainingWeight.toFixed(4)}{" "}
                        <span className="rf-stat-unit">viss</span>
                      </span>
                    </div>
                    <div className="rf-stat rf-stat-right">
                      <span className="rf-stat-label">Unit Wt</span>
                      <span className="rf-stat-value rf-stat-purple">
                        {avail.unitWeight.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {/* Worker Select */}
                  <div className="rf-worker-select-wrap">
                    <label className="rf-field-label">Refinement Worker</label>
                    <select
                      className="rf-select"
                      value={selectedWorkers[key] || ""}
                      onChange={(e) =>
                        setSelectedWorkers((prev) => ({
                          ...prev,
                          [key]: parseInt(e.target.value),
                        }))
                      }
                    >
                      <option value="">-- Select Worker --</option>
                      {refinementWorkers
                        .filter(
                          (p) =>
                            p.warehouseId === avail.warehouseId && p.isActive,
                        )
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Bundle Count Input */}
                  <div
                    className="rf-input-group"
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginBottom: "12px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="number"
                      placeholder="Bundle count"
                      className="rf-select"
                      style={{ flex: 1, minWidth: 0, cursor: "text" }}
                      value={inputCounts[key] || ""}
                      onChange={(e) =>
                        handleInputChance(
                          avail.purifiedRecordId,
                          avail.category,
                          e.target.value,
                        )
                      }
                      min="0"
                      step="any"
                      max={avail.remainingCount}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleInputChance(
                          avail.purifiedRecordId,
                          avail.category,
                          avail.remainingCount.toString(),
                        )
                      }
                      className="rf-max-btn"
                      style={{
                        padding: "6px 8px",
                        fontSize: "12px",
                        backgroundColor: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        borderRadius: "4px",
                        cursor: "pointer",
                        color: "#475569",
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      Max
                    </button>
                  </div>

                  {/* Assign Button */}
                  <button
                    className="rf-assign-btn"
                    onClick={() => handleInlineSubmit(avail)}
                    disabled={submitting === key}
                  >
                    {submitting === key ? (
                      <>
                        <Loader2 className="rf-spin" size={16} /> Processing...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Assign to Refine
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
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
                  className={`rf-tab ${activeTab === "history" ? "rf-tab-active" : ""}`}
                  onClick={() => setActiveTab("history")}
                >
                  <span className="rf-tab-title">Refinement History</span>
                  <span className="rf-tab-sub">
                    Process log of purified bundles
                  </span>
                </button>
                <button
                  className={`rf-tab ${activeTab === "stock" ? "rf-tab-active rf-tab-green" : ""}`}
                  onClick={() => setActiveTab("stock")}
                >
                  <span className="rf-tab-title">Refined Stock</span>
                  <span className="rf-tab-sub">
                    Completed refinement records
                  </span>
                </button>
              </div>
            </div>

            <div className="rf-header-right">
              <button
                className="btn-manage-refinement-workers"
                onClick={() => setShowRefinementWorkerManagement(true)}
              >
                <Settings size={16} />
                Manage Refinement Workers
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="rf-table-wrap">
            <table className="rf-table">
              <thead>
                {activeTab === "history" ? (
                  <tr>
                    <th>Date</th>
                    <th>Bag Marker</th>
                    <th>Category</th>
                    <th>Bundle Count</th>
                    <th>Weight (viss)</th>
                    <th>Refinement Worker</th>
                    <th>Worker Fees</th>
                    <th className="rf-th-right">Actions</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Date</th>
                    <th>Bag Marker</th>
                    <th>Category</th>
                    <th>Bundle Count</th>
                    <th>Output Weight</th>
                    <th>Lost Weight</th>
                    <th>Spoilage Weight</th>
                    <th>Return Weight</th>
                    <th>Refinement Worker</th>
                    <th>Worker Fees</th>
                    <th className="rf-th-right">Actions</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {activeTab === "history" ? (
                  processes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="rf-empty-row">
                        <History size={44} className="rf-empty-icon" />
                        <span>No refinement processes registered yet</span>
                      </td>
                    </tr>
                  ) : (
                    processes.map((p) => (
                      <tr
                        key={p.id}
                        className="rf-clickable-row"
                        onClick={() => handleEditProcess(p)}
                      >
                        <td className="rf-td-date">{formatDateTime(p.date)}</td>
                        <td>
                          <div className="rf-marker">{p.productMarker}</div>
                          <div className="rf-warehouse">
                            {p.warehouseName || "---"}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`rf-badge category-${p.category.toLowerCase().replace(".", "")}`}
                          >
                            {p.category}
                          </span>
                        </td>
                        <td>{p.count}</td>
                        <td className="rf-td-weight">{p.weight.toFixed(3)}</td>
                        <td>
                          <div className="rf-worker-cell">
                            <User size={13} />
                            {p.refinementWorkerName || "---"}
                          </div>
                        </td>
                        <td>
                          {p.workerFees?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="rf-actions">
                            {hasPermission("Refinement.Edit") && (
                              <button
                                className="rf-action-btn rf-edit-btn"
                                onClick={() => handleEditProcess(p)}
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            {hasPermission("Refinement.Delete") && (
                              <button
                                className="rf-action-btn rf-delete-btn"
                                onClick={() => handleDelete(p.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )
                ) : refinementRecords.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="rf-empty-row">
                      <Package size={44} className="rf-empty-icon" />
                      <span>No refined stock records yet</span>
                    </td>
                  </tr>
                ) : (
                  refinementRecords.map((p) => (
                    <tr key={p.id}>
                      <td className="rf-td-date">{formatDateTime(p.date)}</td>
                      <td>
                        <div className="rf-marker">{p.productMarker}</div>
                        <div className="rf-warehouse">
                          {p.warehouseName || "---"}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`rf-badge category-${p.category.toLowerCase().replace(".", "")}`}
                        >
                          {p.category}
                        </span>
                      </td>
                      <td>{p.count}</td>
                      <td className="rf-td-weight rf-green">
                        {p.weight.toFixed(3)}
                      </td>
                      <td className="rf-td-lost">{p.lostWeight.toFixed(3)}</td>
                      <td className="rf-td-lost" style={{ color: "#ea580c" }}>
                        {p.spoilageWeight.toFixed(3)}
                      </td>
                      <td className="rf-td-weight" style={{ color: "#3b82f6" }}>
                        {p.returnWeight.toFixed(3)}
                      </td>
                      <td>
                        <div className="rf-worker-cell">
                          <User size={13} />
                          {p.refinementWorkerName || "---"}
                        </div>
                      </td>
                      <td>
                        {p.workerFees?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) || "0.00"}
                      </td>
                      <td>
                        <div className="rf-actions">
                          {hasPermission("Refinement.Delete") && (
                            <button
                              className="rf-action-btn rf-delete-btn"
                              onClick={() => handleDeleteRecord(p.id)}
                              disabled={p.isLocked}
                              style={{
                                cursor: p.isLocked ? "not-allowed" : "pointer",
                              }}
                            >
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
    </div>

      {/* Refinement Worker Management Modal */}
      {showRefinementWorkerManagement && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1200 }}
          onClick={handleCloseRefinementWorkerManagement}
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
                onClick={handleCloseRefinementWorkerManagement}
              >
                <X size={20} color="#475569" />
              </button>
            </div>
            <div
              style={{
                overflowY: "auto",
                flex: 1,
                marginTop: "-20px",
                paddingBottom: "16px",
              }}
            >
              <RefinementWorkerManagement />
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT / CREATE MODAL ── */}
      {showModal && (editingProcess || editingRecord || selectedCategory) && (
        <div
          className="rf-overlay"
          style={{ zIndex: 1100 }}
          onClick={() => {
            setShowModal(false);
            setValidationError(null);
          }}
        >
          <div className="rf-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="rf-modal-header">
              <div className="rf-modal-header-left">
                <div className="rf-modal-icon">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="rf-modal-pre">Refinement Process</p>
                  <h2 className="rf-modal-title">
                    {editingProcess || editingRecord
                      ? "Edit Record"
                      : "Record Refinement"}
                  </h2>
                </div>
              </div>
              <button
                className="rf-modal-close"
                onClick={() => {
                  setShowModal(false);
                  setValidationError(null);
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Info Bar */}
            <div className="rf-modal-info-bar">
              <div className="rf-modal-chip">
                <span className="rf-chip-label">Bag Marker</span>
                <span className="rf-chip-value">
                  {editingProcess?.productMarker ||
                    editingRecord?.productMarker ||
                    selectedCategory?.productMarker}
                </span>
              </div>
              <div className="rf-modal-chip">
                <span className="rf-chip-label">Category</span>
                <span
                  className={`rf-badge category-${(editingProcess?.category || editingRecord?.category || selectedCategory?.category || "").toLowerCase().replace(".", "")}`}
                  style={{ margin: 0 }}
                >
                  {editingProcess?.category ||
                    editingRecord?.category ||
                    selectedCategory?.category}
                </span>
              </div>
              <div className="rf-modal-chip">
                <span className="rf-chip-label">Available</span>
                <span className="rf-chip-value rf-chip-orange">
                  {editingRecord
                    ? editingRecord.weight.toFixed(3)
                    : editingProcess
                      ? editingProcess.weight.toFixed(3)
                      : selectedCategory?.remainingWeight.toFixed(3)}{" "}
                  viss
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
                  value={form.refinementWorkerId}
                  onChange={(e) => {
                    setValidationError(null);
                    setForm((prev) => ({
                      ...prev,
                      refinementWorkerId: parseInt(e.target.value),
                    }));
                  }}
                  required
                >
                  <option value={0}>-- Select Worker --</option>
                  {refinementWorkers
                    .filter((p) => p.isActive)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
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
                      onChange={(e) => {
                        setValidationError(null);
                        setForm((prev) => ({
                          ...prev,
                          weight: e.target.value,
                        }));
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
                      onChange={(e) => {
                        setValidationError(null);
                        setForm((prev) => ({
                          ...prev,
                          spoilageWeight: e.target.value,
                        }));
                      }}
                    />
                    <span className="rf-input-unit">viss</span>
                  </div>
                </div>
              </div>

              {/* Weight Fields - Row 2: Return Weight (editable) + Lost Weight (auto) */}
              {(() => {
                const available =
                  editingRecord?.weight ??
                  editingProcess?.weight ??
                  selectedCategory?.remainingWeight ??
                  0;
                const computedLost = Math.max(
                  0,
                  available -
                    (parseFloat(form.weight) || 0) -
                    (parseFloat(form.spoilageWeight) || 0) -
                    (parseFloat(form.returnWeight) || 0),
                );
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
                          onChange={(e) => {
                            setValidationError(null);
                            setForm((prev) => ({
                              ...prev,
                              returnWeight: e.target.value,
                            }));
                          }}
                        />
                        <span className="rf-input-unit">viss</span>
                      </div>
                    </div>
                    <div className="rf-form-group">
                      <label
                        className="rf-form-label"
                        style={{ color: "#ef4444" }}
                      >
                        Lost Weight{" "}
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: 400,
                            color: "#94a3b8",
                            textTransform: "none",
                          }}
                        >
                          (auto)
                        </span>
                      </label>
                      <div className="rf-input-unit-wrap">
                        <input
                          type="number"
                          readOnly
                          className="rf-form-control"
                          style={{
                            background: "#fef2f2",
                            color: "#ef4444",
                            fontWeight: 700,
                            cursor: "not-allowed",
                            borderColor: "#fecaca",
                          }}
                          value={computedLost.toFixed(3)}
                        />
                        <span className="rf-input-unit rf-unit-red">viss</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Worker Fees */}
              <div className="rf-form-group">
                <label className="rf-form-label">Worker Fees (MMK)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="rf-form-control"
                  value={form.workerFees}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      workerFees: e.target.value,
                    }))
                  }
                  placeholder="Enter worker fees amount..."
                />
              </div>

              {/* Date */}
              <div className="rf-form-group">
                <label className="rf-form-label">Date</label>
                <input
                  type="date"
                  className="rf-form-control"
                  value={form.date.split("T")[0]}
                  onChange={(e) => {
                    setValidationError(null);
                    setForm((prev) => ({ ...prev, date: e.target.value }));
                  }}
                  required
                />
              </div>

              {/* Footer */}
              <div className="rf-modal-footer">
                <button
                  type="button"
                  className="rf-btn-cancel"
                  onClick={() => {
                    setShowModal(false);
                    setValidationError(null);
                  }}
                >
                  <X size={15} /> Cancel
                </button>
                <button type="submit" className="rf-btn-save">
                  <Send size={15} />
                  {editingRecord || editingProcess
                    ? "Save Changes"
                    : "Submit Record"}
                </button>
              </div>
              {validationError && (
                <div className="rf-modal-error-msg">{validationError}</div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Refinement;
