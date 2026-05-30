import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { refinementAPI, singleDoubleDrawnAPI } from "../../services/api";
import type { RefinementRecord, SingleDoubleDrawnRecord } from "../../types";
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
} from "lucide-react";
import { formatDateTime } from "../../utils/format";
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
  (r.returnSize ?? 0);

// Helper: calculate total MMK amount of a SingleDoubleDrawnRecord (sum of weight * price for all sizes)
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
    { label: 'Spoilage', val: record.spoilageSize ?? 0, price: record.priceSpoilageSize ?? 0, isSpecial: true, color: '#ea580c', bg: '#fff7ed' },
    { label: 'Return', val: record.returnSize ?? 0, price: record.priceReturnSize ?? 0, isSpecial: true, color: '#2563eb', bg: '#eff6ff' },
  ];

  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      {sizes.map((s) => s.val > 0 && (
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
          {s.label}: {s.val.toFixed(3)} viss @ {(s.price ?? 0).toLocaleString()} MMK
        </span>
      ))}
    </div>
  );
};

const renderBToTenBadges = (record: SingleDoubleDrawnRecord) => {
  const sizes = [
    { label: '10B', val: record.size10B, price: record.price10B },
    { label: '12"', val: record.size12, price: record.price12 },
    { label: '14"', val: record.size14, price: record.price14 },
    { label: '16"', val: record.size16, price: record.price16 },
    { label: '18"', val: record.size18, price: record.price18 },
    { label: '20"', val: record.size20, price: record.price20 },
    { label: '22"', val: record.size22, price: record.price22 },
    { label: '24"', val: record.size24, price: record.price24 },
    { label: '26"', val: record.size26, price: record.price26 },
    { label: '28"', val: record.size28, price: record.price28 },
    { label: 'Bar', val: record.sizeBar, price: record.priceBar },
  ];

  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      {sizes.map((s) => s.val > 0 && (
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
          {s.label}: {s.val.toFixed(3)} viss @ {(s.price ?? 0).toLocaleString()} MMK
        </span>
      ))}
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

  // Two Inches Category sizes: 6, 7, 8, 9, 10
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recordsData, savedData] = await Promise.all([
        refinementAPI.getRefinementRecords(),
        singleDoubleDrawnAPI.getAll(),
      ]);
      setRefinedRecords(recordsData);
      setSavedRecords(savedData);
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
    return selectedRecord.weight - alreadySortedWeight - currentFormTotal;
  }, [selectedRecord, alreadySortedWeight, currentFormTotal]);

  // Real-time current form total amount (sum of weights * prices)
  const totalFormAmount = useMemo(() => {
    let total = 0;
    ["6", "7", "8", "9", "10"].forEach((size) => {
      const w = parseFloat(twoInchesForm[`size${size}` as keyof typeof twoInchesForm]) || 0;
      const p = parseFloat(twoInchesPricesForm[`price${size}` as keyof typeof twoInchesPricesForm]) || 0;
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
      const w = parseFloat(bToTenForm[fieldName as keyof typeof bToTenForm]) || 0;
      const p = parseFloat(bToTenPricesForm[priceFieldName as keyof typeof bToTenPricesForm]) || 0;
      total += w * p;
    });
    // Include spoilage and return sizes
    total += (parseFloat(spoilageSizeWeight) || 0) * (parseFloat(spoilageSizePrice) || 0);
    total += (parseFloat(returnSizeWeight) || 0) * (parseFloat(returnSizePrice) || 0);
    return total;
  }, [twoInchesForm, twoInchesPricesForm, bToTenForm, bToTenPricesForm, spoilageSizeWeight, spoilageSizePrice, returnSizeWeight, returnSizePrice]);

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

  const handleTwoInchesPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const wVal = parseFloat(twoInchesForm[`size${size}` as keyof typeof twoInchesForm]) || 0;
      const pVal = parseFloat(twoInchesPricesForm[`price${size}` as keyof typeof twoInchesPricesForm]) || 0;
      if (wVal > 0 && pVal <= 0) {
        priceMissing = true;
        missingSize = `Size ${size}`;
      }
    });

    // Check spoilage and return sizes
    if ((parseFloat(spoilageSizeWeight) || 0) > 0 && (parseFloat(spoilageSizePrice) || 0) <= 0) {
      priceMissing = true;
      missingSize = "Spoilage";
    }
    if ((parseFloat(returnSizeWeight) || 0) > 0 && (parseFloat(returnSizePrice) || 0) <= 0) {
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
      const wVal = parseFloat(bToTenForm[fieldName as keyof typeof bToTenForm]) || 0;
      const pVal = parseFloat(bToTenPricesForm[priceFieldName as keyof typeof bToTenPricesForm]) || 0;
      if (wVal > 0 && pVal <= 0) {
        priceMissing = true;
        missingSize = size === "Bar" ? "Size Bar" : `Size ${size}`;
      }
    });

    if (priceMissing) {
      setFormError(`Price is required for ${missingSize} because a weight has been entered.`);
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
      setFormError("");
      setSelectedRecordId(null);

      await loadData();
    } catch (error) {
      console.error("Failed to save record:", error);
      setFormError("Failed to save record. Please try again.");
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
    <div className="processing-container fade-in">
      {/* Left Sidebar: Refined Stock List */}
      <aside className="product-sidebar">
        <h2 className="sidebar-title">
          <Package size={20} />
          Refined Stock
        </h2>

        {/* Search in product-sidebar */}
        <div
          className="sidebar-search"
          style={{ marginBottom: "20px", position: "relative" }}
        >
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
            }}
          />
          <input
            type="text"
            placeholder="Search marker, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px 10px 36px",
              borderRadius: "10px",
              border: "1.5px solid #e2e8f0",
              fontSize: "13.5px",
              outline: "none",
              transition: "all 0.2s",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div
          className="product-list"
          style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}
        >
          {filteredRecords.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: "#94a3b8",
                padding: "20px",
                fontSize: "13.5px",
              }}
            >
              No refined stock found
            </div>
          ) : (
            filteredRecords.map((record) => (
              <div
                key={record.id}
                className={`product-card ${selectedRecordId === record.id ? "selected" : ""}`}
                onClick={() => setSelectedRecordId(record.id)}
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
      <main className="processing-main">
        {selectedRecord ? (
          <div
            style={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            {/* Selected Record Header details */}
            <div
              className="main-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "32px",
                paddingBottom: "24px",
                borderBottom: "2px solid #f1f5f9",
              }}
            >
              <div
                className="header-title"
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <Scissors size={32} style={{ color: "#2563eb" }} />
                <div>
                  <h1
                    style={{
                      fontSize: "26px",
                      fontWeight: "800",
                      margin: 0,
                      color: "#0f172a",
                    }}
                  >
                    Single &amp; Double Drawn Sorting
                  </h1>
                  <p
                    className="header-subtitle"
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
              </div>
            </div>

            {/* Detail Info Cards: Output, Lost, Spoilage, Return, Worker */}
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

            {/* Category Size forms (vertical layout) */}
            {hasPermission("SingleDoubleDrawn.Create") && (
              <form onSubmit={handleSubmit}>
                <div className="categories-container" style={{ display: "flex", gap: "24px", flexDirection: "column" }}>
                  {/* Column 1: Two Inches Category (6,7,8,9,10) */}
                  <div className="category-column category-column-two">
                    <h3 className="category-title" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", fontWeight: "700", marginBottom: "12px" }}>
                      <LayoutGrid size={18} style={{ color: "#2563eb" }} />
                      Two Inches Category
                    </h3>
                    <div className="table-container" style={{ border: "1.5px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", background: "white" }}>
                      <table className="table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
                        <thead>
                          <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                            <th style={{ padding: "10px 16px", fontWeight: "700", color: "#475569" }}>SIZE</th>
                            <th style={{ padding: "10px 16px", fontWeight: "700", color: "#475569", width: "160px" }}>WEIGHT (viss)</th>
                            <th style={{ padding: "10px 16px", fontWeight: "700", color: "#475569", width: "160px" }}>PRICE (MMK)</th>
                            <th style={{ padding: "10px 16px", fontWeight: "700", color: "#475569", textAlign: "right" }}>AMOUNT (MMK)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {["6", "7", "8", "9", "10"].map((size) => {
                            const weightVal = parseFloat(twoInchesForm[`size${size}` as keyof typeof twoInchesForm]) || 0;
                            const priceVal = parseFloat(twoInchesPricesForm[`price${size}` as keyof typeof twoInchesPricesForm]) || 0;
                            const amount = weightVal * priceVal;
                            return (
                              <tr key={size} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "10px 16px", fontWeight: "700", color: "#1e293b" }}>Size {size}</td>
                                <td style={{ padding: "6px 16px" }}>
                                  <input
                                    type="number"
                                    step="0.001"
                                    name={`size${size}`}
                                    placeholder="0.000"
                                    value={twoInchesForm[`size${size}` as keyof typeof twoInchesForm]}
                                    onChange={handleTwoInchesChange}
                                    style={{
                                      width: "100%",
                                      padding: "8px 12px",
                                      borderRadius: "8px",
                                      border: "1.5px solid #cbd5e1",
                                      fontSize: "13.5px",
                                      fontWeight: "600",
                                      outline: "none",
                                      boxSizing: "border-box"
                                    }}
                                  />
                                </td>
                                <td style={{ padding: "6px 16px" }}>
                                  <input
                                    type="number"
                                    name={`price${size}`}
                                    placeholder="0"
                                    value={twoInchesPricesForm[`price${size}` as keyof typeof twoInchesPricesForm]}
                                    onChange={handleTwoInchesPriceChange}
                                    style={{
                                      width: "100%",
                                      padding: "8px 12px",
                                      borderRadius: "8px",
                                      border: "1.5px solid #cbd5e1",
                                      fontSize: "13.5px",
                                      fontWeight: "600",
                                      outline: "none",
                                      boxSizing: "border-box"
                                    }}
                                  />
                                </td>
                                <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: "700", color: "#0f172a" }}>
                                  {amount > 0 ? amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                                </td>
                              </tr>
                            );
                          })}
                          
                          {/* Spoilage row */}
                          {(() => {
                            const spoilageW = parseFloat(spoilageSizeWeight) || 0;
                            const spoilageP = parseFloat(spoilageSizePrice) || 0;
                            const spoilageAmt = spoilageW * spoilageP;
                            return (
                              <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#fffaf8" }}>
                                <td style={{ padding: "10px 16px", fontWeight: "700", color: "#ea580c" }}>Spoilage</td>
                                <td style={{ padding: "6px 16px" }}>
                                  <input
                                    type="number"
                                    step="0.001"
                                    placeholder="0.000"
                                    value={spoilageSizeWeight}
                                    onChange={(e) => setSpoilageSizeWeight(e.target.value)}
                                    style={{
                                      width: "100%",
                                      padding: "8px 12px",
                                      borderRadius: "8px",
                                      border: "1.5px solid #ffedd5",
                                      fontSize: "13.5px",
                                      fontWeight: "600",
                                      outline: "none",
                                      boxSizing: "border-box",
                                      background: "#fff"
                                    }}
                                  />
                                </td>
                                <td style={{ padding: "6px 16px" }}>
                                  <input
                                    type="number"
                                    step="1"
                                    placeholder="0"
                                    value={spoilageSizePrice}
                                    onChange={(e) => setSpoilageSizePrice(e.target.value)}
                                    style={{
                                      width: "100%",
                                      padding: "8px 12px",
                                      borderRadius: "8px",
                                      border: spoilageW > 0 && spoilageP <= 0 ? "1.5px solid #ef4444" : "1.5px solid #ffedd5",
                                      fontSize: "13.5px",
                                      fontWeight: "600",
                                      outline: "none",
                                      boxSizing: "border-box",
                                      background: "#fff"
                                    }}
                                  />
                                </td>
                                <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: "700", color: spoilageAmt > 0 ? "#ea580c" : "#cbd5e1", fontStyle: spoilageAmt > 0 ? "normal" : "italic" }}>
                                  {spoilageAmt > 0 ? spoilageAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                                </td>
                              </tr>
                            );
                          })()}

                          {/* Return row */}
                          {(() => {
                            const returnW = parseFloat(returnSizeWeight) || 0;
                            const returnP = parseFloat(returnSizePrice) || 0;
                            const returnAmt = returnW * returnP;
                            return (
                              <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                                <td style={{ padding: "10px 16px", fontWeight: "700", color: "#2563eb" }}>Return</td>
                                <td style={{ padding: "6px 16px" }}>
                                  <input
                                    type="number"
                                    step="0.001"
                                    placeholder="0.000"
                                    value={returnSizeWeight}
                                    onChange={(e) => setReturnSizeWeight(e.target.value)}
                                    style={{
                                      width: "100%",
                                      padding: "8px 12px",
                                      borderRadius: "8px",
                                      border: "1.5px solid #dbeafe",
                                      fontSize: "13.5px",
                                      fontWeight: "600",
                                      outline: "none",
                                      boxSizing: "border-box",
                                      background: "#fff"
                                    }}
                                  />
                                </td>
                                <td style={{ padding: "6px 16px" }}>
                                  <input
                                    type="number"
                                    step="1"
                                    placeholder="0"
                                    value={returnSizePrice}
                                    onChange={(e) => setReturnSizePrice(e.target.value)}
                                    style={{
                                      width: "100%",
                                      padding: "8px 12px",
                                      borderRadius: "8px",
                                      border: returnW > 0 && returnP <= 0 ? "1.5px solid #ef4444" : "1.5px solid #dbeafe",
                                      fontSize: "13.5px",
                                      fontWeight: "600",
                                      outline: "none",
                                      boxSizing: "border-box",
                                      background: "#fff"
                                    }}
                                  />
                                </td>
                                <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: "700", color: returnAmt > 0 ? "#2563eb" : "#cbd5e1", fontStyle: returnAmt > 0 ? "normal" : "italic" }}>
                                  {returnAmt > 0 ? returnAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                                </td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Column 2: B to Ten Category (10,12,14,16,18,20,22,24,26,28,Bar) */}
                  <div className="category-column category-column-b">
                    <h3 className="category-title" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", fontWeight: "700", marginBottom: "12px" }}>
                      <LayoutGrid size={18} style={{ color: "#8b5cf6" }} />
                      B to Ten Category
                    </h3>
                    <div className="table-container" style={{ border: "1.5px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", background: "white" }}>
                      <table className="table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13.5px" }}>
                        <thead>
                          <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                            <th style={{ padding: "10px 16px", fontWeight: "700", color: "#475569" }}>SIZE</th>
                            <th style={{ padding: "10px 16px", fontWeight: "700", color: "#475569", width: "160px" }}>WEIGHT (viss)</th>
                            <th style={{ padding: "10px 16px", fontWeight: "700", color: "#475569", width: "160px" }}>PRICE (MMK)</th>
                            <th style={{ padding: "10px 16px", fontWeight: "700", color: "#475569", textAlign: "right" }}>AMOUNT (MMK)</th>
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
                            const displayLabel = size === "10B" ? "Size 10B" : `Size ${size}`;

                            const weightVal = parseFloat(bToTenForm[fieldName as keyof typeof bToTenForm]) || 0;
                            const priceVal = parseFloat(bToTenPricesForm[priceFieldName as keyof typeof bToTenPricesForm]) || 0;
                            const amount = weightVal * priceVal;

                            return (
                              <tr key={size} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "10px 16px", fontWeight: "700", color: "#1e293b" }}>{displayLabel}</td>
                                <td style={{ padding: "6px 16px" }}>
                                  <input
                                    type="number"
                                    step="0.001"
                                    name={fieldName}
                                    placeholder="0.000"
                                    value={bToTenForm[fieldName as keyof typeof bToTenForm]}
                                    onChange={handleBToTenChange}
                                    style={{
                                      width: "100%",
                                      padding: "8px 12px",
                                      borderRadius: "8px",
                                      border: "1.5px solid #cbd5e1",
                                      fontSize: "13.5px",
                                      fontWeight: "600",
                                      outline: "none",
                                      boxSizing: "border-box"
                                    }}
                                  />
                                </td>
                                <td style={{ padding: "6px 16px" }}>
                                  <input
                                    type="number"
                                    name={priceFieldName}
                                    placeholder="0"
                                    value={bToTenPricesForm[priceFieldName as keyof typeof bToTenPricesForm]}
                                    onChange={handleBToTenPriceChange}
                                    style={{
                                      width: "100%",
                                      padding: "8px 12px",
                                      borderRadius: "8px",
                                      border: "1.5px solid #cbd5e1",
                                      fontSize: "13.5px",
                                      fontWeight: "600",
                                      outline: "none",
                                      boxSizing: "border-box"
                                    }}
                                  />
                                </td>
                                <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: "700", color: "#0f172a" }}>
                                  {amount > 0 ? amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Remaining Weight live indicator */}
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
                      <CheckCircle2 size={22} style={{ color: "#10b981" }} />
                    ) : (
                      <Weight
                        size={22}
                        style={{
                          color: remainingWeight < 0 ? "#ef4444" : "#f59e0b",
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
                        Output: {selectedRecord.weight.toFixed(3)} viss — Already
                        Saved: {alreadySortedWeight.toFixed(3)} viss — Current Input:{" "}
                        {currentFormTotal.toFixed(3)} viss — Total Amount: {totalFormAmount.toLocaleString()} MMK
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
                    Math.abs(remainingWeight) > 0.001 || currentFormTotal <= 0
                  }
                  style={{
                    width: "100%",
                    padding: "14px",
                    background:
                      Math.abs(remainingWeight) > 0.001 || currentFormTotal <= 0
                        ? "#94a3b8"
                        : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: "700",
                    cursor:
                      Math.abs(remainingWeight) > 0.001 || currentFormTotal <= 0
                        ? "not-allowed"
                        : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow:
                      Math.abs(remainingWeight) > 0.001 || currentFormTotal <= 0
                        ? "none"
                        : "0 4px 12px rgba(37,99,235,0.2)",
                    opacity:
                      Math.abs(remainingWeight) > 0.001 || currentFormTotal <= 0
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

            {/* Recent History Table for Single Selection */}
            <div className="history-section" style={{ marginTop: "40px" }}>
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#0f172a",
                  marginBottom: "16px",
                }}
              >
                Sorting History (Selected Stock)
              </h2>
              <div
                className="table-container"
                style={{
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "12px",
                  overflow: "hidden",
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
                          padding: "12px 16px",
                          fontWeight: "700",
                          color: "#475569",
                        }}
                      >
                        Date
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          fontWeight: "700",
                          color: "#475569",
                        }}
                      >
                        Two Inches Sizes (6,7,8,9,10)
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          fontWeight: "700",
                          color: "#475569",
                        }}
                      >
                        B to Ten Sizes (10,12,14...Bar)
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          fontWeight: "700",
                          color: "#475569",
                        }}
                      >
                        Lost Weight
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          fontWeight: "700",
                          color: "#475569",
                        }}
                      >
                        Spoilage Weight
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          fontWeight: "700",
                          color: "#475569",
                        }}
                      >
                        Return Weight
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          fontWeight: "700",
                          color: "#475569",
                          textAlign: "right",
                        }}
                      >
                        Total Amount
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          fontWeight: "700",
                          color: "#475569",
                          textAlign: "center",
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedRecords.filter(
                      (r) => r.refinementRecordId === selectedRecordId,
                    ).length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          style={{
                            padding: "24px",
                            textAlign: "center",
                            color: "#94a3b8",
                          }}
                        >
                          No sorting history recorded for this stock item.
                        </td>
                      </tr>
                    ) : (
                      savedRecords
                        .filter(
                          (r) => r.refinementRecordId === selectedRecordId,
                        )
                        .map((record) => (
                          <tr
                            key={record.id}
                            style={{ borderBottom: "1px solid #f1f5f9" }}
                          >
                            <td
                              style={{
                                padding: "12px 16px",
                                whiteSpace: "nowrap",
                                fontWeight: "500",
                                color: "#0f172a",
                              }}
                            >
                              {formatDateTime(record.date)}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              {renderTwoInchesBadges(record)}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              {renderBToTenBadges(record)}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <span
                                style={{
                                  background: "#f3f4f6",
                                  color: "#4b5563",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  fontSize: "11.5px",
                                  fontWeight: "700",
                                }}
                              >
                                {record.lostWeight
                                  ? record.lostWeight.toFixed(3)
                                  : "0.000"}{" "}
                                viss
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <span
                                style={{
                                  background: "#ffedd5",
                                  color: "#ea580c",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  fontSize: "11.5px",
                                  fontWeight: "700",
                                }}
                              >
                                {record.spoilageWeight
                                  ? record.spoilageWeight.toFixed(3)
                                  : "0.000"}{" "}
                                viss
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <span
                                style={{
                                  background: "#dbeafe",
                                  color: "#2563eb",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  fontSize: "11.5px",
                                  fontWeight: "700",
                                }}
                              >
                                {record.returnWeight
                                  ? record.returnWeight.toFixed(3)
                                  : "0.000"}{" "}
                                viss
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "right",
                                fontWeight: "700",
                                color: "#2563eb",
                              }}
                            >
                              {calculateRecordTotalAmount(record).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MMK
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "center",
                              }}
                            >
                              {hasPermission("SingleDoubleDrawn.Delete") && (
                                <button
                                  onClick={() => handleDeleteRecord(record.id)}
                                  className="btn btn-danger"
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          // Placeholder when no selection + Global History
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "32px",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8",
                padding: "40px 20px",
                background: "#f8fafc",
                borderRadius: "16px",
                border: "2px dashed #e2e8f0",
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
              <p style={{ fontSize: "13.0px", margin: 0 }}>
                Select a refined stock record from the sidebar to start sorting
                sizes.
              </p>
            </div>

            <div className="history-section">
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#0f172a",
                  marginBottom: "16px",
                }}
              >
                Global Sorting History
              </h2>
              <div
                className="table-container"
                style={{
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "12px",
                  overflow: "hidden",
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
                          padding: "12px 16px",
                          fontWeight: "700",
                          color: "#475569",
                        }}
                      >
                        Stock Item
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          fontWeight: "700",
                          color: "#475569",
                        }}
                      >
                        Date
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          fontWeight: "700",
                          color: "#475569",
                        }}
                      >
                        Two Inches Sizes (6,7,8,9,10)
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          fontWeight: "700",
                          color: "#475569",
                        }}
                      >
                        B to Ten Sizes (10,12,14...Bar)
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          fontWeight: "700",
                          color: "#475569",
                        }}
                      >
                        Lost Weight
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          fontWeight: "700",
                          color: "#475569",
                        }}
                      >
                        Spoilage Weight
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          fontWeight: "700",
                          color: "#475569",
                        }}
                      >
                        Return Weight
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          fontWeight: "700",
                          color: "#475569",
                          textAlign: "right",
                        }}
                      >
                        Total Amount
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          fontWeight: "700",
                          color: "#475569",
                          textAlign: "center",
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          style={{
                            padding: "24px",
                            textAlign: "center",
                            color: "#94a3b8",
                          }}
                        >
                          No sorting history recorded.
                        </td>
                      </tr>
                    ) : (
                      savedRecords.map((record) => (
                        <tr
                          key={record.id}
                          style={{ borderBottom: "1px solid #f1f5f9" }}
                        >
                          <td
                            style={{
                              padding: "12px 16px",
                              fontWeight: "600",
                              color: "#334155",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "13.5px",
                                  color: "#0f172a",
                                  fontWeight: "700",
                                }}
                              >
                                {record.refinementRecordMarker || "---"}
                              </span>
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#64748b",
                                  fontWeight: 500,
                                  marginTop: "2px",
                                }}
                              >
                                {record.refinementRecordWarehouseName || "---"}{" "}
                                • {record.refinementRecordCategory || "---"}
                              </span>
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              whiteSpace: "nowrap",
                              fontWeight: "500",
                              color: "#0f172a",
                            }}
                          >
                            {formatDateTime(record.date)}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            {renderTwoInchesBadges(record)}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            {renderBToTenBadges(record)}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                background: "#f3f4f6",
                                color: "#4b5563",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                fontSize: "11.5px",
                                fontWeight: "700",
                              }}
                            >
                              {record.lostWeight
                                ? record.lostWeight.toFixed(3)
                                : "0.000"}{" "}
                              viss
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                background: "#ffedd5",
                                color: "#ea580c",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                fontSize: "11.5px",
                                fontWeight: "700",
                              }}
                            >
                              {record.spoilageWeight
                                ? record.spoilageWeight.toFixed(3)
                                : "0.000"}{" "}
                              viss
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                background: "#dbeafe",
                                color: "#2563eb",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                fontSize: "11.5px",
                                fontWeight: "700",
                              }}
                            >
                              {record.returnWeight
                                ? record.returnWeight.toFixed(3)
                                : "0.000"}{" "}
                              viss
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              textAlign: "right",
                              fontWeight: "700",
                              color: "#2563eb",
                            }}
                          >
                            {calculateRecordTotalAmount(record).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MMK
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              textAlign: "center",
                            }}
                          >
                            {hasPermission("SingleDoubleDrawn.Delete") && (
                              <button
                                onClick={() => handleDeleteRecord(record.id)}
                                className="btn btn-danger"
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SingleDoubleDrawn;
