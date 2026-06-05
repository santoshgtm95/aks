import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  singleDoubleDrawnAPI,
  semiExportAPI,
  productsAPI,
  salesAPI,
  ledgerAPI,
  exchangeRatesAPI,
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
} from "lucide-react";
import { formatDateTime } from "../../utils/format";
import "./index.css";

interface GroupedMarker {
  markerName: string;
  records: SingleDoubleDrawnRecord[];
  combinedWeight: number;
  date: string;
  warehouseNames: string[];
}

const SemiExport: React.FC = () => {
  const { hasPermission } = useAuth();
  const [sddRecords, setSddRecords] = useState<SingleDoubleDrawnRecord[]>([]);
  const [savedExports, setSavedExports] = useState<SemiExportRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [ledgers, setLedgers] = useState<LedgerDto[]>([]);
  const [activeRates, setActiveRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [markerWorkerFees, setMarkerWorkerFees] = useState<string>("0");
  const [markerRemark, setMarkerRemark] = useState<string>("");
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
  const [prevSelectedMarker, setPrevSelectedMarker] = useState<string | null>(
    null,
  );

  const [expandedRecords, setExpandedRecords] = useState<
    Record<number, boolean>
  >({});

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
      let commonRemark = "";

      selectedRecords.forEach((record) => {
        const saved = savedExports.find(
          (x) => x.singleDoubleDrawnRecordId === record.id,
        );
        if (saved) {
          totalFees += saved.workerFees || 0;
          if (saved.remark && !commonRemark) {
            commonRemark = saved.remark;
          }
        }
        newExpanded[record.id] = false;
      });

      setMarkerWorkerFees(totalFees.toString());
      setMarkerRemark(commonRemark);
      setExpandedRecords(newExpanded);
    } else {
      setMarkerWorkerFees("0");
      setMarkerRemark("");
      setExpandedRecords({});
    }
  }, [selectedMarker, selectedRecords, savedExports]);

  // Calculate the total sorted weights for sidebar display (Export sizes: 10B to Bar)
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
    return Object.values(groups);
  }, [sddRecords, ledgers]);

  const completedMarkers = useMemo(() => {
    return groupedRecords.filter((group) => {
      const marker = group.markerName;

      // Check if all records of this group are saved in SemiExportRecords
      const allRecordsSaved = group.records.every((record) =>
        savedExports.some((x) => x.singleDoubleDrawnRecordId === record.id)
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

      const sumLostWeight = group.records.reduce(
        (sum, r) => sum + (r.lostWeight || 0),
        0,
      );

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
      const dateStr = g.date
        ? new Date(g.date).toLocaleDateString().toLowerCase()
        : "";
      const categories = g.records
        .map((r) => (r.refinementRecordCategory || "").toLowerCase())
        .join(" ");

      return (
        marker.includes(search) ||
        warehouses.includes(search) ||
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

  const loadData = async () => {
    try {
      const [
        sddData,
        exportData,
        productsData,
        salesData,
        ledgerData,
        ratesData,
      ] = await Promise.all([
        singleDoubleDrawnAPI.getAll(),
        semiExportAPI.getAll(),
        productsAPI.getAll(true),
        salesAPI.getAll("Sales"),
        ledgerAPI.getAll(),
        exchangeRatesAPI.getActive(),
      ]);
      setSddRecords(sddData);
      setSavedExports(exportData);
      setProducts(productsData);
      setSales(salesData);
      setLedgers(ledgerData);
      setActiveRates(ratesData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const cnyToMmkRate = useMemo(() => {
    const rateObj = activeRates.find(
      (r) => r.fromCurrency === "CNY" && r.toCurrency === "MMK",
    );
    return rateObj ? rateObj.rate : null;
  }, [activeRates]);

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
    const sumLostWeight = selectedRecords.reduce(
      (sum, r) => sum + (r.lostWeight || 0),
      0,
    );

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

      let rowAmount = 0;
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

        rowAmount =
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

      if (!groups[marker]) {
        groups[marker] = {
          marker,
          warehouseNames: new Set(),
          categories: new Set(),
          totalAmount: 0,
          totalWorkerFees: 0,
          latestDate: record.date,
          remark: record.remark,
          ids: [],
        };
      }

      groups[marker].totalAmount += rowAmount;
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
  }, [savedExports, sddRecords]);

  const filteredHistory = useMemo(() => {
    if (selectedMarker) {
      return groupedHistory.filter((g: any) => g.marker === selectedMarker);
    }
    return groupedHistory;
  }, [groupedHistory, selectedMarker]);

  const markerTotalAmount = useMemo(() => {
    const sumRecords = Object.values(recordAmounts).reduce(
      (sum, r: any) => sum + (r.totalAmount || 0),
      0,
    );
    return sumRecords;
  }, [recordAmounts]);

  const markerTotalAmountMmk = useMemo(() => {
    const fees = parseFloat(markerWorkerFees) || 0;
    if (cnyToMmkRate !== null) {
      return markerTotalAmount * cnyToMmkRate + fees;
    }
    return null;
  }, [markerTotalAmount, cnyToMmkRate, markerWorkerFees]);

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
      const activeCnyRateId = activeRates.find(
        (r) => r.fromCurrency === "CNY" && r.toCurrency === "MMK"
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

  const renderMarkerDetails = (isModal = false) => {
    if (!selectedMarker || selectedRecords.length === 0 || !selectedMarkerStats) {
      return null;
    }
    return (
      <div
        style={{ display: "flex", flexDirection: "column", height: "100%", gap: "24px" }}
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
            <Sparkles size={18} color="#2563eb" /> Record Sales Details for Marker
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
                  WORKER FEES (SUM):
                </span>
              </div>
              <input
                type="number"
                value={markerWorkerFees}
                onChange={(e) => setMarkerWorkerFees(e.target.value)}
                placeholder="0.00"
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
                placeholder={isModal ? "No remark" : "Enter remark for this marker..."}
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

            {!isModal && (
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
            {cnyToMmkRate !== null && (
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
                    {(markerTotalAmount * cnyToMmkRate).toLocaleString(
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

              {cnyToMmkRate !== null && (
                <div
                  style={{
                    fontSize: "10px",
                    color: "#94a3b8",
                    marginTop: "2px",
                  }}
                >
                  (Rate: 1 CNY = {cnyToMmkRate.toLocaleString()} MMK +{" "}
                  {(parseFloat(markerWorkerFees) || 0).toLocaleString()} MMK Worker
                  Fees)
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
                    color:
                      financialComparison.pnl <= 0
                        ? "#059669"
                        : "#dc2626",
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
                      MMK
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
                              label: "Leftover",
                              w: calculations.wLeftover,
                              price: record.priceReturnSize,
                              amt: rowAmounts.amtLeftover,
                            },
                            {
                              label: "Spoil",
                              w: calculations.wSpoil,
                              price: record.priceSpoilageSize,
                              amt: rowAmounts.amtSpoil,
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
              onClick={() => setSelectedMarker(null)}
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
    <div className="rf-container fade-in">
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
              const savedCount = group.records.filter((r) =>
                savedExports.some((x) => x.singleDoubleDrawnRecordId === r.id),
              ).length;
              const isFullySaved = savedCount === group.records.length;
              const isPartiallySaved =
                savedCount > 0 && savedCount < group.records.length;

              return (
                <div
                  key={group.markerName}
                  className={`product-card ${selectedMarker === group.markerName ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedMarker(group.markerName);
                    setActiveTab("processing");
                  }}
                >
                  <div className="card-header">
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span className="card-marker">{group.markerName}</span>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
                          fontWeight: 500,
                          marginTop: "2px",
                        }}
                      >
                        {group.warehouseNames.join(", ") || "---"}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        alignItems: "center",
                      }}
                    >
                      {isFullySaved && (
                        <span
                          style={{
                            background: "#d1fae5",
                            color: "#065f46",
                            fontSize: "10.0px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          <CheckCircle size={10} /> Saved
                        </span>
                      )}
                      {isPartiallySaved && (
                        <span
                          style={{
                            background: "#fef3c7",
                            color: "#92400e",
                            fontSize: "10.0px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          Saved ({savedCount}/{group.records.length})
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className="card-details"
                    style={{ flexDirection: "column", gap: "4px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>
                        Total Sorted:{" "}
                        <strong style={{ color: "#059669" }}>
                          {group.combinedWeight.toFixed(3)}
                        </strong>{" "}
                        viss
                      </span>
                      <span>
                        Date:{" "}
                        <span style={{ color: "#475569", fontWeight: 500 }}>
                          {new Date(group.date).toLocaleDateString()}
                        </span>
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "4px",
                        flexWrap: "wrap",
                        marginTop: "4px",
                      }}
                    >
                      {group.records.map((r) => (
                        <span
                          key={r.id}
                          className={`rf-badge category-${(r.refinementRecordCategory || "").toLowerCase().replace(".", "")}`}
                          style={{ fontSize: "9px", padding: "1px 4px" }}
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

        <div style={{ marginTop: "auto", paddingTop: "12px" }}>
          <button
            onClick={() => setShowLedgerModal(true)}
            className="btn btn-primary"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)",
            }}
          >
            <FilePlus size={18} />
            Create Ledger
          </button>
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
          </div>

          {activeTab === "processing" ? (
            selectedMarker && selectedRecords.length > 0 ? (
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
              Select a sorted batch from the sidebar to calculate pricing and
              amounts.
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
                        style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
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
                            group.totalAmount + group.totalWorkerFees
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
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
                  <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>
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
                    key={group.markerName}
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
                        {group.warehouseNames.join(", ") || "---"}
                      </span>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <button
                onClick={() => setShowLedgerModal(false)}
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
      )}
    </div>
  );
};

export default SemiExport;
