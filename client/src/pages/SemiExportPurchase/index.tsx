import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  exchangeRatesAPI,
  semiExportPurchaseAPI,
  semiExportPurchaseProcessingAPI,
  singleDoubleDrawnWorkersAPI,
} from "../../services/api";
import { Package, FilePlus, Trash2, X, Send, Loader2 } from "lucide-react";
import "./index.css";
import type { ExchangeRate, SingleDoubleDrawnWorker } from "../../types";
import { formatDateTime } from "../../utils/format";

interface SemiExportPurchase {
  id: number;
  customerName: string;
  contact: string;
  totalReceiveWeight: number;
  receiveDateTime: string;
  color: string;
  createdAt: string;
}

interface SemiExportPurchaseProcessing {
  id: number;
  semiExportPurchaseId: number;
  customerName: string;
  contact: string;
  receiveDateTime: string;
  color: string;
  workerId: number;
  workerName: string;
  assignWeight: number;
  lostWeight: number;
  status: string;
  createdAt: string;
}

interface SortingSizeRow {
  size: string;
  weight: string;
  price: string;
}

const sortingSizeRows: SortingSizeRow[] = [
  { size: "6", weight: "", price: "1000" },
  { size: "7", weight: "", price: "2000" },
  { size: "8", weight: "", price: "3000" },
  { size: "9", weight: "", price: "4000" },
  { size: "10", weight: "", price: "5000" },
  { size: "10B", weight: "", price: "6000" },
  { size: "12", weight: "", price: "7000" },
  { size: "14", weight: "", price: "8000" },
  { size: "16", weight: "", price: "9000" },
  { size: "18", weight: "", price: "10000" },
  { size: "20", weight: "", price: "11000" },
  { size: "22", weight: "", price: "12000" },
  { size: "24", weight: "", price: "13000" },
  { size: "26", weight: "", price: "14000" },
  { size: "28", weight: "", price: "15000" },
  { size: "Bar", weight: "", price: "16000" },
  { size: "Return", weight: "", price: "17000" },
  { size: "Spoilage", weight: "", price: "18000" },
  { size: "Lost", weight: "", price: "" },
];

const SemiExportPurchase: React.FC = () => {
  const { hasPermission } = useAuth();
  const [purchases, setPurchases] = useState<SemiExportPurchase[]>([]);
  const [processingList, setProcessingList] = useState<
    SemiExportPurchaseProcessing[]
  >([]);
  const [workers, setWorkers] = useState<SingleDoubleDrawnWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingLoading, setProcessingLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSortingRecordsModal, setShowSortingRecordsModal] = useState(false);
  const [selectedSortingRecord, setSelectedSortingRecord] =
    useState<SemiExportPurchaseProcessing | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeRates, setActiveRates] = useState<ExchangeRate[]>([]);
  const [sortingExchangeRate, setSortingExchangeRate] = useState("0");
  const [sortingSizes, setSortingSizes] =
    useState<SortingSizeRow[]>(sortingSizeRows);
  const [assignWeights, setAssignWeights] = useState<Record<number, string>>(
    {},
  );
  const [selectedWorkers, setSelectedWorkers] = useState<
    Record<number, string>
  >({});

  const assignedIds = new Set(
    processingList.map((p) => p.semiExportPurchaseId),
  );
  const availablePurchases = purchases.filter((p) => !assignedIds.has(p.id));

  const getAssignWeight = (id: number) =>
    parseFloat(assignWeights[id] || "0") || 0;
  const getLostWeight = (purchase: SemiExportPurchase) => {
    if (
      assignWeights[purchase.id] === undefined ||
      assignWeights[purchase.id] === ""
    )
      return 0;
    return Math.max(
      0,
      purchase.totalReceiveWeight - getAssignWeight(purchase.id),
    );
  };
  const [formData, setFormData] = useState({
    customerName: "",
    contact: "",
    totalReceiveWeight: "",
    receiveDateTime: new Date().toISOString().substring(0, 16),
    color: "Red",
  });

  const colorCategories = [
    "Art",
    "Red",
    "White",
    "Short",
    "Simple",
    "N.White",
    "S.Cut",
    "Natural",
    "N.Red",
  ];

  // Load purchases on component mount
  useEffect(() => {
    loadPurchases();
    loadWorkers();
    loadProcessingList();
    loadActiveRates();
  }, []);

  useEffect(() => {
    const cnyToMmkRate = activeRates.find(
      (rate) =>
        rate.fromCurrency?.toUpperCase() === "CNY" &&
        rate.toCurrency?.toUpperCase() === "MMK" &&
        rate.activeStatus,
    );

    setSortingExchangeRate(cnyToMmkRate ? cnyToMmkRate.rate.toString() : "0");
  }, [activeRates]);

  const loadWorkers = async () => {
    try {
      const data = await singleDoubleDrawnWorkersAPI.getAll();
      setWorkers(data);
    } catch (error) {
      console.error("Failed to load workers:", error);
    }
  };

  const loadProcessingList = async () => {
    try {
      setProcessingLoading(true);
      const data = await semiExportPurchaseProcessingAPI.getAll();
      setProcessingList(data);
    } catch (error) {
      console.error("Failed to load processing list:", error);
    } finally {
      setProcessingLoading(false);
    }
  };

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const data = await semiExportPurchaseAPI.getAll();
      setPurchases(data);
    } catch (error) {
      console.error("Failed to load purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName.trim()) {
      alert("Customer name is required");
      return;
    }

    try {
      setSaving(true);
      const newPurchase = await semiExportPurchaseAPI.create({
        customerName: formData.customerName,
        contact: formData.contact,
        totalReceiveWeight: parseFloat(formData.totalReceiveWeight) || 0,
        receiveDateTime: formData.receiveDateTime,
        color: formData.color,
      });

      setPurchases((prev) => [newPurchase, ...prev]);
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save purchase:", error);
      alert("Failed to save purchase order");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: "",
      contact: "",
      totalReceiveWeight: "",
      receiveDateTime: new Date().toISOString().substring(0, 16),
      color: "Red",
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this purchase order?")) {
      return;
    }

    try {
      await semiExportPurchaseAPI.delete(id);
      setPurchases((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Failed to delete purchase:", error);
      alert("Failed to delete purchase order");
    }
  };

  const loadActiveRates = async () => {
    try {
      const data = await exchangeRatesAPI.getActive();
      setActiveRates(data);
    } catch (error) {
      console.error("Failed to load exchange rates:", error);
      setSortingExchangeRate("0");
    }
  };

  const updateSortingSize = (
    size: string,
    field: "weight" | "price",
    value: string,
  ) => {
    setSortingSizes((prev) =>
      prev.map((row) =>
        row.size === size && row.size !== "Lost"
          ? { ...row, [field]: value }
          : row,
      ),
    );
  };

  const getSortingAmount = (row: SortingSizeRow) =>
    (parseFloat(row.weight) || 0) * (parseFloat(row.price) || 0);

  const formatSortingSize = (size: string) => {
    if (["Return", "Spoilage", "Lost"].includes(size)) return size;
    return `Size ${size}`;
  };

  const handleSortingSaveAndPrint = () => {
    window.print();
  };

  const openSortingRecordsModal = (record: SemiExportPurchaseProcessing) => {
    setSelectedSortingRecord(record);
    setShowSortingRecordsModal(true);
  };

  const closeSortingRecordsModal = () => {
    setShowSortingRecordsModal(false);
    setSelectedSortingRecord(null);
  };

  return (
    <div className="rf-container fade-in">
      {/* Left Sidebar */}
      <aside className="rf-sidebar">
        <div className="rf-sidebar-header">
          <Package size={18} />
          <span>Purchase Orders</span>
        </div>
        <div style={{ padding: "16px" }}>
          {hasPermission("SemiExport.Create") && (
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              <FilePlus size={18} />
              Purchase
            </button>
          )}
        </div>

        {/* Purchase Orders List */}
        <div className="rf-card-list">
          {loading ? (
            <div className="rf-empty-sidebar">Loading...</div>
          ) : availablePurchases.length === 0 ? (
            <div className="rf-empty-sidebar">No purchase orders yet</div>
          ) : (
            availablePurchases.map((purchase) => (
              <div key={purchase.id} className="rf-bag-card">
                {/* Card Top */}
                <div className="rf-card-top">
                  <div className="rf-card-info">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span className="rf-card-marker">
                        {purchase.customerName}
                      </span>
                      <span
                        className="rf-card-warehouse"
                        style={{ marginTop: "2px" }}
                      >
                        {purchase.contact || "---"}
                      </span>
                    </div>
                  </div>
                  {hasPermission("SemiExport.Create") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(purchase.id);
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Stats Row */}
                <div className="rf-stats-row">
                  <div className="rf-stat">
                    <span className="rf-stat-label">Weight</span>
                    <span className="rf-stat-value rf-stat-blue">
                      {purchase.totalReceiveWeight.toFixed(3)}{" "}
                      <span className="rf-stat-unit">viss</span>
                    </span>
                  </div>
                  <div className="rf-stat rf-stat-right">
                    <span className="rf-stat-label">Color</span>
                    <span className="rf-stat-value">{purchase.color}</span>
                  </div>
                </div>

                {/* Date Info */}
                <div
                  style={{
                    fontSize: "14px",
                    color: "#94a3b8",
                    marginBottom: "10px",
                  }}
                >
                  Receive DateTime : {formatDateTime(purchase.receiveDateTime)}
                </div>

                {/* Assign Weight + Lost Weight */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div className="rf-input-group">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        marginBottom: "4px",
                      }}
                    >
                      <label
                        className="rf-input-label"
                        style={{ margin: 0, whiteSpace: "nowrap" }}
                      >
                        Weight
                      </label>
                      <div
                        className="rf-input-wrapper"
                        style={{ flex: 1, minWidth: 0 }}
                      >
                        <input
                          type="number"
                          className="rf-input-field"
                          step="0.001"
                          min="0"
                          max={purchase.totalReceiveWeight}
                          value={assignWeights[purchase.id] ?? ""}
                          placeholder="0.000"
                          onChange={(e) =>
                            setAssignWeights((prev) => ({
                              ...prev,
                              [purchase.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          className="rf-max-btn"
                          onClick={() =>
                            setAssignWeights((prev) => ({
                              ...prev,
                              [purchase.id]:
                                purchase.totalReceiveWeight.toString(),
                            }))
                          }
                          title="Fill max weight"
                          style={{ height: "28px" }}
                        >
                          Max
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rf-input-group">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                      }}
                    >
                      <label
                        className="rf-input-label"
                        style={{ margin: 0, whiteSpace: "nowrap" }}
                      >
                        Lost
                      </label>
                      <input
                        type="text"
                        className={`rf-input-field ${getLostWeight(purchase) > 0 ? "has-loss" : ""}`}
                        readOnly
                        value={getLostWeight(purchase).toFixed(3)}
                        style={{ flex: 1, minWidth: 0, textAlign: "right" }}
                      />
                    </div>
                  </div>

                  <div className="rf-input-group">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                      }}
                    >
                      <label
                        className="rf-input-label"
                        style={{ margin: 0, whiteSpace: "nowrap" }}
                      >
                        Worker
                      </label>
                      <select
                        className="rf-input-field"
                        value={selectedWorkers[purchase.id] ?? ""}
                        onChange={(e) =>
                          setSelectedWorkers((prev) => ({
                            ...prev,
                            [purchase.id]: e.target.value,
                          }))
                        }
                        style={{
                          flex: 1,
                          minWidth: 0,
                          background: "white",
                          cursor: "pointer",
                        }}
                      >
                        <option value="">Choose a worker...</option>
                        {workers.map((worker) => (
                          <option key={worker.id} value={worker.id}>
                            {worker.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Assign Button */}
                <button
                  className="rf-assign-btn"
                  onClick={async () => {
                    const assignVal = getAssignWeight(purchase.id);
                    const workerId = selectedWorkers[purchase.id];
                    if (assignVal <= 0) {
                      alert("Please assign a weight greater than 0");
                      return;
                    }
                    if (!workerId) {
                      alert("Please select a worker");
                      return;
                    }

                    try {
                      setSaving(true);
                      const lostVal = getLostWeight(purchase);
                      const result =
                        await semiExportPurchaseProcessingAPI.create({
                          semiExportPurchaseId: purchase.id,
                          workerId: parseInt(workerId),
                          assignWeight: assignVal,
                          lostWeight: lostVal,
                        });

                      setProcessingList((prev) => [result, ...prev]);
                      alert("Assigned to sorting successfully");

                      // Clear selection for this card
                      setAssignWeights((prev) => {
                        const next = { ...prev };
                        delete next[purchase.id];
                        return next;
                      });
                      setSelectedWorkers((prev) => {
                        const next = { ...prev };
                        delete next[purchase.id];
                        return next;
                      });
                    } catch (error) {
                      console.error("Failed to assign:", error);
                      alert("Failed to assign to sorting");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  style={{ marginTop: "12px" }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="rf-spin" size={16} /> Assigning...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Assign to Sorting
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Right Main Content */}
      <main className="rf-main">
        <div className="rf-main-card">
          <div className="rf-section-header" style={{ marginBottom: "20px" }}>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#0f172a",
                margin: 0,
              }}
            >
              Sorting Records
            </h2>
          </div>

          {processingLoading ? (
            <div
              style={{ padding: "24px", color: "#94a3b8", textAlign: "center" }}
            >
              Loading sorting records...
            </div>
          ) : processingList.length === 0 ? (
            <div
              style={{ padding: "24px", color: "#94a3b8", textAlign: "center" }}
            >
              <Package
                size={40}
                style={{
                  color: "#cbd5e1",
                  marginBottom: "16px",
                  display: "inline-block",
                }}
              />
              <p>No sorting records found</p>
            </div>
          ) : (
            <div
              className="table-responsive"
              style={{ overflowX: "auto", borderRadius: "8px" }}
            >
              <table
                className="table"
                style={{ width: "100%", borderCollapse: "collapse" }}
              >
                <thead style={{ background: "#f8fafc" }}>
                  <tr>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#64748b",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      Customer
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#64748b",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      Contact
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#64748b",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      Color
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#64748b",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      Receive DateTime
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#64748b",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      Worker
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#64748b",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      Assign weight
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "right",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#64748b",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      Lost weight
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#64748b",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      Assign Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {processingList.map((item) => (
                    <tr
                      key={item.id}
                      className="sep-sorting-record-row"
                      onClick={() => openSortingRecordsModal(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openSortingRecordsModal(item);
                        }
                      }}
                      title="Open sorting record details"
                    >
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "13px",
                          color: "#0f172a",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        {item.customerName}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "13px",
                          color: "#64748b",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        {item.contact}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "13px",
                          color: "#64748b",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        {item.color}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "12px",
                          color: "#64748b",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        {formatDateTime(item.receiveDateTime)}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "13px",
                          color: "#0f172a",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        {item.workerName}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "13px",
                          color: "#2563eb",
                          fontWeight: "600",
                          textAlign: "right",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        {item.assignWeight.toFixed(3)}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "13px",
                          color: item.lostWeight > 0 ? "#ef4444" : "#64748b",
                          fontWeight: "600",
                          textAlign: "right",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        {item.lostWeight.toFixed(3)}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontSize: "12px",
                          color: "#94a3b8",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        {formatDateTime(item.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "32px",
              width: "90%",
              maxWidth: "500px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                Create Purchase Order
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#0f172a",
                    marginBottom: "8px",
                  }}
                >
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="Enter customer name"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#0f172a",
                    marginBottom: "8px",
                  }}
                >
                  Contact
                </label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  placeholder="Enter contact number or email"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#0f172a",
                    marginBottom: "8px",
                  }}
                >
                  Total Receive Weight (viss)
                </label>
                <input
                  type="number"
                  name="totalReceiveWeight"
                  value={formData.totalReceiveWeight}
                  onChange={handleInputChange}
                  placeholder="0.000"
                  step="0.001"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#0f172a",
                    marginBottom: "8px",
                  }}
                >
                  Receive DateTime
                </label>
                <input
                  type="datetime-local"
                  name="receiveDateTime"
                  value={formData.receiveDateTime}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#0f172a",
                    marginBottom: "8px",
                  }}
                >
                  Color *
                </label>
                <select
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  {colorCategories.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "1.5px solid #e2e8f0",
                    background: "white",
                    color: "#0f172a",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    background: saving
                      ? "#cbd5e1"
                      : "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
                    color: "white",
                    fontWeight: "600",
                    cursor: saving ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSortingRecordsModal && selectedSortingRecord && (
        <div
          className="sep-sorting-modal-overlay"
          onClick={closeSortingRecordsModal}
        >
          <div
            className="sep-sorting-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="sep-sorting-modal-close"
              onClick={closeSortingRecordsModal}
              title="Close"
            >
              <X size={18} />
            </button>

            <div className="sep-record-summary">
              <div className="sep-record-summary-main">
                <span className="sep-record-eyebrow">Sorting Record</span>
                <h3>{selectedSortingRecord.customerName}</h3>
              </div>
              <div className="sep-record-summary-grid">
                <div>
                  <span>Contact</span>
                  <strong>{selectedSortingRecord.contact || "---"}</strong>
                </div>
                <div>
                  <span>Color</span>
                  <strong>{selectedSortingRecord.color || "---"}</strong>
                </div>
                <div>
                  <span>Receive DateTime</span>
                  <strong>
                    {formatDateTime(selectedSortingRecord.receiveDateTime)}
                  </strong>
                </div>
                <div>
                  <span>Assign Weight</span>
                  <strong>
                    {selectedSortingRecord.assignWeight.toFixed(3)} viss
                  </strong>
                </div>
                <div>
                  <span>Lost Weight</span>
                  <strong
                    className={
                      selectedSortingRecord.lostWeight > 0
                        ? "sep-record-loss"
                        : ""
                    }
                  >
                    {selectedSortingRecord.lostWeight.toFixed(3)} viss
                  </strong>
                </div>
              </div>
            </div>

            <div className="sep-rate-panel">
              <label htmlFor="sep-sorting-rate">CNY to MMK Rate:</label>
              <input
                id="sep-sorting-rate"
                type="number"
                value={sortingExchangeRate}
                readOnly
                title="Active CNY to MMK rate from ExchangeRates"
              />
              <span>MMK</span>
            </div>

            <section className="sep-size-section">
              <h3>Color Categories &amp; Sizes</h3>

              <div className="sep-size-card">
                <div className="sep-size-card-header">
                  <button type="button" onClick={handleSortingSaveAndPrint}>
                    Save and Print
                  </button>
                </div>

                <div className="sep-size-table-wrap">
                  <table className="sep-size-table">
                    <thead>
                      <tr>
                        <th>SIZE</th>
                        <th>WEIGHT (VISS)</th>
                        <th>PRICE (CNY)</th>
                        <th className="sep-num">AMOUNT (CNY)</th>
                        <th className="sep-num sep-mmk-col">AMOUNT (MMK)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortingSizes.map((row) => {
                        const amountCny = getSortingAmount(row);
                        const amountMmk =
                          amountCny * (parseFloat(sortingExchangeRate) || 0);
                        const isSpecial = [
                          "Return",
                          "Spoilage",
                          "Lost",
                        ].includes(row.size);

                        return (
                          <tr key={row.size}>
                            <td className={isSpecial ? "sep-special-size" : ""}>
                              {formatSortingSize(row.size)}
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.001"
                                placeholder="0.000"
                                value={row.weight}
                                disabled={row.size === "Lost"}
                                onChange={(e) =>
                                  updateSortingSize(
                                    row.size,
                                    "weight",
                                    e.target.value,
                                  )
                                }
                              />
                            </td>
                            <td>
                              {row.size !== "Lost" && (
                                <input
                                  type="number"
                                  value={row.price}
                                  onChange={(e) =>
                                    updateSortingSize(
                                      row.size,
                                      "price",
                                      e.target.value,
                                    )
                                  }
                                />
                              )}
                            </td>
                            <td className="sep-num">
                              {row.size === "Lost"
                                ? ""
                                : amountCny.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                            </td>
                            <td className="sep-num sep-mmk-col">
                              {row.size === "Lost"
                                ? ""
                                : amountMmk.toLocaleString(undefined, {
                                    maximumFractionDigits: 0,
                                  })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default SemiExportPurchase;
