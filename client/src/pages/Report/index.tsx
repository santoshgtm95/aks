import React, { useState, useEffect } from "react";
import "./index.css";
import type {
  ExportedMarkerDto,
  ReportDataResponseDto,
  MarkerReportDataDto,
  WorkerFeeDetailDto,
  PurifiedRecordEntryDto,
  RefinedRecordEntryDto,
  SingleDoubleDrawnRecordEntryDto,
} from "../../types";

interface SelectedReportTypes {
  Inventory: boolean;
  RawMaterial: boolean;
  MessLabour: boolean;
  PurifiedStock: boolean;
  RefinedStock: boolean;
  SingleDoubleDrawn: boolean;
}

const Report: React.FC = () => {
  const [exportedMarkers, setExportedMarkers] = useState<ExportedMarkerDto[]>(
    [],
  );
  const [selectedMarkers, setSelectedMarkers] = useState<Set<number>>(
    new Set(),
  );
  const [selectAllMarkers, setSelectAllMarkers] = useState(false);
  const [selectedReports, setSelectedReports] = useState<SelectedReportTypes>({
    Inventory: true,
    RawMaterial: true,
    MessLabour: true,
    PurifiedStock: true,
    RefinedStock: true,
    SingleDoubleDrawn: true,
  });
  const [reportData, setReportData] = useState<ReportDataResponseDto | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch exported markers on component mount
  useEffect(() => {
    fetchExportedMarkers();
  }, []);

  const fetchExportedMarkers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reports/exported-markers", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to fetch markers");
      const data = await response.json();
      setExportedMarkers(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerToggle = (markerId: number) => {
    const newSelected = new Set(selectedMarkers);
    if (newSelected.has(markerId)) {
      newSelected.delete(markerId);
    } else {
      newSelected.add(markerId);
    }
    setSelectedMarkers(newSelected);
    setSelectAllMarkers(newSelected.size === exportedMarkers.length);
  };

  const handleSelectAllMarkers = () => {
    if (selectAllMarkers) {
      setSelectedMarkers(new Set());
      setSelectAllMarkers(false);
    } else {
      setSelectedMarkers(new Set(exportedMarkers.map((m) => m.markerId)));
      setSelectAllMarkers(true);
    }
  };

  const handleReportTypeChange = (reportType: keyof SelectedReportTypes) => {
    setSelectedReports({
      ...selectedReports,
      [reportType]: !selectedReports[reportType],
    });
  };

  const generateReport = async () => {
    if (selectedMarkers.size === 0) {
      setError("Please select at least one marker");
      return;
    }

    const selectedReportTypes = Object.keys(selectedReports).filter(
      (key) => selectedReports[key as keyof SelectedReportTypes],
    );

    if (selectedReportTypes.length === 0) {
      setError("Please select at least one report type");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/reports/generate-report-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markerIds: Array.from(selectedMarkers),
          reportTypes: selectedReportTypes,
        }),
      });
      if (!response.ok) throw new Error("Failed to generate report");
      const data = await response.json();
      setReportData(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-container">
      <h1>Report Generator</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="report-section">
        <h2>Select Markers</h2>
        <div className="marker-selector">
          <label>
            <input
              type="checkbox"
              checked={selectAllMarkers}
              onChange={handleSelectAllMarkers}
            />
            <strong>
              Select All ({selectedMarkers.size} of {exportedMarkers.length})
            </strong>
          </label>

          <div className="marker-list">
            {exportedMarkers.map((marker) => (
              <label key={marker.markerId} className="marker-item">
                <input
                  type="checkbox"
                  checked={selectedMarkers.has(marker.markerId)}
                  onChange={() => handleMarkerToggle(marker.markerId)}
                />
                <span className="marker-name">{marker.markerName}</span>
                <span className="marker-date">
                  ({new Date(marker.exportDate).toLocaleDateString()})
                </span>
                <span className="marker-weight">
                  {marker.totalWeightExported} kg
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="report-section">
        <h2>Select Report Types</h2>
        <div className="report-type-selector">
          {Object.entries(selectedReports).map(([reportType, isSelected]) => (
            <label key={reportType} className="report-type-item">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() =>
                  handleReportTypeChange(
                    reportType as keyof SelectedReportTypes,
                  )
                }
              />
              <span>{reportType}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="report-actions">
        <button
          className="btn btn-primary"
          onClick={generateReport}
          disabled={loading || selectedMarkers.size === 0}
        >
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {reportData && (
        <div className="report-preview">
          <div className="marker-reports">
            {reportData.markersData.map((markerData: MarkerReportDataDto) => (
              <div key={markerData.markerId} className="marker-section">
                <h3 className="marker-title">{markerData.markerName}</h3>
                <div className="reports-grid">
                  {markerData.inventoryReport && (
                    <div className="report-card">
                      <h4>📊 Inventory Report</h4>
                      <div className="report-details">
                        <div className="summary-item">
                          <span>Start Date:</span>
                          <strong>
                            {new Date(
                              markerData.inventoryReport.startDate,
                            ).toLocaleDateString()}
                          </strong>
                        </div>
                        <div className="summary-item">
                          <span>End Date:</span>
                          <strong>
                            {new Date(
                              markerData.inventoryReport.endDate,
                            ).toLocaleDateString()}
                          </strong>
                        </div>
                        <div className="summary-item">
                          <span>Warehouse:</span>
                          <strong>
                            {markerData.inventoryReport.sourceWarehouse}
                          </strong>
                        </div>
                        <div className="summary-item">
                          <span>Category:</span>
                          <strong>
                            {markerData.inventoryReport.rawMaterialCategory}
                          </strong>
                        </div>
                      </div>
                      <table className="detail-table">
                        <tbody>
                          <tr>
                            <td>Initial Weight</td>
                            <td>
                              {
                                markerData.inventoryReport
                                  .initialRawMaterialWeight
                              }{" "}
                              {markerData.inventoryReport.rawMaterialUnit}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {markerData.rawMaterialReport &&
                    markerData.rawMaterialReport.salesHistory &&
                    markerData.rawMaterialReport.salesHistory.length > 0 && (
                      <div className="report-card">
                        <h4>📋 Raw Material Report</h4>
                        <div className="report-details">
                          {(() => {
                            const salesHistory =
                              markerData.rawMaterialReport?.salesHistory || [];
                            return salesHistory.map((sale, index) => (
                              <div key={index} className="sales-record">
                                <div className="sales-row">
                                  <span className="sales-label">Date</span>
                                  <span className="sales-value">
                                    {new Date(sale.date).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="sales-row">
                                  <span className="sales-label">Weight</span>
                                  <span className="sales-value">
                                    {sale.weight}
                                  </span>
                                </div>
                                <div className="sales-row">
                                  <span className="sales-label">Price</span>
                                  <span className="sales-value">
                                    {sale.price}
                                  </span>
                                </div>
                                <div className="sales-row">
                                  <span className="sales-label">Total</span>
                                  <span className="sales-value">
                                    {sale.total.toFixed(2)}
                                  </span>
                                </div>
                                <div className="sales-row">
                                  <span className="sales-label">
                                    Customer Name
                                  </span>
                                  <span className="sales-value">
                                    {sale.customerName || "-"}
                                  </span>
                                </div>
                                <div className="sales-row">
                                  <span className="sales-label">
                                    Customer Contact
                                  </span>
                                  <span className="sales-value">
                                    {sale.customerContact || "-"}
                                  </span>
                                </div>
                                <div className="sales-row">
                                  <span className="sales-label">Remark</span>
                                  <span className="sales-value">
                                    {sale.remark || "-"}
                                  </span>
                                </div>
                                {index < salesHistory.length - 1 && (
                                  <div className="sales-record-separator" />
                                )}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  {markerData.messLabourReport && (
                    <div className="report-card">
                      <div className="report-details">
                        <h4>📋 Mess Labour Report</h4>
                        <table className="detail-table">
                          <tbody>
                            <tr>
                              <td>Processing Date</td>
                              <td>
                                {new Date(
                                  markerData.messLabourReport.processingDate,
                                ).toLocaleDateString()}
                              </td>
                            </tr>
                            <tr>
                              <td>Quantity Processed</td>
                              <td>
                                {markerData.messLabourReport.quantityProcessed}{" "}
                                {markerData.messLabourReport.unit}
                              </td>
                            </tr>
                            <tr>
                              <td>Total Worker Fees</td>
                              <td>
                                MMK{" "}
                                {markerData.messLabourReport.totalWorkerFees.toFixed(
                                  2,
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <div className="cost-breakdown">
                          <h5>📦 Weight Distribution & Loss</h5>
                          <table className="cost-table">
                            <tbody>
                              {markerData.messLabourReport.redWeight > 0 && (
                                <tr>
                                  <td>Red Weight</td>
                                  <td>
                                    {markerData.messLabourReport.redWeight} kg
                                  </td>
                                </tr>
                              )}
                              {markerData.messLabourReport.whiteWeight > 0 && (
                                <tr>
                                  <td>White Weight</td>
                                  <td>
                                    {markerData.messLabourReport.whiteWeight} kg
                                  </td>
                                </tr>
                              )}
                              {markerData.messLabourReport.specialWeight >
                                0 && (
                                <tr>
                                  <td>Special Weight</td>
                                  <td>
                                    {markerData.messLabourReport.specialWeight}{" "}
                                    kg
                                  </td>
                                </tr>
                              )}
                              {markerData.messLabourReport.naturalWeight >
                                0 && (
                                <tr>
                                  <td>Natural Weight</td>
                                  <td>
                                    {markerData.messLabourReport.naturalWeight}{" "}
                                    kg
                                  </td>
                                </tr>
                              )}
                              {markerData.messLabourReport.naturalWhiteWeight >
                                0 && (
                                <tr>
                                  <td>Natural White Weight</td>
                                  <td>
                                    {
                                      markerData.messLabourReport
                                        .naturalWhiteWeight
                                    }{" "}
                                    kg
                                  </td>
                                </tr>
                              )}
                              {markerData.messLabourReport.naturalRedWeight >
                                0 && (
                                <tr>
                                  <td>Natural Red Weight</td>
                                  <td>
                                    {
                                      markerData.messLabourReport
                                        .naturalRedWeight
                                    }{" "}
                                    kg
                                  </td>
                                </tr>
                              )}
                              {markerData.messLabourReport.shortCutWeight >
                                0 && (
                                <tr>
                                  <td>Short Cut Weight</td>
                                  <td>
                                    {markerData.messLabourReport.shortCutWeight}{" "}
                                    kg
                                  </td>
                                </tr>
                              )}
                              {markerData.messLabourReport.artificialWeight >
                                0 && (
                                <tr>
                                  <td>Artificial Weight</td>
                                  <td>
                                    {
                                      markerData.messLabourReport
                                        .artificialWeight
                                    }{" "}
                                    kg
                                  </td>
                                </tr>
                              )}
                              {markerData.messLabourReport.shortWeight > 0 && (
                                <tr>
                                  <td>Short Weight</td>
                                  <td>
                                    {markerData.messLabourReport.shortWeight} kg
                                  </td>
                                </tr>
                              )}
                              {markerData.messLabourReport.lossWeight > 0 && (
                                <tr className="total-row">
                                  <td>
                                    <strong>Lost Weight</strong>
                                  </td>
                                  <td>
                                    <strong>
                                      {markerData.messLabourReport.lossWeight}{" "}
                                      kg
                                    </strong>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        {markerData.messLabourReport.workers &&
                          markerData.messLabourReport.workers.length > 0 && (
                            <div className="workers-table">
                              <h5>👷 Workers Details</h5>
                              <table>
                                <thead>
                                  <tr>
                                    <th>Worker Name</th>
                                    <th>Fee</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {markerData.messLabourReport.workers.map(
                                    (worker: WorkerFeeDetailDto) => (
                                      <tr key={worker.workerId}>
                                        <td>{worker.workerName}</td>
                                        <td>
                                          MMK {worker.feeAmount.toFixed(2)}
                                        </td>
                                      </tr>
                                    ),
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                  {markerData.purifiedStockReport && (
                    <div className="report-card">
                      <div className="report-details">
                        <h4>💧 Purified Stock Report</h4>
                        {markerData.purifiedStockReport.records &&
                          markerData.purifiedStockReport.records.length > 0 && (
                            <>
                              {markerData.purifiedStockReport.records.map(
                                (
                                  record: PurifiedRecordEntryDto,
                                  idx: number,
                                ) => (
                                  <div
                                    key={record.id}
                                    className="category-section"
                                  >
                                    <h5>
                                      📦 Category: {record.category} (Record{" "}
                                      {idx + 1})
                                    </h5>
                                    <table className="detail-table">
                                      <tbody>
                                        <tr>
                                          <td>Date</td>
                                          <td>
                                            {new Date(
                                              record.date,
                                            ).toLocaleDateString()}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td>Place</td>
                                          <td>{record.place}</td>
                                        </tr>
                                        <tr>
                                          <td>Input Weight</td>
                                          <td>{record.inputWeight} kg</td>
                                        </tr>
                                        <tr>
                                          <td>Output Weight</td>
                                          <td>{record.outputWeight} kg</td>
                                        </tr>
                                        <tr>
                                          <td>Weight Loss</td>
                                          <td>
                                            {record.weightLossKg} kg (
                                            {record.weightLossPercent.toFixed(
                                              2,
                                            )}
                                            %)
                                          </td>
                                        </tr>
                                        <tr>
                                          <td>Purifier Name</td>
                                          <td>{record.purifierName}</td>
                                        </tr>
                                        <tr>
                                          <td>Purifier Fees</td>
                                          <td>
                                            MMK {record.purifierFees.toFixed(2)}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td>Supervisor</td>
                                          <td>{record.supervisorName}</td>
                                        </tr>
                                        <tr>
                                          <td>Supervisor Fees</td>
                                          <td>
                                            MMK{" "}
                                            {record.supervisorFees.toFixed(2)}
                                          </td>
                                        </tr>
                                        <tr className="total-row">
                                          <td>
                                            <strong>Total Cost</strong>
                                          </td>
                                          <td>
                                            <strong>
                                              MMK {record.totalCost.toFixed(2)}
                                            </strong>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                ),
                              )}
                              <div className="cost-breakdown">
                                <h5>📊 Summary Totals</h5>
                                <table className="cost-table">
                                  <tbody>
                                    <tr>
                                      <td>Total Input Weight</td>
                                      <td>
                                        {markerData.purifiedStockReport.totalInputWeight.toFixed(
                                          2,
                                        )}{" "}
                                        kg
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>Total Output Weight</td>
                                      <td>
                                        {markerData.purifiedStockReport.totalOutputWeight.toFixed(
                                          2,
                                        )}{" "}
                                        kg
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>Total Weight Loss</td>
                                      <td>
                                        {markerData.purifiedStockReport.totalWeightLossKg.toFixed(
                                          2,
                                        )}{" "}
                                        kg
                                      </td>
                                    </tr>
                                    <tr className="total-row">
                                      <td>
                                        <strong>Total Purification Cost</strong>
                                      </td>
                                      <td>
                                        <strong>
                                          MMK{" "}
                                          {markerData.purifiedStockReport.totalPurificationCost.toFixed(
                                            2,
                                          )}
                                        </strong>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </>
                          )}
                      </div>
                    </div>
                  )}

                  {markerData.refinedStockReport && (
                    <div className="report-card">
                      <div className="report-details">
                        <h4>📦 Refined Stock Report</h4>

                        {markerData.refinedStockReport.records &&
                          markerData.refinedStockReport.records.length > 0 && (
                            <>
                              {markerData.refinedStockReport.records.map(
                                (
                                  record: RefinedRecordEntryDto,
                                  idx: number,
                                ) => (
                                  <div
                                    key={record.id}
                                    className="category-section"
                                  >
                                    <h5>
                                      📦 Category: {record.category} (Record{" "}
                                      {idx + 1})
                                    </h5>
                                    <table className="detail-table">
                                      <tbody>
                                        <tr>
                                          <td>Date</td>
                                          <td>
                                            {new Date(
                                              record.date,
                                            ).toLocaleDateString()}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td>Input Weight</td>
                                          <td>{record.inputWeight} kg</td>
                                        </tr>
                                        <tr>
                                          <td>Output Weight</td>
                                          <td>{record.outputWeight} kg</td>
                                        </tr>
                                        <tr>
                                          <td>Lost Weight</td>
                                          <td>{record.lostWeight} kg</td>
                                        </tr>
                                        <tr>
                                          <td>Spoilage Weight</td>
                                          <td>{record.spoilageWeight} kg</td>
                                        </tr>
                                        <tr>
                                          <td>Return Weight</td>
                                          <td>{record.returnWeight} kg</td>
                                        </tr>
                                        <tr>
                                          <td>Refinement Worker</td>
                                          <td>{record.refinementWorkerName}</td>
                                        </tr>
                                        <tr>
                                          <td>Worker Fees</td>
                                          <td>
                                            MMK {record.workerFees.toFixed(2)}
                                          </td>
                                        </tr>
                                        <tr className="total-row">
                                          <td>
                                            <strong>Total Cost</strong>
                                          </td>
                                          <td>
                                            <strong>
                                              MMK {record.totalCost.toFixed(2)}
                                            </strong>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                ),
                              )}

                              <div className="cost-breakdown">
                                <h5>📊 Summary Totals</h5>
                                <table className="cost-table">
                                  <tbody>
                                    <tr>
                                      <td>Total Input Weight</td>
                                      <td>
                                        {markerData.refinedStockReport.totalInputWeight.toFixed(
                                          2,
                                        )}{" "}
                                        kg
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>Total Output Weight</td>
                                      <td>
                                        {markerData.refinedStockReport.totalOutputWeight.toFixed(
                                          2,
                                        )}{" "}
                                        kg
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>Total Lost Weight</td>
                                      <td>
                                        {markerData.refinedStockReport.totalLostWeight.toFixed(
                                          2,
                                        )}{" "}
                                        kg
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>Total Spoilage Weight</td>
                                      <td>
                                        {markerData.refinedStockReport.totalSpoilageWeight.toFixed(
                                          2,
                                        )}{" "}
                                        kg
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>Total Return Weight</td>
                                      <td>
                                        {markerData.refinedStockReport.totalReturnWeight.toFixed(
                                          2,
                                        )}{" "}
                                        kg
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>Total Worker Fees</td>
                                      <td>
                                        MMK{" "}
                                        {markerData.refinedStockReport.totalWorkerFees.toFixed(
                                          2,
                                        )}
                                      </td>
                                    </tr>
                                    <tr className="total-row">
                                      <td>
                                        <strong>Total Refinement Cost</strong>
                                      </td>
                                      <td>
                                        <strong>
                                          MMK{" "}
                                          {markerData.refinedStockReport.totalRefinementCost.toFixed(
                                            2,
                                          )}
                                        </strong>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </>
                          )}
                      </div>
                    </div>
                  )}

                  {markerData.singleDoubleDrawnReport && (
                    <div className="report-card">
                      <h4>🎯 Single & Double Drawn Report</h4>
                      <div className="report-details">
                        {markerData.singleDoubleDrawnReport.records?.length >
                          0 && (
                          <>
                            {markerData.singleDoubleDrawnReport.records.map(
                              (
                                record: SingleDoubleDrawnRecordEntryDto,
                                idx: number,
                              ) => (
                                <div
                                  key={record.id}
                                  className="category-section"
                                >
                                  <h5>
                                    📦 Category: {record.category} (Record{" "}
                                    {idx + 1})
                                  </h5>
                                  <table className="detail-table">
                                    <tbody>
                                      <tr>
                                        <td>
                                          <strong>Date</strong>
                                        </td>
                                        <td>
                                          {new Date(
                                            record.date,
                                          ).toLocaleDateString()}
                                        </td>
                                      </tr>
                                      {record.sizes.map((size) => (
                                        <tr key={size.sizeName}>
                                          <td>{size.sizeName}</td>
                                          <td>
                                            {size.weight.toFixed(2)} kg @ ¥
                                            {size.price.toFixed(2)}
                                          </td>
                                        </tr>
                                      ))}
                                      <tr>
                                        <td>
                                          <strong>Lost Weight</strong>
                                        </td>
                                        <td>
                                          {record.lostWeight.toFixed(2)} kg
                                        </td>
                                      </tr>
                                      <tr>
                                        <td>
                                          <strong>Spoilage Weight</strong>
                                        </td>
                                        <td>
                                          {record.spoilageWeight.toFixed(2)} kg
                                        </td>
                                      </tr>
                                      <tr>
                                        <td>
                                          <strong>Return Weight</strong>
                                        </td>
                                        <td>
                                          {record.returnWeight.toFixed(2)} kg
                                        </td>
                                      </tr>
                                      <tr>
                                        <td>
                                          <strong>Worker</strong>
                                        </td>
                                        <td>{record.workerName}</td>
                                      </tr>
                                      <tr>
                                        <td>
                                          <strong>Worker Fees</strong>
                                        </td>
                                        <td>
                                          MMK {record.workerFees.toFixed(2)}
                                        </td>
                                      </tr>
                                      <tr className="total-row">
                                        <td>
                                          <strong>Total Amount (CNY)</strong>
                                        </td>
                                        <td>
                                          <strong>
                                            ¥ {record.totalAmount.toFixed(2)}
                                          </strong>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              ),
                            )}
                            <div className="cost-breakdown">
                              <h5>📊 Summary Totals</h5>
                              <table className="cost-table">
                                <tbody>
                                  <tr>
                                    <td>
                                      <strong>Total Weight</strong>
                                    </td>
                                    <td>
                                      {markerData.singleDoubleDrawnReport.totalWeight.toFixed(
                                        2,
                                      )}{" "}
                                      kg
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <strong>Total Lost Weight</strong>
                                    </td>
                                    <td>
                                      {markerData.singleDoubleDrawnReport.totalLostWeight.toFixed(
                                        2,
                                      )}{" "}
                                      kg
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <strong>Total Spoilage Weight</strong>
                                    </td>
                                    <td>
                                      {markerData.singleDoubleDrawnReport.totalSpoilageWeight.toFixed(
                                        2,
                                      )}{" "}
                                      kg
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <strong>Total Return Weight</strong>
                                    </td>
                                    <td>
                                      {markerData.singleDoubleDrawnReport.totalReturnWeight.toFixed(
                                        2,
                                      )}{" "}
                                      kg
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <strong>Total Worker Fees</strong>
                                    </td>
                                    <td>
                                      MMK{" "}
                                      {markerData.singleDoubleDrawnReport.totalWorkerFees.toFixed(
                                        2,
                                      )}
                                    </td>
                                  </tr>
                                  <tr className="total-row">
                                    <td>
                                      <strong>Total Amount (CNY)</strong>
                                    </td>
                                    <td>
                                      <strong>
                                        ¥{" "}
                                        {markerData.singleDoubleDrawnReport.totalAmountCny.toFixed(
                                          2,
                                        )}
                                      </strong>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;
