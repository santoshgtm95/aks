import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, SafeAreaView,
} from "react-native";
import { productsAPI, salesAPI } from "../services/api";
import { Product, Sale } from "../types";
import { BarChart2, Package, TrendingUp, RefreshCw, Calendar } from "lucide-react-native";

const ReportsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, s] = await Promise.all([
        productsAPI.getAll(),
        salesAPI.getAll("Sales"),
      ]);
      setProducts(prods);
      setSales(s);
    } catch (e) {
      Alert.alert("Error", "Failed to load report data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredSales = sales.filter(s => {
    const d = (s.date || "").slice(0, 10);
    return (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
  });

  // Inventory stats
  const totalProducts = products.length;
  const totalWeight = products.reduce((sum, p) => sum + (p.remainingWeight ?? 0), 0);
  const inStockProducts = products.filter(p => (p.remainingWeight ?? 0) > 0).length;

  // Sales stats
  const totalSalesCount = filteredSales.length;
  const mmkSales = filteredSales.filter(s => s.currency === "MMK" || !s.currency);
  const usdSales = filteredSales.filter(s => s.currency === "USD");
  const cnySales = filteredSales.filter(s => s.currency === "CNY");
  const totalMMK = mmkSales.reduce((sum, s) => sum + ((s.price ?? 0) * (s.weight ?? 0)), 0);
  const totalUSD = usdSales.reduce((sum, s) => sum + ((s.price ?? 0) * (s.weight ?? 0)), 0);
  const totalCNY = cnySales.reduce((sum, s) => sum + ((s.price ?? 0) * (s.weight ?? 0)), 0);
  const totalSalesWeight = filteredSales.reduce((sum, s) => sum + (s.weight ?? 0), 0);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.headerRow}>
          <BarChart2 size={22} color="#2563eb" />
          <Text style={s.pageTitle}>Reports & Summary</Text>
          <TouchableOpacity style={s.refreshBtn} onPress={loadData}>
            <RefreshCw size={16} color="white" />
          </TouchableOpacity>
        </View>

        <View style={s.dateRow}>
          <View style={s.dateField}>
            <Text style={s.dateLabel}>From</Text>
            <TextInput style={s.dateInput} placeholder="YYYY-MM-DD" value={fromDate} onChangeText={setFromDate} />
          </View>
          <View style={s.dateField}>
            <Text style={s.dateLabel}>To</Text>
            <TextInput style={s.dateInput} placeholder="YYYY-MM-DD" value={toDate} onChangeText={setToDate} />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator style={s.loader} size="large" color="#2563eb" />
        ) : (
          <>
            {/* Inventory Section */}
            <View style={s.sectionCard}>
              <View style={s.sectionHeader}>
                <Package size={18} color="#2563eb" />
                <Text style={s.sectionTitle}>Inventory Summary</Text>
              </View>
              <View style={s.metricGrid}>
                <View style={s.metricItem}>
                  <Text style={s.metricValue}>{totalProducts}</Text>
                  <Text style={s.metricLabel}>Total Products</Text>
                </View>
                <View style={s.metricItem}>
                  <Text style={s.metricValue}>{inStockProducts}</Text>
                  <Text style={s.metricLabel}>In Stock</Text>
                </View>
                <View style={s.metricItem}>
                  <Text style={s.metricValue}>{totalWeight.toFixed(1)}</Text>
                  <Text style={s.metricLabel}>Total Viss</Text>
                </View>
              </View>
            </View>

            {/* Sales Section */}
            <View style={s.sectionCard}>
              <View style={s.sectionHeader}>
                <TrendingUp size={18} color="#059669" />
                <Text style={[s.sectionTitle, { color: "#059669" }]}>Sales Summary</Text>
              </View>
              <View style={s.metricGrid}>
                <View style={s.metricItem}>
                  <Text style={[s.metricValue, { color: "#059669" }]}>{totalSalesCount}</Text>
                  <Text style={s.metricLabel}>Total Sales</Text>
                </View>
                <View style={s.metricItem}>
                  <Text style={[s.metricValue, { color: "#059669" }]}>{totalSalesWeight.toFixed(1)}</Text>
                  <Text style={s.metricLabel}>Total Viss Sold</Text>
                </View>
              </View>
              {totalMMK > 0 && (
                <View style={s.revenueRow}>
                  <Text style={s.revenueLabel}>MMK Revenue</Text>
                  <Text style={s.revenueValue}>{totalMMK.toLocaleString()} MMK</Text>
                </View>
              )}
              {totalUSD > 0 && (
                <View style={s.revenueRow}>
                  <Text style={s.revenueLabel}>USD Revenue</Text>
                  <Text style={s.revenueValue}>{totalUSD.toLocaleString()} USD</Text>
                </View>
              )}
              {totalCNY > 0 && (
                <View style={s.revenueRow}>
                  <Text style={s.revenueLabel}>CNY Revenue</Text>
                  <Text style={s.revenueValue}>{totalCNY.toLocaleString()} CNY</Text>
                </View>
              )}
            </View>

            {/* Product breakdown */}
            <View style={s.sectionCard}>
              <View style={s.sectionHeader}>
                <BarChart2 size={18} color="#8b5cf6" />
                <Text style={[s.sectionTitle, { color: "#8b5cf6" }]}>Stock by Product</Text>
              </View>
              {products.filter(p => (p.remainingWeight ?? 0) > 0).sort((a, b) => (b.remainingWeight ?? 0) - (a.remainingWeight ?? 0)).map(p => (
                <View key={p.id} style={s.stockRow}>
                  <Text style={s.stockMarker}>{p.marker}</Text>
                  <View style={s.stockBar}>
                    <View style={[s.stockBarFill, { flex: (p.remainingWeight ?? 0) / totalWeight }]} />
                  </View>
                  <Text style={s.stockWeight}>{(p.remainingWeight ?? 0).toFixed(1)}</Text>
                </View>
              ))}
              {products.filter(p => (p.remainingWeight ?? 0) > 0).length === 0 && (
                <Text style={s.noData}>No stock data available</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  pageTitle: { flex: 1, fontSize: 20, fontWeight: "800", color: "#1e293b" },
  refreshBtn: { backgroundColor: "#2563eb", borderRadius: 8, padding: 8 },
  dateRow: { flexDirection: "row", gap: 12, backgroundColor: "white", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#e2e8f0" },
  dateField: { flex: 1 },
  dateLabel: { fontSize: 11, fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: 6 },
  dateInput: { height: 36, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, paddingHorizontal: 10, fontSize: 13, color: "#334155", backgroundColor: "#f8fafc" },
  loader: { marginTop: 60 },
  sectionCard: { backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", padding: 16, gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#2563eb" },
  metricGrid: { flexDirection: "row", gap: 0 },
  metricItem: { flex: 1, alignItems: "center", padding: 8, backgroundColor: "#f8fafc", borderRadius: 10 },
  metricValue: { fontSize: 24, fontWeight: "800", color: "#2563eb" },
  metricLabel: { fontSize: 11, color: "#64748b", fontWeight: "600", textAlign: "center", marginTop: 4 },
  revenueRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  revenueLabel: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  revenueValue: { fontSize: 14, fontWeight: "800", color: "#059669" },
  stockRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  stockMarker: { width: 70, fontSize: 12, fontWeight: "700", color: "#1e293b" },
  stockBar: { flex: 1, height: 8, backgroundColor: "#f1f5f9", borderRadius: 4, overflow: "hidden" },
  stockBarFill: { height: "100%", backgroundColor: "#8b5cf6", borderRadius: 4, minWidth: 4 },
  stockWeight: { width: 40, fontSize: 11, color: "#64748b", fontWeight: "600", textAlign: "right" },
  noData: { fontSize: 13, color: "#94a3b8", textAlign: "center", padding: 16 },
});

export default ReportsScreen;
