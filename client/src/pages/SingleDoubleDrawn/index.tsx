import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLongPoll } from "../../hooks/useLongPoll";
import { singleDoubleDrawnAPI, workersAPI } from "../../services/api";
import type {
  AvailableRefinedStock,
  SingleDoubleDrawnProcess,
  SingleDoubleDrawnRecord,
  SingleDoubleDrawnWorker,
} from "../../types";
import {
  Package,
  Search,
  Sparkles,
  Send,
  Scissors,
  Trash2,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { formatDateTime } from "../../utils/format";
import "./index.css";

// Helper: calculate total CNY amount of a SingleDoubleDrawnRecord (sum of weight * price for all sizes)
const calculateRecordTotalAmount = (r: SingleDoubleDrawnRecord): number =>
  r.size6 * (r.price6 ?? 0) +
  r.size7 * (r.price7 ?? 0) +
  r.size8 * (r.price8 ?? 0) +
  r.size9 * (r.price9 ?? 0) +
  r.size10 * (r.price10 ?? 0) +
  r.size10B * (r.price10B ?? 0) +
  r.size12 * (r.price12 ?? 0) +
  r.size14 * (r.price14 ?? 0) +
  r.size16 * (r.price16 ?? 0) +
  r.size18 * (r.price18 ?? 0) +
  r.size20 * (r.price20 ?? 0) +
  r.size22 * (r.price22 ?? 0) +
  r.size24 * (r.price24 ?? 0) +
  r.size26 * (r.price26 ?? 0) +
  r.size28 * (r.price28 ?? 0) +
  r.sizeBar * (r.priceBar ?? 0) +
  (r.spoilageSize ?? 0) * (r.priceSpoilageSize ?? 0) +
  (r.returnSize ?? 0) * (r.priceReturnSize ?? 0);

const renderTwoInchesBadges = (record: SingleDoubleDrawnRecord) => {
  const sizes = [
    { label: '6"', val: record.size6, price: record.price6 },
    { label: '7"', val: record.size7, price: record.price7 },
    { label: '8"', val: record.size8, price: record.price8 },
    { label: '9"', val: record.size9, price: record.price9 },
    { label: '10"', val: record.size10, price: record.price10 },
    {
      label: "Spoilage",
      val: record.spoilageSize ?? 0,
      price: record.priceSpoilageSize ?? 0,
      isSpecial: true,
      color: "#ea580c",
      bg: "#fff7ed",
    },
    {
      label: "Return",
      val: record.returnSize ?? 0,
      price: record.priceReturnSize ?? 0,
      isSpecial: true,
      color: "#2563eb",
      bg: "#eff6ff",
    },
  ];

  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      {sizes.map(
        (s) =>
          s.val > 0 && (
            <span
              key={s.label}
              style={{
                background: (s as any).bg ?? "#eff6ff",
                color: (s as any).color ?? "#2563eb",
                padding: "3px 8px",
                borderRadius: "6px",
                fontSize: "11.5px",
                fontWeight: "700",
              }}
            >
              {s.label}: {s.val.toFixed(3)} viss @{" "}
              {(s.price ?? 0).toLocaleString()} CNY
            </span>
          ),
      )}
    </div>
  );
};

const renderBToTenBadges = (record: SingleDoubleDrawnRecord) => {
  const sizes = [
    { label: "10B", val: record.size10B, price: record.price10B },
    { label: '12"', val: record.size12, price: record.price12 },
    { label: '14"', val: record.size14, price: record.price14 },
    { label: '16"', val: record.size16, price: record.price16 },
    { label: '18"', val: record.size18, price: record.price18 },
    { label: '20"', val: record.size20, price: record.price20 },
    { label: '22"', val: record.size22, price: record.price22 },
    { label: '24"', val: record.size24, price: record.price24 },
    { label: '26"', val: record.size26, price: record.price26 },
    { label: '28"', val: record.size28, price: record.price28 },
    { label: "Bar", val: record.sizeBar, price: record.priceBar },
  ];

  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      {sizes.map(
        (s) =>
          s.val > 0 && (
            <span
              key={s.label}
              style={{
                background: "#faf5ff",
                color: "#8b5cf6",
                padding: "3px 8px",
                borderRadius: "6px",
                fontSize: "11.5px",
                fontWeight: "700",
              }}
            >
              {s.label}: {s.val.toFixed(3)} viss @{" "}
              {(s.price ?? 0).toLocaleString()} CNY
            </span>
          ),
      )}
    </div>
  );
};

const SingleDoubleDrawn: React.FC = () => {
  const { hasPermission } = useAuth();
  const [availableStock, setAvailableStock] = useState<AvailableRefinedStock[]>(
    [],
  );
  const [processes, setProcesses] = useState<SingleDoubleDrawnProcess[]>([]);
  const [savedRecords, setSavedRecords] = useState<SingleDoubleDrawnRecord[]>(
    [],
  );
  const [workers, setWorkers] = useState<SingleDoubleDrawnWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);

  // Sidebar inputs
  const [selectedWorkers, setSelectedWorkers] = useState<
    Record<string, number>
  >({});
  const [inputWeights, setInputWeights] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");

  // Tabs
  const [activeTab, setActiveTab] = useState<"processing" | "history">(
    "processing",
  );
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historyFromDate, setHistoryFromDate] = useState("");
  const [historyToDate, setHistoryToDate] = useState("");

  // Modal Sorting state
  const [showModal, setShowModal] = useState(false);
  const [selectedProcess, setSelectedProcess] =
    useState<SingleDoubleDrawnProcess | null>(null);
  const [savingRecord, setSavingRecord] = useState(false);
  const [formError, setFormError] = useState("");

  // Modal Form Inputs
  const [twoInchesForm, setTwoInchesForm] = useState({
    size6: "",
    size7: "",
    size8: "",
    size9: "",
    size10: "",
  });

  const [twoInchesPricesForm, setTwoInchesPricesForm] = useState({
    price6: "",
    price7: "",
    price8: "",
    price9: "",
    price10: "",
  });

  const [bToTenForm, setBToTenForm] = useState({
    size10B: "",
    size12: "",
    size14: "",
    size16: "",
    size18: "",
    size20: "",
    size22: "",
    size24: "",
    size26: "",
    size28: "",
    sizeBar: "",
  });

  const [bToTenPricesForm, setBToTenPricesForm] = useState({
    price10B: "",
    price12: "",
    price14: "",
    price16: "",
    price18: "",
    price20: "",
    price22: "",
    price24: "",
    price26: "",
    price28: "",
    priceBar: "",
  });

  const [spoilageSizeWeight, setSpoilageSizeWeight] = useState("");
  const [spoilageSizePrice, setSpoilageSizePrice] = useState("");
  const [returnSizeWeight, setReturnSizeWeight] = useState("");
  const [returnSizePrice, setReturnSizePrice] = useState("");
  const [singleDoubleLostWeight, setSingleDoubleLostWeight] = useState("");
  const [modalWorkerId, setModalWorkerId] = useState("");
  const [modalWorkerFees, setModalWorkerFees] = useState("");
  const [modalNote, setModalNote] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [stockData, processesData, savedData, workersData] =
        await Promise.all([
          singleDoubleDrawnAPI.getAvailableRefinedStock(),
          singleDoubleDrawnAPI.getProcesses(),
          singleDoubleDrawnAPI.getAll(),
          workersAPI.getSingleDoubleDrawnWorkers(),
        ]);
      setAvailableStock(stockData);
      setProcesses(processesData);
      setSavedRecords(savedData);
      setWorkers(workersData);
    } catch (error) {
      console.error("Failed to load SingleDoubleDrawn data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useLongPoll(loadData);

  // Active processes that are not yet sorted/saved
  const activeProcesses = useMemo(() => {
    return processes.filter(
      (p) =>
        p.remainingWeight > 0.001 &&
        !savedRecords.some((r) => r.singleDoubleDrawnProcessId === p.id),
    );
  }, [processes, savedRecords]);

  // Sidebar Filter
  const filteredStock = useMemo(() => {
    return availableStock.filter((s) => {
      const term = searchTerm.toLowerCase();
      return (
        s.productMarker.toLowerCase().includes(term) ||
        (s.category || "").toLowerCase().includes(term) ||
        (s.warehouseName || "").toLowerCase().includes(term)
      );
    });
  }, [availableStock, searchTerm]);

  // History Filter
  const filteredSavedRecords = useMemo(() => {
    return savedRecords.filter((r) => {
      const term = historySearchTerm.toLowerCase();
      const marker = (r.refinementRecordMarker || "").toLowerCase();
      const cat = (r.refinementRecordCategory || "").toLowerCase();
      if (term && !marker.includes(term) && !cat.includes(term)) return false;
      if (historyFromDate) {
        const d = new Date(r.date.split("T")[0]);
        if (d < new Date(historyFromDate)) return false;
      }
      if (historyToDate) {
        const d = new Date(r.date.split("T")[0]);
        if (d > new Date(historyToDate)) return false;
      }
      return true;
    });
  }, [savedRecords, historySearchTerm, historyFromDate, historyToDate]);

  // Sidebar card inline assign
  const handleAssignToProcess = async (avail: AvailableRefinedStock) => {
    const key = `${avail.refinementRecordId}`;
    const workerIdVal = selectedWorkers[key];
    if (!workerIdVal) {
      alert("Please select a Single & Double worker before assigning.");
      return;
    }

    const weightVal = parseFloat(inputWeights[key] || "0");
    if (!weightVal || weightVal <= 0) {
      alert("Please enter a valid weight to assign.");
      return;
    }
    if (weightVal > avail.remainingWeight + 0.001) {
      alert(
        `Entered weight (${weightVal} viss) exceeds available remaining weight (${avail.remainingWeight.toFixed(3)} viss).`,
      );
      return;
    }

    try {
      setSubmittingKey(key);
      await singleDoubleDrawnAPI.createProcess({
        refinementRecordId: avail.refinementRecordId,
        weight: weightVal,
        workerId: workerIdVal,
        workerFees: 0,
      });

      setInputWeights((prev) => ({ ...prev, [key]: "" }));
      await loadData();
      setActiveTab("processing");
    } catch (err: any) {
      console.error("Failed to assign refinement stock:", err);
      const msg =
        err.response?.data?.message || "Failed to assign refined stock.";
      alert(msg);
    } finally {
      setSubmittingKey(null);
    }
  };

  // Open Sorting Modal for a process
  const handleOpenProcessModal = (process: SingleDoubleDrawnProcess) => {
    setSelectedProcess(process);
    setFormError("");
    setTwoInchesForm({
      size6: "",
      size7: "",
      size8: "",
      size9: "",
      size10: "",
    });
    setTwoInchesPricesForm({
      price6: "",
      price7: "",
      price8: "",
      price9: "",
      price10: "",
    });
    setBToTenForm({
      size10B: "",
      size12: "",
      size14: "",
      size16: "",
      size18: "",
      size20: "",
      size22: "",
      size24: "",
      size26: "",
      size28: "",
      sizeBar: "",
    });
    setBToTenPricesForm({
      price10B: "",
      price12: "",
      price14: "",
      price16: "",
      price18: "",
      price20: "",
      price22: "",
      price24: "",
      price26: "",
      price28: "",
      priceBar: "",
    });
    setSpoilageSizeWeight("");
    setSpoilageSizePrice("");
    setReturnSizeWeight("");
    setReturnSizePrice("");
    setSingleDoubleLostWeight("");
    setModalWorkerId(process.workerId ? process.workerId.toString() : "");
    setModalWorkerFees(process.workerFees ? process.workerFees.toString() : "");
    setModalNote("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProcess(null);
    setFormError("");
  };

  // Real-time current modal form totals
  const currentModalFormTotal = useMemo(() => {
    const twoInchesTotal = Object.values(twoInchesForm).reduce(
      (sum, v) => sum + (parseFloat(v) || 0),
      0,
    );
    const bToTenTotal = Object.values(bToTenForm).reduce(
      (sum, v) => sum + (parseFloat(v) || 0),
      0,
    );
    const spoilageVal = parseFloat(spoilageSizeWeight) || 0;
    const returnVal = parseFloat(returnSizeWeight) || 0;
    return twoInchesTotal + bToTenTotal + spoilageVal + returnVal;
  }, [twoInchesForm, bToTenForm, spoilageSizeWeight, returnSizeWeight]);

  const modalRemainingWeight = useMemo(() => {
    if (!selectedProcess) return 0;
    const lostWeightVal = parseFloat(singleDoubleLostWeight) || 0;
    return (
      selectedProcess.remainingWeight - currentModalFormTotal - lostWeightVal
    );
  }, [selectedProcess, currentModalFormTotal, singleDoubleLostWeight]);

  const totalModalFormAmount = useMemo(() => {
    let total = 0;
    ["6", "7", "8", "9", "10"].forEach((size) => {
      const w =
        parseFloat(
          twoInchesForm[`size${size}` as keyof typeof twoInchesForm],
        ) || 0;
      const p =
        parseFloat(
          twoInchesPricesForm[
            `price${size}` as keyof typeof twoInchesPricesForm
          ],
        ) || 0;
      total += w * p;
    });
    [
      "10B",
      "12",
      "14",
      "16",
      "18",
      "20",
      "22",
      "24",
      "26",
      "28",
      "Bar",
    ].forEach((size) => {
      const fieldName =
        size === "10B" ? "size10B" : size === "Bar" ? "sizeBar" : `size${size}`;
      const priceFieldName =
        size === "10B"
          ? "price10B"
          : size === "Bar"
            ? "priceBar"
            : `price${size}`;
      const w =
        parseFloat(bToTenForm[fieldName as keyof typeof bToTenForm]) || 0;
      const p =
        parseFloat(
          bToTenPricesForm[priceFieldName as keyof typeof bToTenPricesForm],
        ) || 0;
      total += w * p;
    });
    total +=
      (parseFloat(spoilageSizeWeight) || 0) *
      (parseFloat(spoilageSizePrice) || 0);
    total +=
      (parseFloat(returnSizeWeight) || 0) * (parseFloat(returnSizePrice) || 0);
    return total;
  }, [
    twoInchesForm,
    twoInchesPricesForm,
    bToTenForm,
    bToTenPricesForm,
    spoilageSizeWeight,
    spoilageSizePrice,
    returnSizeWeight,
    returnSizePrice,
  ]);

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!selectedProcess) return;

    if (currentModalFormTotal <= 0) {
      setFormError("Please enter at least one size weight value.");
      return;
    }

    if (!modalWorkerId || parseInt(modalWorkerId) <= 0) {
      setFormError(
        "Single & Double worker is required. Please select a worker.",
      );
      return;
    }

    if (Math.abs(modalRemainingWeight) > 0.001) {
      setFormError(
        `Total sizes + lost weight must equal batch remaining weight. Remaining difference: ${modalRemainingWeight.toFixed(3)} viss`,
      );
      return;
    }

    // Validate prices
    let priceMissing = false;
    let missingSize = "";

    ["6", "7", "8", "9", "10"].forEach((size) => {
      const wVal =
        parseFloat(
          twoInchesForm[`size${size}` as keyof typeof twoInchesForm],
        ) || 0;
      const pVal =
        parseFloat(
          twoInchesPricesForm[
            `price${size}` as keyof typeof twoInchesPricesForm
          ],
        ) || 0;
      if (wVal > 0 && pVal < 0) {
        priceMissing = true;
        missingSize = `Size ${size}`;
      }
    });

    if (
      (parseFloat(spoilageSizeWeight) || 0) > 0 &&
      (parseFloat(spoilageSizePrice) || 0) < 0
    ) {
      priceMissing = true;
      missingSize = "Spoilage";
    }
    if (
      (parseFloat(returnSizeWeight) || 0) > 0 &&
      (parseFloat(returnSizePrice) || 0) < 0
    ) {
      priceMissing = true;
      missingSize = "Return";
    }

    [
      "10B",
      "12",
      "14",
      "16",
      "18",
      "20",
      "22",
      "24",
      "26",
      "28",
      "Bar",
    ].forEach((size) => {
      const fieldName =
        size === "10B" ? "size10B" : size === "Bar" ? "sizeBar" : `size${size}`;
      const priceFieldName =
        size === "10B"
          ? "price10B"
          : size === "Bar"
            ? "priceBar"
            : `price${size}`;
      const wVal =
        parseFloat(bToTenForm[fieldName as keyof typeof bToTenForm]) || 0;
      const pVal =
        parseFloat(
          bToTenPricesForm[priceFieldName as keyof typeof bToTenPricesForm],
        ) || 0;
      if (wVal > 0 && pVal <= 0) {
        priceMissing = true;
        missingSize = size === "Bar" ? "Size Bar" : `Size ${size}`;
      }
    });

    if (priceMissing) {
      setFormError(
        `Price is required for ${missingSize} because a weight has been entered.`,
      );
      return;
    }

    try {
      setSavingRecord(true);
      const dto = {
        date: new Date().toISOString(),
        refinementRecordId: selectedProcess.refinementRecordId,
        singleDoubleDrawnProcessId: selectedProcess.id,

        // Two Inches Weights
        size6: parseFloat(twoInchesForm.size6) || 0,
        size7: parseFloat(twoInchesForm.size7) || 0,
        size8: parseFloat(twoInchesForm.size8) || 0,
        size9: parseFloat(twoInchesForm.size9) || 0,
        size10: parseFloat(twoInchesForm.size10) || 0,

        // Two Inches Prices
        price6: parseFloat(twoInchesPricesForm.price6) || 0,
        price7: parseFloat(twoInchesPricesForm.price7) || 0,
        price8: parseFloat(twoInchesPricesForm.price8) || 0,
        price9: parseFloat(twoInchesPricesForm.price9) || 0,
        price10: parseFloat(twoInchesPricesForm.price10) || 0,

        // B to Ten Weights
        size10B: parseFloat(bToTenForm.size10B) || 0,
        size12: parseFloat(bToTenForm.size12) || 0,
        size14: parseFloat(bToTenForm.size14) || 0,
        size16: parseFloat(bToTenForm.size16) || 0,
        size18: parseFloat(bToTenForm.size18) || 0,
        size20: parseFloat(bToTenForm.size20) || 0,
        size22: parseFloat(bToTenForm.size22) || 0,
        size24: parseFloat(bToTenForm.size24) || 0,
        size26: parseFloat(bToTenForm.size26) || 0,
        size28: parseFloat(bToTenForm.size28) || 0,
        sizeBar: parseFloat(bToTenForm.sizeBar) || 0,

        // B to Ten Prices
        price10B: parseFloat(bToTenPricesForm.price10B) || 0,
        price12: parseFloat(bToTenPricesForm.price12) || 0,
        price14: parseFloat(bToTenPricesForm.price14) || 0,
        price16: parseFloat(bToTenPricesForm.price16) || 0,
        price18: parseFloat(bToTenPricesForm.price18) || 0,
        price20: parseFloat(bToTenPricesForm.price20) || 0,
        price22: parseFloat(bToTenPricesForm.price22) || 0,
        price24: parseFloat(bToTenPricesForm.price24) || 0,
        price26: parseFloat(bToTenPricesForm.price26) || 0,
        price28: parseFloat(bToTenPricesForm.price28) || 0,
        priceBar: parseFloat(bToTenPricesForm.priceBar) || 0,

        lostWeight: selectedProcess.lostWeight || 0,
        spoilageWeight: selectedProcess.spoilageWeight || 0,
        returnWeight: selectedProcess.returnWeight || 0,
        singleDoubleLostWeight: parseFloat(singleDoubleLostWeight) || 0,
        workerId: modalWorkerId ? parseInt(modalWorkerId) : undefined,
        workerFees: parseFloat(modalWorkerFees) || 0,
        note: modalNote,

        spoilageSize: parseFloat(spoilageSizeWeight) || 0,
        returnSize: parseFloat(returnSizeWeight) || 0,
        priceSpoilageSize: parseFloat(spoilageSizePrice) || 0,
        priceReturnSize: parseFloat(returnSizePrice) || 0,
      };

      await singleDoubleDrawnAPI.create(dto);
      handleCloseModal();
      await loadData();
    } catch (error: any) {
      console.error("Failed to save sorting record:", error);
      const serverMessage = error.response?.data?.message;
      setFormError(serverMessage || "Failed to save record. Please try again.");
    } finally {
      setSavingRecord(false);
    }
  };

  const handleDeleteProcess = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this assigned sorting batch?",
      )
    )
      return;
    try {
      await singleDoubleDrawnAPI.deleteProcess(id);
      await loadData();
    } catch (err: any) {
      console.error("Failed to delete process:", err);
      const msg = err.response?.data?.message || "Failed to delete process";
      alert(msg);
    }
  };

  const handleDeleteRecord = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await singleDoubleDrawnAPI.delete(id);
      await loadData();
    } catch (error) {
      console.error("Failed to delete record:", error);
      alert("Failed to delete record");
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div className="sdd-container fade-in">
      {/* Hero Header */}
      <div className="sdd-hero">
        <div className="sdd-hero-left">
          <div className="sdd-hero-icon">
            <Sparkles size={30} strokeWidth={1.8} />
          </div>
          <div className="sdd-hero-text">
            <h1>Single &amp; Double Drawn</h1>
            <p>
              Assign refined stock to workers, categorize sizes, and track
              sorting output
            </p>
          </div>
        </div>
        <div className="sdd-hero-right">
          <div className="sdd-stat-pill">
            <span className="stat-num">{activeProcesses.length}</span>
            <span className="stat-label">
              {activeProcesses.length === 1 ? "Active Batch" : "Active Batches"}
            </span>
          </div>
          <div className="sdd-stat-pill">
            <span className="stat-num">{savedRecords.length}</span>
            <span className="stat-label">
              {savedRecords.length === 1 ? "Record" : "Records"}
            </span>
          </div>
        </div>
      </div>

      <div className="sdd-layout">
        {/* ── LEFT SIDEBAR: Refined Stock List (rf-bag-card design) ── */}
        <aside className="rf-sidebar">
          <div className="rf-sidebar-header">
            <Package size={18} />
            <span>Refined Stock</span>
          </div>

          <div className="rf-search-box">
            <Search size={16} className="rf-search-icon" />
            <input
              type="text"
              placeholder="Search marker, category, warehouse..."
              className="rf-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="rf-card-list">
            {filteredStock.length === 0 ? (
              <div className="rf-empty-sidebar">No refined stock available</div>
            ) : (
              filteredStock.map((avail) => {
                const key = `${avail.refinementRecordId}`;
                const isSubmitting = submittingKey === key;
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
                        className={`rf-badge category-${(avail.category || "").toLowerCase().replace(/[\s.]+/g, "-")}`}
                      >
                        {avail.category}
                      </span>
                    </div>

                    {/* Stats Row */}
                    <div className="rf-stats-row">
                      <div className="rf-stat">
                        <span className="rf-stat-label">Available</span>
                        <span className="rf-stat-value rf-stat-blue">
                          {avail.remainingWeight.toFixed(3)}{" "}
                          <span className="rf-stat-unit">viss</span>
                        </span>
                      </div>
                      <div className="rf-stat rf-stat-right">
                        <span className="rf-stat-label">Output</span>
                        <span className="rf-stat-value">
                          {avail.outputWeight.toFixed(3)}{" "}
                          <span className="rf-stat-unit">viss</span>
                        </span>
                      </div>
                    </div>

                    {/* Single & Double Drawn Worker Select */}
                    <div className="rf-worker-select-wrap">
                      <label className="rf-field-label">
                        Single &amp; Double Worker{" "}
                        <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <select
                        className="rf-select"
                        value={selectedWorkers[key] || ""}
                        onChange={(e) => {
                          const val = e.target.value
                            ? parseInt(e.target.value)
                            : 0;
                          setSelectedWorkers((prev) => ({
                            ...prev,
                            [key]: val,
                          }));
                        }}
                      >
                        <option value="">-- Select Worker --</option>
                        {workers
                          .filter(
                            (w) =>
                              !avail.warehouseId ||
                              w.warehouseId === avail.warehouseId,
                          )
                          .map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Weight Input + Max Button */}
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
                        placeholder="Weight (viss)"
                        className="rf-select"
                        style={{ flex: 1, minWidth: 0, cursor: "text" }}
                        value={inputWeights[key] || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInputWeights((prev) => ({ ...prev, [key]: val }));
                        }}
                        min="0"
                        step="0.001"
                        max={avail.remainingWeight}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setInputWeights((prev) => ({
                            ...prev,
                            [key]: avail.remainingWeight.toFixed(3),
                          }));
                        }}
                        className="rf-max-btn"
                      >
                        Max
                      </button>
                    </div>

                    {/* Assign Button */}
                    {hasPermission("SingleDoubleDrawn.Create") && (
                      <button
                        className="rf-assign-btn"
                        onClick={() => handleAssignToProcess(avail)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="rf-spin" size={16} />{" "}
                            Assigning...
                          </>
                        ) : (
                          <>
                            <Send size={16} /> Assign to Sort
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ── RIGHT MAIN CONTENT ── */}
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
                    className={`rf-tab ${activeTab === "processing" ? "rf-tab-active rf-tab-orange" : ""}`}
                    onClick={() => setActiveTab("processing")}
                  >
                    <span className="rf-tab-title">Processing</span>
                    <span className="rf-tab-sub">
                      Active sorting batches ({activeProcesses.length})
                    </span>
                  </button>
                  <button
                    className={`rf-tab ${activeTab === "history" ? "rf-tab-active rf-tab-blue" : ""}`}
                    onClick={() => setActiveTab("history")}
                  >
                    <span className="rf-tab-title">Sorting History</span>
                    <span className="rf-tab-sub">
                      Completed sorting records ({savedRecords.length})
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div
              className="rf-main-content"
              style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}
            >
              {activeTab === "processing" ? (
                /* ── PROCESSING TAB: List of active assigned batches ── */
                <div>
                  <div style={{ marginBottom: "16px" }}>
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: "800",
                        color: "#0f172a",
                        margin: 0,
                      }}
                    >
                      Active Sorting Batches
                    </h3>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#64748b",
                        margin: "4px 0 0 0",
                      }}
                    >
                      Assigned refined stock waiting to be processed into Single
                      &amp; Double sizes. Click <strong>Process / Sort</strong>{" "}
                      to open sorting form.
                    </p>
                  </div>

                  <div className="rf-table-wrap">
                    <table className="rf-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Stock Marker</th>
                          <th>Warehouse / Category</th>
                          <th className="rf-th-right">Assigned (viss)</th>
                          <th className="rf-th-right">Remaining (viss)</th>
                          <th>Assigned Worker</th>
                          <th style={{ textAlign: "center" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeProcesses.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="rf-empty-row">
                              <Package size={44} className="rf-empty-icon" />
                              <span>
                                No active sorting batches. Assign a refined
                                stock bag from the sidebar to start sorting.
                              </span>
                            </td>
                          </tr>
                        ) : (
                          activeProcesses.map((proc) => (
                            <tr key={proc.id}>
                              <td className="rf-td-date">
                                {formatDateTime(proc.date)}
                              </td>
                              <td>
                                <span className="rf-marker">
                                  {proc.productMarker}
                                </span>
                              </td>
                              <td>
                                <div className="rf-warehouse">
                                  {proc.warehouseName || "---"} •{" "}
                                  <span
                                    className={`rf-badge category-${(proc.category || "").toLowerCase().replace(/[\s.]+/g, "-")}`}
                                    style={{ marginLeft: "4px" }}
                                  >
                                    {proc.category}
                                  </span>
                                </div>
                              </td>
                              <td className="rf-td-weight rf-th-right">
                                {proc.weight.toFixed(3)} viss
                              </td>
                              <td className="rf-td-weight rf-blue rf-th-right">
                                {proc.remainingWeight.toFixed(3)} viss
                              </td>
                              <td>
                                <span
                                  style={{
                                    fontWeight: "600",
                                    color: "#334155",
                                  }}
                                >
                                  {proc.workerName || "---"}
                                </span>
                              </td>
                              <td>
                                <div
                                  className="rf-actions"
                                  style={{
                                    justifyContent: "center",
                                    gap: "8px",
                                  }}
                                >
                                  {hasPermission(
                                    "SingleDoubleDrawn.Create",
                                  ) && (
                                    <button
                                      className="sdd-process-action-btn"
                                      onClick={() =>
                                        handleOpenProcessModal(proc)
                                      }
                                      title="Open Sorting Form"
                                    >
                                      <Scissors size={14} /> Process / Sort
                                    </button>
                                  )}
                                  {hasPermission(
                                    "SingleDoubleDrawn.Delete",
                                  ) && (
                                    <button
                                      onClick={() =>
                                        handleDeleteProcess(proc.id)
                                      }
                                      className="rf-action-btn rf-delete-btn"
                                      title="Delete Batch"
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
              ) : (
                /* ── HISTORY TAB: All saved SingleDoubleDrawn records ── */
                <div>
                  <div style={{ marginBottom: "16px" }}>
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: "800",
                        color: "#0f172a",
                        margin: 0,
                      }}
                    >
                      Global Sorting History
                    </h3>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#64748b",
                        margin: "4px 0 0 0",
                      }}
                    >
                      All single &amp; double drawn sorting records across all
                      stock items
                    </p>
                  </div>

                  {/* History Filters */}
                  <div className="sdd-table-controls">
                    <div className="sdd-search-box">
                      <Search className="sdd-input-icon" size={16} />
                      <input
                        type="text"
                        className="sdd-search-control"
                        placeholder="Search history..."
                        value={historySearchTerm}
                        onChange={(e) => setHistorySearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="sdd-date-filter">
                      <div className="sdd-date-field">
                        <span className="sdd-date-label">From</span>
                        <input
                          type="date"
                          className="sdd-date-input"
                          value={historyFromDate}
                          onChange={(e) => setHistoryFromDate(e.target.value)}
                        />
                      </div>
                      <div className="sdd-date-field">
                        <span className="sdd-date-label">To</span>
                        <input
                          type="date"
                          className="sdd-date-input"
                          value={historyToDate}
                          onChange={(e) => setHistoryToDate(e.target.value)}
                        />
                      </div>
                      {(historyFromDate || historyToDate) && (
                        <button
                          className="sdd-date-clear-btn"
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

                  <div className="rf-table-wrap">
                    <table className="rf-table">
                      <thead>
                        <tr>
                          <th>Stock Item</th>
                          <th>Date</th>
                          <th>Two Inches Sizes</th>
                          <th>B to Ten Sizes</th>
                          <th>Lost Weight</th>
                          <th>S/D Lost Weight</th>
                          <th>Spoilage Weight</th>
                          <th>Return Weight</th>
                          <th>Worker</th>
                          <th>Note</th>
                          <th>Worker Fees (MMK)</th>
                          <th className="rf-th-right">Total Amount</th>
                          <th style={{ textAlign: "center" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSavedRecords.length === 0 ? (
                          <tr>
                            <td colSpan={13} className="rf-empty-row">
                              <Package size={44} className="rf-empty-icon" />
                              <span>No sorting history recorded.</span>
                            </td>
                          </tr>
                        ) : (
                          filteredSavedRecords.map((record) => (
                            <tr key={record.id}>
                              <td>
                                <div className="rf-marker">
                                  {record.refinementRecordMarker || "---"}
                                </div>
                                <div className="rf-warehouse">
                                  {record.refinementRecordWarehouseName ||
                                    "---"}{" "}
                                  • {record.refinementRecordCategory || "---"}
                                </div>
                              </td>
                              <td className="rf-td-date">
                                {formatDateTime(record.date)}
                              </td>
                              <td>{renderTwoInchesBadges(record)}</td>
                              <td>{renderBToTenBadges(record)}</td>
                              <td
                                style={{ color: "#64748b", fontWeight: "600" }}
                              >
                                {record.lostWeight
                                  ? record.lostWeight.toFixed(3)
                                  : "0.000"}{" "}
                                viss
                              </td>
                              <td
                                style={{ color: "#ea580c", fontWeight: "600" }}
                              >
                                {record.singleDoubleLostWeight
                                  ? record.singleDoubleLostWeight.toFixed(3)
                                  : "0.000"}{" "}
                                viss
                              </td>
                              <td
                                style={{ color: "#ea580c", fontWeight: "600" }}
                              >
                                {record.spoilageWeight
                                  ? record.spoilageWeight.toFixed(3)
                                  : "0.000"}{" "}
                                viss
                              </td>
                              <td
                                style={{ color: "#2563eb", fontWeight: "600" }}
                              >
                                {record.returnWeight
                                  ? record.returnWeight.toFixed(3)
                                  : "0.000"}{" "}
                                viss
                              </td>
                              <td
                                style={{ color: "#334155", fontWeight: "500" }}
                              >
                                {record.workerName || "---"}
                              </td>
                              <td
                                style={{ color: "#64748b", maxWidth: "150px" }}
                              >
                                <div
                                  style={{
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                  title={record.note}
                                >
                                  {record.note || "---"}
                                </div>
                              </td>
                              <td
                                style={{ color: "#0f172a", fontWeight: "600" }}
                              >
                                {record.workerFees?.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }) || "0.00"}
                              </td>
                              <td className="rf-td-weight rf-green rf-th-right">
                                {calculateRecordTotalAmount(
                                  record,
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                CNY
                              </td>
                              <td>
                                <div
                                  className="rf-actions"
                                  style={{ justifyContent: "center" }}
                                >
                                  {hasPermission(
                                    "SingleDoubleDrawn.Delete",
                                  ) && (
                                    <button
                                      onClick={() =>
                                        handleDeleteRecord(record.id)
                                      }
                                      className="rf-action-btn rf-delete-btn"
                                      disabled={record.isLocked}
                                      style={{
                                        cursor: record.isLocked
                                          ? "not-allowed"
                                          : "pointer",
                                      }}
                                      title={
                                        record.isLocked
                                          ? "Record is locked by Export"
                                          : "Delete Record"
                                      }
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
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ── POPUP MODAL BOX: Full Sorting Form ── */}
      {showModal && selectedProcess && (
        <div className="sdd-modal-overlay" onClick={handleCloseModal}>
          <div
            className="sdd-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sdd-modal-header">
              <div className="sdd-modal-header-left">
                <div className="sdd-modal-icon">
                  <Scissors size={22} />
                </div>
                <div>
                  <div className="sdd-modal-pre">
                    <span>Batch Sorting Mode</span>
                    <span className="sdd-modal-pill-tag">
                      Single &amp; Double
                    </span>
                  </div>
                  <h2 className="sdd-modal-title">
                    <span className="sdd-modal-marker-text">
                      {selectedProcess.productMarker}
                    </span>
                    <span className="sdd-modal-badge sdd-badge-wh">
                      {selectedProcess.warehouseName}
                    </span>
                    <span className="sdd-modal-badge sdd-badge-cat">
                      {selectedProcess.category}
                    </span>
                  </h2>
                </div>
              </div>
              <button
                className="sdd-modal-close"
                onClick={handleCloseModal}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Info Bar */}
            <div className="sdd-modal-info-bar">
              <div className="sdd-modal-chip">
                <span className="sdd-chip-label">Batch Weight</span>
                <span className="sdd-chip-value">
                  {selectedProcess.weight.toFixed(3)} <em>viss</em>
                </span>
              </div>
              <div className="sdd-modal-chip sdd-chip-accent">
                <span className="sdd-chip-label">Remaining To Sort</span>
                <span className="sdd-chip-value sdd-chip-blue">
                  {selectedProcess.remainingWeight.toFixed(3)} <em>viss</em>
                </span>
              </div>
              <div className="sdd-modal-chip">
                <span className="sdd-chip-label">Refined Lost</span>
                <span className="sdd-chip-value sdd-chip-muted">
                  {selectedProcess.lostWeight.toFixed(3)} <em>viss</em>
                </span>
              </div>
              <div className="sdd-modal-chip">
                <span className="sdd-chip-label">Spoilage Weight</span>
                <span className="sdd-chip-value sdd-chip-orange">
                  {selectedProcess.spoilageWeight.toFixed(3)} <em>viss</em>
                </span>
              </div>
              <div className="sdd-modal-chip">
                <span className="sdd-chip-label">Return Weight</span>
                <span className="sdd-chip-value sdd-chip-cyan">
                  {selectedProcess.returnWeight.toFixed(3)} <em>viss</em>
                </span>
              </div>
            </div>

            {/* Modal Body: Form */}
            <form className="sdd-modal-form" onSubmit={handleSubmitModal}>
              <div className="sdd-modal-body">
                {formError && (
                  <div className="sdd-modal-error-msg">
                    <AlertCircle size={18} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="sdd-columns-grid">
                  {/* Column 1: Two Inches Category */}
                  <div className="sdd-category-card sdd-cat-two">
                    <div className="sdd-cat-header">
                      <div className="sdd-cat-header-title">
                        <div className="sdd-cat-icon-badge sdd-badge-two">
                          <Layers size={17} />
                        </div>
                        <h3>Two Inches Category</h3>
                      </div>
                      <span className="sdd-cat-count-pill">
                        5 Sizes + 2 Extra
                      </span>
                    </div>

                    <div className="sdd-table-container">
                      <table className="sdd-size-table">
                        <thead>
                          <tr>
                            <th>Size</th>
                            <th style={{ width: "135px" }}>Weight (viss)</th>
                            <th style={{ width: "135px" }}>Price (CNY)</th>
                            <th className="sdd-th-right">Amount (CNY)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {["6", "7", "8", "9", "10"].map((size) => {
                            const weightVal =
                              parseFloat(
                                twoInchesForm[
                                  `size${size}` as keyof typeof twoInchesForm
                                ],
                              ) || 0;
                            const priceVal =
                              parseFloat(
                                twoInchesPricesForm[
                                  `price${size}` as keyof typeof twoInchesPricesForm
                                ],
                              ) || 0;
                            const amount = weightVal * priceVal;
                            return (
                              <tr
                                key={size}
                                className={
                                  weightVal > 0 ? "sdd-row-active" : ""
                                }
                              >
                                <td>
                                  <span className="sdd-size-badge sdd-size-badge-blue">
                                    Size {size}&quot;
                                  </span>
                                </td>
                                <td>
                                  <div className="sdd-input-wrap">
                                    <input
                                      type="number"
                                      step="0.001"
                                      name={`size${size}`}
                                      placeholder="0.000"
                                      value={
                                        twoInchesForm[
                                          `size${size}` as keyof typeof twoInchesForm
                                        ]
                                      }
                                      onChange={(e) => {
                                        const { name, value } = e.target;
                                        setTwoInchesForm((prev) => ({
                                          ...prev,
                                          [name]: value,
                                        }));
                                      }}
                                      className="sdd-modal-input sdd-input-weight"
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="sdd-input-wrap">
                                    <input
                                      type="number"
                                      step="0.01"
                                      name={`price${size}`}
                                      placeholder="0.00"
                                      value={
                                        twoInchesPricesForm[
                                          `price${size}` as keyof typeof twoInchesPricesForm
                                        ]
                                      }
                                      onChange={(e) => {
                                        const { name, value } = e.target;
                                        setTwoInchesPricesForm((prev) => ({
                                          ...prev,
                                          [name]: value,
                                        }));
                                      }}
                                      className="sdd-modal-input sdd-input-price"
                                    />
                                  </div>
                                </td>
                                <td className="sdd-td-amount sdd-amount-blue">
                                  {amount.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                              </tr>
                            );
                          })}

                          {/* Spoilage size */}
                          <tr
                            className={`sdd-row-spoilage ${parseFloat(spoilageSizeWeight) > 0 ? "sdd-row-active" : ""}`}
                          >
                            <td>
                              <span className="sdd-size-badge sdd-size-badge-orange">
                                Spoilage
                              </span>
                            </td>
                            <td>
                              <div className="sdd-input-wrap">
                                <input
                                  type="number"
                                  step="0.001"
                                  placeholder="0.000"
                                  value={spoilageSizeWeight}
                                  onChange={(e) =>
                                    setSpoilageSizeWeight(e.target.value)
                                  }
                                  className="sdd-modal-input sdd-input-weight"
                                />
                              </div>
                            </td>
                            <td>
                              <div className="sdd-input-wrap">
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={spoilageSizePrice}
                                  onChange={(e) =>
                                    setSpoilageSizePrice(e.target.value)
                                  }
                                  className="sdd-modal-input sdd-input-price"
                                />
                              </div>
                            </td>
                            <td className="sdd-td-amount sdd-amount-orange">
                              {(
                                (parseFloat(spoilageSizeWeight) || 0) *
                                (parseFloat(spoilageSizePrice) || 0)
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>

                          {/* Return size */}
                          <tr
                            className={`sdd-row-return ${parseFloat(returnSizeWeight) > 0 ? "sdd-row-active" : ""}`}
                          >
                            <td>
                              <span className="sdd-size-badge sdd-size-badge-cyan">
                                Return
                              </span>
                            </td>
                            <td>
                              <div className="sdd-input-wrap">
                                <input
                                  type="number"
                                  step="0.001"
                                  placeholder="0.000"
                                  value={returnSizeWeight}
                                  onChange={(e) =>
                                    setReturnSizeWeight(e.target.value)
                                  }
                                  className="sdd-modal-input sdd-input-weight"
                                />
                              </div>
                            </td>
                            <td>
                              <div className="sdd-input-wrap">
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={returnSizePrice}
                                  onChange={(e) =>
                                    setReturnSizePrice(e.target.value)
                                  }
                                  className="sdd-modal-input sdd-input-price"
                                />
                              </div>
                            </td>
                            <td className="sdd-td-amount sdd-amount-cyan">
                              {(
                                (parseFloat(returnSizeWeight) || 0) *
                                (parseFloat(returnSizePrice) || 0)
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Column 2: B to Ten Category */}
                  <div className="sdd-category-card sdd-cat-b">
                    <div className="sdd-cat-header">
                      <div className="sdd-cat-header-title">
                        <div className="sdd-cat-icon-badge sdd-badge-b">
                          <Layers size={17} />
                        </div>
                        <h3>B to Ten Category</h3>
                      </div>
                      <span className="sdd-cat-count-pill sdd-pill-purple">
                        11 Sizes
                      </span>
                    </div>

                    <div className="sdd-table-container">
                      <table className="sdd-size-table">
                        <thead>
                          <tr>
                            <th>Size</th>
                            <th style={{ width: "135px" }}>Weight (viss)</th>
                            <th style={{ width: "135px" }}>Price (CNY)</th>
                            <th className="sdd-th-right">Amount (CNY)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            "10B",
                            "12",
                            "14",
                            "16",
                            "18",
                            "20",
                            "22",
                            "24",
                            "26",
                            "28",
                            "Bar",
                          ].map((size) => {
                            const fieldName =
                              size === "10B"
                                ? "size10B"
                                : size === "Bar"
                                  ? "sizeBar"
                                  : `size${size}`;
                            const priceFieldName =
                              size === "10B"
                                ? "price10B"
                                : size === "Bar"
                                  ? "priceBar"
                                  : `price${size}`;
                            const weightVal =
                              parseFloat(
                                bToTenForm[
                                  fieldName as keyof typeof bToTenForm
                                ],
                              ) || 0;
                            const priceVal =
                              parseFloat(
                                bToTenPricesForm[
                                  priceFieldName as keyof typeof bToTenPricesForm
                                ],
                              ) || 0;
                            const amount = weightVal * priceVal;
                            return (
                              <tr
                                key={size}
                                className={
                                  weightVal > 0 ? "sdd-row-active" : ""
                                }
                              >
                                <td>
                                  <span className="sdd-size-badge sdd-size-badge-purple">
                                    {size === "Bar" ? "Bar" : `Size ${size}"`}
                                  </span>
                                </td>
                                <td>
                                  <div className="sdd-input-wrap">
                                    <input
                                      type="number"
                                      step="0.001"
                                      name={fieldName}
                                      placeholder="0.000"
                                      value={
                                        bToTenForm[
                                          fieldName as keyof typeof bToTenForm
                                        ]
                                      }
                                      onChange={(e) => {
                                        const { name, value } = e.target;
                                        setBToTenForm((prev) => ({
                                          ...prev,
                                          [name]: value,
                                        }));
                                      }}
                                      className="sdd-modal-input sdd-input-weight"
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="sdd-input-wrap">
                                    <input
                                      type="number"
                                      step="0.01"
                                      name={priceFieldName}
                                      placeholder="0.00"
                                      value={
                                        bToTenPricesForm[
                                          priceFieldName as keyof typeof bToTenPricesForm
                                        ]
                                      }
                                      onChange={(e) => {
                                        const { name, value } = e.target;
                                        setBToTenPricesForm((prev) => ({
                                          ...prev,
                                          [name]: value,
                                        }));
                                      }}
                                      className="sdd-modal-input sdd-input-price"
                                    />
                                  </div>
                                </td>
                                <td className="sdd-td-amount sdd-amount-purple">
                                  {amount.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Bottom metadata details inputs */}
                <div className="sdd-meta-card">
                  <div className="sdd-meta-header">
                    <span className="sdd-meta-title">
                      Batch &amp; Worker Details
                    </span>
                    <span className="sdd-meta-sub">
                      Specify worker assignment, waste, and fees
                    </span>
                  </div>

                  <div className="sdd-meta-grid">
                    <div className="sdd-field-group">
                      <label className="sdd-meta-label">
                        S/D Lost Weight (viss)
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        placeholder="0.000"
                        value={singleDoubleLostWeight}
                        onChange={(e) =>
                          setSingleDoubleLostWeight(e.target.value)
                        }
                        className="sdd-modal-input sdd-meta-input"
                      />
                    </div>

                    <div className="sdd-field-group">
                      <label className="sdd-meta-label">
                        Single &amp; Double Worker{" "}
                        <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <select
                        value={modalWorkerId}
                        onChange={(e) => setModalWorkerId(e.target.value)}
                        className="sdd-modal-input sdd-meta-input"
                      >
                        <option value="">-- Select Worker --</option>
                        {workers
                          .filter(
                            (w) =>
                              !selectedProcess.warehouseId ||
                              w.warehouseId === selectedProcess.warehouseId,
                          )
                          .map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="sdd-field-group">
                      <label className="sdd-meta-label">
                        Worker Fees (MMK)
                      </label>
                      <input
                        type="number"
                        step="1"
                        placeholder="0.00"
                        value={modalWorkerFees}
                        onChange={(e) => setModalWorkerFees(e.target.value)}
                        className="sdd-modal-input sdd-meta-input"
                      />
                    </div>

                    <div className="sdd-field-group sdd-field-full">
                      <label className="sdd-meta-label">
                        Notes &amp; Remarks
                      </label>
                      <input
                        type="text"
                        placeholder="Add any batch sorting remarks or details..."
                        value={modalNote}
                        onChange={(e) => setModalNote(e.target.value)}
                        className="sdd-modal-input sdd-meta-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Real-time Summary Card inside Modal */}
                <div className="sdd-summary-card">
                  <div className="sdd-summary-left">
                    <div className="sdd-summary-stat">
                      <span className="sdd-stat-caption">Total Sorted</span>
                      <strong className="sdd-stat-val sdd-val-cyan">
                        {currentModalFormTotal.toFixed(3)}{" "}
                        <span className="sdd-unit">viss</span>
                      </strong>
                    </div>

                    <div className="sdd-summary-divider" />

                    <div className="sdd-summary-stat">
                      <span className="sdd-stat-caption">Sorting Balance</span>
                      {Math.abs(modalRemainingWeight) < 0.001 ? (
                        <div className="sdd-balance-badge sdd-balanced">
                          <CheckCircle2 size={16} />
                          <span>Balanced (0.000 viss)</span>
                        </div>
                      ) : (
                        <div className="sdd-balance-badge sdd-unbalanced">
                          <AlertCircle size={16} />
                          <span>
                            {modalRemainingWeight > 0 ? "+" : ""}
                            {modalRemainingWeight.toFixed(3)} viss{" "}
                            {modalRemainingWeight > 0 ? "remaining" : "over"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sdd-summary-right">
                    <span className="sdd-stat-caption">Total Valuation</span>
                    <strong className="sdd-stat-val sdd-val-emerald">
                      {totalModalFormAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <span className="sdd-unit-cny">CNY</span>
                    </strong>
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="sdd-modal-footer">
                <button
                  type="button"
                  className="sdd-modal-btn sdd-modal-cancel-btn"
                  onClick={handleCloseModal}
                  disabled={savingRecord}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sdd-modal-btn sdd-modal-submit-btn"
                  disabled={savingRecord}
                >
                  {savingRecord ? (
                    <>
                      <Loader2 className="rf-spin" size={16} /> Saving...
                    </>
                  ) : (
                    <>
                      <Scissors size={16} /> Save Sorting Record
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleDoubleDrawn;
