import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, SafeAreaView, ScrollView,
} from "react-native";
import { semiExportAPI, singleDoubleDrawnAPI } from "../services/api";
import { SingleDoubleDrawnRecord, SemiExportRecord } from "../types";
import { CustomButton } from "../components/CustomButton";
import { CustomInput } from "../components/CustomInput";
import Modal from "../components/Modal";
import { Search, Send, Calendar, User, Filter, Package } from "lucide-react-native";
import { formatDateTime, getMyanmarNow } from "../utils/format";

const SemiExportScreen: React.FC = () => {
  const [available, setAvailable] = useState<SingleDoubleDrawnRecord[]>([]);
  const [processes, setProcesses] = useState<SemiExportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "progress">("available");
  const [searchTerm, setSearchTerm] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [selected, setSelected] = useState<SingleDoubleDrawnRecord | null>(null);
  const [workerFees, setWorkerFees] = useState("0");
  const [remark, setRemark] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [avail, procs] = await Promise.all([
        singleDoubleDrawnAPI.getAll(),
        semiExportAPI.getAll(),
      ]);
      setAvailable(avail);
      setProcesses(procs);
    } catch (e) {
      Alert.alert("Error", "Failed to load Semi Export data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAssign = async () => {
    if (!selected) return;
    try {
      await semiExportAPI.upsert({
        singleDoubleDrawnRecordId: selected.id,
        workerFees: parseFloat(workerFees) || 0,
        remark: remark.trim(),
        exchangeRateId: null,
      });
      setSelected(null);
      setWorkerFees("0");
      setRemark("");
      loadData();
      Alert.alert("Success", "Assigned to Semi Export.");
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || "Failed to assign.");
    }
  };

  const filteredAvailable = useMemo(() =>
    available.filter(a =>
      (a.refinementRecordMarker || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.refinementRecordCategory || "").toLowerCase().includes(searchTerm.toLowerCase())
    ), [available, searchTerm]);

  const filteredProcesses = useMemo(() =>
    processes.filter(p => {
      const t = historySearch.toLowerCase();
      const match =
        (p.refinementRecordMarker || "").toLowerCase().includes(t) ||
        (p.refinementRecordCategory || "").toLowerCase().includes(t);
      const d = p.date ? p.date.slice(0, 10) : "";
      return match && (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
    }), [processes, historySearch, fromDate, toDate]);

  // Calculate total weight from sizes for a SingleDoubleDrawnRecord
  const getTotalWeight = (r: SingleDoubleDrawnRecord) => {
    return (r.size6 + r.size7 + r.size8 + r.size9 + r.size10 + r.size10B +
      r.size12 + r.size14 + r.size16 + r.size18 + r.size20 +
      r.size22 + r.size24 + r.size26 + r.size28 + r.sizeBar);
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.tabs}>
          {(["available", "progress"] as const).map(tab => (
            <TouchableOpacity key={tab} style={[s.tab, activeTab === tab && s.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {tab === "available" ? `Drawn Stock (${filteredAvailable.length})` : `Semi Exports (${filteredProcesses.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "available" ? (
          <View style={s.searchBar}>
            <Search size={16} color="#94a3b8" />
            <TextInput style={s.searchInput} placeholder="Search marker, category..." value={searchTerm} onChangeText={setSearchTerm} placeholderTextColor="#94a3b8" />
          </View>
        ) : (
          <View style={s.filterBar}>
            <View style={[s.searchBar, { flex: 1 }]}>
              <Search size={16} color="#94a3b8" />
              <TextInput style={s.searchInput} placeholder="Search..." value={historySearch} onChangeText={setHistorySearch} placeholderTextColor="#94a3b8" />
            </View>
            <TextInput style={s.dateInput} placeholder="From" value={fromDate} onChangeText={setFromDate} />
            <TextInput style={s.dateInput} placeholder="To" value={toDate} onChangeText={setToDate} />
          </View>
        )}

        {loading ? <ActivityIndicator style={s.loader} size="large" color="#2563eb" /> : (
          activeTab === "available" ? (
            <FlatList data={filteredAvailable} keyExtractor={i => i.id.toString()} contentContainerStyle={s.list}
              renderItem={({ item }) => (
                <View style={s.card}>
                  <View style={s.cardRow}>
                    <Text style={s.marker}>{item.refinementRecordMarker || "N/A"}</Text>
                    <Text style={s.weight}>{getTotalWeight(item).toFixed(3)} viss</Text>
                  </View>
                  <Text style={s.detail}>Category: {item.refinementRecordCategory || "N/A"}</Text>
                  <Text style={s.detail}>Worker: {item.workerName || "N/A"}</Text>
                  <TouchableOpacity style={s.btnPrimary} onPress={() => { setSelected(item); setWorkerFees("0"); setRemark(""); }}>
                    <Send size={14} color="white" /><Text style={s.btnText}>Assign to Semi Export</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<View style={s.empty}><Package size={40} color="#cbd5e1" /><Text style={s.emptyText}>No drawn stock available</Text></View>}
            />
          ) : (
            <FlatList data={filteredProcesses} keyExtractor={i => i.id.toString()} contentContainerStyle={s.list}
              renderItem={({ item }) => (
                <View style={s.card}>
                  <View style={s.cardRow}>
                    <Text style={s.marker}>{item.refinementRecordMarker}</Text>
                    <Text style={s.weight}>{(item.workerFees || 0).toLocaleString()} MMK fees</Text>
                  </View>
                  <Text style={s.detail}>Category: {item.refinementRecordCategory}</Text>
                  <Text style={s.detail}>Remark: {item.remark || "—"}</Text>
                  <View style={s.infoRow}><Calendar size={13} color="#64748b" /><Text style={s.infoText}>{formatDateTime(item.date)}</Text></View>
                </View>
              )}
              ListEmptyComponent={<View style={s.empty}><Filter size={40} color="#cbd5e1" /><Text style={s.emptyText}>No semi export records</Text></View>}
            />
          )
        )}

        <Modal isOpen={selected !== null} onClose={() => setSelected(null)} title="Assign to Semi Export">
          {selected && (
            <View>
              <Text style={s.modalSub}>Marker: {selected.refinementRecordMarker} | Category: {selected.refinementRecordCategory}</Text>
              <CustomInput label="Worker Fees (MMK)" keyboardType="numeric" value={workerFees} onChangeText={setWorkerFees} />
              <CustomInput label="Remark" value={remark} onChangeText={setRemark} placeholder="Optional note" multiline />
              <CustomButton title="Assign Now" onPress={handleAssign} style={{ marginTop: 12 }} />
            </View>
          )}
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1 },
  tabs: { flexDirection: "row", backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: "#2563eb" },
  tabText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  tabTextActive: { color: "#2563eb" },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "white", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  searchInput: { flex: 1, fontSize: 14, color: "#0f172a", height: 36, backgroundColor: "#f1f5f9", borderRadius: 10, paddingHorizontal: 10 },
  filterBar: { flexDirection: "row", gap: 8, padding: 12, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", flexWrap: "wrap" },
  dateInput: { height: 36, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, paddingHorizontal: 8, fontSize: 12, color: "#334155", backgroundColor: "white", minWidth: 90 },
  loader: { flex: 1, alignSelf: "center", marginTop: 60 },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", padding: 16, gap: 6 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  marker: { fontSize: 15, fontWeight: "800", color: "#1e293b" },
  weight: { fontSize: 13, fontWeight: "700", color: "#2563eb" },
  detail: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  btnPrimary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#2563eb", borderRadius: 8, paddingVertical: 10, marginTop: 8 },
  btnText: { color: "white", fontWeight: "700", fontSize: 13 },
  empty: { alignItems: "center", padding: 40, gap: 12 },
  emptyText: { fontSize: 13, color: "#94a3b8", fontWeight: "600", textAlign: "center" },
  modalSub: { fontSize: 13, color: "#64748b", fontWeight: "600", marginBottom: 12 },
});

export default SemiExportScreen;
