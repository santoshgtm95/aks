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
import { refinementAPI, workersAPI } from "../services/api";
import {
  AvailablePurifiedCategory,
  RefinementProcess,
  RefinementRecord,
  RefinementWorker,
} from "../types";
import { CustomButton } from "../components/CustomButton";
import { CustomInput } from "../components/CustomInput";
import Modal from "../components/Modal";
import { Search, Calendar, User, Send, Filter, Sparkles } from "lucide-react-native";
import { formatDateTime, getMyanmarNow } from "../utils/format";

const RefinementScreen: React.FC = () => {
  const [availableCategories, setAvailableCategories] = useState<AvailablePurifiedCategory[]>([]);
  const [processes, setProcesses] = useState<RefinementProcess[]>([]);
  const [records, setRecords] = useState<RefinementRecord[]>([]);
  const [workers, setWorkers] = useState<RefinementWorker[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab State
  const [activeSubTab, setActiveSubTab] = useState<"available" | "history" | "stock">("available");

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historyFromDate, setHistoryFromDate] = useState("");
  const [historyToDate, setHistoryToDate] = useState("");

  // Assign Modal
  const [selectedCategory, setSelectedCategory] = useState<AvailablePurifiedCategory | null>(null);
  const [assignWorkerId, setAssignWorkerId] = useState<number>(0);
  const [assignCount, setAssignCount] = useState("");
  const [assignWeight, setAssignWeight] = useState("");
  const [lostWeight, setLostWeight] = useState("0");
  const [workerFees, setWorkerFees] = useState("0");
  const [assignDate, setAssignDate] = useState(getMyanmarNow());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [avail, procs, recs, workersData] = await Promise.all([
        refinementAPI.getAvailableCategories(),
        refinementAPI.getAll(),
        refinementAPI.getRefinementRecords(),
        workersAPI.getGirdleBushWorkers(),
      ]);
      setAvailableCategories(avail);
      setProcesses(procs);
      setRecords(recs);
      setWorkers(workersData);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to load Refinement data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAssign = (category: AvailablePurifiedCategory) => {
    setSelectedCategory(category);
    setAssignWorkerId(0);
    setAssignCount(category.remainingCount.toString());
    setAssignWeight(category.remainingWeight.toString());
    setLostWeight("0");
    setWorkerFees("0");
    setAssignDate(getMyanmarNow());
  };

  const handleAssign = async () => {
    if (!selectedCategory) return;
    if (!assignWorkerId) {
      Alert.alert("Validation", "Please select a worker.");
      return;
    }

    try {
      await refinementAPI.create({
        date: new Date(assignDate).toISOString(),
        purifiedRecordId: selectedCategory.purifiedRecordId,
        category: selectedCategory.category,
        count: parseInt(assignCount) || 0,
        weight: parseFloat(assignWeight) || 0,
        lostWeight: parseFloat(lostWeight) || 0,
        refinementWorkerId: assignWorkerId,
        workerFees: parseFloat(workerFees) || 0,
      });
      setSelectedCategory(null);
      loadData();
      Alert.alert("Success", "Category assigned to refinement.");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e.response?.data?.message || "Failed to assign.");
    }
  };

  const filteredAvailable = useMemo(() => {
    return availableCategories.filter(
      (a) =>
        a.remainingWeight >= 0.001 &&
        ((a.productMarker || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (a.category || "").toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [availableCategories, searchTerm]);

  const filteredProcesses = useMemo(() => {
    return processes.filter((p) => {
      const term = historySearchTerm.toLowerCase();
      const matchesSearch =
        (p.productMarker || "").toLowerCase().includes(term) ||
        (p.category || "").toLowerCase().includes(term) ||
        (p.refinementWorkerName || "").toLowerCase().includes(term);

      const recordDate = p.date ? p.date.slice(0, 10) : "";
      const matchesFrom = !historyFromDate || recordDate >= historyFromDate;
      const matchesTo = !historyToDate || recordDate <= historyToDate;

      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [processes, historySearchTerm, historyFromDate, historyToDate]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const term = historySearchTerm.toLowerCase();
      const matchesSearch =
        (r.productMarker || "").toLowerCase().includes(term) ||
        (r.category || "").toLowerCase().includes(term) ||
        (r.refinementWorkerName || "").toLowerCase().includes(term);

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
              Available ({filteredAvailable.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeSubTab === "history" && styles.tabActive]}
            onPress={() => setActiveSubTab("history")}
          >
            <Text style={[styles.tabText, activeSubTab === "history" && styles.tabTextActive]}>
              Ongoing ({filteredProcesses.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeSubTab === "stock" && styles.tabActive]}
            onPress={() => setActiveSubTab("stock")}
          >
            <Text style={[styles.tabText, activeSubTab === "stock" && styles.tabTextActive]}>
              Refined ({filteredRecords.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeSubTab === "available" ? (
          <View style={styles.searchContainer}>
            <View style={styles.searchWrapper}>
              <Search size={18} color="#94a3b8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search purified bundles..."
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
                placeholder="Search marker, category, worker..."
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
            keyExtractor={(item) => `${item.purifiedRecordId}-${item.category}`}
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
                  Weight: {item.remainingWeight.toFixed(3)} viss | Count: {item.remainingCount} bundles
                </Text>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.assignBtn]}
                  onPress={() => handleOpenAssign(item)}
                >
                  <Send size={14} color="white" />
                  <Text style={styles.actionBtnText}>Refine</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Sparkles size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>No bundles available for refinement</Text>
              </View>
            }
          />
        ) : activeSubTab === "history" ? (
          <FlatList
            data={filteredProcesses}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.markerText}>{item.productMarker}</Text>
                  <Text style={styles.weightText}>{item.weight.toFixed(3)} viss</Text>
                </View>
                <View style={styles.infoRow}>
                  <User size={14} color="#64748b" />
                  <Text style={styles.infoText}>Worker: {item.refinementWorkerName || "N/A"}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Calendar size={14} color="#64748b" />
                  <Text style={styles.infoText}>Assigned: {formatDateTime(item.date)}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Filter size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>No ongoing refinement processes</Text>
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
                  <Text style={[styles.weightText, styles.greenText]}>
                    {item.weight.toFixed(3)} viss
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <User size={14} color="#64748b" />
                  <Text style={styles.infoText}>Worker: {item.refinementWorkerName || "N/A"}</Text>
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
                <Text style={styles.emptyText}>No refinement stock records found</Text>
              </View>
            }
          />
        )}

        {/* Assign Modal Popup */}
        <Modal
          isOpen={selectedCategory !== null}
          onClose={() => setSelectedCategory(null)}
          title="Assign to Refinement"
        >
          {selectedCategory && (
            <View>
              <Text style={styles.modalSubText}>
                Marker: {selectedCategory.productMarker} | Category: {selectedCategory.category}
              </Text>

              <CustomInput
                label="Count (bundles)"
                keyboardType="numeric"
                value={assignCount}
                onChangeText={setAssignCount}
              />

              <CustomInput
                label="Weight (viss)"
                keyboardType="numeric"
                value={assignWeight}
                onChangeText={setAssignWeight}
              />

              <CustomInput
                label="Lost Weight (viss)"
                keyboardType="numeric"
                value={lostWeight}
                onChangeText={setLostWeight}
              />

              <CustomInput
                label="Worker Fees (MMK)"
                keyboardType="numeric"
                value={workerFees}
                onChangeText={setWorkerFees}
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

              <CustomButton
                title="Assign Now"
                onPress={handleAssign}
                style={styles.modalSubmitBtn}
              />
            </View>
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
  selectLabel: { fontSize: 12, fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: 6 },
  workerDropdown: { maxHeight: 120, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, backgroundColor: "#f8fafc", marginBottom: 16 },
  workerOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  workerOptionActive: { backgroundColor: "#dbeafe" },
  workerOptionText: { fontSize: 13, color: "#334155", fontWeight: "600" },
  workerOptionTextActive: { color: "#1e40af" },
  modalSubmitBtn: { marginTop: 8 },
  badge: { backgroundColor: "#eff6ff", borderColor: "#bfdbfe", borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#1d4ed8" },
});

export default RefinementScreen;
