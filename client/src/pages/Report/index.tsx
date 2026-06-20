import React, { useState } from "react";
import "./index.css";
// import jsPDF from "jspdf";
// import html2canvas from "html2canvas";
// import type {
//   // ExportedMarkerDto,
//   // ReportDataResponseDto,
//   // MarkerReportDataDto,
//   WorkerFeeDetailDto,
//   PurifiedRecordEntryDto,
//   RefinedRecordEntryDto,
//   SingleDoubleDrawnRecordEntryDto,
// } from "../../types";

// interface SelectedReportTypes {
//   Inventory: boolean;
//   RawMaterial: boolean;
//   MessLabour: boolean;
//   PurifiedStock: boolean;
//   RefinedStock: boolean;
//   SingleDoubleDrawn: boolean;
// }

const Report: React.FC = () => {
  // const [exportedMarkers, setExportedMarkers] = useState<ExportedMarkerDto[]>(
  //   [],
  // );
  // const [selectedMarkers, setSelectedMarkers] = useState<Set<number>>(
  //   new Set(),
  // );
  // const [selectAllMarkers, setSelectAllMarkers] = useState(false);
  // const [selectedReports, setSelectedReports] = useState<SelectedReportTypes>({
  //   Inventory: true,
  //   RawMaterial: true,
  //   MessLabour: true,
  //   PurifiedStock: true,
  //   RefinedStock: true,
  //   SingleDoubleDrawn: true,
  // });
  // const [reportData, setReportData] = useState<ReportDataResponseDto | null>(
  //   null,
  // );
  // const [loading, setLoading] = useState(false);
  // const [pdfLoading, setPdfLoading] = useState(false);
  const [excelDownloading, setExcelDownloading] = useState(false);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Fetch exported markers on component mount
  // useEffect(() => {
  //   fetchExportedMarkers();
  // }, []);

  // const fetchExportedMarkers = async () => {
  //   try {
  //     //setLoading(true);
  //     const response = await fetch("/api/reports/exported-markers", {
  //       method: "GET",
  //       headers: { "Content-Type": "application/json" },
  //     });
  //     if (!response.ok) throw new Error("Failed to fetch markers");
  //     // const data = await response.json();
  //     // setExportedMarkers(data);
  //   } catch (err) {
  //     setError((err as Error).message);
  //   } finally {
  //    // setLoading(false);
  //   }
  // };

  // const handleMarkerToggle = (markerId: number) => {
  //   const newSelected = new Set(selectedMarkers);
  //   if (newSelected.has(markerId)) {
  //     newSelected.delete(markerId);
  //   } else {
  //     newSelected.add(markerId);
  //   }
  //   setSelectedMarkers(newSelected);
  //   setSelectAllMarkers(newSelected.size === exportedMarkers.length);
  // };

  // const handleSelectAllMarkers = () => {
  //   if (selectAllMarkers) {
  //     setSelectedMarkers(new Set());
  //     setSelectAllMarkers(false);
  //   } else {
  //     setSelectedMarkers(new Set(exportedMarkers.map((m) => m.markerId)));
  //     setSelectAllMarkers(true);
  //   }
  // };

  // const handleReportTypeChange = (reportType: keyof SelectedReportTypes) => {
  //   setSelectedReports({
  //     ...selectedReports,
  //     [reportType]: !selectedReports[reportType],
  //   });
  // };

  // const generateReport = async () => {
  //   if (selectedMarkers.size === 0) {
  //     setError("Please select at least one marker");
  //     return;
  //   }

  //   const selectedReportTypes = Object.keys(selectedReports).filter(
  //     (key) => selectedReports[key as keyof SelectedReportTypes],
  //   );

  //   if (selectedReportTypes.length === 0) {
  //     setError("Please select at least one report type");
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     setError("");
  //     const response = await fetch("/api/reports/generate-report-data", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         markerIds: Array.from(selectedMarkers),
  //         reportTypes: selectedReportTypes,
  //       }),
  //     });
  //     if (!response.ok) throw new Error("Failed to generate report");
  //     const data = await response.json();
  //     setReportData(data);
  //   } catch (err) {
  //     setError((err as Error).message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

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

    try {
      setExcelDownloading(true);
      setError("");

      const params = new URLSearchParams({ fromDate, toDate });
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

  // const generatePDF = async () => {
  //   if (!reportData) return;

  //   const formatDate = (d: string) =>
  //     new Date(d).toLocaleDateString("en-GB", {
  //       day: "2-digit",
  //       month: "short",
  //       year: "numeric",
  //     });
  //   const fmt = (n: number) => n.toFixed(2);

  //   const markerSections = reportData.markersData
  //     .map((markerData: MarkerReportDataDto) => {
  //       const inv = markerData.inventoryReport
  //         ? `
  //       <div class="section">
  //         <div class="section-header">📊 Inventory Report</div>
  //         <table>
  //           <tr><td>Start Date</td><td>${formatDate(markerData.inventoryReport.startDate)}</td></tr>
  //           <tr><td>End Date</td><td>${formatDate(markerData.inventoryReport.endDate)}</td></tr>
  //           <tr><td>Warehouse</td><td>${markerData.inventoryReport.sourceWarehouse}</td></tr>
  //           <tr><td>Category</td><td>${markerData.inventoryReport.rawMaterialCategory}</td></tr>
  //           <tr class="total-row"><td>Initial Weight</td><td>${markerData.inventoryReport.initialRawMaterialWeight} ${markerData.inventoryReport.rawMaterialUnit}</td></tr>
  //         </table>
  //       </div>`
  //         : "";

  //       const raw =
  //         (markerData.rawMaterialReport?.salesHistory?.length ?? 0) > 0
  //           ? `
  //       <div class="section">
  //         <div class="section-header">📋 Raw Material Report</div>
  //         <table>
  //           <thead><tr><th>Date</th><th>Weight</th><th>Price</th><th>Total</th><th>Customer</th><th>Contact</th><th>Remark</th></tr></thead>
  //           <tbody>${(markerData.rawMaterialReport?.salesHistory ?? [])
  //             .map(
  //               (s) => `
  //             <tr>
  //               <td>${formatDate(s.date)}</td>
  //               <td>${s.weight}</td>
  //               <td>${s.price}</td>
  //               <td>${fmt(s.total)}</td>
  //               <td>${s.customerName || "-"}</td>
  //               <td>${s.customerContact || "-"}</td>
  //               <td>${s.remark || "-"}</td>
  //             </tr>`,
  //             )
  //             .join("")}
  //           </tbody>
  //         </table>
  //       </div>`
  //           : "";

  //       const mess = markerData.messLabourReport
  //         ? `
  //       <div class="section">
  //         <div class="section-header">👷 Mess Labour Report</div>
  //         <table>
  //           <tr><td>Processing Date</td><td>${formatDate(markerData.messLabourReport.processingDate)}</td></tr>
  //           <tr><td>Quantity Processed</td><td>${markerData.messLabourReport.quantityProcessed} ${markerData.messLabourReport.unit}</td></tr>
  //           <tr class="total-row"><td>Total Worker Fees</td><td>MMK ${fmt(markerData.messLabourReport.totalWorkerFees)}</td></tr>
  //         </table>
  //         <div class="sub-header">Weight Distribution &amp; Loss</div>
  //         <table>
  //           ${markerData.messLabourReport.redWeight > 0 ? `<tr><td>Red Weight</td><td>${markerData.messLabourReport.redWeight} kg</td></tr>` : ""}
  //           ${markerData.messLabourReport.whiteWeight > 0 ? `<tr><td>White Weight</td><td>${markerData.messLabourReport.whiteWeight} kg</td></tr>` : ""}
  //           ${markerData.messLabourReport.specialWeight > 0 ? `<tr><td>Special Weight</td><td>${markerData.messLabourReport.specialWeight} kg</td></tr>` : ""}
  //           ${markerData.messLabourReport.naturalWeight > 0 ? `<tr><td>Natural Weight</td><td>${markerData.messLabourReport.naturalWeight} kg</td></tr>` : ""}
  //           ${markerData.messLabourReport.naturalWhiteWeight > 0 ? `<tr><td>Natural White Weight</td><td>${markerData.messLabourReport.naturalWhiteWeight} kg</td></tr>` : ""}
  //           ${markerData.messLabourReport.naturalRedWeight > 0 ? `<tr><td>Natural Red Weight</td><td>${markerData.messLabourReport.naturalRedWeight} kg</td></tr>` : ""}
  //           ${markerData.messLabourReport.shortCutWeight > 0 ? `<tr><td>Short Cut Weight</td><td>${markerData.messLabourReport.shortCutWeight} kg</td></tr>` : ""}
  //           ${markerData.messLabourReport.artificialWeight > 0 ? `<tr><td>Artificial Weight</td><td>${markerData.messLabourReport.artificialWeight} kg</td></tr>` : ""}
  //           ${markerData.messLabourReport.shortWeight > 0 ? `<tr><td>Short Weight</td><td>${markerData.messLabourReport.shortWeight} kg</td></tr>` : ""}
  //           ${markerData.messLabourReport.lossWeight > 0 ? `<tr class="total-row"><td><strong>Lost Weight</strong></td><td><strong>${markerData.messLabourReport.lossWeight} kg</strong></td></tr>` : ""}
  //         </table>
  //         ${
  //           (markerData.messLabourReport.workers?.length ?? 0) > 0
  //             ? `
  //         <div class="sub-header">Workers Details</div>
  //         <table>
  //           <thead><tr><th>Worker Name</th><th>Fee</th></tr></thead>
  //           <tbody>${markerData.messLabourReport.workers.map((w: WorkerFeeDetailDto) => `<tr><td>${w.workerName}</td><td>MMK ${fmt(w.feeAmount)}</td></tr>`).join("")}</tbody>
  //         </table>`
  //             : ""
  //         }
  //       </div>`
  //         : "";

  //       const purified = markerData.purifiedStockReport
  //         ? `
  //       <div class="section">
  //         <div class="section-header">💧 Purified Stock Report</div>
  //         ${
  //           (markerData.purifiedStockReport.records?.length ?? 0) > 0
  //             ? `
  //         ${markerData.purifiedStockReport.records
  //           .map(
  //             (record: PurifiedRecordEntryDto, idx: number) => `
  //           <div class="sub-header">Category: ${record.category} (Record ${idx + 1})</div>
  //           <table>
  //             <tr><td>Date</td><td>${formatDate(record.date)}</td></tr>
  //             <tr><td>Place</td><td>${record.place}</td></tr>
  //             <tr><td>Input Weight</td><td>${record.inputWeight} kg</td></tr>
  //             <tr><td>Output Weight</td><td>${record.outputWeight} kg</td></tr>
  //             <tr><td>Weight Loss</td><td>${record.weightLossKg} kg (${fmt(record.weightLossPercent)}%)</td></tr>
  //             <tr><td>Purifier Name</td><td>${record.purifierName}</td></tr>
  //             <tr><td>Purifier Fees</td><td>MMK ${fmt(record.purifierFees)}</td></tr>
  //             <tr><td>Supervisor</td><td>${record.supervisorName}</td></tr>
  //             <tr><td>Supervisor Fees</td><td>MMK ${fmt(record.supervisorFees)}</td></tr>
  //             <tr class="total-row"><td><strong>Total Cost</strong></td><td><strong>MMK ${fmt(record.totalCost)}</strong></td></tr>
  //           </table>`,
  //           )
  //           .join("")}
  //         <div class="sub-header">Summary Totals</div>
  //         <table>
  //           <tr><td>Total Input Weight</td><td>${fmt(markerData.purifiedStockReport.totalInputWeight)} kg</td></tr>
  //           <tr><td>Total Output Weight</td><td>${fmt(markerData.purifiedStockReport.totalOutputWeight)} kg</td></tr>
  //           <tr><td>Total Weight Loss</td><td>${fmt(markerData.purifiedStockReport.totalWeightLossKg)} kg</td></tr>
  //           <tr class="total-row"><td><strong>Total Purification Cost</strong></td><td><strong>MMK ${fmt(markerData.purifiedStockReport.totalPurificationCost)}</strong></td></tr>
  //         </table>`
  //             : ""
  //         }
  //       </div>`
  //         : "";

  //       const refined = markerData.refinedStockReport
  //         ? `
  //       <div class="section">
  //         <div class="section-header">📦 Refined Stock Report</div>
  //         ${
  //           (markerData.refinedStockReport.records?.length ?? 0) > 0
  //             ? `
  //         ${markerData.refinedStockReport.records
  //           .map(
  //             (record: RefinedRecordEntryDto, idx: number) => `
  //           <div class="sub-header">Category: ${record.category} (Record ${idx + 1})</div>
  //           <table>
  //             <tr><td>Date</td><td>${formatDate(record.date)}</td></tr>
  //             <tr><td>Input Weight</td><td>${record.inputWeight} kg</td></tr>
  //             <tr><td>Output Weight</td><td>${record.outputWeight} kg</td></tr>
  //             <tr><td>Lost Weight</td><td>${record.lostWeight} kg</td></tr>
  //             <tr><td>Spoilage Weight</td><td>${record.spoilageWeight} kg</td></tr>
  //             <tr><td>Return Weight</td><td>${record.returnWeight} kg</td></tr>
  //             <tr><td>Refinement Worker</td><td>${record.refinementWorkerName}</td></tr>
  //             <tr><td>Worker Fees</td><td>MMK ${fmt(record.workerFees)}</td></tr>
  //             <tr class="total-row"><td><strong>Total Cost</strong></td><td><strong>MMK ${fmt(record.totalCost)}</strong></td></tr>
  //           </table>`,
  //           )
  //           .join("")}
  //         <div class="sub-header">Summary Totals</div>
  //         <table>
  //           <tr><td>Total Input Weight</td><td>${fmt(markerData.refinedStockReport.totalInputWeight)} kg</td></tr>
  //           <tr><td>Total Output Weight</td><td>${fmt(markerData.refinedStockReport.totalOutputWeight)} kg</td></tr>
  //           <tr><td>Total Lost Weight</td><td>${fmt(markerData.refinedStockReport.totalLostWeight)} kg</td></tr>
  //           <tr><td>Total Spoilage Weight</td><td>${fmt(markerData.refinedStockReport.totalSpoilageWeight)} kg</td></tr>
  //           <tr><td>Total Return Weight</td><td>${fmt(markerData.refinedStockReport.totalReturnWeight)} kg</td></tr>
  //           <tr><td>Total Worker Fees</td><td>MMK ${fmt(markerData.refinedStockReport.totalWorkerFees)}</td></tr>
  //           <tr class="total-row"><td><strong>Total Refinement Cost</strong></td><td><strong>MMK ${fmt(markerData.refinedStockReport.totalRefinementCost)}</strong></td></tr>
  //         </table>`
  //             : ""
  //         }
  //       </div>`
  //         : "";

  //       const sdd = markerData.singleDoubleDrawnReport
  //         ? `
  //       <div class="section">
  //         <div class="section-header">🎯 Single &amp; Double Drawn Report</div>
  //         ${
  //           (markerData.singleDoubleDrawnReport.records?.length ?? 0) > 0
  //             ? `
  //         ${markerData.singleDoubleDrawnReport.records
  //           .map(
  //             (record: SingleDoubleDrawnRecordEntryDto, idx: number) => `
  //           <div class="sub-header">Category: ${record.category} (Record ${idx + 1})</div>
  //           <table>
  //             <tr><td>Date</td><td>${formatDate(record.date)}</td></tr>
  //             ${record.sizes.map((s) => `<tr><td>${s.sizeName}</td><td>${fmt(s.weight)} kg @ ¥${fmt(s.price)}</td></tr>`).join("")}
  //             <tr><td>Lost Weight</td><td>${fmt(record.lostWeight)} kg</td></tr>
  //             <tr><td>Spoilage Weight</td><td>${fmt(record.spoilageWeight)} kg</td></tr>
  //             <tr><td>Return Weight</td><td>${fmt(record.returnWeight)} kg</td></tr>
  //             <tr><td>Worker</td><td>${record.workerName}</td></tr>
  //             <tr><td>Worker Fees</td><td>MMK ${fmt(record.workerFees)}</td></tr>
  //             <tr class="total-row"><td><strong>Total Amount (CNY)</strong></td><td><strong>¥ ${fmt(record.totalAmount)}</strong></td></tr>
  //           </table>`,
  //           )
  //           .join("")}
  //         <div class="sub-header">Summary Totals</div>
  //         <table>
  //           <tr><td>Total Weight</td><td>${fmt(markerData.singleDoubleDrawnReport.totalWeight)} kg</td></tr>
  //           <tr><td>Total Lost Weight</td><td>${fmt(markerData.singleDoubleDrawnReport.totalLostWeight)} kg</td></tr>
  //           <tr><td>Total Spoilage Weight</td><td>${fmt(markerData.singleDoubleDrawnReport.totalSpoilageWeight)} kg</td></tr>
  //           <tr><td>Total Return Weight</td><td>${fmt(markerData.singleDoubleDrawnReport.totalReturnWeight)} kg</td></tr>
  //           <tr><td>Total Worker Fees</td><td>MMK ${fmt(markerData.singleDoubleDrawnReport.totalWorkerFees)}</td></tr>
  //           <tr class="total-row"><td><strong>Total Amount (CNY)</strong></td><td><strong>¥ ${fmt(markerData.singleDoubleDrawnReport.totalAmountCny)}</strong></td></tr>
  //         </table>`
  //             : ""
  //         }
  //       </div>`
  //         : "";

  //       return `
  //       <div class="marker-block">
  //         <div class="marker-title">${markerData.markerName}</div>
  //         ${inv}${raw}${mess}${purified}${refined}${sdd}
  //       </div>`;
  //     })
  //     .join("");

  //   const generatedOn = new Date().toLocaleString("en-GB", {
  //     day: "2-digit",
  //     month: "short",
  //     year: "numeric",
  //     hour: "2-digit",
  //     minute: "2-digit",
  //   });

  //   const pdfStyles = `
  //     * { box-sizing: border-box; margin: 0; padding: 0; }
  //     body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1e293b; background: #fff; }
  //     .pdf-cover { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: #fff; padding: 20px 20px 20px; margin-bottom: 32px; }
  //     .pdf-cover .logo { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 4px; }
  //     .pdf-cover .tagline { font-size: 12px; opacity: 0.75; margin-bottom: 32px; }
  //     .pdf-cover h1 { font-size: 22px; font-weight: 700;  }
  //     .pdf-cover .meta { font-size: 11px; opacity: 0.8; }
  //     .pdf-body { padding: 0 40px 40px; }
  //     .marker-block { margin-bottom: 40px; }
  //     .marker-block + .marker-block { border-top: 2px solid #e2e8f0; padding-top: 28px; }
  //     .marker-title { font-size: 16px; font-weight: 700; color: #1e3a5f; background: #f0f6ff; border-left: 4px solid #2563eb; padding: 10px 16px; border-radius: 0 8px 8px 0; margin-bottom: 18px; }
  //     .section { margin-bottom: 18px; margin-top: 48px; }
  //     .section-header { font-size: 12px; font-weight: 700; color: #fff; background: linear-gradient(90deg,#1e3a5f,#2563eb); padding: 7px 14px; border-radius: 6px 6px 0 0; margin-bottom: 0; letter-spacing: 0.03em; }
  //     .sub-header { font-size: 11px; font-weight: 700; color: #2563eb; background: #eff6ff; padding: 5px 12px; border-left: 3px solid #2563eb; margin: 12px 0 6px; border-radius: 0 4px 4px 0; }
  //     table { width: 100%; border-collapse: collapse; font-size: 11px; }
  //     thead tr { background: #1e3a5f; color: #fff; }
  //     thead th { padding: 7px 12px; text-align: left; font-weight: 600; font-size: 10px; letter-spacing: 0.05em; text-transform: uppercase; }
  //     tbody tr:nth-child(even) { background: #f8fafc; }
  //     td { padding: 6px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  //     td:first-child { color: #475569; font-weight: 500; width: 45%; }
  //     td:last-child { font-weight: 600; color: #1e293b; }
  //     .total-row td { background: #eff6ff !important; border-top: 2px solid #2563eb; }
  //     .total-row td:last-child { color: #1e3a5f; font-size: 12px; }
  //     .pdf-footer { margin-top: 40px; padding: 16px 40px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
  //   `;

  //   const bodyHtml = `
  //     <div class="pdf-cover">
  //       <h1>Detailed Report</h1>
  //       <div class="meta">Generated on: ${generatedOn}</div>
  //     </div>
  //     <div class="pdf-body">${markerSections}</div>
  //     <div class="pdf-footer">
  //       <span>AKZ Business Management System</span>
  //       <span>Generated: ${generatedOn}</span>
  //     </div>
  //   `;

  //   // Create hidden off-screen container
  //   const container = document.createElement("div");
  //   container.style.cssText =
  //     "position:fixed;left:-9999px;top:0;width:794px;background:#fff;";
  //   const styleEl = document.createElement("style");
  //   styleEl.textContent = pdfStyles;
  //   container.appendChild(styleEl);
  //   container.insertAdjacentHTML("beforeend", bodyHtml);
  //   document.body.appendChild(container);

  //   setPdfLoading(true);
  //   try {
  //     const canvas = await html2canvas(container, {
  //       scale: 2,
  //       useCORS: true,
  //       logging: false,
  //       backgroundColor: "#ffffff",
  //     });

  //     // --- Smart page-break logic ---
  //     // Gather natural break points from section boundaries in the rendered container
  //     const SCALE = 2; // must match html2canvas scale above
  //     const A4_W_MM = 210;
  //     const A4_H_MM = 297;
  //     const containerTop = container.getBoundingClientRect().top;
  //     const breakEls = container.querySelectorAll(
  //       ".pdf-cover, .marker-title, .section, .pdf-footer",
  //     );
  //     const breakSet = new Set<number>([0]);
  //     breakEls.forEach((el) => {
  //       const top = Math.round(
  //         (el.getBoundingClientRect().top - containerTop) * SCALE,
  //       );
  //       if (top > 0) breakSet.add(top);
  //     });
  //     const breakPoints = Array.from(breakSet).sort((a, b) => a - b);

  //     // A4 page height expressed in canvas pixels
  //     const pageHeightPx = Math.floor((A4_H_MM * canvas.width) / A4_W_MM);

  //     const pdf = new jsPDF({
  //       orientation: "portrait",
  //       unit: "mm",
  //       format: "a4",
  //     });
  //     let pageStart = 0;
  //     let firstPage = true;

  //     while (pageStart < canvas.height) {
  //       const rawEnd = pageStart + pageHeightPx;

  //       // Find the latest natural break point that sits at or before rawEnd
  //       let breakAt = rawEnd;
  //       if (rawEnd < canvas.height) {
  //         for (let i = breakPoints.length - 1; i >= 0; i--) {
  //           if (breakPoints[i] <= rawEnd && breakPoints[i] > pageStart) {
  //             breakAt = breakPoints[i];
  //             break;
  //           }
  //         }
  //       }
  //       breakAt = Math.min(breakAt, canvas.height);

  //       // Draw this slice onto a temporary canvas
  //       const sliceH = breakAt - pageStart;
  //       const sliceCanvas = document.createElement("canvas");
  //       sliceCanvas.width = canvas.width;
  //       sliceCanvas.height = sliceH;
  //       const ctx = sliceCanvas.getContext("2d")!;
  //       ctx.fillStyle = "#ffffff";
  //       ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
  //       ctx.drawImage(canvas, 0, -pageStart, canvas.width, canvas.height);

  //       const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.92);
  //       const sliceH_MM = (sliceH * A4_W_MM) / canvas.width;

  //       if (!firstPage) pdf.addPage();
  //       pdf.addImage(sliceData, "JPEG", 0, 0, A4_W_MM, sliceH_MM);
  //       firstPage = false;

  //       pageStart = breakAt;
  //     }

  //     pdf.save(`AKZ-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
  //   } finally {
  //     setPdfLoading(false);
  //     document.body.removeChild(container);
  //   }
  // };

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
            className="btn btn-pdf download-report-btn"
            onClick={downloadExcelReport}
            disabled={excelDownloading}
          >
            {excelDownloading ? "Downloading..." : "Download Report"}
          </button>
        </div>
      </div>
{/* 
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
      </div> */}

      {/* <div className="report-section">
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
      </div> */}
{/* 
      <div className="report-actions">
        <button
          className="btn btn-primary"
          onClick={generateReport}
          disabled={loading || selectedMarkers.size === 0}
        >
          {loading ? "Generating..." : "Generate Report"}
        </button>
        {reportData && (
          <button
            className="btn btn-pdf"
            onClick={generatePDF}
            disabled={pdfLoading}
          >
            {pdfLoading ? "⏳ Generating PDF..." : "📄 Generate PDF"}
          </button>
        )}
      </div> */}

      {/* {reportData && (
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
                              (record: SingleDoubleDrawnRecordEntryDto) => (
                                <div
                                  key={record.id}
                                  className="category-section"
                                >
                                  <h5>
                                    📦 Category: {record.category} (
                                    {record.categoryColor})
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
      )} */}
    </div>
  );
};

export default Report;
