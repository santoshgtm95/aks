import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  ledgerAPI,
  singleDoubleDrawnAPI,
  semiExportAPI,
  exchangeRatesAPI,
  exportAPI,
} from "../../services/api";
import type {
  LedgerDto,
  SingleDoubleDrawnRecord,
  SemiExportRecord,
  ExchangeRate,
  Export,
  CreateExportDto,
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
  CheckSquare,
  Square,
  Coins,
  Scale,
  Tag,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";
import "./index.css";

const Sales6: React.FC = () => {
  const { hasPermission } = useAuth();
  const [ledgers, setLedgers] = useState<LedgerDto[]>([]);
  const [sddRecords, setSddRecords] = useState<SingleDoubleDrawnRecord[]>([]);
  const [savedExports, setSavedExports] = useState<SemiExportRecord[]>([]);
  const [allRates, setAllRates] = useState<ExchangeRate[]>([]);
  const [exports, setExports] = useState<Export[]>([]);
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [sellingInProgress, setSellingInProgress] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedLedgerId, setSelectedLedgerId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"colors" | "markers">("colors");
  const [activeTab, setActiveTab] = useState<"processing" | "history">(
    "processing",
  );
  const [expandedColors, setExpandedColors] = useState<Record<string, boolean>>(
    {},
  );

  // Helper: get the exchange rate (CNY→MMK) for a given sdd record id
  const getRateForRecord = (sddId: number): number => {
    const exportRec = savedExports.find(
      (x) => x.singleDoubleDrawnRecordId === sddId,
    );
    if (!exportRec?.exchangeRateId) return 1;
    const rateObj = allRates.find((r) => r.id === exportRec.exchangeRateId);
    return rateObj ? rateObj.rate : 1;
  };

  useEffect(() => {
    setSelectedColors(new Set());
    setSellingPrice("");
  }, [selectedLedgerId]);

  const toggleSelectColor = (colorName: string) => {
    setSelectedColors((prev) => {
      const next = new Set(prev);
      if (next.has(colorName)) {
        next.delete(colorName);
      } else {
        next.add(colorName);
      }
      return next;
    });
  };

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
      const [ledgerData, sddData, exportData, ratesData, exportRecordsData] =
        await Promise.all([
          ledgerAPI.getAll(),
          singleDoubleDrawnAPI.getAll(),
          semiExportAPI.getAll(),
          exchangeRatesAPI.getAll(),
          exportAPI.getAll(),
        ]);
      setLedgers(ledgerData);
      setSddRecords(sddData);
      setSavedExports(exportData);
      setAllRates(ratesData);
      setExports(exportRecordsData);
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
            "6": 0,
            "7": 0,
            "8": 0,
            "9": 0,
            "10": 0,
            "10B": 0,
            "12": 0,
            "14": 0,
            "16": 0,
            "18": 0,
            "20": 0,
            "22": 0,
            "24": 0,
            "26": 0,
            "28": 0,
            Bar: 0,
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

  const ledgerExchangeRateId = useMemo(() => {
    if (!selectedLedger) return null;
    const markerNames = selectedLedger.markers.map((m) => m.markerName);
    const ledgerRecords = sddRecords.filter((r) =>
      markerNames.includes(r.refinementRecordMarker || ""),
    );
    const exportRec = savedExports.find(
      (x) =>
        ledgerRecords.some((r) => r.id === x.singleDoubleDrawnRecordId) &&
        x.exchangeRateId,
    );
    return exportRec ? exportRec.exchangeRateId : null;
  }, [selectedLedger, sddRecords, savedExports]);

  const selectedTotals = useMemo(() => {
    let weight = 0;
    let amountCNY = 0;
    let amountMMK = 0;
    let workerFees = 0;

    if (!selectedLedger) return { weight, amountCNY, amountMMK, workerFees };

    const markerNames = selectedLedger.markers.map((m) => m.markerName);
    const ledgerRecords = sddRecords.filter((r) =>
      markerNames.includes(r.refinementRecordMarker || ""),
    );

    selectedColors.forEach((colorName) => {
      const colorRecords = ledgerRecords.filter(
        (r) => (r.refinementRecordCategory || "Unknown") === colorName,
      );

      colorRecords.forEach((r) => {
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
        weight += recordWeight;

        const recordAmt =
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
        amountCNY += recordAmt;

        const rate = getRateForRecord(r.id);
        amountMMK += recordAmt * rate;
      });

      const colorExports = savedExports.filter((x) =>
        colorRecords.some((r) => r.id === x.singleDoubleDrawnRecordId),
      );
      colorExports.forEach((x) => {
        workerFees += x.workerFees || 0;
      });
    });

    return { weight, amountCNY, amountMMK, workerFees };
  }, [selectedColors, selectedLedger, sddRecords, savedExports, allRates]);

  const ledgerStatusMap = useMemo(() => {
    const map: Record<number, boolean> = {};
    ledgers.forEach((l) => {
      const markerNames = l.markers.map((m) => m.markerName);
      const ledgerRecords = sddRecords.filter((r) =>
        markerNames.includes(r.refinementRecordMarker || ""),
      );
      if (ledgerRecords.length === 0) {
        map[l.id] = false;
        return;
      }
      const colors = new Set<string>();
      ledgerRecords.forEach((r) => {
        colors.add(r.refinementRecordCategory || "Unknown");
      });

      const ledgerExports = exports.filter((e) => e.ledgerId === l.id);
      const sold = new Set<string>();
      ledgerExports.forEach((e) => {
        const cols = e.selectedColors.split(",").map((c) => c.trim());
        cols.forEach((c) => {
          if (c) sold.add(c);
        });
      });

      map[l.id] =
        colors.size > 0 && Array.from(colors).every((c) => sold.has(c));
    });
    return map;
  }, [ledgers, sddRecords, exports]);

  const isLedgerFullySold = (ledgerId: number) => !!ledgerStatusMap[ledgerId];

  const soldColorsForLedger = useMemo(() => {
    if (!selectedLedgerId) return new Set<string>();
    const ledgerExports = exports.filter(
      (e) => e.ledgerId === selectedLedgerId,
    );
    const sold = new Set<string>();
    ledgerExports.forEach((e) => {
      const colors = e.selectedColors.split(",").map((c) => c.trim());
      colors.forEach((c) => {
        if (c) sold.add(c);
      });
    });
    return sold;
  }, [selectedLedgerId, exports]);

  const unsoldColors = useMemo(() => {
    return colorDetails.filter((c) => !soldColorsForLedger.has(c.colorName));
  }, [colorDetails, soldColorsForLedger]);

  const handleSelectAll = () => {
    const unsoldColorNames = unsoldColors.map((c) => c.colorName);
    const allSelected = unsoldColorNames.every((name) =>
      selectedColors.has(name),
    );
    if (allSelected) {
      setSelectedColors(new Set());
    } else {
      setSelectedColors(new Set(unsoldColorNames));
    }
  };

  const handleSellSelected = async () => {
    if (!selectedLedgerId) return;
    if (selectedColors.size === 0) {
      alert("Please select at least one color card to sell.");
      return;
    }
    const priceVal = parseFloat(sellingPrice);
    if (isNaN(priceVal) || priceVal <= 0) {
      alert("Please enter a valid selling price greater than 0.");
      return;
    }

    try {
      setSellingInProgress(true);

      const selectedColorNames = Array.from(selectedColors);
      const weight = selectedTotals.weight;
      const totalExportWeightViss = weight;
      const totalExportWeightKg = weight * 1.633;
      const amountCNY = selectedTotals.amountCNY;
      const amountMMK = selectedTotals.amountMMK;
      const workerFees = selectedTotals.workerFees;
      const grandTotalMMK = amountMMK + workerFees;

      const payload: CreateExportDto = {
        ledgerId: selectedLedgerId,
        date: new Date().toISOString(),
        selectedColors: selectedColorNames.join(", "),
        selectedWeight: weight,
        totalExportWeightViss,
        totalExportWeightKg,
        productAmountCNY: amountCNY,
        productAmountMMK: amountMMK,
        workerFees,
        grandTotalMMK,
        exchangeRateId: ledgerExchangeRateId,
        sellingPrice: priceVal,
      };

      await exportAPI.create(payload);
      await loadData();

      setSelectedColors(new Set());
      setSellingPrice("");

      alert("Export sale saved successfully!");
    } catch (error) {
      console.error("Failed to save export sale:", error);
      alert("Failed to save export sale. Please try again.");
    } finally {
      setSellingInProgress(false);
    }
  };

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

  const activeLedgers = useMemo(() => {
    return filteredLedgers.filter((l) => !isLedgerFullySold(l.id));
  }, [filteredLedgers, isLedgerFullySold]);


  const grandTotal = useMemo(() => {
    if (!selectedLedger)
      return { totalWeight: 0, totalAmountMMK: 0, totalWorkerFees: 0 };

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
      totalAmountMMK +=
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
          ? recordAmt * rate
          : 0;

      totalWeight +=
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
      <div
        className="rf-container"
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="rf-container fade-in">
      <aside className="rf-sidebar">
        <div className="rf-sidebar-header">
          <ClipboardList size={18} />
          <span>Export Ledger</span>
        </div>

        <div className="rf-search-box">
          <Search size={16} className="rf-search-icon" />
          <input
            type="text"
            className="rf-search-input"
            placeholder="Search ledger or marker..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="rf-card-list">
          {activeLedgers.length === 0 ? (
            <div className="rf-empty-sidebar">No ledgers found</div>
          ) : (
            <div className="sidebar-section">
              <div className="sidebar-section-header">Active Ledgers</div>
              {activeLedgers.map((ledger) => (
                <div
                  key={ledger.id}
                  className={`product-card ${selectedLedgerId === ledger.id ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedLedgerId(ledger.id);
                    setActiveTab("processing");
                  }}
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
              ))}
            </div>
          )}
        </div>
      </aside>

      <main className="rf-main">
        <div className="rf-main-card">
          <div className="rf-main-header">
            <div className="rf-header-left">
              <div className="rf-tab-group" style={{ marginLeft: "24px" }}>
                <button
                  className={`rf-tab ${activeTab === "processing" ? "rf-tab-active" : ""}`}
                  onClick={() => setActiveTab("processing")}
                >
                  <span className="rf-tab-title">Processing</span>
                  <span className="rf-tab-sub">Sell &amp; Export Colors</span>
                </button>
                <button
                  className={`rf-tab ${activeTab === "history" ? "rf-tab-active" : ""}`}
                  onClick={() => setActiveTab("history")}
                >
                  <span className="rf-tab-title">History</span>
                  <span className="rf-tab-sub">
                    {selectedLedger ? "Ledger History" : "Global History"}
                  </span>
                </button>
              </div>
            </div>

            <div className="rf-header-right">
              {selectedLedger && hasPermission("Ledger.Delete") && (
                <button
                  onClick={() => handleDeleteLedger(selectedLedger.id)}
                  className="btn btn-danger"
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Trash2 size={16} /> Delete Ledger
                </button>
              )}
            </div>
          </div>

          {activeTab === "processing" ? (
            selectedLedger ? (
              <>
                <div className="ledger-header">
                  <h2>{selectedLedger.ledgerName}</h2>
                  <div className="ledger-meta">
                    <div className="meta-item">
                      <Calendar size={16} />
                      <span>
                        {new Date(selectedLedger.date).toLocaleDateString()}
                      </span>
                    </div>
                    {selectedLedger.description && (
                      <div className="meta-item">
                        <FileText size={16} />
                        <span>{selectedLedger.description}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grand-total-bar">
                  <div className="grand-total-item">
                    <span className="grand-total-label">
                      Total Export Weight
                    </span>
                    <span className="grand-total-value">
                      {grandTotal.totalWeight.toFixed(3)}{" "}
                      <span className="grand-total-unit">viss</span>
                    </span>
                  </div>
                  <div className="grand-total-divider" />
                  <div className="grand-total-item">
                    <span className="grand-total-label">Product Amount</span>
                    <span className="grand-total-value">
                      {Math.round(grandTotal.totalAmountMMK).toLocaleString()}{" "}
                      <span className="grand-total-unit">MMK</span>
                    </span>
                  </div>
                  <div className="grand-total-divider" />
                  <div className="grand-total-item">
                    <span className="grand-total-label">Worker Fees</span>
                    <span className="grand-total-value">
                      {grandTotal.totalWorkerFees.toLocaleString()}{" "}
                      <span className="grand-total-unit">MMK</span>
                    </span>
                  </div>
                  <div className="grand-total-divider" />
                  <div className="grand-total-item highlight">
                    <span className="grand-total-label">GRAND TOTAL</span>
                    <span className="grand-total-value grand">
                      {Math.round(
                        grandTotal.totalAmountMMK + grandTotal.totalWorkerFees,
                      ).toLocaleString()}{" "}
                      <span className="grand-total-unit">MMK</span>
                    </span>
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
                  <div>
                    <div className="section-title-wrapper">
                      <h3>Available Colors</h3>
                      {unsoldColors.length > 0 && (
                        <button
                          onClick={handleSelectAll}
                          className="btn-select-all"
                        >
                          {unsoldColors.every((c) =>
                            selectedColors.has(c.colorName),
                          )
                            ? "Deselect All"
                            : "Select All"}
                        </button>
                      )}
                    </div>

                    {unsoldColors.length === 0 ? (
                      <div className="all-sold-message">
                        All colors in this ledger have been sold.
                      </div>
                    ) : (
                      <div className="colors-grid">
                        {unsoldColors.map((color) => {
                          const isSelected = selectedColors.has(
                            color.colorName,
                          );
                          return (
                            <div
                              key={color.colorName}
                              className={`color-detail-card selectable-card ${isSelected ? "selected" : ""}`}
                              onClick={() => toggleSelectColor(color.colorName)}
                            >
                              <div className="color-header">
                                <div className="color-title-wrap">
                                  <div className="checkbox-wrapper">
                                    {isSelected ? (
                                      <CheckSquare
                                        size={18}
                                        className="checkbox-icon checked"
                                      />
                                    ) : (
                                      <Square
                                        size={18}
                                        className="checkbox-icon"
                                      />
                                    )}
                                  </div>
                                  <span
                                    className={`color-badge-dot ${color.colorName.toLowerCase().replace(/\s+/g, "-")}`}
                                  ></span>
                                  <span className="color-name">
                                    {color.colorName}
                                  </span>
                                  <span className="color-header-markers">
                                    ({color.markers.join(", ") || "None"})
                                  </span>
                                </div>
                                <span className="color-badge weight-badge">
                                  {color.totalWeight.toFixed(3)} viss
                                </span>
                              </div>

                              <div
                                className="sizes-section"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="sizes-toggle-btn"
                                  onClick={() =>
                                    toggleColorExpanded(color.colorName)
                                  }
                                >
                                  <span className="sizes-toggle-label">
                                    Size Breakdown{" "}
                                    <span className="active-sizes-badge">
                                      (
                                      {
                                        Object.values(color.sizes).filter(
                                          (w) => w > 0,
                                        ).length
                                      }{" "}
                                      Active)
                                    </span>
                                  </span>
                                  {expandedColors[color.colorName] ? (
                                    <ChevronUp size={16} />
                                  ) : (
                                    <ChevronDown size={16} />
                                  )}
                                </button>

                                {expandedColors[color.colorName] && (
                                  <div className="sizes-grid fade-in">
                                    {Object.entries(color.sizes).map(
                                      ([sizeKey, weight]) => {
                                        if (weight === 0) return null;
                                        return (
                                          <div
                                            key={sizeKey}
                                            className="size-badge"
                                          >
                                            <span className="size-name">
                                              {sizeKey}
                                            </span>
                                            <span className="size-val">
                                              {weight.toFixed(3)}
                                            </span>
                                          </div>
                                        );
                                      },
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {unsoldColors.length > 0 && (
                      <div className="sell-panel-container">
                        <div className="sell-panel-header">
                          <Coins size={18} className="sell-header-icon" />
                          <span>Sell Selected Colors</span>
                        </div>
                        <div className="sell-panel-body">
                          <div className="sell-panel-inputs">
                            <div className="price-input-group">
                              <label htmlFor="sellingPrice">
                                Selling Price (MMK)
                              </label>
                              <div className="price-input-wrapper">
                                <span className="currency-prefix">MMK</span>
                                <input
                                  type="number"
                                  id="sellingPrice"
                                  placeholder="Enter selling price..."
                                  value={sellingPrice}
                                  onChange={(e) =>
                                    setSellingPrice(e.target.value)
                                  }
                                  disabled={sellingInProgress}
                                />
                              </div>
                            </div>
                            <button
                              onClick={handleSellSelected}
                              className="btn-sell"
                              disabled={
                                sellingInProgress || selectedColors.size === 0
                              }
                            >
                              {sellingInProgress
                                ? "Saving..."
                                : "Sell Selected"}
                            </button>
                          </div>

                          {selectedColors.size === 0 ? (
                            <div className="sell-panel-placeholder">
                              <Info size={20} className="placeholder-icon" />
                              <span>
                                Select colors from the list above to view
                                selling price calculations and potential
                                P&amp;L.
                              </span>
                            </div>
                          ) : (
                            <div className="sell-summary-grid">
                              <div className="summary-box colors-pill-box">
                                <div className="summary-hdr">
                                  <Tag size={13} className="summary-icon" />
                                  <span className="summary-lbl">
                                    Selected Colors
                                  </span>
                                </div>
                                <div className="summary-colors-pills">
                                  {Array.from(selectedColors).map((col) => (
                                    <span key={col} className="color-pill-tag">
                                      {col}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="summary-box">
                                <div className="summary-hdr">
                                  <Scale size={13} className="summary-icon" />
                                  <span className="summary-lbl">
                                    Selected Weight
                                  </span>
                                </div>
                                <span className="summary-val">
                                  {selectedTotals.weight.toFixed(3)}{" "}
                                  <span className="val-unit">viss</span>
                                </span>
                              </div>
                              <div className="summary-box">
                                <div className="summary-hdr">
                                  <Scale size={13} className="summary-icon" />
                                  <span className="summary-lbl">
                                    Total Export Weight
                                  </span>
                                </div>
                                <span className="summary-val">
                                  {(selectedTotals.weight * 1.633).toFixed(3)}{" "}
                                  <span className="val-unit">kg</span>
                                </span>
                              </div>
                              <div className="summary-box">
                                <div className="summary-hdr">
                                  <Coins size={13} className="summary-icon" />
                                  <span className="summary-lbl">
                                    Product Amount (CNY)
                                  </span>
                                </div>
                                <span className="summary-val">
                                  ¥{selectedTotals.amountCNY.toLocaleString()}
                                </span>
                              </div>
                              <div className="summary-box">
                                <div className="summary-hdr">
                                  <Coins size={13} className="summary-icon" />
                                  <span className="summary-lbl">
                                    Product Amount (MMK)
                                  </span>
                                </div>
                                <span className="summary-val">
                                  {Math.round(
                                    selectedTotals.amountMMK,
                                  ).toLocaleString()}{" "}
                                  <span className="val-unit">MMK</span>
                                </span>
                              </div>
                              <div className="summary-box">
                                <div className="summary-hdr">
                                  <Coins size={13} className="summary-icon" />
                                  <span className="summary-lbl">
                                    Worker Fees
                                  </span>
                                </div>
                                <span className="summary-val">
                                  {selectedTotals.workerFees.toLocaleString()}{" "}
                                  <span className="val-unit">MMK</span>
                                </span>
                              </div>
                              <div className="summary-box highlight">
                                <div className="summary-hdr">
                                  <Coins size={13} className="summary-icon" />
                                  <span className="summary-lbl">
                                    Grand Total
                                  </span>
                                </div>
                                <span className="summary-val">
                                  {Math.round(
                                    selectedTotals.amountMMK +
                                      selectedTotals.workerFees,
                                  ).toLocaleString()}{" "}
                                  <span className="val-unit">MMK</span>
                                </span>
                              </div>
                              {(() => {
                                const sp = parseFloat(sellingPrice);
                                const gt =
                                  selectedTotals.amountMMK +
                                  selectedTotals.workerFees;
                                if (isNaN(sp) || sp <= 0) return null;
                                const pnl = sp - gt;
                                const isProfit = pnl >= 0;
                                return (
                                  <div
                                    className={`summary-box pnl-box ${isProfit ? "pnl-profit" : "pnl-loss"}`}
                                  >
                                    <div className="summary-hdr">
                                      {isProfit ? (
                                        <TrendingUp
                                          size={13}
                                          className="summary-icon"
                                        />
                                      ) : (
                                        <TrendingDown
                                          size={13}
                                          className="summary-icon"
                                        />
                                      )}
                                      <span className="summary-lbl">
                                        P&amp;L
                                      </span>
                                    </div>
                                    <span className="summary-val">
                                      {isProfit ? "+" : ""}
                                      {Math.round(pnl).toLocaleString()}{" "}
                                      <span className="val-unit">MMK</span>
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="markers-grid">
                    {selectedLedger.markers.map((m) => {
                      const details = getMarkerDetails(m.markerName);
                      return (
                        <div key={m.markerName} className="marker-detail-card">
                          <div className="marker-header">
                            <span className="marker-name">
                              {details.markerName}
                            </span>
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
                                  details.totalReturnWeight +
                                  details.totalLostWeight
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
              </>
            ) : (
              <div className="empty-state">
                <ClipboardList size={64} color="#cbd5e1" />
                <h3>Select a Ledger</h3>
                <p>
                  Choose an export ledger from the sidebar to view detailed
                  marker reports and sell colors.
                </p>
              </div>
            )
          ) : (
            /* History Tab */
            <div className="ledger-history-tab">
              {(() => {
                const filteredExports = selectedLedger
                  ? exports.filter((e) => e.ledgerId === selectedLedger.id)
                  : exports;

                if (filteredExports.length === 0) {
                  return (
                    <div
                      className="rf-empty-row"
                      style={{ padding: "64px 20px" }}
                    >
                      <ClipboardList
                        size={44}
                        className="rf-empty-icon"
                        style={{
                          opacity: 0.2,
                          margin: "0 auto 12px",
                          display: "block",
                        }}
                      />
                      <span>No sold colors history found</span>
                    </div>
                  );
                }

                return (
                  <div className="rf-table-wrap">
                    <table className="rf-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          {!selectedLedger && <th>Ledger</th>}
                          <th>Colors Sold</th>
                          <th>Selling Price</th>
                          <th>Weight (viss)</th>
                          <th>Weight (kg)</th>
                          <th>Product Amt (CNY)</th>
                          <th>Product Amt (MMK)</th>
                          <th>Worker Fees</th>
                          <th>Grand Total</th>
                          <th>P&amp;L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExports.map((sale) => {
                          const saleLedger = ledgers.find(
                            (l) => l.id === sale.ledgerId,
                          );
                          return (
                            <tr key={sale.id}>
                              <td className="rf-td-date">
                                {new Date(sale.date).toLocaleDateString()}
                              </td>
                              {!selectedLedger && (
                                <td
                                  style={{ fontWeight: 700, color: "#2563eb" }}
                                >
                                  {saleLedger
                                    ? saleLedger.ledgerName
                                    : `Ledger #${sale.ledgerId}`}
                                </td>
                              )}
                              <td>
                                <div className="history-colors-list">
                                  {sale.selectedColors
                                    .split(", ")
                                    .map((col) => (
                                      <span
                                        key={col}
                                        className="history-color-tag"
                                      >
                                        {col}
                                      </span>
                                    ))}
                                </div>
                              </td>
                              <td className="font-numeric">
                                {sale.sellingPrice.toLocaleString()} MMK
                              </td>
                              <td className="font-numeric">
                                {sale.selectedWeight.toFixed(3)}
                              </td>
                              <td className="font-numeric">
                                {sale.totalExportWeightKg.toFixed(3)}
                              </td>
                              <td className="font-numeric">
                                ¥{sale.productAmountCNY.toLocaleString()}
                              </td>
                              <td className="font-numeric">
                                {Math.round(
                                  sale.productAmountMMK,
                                ).toLocaleString()}{" "}
                                MMK
                              </td>
                              <td className="font-numeric">
                                {sale.workerFees.toLocaleString()} MMK
                              </td>
                              <td className="font-numeric highlight-td">
                                {Math.round(
                                  sale.grandTotalMMK,
                                ).toLocaleString()}{" "}
                                MMK
                              </td>
                              <td
                                className={`font-numeric ${sale.sellingPrice - sale.grandTotalMMK >= 0 ? "pnl-profit-td" : "pnl-loss-td"}`}
                              >
                                {sale.sellingPrice - sale.grandTotalMMK >= 0
                                  ? "+"
                                  : ""}
                                {Math.round(
                                  sale.sellingPrice - sale.grandTotalMMK,
                                ).toLocaleString()}{" "}
                                MMK
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Sales6;
