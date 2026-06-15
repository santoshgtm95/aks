import React, { useEffect, useState } from "react";
import { washGradingAPI, washGradingWorkersAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import type {
  AvailableProductDto,
  WashGradingProcess,
  WashGradingRecord,
  WashGradingWorker,
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
import WashGradingWorkerManagement from "../WashGradingWorkerManagement";
import {
  formatDateTime,
  getMyanmarNow,
  combineDateWithMyanmarTime,
} from "../../utils/format";
import "./index.css";

const WashGrading: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showAlert, showConfirm } = useNotification();
  const [availableProducts, setAvailableProducts] = useState<AvailableProductDto[]>([]);
  const [processes, setProcesses] = useState<WashGradingProcess[]>([]);
  const [records, setRecords] = useState<WashGradingRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"history" | "stock">("history");
  const [workers, setWorkers] = useState<WashGradingWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [selectedWorkers, setSelectedWorkers] = useState<Record<number, number>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showWorkerManagement, setShowWorkerManagement] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<AvailableProductDto | null>(null);
  const [editingProcess, setEditingProcess] = useState<WashGradingProcess | null>(null);
  const [editingRecord, setEditingRecord] = useState<WashGradingRecord | null>(null);
  
  const [form, setForm] = useState({
    weight: "",
    lostWeight: "",
    washGradingWorkerId: 0,
    date: getMyanmarNow(),
    workerFees: "",
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const originalWeight = editingProcess
    ? editingProcess.weight
    : editingRecord
    ? editingRecord.weight + editingRecord.lostWeight
    : 0;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [avail, procs, recs, workersData] = await Promise.all([
        washGradingAPI.getAvailableProducts(),
        washGradingAPI.getAll(),
        washGradingAPI.getRecords(),
        washGradingWorkersAPI.getAll(),
      ]);
      setAvailableProducts(avail);
      setProcesses(procs);
      setRecords(recs);
      setWorkers(workersData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseWorkerManagement = () => {
    setShowWorkerManagement(false);
    loadData();
  };

  const getVissWeight = (avail: AvailableProductDto): number => {
    const isKg = avail.unit?.toLowerCase().includes("kg") || avail.unit?.toLowerCase().includes("kilogram");
    return isKg ? avail.remainingWeight / 1.633 : avail.remainingWeight;
  };

  const handleInlineSubmit = async (avail: AvailableProductDto) => {
    const productId = avail.productId;
    const weight = getVissWeight(avail);
    const washGradingWorkerId = selectedWorkers[productId];
    if (!washGradingWorkerId) {
      return showAlert("Validation", "Please select a wash/grading worker", "error");
    }
    setSubmitting(productId);
    try {
      await washGradingAPI.create({
        date: new Date().toISOString(),
        productId,
        weight,
        lostWeight: 0,
        washGradingWorkerId,
        workerFees: 0,
      });
      await loadData();
    } catch (e: any) {
      showAlert(
        "Error",
        e.response?.data?.message || "Failed to assign wash/grading",
        "error",
      );
    } finally {
      setSubmitting(null);
    }
  };

  const handleSkip = async (avail: AvailableProductDto) => {
    const productId = avail.productId;
    const weight = getVissWeight(avail);
    setSubmitting(productId);
    try {
      await washGradingAPI.createRecord({
        date: new Date().toISOString(),
        productId,
        weight,
        lostWeight: 0,
        washGradingWorkerId: undefined,
        workerFees: 0,
      });
      await loadData();
    } catch (e: any) {
      showAlert(
        "Error",
        e.response?.data?.message || "Failed to skip wash/grading process",
        "error",
      );
    } finally {
      setSubmitting(null);
    }
  };

  const handleDelete = (id: number) =>
    showConfirm(
      "Confirm Delete",
      "Are you sure you want to delete this process?",
      async () => {
        try {
          await washGradingAPI.delete(id);
          await loadData();
        } catch {
          showAlert("Error", "Failed to delete process", "error");
        }
      },
    );

  const handleDeleteRecord = (id: number) =>
    showConfirm(
      "Confirm Delete",
      "Are you sure you want to delete this completed record?",
      async () => {
        try {
          await washGradingAPI.deleteRecord(id);
          await loadData();
        } catch {
          showAlert("Error", "Failed to delete record", "error");
        }
      },
    );

  const handleEditProcess = (p: WashGradingProcess) => {
    setEditingProcess(p);
    setEditingRecord(null);
    setSelectedProduct(null);
    const dateStr = p.date
      ? p.date.includes("T")
        ? p.date.slice(0, 16)
        : p.date + "T00:00"
      : getMyanmarNow();
    setForm({
      weight: "",
      lostWeight: "",
      date: dateStr,
      washGradingWorkerId: p.washGradingWorkerId || 0,
      workerFees: p.workerFees ? p.workerFees.toString() : "",
    });
    setValidationError(null);
    setShowModal(true);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const weight = parseFloat(form.weight) || 0;
    const lostWeight = parseFloat(form.lostWeight) || 0;
    const available =
      editingRecord?.weight ??
      editingProcess?.weight ??
      (selectedProduct ? getVissWeight(selectedProduct) : 0);

    if (!weight || weight <= 0) {
      setValidationError("Please enter a valid weight");
      return;
    }
    if (!form.washGradingWorkerId) {
      setValidationError("Please select a worker");
      return;
    }

    if (weight + lostWeight > available + 0.01) {
      setValidationError(
        `Total weights (Output + Lost = ${(weight + lostWeight).toFixed(3)}) cannot exceed Available weight (${available.toFixed(3)} viss)`,
      );
      return;
    }

    try {
      const dto = {
        date: combineDateWithMyanmarTime(form.date),
        productId:
          editingProcess?.productId ||
          editingRecord?.productId ||
          selectedProduct!.productId,
        weight,
        lostWeight,
        washGradingWorkerId: form.washGradingWorkerId,
        workerFees: Number(form.workerFees) || 0,
      };

      if (editingProcess) {
        await washGradingAPI.update(editingProcess.id, dto);
      } else if (editingRecord) {
        await washGradingAPI.updateRecord(editingRecord.id, dto);
      } else {
        await washGradingAPI.create(dto);
      }
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

  const filtered = availableProducts.filter((a) => {
    const vissWeight = getVissWeight(a);
    return (
      vissWeight >= 0.001 &&
      (a.productMarker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.warehouseName || "").toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  if (loading) {
    return (
      <div className="wg-loading">
        <Loader2 className="wg-spin" size={28} />
        <span>Loading wash/grading data...</span>
      </div>
    );
  }

  return (
    <div className="wg-container fade-in">
      {/* ── LEFT SIDEBAR ── */}
      <aside className="wg-sidebar">
        <div className="wg-sidebar-header">
          <Sparkles size={18} />
          <span>Select Inventory to Wash</span>
        </div>

        <div className="wg-search-box">
          <Search size={16} className="wg-search-icon" />
          <input
            type="text"
            placeholder="Search bag marker or warehouse..."
            className="wg-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="wg-card-list">
          {filtered.length === 0 ? (
            <div className="wg-empty-sidebar">
              {searchTerm ? "No matching products found" : "No products available"}
            </div>
          ) : (
            filtered.map((avail) => {
              const vissWeight = getVissWeight(avail);
              return (
                <div key={avail.productId} className="wg-product-card">
                  {/* Card Top */}
                  <div className="wg-card-top">
                    <div className="wg-card-info">
                      <span className="wg-card-marker">{avail.productMarker}</span>
                      <span className="wg-card-warehouse">{avail.warehouseName || "---"}</span>
                    </div>
                    <span className="wg-badge">{avail.unit}</span>
                  </div>

                  {/* Stats Row */}
                  <div className="wg-stats-row">
                    <div className="wg-stat">
                      <span className="wg-stat-label">Remaining</span>
                      <span className="wg-stat-value">
                        {avail.remainingWeight.toFixed(2)}{" "}
                        <span className="wg-stat-unit">{avail.unit}</span>
                      </span>
                    </div>
                    <div className="wg-stat">
                      <span className="wg-stat-label">Weight</span>
                      <span className="wg-stat-value wg-stat-blue">
                        {vissWeight.toFixed(4)}{" "}
                        <span className="wg-stat-unit">viss</span>
                      </span>
                    </div>
                  </div>

                  {/* Worker Select */}
                  <div className="wg-worker-select-wrap">
                    <label className="wg-field-label">Wash/Grading Worker</label>
                    <select
                      className="wg-select"
                      value={selectedWorkers[avail.productId] || ""}
                      onChange={(e) =>
                        setSelectedWorkers((prev) => ({
                          ...prev,
                          [avail.productId]: parseInt(e.target.value),
                        }))
                      }
                    >
                      <option value="">-- Select Worker --</option>
                      {workers
                        .filter((w) => w.warehouseId === avail.warehouseId && w.isActive)
                        .map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Assign Button */}
                  <button
                    className="wg-assign-btn"
                    onClick={() => handleInlineSubmit(avail)}
                    disabled={submitting === avail.productId}
                  >
                    {submitting === avail.productId ? (
                      <>
                        <Loader2 className="wg-spin" size={16} /> Processing...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Assign to Wash
                      </>
                    )}
                  </button>

                  {/* Skip Button */}
                  <button
                    className="wg-skip-btn"
                    onClick={() => handleSkip(avail)}
                    disabled={submitting === avail.productId}
                  >
                    {submitting === avail.productId ? (
                      <>
                        <Loader2 className="wg-spin" size={16} /> Processing...
                      </>
                    ) : (
                      <>
                        Skip
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
      <main className="wg-main">
        <div className="wg-main-card">
          {/* Header */}
          <div className="wg-main-header">
            <div className="wg-header-left">
              <div className="wg-header-icon">
                <History size={28} />
              </div>

              <div className="wg-tab-group">
                <button
                  className={`wg-tab ${activeTab === "history" ? "wg-tab-active" : ""}`}
                  onClick={() => setActiveTab("history")}
                >
                  <span className="wg-tab-title">Wash/Grading History</span>
                  <span className="wg-tab-sub">Ongoing processes</span>
                </button>
                <button
                  className={`wg-tab ${activeTab === "stock" ? "wg-tab-active wg-tab-green" : ""}`}
                  onClick={() => setActiveTab("stock")}
                >
                  <span className="wg-tab-title">Washed Stock</span>
                  <span className="wg-tab-sub">Completed records</span>
                </button>
              </div>
            </div>

            <div className="wg-header-right">
              <button
                className="btn-manage-wg-workers"
                onClick={() => setShowWorkerManagement(true)}
              >
                <Settings size={16} />
                Manage Workers
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="wg-table-wrap">
            <table className="wg-table">
              <thead>
                {activeTab === "history" ? (
                  <tr>
                    <th>Date</th>
                    <th>Product Marker</th>
                    <th>Weight (viss)</th>
                    <th>Worker</th>
                    <th>Worker Fees</th>
                    <th className="wg-th-right">Actions</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Date</th>
                    <th>Product Marker</th>
                    <th>Output Weight</th>
                    <th>Lost Weight</th>
                    <th>Worker</th>
                    <th>Worker Fees</th>
                    <th className="wg-th-right">Actions</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {activeTab === "history" ? (
                  processes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="wg-empty-row">
                        <History size={44} className="wg-empty-icon" />
                        <span>No wash/grading processes registered yet</span>
                      </td>
                    </tr>
                  ) : (
                    processes.map((p) => (
                      <tr
                        key={p.id}
                        className="wg-clickable-row"
                        onClick={() => handleEditProcess(p)}
                      >
                        <td className="wg-td-date">{formatDateTime(p.date)}</td>
                        <td>
                          <div className="wg-marker">{p.productMarker}</div>
                          <div className="wg-warehouse">{p.warehouseName || "---"}</div>
                        </td>
                        <td className="wg-td-weight">{p.weight.toFixed(3)}</td>
                        <td>
                          <div className="wg-worker-cell">
                            <User size={13} />
                            {p.washGradingWorkerName || "---"}
                          </div>
                        </td>
                        <td>
                          {p.workerFees?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="wg-actions">
                            {hasPermission("WashGrading.Edit") && (
                              <button
                                className="wg-action-btn wg-edit-btn"
                                onClick={() => handleEditProcess(p)}
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            {hasPermission("WashGrading.Delete") && (
                              <button
                                className="wg-action-btn wg-delete-btn"
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
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="wg-empty-row">
                      <Package size={44} className="wg-empty-icon" />
                      <span>No completed records yet</span>
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id}>
                      <td className="wg-td-date">{formatDateTime(r.date)}</td>
                      <td>
                        <div className="wg-marker">{r.productMarker}</div>
                        <div className="wg-warehouse">{r.warehouseName || "---"}</div>
                      </td>
                      <td className="wg-td-weight wg-green">{r.weight.toFixed(3)}</td>
                      <td className="wg-td-lost">{r.lostWeight.toFixed(3)}</td>
                      <td>
                        <div className="wg-worker-cell">
                          <User size={13} />
                          {r.washGradingWorkerName || "---"}
                        </div>
                      </td>
                      <td>
                        {r.workerFees?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) || "0.00"}
                      </td>
                      <td>
                        <div className="wg-actions">
                          {hasPermission("WashGrading.Delete") && (
                            <button
                              className="wg-action-btn wg-delete-btn"
                              onClick={() => handleDeleteRecord(r.id)}
                              disabled={!!r.isUsedInMessLabour}
                              title={r.isUsedInMessLabour ? "Cannot delete — this record has been used in Mess Labour processing" : "Delete record"}
                              style={r.isUsedInMessLabour ? { opacity: 0.35, cursor: "not-allowed" } : undefined}
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

      {/* ── WORKER MANAGEMENT MODAL ── */}
      {showWorkerManagement && (
        <div className="wg-modal-backdrop">
          <div className="wg-modal-content wash-grading-workers-modal">
            <button
              className="wg-modal-close"
              onClick={handleCloseWorkerManagement}
            >
              <X size={20} />
            </button>
            <div className="wash-grading-workers-modal-inner">
              <WashGradingWorkerManagement />
            </div>
          </div>
        </div>
      )}

      {/* ── FORM POPUP MODAL (COMPLETE / EDIT) ── */}
      {showModal && (
        <div className="wg-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="wg-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="wg-modal-close" onClick={() => setShowModal(false)}>
              <X size={20} />
            </button>
            <div className="wg-modal-header">
              <h3>
                {editingRecord
                  ? "Edit Wash/Grading Record"
                  : editingProcess
                  ? "Complete Wash/Grading Process"
                  : "Assign Wash/Grading"}
              </h3>
              <p>
                Product Marker:{" "}
                <strong>
                  {editingProcess?.productMarker ||
                    editingRecord?.productMarker ||
                    selectedProduct?.productMarker}
                </strong>
              </p>
            </div>

            <form onSubmit={handleSubmitModal} className="wg-form">
              <div className="wg-form-body">
                {/* Date */}
                <div className="wg-form-group">
                  <label>Date & Time</label>
                  <input
                    type="datetime-local"
                    className="wg-input"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>

                {/* Original Weight */}
                <div className="wg-form-group" style={{ marginBottom: "4px" }}>
                  <span className="wg-field-label" style={{ color: "#475569" }}>
                    Original Weight: <strong style={{ color: "#0f172a" }}>{originalWeight.toFixed(3)} viss</strong>
                  </span>
                </div>

                {/* Output Weight */}
                <div className="wg-form-group">
                  <label>Output Weight (viss)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="0"
                    className="wg-input"
                    value={form.weight}
                    onChange={(e) => {
                      const val = e.target.value;
                      const outputVal = parseFloat(val);
                      let lostWeightVal = "";
                      if (!isNaN(outputVal)) {
                        lostWeightVal = Math.max(0, originalWeight - outputVal).toFixed(3);
                      }
                      setForm({ ...form, weight: val, lostWeight: lostWeightVal });
                    }}
                  />
                </div>

                {/* Lost Weight */}
                <div className="wg-form-group">
                  <label>Lost Weight (viss)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="0"
                    className="wg-input"
                    value={form.lostWeight}
                    onChange={(e) => setForm({ ...form, lostWeight: e.target.value })}
                  />
                </div>

                {/* Worker Select */}
                <div className="wg-form-group">
                  <label>Worker</label>
                  <select
                    className="wg-select"
                    value={form.washGradingWorkerId || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        washGradingWorkerId: parseInt(e.target.value),
                      })
                    }
                  >
                    <option value="">-- Select Worker --</option>
                    {workers
                      .filter(
                        (w) =>
                          w.warehouseId ===
                            (editingProcess?.warehouseId ||
                             editingRecord?.warehouseId ||
                             selectedProduct?.warehouseId) && w.isActive,
                      )
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Worker Fee */}
                <div className="wg-form-group">
                  <label>Worker Fees (MMK)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    className="wg-input"
                    value={form.workerFees}
                    onChange={(e) => setForm({ ...form, workerFees: e.target.value })}
                  />
                </div>
              </div>

              {validationError && (
                <div className="wg-validation-error">
                  <X size={16} />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="wg-form-actions">
                <button
                  type="button"
                  className="btn-wg-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-wg-save">
                  {editingRecord ? "Save Changes" : "Complete Process"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WashGrading;
