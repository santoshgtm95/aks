import React, { useEffect, useState } from "react";
import { purificationAPI, placesAPI, purifiersAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
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

  const loadData = async () => {
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
        editingProcess?.purifyCount || editingRecord?.count || 0;
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
          gap: "12px",
          color: "#64748b",
        }}
      >
        <Loader2 className="animate-spin" size={28} />
        <span style={{ fontSize: "16px", fontWeight: 500 }}>
          Loading purification data...
        </span>
      </div>
    );
  }

  return (
    <div className="processing-container fade-in">
      {/* Left Sidebar: Available Categories for Purification */}
      <aside className="product-sidebar">
        <h2 className="sidebar-title">
          <Package size={20} />
          Select Category to Purify
        </h2>

        <div className="search-box">
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
            }}
          />
          <input
            type="text"
            placeholder="Search bag marker..."
            className="form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div
          className="product-list"
          style={{
            maxHeight: "calc(100vh - 200px)",
            overflowY: "auto",
            paddingRight: "4px",
          }}
        >
          {filteredAvailable.length === 0 ? (
            <div className="sidebar-empty-state">
              {searchTerm
                ? "No matching bags found"
                : "No available bags for purification"}
            </div>
          ) : (
            filteredAvailable.map((avail) => {
              const key = `${avail.processingRecordId}-${avail.category}`;
              return (
                <div key={key} className="product-card premium-sidebar-card">
                  <div className="card-header">
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span className="card-marker">{avail.productMarker}</span>
                      <span className="card-subtext">
                        {avail.warehouseName || "---"}
                      </span>
                    </div>
                    <span
                      className={`card-badge category-${avail.category.toLowerCase().replace(".", "")}`}
                    >
                      {avail.category}
                    </span>
                  </div>
                  <div
                    className="card-details"
                    style={{
                      marginBottom: "14px",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div className="sidebar-details-label">Remaining</div>
                      <div className="sidebar-details-value">
                        {avail.remainingCount}{" "}
                        <span className="sidebar-details-unit">bundles</span> /{" "}
                        {avail.remainingWeight.toFixed(3)}{" "}
                        <span className="sidebar-details-unit">viss</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="sidebar-details-label">Unit Wt</div>
                      <div
                        className="sidebar-details-value"
                        style={{ color: "#3b82f6" }}
                      >
                        {avail.unitWeight.toFixed(4)}
                      </div>
                    </div>
                  </div>

                  <div
                    className="place-selection"
                    style={{ marginBottom: "12px" }}
                  >
                    <div
                      className="sidebar-details-label"
                      style={{ marginBottom: "4px" }}
                    >
                      place
                    </div>
                    <select
                      className="sidebar-select"
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
                    className="purify-input-group"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      borderTop: "1px solid #f1f5f9",
                      paddingTop: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="number"
                        placeholder="Bundle count"
                        className="sidebar-input"
                        style={{ minWidth: 0, flex: 1 }}
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
                      className="sidebar-btn-send"
                      style={{ width: "100%", padding: "10px 0" }}
                      onClick={() => handlePurify(avail)}
                      disabled={submitting === key}
                    >
                      {submitting === key ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            justifyContent: "center",
                          }}
                        >
                          <Send size={16} />
                          <span style={{ fontSize: "14px", fontWeight: 500 }}>
                            Purify
                          </span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Content: Purification History / Purified Stock */}
      <main className="processing-main">
        <div className="record-details-view fade-in">
          <div className="main-header">
            <div className="header-title">
              <div
                className="icon-box"
                style={{
                  background: "#eff6ff",
                  padding: "12px",
                  borderRadius: "12px",
                }}
              >
                <History size={32} className="text-primary" />
              </div>
              <div className="premium-tabs">
                <div
                  className={`premium-tab ${activeTab === "history" ? "active" : ""}`}
                  onClick={() => setActiveTab("history")}
                >
                  <h1>Purification</h1>
                  <p className="header-subtitle">
                    Process log of raw hair bundles
                  </p>
                </div>
                <div
                  className={`premium-tab ${activeTab === "stock" ? "active" : ""}`}
                  onClick={() => setActiveTab("stock")}
                >
                  <h1>Purified Stock</h1>
                  <p className="header-subtitle">
                    Inventory of purified bundles
                  </p>
                </div>
              </div>
            </div>
            <button
              className="btn-manage-purifiers"
              onClick={() => setshowPlaceManagement(true)}
            >
              <Settings size={16} />
              Manage Purifiers
            </button>
          </div>

          <div className="table-responsive premium-table-card">
            <table className="data-table">
              <thead>
                {activeTab === "history" ? (
                  <tr>
                    <th>Date</th>
                    <th>Bag Marker</th>
                    <th>Category</th>
                    <th>Bundle Count</th>
                    <th>Weight (viss)</th>
                    <th>Worker Fees</th>
                    <th>place</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
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
                    <th>place</th>
                    <th>Weight Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {activeTab === "history" ? (
                  processes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          textAlign: "center",
                          padding: "60px",
                          color: "#94a3b8",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <History size={48} style={{ opacity: 0.2 }} />
                          <span>No purification processes registered yet</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    processes.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => handleEditClick(p)}
                        style={{ cursor: "pointer" }}
                      >
                        <td>{formatDateTime(p.date)}</td>
                        <td style={{ fontWeight: 600, color: "#0f172a" }}>
                          <div>{p.productMarker}</div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#3b82f6",
                              fontWeight: 500,
                            }}
                          >
                            {p.warehouseName || "---"}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`card-badge category-${p.category.toLowerCase().replace(".", "")}`}
                          >
                            {p.category}
                          </span>
                        </td>
                        <td
                          style={{
                            fontWeight: 800,
                            color: "#0f172a",
                            fontSize: "15px",
                          }}
                        >
                          {p.purifyCount}
                        </td>
                        <td style={{ fontWeight: 600, color: "#334155" }}>
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
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "13px",
                              fontWeight: 500,
                            }}
                          >
                            <User size={14} style={{ color: "#64748b" }} />
                            {p.placeName || "---"}
                          </div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              justifyContent: "flex-end",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {hasPermission("Sales2.Edit") && (
                              <button
                                className="rec-action-btn edit-btn"
                                onClick={() => handleEditClick(p)}
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            {hasPermission("Sales2.Delete") && (
                              <button
                                className="rec-action-btn delete-btn"
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
                    <td
                      colSpan={8}
                      style={{
                        textAlign: "center",
                        padding: "60px",
                        color: "#94a3b8",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <Package size={48} style={{ opacity: 0.2 }} />
                        <span>No purified stock inventory registered yet</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  purifiedRecords.map((p) => (
                    <tr key={p.id}>
                      <td>{formatDateTime(p.date)}</td>
                      <td style={{ fontWeight: 600, color: "#0f172a" }}>
                        <div>{p.productMarker}</div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#3b82f6",
                            fontWeight: 500,
                          }}
                        >
                          {p.warehouseName || "---"}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`card-badge category-${p.category.toLowerCase().replace(".", "")}`}
                        >
                          {p.category}
                        </span>
                      </td>
                      <td
                        style={{
                          fontWeight: 800,
                          color: "#10b981",
                          fontSize: "15px",
                        }}
                      >
                        {p.count}
                      </td>
                      <td style={{ fontWeight: 600, color: "#334155" }}>
                        {p.weight.toFixed(3)}
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
                        {(p.supervisorFees || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {p.supervisorName || "---"}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "13px",
                            fontWeight: 500,
                          }}
                        >
                          <User size={14} style={{ color: "#64748b" }} />
                          {p.placeName || "---"}
                        </div>
                      </td>
                      <td>
                        {p.isWeightFull ? (
                          <span className="weight-status-badge status-full">
                            Full
                          </span>
                        ) : (
                          <span className="weight-status-badge status-short">
                            Short
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            justifyContent: "flex-end",
                          }}
                        >
                          {hasPermission("Sales2.Delete") && (
                            <button
                              className="rec-action-btn delete-btn"
                              onClick={() => handleDeleteRecord(p.id)}
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

      {/* place Management Modal */}
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

      {/* Purify / Edit Modal */}
      {showPurifyModal &&
        (selectedCategory || editingProcess || editingRecord) && (
          <div
            className="modal-overlay"
            style={{ zIndex: 1200 }}
            onClick={() => setShowPurifyModal(false)}
          >
            <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
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

              {/* Info Bar */}
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
                {/* place */}
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

                {/* Supervisor Fees */}
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
                      />
                    </div>
                  </div>
                )}

                {/* Purifier Workers (Only when editing) */}
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

                {/* Category Display */}
                <div className="pm-form-group">
                  <label className="pm-form-label">Category</label>
                  <div className="pm-readonly-box">
                    <span
                      className={`card-badge category-${(selectedCategory?.category || editingProcess?.category || editingRecord?.category || "").toLowerCase().replace(".", "")}`}
                      style={{ margin: 0 }}
                    >
                      {selectedCategory?.category ||
                        editingProcess?.category ||
                        editingRecord?.category}
                    </span>
                  </div>
                </div>

                {/* Purified Count Input */}
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

                {/* Weight Status */}
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

                {/* Date */}
                <div className="pm-form-group">
                  <label className="pm-form-label">Date</label>
                  <input
                    type="date"
                    className="pm-form-control"
                    value={purifyForm.date.split("T")[0]}
                    onChange={(e) =>
                      setPurifyForm((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                {/* Footer Actions */}
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
