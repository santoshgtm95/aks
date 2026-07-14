import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity, ScrollView,
  ActivityIndicator, TextInput, Alert, SafeAreaView,
} from "react-native";
import { salesAPI, productsAPI } from "../services/api";
import { Sale, Product, CreateSaleDto } from "../types";
import { CustomButton } from "../components/CustomButton";
import { CustomInput } from "../components/CustomInput";
import { ShoppingCart, Search, Calendar, TrendingUp, Trash2 } from "lucide-react-native";
import { formatDateTime, getMyanmarNow } from "../utils/format";

const SalesScreen: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"form" | "history">("form");
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [form, setForm] = useState<CreateSaleDto>({
    date: getMyanmarNow(), productId: 0, marker: "", unit: "kg",
    weight: 0, price: 0, currency: "MMK", category: "Sales",
    plusMinusWeight: 0, customerName: "", customerContact: "", remark: "",
  });
  const [weightStr, setWeightStr] = useState("");
  const [priceStr, setPriceStr] = useState("");
  const [plusMinusStr, setPlusMinusStr] = useState("0");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([salesAPI.getAll("Sales"), productsAPI.getAll()]);
      setSales(s);
      setProducts(p.filter((pr: Product) => (pr.remainingWeight ?? 0) > 0));
    } catch (e) {
      Alert.alert("Error", "Failed to load sales data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleProductSelect = (p: Product) => {
    setSelectedProductId(p.id);
    setForm(f => ({ ...f, productId: p.id, marker: p.marker, unit: p.unit || "kg" }));
  };

  const handleSubmit = async () => {
    if (!form.productId) { Alert.alert("Validation", "Please select a product."); return; }
    if (!parseFloat(weightStr)) { Alert.alert("Validation", "Weight is required."); return; }
    try {
      await salesAPI.create({
        ...form,
        weight: parseFloat(weightStr) || 0,
        price: parseFloat(priceStr) || 0,
        plusMinusWeight: parseFloat(plusMinusStr) || 0,
        date: new Date(form.date).toISOString(),
      });
      setForm({ date: getMyanmarNow(), productId: 0, marker: "", unit: "kg", weight: 0, price: 0, currency: "MMK", category: "Sales", plusMinusWeight: 0, customerName: "", customerContact: "", remark: "" });
      setWeightStr(""); setPriceStr(""); setPlusMinusStr("0"); setSelectedProductId(null);
      loadData();
      Alert.alert("Success", "Sale recorded successfully.");
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || "Failed to record sale.");
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert("Delete Sale", "Are you sure you want to delete this sale?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await salesAPI.delete(id); loadData(); } catch (e: any) { Alert.alert("Error", "Failed to delete."); }
      }},
    ]);
  };

  const filteredSales = useMemo(() =>
    sales.filter(s => {
      const t = searchTerm.toLowerCase();
      const match = (s.marker || "").toLowerCase().includes(t) || (s.customerName || "").toLowerCase().includes(t);
      const d = (s.date || "").slice(0, 10);
      return match && (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
    }), [sales, searchTerm, fromDate, toDate]);

  return (
    <SafeAreaView style={st.safe}>
      <View style={st.container}>
        <View style={st.tabs}>
          {(["form", "history"] as const).map(tab => (
            <TouchableOpacity key={tab} style={[st.tab, activeTab === tab && st.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[st.tabText, activeTab === tab && st.tabTextActive]}>
                {tab === "form" ? "New Sale" : `History (${filteredSales.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "form" ? (
          <ScrollView contentContainerStyle={st.formContainer}>
            <Text style={st.sectionTitle}>Select Product</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.productPills}>
              {products.map(p => (
                <TouchableOpacity key={p.id} style={[st.productPill, selectedProductId === p.id && st.productPillActive]} onPress={() => handleProductSelect(p)}>
                  <Text style={[st.productPillText, selectedProductId === p.id && st.productPillTextActive]}>{p.marker}</Text>
                  <Text style={[st.productPillSub, selectedProductId === p.id && st.productPillTextActive]}>{(p.remainingWeight ?? 0).toFixed(1)} viss</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <CustomInput label="Date" value={form.date} onChangeText={v => setForm(f => ({ ...f, date: v }))} placeholder="YYYY-MM-DD HH:mm" />
            <CustomInput label="Weight" keyboardType="numeric" value={weightStr} onChangeText={setWeightStr} />
            <CustomInput label="Plus/Minus Weight Adjustment" keyboardType="numeric" value={plusMinusStr} onChangeText={setPlusMinusStr} />
            <CustomInput label="Price" keyboardType="numeric" value={priceStr} onChangeText={setPriceStr} />

            <Text style={st.label}>Currency</Text>
            <View style={st.pills}>
              {(["MMK", "USD", "CNY"] as const).map(c => (
                <TouchableOpacity key={c} style={[st.pill, form.currency === c && st.pillActive]} onPress={() => setForm(f => ({ ...f, currency: c }))}>
                  <Text style={[st.pillText, form.currency === c && st.pillTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={st.label}>Unit</Text>
            <View style={st.pills}>
              {["kg", "viss"].map(u => (
                <TouchableOpacity key={u} style={[st.pill, form.unit === u && st.pillActive]} onPress={() => setForm(f => ({ ...f, unit: u }))}>
                  <Text style={[st.pillText, form.unit === u && st.pillTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <CustomInput label="Customer Name" value={form.customerName || ""} onChangeText={v => setForm(f => ({ ...f, customerName: v }))} placeholder="Enter customer name" />
            <CustomInput label="Customer Contact" value={form.customerContact || ""} onChangeText={v => setForm(f => ({ ...f, customerContact: v }))} placeholder="Phone number" keyboardType="phone-pad" />
            <CustomInput label="Remark" value={form.remark || ""} onChangeText={v => setForm(f => ({ ...f, remark: v }))} placeholder="Optional notes" multiline />
            <CustomButton title="Record Sale" onPress={handleSubmit} style={{ marginTop: 16, marginBottom: 40 }} />
          </ScrollView>
        ) : (
          <>
            <View style={st.filterBar}>
              <View style={[st.searchBox, { flex: 1 }]}>
                <Search size={16} color="#94a3b8" />
                <TextInput style={st.searchInput} placeholder="Search marker, customer..." value={searchTerm} onChangeText={setSearchTerm} placeholderTextColor="#94a3b8" />
              </View>
              <TextInput style={st.dateInput} placeholder="From" value={fromDate} onChangeText={setFromDate} />
              <TextInput style={st.dateInput} placeholder="To" value={toDate} onChangeText={setToDate} />
            </View>
            {loading ? <ActivityIndicator style={st.loader} size="large" color="#2563eb" /> : (
              <FlatList data={filteredSales} keyExtractor={i => i.id.toString()} contentContainerStyle={st.list}
                renderItem={({ item }) => (
                  <View style={st.card}>
                    <View style={st.cardRow}>
                      <Text style={st.marker}>{item.marker}</Text>
                      <TouchableOpacity onPress={() => handleDelete(item.id)} style={st.delBtn}><Trash2 size={15} color="#ef4444" /></TouchableOpacity>
                    </View>
                    <View style={st.cardRow}>
                      <Text style={st.weight}>{(item.weight || 0).toFixed(3)} {item.unit}</Text>
                      <Text style={st.price}>{(item.price || 0).toLocaleString()} {item.currency}</Text>
                    </View>
                    <Text style={st.detail}>{item.customerName || "N/A"} · {item.customerContact || ""}</Text>
                    <View style={st.infoRow}><Calendar size={12} color="#94a3b8" /><Text style={st.infoText}>{formatDateTime(item.date)}</Text></View>
                  </View>
                )}
                ListEmptyComponent={<View style={st.empty}><ShoppingCart size={40} color="#cbd5e1" /><Text style={st.emptyText}>No sales records found</Text></View>}
              />
            )}
          </>
        )}
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
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: 8, marginTop: 8 },
  productPills: { marginBottom: 16 },
  productPill: { marginRight: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "#cbd5e1", backgroundColor: "#f8fafc", alignItems: "center" },
  productPillActive: { borderColor: "#2563eb", backgroundColor: "#dbeafe" },
  productPillText: { fontSize: 13, fontWeight: "700", color: "#334155" },
  productPillTextActive: { color: "#1e40af" },
  productPillSub: { fontSize: 10, color: "#94a3b8", marginTop: 2 },
  label: { fontSize: 12, fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: 8 },
  pills: { flexDirection: "row", gap: 8, marginBottom: 16 },
  pill: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#cbd5e1", alignItems: "center", backgroundColor: "#f8fafc" },
  pillActive: { borderColor: "#2563eb", backgroundColor: "#dbeafe" },
  pillText: { fontSize: 13, fontWeight: "700", color: "#475569" },
  pillTextActive: { color: "#1e40af" },
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
  delBtn: { padding: 6, borderRadius: 8, backgroundColor: "#fff5f5" },
  empty: { alignItems: "center", padding: 40, gap: 12 },
  emptyText: { fontSize: 13, color: "#94a3b8", fontWeight: "600", textAlign: "center" },
});

export default SalesScreen;
