import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  ledgerAPI,
  singleDoubleDrawnAPI,
  semiExportAPI,
} from "../../services/api";
import type {
  LedgerDto,
  SingleDoubleDrawnRecord,
  SemiExportRecord,
} from "../../types";
import {
  FileText,
  Search,
  Calendar,
  Trash2,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import "./index.css";

const Sales6: React.FC = () => {
  const { hasPermission } = useAuth();
  const [ledgers, setLedgers] = useState<LedgerDto[]>([]);
  const [sddRecords, setSddRecords] = useState<SingleDoubleDrawnRecord[]>([]);
  const [savedExports, setSavedExports] = useState<SemiExportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLedgerId, setSelectedLedgerId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ledgerData, sddData, exportData] = await Promise.all([
        ledgerAPI.getAll(),
        singleDoubleDrawnAPI.getAll(),
        semiExportAPI.getAll(),
      ]);
      setLedgers(ledgerData);
      setSddRecords(sddData);
      setSavedExports(exportData);
    } catch (error) {
      console.error("Failed to load export data:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedLedger = useMemo(() => {
    return ledgers.find((l) => l.id === selectedLedgerId) || null;
  }, [ledgers, selectedLedgerId]);

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

                    <div className="financial-section">
                      <div className="financial-row product-amount">
                        <span className="amount-label">Product Amount</span>
                        <span className="amount-value">
                          {details.totalAmount.toLocaleString()}{" "}
                          <span style={{ fontSize: "12px" }}>MMK</span>
                        </span>
                      </div>
                      <div className="financial-row worker-fees">
                        <span className="amount-label">Worker Fees</span>
                        <span className="amount-value">
                          {details.totalWorkerFees.toLocaleString()}{" "}
                          <span style={{ fontSize: "12px" }}>MMK</span>
                        </span>
                      </div>
                      <div className="financial-row total-value-row">
                        <span className="total-value-label">TOTAL VALUE</span>
                        <span className="total-value-amount">
                          {(
                            details.totalAmount + details.totalWorkerFees
                          ).toLocaleString()}{" "}
                          <span style={{ fontSize: "12px" }}>MMK</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
