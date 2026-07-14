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
import { singleDoubleDrawnAPI, refinementAPI, workersAPI } from "../services/api";
import {
  RefinementRecord,
  SingleDoubleDrawnRecord,
  SingleDoubleDrawnWorker,
} from "../types";
import { CustomButton } from "../components/CustomButton";
import { CustomInput } from "../components/CustomInput";
import Modal from "../components/Modal";
import { Search, Calendar, User, Send, Filter, Sparkles } from "lucide-react-native";
import { formatDateTime, getMyanmarNow } from "../utils/format";

const SIZES = ["6", "7", "8", "9", "10", "10B", "12", "14", "16", "18", "20", "22", "24", "26", "28", "Bar"];

const SingleDoubleDrawnScreen: React.FC = () => {
  const [availableCategories, setAvailableCategories] = useState<RefinementRecord[]>([]);
  const [records, setRecords] = useState<SingleDoubleDrawnRecord[]>([]);
  const [workers, setWorkers] = useState<SingleDoubleDrawnWorker[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab State
  const [activeSubTab, setActiveSubTab] = useState<"available" | "history">("available");

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historyFromDate, setHistoryFromDate] = useState("");
  const [historyToDate, setHistoryToDate] = useState("");

  // Assign Modal
  const [selectedRecord, setSelectedRecord] = useState<RefinementRecord | null>(null);
  const [assignWorkerId, setAssignWorkerId] = useState<number>(0);
  const [sizeWeights, setSizeWeights] = useState<Record<string, string>>({});
  const [lostWeight, setLostWeight] = useState("0");
  const [spoilageWeight, setSpoilageWeight] = useState("0");
  const [returnWeight, setReturnWeight] = useState("0");
  const [assignDate, setAssignDate] = useState(getMyanmarNow());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [avail, recs, workersData] = await Promise.all([
        refinementAPI.getRefinementRecords(),
        singleDoubleDrawnAPI.getAll(),
        workersAPI.getSingleDoubleDrawnWorkers(),
      ]);
      setAvailableCategories(avail);
      setRecords(recs);
      setWorkers(workersData);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to load Single & Double Drawn data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAssign = (record: RefinementRecord) => {
    setSelectedRecord(record);
    setAssignWorkerId(0);
    setSizeWeights({});
    setLostWeight("0");
    setSpoilageWeight("0");
    setReturnWeight("0");
    setAssignDate(getMyanmarNow());
  };

  const handleAssign = async () => {
    if (!selectedRecord) return;
    if (!assignWorkerId) {
      Alert.alert("Validation", "Please select a worker.");
      return;
    }

    try {
      const payload: any = {
        date: new Date(assignDate).toISOString(),
        refinementRecordId: selectedRecord.id,
        lostWeight: parseFloat(lostWeight) || 0,
        spoilageWeight: parseFloat(spoilageWeight) || 0,
        returnWeight: parseFloat(returnWeight) || 0,
        workerId: assignWorkerId,
        size6: parseFloat(sizeWeights["6"]) || 0,
        size7: parseFloat(sizeWeights["7"]) || 0,
        size8: parseFloat(sizeWeights["8"]) || 0,
        size9: parseFloat(sizeWeights["9"]) || 0,
        size10: parseFloat(sizeWeights["10"]) || 0,
        size10B: parseFloat(sizeWeights["10B"]) || 0,
        size12: parseFloat(sizeWeights["12"]) || 0,
        size14: parseFloat(sizeWeights["14"]) || 0,
        size16: parseFloat(sizeWeights["16"]) || 0,
        size18: parseFloat(sizeWeights["18"]) || 0,
        size20: parseFloat(sizeWeights["20"]) || 0,
        size22: parseFloat(sizeWeights["22"]) || 0,
        size24: parseFloat(sizeWeights["24"]) || 0,
        size26: parseFloat(sizeWeights["26"]) || 0,
        size28: parseFloat(sizeWeights["28"]) || 0,
        sizeBar: parseFloat(sizeWeights["Bar"]) || 0,
        price6: 0, price7: 0, price8: 0, price9: 0, price10: 0, price10B: 0,
        price12: 0, price14: 0, price16: 0, price18: 0, price20: 0, price22: 0,
        price24: 0, price26: 0, price28: 0, priceBar: 0,
        price18P: 0, price20P: 0, price22P: 0, price24P: 0, price26P: 0, price28P: 0, priceBarP: 0,
        size18P: 0, size20P: 0, size22P: 0, size24P: 0, size26P: 0, size28P: 0, sizeBarP: 0,
      };

      await singleDoubleDrawnAPI.create(payload);
      setSelectedRecord(null);
      loadData();
      Alert.alert("Success", "Category drawn successfully.");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e.response?.data?.message || "Failed to assign.");
    }
  };

  const filteredAvailable = useMemo(() => {
    return availableCategories.filter(
      (a) =>
        a.weight >= 0.001 &&
        ((a.productMarker || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (a.category || "").toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [availableCategories, searchTerm]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const term = historySearchTerm.toLowerCase();
      const matchesSearch =
        (r.refinementRecordMarker || "").toLowerCase().includes(term) ||
        (r.workerName || "").toLowerCase().includes(term);

      const recordDate = r.date ? r.date.slice(0, 10) : "";
      const matchesFrom = !historyFromDate || recordDate >= historyFromDate;
      const matchesTo = !historyToDate || recordDate <= historyToDate;

      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [records, historySearchTerm, historyFromDate, historyToDate]);

  const getTotalDrawnWeight = (item: SingleDoubleDrawnRecord) => {
    return (item.size6 + item.size7 + item.size8 + item.size9 + item.size10 + item.size10B +
      item.size12 + item.size14 + item.size16 + item.size18 + item.size20 +
      item.size22 + item.size24 + item.size26 + item.size28 + item.sizeBar);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeSubTab === "available" && styles.tabActive]}
            onPress={() => setActiveSubTab("available")}
          >
            <Text style={[styles.tabText, activeSubTab === "available" && styles.tabTextActive]}>
              Available Stock ({filteredAvailable.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeSubTab === "history" && styles.tabActive]}
            onPress={() => setActiveSubTab("history")}
          >
            <Text style={[styles.tabText, activeSubTab === "history" && styles.tabTextActive]}>
              Drawn Log ({filteredRecords.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeSubTab === "available" ? (
          <View style={styles.searchContainer}>
            <View style={styles.searchWrapper}>
              <Search size={18} color="#94a3b8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search refined stock..."
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
                placeholder="Search marker, worker..."
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
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.category}</Text>
                  </View>
                </View>
                <Text style={styles.detailText}>
                  Weight: {item.weight.toFixed(3)} viss · Worker: {item.refinementWorkerName || "N/A"}
                </Text>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.assignBtn]}
                  onPress={() => handleOpenAssign(item)}
                >
                  <Send size={14} color="white" />
                  <Text style={styles.actionBtnText}>Draw Stock</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Sparkles size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>No refined stock available for drawing</Text>
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
                  <Text style={styles.markerText}>{item.refinementRecordMarker || "N/A"}</Text>
                  <Text style={[styles.weightText, styles.greenText]}>
                    {getTotalDrawnWeight(item).toFixed(3)} viss
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <User size={14} color="#64748b" />
                  <Text style={styles.infoText}>Worker: {item.workerName || "N/A"}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Calendar size={14} color="#64748b" />
                  <Text style={styles.infoText}>Completed: {formatDateTime(item.date)}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Filter size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>No drawing logs found</Text>
              </View>
            }
          />
        )}

        {/* Assign Modal Popup */}
        <Modal
          isOpen={selectedRecord !== null}
          onClose={() => setSelectedRecord(null)}
          title="Single & Double Drawn Input"
        >
          {selectedRecord && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSubText}>
                Marker: {selectedRecord.productMarker} | Category: {selectedRecord.category}
              </Text>

              <CustomInput
                label="Lost Weight (viss)"
                keyboardType="numeric"
                value={lostWeight}
                onChangeText={setLostWeight}
              />

              <CustomInput
                label="Spoilage Weight (viss)"
                keyboardType="numeric"
                value={spoilageWeight}
                onChangeText={setSpoilageWeight}
              />

              <CustomInput
                label="Return Weight (viss)"
                keyboardType="numeric"
                value={returnWeight}
                onChangeText={setReturnWeight}
              />

              <Text style={styles.selectLabel}>Select Worker</Text>
              <ScrollView style={styles.workerDropdown} nestedScrollEnabled>
                {workers.map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    style={[
                      styles.workerOption,
                      assignWorkerId === w.id && styles.workerOptionActive,
                    ]}
                    onPress={() => setAssignWorkerId(w.id)}
                  >
                    <Text
                      style={[
                        styles.workerOptionText,
                        assignWorkerId === w.id && styles.workerOptionTextActive,
                      ]}
                    >
                      {w.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.selectLabel}>Drawn Weight per Size (viss)</Text>
              {SIZES.map((size) => (
                <CustomInput
                  key={size}
                  label={`Size ${size}"`}
                  keyboardType="numeric"
                  value={sizeWeights[size] || ""}
                  onChangeText={(val) =>
                    setSizeWeights((prev) => ({ ...prev, [size]: val }))
                  }
                />
              ))}

              <CustomButton
                title="Submit Drawn Record"
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
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1 },
  tabContainer: { flexDirection: "row", backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: "#2563eb" },
  tabText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  tabTextActive: { color: "#2563eb" },
  searchContainer: { padding: 16, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", gap: 8 },
  searchWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#f1f5f9", borderRadius: 12, paddingHorizontal: 12, height: 40 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#0f172a", height: "100%" },
  dateFilterContainer: { flexDirection: "row", gap: 12 },
  dateField: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  dateLabel: { fontSize: 11, fontWeight: "700", color: "#64748b" },
  dateInput: { flex: 1, height: 32, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 6, paddingHorizontal: 8, fontSize: 12, color: "#334155", backgroundColor: "white" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContainer: { padding: 16, gap: 12 },
  card: { backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", padding: 16 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  markerText: { fontSize: 15, fontWeight: "800", color: "#1e293b" },
  weightText: { fontSize: 15, fontWeight: "800", color: "#2563eb" },
  greenText: { color: "#10b981" },
  detailText: { fontSize: 13, color: "#64748b", fontWeight: "500", marginBottom: 12 },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 38, borderRadius: 8, gap: 6 },
  assignBtn: { backgroundColor: "#2563eb" },
  actionBtnText: { fontSize: 13, fontWeight: "700", color: "white" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  infoText: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  emptyState: { alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  emptyText: { fontSize: 13, color: "#94a3b8", fontWeight: "600", textAlign: "center" },
  modalSubText: { fontSize: 13, color: "#64748b", fontWeight: "600", marginBottom: 16 },
  selectLabel: { fontSize: 12, fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: 6, marginTop: 12 },
  workerDropdown: { maxHeight: 120, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, backgroundColor: "#f8fafc", marginBottom: 16 },
  workerOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  workerOptionActive: { backgroundColor: "#dbeafe" },
  workerOptionText: { fontSize: 13, color: "#334155", fontWeight: "600" },
  workerOptionTextActive: { color: "#1e40af" },
  modalSubmitBtn: { marginTop: 16, marginBottom: 32 },
  badge: { backgroundColor: "#eff6ff", borderColor: "#bfdbfe", borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#1d4ed8" },
});

export default SingleDoubleDrawnScreen;
