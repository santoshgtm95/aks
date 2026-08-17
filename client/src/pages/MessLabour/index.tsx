import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { washGradingAPI, workersAPI, processingAPI } from "../../services/api";
import { useLongPoll } from "../../hooks/useLongPoll";
import type {
  WashGradingRecord,
  MessLabourWorker,
  ProcessingRecord,
  CreateProcessingRecordDto,
} from "../../types";
import {
  Package,
  Users,
  Calculator,
  ArrowRight,
  Scissors,
  Pencil,
  Trash2,
  X,
  Save,
  Search,
  AlertCircle,
} from "lucide-react";
import { combineDateWithMyanmarTime, formatDateTime } from "../../utils/format";
import { useNotification } from "../../context/NotificationContext";
import "./index.css";

const MessLabour: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showAlert, showConfirm } = useNotification();
  const [washRecords, setWashRecords] = useState<WashGradingRecord[]>([]);
  const [workers, setWorkers] = useState<MessLabourWorker[]>([]);
  const [records, setRecords] = useState<ProcessingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWashRecordId, setSelectedWashRecordId] = useState<
    number | null
  >(null);
  const [selectedWorkers, setSelectedWorkers] = useState<
    { messLabourWorkerId: number; workerFee: number }[]
  >([]);

  const [activeTab, setActiveTab] = useState<"processing" | "history">(
    "processing",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historyFromDate, setHistoryFromDate] = useState("");
  const [historyToDate, setHistoryToDate] = useState("");

  const filteredWashRecords = useMemo(() => {
    return washRecords.filter((record) => {
      // Don't show records with no remaining weight
      if (record.remainingWeight <= 0.0001) {
        return false;
      }
      return (
        record.productMarker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.warehouseName || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    });
  }, [washRecords, searchTerm]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const term = historySearchTerm.toLowerCase();
      const marker = r.productMarker || "";
      const workerNames = r.workerNames || "";
      if (
        !marker.toLowerCase().includes(term) &&
        !workerNames.toLowerCase().includes(term)
      )
        return false;
      if (historyFromDate) {
        const d = new Date((r.date || "").split("T")[0]);
        if (d < new Date(historyFromDate)) return false;
      }
      if (historyToDate) {
        const d = new Date((r.date || "").split("T")[0]);
        if (d > new Date(historyToDate)) return false;
      }
      return true;
    });
  }, [records, historySearchTerm, historyFromDate, historyToDate]);

  // Edit/View modal state
  const [editingRecord, setEditingRecord] = useState<ProcessingRecord | null>(
    null,
  );
  const [viewingRecord, setViewingRecord] = useState<ProcessingRecord | null>(
    null,
  );
  const [editFormData, setEditFormData] = useState({
    workers: [] as { messLabourWorkerId: number; workerFee: number }[],
    workerNames: "",
    red: 0,
    white: 0,
    natural: 0,
    naturalWhite: 0,
    artificial: 0,
    regular: 0,
    black: 0,
    regularExtra: 0,
    blackExtra: 0,
    whiteExtra: 0,
    naturalWhiteExtra: 0,
    offCuts: 0,
    reclaimed: 0,
    fluff: 0,
    lossWeight: 0,
  });

  const [formData, setFormData] = useState({
    count: "0",
    unitWeight: "0.05",
    red: "",
    white: "",
    natural: "",
    naturalWhite: "",
    artificial: "",
    regular: "",
    black: "",
    regularExtra: "",
    blackExtra: "",
    whiteExtra: "",
    naturalWhiteExtra: "",
    offCuts: "",
    reclaimed: "",
    fluff: "",
    lossWeight: "",
  });

  const selectedWashRecord = useMemo(
    () => washRecords.find((r) => r.id === selectedWashRecordId),
    [washRecords, selectedWashRecordId],
  );

  useEffect(() => {
    loadData();
  }, []);

  // Auto-calculate total count from remaining weight (always viss) and unit weight
  useEffect(() => {
    if (selectedWashRecord && Number(formData.unitWeight) > 0) {
      // WashGradingRecord.remainingWeight is always in viss
      const rwViss = selectedWashRecord.remainingWeight;
      const calcCount = Number(
        (rwViss / Number(formData.unitWeight)).toFixed(4),
      );
      setFormData((prev) => ({ ...prev, count: calcCount.toString() }));
    } else {
      setFormData((prev) => ({ ...prev, count: "0" }));
    }
  }, [selectedWashRecord, formData.unitWeight]);

  // Clamping categories if total count decreases (e.g. due to loss increase)
  useEffect(() => {
    const totalCount = Number(formData.count) || 0;
    const categoryFields: (keyof typeof formData)[] = [
      "red",
      "white",
      "natural",
      "naturalWhite",
      "artificial",
      "regular",
      "black",
      "regularExtra",
      "blackExtra",
      "whiteExtra",
      "naturalWhiteExtra",
      "offCuts",
      "reclaimed",
      "fluff",
    ];

    let currentSum = 0;
    let needsUpdate = false;
    const newFormData = { ...formData };

    for (const field of categoryFields) {
      let val = Number(newFormData[field]) || 0;
      if (currentSum + val > totalCount) {
        val = Math.max(0, totalCount - currentSum);
        newFormData[field] = val.toString();
        needsUpdate = true;
      }
      currentSum += val;
    }

    if (needsUpdate) {
      setFormData(newFormData);
    }
  }, [formData.count]);

  const loadData = useCallback(async () => {
    try {
      const [washData, workersData, recordsData] = await Promise.all([
        washGradingAPI.getAvailableForMessLabour(),
        workersAPI.getMessLabourWorkers(),
        processingAPI.getAll(),
      ]);
      setWashRecords(washData);
      setWorkers(workersData);
      setRecords(recordsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useLongPoll(loadData);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const categoryFields = [
      "red",
      "white",
      "natural",
      "naturalWhite",
      "artificial",
      "regular",
      "black",
      "regularExtra",
      "blackExtra",
      "whiteExtra",
      "naturalWhiteExtra",
      "offCuts",
      "reclaimed",
      "fluff",
    ];

    if (categoryFields.includes(name)) {
      const numValue = value === "" ? 0 : parseFloat(value);
      const maxValStr = getFieldMax(name as any);
      if (maxValStr) {
        const maxVal = parseFloat(maxValStr);
        if (!isNaN(numValue) && numValue > maxVal) {
          setFormData((prev) => ({ ...prev, [name]: maxVal.toString() }));
          return;
        }
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleWeightInputChange = (name: string, weightVal: string) => {
    const uw = Number(formData.unitWeight) || 0;
    if (uw <= 0) return;

    if (weightVal === "") {
      setFormData((prev) => ({
        ...prev,
        [name]: "",
      }));
      return;
    }

    const weight = parseFloat(weightVal);
    if (!isNaN(weight)) {
      let calculatedCount = weight / uw;
      const maxValStr = getFieldMax(name as any);
      if (maxValStr) {
        const maxVal = parseFloat(maxValStr);
        if (calculatedCount > maxVal) {
          calculatedCount = maxVal;
        }
      }
      setFormData((prev) => ({
        ...prev,
        [name]: calculatedCount.toString(),
      }));
    }
  };

  const getFieldMax = (fieldName: keyof typeof formData) => {
    if (!selectedWashRecord || !formData.unitWeight) return undefined;
    const uw = Number(formData.unitWeight) || 0;

    if (uw <= 0) return undefined;

    const categoryFields: (keyof typeof formData)[] = [
      "red",
      "white",
      "natural",
      "naturalWhite",
      "artificial",
      "regular",
      "black",
      "regularExtra",
      "blackExtra",
      "whiteExtra",
      "naturalWhiteExtra",
      "offCuts",
      "reclaimed",
      "fluff",
    ];

    if (categoryFields.includes(fieldName)) {
      const totalCount = Number(formData.count) || 0;
      const otherCategoriesSum = categoryFields
        .filter((f) => f !== fieldName)
        .reduce((sum, f) => sum + (Number(formData[f]) || 0), 0);
      return Math.max(0, totalCount - otherCategoriesSum).toString();
    }

    const currentVal = Number(formData[fieldName]) || 0;
    return Math.ceil((currentVal * uw + totals.diff) / uw).toString();
  };

  // Count is now in formData

  const totals = useMemo(() => {
    const uw = Number(formData.unitWeight) || 0;

    // WashGradingRecord.remainingWeight is always in viss
    const rwViss = selectedWashRecord ? selectedWashRecord.remainingWeight : 0;

    const totalPackages = Number(formData.count) || 0;
    const totalWeightFromCount = totalPackages * uw;

    const redWeight = Number(formData.red) * uw;
    const whiteWeight = Number(formData.white) * uw;
    const naturalWeight = Number(formData.natural) * uw;
    const naturalWhiteWeight = Number(formData.naturalWhite) * uw;
    const artificialWeight = Number(formData.artificial) * uw;
    const regularWeight = Number(formData.regular) * uw;
    const blackWeight = Number(formData.black) * uw;
    const regularExtraWeight = Number(formData.regularExtra) * uw;
    const blackExtraWeight = Number(formData.blackExtra) * uw;
    const whiteExtraWeight = Number(formData.whiteExtra) * uw;
    const naturalWhiteExtraWeight = Number(formData.naturalWhiteExtra) * uw;
    const offCutsWeight = Number(formData.offCuts) * uw;
    const reclaimedWeight = Number(formData.reclaimed) * uw;
    const fluffWeight = Number(formData.fluff) * uw;
    const lossWeight = Number(formData.lossWeight) || 0;

    const categorizedWeight =
      redWeight +
      whiteWeight +
      naturalWeight +
      naturalWhiteWeight +
      artificialWeight +
      regularWeight +
      blackWeight +
      regularExtraWeight +
      blackExtraWeight +
      whiteExtraWeight +
      naturalWhiteExtraWeight +
      offCutsWeight +
      reclaimedWeight +
      fluffWeight +
      lossWeight;
    const remainingWeight = rwViss - categorizedWeight;

    const total = totalWeightFromCount;
    const diff = selectedWashRecord ? rwViss - total : 0;

    const catSum =
      Number(formData.red) +
      Number(formData.white) +
      Number(formData.natural) +
      Number(formData.naturalWhite) +
      Number(formData.artificial) +
      Number(formData.regular) +
      Number(formData.black) +
      Number(formData.regularExtra) +
      Number(formData.blackExtra) +
      Number(formData.whiteExtra) +
      Number(formData.naturalWhiteExtra) +
      Number(formData.offCuts) +
      Number(formData.reclaimed) +
      Number(formData.fluff);

    return {
      rwViss,
      normalWeight: totalWeightFromCount,
      redWeight,
      whiteWeight,
      naturalWeight,
      naturalWhiteWeight,
      artificialWeight,
      regularWeight,
      blackWeight,
      regularExtraWeight,
      blackExtraWeight,
      whiteExtraWeight,
      naturalWhiteExtraWeight,
      offCutsWeight,
      reclaimedWeight,
      fluffWeight,
      lossWeight,
      categorizedWeight,
      remainingWeight,
      total,
      diff,
      catSum,
      remainingCount: uw > 0 ? Math.max(0, remainingWeight / uw) : 0,
    };
  }, [formData, selectedWashRecord]);

  // ─── Edit record helpers ───────────────────────────────────────────────────

  const openEditModal = (record: ProcessingRecord) => {
    setEditingRecord(record);
    const uw = record.unitWeight;
    setEditFormData({
      workers:
        record.workers?.map((w) => ({
          messLabourWorkerId: w.messLabourWorkerId,
          workerFee: w.workerFee,
        })) || [],
      workerNames: record.workerNames,
      red: uw > 0 ? Math.round(record.redWeight / uw) : 0,
      white: uw > 0 ? Math.round(record.whiteWeight / uw) : 0,
      natural: uw > 0 ? Math.round(record.naturalWeight / uw) : 0,
      naturalWhite: uw > 0 ? Math.round(record.naturalWhiteWeight / uw) : 0,
      artificial: uw > 0 ? Math.round(record.artificialWeight / uw) : 0,
      regular: uw > 0 ? Math.round(record.regularWeight / uw) : 0,
      black: uw > 0 ? Math.round(record.blackWeight / uw) : 0,
      regularExtra: uw > 0 ? Math.round(record.regularExtraWeight / uw) : 0,
      blackExtra: uw > 0 ? Math.round(record.blackExtraWeight / uw) : 0,
      whiteExtra: uw > 0 ? Math.round(record.whiteExtraWeight / uw) : 0,
      naturalWhiteExtra:
        uw > 0 ? Math.round(record.naturalWhiteExtraWeight / uw) : 0,
      offCuts: uw > 0 ? Math.round(record.offCutsWeight / uw) : 0,
      reclaimed: uw > 0 ? Math.round(record.reclaimedWeight / uw) : 0,
      fluff: uw > 0 ? Math.round(record.fluffWeight / uw) : 0,
      lossWeight: record.lossWeight,
    });
  };

  const getOriginalTotalCount = (record: ProcessingRecord) => {
    const uw = record.unitWeight || 1;
    const origCatSum =
      Math.round(record.redWeight / uw) +
      Math.round(record.whiteWeight / uw) +
      Math.round(record.naturalWeight / uw) +
      Math.round(record.naturalWhiteWeight / uw) +
      Math.round(record.artificialWeight / uw) +
      Math.round(record.regularWeight / uw) +
      Math.round(record.blackWeight / uw) +
      Math.round(record.regularExtraWeight / uw) +
      Math.round(record.blackExtraWeight / uw) +
      Math.round(record.whiteExtraWeight / uw) +
      Math.round(record.naturalWhiteExtraWeight / uw) +
      Math.round(record.offCutsWeight / uw) +
      Math.round(record.reclaimedWeight / uw) +
      Math.round(record.fluffWeight / uw);

    const hasCategoryCounts =
      record.redCount > 0 ||
      record.whiteCount > 0 ||
      record.naturalCount > 0 ||
      record.naturalWhiteCount > 0 ||
      record.artificialCount > 0 ||
      record.regularCount > 0 ||
      record.blackCount > 0 ||
      record.regularExtraCount > 0 ||
      record.blackExtraCount > 0 ||
      record.whiteExtraCount > 0 ||
      record.naturalWhiteExtraCount > 0 ||
      record.offCutsCount > 0 ||
      record.reclaimedCount > 0 ||
      record.fluffCount > 0;

    const hasCategoryWeights = origCatSum > 0;
    const isNewRecord =
      (record.remainingCount !== undefined && record.remainingCount > 0) ||
      hasCategoryCounts ||
      !hasCategoryWeights;

    return isNewRecord ? record.count : record.count + origCatSum;
  };

  const getEditFieldMax = (fieldName: keyof typeof editFormData) => {
    if (!editingRecord) return undefined;

    const origTotal = getOriginalTotalCount(editingRecord);

    const categoryFields: (keyof typeof editFormData)[] = [
      "red",
      "white",
      "natural",
      "naturalWhite",
      "artificial",
      "regular",
      "black",
      "regularExtra",
      "blackExtra",
      "whiteExtra",
      "naturalWhiteExtra",
      "offCuts",
      "reclaimed",
      "fluff",
    ];

    if (categoryFields.includes(fieldName)) {
      const otherCategoriesSum = categoryFields
        .filter((f) => f !== fieldName)
        .reduce((sum, f) => sum + (Number(editFormData[f]) || 0), 0);

      return Math.max(0, origTotal - otherCategoriesSum).toString();
    }

    return undefined;
  };

  const closeEditModal = () => {
    setEditingRecord(null);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let numValue = value === "" ? 0 : parseFloat(value);

    const categoryFields = [
      "red",
      "white",
      "natural",
      "naturalWhite",
      "artificial",
      "regular",
      "black",
      "regularExtra",
      "blackExtra",
      "whiteExtra",
      "naturalWhiteExtra",
      "offCuts",
      "reclaimed",
      "fluff",
    ];

    if (categoryFields.includes(name)) {
      const maxValStr = getEditFieldMax(name as any);
      if (maxValStr) {
        const maxVal = parseFloat(maxValStr);
        if (!isNaN(numValue) && numValue > maxVal) {
          numValue = maxVal;
        }
      }
    }

    setEditFormData((prev) => ({ ...prev, [name]: numValue }));
  };

  const handleEditWeightInputChange = (name: string, weightVal: string) => {
    if (!editingRecord) return;
    const uw = editingRecord.unitWeight || 0;
    if (uw <= 0) return;

    if (weightVal === "") {
      setEditFormData((prev) => ({
        ...prev,
        [name]: 0,
      }));
      return;
    }

    const weight = parseFloat(weightVal);
    if (!isNaN(weight)) {
      let calculatedCount = weight / uw;
      const maxValStr = getEditFieldMax(name as any);
      if (maxValStr) {
        const maxVal = parseFloat(maxValStr);
        if (calculatedCount > maxVal) {
          calculatedCount = maxVal;
        }
      }
      setEditFormData((prev) => ({
        ...prev,
        [name]: calculatedCount,
      }));
    }
  };

  const handleEditSave = async () => {
    if (!editingRecord) return;
    const uw = editingRecord.unitWeight;
    const redWeight = editFormData.red * uw;
    const whiteWeight = editFormData.white * uw;
    const naturalWeight = editFormData.natural * uw;
    const naturalWhiteWeight = editFormData.naturalWhite * uw;
    const artificialWeight = editFormData.artificial * uw;
    const regularWeight = editFormData.regular * uw;
    const blackWeight = editFormData.black * uw;
    const regularExtraWeight = editFormData.regularExtra * uw;
    const blackExtraWeight = editFormData.blackExtra * uw;
    const whiteExtraWeight = editFormData.whiteExtra * uw;
    const naturalWhiteExtraWeight = editFormData.naturalWhiteExtra * uw;
    const offCutsWeight = editFormData.offCuts * uw;
    const reclaimedWeight = editFormData.reclaimed * uw;
    const fluffWeight = editFormData.fluff * uw;
    const lossWeight = Number(editFormData.lossWeight) || 0;

    const catSum =
      editFormData.red +
      editFormData.white +
      editFormData.natural +
      editFormData.naturalWhite +
      editFormData.artificial +
      editFormData.regular +
      editFormData.black +
      editFormData.regularExtra +
      editFormData.blackExtra +
      editFormData.whiteExtra +
      editFormData.naturalWhiteExtra +
      editFormData.offCuts +
      editFormData.reclaimed +
      editFormData.fluff;
    const originalTotal = getOriginalTotalCount(editingRecord);

    const normalWeight = Math.max(
      0,
      (originalTotal - catSum) * uw - lossWeight,
    );
    const normalCount = uw > 0 ? normalWeight / uw : 0;

    const categoryWeight =
      redWeight +
      whiteWeight +
      naturalWeight +
      naturalWhiteWeight +
      artificialWeight +
      regularWeight +
      blackWeight +
      regularExtraWeight +
      blackExtraWeight +
      whiteExtraWeight +
      naturalWhiteExtraWeight +
      offCutsWeight +
      reclaimedWeight +
      fluffWeight +
      lossWeight;
    const totalWeight = normalWeight + categoryWeight;

    const dto: CreateProcessingRecordDto = {
      date: editingRecord.date,
      productId: editingRecord.productId,
      workerNames: "",
      workers: editFormData.workers,
      count: originalTotal,
      remainingCount: normalCount,
      unitWeight: uw,
      redWeight,
      redCount: editFormData.red,
      whiteWeight,
      whiteCount: editFormData.white,
      naturalWeight,
      naturalCount: editFormData.natural,
      naturalWhiteWeight,
      naturalWhiteCount: editFormData.naturalWhite,
      artificialWeight,
      artificialCount: editFormData.artificial,
      regularWeight,
      regularCount: editFormData.regular,
      blackWeight,
      blackCount: editFormData.black,
      regularExtraWeight,
      regularExtraCount: editFormData.regularExtra,
      blackExtraWeight,
      blackExtraCount: editFormData.blackExtra,
      whiteExtraWeight,
      whiteExtraCount: editFormData.whiteExtra,
      naturalWhiteExtraWeight,
      naturalWhiteExtraCount: editFormData.naturalWhiteExtra,
      offCutsWeight,
      offCutsCount: editFormData.offCuts,
      reclaimedWeight,
      reclaimedCount: editFormData.reclaimed,
      fluffWeight,
      fluffCount: editFormData.fluff,
      lossWeight,
      totalWeight,
      remainingWeight: normalWeight,
      remainingWeightKg: undefined,
      difference: editingRecord.difference,
    };

    try {
      await processingAPI.update(editingRecord.id, dto);
      closeEditModal();
      await loadData();
    } catch (error) {
      console.error("Failed to update record:", error);
      showAlert("Error", "Failed to update record", "error");
    }
  };

  const handleDeleteRecord = async (record: ProcessingRecord) => {
    showConfirm(
      "Confirm Delete",
      `Are you show want to delete (${record.productMarker})?`,
      async () => {
        try {
          await processingAPI.delete(record.id);
          await loadData();
          showAlert("Success", "Record deleted successfully!", "success");
        } catch (error) {
          console.error("Failed to delete record:", error);
          showAlert("Error", "Failed to delete record", "error");
        }
      },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedWashRecordId ||
      !selectedWashRecord ||
      selectedWorkers.length === 0
    ) {
      showAlert(
        "Validation",
        "Please select a washed item and at least one worker",
        "error",
      );
      return;
    }

    try {
      const dto: CreateProcessingRecordDto = {
        date: combineDateWithMyanmarTime(
          new Date().toISOString().split("T")[0],
        ),
        productId: selectedWashRecord.productId,
        washGradingRecordId: selectedWashRecord.id,
        workerNames: "",
        workers: selectedWorkers,
        count: Number(formData.count),
        remainingCount: totals.remainingCount,
        unitWeight: Number(formData.unitWeight),
        redWeight: totals.redWeight,
        redCount: Number(formData.red) || 0,
        whiteWeight: totals.whiteWeight,
        whiteCount: Number(formData.white) || 0,
        naturalWeight: totals.naturalWeight,
        naturalCount: Number(formData.natural) || 0,
        naturalWhiteWeight: totals.naturalWhiteWeight,
        naturalWhiteCount: Number(formData.naturalWhite) || 0,
        artificialWeight: totals.artificialWeight,
        artificialCount: Number(formData.artificial) || 0,
        regularWeight: totals.regularWeight,
        regularCount: Number(formData.regular) || 0,
        blackWeight: totals.blackWeight,
        blackCount: Number(formData.black) || 0,
        regularExtraWeight: totals.regularExtraWeight,
        regularExtraCount: Number(formData.regularExtra) || 0,
        blackExtraWeight: totals.blackExtraWeight,
        blackExtraCount: Number(formData.blackExtra) || 0,
        whiteExtraWeight: totals.whiteExtraWeight,
        whiteExtraCount: Number(formData.whiteExtra) || 0,
        naturalWhiteExtraWeight: totals.naturalWhiteExtraWeight,
        naturalWhiteExtraCount: Number(formData.naturalWhiteExtra) || 0,
        offCutsWeight: totals.offCutsWeight,
        offCutsCount: Number(formData.offCuts) || 0,
        reclaimedWeight: totals.reclaimedWeight,
        reclaimedCount: Number(formData.reclaimed) || 0,
        fluffWeight: totals.fluffWeight,
        fluffCount: Number(formData.fluff) || 0,
        lossWeight: totals.lossWeight,
        totalWeight: totals.total,
        remainingWeight: totals.remainingWeight,
        remainingWeightKg: undefined,
        difference: totals.diff,
      };

      await processingAPI.create(dto);

      // Reset form
      setFormData({
        count: "0",
        unitWeight: "0.05",
        red: "",
        white: "",
        natural: "",
        naturalWhite: "",
        artificial: "",
        regular: "",
        black: "",
        regularExtra: "",
        blackExtra: "",
        whiteExtra: "",
        naturalWhiteExtra: "",
        offCuts: "",
        reclaimed: "",
        fluff: "",
        lossWeight: "",
      });
      setSelectedWorkers([]);
      setSelectedWashRecordId(null);

      loadData();
      showAlert("Success", "Record saved successfully!", "success");
    } catch (error) {
      console.error("Failed to save record:", error);
      showAlert("Error", "Failed to save record", "error");
    }
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="mess-labour-container fade-in">
      {/* Hero Header */}
      <div className="mess-labour-hero">
        <div className="mess-labour-hero-left">
          <div className="mess-labour-hero-icon">
            <Scissors size={30} strokeWidth={1.8} />
          </div>
          <div className="mess-labour-hero-text">
            <h1>Mess-Labour Management</h1>
            <p>Track sorting records, worker assignments, and daily wages</p>
          </div>
        </div>
        <div className="mess-labour-hero-right">
          <div className="mess-labour-stat-pill">
            <span className="stat-num">{records.length}</span>
            <span className="stat-label">
              {records.length === 1 ? "Record" : "Records"}
            </span>
          </div>
        </div>
      </div>

      <div className="mess-labour-layout" style={{ padding: "0" }}>
        {/* Left Sidebar: Product List */}
        <aside className="rf-sidebar">
          <div className="rf-sidebar-header">
            <Package size={18} />
            <span>Select a bag to sort</span>
          </div>

          {/* Search in rf-sidebar */}
          <div className="rf-search-box">
            <Search size={16} className="rf-search-icon" />
            <input
              type="text"
              placeholder="Search marker..."
              className="rf-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="rf-card-list">
            {filteredWashRecords.length === 0 ? (
              <div className="rf-empty-sidebar">No washed items found</div>
            ) : (
              filteredWashRecords.map((record) => (
                <div
                  key={record.id}
                  className={`product-card ${selectedWashRecordId === record.id ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedWashRecordId(record.id);
                    setActiveTab("processing");
                  }}
                >
                  <div className="card-header">
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span className="card-marker">
                        {record.productMarker}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
                          fontWeight: 500,
                        }}
                      >
                        {record.warehouseName}
                      </span>
                    </div>
                    {record.washGradingWorkerId ? (
                      <span className="rf-badge category-natural">Washed</span>
                    ) : (
                      <span
                        className="rf-badge category-unwashed"
                        style={{ background: "#fee2e2", color: "#ef4444" }}
                      >
                        Unwashed
                      </span>
                    )}
                  </div>
                  <div className="card-details">
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      {record.washGradingWorkerName || "Skipped (Unwashed)"}
                    </span>
                    <span
                      style={{
                        fontWeight: "700",
                        color: "#2563eb",
                      }}
                    >
                      {record.remainingWeight.toFixed(4)} viss
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Right Main Content */}
        <main className="rf-main">
          <div className="rf-main-card">
            {/* Header & Tabs */}
            <div className="rf-main-header">
              <div className="rf-header-left">
                <div
                  className="rf-header-icon"
                  style={{
                    background: "linear-gradient(135deg, #dbeafe, #eff6ff)",
                    color: "#2563eb",
                  }}
                >
                  <Scissors size={26} />
                </div>
                <div className="rf-tab-group">
                  <button
                    className={`rf-tab ${activeTab === "processing" ? "rf-tab-active rf-tab-orange" : ""}`}
                    onClick={() => setActiveTab("processing")}
                  >
                    <span className="rf-tab-title">Processing</span>
                    <span className="rf-tab-sub">Sort selected bag</span>
                  </button>
                  <button
                    className={`rf-tab ${activeTab === "history" ? "rf-tab-active rf-tab-blue" : ""}`}
                    onClick={() => setActiveTab("history")}
                  >
                    <span className="rf-tab-title">Mess-Labour History</span>
                    <span className="rf-tab-sub">View recent records</span>
                  </button>
                </div>
              </div>

              <div className="rf-header-right"></div>
            </div>

            {/* Tab Content */}
            {activeTab === "processing" ? (
              selectedWashRecord ? (
                <div
                  className="fade-in"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    overflowY: "auto",
                    flex: 1,
                    paddingRight: "4px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          fontSize: "20px",
                          fontWeight: "800",
                          color: "#0f172a",
                          margin: 0,
                        }}
                      >
                        Mess-Labour sorting
                      </h2>
                      <p
                        style={{
                          fontSize: "13.5px",
                          color: "#64748b",
                          margin: "6px 0 0 0",
                          fontWeight: "500",
                        }}
                      >
                        Bag Marker:{" "}
                        <strong>{selectedWashRecord.productMarker}</strong>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#64748b",
                            marginLeft: "8px",
                          }}
                        >
                          (
                          {selectedWashRecord.washGradingWorkerId
                            ? "Washed"
                            : "Unwashed"}{" "}
                          from Wash/Grading)
                        </span>
                      </p>
                    </div>
                    <div
                      style={{
                        background:
                          "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                        borderRadius: "12px",
                        padding: "10px 16px",
                        border: "1.5px solid #e2e8f0",
                        textAlign: "right",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10.5px",
                          fontWeight: "700",
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          marginBottom: "4px",
                        }}
                      >
                        Original Weight
                      </div>
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "800",
                          color: "#0f172a",
                        }}
                      >
                        {selectedWashRecord.remainingWeight.toFixed(4)}{" "}
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#64748b",
                          }}
                        >
                          viss
                        </span>
                      </div>
                    </div>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    {/* 2. Count & Unit Weight */}
                    <section className="form-section">
                      <h3
                        className="section-label"
                        style={{ marginBottom: "16px" }}
                      >
                        1. Count &amp; Unit Weight
                      </h3>
                      <div className="count-unit-cards">
                        <div className="cu-card cu-card-count">
                          <div className="cu-card-icon">
                            <Package size={22} />
                          </div>
                          <div className="cu-card-body">
                            <label className="cu-label">Total Count</label>
                            <div className="cu-value-wrapper">
                              <input
                                type="number"
                                name="count"
                                min="0"
                                className="cu-input"
                                value={formData.count || ""}
                                readOnly
                                placeholder="0"
                              />
                              <span className="cu-unit">bundles</span>
                            </div>
                            <p className="cu-hint">
                              Auto-calculated from remaining weight ÷ unit
                              weight
                            </p>
                          </div>
                        </div>
                        <div className="cu-card cu-card-weight">
                          <div className="cu-card-icon">
                            <Calculator size={22} />
                          </div>
                          <div className="cu-card-body">
                            <label className="cu-label">Unit Weight</label>
                            <div className="cu-value-wrapper">
                              <input
                                type="number"
                                name="unitWeight"
                                step="0.000001"
                                min="0"
                                className="cu-input"
                                value={formData.unitWeight || ""}
                                onChange={handleInputChange}
                                placeholder="0"
                              />
                              <span className="cu-unit">viss</span>
                            </div>
                            <p className="cu-hint">Weight per bundle in viss</p>
                          </div>
                        </div>
                        <div className="cu-card cu-card-total">
                          <div className="cu-card-icon">
                            <ArrowRight size={22} />
                          </div>
                          <div className="cu-card-body">
                            <label className="cu-label">Total Weight</label>
                            <div className="cu-value-wrapper">
                              <span className="cu-computed">
                                {totals.total.toFixed(4)}
                              </span>
                              <span className="cu-unit">viss</span>
                            </div>
                            {selectedWashRecord && (
                              <p
                                className="cu-hint"
                                style={{
                                  color:
                                    Math.abs(totals.diff) > 0.01
                                      ? "#e53e3e"
                                      : "#38a169",
                                }}
                              >
                                Diff: {totals.diff > 0 ? "+" : ""}
                                {totals.diff.toFixed(4)} viss
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* 3. Categories */}
                    <section className="form-section">
                      <h3 className="section-label">
                        2. Short / Deduction Categories
                      </h3>
                      <div className="category-grid">
                        {[
                          { name: "red", label: "Red", cls: "box-red" },
                          { name: "white", label: "White", cls: "box-white" },
                          {
                            name: "natural",
                            label: "Natural",
                            cls: "box-natural",
                          },
                          {
                            name: "naturalWhite",
                            label: "Natural White",
                            cls: "box-natural-white",
                          },
                          {
                            name: "artificial",
                            label: "Artificial",
                            cls: "box-artificial",
                          },
                          {
                            name: "regular",
                            label: "Regular",
                            cls: "box-regular",
                          },
                          { name: "black", label: "Black", cls: "box-black" },
                          {
                            name: "regularExtra",
                            label: "Regular Extra",
                            cls: "box-regular-extra",
                          },
                          {
                            name: "blackExtra",
                            label: "Black Extra",
                            cls: "box-black-extra",
                          },
                          {
                            name: "whiteExtra",
                            label: "White Extra",
                            cls: "box-white-extra",
                          },
                          {
                            name: "naturalWhiteExtra",
                            label: "Natural White Extra",
                            cls: "box-natural-white-extra",
                          },
                          {
                            name: "offCuts",
                            label: "OffCuts",
                            cls: "box-offcuts",
                          },
                          {
                            name: "reclaimed",
                            label: "Reclaimed",
                            cls: "box-reclaimed",
                          },
                          { name: "fluff", label: "Fluff", cls: "box-fluff" },
                        ].map(({ name, label, cls }) => {
                          const countVal =
                            formData[name as keyof typeof formData] || "";
                          const weightVal = countVal
                            ? Number(
                                (
                                  Number(countVal) * Number(formData.unitWeight)
                                ).toFixed(6),
                              ).toString()
                            : "";
                          return (
                            <div
                              key={name}
                              className={`category-input-box ${cls}`}
                            >
                              <span className="box-label">{label}</span>
                              <div className="box-inputs-row">
                                <div className="box-input-group">
                                  <label className="box-input-sublabel">
                                    Count
                                  </label>
                                  <input
                                    type="number"
                                    name={name}
                                    className="box-input-small"
                                    max={getFieldMax(name as any)}
                                    value={countVal}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                  />
                                </div>
                                <div className="box-input-group">
                                  <label className="box-input-sublabel">
                                    Viss
                                  </label>
                                  <input
                                    type="number"
                                    name={`${name}_weight`}
                                    className="box-input-small"
                                    value={weightVal}
                                    onChange={(e) =>
                                      handleWeightInputChange(
                                        name,
                                        e.target.value,
                                      )
                                    }
                                    placeholder="0"
                                    step="0.0001"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    {/* Lost Weight Section */}
                    <section className="form-section">
                      <h3 className="section-label">Lost Weight</h3>
                      <div className="lost-weight-container">
                        <div className="lost-weight-icon-wrapper">
                          <AlertCircle size={20} className="lost-icon" />
                        </div>
                        <div className="lost-weight-content">
                          <label>Lost (viss)</label>
                          <p className="lost-weight-msg">
                            This is the box to input lost weight. Input Lost
                            Weight in Viss only. Do not input the bundles count
                          </p>
                          <input
                            type="number"
                            name="lossWeight"
                            step="0.0001"
                            min="0"
                            className="rw-form-control lost-weight-input"
                            value={formData.lossWeight || ""}
                            onChange={handleInputChange}
                            placeholder="0.0000"
                          />
                        </div>
                      </div>
                    </section>

                    {/* Weight Balance Summary */}
                    <div className="summary-section">
                      <div
                        className="summary-calc"
                        style={{
                          marginBottom: "20px",
                        }}
                      >
                        <div className="calc-left">
                          <Calculator size={24} />
                          <span>Weight Balance:</span>
                          <span>
                            {totals.rwViss.toFixed(4)} -{" "}
                            {totals.categorizedWeight.toFixed(4)}
                          </span>
                          <span>=</span>
                        </div>
                        <div className="calc-right">
                          {totals.remainingWeight.toFixed(4)} viss
                        </div>
                      </div>

                      <div
                        className="summary-calc"
                        style={{
                          marginTop: "12px",
                          paddingTop: "12px",
                          borderTop: "1px dashed var(--border)",
                        }}
                      >
                        <div className="calc-left">
                          <Calculator size={24} />
                          <span>Remaining Count:</span>
                          <span>
                            {formData.count} - {totals.catSum.toFixed(4)}
                          </span>
                          <span>=</span>
                        </div>
                        <div className="calc-right">
                          {totals.remainingCount.toFixed(4)}
                        </div>
                      </div>
                    </div>

                    {/* 1. Worker Names */}
                    <section className="form-section">
                      <div
                        className="section-header"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "12px",
                        }}
                      >
                        <h3 className="section-label" style={{ margin: 0 }}>
                          3. Mess-Labour Workers & Fees
                        </h3>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          maxWidth: "600px",
                        }}
                      >
                        {selectedWorkers.map((sw, index) => (
                          <div
                            key={index}
                            style={{
                              display: "flex",
                              gap: "10px",
                              alignItems: "center",
                            }}
                          >
                            <select
                              className="rw-form-control"
                              value={sw.messLabourWorkerId || ""}
                              onChange={(e) => {
                                const newWorkers = [...selectedWorkers];
                                newWorkers[index].messLabourWorkerId = parseInt(
                                  e.target.value,
                                );
                                setSelectedWorkers(newWorkers);
                              }}
                              style={{
                                padding: "0.75rem 1rem",
                                fontSize: "1.1rem",
                                flex: 1,
                              }}
                            >
                              <option value="" disabled>
                                Select a worker...
                              </option>
                              {workers.map((worker) => (
                                <option key={worker.id} value={worker.id}>
                                  {worker.name}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              className="rw-form-control"
                              value={sw.workerFee || ""}
                              onChange={(e) => {
                                const newWorkers = [...selectedWorkers];
                                newWorkers[index].workerFee =
                                  Number(e.target.value) || 0;
                                setSelectedWorkers(newWorkers);
                              }}
                              placeholder="Fee (MMK)"
                              style={{
                                padding: "0.75rem 1rem",
                                fontSize: "1.1rem",
                                width: "150px",
                              }}
                              required
                            />
                            <button
                              type="button"
                              className="rf-action-btn rf-action-delete"
                              onClick={() => {
                                const newWorkers = selectedWorkers.filter(
                                  (_, i) => i !== index,
                                );
                                setSelectedWorkers(newWorkers);
                              }}
                              style={{ height: "42px", width: "42px" }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedWorkers([
                              ...selectedWorkers,
                              { messLabourWorkerId: 0, workerFee: 0 },
                            ])
                          }
                          style={{
                            alignSelf: "flex-start",
                            background: "#eff6ff",
                            color: "#2563eb",
                            border: "1.5px dashed #bfdbfe",
                            padding: "8px 16px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: 600,
                            transition: "all 0.2s",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "#dbeafe";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "#eff6ff";
                          }}
                        >
                          + Add Worker
                        </button>
                      </div>
                    </section>

                    <button
                      type="submit"
                      className="submit-btn"
                      disabled={
                        !selectedWashRecordId ||
                        selectedWorkers.length === 0 ||
                        totals.diff <
                          -(Number(formData.unitWeight) || 0) + 0.0001
                      }
                    >
                      {totals.diff <
                      -(Number(formData.unitWeight) || 0) + 0.0001
                        ? "Weight exceeded — cannot save"
                        : "Confirm & Save Record"}
                      <ArrowRight size={20} />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="rf-empty-state">
                  <Package
                    size={48}
                    style={{ color: "#cbd5e1", marginBottom: "16px" }}
                  />
                  <p
                    style={{
                      color: "#94a3b8",
                      fontWeight: 600,
                      fontSize: "15px",
                    }}
                  >
                    No bag selected
                  </p>
                  <p style={{ color: "#cbd5e1", fontSize: "13px" }}>
                    Pick a bag from the sidebar to begin sorting
                  </p>
                </div>
              )
            ) : (
              /* History Tab */
              <div className="rf-table-wrap fade-in">
                {selectedWashRecord && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "14px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      Showing records for:{" "}
                      <strong>{selectedWashRecord.productMarker}</strong>
                    </span>
                    <button
                      onClick={() => setSelectedWashRecordId(null)}
                      style={{
                        fontSize: "12px",
                        color: "#2563eb",
                        background: "none",
                        border: "1.5px solid #bfdbfe",
                        borderRadius: "8px",
                        padding: "4px 12px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Clear Selection &amp; Show All
                    </button>
                  </div>
                )}
                {/* Table Filters */}
                <div className="ml-table-controls">
                  <div className="ml-search-box">
                    <Search className="ml-input-icon" size={16} />
                    <input
                      type="text"
                      className="ml-search-control"
                      placeholder="Search history..."
                      value={historySearchTerm}
                      onChange={(e) => setHistorySearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="ml-date-filter">
                    <div className="ml-date-field">
                      <span className="ml-date-label">From</span>
                      <input
                        type="date"
                        className="ml-date-input"
                        value={historyFromDate}
                        onChange={(e) => setHistoryFromDate(e.target.value)}
                      />
                    </div>
                    <div className="ml-date-field">
                      <span className="ml-date-label">To</span>
                      <input
                        type="date"
                        className="ml-date-input"
                        value={historyToDate}
                        onChange={(e) => setHistoryToDate(e.target.value)}
                      />
                    </div>
                    {(historyFromDate || historyToDate) && (
                      <button
                        className="ml-date-clear-btn"
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
                <table className="rf-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Marker</th>
                      <th>Worker</th>
                      <th>Worker Fees</th>
                      <th>Categories</th>
                      <th style={{ textAlign: "center" }}>Lost (viss)</th>
                      <th style={{ textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedWashRecordId
                      ? filteredRecords.filter(
                          (r) => r.washGradingRecordId === selectedWashRecordId,
                        )
                      : filteredRecords
                    ).map((record) => (
                      <tr
                        key={record.id}
                        onClick={() => setViewingRecord(record)}
                        style={{ cursor: "pointer" }}
                        className="hover-row"
                      >
                        <td>{formatDateTime(record.date)}</td>
                        <td>{record.productMarker}</td>
                        <td>
                          {record.workers && record.workers.length > 0
                            ? record.workers
                                .map((w) => w.messLabourWorkerName)
                                .join(", ")
                            : (record as any).messLabourWorkerName || "---"}
                        </td>
                        <td>
                          {(record.workers && record.workers.length > 0
                            ? record.workers.reduce(
                                (sum, w) => sum + w.workerFee,
                                0,
                              )
                            : record.workerFees || 0
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              flexWrap: "wrap",
                              maxWidth: "450px",
                            }}
                          >
                            {record.redCount > 0 && (
                              <span className="rf-badge category-red">
                                Red: {record.redCount}
                              </span>
                            )}
                            {record.whiteCount > 0 && (
                              <span className="rf-badge category-white">
                                White: {record.whiteCount}
                              </span>
                            )}
                            {record.naturalCount > 0 && (
                              <span className="rf-badge category-natural">
                                Natural: {record.naturalCount}
                              </span>
                            )}
                            {record.naturalWhiteCount > 0 && (
                              <span className="rf-badge category-natural-white">
                                Nat.White: {record.naturalWhiteCount}
                              </span>
                            )}
                            {record.artificialCount > 0 && (
                              <span className="rf-badge category-artificial">
                                Artif: {record.artificialCount}
                              </span>
                            )}
                            {record.regularCount > 0 && (
                              <span className="rf-badge category-regular">
                                Regular: {record.regularCount}
                              </span>
                            )}
                            {record.blackCount > 0 && (
                              <span className="rf-badge category-black">
                                Black: {record.blackCount}
                              </span>
                            )}
                            {record.regularExtraCount > 0 && (
                              <span className="rf-badge category-regular-extra">
                                Reg.Extra: {record.regularExtraCount}
                              </span>
                            )}
                            {record.blackExtraCount > 0 && (
                              <span className="rf-badge category-black-extra">
                                Blk.Extra: {record.blackExtraCount}
                              </span>
                            )}
                            {record.whiteExtraCount > 0 && (
                              <span className="rf-badge category-white-extra">
                                Wht.Extra: {record.whiteExtraCount}
                              </span>
                            )}
                            {record.naturalWhiteExtraCount > 0 && (
                              <span className="rf-badge category-natural-white-extra">
                                NW.Extra: {record.naturalWhiteExtraCount}
                              </span>
                            )}
                            {record.offCutsCount > 0 && (
                              <span className="rf-badge category-offcuts">
                                OffCuts: {record.offCutsCount}
                              </span>
                            )}
                            {record.reclaimedCount > 0 && (
                              <span className="rf-badge category-reclaimed">
                                Reclaimed: {record.reclaimedCount}
                              </span>
                            )}
                            {record.fluffCount > 0 && (
                              <span className="rf-badge category-fluff">
                                Fluff: {record.fluffCount}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {record.lossWeight > 0 ? (
                            <span
                              style={{
                                background: "#f1f5f9",
                                color: "#475569",
                                fontWeight: 700,
                                fontSize: "13px",
                                padding: "3px 10px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                              }}
                            >
                              {Number(record.lossWeight).toFixed(3)}
                            </span>
                          ) : (
                            <span
                              style={{ color: "#cbd5e1", fontSize: "12px" }}
                            >
                              —
                            </span>
                          )}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              justifyContent: "center",
                            }}
                          >
                            {hasPermission("MessLabour.Edit") && (
                              <button
                                className="rf-action-btn rf-action-edit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(record);
                                }}
                                disabled={record.isLocked}
                                style={{
                                  cursor: record.isLocked
                                    ? "not-allowed"
                                    : "pointer",
                                }}
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            {hasPermission("MessLabour.Delete") && (
                              <button
                                className="rf-action-btn rf-action-delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRecord(record);
                                }}
                                disabled={record.isLocked}
                                style={{
                                  cursor: record.isLocked
                                    ? "not-allowed"
                                    : "pointer",
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/*  Edit Record Modal  */}
      {editingRecord && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEditModal();
          }}
        >
          <div className="em-modal">
            {/* Header */}
            <div className="em-header">
              <div className="em-header-left">
                <div className="em-header-icon">
                  <Pencil size={20} />
                </div>
                <div>
                  <p className="em-header-pre">Edit Record</p>
                  <h2 className="em-header-title">
                    {editingRecord.productMarker}
                  </h2>
                </div>
              </div>
              <button className="em-close-btn" onClick={closeEditModal}>
                <X size={20} />
              </button>
            </div>

            {/* Info bar */}
            <div className="em-info-bar">
              <div className="em-info-chip">
                <span className="em-info-label">Unit Weight</span>
                <span className="em-info-value">
                  {editingRecord.unitWeight.toFixed(4)} viss
                </span>
              </div>
              <div className="em-info-chip">
                <span className="em-info-label">Total Count</span>
                <span className="em-info-value">
                  {getOriginalTotalCount(editingRecord)} bundles
                </span>
              </div>
              <div className="em-info-chip">
                <span className="em-info-label">Date</span>
                <span className="em-info-value">
                  {formatDateTime(editingRecord.date)}
                </span>
              </div>
            </div>

            <div className="em-body">
              {/* Category Inputs */}
              <div className="em-section">
                <p className="em-section-title">
                  <Scissors size={15} /> Category Bundles
                </p>
                <div className="em-cat-grid">
                  {(
                    [
                      { name: "red", label: "Red", cls: "em-cat-red" },
                      { name: "white", label: "White", cls: "em-cat-white" },
                      {
                        name: "natural",
                        label: "Natural",
                        cls: "em-cat-natural",
                      },
                      {
                        name: "naturalWhite",
                        label: "Nat. White",
                        cls: "em-cat-nwhite",
                      },
                      {
                        name: "artificial",
                        label: "Artificial",
                        cls: "em-cat-art",
                      },
                      {
                        name: "regular",
                        label: "Regular",
                        cls: "em-cat-regular",
                      },
                      { name: "black", label: "Black", cls: "em-cat-black" },
                      {
                        name: "regularExtra",
                        label: "Reg. Extra",
                        cls: "em-cat-reg-extra",
                      },
                      {
                        name: "blackExtra",
                        label: "Blk. Extra",
                        cls: "em-cat-blk-extra",
                      },
                      {
                        name: "whiteExtra",
                        label: "Wht. Extra",
                        cls: "em-cat-wht-extra",
                      },
                      {
                        name: "naturalWhiteExtra",
                        label: "Nat. Wht. Extra",
                        cls: "em-cat-nwt-extra",
                      },
                      {
                        name: "offCuts",
                        label: "OffCuts",
                        cls: "em-cat-offcuts",
                      },
                      {
                        name: "reclaimed",
                        label: "Reclaimed",
                        cls: "em-cat-reclaimed",
                      },
                      { name: "fluff", label: "Fluff", cls: "em-cat-fluff" },
                    ] as const
                  ).map(({ name, label, cls }) => {
                    const countVal = (editFormData as any)[name] || "";
                    const weightVal = countVal
                      ? Number(
                          (Number(countVal) * editingRecord.unitWeight).toFixed(
                            6,
                          ),
                        ).toString()
                      : "";
                    return (
                      <div key={name} className={`em-cat-card ${cls}`}>
                        <span className="em-cat-label">{label}</span>
                        <div className="em-inputs-row">
                          <div className="em-input-group">
                            <span className="em-input-sublabel">Count</span>
                            <input
                              type="number"
                              name={name}
                              className="em-input-small"
                              value={countVal}
                              onChange={handleEditInputChange}
                              placeholder="0"
                              min="0"
                              max={getEditFieldMax(name as any)}
                            />
                          </div>
                          <div className="em-input-group">
                            <span className="em-input-sublabel">Viss</span>
                            <input
                              type="number"
                              name={`${name}_weight`}
                              className="em-input-small"
                              value={weightVal}
                              onChange={(e) =>
                                handleEditWeightInputChange(
                                  name,
                                  e.target.value,
                                )
                              }
                              placeholder="0.0000"
                              step="0.0001"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Edit Lost Weight Section */}
              <div className="em-section">
                <p className="em-section-title">
                  <AlertCircle size={15} /> Lost Weight
                </p>
                <div
                  className="lost-weight-container"
                  style={{ maxWidth: "100%" }}
                >
                  <div className="lost-weight-icon-wrapper">
                    <AlertCircle size={20} className="lost-icon" />
                  </div>
                  <div className="lost-weight-content">
                    <label>Lost (viss)</label>
                    <p className="lost-weight-msg">
                      This is the box to input lost weight. Input Lost Weight in
                      Viss only. Do not input the bundles count
                    </p>
                    <input
                      type="number"
                      name="lossWeight"
                      step="0.0001"
                      min="0"
                      className="rw-form-control lost-weight-input"
                      value={editFormData.lossWeight || ""}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          lossWeight: Number(e.target.value) || 0,
                        }))
                      }
                      placeholder="0.0000"
                    />
                  </div>
                </div>
              </div>

              {/* Worker Selection */}
              <div className="em-section">
                <p className="em-section-title">
                  <Users size={15} /> Mess-Labour Workers
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    maxWidth: "600px",
                  }}
                >
                  {editFormData.workers.map((sw, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                      }}
                    >
                      <select
                        className="rw-form-control"
                        value={sw.messLabourWorkerId || ""}
                        onChange={(e) => {
                          const newWorkers = [...editFormData.workers];
                          newWorkers[index].messLabourWorkerId = parseInt(
                            e.target.value,
                          );
                          setEditFormData((prev) => ({
                            ...prev,
                            workers: newWorkers,
                          }));
                        }}
                        style={{
                          padding: "0.75rem 1rem",
                          fontSize: "1.1rem",
                          flex: 1,
                        }}
                      >
                        <option value="" disabled>
                          Select a worker...
                        </option>
                        {workers.map((worker) => (
                          <option key={worker.id} value={worker.id}>
                            {worker.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        className="rw-form-control"
                        value={sw.workerFee || ""}
                        onChange={(e) => {
                          const newWorkers = [...editFormData.workers];
                          newWorkers[index].workerFee =
                            Number(e.target.value) || 0;
                          setEditFormData((prev) => ({
                            ...prev,
                            workers: newWorkers,
                          }));
                        }}
                        placeholder="0"
                        style={{
                          padding: "0.75rem 1rem",
                          fontSize: "1.1rem",
                          width: "150px",
                        }}
                      />
                      <button
                        type="button"
                        className="rf-action-btn rf-action-delete"
                        onClick={() => {
                          const newWorkers = editFormData.workers.filter(
                            (_, i) => i !== index,
                          );
                          setEditFormData((prev) => ({
                            ...prev,
                            workers: newWorkers,
                          }));
                        }}
                        style={{ height: "42px", width: "42px" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setEditFormData((prev) => ({
                        ...prev,
                        workers: [
                          ...prev.workers,
                          { messLabourWorkerId: 0, workerFee: 0 },
                        ],
                      }))
                    }
                    style={{
                      alignSelf: "flex-start",
                      background: "#eff6ff",
                      color: "#2563eb",
                      border: "1.5px dashed #bfdbfe",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#dbeafe";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#eff6ff";
                    }}
                  >
                    + Add Worker
                  </button>
                </div>
              </div>

              {/* Summary */}
              {(() => {
                const uw = editingRecord.unitWeight || 1;
                const originalTotal = getOriginalTotalCount(editingRecord);
                const catSum =
                  (editFormData.red || 0) +
                  (editFormData.white || 0) +
                  (editFormData.natural || 0) +
                  (editFormData.naturalWhite || 0) +
                  (editFormData.artificial || 0) +
                  (editFormData.regular || 0) +
                  (editFormData.black || 0) +
                  (editFormData.regularExtra || 0) +
                  (editFormData.blackExtra || 0) +
                  (editFormData.whiteExtra || 0) +
                  (editFormData.naturalWhiteExtra || 0) +
                  (editFormData.offCuts || 0) +
                  (editFormData.reclaimed || 0) +
                  (editFormData.fluff || 0) +
                  (editFormData.lossWeight || 0);
                const remainingCount = originalTotal - catSum;
                const remainingWeight = remainingCount * uw;
                // WashGrading records are always in viss
                const isKg = false;

                return (
                  <div className="em-summary-bar">
                    <div className="em-sum-chip em-sum-count">
                      <span className="em-sum-label">Remaining Count</span>
                      <span className="em-sum-val">{remainingCount}</span>
                      <span className="em-sum-sub">bundles</span>
                    </div>
                    <div className="em-sum-divider" />
                    <div className="em-sum-chip em-sum-weight">
                      <span className="em-sum-label">Remaining Weight</span>
                      <span className="em-sum-val">
                        {remainingWeight.toFixed(4)}
                      </span>
                      <span className="em-sum-sub">
                        viss
                        {isKg
                          ? ` (${(remainingWeight * 1.633).toFixed(4)} kg)`
                          : ""}
                      </span>
                    </div>
                    <div className="em-sum-divider" />
                    <div className="em-sum-chip em-sum-sorted">
                      <span className="em-sum-label">Sorted</span>
                      <span className="em-sum-val">{catSum}</span>
                      <span className="em-sum-sub">of {originalTotal}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="em-footer">
              <button className="em-btn-cancel" onClick={closeEditModal}>
                <X size={15} /> Cancel
              </button>
              <button className="em-btn-save" onClick={handleEditSave}>
                <Save size={15} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── View Record Modal ─────────────────────────────────────── */}
      {viewingRecord && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingRecord(null);
          }}
        >
          <div className="vm-modal">
            {/* Header */}
            <div className="vm-header">
              <div className="vm-header-left">
                <div className="vm-header-icon">
                  <Package size={22} />
                </div>
                <div>
                  <p className="vm-header-pre">Record Details</p>
                  <h2 className="vm-header-title">
                    {viewingRecord.productMarker}
                  </h2>
                </div>
              </div>
              <button
                className="vm-close-btn"
                onClick={() => setViewingRecord(null)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Stats Grid */}
            <div className="vm-stats-grid">
              <div className="vm-stat-card">
                <span className="vm-stat-label">Date</span>
                <span className="vm-stat-value">
                  {formatDateTime(viewingRecord.date)}
                </span>
              </div>
              <div className="vm-stat-card vm-stat-span-2">
                <span className="vm-stat-label">Workers</span>
                <span className="vm-stat-value">
                  {viewingRecord.workers && viewingRecord.workers.length > 0
                    ? viewingRecord.workers
                        .map((w) => w.messLabourWorkerName)
                        .join(", ")
                    : (viewingRecord as any).messLabourWorkerName ||
                      viewingRecord.workerNames ||
                      "---"}
                </span>
              </div>
              <div className="vm-stat-card">
                <span className="vm-stat-label">Unit Weight</span>
                <span className="vm-stat-value">
                  {viewingRecord.unitWeight.toFixed(4)} viss
                </span>
              </div>
              <div className="vm-stat-card">
                <span className="vm-stat-label">Worker Fees</span>
                <span
                  className="vm-stat-value"
                  style={{ color: "var(--amber)", fontWeight: 700 }}
                >
                  {(viewingRecord.workers && viewingRecord.workers.length > 0
                    ? viewingRecord.workers.reduce(
                        (sum, w) => sum + w.workerFee,
                        0,
                      )
                    : viewingRecord.workerFees || 0
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  MMK
                </span>
              </div>
            </div>

            {/* Remaining Stock Highlight */}
            <div className="vm-highlights">
              <div className="vm-highlight-box highlight-blue">
                <div className="vm-hl-label">Remaining Count</div>
                <div className="vm-hl-value">
                  {viewingRecord.remainingCount?.toFixed(4) || "0.0000"}{" "}
                  <span className="vm-hl-unit">bundles</span>
                </div>
                <div className="vm-hl-desc">
                  of {viewingRecord.count} original packages
                </div>
              </div>
              <div className="vm-highlight-box highlight-green">
                <div className="vm-hl-label">Remaining Weight</div>
                <div className="vm-hl-value">
                  {viewingRecord.remainingWeight.toFixed(4)}{" "}
                  <span className="vm-hl-unit">viss</span>
                </div>
                <div className="vm-hl-desc">weight available for sales</div>
              </div>
            </div>

            <div className="vm-body">
              {/* Category Details */}
              <div className="vm-section">
                <p className="vm-section-title">
                  <Scissors size={15} /> Categorized Distribution
                </p>
                <div className="vm-cat-grid">
                  {(
                    [
                      {
                        count: viewingRecord.redCount,
                        weight: viewingRecord.redWeight,
                        label: "Red",
                        cls: "vm-cat-red",
                      },
                      {
                        count: viewingRecord.whiteCount,
                        weight: viewingRecord.whiteWeight,
                        label: "White",
                        cls: "vm-cat-white",
                      },
                      {
                        count: viewingRecord.naturalCount,
                        weight: viewingRecord.naturalWeight,
                        label: "Natural",
                        cls: "vm-cat-natural",
                      },
                      {
                        count: viewingRecord.naturalWhiteCount,
                        weight: viewingRecord.naturalWhiteWeight,
                        label: "Nat. White",
                        cls: "vm-cat-nwhite",
                      },
                      {
                        count: viewingRecord.artificialCount,
                        weight: viewingRecord.artificialWeight,
                        label: "Artificial",
                        cls: "vm-cat-art",
                      },
                      {
                        count: viewingRecord.regularCount,
                        weight: viewingRecord.regularWeight,
                        label: "Regular",
                        cls: "vm-cat-regular",
                      },
                      {
                        count: viewingRecord.blackCount,
                        weight: viewingRecord.blackWeight,
                        label: "Black",
                        cls: "vm-cat-black",
                      },
                      {
                        count: viewingRecord.regularExtraCount,
                        weight: viewingRecord.regularExtraWeight,
                        label: "Reg. Extra",
                        cls: "vm-cat-reg-extra",
                      },
                      {
                        count: viewingRecord.blackExtraCount,
                        weight: viewingRecord.blackExtraWeight,
                        label: "Blk. Extra",
                        cls: "vm-cat-blk-extra",
                      },
                      {
                        count: viewingRecord.whiteExtraCount,
                        weight: viewingRecord.whiteExtraWeight,
                        label: "Wht. Extra",
                        cls: "vm-cat-wht-extra",
                      },
                      {
                        count: viewingRecord.naturalWhiteExtraCount,
                        weight: viewingRecord.naturalWhiteExtraWeight,
                        label: "Nat. Wht. Extra",
                        cls: "vm-cat-nwt-extra",
                      },
                      {
                        count: viewingRecord.offCutsCount,
                        weight: viewingRecord.offCutsWeight,
                        label: "OffCuts",
                        cls: "vm-cat-offcuts",
                      },
                      {
                        count: viewingRecord.reclaimedCount,
                        weight: viewingRecord.reclaimedWeight,
                        label: "Reclaimed",
                        cls: "vm-cat-reclaimed",
                      },
                      {
                        count: viewingRecord.fluffCount,
                        weight: viewingRecord.fluffWeight,
                        label: "Fluff",
                        cls: "vm-cat-fluff",
                      },
                    ] as const
                  )
                    .filter((cat) => cat.count > 0)
                    .map(({ count, weight, label, cls }) => (
                      <div key={label} className={`vm-cat-card ${cls}`}>
                        <span className="vm-cat-label">{label}</span>
                        <span className="vm-cat-count">{count} bundles</span>
                        <span className="vm-cat-weight">
                          {weight.toFixed(3)} viss
                        </span>
                      </div>
                    ))}
                  {/* Lost — weight only, no bundle count */}
                  {viewingRecord.lossWeight > 0 && (
                    <div className="vm-cat-card vm-cat-lost">
                      <span className="vm-cat-label">Lost</span>
                      <span className="vm-cat-count">
                        {Number(viewingRecord.lossWeight).toFixed(3)} viss
                      </span>
                    </div>
                  )}
                  {viewingRecord.redCount === 0 &&
                    viewingRecord.whiteCount === 0 &&
                    viewingRecord.naturalCount === 0 &&
                    viewingRecord.naturalWhiteCount === 0 &&
                    viewingRecord.artificialCount === 0 &&
                    viewingRecord.regularCount === 0 &&
                    viewingRecord.blackCount === 0 &&
                    viewingRecord.regularExtraCount === 0 &&
                    viewingRecord.blackExtraCount === 0 &&
                    viewingRecord.whiteExtraCount === 0 &&
                    viewingRecord.naturalWhiteExtraCount === 0 &&
                    viewingRecord.offCutsCount === 0 &&
                    viewingRecord.reclaimedCount === 0 &&
                    viewingRecord.fluffCount === 0 &&
                    viewingRecord.lossWeight === 0 && (
                      <div className="vm-empty-cats">
                        No bundles were sorted into categories.
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Bottom Total Alert Bar */}
            <div className="vm-totals-bar">
              <div className="vm-total-item">
                <span className="vm-total-label">Total Weight</span>
                <span className="vm-total-value">
                  {viewingRecord.totalWeight.toFixed(4)}{" "}
                  <span className="vm-total-unit">viss</span>
                </span>
              </div>
              <div className="vm-total-item" style={{ alignItems: "flex-end" }}>
                <span className="vm-total-label">Weight Difference</span>
                <span
                  className={`vm-total-diff ${viewingRecord.difference > 0.1 || viewingRecord.difference < -0.1 ? "diff-error" : "diff-success"}`}
                >
                  {viewingRecord.difference > 0 ? "+" : ""}
                  {viewingRecord.difference.toFixed(4)} viss
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="vm-footer">
              <button
                className="vm-btn-close"
                onClick={() => setViewingRecord(null)}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessLabour;
