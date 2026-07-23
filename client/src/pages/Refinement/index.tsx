import React, { useEffect, useState, useCallback, useMemo } from "react";
import { refinementAPI, workersAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import { useLongPoll } from "../../hooks/useLongPoll";
import type {
  AvailablePurifiedCategory,
  RefinementProcess,
  RefiningProcess,
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
} from "lucide-react";
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
  const [refiningProcesses, setRefiningProcesses] = useState<RefiningProcess[]>(
    [],
  );
  const [refinementRecords, setRefinementRecords] = useState<
    RefinementRecord[]
  >([]);
  const [activeTab, setActiveTab] = useState<"history" | "refining" | "stock">(
    "history",
  );
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
  const [selectedCategory, setSelectedCategory] =
    useState<AvailablePurifiedCategory | null>(null);
  const [editingProcess, setEditingProcess] =
    useState<RefinementProcess | null>(null);
  const [editingRefiningProcess, setEditingRefiningProcess] =
    useState<RefiningProcess | null>(null);
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
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historyFromDate, setHistoryFromDate] = useState("");
  const [historyToDate, setHistoryToDate] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [avail, procs, refProcs, recs, workers] = await Promise.all([
        refinementAPI.getAvailableCategories(),
        refinementAPI.getAll(),
        refinementAPI.getRefiningProcesses(),
        refinementAPI.getRefinementRecords(),
        workersAPI.getGirdleBushWorkers(),
      ]);
      setAvailableCategories(avail);
      setProcesses(procs);
      setRefiningProcesses(refProcs);
      setRefinementRecords(recs);
      setRefinementWorkers(workers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useLongPoll(loadData);

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

  const handleDeleteRefiningProcess = (id: number) =>
    showConfirm(
      "Confirm Delete",
      "Are you sure you want to delete this refining stock record?",
      async () => {
        try {
          await refinementAPI.deleteRefiningProcess(id);
          await loadData();
        } catch {
          showAlert("Error", "Failed to delete refining record", "error");
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
    setEditingRefiningProcess(null);
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
      workerFees: p.workerFees ? p.workerFees.toString() : "",
    });
    setValidationError(null);
    setShowModal(true);
  };

  const handleEditRefiningProcess = (p: RefiningProcess) => {
    setEditingRefiningProcess(p);
    setEditingProcess(null);
    setEditingRecord(null);
    setSelectedCategory(null);
    const dateStr = p.date
      ? p.date.includes("T")
        ? p.date.slice(0, 16)
        : p.date + "T00:00"
      : getMyanmarNow();
    setForm({
      weight: "",
      spoilageWeight: p.spoilageWeight.toString(),
      returnWeight: p.returnWeight.toString(),
      date: dateStr,
      refinementWorkerId: p.refinementWorkerId || 0,
      workerFees: p.workerFees ? p.workerFees.toString() : "",
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
      editingRefiningProcess?.weight ??
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

    const isRefiningStock =
      !!editingRefiningProcess ||
      (!!editingRecord && !!editingRecord.refiningProcessId);

    if (!isRefiningStock) {
      if (!form.refinementWorkerId) {
        setValidationError("Please select a refinement worker");
        return;
      }
    } else {
      const assigned =
        editingRefiningProcess?.assignedWeight ??
        editingRecord?.assignedWeight ??
        0;
      const maxOutputWeight =
        assigned > 0 && available > 0
          ? Math.min(assigned, available)
          : available > 0
            ? available
            : assigned;
      if (maxOutputWeight > 0 && weight > maxOutputWeight) {
        setValidationError(
          `Output weight cannot exceed maximum allowed weight (${maxOutputWeight.toFixed(3)} viss)`,
        );
        return;
      }
    }

    try {
      const dto = {
        date: combineDateWithMyanmarTime(form.date),
        purifiedRecordId:
          editingProcess?.purifiedRecordId ||
          editingRefiningProcess?.purifiedRecordId ||
          editingRecord?.purifiedRecordId ||
          selectedCategory!.purifiedRecordId,
        category:
          editingProcess?.category ||
          editingRefiningProcess?.category ||
          editingRecord?.category ||
          selectedCategory!.category,
        count: 0,
        weight,
        lostWeight: isRefiningStock
          ? (() => {
              const assigned =
                editingRefiningProcess?.assignedWeight ??
                editingRecord?.assignedWeight ??
                0;
              const baseLost = editingRefiningProcess
                ? editingRefiningProcess.lostWeight
                : (editingRecord?.lostWeight ?? 0);
              const spoilage = editingRefiningProcess
                ? editingRefiningProcess.spoilageWeight
                : (editingRecord?.spoilageWeight ?? 0);
              const ret = editingRefiningProcess
                ? editingRefiningProcess.returnWeight
                : (editingRecord?.returnWeight ?? 0);
              return weight > 0 && assigned > 0
                ? Math.max(0, assigned - (weight + spoilage + ret))
                : baseLost;
            })()
          : lostWeight,
        spoilageWeight: isRefiningStock
          ? (editingRefiningProcess?.spoilageWeight ??
            editingRecord?.spoilageWeight ??
            0)
          : spoilageWeight,
        returnWeight: isRefiningStock
          ? (editingRefiningProcess?.returnWeight ??
            editingRecord?.returnWeight ??
            0)
          : returnWeight,
        refinementWorkerId: form.refinementWorkerId,
        workerFees: Number(form.workerFees) || 0,
        dryWeight: weight < available ? available - weight : 0,
        increasedWeight: isRefiningStock
          ? (editingRefiningProcess?.increasedWeight ??
            editingRecord?.increasedWeight ??
            0)
          : weight > available ? weight - available : 0,
      };

      if (editingRefiningProcess) {
        await refinementAPI.updateRefiningProcess(
          editingRefiningProcess.id,
          dto,
        );
      } else if (editingProcess) {
        await refinementAPI.update(editingProcess.id, dto);
      } else if (editingRecord) {
        await refinementAPI.updateRefinementRecord(editingRecord.id, dto);
      } else {
        await refinementAPI.create(dto);
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

  const filtered = availableCategories.filter(
    (a) =>
      a.remainingWeight >= 0.001 &&
      (a.productMarker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.warehouseName || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())),
  );

  const filteredProcesses = useMemo(() => {
    return processes.filter((p) => {
      const term = historySearchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        (p.productMarker || "").toLowerCase().includes(term) ||
        (p.category || "").toLowerCase().includes(term) ||
        (p.warehouseName || "").toLowerCase().includes(term) ||
        (p.refinementWorkerName || "").toLowerCase().includes(term);
      const recordDate = p.date ? p.date.slice(0, 10) : "";
      const matchesFrom = !historyFromDate || recordDate >= historyFromDate;
      const matchesTo = !historyToDate || recordDate <= historyToDate;
      return matchesSearch && matchesFrom && matchesTo && p.weight > 0.001;
    });
  }, [processes, historySearchTerm, historyFromDate, historyToDate]);

  const filteredRefiningProcesses = useMemo(() => {
    return refiningProcesses.filter((p) => {
      const term = historySearchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        (p.productMarker || "").toLowerCase().includes(term) ||
        (p.category || "").toLowerCase().includes(term) ||
        (p.warehouseName || "").toLowerCase().includes(term) ||
        (p.refinementWorkerName || "").toLowerCase().includes(term);
      const recordDate = p.date ? p.date.slice(0, 10) : "";
      const matchesFrom = !historyFromDate || recordDate >= historyFromDate;
      const matchesTo = !historyToDate || recordDate <= historyToDate;
      return matchesSearch && matchesFrom && matchesTo && p.weight > 0.001;
    });
  }, [refiningProcesses, historySearchTerm, historyFromDate, historyToDate]);

  const filteredRefinementRecords = useMemo(() => {
    return refinementRecords.filter((p) => {
      const term = historySearchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        (p.productMarker || "").toLowerCase().includes(term) ||
        (p.category || "").toLowerCase().includes(term) ||
        (p.warehouseName || "").toLowerCase().includes(term) ||
        (p.refinementWorkerName || "").toLowerCase().includes(term);
      const recordDate = p.date ? p.date.slice(0, 10) : "";
      const matchesFrom = !historyFromDate || recordDate >= historyFromDate;
      const matchesTo = !historyToDate || recordDate <= historyToDate;
      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [refinementRecords, historySearchTerm, historyFromDate, historyToDate]);

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
            <span className="stat-label">
              {refinementRecords.length === 1 ? "Record" : "Records"}
            </span>
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
                        className={`rf-badge category-${avail.category.toLowerCase().replace(/ /g, "-")}`}
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
                      <label className="rf-field-label">
                        Refinement Worker
                      </label>
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
                        placeholder="0"
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
                          <Loader2 className="rf-spin" size={16} />{" "}
                          Processing...
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
                    <span className="rf-tab-title">Refinement</span>
                    <span className="rf-tab-sub">
                      Process log of purified bundles
                    </span>
                  </button>
                  <button
                    className={`rf-tab ${activeTab === "refining" ? "rf-tab-active rf-tab-orange" : ""}`}
                    onClick={() => setActiveTab("refining")}
                  >
                    <span className="rf-tab-title">Refining Stock</span>
                    <span className="rf-tab-sub">Active refining stock</span>
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

              <div className="rf-header-right"></div>
            </div>

            {/* Table */}
            <div className="rf-table-wrap">
              {/* Table Filters */}
              <div className="rf-table-controls">
                <div className="rf-search-box rf-history-search-box">
                  <Search className="rf-input-icon" size={16} />
                  <input
                    type="text"
                    className="rf-history-search-control"
                    placeholder="Search history..."
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                  />
                </div>
                <div className="rf-date-filter">
                  <div className="rf-date-field">
                    <span className="rf-date-label">From</span>
                    <input
                      type="date"
                      className="rf-date-input"
                      value={historyFromDate}
                      onChange={(e) => setHistoryFromDate(e.target.value)}
                    />
                  </div>
                  <div className="rf-date-field">
                    <span className="rf-date-label">To</span>
                    <input
                      type="date"
                      className="rf-date-input"
                      value={historyToDate}
                      onChange={(e) => setHistoryToDate(e.target.value)}
                    />
                  </div>
                  {(historyFromDate || historyToDate) && (
                    <button
                      className="rf-date-clear-btn"
                      onClick={() => {
                        setHistoryFromDate("");
                        setHistoryToDate("");
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
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
                  ) : activeTab === "refining" ? (
                    <tr>
                      <th>Date</th>
                      <th>Bag Marker</th>
                      <th>Category</th>
                      <th>Remaining Count</th>
                      <th>Remaining Weight</th>
                      <th>Increased Weight</th>
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
                      <th>Dry Weight</th>
                      <th>Increased Weight</th>
                      <th>Refinement Worker</th>
                      <th>Worker Fees</th>
                      <th className="rf-th-right">Actions</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {activeTab === "history" ? (
                    filteredProcesses.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="rf-empty-row">
                          <History size={44} className="rf-empty-icon" />
                          <span>
                            {processes.length === 0
                              ? "No refinement processes registered yet"
                              : "No records match your search or date filter"}
                          </span>
                        </td>
                      </tr>
                    ) : (
                      filteredProcesses.map((p) => (
                        <tr
                          key={p.id}
                          className="rf-clickable-row"
                          onClick={() => handleEditProcess(p)}
                        >
                          <td className="rf-td-date">
                            {formatDateTime(p.date)}
                          </td>
                          <td>
                            <div className="rf-marker">{p.productMarker}</div>
                            <div className="rf-warehouse">
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
                          <td>{p.count}</td>
                          <td className="rf-td-weight">
                            {p.weight.toFixed(3)}
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
                  ) : activeTab === "refining" ? (
                    filteredRefiningProcesses.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="rf-empty-row">
                          <History size={44} className="rf-empty-icon" />
                          <span>
                            {refiningProcesses.filter((p) => p.weight > 0.001)
                              .length === 0
                              ? "No active refining stock at the moment"
                              : "No records match your search or date filter"}
                          </span>
                        </td>
                      </tr>
                    ) : (
                      filteredRefiningProcesses.map((p) => (
                        <tr
                          key={p.id}
                          className="rf-clickable-row"
                          onClick={() => handleEditRefiningProcess(p)}
                        >
                          <td className="rf-td-date">
                            {formatDateTime(p.date)}
                          </td>
                          <td>
                            <div className="rf-marker">{p.productMarker}</div>
                            <div className="rf-warehouse">
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
                          <td>{p.count}</td>
                          <td className="rf-td-weight">
                            {p.weight.toFixed(3)}
                          </td>
                          <td
                            className="rf-td-weight"
                            style={{ color: "#d97706" }}
                          >
                            {(p.increasedWeight || 0).toFixed(3)}
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
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="rf-actions">
                              {hasPermission("Refinement.Edit") && (
                                <button
                                  className="rf-action-btn rf-edit-btn"
                                  onClick={() => handleEditRefiningProcess(p)}
                                >
                                  <Pencil size={14} />
                                </button>
                              )}
                              {hasPermission("Refinement.Delete") && (
                                <button
                                  className="rf-action-btn rf-delete-btn"
                                  onClick={() =>
                                    handleDeleteRefiningProcess(p.id)
                                  }
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  ) : filteredRefinementRecords.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="rf-empty-row">
                        <Package size={44} className="rf-empty-icon" />
                        <span>
                          {refinementRecords.length === 0
                            ? "No refined stock records yet"
                            : "No records match your search or date filter"}
                        </span>
                      </td>
                    </tr>
                  ) : (
                    filteredRefinementRecords.map((p) => (
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
                            className={`rf-badge category-${p.category.toLowerCase().replace(/ /g, "-")}`}
                          >
                            {p.category}
                          </span>
                        </td>
                        <td>{p.count}</td>
                        <td className="rf-td-weight rf-green">
                          {p.weight.toFixed(3)}
                        </td>
                        <td className="rf-td-lost">
                          {p.lostWeight.toFixed(3)}
                        </td>
                        <td className="rf-td-lost" style={{ color: "#ea580c" }}>
                          {p.spoilageWeight.toFixed(3)}
                        </td>
                        <td
                          className="rf-td-weight"
                          style={{ color: "#3b82f6" }}
                        >
                          {p.returnWeight.toFixed(3)}
                        </td>
                        <td
                          className="rf-td-weight"
                          style={{ color: "#059669" }}
                        >
                          {(p.dryWeight || 0).toFixed(3)}
                        </td>
                        <td
                          className="rf-td-weight"
                          style={{ color: "#d97706" }}
                        >
                          {(p.increasedWeight || 0).toFixed(3)}
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

      {/* ── EDIT / CREATE MODAL ── */}
      {/* ── REFINEMENT HISTORY / MAIN ASSIGNMENT MODAL (GREEN) ── */}
      {showModal && (editingProcess || selectedCategory) && (
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
                    {editingProcess ? "Edit Record" : "Record Refinement"}
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
                    selectedCategory?.productMarker}
                </span>
              </div>
              <div className="rf-modal-chip">
                <span className="rf-chip-label">Category</span>
                <span
                  className={`rf-badge category-${(editingProcess?.category || selectedCategory?.category || "").toLowerCase().replace(/ /g, "-")}`}
                  style={{ margin: 0 }}
                >
                  {editingProcess?.category || selectedCategory?.category}
                </span>
              </div>
              <div className="rf-modal-chip">
                <span className="rf-chip-label">Available</span>
                <span className="rf-chip-value rf-chip-orange">
                  {editingProcess
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

              {/* Weight Fields */}
              {(() => {
                const available =
                  editingProcess?.weight ??
                  selectedCategory?.remainingWeight ??
                  0;
                const outputWeight = parseFloat(form.weight) || 0;
                const spoilage = parseFloat(form.spoilageWeight) || 0;
                const ret = parseFloat(form.returnWeight) || 0;
                const lost = Math.max(
                  0,
                  available - outputWeight - spoilage - ret,
                );
                const increased =
                  outputWeight > available ? outputWeight - available : 0;

                return (
                  <>
                    {/* Row 1: Output Weight + Spoilage Weight */}
                    <div className="rf-form-row">
                      <div className="rf-form-group">
                        <label className="rf-form-label">Output Weight</label>
                        <div className="rf-input-unit-wrap">
                          <input
                            type="number"
                            step="0.001"
                            className="rf-form-control"
                            placeholder="0"
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
                            placeholder="0"
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

                    {/* Row 2: Return Weight + Lost Weight */}
                    <div className="rf-form-row">
                      <div className="rf-form-group">
                        <label className="rf-form-label">Return Weight</label>
                        <div className="rf-input-unit-wrap">
                          <input
                            type="number"
                            step="0.001"
                            className="rf-form-control"
                            placeholder="0"
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
                            value={lost.toFixed(3)}
                          />
                          <span className="rf-input-unit rf-unit-red">
                            viss
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Increased Weight */}
                    <div className="rf-form-row">
                      <div className="rf-form-group">
                        <label
                          className="rf-form-label"
                          style={{ color: "#d97706" }}
                        >
                          Increased Weight{" "}
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
                              background: "#fffbeb",
                              color: "#d97706",
                              fontWeight: 700,
                              cursor: "not-allowed",
                              borderColor: "#fde68a",
                            }}
                            value={increased.toFixed(3)}
                          />
                          <span
                            className="rf-input-unit"
                            style={{ color: "#d97706" }}
                          >
                            viss
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Worker Fees */}
              <div className="rf-form-group">
                <label className="rf-form-label">
                  Worker Fees (MMK) <span style={{ color: "#ef4444" }}>*</span>
                </label>
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
                  placeholder="0"
                  required
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
                  {editingProcess ? "Save Changes" : "Submit Record"}
                </button>
              </div>
              {validationError && (
                <div className="rf-modal-error-msg">{validationError}</div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ── REFINING STOCK / REFINED STOCK MODAL (ORANGE) ── */}
      {showModal && (editingRefiningProcess || editingRecord) && (
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
            <div className="rf-modal-header rf-modal-header-orange">
              <div className="rf-modal-header-left">
                <div className="rf-modal-icon">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="rf-modal-pre">Refining Stock Process</p>
                  <h2 className="rf-modal-title">
                    {editingRecord ? "Edit Record" : "Record Refinement"}
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
                  {editingRefiningProcess?.productMarker ||
                    editingRecord?.productMarker}
                </span>
              </div>
              <div className="rf-modal-chip">
                <span className="rf-chip-label">Category</span>
                <span
                  className={`rf-badge category-${(editingRefiningProcess?.category || editingRecord?.category || "").toLowerCase().replace(/ /g, "-")}`}
                  style={{ margin: 0 }}
                >
                  {editingRefiningProcess?.category || editingRecord?.category}
                </span>
              </div>
              <div className="rf-modal-chip">
                <span className="rf-chip-label">Assigned</span>
                <span className="rf-chip-value" style={{ color: "#6366f1" }}>
                  {editingRefiningProcess?.assignedWeight != null
                    ? editingRefiningProcess.assignedWeight.toFixed(3)
                    : editingRecord?.assignedWeight != null
                      ? editingRecord.assignedWeight.toFixed(3)
                      : "0.000"}{" "}
                  viss
                </span>
              </div>
              <div className="rf-modal-chip">
                <span className="rf-chip-label">Available</span>
                <span className="rf-chip-value rf-chip-orange">
                  {editingRecord
                    ? editingRecord.weight.toFixed(3)
                    : editingRefiningProcess
                      ? editingRefiningProcess.weight.toFixed(3)
                      : "0.000"}{" "}
                  viss
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitModal} className="rf-modal-body">
              {/* Worker (read-only label) */}
              <div className="rf-form-group">
                <label className="rf-form-label">
                  Refinement Worker{" "}
                  <span style={{ fontSize: "9px", color: "#94a3b8" }}>
                    (read-only)
                  </span>
                </label>
                <input
                  type="text"
                  readOnly
                  className="rf-form-control"
                  style={{
                    background: "#f8fafc",
                    cursor: "not-allowed",
                    fontWeight: 600,
                  }}
                  value={
                    editingRefiningProcess?.refinementWorkerName ||
                    editingRecord?.refinementWorkerName ||
                    "---"
                  }
                />
              </div>

              {/* Weight Fields */}
              {(() => {
                const available =
                  editingRecord?.weight ?? editingRefiningProcess?.weight ?? 0;
                const outputWeight = parseFloat(form.weight) || 0;
                const spoilage = editingRefiningProcess
                  ? editingRefiningProcess.spoilageWeight
                  : (editingRecord?.spoilageWeight ?? 0);
                const ret = editingRefiningProcess
                  ? editingRefiningProcess.returnWeight
                  : (editingRecord?.returnWeight ?? 0);
                const assigned =
                  editingRefiningProcess?.assignedWeight ??
                  editingRecord?.assignedWeight ??
                  0;
                const baseLost = editingRefiningProcess
                  ? editingRefiningProcess.lostWeight
                  : (editingRecord?.lostWeight ?? 0);
                const lost =
                  assigned > 0 && outputWeight > 0
                    ? Math.max(0, assigned - (outputWeight + spoilage + ret))
                    : baseLost;
                const processIncreased = editingRefiningProcess
                  ? editingRefiningProcess.increasedWeight || 0
                  : editingRecord?.increasedWeight || 0;

                const dryWeight =
                  outputWeight < available ? available - outputWeight : 0;
                const maxOutputWeight =
                  assigned > 0 && available > 0
                    ? Math.min(assigned, available)
                    : available > 0
                      ? available
                      : assigned;

                return (
                  <>
                    {/* Row 1: Output Weight + Spoilage Weight (read-only) */}
                    <div className="rf-form-row">
                      <div className="rf-form-group">
                        <label className="rf-form-label">Output Weight</label>
                        <div className="rf-input-unit-wrap">
                          <input
                            type="number"
                            step="0.001"
                            max={maxOutputWeight > 0 ? maxOutputWeight : undefined}
                            className="rf-form-control"
                            placeholder="0"
                            value={form.weight}
                            onChange={(e) => {
                              setValidationError(null);
                              const val = parseFloat(e.target.value);
                              if (maxOutputWeight > 0 && val > maxOutputWeight) {
                                setForm((prev) => ({
                                  ...prev,
                                  weight: maxOutputWeight.toString(),
                                }));
                                setValidationError(
                                  `Output weight cannot exceed maximum allowed weight (${maxOutputWeight.toFixed(3)} viss)`,
                                );
                              } else {
                                setForm((prev) => ({
                                  ...prev,
                                  weight: e.target.value,
                                }));
                              }
                            }}
                            required
                          />
                          <span className="rf-input-unit">viss</span>
                        </div>
                      </div>
                      <div className="rf-form-group">
                        <label className="rf-form-label">
                          Spoilage Weight{" "}
                          <span style={{ fontSize: "9px", color: "#94a3b8" }}>
                            (read-only)
                          </span>
                        </label>
                        <div className="rf-input-unit-wrap">
                          <input
                            type="number"
                            step="0.001"
                            readOnly
                            className="rf-form-control"
                            style={{
                              background: "#f8fafc",
                              cursor: "not-allowed",
                            }}
                            value={spoilage}
                          />
                          <span className="rf-input-unit">viss</span>
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Return Weight (read-only) + Lost Weight (read-only) */}
                    <div className="rf-form-row">
                      <div className="rf-form-group">
                        <label className="rf-form-label">
                          Return Weight{" "}
                          <span style={{ fontSize: "9px", color: "#94a3b8" }}>
                            (read-only)
                          </span>
                        </label>
                        <div className="rf-input-unit-wrap">
                          <input
                            type="number"
                            step="0.001"
                            readOnly
                            className="rf-form-control"
                            style={{
                              background: "#f8fafc",
                              cursor: "not-allowed",
                            }}
                            value={ret}
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
                            (read-only)
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
                            value={lost.toFixed(3)}
                          />
                          <span className="rf-input-unit rf-unit-red">
                            viss
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Process Increased Weight (read-only) + Dry Weight (auto) */}
                    <div className="rf-form-row">
                      <div className="rf-form-group">
                        <label
                          className="rf-form-label"
                          style={{ color: "#d97706" }}
                        >
                          Process Increased Weight
                        </label>
                        <div className="rf-input-unit-wrap">
                          <input
                            type="number"
                            readOnly
                            className="rf-form-control"
                            style={{
                              background: "#fffbeb",
                              color: "#d97706",
                              fontWeight: 700,
                              cursor: "not-allowed",
                              borderColor: "#fde68a",
                            }}
                            value={processIncreased.toFixed(3)}
                          />
                          <span
                            className="rf-input-unit"
                            style={{ color: "#d97706" }}
                          >
                            viss
                          </span>
                        </div>
                      </div>
                      <div className="rf-form-group">
                        <label
                          className="rf-form-label"
                          style={{ color: "#059669" }}
                        >
                          Dry Weight{" "}
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
                              background: "#ecfdf5",
                              color: "#059669",
                              fontWeight: 700,
                              cursor: "not-allowed",
                              borderColor: "#a7f3d0",
                            }}
                            value={dryWeight.toFixed(3)}
                          />
                          <span className="rf-input-unit rf-unit-green">
                            viss
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Worker Fees (read-only) */}
              <div className="rf-form-group">
                <label className="rf-form-label">
                  Worker Fees (MMK){" "}
                  <span style={{ fontSize: "9px", color: "#94a3b8" }}>
                    (read-only)
                  </span>
                </label>
                <input
                  type="number"
                  readOnly
                  className="rf-form-control"
                  style={{ background: "#f8fafc", cursor: "not-allowed" }}
                  value={form.workerFees}
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
                <button
                  type="submit"
                  className="rf-btn-save rf-btn-save-orange"
                >
                  <Send size={15} />
                  {editingRecord ? "Save Changes" : "Submit Record"}
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
