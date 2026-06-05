import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  ledgerAPI,
  singleDoubleDrawnAPI,
  semiExportAPI,
  exchangeRatesAPI,
} from "../../services/api";
import type {
  LedgerDto,
  SingleDoubleDrawnRecord,
  SemiExportRecord,
  ExchangeRate,
} from "../../types";
import {
  FileText,
  Search,
  Calendar,
  Trash2,
  ChevronRight,
  ClipboardList,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import "./index.css";

const Sales6: React.FC = () => {
  const { hasPermission } = useAuth();
  const [ledgers, setLedgers] = useState<LedgerDto[]>([]);
  const [sddRecords, setSddRecords] = useState<SingleDoubleDrawnRecord[]>([]);
  const [savedExports, setSavedExports] = useState<SemiExportRecord[]>([]);
  const [allRates, setAllRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLedgerId, setSelectedLedgerId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"colors" | "markers">("colors");
  const [expandedColors, setExpandedColors] = useState<Record<string, boolean>>({});

  const toggleColorExpanded = (colorName: string) => {
    setExpandedColors((prev) => ({
      ...prev,
      [colorName]: !prev[colorName],
    }));
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ledgerData, sddData, exportData, ratesData] = await Promise.all([
        ledgerAPI.getAll(),
        singleDoubleDrawnAPI.getAll(),
        semiExportAPI.getAll(),
        exchangeRatesAPI.getAll(),
      ]);
      setLedgers(ledgerData);
      setSddRecords(sddData);
      setSavedExports(exportData);
      setAllRates(ratesData);
    } catch (error) {
      console.error("Failed to load export data:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedLedger = useMemo(() => {
    return ledgers.find((l) => l.id === selectedLedgerId) || null;
  }, [ledgers, selectedLedgerId]);

  const colorDetails = useMemo(() => {
    if (!selectedLedger) return [];

    const markerNames = selectedLedger.markers.map((m) => m.markerName);
    const ledgerRecords = sddRecords.filter((r) =>
      markerNames.includes(r.refinementRecordMarker || ""),
    );

    const groups: Record<
      string,
      {
        colorName: string;
        recordsCount: number;
        totalWeight: number;
        sizes: Record<string, number>;
        totalAmount: number;
        totalWorkerFees: number;
        markers: string[];
      }
    > = {};

    ledgerRecords.forEach((r) => {
      const color = r.refinementRecordCategory || "Unknown";
      if (!groups[color]) {
        groups[color] = {
          colorName: color,
          recordsCount: 0,
          totalWeight: 0,
          sizes: {
            "6": 0, "7": 0, "8": 0, "9": 0, "10": 0,
            "10B": 0, "12": 0, "14": 0, "16": 0, "18": 0,
            "20": 0, "22": 0, "24": 0, "26": 0, "28": 0, "Bar": 0
          },
          totalAmount: 0,
          totalWorkerFees: 0,
          markers: [],
        };
      }

      const g = groups[color];
      g.recordsCount += 1;

      const recordWeight =
        (r.size6 || 0) +
        (r.size7 || 0) +
        (r.size8 || 0) +
        (r.size9 || 0) +
        (r.size10 || 0) +
        (r.size10B || 0) +
        (r.size12 || 0) +
        (r.size14 || 0) +
        (r.size16 || 0) +
        (r.size18 || 0) +
        (r.size20 || 0) +
        (r.size22 || 0) +
        (r.size24 || 0) +
        (r.size26 || 0) +
        (r.size28 || 0) +
        (r.sizeBar || 0);

      g.totalWeight += recordWeight;

      g.sizes["6"] += r.size6 || 0;
      g.sizes["7"] += r.size7 || 0;
      g.sizes["8"] += r.size8 || 0;
      g.sizes["9"] += r.size9 || 0;
      g.sizes["10"] += r.size10 || 0;
      g.sizes["10B"] += r.size10B || 0;
      g.sizes["12"] += r.size12 || 0;
      g.sizes["14"] += r.size14 || 0;
      g.sizes["16"] += r.size16 || 0;
      g.sizes["18"] += r.size18 || 0;
      g.sizes["20"] += r.size20 || 0;
      g.sizes["22"] += r.size22 || 0;
      g.sizes["24"] += r.size24 || 0;
      g.sizes["26"] += r.size26 || 0;
      g.sizes["28"] += r.size28 || 0;
      g.sizes["Bar"] += r.sizeBar || 0;


      const recordAmount =
        (r.size10B || 0) * (r.price10B || 0) +
        (r.size12 || 0) * (r.price12 || 0) +
        (r.size14 || 0) * (r.price14 || 0) +
        (r.size16 || 0) * (r.price16 || 0) +
        (r.size18 || 0) * (r.price18 || 0) +
        (r.size20 || 0) * (r.price20 || 0) +
        (r.size22 || 0) * (r.price22 || 0) +
        (r.size24 || 0) * (r.price24 || 0) +
        (r.size26 || 0) * (r.price26 || 0) +
        (r.size28 || 0) * (r.price28 || 0) +
        (r.sizeBar || 0) * (r.priceBar || 0);
      g.totalAmount += recordAmount;

      if (
        r.refinementRecordMarker &&
        !g.markers.includes(r.refinementRecordMarker)
      ) {
        g.markers.push(r.refinementRecordMarker);
      }
    });

    const ledgerExports = savedExports.filter((x) =>
      ledgerRecords.some((r) => r.id === x.singleDoubleDrawnRecordId),
    );

    ledgerExports.forEach((x) => {
      const relatedRecord = ledgerRecords.find(
        (r) => r.id === x.singleDoubleDrawnRecordId,
      );
      if (relatedRecord) {
        const color = relatedRecord.refinementRecordCategory || "Unknown";
        if (groups[color]) {
          groups[color].totalWorkerFees += x.workerFees || 0;
        }
      }
    });

    return Object.values(groups);
  }, [selectedLedger, sddRecords, savedExports]);

  const handleDeleteLedger = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this ledger?")) return;
    try {
      await ledgerAPI.delete(id);
      loadData();
      if (selectedLedgerId === id) setSelectedLedgerId(null);
    } catch (error) {
      console.error("Failed to delete ledger:", error);
    }
  };

  const getMarkerDetails = (markerName: string) => {
    const markerRecords = sddRecords.filter(
      (r) => r.refinementRecordMarker === markerName,
    );
    const markerExports = savedExports.filter((x) =>
      markerRecords.some((r) => r.id === x.singleDoubleDrawnRecordId),
    );

    const totalSortedWeight = markerRecords.reduce((sum, r) => {
      return (
        sum +
        (r.size10B || 0) +
        (r.size12 || 0) +
        (r.size14 || 0) +
        (r.size16 || 0) +
        (r.size18 || 0) +
        (r.size20 || 0) +
        (r.size22 || 0) +
        (r.size24 || 0) +
        (r.size26 || 0) +
        (r.size28 || 0) +
        (r.sizeBar || 0)
      );
    }, 0);

    const totalNonExportWeight = markerRecords.reduce((sum, r) => {
      return (
        sum +
        (r.size6 || 0) +
        (r.size7 || 0) +
        (r.size8 || 0) +
        (r.size9 || 0) +
        (r.size10 || 0) +
        (r.spoilageSize || 0) +
        (r.returnSize || 0)
      );
    }, 0);

    const totalReturnWeight = markerRecords.reduce(
      (sum, r) => sum + (r.returnWeight || 0) + (r.returnSize || 0),
      0,
    );

    const totalSpoilageWeight = markerRecords.reduce(
      (sum, r) => sum + (r.spoilageWeight || 0) + (r.spoilageSize || 0),
      0,
    );

    const totalLostWeight = markerRecords.reduce(
      (sum, r) => sum + (r.lostWeight || 0),
      0,
    );

    const totalAmount = markerRecords.reduce((sum, r) => {
      return (
        sum +
        (r.size10B || 0) * (r.price10B || 0) +
        (r.size12 || 0) * (r.price12 || 0) +
        (r.size14 || 0) * (r.price14 || 0) +
        (r.size16 || 0) * (r.price16 || 0) +
        (r.size18 || 0) * (r.price18 || 0) +
        (r.size20 || 0) * (r.price20 || 0) +
        (r.size22 || 0) * (r.price22 || 0) +
        (r.size24 || 0) * (r.price24 || 0) +
        (r.size26 || 0) * (r.price26 || 0) +
        (r.size28 || 0) * (r.price28 || 0) +
        (r.sizeBar || 0) * (r.priceBar || 0)
      );
    }, 0);

    const totalWorkerFees = markerExports.reduce(
      (sum, x) => sum + (x.workerFees || 0),
      0,
    );

    return {
      markerName,
      recordsCount: markerRecords.length,
      totalSortedWeight,
      totalNonExportWeight,
      totalReturnWeight,
      totalSpoilageWeight,
      totalLostWeight,
      totalAmount,
      totalWorkerFees,
      latestDate: markerRecords.length > 0 ? markerRecords[0].date : null,
    };
  };

  // Helper: get the exchange rate (CNY→MMK) for a given sdd record id
  const getRateForRecord = (sddId: number): number => {
    const exportRec = savedExports.find(
      (x) => x.singleDoubleDrawnRecordId === sddId,
    );
    if (!exportRec?.exchangeRateId) return 1;
    const rateObj = allRates.find((r) => r.id === exportRec.exchangeRateId);
    return rateObj ? rateObj.rate : 1;
  };

  const filteredLedgers = useMemo(() => {
    return ledgers.filter((l) => {
      const search = searchTerm.toLowerCase();
      const name = l.ledgerName.toLowerCase();
      const markers = l.markers
        .map((m) => m.markerName.toLowerCase())
        .join(" ");
      return name.includes(search) || markers.includes(search);
    });
  }, [ledgers, searchTerm]);

  const grandTotal = useMemo(() => {
    if (!selectedLedger) return { totalWeight: 0, totalAmountMMK: 0, totalWorkerFees: 0 };

    const markerNames = selectedLedger.markers.map((m) => m.markerName);
    const ledgerRecords = sddRecords.filter((r) =>
      markerNames.includes(r.refinementRecordMarker || ""),
    );

    let totalWeight = 0;
    let totalAmountMMK = 0;
    let totalWorkerFees = 0;

    ledgerRecords.forEach((r) => {
      const rate = getRateForRecord(r.id);
      const recordAmt =
        (r.size10B || 0) * (r.price10B || 0) +
        (r.size12  || 0) * (r.price12  || 0) +
        (r.size14  || 0) * (r.price14  || 0) +
        (r.size16  || 0) * (r.price16  || 0) +
        (r.size18  || 0) * (r.price18  || 0) +
        (r.size20  || 0) * (r.price20  || 0) +
        (r.size22  || 0) * (r.price22  || 0) +
        (r.size24  || 0) * (r.price24  || 0) +
        (r.size26  || 0) * (r.price26  || 0) +
        (r.size28  || 0) * (r.price28  || 0) +
        (r.sizeBar || 0) * (r.priceBar || 0);
      totalAmountMMK +=
        (r.size10B || 0) + (r.size12 || 0) + (r.size14 || 0) +
        (r.size16  || 0) + (r.size18 || 0) + (r.size20 || 0) +
        (r.size22  || 0) + (r.size24 || 0) + (r.size26 || 0) +
        (r.size28  || 0) + (r.sizeBar || 0)
          ? recordAmt * rate
          : 0;

      totalWeight +=
        (r.size10B || 0) + (r.size12 || 0) + (r.size14 || 0) +
        (r.size16  || 0) + (r.size18 || 0) + (r.size20 || 0) +
        (r.size22  || 0) + (r.size24 || 0) + (r.size26 || 0) +
        (r.size28  || 0) + (r.sizeBar || 0);
    });

    // Worker fees are already stored in MMK
    const ledgerExports = savedExports.filter((x) =>
      ledgerRecords.some((r) => r.id === x.singleDoubleDrawnRecordId),
    );
    ledgerExports.forEach((x) => {
      totalWorkerFees += x.workerFees || 0;
    });

    return { totalWeight, totalAmountMMK, totalWorkerFees };
  }, [selectedLedger, sddRecords, savedExports, allRates]);

  if (loading) {
    return (
      <div className="processing-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="processing-container">
      <aside className="product-sidebar">
        <div className="sidebar-title">
          <ClipboardList size={20} />
          <span>Export Ledger</span>
        </div>

        <div className="sidebar-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search ledger or marker..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="product-list">
          {filteredLedgers.length === 0 ? (
            <div className="empty-sidebar">No ledgers found</div>
          ) : (
            filteredLedgers.map((ledger) => (
              <div
                key={ledger.id}
                className={`product-card ${selectedLedgerId === ledger.id ? "selected" : ""}`}
                onClick={() => setSelectedLedgerId(ledger.id)}
              >
                <div className="card-header">
                  <span className="card-marker">{ledger.ledgerName}</span>
                  <ChevronRight size={16} color="#cbd5e1" />
                </div>
                <div className="card-date">
                  {new Date(ledger.date).toLocaleDateString()}
                </div>
                <span className="card-markers-list">
                  {ledger.markers.map((m) => m.markerName).join(", ")}
                </span>
              </div>
            ))
          )}
        </div>
      </aside>

      <main className="processing-main">
        {selectedLedger ? (
          <div>
            <div className="ledger-header">
              <div className="ledger-title-section">
                <h1>{selectedLedger.ledgerName}</h1>
                <div className="ledger-meta">
                  <div className="meta-item">
                    <Calendar size={18} />
                    <span>
                      {new Date(selectedLedger.date).toLocaleDateString()}
                    </span>
                  </div>
                  {selectedLedger.description && (
                    <div className="meta-item">
                      <FileText size={18} />
                      <span>{selectedLedger.description}</span>
                    </div>
                  )}
                </div>
              </div>
              {hasPermission("Ledger.Delete") && (
                <button
                  onClick={() => handleDeleteLedger(selectedLedger.id)}
                  className="btn btn-danger"
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Trash2 size={18} /> Delete Ledger
                </button>
              )}
            </div>

            <div className="grand-total-bar">
              <div className="grand-total-item">
                <span className="grand-total-label">Total Export Weight</span>
                <span className="grand-total-value">{grandTotal.totalWeight.toFixed(3)} <span className="grand-total-unit">viss</span></span>
              </div>
              <div className="grand-total-divider" />
              <div className="grand-total-item">
                <span className="grand-total-label">Product Amount</span>
                <span className="grand-total-value">{Math.round(grandTotal.totalAmountMMK).toLocaleString()} <span className="grand-total-unit">MMK</span></span>
              </div>
              <div className="grand-total-divider" />
              <div className="grand-total-item">
                <span className="grand-total-label">Worker Fees</span>
                <span className="grand-total-value">{grandTotal.totalWorkerFees.toLocaleString()} <span className="grand-total-unit">MMK</span></span>
              </div>
              <div className="grand-total-divider" />
              <div className="grand-total-item highlight">
                <span className="grand-total-label">GRAND TOTAL</span>
                <span className="grand-total-value grand">{Math.round(grandTotal.totalAmountMMK + grandTotal.totalWorkerFees).toLocaleString()} <span className="grand-total-unit">MMK</span></span>
              </div>
            </div>

            <div className="view-mode-selector">
              <button
                className={`view-mode-btn ${viewMode === "colors" ? "active" : ""}`}
                onClick={() => setViewMode("colors")}
              >
                <Layers size={16} />
                <span>Group by Colors</span>
              </button>
              <button
                className={`view-mode-btn ${viewMode === "markers" ? "active" : ""}`}
                onClick={() => setViewMode("markers")}
              >
                <ClipboardList size={16} />
                <span>Group by Markers</span>
              </button>
            </div>

            {viewMode === "colors" ? (
              <div className="colors-grid">
                {colorDetails.map((color) => (
                  <div key={color.colorName} className="color-detail-card">
                    <div className="color-header">
                      <div className="color-title-wrap">
                        <span className={`color-badge-dot ${color.colorName.toLowerCase().replace(/\s+/g, "-")}`}></span>
                        <span className="color-name">{color.colorName}</span>
                        <span className="color-header-markers">({color.markers.join(", ") || "None"})</span>
                      </div>
                      <span className="color-badge weight-badge">
                        {color.totalWeight.toFixed(3)} viss
                      </span>
                    </div>

                    <div className="sizes-section">
                      <button
                        className="sizes-toggle-btn"
                        onClick={() => toggleColorExpanded(color.colorName)}
                      >
                        <span className="sizes-toggle-label">
                          Size Breakdown <span className="active-sizes-badge">({Object.values(color.sizes).filter((w) => w > 0).length} Active)</span>
                        </span>
                        {expandedColors[color.colorName] ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>

                      {expandedColors[color.colorName] && (
                        <div className="sizes-grid fade-in">
                          {Object.entries(color.sizes).map(([sizeKey, weight]) => {
                            if (weight === 0) return null;
                            return (
                              <div key={sizeKey} className="size-badge">
                                <span className="size-name">{sizeKey}</span>
                                <span className="size-val">{weight.toFixed(3)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>


                  </div>
                ))}
              </div>
            ) : (
              <div className="markers-grid">
                {selectedLedger.markers.map((m) => {
                  const details = getMarkerDetails(m.markerName);
                  return (
                    <div key={m.markerName} className="marker-detail-card">
                      <div className="marker-header">
                        <span className="marker-name">{details.markerName}</span>
                        <span className="marker-badge">
                          {details.recordsCount} Sorted Batches
                        </span>
                      </div>

                      <div className="metrics-row">
                        <div className="metric-box">
                          <div className="metric-label">Export Weight</div>
                          <div
                            className="metric-value"
                            style={{ color: "#059669" }}
                          >
                            {details.totalSortedWeight.toFixed(3)}{" "}
                            <span className="metric-unit">viss</span>
                          </div>
                        </div>
                        <div className="metric-box">
                          <div className="metric-label">Non-Export</div>
                          <div className="metric-value">
                            {details.totalNonExportWeight.toFixed(3)}{" "}
                            <span className="metric-unit">viss</span>
                          </div>
                        </div>
                        <div className="metric-box">
                          <div className="metric-label">Return/Lost</div>
                          <div className="metric-value">
                            {(
                              details.totalReturnWeight + details.totalLostWeight
                            ).toFixed(3)}{" "}
                            <span className="metric-unit">viss</span>
                          </div>
                        </div>
                      </div>


                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <ClipboardList size={64} color="#cbd5e1" />
            <h3>Select a Ledger</h3>
            <p>
              Choose an export ledger from the sidebar to view detailed marker
              reports.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Sales6;
