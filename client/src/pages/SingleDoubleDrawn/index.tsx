import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  refinementAPI,
  singleDoubleDrawnAPI,
  singleDoubleDrawnWorkersAPI,
} from "../../services/api";
import type {
  RefinementRecord,
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
  LayoutGrid,
  Weight,
  CheckCircle2,
  X,
} from "lucide-react";

import { formatDateTime } from "../../utils/format";
import SingleDoubleDrawnWorkerManagement from "../SingleDoubleDrawnWorkerManagement";
import "./index.css";

// Helper: sum all size fields of a SingleDoubleDrawnRecord (including Spoilage and Return sizes)
const sumRecordSizes = (r: SingleDoubleDrawnRecord): number =>
  r.size6 +
  r.size7 +
  r.size8 +
  r.size9 +
  r.size10 +
  r.size10B +
  r.size12 +
  r.size14 +
  r.size16 +
  r.size18 +
  r.size20 +
  r.size22 +
  r.size24 +
  r.size26 +
  r.size28 +
  r.sizeBar +
  (r.spoilageSize ?? 0) +
  (r.returnSize ?? 0) +
  (r.singleDoubleLostWeight ?? 0);

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
  const [refinedRecords, setRefinedRecords] = useState<RefinementRecord[]>([]);
  const [savedRecords, setSavedRecords] = useState<SingleDoubleDrawnRecord[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formError, setFormError] = useState("");
  const [activeTab, setActiveTab] = useState<"processing" | "history">(
    "processing",
  );

  // Two Inches Category sizes: 6, 7, 8, 9, 10
  const [showWorkerManagement, setShowWorkerManagement] = useState(false);

  const handleCloseWorkerManagement = () => {
    setShowWorkerManagement(false);
    loadData();
  };

  const [twoInchesForm, setTwoInchesForm] = useState({
    size6: "",
    size7: "",
    size8: "",
    size9: "",
    size10: "",
  });

  // Two Inches Category prices: 6, 7, 8, 9, 10
  const [twoInchesPricesForm, setTwoInchesPricesForm] = useState({
    price6: "",
    price7: "",
    price8: "",
    price9: "",
    price10: "",
  });

  // B to Ten Category sizes: 10B, 12, 14, 16, 18, 20, 22, 24, 26, 28, Bar
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

  // B to Ten Category prices
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

  // Spoilage and Return sizes for Two Inches (weight + price)
  const [spoilageSizeWeight, setSpoilageSizeWeight] = useState("");
  const [spoilageSizePrice, setSpoilageSizePrice] = useState("");
  const [returnSizeWeight, setReturnSizeWeight] = useState("");
  const [returnSizePrice, setReturnSizePrice] = useState("");

  const [singleDoubleLostWeight, setSingleDoubleLostWeight] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [workerFees, setWorkerFees] = useState("");
  const [note, setNote] = useState("");
  const [workers, setWorkers] = useState<SingleDoubleDrawnWorker[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recordsData, savedData, workersData] = await Promise.all([
        refinementAPI.getRefinementRecords(),
        singleDoubleDrawnAPI.getAll(),
        singleDoubleDrawnWorkersAPI.getAll(),
      ]);
      setRefinedRecords(recordsData);
      setSavedRecords(savedData);
      setWorkers(workersData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedRecord = useMemo(
    () => refinedRecords.find((r) => r.id === selectedRecordId),
    [refinedRecords, selectedRecordId],
  );

  // Calculate saved total per refinement record (for sidebar filtering & remaining weight)
  const savedTotalByRefinement = useMemo(() => {
    const map: Record<number, number> = {};
    savedRecords.forEach((sr) => {
      const total = sumRecordSizes(sr);
      map[sr.refinementRecordId] = (map[sr.refinementRecordId] || 0) + total;
    });
    return map;
  }, [savedRecords]);

  // Already-sorted weight for the selected record
  const alreadySortedWeight = useMemo(() => {
    if (!selectedRecordId) return 0;
    return savedTotalByRefinement[selectedRecordId] || 0;
  }, [selectedRecordId, savedTotalByRefinement]);

  // Real-time current form total (includes spoilage and return sizes)
  const currentFormTotal = useMemo(() => {
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

  // Remaining weight = Output Weight - already saved - current form input (spoilage+return now included in currentFormTotal)
  const remainingWeight = useMemo(() => {
    if (!selectedRecord) return 0;
    const lostWeightVal = parseFloat(singleDoubleLostWeight) || 0;
    return (
      selectedRecord.weight -
      alreadySortedWeight -
      currentFormTotal -
      lostWeightVal
    );
  }, [
    selectedRecord,
    alreadySortedWeight,
    currentFormTotal,
    singleDoubleLostWeight,
  ]);

  // Real-time current form total amount (sum of weights * prices)
  const totalFormAmount = useMemo(() => {
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
    // Include spoilage and return sizes
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

  // Filter sidebar: hide fully sorted, apply search
  const filteredRecords = useMemo(() => {
    return refinedRecords.filter((r) => {
      // Hide if saved total matches output weight (fully sorted)
      const savedTotal = savedTotalByRefinement[r.id] || 0;
      const isFullySorted =
        r.weight > 0 && Math.abs(savedTotal - r.weight) < 0.001;
      if (isFullySorted) return false;

      // Search filter
      return (
        r.productMarker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.warehouseName || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [refinedRecords, searchTerm, savedTotalByRefinement]);

  const handleTwoInchesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTwoInchesForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTwoInchesPriceChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setTwoInchesPricesForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBToTenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBToTenForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBToTenPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBToTenPricesForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!selectedRecordId || !selectedRecord) return;

    // Validate: current form total + already saved must equal output weight
    if (currentFormTotal <= 0) {
      setFormError("Please enter at least one size value.");
      return;
    }

    if (Math.abs(remainingWeight) > 0.001) {
      setFormError(
        `Total sizes must equal remaining weight. Remaining: ${remainingWeight.toFixed(3)} viss`,
      );
      return;
    }

    // Validate: for any size with weight entered, price must also be entered and greater than 0
    let priceMissing = false;
    let missingSize = "";

    // Check Two Inches
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

    // Check spoilage and return sizes
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

    // Check B to Ten
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
      const dto = {
        date: new Date().toISOString(),
        refinementRecordId: selectedRecordId,

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

        lostWeight: selectedRecord.lostWeight || 0,
        spoilageWeight: selectedRecord.spoilageWeight || 0,
        returnWeight: selectedRecord.returnWeight || 0,
        singleDoubleLostWeight: parseFloat(singleDoubleLostWeight) || 0,
        workerId: workerId ? parseInt(workerId) : undefined,
        workerFees: parseFloat(workerFees) || 0,
        note: note,

        // Spoilage and Return sizes
        spoilageSize: parseFloat(spoilageSizeWeight) || 0,
        returnSize: parseFloat(returnSizeWeight) || 0,
        priceSpoilageSize: parseFloat(spoilageSizePrice) || 0,
        priceReturnSize: parseFloat(returnSizePrice) || 0,
      };

      await singleDoubleDrawnAPI.create(dto);

      // Clear forms
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
      setWorkerFees("");
      setWorkerId("");
      setNote("");
      setFormError("");
      setSelectedRecordId(null);

      await loadData();
    } catch (error: any) {
      console.error("Failed to save record:", error);
      const serverMessage = error.response?.data?.message;
      setFormError(serverMessage || "Failed to save record. Please try again.");
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
    <div className="rf-container fade-in">
      {/* Left Sidebar: Refined Stock List */}
      <aside className="rf-sidebar">
        <div className="rf-sidebar-header">
          <Package size={18} />
          <span>Refined Stock</span>
        </div>

        {/* Search in rf-sidebar */}
        <div className="rf-search-box">
          <Search size={16} className="rf-search-icon" />
          <input
            type="text"
            placeholder="Search marker, category..."
            className="rf-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="rf-card-list">
          {filteredRecords.length === 0 ? (
            <div className="rf-empty-sidebar">No refined stock found</div>
          ) : (
            filteredRecords.map((record) => (
              <div
                key={record.id}
                className={`product-card ${selectedRecordId === record.id ? "selected" : ""}`}
                onClick={() => {
                  setSelectedRecordId(record.id);
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
                        marginTop: "2px",
                      }}
                    >
                      {record.warehouseName || "---"}
                    </span>
                  </div>
                  <span
                    className={`rf-badge category-${(record.category || "").toLowerCase().replace(".", "")}`}
                  >
                    {record.category}
                  </span>
                </div>
                <div className="card-details">
                  <span>
                    Output:{" "}
                    <strong style={{ color: "#059669" }}>
                      {record.weight.toFixed(3)}
                    </strong>{" "}
                    viss
                  </span>
                  <span>
                    Return:{" "}
                    <strong style={{ color: "#2563eb" }}>
                      {record.returnWeight.toFixed(3)}
                    </strong>{" "}
                    viss
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
                  <span className="rf-tab-sub">
                    Sort selected refined stock
                  </span>
                </button>
                <button
                  className={`rf-tab ${activeTab === "history" ? "rf-tab-active rf-tab-green" : ""}`}
                  onClick={() => setActiveTab("history")}
                >
                  <span className="rf-tab-title">Sorting History</span>
                  <span className="rf-tab-sub">View saved sorting records</span>
                </button>
              </div>
            </div>

            <div
              className="rf-header-right"
              style={{ display: "flex", alignItems: "center", gap: "12px" }}
            >
              <button
                type="button"
                onClick={() => setShowWorkerManagement(true)}
                style={{
                  padding: "8px 16px",
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "13px",
                }}
              >
                Register SingleDoubleDrawnWorker
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div
            className="rf-main-content"
            style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}
          >
            {activeTab === "processing" ? (
              selectedRecord ? (
                <div
                  className="fade-in"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  {/* Header details */}
                  <div
                    style={{
                      paddingBottom: "16px",
                      borderBottom: "1.5px solid #f1f5f9",
                      marginBottom: "8px",
                    }}
                  >
                    <h2
                      style={{
                        fontSize: "20px",
                        fontWeight: "800",
                        color: "#0f172a",
                        margin: 0,
                      }}
                    >
                      Single &amp; Double Drawn Sorting
                    </h2>
                    <p
                      style={{
                        fontSize: "13.5px",
                        color: "#64748b",
                        margin: "6px 0 0 0",
                        fontWeight: "500",
                      }}
                    >
                      Refined Record:{" "}
                      <strong>{selectedRecord.productMarker}</strong> (
                      {selectedRecord.category})
                    </p>
                  </div>

                  {/* Detail Info Cards */}
                  <div className="record-detail-section">
                    <div className="detail-info-card card-output">
                      <div className="detail-label">Output Weight</div>
                      <div className="detail-value">
                        {selectedRecord.weight.toFixed(3)}{" "}
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#64748b",
                          }}
                        >
                          viss
                        </span>
                      </div>
                    </div>
                    <div className="detail-info-card card-lost">
                      <div className="detail-label">Lost Weight</div>
                      <div className="detail-value">
                        {selectedRecord.lostWeight.toFixed(3)}{" "}
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#64748b",
                          }}
                        >
                          viss
                        </span>
                      </div>
                    </div>
                    <div className="detail-info-card card-spoilage">
                      <div className="detail-label">Spoilage Weight</div>
                      <div className="detail-value">
                        {selectedRecord.spoilageWeight.toFixed(3)}{" "}
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#64748b",
                          }}
                        >
                          viss
                        </span>
                      </div>
                    </div>
                    <div className="detail-info-card card-return">
                      <div className="detail-label">Return Weight</div>
                      <div className="detail-value">
                        {selectedRecord.returnWeight.toFixed(3)}{" "}
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#64748b",
                          }}
                        >
                          viss
                        </span>
                      </div>
                    </div>
                    <div className="detail-info-card card-worker">
                      <div className="detail-label">Refinement Worker</div>
                      <div className="detail-value">
                        {selectedRecord.purifierName || "—"}
                      </div>
                    </div>
                  </div>

                  {/* Category Size forms */}
                  {hasPermission("SingleDoubleDrawn.Create") && (
                    <form onSubmit={handleSubmit}>
                      <div className="categories-container">
                        {/* Column 1: Two Inches Category */}
                        <div className="category-column category-column-two">
                          <h3 className="category-title">
                            <LayoutGrid
                              size={18}
                              style={{ color: "#2563eb" }}
                            />
                            Two Inches Category
                          </h3>
                          <div
                            className="table-container"
                            style={{
                              border: "1.5px solid #e2e8f0",
                              borderRadius: "12px",
                              overflow: "hidden",
                              background: "white",
                            }}
                          >
                            <table
                              className="table"
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                textAlign: "left",
                                fontSize: "13.5px",
                              }}
                            >
                              <thead>
                                <tr
                                  style={{
                                    background: "#f8fafc",
                                    borderBottom: "1.5px solid #e2e8f0",
                                  }}
                                >
                                  <th
                                    style={{
                                      padding: "10px 16px",
                                      fontWeight: "700",
                                      color: "#475569",
                                    }}
                                  >
                                    SIZE
                                  </th>
                                  <th
                                    style={{
                                      padding: "10px 16px",
                                      fontWeight: "700",
                                      color: "#475569",
                                      width: "160px",
                                    }}
                                  >
                                    WEIGHT (viss)
                                  </th>
                                  <th
                                    style={{
                                      padding: "10px 16px",
                                      fontWeight: "700",
                                      color: "#475569",
                                      width: "160px",
                                    }}
                                  >
                                    PRICE (CNY)
                                  </th>
                                  <th
                                    style={{
                                      padding: "10px 16px",
                                      fontWeight: "700",
                                      color: "#475569",
                                      textAlign: "right",
                                    }}
                                  >
                                    AMOUNT (CNY)
                                  </th>
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
                                      style={{
                                        borderBottom: "1px solid #f1f5f9",
                                      }}
                                    >
                                      <td
                                        style={{
                                          padding: "10px 16px",
                                          fontWeight: "700",
                                          color: "#1e293b",
                                        }}
                                      >
                                        Size {size}
                                      </td>
                                      <td style={{ padding: "6px 16px" }}>
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
                                          onChange={handleTwoInchesChange}
                                          style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            borderRadius: "8px",
                                            border: "1.5px solid #cbd5e1",
                                            fontSize: "13.5px",
                                            fontWeight: "600",
                                            outline: "none",
                                            boxSizing: "border-box",
                                          }}
                                        />
                                      </td>
                                      <td style={{ padding: "6px 16px" }}>
                                        <input
                                          type="number"
                                          name={`price${size}`}
                                          placeholder="0"
                                          value={
                                            twoInchesPricesForm[
                                              `price${size}` as keyof typeof twoInchesPricesForm
                                            ]
                                          }
                                          onChange={handleTwoInchesPriceChange}
                                          style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            borderRadius: "8px",
                                            border: "1.5px solid #cbd5e1",
                                            fontSize: "13.5px",
                                            fontWeight: "600",
                                            outline: "none",
                                            boxSizing: "border-box",
                                          }}
                                        />
                                      </td>
                                      <td
                                        style={{
                                          padding: "10px 16px",
                                          textAlign: "right",
                                          fontWeight: "700",
                                          color: "#0f172a",
                                        }}
                                      >
                                        {amount > 0
                                          ? amount.toLocaleString(undefined, {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            })
                                          : "0.00"}
                                      </td>
                                    </tr>
                                  );
                                })}

                                {/* Spoilage row */}
                                {(() => {
                                  const spoilageW =
                                    parseFloat(spoilageSizeWeight) || 0;
                                  const spoilageP =
                                    parseFloat(spoilageSizePrice) || 0;
                                  const spoilageAmt = spoilageW * spoilageP;
                                  return (
                                    <tr
                                      style={{
                                        borderBottom: "1px solid #f1f5f9",
                                        background: "#fffaf8",
                                      }}
                                    >
                                      <td
                                        style={{
                                          padding: "10px 16px",
                                          fontWeight: "700",
                                          color: "#ea580c",
                                        }}
                                      >
                                        Spoilage
                                      </td>
                                      <td style={{ padding: "6px 16px" }}>
                                        <input
                                          type="number"
                                          step="0.001"
                                          placeholder="0.000"
                                          value={spoilageSizeWeight}
                                          onChange={(e) =>
                                            setSpoilageSizeWeight(
                                              e.target.value,
                                            )
                                          }
                                          style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            borderRadius: "8px",
                                            border: "1.5px solid #ffedd5",
                                            fontSize: "13.5px",
                                            fontWeight: "600",
                                            outline: "none",
                                            boxSizing: "border-box",
                                            background: "#fff",
                                          }}
                                        />
                                      </td>
                                      <td style={{ padding: "6px 16px" }}>
                                        <input
                                          type="number"
                                          step="1"
                                          placeholder="0"
                                          value={spoilageSizePrice}
                                          onChange={(e) =>
                                            setSpoilageSizePrice(e.target.value)
                                          }
                                          style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            borderRadius: "8px",
                                            border:
                                              spoilageW > 0 && spoilageP < 0
                                                ? "1.5px solid #ef4444"
                                                : "1.5px solid #ffedd5",
                                            fontSize: "13.5px",
                                            fontWeight: "600",
                                            outline: "none",
                                            boxSizing: "border-box",
                                            background: "#fff",
                                          }}
                                        />
                                      </td>
                                      <td
                                        style={{
                                          padding: "10px 16px",
                                          textAlign: "right",
                                          fontWeight: "700",
                                          color:
                                            spoilageAmt > 0
                                              ? "#ea580c"
                                              : "#cbd5e1",
                                        }}
                                      >
                                        {spoilageAmt > 0
                                          ? spoilageAmt.toLocaleString(
                                              undefined,
                                              {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              },
                                            )
                                          : "0.00"}
                                      </td>
                                    </tr>
                                  );
                                })()}

                                {/* Return row */}
                                {(() => {
                                  const returnW =
                                    parseFloat(returnSizeWeight) || 0;
                                  const returnP =
                                    parseFloat(returnSizePrice) || 0;
                                  const returnAmt = returnW * returnP;
                                  return (
                                    <tr
                                      style={{
                                        borderBottom: "1px solid #f1f5f9",
                                        background: "#f8fafc",
                                      }}
                                    >
                                      <td
                                        style={{
                                          padding: "10px 16px",
                                          fontWeight: "700",
                                          color: "#2563eb",
                                        }}
                                      >
                                        Return
                                      </td>
                                      <td style={{ padding: "6px 16px" }}>
                                        <input
                                          type="number"
                                          step="0.001"
                                          placeholder="0.000"
                                          value={returnSizeWeight}
                                          onChange={(e) =>
                                            setReturnSizeWeight(e.target.value)
                                          }
                                          style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            borderRadius: "8px",
                                            border: "1.5px solid #dbeafe",
                                            fontSize: "13.5px",
                                            fontWeight: "600",
                                            outline: "none",
                                            boxSizing: "border-box",
                                            background: "#fff",
                                          }}
                                        />
                                      </td>
                                      <td style={{ padding: "6px 16px" }}>
                                        <input
                                          type="number"
                                          step="1"
                                          placeholder="0"
                                          value={returnSizePrice}
                                          onChange={(e) =>
                                            setReturnSizePrice(e.target.value)
                                          }
                                          style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            borderRadius: "8px",
                                            border:
                                              returnW > 0 && returnP < 0
                                                ? "1.5px solid #ef4444"
                                                : "1.5px solid #dbeafe",
                                            fontSize: "13.5px",
                                            fontWeight: "600",
                                            outline: "none",
                                            boxSizing: "border-box",
                                            background: "#fff",
                                          }}
                                        />
                                      </td>
                                      <td
                                        style={{
                                          padding: "10px 16px",
                                          textAlign: "right",
                                          fontWeight: "700",
                                          color:
                                            returnAmt > 0
                                              ? "#2563eb"
                                              : "#cbd5e1",
                                        }}
                                      >
                                        {returnAmt > 0
                                          ? returnAmt.toLocaleString(
                                              undefined,
                                              {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              },
                                            )
                                          : "0.00"}
                                      </td>
                                    </tr>
                                  );
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Column 2: B to Ten Category */}
                        <div className="category-column category-column-b">
                          <h3 className="category-title">
                            <LayoutGrid
                              size={18}
                              style={{ color: "#8b5cf6" }}
                            />
                            B to Ten Category
                          </h3>
                          <div
                            className="table-container"
                            style={{
                              border: "1.5px solid #e2e8f0",
                              borderRadius: "12px",
                              overflow: "hidden",
                              background: "white",
                            }}
                          >
                            <table
                              className="table"
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                textAlign: "left",
                                fontSize: "13.5px",
                              }}
                            >
                              <thead>
                                <tr
                                  style={{
                                    background: "#f8fafc",
                                    borderBottom: "1.5px solid #e2e8f0",
                                  }}
                                >
                                  <th
                                    style={{
                                      padding: "10px 16px",
                                      fontWeight: "700",
                                      color: "#475569",
                                    }}
                                  >
                                    SIZE
                                  </th>
                                  <th
                                    style={{
                                      padding: "10px 16px",
                                      fontWeight: "700",
                                      color: "#475569",
                                      width: "160px",
                                    }}
                                  >
                                    WEIGHT (viss)
                                  </th>
                                  <th
                                    style={{
                                      padding: "10px 16px",
                                      fontWeight: "700",
                                      color: "#475569",
                                      width: "160px",
                                    }}
                                  >
                                    PRICE (CNY)
                                  </th>
                                  <th
                                    style={{
                                      padding: "10px 16px",
                                      fontWeight: "700",
                                      color: "#475569",
                                      textAlign: "right",
                                    }}
                                  >
                                    AMOUNT (CNY)
                                  </th>
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
                                  const displayLabel =
                                    size === "10B"
                                      ? "Size 10B"
                                      : `Size ${size}`;

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
                                      style={{
                                        borderBottom: "1px solid #f1f5f9",
                                      }}
                                    >
                                      <td
                                        style={{
                                          padding: "10px 16px",
                                          fontWeight: "700",
                                          color: "#1e293b",
                                        }}
                                      >
                                        {displayLabel}
                                      </td>
                                      <td style={{ padding: "6px 16px" }}>
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
                                          onChange={handleBToTenChange}
                                          style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            borderRadius: "8px",
                                            border: "1.5px solid #cbd5e1",
                                            fontSize: "13.5px",
                                            fontWeight: "600",
                                            outline: "none",
                                            boxSizing: "border-box",
                                          }}
                                        />
                                      </td>
                                      <td style={{ padding: "6px 16px" }}>
                                        <input
                                          type="number"
                                          name={priceFieldName}
                                          placeholder="0"
                                          value={
                                            bToTenPricesForm[
                                              priceFieldName as keyof typeof bToTenPricesForm
                                            ]
                                          }
                                          onChange={handleBToTenPriceChange}
                                          style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            borderRadius: "8px",
                                            border: "1.5px solid #cbd5e1",
                                            fontSize: "13.5px",
                                            fontWeight: "600",
                                            outline: "none",
                                            boxSizing: "border-box",
                                          }}
                                        />
                                      </td>
                                      <td
                                        style={{
                                          padding: "10px 16px",
                                          textAlign: "right",
                                          fontWeight: "700",
                                          color: "#0f172a",
                                        }}
                                      >
                                        {amount > 0
                                          ? amount.toLocaleString(undefined, {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            })
                                          : "0.00"}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* New Worker & Note Inputs */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: "16px",
                          marginBottom: "24px",
                        }}
                      >
                        <div className="form-group">
                          <label>Lost Weight (viss)</label>
                          <input
                            type="number"
                            step="0.001"
                            placeholder="Lost Weight"
                            value={singleDoubleLostWeight}
                            onChange={(e) =>
                              setSingleDoubleLostWeight(e.target.value)
                            }
                            className="form-input"
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              border: "1.5px solid #cbd5e1",
                              borderRadius: "8px",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                        <div className="form-group">
                          <label>Worker</label>
                          <select
                            className="form-select"
                            value={workerId}
                            onChange={(e) => setWorkerId(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              border: "1.5px solid #cbd5e1",
                              borderRadius: "8px",
                              boxSizing: "border-box",
                            }}
                          >
                            <option value="">Select Worker</option>
                            {workers.map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.name} ({w.warehouseName})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Worker Fees (MMK)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Enter worker fees amount..."
                            value={workerFees}
                            onChange={(e) => setWorkerFees(e.target.value)}
                            className="form-input"
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              border: "1.5px solid #cbd5e1",
                              borderRadius: "8px",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                        <div className="form-group">
                          <label>Note</label>
                          <input
                            type="text"
                            placeholder="Add a note..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="form-input"
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              border: "1.5px solid #cbd5e1",
                              borderRadius: "8px",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                      </div>
                      {/* Remaining Weight Bar */}
                      <div
                        className="remaining-weight-bar"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "16px 20px",
                          borderRadius: "12px",
                          marginBottom: "16px",
                          border: `2px solid ${Math.abs(remainingWeight) < 0.001 ? "#10b981" : remainingWeight < 0 ? "#ef4444" : "#f59e0b"}`,
                          background:
                            Math.abs(remainingWeight) < 0.001
                              ? "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)"
                              : remainingWeight < 0
                                ? "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)"
                                : "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          {Math.abs(remainingWeight) < 0.001 ? (
                            <CheckCircle2
                              size={22}
                              style={{ color: "#10b981" }}
                            />
                          ) : (
                            <Weight
                              size={22}
                              style={{
                                color:
                                  remainingWeight < 0 ? "#ef4444" : "#f59e0b",
                              }}
                            />
                          )}
                          <div>
                            <div
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                color:
                                  Math.abs(remainingWeight) < 0.001
                                    ? "#059669"
                                    : remainingWeight < 0
                                      ? "#dc2626"
                                      : "#d97706",
                                marginBottom: "2px",
                              }}
                            >
                              {Math.abs(remainingWeight) < 0.001
                                ? "Fully Matched"
                                : remainingWeight < 0
                                  ? "Exceeded"
                                  : "Remaining Weight"}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#64748b",
                                fontWeight: 500,
                              }}
                            >
                              Output: {selectedRecord.weight.toFixed(3)} viss —
                              Already Saved: {alreadySortedWeight.toFixed(3)}{" "}
                              viss — Current Input:{" "}
                              {currentFormTotal.toFixed(3)} viss — Total Amount:{" "}
                              {totalFormAmount.toLocaleString()} CNY
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: "24px",
                            fontWeight: 800,
                            color:
                              Math.abs(remainingWeight) < 0.001
                                ? "#10b981"
                                : remainingWeight < 0
                                  ? "#ef4444"
                                  : "#f59e0b",
                          }}
                        >
                          {remainingWeight.toFixed(3)}{" "}
                          <span style={{ fontSize: "12px", fontWeight: 700 }}>
                            viss
                          </span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="submit-btn"
                        disabled={
                          Math.abs(remainingWeight) > 0.001 ||
                          currentFormTotal <= 0
                        }
                        style={{
                          width: "100%",
                          padding: "14px",
                          background:
                            Math.abs(remainingWeight) > 0.001 ||
                            currentFormTotal <= 0
                              ? "#94a3b8"
                              : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                          color: "white",
                          border: "none",
                          borderRadius: "10px",
                          fontSize: "15px",
                          fontWeight: "700",
                          cursor:
                            Math.abs(remainingWeight) > 0.001 ||
                            currentFormTotal <= 0
                              ? "not-allowed"
                              : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          boxShadow:
                            Math.abs(remainingWeight) > 0.001 ||
                            currentFormTotal <= 0
                              ? "none"
                              : "0 4px 12px rgba(37,99,235,0.2)",
                          opacity:
                            Math.abs(remainingWeight) > 0.001 ||
                            currentFormTotal <= 0
                              ? 0.7
                              : 1,
                          transition: "all 0.3s ease",
                        }}
                      >
                        <Send size={16} /> Confirm &amp; Save Sorting Record
                      </button>

                      {formError && (
                        <p
                          style={{
                            color: "#ef4444",
                            fontSize: "13px",
                            fontWeight: 600,
                            marginTop: "10px",
                            textAlign: "center",
                          }}
                        >
                          {formError}
                        </p>
                      )}
                    </form>
                  )}
                </div>
              ) : (
                /* No selection placeholder in activeTab === processing */
                <div
                  className="fade-in"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                    padding: "80px 20px",
                    background: "#f8fafc",
                    borderRadius: "16px",
                    border: "2px dashed #e2e8f0",
                    textAlign: "center",
                  }}
                >
                  <Sparkles
                    size={40}
                    style={{ color: "#cbd5e1", marginBottom: "12px" }}
                  />
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#64748b",
                      margin: "0 0 4px 0",
                    }}
                  >
                    No Selection
                  </h3>
                  <p style={{ fontSize: "13px", margin: 0 }}>
                    Select a refined stock record from the sidebar to start
                    sorting sizes.
                  </p>
                </div>
              )
            ) : (
              /* HISTORY TAB */
              <div
                className="fade-in"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {selectedRecordId ? (
                  /* Selected stock item history */
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "#f8fafc",
                        padding: "12px 18px",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        marginBottom: "16px",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#64748b",
                          }}
                        >
                          Showing history for:
                        </span>
                        <h3
                          style={{
                            fontSize: "15px",
                            fontWeight: "700",
                            color: "#0f172a",
                            margin: "2px 0 0 0",
                          }}
                        >
                          {selectedRecord?.productMarker} (
                          {selectedRecord?.category}) —{" "}
                          {selectedRecord?.warehouseName}
                        </h3>
                      </div>
                      <button
                        onClick={() => setSelectedRecordId(null)}
                        style={{
                          padding: "6px 12px",
                          fontSize: "12.5px",
                          fontWeight: "600",
                          color: "#2563eb",
                          background: "white",
                          border: "1.5px solid #cbd5e1",
                          borderRadius: "8px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        Clear Selection &amp; Show All
                      </button>
                    </div>

                    <div className="rf-table-wrap">
                      <table className="rf-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Two Inches Sizes (6,7,8,9,10)</th>
                            <th>B to Ten Sizes (10,12,14...Bar)</th>
                            <th>Lost Weight</th>
                            <th>Single/Double Lost Weight</th>
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
                          {savedRecords.filter(
                            (r) => r.refinementRecordId === selectedRecordId,
                          ).length === 0 ? (
                            <tr>
                              <td colSpan={12} className="rf-empty-row">
                                <Package size={44} className="rf-empty-icon" />
                                <span>
                                  No sorting history recorded for this stock
                                  item.
                                </span>
                              </td>
                            </tr>
                          ) : (
                            savedRecords
                              .filter(
                                (r) =>
                                  r.refinementRecordId === selectedRecordId,
                              )
                              .map((record) => (
                                <tr key={record.id}>
                                  <td className="rf-td-date">
                                    {formatDateTime(record.date)}
                                  </td>
                                  <td>{renderTwoInchesBadges(record)}</td>
                                  <td>{renderBToTenBadges(record)}</td>
                                  <td
                                    style={{
                                      color: "#64748b",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {record.lostWeight
                                      ? record.lostWeight.toFixed(3)
                                      : "0.000"}{" "}
                                    viss
                                  </td>
                                  <td
                                    style={{
                                      color: "#ea580c",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {record.singleDoubleLostWeight
                                      ? record.singleDoubleLostWeight.toFixed(3)
                                      : "0.000"}{" "}
                                    viss
                                  </td>
                                  <td
                                    style={{
                                      color: "#ea580c",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {record.spoilageWeight
                                      ? record.spoilageWeight.toFixed(3)
                                      : "0.000"}{" "}
                                    viss
                                  </td>
                                  <td
                                    style={{
                                      color: "#2563eb",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {record.returnWeight
                                      ? record.returnWeight.toFixed(3)
                                      : "0.000"}{" "}
                                    viss
                                  </td>
                                  <td
                                    style={{
                                      color: "#334155",
                                      fontWeight: "500",
                                    }}
                                  >
                                    {record.workerName || "---"}
                                  </td>
                                  <td
                                    style={{
                                      color: "#64748b",
                                      maxWidth: "150px",
                                    }}
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
                                    style={{
                                      color: "#0f172a",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {record.workerFees?.toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      },
                                    ) || "0.00"}
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
                  /* Global history */
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

                    <div className="rf-table-wrap">
                      <table className="rf-table">
                        <thead>
                          <tr>
                            <th>Stock Item</th>
                            <th>Date</th>
                            <th>Two Inches Sizes</th>
                            <th>B to Ten Sizes </th>
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
                          {savedRecords.length === 0 ? (
                            <tr>
                              <td colSpan={13} className="rf-empty-row">
                                <Package size={44} className="rf-empty-icon" />
                                <span>No sorting history recorded.</span>
                              </td>
                            </tr>
                          ) : (
                            savedRecords.map((record) => (
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
                                  style={{
                                    color: "#64748b",
                                    fontWeight: "600",
                                  }}
                                >
                                  {record.lostWeight
                                    ? record.lostWeight.toFixed(3)
                                    : "0.000"}{" "}
                                  viss
                                </td>
                                <td
                                  style={{
                                    color: "#ea580c",
                                    fontWeight: "600",
                                  }}
                                >
                                  {record.singleDoubleLostWeight
                                    ? record.singleDoubleLostWeight.toFixed(3)
                                    : "0.000"}{" "}
                                  viss
                                </td>
                                <td
                                  style={{
                                    color: "#ea580c",
                                    fontWeight: "600",
                                  }}
                                >
                                  {record.spoilageWeight
                                    ? record.spoilageWeight.toFixed(3)
                                    : "0.000"}{" "}
                                  viss
                                </td>
                                <td
                                  style={{
                                    color: "#2563eb",
                                    fontWeight: "600",
                                  }}
                                >
                                  {record.returnWeight
                                    ? record.returnWeight.toFixed(3)
                                    : "0.000"}{" "}
                                  viss
                                </td>
                                <td
                                  style={{
                                    color: "#334155",
                                    fontWeight: "500",
                                  }}
                                >
                                  {record.workerName || "---"}
                                </td>
                                <td
                                  style={{
                                    color: "#64748b",
                                    maxWidth: "150px",
                                  }}
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
                                  style={{
                                    color: "#0f172a",
                                    fontWeight: "600",
                                  }}
                                >
                                  {record.workerFees?.toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    },
                                  ) || "0.00"}
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
            )}
          </div>
        </div>
      </main>
      {/* Worker Management Modal */}
      {showWorkerManagement && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1200 }}
          onClick={handleCloseWorkerManagement}
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
                onClick={handleCloseWorkerManagement}
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
              <SingleDoubleDrawnWorkerManagement />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleDoubleDrawn;
