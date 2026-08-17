import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  exchangeRatesAPI,
  semiExportPurchaseAPI,
  semiExportPurchaseProcessingAPI,
  semiExportPurchaseRecordsAPI,
  workersAPI,
} from "../../services/api";
import {
  Package,
  FilePlus,
  Trash2,
  X,
  Send,
  Loader2,
  Sparkles,
  Search,
} from "lucide-react";
import "./index.css";
import type { ExchangeRate, SingleDoubleDrawnWorker } from "../../types";
import { formatDateTime } from "../../utils/format";

interface SemiExportPurchase {
  id: number;
  customerName: string;
  contact: string;
  totalReceiveWeight: number;
  receiveDateTime: string;
  color: string;
  createdAt: string;
}

interface SemiExportPurchaseProcessing {
  id: number;
  semiExportPurchaseId: number;
  customerName: string;
  contact: string;
  receiveDateTime: string;
  color: string;
  workerId: number;
  workerName: string;
  assignWeight: number;
  lostWeight: number;
  status: string;
  createdAt: string;
}

interface SemiExportPurchaseRecordSize {
  size: string;
  weight: number;
  price: number;
}

interface SemiExportPurchaseRecord {
  id: number;
  semiExportPurchaseProcessingId: number;
  semiExportPurchaseId: number;
  customerName: string;
  contact: string;
  color: string;
  receiveDateTime: string;
  assignWeight: number;
  lostWeight: number;
  workerName: string;
  workerFees: number;
  exchangeRateId?: number | null;
  exchangeRateRate: number;
  sizes: SemiExportPurchaseRecordSize[];
  createdAt: string;
}

interface SortingSizeRow {
  size: string;
  weight: string;
  price: string;
}

const sortingSizeRows: SortingSizeRow[] = [
  { size: "6", weight: "", price: "0" },
  { size: "7", weight: "", price: "0" },
  { size: "8", weight: "", price: "0" },
  { size: "9", weight: "", price: "0" },
  { size: "10", weight: "", price: "0" },
  { size: "10B", weight: "", price: "0" },
  { size: "12", weight: "", price: "0" },
  { size: "14", weight: "", price: "0" },
  { size: "16", weight: "", price: "0" },
  { size: "18", weight: "", price: "0" },
  { size: "20", weight: "", price: "0" },
  { size: "22", weight: "", price: "0" },
  { size: "24", weight: "", price: "0" },
  { size: "26", weight: "", price: "0" },
  { size: "28", weight: "", price: "0" },
  { size: "Bar", weight: "", price: "0" },
  { size: "Return", weight: "", price: "0" },
  { size: "Spoilage", weight: "", price: "0" },
  { size: "Lost", weight: "", price: "0" },
];

const SemiExportPurchase: React.FC = () => {
  const { hasPermission } = useAuth();
  const [purchases, setPurchases] = useState<SemiExportPurchase[]>([]);
  const [processingList, setProcessingList] = useState<
    SemiExportPurchaseProcessing[]
  >([]);
  const [sortingHistory, setSortingHistory] = useState<
    SemiExportPurchaseRecord[]
  >([]);
  const [workers, setWorkers] = useState<SingleDoubleDrawnWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingLoading, setProcessingLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"processing" | "history">(
    "processing",
  );
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historyFromDate, setHistoryFromDate] = useState("");
  const [historyToDate, setHistoryToDate] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showSortingRecordsModal, setShowSortingRecordsModal] = useState(false);
  const [selectedSortingRecord, setSelectedSortingRecord] =
    useState<SemiExportPurchaseProcessing | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryRecord, setSelectedHistoryRecord] =
    useState<SemiExportPurchaseRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [showTotalAmount, setShowTotalAmount] = useState(true);
  const [showExchangeRate, setShowExchangeRate] = useState(true);
  const [companyName, setCompanyName] = useState("King Panthera");
  const [activeRates, setActiveRates] = useState<ExchangeRate[]>([]);
  const [sortingExchangeRate, setSortingExchangeRate] = useState("0");
  const [sortingWorkerFees, setSortingWorkerFees] = useState("");
  const [sortingSizes, setSortingSizes] =
    useState<SortingSizeRow[]>(sortingSizeRows);
  const [assignWeights, setAssignWeights] = useState<Record<number, string>>(
    {},
  );
  const [selectedWorkers, setSelectedWorkers] = useState<
    Record<number, string>
  >({});

  const assignedIds = new Set(
    processingList.map((p) => p.semiExportPurchaseId),
  );
  const availablePurchases = purchases.filter((p) => !assignedIds.has(p.id));
  const savedProcessingIds = new Set(
    sortingHistory.map((record) => record.semiExportPurchaseProcessingId),
  );
  const visibleProcessingList = processingList.filter(
    (item) => !savedProcessingIds.has(item.id),
  );

  const filteredSortingHistory = useMemo(() => {
    return sortingHistory.filter((r) => {
      const term = historySearchTerm.toLowerCase();
      if (
        term &&
        !(r.customerName || "").toLowerCase().includes(term) &&
        !(r.color || "").toLowerCase().includes(term) &&
        !(r.workerName || "").toLowerCase().includes(term)
      )
        return false;
      if (historyFromDate) {
        const d = new Date((r.createdAt || "").split("T")[0]);
        if (d < new Date(historyFromDate)) return false;
      }
      if (historyToDate) {
        const d = new Date((r.createdAt || "").split("T")[0]);
        if (d > new Date(historyToDate)) return false;
      }
      return true;
    });
  }, [sortingHistory, historySearchTerm, historyFromDate, historyToDate]);
  const activeCnyToMmkRate = activeRates.find(
    (rate) =>
      rate.fromCurrency?.toUpperCase() === "CNY" &&
      rate.toCurrency?.toUpperCase() === "MMK" &&
      rate.activeStatus,
  );

  const getAssignWeight = (id: number) =>
    parseFloat(assignWeights[id] || "0") || 0;
  const getLostWeight = (purchase: SemiExportPurchase) => {
    if (
      assignWeights[purchase.id] === undefined ||
      assignWeights[purchase.id] === ""
    )
      return 0;
    return Math.max(
      0,
      purchase.totalReceiveWeight - getAssignWeight(purchase.id),
    );
  };
  const [formData, setFormData] = useState({
    customerName: "",
    contact: "",
    totalReceiveWeight: "",
    receiveDateTime: new Date().toISOString().substring(0, 16),
    color: "Red",
  });

  const colorCategories = [
    "Red",
    "White",
    "Natural",
    "Natural White",
    "Artificial",
    "Regular",
    "Black",
    "Regular Extra",
    "Black Extra",
    "White Extra",
    "Natural White Extra",
    "OffCuts",
    "Reclaimed",
    "Fluff",
  ];

  // Load purchases on component mount
  useEffect(() => {
    loadPurchases();
    loadWorkers();
    loadProcessingList();
    loadSortingHistory();
    loadActiveRates();
  }, []);

  useEffect(() => {
    setSortingExchangeRate(
      activeCnyToMmkRate ? activeCnyToMmkRate.rate.toString() : "0",
    );
  }, [activeCnyToMmkRate]);

  const loadWorkers = async () => {
    try {
      const data = await workersAPI.getSemiExportPurchaseWorkers();
      setWorkers(data);
    } catch (error) {
      console.error("Failed to load workers:", error);
    }
  };

  const loadProcessingList = async () => {
    try {
      setProcessingLoading(true);
      const data = await semiExportPurchaseProcessingAPI.getAll();
      setProcessingList(data);
    } catch (error) {
      console.error("Failed to load processing list:", error);
    } finally {
      setProcessingLoading(false);
    }
  };

  const loadSortingHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await semiExportPurchaseRecordsAPI.getAll();
      setSortingHistory(data);
    } catch (error) {
      console.error("Failed to load sorting history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const data = await semiExportPurchaseAPI.getAll();
      setPurchases(data);
    } catch (error) {
      console.error("Failed to load purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName.trim()) {
      alert("Customer name is required");
      return;
    }

    try {
      setSaving(true);
      const newPurchase = await semiExportPurchaseAPI.create({
        customerName: formData.customerName,
        contact: formData.contact,
        totalReceiveWeight: parseFloat(formData.totalReceiveWeight) || 0,
        receiveDateTime: formData.receiveDateTime,
        color: formData.color,
      });

      setPurchases((prev) => [newPurchase, ...prev]);
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save purchase:", error);
      alert("Failed to save purchase order");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: "",
      contact: "",
      totalReceiveWeight: "",
      receiveDateTime: new Date().toISOString().substring(0, 16),
      color: "Red",
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this purchase order?")) {
      return;
    }

    try {
      await semiExportPurchaseAPI.delete(id);
      setPurchases((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Failed to delete purchase:", error);
      alert("Failed to delete purchase order");
    }
  };

  const handleDeleteProcessing = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this processing record?")) {
      return;
    }
    try {
      await semiExportPurchaseProcessingAPI.delete(id);
      setProcessingList((prev) => prev.filter((p) => p.id !== id));
      // Also remove associated sorting history entries (backend cascade deletes them)
      setSortingHistory((prev) =>
        prev.filter((r) => r.semiExportPurchaseProcessingId !== id),
      );
    } catch (error) {
      console.error("Failed to delete processing record:", error);
      alert("Failed to delete processing record");
    }
  };

  const handleDeleteHistory = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (
      !confirm("Are you sure you want to delete this sorting history record?")
    ) {
      return;
    }
    try {
      await semiExportPurchaseRecordsAPI.delete(id);
      setSortingHistory((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Failed to delete sorting history record:", error);
      alert("Failed to delete sorting history record");
    }
  };

  const loadActiveRates = async () => {
    try {
      const data = await exchangeRatesAPI.getActive();
      setActiveRates(data);
    } catch (error) {
      console.error("Failed to load exchange rates:", error);
      setSortingExchangeRate("0");
    }
  };

  const updateSortingSize = (
    size: string,
    field: "weight" | "price",
    value: string,
  ) => {
    setSortingSizes((prev) =>
      prev.map((row) =>
        row.size === size && row.size !== "Lost"
          ? { ...row, [field]: value }
          : row,
      ),
    );
  };

  const getSortingAmount = (row: SortingSizeRow) =>
    (parseFloat(row.weight) || 0) * (parseFloat(row.price) || 0);

  const getCalculatedSortingLostWeight = () => {
    if (!selectedSortingRecord) return 0;

    const usedWeight = sortingSizes
      .filter((row) => row.size !== "Lost")
      .reduce((sum, row) => sum + (parseFloat(row.weight) || 0), 0);

    return Math.max(0, selectedSortingRecord.assignWeight - usedWeight);
  };

  const escapePrintText = (value: string | number) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const formatSortingSize = (size: string) => {
    if (["Return", "Spoilage", "Lost"].includes(size)) return size;
    return `Size ${size}`;
  };

  const printSortingPurchasePdf = (
    record:
      | SemiExportPurchaseProcessing
      | SemiExportPurchaseRecord
      | null = selectedSortingRecord,
    rows: SortingSizeRow[] = sortingSizes,
    rateValue: string = sortingExchangeRate,
    isSave: boolean,
  ) => {
    if (!record) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const sortedSizes = [
      "Bar",
      "28",
      "26",
      "24",
      "22",
      "20",
      "18",
      "16",
      "14",
      "12",
      "10",
      "10B",
      "9",
      "8",
      "7",
      "6",
      "Return",
      "Spoilage",
    ];
    const sizeMap = new Map(rows.map((row) => [row.size, row]));
    const rate = parseFloat(rateValue) || 0;
    const totalWt = rows
      .filter((row) => row.size !== "Lost")
      .reduce((sum, row) => sum + (parseFloat(row.weight) || 0), 0);
    let totalAmt = 0;
    let idx = 1;

    const rowsHtml = sortedSizes
      .map((size) => {
        const row = sizeMap.get(size);
        const weight = parseFloat(row?.weight || "0") || 0;
        if (weight === 0) return "";

        const price =
          (isSave
            ? parseFloat(row?.price || "0") * 1.633
            : parseFloat(row?.price || "0") * 1) || 0;
        const amount = weight * price;
        if (weight > 0 && price > 0) totalAmt += amount;

        const displaySize = size === "Bar" ? "B" : size;

        return `
          <tr>
            <td style="text-align: center; border: 1px solid black; padding: 4px;">${idx++}</td>
            <td style="text-align: center; border: 1px solid black; padding: 4px;">${escapePrintText(displaySize)}</td>
            <td style="text-align: right; border: 1px solid black; padding: 4px;">${weight.toFixed(3)} viss</td>
   ${
     showTotalAmount
       ? `
           <td style="text-align: right; border: 1px solid black; padding: 4px;">${price > 0 ? price.toFixed(2) : "0"}</td>
            <td style="text-align: right; border: 1px solid black; padding: 4px;">${amount > 0 ? amount.toFixed(4) : "0"}</td>
           
            `
       : ""
   }
   
          </tr>
        `;
      })
      .join("");

    const totalMmk = totalAmt * rate;
    const lostRow = sizeMap.get("Lost");
    const lostWeight =
      parseFloat(lostRow?.weight || "0") ||
      Math.max(0, record.assignWeight - totalWt);
    const receiveDate = formatDateTime(record.receiveDateTime);
    const printDate = new Date();

    const outputHtml = `
      <html>
        <head>
          <style>
            @media print {
              @page { size: A5 portrait; margin: 0; }
              body { font-family: sans-serif; padding: 10mm; }
            }
            .header { text-align: center; margin-bottom: 20px; }
            .header h3 { margin: 2px; }
            .header h2 { margin: 5px; }
            .header p { margin: 2px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
            th, td { border: 1px solid black; padding: 6px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${escapePrintText(companyName || "King Panthera")}</h2>
            <h3>ဆံပင်ရောင်းဝယ်ရေး</h3>
            <p>ဖုန်း - 09 400900608 / 09 400900609</p>
          </div>

          <table class="info-table" style="table-layout: fixed;">
            <colgroup>
              <col style="width: 18%;" />
              <col style="width: 40%;" />
              <col style="width: 17%;" />
              <col style="width: 25%;" />
            </colgroup>
            <tr>
              <td style="border: none; padding: 8px 8px; vertical-align: top; line-height: 1.55;">အမည်<br/>ခုံတင်ချိန်</td>
              <td style="border: none; padding: 8px 8px; vertical-align: top; line-height: 1.55;">- ${escapePrintText(record.customerName)} (${escapePrintText(record.color)})<br/>- ${totalWt.toFixed(3)} viss</td>
              <td style="border: none; padding: 8px 8px; vertical-align: top; line-height: 1.55;">ကုန်အပ်ရက်<br/>နေ့စွဲ</td>
              <td style="border: none; padding: 8px 8px; vertical-align: top; line-height: 1.55;">${escapePrintText(receiveDate)}<br/>${formatDateTime(printDate)}</td>
            </tr>
          </table>

          <table class="data-table">
            <thead>
              <tr>
                <th>စဉ်</th>
                <th>ဆိုဒ်</th>
                <th>အလေးချိန်</th>
                 ${
                   showTotalAmount
                     ? `
                <th>နှုန်း</th>
                <th>သင့်ငွေ</th>`
                     : ""
                 }      
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr>
                <td colspan="2" style="text-align: right; padding: 3px 5px;">စုစုပေါင်း</td>
                <td style="text-align: right; padding: 3px 5px;">${totalWt.toFixed(3)} viss</td>
                ${
                  showTotalAmount
                    ? `
            
                <td></td>
                <td style="text-align: right; padding: 3px 5px; font-weight: bold;">¥${totalAmt.toFixed(2)}</td>`
                    : ""
                }   
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 20px; font-size: 14px;">
            ${showExchangeRate ? `<div style="margin-bottom: 8px;"><strong>Exchange Rate:</strong> 1 CNY = ${rate.toLocaleString()} MMK</div>` : ""}
            ${
              showTotalAmount
                ? `
            <div style="margin-bottom: 8px;"><strong>Total Amount (CNY):</strong> ¥${totalAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>`
                : ""
            }
            <div style="margin-bottom: 8px;"><strong>Total Amount (MMK):</strong> ${Math.round(totalMmk).toLocaleString()} MMK</div>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed black;"><strong>Lost Weight:</strong> ${lostWeight.toFixed(3)} viss</div>
          </div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(outputHtml);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 500);
  };

  const handleSortingSaveAndPrint = async () => {
    if (!selectedSortingRecord) {
      alert("Please select a sorting record first.");
      return;
    }

    if (!activeCnyToMmkRate || parseFloat(sortingExchangeRate || "0") <= 0) {
      alert("Active CNY to MMK exchange rate is required.");
      return;
    }

    try {
      setSaving(true);
      const printRecord = selectedSortingRecord;
      const printRows = sortingSizes.map((row) => {
        const weight =
          row.size === "Lost"
            ? getCalculatedSortingLostWeight()
            : parseFloat(row.weight) || 0;
        const price = weight > 0 ? row.price : "0";

        return {
          size: row.size,
          weight: weight.toString(),
          price,
        };
      });
      const printRate = sortingExchangeRate;
      const savedRecord = await semiExportPurchaseRecordsAPI.create({
        semiExportPurchaseProcessingId: selectedSortingRecord.id,
        exchangeRateId: activeCnyToMmkRate.id,
        exchangeRateRate: parseFloat(sortingExchangeRate) || 0,
        workerFees: parseFloat(sortingWorkerFees) || 0,
        sizes: printRows.map((row) => ({
          size: row.size,
          weight: parseFloat(row.weight) || 0,
          price:
            (parseFloat(row.weight) || 0) > 0
              ? parseFloat(row.price) * 1.633 || 0
              : 0,
        })),
      });

      setSortingHistory((prev) => [savedRecord, ...prev]);
      closeSortingRecordsModal();
      setTimeout(() => {
        printSortingPurchasePdf(printRecord, printRows, printRate, true);
      }, 250);
    } catch (error) {
      console.error("Failed to save semi export purchase record:", error);
      alert("Failed to save semi export purchase record");
    } finally {
      setSaving(false);
    }
  };

  const openSortingRecordsModal = (record: SemiExportPurchaseProcessing) => {
    setSelectedSortingRecord(record);
    setSortingSizes(getSortingRowsWithLatestPrices());
    setSortingWorkerFees("");
    setShowSortingRecordsModal(true);
  };

  const closeSortingRecordsModal = () => {
    setShowSortingRecordsModal(false);
    setSelectedSortingRecord(null);
    setSortingWorkerFees("");
  };

  const openHistoryModal = (record: SemiExportPurchaseRecord) => {
    setSelectedHistoryRecord(record);
    setShowHistoryModal(true);
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedHistoryRecord(null);
  };

  const getHistorySortingRows = (record: SemiExportPurchaseRecord) =>
    sortingSizeRows.map((row) => {
      const savedRow = record.sizes.find((size) => size.size === row.size);
      return {
        size: row.size,
        weight: savedRow ? savedRow.weight.toString() : "",
        price: savedRow ? savedRow.price.toString() : row.price,
      };
    });

  const getSortingRowsWithLatestPrices = () => {
    const latestRecord = sortingHistory[0];

    if (!latestRecord) {
      return sortingSizeRows.map((row) => ({ ...row, weight: "", price: "" }));
    }

    return sortingSizeRows.map((row) => {
      if (row.size === "Lost") return { ...row, weight: "" };

      const latestSize = latestRecord.sizes.find(
        (size) => size.size === row.size,
      );

      return {
        ...row,
        weight: "",
        price: latestSize ? latestSize.price.toString() : row.price,
      };
    });
  };

  const getHistoryTotalWeight = (record: SemiExportPurchaseRecord) =>
    record.sizes
      .filter((row) => row.size !== "Lost")
      .reduce((sum, row) => sum + (row.weight || 0), 0);

  const getHistorySortingLostWeight = (record: SemiExportPurchaseRecord) =>
    record.sizes.find((row) => row.size === "Lost")?.weight || 0;

  const renderProcessingTable = () => {
    if (processingLoading) {
      return (
        <div className="sep-empty-state">Loading processing records...</div>
      );
    }

    if (visibleProcessingList.length === 0) {
      return (
        <div className="sep-empty-state">
          <Package size={40} />
          <p>No processing records found</p>
        </div>
      );
    }

    return (
      <div className="table-responsive sep-table-wrap">
        <table className="sep-data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Color</th>
              <th>Receive DateTime</th>
              <th>Worker</th>
              <th className="sep-num">Assign weight</th>
              <th className="sep-num">Lost weight</th>
              <th>Assign Date</th>
              <th style={{ width: "60px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleProcessingList.map((item) => (
              <tr
                key={item.id}
                className="sep-sorting-record-row"
                onClick={() => openSortingRecordsModal(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openSortingRecordsModal(item);
                  }
                }}
                title="Open sorting record details"
              >
                <td className="sep-primary-cell">{item.customerName}</td>
                <td>{item.contact}</td>
                <td>{item.color}</td>
                <td>{formatDateTime(item.receiveDateTime)}</td>
                <td className="sep-primary-cell">{item.workerName}</td>
                <td className="sep-num sep-blue-cell">
                  {item.assignWeight.toFixed(3)}
                </td>
                <td
                  className={`sep-num ${item.lostWeight > 0 ? "sep-loss-cell" : ""}`}
                >
                  {item.lostWeight.toFixed(3)}
                </td>
                <td>{formatDateTime(item.createdAt)}</td>
                <td
                  style={{ textAlign: "center" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {hasPermission("SemiExport.Delete") && (
                    <button
                      className="sep-delete-btn"
                      title="Delete processing record"
                      onClick={(e) => handleDeleteProcessing(e, item.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderHistoryTable = () => {
    if (historyLoading) {
      return <div className="sep-empty-state">Loading sorting history...</div>;
    }

    if (sortingHistory.length === 0) {
      return (
        <div className="sep-empty-state">
          <Package size={40} />
          <p>No sorting history found</p>
        </div>
      );
    }

    return (
      <>
        {/* History Filters */}
        <div className="sep-table-controls">
          <div className="sep-search-box">
            <Search className="sep-input-icon" size={16} />
            <input
              type="text"
              className="sep-search-control"
              placeholder="Search customer, color, worker..."
              value={historySearchTerm}
              onChange={(e) => setHistorySearchTerm(e.target.value)}
            />
          </div>
          <div className="sep-date-filter">
            <div className="sep-date-field">
              <span className="sep-date-label">From</span>
              <input
                type="date"
                className="sep-date-input"
                value={historyFromDate}
                onChange={(e) => setHistoryFromDate(e.target.value)}
              />
            </div>
            <div className="sep-date-field">
              <span className="sep-date-label">To</span>
              <input
                type="date"
                className="sep-date-input"
                value={historyToDate}
                onChange={(e) => setHistoryToDate(e.target.value)}
              />
            </div>
            {(historyFromDate || historyToDate) && (
              <button
                className="sep-date-clear-btn"
                onClick={() => {
                  setHistoryFromDate("");
                  setHistoryToDate("");
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="table-responsive sep-table-wrap">
          <table className="sep-data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Color</th>
                <th>Worker</th>
                <th>Receive DateTime</th>
                <th className="sep-num">Total weight</th>
                <th className="sep-num">Assign weight</th>
                <th className="sep-num">Lost weight</th>
                <th className="sep-num">Sorting Lost weight</th>
                <th className="sep-num">Worker fees</th>
                <th className="sep-num">Rate</th>
                <th>Saved Date</th>
                <th style={{ width: "60px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSortingHistory.map((record) => (
                <tr
                  key={record.id}
                  className="sep-sorting-record-row"
                  onClick={() => openHistoryModal(record)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openHistoryModal(record);
                    }
                  }}
                  title="Open sorting history details"
                >
                  <td className="sep-primary-cell">{record.customerName}</td>
                  <td>{record.contact}</td>
                  <td>{record.color}</td>
                  <td className="sep-primary-cell">
                    {record.workerName || "---"}
                  </td>
                  <td>{formatDateTime(record.receiveDateTime)}</td>
                  <td className="sep-num sep-blue-cell">
                    {getHistoryTotalWeight(record).toFixed(3)}
                  </td>
                  <td className="sep-num">{record.assignWeight.toFixed(3)}</td>
                  <td
                    className={`sep-num ${record.lostWeight > 0 ? "sep-loss-cell" : ""}`}
                  >
                    {record.lostWeight.toFixed(3)}
                  </td>
                  <td
                    className={`sep-num ${getHistorySortingLostWeight(record) > 0 ? "sep-loss-cell" : ""}`}
                  >
                    {getHistorySortingLostWeight(record).toFixed(3)}
                  </td>
                  <td className="sep-num">
                    {(record.workerFees || 0).toLocaleString()}
                  </td>
                  <td className="sep-num">
                    {record.exchangeRateRate.toLocaleString()}
                  </td>
                  <td>{formatDateTime(record.createdAt)}</td>
                  <td
                    style={{ textAlign: "center" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {hasPermission("SemiExport.Delete") && (
                      <button
                        className="sep-delete-btn"
                        title="Delete sorting history record"
                        onClick={(e) => handleDeleteHistory(e, record.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  return (
    <div className="sep-container fade-in">
      {/* Hero Header */}
      <div className="sep-hero">
        <div className="sep-hero-left">
          <div className="sep-hero-icon">
            <Sparkles size={30} strokeWidth={1.8} />
          </div>
          <div className="sep-hero-text">
            <h1>Semi Export Purchase</h1>
            <p>
              Track semi-export purchase orders, pricing, and supplier records
            </p>
          </div>
        </div>
        <div className="sep-hero-right">
          <div className="sep-stat-pill">
            <span className="stat-num">{purchases.length}</span>
            <span className="stat-label">
              {purchases.length === 1 ? "Order" : "Orders"}
            </span>
          </div>
        </div>
      </div>
      <div className="sep-layout">
        {/* Left Sidebar */}
        <aside className="rf-sidebar">
          <div className="rf-sidebar-header">
            <Package size={18} />
            <span>Purchase Orders</span>
          </div>
          <div style={{ padding: "16px" }}>
            {hasPermission("SemiExport.Create") && (
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                <FilePlus size={18} />
                Purchase
              </button>
            )}
          </div>

          {/* Purchase Orders List */}
          <div className="rf-card-list">
            {loading ? (
              <div className="rf-empty-sidebar">Loading...</div>
            ) : availablePurchases.length === 0 ? (
              <div className="rf-empty-sidebar">No purchase orders yet</div>
            ) : (
              availablePurchases.map((purchase) => (
                <div key={purchase.id} className="rf-bag-card">
                  {/* Card Top */}
                  <div className="rf-card-top">
                    <div className="rf-card-info">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span className="rf-card-marker">
                          {purchase.customerName}
                        </span>
                        <span
                          className="rf-card-warehouse"
                          style={{ marginTop: "2px" }}
                        >
                          {purchase.contact || "---"}
                        </span>
                      </div>
                    </div>
                    {hasPermission("SemiExport.Create") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(purchase.id);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="rf-stats-row">
                    <div className="rf-stat">
                      <span className="rf-stat-label">Weight</span>
                      <span className="rf-stat-value rf-stat-blue">
                        {purchase.totalReceiveWeight.toFixed(3)}{" "}
                        <span className="rf-stat-unit">viss</span>
                      </span>
                    </div>
                    <div className="rf-stat rf-stat-right">
                      <span className="rf-stat-label">Color</span>
                      <span className="rf-stat-value">{purchase.color}</span>
                    </div>
                  </div>

                  {/* Date Info */}
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#94a3b8",
                      marginBottom: "10px",
                    }}
                  >
                    Receive DateTime :{" "}
                    {formatDateTime(purchase.receiveDateTime)}
                  </div>

                  {/* Assign Weight + Lost Weight */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div className="sep-input-group">
                      <div className="sep-input-wrapper">
                        <label className="sep-input-label">Weight</label>
                        <input
                          type="number"
                          className="sep-input-field"
                          step="0.001"
                          min="0"
                          max={purchase.totalReceiveWeight}
                          value={assignWeights[purchase.id] ?? ""}
                          placeholder="0.000"
                          onChange={(e) =>
                            setAssignWeights((prev) => ({
                              ...prev,
                              [purchase.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          className="sep-max-btn"
                          onClick={() =>
                            setAssignWeights((prev) => ({
                              ...prev,
                              [purchase.id]:
                                purchase.totalReceiveWeight.toString(),
                            }))
                          }
                          title="Fill max weight"
                          style={{ height: "38px" }}
                        >
                          Max
                        </button>
                      </div>
                    </div>

                    <div className="sep-input-group">
                      <div className="sep-input-wrapper">
                        <label className="sep-input-label">Lost</label>
                        <input
                          type="text"
                          className={`sep-input-field ${getLostWeight(purchase) > 0 ? "has-loss" : ""}`}
                          readOnly
                          value={getLostWeight(purchase).toFixed(3)}
                          style={{ textAlign: "right" }}
                        />
                      </div>
                    </div>

                    <div className="sep-input-group">
                      <div className="sep-input-wrapper">
                        <label className="sep-input-label">Worker</label>
                        <select
                          className="sep-input-field"
                          value={selectedWorkers[purchase.id] ?? ""}
                          onChange={(e) =>
                            setSelectedWorkers((prev) => ({
                              ...prev,
                              [purchase.id]: e.target.value,
                            }))
                          }
                          style={{
                            background: "white",
                            cursor: "pointer",
                          }}
                        >
                          <option value="">Choose a worker...</option>
                          {workers.map((worker) => (
                            <option key={worker.id} value={worker.id}>
                              {worker.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Assign Button */}
                  <button
                    className="rf-assign-btn"
                    onClick={async () => {
                      const assignVal = getAssignWeight(purchase.id);
                      const workerId = selectedWorkers[purchase.id];
                      if (assignVal <= 0) {
                        alert("Please assign a weight greater than 0");
                        return;
                      }
                      if (!workerId) {
                        alert("Please select a worker");
                        return;
                      }

                      try {
                        setSaving(true);
                        const lostVal = getLostWeight(purchase);
                        const result =
                          await semiExportPurchaseProcessingAPI.create({
                            semiExportPurchaseId: purchase.id,
                            workerId: parseInt(workerId),
                            assignWeight: assignVal,
                            lostWeight: lostVal,
                          });

                        setProcessingList((prev) => [result, ...prev]);

                        // Clear selection for this card
                        setAssignWeights((prev) => {
                          const next = { ...prev };
                          delete next[purchase.id];
                          return next;
                        });
                        setSelectedWorkers((prev) => {
                          const next = { ...prev };
                          delete next[purchase.id];
                          return next;
                        });
                      } catch (error) {
                        console.error("Failed to assign:", error);
                        alert("Failed to assign to sorting");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                    style={{ marginTop: "12px" }}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="rf-spin" size={16} /> Assigning...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Assign to Sorting
                      </>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Right Main Content */}
        <main className="rf-main">
          <div className="rf-main-card">
            <div className="rf-main-header">
              <div className="rf-header-left">
                <div className="rf-tab-group">
                  <button
                    type="button"
                    onClick={() => setActiveTab("processing")}
                    className={`rf-tab rf-tab-orange ${activeTab === "processing" ? "rf-tab-active" : ""}`}
                  >
                    <span className="rf-tab-title">Processing</span>
                    <span className="rf-tab-sub">
                      Semi export purchase processings
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("history")}
                    className={`rf-tab rf-tab-blue ${activeTab === "history" ? "rf-tab-active" : ""}`}
                  >
                    <span className="rf-tab-title">Sorting History</span>
                    <span className="rf-tab-sub">Saved purchase records</span>
                  </button>
                </div>
              </div>

              <div className="rf-header-right">
                <span className="rf-count-badge">
                  {activeTab === "processing"
                    ? `${visibleProcessingList.length} Processing`
                    : `${sortingHistory.length} Saved`}
                </span>
              </div>
            </div>

            <div className="rf-main-content">
              {activeTab === "processing"
                ? renderProcessingTable()
                : renderHistoryTable()}
            </div>
          </div>
        </main>
      </div>
      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "32px",
              width: "90%",
              maxWidth: "500px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                Create Purchase Order
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#0f172a",
                    marginBottom: "8px",
                  }}
                >
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="Enter customer name"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#0f172a",
                    marginBottom: "8px",
                  }}
                >
                  Contact
                </label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  placeholder="Enter contact number or email"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#0f172a",
                    marginBottom: "8px",
                  }}
                >
                  Total Receive Weight (viss)
                </label>
                <input
                  type="number"
                  name="totalReceiveWeight"
                  value={formData.totalReceiveWeight}
                  onChange={handleInputChange}
                  placeholder="0"
                  step="0.001"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#0f172a",
                    marginBottom: "8px",
                  }}
                >
                  Receive DateTime
                </label>
                <input
                  type="datetime-local"
                  name="receiveDateTime"
                  value={formData.receiveDateTime}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#0f172a",
                    marginBottom: "8px",
                  }}
                >
                  Color *
                </label>
                <select
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  {colorCategories.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "1.5px solid #e2e8f0",
                    background: "white",
                    color: "#0f172a",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    background: saving
                      ? "#cbd5e1"
                      : "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
                    color: "white",
                    fontWeight: "600",
                    cursor: saving ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showSortingRecordsModal && selectedSortingRecord && (
        <div
          className="sep-sorting-modal-overlay"
          onClick={closeSortingRecordsModal}
        >
          <div
            className="sep-sorting-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="sep-modal-topbar">
              <div className="sep-modal-topbar-left">
                <div className="sep-modal-topbar-icon">
                  <Sparkles size={20} />
                </div>
                <div>
                  <div className="sep-modal-topbar-title">Sorting Record</div>
                  <div className="sep-modal-topbar-subtitle">
                    {selectedSortingRecord.customerName} —{" "}
                    {selectedSortingRecord.color}
                  </div>
                </div>
              </div>
              <div className="sep-modal-topbar-right">
                <button
                  type="button"
                  className="sep-sorting-modal-close"
                  onClick={closeSortingRecordsModal}
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="sep-modal-body">
              <div className="sep-record-summary">
                <div className="sep-record-summary-main">
                  <span className="sep-record-eyebrow">Sorting Record</span>
                  <h3>{selectedSortingRecord.customerName}</h3>
                </div>
                <div className="sep-record-summary-grid">
                  <div>
                    <span>Contact</span>
                    <strong>{selectedSortingRecord.contact || "---"}</strong>
                  </div>
                  <div>
                    <span>Color</span>
                    <strong>{selectedSortingRecord.color || "---"}</strong>
                  </div>
                  <div>
                    <span>Receive DateTime</span>
                    <strong>
                      {formatDateTime(selectedSortingRecord.receiveDateTime)}
                    </strong>
                  </div>
                  <div>
                    <span>Assign Weight</span>
                    <strong>
                      {selectedSortingRecord.assignWeight.toFixed(3)} viss
                    </strong>
                  </div>
                  <div>
                    <span>Lost Weight</span>
                    <strong
                      className={
                        selectedSortingRecord.lostWeight > 0
                          ? "sep-record-loss"
                          : ""
                      }
                    >
                      {selectedSortingRecord.lostWeight.toFixed(3)} viss
                    </strong>
                  </div>
                </div>
              </div>

              <div className="sep-rate-panel">
                <label htmlFor="sep-worker-name">Worker:</label>
                <input
                  id="sep-worker-name"
                  type="text"
                  value={selectedSortingRecord.workerName || ""}
                  readOnly
                />
                <label htmlFor="sep-worker-fees">
                  Worker Fees: <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  id="sep-worker-fees"
                  type="number"
                  value={sortingWorkerFees}
                  placeholder="0"
                  onChange={(e) => setSortingWorkerFees(e.target.value)}
                  required
                />
                <label htmlFor="sep-sorting-rate">CNY to MMK Rate:</label>
                <input
                  id="sep-sorting-rate"
                  type="number"
                  value={sortingExchangeRate}
                  title="Active CNY to MMK rate from ExchangeRates"
                  onChange={(e) => setSortingExchangeRate(e.target.value)}
                />
                <span>MMK</span>
              </div>

              <section className="sep-size-section">
                <h3>Color Categories &amp; Sizes</h3>

                <div className="sep-size-card">
                  <div className="sep-size-table-wrap">
                    <table className="sep-size-table">
                      <thead>
                        <tr>
                          <th>SIZE</th>
                          <th>WEIGHT (VISS)</th>
                          <th>WEIGHT (Kg)</th>
                          <th>PRICE (CNY)</th>
                          <th className="sep-num">AMOUNT (CNY)</th>
                          <th className="sep-num sep-mmk-col">AMOUNT (MMK)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortingSizes.map((row) => {
                          const amountCny = getSortingAmount(row);
                          const amountMmk =
                            amountCny * (parseFloat(sortingExchangeRate) || 0);
                          const isSpecial = [
                            "Return",
                            "Spoilage",
                            "Lost",
                          ].includes(row.size);

                          return (
                            <tr key={row.size}>
                              <td
                                className={isSpecial ? "sep-special-size" : ""}
                              >
                                {formatSortingSize(row.size)}
                              </td>
                              <td>
                                <input
                                  type="number"
                                  step="0.001"
                                  placeholder="0"
                                  value={
                                    row.size === "Lost"
                                      ? getCalculatedSortingLostWeight().toFixed(
                                          3,
                                        )
                                      : row.weight
                                  }
                                  disabled={row.size === "Lost"}
                                  onChange={(e) =>
                                    updateSortingSize(
                                      row.size,
                                      "weight",
                                      e.target.value,
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  step="0.001"
                                  placeholder="0"
                                  value={
                                    row.size === "Lost"
                                      ? (
                                          getCalculatedSortingLostWeight() *
                                          1.633
                                        ).toFixed(3)
                                      : (
                                          (parseFloat(row.weight) || 0) * 1.633
                                        ).toFixed(3)
                                  }
                                  disabled={true}
                                />
                              </td>
                              <td>
                                {row.size !== "Lost" && (
                                  <input
                                    type="number"
                                    value={row.price}
                                    placeholder="0"
                                    onChange={(e) =>
                                      updateSortingSize(
                                        row.size,
                                        "price",
                                        e.target.value,
                                      )
                                    }
                                  />
                                )}
                              </td>
                              <td className="sep-num">
                                {row.size === "Lost"
                                  ? ""
                                  : (amountCny * 1.633).toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      },
                                    )}
                              </td>
                              <td className="sep-num sep-mmk-col">
                                {row.size === "Lost"
                                  ? ""
                                  : (amountMmk * 1.633).toLocaleString(
                                      undefined,
                                      {
                                        maximumFractionDigits: 0,
                                      },
                                    )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="sep-size-card-header">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        className="sep-save-print-btn"
                        onClick={handleSortingSaveAndPrint}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save and Print"}
                      </button>
                      <label className="sep-check-label">
                        <input
                          type="checkbox"
                          checked={showTotalAmount}
                          onChange={(e) => setShowTotalAmount(e.target.checked)}
                        />
                        Show Amount
                      </label>
                      <label className="sep-check-label">
                        <input
                          type="checkbox"
                          checked={showExchangeRate}
                          onChange={(e) =>
                            setShowExchangeRate(e.target.checked)
                          }
                        />
                        Show Exchange Rate
                      </label>
                      <label className="sep-check-label sep-company-label">
                        Company Name:
                        <input
                          type="text"
                          className="sep-company-input"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="King Panthera"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
      {showHistoryModal && selectedHistoryRecord && (
        <div className="sep-sorting-modal-overlay" onClick={closeHistoryModal}>
          <div
            className="sep-sorting-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="sep-modal-topbar">
              <div className="sep-modal-topbar-left">
                <div className="sep-modal-topbar-icon">
                  <Sparkles size={20} />
                </div>
                <div>
                  <div className="sep-modal-topbar-title">Sorting History</div>
                  <div className="sep-modal-topbar-subtitle">
                    {selectedHistoryRecord.customerName} —{" "}
                    {selectedHistoryRecord.color}
                  </div>
                </div>
              </div>
              <div className="sep-modal-topbar-right">
                <button
                  type="button"
                  className="sep-sorting-modal-close"
                  onClick={closeHistoryModal}
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="sep-modal-body">
              <div className="sep-record-summary">
                <div className="sep-record-summary-main">
                  <span className="sep-record-eyebrow">Sorting History</span>
                  <h3>{selectedHistoryRecord.customerName}</h3>
                </div>
                <div className="sep-record-summary-grid">
                  <div>
                    <span>Contact</span>
                    <strong>{selectedHistoryRecord.contact || "---"}</strong>
                  </div>
                  <div>
                    <span>Color</span>
                    <strong>{selectedHistoryRecord.color || "---"}</strong>
                  </div>
                  <div>
                    <span>Receive DateTime</span>
                    <strong>
                      {formatDateTime(selectedHistoryRecord.receiveDateTime)}
                    </strong>
                  </div>
                  <div>
                    <span>Assign Weight</span>
                    <strong>
                      {selectedHistoryRecord.assignWeight.toFixed(3)} viss
                    </strong>
                  </div>
                  <div>
                    <span>Lost Weight</span>
                    <strong
                      className={
                        selectedHistoryRecord.lostWeight > 0
                          ? "sep-record-loss"
                          : ""
                      }
                    >
                      {selectedHistoryRecord.lostWeight.toFixed(3)} viss
                    </strong>
                  </div>
                  <div>
                    <span>Sorting Lost Weight</span>
                    <strong
                      className={
                        getHistorySortingLostWeight(selectedHistoryRecord) > 0
                          ? "sep-record-loss"
                          : ""
                      }
                    >
                      {getHistorySortingLostWeight(
                        selectedHistoryRecord,
                      ).toFixed(3)}{" "}
                      viss
                    </strong>
                  </div>
                </div>
              </div>

              <div className="sep-rate-panel">
                <label>Worker:</label>
                <input
                  type="text"
                  value={selectedHistoryRecord.workerName || "---"}
                  readOnly
                />
                <label>Worker Fees:</label>
                <input
                  type="number"
                  value={selectedHistoryRecord.workerFees || 0}
                  readOnly
                />
                <label>CNY to MMK Rate:</label>
                <input
                  type="number"
                  value={selectedHistoryRecord.exchangeRateRate}
                  readOnly
                />
                <span>MMK</span>
              </div>

              <section className="sep-size-section">
                <h3>Color Categories &amp; Sizes</h3>

                <div className="sep-size-card">
                  <div className="sep-size-table-wrap">
                    <table className="sep-size-table">
                      <thead>
                        <tr>
                          <th>SIZE</th>
                          <th>WEIGHT (VISS)</th>
                          <th>PRICE (CNY)</th>
                          <th className="sep-num">AMOUNT (CNY)</th>
                          <th className="sep-num sep-mmk-col">AMOUNT (MMK)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getHistorySortingRows(selectedHistoryRecord).map(
                          (row) => {
                            const amountCny = getSortingAmount(row);
                            const amountMmk =
                              amountCny *
                              (selectedHistoryRecord.exchangeRateRate || 0);
                            const isSpecial = [
                              "Return",
                              "Spoilage",
                              "Lost",
                            ].includes(row.size);

                            return (
                              <tr key={row.size}>
                                <td
                                  className={
                                    isSpecial ? "sep-special-size" : ""
                                  }
                                >
                                  {formatSortingSize(row.size)}
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    value={row.weight}
                                    readOnly
                                  />
                                </td>
                                <td>
                                  {row.size !== "Lost" && (
                                    <input
                                      type="number"
                                      value={row.price}
                                      readOnly
                                    />
                                  )}
                                </td>
                                <td className="sep-num">
                                  {row.size === "Lost"
                                    ? ""
                                    : amountCny.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                </td>
                                <td className="sep-num sep-mmk-col">
                                  {row.size === "Lost"
                                    ? ""
                                    : amountMmk.toLocaleString(undefined, {
                                        maximumFractionDigits: 0,
                                      })}
                                </td>
                              </tr>
                            );
                          },
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="sep-size-card-header">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        className="sep-save-print-btn"
                        onClick={() =>
                          printSortingPurchasePdf(
                            selectedHistoryRecord,
                            getHistorySortingRows(selectedHistoryRecord),
                            selectedHistoryRecord.exchangeRateRate.toString(),
                            false,
                          )
                        }
                      >
                        Print
                      </button>
                      <label className="sep-check-label">
                        <input
                          type="checkbox"
                          checked={showTotalAmount}
                          onChange={(e) => setShowTotalAmount(e.target.checked)}
                        />
                        Show Amount
                      </label>
                      <label className="sep-check-label">
                        <input
                          type="checkbox"
                          checked={showExchangeRate}
                          onChange={(e) =>
                            setShowExchangeRate(e.target.checked)
                          }
                        />
                        Show Exchange Rate
                      </label>
                      <label className="sep-check-label sep-company-label">
                        Company Name:
                        <input
                          type="text"
                          className="sep-company-input"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="King Panthera"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
      ;
    </div>
  );
};

export default SemiExportPurchase;
