import React, { useState, useEffect } from "react";
import { cashFlowAPI } from "../../services/api";
import { DollarSign, Search, CreditCard } from "lucide-react";
import Modal from "../../components/Modal";
import "./index.css";

interface WorkerCashFlow {
  workerName: string;
  messLabourFees: number;
  purificationFees: number;
  refinementFees: number;
  singleDoubleDrawnFees: number;
  totalFees: number;
  paidAmount: number;
  unpaidAmount: number;
}

const CashFlow: React.FC = () => {
  const [data, setData] = useState<WorkerCashFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Payment Modal State
  const [selectedWorker, setSelectedWorker] = useState<WorkerCashFlow | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const result = await cashFlowAPI.getAll();
      setData(result);
    } catch (error) {
      console.error("Error fetching cash flow data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRowClick = (worker: WorkerCashFlow) => {
    setSelectedWorker(worker);
    setPaymentAmount("");
    setPaymentNote("");
    setIsModalOpen(true);
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

  const filteredData = data.filter((item) =>
    item.workerName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatCurrency = (value: number) => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const totalAllMess = data.reduce((sum, item) => sum + item.messLabourFees, 0);
  const totalAllPurif = data.reduce(
    (sum, item) => sum + item.purificationFees,
    0,
  );
  const totalAllRefine = data.reduce(
    (sum, item) => sum + item.refinementFees,
    0,
  );
  const totalAllSdd = data.reduce(
    (sum, item) => sum + item.singleDoubleDrawnFees,
    0,
  );
  const grandTotal = data.reduce((sum, item) => sum + item.totalFees, 0);

  return (
    <div className="cash-flow-container">
      <div className="cf-header">
        <h1>
          <DollarSign className="cf-icon" /> Worker Cash Flow
        </h1>
        <p>View total fees across all process flows</p>
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
      </div>

      <div className="table-responsive">
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <table className="cf-table">
            <thead>
              <tr>
                <th>Worker Name</th>
                <th>Mess-Labour</th>
                <th>Purification</th>
                <th>Refinement</th>
                <th>Single & Double Drawn</th>
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
                    <td>{formatCurrency(item.messLabourFees)}</td>
                    <td>{formatCurrency(item.purificationFees)}</td>
                    <td>{formatCurrency(item.refinementFees)}</td>
                    <td>{formatCurrency(item.singleDoubleDrawnFees)}</td>
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
                    colSpan={8}
                    style={{ textAlign: "center", padding: "2rem" }}
                  >
                    No workers found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td className="worker-name-col footer-label">Grand Total</td>
                <td className="footer-val">{formatCurrency(totalAllMess)}</td>
                <td className="footer-val">{formatCurrency(totalAllPurif)}</td>
                <td className="footer-val">{formatCurrency(totalAllRefine)}</td>
                <td className="footer-val">{formatCurrency(totalAllSdd)}</td>
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
        maxWidth="500px"
      >
        {selectedWorker && (
          <div className="payment-modal-content">
            <div className="payment-summary">
              <div className="summary-item">
                <span className="summary-label">Total Fees</span>
                <span className="summary-value">
                  {formatCurrency(selectedWorker.totalFees)} MMK
                </span>
              </div>
              <div className="summary-item text-green">
                <span className="summary-label">Paid Amount</span>
                <span className="summary-value">
                  {formatCurrency(selectedWorker.paidAmount)} MMK
                </span>
              </div>
              <div className="summary-item text-red">
                <span className="summary-label">Remaining Amount to Pay</span>
                <span className="summary-value">
                  {formatCurrency(selectedWorker.unpaidAmount)} MMK
                </span>
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
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CashFlow;
