import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  FlatList,
  TextInput,
  Alert,
  SafeAreaView,
} from "react-native";
import { washGradingAPI, workersAPI } from "../services/api";
import {
  AvailableProductDto,
  WashGradingProcess,
  WashGradingRecord,
  WashGradingWorker,
} from "../types";
import { CustomButton } from "../components/CustomButton";
import { CustomInput } from "../components/CustomInput";
import Modal from "../components/Modal";
import { Search, Calendar, User, Send, Sparkles, Filter } from "lucide-react-native";
import { formatDateTime, getMyanmarNow } from "../utils/format";

// Backend always expects weight in viss. Convert kg→viss if the product unit is kg.
const getVissWeight = (product: AvailableProductDto): number => {
  const isKg =
    (product.unit ?? "").toLowerCase().includes("kg") ||
    (product.unit ?? "").toLowerCase().includes("kilogram");
  return isKg ? product.remainingWeight / 1.633 : product.remainingWeight;
};

const WashGradingScreen: React.FC = () => {
  const [availableProducts, setAvailableProducts] = useState<AvailableProductDto[]>([]);
  const [processes, setProcesses] = useState<WashGradingProcess[]>([]);
  const [records, setRecords] = useState<WashGradingRecord[]>([]);
  const [workers, setWorkers] = useState<WashGradingWorker[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab State
  const [activeSubTab, setActiveSubTab] = useState<"available" | "history" | "stock">("available");

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historyFromDate, setHistoryFromDate] = useState("");
  const [historyToDate, setHistoryToDate] = useState("");

  // Assign Modal
  const [selectedProduct, setSelectedProduct] = useState<AvailableProductDto | null>(null);
  const [assignWorkerId, setAssignWorkerId] = useState<number>(0);
  const [assignWeight, setAssignWeight] = useState("");
  const [lostWeight, setLostWeight] = useState("0");
  const [workerFees, setWorkerFees] = useState("0");
  const [assignDate, setAssignDate] = useState(getMyanmarNow());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [avail, procs, recs, workersData] = await Promise.all([
        washGradingAPI.getAvailableProducts(),
        washGradingAPI.getAll(),
        washGradingAPI.getRecords(),
        workersAPI.getWashGradingWorkers(),
      ]);
      setAvailableProducts(avail);
      setProcesses(procs);
      setRecords(recs);
      setWorkers(workersData);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to load Wash & Grading data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAssign = (product: AvailableProductDto) => {
    setSelectedProduct(product);
    setAssignWorkerId(0);
    // Pre-fill with viss weight (the API always expects viss)
    setAssignWeight(getVissWeight(product).toFixed(3));
    setLostWeight("0");
    setWorkerFees("0");
    setAssignDate(getMyanmarNow());
  };

  const handleAssign = async () => {
    if (!selectedProduct) return;
    if (!assignWorkerId) {
      Alert.alert("Validation", "Please select a wash/grading worker.");
      return;
    }
    const w = parseFloat(assignWeight) || 0;
    if (w <= 0) {
      Alert.alert("Validation", "Please enter a valid weight greater than 0.");
      return;
    }

    try {
      await washGradingAPI.create({
        date: new Date(assignDate).toISOString(),
        productId: selectedProduct.productId,
        weight: w,
        lostWeight: parseFloat(lostWeight) || 0,
        washGradingWorkerId: assignWorkerId,
        workerFees: parseFloat(workerFees) || 0,
      });
      setSelectedProduct(null);
      loadData();
      Alert.alert("Success", "Raw bundle assigned to wash/grading.");
    } catch (e: any) {
      const resp = e?.response;
      const serverMsg = resp?.data?.message || resp?.data?.title || JSON.stringify(resp?.data);
      const errMsg = serverMsg
        ? `${serverMsg}`
        : e?.message
        ? `Network error: ${e.message}`
        : "Unknown error. Check console.";
      console.error("handleAssign error:", JSON.stringify(e?.response?.data), e?.message);
      Alert.alert("Assign Failed", errMsg);
    }
  };

  const handleSkip = async (product: AvailableProductDto) => {
    const vissWeight = getVissWeight(product);
    Alert.alert(
      "Skip Wash/Grading",
      `Skip wash/grading for ${product.productMarker}?\n\nWill move ${vissWeight.toFixed(3)} viss to stock.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Skip & Move to Stock",
          onPress: async () => {
            try {
              await washGradingAPI.createRecord({
                date: new Date().toISOString(),
                productId: product.productId,
                weight: vissWeight,
                lostWeight: 0,
                washGradingWorkerId: undefined,
                workerFees: 0,
              });
              loadData();
              Alert.alert("Success", `${product.productMarker} moved to washed stock.`);
            } catch (e: any) {
              const resp = e?.response;
              const serverMsg = resp?.data?.message || resp?.data?.title || JSON.stringify(resp?.data);
              const errMsg = serverMsg
                ? `${serverMsg}`
                : e?.message
                ? `Network error: ${e.message}`
                : "Unknown error. Check console.";
              console.error("handleSkip error:", JSON.stringify(e?.response?.data), e?.message);
              Alert.alert("Skip Failed", errMsg);
            }
          },
        },
      ]
    );
  };

  const filteredAvailable = useMemo(() => {
    return availableProducts.filter(
      (a) =>
        a.remainingWeight >= 0.001 &&
        ((a.productMarker || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (a.warehouseName || "").toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [availableProducts, searchTerm]);

  const filteredProcesses = useMemo(() => {
    return processes.filter((p) => {
      const term = historySearchTerm.toLowerCase();
      const matchesSearch =
        (p.productMarker || "").toLowerCase().includes(term) ||
        (p.washGradingWorkerName || "").toLowerCase().includes(term);

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
        (r.washGradingWorkerName || "").toLowerCase().includes(term);

      const recordDate = r.date ? r.date.slice(0, 10) : "";
      const matchesFrom = !historyFromDate || recordDate >= historyFromDate;
      const matchesTo = !historyToDate || recordDate <= historyToDate;

      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [records, historySearchTerm, historyFromDate, historyToDate]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Sub-Tab navigation bar */}
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
              Washed ({filteredRecords.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar section */}
        {activeSubTab === "available" ? (
          <View style={styles.searchContainer}>
            <View style={styles.searchWrapper}>
              <Search size={18} color="#94a3b8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search raw bundles..."
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
            keyExtractor={(item) => item.productId.toString()}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.markerText}>{item.productMarker}</Text>
                  <Text style={styles.weightText}>{item.remainingWeight.toFixed(3)} viss</Text>
                </View>
                <Text style={styles.detailText}>Warehouse: {item.warehouseName || "N/A"}</Text>
                <View style={styles.actionRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionBtn,
                      styles.assignBtn,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => handleOpenAssign(item)}
                  >
                    <Send size={14} color="white" />
                    <Text style={styles.actionBtnText}>Assign Wash</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionBtn,
                      styles.skipBtn,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => handleSkip(item)}
                  >
                    <Text style={[styles.actionBtnText, styles.skipBtnText]}>Skip step</Text>
                  </Pressable>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Sparkles size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>No bundles available for washing</Text>
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
                  <Text style={styles.infoText}>Worker: {item.washGradingWorkerName || "N/A"}</Text>
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
                <Text style={styles.emptyText}>No ongoing wash processes</Text>
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
                  <Text style={styles.infoText}>Worker: {item.washGradingWorkerName || "Skipped"}</Text>
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
                <Text style={styles.emptyText}>No washed stock records found</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Assign Modal — rendered outside container so its invisible overlay
          does NOT block touches on the FlatList cards below */}
      <Modal
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        title="Assign to Wash & Grading"
      >
        {selectedProduct && (
          <View>
            <Text style={styles.modalSubText}>
              Marker: {selectedProduct.productMarker}
            </Text>
            <Text style={[styles.modalSubText, { color: "#64748b", marginTop: -8 }]}>
              Remaining: {getVissWeight(selectedProduct).toFixed(3)} viss
              {selectedProduct.unit?.toLowerCase().includes("kg")
                ? ` (${selectedProduct.remainingWeight.toFixed(3)} ${selectedProduct.unit})`
                : ""}
            </Text>

            <CustomInput
              label="Assign Weight (viss)"
              keyboardType="numeric"
              value={assignWeight}
              onChangeText={setAssignWeight}
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
  greenText: {
    color: "#10b981",
  },
  detailText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
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
  skipBtn: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "white",
  },
  skipBtnText: {
    color: "#475569",
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
    marginBottom: 6,
  },
  workerDropdown: {
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    marginBottom: 16,
  },
  workerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  workerOptionActive: {
    backgroundColor: "#dbeafe",
  },
  workerOptionText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "600",
  },
  workerOptionTextActive: {
    color: "#1e40af",
  },
  modalSubmitBtn: {
    marginTop: 8,
  },
});

export default WashGradingScreen;
