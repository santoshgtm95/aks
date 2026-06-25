import React, { useState } from "react";
import { reportsAPI, semiExportPurchaseAPI } from "../../services/api";
import type { MarkerByDateDto, SemiExportPurchase } from "../../types";
import "./index.css";
interface SelectedReportTypes {
  Inventory: boolean;
  RawMaterialSales: boolean;
  Washed: boolean;
  MessLabour: boolean;
  PurifiedStock: boolean;
  RefinedStock: boolean;
  SingleDoubleDrawn: boolean;
  ExportedReport: boolean;
}

const Report: React.FC = () => {
  const [selectAllMarkers, setSelectAllMarkers] = useState(false);
  const [selectedReports, setSelectedReports] = useState<SelectedReportTypes>({
    Inventory: true,
    RawMaterialSales: true,
    Washed: true,
    MessLabour: true,
    PurifiedStock: true,
    RefinedStock: true,
    SingleDoubleDrawn: true,
    ExportedReport: true,
  });
  const [excelDownloading, setExcelDownloading] = useState(false);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [markers, setMarkers] = useState<MarkerByDateDto[]>([]);
  const [selectedMarkerIds, setSelectedMarkerIds] = useState<number[]>([]);
  const [markersLoading, setMarkersLoading] = useState(false);
  const [semiPurchases, setSemiPurchases] = useState<SemiExportPurchase[]>([]);
  const [selectedSemiPurchaseIds, setSelectedSemiPurchaseIds] = useState<
    number[]
  >([]);
  const [semiPurchasesLoading, setSemiPurchasesLoading] = useState(false);
  const [selectAllSemiPurchases, setSelectAllSemiPurchases] = useState(false);

  const handleSelectAllMarkers = () => {
    if (selectAllMarkers) {
      setSelectAllMarkers(false);
      setSelectedMarkerIds([]);
    } else {
      setSelectAllMarkers(true);
      setSelectedMarkerIds(markers.map((m) => m.id));
    }
  };

  const handleMarkerToggle = (markerId: number) => {
    setSelectedMarkerIds((prev) => {
      const updated = prev.includes(markerId)
        ? prev.filter((id) => id !== markerId)
        : [...prev, markerId];
      setSelectAllMarkers(
        updated.length === markers.length && markers.length > 0,
      );
      return updated;
    });
  };

  const handleSelectAllSemiPurchases = () => {
    if (selectAllSemiPurchases) {
      setSelectAllSemiPurchases(false);
      setSelectedSemiPurchaseIds([]);
    } else {
      setSelectAllSemiPurchases(true);
      setSelectedSemiPurchaseIds(semiPurchases.map((p) => p.id));
    }
  };

  const handleSemiPurchaseToggle = (id: number) => {
    setSelectedSemiPurchaseIds((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      setSelectAllSemiPurchases(
        updated.length === semiPurchases.length && semiPurchases.length > 0,
      );
      return updated;
    });
  };

  const handleReportTypeChange = (reportType: keyof SelectedReportTypes) => {
    setSelectedReports({
      ...selectedReports,
      [reportType]: !selectedReports[reportType],
    });
  };

  const getDownloadFileName = (contentDisposition: string | null) => {
    if (!contentDisposition)
      return `${fromDate.replaceAll("-", "_")}_To_${toDate.replaceAll("-", "_")}.xlsx`;

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);

    const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    if (filenameMatch?.[1]) return filenameMatch[1];

    return `${fromDate.replaceAll("-", "_")}_To_${toDate.replaceAll("-", "_")}.xlsx`;
  };

  const downloadExcelReport = async () => {
    if (!fromDate || !toDate) {
      setError("Please select both From Date and To Date");
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      setError("From Date cannot be later than To Date");
      return;
    }

    const enabledReportTypes = Object.entries(selectedReports)
      .filter(([, isSelected]) => isSelected)
      .map(([reportType]) => reportType);

    if (enabledReportTypes.length === 0) {
      setError("Please select at least one report type");
      return;
    }

    try {
      setExcelDownloading(true);
      setError("");

      const params = new URLSearchParams({ fromDate, toDate });
      enabledReportTypes.forEach((rt) => params.append("reportTypes", rt));
      selectedMarkerIds.forEach((id) => params.append("markerIds", id.toString()));
      selectedSemiPurchaseIds.forEach((id) =>
        params.append("semiPurchaseIds", id.toString()),
      );
      const response = await fetch(
        `/api/reports/download-excel?${params.toString()}`,
      );
      if (!response.ok) {
        let message = "Failed to download report";
        try {
          const errorData = await response.json();
          message = errorData.message || message;
        } catch {}
        throw new Error(message);
      }

      const blob = await response.blob();
      const fileName = getDownloadFileName(
        response.headers.get("content-disposition"),
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setExcelDownloading(false);
    }
  };

  const handleSearch = async () => {
    if (!fromDate || !toDate) {
      setError("Please select both From Date and To Date");
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      setError("From Date cannot be later than To Date");
      return;
    }

    try {
      setMarkersLoading(true);
      setError("");
      const data = await reportsAPI.getMarkersByDate(fromDate, toDate);
      setMarkers(data);
      setSelectedMarkerIds(data.map((m) => m.id));
      setSelectAllMarkers(data.length > 0);
      handleSearchSemiPurchases();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setMarkersLoading(false);
    }
  };

  const handleSearchSemiPurchases = async () => {
    if (!fromDate || !toDate) {
      setError("Please select both From Date and To Date");
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      setError("From Date cannot be later than To Date");
      return;
    }

    try {
      setSemiPurchasesLoading(true);
      setError("");
      const data = await semiExportPurchaseAPI.getByDate(fromDate, toDate);
      setSemiPurchases(data);
      setSelectedSemiPurchaseIds(data.map((p) => p.id));
      setSelectAllSemiPurchases(data.length > 0);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSemiPurchasesLoading(false);
    }
  };

  return (
    <div className="report-container">
      <h1>Report Generator</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="report-section report-filter-section">
        <h2>Excel Report Section</h2>
        <div className="date-range-controls">
          <label className="date-field">
            <span>From Date</span>
            <div className="date-input-wrap">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
          </label>
          <label className="date-field">
            <span>To Date</span>
            <div className="date-input-wrap">
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </label>
          <button
            className="btn btn-primary search-report-btn"
            onClick={handleSearch}
            disabled={markersLoading}
          >
            {markersLoading ? "Searching..." : "Search"}
          </button>
          <button
            className="btn btn-pdf download-report-btn"
            onClick={downloadExcelReport}
            disabled={excelDownloading}
          >
            {excelDownloading ? "Downloading..." : "Download Report"}
          </button>
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

      <div className="report-section">
        <h2>Select Markers</h2>
        <div className="marker-selector">
          <label>
            <input
              type="checkbox"
              checked={selectAllMarkers}
              onChange={handleSelectAllMarkers}
              disabled={markers.length === 0}
            />
            <strong>Select All Marker</strong>
          </label>
          {markersLoading && (
            <div className="markers-loading">Loading markers...</div>
          )}
          {!markersLoading && markers.length > 0 && (
            <div className="marker-list">
              {markers.map((marker) => (
                <label
                  key={marker.id}
                  className={`marker-item ${selectedMarkerIds.includes(marker.id) ? "selected" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedMarkerIds.includes(marker.id)}
                    onChange={() => handleMarkerToggle(marker.id)}
                  />
                  <span className="marker-name">{marker.markerName}</span>
                  <span className="marker-date">
                    {new Date(marker.date).toLocaleDateString()}
                  </span>
                  <span className="marker-weight">{marker.warehouseName}</span>
                </label>
              ))}
            </div>
          )}
          {!markersLoading && markers.length === 0 && (
            <div className="markers-empty">
              {fromDate && toDate
                ? "No markers found for the selected date range"
                : "Select dates and click Search to load markers"}
            </div>
          )}
        </div>
      </div>

      <div className="report-section">
        <h2>Select Semi Report Purchases</h2>
        <div className="marker-selector">
          <div className="semi-purchase-header">
            <label>
              <input
                type="checkbox"
                checked={selectAllSemiPurchases}
                onChange={handleSelectAllSemiPurchases}
                disabled={semiPurchases.length === 0}
              />
              <strong>Select All</strong>
            </label>
          </div>
          {semiPurchasesLoading && (
            <div className="markers-loading">Loading semi purchases...</div>
          )}
          {!semiPurchasesLoading && semiPurchases.length > 0 && (
            <div className="marker-list">
              {semiPurchases.map((purchase) => (
                <label
                  key={purchase.id}
                  className={`marker-item ${selectedSemiPurchaseIds.includes(purchase.id) ? "selected" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSemiPurchaseIds.includes(purchase.id)}
                    onChange={() => handleSemiPurchaseToggle(purchase.id)}
                  />
                  <span className="marker-name">{purchase.customerName}</span>
                  <span className="marker-date">
                    {new Date(purchase.receiveDateTime).toLocaleDateString()}
                  </span>
                  <span className="marker-date">{purchase.color}</span>
                  <span className="marker-weight">
                    {purchase.totalReceiveWeight} viss
                  </span>
                </label>
              ))}
            </div>
          )}
          {!semiPurchasesLoading && semiPurchases.length === 0 && (
            <div className="markers-empty">
              {fromDate && toDate
                ? "No semi purchases found for the selected date range"
                : "Select dates and click Search to load semi purchases"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Report;
