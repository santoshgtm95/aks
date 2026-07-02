import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLongPoll } from "../../hooks/useLongPoll";
import {
  singleDoubleDrawnAPI,
  semiExportAPI,
  productsAPI,
  salesAPI,
  ledgerAPI,
  exchangeRatesAPI,
  semiExportPurchaseRecordsAPI,
  semiExportPurchaseAPI,
} from "../../services/api";
import type {
  SingleDoubleDrawnRecord,
  SemiExportRecord,
  Product,
  Sale,
  LedgerDto,
  ExchangeRate,
} from "../../types";
import {
  Package,
  Search,
  Sparkles,
  DollarSign,
  Trash2,
  FileText,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Scale,
  AlertTriangle,
  RotateCcw,
  FilePlus,
  X,
  Layers,
  Clock,
  TrendingUp,
} from "lucide-react";
import { formatDateTime } from "../../utils/format";
import "./index.css";

interface GroupedMarker {
  markerName: string;
  records: SingleDoubleDrawnRecord[];
  combinedWeight: number;
  date: string;
  warehouseNames: string[];
  source?: "sdd" | "purchase";
  colors?: string[];
  customerNames?: string[];
  purchaseRecords?: SemiExportPurchaseRecord[];
  lostWeight?: number;
  purchaseRecordCount?: number;
}

interface SemiExportPurchaseRecordSize {
  size: string;
  weight: number;
  price: number;
}

interface SemiExportPurchaseRecord {
  id: number;
  semiExportPurchaseId: number;
  customerName: string;
  color: string;
  assignWeight: number;
  lostWeight: number;
  workerName: string;
  workerFees: number;
  WorkerName?: string;
  WorkerFees?: number;
  exchangeRateRate: number;
  sizes: SemiExportPurchaseRecordSize[];
  createdAt: string;
}

type SemiExportRecordWithAliases = SemiExportRecord & {
  SemiExportPurchaseRecordId?: number | null;
  WorkerFees?: number;
  Remark?: string;
};

interface SemiExportPurchase {
  id: number;
  customerName: string;
  totalReceiveWeight: number;
}

const SemiExport: React.FC = () => {
  const { hasPermission } = useAuth();
  const [activeRates, setActiveRates] = useState<ExchangeRate[]>([]);
  const currentCnyRate = useMemo(() => {
    const rateObj = activeRates.find(
      (r) => r.fromCurrency === "CNY" && r.toCurrency === "MMK",
    );
    return rateObj ? rateObj.rate : null;
  }, [activeRates]);
  const [sddRecords, setSddRecords] = useState<SingleDoubleDrawnRecord[]>([]);
  const [savedExports, setSavedExports] = useState<SemiExportRecord[]>([]);
  const [purchaseRecords, setPurchaseRecords] = useState<
    SemiExportPurchaseRecord[]
  >([]);
  const [semiExportPurchases, setSemiExportPurchases] = useState<
    SemiExportPurchase[]
  >([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [ledgers, setLedgers] = useState<LedgerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [selectedPurchaseGroupKey, setSelectedPurchaseGroupKey] = useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [markerWorkerFees, setMarkerWorkerFees] = useState<string>("0");
  const [markerRemark, setMarkerRemark] = useState<string>("");
  const [purchaseWorkerFees, setPurchaseWorkerFees] = useState<string>("0");
  const [purchaseRemark, setPurchaseRemark] = useState<string>("");
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [selectedLedgerMarkers, setSelectedLedgerMarkers] = useState<string[]>(
    [],
  );
  const [ledgerDate, setLedgerDate] = useState<string>(
    new Date().toISOString().substring(0, 10),
  );
  const [ledgerName, setLedgerName] = useState<string>("");
  const [ledgerDescription, setLedgerDescription] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"processing" | "history">(
    "processing",
  );
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showWorkerFeesBreakdown, setShowWorkerFeesBreakdown] = useState(false);
  const [prevSelectedMarker, setPrevSelectedMarker] = useState<string | null>(
    null,
  );

  const [expandedRecords, setExpandedRecords] = useState<
    Record<number, boolean>
  >({});

  const getPurchaseRecordWorkerName = (record: SemiExportPurchaseRecord) =>
    record.workerName || record.WorkerName || "Worker";

  const getPurchaseRecordWorkerFees = (record: SemiExportPurchaseRecord) =>
    Number(record.workerFees ?? record.WorkerFees ?? 0) || 0;

  const getSavedPurchaseExport = (record: SemiExportPurchaseRecord) =>
    (savedExports as SemiExportRecordWithAliases[]).find(
      (x) =>
        Number(
          x.semiExportPurchaseRecordId ?? x.SemiExportPurchaseRecordId ?? 0,
        ) === record.id,
    );

  const getSavedPurchaseRemark = (record: SemiExportPurchaseRecord) => {
    const saved = getSavedPurchaseExport(record);
    return saved?.remark ?? saved?.Remark ?? "";
  };

  const selectedRecords = useMemo(() => {
    if (!selectedMarker) return [];

    return sddRecords.filter(
      (r) => r.refinementRecordMarker === selectedMarker,
    );
  }, [sddRecords, selectedMarker]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedMarker) {
      const newExpanded: Record<number, boolean> = {};

      // Calculate initial marker worker fees and get common remark
      let totalFees = 0;
      let hasSaved = false;
      let commonRemark = "";

      selectedRecords.forEach((record) => {
        const saved = savedExports.find(
          (x) => x.singleDoubleDrawnRecordId === record.id,
        );
        if (saved) {
          hasSaved = true;
          totalFees += saved.workerFees || 0;
          if (saved.remark && !commonRemark) {
            commonRemark = saved.remark;
          }
        }
        newExpanded[record.id] = false;
      });

      if (!hasSaved) {
        // Auto-sum if new marker
        const pMap = new Map<number, number>();
        const puMap = new Map<number, number>();
        const supMap = new Map<number, number>();
        const rMap = new Map<number, number>();
        const wgMap = new Map<number, number>();
        let sdSum = 0;
        selectedRecords.forEach((r) => {
          if (r.processingRecordId && r.messLabourWorkerFees)
            pMap.set(r.processingRecordId, r.messLabourWorkerFees);
          if (r.purifiedRecordId && r.purificationWorkerFees)
            puMap.set(r.purifiedRecordId, r.purificationWorkerFees);
          if (r.purifiedRecordId && r.purificationSupervisorFees)
            supMap.set(r.purifiedRecordId, r.purificationSupervisorFees);
          if (r.refinementRecordId && r.refinementWorkerFees)
            rMap.set(r.refinementRecordId, r.refinementWorkerFees);
          if (r.processingRecordId && r.washGradingWorkerFees)
            wgMap.set(r.processingRecordId, r.washGradingWorkerFees);
          if (r.workerFees) sdSum += r.workerFees;
        });
        const pSum = [...pMap.values()].reduce((a, b) => a + b, 0);
        const puSum = [...puMap.values()].reduce((a, b) => a + b, 0);
        const supSum = [...supMap.values()].reduce((a, b) => a + b, 0);
        const rSum = [...rMap.values()].reduce((a, b) => a + b, 0);
        const wgSum = [...wgMap.values()].reduce((a, b) => a + b, 0);
        totalFees = pSum + puSum + supSum + rSum + wgSum + sdSum;
      }

      setMarkerWorkerFees(totalFees.toString());
      setMarkerRemark(commonRemark);
      setExpandedRecords(newExpanded);
    } else {
      setMarkerWorkerFees("0");
      setMarkerRemark("");
      setExpandedRecords({});
    }
  }, [selectedMarker, selectedRecords, savedExports]);

  const getSortedTotal = (record: SingleDoubleDrawnRecord) => {
    return (
      record.size6 +
      record.size7 +
      record.size8 +
      record.size9 +
      record.size10 +
      record.size10B +
      record.size12 +
      record.size14 +
      record.size16 +
      record.size18 +
      record.size20 +
      record.size22 +
      record.size24 +
      record.size26 +
      record.size28 +
      record.sizeBar
    );
  };

  const groupedRecords = useMemo(() => {
    const groups: Record<string, GroupedMarker> = {};

    // Get all marker names that are already part of a ledger
    const markersInLedgers = new Set(
      ledgers.flatMap((l) => l.markers.map((m) => m.markerName)),
    );

    sddRecords.forEach((record) => {
      const marker = record.refinementRecordMarker || "---";

      // Filter out markers that are already in a ledger
      if (markersInLedgers.has(marker)) return;

      if (!groups[marker]) {
        groups[marker] = {
          markerName: marker,
          records: [],
          combinedWeight: 0,
          date: record.date,
          warehouseNames: [],
        };
      }
      groups[marker].records.push(record);
      groups[marker].combinedWeight += getSortedTotal(record);
      if (
        record.date &&
        new Date(record.date) > new Date(groups[marker].date)
      ) {
        groups[marker].date = record.date;
      }
      if (
        record.refinementRecordWarehouseName &&
        !groups[marker].warehouseNames.includes(
          record.refinementRecordWarehouseName,
        )
      ) {
        groups[marker].warehouseNames.push(
          record.refinementRecordWarehouseName,
        );
      }
    });

    purchaseRecords.forEach((record) => {
      const createdDate = record.createdAt
        ? new Date(record.createdAt).toDateString()
        : "---";
      const groupKey = `purchase-${createdDate}`;
      const markerName = record.createdAt
        ? new Date(record.createdAt).toLocaleDateString()
        : "---";

      if (markersInLedgers.has(markerName)) return;

      const totalWeight = record.sizes
        .filter((size) => size.size !== "Lost")
        .reduce((sum, size) => sum + (Number(size.weight) || 0), 0);
      const lostWeight =
        record.sizes.find((size) => size.size === "Lost")?.weight || 0;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          markerName,
          records: [],
          combinedWeight: 0,
          date: record.createdAt,
          warehouseNames: [],
          source: "purchase",
          colors: [],
          customerNames: [],
          purchaseRecords: [],
          lostWeight: 0,
          purchaseRecordCount: 0,
        };
      }

      groups[groupKey].purchaseRecords?.push(record);
      groups[groupKey].combinedWeight += totalWeight;
      groups[groupKey].lostWeight =
        (groups[groupKey].lostWeight || 0) + lostWeight;
      groups[groupKey].purchaseRecordCount =
        (groups[groupKey].purchaseRecordCount || 0) + 1;

      if (record.color && !groups[groupKey].colors?.includes(record.color)) {
        groups[groupKey].colors?.push(record.color);
      }

      if (
        record.customerName &&
        !groups[groupKey].customerNames?.includes(record.customerName)
      ) {
        groups[groupKey].customerNames?.push(record.customerName);
      }

      if (
        record.createdAt &&
        new Date(record.createdAt) > new Date(groups[groupKey].date)
      ) {
        groups[groupKey].date = record.createdAt;
      }
    });

    return Object.values(groups);
  }, [sddRecords, ledgers, purchaseRecords]);

  const getPurchaseGroupKey = (group: GroupedMarker) =>
    group.source === "purchase" ? `purchase-${group.date}` : group.markerName;

  const selectedPurchaseGroup = useMemo(
    () =>
      selectedPurchaseGroupKey
        ? groupedRecords.find(
            (group) =>
              group.source === "purchase" &&
              getPurchaseGroupKey(group) === selectedPurchaseGroupKey,
          ) || null
        : null,
    [groupedRecords, selectedPurchaseGroupKey],
  );

  const purchaseWorkerFeesInfo = useMemo(() => {
    const records = selectedPurchaseGroup?.purchaseRecords || [];
    const savedTotal = records.reduce(
      (sum, record) => sum + getPurchaseRecordWorkerFees(record),
      0,
    );
    const manualTotal = parseFloat(purchaseWorkerFees) || 0;

    if (savedTotal <= 0) {
      return {
        sum: manualTotal,
        hasSavedFees: false,
        details:
          manualTotal > 0
            ? [
                {
                  label: "Manual Override",
                  name: "Purchase group",
                  amount: manualTotal,
                },
              ]
            : [],
      };
    }

    const detailsMap = new Map<
      string,
      { label: string; name: string; amount: number }
    >();

    records.forEach((record) => {
      const amount = getPurchaseRecordWorkerFees(record);
      if (amount <= 0) return;

      const workerName = getPurchaseRecordWorkerName(record);
      const existing = detailsMap.get(workerName);

      if (existing) {
        existing.amount += amount;
      } else {
        detailsMap.set(workerName, {
          label: "Sorting",
          name: workerName,
          amount,
        });
      }
    });

    return {
      sum: savedTotal,
      hasSavedFees: true,
      details: Array.from(detailsMap.values()),
    };
  }, [selectedPurchaseGroup, purchaseWorkerFees, savedExports]);

  useEffect(() => {
    if (selectedPurchaseGroup?.purchaseRecords?.length) {
      const totalFees = selectedPurchaseGroup.purchaseRecords.reduce(
        (sum, record) => sum + getPurchaseRecordWorkerFees(record),
        0,
      );
      const savedRemark =
        selectedPurchaseGroup.purchaseRecords
          .map((record) => getSavedPurchaseRemark(record))
          .find(Boolean) || "";

      setPurchaseWorkerFees(totalFees.toString());
      setPurchaseRemark(savedRemark);
    } else {
      setPurchaseWorkerFees("0");
      setPurchaseRemark("");
    }
  }, [selectedPurchaseGroup, savedExports]);

  const completedMarkers = useMemo(() => {
    return groupedRecords.filter((group) => {
      if (group.source === "purchase") {
        const purchaseRecords = group.purchaseRecords || [];

        return (
          purchaseRecords.length > 0 &&
          purchaseRecords.every((record) => getSavedPurchaseExport(record))
        );
      }

      const marker = group.markerName;

      // Check if all records of this group are saved in SemiExportRecords
      const allRecordsSaved = group.records.every((record) =>
        savedExports.some((x) => x.singleDoubleDrawnRecordId === record.id),
      );
      if (!allRecordsSaved) return false;

      const selectedProduct = products.find((p) => p.marker === marker);
      const selectedProductSales = sales.filter(
        (s) => s.productMarker === marker || s.marker === marker,
      );

      const unit = selectedProduct ? selectedProduct.unit : "viss";
      const toViss = (v: number) => (unit === "kg" ? v / 1.633 : v);

      const originalWeight = selectedProduct
        ? Number(selectedProduct.weight)
        : 0;
      const originalWeightViss = toViss(originalWeight);

      const weightSoldRawMaterial = selectedProductSales.reduce(
        (sum, s) => sum + Number(s.weight),
        0,
      );
      const weightSoldViss = toViss(weightSoldRawMaterial);

      const remainingAfterSalesViss = originalWeightViss - weightSoldViss;

      // Sum refinement-level lost weight across all SDD records
      const refinementLostWeight = group.records.reduce(
        (sum, r) => sum + (r.lostWeight || 0) + (r.singleDoubleLostWeight || 0),
        0,
      );
      // Processing-level lost weight: deduplicate by processingRecordId so each
      // ProcessingRecord's LossWeight is counted exactly once. If a product has
      // multiple ProcessingRecords (multiple Mess-Labour batches), all are summed.
      const processingIdMap = new Map<number, number>();
      group.records.forEach((r) => {
        if (
          r.processingRecordId != null &&
          !processingIdMap.has(r.processingRecordId)
        ) {
          processingIdMap.set(
            r.processingRecordId,
            r.processingLossWeight || 0,
          );
        }
      });
      const processingLostWeight = Array.from(processingIdMap.values()).reduce(
        (s, v) => s + v,
        0,
      );
      const washGradingIdMap = new Map<number, number>();
      group.records.forEach((r) => {
        if (
          r.washGradingRecordId != null &&
          !washGradingIdMap.has(r.washGradingRecordId)
        ) {
          washGradingIdMap.set(
            r.washGradingRecordId,
            r.washGradingLostWeight || 0,
          );
        }
      });
      const washGradingLostWeight = Array.from(
        washGradingIdMap.values(),
      ).reduce((sum, r) => sum + r, 0);
      const sumLostWeight =
        refinementLostWeight + processingLostWeight + washGradingLostWeight;

      const sumSpoilageWeight = group.records.reduce(
        (sum, r) => sum + (r.spoilageWeight || 0) + (r.spoilageSize || 0),
        0,
      );

      const sumReturnWeight = group.records.reduce(
        (sum, r) => sum + (r.returnWeight || 0) + (r.returnSize || 0),
        0,
      );

      const totalSortedWeight = group.records.reduce((sum, r) => {
        return (
          sum +
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
          (r.sizeBar || 0)
        );
      }, 0);

      const remainingUnsorted =
        remainingAfterSalesViss -
        (totalSortedWeight +
          sumLostWeight +
          sumSpoilageWeight +
          sumReturnWeight);

      return remainingUnsorted <= 0.005;
    });
  }, [groupedRecords, products, sales, savedExports]);

  // Filter sidebar list
  const filteredGroupedRecords = useMemo(() => {
    return groupedRecords.filter((g) => {
      const search = searchTerm.toLowerCase();
      const marker = g.markerName.toLowerCase();
      const warehouses = g.warehouseNames.map((w) => w.toLowerCase()).join(" ");
      const colors = (g.colors || []).map((c) => c.toLowerCase()).join(" ");
      const customers = (g.customerNames || [])
        .map((c) => c.toLowerCase())
        .join(" ");
      const dateStr = g.date
        ? new Date(g.date).toLocaleDateString().toLowerCase()
        : "";
      const categories = g.records
        .map((r) => (r.refinementRecordCategory || "").toLowerCase())
        .join(" ");

      return (
        marker.includes(search) ||
        warehouses.includes(search) ||
        colors.includes(search) ||
        customers.includes(search) ||
        dateStr.includes(search) ||
        categories.includes(search)
      );
    });
  }, [groupedRecords, searchTerm]);

  // Calculate grouped weights for each record in the selected marker
  const recordCalculations = useMemo(() => {
    const calcs: Record<number, any> = {};
    selectedRecords.forEach((record) => {
      const wB = record.sizeBar || 0;
      const w28 = record.size28 || 0;
      const w26 = record.size26 || 0;
      const w24 = record.size24 || 0;
      const w22 = record.size22 || 0;
      const w20 = record.size20 || 0;
      const w18 = record.size18 || 0;
      const w16 = record.size16 || 0;
      const w14 = record.size14 || 0;
      const w12 = record.size12 || 0;
      const w10B = record.size10B || 0;
      const w10 = record.size10 || 0;
      const w9 = record.size9 || 0;
      const w8 = record.size8 || 0;
      const w7 = record.size7 || 0;
      const w6 = record.size6 || 0;
      const wLeftover = record.returnSize || 0;
      const wSpoil = record.spoilageSize || 0;
      const wLoss = record.lostWeight || 0;

      const totalWeight =
        wB +
        w28 +
        w26 +
        w24 +
        w22 +
        w20 +
        w18 +
        w16 +
        w14 +
        w12 +
        w10B +
        w10 +
        w9 +
        w8 +
        w7 +
        w6 +
        wLeftover +
        wSpoil;
      const denominator = totalWeight - wLoss > 0 ? totalWeight - wLoss : 1;

      calcs[record.id] = {
        wB,
        w28,
        w26,
        w24,
        w22,
        w20,
        w18,
        w16,
        w14,
        w12,
        w10B,
        w10,
        w9,
        w8,
        w7,
        w6,
        wLeftover,
        wSpoil,
        wLoss,
        totalWeight,
        denominator,
      };
    });
    return calcs;
  }, [selectedRecords]);

  const toggleRecordExpanded = (recordId: number) => {
    setExpandedRecords((prev) => ({
      ...prev,
      [recordId]: !prev[recordId],
    }));
  };

  const handleSubmitLedger = async () => {
    if (selectedLedgerMarkers.length === 0 || !ledgerName.trim()) return;

    setFormError("");

    setSaving(true);
    try {
      const markersPayload = selectedLedgerMarkers.map((markerName) => {
        const product = products.find((p) => p.marker === markerName);
        return {
          markerName,
          productId: product?.id,
        };
      });

      await ledgerAPI.create({
        ledgerName: ledgerName.trim(),
        date: ledgerDate,
        description: ledgerDescription,
        markers: markersPayload,
      });
      setShowLedgerModal(false);
      setSelectedLedgerMarkers([]);
      setLedgerName("");
      setLedgerDescription("");

      // Reload ledgers to hide markers
      const updatedLedgers = await ledgerAPI.getAll();
      setLedgers(updatedLedgers);
    } catch (error) {
      console.error("Failed to create ledger:", error);
      setFormError("Failed to create ledger. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const loadData = useCallback(async () => {
    try {
      const [
        sddData,
        exportData,
        productsData,
        salesData,
        ledgerData,
        ratesData,
        purchaseRecordsData,
        purchaseData,
      ] = await Promise.all([
        singleDoubleDrawnAPI.getAll(),
        semiExportAPI.getAll(),
        productsAPI.getAll(true),
        salesAPI.getAll("Sales"),
        ledgerAPI.getAll(),
        exchangeRatesAPI.getActive(),
        semiExportPurchaseRecordsAPI.getAll(),
        semiExportPurchaseAPI.getAll(),
      ]);
      setSddRecords(sddData);
      setSavedExports(exportData);
      setProducts(productsData);
      setSales(salesData);
      setLedgers(ledgerData);
      setActiveRates(ratesData);
      setPurchaseRecords(purchaseRecordsData);
      setSemiExportPurchases(purchaseData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  useLongPoll(loadData);

  // Compute metrics for selected marker
  const selectedMarkerStats = useMemo(() => {
    if (!selectedMarker) return null;

    const selectedProduct = products.find((p) => p.marker === selectedMarker);
    const selectedProductSales = sales.filter(
      (s) => s.productMarker === selectedMarker || s.marker === selectedMarker,
    );

    const unit = selectedProduct ? selectedProduct.unit : "viss";
    const toViss = (v: number) => (unit === "kg" ? v / 1.633 : v);
    const toKg = (v: number) => (unit === "kg" ? v : v * 1.633);

    // 1. Original weight in inventory
    const originalWeight = selectedProduct ? Number(selectedProduct.weight) : 0;
    const originalWeightViss = toViss(originalWeight);
    const originalWeightKg = toKg(originalWeight);

    // 2. Weight sold in Raw Material Sales
    const weightSoldRawMaterial = selectedProductSales.reduce(
      (sum, s) => sum + Number(s.weight),
      0,
    );
    const weightSoldViss = toViss(weightSoldRawMaterial);
    const weightSoldKg = toKg(weightSoldRawMaterial);

    // 3. Remaining weight after selling in Raw Material Sales
    const remainingWeightAfterSales = originalWeight - weightSoldRawMaterial;
    const remainingAfterSalesViss = toViss(remainingWeightAfterSales);
    const remainingAfterSalesKg = toKg(remainingWeightAfterSales);

    // 4. Sum of Lost Weight of all colors (viss)
    // Refinement lostWeight: sum across all SDD records (one per color category).
    // Processing-level lost weight: deduplicate by processingRecordId so each
    // ProcessingRecord's LossWeight is counted exactly once. If a product has
    // multiple ProcessingRecords (multiple Mess-Labour batches), all are summed.
    const refinementLostWeight = selectedRecords.reduce(
      (sum, r) => sum + (r.lostWeight || 0) + (r.singleDoubleLostWeight || 0),
      0,
    );
    const selectedProcessingIdMap = new Map<number, number>();
    selectedRecords.forEach((r) => {
      if (
        r.processingRecordId != null &&
        !selectedProcessingIdMap.has(r.processingRecordId)
      ) {
        selectedProcessingIdMap.set(
          r.processingRecordId,
          r.processingLossWeight || 0,
        );
      }
    });
    const processingLostWeight = Array.from(
      selectedProcessingIdMap.values(),
    ).reduce((s, v) => s + v, 0);
    const selectedWashGradingIdMap = new Map<number, number>();
    selectedRecords.forEach((r) => {
      if (
        r.washGradingRecordId != null &&
        !selectedWashGradingIdMap.has(r.washGradingRecordId)
      ) {
        selectedWashGradingIdMap.set(
          r.washGradingRecordId,
          r.washGradingLostWeight || 0,
        );
      }
    });
    const washGradingLostWeight = Array.from(
      selectedWashGradingIdMap.values(),
    ).reduce((s, v) => s + v, 0);
    const sumLostWeight =
      refinementLostWeight + processingLostWeight + washGradingLostWeight;

    // 5. Sum of Spoilage Weight (B to 10 only)
    const sumSpoilageWeight = selectedRecords.reduce(
      (sum, r) => sum + (r.spoilageWeight || 0) + (r.spoilageSize || 0),
      0,
    );

    // 6. Sum of Return Weight (incl. 2" Return)
    const sumReturnWeight = selectedRecords.reduce(
      (sum, r) => sum + (r.returnWeight || 0) + (r.returnSize || 0),
      0,
    );

    // 7. Export Weight (10B to Bar)
    const sumBto10Weight = selectedRecords.reduce((sum, r) => {
      return (
        sum +
        (r.sizeBar || 0) +
        (r.size28 || 0) +
        (r.size26 || 0) +
        (r.size24 || 0) +
        (r.size22 || 0) +
        (r.size20 || 0) +
        (r.size18 || 0) +
        (r.size16 || 0) +
        (r.size14 || 0) +
        (r.size12 || 0) +
        (r.size10B || 0)
      );
    }, 0);

    // 7b. Non-Export Sizes (6 to 10)
    const sumTwoInchesWeight = selectedRecords.reduce((sum, r) => {
      return (
        sum +
        (r.size6 || 0) +
        (r.size7 || 0) +
        (r.size8 || 0) +
        (r.size9 || 0) +
        (r.size10 || 0)
      );
    }, 0);

    // 8. Remaining Unsorted (viss)
    const remainingUnsorted =
      remainingAfterSalesViss -
      (sumBto10Weight +
        sumTwoInchesWeight +
        sumLostWeight +
        sumSpoilageWeight +
        sumReturnWeight);

    // 9. Percentage calculations based on Remaining Weight after Raw Material Sales
    const denom = remainingAfterSalesViss || 1; // avoid division by zero
    const remainingUnsortedPercent = (remainingUnsorted / denom) * 100;
    const sumLostWeightPercent = (sumLostWeight / denom) * 100;
    const sumSpoilageWeightPercent = (sumSpoilageWeight / denom) * 100;
    const sumReturnWeightPercent = (sumReturnWeight / denom) * 100;

    const categoryBto10 = selectedRecords.reduce(
      (acc: Record<string, number>, r) => {
        const cat = (r.refinementRecordCategory || "Other").toLowerCase();
        const weight =
          (r.sizeBar || 0) +
          (r.size28 || 0) +
          (r.size26 || 0) +
          (r.size24 || 0) +
          (r.size22 || 0) +
          (r.size20 || 0) +
          (r.size18 || 0) +
          (r.size16 || 0) +
          (r.size14 || 0) +
          (r.size12 || 0) +
          (r.size10B || 0);

        if (!acc[cat]) acc[cat] = 0;
        acc[cat] += weight;
        return acc;
      },
      {},
    );

    const averageBto10 =
      remainingAfterSalesViss > 0
        ? (sumBto10Weight / remainingAfterSalesViss) * 100
        : 0;

    // 10. Financial calculations (User Request - Bar to 10 Only)
    const productPrice = selectedProduct ? selectedProduct.price : 0;
    let productPriceViss = productPrice;
    let productPriceKg = productPrice;

    if (unit === "kg") {
      productPriceViss = productPrice * 1.633;
      productPriceKg = productPrice;
    } else {
      productPriceViss = productPrice;
      productPriceKg = productPrice / 1.633;
    }

    const originalTotalAmount = remainingAfterSalesViss * productPriceViss;
    const originalTotalAmountKg = remainingAfterSalesKg * productPriceKg;

    return {
      originalWeightViss,
      originalWeightKg,
      weightSoldViss,
      weightSoldKg,
      remainingAfterSalesViss,
      remainingAfterSalesKg,
      remainingUnsorted,
      remainingUnsortedPercent,
      sumLostWeight,
      sumLostWeightPercent,
      sumSpoilageWeight,
      sumSpoilageWeightPercent,
      sumReturnWeight,
      sumReturnWeightPercent,
      sumBto10Weight,
      sumTwoInchesWeight,
      categoryBto10,
      averageBto10,
      unit,
      productPriceViss,
      productPriceKg,
      originalTotalAmount,
      originalTotalAmountKg,
    };
  }, [selectedMarker, products, sales, selectedRecords]);

  const selectedPurchaseStats = useMemo(() => {
    if (!selectedPurchaseGroup?.purchaseRecords?.length) return null;

    const records = selectedPurchaseGroup.purchaseRecords;
    const purchaseIds = new Set(
      records.map((record) => record.semiExportPurchaseId),
    );
    const originalWeightViss = semiExportPurchases
      .filter((purchase) => purchaseIds.has(purchase.id))
      .reduce(
        (sum, purchase) => sum + (Number(purchase.totalReceiveWeight) || 0),
        0,
      );
    const originalWeightKg = originalWeightViss * 1.633;

    const getSizeWeight = (record: SemiExportPurchaseRecord, sizes: string[]) =>
      record.sizes
        .filter((size) => sizes.includes(size.size))
        .reduce((sum, size) => sum + (Number(size.weight) || 0), 0);

    const processingLostWeight = records.reduce(
      (sum, record) => sum + (Number(record.lostWeight) || 0),
      0,
    );
    const sortingLostWeight = records.reduce(
      (sum, record) => sum + getSizeWeight(record, ["Lost"]),
      0,
    );
    const sumLostWeight = processingLostWeight + sortingLostWeight;
    const sumSpoilageWeight = records.reduce(
      (sum, record) => sum + getSizeWeight(record, ["Spoilage"]),
      0,
    );
    const sumReturnWeight = records.reduce(
      (sum, record) => sum + getSizeWeight(record, ["Return"]),
      0,
    );
    const sumBto10Weight = records.reduce(
      (sum, record) =>
        sum +
        getSizeWeight(record, [
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
        ]),
      0,
    );
    const sumTwoInchesWeight = records.reduce(
      (sum, record) => sum + getSizeWeight(record, ["6", "7", "8", "9", "10"]),
      0,
    );
    const totalSortedWeight = sumBto10Weight + sumTwoInchesWeight;
    const totalAmountCNY = records.reduce(
      (sum, record) =>
        sum +
        record.sizes.reduce(
          (sizeSum, size) =>
            sizeSum + (Number(size.weight) || 0) * (Number(size.price) || 0),
          0,
        ),
      0,
    );
    const totalAmountMMK = records.reduce(
      (sum, record) =>
        sum +
        record.sizes.reduce(
          (sizeSum, size) =>
            sizeSum +
            (Number(size.weight) || 0) *
              (Number(size.price) || 0) *
              (Number(record.exchangeRateRate) || currentCnyRate || 0),
          0,
        ),
      0,
    );
    const colorBreakdown = Object.values(
      records.reduce(
        (
          acc: Record<
            string,
            {
              color: string;
              weight: number;
              amountCNY: number;
              amountMMK: number;
            }
          >,
          record,
        ) => {
          const color = record.color || "---";
          if (!acc[color]) {
            acc[color] = {
              color,
              weight: 0,
              amountCNY: 0,
              amountMMK: 0,
            };
          }

          record.sizes
            .filter((size) => size.size !== "Lost")
            .forEach((size) => {
              const weight = Number(size.weight) || 0;
              const amountCNY = weight * (Number(size.price) || 0);
              acc[color].weight += weight;
              acc[color].amountCNY += amountCNY;
              acc[color].amountMMK +=
                amountCNY *
                (Number(record.exchangeRateRate) || currentCnyRate || 0);
            });

          return acc;
        },
        {},
      ),
    );
    const remainingUnsorted =
      originalWeightViss -
      (totalSortedWeight + sumLostWeight + sumSpoilageWeight + sumReturnWeight);
    const denom = originalWeightViss || 1;

    return {
      date: selectedPurchaseGroup.date,
      colors: selectedPurchaseGroup.colors || [],
      customerNames: selectedPurchaseGroup.customerNames || [],
      originalWeightViss,
      originalWeightKg,
      totalSortedWeight,
      processingLostWeight,
      sortingLostWeight,
      sumLostWeight,
      sumLostWeightPercent: (sumLostWeight / denom) * 100,
      sumSpoilageWeight,
      sumSpoilageWeightPercent: (sumSpoilageWeight / denom) * 100,
      sumReturnWeight,
      sumReturnWeightPercent: (sumReturnWeight / denom) * 100,
      sumBto10Weight,
      averageBto10: (sumBto10Weight / denom) * 100,
      sumTwoInchesWeight,
      sumTwoInchesPercent: (sumTwoInchesWeight / denom) * 100,
      remainingUnsorted,
      remainingUnsortedPercent: (remainingUnsorted / denom) * 100,
      totalAmountCNY,
      totalAmountMMK,
      colorBreakdown,
    };
  }, [selectedPurchaseGroup, semiExportPurchases, currentCnyRate]);

  // Calculate row Amounts for each record
  const recordAmounts = useMemo(() => {
    const amts: Record<number, any> = {};
    selectedRecords.forEach((record) => {
      const calculations = recordCalculations[record.id];
      if (!calculations) return;

      const {
        wB,
        w28,
        w26,
        w24,
        w22,
        w20,
        w18,
        w16,
        w14,
        w12,
        w10B,
        w10,
        w9,
        w8,
        w7,
        w6,
        wLeftover,
        wSpoil,
      } = calculations;

      const amtB = wB * (record.priceBar || 0);
      const amt28 = w28 * (record.price28 || 0);
      const amt26 = w26 * (record.price26 || 0);
      const amt24 = w24 * (record.price24 || 0);
      const amt22 = w22 * (record.price22 || 0);
      const amt20 = w20 * (record.price20 || 0);
      const amt18 = w18 * (record.price18 || 0);
      const amt16 = w16 * (record.price16 || 0);
      const amt14 = w14 * (record.price14 || 0);
      const amt12 = w12 * (record.price12 || 0);
      const amt10B = w10B * (record.price10B || 0);
      const amt10 = w10 * (record.price10 || 0);
      const amt9 = w9 * (record.price9 || 0);
      const amt8 = w8 * (record.price8 || 0);
      const amt7 = w7 * (record.price7 || 0);
      const amt6 = w6 * (record.price6 || 0);
      const amtLeftover = wLeftover * (record.priceReturnSize || 0);
      const amtSpoil = wSpoil * (record.priceSpoilageSize || 0);

      const totalAmount =
        amtB +
        amt28 +
        amt26 +
        amt24 +
        amt22 +
        amt20 +
        amt18 +
        amt16 +
        amt14 +
        amt12 +
        amt10B +
        amt10 +
        amt9 +
        amt8 +
        amt7 +
        amt6 +
        amtLeftover +
        amtSpoil;

      amts[record.id] = {
        amtB,
        amt28,
        amt26,
        amt24,
        amt22,
        amt20,
        amt18,
        amt16,
        amt14,
        amt12,
        amt10B,
        amt10,
        amt9,
        amt8,
        amt7,
        amt6,
        amtLeftover,
        amtSpoil,
        totalAmount,
      };
    });
    return amts;
  }, [selectedRecords, recordCalculations]);

  const groupedHistory = useMemo(() => {
    const groups: Record<string, any> = {};

    savedExports.forEach((record) => {
      const marker = record.refinementRecordMarker || "---";
      const sdd = sddRecords.find(
        (x) => x.id === record.singleDoubleDrawnRecordId,
      );

      let rowAmountCNY = 0;
      if (sdd) {
        const wB = sdd.sizeBar || 0;
        const w28 = sdd.size28 || 0;
        const w26 = sdd.size26 || 0;
        const w24 = sdd.size24 || 0;
        const w22 = sdd.size22 || 0;
        const w20 = sdd.size20 || 0;
        const w18 = sdd.size18 || 0;
        const w16 = sdd.size16 || 0;
        const w14 = sdd.size14 || 0;
        const w12 = sdd.size12 || 0;
        const w10B = sdd.size10B || 0;
        const w10 = sdd.size10 || 0;
        const w9 = sdd.size9 || 0;
        const w8 = sdd.size8 || 0;
        const w7 = sdd.size7 || 0;
        const w6 = sdd.size6 || 0;
        const wLeftover = sdd.returnSize || 0;
        const wSpoil = sdd.spoilageSize || 0;

        rowAmountCNY =
          wB * (sdd.priceBar || 0) +
          w28 * (sdd.price28 || 0) +
          w26 * (sdd.price26 || 0) +
          w24 * (sdd.price24 || 0) +
          w22 * (sdd.price22 || 0) +
          w20 * (sdd.price20 || 0) +
          w18 * (sdd.price18 || 0) +
          w16 * (sdd.price16 || 0) +
          w14 * (sdd.price14 || 0) +
          w12 * (sdd.price12 || 0) +
          w10B * (sdd.price10B || 0) +
          w10 * (sdd.price10 || 0) +
          w9 * (sdd.price9 || 0) +
          w8 * (sdd.price8 || 0) +
          w7 * (sdd.price7 || 0) +
          w6 * (sdd.price6 || 0) +
          wLeftover * (sdd.priceReturnSize || 0) +
          wSpoil * (sdd.priceSpoilageSize || 0);
      }

      // Use the rate stored at save time; fall back to current active rate
      const rate = record.exchangeRateRate ?? currentCnyRate ?? 1;
      const rowAmountMMK = rowAmountCNY * rate;

      if (!groups[marker]) {
        groups[marker] = {
          marker,
          warehouseNames: new Set(),
          categories: new Set(),
          totalAmountCNY: 0,
          totalAmountMMK: 0,
          totalWorkerFees: 0,
          latestDate: record.date,
          remark: record.remark,
          ids: [],
        };
      }

      groups[marker].totalAmountCNY += rowAmountCNY;
      groups[marker].totalAmountMMK += rowAmountMMK;
      groups[marker].totalWorkerFees += record.workerFees || 0;
      if (record.refinementRecordWarehouseName)
        groups[marker].warehouseNames.add(record.refinementRecordWarehouseName);
      if (record.refinementRecordCategory)
        groups[marker].categories.add(record.refinementRecordCategory);
      if (new Date(record.date) > new Date(groups[marker].latestDate)) {
        groups[marker].latestDate = record.date;
        if (record.remark) groups[marker].remark = record.remark;
      }
      groups[marker].ids.push(record.id);
    });

    return Object.values(groups).sort(
      (a: any, b: any) =>
        new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime(),
    );
  }, [savedExports, sddRecords, currentCnyRate]);

  const filteredHistory = useMemo(() => {
    if (selectedMarker) {
      return groupedHistory.filter((g: any) => g.marker === selectedMarker);
    }
    return groupedHistory;
  }, [groupedHistory, selectedMarker]);

  const markerWorkerFeesInfo = useMemo(() => {
    let sum = 0;
    const details: { label: string; name: string; amount: number }[] = [];
    if (!selectedMarker) return { sum, details };

    const processingMap = new Map<number, { name: string; amount: number }>();
    const purifiedMap = new Map<number, { name: string; amount: number }>();
    const supervisorMap = new Map<number, { name: string; amount: number }>();
    const refinementMap = new Map<number, { name: string; amount: number }>();
    const washGradingMap = new Map<number, { name: string; amount: number }>();

    selectedRecords.forEach((r) => {
      // 1) Processing (Mess Labour)
      if (r.processingRecordId && r.messLabourWorkerFees) {
        processingMap.set(r.processingRecordId, {
          name: r.messLabourWorkerNames || "N/A",
          amount: r.messLabourWorkerFees,
        });
      }
      // 2) Purification
      if (r.purifiedRecordId && r.purificationWorkerFees) {
        purifiedMap.set(r.purifiedRecordId, {
          name: r.purificationWorkerName || "N/A",
          amount: r.purificationWorkerFees,
        });
      }
      // 3) Purification Supervisor
      if (r.purifiedRecordId && r.purificationSupervisorFees) {
        supervisorMap.set(r.purifiedRecordId, {
          name: r.purificationSupervisorName || "N/A",
          amount: r.purificationSupervisorFees,
        });
      }
      // 4) Refinement
      if (r.refinementRecordId && r.refinementWorkerFees) {
        refinementMap.set(r.refinementRecordId, {
          name: r.refinementWorkerName || "N/A",
          amount: r.refinementWorkerFees,
        });
      }
      // 5) Wash & Grading
      if (r.processingRecordId && r.washGradingWorkerFees) {
        washGradingMap.set(r.processingRecordId, {
          name: r.washGradingWorkerName || "N/A",
          amount: r.washGradingWorkerFees,
        });
      }
      // 6) SingleDoubleDrawn
      if (r.workerFees) {
        details.push({
          label: `Single & Double Drawn Sorting`,
          name: r.workerName || "N/A",
          amount: r.workerFees,
        });
        sum += r.workerFees;
      }
    });

    for (const info of processingMap.values()) {
      details.unshift({
        label: `Mess-Labour`,
        name: info.name,
        amount: info.amount,
      });
      sum += info.amount;
    }
    for (const info of purifiedMap.values()) {
      details.unshift({
        label: `Purification`,
        name: info.name,
        amount: info.amount,
      });
      sum += info.amount;
    }
    for (const info of supervisorMap.values()) {
      details.unshift({
        label: `Purification Supervisor`,
        name: info.name,
        amount: info.amount,
      });
      sum += info.amount;
    }
    for (const info of refinementMap.values()) {
      details.unshift({
        label: `Refinement`,
        name: info.name,
        amount: info.amount,
      });
      sum += info.amount;
    }
    for (const info of washGradingMap.values()) {
      details.unshift({
        label: `Wash & Grading`,
        name: info.name,
        amount: info.amount,
      });
      sum += info.amount;
    }

    return { sum, details };
  }, [selectedRecords, selectedMarker]);

  const markerTotalAmount = useMemo(() => {
    const sumRecords = Object.values(recordAmounts).reduce(
      (sum, r: any) => sum + (r.totalAmount || 0),
      0,
    );
    return sumRecords;
  }, [recordAmounts]);

  const markerTotalAmountMmk = useMemo(() => {
    const fees = parseFloat(markerWorkerFees) || 0;
    if (currentCnyRate !== null) {
      return markerTotalAmount * currentCnyRate + fees;
    }
    return null;
  }, [markerTotalAmount, currentCnyRate, markerWorkerFees]);

  const financialComparison = useMemo(() => {
    if (!selectedMarkerStats) return null;
    const { originalTotalAmount } = selectedMarkerStats;
    const markerMmk = markerTotalAmountMmk !== null ? markerTotalAmountMmk : 0;
    const pnl = originalTotalAmount - markerMmk;
    return {
      pnl,
    };
  }, [selectedMarkerStats, markerTotalAmountMmk]);

  const handleSaveMarkerData = async () => {
    if (!selectedMarker || selectedRecords.length === 0) return;

    setSaving(true);
    setFormError("");

    try {
      const totalFees = parseFloat(markerWorkerFees) || 0;
      const activeCnyRateId =
        activeRates.find(
          (r) => r.fromCurrency === "CNY" && r.toCurrency === "MMK",
        )?.id || null;

      // Save all batches with the total worker fees on the first record and 0 on the rest
      await Promise.all(
        selectedRecords.map((record, index) => {
          const dto = {
            singleDoubleDrawnRecordId: record.id,
            workerFees: index === 0 ? totalFees : 0,
            remark: markerRemark,
            exchangeRateId: activeCnyRateId,
          };
          return semiExportAPI.upsert(dto);
        }),
      );

      await loadData();
    } catch (err) {
      console.error("Failed to save marker data:", err);
      setFormError("Failed to save Semi Export transaction. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePurchaseMarkerData = async () => {
    const records = selectedPurchaseGroup?.purchaseRecords || [];
    if (records.length === 0) return;

    setSaving(true);
    setFormError("");

    try {
      await semiExportAPI.upsertPurchaseRecords({
        semiExportPurchaseRecordIds: records.map((record) => record.id),
        workerFees: parseFloat(purchaseWorkerFees) || 0,
        remark: purchaseRemark,
        exchangeRateId:
          activeRates.find(
            (r) => r.fromCurrency === "CNY" && r.toCurrency === "MMK",
          )?.id || null,
      });

      await loadData();
    } catch (err) {
      console.error("Failed to save purchase marker data:", err);
      setFormError(
        "Failed to save Semi Export purchase transaction. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExport = async (ids: number[]) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this Semi Export record?",
      )
    )
      return;
    try {
      await Promise.all(ids.map((id) => semiExportAPI.delete(id)));
      await loadData();
    } catch (err) {
      console.error("Failed to delete export:", err);
      alert("Failed to delete record");
    }
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedMarker(prevSelectedMarker);
    setPrevSelectedMarker(null);
  };

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

  const renderPurchaseGroupDetails = () => {
    if (!selectedPurchaseGroup || !selectedPurchaseStats) return null;

    const stat = (
      title: string,
      value: string,
      footer: string,
      icon: React.ReactNode,
      color: string,
      backgroundColor: string,
    ) => (
      <div className="stat-card">
        <div className="stat-header">
          <span className="stat-title">{title}</span>
          <div className="stat-icon-wrapper" style={{ backgroundColor, color }}>
            {icon}
          </div>
        </div>
        <div>
          <h3 className="stat-value">{value}</h3>
          <span className="stat-footer">{footer}</span>
        </div>
      </div>
    );

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          gap: "24px",
        }}
      >
        <div
          className="main-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "24px",
            paddingBottom: "16px",
            borderBottom: "2px solid #f1f5f9",
          }}
        >
          <div
            className="header-title"
            style={{ display: "flex", alignItems: "center", gap: "16px" }}
          >
            <DollarSign size={32} style={{ color: "#2563eb" }} />
            <div>
              <h1
                style={{
                  fontSize: "26px",
                  fontWeight: "800",
                  margin: 0,
                  color: "#0f172a",
                }}
              >
                Semi Export Purchase
              </h1>
              <p
                className="header-subtitle"
                style={{
                  fontSize: "13.5px",
                  color: "#64748b",
                  margin: "6px 0 0 0",
                  fontWeight: "500",
                }}
              >
                Marker: <strong>{selectedPurchaseGroup.markerName}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          {stat(
            "Original Weight",
            `${selectedPurchaseStats.originalWeightViss.toFixed(3)} viss`,
            `= ${selectedPurchaseStats.originalWeightKg.toFixed(3)} kg`,
            <Scale size={16} />,
            "#2563eb",
            "#eff6ff",
          )}
          {stat(
            "Total Sorted",
            `${selectedPurchaseStats.totalSortedWeight.toFixed(3)} viss`,
            "from SemiExportPurchaseRecords sizes",
            <Scale size={16} />,
            "#059669",
            "#ecfdf5",
          )}
          {selectedPurchaseStats.remainingUnsorted >= 0.001 &&
            stat(
              "Remaining Unsorted",
              `${selectedPurchaseStats.remainingUnsorted.toFixed(3)} viss`,
              `${selectedPurchaseStats.remainingUnsortedPercent.toFixed(2)}% remaining`,
              <Scale size={16} />,
              "#0284c7",
              "#f0f9ff",
            )}
          {stat(
            "Sum of Lost Weight",
            `${selectedPurchaseStats.sumLostWeight.toFixed(3)} viss`,
            `Processing ${selectedPurchaseStats.processingLostWeight.toFixed(3)} + Sorting ${selectedPurchaseStats.sortingLostWeight.toFixed(3)}`,
            <AlertTriangle size={16} />,
            "#d97706",
            "#fffbeb",
          )}
          {stat(
            "Sum of Spoilage Weight",
            `${selectedPurchaseStats.sumSpoilageWeight.toFixed(3)} viss`,
            `${selectedPurchaseStats.sumSpoilageWeightPercent.toFixed(2)}%`,
            <AlertTriangle size={16} />,
            "#8b5cf6",
            "#faf5ff",
          )}
          {stat(
            "Sum of Return Weight",
            `${selectedPurchaseStats.sumReturnWeight.toFixed(3)} viss`,
            `${selectedPurchaseStats.sumReturnWeightPercent.toFixed(2)}%`,
            <RotateCcw size={16} />,
            "#c026d3",
            "#fdf4ff",
          )}
          {stat(
            "Bar to 10B Sizes",
            `${selectedPurchaseStats.sumBto10Weight.toFixed(3)} viss`,
            `${selectedPurchaseStats.averageBto10.toFixed(2)}% total export ratio`,
            <Layers size={16} />,
            "#db2777",
            "#fdf2f8",
          )}
          {stat(
            "Two Inches Area",
            `${selectedPurchaseStats.sumTwoInchesWeight.toFixed(3)} viss`,
            `${selectedPurchaseStats.sumTwoInchesPercent.toFixed(2)}% (Size 6 to 10)`,
            <Package size={16} />,
            "#15803d",
            "#f0fdf4",
          )}
        </div>

        <div
          style={{
            background: "#f8fafc",
            padding: "20px",
            borderRadius: "16px",
            border: "1.5px solid #e2e8f0",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "700",
              color: "#0f172a",
              margin: "0 0 14px",
            }}
          >
            Group Info
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <span className="rf-badge">
              Date: {new Date(selectedPurchaseGroup.date).toLocaleDateString()}
            </span>
            <span className="rf-badge">
              Customers:{" "}
              {selectedPurchaseStats.customerNames.join(", ") || "---"}
            </span>
            <span className="rf-badge">
              Colors: {selectedPurchaseStats.colors.join(", ") || "---"}
            </span>
          </div>
        </div>

        <div
          style={{
            background: "#f8fafc",
            padding: "24px",
            borderRadius: "16px",
            border: "1.5px solid #e2e8f0",
            boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "700",
              color: "#0f172a",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Sparkles size={18} color="#2563eb" /> Record Sales Details for
            Marker
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <DollarSign size={18} style={{ color: "#2563eb" }} />
                <span
                  style={{
                    fontSize: "13.5px",
                    fontWeight: "700",
                    color: "#334155",
                  }}
                >
                  WORKER FEES (SUM) - MANUAL OVERRIDE:
                </span>
              </div>
              <input
                type="number"
                value={purchaseWorkerFees}
                onChange={(e) => setPurchaseWorkerFees(e.target.value)}
                placeholder="0"
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "14px",
                  width: "200px",
                  fontWeight: "600",
                  backgroundColor: "white",
                }}
              />
            </div>

            {selectedPurchaseGroup.purchaseRecords?.length ? (
              <div
                style={{
                  marginTop: "-8px",
                  padding: "16px",
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                  border: "1px dashed #cbd5e1",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setShowWorkerFeesBreakdown(!showWorkerFeesBreakdown)
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    background: "none",
                    border: "none",
                    padding: "0",
                    cursor: "pointer",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      margin: 0,
                      color: "#334155",
                    }}
                  >
                    Worker Fees Breakdown
                  </h4>
                  {showWorkerFeesBreakdown ? (
                    <ChevronUp size={16} color="#64748b" />
                  ) : (
                    <ChevronDown size={16} color="#64748b" />
                  )}
                </button>

                {showWorkerFeesBreakdown && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      marginTop: "12px",
                    }}
                  >
                    {purchaseWorkerFeesInfo.details.length > 0 ? (
                      purchaseWorkerFeesInfo.details.map((fi, i) => (
                        <div
                          key={`${fi.label}-${fi.name}-${i}`}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "13px",
                            color: "#475569",
                          }}
                        >
                          <span>
                            <span
                              style={{ fontWeight: "600", color: "#0f172a" }}
                            >
                              {fi.label}
                            </span>{" "}
                            ({fi.name}):
                          </span>
                          <span style={{ fontWeight: "600" }}>
                            {fi.amount.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#b45309",
                          backgroundColor: "#fffbeb",
                          border: "1px solid #fde68a",
                          borderRadius: "8px",
                          padding: "10px 12px",
                        }}
                      >
                        No worker fees were saved for these purchase records.
                      </div>
                    )}
                    <div
                      style={{
                        marginTop: "8px",
                        paddingTop: "8px",
                        borderTop: "1px solid #cbd5e1",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "14px",
                        fontWeight: "700",
                        color: "#0f172a",
                      }}
                    >
                      <span>Total Calculated Worker Fees:</span>
                      <span style={{ color: "#2563eb" }}>
                        {purchaseWorkerFeesInfo.sum.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <div style={{ display: "flex", flexDirection: "column" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13.5px",
                  fontWeight: "700",
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                <FileText size={15} /> REMARK:
              </label>
              <textarea
                value={purchaseRemark}
                onChange={(e) => setPurchaseRemark(e.target.value)}
                placeholder="Enter remark for this purchase group..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "14px",
                  outline: "none",
                  resize: "vertical",
                  backgroundColor: "white",
                }}
              />
            </div>

            {hasPermission("SemiExport.Create") && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={handleSavePurchaseMarkerData}
                  className="btn btn-primary"
                  disabled={saving}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 32px",
                    borderRadius: "12px",
                    fontWeight: "800",
                    fontSize: "15px",
                    background: "#0f172a",
                    color: "white",
                    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.2)",
                    transition: "all 0.2s",
                  }}
                >
                  <CheckCircle size={20} />
                  {saving ? "Saving..." : "Save Marker Records"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            background: "#f8fafc",
            borderRadius: "16px",
            padding: "24px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
            border: "1.5px solid #e2e8f0",
          }}
        >
          <div style={{ flex: 1 }}>
            <h4
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: "14px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 800,
              }}
            >
              Inventory Reference
            </h4>
            <div
              style={{
                marginTop: "12px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px",
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "#94a3b8",
                    fontWeight: 700,
                  }}
                >
                  ORIGINAL WEIGHT
                </p>
                <p
                  style={{
                    margin: "2px 0 0 0",
                    fontSize: "17px",
                    color: "#1e293b",
                    fontWeight: 600,
                  }}
                >
                  {selectedPurchaseStats.originalWeightViss.toFixed(3)} viss
                </p>
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "#94a3b8",
                    fontWeight: 700,
                  }}
                >
                  ORIGINAL TOTAL AMOUNT
                </p>
                <p
                  style={{
                    margin: "2px 0 0 0",
                    fontSize: "17px",
                    color: "#1e293b",
                    fontWeight: 600,
                  }}
                >
                  {selectedPurchaseStats.totalAmountMMK.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    },
                  )}{" "}
                  <span style={{ fontSize: "13px" }}>MMK</span>
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              textAlign: "right",
              paddingLeft: "40px",
              borderLeft: "1.5px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              minWidth: "320px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: "16px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Total Marker Value (CNY)
              </span>
              <div>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "800",
                    color: "#1e293b",
                  }}
                >
                  {selectedPurchaseStats.totalAmountCNY.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    },
                  )}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "#64748b",
                    marginLeft: "4px",
                  }}
                >
                  CNY
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: "16px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Total Marker Value (MMK)
              </span>
              <div>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "800",
                    color: "#475569",
                  }}
                >
                  {selectedPurchaseStats.totalAmountMMK.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    },
                  )}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "#64748b",
                    marginLeft: "4px",
                  }}
                >
                  MMK
                </span>
              </div>
            </div>

            <div
              style={{
                height: "1px",
                backgroundColor: "#e2e8f0",
                margin: "2px 0",
              }}
            />

            <div>
              <h4
                style={{
                  margin: 0,
                  color: "#64748b",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontWeight: 800,
                  textAlign: "right",
                  marginBottom: "4px",
                }}
              >
                Grand Total Value
              </h4>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "8px",
                  justifyContent: "flex-end",
                }}
              >
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: "950",
                    color: "#2563eb",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {(
                    selectedPurchaseStats.totalAmountMMK +
                    (parseFloat(purchaseWorkerFees) || 0)
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "800",
                    color: "#64748b",
                  }}
                >
                  MMK
                </span>
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#94a3b8",
                  marginTop: "2px",
                }}
              >
                (Total MMK +{" "}
                {(parseFloat(purchaseWorkerFees) || 0).toLocaleString()} MMK
                Worker Fees)
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "white",
            border: "1.5px solid #e2e8f0",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div
            style={{
              padding: "16px 24px",
              background: "#f8fafc",
              borderBottom: "1.5px solid #e2e8f0",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: "800",
                color: "#0f172a",
              }}
            >
              Colors Breakdown
            </h3>
          </div>
          <div
            style={{
              padding: "20px",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <table
              className="table"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "14px",
              }}
            >
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: "10px 16px" }}>COLOR</th>
                  <th style={{ padding: "10px 16px", textAlign: "right" }}>
                    WEIGHT
                  </th>
                  <th style={{ padding: "10px 16px", textAlign: "right" }}>
                    AMOUNT (CNY)
                  </th>
                  <th style={{ padding: "10px 16px", textAlign: "right" }}>
                    AMOUNT (MMK)
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedPurchaseStats.colorBreakdown.map((row) => (
                  <tr key={row.color}>
                    <td
                      style={{
                        padding: "10px 16px",
                        fontWeight: "700",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      {row.color}
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        textAlign: "right",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      {row.weight.toFixed(3)} viss
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        textAlign: "right",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      {row.amountCNY.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        textAlign: "right",
                        borderBottom: "1px solid #f1f5f9",
                        fontWeight: "700",
                        color: "#2563eb",
                      }}
                    >
                      {row.amountMMK.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderMarkerDetails = (isModal = false) => {
    if (
      !selectedMarker ||
      selectedRecords.length === 0 ||
      !selectedMarkerStats
    ) {
      return null;
    }
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          gap: "24px",
        }}
      >
        {/* Header details */}
        {!isModal && (
          <div
            className="main-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "24px",
              paddingBottom: "16px",
              borderBottom: "2px solid #f1f5f9",
            }}
          >
            <div
              className="header-title"
              style={{ display: "flex", alignItems: "center", gap: "16px" }}
            >
              <DollarSign size={32} style={{ color: "#2563eb" }} />
              <div>
                <h1
                  style={{
                    fontSize: "26px",
                    fontWeight: "800",
                    margin: 0,
                    color: "#0f172a",
                  }}
                >
                  Semi Export
                </h1>
                <p
                  className="header-subtitle"
                  style={{
                    fontSize: "13.5px",
                    color: "#64748b",
                    margin: "6px 0 0 0",
                    fontWeight: "500",
                  }}
                >
                  Marker: <strong>{selectedMarker}</strong> • Warehouse(s):{" "}
                  <strong>
                    {Array.from(
                      new Set(
                        selectedRecords
                          .map((r) => r.refinementRecordWarehouseName)
                          .filter(Boolean),
                      ),
                    ).join(", ") || "---"}
                  </strong>{" "}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Dashboard Grid */}
        <div className="stats-grid">
          {/* 1. Original Weight */}
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Original Weight</span>
              <div
                className="stat-icon-wrapper"
                style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}
              >
                <Scale size={16} />
              </div>
            </div>
            <div>
              <h3 className="stat-value">
                {selectedMarkerStats.originalWeightViss.toFixed(3)}{" "}
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#64748b",
                  }}
                >
                  viss
                </span>
              </h3>
              <span className="stat-footer">
                = {selectedMarkerStats.originalWeightKg.toFixed(3)} kg
              </span>
            </div>
          </div>

          {/* 2. Weight Sold in Raw Material Sales */}
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Weight Sold</span>
              <div
                className="stat-icon-wrapper"
                style={{ backgroundColor: "#fef2f2", color: "#ef4444" }}
              >
                <Scale size={16} />
              </div>
            </div>
            <div>
              <h3 className="stat-value">
                {selectedMarkerStats.weightSoldViss.toFixed(3)}{" "}
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#64748b",
                  }}
                >
                  viss
                </span>
              </h3>
              <span className="stat-footer">
                = {selectedMarkerStats.weightSoldKg.toFixed(3)} kg ·
                <br /> Raw Material Sales
              </span>
            </div>
          </div>

          {/* 3. Remaining Weight after Sales */}
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Remaining Weight</span>
              <div
                className="stat-icon-wrapper"
                style={{ backgroundColor: "#ecfdf5", color: "#10b981" }}
              >
                <Scale size={16} />
              </div>
            </div>
            <div>
              <h3 className="stat-value">
                {selectedMarkerStats.remainingAfterSalesViss.toFixed(3)}{" "}
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#64748b",
                  }}
                >
                  viss
                </span>
              </h3>
              <span className="stat-footer">
                = {selectedMarkerStats.remainingAfterSalesKg.toFixed(3)} kg ·{" "}
                <br /> after Raw Material Sales
              </span>
            </div>
          </div>

          {/* 3b. Remaining Unsorted in Inventory */}
          {selectedMarkerStats.remainingUnsorted >= 0.001 && (
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Remaining Unsorted</span>
                <div
                  className="stat-icon-wrapper"
                  style={{ backgroundColor: "#f0f9ff", color: "#0284c7" }}
                >
                  <Scale size={16} />
                </div>
              </div>
              <div>
                <h3 className="stat-value">
                  {selectedMarkerStats.remainingUnsorted.toFixed(3)} viss
                </h3>
                <span className="stat-footer">
                  (
                  <strong>
                    {selectedMarkerStats.remainingUnsortedPercent.toFixed(2)}%
                  </strong>
                  ) remaining unsorted
                </span>
              </div>
            </div>
          )}

          {/* 4. Sum of Lost Weight of all colors (viss) */}
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Sum of Lost Weight</span>
              <div
                className="stat-icon-wrapper"
                style={{ backgroundColor: "#fffbeb", color: "#d97706" }}
              >
                <AlertTriangle size={16} />
              </div>
            </div>
            <div>
              <h3 className="stat-value">
                {selectedMarkerStats.sumLostWeight.toFixed(3)} viss
              </h3>
              <span className="stat-footer">
                (
                <strong>
                  {selectedMarkerStats.sumLostWeightPercent.toFixed(2)}%
                </strong>
                ) across all colors
              </span>
            </div>
          </div>

          {/* 5. Sum of Spoilage Weight of all colors */}
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Sum of Spoilage Weight</span>
              <div
                className="stat-icon-wrapper"
                style={{ backgroundColor: "#faf5ff", color: "#8b5cf6" }}
              >
                <AlertTriangle size={16} />
              </div>
            </div>
            <div>
              <h3 className="stat-value">
                {selectedMarkerStats.sumSpoilageWeight.toFixed(3)} viss
              </h3>
              <span className="stat-footer">
                (
                <strong>
                  {selectedMarkerStats.sumSpoilageWeightPercent.toFixed(2)}%
                </strong>
                ) (incl. 2" Spoil)
              </span>
            </div>
          </div>

          {/* 6. Sum of Return Weight of all colors */}
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Sum of Return Weight</span>
              <div
                className="stat-icon-wrapper"
                style={{ backgroundColor: "#fdf4ff", color: "#c026d3" }}
              >
                <RotateCcw size={16} />
              </div>
            </div>
            <div>
              <h3 className="stat-value">
                {selectedMarkerStats.sumReturnWeight.toFixed(3)} viss
              </h3>
              <span className="stat-footer">
                (
                <strong>
                  {selectedMarkerStats.sumReturnWeightPercent.toFixed(2)}%
                </strong>
                ) (incl. 2" Return)
              </span>
            </div>
          </div>

          {/* 3c. Sum of Bar to 10B Sizes (Total Export Weight) */}
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Bar to 10B Sizes</span>
              <div
                className="stat-icon-wrapper"
                style={{ backgroundColor: "#fdf2f8", color: "#db2777" }}
              >
                <Layers size={16} />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <div>
                <h3 className="stat-value">
                  {selectedMarkerStats.sumBto10Weight.toFixed(3)} viss
                </h3>
                <span className="stat-footer">
                  (
                  <strong>
                    {selectedMarkerStats.averageBto10.toFixed(2)}%
                  </strong>
                  ) total export ratio
                </span>
              </div>
            </div>
          </div>
          {/* 7. Two Inches & Ten Size */}
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Two Inches Area</span>
              <div
                className="stat-icon-wrapper"
                style={{ backgroundColor: "#f0fdf4", color: "#15803d" }}
              >
                <Package size={16} />
              </div>
            </div>
            <div>
              <h3 className="stat-value">
                {selectedMarkerStats.sumTwoInchesWeight.toFixed(3)} viss
              </h3>
              <span className="stat-footer">
                (
                <strong>
                  {(
                    (selectedMarkerStats.sumTwoInchesWeight /
                      (selectedMarkerStats.remainingAfterSalesViss || 1)) *
                    100
                  ).toFixed(2)}
                  %
                </strong>
                ) (Size 6 to 10)
              </span>
            </div>
          </div>
        </div>

        {/* Marker-Level Global Save Section */}
        <div
          style={{
            background: "#f8fafc",
            padding: "24px",
            borderRadius: "16px",
            border: "1.5px solid #e2e8f0",
            boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "700",
              color: "#0f172a",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Sparkles size={18} color="#2563eb" /> Record Sales Details for
            Marker
          </h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <DollarSign size={18} style={{ color: "#2563eb" }} />
                <span
                  style={{
                    fontSize: "13.5px",
                    fontWeight: "700",
                    color: "#334155",
                  }}
                >
                  WORKER FEES (SUM) - MANUAL OVERRIDE:
                </span>
              </div>
              <input
                type="number"
                value={markerWorkerFees}
                onChange={(e) => setMarkerWorkerFees(e.target.value)}
                placeholder="0"
                disabled={isModal}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "14px",
                  width: "200px",
                  fontWeight: "600",
                  backgroundColor: isModal ? "#f1f5f9" : "white",
                  cursor: isModal ? "not-allowed" : "text",
                }}
              />
            </div>
            {markerWorkerFeesInfo.details.length > 0 && (
              <div
                style={{
                  marginTop: "-8px",
                  padding: "16px",
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                  border: "1px dashed #cbd5e1",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setShowWorkerFeesBreakdown(!showWorkerFeesBreakdown)
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    background: "none",
                    border: "none",
                    padding: "0",
                    cursor: "pointer",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      margin: 0,
                      color: "#334155",
                    }}
                  >
                    Worker Fees Breakdown
                  </h4>
                  {showWorkerFeesBreakdown ? (
                    <ChevronUp size={16} color="#64748b" />
                  ) : (
                    <ChevronDown size={16} color="#64748b" />
                  )}
                </button>

                {showWorkerFeesBreakdown && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      marginTop: "12px",
                    }}
                  >
                    {markerWorkerFeesInfo.details.map((fi, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "13px",
                          color: "#475569",
                        }}
                      >
                        <span>
                          <span style={{ fontWeight: "600", color: "#0f172a" }}>
                            {fi.label}
                          </span>{" "}
                          ({fi.name}):
                        </span>
                        <span style={{ fontWeight: "600" }}>
                          {fi.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div
                      style={{
                        marginTop: "8px",
                        paddingTop: "8px",
                        borderTop: "1px solid #cbd5e1",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "14px",
                        fontWeight: "700",
                        color: "#0f172a",
                      }}
                    >
                      <span>Total Calculated Worker Fees:</span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span style={{ color: "#2563eb" }}>
                          {markerWorkerFeesInfo.sum.toLocaleString()}
                        </span>
                        {!isModal && (
                          <button
                            type="button"
                            onClick={() =>
                              setMarkerWorkerFees(
                                markerWorkerFeesInfo.sum.toString(),
                              )
                            }
                            title="Use calculated total as manual override"
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid #2563eb",
                              background: "#dbeafe",
                              color: "#2563eb",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "600",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <RotateCcw size={12} /> Use
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13.5px",
                  fontWeight: "700",
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                <FileText size={15} /> REMARK:
              </label>
              <textarea
                value={markerRemark}
                onChange={(e) => setMarkerRemark(e.target.value)}
                placeholder={
                  isModal ? "No remark" : "Enter remark for this marker..."
                }
                rows={3}
                disabled={isModal}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "14px",
                  outline: "none",
                  resize: isModal ? "none" : "vertical",
                  backgroundColor: isModal ? "#f1f5f9" : "white",
                  cursor: isModal ? "not-allowed" : "text",
                }}
              />
            </div>

            {!isModal && hasPermission("SemiExport.Create") && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={handleSaveMarkerData}
                  className="btn btn-primary"
                  disabled={saving}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 32px",
                    borderRadius: "12px",
                    fontWeight: "800",
                    fontSize: "15px",
                    background: "#0f172a",
                    color: "white",
                    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.2)",
                    transition: "all 0.2s",
                  }}
                >
                  <CheckCircle size={20} />
                  {saving ? "Saving..." : "Save Marker Records"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Grand Total Amount Summary Card */}
        <div
          style={{
            background: "#f8fafc",
            borderRadius: "16px",
            padding: "24px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
            border: "1.5px solid #e2e8f0",
            marginTop: "24px",
          }}
        >
          <div style={{ flex: 1 }}>
            <h4
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: "14px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 800,
              }}
            >
              Inventory Reference
            </h4>
            <div
              style={{
                marginTop: "12px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px",
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "#94a3b8",
                    fontWeight: 700,
                  }}
                >
                  INVENTORY PRICE
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginTop: "2px",
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "16px",
                        color: "#1e293b",
                        fontWeight: 600,
                      }}
                    >
                      {selectedMarkerStats.productPriceViss.toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        },
                      )}{" "}
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        MMK/viss
                      </span>
                    </p>
                  </div>
                  <div
                    style={{
                      width: "1.5px",
                      height: "16px",
                      backgroundColor: "#e2e8f0",
                      alignSelf: "center",
                    }}
                  />
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "16px",
                        color: "#1e293b",
                        fontWeight: 600,
                      }}
                    >
                      {selectedMarkerStats.productPriceKg.toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        },
                      )}{" "}
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        MMK/kg
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    color: "#94a3b8",
                    fontWeight: 700,
                  }}
                >
                  ORIGINAL TOTAL AMOUNT
                </p>
                <p
                  style={{
                    margin: "2px 0 0 0",
                    fontSize: "17px",
                    color: "#1e293b",
                    fontWeight: 600,
                  }}
                >
                  {selectedMarkerStats.originalTotalAmount.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    },
                  )}{" "}
                  <span style={{ fontSize: "13px" }}>MMK</span>
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              textAlign: "right",
              paddingLeft: "40px",
              borderLeft: "1.5px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              minWidth: "320px",
            }}
          >
            {/* 1. Total Marker Value in CNY */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: "16px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Total Marker Value (CNY)
              </span>
              <div>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "800",
                    color: "#1e293b",
                  }}
                >
                  {markerTotalAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "#64748b",
                    marginLeft: "4px",
                  }}
                >
                  CNY
                </span>
              </div>
            </div>

            {/* 2. Total Marker Value in MMK */}
            {currentCnyRate !== null && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: "16px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Total Marker Value (MMK)
                </span>
                <div>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: "800",
                      color: "#475569",
                    }}
                  >
                    {(markerTotalAmount * currentCnyRate).toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      },
                    )}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#64748b",
                      marginLeft: "4px",
                    }}
                  >
                    MMK
                  </span>
                </div>
              </div>
            )}

            {/* Divider line */}
            <div
              style={{
                height: "1px",
                backgroundColor: "#e2e8f0",
                margin: "2px 0",
              }}
            />

            {/* 3. Grand Total Value (Total Marker Value in MMK + Worker Fees) */}
            <div>
              <h4
                style={{
                  margin: 0,
                  color: "#64748b",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontWeight: 800,
                  textAlign: "right",
                  marginBottom: "4px",
                }}
              >
                Grand Total Value
              </h4>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "8px",
                  justifyContent: "flex-end",
                }}
              >
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: "950",
                    color: "#2563eb",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {markerTotalAmountMmk !== null
                    ? markerTotalAmountMmk.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : markerTotalAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "800",
                    color: "#64748b",
                  }}
                >
                  MMK
                </span>
              </div>

              {currentCnyRate !== null && (
                <div
                  style={{
                    fontSize: "10px",
                    color: "#94a3b8",
                    marginTop: "2px",
                  }}
                >
                  (Rate: 1 CNY = {currentCnyRate.toLocaleString()} MMK +{" "}
                  {(parseFloat(markerWorkerFees) || 0).toLocaleString()} MMK
                  Worker Fees)
                </div>
              )}
            </div>

            {financialComparison && (
              <div
                style={{
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    fontWeight: 600,
                  }}
                >
                  P&L:
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "800",
                    color: financialComparison.pnl <= 0 ? "#059669" : "#dc2626",
                  }}
                >
                  {financialComparison.pnl.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    color: "#94a3b8",
                    fontWeight: 700,
                  }}
                >
                  MMK
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Records List */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            marginTop: "24px",
          }}
        >
          {selectedRecords.map((record) => {
            const calculations = recordCalculations[record.id];
            const rowAmounts = recordAmounts[record.id];
            const isExpanded = expandedRecords[record.id];
            const isSaved = savedExports.some(
              (x) => x.singleDoubleDrawnRecordId === record.id,
            );

            if (!calculations || !rowAmounts) return null;

            return (
              <div
                key={record.id}
                style={{
                  background: "white",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.02)",
                }}
              >
                {/* Record Header */}
                <div
                  style={{
                    padding: "16px 24px",
                    background: "#f8fafc",
                    borderBottom: "1.5px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onClick={() => toggleRecordExpanded(record.id)}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span
                      className={`rf-badge category-${(record.refinementRecordCategory || "").toLowerCase().replace(".", "")}`}
                      style={{ fontSize: "12px", padding: "4px 10px" }}
                    >
                      {record.refinementRecordCategory}
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      Sorted Weight:{" "}
                      <strong style={{ color: "#0f172a" }}>
                        {calculations.totalWeight.toFixed(3)}
                      </strong>{" "}
                      viss
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      • Date:{" "}
                      <strong style={{ color: "#0f172a" }}>
                        {new Date(record.date).toLocaleDateString()}
                      </strong>
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      • Amount:{" "}
                      <strong style={{ color: "#2563eb" }}>
                        {rowAmounts.totalAmount.toLocaleString()}
                      </strong>{" "}
                      CNY
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    {isSaved && (
                      <span
                        style={{
                          background: "#d1fae5",
                          color: "#065f46",
                          fontSize: "11px",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontWeight: "bold",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <CheckCircle size={12} /> Saved
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: "20px" }}>
                    <div
                      className="table-container"
                      style={{
                        border: "1.5px solid #e2e8f0",
                        borderRadius: "12px",
                        overflow: "hidden",
                        background: "white",
                      }}
                    >
                      <table
                        className="table"
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          textAlign: "left",
                          fontSize: "14px",
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              background: "#f8fafc",
                              borderBottom: "1.5px solid #e2e8f0",
                            }}
                          >
                            <th
                              style={{
                                padding: "10px 16px",
                                fontWeight: "700",
                                color: "#475569",
                              }}
                            >
                              SIZE
                            </th>
                            <th
                              style={{
                                padding: "10px 16px",
                                fontWeight: "700",
                                color: "#475569",
                                textAlign: "right",
                              }}
                            >
                              WEIGHT (viss)
                            </th>
                            <th
                              style={{
                                padding: "10px 16px",
                                fontWeight: "700",
                                color: "#475569",
                                textAlign: "right",
                              }}
                            >
                              BUY PRICES
                            </th>
                            <th
                              style={{
                                padding: "10px 16px",
                                fontWeight: "700",
                                color: "#475569",
                                textAlign: "right",
                              }}
                            >
                              AMOUNT
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            {
                              label: "B",
                              w: calculations.wB,
                              price: record.priceBar,
                              amt: rowAmounts.amtB,
                            },
                            {
                              label: "28",
                              w: calculations.w28,
                              price: record.price28,
                              amt: rowAmounts.amt28,
                            },
                            {
                              label: "26",
                              w: calculations.w26,
                              price: record.price26,
                              amt: rowAmounts.amt26,
                            },
                            {
                              label: "24",
                              w: calculations.w24,
                              price: record.price24,
                              amt: rowAmounts.amt24,
                            },
                            {
                              label: "22",
                              w: calculations.w22,
                              price: record.price22,
                              amt: rowAmounts.amt22,
                            },
                            {
                              label: "20",
                              w: calculations.w20,
                              price: record.price20,
                              amt: rowAmounts.amt20,
                            },
                            {
                              label: "18",
                              w: calculations.w18,
                              price: record.price18,
                              amt: rowAmounts.amt18,
                            },
                            {
                              label: "16",
                              w: calculations.w16,
                              price: record.price16,
                              amt: rowAmounts.amt16,
                            },
                            {
                              label: "14",
                              w: calculations.w14,
                              price: record.price14,
                              amt: rowAmounts.amt14,
                            },
                            {
                              label: "12",
                              w: calculations.w12,
                              price: record.price12,
                              amt: rowAmounts.amt12,
                            },
                            {
                              label: "10B",
                              w: calculations.w10B,
                              price: record.price10B,
                              amt: rowAmounts.amt10B,
                            },
                            {
                              label: "10",
                              w: calculations.w10,
                              price: record.price10,
                              amt: rowAmounts.amt10,
                            },
                            {
                              label: "9",
                              w: calculations.w9,
                              price: record.price9,
                              amt: rowAmounts.amt9,
                            },
                            {
                              label: "8",
                              w: calculations.w8,
                              price: record.price8,
                              amt: rowAmounts.amt8,
                            },
                            {
                              label: "7",
                              w: calculations.w7,
                              price: record.price7,
                              amt: rowAmounts.amt7,
                            },
                            {
                              label: "6",
                              w: calculations.w6,
                              price: record.price6,
                              amt: rowAmounts.amt6,
                            },
                            {
                              label: "Return",
                              w: calculations.wLeftover,
                              price: record.priceReturnSize,
                              amt: rowAmounts.amtLeftover,
                            },
                            {
                              label: "Spoilage",
                              w: calculations.wSpoil,
                              price: record.priceSpoilageSize,
                              amt: rowAmounts.amtSpoil,
                            },
                            {
                              label: "Lost",
                              w: calculations.wLoss,
                              price: 0,
                              amt: 0,
                            },
                          ]
                            .filter((row) => row.w > 0)
                            .map((row, index) => {
                              return (
                                <tr
                                  key={row.label}
                                  style={{
                                    borderBottom: "1px solid #f1f5f9",
                                    background:
                                      index % 2 === 0 ? "white" : "#fdfdfd",
                                  }}
                                >
                                  <td
                                    style={{
                                      padding: "8px 16px",
                                      fontWeight: "700",
                                      color: "#1e293b",
                                    }}
                                  >
                                    {row.label}
                                  </td>
                                  <td
                                    style={{
                                      padding: "8px 16px",
                                      textAlign: "right",
                                      fontWeight: "500",
                                      color: "#475569",
                                    }}
                                  >
                                    {row.w.toFixed(3)}
                                  </td>
                                  <td
                                    style={{
                                      padding: "8px 16px",
                                      textAlign: "right",
                                      fontWeight: "600",
                                      color: "#0f172a",
                                    }}
                                  >
                                    {(row.price || 0).toLocaleString()}
                                  </td>
                                  <td
                                    style={{
                                      padding: "8px 16px",
                                      textAlign: "right",
                                      fontWeight: "700",
                                      color: "#0f172a",
                                    }}
                                  >
                                    {row.amt.toLocaleString()}
                                  </td>
                                </tr>
                              );
                            })}

                          {/* TOTAL ROW */}
                          <tr
                            style={{
                              background: "#f8fafc",
                              borderTop: "2px solid #cbd5e1",
                            }}
                          >
                            <td
                              style={{
                                padding: "10px 16px",
                                fontWeight: "800",
                                color: "#0f172a",
                              }}
                            >
                              TOTAL
                            </td>
                            <td
                              style={{
                                padding: "10px 16px",
                                textAlign: "right",
                                fontWeight: "800",
                                color: "#0f172a",
                              }}
                            >
                              {calculations.totalWeight.toFixed(3)}
                            </td>
                            <td style={{ padding: "10px 16px" }}></td>
                            <td
                              style={{
                                padding: "10px 16px",
                                textAlign: "right",
                                fontWeight: "800",
                                color: "#2563eb",
                              }}
                            >
                              {rowAmounts.totalAmount.toLocaleString()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Close/Cancel button */}
        {!isModal && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "24px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setSelectedMarker(null);
                setSelectedPurchaseGroupKey(null);
              }}
              className="btn btn-secondary"
              style={{
                padding: "10px 24px",
                borderRadius: "10px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Close Marker View
            </button>
          </div>
        )}

        {formError && (
          <p
            style={{
              color: "#ef4444",
              fontSize: "13px",
              fontWeight: 600,
              marginTop: "10px",
              textAlign: "center",
            }}
          >
            {formError}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="semiexport-container fade-in">
      {/* Hero Header */}
      <div className="semiexport-hero">
        <div className="semiexport-hero-left">
          <div className="semiexport-hero-icon">
            <TrendingUp size={30} strokeWidth={1.8} />
          </div>
          <div className="semiexport-hero-text">
            <h1>Semi Export</h1>
            <p>Manage export batches, worker fees, and price breakdowns</p>
          </div>
        </div>
        <div className="semiexport-hero-right">
          <div className="semiexport-stat-pill">
            <span className="stat-num">{savedExports.length}</span>
            <span className="stat-label">
              {savedExports.length === 1 ? "Record" : "Records"}
            </span>
          </div>
        </div>
      </div>

      <div className="semiexport-layout">
        {/* Left Sidebar: Single Double Drawn Sorting List */}
        <aside className="rf-sidebar">
          <div className="rf-sidebar-header">
            <Package size={18} />
            <span>Sorted Batches</span>
          </div>

          <div className="rf-search-box">
            <Search size={16} className="rf-search-icon" />
            <input
              type="text"
              className="rf-search-input"
              placeholder="Search marker, warehouse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="rf-card-list">
            {filteredGroupedRecords.length === 0 ? (
              <div className="rf-empty-sidebar">No sorted batches found</div>
            ) : (
              filteredGroupedRecords.map((group) => {
                if (group.source === "purchase") {
                  return (
                    <div
                      key={`purchase-${group.markerName}-${group.date}`}
                      className={`product-card ${
                        selectedPurchaseGroupKey === getPurchaseGroupKey(group)
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedPurchaseGroupKey(getPurchaseGroupKey(group));
                        setSelectedMarker(null);
                        setActiveTab("processing");
                      }}
                    >
                      <div className="card-header">
                        <div className="card-title-group">
                          <span className="card-marker">
                            {group.markerName}
                          </span>
                        </div>
                        <span className="card-source-badge source-purchase">
                          Purchase
                        </span>
                      </div>

                      <div className="card-stats">
                        <div className="card-stat card-stat-output">
                          <span className="card-stat-label">
                            <Scale size={11} strokeWidth={2.2} />
                            Sorted
                          </span>
                          <span className="card-stat-value">
                            {group.combinedWeight.toFixed(3)}
                            <em>viss</em>
                          </span>
                        </div>
                        <div className="card-stat card-stat-lost">
                          <span className="card-stat-label">
                            <AlertTriangle size={11} strokeWidth={2.2} />
                            Lost
                          </span>
                          <span className="card-stat-value">
                            {(group.lostWeight || 0).toFixed(3)}
                            <em>viss</em>
                          </span>
                        </div>
                      </div>

                      <div className="card-footer">
                        <span className="card-date">
                          <Clock size={11} strokeWidth={2.2} />
                          {new Date(group.date).toLocaleDateString()}
                        </span>
                        <div className="card-tags">
                          {(group.colors || []).map((color) => (
                            <span key={color} className="rf-badge">
                              {color}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                const savedCount = group.records.filter((r) =>
                  savedExports.some(
                    (x) => x.singleDoubleDrawnRecordId === r.id,
                  ),
                ).length;
                const isFullySaved = savedCount === group.records.length;
                const isPartiallySaved =
                  savedCount > 0 && savedCount < group.records.length;

                return (
                  <div
                    key={group.markerName}
                    className={`product-card ${selectedMarker === group.markerName ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedPurchaseGroupKey(null);
                      setSelectedMarker(group.markerName);
                      setActiveTab("processing");
                    }}
                  >
                    <div className="card-header">
                      <div className="card-title-group">
                        <span className="card-marker">{group.markerName}</span>
                        <span className="card-warehouse">
                          <Package size={11} strokeWidth={2} />
                          {group.warehouseNames.join(", ") || "---"}
                        </span>
                      </div>
                      {isFullySaved && (
                        <span className="card-status-badge status-saved">
                          <CheckCircle size={11} /> Saved
                        </span>
                      )}
                      {isPartiallySaved && (
                        <span className="card-status-badge status-partial">
                          {savedCount}/{group.records.length} Saved
                        </span>
                      )}
                    </div>

                    <div className="card-stats">
                      <div className="card-stat card-stat-output">
                        <span className="card-stat-label">
                          <Scale size={11} strokeWidth={2.2} />
                          Total Sorted
                        </span>
                        <span className="card-stat-value">
                          {group.combinedWeight.toFixed(3)}
                          <em>viss</em>
                        </span>
                      </div>
                      <div className="card-stat card-stat-count">
                        <span className="card-stat-label">
                          <Layers size={11} strokeWidth={2.2} />
                          Items
                        </span>
                        <span className="card-stat-value">
                          {group.records.length}
                        </span>
                      </div>
                    </div>

                    <div className="card-footer">
                      <span className="card-date">
                        <Clock size={11} strokeWidth={2.2} />
                        {new Date(group.date).toLocaleDateString()}
                      </span>
                      <div className="card-tags">
                        {group.records.map((r) => (
                          <span
                            key={r.id}
                            className={`rf-badge category-${(r.refinementRecordCategory || "").toLowerCase().replace(".", "")}`}
                          >
                            {r.refinementRecordCategory}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Main Content */}
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
                    <span className="rf-tab-sub">Sales Calculations</span>
                  </button>
                  <button
                    className={`rf-tab ${activeTab === "history" ? "rf-tab-active" : ""}`}
                    onClick={() => setActiveTab("history")}
                  >
                    <span className="rf-tab-title">History</span>
                    <span className="rf-tab-sub">
                      {selectedMarker ? "Batch History" : "Global History"}
                    </span>
                  </button>
                </div>
              </div>
              <div
                className="rf-header-right"
                style={{ display: "flex", gap: "12px" }}
              >
                {hasPermission("SemiExport.Create") && (
                  <button
                    onClick={() => setShowLedgerModal(true)}
                    className="btn btn-primary"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "11px 22px",
                      borderRadius: "10px",
                      fontSize: "15px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    <FilePlus size={20} />
                    Create Ledger
                  </button>
                )}
              </div>
            </div>

            {activeTab === "processing" ? (
              selectedPurchaseGroup ? (
                renderPurchaseGroupDetails()
              ) : selectedMarker && selectedRecords.length > 0 ? (
                renderMarkerDetails(false)
              ) : (
                // Placeholder when no selection
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                    padding: "40px 20px",
                    background: "#f8fafc",
                    borderRadius: "16px",
                    border: "2px dashed #e2e8f0",
                  }}
                >
                  <Sparkles
                    size={40}
                    style={{ color: "#cbd5e1", marginBottom: "12px" }}
                  />
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: "#64748b",
                      margin: "0 0 4px 0",
                    }}
                  >
                    No Selection
                  </h3>
                  <p style={{ fontSize: "13.0px", margin: 0 }}>
                    Select a sorted batch from the sidebar to calculate pricing
                    and amounts.
                  </p>
                </div>
              )
            ) : (
              <div className="ledger-history-tab">
                <div className="rf-table-wrap">
                  <table className="rf-table">
                    <thead>
                      <tr>
                        <th>Sorted Batch</th>
                        <th>Export Date</th>
                        <th className="rf-th-right">Worker Fees</th>
                        <th className="rf-th-right">Total Amount</th>
                        <th>Remark</th>
                        <th style={{ textAlign: "center" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="rf-empty-row">
                            <Package
                              size={44}
                              className="rf-empty-icon"
                              style={{
                                opacity: 0.2,
                                margin: "0 auto 12px",
                                display: "block",
                              }}
                            />
                            <span>No export history recorded</span>
                          </td>
                        </tr>
                      ) : (
                        filteredHistory.map((group: any) => {
                          return (
                            <tr
                              key={group.marker}
                              style={{
                                borderBottom: "1px solid #f1f5f9",
                                cursor: "pointer",
                              }}
                              onClick={() => {
                                setPrevSelectedMarker(selectedMarker);
                                setSelectedMarker(group.marker);
                                setShowHistoryModal(true);
                              }}
                            >
                              <td
                                style={{
                                  padding: "12px 16px",
                                  fontWeight: "600",
                                  color: "#334155",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "13.5px",
                                      color: "#0f172a",
                                      fontWeight: "700",
                                    }}
                                  >
                                    {group.marker}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      color: "#64748b",
                                      fontWeight: 500,
                                      marginTop: "2px",
                                    }}
                                  >
                                    {Array.from(group.warehouseNames).join(
                                      ", ",
                                    ) || "---"}{" "}
                                    •{" "}
                                    {Array.from(group.categories).join(", ") ||
                                      "---"}
                                  </span>
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: "12px 16px",
                                  whiteSpace: "nowrap",
                                  fontWeight: "500",
                                  color: "#0f172a",
                                }}
                              >
                                {formatDateTime(group.latestDate)}
                              </td>
                              <td
                                className="rf-th-right"
                                style={{
                                  padding: "12px 16px",
                                  fontWeight: "600",
                                  color: "#6366f1",
                                }}
                              >
                                {(group.totalWorkerFees || 0).toLocaleString()}{" "}
                                MMK
                              </td>
                              <td
                                className="rf-th-right"
                                style={{
                                  padding: "12px 16px",
                                  fontWeight: "700",
                                  color: "#10b981",
                                }}
                              >
                                {(
                                  group.totalAmountMMK + group.totalWorkerFees
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                MMK
                              </td>
                              <td
                                style={{
                                  padding: "12px 16px",
                                  color: "#475569",
                                  fontSize: "13px",
                                  maxWidth: "200px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={group.remark}
                              >
                                {group.remark || "—"}
                              </td>
                              <td
                                style={{
                                  padding: "12px 16px",
                                  textAlign: "center",
                                }}
                              >
                                {hasPermission("SemiExport.Delete") && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteExport(group.ids);
                                    }}
                                    className="btn btn-danger"
                                    style={{
                                      padding: "6px 10px",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* History Detail Modal */}
      {showHistoryModal && selectedMarker && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
            padding: "20px",
          }}
          onClick={closeHistoryModal}
        >
          <div
            style={{
              width: "1200px",
              maxWidth: "95vw",
              maxHeight: "90vh",
              backgroundColor: "white",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "2px solid #f1f5f9",
                paddingBottom: "16px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <Clock size={24} style={{ color: "#2563eb" }} />
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: "800",
                      color: "#0f172a",
                    }}
                  >
                    Export History Detail
                  </h2>
                  <p
                    style={{
                      margin: "2px 0 0 0",
                      fontSize: "13px",
                      color: "#64748b",
                    }}
                  >
                    Marker: <strong>{selectedMarker}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={closeHistoryModal}
                style={{
                  padding: "8px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "#f1f5f9",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                paddingRight: "4px",
              }}
            >
              {renderMarkerDetails(true)}
            </div>
          </div>
        </div>
      )}

      {/* Create Ledger Modal */}
      {showLedgerModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowLedgerModal(false)}
        >
          <div
            style={{
              width: "500px",
              maxHeight: "80vh",
              backgroundColor: "white",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: "800",
                  color: "#0f172a",
                }}
              >
                Create Ledger
              </h2>
              <button
                onClick={() => setShowLedgerModal(false)}
                style={{
                  padding: "8px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "#f1f5f9",
                  cursor: "pointer",
                }}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
              Markers with zero remaining unsorted weight.
            </p>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#475569",
                  }}
                >
                  LEDGER NAME <span style={{ color: "#ef4444" }}>*</span>:
                </label>
                <input
                  type="text"
                  value={ledgerName}
                  onChange={(e) => setLedgerName(e.target.value)}
                  placeholder="e.g. June 2026 Export Ledger"
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#475569",
                  }}
                >
                  LEDGER DATE:
                </label>
                <input
                  type="date"
                  value={ledgerDate}
                  onChange={(e) => setLedgerDate(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#475569",
                  }}
                >
                  DESCRIPTION / REMARK:
                </label>
                <textarea
                  value={ledgerDescription}
                  onChange={(e) => setLedgerDescription(e.target.value)}
                  placeholder="Enter ledger description..."
                  rows={2}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                padding: "4px",
              }}
            >
              {completedMarkers.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#94a3b8",
                  }}
                >
                  No completed markers available.
                </div>
              ) : (
                completedMarkers.map((group) => (
                  <label
                    key={getPurchaseGroupKey(group)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      border: "1.5px solid #e2e8f0",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      backgroundColor: selectedLedgerMarkers.includes(
                        group.markerName,
                      )
                        ? "#f0f9ff"
                        : "white",
                      borderColor: selectedLedgerMarkers.includes(
                        group.markerName,
                      )
                        ? "#2563eb"
                        : "#e2e8f0",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedLedgerMarkers.includes(group.markerName)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLedgerMarkers([
                            ...selectedLedgerMarkers,
                            group.markerName,
                          ]);
                        } else {
                          setSelectedLedgerMarkers(
                            selectedLedgerMarkers.filter(
                              (m) => m !== group.markerName,
                            ),
                          );
                        }
                      }}
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "4px",
                        border: "1.5px solid #cbd5e1",
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: "700", color: "#0f172a" }}>
                        {group.markerName}
                      </span>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        {group.source === "purchase"
                          ? `Purchase - ${(group.customerNames || []).join(", ") || "---"} - ${(group.colors || []).join(", ") || "---"}`
                          : group.warehouseNames.join(", ") || "---"}
                      </span>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {formError && (
                <div
                  style={{
                    color: "#dc2626",
                    background: "#fef2f2",
                    padding: "10px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    border: "1px solid #f87171",
                    textAlign: "center",
                  }}
                >
                  {formError}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                }}
              >
                <button
                  onClick={() => {
                    setShowLedgerModal(false);
                    setFormError("");
                  }}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "10px",
                    border: "1.5px solid #e2e8f0",
                    backgroundColor: "white",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={
                    selectedLedgerMarkers.length === 0 ||
                    !ledgerName.trim() ||
                    saving
                  }
                  style={{
                    padding: "10px 24px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor:
                      selectedLedgerMarkers.length === 0 ||
                      !ledgerName.trim() ||
                      saving
                        ? "#94a3b8"
                        : "#0f172a",
                    color: "white",
                    fontWeight: "700",
                    cursor:
                      selectedLedgerMarkers.length === 0 ||
                      !ledgerName.trim() ||
                      saving
                        ? "not-allowed"
                        : "pointer",
                    boxShadow: "0 4px 6px -1px rgba(15, 23, 42, 0.2)",
                  }}
                  onClick={handleSubmitLedger}
                >
                  {saving
                    ? "Generating..."
                    : `Generate Ledger (${selectedLedgerMarkers.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SemiExport;
