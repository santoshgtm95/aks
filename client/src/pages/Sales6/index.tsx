import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLongPoll } from "../../hooks/useLongPoll";
import {
  ledgerAPI,
  singleDoubleDrawnAPI,
  semiExportAPI,
  semiExportPurchaseRecordsAPI,
  exchangeRatesAPI,
  exportAPI,
  importedSemiExportAPI,
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
  CheckCircle,
  AlertCircle,
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
  X,
} from "lucide-react";
import "./index.css";

interface SemiExportPurchaseRecordSize {
  size: string;
  weight: number;
  price: number;
}

interface SemiExportPurchaseRecord {
  id: number;
  color: string;
  workerFees: number;
  WorkerFees?: number;
  exchangeRateRate: number;
  sizes: SemiExportPurchaseRecordSize[];
  createdAt: string;
}

const sizeOptions = [
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
  "10B",
  "10",
  "9",
  "8",
  "7",
  "6",
];

const emptySizeMap = () =>
  ({
    "6": { weight: 0, price: 0 },
    "7": { weight: 0, price: 0 },
    "8": { weight: 0, price: 0 },
    "9": { weight: 0, price: 0 },
    "10": { weight: 0, price: 0 },
    "10B": { weight: 0, price: 0 },
    "12": { weight: 0, price: 0 },
    "14": { weight: 0, price: 0 },
    "16": { weight: 0, price: 0 },
    "18": { weight: 0, price: 0 },
    "20": { weight: 0, price: 0 },
    "22": { weight: 0, price: 0 },
    "24": { weight: 0, price: 0 },
    "26": { weight: 0, price: 0 },
    "28": { weight: 0, price: 0 },
    Bar: { weight: 0, price: 0 },
    Return: { weight: 0, price: 0 },
    Spoilage: { weight: 0, price: 0 },
    Lost: { weight: 0, price: 0 },
  }) as Record<string, { weight: number; price: number }>;

const Sales6: React.FC = () => {
  const { hasPermission } = useAuth();
  const [ledgers, setLedgers] = useState<LedgerDto[]>([]);
  const [sddRecords, setSddRecords] = useState<SingleDoubleDrawnRecord[]>([]);
  const [purchaseRecords, setPurchaseRecords] = useState<
    SemiExportPurchaseRecord[]
  >([]);
  const [importedData, setImportedData] = useState<any[]>([]);
  const [savedExports, setSavedExports] = useState<SemiExportRecord[]>([]);
  const [allRates, setAllRates] = useState<ExchangeRate[]>([]);
  const [exports, setExports] = useState<Export[]>([]);
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [sizeSellingPrices, setSizeSellingPrices] = useState<
    Record<string, Record<string, any>>
  >({});
  const [sellingInProgress, setSellingInProgress] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedLedgerId, setSelectedLedgerId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"processing" | "history">(
    "processing",
  );
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historyFromDate, setHistoryFromDate] = useState("");
  const [historyToDate, setHistoryToDate] = useState("");
  const [expandedColors, setExpandedColors] = useState<Record<string, boolean>>(
    {},
  );
  const [selectedHistory, setSelectedHistory] = useState<Export | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Helper: get the exchange rate (CNY→MMK) for a given sdd record id
  const getRateForRecord = (sddId: number): number => {
    const exportRec = savedExports.find(
      (x) => x.singleDoubleDrawnRecordId === sddId,
    );
    if (!exportRec?.exchangeRateId) return 1;
    const rateObj = allRates.find((r) => r.id === exportRec.exchangeRateId);
    return rateObj ? rateObj.rate : 1;
  };

  const getPurchaseMarkerName = (record: SemiExportPurchaseRecord) =>
    record.createdAt ? new Date(record.createdAt).toLocaleDateString() : "---";

  const getPurchaseRecordsForMarkers = (markerNames: string[]) =>
    purchaseRecords.filter((record) =>
      markerNames.includes(getPurchaseMarkerName(record)),
    );

  const getPurchaseRecordWorkerFees = (record: SemiExportPurchaseRecord) =>
    Number(record.workerFees ?? record.WorkerFees ?? 0) || 0;

  const getPurchaseSize = (
    record: SemiExportPurchaseRecord,
    sizeName: string,
  ) =>
    record.sizes.find(
      (size) => size.size.toLowerCase() === sizeName.toLowerCase(),
    );

  const getPurchaseRecordWeight = (record: SemiExportPurchaseRecord) =>
    record.sizes
      .filter((size) => size.size !== "Lost")
      .reduce((sum, size) => sum + (Number(size.weight) || 0), 0);

  const getPurchaseRecordAmountCNY = (record: SemiExportPurchaseRecord) =>
    record.sizes
      .filter((size) => size.size !== "Lost")
      .reduce(
        (sum, size) =>
          sum + (Number(size.weight) || 0) * (Number(size.price) || 0),
        0,
      );

  const getPurchaseRecordRate = (record: SemiExportPurchaseRecord) =>
    Number(record.exchangeRateRate) || 1;

  useEffect(() => {
    setSelectedColors(new Set());
    setSizeSellingPrices({});
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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        ledgerData,
        sddData,
        exportData,
        ratesData,
        exportRecordsData,
        importedDataRes,
        purchaseRecordsData,
      ] = await Promise.all([
        ledgerAPI.getAll(),
        singleDoubleDrawnAPI.getAll(),
        semiExportAPI.getAll(),
        exchangeRatesAPI.getAll(),
        exportAPI.getAll(),
        importedSemiExportAPI.getAll(),
        semiExportPurchaseRecordsAPI.getAll(),
      ]);
      setLedgers(ledgerData);
      setSddRecords(sddData);
      setPurchaseRecords(purchaseRecordsData);
      setSavedExports(exportData);
      setImportedData(importedDataRes);
      setAllRates(ratesData);
      setExports(exportRecordsData);
    } catch (error) {
      console.error("Failed to load export data:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  useLongPoll(loadData);

  const selectedLedger = useMemo(() => {
    return ledgers.find((l) => l.id === selectedLedgerId) || null;
  }, [ledgers, selectedLedgerId]);

  const colorDetails = useMemo(() => {
    if (!selectedLedger) return [];

    const markerNames = selectedLedger.markers.map((m) => m.markerName);
    const ledgerRecords = sddRecords.filter((r) =>
      markerNames.includes(r.refinementRecordMarker || ""),
    );
    const ledgerPurchaseRecords = getPurchaseRecordsForMarkers(markerNames);

    const groups: Record<
      string,
      {
        colorName: string;
        recordsCount: number;
        totalWeight: number;
        sizes: Record<string, { weight: number; price: number }>;
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
          sizes: emptySizeMap(),
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

      g.sizes["6"].weight += r.size6 || 0;
      g.sizes["7"].weight += r.size7 || 0;
      g.sizes["8"].weight += r.size8 || 0;
      g.sizes["9"].weight += r.size9 || 0;
      g.sizes["10"].weight += r.size10 || 0;
      g.sizes["10B"].weight += r.size10B || 0;
      g.sizes["12"].weight += r.size12 || 0;
      g.sizes["14"].weight += r.size14 || 0;
      g.sizes["16"].weight += r.size16 || 0;
      g.sizes["18"].weight += r.size18 || 0;
      g.sizes["20"].weight += r.size20 || 0;
      g.sizes["22"].weight += r.size22 || 0;
      g.sizes["24"].weight += r.size24 || 0;
      g.sizes["26"].weight += r.size26 || 0;
      g.sizes["28"].weight += r.size28 || 0;
      g.sizes["Bar"].weight += r.sizeBar || 0;

      if (r.price6) g.sizes["6"].price = r.price6;
      if (r.price7) g.sizes["7"].price = r.price7;
      if (r.price8) g.sizes["8"].price = r.price8;
      if (r.price9) g.sizes["9"].price = r.price9;
      if (r.price10) g.sizes["10"].price = r.price10;
      if (r.price10B) g.sizes["10B"].price = r.price10B;
      if (r.price12) g.sizes["12"].price = r.price12;
      if (r.price14) g.sizes["14"].price = r.price14;
      if (r.price16) g.sizes["16"].price = r.price16;
      if (r.price18) g.sizes["18"].price = r.price18;
      if (r.price20) g.sizes["20"].price = r.price20;
      if (r.price22) g.sizes["22"].price = r.price22;
      if (r.price24) g.sizes["24"].price = r.price24;
      if (r.price26) g.sizes["26"].price = r.price26;
      if (r.price28) g.sizes["28"].price = r.price28;
      if (r.priceBar) g.sizes["Bar"].price = r.priceBar;

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

    ledgerPurchaseRecords.forEach((record) => {
      const color = record.color || "Unknown";
      if (!groups[color]) {
        groups[color] = {
          colorName: color,
          recordsCount: 0,
          totalWeight: 0,
          sizes: emptySizeMap(),
          totalAmount: 0,
          totalWorkerFees: 0,
          markers: [],
        };
      }

      const g = groups[color];
      g.recordsCount += 1;
      g.totalWeight += getPurchaseRecordWeight(record);
      g.totalAmount += getPurchaseRecordAmountCNY(record);
      g.totalWorkerFees += getPurchaseRecordWorkerFees(record);

      const markerName = getPurchaseMarkerName(record);
      if (markerName && !g.markers.includes(markerName)) {
        g.markers.push(markerName);
      }

      [...sizeOptions, "Return", "Spoilage"].forEach((sizeName) => {
        const savedSize = getPurchaseSize(record, sizeName);
        if (!savedSize) return;

        const weight = Number(savedSize.weight) || 0;
        const price = Number(savedSize.price) || 0;
        g.sizes[sizeName].weight += weight;
        if (price) g.sizes[sizeName].price = price;
      });
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

    const ledgerImported = importedData.filter((i) =>
      markerNames.includes(i.markerName || ""),
    );

    ledgerImported.forEach((i) => {
      try {
        const parsed = JSON.parse(i.dataJson || "{}");
        const colors = Object.keys(parsed);
        colors.forEach((color) => {
          if (!groups[color]) {
            groups[color] = {
              colorName: color,
              recordsCount: 0,
              totalWeight: 0,
              sizes: {
                ...emptySizeMap(),
              },
              totalAmount: 0,
              totalWorkerFees: 0,
              markers: [],
            };
          }
          const g = groups[color];
          g.recordsCount += 1;
          if (i.markerName && !g.markers.includes(i.markerName)) {
            g.markers.push(i.markerName);
          }

          let recordWeight = 0;
          let recordAmount = 0;

          sizeOptions.forEach((size) => {
            const sData = parsed[color][size];
            if (sData) {
              const w = Number(sData.weight || 0);
              const p = Number(sData.price || 0);
              g.sizes[size].weight += w;
              if (p) g.sizes[size].price = p; // take the last price
              recordWeight += w;
              recordAmount += w * p;
            }
          });

          g.totalWeight += recordWeight;
          g.totalAmount += recordAmount;
        });
      } catch (e) {
        console.error("Error parsing imported data json:", e);
      }
    });

    return Object.values(groups);
  }, [selectedLedger, sddRecords, savedExports, importedData, purchaseRecords]);

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
    const ledgerPurchaseRecords = getPurchaseRecordsForMarkers(markerNames);

    selectedColors.forEach((colorName) => {
      const colorRecords = ledgerRecords.filter(
        (r) => (r.refinementRecordCategory || "Unknown") === colorName,
      );
      const colorPurchaseRecords = ledgerPurchaseRecords.filter(
        (record) => (record.color || "Unknown") === colorName,
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

      colorPurchaseRecords.forEach((record) => {
        const recordWeight = getPurchaseRecordWeight(record);
        const recordAmount = getPurchaseRecordAmountCNY(record);

        weight += recordWeight;
        amountCNY += recordAmount;
        amountMMK += recordAmount * getPurchaseRecordRate(record);
        workerFees += getPurchaseRecordWorkerFees(record);
      });

      // Handle imported data math
      const ledgerImported = importedData.filter((i) =>
        markerNames.includes(i.markerName || ""),
      );

      ledgerImported.forEach((i) => {
        try {
          const parsed = JSON.parse(i.dataJson || "{}");
          if (parsed[colorName]) {
            const sizes = parsed[colorName];
            const sizeOptions = [
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
              "10B",
              "10",
              "9",
              "8",
              "7",
              "6",
            ];
            sizeOptions.forEach((size) => {
              const sData = sizes[size];
              if (sData) {
                const w = Number(sData.weight || 0);
                const p = Number(sData.price || 0);
                weight += w;
                const amt = w * p;
                amountCNY += amt;
                if (amt > 0) {
                  let rate = 1;
                  if (ledgerExchangeRateId) {
                    const rateObj = allRates.find(
                      (r) => r.id === ledgerExchangeRateId,
                    );
                    if (rateObj) rate = rateObj.rate;
                  } else if (allRates.length > 0) {
                    const active = allRates.find((r) => r.activeStatus);
                    rate = active
                      ? active.rate
                      : allRates[allRates.length - 1].rate;
                  }
                  amountMMK += amt * rate;
                }
              }
            });
          }
        } catch (e) {
          console.error("Error parsing imported data json:", e);
        }
      });
    });

    return { weight, amountCNY, amountMMK, workerFees };
  }, [
    selectedColors,
    selectedLedger,
    sddRecords,
    savedExports,
    allRates,
    importedData,
    purchaseRecords,
    ledgerExchangeRateId,
  ]);

  const averageRate = useMemo(() => {
    if (selectedTotals.amountCNY > 0) {
      return selectedTotals.amountMMK / selectedTotals.amountCNY;
    }
    return 1;
  }, [selectedTotals]);

  const calculatedSellingPriceCNY = useMemo(() => {
    let total = 0;
    selectedColors.forEach((colorName) => {
      const colorDet = colorDetails.find((c) => c.colorName === colorName);
      if (!colorDet) return;
      Object.entries(colorDet.sizes).forEach(([sizeKey]) => {
        const sizeInput = sizeSellingPrices[colorName]?.[sizeKey];
        const inputWeight = sizeInput ? Number(sizeInput.weight) : 0;
        const inputPrice = sizeInput ? Number(sizeInput.price) : 0;
        if (
          !isNaN(inputWeight) &&
          !isNaN(inputPrice) &&
          inputWeight > 0 &&
          inputPrice > 0
        ) {
          total += inputWeight * inputPrice;
        }
      });
    });
    return total;
  }, [selectedColors, sizeSellingPrices, colorDetails]);

  const calculatedInputtedWeight = useMemo(() => {
    let totalWeight = 0;
    selectedColors.forEach((colorName) => {
      const colorDet = colorDetails.find((c) => c.colorName === colorName);
      if (!colorDet) return;
      Object.entries(colorDet.sizes).forEach(([sizeKey]) => {
        const sizeInput = sizeSellingPrices[colorName]?.[sizeKey];
        const inputWeight = sizeInput ? Number(sizeInput.weight) : 0;
        if (!isNaN(inputWeight) && inputWeight > 0) {
          totalWeight += inputWeight;
        }
      });
    });
    return totalWeight;
  }, [selectedColors, sizeSellingPrices, colorDetails]);

  const calculatedSellingPriceMMK = calculatedSellingPriceCNY * averageRate;

  const ledgerStatusMap = useMemo(() => {
    const map: Record<number, boolean> = {};
    ledgers.forEach((l) => {
      const markerNames = l.markers.map((m) => m.markerName);
      const ledgerRecords = sddRecords.filter((r) =>
        markerNames.includes(r.refinementRecordMarker || ""),
      );
      const ledgerPurchaseRecords = getPurchaseRecordsForMarkers(markerNames);
      const colors = new Set<string>();
      ledgerRecords.forEach((r) => {
        colors.add(r.refinementRecordCategory || "Unknown");
      });
      ledgerPurchaseRecords.forEach((record) => {
        colors.add(record.color || "Unknown");
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
  }, [ledgers, sddRecords, purchaseRecords, exports]);

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
      setErrorMessage("Please select at least one color card to sell.");
      setIsErrorModalOpen(true);
      return;
    }

    let missingInput = false;
    selectedColors.forEach((colorName) => {
      const colorDet = colorDetails.find((c) => c.colorName === colorName);
      if (colorDet) {
        Object.entries(colorDet.sizes).forEach(
          ([sizeKey, sizeData]: [string, any]) => {
            if (sizeData.weight > 0) {
              const sizeInput = sizeSellingPrices[colorName]?.[sizeKey];
              if (
                !sizeInput ||
                (sizeInput.weight as any) === "" ||
                (sizeInput.price as any) === "" ||
                sizeInput.weight === undefined ||
                sizeInput.price === undefined
              ) {
                missingInput = true;
              }
            }
          },
        );
      }
    });

    if (missingInput) {
      setErrorMessage(
        "Please fill in both Wgt (kg) and Price (¥) for all sizes of the selected colors.",
      );
      setIsErrorModalOpen(true);
      return;
    }

    if (calculatedInputtedWeight > selectedTotals.weight * 1.633 + 0.001) {
      setErrorMessage(
        "Total Inputted Weight must not be greater than Total Export Weight.",
      );
      setIsErrorModalOpen(true);
      return;
    }

    const priceVal = calculatedSellingPriceMMK;
    if (isNaN(priceVal) || priceVal <= 0) {
      setErrorMessage(
        "Please enter valid selling prices (CNY) in Size Breakdown for the selected colors.",
      );
      setIsErrorModalOpen(true);
      return;
    }

    try {
      setSellingInProgress(true);

      const selectedColorNames = Array.from(selectedColors);

      // Ensure all selected colors are included in the payload, even with 0 prices
      const fullSizeSellingPrices: Record<string, Record<string, any>> = {};
      selectedColorNames.forEach((colorName) => {
        fullSizeSellingPrices[colorName] = {};
        const colorDet = colorDetails.find((c) => c.colorName === colorName);
        if (colorDet) {
          Object.keys(colorDet.sizes).forEach((sizeKey) => {
            const val = sizeSellingPrices[colorName]?.[sizeKey];
            fullSizeSellingPrices[colorName][sizeKey] = val || {
              weight: "0",
              price: "0",
            };
          });
        }
      });

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
        sizeSellingPrices: JSON.stringify(fullSizeSellingPrices),
      };

      await exportAPI.create(payload);
      await loadData();

      setSelectedColors(new Set());
      setSizeSellingPrices({});

      setSuccessMessage("Export sale saved successfully!");
      setIsSuccessModalOpen(true);
    } catch (error) {
      console.error("Failed to save export sale:", error);
      setErrorMessage("Failed to save export sale. Please try again.");
      setIsErrorModalOpen(true);
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
    const ledgerPurchaseRecords = getPurchaseRecordsForMarkers(markerNames);

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
    });

    // Worker fees are already stored in MMK
    const ledgerExports = savedExports.filter((x) =>
      ledgerRecords.some((r) => r.id === x.singleDoubleDrawnRecordId),
    );
    ledgerExports.forEach((x) => {
      totalWorkerFees += x.workerFees || 0;
    });

    ledgerPurchaseRecords.forEach((record) => {
      const recordAmount = getPurchaseRecordAmountCNY(record);

      totalWeight += getPurchaseRecordWeight(record);
      totalAmountMMK += recordAmount * getPurchaseRecordRate(record);
      totalWorkerFees += getPurchaseRecordWorkerFees(record);
    });

    const ledgerImported = importedData.filter((i) =>
      markerNames.includes(i.markerName || ""),
    );

    ledgerImported.forEach((i) => {
      try {
        const parsed = JSON.parse(i.dataJson || "{}");
        const colors = Object.keys(parsed);
        colors.forEach((color) => {
          const sizes = parsed[color];
          Object.keys(sizes).forEach((size) => {
            const w = Number(sizes[size].weight || 0);
            const amt = Number(sizes[size].amount || 0); // amt is in CNY? Actually Semi Export shows AMOUNT (CNY)
            totalWeight += w;
            if (amt > 0) {
              // What rate to use? Since imported data doesn't have a linked rate directly,
              // we can use the ledgerExchangeRateId or activeRate, or just rate = 1 if none found
              // However, since imported are directly imported, they might not have native MMK amount yet.
              // We'll use ledgerExchangeRateId's rate or a fallback if available
              let rate = 1;
              if (ledgerExchangeRateId) {
                const rateObj = allRates.find(
                  (r) => r.id === ledgerExchangeRateId,
                );
                if (rateObj) rate = rateObj.rate;
              } else if (allRates.length > 0) {
                // if no ledger rate, use active or last rate
                const active = allRates.find((r) => r.activeStatus);
                rate = active
                  ? active.rate
                  : allRates[allRates.length - 1].rate;
              }
              totalAmountMMK += amt * rate;
            }
          });
        });
      } catch (e) {
        console.error("Error parsing imported data json:", e);
      }
    });

    return { totalWeight, totalAmountMMK, totalWorkerFees };
  }, [
    selectedLedger,
    sddRecords,
    savedExports,
    allRates,
    importedData,
    purchaseRecords,
    ledgerExchangeRateId,
  ]);

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
    <div className="export-list-container fade-in">
      {/* Hero Header */}
      <div className="export-list-hero">
        <div className="export-list-hero-left">
          <div className="export-list-hero-icon">
            <ClipboardList size={30} strokeWidth={1.8} />
          </div>
          <div className="export-list-hero-text">
            <h1>Export List</h1>
            <p>Track export ledgers, finalized sales, and shipment summaries</p>
          </div>
        </div>
        <div className="export-list-hero-right">
          <div className="export-list-stat-pill">
            <span className="stat-num">{exports.length}</span>
            <span className="stat-label">
              {exports.length === 1 ? "Record" : "Records"}
            </span>
          </div>
        </div>
      </div>

      <div className="export-list-layout">
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
                    className={`rf-tab ${activeTab === "processing" ? "rf-tab-active rf-tab-orange" : ""}`}
                    onClick={() => setActiveTab("processing")}
                  >
                    <span className="rf-tab-title">Processing</span>
                    <span className="rf-tab-sub">Sell &amp; Export Colors</span>
                  </button>
                  <button
                    className={`rf-tab ${activeTab === "history" ? "rf-tab-active rf-tab-blue" : ""}`}
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
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
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
                        <span className="grand-total-unit">viss</span> /{" "}
                        {(grandTotal.totalWeight * 1.633).toFixed(3)}{" "}
                        <span className="grand-total-unit">kg</span>
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
                          grandTotal.totalAmountMMK +
                            grandTotal.totalWorkerFees,
                        ).toLocaleString()}{" "}
                        <span className="grand-total-unit">MMK</span>
                      </span>
                    </div>
                  </div>

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
                                  {color.totalWeight.toFixed(4)} viss /{" "}
                                  {(color.totalWeight * 1.633).toFixed(4)} kg
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
                                          (sz: any) => sz.weight > 0,
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
                                      ([sizeKey, sizeData]: [string, any]) => {
                                        if (sizeData.weight === 0) return null;
                                        return (
                                          <div
                                            key={sizeKey}
                                            className="size-badge"
                                            style={{ flexWrap: "wrap" }}
                                          >
                                            <span className="size-name">
                                              {sizeKey}
                                            </span>
                                            <span className="size-val">
                                              {(
                                                sizeData.weight * 1.633
                                              ).toFixed(4)}{" "}
                                              kg
                                            </span>
                                            <span
                                              className="size-price"
                                              style={{
                                                marginLeft: "4px",
                                                fontSize: "11px",
                                                color: "#64748b",
                                              }}
                                            >
                                              (
                                              {sizeData.price > 0
                                                ? `¥${sizeData.price.toLocaleString()}`
                                                : "No Price"}
                                              )
                                            </span>
                                            <div
                                              className="size-price-input"
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                              style={{
                                                display: "flex",
                                                gap: "12px",
                                                width: "100%",
                                                marginTop:
                                                  "8px" /* Push inputs below the headers */,
                                                marginLeft:
                                                  "0" /* override flex auto margin for wrap */,
                                                paddingLeft: "0",
                                                borderLeft: "none",
                                              }}
                                            >
                                              <div
                                                style={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: "6px",
                                                  flex: 1,
                                                }}
                                              >
                                                <span
                                                  className="currency-symbol"
                                                  style={{
                                                    fontSize: "11px",
                                                    fontWeight: "700",
                                                  }}
                                                >
                                                  Wgt (kg):
                                                </span>
                                                <input
                                                  type="number"
                                                  placeholder="0"
                                                  value={
                                                    (sizeSellingPrices[
                                                      color.colorName
                                                    ]?.[sizeKey]
                                                      ?.weight as any) || ""
                                                  }
                                                  style={{
                                                    width: "100%",
                                                    flex: 1,
                                                  }}
                                                  onChange={(e) => {
                                                    const val = e.target.value;
                                                    setSizeSellingPrices(
                                                      (prev: any) => ({
                                                        ...prev,
                                                        [color.colorName]: {
                                                          ...(prev[
                                                            color.colorName
                                                          ] || {}),
                                                          [sizeKey]: {
                                                            ...(prev[
                                                              color.colorName
                                                            ]?.[sizeKey] || {}),
                                                            weight: val,
                                                          },
                                                        },
                                                      }),
                                                    );
                                                  }}
                                                />
                                              </div>

                                              <div
                                                style={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: "6px",
                                                  flex: 1,
                                                }}
                                              >
                                                <span
                                                  className="currency-symbol"
                                                  style={{
                                                    fontSize: "11px",
                                                    fontWeight: "700",
                                                  }}
                                                >
                                                  Price: ¥
                                                </span>
                                                <input
                                                  type="number"
                                                  placeholder="0"
                                                  value={
                                                    (sizeSellingPrices[
                                                      color.colorName
                                                    ]?.[sizeKey]
                                                      ?.price as any) || ""
                                                  }
                                                  style={{
                                                    width: "100%",
                                                    flex: 1,
                                                  }}
                                                  onChange={(e) => {
                                                    const val = e.target.value;
                                                    setSizeSellingPrices(
                                                      (prev: any) => ({
                                                        ...prev,
                                                        [color.colorName]: {
                                                          ...(prev[
                                                            color.colorName
                                                          ] || {}),
                                                          [sizeKey]: {
                                                            ...(prev[
                                                              color.colorName
                                                            ]?.[sizeKey] || {}),
                                                            price: val,
                                                          },
                                                        },
                                                      }),
                                                    );
                                                  }}
                                                />
                                              </div>
                                            </div>
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
                              <label>Total Inputted Weight</label>
                              <div className="price-input-wrapper readonly-wrapper">
                                <span className="currency-prefix">
                                  <Scale size={14} />
                                </span>
                                <input
                                  type="text"
                                  disabled
                                  value={`${(calculatedInputtedWeight / 1.633).toFixed(3)} viss / ${calculatedInputtedWeight.toFixed(3)} kg`}
                                />
                              </div>
                            </div>
                            <div className="price-input-group">
                              <label>Calculated Selling Price</label>
                              <div className="price-input-wrapper readonly-wrapper">
                                <span className="currency-prefix">¥</span>
                                <input
                                  type="text"
                                  disabled
                                  value={calculatedSellingPriceCNY.toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    },
                                  )}
                                />
                              </div>
                              <div
                                className="price-input-wrapper readonly-wrapper"
                                style={{ marginTop: "8px" }}
                              >
                                <span className="currency-prefix">MMK</span>
                                <input
                                  type="text"
                                  disabled
                                  value={Math.round(
                                    calculatedSellingPriceMMK,
                                  ).toLocaleString()}
                                />
                              </div>
                            </div>
                            {hasPermission("Sales6.Create") && (
                              <button
                                onClick={handleSellSelected}
                                className="btn-sell"
                                disabled={
                                  sellingInProgress ||
                                  selectedColors.size === 0 ||
                                  calculatedSellingPriceMMK <= 0
                                }
                              >
                                {sellingInProgress
                                  ? "Saving..."
                                  : "Sell Selected"}
                              </button>
                            )}
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
                                  {selectedTotals.weight.toFixed(3)}{" "}
                                  <span className="val-unit">viss</span> /{" "}
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
                                const sp = calculatedSellingPriceMMK;
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
                  let filteredExports = selectedLedger
                    ? exports.filter((e) => e.ledgerId === selectedLedger.id)
                    : exports;
                  if (historySearchTerm) {
                    const term = historySearchTerm.toLowerCase();
                    filteredExports = filteredExports.filter(
                      (e) =>
                        (e.selectedColors || "").toLowerCase().includes(term) ||
                        (e.ledgerName || "").toLowerCase().includes(term),
                    );
                  }
                  if (historyFromDate) {
                    filteredExports = filteredExports.filter(
                      (e) =>
                        new Date(e.date.split("T")[0]) >=
                        new Date(historyFromDate),
                    );
                  }
                  if (historyToDate) {
                    filteredExports = filteredExports.filter(
                      (e) =>
                        new Date(e.date.split("T")[0]) <=
                        new Date(historyToDate),
                    );
                  }

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
                    <>
                      {/* History Filters */}
                      <div className="s6-table-controls">
                        <div className="s6-search-box">
                          <Search className="s6-input-icon" size={16} />
                          <input
                            type="text"
                            className="s6-search-control"
                            placeholder="Search colors, ledger..."
                            value={historySearchTerm}
                            onChange={(e) =>
                              setHistorySearchTerm(e.target.value)
                            }
                          />
                        </div>
                        <div className="s6-date-filter">
                          <div className="s6-date-field">
                            <span className="s6-date-label">From</span>
                            <input
                              type="date"
                              className="s6-date-input"
                              value={historyFromDate}
                              onChange={(e) =>
                                setHistoryFromDate(e.target.value)
                              }
                            />
                          </div>
                          <div className="s6-date-field">
                            <span className="s6-date-label">To</span>
                            <input
                              type="date"
                              className="s6-date-input"
                              value={historyToDate}
                              onChange={(e) => setHistoryToDate(e.target.value)}
                            />
                          </div>
                          {(historyFromDate || historyToDate) && (
                            <button
                              className="s6-date-clear-btn"
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

                      <div className="rf-table-wrap">
                        <table className="rf-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              {!selectedLedger && <th>Ledger</th>}
                              <th>Colors Sold</th>
                              <th>Markers</th>
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
                                <tr
                                  key={sale.id}
                                  style={{ cursor: "pointer" }}
                                  onClick={() => {
                                    setSelectedHistory(sale);
                                    setIsHistoryModalOpen(true);
                                  }}
                                >
                                  <td className="rf-td-date">
                                    {new Date(sale.date).toLocaleDateString()}
                                  </td>
                                  {!selectedLedger && (
                                    <td
                                      style={{
                                        fontWeight: 700,
                                        color: "#2563eb",
                                      }}
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
                                  <td>
                                    <div className="history-colors-list">
                                      {saleLedger ? (
                                        saleLedger.markers.map((m) => (
                                          <span
                                            key={m.markerName}
                                            className="history-color-tag"
                                            style={{
                                              background:
                                                "rgba(99,102,241,0.15)",
                                              color: "#a5b4fc",
                                            }}
                                          >
                                            {m.markerName}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="history-color-tag">
                                          —
                                        </span>
                                      )}
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
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* History Detail Modal */}
      {isHistoryModalOpen &&
        selectedHistory &&
        (() => {
          let historicalInputtedWeight = 0;
          let historicalSellingPriceCNY = 0;
          try {
            const parsed = JSON.parse(
              selectedHistory.sizeSellingPrices || "{}",
            );
            Object.values(parsed).forEach((sizes: any) => {
              Object.values(sizes).forEach((data: any) => {
                let w = 0,
                  p = 0;
                if (typeof data === "object" && data !== null) {
                  w = parseFloat(data.weight || "0");
                  p = parseFloat(data.price || "0");
                } else {
                  p = parseFloat(data || "0");
                }
                if (!isNaN(w) && w > 0) historicalInputtedWeight += w;
                if (!isNaN(w) && !isNaN(p) && w > 0 && p > 0)
                  historicalSellingPriceCNY += w * p;
              });
            });
          } catch (e) {}

          const impliedRate =
            selectedHistory.productAmountCNY > 0
              ? selectedHistory.productAmountMMK /
                selectedHistory.productAmountCNY
              : 1;
          const historicalSellingPriceMMK =
            historicalSellingPriceCNY * impliedRate;

          return (
            <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: "1000px" }}>
                <div className="modal-header">
                  <h2 className="modal-title">Export Sale History Details</h2>
                  <button
                    className="modal-close"
                    onClick={() => setIsHistoryModalOpen(false)}
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="modal-body">
                  <div className="history-detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Date</span>
                      <span className="detail-value">
                        {new Date(selectedHistory.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Ledger</span>
                      <span className="detail-value">
                        {selectedHistory.ledgerName ||
                          `Ledger #${selectedHistory.ledgerId}`}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Selling Price</span>
                      <span className="detail-value">
                        {selectedHistory.sellingPrice.toLocaleString()} MMK
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">
                        Total Inputted Weight
                      </span>
                      <span className="detail-value">
                        {historicalInputtedWeight.toFixed(3)} viss
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">
                        Total Selected Weight
                      </span>
                      <span className="detail-value">
                        {selectedHistory.totalExportWeightViss?.toFixed(3) ??
                          (selectedHistory.totalExportWeightKg / 1.633).toFixed(
                            3,
                          )}{" "}
                        viss / {selectedHistory.totalExportWeightKg.toFixed(3)}{" "}
                        kg
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">
                        Total Selling Price (CNY)
                      </span>
                      <span className="detail-value">
                        ¥{historicalSellingPriceCNY.toLocaleString()}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">
                        Total Selling Price (MMK)
                      </span>
                      <span className="detail-value">
                        {Math.round(historicalSellingPriceMMK).toLocaleString()}{" "}
                        MMK
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Product Amount (CNY)</span>
                      <span className="detail-value">
                        ¥{selectedHistory.productAmountCNY.toLocaleString()}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Product Amount (MMK)</span>
                      <span className="detail-value">
                        {Math.round(
                          selectedHistory.productAmountMMK,
                        ).toLocaleString()}{" "}
                        MMK
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Worker Fees</span>
                      <span className="detail-value">
                        {selectedHistory.workerFees.toLocaleString()} MMK
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Grand Total</span>
                      <span className="detail-value highlight">
                        {Math.round(
                          selectedHistory.grandTotalMMK,
                        ).toLocaleString()}{" "}
                        MMK
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">P&amp;L</span>
                      <span
                        className={`detail-value ${selectedHistory.sellingPrice - selectedHistory.grandTotalMMK >= 0 ? "text-profit" : "text-loss"}`}
                      >
                        {selectedHistory.sellingPrice -
                          selectedHistory.grandTotalMMK >=
                        0
                          ? "+"
                          : ""}
                        {Math.round(
                          selectedHistory.sellingPrice -
                            selectedHistory.grandTotalMMK,
                        ).toLocaleString()}{" "}
                        MMK
                      </span>
                    </div>
                  </div>

                  <div className="history-detail-section">
                    <h3>Colors Sold</h3>
                    <div className="history-colors-list">
                      {selectedHistory.selectedColors.split(", ").map((col) => (
                        <span key={col} className="history-color-tag">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="history-detail-section">
                    <h3>Size Details (Weight & Prices)</h3>
                    {(() => {
                      try {
                        const parsed = JSON.parse(
                          selectedHistory.sizeSellingPrices || "{}",
                        );
                        return (
                          <div className="size-prices-container">
                            {Object.entries(parsed).map(
                              ([colorName, sizes]: [string, any]) => (
                                <div
                                  key={colorName}
                                  className="size-price-group"
                                >
                                  <h4 className="color-group-title">
                                    {colorName}
                                  </h4>
                                  <div
                                    className="history-sizes-grid fade-in"
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns:
                                        "repeat(auto-fill, minmax(130px, 1fr))",
                                      gap: "8px",
                                      marginTop: "10px",
                                    }}
                                  >
                                    {Object.entries(sizes).map(
                                      ([size, data]: [string, any]) => {
                                        let w = 0,
                                          p = 0;
                                        if (
                                          typeof data === "object" &&
                                          data !== null
                                        ) {
                                          w = parseFloat(data.weight || "0");
                                          p = parseFloat(data.price || "0");
                                        } else {
                                          p = parseFloat(data || "0");
                                        }

                                        if (w === 0 && p === 0) return null;

                                        return (
                                          <div
                                            key={size}
                                            className="size-badge history-size-badge"
                                            style={{
                                              backgroundColor: "#f8fafc",
                                              display: "flex",
                                              flexDirection: "column",
                                              alignItems: "flex-start",
                                              padding: "10px",
                                              border: "1px solid #e2e8f0",
                                              borderRadius: "8px",
                                              boxShadow:
                                                "0 1px 2px rgba(0,0,0,0.02)",
                                            }}
                                          >
                                            <div
                                              style={{
                                                fontWeight: "700",
                                                color: "#1e293b",
                                                marginBottom: "6px",
                                              }}
                                            >
                                              Size {size}
                                            </div>
                                            <div
                                              style={{
                                                fontSize: "12px",
                                                color: "#475569",
                                                width: "100%",
                                              }}
                                            >
                                              <div
                                                style={{
                                                  display: "flex",
                                                  justifyContent:
                                                    "space-between",
                                                  marginBottom: "4px",
                                                }}
                                              >
                                                <span
                                                  style={{ color: "#64748b" }}
                                                >
                                                  Wgt:
                                                </span>
                                                <span
                                                  style={{
                                                    fontWeight: "600",
                                                    color: "#1e293b",
                                                  }}
                                                >
                                                  {w > 0
                                                    ? `${w.toFixed(3)} kg`
                                                    : "-"}
                                                </span>
                                              </div>
                                              <div
                                                style={{
                                                  display: "flex",
                                                  justifyContent:
                                                    "space-between",
                                                  marginBottom: "4px",
                                                }}
                                              >
                                                <span
                                                  style={{ color: "#64748b" }}
                                                >
                                                  Price:
                                                </span>
                                                <span
                                                  style={{
                                                    fontWeight: "600",
                                                    color: "#1e293b",
                                                  }}
                                                >
                                                  {p > 0
                                                    ? `¥${p.toLocaleString()}`
                                                    : "-"}
                                                </span>
                                              </div>
                                              {w > 0 && p > 0 && (
                                                <div
                                                  style={{
                                                    display: "flex",
                                                    justifyContent:
                                                      "space-between",
                                                    marginTop: "6px",
                                                    paddingTop: "4px",
                                                    borderTop:
                                                      "1px dashed #e2e8f0",
                                                  }}
                                                >
                                                  <span
                                                    style={{
                                                      color: "#64748b",
                                                      fontWeight: "500",
                                                    }}
                                                  >
                                                    Total:
                                                  </span>
                                                  <span
                                                    style={{
                                                      fontWeight: "700",
                                                      color: "#059669",
                                                    }}
                                                  >
                                                    ¥
                                                    {(w * p).toLocaleString(
                                                      undefined,
                                                      {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                      },
                                                    )}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      },
                                    )}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        );
                      } catch (e) {
                        return <span>No detailed size pricing available.</span>;
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              maxWidth: "400px",
              textAlign: "center",
              padding: "24px",
              borderRadius: "16px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#dcfce7",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <CheckCircle size={24} />
            </div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#1e293b",
                marginBottom: "8px",
              }}
            >
              Success
            </h3>
            <p style={{ color: "#475569", marginBottom: "24px" }}>
              {successMessage}
            </p>
            <button
              onClick={() => setIsSuccessModalOpen(false)}
              style={{
                width: "100%",
                padding: "10px",
                background: "#2563eb",
                color: "white",
                fontWeight: "600",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
      {/* Error Modal */}
      {isErrorModalOpen && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              maxWidth: "400px",
              textAlign: "center",
              padding: "24px",
              borderRadius: "16px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#fee2e2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <AlertCircle size={24} />
            </div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#1e293b",
                marginBottom: "8px",
              }}
            >
              Validation Error
            </h3>
            <p style={{ color: "#475569", marginBottom: "24px" }}>
              {errorMessage}
            </p>
            <button
              onClick={() => setIsErrorModalOpen(false)}
              style={{
                width: "100%",
                padding: "10px",
                background: "#dc2626",
                color: "white",
                fontWeight: "600",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales6;
