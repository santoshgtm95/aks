import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, SafeAreaView, ScrollView,
} from "react-native";
import { semiExportPurchaseAPI } from "../services/api";
import { CustomButton } from "../components/CustomButton";
import { CustomInput } from "../components/CustomInput";
import Modal from "../components/Modal";
import { Search, Package, Calendar, Plus, ShoppingBag } from "lucide-react-native";
import { formatDateTime, getMyanmarNow } from "../utils/format";

const SemiExportPurchaseScreen: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [productMarker, setProductMarker] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [weight, setWeight] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<"MMK" | "USD" | "CNY">("MMK");
  const [date, setDate] = useState(getMyanmarNow());
  const [category, setCategory] = useState("");
  const [remark, setRemark] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await semiExportPurchaseAPI.getAll();
      setRecords(data);
    } catch (e) {
      Alert.alert("Error", "Failed to load Semi Export Purchase records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async () => {
    if (!productMarker.trim() || !weight) { Alert.alert("Validation", "Product marker and weight are required."); return; }
    try {
      await semiExportPurchaseAPI.create({
        productMarker: productMarker.trim(),
        supplierName: supplierName.trim(),
        weight: parseFloat(weight) || 0,
        price: parseFloat(price) || 0,
        currency,
        date: new Date(date).toISOString(),
        category: category.trim(),
        remark: remark.trim(),
      });
      setIsCreateOpen(false);
      setProductMarker(""); setSupplierName(""); setWeight(""); setPrice(""); setRemark(""); setCategory("");
      loadData();
      Alert.alert("Success", "Purchase record created.");
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || "Failed to create.");
    }
  };

  const filtered = useMemo(() =>
    records.filter(r => {
      const t = searchTerm.toLowerCase();
      const match = (r.productMarker || "").toLowerCase().includes(t) || (r.supplierName || "").toLowerCase().includes(t);
      const d = (r.date || r.createdAt || "").slice(0, 10);
      return match && (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
    }), [records, searchTerm, fromDate, toDate]);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.header}>
          <View style={s.searchBox}>
            <Search size={16} color="#94a3b8" />
            <TextInput style={s.searchInput} placeholder="Search marker, supplier..." value={searchTerm} onChangeText={setSearchTerm} placeholderTextColor="#94a3b8" />
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => { setDate(getMyanmarNow()); setIsCreateOpen(true); }}>
            <Plus size={18} color="white" />
          </TouchableOpacity>
        </View>
        <View style={s.dateRow}>
          <TextInput style={s.dateInput} placeholder="From YYYY-MM-DD" value={fromDate} onChangeText={setFromDate} />
          <TextInput style={s.dateInput} placeholder="To YYYY-MM-DD" value={toDate} onChangeText={setToDate} />
        </View>

        {loading ? <ActivityIndicator style={s.loader} size="large" color="#2563eb" /> : (
          <FlatList data={filtered} keyExtractor={i => i.id?.toString() ?? Math.random().toString()} contentContainerStyle={s.list}
            renderItem={({ item }) => (
              <View style={s.card}>
                <View style={s.cardRow}><Text style={s.marker}>{item.productMarker}</Text><Text style={s.currency}>{item.currency}</Text></View>
                <Text style={s.detail}>Supplier: {item.supplierName || "N/A"}</Text>
                <View style={s.cardRow}>
                  <Text style={s.weight}>{(item.weight || 0).toFixed(3)} viss</Text>
                  <Text style={s.priceText}>{(item.price || 0).toLocaleString()} {item.currency}</Text>
                </View>
                <View style={s.infoRow}><Calendar size={13} color="#94a3b8" /><Text style={s.infoText}>{formatDateTime(item.date || item.createdAt)}</Text></View>
                {item.remark ? <Text style={s.remark}>📝 {item.remark}</Text> : null}
              </View>
            )}
            ListEmptyComponent={<View style={s.empty}><ShoppingBag size={40} color="#cbd5e1" /><Text style={s.emptyText}>No purchase records found</Text></View>}
          />
        )}

        <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Purchase Record">
          <ScrollView showsVerticalScrollIndicator={false}>
            <CustomInput label="Product Marker" value={productMarker} onChangeText={setProductMarker} placeholder="e.g. AKZ-001" />
            <CustomInput label="Supplier Name" value={supplierName} onChangeText={setSupplierName} placeholder="Enter supplier name" />
            <CustomInput label="Weight (viss)" keyboardType="numeric" value={weight} onChangeText={setWeight} />
            <CustomInput label="Price" keyboardType="numeric" value={price} onChangeText={setPrice} />
            <Text style={s.label}>Currency</Text>
            <View style={s.pills}>
              {(["MMK", "USD", "CNY"] as const).map(c => (
                <TouchableOpacity key={c} style={[s.pill, currency === c && s.pillActive]} onPress={() => setCurrency(c)}>
                  <Text style={[s.pillText, currency === c && s.pillTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <CustomInput label="Category" value={category} onChangeText={setCategory} placeholder="e.g. Regular" />
            <CustomInput label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
            <CustomInput label="Remark" value={remark} onChangeText={setRemark} placeholder="Optional notes" multiline />
            <CustomButton title="Save Purchase Record" onPress={handleCreate} style={{ marginTop: 12, marginBottom: 32 }} />
          </ScrollView>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1 },
  header: { flexDirection: "row", gap: 10, padding: 16, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f1f5f9", borderRadius: 12, paddingHorizontal: 12, height: 40 },
  searchInput: { flex: 1, fontSize: 14, color: "#0f172a" },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#2563eb", justifyContent: "center", alignItems: "center" },
  dateRow: { flexDirection: "row", gap: 8, padding: 12, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  dateInput: { flex: 1, height: 34, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, paddingHorizontal: 8, fontSize: 12, color: "#334155", backgroundColor: "white" },
  loader: { flex: 1, alignSelf: "center", marginTop: 60 },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", padding: 16, gap: 6 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  marker: { fontSize: 15, fontWeight: "800", color: "#1e293b" },
  currency: { fontSize: 12, fontWeight: "700", color: "#2563eb", backgroundColor: "#eff6ff", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  detail: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  weight: { fontSize: 14, fontWeight: "700", color: "#2563eb" },
  priceText: { fontSize: 14, fontWeight: "700", color: "#059669" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: { fontSize: 11, color: "#94a3b8" },
  remark: { fontSize: 11, color: "#94a3b8", fontStyle: "italic" },
  empty: { alignItems: "center", padding: 40, gap: 12 },
  emptyText: { fontSize: 13, color: "#94a3b8", fontWeight: "600", textAlign: "center" },
  label: { fontSize: 12, fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: 8 },
  pills: { flexDirection: "row", gap: 8, marginBottom: 16 },
  pill: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#cbd5e1", alignItems: "center", backgroundColor: "#f8fafc" },
  pillActive: { borderColor: "#2563eb", backgroundColor: "#dbeafe" },
  pillText: { fontSize: 13, fontWeight: "700", color: "#475569" },
  pillTextActive: { color: "#1e40af" },
});

export default SemiExportPurchaseScreen;
