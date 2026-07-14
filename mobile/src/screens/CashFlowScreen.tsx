import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, SafeAreaView, ScrollView,
} from "react-native";
import { cashFlowAPI } from "../services/api";
import { CustomButton } from "../components/CustomButton";
import { CustomInput } from "../components/CustomInput";
import Modal from "../components/Modal";
import { DollarSign, Search, CreditCard, CheckCircle } from "lucide-react-native";
import { getMyanmarNow } from "../utils/format";

interface WorkerCashFlow {
  workerName: string;
  workerId: number | null;
  purifierId: number | null;
  messLabourFees: number;
  purificationFees: number;
  purificationSupervisorFees: number;
  refinementFees: number;
  washGradingFees: number;
  singleDoubleDrawnFees: number;
  semiExportPurchaseFees: number;
  totalFees: number;
  paidAmount: number;
  unpaidAmount: number;
}

const FEE_LABELS: [keyof WorkerCashFlow, string][] = [
  ["washGradingFees", "Wash & Grading"],
  ["messLabourFees", "Mess Labour"],
  ["purificationFees", "Purification"],
  ["purificationSupervisorFees", "Purification Supervisor"],
  ["refinementFees", "Refinement"],
  ["singleDoubleDrawnFees", "Single/Double Drawn"],
  ["semiExportPurchaseFees", "Semi Export Purchase"],
];

const CashFlowScreen: React.FC = () => {
  const [data, setData] = useState<WorkerCashFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedWorker, setSelectedWorker] = useState<WorkerCashFlow | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentDate, setPaymentDate] = useState(getMyanmarNow());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await cashFlowAPI.getAll(
        undefined,
        fromDate || undefined,
        toDate || undefined,
      );
      setData(result);
    } catch (e) {
      Alert.alert("Error", "Failed to load cash flow data.");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePay = async () => {
    if (!selectedWorker) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) { Alert.alert("Validation", "Enter a valid payment amount."); return; }
    try {
      await cashFlowAPI.makePayment({
        workerName: selectedWorker.workerName,
        amount,
        note: paymentNote || undefined,
      });
      setSelectedWorker(null);
      setPaymentAmount(""); setPaymentNote("");
      fetchData();
      Alert.alert("Success", "Payment recorded.");
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || "Failed to record payment.");
    }
  };

  const filtered = useMemo(() =>
    data.filter(w => (w.workerName || "").toLowerCase().includes(searchTerm.toLowerCase())),
    [data, searchTerm]);

  const totalFees = filtered.reduce((s, w) => s + w.totalFees, 0);
  const totalPaid = filtered.reduce((s, w) => s + w.paidAmount, 0);
  const totalUnpaid = filtered.reduce((s, w) => s + w.unpaidAmount, 0);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.filterBar}>
          <View style={[s.searchBox, { flex: 1 }]}>
            <Search size={16} color="#94a3b8" />
            <TextInput style={s.searchInput} placeholder="Search worker..." value={searchTerm} onChangeText={setSearchTerm} placeholderTextColor="#94a3b8" />
          </View>
          <TextInput style={s.dateInput} placeholder="From" value={fromDate} onChangeText={setFromDate} />
          <TextInput style={s.dateInput} placeholder="To" value={toDate} onChangeText={setToDate} />
        </View>

        <View style={s.summaryBanner}>
          <View style={s.summaryItem}><Text style={s.summaryLabel}>Total Fees</Text><Text style={s.summaryValue}>{totalFees.toLocaleString()}</Text></View>
          <View style={s.summaryItem}><Text style={s.summaryLabel}>Paid</Text><Text style={[s.summaryValue, { color: "#10b981" }]}>{totalPaid.toLocaleString()}</Text></View>
          <View style={s.summaryItem}><Text style={s.summaryLabel}>Unpaid</Text><Text style={[s.summaryValue, { color: totalUnpaid > 0 ? "#ef4444" : "#10b981" }]}>{totalUnpaid.toLocaleString()}</Text></View>
        </View>

        {loading ? <ActivityIndicator style={s.loader} size="large" color="#2563eb" /> : (
          <FlatList data={filtered} keyExtractor={(_, i) => i.toString()} contentContainerStyle={s.list}
            renderItem={({ item }) => (
              <View style={s.card}>
                <View style={s.cardRow}>
                  <Text style={s.workerName}>{item.workerName}</Text>
                  <Text style={[s.unpaidBadge, item.unpaidAmount > 0 ? s.unpaidRed : s.unpaidGreen]}>
                    {item.unpaidAmount > 0 ? `Owes ${item.unpaidAmount.toLocaleString()}` : "Paid up"}
                  </Text>
                </View>
                <View style={s.feeRow}>
                  <Text style={s.feeLabel}>Total</Text><Text style={s.feeValue}>{item.totalFees.toLocaleString()} MMK</Text>
                </View>
                <View style={s.feeRow}>
                  <Text style={s.feeLabel}>Paid</Text><Text style={[s.feeValue, { color: "#10b981" }]}>{item.paidAmount.toLocaleString()} MMK</Text>
                </View>
                {FEE_LABELS.filter(([key]) => (item[key] as number) > 0).map(([key, label]) => (
                  <View key={key} style={s.breakdownRow}>
                    <Text style={s.breakdownLabel}>{label}</Text>
                    <Text style={s.breakdownValue}>{(item[key] as number).toLocaleString()}</Text>
                  </View>
                ))}
                {item.unpaidAmount > 0 && (
                  <TouchableOpacity style={s.payBtn} onPress={() => { setSelectedWorker(item); setPaymentAmount(item.unpaidAmount.toString()); setPaymentDate(getMyanmarNow()); }}>
                    <CreditCard size={14} color="white" />
                    <Text style={s.payBtnText}>Record Payment</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            ListEmptyComponent={<View style={s.empty}><DollarSign size={40} color="#cbd5e1" /><Text style={s.emptyText}>No worker cash flow data</Text></View>}
          />
        )}

        <Modal isOpen={selectedWorker !== null} onClose={() => setSelectedWorker(null)} title="Record Payment">
          {selectedWorker && (
            <View>
              <Text style={s.modalSub}>Worker: {selectedWorker.workerName} | Unpaid: {selectedWorker.unpaidAmount.toLocaleString()} MMK</Text>
              <CustomInput label="Payment Amount (MMK)" keyboardType="numeric" value={paymentAmount} onChangeText={setPaymentAmount} />
              <CustomInput label="Note" value={paymentNote} onChangeText={setPaymentNote} placeholder="Optional note" />
              <CustomInput label="Date" value={paymentDate} onChangeText={setPaymentDate} placeholder="YYYY-MM-DD" />
              <CustomButton title="Confirm Payment" onPress={handlePay} style={{ marginTop: 12 }} />
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
  filterBar: { flexDirection: "row", gap: 8, padding: 12, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f1f5f9", borderRadius: 10, paddingHorizontal: 10, height: 36 },
  searchInput: { flex: 1, fontSize: 14, color: "#0f172a" },
  dateInput: { height: 36, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, paddingHorizontal: 8, fontSize: 12, color: "#334155", backgroundColor: "white", minWidth: 90 },
  summaryBanner: { flexDirection: "row", backgroundColor: "#1e293b", padding: 16, gap: 0 },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryLabel: { fontSize: 11, color: "#94a3b8", fontWeight: "600", textTransform: "uppercase" },
  summaryValue: { fontSize: 15, fontWeight: "800", color: "white", marginTop: 4 },
  loader: { flex: 1, alignSelf: "center", marginTop: 60 },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", padding: 16, gap: 6 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  workerName: { fontSize: 16, fontWeight: "800", color: "#1e293b" },
  unpaidBadge: { fontSize: 11, fontWeight: "700", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  unpaidRed: { backgroundColor: "#fef2f2", color: "#dc2626" },
  unpaidGreen: { backgroundColor: "#f0fdf4", color: "#16a34a" },
  feeRow: { flexDirection: "row", justifyContent: "space-between" },
  feeLabel: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  feeValue: { fontSize: 13, fontWeight: "700", color: "#1e293b" },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between", paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: "#e2e8f0" },
  breakdownLabel: { fontSize: 11, color: "#94a3b8" },
  breakdownValue: { fontSize: 11, color: "#64748b", fontWeight: "600" },
  payBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#059669", borderRadius: 8, paddingVertical: 10, marginTop: 8 },
  payBtnText: { color: "white", fontWeight: "700", fontSize: 13 },
  empty: { alignItems: "center", padding: 40, gap: 12 },
  emptyText: { fontSize: 13, color: "#94a3b8", fontWeight: "600", textAlign: "center" },
  modalSub: { fontSize: 13, color: "#64748b", fontWeight: "600", marginBottom: 12 },
});

export default CashFlowScreen;
