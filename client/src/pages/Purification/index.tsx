import React, { useEffect, useState, useCallback } from "react";
import { purificationAPI, placesAPI, purifiersAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import { useLongPoll } from "../../hooks/useLongPoll";
import type {
  AvailableCategory,
  PurificationProcess,
  PurifiedRecord,
  Place,
  Purifier,
} from "../../types";
import {
  Package,
  Send,
  History,
  Loader2,
  Search,
  User,
  Settings,
  X,
  Pencil,
  Trash2,
  Sparkles,
} from "lucide-react";
import PurifierManagement from "../PurifierManagement";
import {
  formatDateTime,
  getMyanmarNow,
  combineDateWithMyanmarTime,
} from "../../utils/format";
import "./index.css";

const Purification: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showAlert, showConfirm } = useNotification();
  const [availableCategories, setAvailableCategories] = useState<
    AvailableCategory[]
  >([]);
  const [processes, setProcesses] = useState<PurificationProcess[]>([]);
  const [purifiedRecords, setPurifiedRecords] = useState<PurifiedRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"history" | "stock">("history");
  const [places, setPlaces] = useState<Place[]>([]);
  const [purifiers, setPurifiers] = useState<Purifier[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [inputCounts, setInputCounts] = useState<Record<string, string>>({});
  const [selectedPlaces, setSelectedPlaces] = useState<Record<string, number>>(
    {},
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showPlaceManagement, setshowPlaceManagement] = useState(false);
  const [showPurifyModal, setShowPurifyModal] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<AvailableCategory | null>(null);
  const [editingProcess, setEditingProcess] =
    useState<PurificationProcess | null>(null);
  const [editingRecord, setEditingRecord] = useState<PurifiedRecord | null>(
    null,
  );
  const [purifyForm, setPurifyForm] = useState<{
    count: string;
    placeId: number;
    purifierId: number;
    isWeightFull: boolean;
    date: string;
    workerFees: string;
    supervisorFees: string;
    workers: { purifierId: number; count: number; workerFees: number }[];
  }>({
    count: "",
    placeId: 0,
    purifierId: 0,
    isWeightFull: true,
    date: getMyanmarNow(),
    workerFees: "",
    supervisorFees: "",
    workers: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [availData, processData, purifiedData, placeData, purifierData] =
        await Promise.all([
          purificationAPI.getAvailableCategories(),
          purificationAPI.getAll(),
          purificationAPI.getPurifiedRecords(),
          placesAPI.getAll(),
          purifiersAPI.getAll(),
        ]);
      setAvailableCategories(availData);
      setProcesses(processData);
      setPurifiedRecords(purifiedData);
      setPlaces(placeData);
      setPurifiers(purifierData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useLongPoll(loadData);

  const filteredAvailable = availableCategories.filter(
    (a) =>
      a.productMarker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleInputChance = (
    recordId: number,
    category: string,
    value: string,
  ) => {
    const key = `${recordId}-${category}`;
    setInputCounts((prev) => ({ ...prev, [key]: value }));
  };

  const handlePurify = async (avail: AvailableCategory) => {
    const key = `${avail.processingRecordId}-${avail.category}`;
    const countStr = inputCounts[key];
    const count = parseFloat(countStr);
    const placeId = selectedPlaces[key];

    if (isNaN(count) || count <= 0)
      return showAlert("Validation", "Please enter a valid count", "error");
    if (!placeId)
      return showAlert("Validation", "Please select a place", "error");

    setSubmitting(key);
    try {
      await purificationAPI.create({
        date: new Date().toISOString(),
        processingRecordId: avail.processingRecordId,
        category: avail.category,
        purifyCount: count,
        placeId: placeId,
        isWeightFull: true,
        workerFees: 0,
        supervisorFees: 0,
      });
      await loadData();
      setInputCounts((prev) => ({ ...prev, [key]: "" }));
    } catch (error) {
      console.error("Purification failed:", error);
      showAlert("Error", "Purification failed", "error");
    } finally {
      setSubmitting(null);
    }
  };

  const handleDelete = (id: number) => {
    showConfirm(
      "Confirm Delete",
      "Are you sure you want to delete this record?",
      async () => {
        try {
          await purificationAPI.delete(id);
          await loadData();
        } catch (error) {
          console.error("Delete failed:", error);
          showAlert("Error", "Failed to delete record", "error");
        }
      },
    );
  };

  const handleClosePlaceManagement = () => {
    setshowPlaceManagement(false);
    loadData();
  };

  const handleDeleteRecord = (id: number) => {
    showConfirm(
      "Confirm Delete",
      "Are you sure you want to delete this record?",
      async () => {
        try {
          await purificationAPI.deletePurifiedRecord(id);
          await loadData();
        } catch (error) {
          console.error("Delete failed:", error);
          showAlert("Error", "Failed to delete record", "error");
        }
      },
    );
  };

  const handleEditClick = (p: PurificationProcess) => {
    setEditingProcess(p);
    setEditingRecord(null);
    setSelectedCategory(null);

    const dateStr = p.date
      ? p.date.includes("T")
        ? p.date.slice(0, 16)
        : p.date + "T00:00"
      : getMyanmarNow();

    setPurifyForm({
      count: p.purifyCount.toString(),
      date: dateStr,
      placeId: p.placeId || 0,
      purifierId: 0,
      isWeightFull: p.isWeightFull,
      workerFees: p.workerFees !== undefined ? p.workerFees.toString() : "",
      supervisorFees:
        p.supervisorFees !== undefined ? p.supervisorFees.toString() : "",
      workers: p.workers
        ? p.workers.map((w) => ({
            purifierId: w.purifierId,
            count: w.count,
            workerFees: w.workerFees,
          }))
        : [],
    });
    setShowPurifyModal(true);
  };

  const handleSubmitPurify = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseFloat(purifyForm.count);
    if (isNaN(count) || count <= 0)
      return showAlert(
        "Validation",
        "Please enter a valid bundle count",
        "error",
      );
    if (!purifyForm.placeId)
      return showAlert("Validation", "Please select a place", "error");

    if (selectedCategory) {
      if (count > selectedCategory.remainingCount) {
        showAlert(
          "Validation",
          `Cannot exceed remaining count (${selectedCategory.remainingCount})`,
          "error",
        );
        return;
      }
    } else if (editingProcess || editingRecord) {
      const procId =
        editingProcess?.processingRecordId || editingRecord?.processingRecordId;
      const cat = editingProcess?.category || editingRecord?.category;
      const currentRecordCount =
        editingProcess?.purifyCount || (editingRecord as any)?.count || 0;
      const avail = availableCategories.find(
        (a) => a.processingRecordId === procId && a.category === cat,
      );
      const currentStockInBag = avail?.remainingCount || 0;
      const maxAllowed = currentStockInBag + currentRecordCount;
      if (count > maxAllowed) {
        showAlert(
          "Validation",
          `Cannot exceed available count (${maxAllowed})`,
          "error",
        );
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
          placeId: editingProcess.placeId,
          isWeightFull: purifyForm.isWeightFull,
          workerFees: Number(purifyForm.workerFees) || 0,
          supervisorFees: Number(purifyForm.supervisorFees) || 0,
          workers: purifyForm.workers,
        });
      } else if (editingRecord) {
        await purificationAPI.updatePurifiedRecord(editingRecord.id, {
          date: combineDateWithMyanmarTime(purifyForm.date),
          processingRecordId: editingRecord.processingRecordId,
          category: editingRecord.category,
          purifyCount: count,
          placeId: editingRecord.placeId,
          isWeightFull: purifyForm.isWeightFull,
          workerFees: Number(purifyForm.workerFees) || 0,
          supervisorFees: Number(purifyForm.supervisorFees) || 0,
          workers: purifyForm.workers,
        });
      } else if (selectedCategory) {
        await purificationAPI.create({
          date: combineDateWithMyanmarTime(purifyForm.date),
          processingRecordId: selectedCategory.processingRecordId,
          category: selectedCategory.category,
          purifyCount: count,
          placeId: purifyForm.placeId,
          isWeightFull: purifyForm.isWeightFull,
          workerFees: Number(purifyForm.workerFees) || 0,
          supervisorFees: Number(purifyForm.supervisorFees) || 0,
          workers: purifyForm.workers,
        });
      }
      setShowPurifyModal(false);
      await loadData();
    } catch (error: any) {
      console.error("Submit failed:", error);
      showAlert(
        "Error",
        error?.response?.data?.message || "Failed to save record",
        "error",
      );
    }
  };

  if (loading) {
    return (
      <div className="rf-loading fade-in">
        <Loader2 className="rf-spin" size={28} />
        <span>Loading purification data...</span>
      </div>
    );
  }

  return (
    <div className="purification-container fade-in">
      {/* Hero Header */}
      <div className="purification-hero">
        <div className="purification-hero-left">
          <div className="purification-hero-icon">
            <Sparkles size={30} strokeWidth={1.8} />
          </div>
          <div className="purification-hero-text">
            <h1>Purification</h1>
            <p>Monitor purification stages, worker fees, and refined outputs</p>
          </div>
        </div>
        <div className="purification-hero-right">
          <div className="purification-stat-pill">
            <span className="stat-num">{purifiedRecords.length}</span>
            <span className="stat-label">
              {purifiedRecords.length === 1 ? "Record" : "Records"}
            </span>
          </div>
        </div>
      </div>

      <div className="purification-layout">
        <aside className="rf-sidebar">
          <div className="rf-sidebar-header">
            <Package size={18} />
            <span>Select Category to Purify</span>
          </div>

          <div className="rf-search-box">
            <Search size={16} className="rf-search-icon" />
            <input
              type="text"
              placeholder="Search bag marker..."
              className="rf-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="rf-card-list">
            {filteredAvailable.length === 0 ? (
              <div className="rf-empty-sidebar">
                {searchTerm
                  ? "No matching bags found"
                  : "No available bags for purification"}
              </div>
            ) : (
              filteredAvailable.map((avail) => {
                const key = `${avail.processingRecordId}-${avail.category}`;
                return (
                  <div key={key} className="rf-bag-card">
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
                        className={`rf-badge category-${avail.category.toLowerCase().replace(/ /g, "-")}`}
                      >
                        {avail.category}
                      </span>
                    </div>

                    <div className="rf-stats-row">
                      <div className="rf-stat">
                        <span className="rf-stat-label">Remaining</span>
                        <span className="rf-stat-value">
                          {avail.remainingCount}{" "}
                          <span className="rf-stat-unit">bundles</span>
                        </span>
                      </div>
                      <div className="rf-stat rf-stat-right">
                        <span className="rf-stat-label">Weight</span>
                        <span className="rf-stat-value rf-stat-blue">
                          {avail.remainingWeight.toFixed(3)}{" "}
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

                    <div className="rf-worker-select-wrap">
                      <label className="rf-field-label">Place</label>
                      <select
                        className="rf-select"
                        value={selectedPlaces[key] || ""}
                        onChange={(e) =>
                          setSelectedPlaces((prev) => ({
                            ...prev,
                            [key]: parseInt(e.target.value),
                          }))
                        }
                      >
                        <option value="">-- Select place --</option>
                        {places
                          .filter((p) => p.warehouseId === avail.warehouseId)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                    </div>

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
                        placeholder="Bundles"
                        className="rf-select"
                        style={{ flex: 1, minWidth: 0, cursor: "text" }}
                        value={inputCounts[key] || ""}
                        onChange={(e) =>
                          handleInputChance(
                            avail.processingRecordId,
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
                            avail.processingRecordId,
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

                    <button
                      className="rf-assign-btn"
                      style={{
                        background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                        boxShadow: "0 3px 10px rgba(59, 130, 246, 0.3)",
                        borderLeft: "none",
                      }}
                      onClick={() => handlePurify(avail)}
                      disabled={submitting === key}
                    >
                      {submitting === key ? (
                        <>
                          <Loader2 className="rf-spin" size={16} />{" "}
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send size={16} /> Purify
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        <main className="rf-main">
          <div className="rf-main-card">
            <div className="rf-main-header">
              <div className="rf-header-left">
                <div
                  className="rf-header-icon"
                  style={{
                    background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                    color: "#2563eb",
                  }}
                >
                  <History size={28} />
                </div>

                <div className="rf-tab-group">
                  <button
                    className={`rf-tab ${activeTab === "history" ? "rf-tab-active" : ""}`}
                    onClick={() => setActiveTab("history")}
                  >
                    <span className="rf-tab-title">Purification History</span>
                    <span className="rf-tab-sub">
                      Process log of raw hair bundles
                    </span>
                  </button>
                  <button
                    className={`rf-tab ${activeTab === "stock" ? "rf-tab-active rf-tab-blue" : ""}`}
                    onClick={() => setActiveTab("stock")}
                  >
                    <span className="rf-tab-title">Purified Stock</span>
                    <span className="rf-tab-sub">
                      Inventory of purified bundles
                    </span>
                  </button>
                </div>
              </div>

              <div className="rf-header-right">
                <button
                  className="btn-manage-purifiers"
                  onClick={() => setshowPlaceManagement(true)}
                >
                  <Settings size={16} />
                  Manage Purifiers
                </button>
              </div>
            </div>

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
                      <th>Worker Fees</th>
                      <th>Place</th>
                      <th className="rf-th-right">Actions</th>
                    </tr>
                  ) : (
                    <tr>
                      <th>Date</th>
                      <th>Bag Marker</th>
                      <th>Category</th>
                      <th>Purified Count</th>
                      <th>Weight (Output)</th>
                      <th>Worker Fees</th>
                      <th>Supervisor Fees</th>
                      <th>Supervisor Name</th>
                      <th>Place</th>
                      <th>Weight Status</th>
                      <th className="rf-th-right">Actions</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {activeTab === "history" ? (
                    processes.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="rf-empty-row">
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "12px",
                              padding: "40px",
                            }}
                          >
                            <History size={48} style={{ opacity: 0.2 }} />
                            <span>
                              No purification processes registered yet
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      processes.map((p) => (
                        <tr
                          key={p.id}
                          className="rf-clickable-row"
                          onClick={() => handleEditClick(p)}
                        >
                          <td className="rf-td-date">
                            {formatDateTime(p.date)}
                          </td>
                          <td>
                            <div className="rf-marker">{p.productMarker}</div>
                            <div
                              className="rf-warehouse"
                              style={{ color: "#3b82f6" }}
                            >
                              {p.warehouseName || "---"}
                            </div>
                          </td>
                          <td>
                            <span
                              className={`rf-badge category-${p.category.toLowerCase().replace(/ /g, "-")}`}
                            >
                              {p.category}
                            </span>
                          </td>
                          <td style={{ fontWeight: 800 }}>{p.purifyCount}</td>
                          <td className="rf-td-weight">
                            {p.purifyWeight.toFixed(3)}
                          </td>
                          <td>
                            {(
                              p.workers?.reduce(
                                (sum, w) => sum + (w.workerFees || 0),
                                0,
                              ) || 0
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td>
                            <div className="rf-worker-cell">
                              <User size={13} />
                              {p.placeName || "---"}
                            </div>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="rf-actions">
                              {hasPermission("Sales2.Edit") && (
                                <button
                                  className="rf-action-btn rf-edit-btn"
                                  onClick={() => handleEditClick(p)}
                                >
                                  <Pencil size={14} />
                                </button>
                              )}
                              {hasPermission("Sales2.Delete") && (
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
                  ) : purifiedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="rf-empty-row">
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "12px",
                            padding: "40px",
                          }}
                        >
                          <Package size={48} style={{ opacity: 0.2 }} />
                          <span>No purified stock records yet</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    purifiedRecords.map((p) => (
                      <tr key={p.id}>
                        <td className="rf-td-date">{formatDateTime(p.date)}</td>
                        <td>
                          <div className="rf-marker">{p.productMarker}</div>
                          <div
                            className="rf-warehouse"
                            style={{ color: "#3b82f6" }}
                          >
                            {p.warehouseName || "---"}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`rf-badge category-${p.category.toLowerCase().replace(/ /g, "-")}`}
                          >
                            {p.category}
                          </span>
                        </td>
                        <td style={{ fontWeight: 800 }}>{p.count}</td>
                        <td className="rf-td-weight rf-green">
                          {p.weight.toFixed(3)}
                        </td>
                        <td>
                          {p.workerFees?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </td>
                        <td>
                          {p.supervisorFees?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </td>
                        <td>{p.supervisorName || "---"}</td>
                        <td>
                          <div className="rf-worker-cell">
                            <User size={13} />
                            {p.placeName || "---"}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`rf-badge ${p.isWeightFull ? "category-full" : "category-partial"}`}
                            style={{
                              background: p.isWeightFull
                                ? "#f0fdf4"
                                : "#fff7ed",
                              color: p.isWeightFull ? "#15803d" : "#c2410c",
                              border: `1px solid ${p.isWeightFull ? "#bbf7d0" : "#ffedd5"}`,
                            }}
                          >
                            {p.isWeightFull ? "Weight Full" : "Weight Partial"}
                          </span>
                        </td>
                        <td>
                          <div className="rf-actions">
                            {hasPermission("Sales2.Delete") && (
                              <button
                                className="rf-action-btn rf-delete-btn"
                                onClick={() => handleDeleteRecord(p.id)}
                                disabled={p.isLocked}
                                style={{
                                  cursor: p.isLocked
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {showPlaceManagement && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1100 }}
          onClick={handleClosePlaceManagement}
        >
          <div
            className="purifier-manager-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="pm-close-btn"
              style={{
                position: "absolute",
                right: "24px",
                top: "24px",
                zIndex: 10,
              }}
              onClick={handleClosePlaceManagement}
            >
              <X size={20} />
            </button>
            <PurifierManagement />
          </div>
        </div>
      )}

      {showPurifyModal &&
        (selectedCategory || editingProcess || editingRecord) && (
          <div
            className="modal-overlay"
            style={{ zIndex: 1200 }}
            onClick={() => setShowPurifyModal(false)}
          >
            <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="pm-header">
                <div className="pm-header-left">
                  <div className="pm-header-icon">
                    <Send size={20} />
                  </div>
                  <div>
                    <p className="pm-header-pre">Purification Process</p>
                    <h2 className="pm-header-title">
                      {editingProcess || editingRecord
                        ? "Edit Process Record"
                        : "Record Purified Bundles"}
                    </h2>
                  </div>
                </div>
                <button
                  className="pm-close-btn"
                  onClick={() => setShowPurifyModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="pm-info-bar">
                <div className="pm-info-chip">
                  <span className="pm-info-label">Warehouse</span>
                  <span className="pm-info-value">
                    {selectedCategory?.warehouseName ||
                      editingProcess?.warehouseName ||
                      editingRecord?.warehouseName ||
                      "---"}
                  </span>
                </div>
                <div className="pm-info-chip">
                  <span className="pm-info-label">Bag Marker</span>
                  <span className="pm-info-value">
                    {selectedCategory?.productMarker ||
                      editingProcess?.productMarker ||
                      editingRecord?.productMarker}
                  </span>
                </div>
                <div className="pm-info-chip">
                  <span className="pm-info-label">Bundle Count</span>
                  <span className="pm-info-value" style={{ color: "#ea580c" }}>
                    {editingRecord
                      ? editingRecord.count
                      : editingProcess
                        ? editingProcess.purifyCount
                        : selectedCategory?.remainingCount}{" "}
                    bundles
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmitPurify} className="pm-body">
                {editingProcess || editingRecord ? (
                  <div className="pm-form-group">
                    <label className="pm-form-label">Hair Place</label>
                    <div className="pm-readonly-box">
                      <span className="pm-info-value">
                        {editingProcess?.placeName ||
                          editingRecord?.placeName ||
                          "---"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="pm-form-group">
                    <label className="pm-form-label">Hair place</label>
                    <select
                      className="pm-form-control"
                      value={purifyForm.placeId || ""}
                      onChange={(e) =>
                        setPurifyForm((prev) => ({
                          ...prev,
                          placeId: parseInt(e.target.value),
                        }))
                      }
                      required
                    >
                      <option value="">-- Select place --</option>
                      {places.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {purifyForm.placeId !== 0 && (
                  <div className="pm-form-group">
                    <label className="pm-form-label">Supervisor Fees</label>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                      }}
                    >
                      <span
                        className="pm-readonly-box"
                        style={{
                          flex: 1,
                          backgroundColor: "#f8fafc",
                          padding: "8px",
                          borderRadius: "6px",
                          color: "#64748b",
                        }}
                      >
                        Supervisor:{" "}
                        {editingProcess?.supervisorName ||
                          editingRecord?.supervisorName ||
                          places.find((p) => p.id === purifyForm.placeId)
                            ?.supervisorName ||
                          "---"}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="pm-form-control"
                        placeholder="Fees"
                        style={{ flex: 1 }}
                        value={purifyForm.supervisorFees}
                        onChange={(e) =>
                          setPurifyForm((prev) => ({
                            ...prev,
                            supervisorFees: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>
                )}

                {(editingProcess || editingRecord) && (
                  <div
                    className="pm-form-group"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <label className="pm-form-label">Purifier Workers</label>
                    <select
                      className="pm-form-control"
                      value=""
                      onChange={(e) => {
                        const newId = parseInt(e.target.value);
                        if (!newId || isNaN(newId)) return;
                        if (
                          purifyForm.workers.some((w) => w.purifierId === newId)
                        )
                          return;
                        setPurifyForm((prev) => ({
                          ...prev,
                          workers: [
                            ...prev.workers,
                            { purifierId: newId, count: 0, workerFees: 0 },
                          ],
                        }));
                      }}
                    >
                      <option value="">-- Add a purifier worker --</option>
                      {purifiers
                        .filter(
                          (p) =>
                            p.placeId ===
                            (editingProcess?.placeId || editingRecord?.placeId),
                        )
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>

                    <div className="pm-worker-list">
                      {purifyForm.workers.map((worker, index) => {
                        const purifierName =
                          purifiers.find((p) => p.id === worker.purifierId)
                            ?.name || "Unknown";
                        return (
                          <div
                            key={worker.purifierId}
                            className="pm-worker-row"
                          >
                            <div className="pm-worker-name">{purifierName}</div>
                            <input
                              type="number"
                              placeholder="Bundle count"
                              required
                              min="0"
                              step="any"
                              className="pm-form-control"
                              style={{ margin: 0 }}
                              value={worker.count === 0 ? "" : worker.count}
                              onChange={(e) => {
                                const newWorkers = [...purifyForm.workers];
                                newWorkers[index].count =
                                  parseFloat(e.target.value) || 0;
                                setPurifyForm((prev) => ({
                                  ...prev,
                                  workers: newWorkers,
                                }));
                              }}
                            />
                            <input
                              type="number"
                              placeholder="Fees (MMK)"
                              min="0"
                              step="any"
                              className="pm-form-control"
                              style={{ margin: 0 }}
                              value={
                                worker.workerFees === 0 ? "" : worker.workerFees
                              }
                              onChange={(e) => {
                                const newWorkers = [...purifyForm.workers];
                                newWorkers[index].workerFees =
                                  parseFloat(e.target.value) || 0;
                                setPurifyForm((prev) => ({
                                  ...prev,
                                  workers: newWorkers,
                                }));
                              }}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setPurifyForm((prev) => ({
                                  ...prev,
                                  workers: prev.workers.filter(
                                    (w) => w.purifierId !== worker.purifierId,
                                  ),
                                }));
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#ef4444",
                                cursor: "pointer",
                                padding: "4px",
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pm-form-group">
                  <label className="pm-form-label">Category</label>
                  <div className="pm-readonly-box">
                    <span
                      className={`card-badge category-${(selectedCategory?.category || editingProcess?.category || editingRecord?.category || "").toLowerCase().replace(/ /g, "-")}`}
                      style={{ margin: 0 }}
                    >
                      {selectedCategory?.category ||
                        editingProcess?.category ||
                        editingRecord?.category}
                    </span>
                  </div>
                </div>

                <div className="pm-form-group">
                  <label className="pm-form-label">Purified Bundle Count</label>
                  <input
                    type="number"
                    className="pm-form-control"
                    placeholder="Enter bundle count"
                    value={purifyForm.count}
                    onChange={(e) =>
                      setPurifyForm((prev) => ({
                        ...prev,
                        count: e.target.value,
                      }))
                    }
                    required
                    min="0"
                    step="any"
                  />
                </div>

                <div className="pm-form-group">
                  <label className="pm-form-label">
                    Weight Status Verification
                  </label>
                  <div className="pm-toggle-row">
                    <button
                      type="button"
                      className={`pm-toggle-btn toggle-full ${purifyForm.isWeightFull ? "active" : ""}`}
                      onClick={() =>
                        setPurifyForm((prev) => ({
                          ...prev,
                          isWeightFull: true,
                        }))
                      }
                    >
                      Full Weight
                    </button>
                    <button
                      type="button"
                      className={`pm-toggle-btn toggle-short ${!purifyForm.isWeightFull ? "active" : ""}`}
                      onClick={() =>
                        setPurifyForm((prev) => ({
                          ...prev,
                          isWeightFull: false,
                        }))
                      }
                    >
                      Short Weight
                    </button>
                  </div>
                </div>

                <div className="pm-form-group">
                  <label className="pm-form-label">Date</label>
                  <input
                    type="datetime-local"
                    className="pm-form-control"
                    value={purifyForm.date}
                    onChange={(e) =>
                      setPurifyForm((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="pm-footer">
                  <button
                    type="button"
                    className="pm-btn-cancel"
                    onClick={() => setShowPurifyModal(false)}
                  >
                    <X size={15} /> Cancel
                  </button>
                  <button type="submit" className="pm-btn-save">
                    <Send size={15} />{" "}
                    {editingRecord || editingProcess
                      ? "Save Changes"
                      : "Submit Process"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
};

export default Purification;
