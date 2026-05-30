import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { singleDoubleDrawnAPI, semiExportAPI, productsAPI, salesAPI } from "../../services/api";
import type { SingleDoubleDrawnRecord, SemiExportRecord, Product, Sale } from "../../types";
import {
  Package,
  Search,
  Sparkles,
  DollarSign,
  Trash2,
  FileText,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Scale,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { formatDateTime } from "../../utils/format";
import "./index.css";

interface GroupedMarker {
  markerName: string;
  records: SingleDoubleDrawnRecord[];
  combinedWeight: number;
  date: string;
  warehouseNames: string[];
}

const Sales5: React.FC = () => {
  const { hasPermission } = useAuth();
  const [sddRecords, setSddRecords] = useState<SingleDoubleDrawnRecord[]>([]);
  const [savedExports, setSavedExports] = useState<SemiExportRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formError, setFormError] = useState("");
  const [, setSaving] = useState(false);

  const [recordRemarks, setRecordRemarks] = useState<Record<number, string>>(
    {},
  );
  const [expandedRecords, setExpandedRecords] = useState<
    Record<number, boolean>
  >({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sddData, exportData, productsData, salesData] = await Promise.all([
        singleDoubleDrawnAPI.getAll(),
        semiExportAPI.getAll(),
        productsAPI.getAll(true),
        salesAPI.getAll("Sales"),
      ]);
      setSddRecords(sddData);
      setSavedExports(exportData);
      setProducts(productsData);
      setSales(salesData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedRecords = useMemo(() => {
    if (!selectedMarker) return [];
    return sddRecords.filter(
      (r) => r.refinementRecordMarker === selectedMarker,
    );
  }, [sddRecords, selectedMarker]);

  // Find product for selected marker
  const selectedProduct = useMemo(() => {
    if (!selectedMarker) return null;
    return products.find((p) => p.marker === selectedMarker);
  }, [products, selectedMarker]);

  // Find sales for selected marker
  const selectedProductSales = useMemo(() => {
    if (!selectedMarker) return [];
    return sales.filter(
      (s) => s.productMarker === selectedMarker || s.marker === selectedMarker
    );
  }, [sales, selectedMarker]);

  // Compute metrics for selected marker
  const selectedMarkerStats = useMemo(() => {
    if (!selectedMarker) return null;

    // 1. Original weight in inventory
    const originalWeight = selectedProduct ? selectedProduct.weight : 0;
    const unit = selectedProduct ? selectedProduct.unit : "viss";

    // 2. Weight sold in Raw Material Sales
    const weightSoldRawMaterial = selectedProductSales.reduce(
      (sum, s) => sum + s.weight,
      0
    );

    // 3. Remaining weight after selling in Raw Material Sales
    const remainingWeightAfterSales = originalWeight - weightSoldRawMaterial;

    // 4. Sum of Lost Weight of all colors
    const sumLostWeight = selectedRecords.reduce(
      (sum, r) => sum + (r.lostWeight || 0),
      0
    );

    // 5. Sum of Spoilage Weight of all colors (including Two Inches Spoilage)
    const sumSpoilageWeight = selectedRecords.reduce(
      (sum, r) => sum + (r.spoilageWeight || 0) + (r.spoilageSize || 0),
      0
    );

    // 6. Sum of Return Weight of all colors (including Two Inches Return)
    const sumReturnWeight = selectedRecords.reduce(
      (sum, r) => sum + (r.returnWeight || 0) + (r.returnSize || 0),
      0
    );

    return {
      originalWeight,
      weightSoldRawMaterial,
      remainingWeightAfterSales,
      sumLostWeight,
      sumSpoilageWeight,
      sumReturnWeight,
      unit,
    };
  }, [selectedMarker, selectedProduct, selectedProductSales, selectedRecords]);

  useEffect(() => {
    if (selectedMarker) {
      const newRemarks: Record<number, string> = {};
      const newExpanded: Record<number, boolean> = {};

      selectedRecords.forEach((record) => {
        const saved = savedExports.find(
          (x) => x.singleDoubleDrawnRecordId === record.id,
        );
        if (saved) {
          newRemarks[record.id] = saved.remark || "";
        } else {
          newRemarks[record.id] = "";
        }
        // Collapse all by default
        newExpanded[record.id] = false;
      });

      setRecordRemarks(newRemarks);
      setExpandedRecords(newExpanded);
    } else {
      setRecordRemarks({});
      setExpandedRecords({});
    }
  }, [selectedMarker, selectedRecords, savedExports]);

  // Calculate the total sorted weights for sidebar display
  const getSortedTotal = (record: SingleDoubleDrawnRecord) => {
    return (
      record.size6 +
      record.size7 +
      record.size8 +
      record.size9 +
      record.size10 +
      record.size10B +
      record.size12 +
      record.size14 +
      record.size16 +
      record.size18 +
      record.size20 +
      record.size22 +
      record.size24 +
      record.size26 +
      record.size28 +
      record.sizeBar
    );
  };

  const groupedRecords = useMemo(() => {
    const groups: Record<string, GroupedMarker> = {};
    sddRecords.forEach((record) => {
      const marker = record.refinementRecordMarker || "---";
      if (!groups[marker]) {
        groups[marker] = {
          markerName: marker,
          records: [],
          combinedWeight: 0,
          date: record.date,
          warehouseNames: [],
        };
      }
      groups[marker].records.push(record);
      groups[marker].combinedWeight += getSortedTotal(record);
      if (
        record.date &&
        new Date(record.date) > new Date(groups[marker].date)
      ) {
        groups[marker].date = record.date;
      }
      if (
        record.refinementRecordWarehouseName &&
        !groups[marker].warehouseNames.includes(
          record.refinementRecordWarehouseName,
        )
      ) {
        groups[marker].warehouseNames.push(
          record.refinementRecordWarehouseName,
        );
      }
    });
    return Object.values(groups);
  }, [sddRecords]);

  // Filter sidebar list
  const filteredGroupedRecords = useMemo(() => {
    return groupedRecords.filter((g) => {
      const search = searchTerm.toLowerCase();
      const marker = g.markerName.toLowerCase();
      const warehouses = g.warehouseNames.map((w) => w.toLowerCase()).join(" ");
      const dateStr = g.date
        ? new Date(g.date).toLocaleDateString().toLowerCase()
        : "";
      const categories = g.records
        .map((r) => (r.refinementRecordCategory || "").toLowerCase())
        .join(" ");

      return (
        marker.includes(search) ||
        warehouses.includes(search) ||
        dateStr.includes(search) ||
        categories.includes(search)
      );
    });
  }, [groupedRecords, searchTerm]);

  // Calculate grouped weights for each record in the selected marker
  const recordCalculations = useMemo(() => {
    const calcs: Record<number, any> = {};
    selectedRecords.forEach((record) => {
      const wB = record.sizeBar || 0;
      const w28 = record.size28 || 0;
      const w26 = record.size26 || 0;
      const w24 = record.size24 || 0;
      const w22 = record.size22 || 0;
      const w20 = record.size20 || 0;
      const w18 = record.size18 || 0;
      const w16 = record.size16 || 0;
      const w14 = record.size14 || 0;
      const w12 = record.size12 || 0;
      const w10B = record.size10B || 0;
      const w10 = record.size10 || 0;
      const w9 = record.size9 || 0;
      const w8 = record.size8 || 0;
      const w7 = record.size7 || 0;
      const w6 = record.size6 || 0;
      const wLeftover = record.returnWeight || 0;
      const wSpoil = record.spoilageWeight || 0;
      const wLoss = record.lostWeight || 0;

      const totalWeight =
        wB +
        w28 +
        w26 +
        w24 +
        w22 +
        w20 +
        w18 +
        w16 +
        w14 +
        w12 +
        w10B +
        w10 +
        w9 +
        w8 +
        w7 +
        w6 +
        wLeftover +
        wSpoil;
      const denominator = totalWeight - wLoss > 0 ? totalWeight - wLoss : 1;

      calcs[record.id] = {
        wB,
        w28,
        w26,
        w24,
        w22,
        w20,
        w18,
        w16,
        w14,
        w12,
        w10B,
        w10,
        w9,
        w8,
        w7,
        w6,
        wLeftover,
        wSpoil,
        wLoss,
        totalWeight,
        denominator,
      };
    });
    return calcs;
  }, [selectedRecords]);

  const handleRecordRemarkChange = (recordId: number, val: string) => {
    setRecordRemarks((prev) => ({
      ...prev,
      [recordId]: val,
    }));
  };

  const toggleRecordExpanded = (recordId: number) => {
    setExpandedRecords((prev) => ({
      ...prev,
      [recordId]: !prev[recordId],
    }));
  };

  // Calculate row Amounts for each record
  const recordAmounts = useMemo(() => {
    const amts: Record<number, any> = {};
    selectedRecords.forEach((record) => {
      const calculations = recordCalculations[record.id];
      if (!calculations) return;

      const {
        wB,
        w28,
        w26,
        w24,
        w22,
        w20,
        w18,
        w16,
        w14,
        w12,
        w10B,
        w10,
        w9,
        w8,
        w7,
        w6,
        wLeftover,
        wSpoil,
      } = calculations;

      const amtB = wB * (record.priceBar || 0);
      const amt28 = w28 * (record.price28 || 0);
      const amt26 = w26 * (record.price26 || 0);
      const amt24 = w24 * (record.price24 || 0);
      const amt22 = w22 * (record.price22 || 0);
      const amt20 = w20 * (record.price20 || 0);
      const amt18 = w18 * (record.price18 || 0);
      const amt16 = w16 * (record.price16 || 0);
      const amt14 = w14 * (record.price14 || 0);
      const amt12 = w12 * (record.price12 || 0);
      const amt10B = w10B * (record.price10B || 0);
      const amt10 = w10 * (record.price10 || 0);
      const amt9 = w9 * (record.price9 || 0);
      const amt8 = w8 * (record.price8 || 0);
      const amt7 = w7 * (record.price7 || 0);
      const amt6 = w6 * (record.price6 || 0);
      const amtLeftover = wLeftover * (record.priceReturnSize || 0);
      const amtSpoil = wSpoil * (record.priceSpoilageSize || 0);

      const totalAmount =
        amtB +
        amt28 +
        amt26 +
        amt24 +
        amt22 +
        amt20 +
        amt18 +
        amt16 +
        amt14 +
        amt12 +
        amt10B +
        amt10 +
        amt9 +
        amt8 +
        amt7 +
        amt6 +
        amtLeftover +
        amtSpoil;

      amts[record.id] = {
        amtB,
        amt28,
        amt26,
        amt24,
        amt22,
        amt20,
        amt18,
        amt16,
        amt14,
        amt12,
        amt10B,
        amt10,
        amt9,
        amt8,
        amt7,
        amt6,
        amtLeftover,
        amtSpoil,
        totalAmount,
      };
    });
    return amts;
  }, [selectedRecords, recordCalculations]);

  const handleSaveRecord = async (e: React.FormEvent, recordId: number) => {
    e.preventDefault();
    const record = selectedRecords.find((r) => r.id === recordId);
    const remarkState = recordRemarks[recordId] || "";
    if (!record) return;

    setSaving(true);
    setFormError("");

    try {
      const dto = {
        singleDoubleDrawnRecordId: recordId,
        priceB: record.priceBar,
        price28: record.price28,
        price26: record.price26,
        price24: record.price24,
        price22: record.price22,
        price20: record.price20,
        price18: record.price18,
        price16: record.price16,
        price14: record.price14,
        price12: record.price12,
        price10B: record.price10B,
        price10: record.price10,
        price9: record.price9,
        price8: record.price8,
        price7: record.price7,
        price6: record.price6,
        priceLeftover: record.priceReturnSize,
        priceSpoil: record.priceSpoilageSize,
        remark: remarkState,
      };

      await semiExportAPI.upsert(dto);
      await loadData();
    } catch (err) {
      console.error("Failed to save export prices:", err);
      setFormError("Failed to save Semi Export transaction. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExport = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this Semi Export record?",
      )
    )
      return;
    try {
      await semiExportAPI.delete(id);
      await loadData();
    } catch (err) {
      console.error("Failed to delete export:", err);
      alert("Failed to delete record");
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div className="processing-container fade-in">
      {/* Left Sidebar: Single Double Drawn Sorting List */}
      <aside className="product-sidebar">
        <h2 className="sidebar-title">
          <Package size={20} />
          Sorted Batches
        </h2>

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
            placeholder="Search marker, warehouse..."
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
          {filteredGroupedRecords.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: "#94a3b8",
                padding: "20px",
                fontSize: "13.5px",
              }}
            >
              No sorted batches found
            </div>
          ) : (
            filteredGroupedRecords.map((group) => {
              const savedCount = group.records.filter((r) =>
                savedExports.some((x) => x.singleDoubleDrawnRecordId === r.id),
              ).length;
              const isFullySaved = savedCount === group.records.length;
              const isPartiallySaved =
                savedCount > 0 && savedCount < group.records.length;

              return (
                <div
                  key={group.markerName}
                  className={`product-card ${selectedMarker === group.markerName ? "selected" : ""}`}
                  onClick={() => setSelectedMarker(group.markerName)}
                >
                  <div className="card-header">
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span className="card-marker">{group.markerName}</span>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
                          fontWeight: 500,
                          marginTop: "2px",
                        }}
                      >
                        {group.warehouseNames.join(", ") || "---"}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        alignItems: "center",
                      }}
                    >
                      {isFullySaved && (
                        <span
                          style={{
                            background: "#d1fae5",
                            color: "#065f46",
                            fontSize: "10.0px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          <CheckCircle size={10} /> Saved
                        </span>
                      )}
                      {isPartiallySaved && (
                        <span
                          style={{
                            background: "#fef3c7",
                            color: "#92400e",
                            fontSize: "10.0px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          Saved ({savedCount}/{group.records.length})
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className="card-details"
                    style={{ flexDirection: "column", gap: "4px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>
                        Total Sorted:{" "}
                        <strong style={{ color: "#059669" }}>
                          {group.combinedWeight.toFixed(3)}
                        </strong>{" "}
                        viss
                      </span>
                      <span>
                        Date:{" "}
                        <span style={{ color: "#475569", fontWeight: 500 }}>
                          {new Date(group.date).toLocaleDateString()}
                        </span>
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "4px",
                        flexWrap: "wrap",
                        marginTop: "4px",
                      }}
                    >
                      {group.records.map((r) => (
                        <span
                          key={r.id}
                          className={`rf-badge category-${(r.refinementRecordCategory || "").toLowerCase().replace(".", "")}`}
                          style={{ fontSize: "9px", padding: "1px 4px" }}
                        >
                          {r.refinementRecordCategory}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Right Main Content */}
      <main className="processing-main">
        {selectedMarker && selectedRecords.length > 0 ? (
          <div
            style={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            {/* Header details */}
            <div
              className="main-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "24px",
                paddingBottom: "16px",
                borderBottom: "2px solid #f1f5f9",
              }}
            >
              <div
                className="header-title"
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <DollarSign size={32} style={{ color: "#2563eb" }} />
                <div>
                  <h1
                    style={{
                      fontSize: "26px",
                      fontWeight: "800",
                      margin: 0,
                      color: "#0f172a",
                    }}
                  >
                    Semi Export
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
                    Marker: <strong>{selectedMarker}</strong> • Warehouse(s):{" "}
                    <strong>
                      {Array.from(
                        new Set(
                          selectedRecords
                            .map((r) => r.refinementRecordWarehouseName)
                            .filter(Boolean),
                        ),
                      ).join(", ") || "---"}
                    </strong>
                  </p>
            </div>
          </div>
        </div>

            {/* Stats Dashboard Grid */}
            {selectedMarkerStats && (
              <div className="stats-grid">
                {/* 1. Original Weight */}
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">Original Weight</span>
                    <div className="stat-icon-wrapper" style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}>
                      <Scale size={16} />
                    </div>
                  </div>
                  <div>
                    <h3 className="stat-value">
                      {selectedMarkerStats.originalWeight.toFixed(2)}
                    </h3>
                    <span className="stat-footer">{selectedMarkerStats.unit} in Inventory</span>
                  </div>
                </div>

                {/* 2. Weight Sold in Raw Material Sales */}
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">Weight Sold</span>
                    <div className="stat-icon-wrapper" style={{ backgroundColor: "#fef2f2", color: "#ef4444" }}>
                      <Scale size={16} />
                    </div>
                  </div>
                  <div>
                    <h3 className="stat-value">
                      {selectedMarkerStats.weightSoldRawMaterial.toFixed(2)}
                    </h3>
                    <span className="stat-footer">{selectedMarkerStats.unit} in Raw Material Sales</span>
                  </div>
                </div>

                {/* 3. Remaining Weight after Sales */}
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">Remaining Weight</span>
                    <div className="stat-icon-wrapper" style={{ backgroundColor: "#ecfdf5", color: "#10b981" }}>
                      <Scale size={16} />
                    </div>
                  </div>
                  <div>
                    <h3 className="stat-value">
                      {selectedMarkerStats.remainingWeightAfterSales.toFixed(2)}
                    </h3>
                    <span className="stat-footer">{selectedMarkerStats.unit} after Raw Material Sales</span>
                  </div>
                </div>

                {/* 4. Sum of Lost Weight of all colors */}
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">Sum of Lost Weight</span>
                    <div className="stat-icon-wrapper" style={{ backgroundColor: "#fffbeb", color: "#d97706" }}>
                      <AlertTriangle size={16} />
                    </div>
                  </div>
                  <div>
                    <h3 className="stat-value">
                      {selectedMarkerStats.sumLostWeight.toFixed(3)}
                    </h3>
                    <span className="stat-footer">viss across all colors</span>
                  </div>
                </div>

                {/* 5. Sum of Spoilage Weight of all colors */}
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">Sum of Spoilage Weight</span>
                    <div className="stat-icon-wrapper" style={{ backgroundColor: "#faf5ff", color: "#8b5cf6" }}>
                      <AlertTriangle size={16} />
                    </div>
                  </div>
                  <div>
                    <h3 className="stat-value">
                      {selectedMarkerStats.sumSpoilageWeight.toFixed(3)}
                    </h3>
                    <span className="stat-footer">viss (incl. Two Inches Spoilage)</span>
                  </div>
                </div>

                {/* 6. Sum of Return Weight of all colors */}
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-title">Sum of Return Weight</span>
                    <div className="stat-icon-wrapper" style={{ backgroundColor: "#f0fdf4", color: "#15803d" }}>
                      <RotateCcw size={16} />
                    </div>
                  </div>
                  <div>
                    <h3 className="stat-value">
                      {selectedMarkerStats.sumReturnWeight.toFixed(3)}
                    </h3>
                    <span className="stat-footer">viss (incl. Two Inches Return)</span>
                  </div>
                </div>
              </div>
            )}

            <div
              style={{ display: "flex", flexDirection: "column", gap: "24px" }}
            >
              {selectedRecords.map((record) => {
                const calculations = recordCalculations[record.id];
                const rowAmounts = recordAmounts[record.id];
                const remarkState = recordRemarks[record.id] || "";
                const isExpanded = expandedRecords[record.id];
                const isSaved = savedExports.some(
                  (x) => x.singleDoubleDrawnRecordId === record.id,
                );

                if (!calculations || !rowAmounts) return null;

                return (
                  <div
                    key={record.id}
                    style={{
                      background: "white",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "16px",
                      overflow: "hidden",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.02)",
                    }}
                  >
                    {/* Record Header */}
                    <div
                      style={{
                        padding: "16px 24px",
                        background: "#f8fafc",
                        borderBottom: "1.5px solid #e2e8f0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                      onClick={() => toggleRecordExpanded(record.id)}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <span
                          className={`rf-badge category-${(record.refinementRecordCategory || "").toLowerCase().replace(".", "")}`}
                          style={{ fontSize: "12px", padding: "4px 10px" }}
                        >
                          {record.refinementRecordCategory}
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          Sorted Weight:{" "}
                          <strong style={{ color: "#0f172a" }}>
                            {calculations.totalWeight.toFixed(3)}
                          </strong>{" "}
                          viss
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          • Date:{" "}
                          <strong style={{ color: "#0f172a" }}>
                            {new Date(record.date).toLocaleDateString()}
                          </strong>
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          • Total Amount:{" "}
                          <strong style={{ color: "#2563eb" }}>
                            {rowAmounts.totalAmount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </strong>{" "}
                          MMK
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          • Loss Weight:{" "}
                          <strong style={{ color: "#b45309" }}>
                            {calculations.wLoss.toFixed(3)}
                          </strong>{" "}
                          viss
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        {isSaved && (
                          <span
                            style={{
                              background: "#d1fae5",
                              color: "#065f46",
                              fontSize: "11px",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontWeight: "bold",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <CheckCircle size={12} /> Saved
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </div>
                    </div>

                    {/* Record Body (Expanded Content) */}
                    {isExpanded && (
                      <form
                        onSubmit={(e) => handleSaveRecord(e, record.id)}
                        style={{ padding: "24px" }}
                      >
                        <div
                          className="table-container"
                          style={{
                            border: "1.5px solid #e2e8f0",
                            borderRadius: "12px",
                            overflow: "hidden",
                            background: "white",
                            marginBottom: "20px",
                          }}
                        >
                          <table
                            className="table"
                            style={{
                              width: "100%",
                              borderCollapse: "collapse",
                              textAlign: "left",
                              fontSize: "14px",
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
                                    textAlign: "right",
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
                                  BUY PRICES
                                </th>
                                <th
                                  style={{
                                    padding: "10px 16px",
                                    fontWeight: "700",
                                    color: "#475569",
                                    textAlign: "right",
                                  }}
                                >
                                  AMOUNT
                                </th>
                                <th
                                  style={{
                                    padding: "10px 16px",
                                    fontWeight: "700",
                                    color: "#475569",
                                    textAlign: "right",
                                    width: "110px",
                                  }}
                                >
                                  AVG %
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                {
                                  label: "B",
                                  w: calculations.wB,
                                  price: record.priceBar,
                                  amt: rowAmounts.amtB,
                                },
                                {
                                  label: "28",
                                  w: calculations.w28,
                                  price: record.price28,
                                  amt: rowAmounts.amt28,
                                },
                                {
                                  label: "26",
                                  w: calculations.w26,
                                  price: record.price26,
                                  amt: rowAmounts.amt26,
                                },
                                {
                                  label: "24",
                                  w: calculations.w24,
                                  price: record.price24,
                                  amt: rowAmounts.amt24,
                                },
                                {
                                  label: "22",
                                  w: calculations.w22,
                                  price: record.price22,
                                  amt: rowAmounts.amt22,
                                },
                                {
                                  label: "20",
                                  w: calculations.w20,
                                  price: record.price20,
                                  amt: rowAmounts.amt20,
                                },
                                {
                                  label: "18",
                                  w: calculations.w18,
                                  price: record.price18,
                                  amt: rowAmounts.amt18,
                                },
                                {
                                  label: "16",
                                  w: calculations.w16,
                                  price: record.price16,
                                  amt: rowAmounts.amt16,
                                },
                                {
                                  label: "14",
                                  w: calculations.w14,
                                  price: record.price14,
                                  amt: rowAmounts.amt14,
                                },
                                {
                                  label: "12",
                                  w: calculations.w12,
                                  price: record.price12,
                                  amt: rowAmounts.amt12,
                                },
                                {
                                  label: "10B",
                                  w: calculations.w10B,
                                  price: record.price10B,
                                  amt: rowAmounts.amt10B,
                                },
                                {
                                  label: "10",
                                  w: calculations.w10,
                                  price: record.price10,
                                  amt: rowAmounts.amt10,
                                },
                                {
                                  label: "9",
                                  w: calculations.w9,
                                  price: record.price9,
                                  amt: rowAmounts.amt9,
                                },
                                {
                                  label: "8",
                                  w: calculations.w8,
                                  price: record.price8,
                                  amt: rowAmounts.amt8,
                                },
                                {
                                  label: "7",
                                  w: calculations.w7,
                                  price: record.price7,
                                  amt: rowAmounts.amt7,
                                },
                                {
                                  label: "6",
                                  w: calculations.w6,
                                  price: record.price6,
                                  amt: rowAmounts.amt6,
                                },
                                {
                                  label: "Leftover",
                                  w: calculations.wLeftover,
                                  price: record.priceReturnSize,
                                  amt: rowAmounts.amtLeftover,
                                },
                                {
                                  label: "Spoil",
                                  w: calculations.wSpoil,
                                  price: record.priceSpoilageSize,
                                  amt: rowAmounts.amtSpoil,
                                },
                              ]
                                .filter((row) => row.w > 0)
                                .map((row, index) => {
                                  const avgPercent =
                                    (row.w / calculations.denominator) * 100;
                                  return (
                                    <tr
                                      key={row.label}
                                      style={{
                                        borderBottom: "1px solid #f1f5f9",
                                        background:
                                          index % 2 === 0 ? "white" : "#fdfdfd",
                                      }}
                                    >
                                      <td
                                        style={{
                                          padding: "8px 16px",
                                          fontWeight: "700",
                                          color: "#1e293b",
                                        }}
                                      >
                                        {row.label}
                                      </td>
                                      <td
                                        style={{
                                          padding: "8px 16px",
                                          textAlign: "right",
                                          fontWeight: "500",
                                          color: "#475569",
                                        }}
                                      >
                                        {row.w.toFixed(3)}
                                      </td>
                                      <td
                                        style={{
                                          padding: "8px 16px",
                                          textAlign: "right",
                                          fontWeight: "600",
                                          color: "#0f172a",
                                        }}
                                      >
                                        {(row.price || 0).toLocaleString()}
                                      </td>
                                      <td
                                        style={{
                                          padding: "8px 16px",
                                          textAlign: "right",
                                          fontWeight: "700",
                                          color: "#0f172a",
                                        }}
                                      >
                                        {row.amt.toFixed(2)}
                                      </td>
                                      <td
                                        style={{
                                          padding: "8px 16px",
                                          textAlign: "right",
                                          fontWeight: "600",
                                          color: "#64748b",
                                        }}
                                      >
                                        {avgPercent.toFixed(2)}%
                                      </td>
                                    </tr>
                                  );
                                })}

                              {/* TOTAL ROW */}
                              <tr
                                style={{
                                  background: "#f8fafc",
                                  borderTop: "2px solid #cbd5e1",
                                  borderBottom: "2.5px double #cbd5e1",
                                }}
                              >
                                <td
                                  style={{
                                    padding: "10px 16px",
                                    fontWeight: "800",
                                    color: "#0f172a",
                                  }}
                                >
                                  TOTAL
                                </td>
                                <td
                                  style={{
                                    padding: "10px 16px",
                                    textAlign: "right",
                                    fontWeight: "800",
                                    color: "#0f172a",
                                  }}
                                >
                                  {calculations.totalWeight.toFixed(3)}
                                </td>
                                <td style={{ padding: "10px 16px" }}></td>
                                <td
                                  style={{
                                    padding: "10px 16px",
                                    textAlign: "right",
                                    fontWeight: "800",
                                    color: "#2563eb",
                                  }}
                                >
                                  {rowAmounts.totalAmount.toFixed(2)}
                                </td>
                                <td
                                  style={{
                                    padding: "10px 16px",
                                    textAlign: "right",
                                    fontWeight: "800",
                                    color: "#475569",
                                  }}
                                >
                                  {(
                                    (calculations.totalWeight /
                                      calculations.denominator) *
                                    100
                                  ).toFixed(2)}
                                  %
                                </td>
                              </tr>

                              {/* LOSS ROW */}
                              <tr
                                style={{
                                  borderBottom: "1px solid #e2e8f0",
                                  background: "#fffbeb",
                                }}
                              >
                                <td
                                  style={{
                                    padding: "8px 16px",
                                    fontWeight: "700",
                                    color: "#b45309",
                                  }}
                                >
                                  Loss
                                </td>
                                <td
                                  style={{
                                    padding: "8px 16px",
                                    textAlign: "right",
                                    fontWeight: "700",
                                    color: "#b45309",
                                  }}
                                >
                                  {calculations.wLoss.toFixed(3)}
                                </td>
                                <td style={{ padding: "8px 16px" }}></td>
                                <td style={{ padding: "8px 16px" }}></td>
                                <td
                                  style={{
                                    padding: "8px 16px",
                                    textAlign: "right",
                                    fontWeight: "700",
                                    color: "#b45309",
                                  }}
                                >
                                  {(
                                    (calculations.wLoss /
                                      calculations.denominator) *
                                    100
                                  ).toFixed(2)}
                                  %
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Remark section */}
                        <div
                          className="remark-section"
                          style={{
                            background: "#f8fafc",
                            padding: "16px 20px",
                            borderRadius: "12px",
                            border: "1.5px solid #e2e8f0",
                            marginBottom: "20px",
                          }}
                        >
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontSize: "13.5px",
                              fontWeight: "700",
                              color: "#334155",
                              marginBottom: "6px",
                            }}
                          >
                            <FileText size={15} /> REMARK:
                          </label>
                          <textarea
                            value={remarkState}
                            onChange={(e) =>
                              handleRecordRemarkChange(
                                record.id,
                                e.target.value,
                              )
                            }
                            placeholder="Enter remark here..."
                            rows={2}
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              border: "1.5px solid #cbd5e1",
                              fontSize: "13px",
                              color: "#0f172a",
                              outline: "none",
                              resize: "vertical",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Cancel marker button */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "24px",
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedMarker(null)}
                className="btn btn-secondary"
                style={{
                  padding: "10px 24px",
                  borderRadius: "10px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close Marker View
              </button>
            </div>

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
                Select a sorted batch from the sidebar to calculate pricing and
                amounts.
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
                Semi Export History
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
                        Sorted Batch
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          fontWeight: "700",
                          color: "#475569",
                        }}
                      >
                        Export Date
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
                        }}
                      >
                        Remark
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
                    {savedExports.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            padding: "24px",
                            textAlign: "center",
                            color: "#94a3b8",
                          }}
                        >
                          No export history recorded.
                        </td>
                      </tr>
                    ) : (
                      savedExports.map((record) => {
                        // Calculate total amount from saved prices and the linked SDD record
                        const sdd = sddRecords.find(
                          (x) => x.id === record.singleDoubleDrawnRecordId,
                        );
                        let totalAmount = 0;
                        if (sdd) {
                          const wB = sdd.sizeBar || 0;
                          const w28 = sdd.size28 || 0;
                          const w26 = sdd.size26 || 0;
                          const w24 = sdd.size24 || 0;
                          const w22 = sdd.size22 || 0;
                          const w20 = sdd.size20 || 0;
                          const w18 = sdd.size18 || 0;
                          const w16 = sdd.size16 || 0;
                          const w14 = sdd.size14 || 0;
                          const w12 = sdd.size12 || 0;
                          const w10B = sdd.size10B || 0;
                          const w10 = sdd.size10 || 0;
                          const w9 = sdd.size9 || 0;
                          const w8 = sdd.size8 || 0;
                          const w7 = sdd.size7 || 0;
                          const w6 = sdd.size6 || 0;
                          const wLeftover = sdd.returnWeight || 0;
                          const wSpoil = sdd.spoilageWeight || 0;

                          totalAmount =
                            wB * record.priceB +
                            w28 * record.price28 +
                            w26 * record.price26 +
                            w24 * record.price24 +
                            w22 * record.price22 +
                            w20 * record.price20 +
                            w18 * record.price18 +
                            w16 * record.price16 +
                            w14 * record.price14 +
                            w12 * record.price12 +
                            w10B * record.price10B +
                            w10 * record.price10 +
                            w9 * record.price9 +
                            w8 * record.price8 +
                            w7 * record.price7 +
                            w6 * record.price6 +
                            wLeftover * record.priceLeftover +
                            wSpoil * record.priceSpoil;
                        }

                        return (
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
                                  {record.refinementRecordWarehouseName ||
                                    "---"}{" "}
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
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "right",
                                fontWeight: "700",
                                color: "#10b981",
                              }}
                            >
                              {totalAmount.toFixed(2)} MMK
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                color: "#475569",
                                fontSize: "13px",
                                maxWidth: "200px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={record.remark}
                            >
                              {record.remark || "—"}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "center",
                              }}
                            >
                              {hasPermission("Sales5.Delete") && (
                                <button
                                  onClick={() => handleDeleteExport(record.id)}
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
                        );
                      })
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

export default Sales5;
