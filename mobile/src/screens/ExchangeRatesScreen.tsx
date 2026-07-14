import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, SafeAreaView,
} from "react-native";
import { exchangeRatesAPI } from "../services/api";
import { ExchangeRate, CreateExchangeRateDto } from "../types";
import { BadgeDollarSign, TrendingUp, Save } from "lucide-react-native";
import { formatDateTime } from "../utils/format";

const CURRENCIES = [
  { code: "USD", flag: "🇺🇸", name: "US Dollar" },
  { code: "CNY", flag: "🇨🇳", name: "Chinese Yuan" },
  { code: "INR", flag: "🇮🇳", name: "Indian Rupee" },
];

const ExchangeRatesScreen: React.FC = () => {
  const [history, setHistory] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<Record<string, string>>({ USD: "", CNY: "", INR: "" });
  const [saving, setSaving] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await exchangeRatesAPI.getAll();
      setHistory(data);
      const newRates: Record<string, string> = { USD: "", CNY: "", INR: "" };
      ["USD", "CNY", "INR"].forEach(cur => {
        const active = data.find((r: ExchangeRate) => r.fromCurrency === cur && r.activeStatus);
        if (active) newRates[cur] = active.rate.toString();
      });
      setRates(newRates);
    } catch (e) {
      Alert.alert("Error", "Failed to load exchange rates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  const handleSave = async (fromCurrency: string) => {
    const rateValue = rates[fromCurrency];
    if (!rateValue || isNaN(Number(rateValue))) {
      Alert.alert("Validation", "Enter a valid rate number.");
      return;
    }
    setSaving(fromCurrency);
    try {
      await exchangeRatesAPI.create({
        fromCurrency,
        toCurrency: "MMK",
        rate: Number(rateValue),
        activeStatus: true,
      } as CreateExchangeRateDto);
      Alert.alert("Saved", `${fromCurrency} → MMK rate updated to ${Number(rateValue).toLocaleString()}`);
      fetchRates();
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || `Failed to save ${fromCurrency} rate.`);
    } finally {
      setSaving(null);
    }
  };

  const getActiveRate = (cur: string) => {
    const active = history.find(r => r.fromCurrency === cur && r.activeStatus);
    return active ? active.rate : null;
  };

  const recentHistory = history.slice().sort((a, b) => new Date(b.createDate || "").getTime() - new Date(a.createDate || "").getTime()).slice(0, 20);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.headerRow}>
          <BadgeDollarSign size={22} color="#2563eb" />
          <Text style={s.pageTitle}>Currency Exchange Rates</Text>
        </View>

        {loading ? <ActivityIndicator style={s.loader} size="large" color="#2563eb" /> : (
          <>
            {CURRENCIES.map(({ code, flag, name }) => {
              const activeRate = getActiveRate(code);
              return (
                <View key={code} style={s.rateCard}>
                  <View style={s.rateCardHeader}>
                    <Text style={s.flagText}>{flag}</Text>
                    <View>
                      <Text style={s.currencyName}>{name}</Text>
                      <Text style={s.currencyCode}>{code} → MMK</Text>
                    </View>
                    {activeRate && (
                      <Text style={s.activeRate}>1 {code} = {activeRate.toLocaleString()} MMK</Text>
                    )}
                  </View>
                  <View style={s.inputRow}>
                    <TextInput
                      style={s.rateInput}
                      placeholder={`New ${code} rate`}
                      keyboardType="numeric"
                      value={rates[code]}
                      onChangeText={v => setRates(prev => ({ ...prev, [code]: v }))}
                      placeholderTextColor="#94a3b8"
                    />
                    <TouchableOpacity
                      style={[s.saveBtn, saving === code && s.saveBtnDisabled]}
                      onPress={() => handleSave(code)}
                      disabled={saving === code}
                    >
                      {saving === code
                        ? <ActivityIndicator size="small" color="white" />
                        : <><Save size={14} color="white" /><Text style={s.saveBtnText}>Save</Text></>
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            <View style={s.historySection}>
              <View style={s.historySectionHeader}>
                <TrendingUp size={16} color="#2563eb" />
                <Text style={s.historySectionTitle}>Rate History</Text>
              </View>
              {recentHistory.map(r => (
                <View key={r.id} style={s.historyRow}>
                  <Text style={s.historyFlag}>
                    {r.fromCurrency === "USD" ? "🇺🇸" : r.fromCurrency === "CNY" ? "🇨🇳" : "🇮🇳"}
                  </Text>
                  <Text style={s.historyText}>1 {r.fromCurrency} = {r.rate.toLocaleString()} MMK</Text>
                  {r.activeStatus && <Text style={s.activeBadge}>Active</Text>}
                  <Text style={s.historyDate}>{r.createDate ? formatDateTime(r.createDate) : ""}</Text>
                </View>
              ))}
              {recentHistory.length === 0 && <Text style={s.noHistory}>No rate history yet.</Text>}
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
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  pageTitle: { fontSize: 20, fontWeight: "800", color: "#1e293b" },
  loader: { marginTop: 60 },
  rateCard: { backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", padding: 16, gap: 12 },
  rateCardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  flagText: { fontSize: 32 },
  currencyName: { fontSize: 15, fontWeight: "800", color: "#1e293b" },
  currencyCode: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  activeRate: { marginLeft: "auto", fontSize: 13, fontWeight: "800", color: "#059669" },
  inputRow: { flexDirection: "row", gap: 10 },
  rateInput: { flex: 1, height: 42, borderWidth: 1.5, borderColor: "#cbd5e1", borderRadius: 10, paddingHorizontal: 12, fontSize: 14, color: "#334155", backgroundColor: "#f8fafc" },
  saveBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#2563eb", borderRadius: 10, paddingHorizontal: 16, height: 42 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "white", fontWeight: "700", fontSize: 13 },
  historySection: { backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", padding: 16, gap: 10 },
  historySectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  historySectionTitle: { fontSize: 14, fontWeight: "800", color: "#1e293b" },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  historyFlag: { fontSize: 16 },
  historyText: { flex: 1, fontSize: 13, color: "#334155", fontWeight: "600" },
  activeBadge: { fontSize: 10, fontWeight: "800", color: "#059669", backgroundColor: "#f0fdf4", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  historyDate: { fontSize: 11, color: "#94a3b8" },
  noHistory: { fontSize: 13, color: "#94a3b8", textAlign: "center", padding: 16 },
});

export default ExchangeRatesScreen;
