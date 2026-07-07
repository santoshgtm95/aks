import React, { useState, useEffect, useCallback } from "react";
import { cashFlowAPI, placesAPI } from "../../services/api";
import {
  DollarSign,
  Search,
  CreditCard,
  MapPin,
  Calendar,
  Download,
} from "lucide-react";
import Modal from "../../components/Modal";
import "./index.css";
import { useLongPoll } from "../../hooks/useLongPoll";

interface WorkerFeeBreakdownItem {
  process: string;
  reference: string;
  date: string | null;
  fees: number;
}

interface WorkerCashFlow {
  workerName: string;
  workerId: number | null;
  purifierId: number | null;
  placeNames?: string;
  messLabourFees: number;
  purificationFees: number;
  purificationSupervisorFees: number;
  refinementFees: number;
  washGradingFees: number;
  singleDoubleDrawnFees: number;
  semiExportPurchaseFees: number;
  totalFees: number;
  paidAmount: number;
  unpaidAmount: number;
}

const CashFlow: React.FC = () => {
  const [data, setData] = useState<WorkerCashFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [places, setPlaces] = useState<any[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Payment Modal State
  const [selectedWorker, setSelectedWorker] = useState<WorkerCashFlow | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [breakdown, setBreakdown] = useState<WorkerFeeBreakdownItem[]>([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchData = useCallback(
    async (placeId?: number, from?: string, to?: string) => {
      try {
        setLoading(true);
        const result = await cashFlowAPI.getAll(
          placeId,
          from || undefined,
          to || undefined,
        );
        setData(result);
      } catch (error) {
        console.error("Error fetching cash flow data:", error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useLongPoll(fetchData);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const p = await placesAPI.getAll();
        setPlaces(p);
      } catch (err) {
        console.error("Failed to load places", err);
      }
      fetchData();
    };
    loadInitialData();
  }, []);

  const handlePlaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const placeId = val === "" ? "" : Number(val);
    setSelectedPlaceId(placeId);
    fetchData(placeId === "" ? undefined : placeId, fromDate, toDate);
  };

  const handleDateFilter = () => {
    fetchData(
      selectedPlaceId === "" ? undefined : selectedPlaceId,
      fromDate,
      toDate,
    );
  };

  const handleClearDates = () => {
    setFromDate("");
    setToDate("");
    fetchData(selectedPlaceId === "" ? undefined : selectedPlaceId, "", "");
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await cashFlowAPI.downloadExcel(
        selectedPlaceId === "" ? undefined : selectedPlaceId,
        fromDate || undefined,
        toDate || undefined,
      );
    } catch (err) {
      console.error("Download failed", err);
      alert("Failed to download Excel. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRowClick = async (worker: WorkerCashFlow) => {
    setSelectedWorker(worker);
    setPaymentAmount("");
    setPaymentNote("");
    setBreakdown([]);
    setIsModalOpen(true);
    try {
      setBreakdownLoading(true);
      const items = await cashFlowAPI.getBreakdown(
        worker.workerId,
        worker.purifierId,
        worker.workerName,
      );
      setBreakdown(items);
    } catch (err) {
      console.error("Failed to load breakdown", err);
    } finally {
      setBreakdownLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker || !paymentAmount) return;

    try {
      setIsSubmitting(true);
      await cashFlowAPI.makePayment({
        workerName: selectedWorker.workerName,
        amount: Number(paymentAmount),
        note: paymentNote,
      });
      setIsModalOpen(false);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error("Payment failed", error);
      alert("Payment failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredData = data
    .filter((item) =>
      item.workerName.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => b.unpaidAmount - a.unpaidAmount);

  const formatCurrency = (value: number | undefined | null) => {
    return (value ?? 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const totalAllMess = data.reduce((sum, item) => sum + item.messLabourFees, 0);
  const totalAllPurif = data.reduce(
    (sum, item) => sum + item.purificationFees,
    0,
  );
  const totalAllPurifSupervisor = data.reduce(
    (sum, item) => sum + item.purificationSupervisorFees,
    0,
  );
  const totalAllRefine = data.reduce(
    (sum, item) => sum + item.refinementFees,
    0,
  );
  const totalAllWashGrading = data.reduce(
    (sum, item) => sum + item.washGradingFees,
    0,
  );
  const totalAllSdd = data.reduce(
    (sum, item) => sum + item.singleDoubleDrawnFees,
    0,
  );
  const totalAllSemiExport = data.reduce(
    (sum, item) => sum + (item.semiExportPurchaseFees ?? 0),
    0,
  );
  const grandTotal = data.reduce((sum, item) => sum + item.totalFees, 0);

  return (
    <div className="cash-flow-container">
      {/* Hero Header */}
      <div className="cf-hero">
        <div className="cf-hero-left">
          <div className="cf-hero-icon">
            <DollarSign size={30} strokeWidth={1.8} />
          </div>
          <div className="cf-hero-text">
            <h1>Cash Flow</h1>
            <p>View total fees and payment status across all process flows</p>
          </div>
        </div>
        <div className="cf-hero-right">
          <div className="cf-stat-pill">
            <span className="stat-num">{data.length}</span>
            <span className="stat-label">
              {data.length === 1 ? "Worker" : "Workers"}
            </span>
          </div>
        </div>
      </div>

      <div className="cf-toolbar">
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search workers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="place-filter">
          <MapPin size={20} className="filter-icon" />
          <select value={selectedPlaceId} onChange={handlePlaceChange}>
            <option value="">All Places</option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="cf-date-range-container">
          <div className="cf-date-input-box">
            <span className="cf-date-label">From Date</span>
            <div className="cf-date-input-wrapper">
              <Calendar size={16} />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
          </div>
          <div className="cf-date-input-box">
            <span className="cf-date-label">To Date</span>
            <div className="cf-date-input-wrapper">
              <Calendar size={16} />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
          <div className="cf-date-actions">
            <button className="cf-apply-btn" onClick={handleDateFilter}>
              Apply
            </button>
            {(fromDate || toDate) && (
              <button className="cf-reset-btn" onClick={handleClearDates}>
                Clear
              </button>
            )}
          </div>
          <button
            className="cf-excel-export-btn"
            onClick={handleDownload}
            disabled={isDownloading}
            title="Download Fee Breakdown as Excel"
          >
            <Download size={16} />
            {isDownloading ? "Downloading..." : "Export Excel"}
          </button>
        </div>
      </div>

      <div className="table-responsive">
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <table className="cf-table">
            <thead>
              <tr>
                <th>Worker Name</th>
                <th>Places</th>
                <th>Mess-Labour</th>
                <th>Purification</th>
                <th>Purification Supervisor</th>
                <th>Refinement</th>
                <th>Wash/Grading</th>
                <th>Single & Double Drawn</th>
                <th>Semi Export Purchase</th>
                <th className="total-col">Total Fees</th>
                <th>Paid</th>
                <th>Unpaid</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item, idx) => (
                  <tr
                    key={idx}
                    onClick={() => handleRowClick(item)}
                    className="clickable-row"
                  >
                    <td className="worker-name-col">
                      <div className="worker-initial">
                        {item.workerName.charAt(0).toUpperCase()}
                      </div>
                      {item.workerName}
                    </td>
                    <td className="places-col">{item.placeNames || "-"}</td>
                    <td>{formatCurrency(item.messLabourFees)}</td>
                    <td>{formatCurrency(item.purificationFees)}</td>
                    <td>{formatCurrency(item.purificationSupervisorFees)}</td>
                    <td>{formatCurrency(item.refinementFees)}</td>
                    <td>{formatCurrency(item.washGradingFees)}</td>
                    <td>{formatCurrency(item.singleDoubleDrawnFees)}</td>
                    <td>{formatCurrency(item.semiExportPurchaseFees)}</td>
                    <td className="total-col">
                      {formatCurrency(item.totalFees)}
                    </td>
                    <td style={{ color: "#38a169", fontWeight: "500" }}>
                      {formatCurrency(item.paidAmount)}
                    </td>
                    <td style={{ color: "#e53e3e", fontWeight: "500" }}>
                      {formatCurrency(item.unpaidAmount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={12}
                    style={{ textAlign: "center", padding: "2rem" }}
                  >
                    No workers found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td className="worker-name-col footer-label" colSpan={2}>
                  Grand Total
                </td>
                <td></td>
                <td className="footer-val">{formatCurrency(totalAllMess)}</td>
                <td className="footer-val">{formatCurrency(totalAllPurif)}</td>
                <td className="footer-val">
                  {formatCurrency(totalAllPurifSupervisor)}
                </td>
                <td className="footer-val">{formatCurrency(totalAllRefine)}</td>
                <td className="footer-val">
                  {formatCurrency(totalAllWashGrading)}
                </td>
                <td className="footer-val">{formatCurrency(totalAllSdd)}</td>
                <td className="footer-val">
                  {formatCurrency(totalAllSemiExport)}
                </td>
                <td className="total-col footer-val grand-total">
                  {formatCurrency(grandTotal)}
                </td>
                <td className="footer-val" style={{ color: "#38a169" }}>
                  {formatCurrency(
                    data.reduce((sum, item) => sum + item.paidAmount, 0),
                  )}
                </td>
                <td className="footer-val" style={{ color: "#e53e3e" }}>
                  {formatCurrency(
                    data.reduce((sum, item) => sum + item.unpaidAmount, 0),
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Process Payment: ${selectedWorker?.workerName}`}
        maxWidth="760px"
      >
        {selectedWorker && (
          <div className="payment-modal-content">
            {/* Fee Breakdown */}

            <div className="summary">
              <div className="summary-grid">
                <div>
                  <span>Total Fees</span>
                  <strong>{formatCurrency(selectedWorker.totalFees)}</strong>
                </div>
                <div>
                  <span>Paid Amount</span>
                  <strong style={{ color: "green" }}>
                    {formatCurrency(selectedWorker.paidAmount)}
                  </strong>
                </div>
                <div>
                  <span>Remaining Amount to Pay</span>
                  <strong style={{ color: "red" }}>
                    {formatCurrency(selectedWorker.unpaidAmount)}
                  </strong>
                </div>
              </div>
            </div>
            <form onSubmit={handlePaymentSubmit} className="payment-form">
              <div className="form-group">
                <label>Amount to Pay (MMK)</label>
                <div className="input-group">
                  <CreditCard className="input-icon" size={18} />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    max={selectedWorker.unpaidAmount}
                    required
                    placeholder="Enter amount..."
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Note (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="E.g., Partial payment for..."
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || Number(paymentAmount) <= 0}
                >
                  {isSubmitting ? "Saving..." : "Save Payment"}
                </button>
              </div>
            </form>
            <div className="breakdown-section">
              <h4 className="breakdown-title">Fee Breakdown</h4>
              {breakdownLoading ? (
                <div className="breakdown-loading">Loading breakdown...</div>
              ) : breakdown.length === 0 ? (
                <div className="breakdown-empty">
                  No breakdown records found.
                </div>
              ) : (
                <div className="breakdown-table-wrap">
                  <table className="breakdown-table">
                    <thead>
                      <tr>
                        <th>Process</th>
                        <th>Marker / Reference</th>
                        <th>Date</th>
                        <th>Fees (MMK)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breakdown.map((item, i) => (
                        <tr key={i}>
                          <td>
                            <span
                              className={`process-badge process-${item.process.toLowerCase().replace(/[\s&/]+/g, "-")}`}
                            >
                              {item.process}
                            </span>
                          </td>
                          <td>{item.reference || "-"}</td>
                          <td>
                            {item.date
                              ? new Date(item.date).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "-"}
                          </td>
                          <td className="breakdown-fees">
                            {formatCurrency(item.fees)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} className="breakdown-total-label">
                          Total
                        </td>
                        <td className="breakdown-fees breakdown-total-val">
                          {formatCurrency(
                            breakdown.reduce((s, i) => s + i.fees, 0),
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CashFlow;
