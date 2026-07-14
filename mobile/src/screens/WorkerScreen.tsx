import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { workersAPI } from "../services/api";
import { Worker } from "../types";
import { CustomButton } from "../components/CustomButton";
import { CustomInput } from "../components/CustomInput";
import Modal from "../components/Modal";
import { Search, UserPlus, Trash2, ShieldAlert } from "lucide-react-native";

const WorkerScreen: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [assignWashGrading, setAssignWashGrading] = useState(false);
  const [assignMessLabour, setAssignMessLabour] = useState(false);
  const [assignGirdleBush, setAssignGirdleBush] = useState(false);
  const [assignSingleDoubleDrawn, setAssignSingleDoubleDrawn] = useState(false);
  const [assignSemiExportPurchase, setAssignSemiExportPurchase] = useState(false);

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await workersAPI.getAll();
      setWorkers(data);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to fetch workers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Name is required.");
      return;
    }

    try {
      await workersAPI.create({
        name: name.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        isActive: true,
        assignWashGrading,
        assignMessLabour,
        assignGirdleBush,
        assignSingleDoubleDrawn,
        assignSemiExportPurchase,
      });
      setIsCreateOpen(false);
      setName("");
      setPhoneNumber("");
      setAssignWashGrading(false);
      setAssignMessLabour(false);
      setAssignGirdleBush(false);
      setAssignSingleDoubleDrawn(false);
      setAssignSemiExportPurchase(false);
      fetchWorkers();
      Alert.alert("Success", "Worker created successfully.");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e.response?.data?.message || "Failed to create worker.");
    }
  };

  const handleDelete = (id: number, workerName: string) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete worker ${workerName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await workersAPI.delete(id);
              fetchWorkers();
              Alert.alert("Deleted", "Worker successfully removed.");
            } catch (e: any) {
              Alert.alert("Error", e.response?.data?.message || "Failed to delete.");
            }
          },
        },
      ]
    );
  };

  const filteredWorkers = useMemo(() => {
    return workers.filter(
      (w) =>
        (w.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.phoneNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.warehouseName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [workers, searchTerm]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.searchWrapper}>
            <Search size={18} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search worker by name, phone..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#94a3b8"
            />
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              setName("");
              setPhoneNumber("");
              setAssignWashGrading(false);
              setAssignMessLabour(false);
              setAssignGirdleBush(false);
              setAssignSingleDoubleDrawn(false);
              setAssignSemiExportPurchase(false);
              setIsCreateOpen(true);
            }}
          >
            <UserPlus size={18} color="white" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <FlatList
            data={filteredWorkers}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.name ? item.name[0].toUpperCase() : "W"}</Text>
                  </View>
                  <View style={styles.details}>
                    <Text style={styles.nameText}>{item.name}</Text>
                    <Text style={styles.roleText}>
                      {[
                        item.assignWashGrading && "Wash",
                        item.assignMessLabour && "Mess Labour",
                        item.assignGirdleBush && "Refinement",
                        item.assignSingleDoubleDrawn && "Drawn",
                        item.assignSemiExportPurchase && "Purchase",
                      ].filter(Boolean).join(", ") || "No assignments"}
                    </Text>
                    {item.phoneNumber ? (
                      <Text style={styles.phoneText}>{item.phoneNumber}</Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <Text style={styles.rateText}>{item.isActive ? "Active" : "Inactive"}</Text>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id, item.name)}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <ShieldAlert size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>No workers registered yet</Text>
              </View>
            }
          />
        )}

        {/* Create Worker Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Add New Worker"
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <CustomInput
              label="Worker Full Name"
              placeholder="Enter name"
              value={name}
              onChangeText={setName}
            />

            <CustomInput
              label="Phone Number"
              placeholder="Enter phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            <Text style={styles.selectLabel}>Assignments</Text>
            <View style={styles.checkboxContainer}>
              {[
                { label: "Wash & Grading", value: assignWashGrading, setter: setAssignWashGrading },
                { label: "Mess Labour", value: assignMessLabour, setter: setAssignMessLabour },
                { label: "Refinement (Girdle Bush)", value: assignGirdleBush, setter: setAssignGirdleBush },
                { label: "Single & Double Drawn", value: assignSingleDoubleDrawn, setter: setAssignSingleDoubleDrawn },
                { label: "Semi Export Purchase", value: assignSemiExportPurchase, setter: setAssignSemiExportPurchase },
              ].map((cb, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.checkboxItem, cb.value && styles.checkboxItemActive]}
                  onPress={() => cb.setter(!cb.value)}
                >
                  <Text style={[styles.checkboxLabel, cb.value && styles.checkboxLabelActive]}>
                    {cb.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <CustomButton
              title="Save Worker"
              onPress={handleCreate}
              style={styles.modalSubmitBtn}
            />
          </ScrollView>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1 },
  header: { flexDirection: "row", gap: 10, padding: 16, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  searchWrapper: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#f1f5f9", borderRadius: 12, paddingHorizontal: 12, height: 40 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#0f172a", height: "100%" },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#2563eb", justifyContent: "center", alignItems: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContainer: { padding: 16, gap: 12 },
  card: { flexDirection: "row", backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", padding: 16, justifyContent: "space-between", alignItems: "center" },
  cardInfo: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 16, fontWeight: "800", color: "#2563eb" },
  details: { flex: 1 },
  nameText: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  roleText: { fontSize: 12, color: "#64748b", fontWeight: "600", marginTop: 2 },
  phoneText: { fontSize: 11, color: "#94a3b8", marginTop: 1 },
  cardActions: { alignItems: "flex-end", gap: 10 },
  rateText: { fontSize: 13, fontWeight: "700", color: "#059669" },
  deleteBtn: { padding: 6, borderRadius: 8, backgroundColor: "#fff5f5" },
  emptyState: { alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  emptyText: { fontSize: 13, color: "#94a3b8", fontWeight: "600" },
  selectLabel: { fontSize: 12, fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: 8, marginTop: 10 },
  checkboxContainer: { gap: 8, marginBottom: 20 },
  checkboxItem: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#cbd5e1", backgroundColor: "#f8fafc" },
  checkboxItemActive: { borderColor: "#2563eb", backgroundColor: "#dbeafe" },
  checkboxLabel: { fontSize: 13, fontWeight: "600", color: "#475569" },
  checkboxLabelActive: { color: "#1e40af" },
  modalSubmitBtn: { marginTop: 8, marginBottom: 24 },
});

export default WorkerScreen;
