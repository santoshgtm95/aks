import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
  Alert,
  SafeAreaView,
} from "react-native";
import { washGradingAPI, processingAPI, workersAPI } from "../services/api";
import {
  WashGradingRecord,
  ProcessingRecord,
  MessLabourWorker,
} from "../types";
import { CustomButton } from "../components/CustomButton";
import { CustomInput } from "../components/CustomInput";
import Modal from "../components/Modal";
import { Search, Calendar, User, Send, Filter, Info } from "lucide-react-native";
import { formatDateTime, getMyanmarNow } from "../utils/format";

const COLOR_FIELDS = [
  { label: "Regular", key: "regular" },
  { label: "Black", key: "black" },
  { label: "Regular Extra", key: "regularExtra" },
  { label: "Black Extra", key: "blackExtra" },
  { label: "White Extra", key: "whiteExtra" },
  { label: "Natural White Extra", key: "naturalWhiteExtra" },
  { label: "Off Cuts", key: "offCuts" },
  { label: "Reclaimed", key: "reclaimed" },
  { label: "Fluff", key: "fluff" },
  { label: "Red", key: "red" },
  { label: "White", key: "white" },
  { label: "Natural", key: "natural" },
  { label: "Natural White", key: "naturalWhite" },
  { label: "Artificial", key: "artificial" },
];

const MessLabourScreen: React.FC = () => {
  const [washRecords, setWashRecords] = useState<WashGradingRecord[]>([]);
  const [records, setRecords] = useState<ProcessingRecord[]>([]);
  const [workers, setWorkers] = useState<MessLabourWorker[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeSubTab, setActiveSubTab] = useState<"available" | "history">("available");
  const [searchTerm, setSearchTerm] = useState("");
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historyFromDate, setHistoryFromDate] = useState("");
  const [historyToDate, setHistoryToDate] = useState("");

  // Assign Modal States
  const [selectedWashRecord, setSelectedWashRecord] = useState<WashGradingRecord | null>(null);
  const [workerFees, setWorkerFees] = useState("0");
  const [selectedWorkersList, setSelectedWorkersList] = useState<number[]>([]);
  const [lossWeight, setLossWeight] = useState("0");

  // Form color input states
  const [colorWeights, setColorWeights] = useState<Record<string, string>>({
    regular: "0",
    black: "0",
    regularExtra: "0",
    blackExtra: "0",
    whiteExtra: "0",
    naturalWhiteExtra: "0",
    offCuts: "0",
    reclaimed: "0",
    fluff: "0",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [avail, recs, workersData] = await Promise.all([
        washGradingAPI.getAvailableForMessLabour(),
        processingAPI.getAll(),
        workersAPI.getMessLabourWorkers(),
      ]);
      setWashRecords(avail);
      setRecords(recs);
      setWorkers(workersData);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to load Mess Labour sorting data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAssign = (record: WashGradingRecord) => {
    setSelectedWashRecord(record);
    setSelectedWorkersList([]);
    setWorkerFees("0");
    setLossWeight("0");

    const initialWeights: Record<string, string> = {};
    COLOR_FIELDS.forEach((f) => {
      initialWeights[f.key] = "0";
    });
    setColorWeights(initialWeights);
  };

  const toggleWorkerSelection = (id: number) => {
    if (selectedWorkersList.includes(id)) {
      setSelectedWorkersList(selectedWorkersList.filter((item) => item !== id));
    } else {
      setSelectedWorkersList([...selectedWorkersList, id]);
    }
  };

  const handleAssign = async () => {
    if (!selectedWashRecord) return;
    if (selectedWorkersList.length === 0) {
      Alert.alert("Validation", "Please select at least one worker.");
      return;
    }

    try {
      const postData: any = {
        washGradingRecordId: selectedWashRecord.id,
        date: new Date().toISOString(),
        workers: selectedWorkersList.map((id) => ({
          messLabourWorkerId: id,
          workerFee: (parseFloat(workerFees) || 0) / selectedWorkersList.length,
        })),
        lossWeight: parseFloat(lossWeight) || 0,
      };

      COLOR_FIELDS.forEach((f) => {
        postData[f.key] = parseFloat(colorWeights[f.key]) || 0;
      });

      await processingAPI.create(postData);
      setSelectedWashRecord(null);
      loadData();
      Alert.alert("Success", "Sorted details submitted successfully.");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e.response?.data?.message || "Failed to submit.");
    }
  };

  const filteredAvailable = useMemo(() => {
    return washRecords.filter(
      (a) =>
        a.remainingWeight >= 0.001 &&
        ((a.productMarker || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (a.warehouseName || "").toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [washRecords, searchTerm]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const term = historySearchTerm.toLowerCase();
      const matchesSearch =
        (r.productMarker || "").toLowerCase().includes(term) ||
        (r.workerNames || "").toLowerCase().includes(term);

      const recordDate = r.date ? r.date.slice(0, 10) : "";
      const matchesFrom = !historyFromDate || recordDate >= historyFromDate;
      const matchesTo = !historyToDate || recordDate <= historyToDate;

      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [records, historySearchTerm, historyFromDate, historyToDate]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeSubTab === "available" && styles.tabActive]}
            onPress={() => setActiveSubTab("available")}
          >
            <Text style={[styles.tabText, activeSubTab === "available" && styles.tabTextActive]}>
              Washed Bundles ({filteredAvailable.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeSubTab === "history" && styles.tabActive]}
            onPress={() => setActiveSubTab("history")}
          >
            <Text style={[styles.tabText, activeSubTab === "history" && styles.tabTextActive]}>
              Sorted Log ({filteredRecords.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeSubTab === "available" ? (
          <View style={styles.searchContainer}>
            <View style={styles.searchWrapper}>
              <Search size={18} color="#94a3b8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search washed bundles..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>
        ) : (
          <View style={styles.searchContainer}>
            <View style={styles.searchWrapper}>
              <Search size={18} color="#94a3b8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search marker, workers..."
                value={historySearchTerm}
                onChangeText={setHistorySearchTerm}
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View style={styles.dateFilterContainer}>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>From:</Text>
                <TextInput
                  placeholder="YYYY-MM-DD"
                  style={styles.dateInput}
                  value={historyFromDate}
                  onChangeText={setHistoryFromDate}
                />
              </View>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>To:</Text>
                <TextInput
                  placeholder="YYYY-MM-DD"
                  style={styles.dateInput}
                  value={historyToDate}
                  onChangeText={setHistoryToDate}
                />
              </View>
            </View>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : activeSubTab === "available" ? (
          <FlatList
            data={filteredAvailable}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.markerText}>{item.productMarker}</Text>
                  <Text style={styles.weightText}>{item.remainingWeight.toFixed(3)} viss</Text>
                </View>
                <Text style={styles.detailText}>Warehouse: {item.warehouseName || "N/A"}</Text>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.assignBtn]}
                  onPress={() => handleOpenAssign(item)}
                >
                  <Send size={14} color="white" />
                  <Text style={styles.actionBtnText}>Sort & Categorize</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Info size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>No washed stock ready for sorting</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={filteredRecords}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.markerText}>{item.productMarker}</Text>
                  <Text style={[styles.weightText, styles.purpleText]}>
                    Sorted: {item.date ? formatDateTime(item.date) : "N/A"}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <User size={14} color="#64748b" />
                  <Text style={styles.infoText}>Workers: {item.workerNames || "N/A"}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Calendar size={14} color="#64748b" />
                  <Text style={styles.infoText}>Loss Weight: {item.lossWeight?.toFixed(3)} viss</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Filter size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>No sorting logs found</Text>
              </View>
            }
          />
        )}

        {/* Sorting Modal */}
        <Modal
          isOpen={selectedWashRecord !== null}
          onClose={() => setSelectedWashRecord(null)}
          title="Mess Labour Sorting Input"
        >
          {selectedWashRecord && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSubText}>
                Marker: {selectedWashRecord.productMarker} | Remaining:{" "}
                {selectedWashRecord.remainingWeight.toFixed(3)} viss
              </Text>

              {/* Multi-Worker Checklist */}
              <Text style={styles.selectLabel}>Select Sorting Workers</Text>
              <View style={styles.workersListContainer}>
                {workers.map((w) => {
                  const isChecked = selectedWorkersList.includes(w.id);
                  return (
                    <TouchableOpacity
                      key={w.id}
                      style={[styles.workerCheckItem, isChecked && styles.workerCheckItemActive]}
                      onPress={() => toggleWorkerSelection(w.id)}
                    >
                      <Text style={[styles.workerCheckText, isChecked && styles.workerCheckTextActive]}>
                        {w.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <CustomInput
                label="Total Worker Fees (MMK)"
                keyboardType="numeric"
                value={workerFees}
                onChangeText={setWorkerFees}
              />

              <CustomInput
                label="Loss Weight (viss)"
                keyboardType="numeric"
                value={lossWeight}
                onChangeText={setLossWeight}
              />

              <Text style={styles.sectionDivider}>Categorized Weights (viss)</Text>
              {COLOR_FIELDS.map((f) => (
                <CustomInput
                  key={f.key}
                  label={f.label}
                  keyboardType="numeric"
                  value={colorWeights[f.key]}
                  onChangeText={(val) =>
                    setColorWeights((prev) => ({ ...prev, [f.key]: val }))
                  }
                />
              ))}

              <CustomButton
                title="Submit Sorting"
                onPress={handleAssign}
                style={styles.modalSubmitBtn}
              />
            </ScrollView>
          )}
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#2563eb",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
  tabTextActive: {
    color: "#2563eb",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    gap: 8,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0f172a",
    height: "100%",
  },
  dateFilterContainer: {
    flexDirection: "row",
    gap: 12,
  },
  dateField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  dateInput: {
    flex: 1,
    height: 32,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 12,
    color: "#334155",
    backgroundColor: "white",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  markerText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e293b",
  },
  weightText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2563eb",
  },
  purpleText: {
    color: "#8b5cf6",
    fontSize: 12,
  },
  detailText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    borderRadius: 8,
    gap: 6,
  },
  assignBtn: {
    backgroundColor: "#2563eb",
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "white",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "600",
    textAlign: "center",
  },
  modalSubText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 16,
  },
  selectLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  workersListContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  workerCheckItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
  },
  workerCheckItemActive: {
    borderColor: "#2563eb",
    backgroundColor: "#dbeafe",
  },
  workerCheckText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  workerCheckTextActive: {
    color: "#1e40af",
  },
  sectionDivider: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e293b",
    marginTop: 20,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 6,
  },
  modalSubmitBtn: {
    marginTop: 20,
    marginBottom: 40,
  },
});

export default MessLabourScreen;
