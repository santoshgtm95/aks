import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import api from "../../services/api";
import Modal from "../../components/Modal";
import "./index.css";

interface AuditLog {
  id: number;
  action: string;
  entityName: string;
  entityId: string | null;
  details: string | null;
  amount: number | null;
  createDate: string;
  username: string;
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDetails, setSelectedDetails] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get("/AuditLogs");
      setLogs(response.data);
    } catch (error) {
      console.error("Failed to fetch audit logs", error);
    } finally {
      setLoading(false);
    }
  };

  const renderDetails = () => {
    if (!selectedDetails) return null;

    try {
      const parsed = JSON.parse(selectedDetails);
      const oldValues = parsed.OldValues || {};
      const newValues = parsed.NewValues || {};

      const allKeys = Array.from(
        new Set([...Object.keys(oldValues), ...Object.keys(newValues)]),
      );

      if (allKeys.length === 0) {
        return (
          <p className="no-details-msg">No structured details available.</p>
        );
      }

      return (
        <div className="audit-table-wrapper">
          <table className="audit-changes-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Previous Value</th>
                <th>New Value</th>
              </tr>
            </thead>
            <tbody>
              {allKeys.map((key) => (
                <tr key={key}>
                  <td className="field-name">{key}</td>
                  <td
                    className={`old-value ${oldValues[key] !== newValues[key] && oldValues[key] !== undefined ? "highlight-old" : ""}`}
                  >
                    {oldValues[key] !== undefined && oldValues[key] !== null
                      ? String(oldValues[key])
                      : "-"}
                  </td>
                  <td
                    className={`new-value ${oldValues[key] !== newValues[key] && newValues[key] !== undefined ? "highlight-new" : ""}`}
                  >
                    {newValues[key] !== undefined && newValues[key] !== null
                      ? String(newValues[key])
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } catch (e) {
      return <pre className="fallback-pre">{selectedDetails}</pre>;
    }
  };

  return (
    <div className="audit-logs-container">
      <h2>Audit Logs</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Entity ID</th>
                <th>Amount</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    {format(new Date(log.createDate), "MMM dd, yyyy HH:mm")}
                  </td>
                  <td>{log.username}</td>
                  <td>
                    <span
                      className={`badge ${log.action.toLowerCase().replace(" ", "-")}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td>{log.entityName}</td>
                  <td>{log.entityId}</td>
                  <td>{log.amount != null ? log.amount.toFixed(2) : "-"}</td>
                  <td className="details-cell">
                    <div
                      className="details-content"
                      onClick={() => {
                        if (log.details) {
                          setSelectedDetails(log.details);
                          setIsModalOpen(true);
                        }
                      }}
                    >
                      {log.details ? "View Details" : "-"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Audit Log Details"
        maxWidth="700px"
      >
        <div className="audit-details-modal-content">{renderDetails()}</div>
      </Modal>
    </div>
  );
};

export default AuditLogs;
