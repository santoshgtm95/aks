import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity, ScrollView,
  ActivityIndicator, TextInput, Alert, SafeAreaView,
} from "react-native";
import { exportAPI, exchangeRatesAPI, ledgerAPI } from "../services/api";
import { ExchangeRate, LedgerDto } from "../types";
import { CustomButton } from "../components/CustomButton";
import { CustomInput } from "../components/CustomInput";
import Modal from "../components/Modal";
import { FileText, Search, Calendar, Plus } from "lucide-react-native";
import { formatDateTime, getMyanmarNow } from "../utils/format";

const Sales6Screen: React.FC = () => {
  const [exports, setExports] = useState<any[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [ledgers, setLedgers] = useState<LedgerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"form" | "history">("form");
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Form State
  const [selectedLedgerId, setSelectedLedgerId] = useState<number | null>(null);
  const [date, setDate] = useState(getMyanmarNow());
  const [selectedColors, setSelectedColors] = useState("Regular");
  const [weightViss, setWeightViss] = useState("");
  const [amountMMK, setAmountMMK] = useState("");
  const [amountCNY, setAmountCNY] = useState("");
  const [workerFees, setWorkerFees] = useState("0");
  const [sellingPrice, setSellingPrice] = useState("");
  const [selectedRateId, setSelectedRateId] = useState<number | null>(null);

  // New Ledger Modal
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [newLedgerName, setNewLedgerName] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [exp, rates, ledg] = await Promise.all([
        exportAPI.getAll(),
        exchangeRatesAPI.getAll(),
        ledgerAPI.getAll(),
      ]);
      setExports(exp);
      setExchangeRates(rates);
      setLedgers(ledg);
    } catch (e) {
      Alert.alert("Error", "Failed to load export data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const activeRates = useMemo(() => exchangeRates.filter(r => r.activeStatus), [exchangeRates]);

  const handleCreateLedger = async () => {
    if (!newLedgerName.trim()) return;
    try {
      const created = await ledgerAPI.create({
        ledgerName: newLedgerName.trim(),
        date: new Date().toISOString(),
        description: "Created via Mobile",
        markers: [],
      });
      setLedgers(prev => [...prev, created]);
      setSelectedLedgerId(created.id);
      setIsLedgerModalOpen(false);
      setNewLedgerName("");
      Alert.alert("Success", "Customer Ledger created.");
    } catch (e) {
      Alert.alert("Error", "Failed to create ledger.");
    }
  };

  const handleSubmit = async () => {
    if (!selectedLedgerId) {
      Alert.alert("Validation", "Please select a customer ledger.");
      return;
    }
    const weight = parseFloat(weightViss);
    if (!weight || weight <= 0) {
      Alert.alert("Validation", "Please enter a valid weight.");
      return;
    }

    try {
      await exportAPI.create({
        ledgerId: selectedLedgerId,
        date: new Date(date).toISOString(),
        selectedColors,
        selectedWeight: weight,
        totalExportWeightViss: weight,
        totalExportWeightKg: weight * 1.633,
        productAmountCNY: parseFloat(amountCNY) || 0,
        productAmountMMK: parseFloat(amountMMK) || 0,
        workerFees: parseFloat(workerFees) || 0,
        grandTotalMMK: (parseFloat(amountMMK) || 0) + (parseFloat(workerFees) || 0),
        exchangeRateId: selectedRateId,
        sellingPrice: parseFloat(sellingPrice) || 0,
        sizeSellingPrices: "{}",
      });

      setWeightViss("");
      setAmountMMK("");
      setAmountCNY("");
      setWorkerFees("0");
      setSellingPrice("");
      loadData();
      Alert.alert("Success", "Export sale recorded.");
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || "Failed to save export sale.");
    }
  };

  const filtered = useMemo(() =>
    exports.filter(e => {
      const t = searchTerm.toLowerCase();
      const match = (e.ledgerName || "").toLowerCase().includes(t) || (e.selectedColors || "").toLowerCase().includes(t);
      const d = (e.date || "").slice(0, 10);
      return match && (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
    }), [exports, searchTerm, fromDate, toDate]);

  return (
    <SafeAreaView style={st.safe}>
      <View style={st.container}>
        <View style={st.tabs}>
          {(["form", "history"] as const).map(tab => (
            <TouchableOpacity key={tab} style={[st.tab, activeTab === tab && st.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>
                {tab === "form" ? "New Export" : `Export History (${filtered.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "form" ? (
          <ScrollView contentContainerStyle={st.formContainer}>
            <Text style={st.label}>Select Customer Ledger</Text>
            <View style={st.ledgerRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.pillsScroll}>
                {ledgers.map(l => (
                  <TouchableOpacity key={l.id} style={[st.pill, selectedLedgerId === l.id && st.pillActive]} onPress={() => setSelectedLedgerId(l.id)}>
                    <Text style={[st.pillText, selectedLedgerId === l.id && st.pillTextActive]}>{l.ledgerName}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={st.addLedgerBtn} onPress={() => setIsLedgerModalOpen(true)}>
                <Plus size={16} color="white" />
              </TouchableOpacity>
            </View>

            <CustomInput label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
            <CustomInput label="Selected Colors" value={selectedColors} onChangeText={setSelectedColors} placeholder="e.g. Regular, Black" />
            <CustomInput label="Weight (viss)" keyboardType="numeric" value={weightViss} onChangeText={setWeightViss} />
            <CustomInput label="Amount (MMK)" keyboardType="numeric" value={amountMMK} onChangeText={setAmountMMK} />
            <CustomInput label="Amount (CNY)" keyboardType="numeric" value={amountCNY} onChangeText={setAmountCNY} />
            <CustomInput label="Worker Fees (MMK)" keyboardType="numeric" value={workerFees} onChangeText={setWorkerFees} />
            <CustomInput label="Selling Price" keyboardType="numeric" value={sellingPrice} onChangeText={setSellingPrice} placeholder="Enter price per viss" />

            {activeRates.length > 0 && (
              <>
                <Text style={st.label}>Exchange Rate</Text>
                <View style={st.rateContainer}>
                  {activeRates.map(r => (
                    <TouchableOpacity key={r.id} style={[st.ratePill, selectedRateId === r.id && st.ratePillActive]} onPress={() => setSelectedRateId(r.id)}>
                      <Text style={[st.ratePillText, selectedRateId === r.id && st.ratePillTextActive]}>
                        1 {r.fromCurrency} = {r.rate.toLocaleString()} MMK
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <CustomButton title="Create Export Record" onPress={handleSubmit} style={{ marginTop: 16, marginBottom: 40 }} />
          </ScrollView>
        ) : (
          <>
            <View style={st.filterBar}>
              <View style={[st.searchBox, { flex: 1 }]}>
                <Search size={16} color="#94a3b8" />
                <TextInput style={st.searchInput} placeholder="Search ledger customer..." value={searchTerm} onChangeText={setSearchTerm} placeholderTextColor="#94a3b8" />
              </View>
              <TextInput style={st.dateInput} placeholder="From" value={fromDate} onChangeText={setFromDate} />
              <TextInput style={st.dateInput} placeholder="To" value={toDate} onChangeText={setToDate} />
            </View>
            {loading ? <ActivityIndicator style={st.loader} size="large" color="#2563eb" /> : (
              <FlatList data={filtered} keyExtractor={i => i.id.toString()} contentContainerStyle={st.list}
                renderItem={({ item }) => (
                  <View style={st.card}>
                    <View style={st.cardRow}>
                      <Text style={st.marker}>{item.ledgerName}</Text>
                      <Text style={st.price}>{item.grandTotalMMK?.toLocaleString()} MMK</Text>
                    </View>
                    <Text style={st.detail}>Colors: {item.selectedColors} | Price: {item.sellingPrice}</Text>
                    <View style={st.cardRow}>
                      <Text style={st.weight}>{(item.totalExportWeightViss || 0).toFixed(3)} viss</Text>
                      <Text style={st.detail}>{(item.totalExportWeightKg || 0).toFixed(3)} kg</Text>
                    </View>
                    <View style={st.infoRow}><Calendar size={12} color="#94a3b8" /><Text style={st.infoText}>{formatDateTime(item.date)}</Text></View>
                  </View>
                )}
                ListEmptyComponent={<View style={st.empty}><FileText size={40} color="#cbd5e1" /><Text style={st.emptyText}>No export records found</Text></View>}
              />
            )}
          </>
        )}

        {/* New Ledger Modal */}
        <Modal isOpen={isLedgerModalOpen} onClose={() => setIsLedgerModalOpen(false)} title="New Customer Ledger">
          <View>
            <CustomInput label="Customer / Ledger Name" value={newLedgerName} onChangeText={setNewLedgerName} placeholder="Enter name" />
            <CustomButton title="Save Customer" onPress={handleCreateLedger} style={{ marginTop: 12 }} />
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1 },
  tabs: { flexDirection: "row", backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: "#2563eb" },
  tabText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  tabTextActive: { color: "#2563eb" },
  formContainer: { padding: 16, gap: 4 },
  label: { fontSize: 12, fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: 8, marginTop: 4 },
  ledgerRow: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 12 },
  pillsScroll: { flex: 1 },
  pill: { marginRight: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#cbd5e1", backgroundColor: "#f8fafc", justifyContent: "center" },
  pillActive: { borderColor: "#2563eb", backgroundColor: "#dbeafe" },
  pillText: { fontSize: 13, fontWeight: "700", color: "#475569" },
  pillTextActive: { color: "#1e40af" },
  addLedgerBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: "#2563eb", justifyContent: "center", alignItems: "center" },
  rateContainer: { gap: 6, marginBottom: 16 },
  ratePill: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: "#cbd5e1", backgroundColor: "#f8fafc" },
  ratePillActive: { borderColor: "#2563eb", backgroundColor: "#dbeafe" },
  ratePillText: { fontSize: 12, fontWeight: "600", color: "#475569" },
  ratePillTextActive: { color: "#1e40af" },
  filterBar: { flexDirection: "row", gap: 8, padding: 12, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f1f5f9", borderRadius: 10, paddingHorizontal: 10, height: 36 },
  searchInput: { flex: 1, fontSize: 14, color: "#0f172a" },
  dateInput: { height: 36, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, paddingHorizontal: 8, fontSize: 12, color: "#334155", backgroundColor: "white", minWidth: 90 },
  loader: { flex: 1, alignSelf: "center", marginTop: 60 },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", padding: 16, gap: 6 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  marker: { fontSize: 15, fontWeight: "800", color: "#1e293b" },
  weight: { fontSize: 14, fontWeight: "700", color: "#2563eb" },
  price: { fontSize: 14, fontWeight: "700", color: "#059669" },
  detail: { fontSize: 12, color: "#64748b" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  infoText: { fontSize: 11, color: "#94a3b8" },
  empty: { alignItems: "center", padding: 40, gap: 12 },
  emptyText: { fontSize: 13, color: "#94a3b8", fontWeight: "600", textAlign: "center" },
});

export default Sales6Screen;
