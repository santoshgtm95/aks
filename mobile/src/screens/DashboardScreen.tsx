import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { dashboardAPI } from "../services/api";
import { DashboardStats } from "../types";
import {
  Sparkles,
  Boxes,
  Activity,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  ClipboardList,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/AppNavigator";

type DashboardScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Main"
>;

const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await dashboardAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to fetch dashboard statistics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, []);

  const QuickLink: React.FC<{
    title: string;
    screen: keyof RootStackParamList;
    color: string;
    description: string;
  }> = ({ title, screen, color, description }) => (
    <TouchableOpacity
      style={styles.quickLinkCard}
      onPress={() => navigation.navigate(screen as any)}
    >
      <View style={[styles.quickLinkIndicator, { backgroundColor: color }]} />
      <View style={styles.quickLinkTextWrapper}>
        <Text style={styles.quickLinkTitle}>{title}</Text>
        <Text style={styles.quickLinkDesc}>{description}</Text>
      </View>
      <ChevronRight size={18} color="#94a3b8" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Hello, {user?.fullName}</Text>
            <Text style={styles.roleText}>{user?.roleName} Account</Text>
          </View>
          <View style={styles.headerBadge}>
            <Sparkles size={16} color="#d97706" />
            <Text style={styles.badgeText}>{user?.warehouseName || "Global"}</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Boxes size={22} color="#3b82f6" />
            <Text style={styles.statValue}>
              {stats?.totalInventoryWeight?.toFixed(3) || "0.000"}
            </Text>
            <Text style={styles.statLabel}>Total Weight (viss)</Text>
          </View>
          <View style={styles.statCard}>
            <ClipboardList size={22} color="#10b981" />
            <Text style={styles.statValue}>{stats?.activeProducts || 0}</Text>
            <Text style={styles.statLabel}>Active Bundles</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp size={22} color="#8b5cf6" />
            <Text style={styles.statValue}>
              {stats?.totalSalesAmount?.toLocaleString() || "0"}
            </Text>
            <Text style={styles.statLabel}>Total Sales (MMK)</Text>
          </View>
        </View>

        {/* Low Stock Warning */}
        {stats?.lowStockProducts && stats.lowStockProducts.length > 0 && (
          <View style={styles.warningContainer}>
            <View style={styles.warningHeader}>
              <AlertTriangle size={18} color="#ef4444" />
              <Text style={styles.warningTitle}>Low Stock Warnings</Text>
            </View>
            {stats.lowStockProducts.map((p) => (
              <View key={p.id} style={styles.warningRow}>
                <Text style={styles.warningMarker}>{p.marker}</Text>
                <Text style={styles.warningWeight}>
                  {p.remainingWeight.toFixed(3)} viss remaining
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Navigation Quick Links / Port of Screens */}
        <Text style={styles.sectionTitle}>Operations Launchpad</Text>
        <View style={styles.quickLinksWrapper}>
          <QuickLink
            title="Wash & Grading"
            screen="WashGrading"
            color="#3b82f6"
            description="Grade, wash, and register wet raw hair bundles"
          />
          <QuickLink
            title="Mess Labour Sorting"
            screen="MessLabour"
            color="#8b5cf6"
            description="Register worker sorting and length categorization"
          />
          <QuickLink
            title="Purification"
            screen="Purification"
            color="#06b6d4"
            description="Record bundle cleaning, chemical treatments"
          />
          <QuickLink
            title="Refinement"
            screen="Refinement"
            color="#10b981"
            description="Grade final output weights, lost hair, spoilage"
          />
          <QuickLink
            title="Single & Double Drawn"
            screen="SingleDoubleDrawn"
            color="#f59e0b"
            description="Sort refined hair into double-drawn categories"
          />
          <QuickLink
            title="Semi-Export Purchase"
            screen="SemiExportPurchase"
            color="#e11d48"
            description="Manage purchase orders from export vendors"
          />
          <QuickLink
            title="Semi-Export Sales"
            screen="SemiExport"
            color="#4f46e5"
            description="Record and bill sorted semi-exports"
          />
          <QuickLink
            title="Sales Module"
            screen="Sales"
            color="#059669"
            description="Standard bundle inventory sales and invoices"
          />
          <QuickLink
            title="Sales 6 Module"
            screen="Sales6"
            color="#db2777"
            description="Sell and export colored refined hair"
          />
          <QuickLink
            title="Cash Flow Management"
            screen="CashFlow"
            color="#16a34a"
            description="Track incomes, expenses, worker salary, cash log"
          />
          <QuickLink
            title="Worker & Staff lists"
            screen="Worker"
            color="#475569"
            description="Manage factory worker rosters, rates, staff details"
          />
        </View>
      </ScrollView>
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
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
  },
  roleText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    textTransform: "capitalize",
    marginTop: 2,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#d97706",
    marginLeft: 6,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "flex-start",
    justifyContent: "space-between",
    minHeight: 110,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 12,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginTop: 4,
  },
  warningContainer: {
    backgroundColor: "#fff5f5",
    borderWidth: 1.5,
    borderColor: "#fee2e2",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ef4444",
    marginLeft: 8,
  },
  warningRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  warningMarker: {
    fontSize: 13,
    fontWeight: "600",
    color: "#7f1d1d",
  },
  warningWeight: {
    fontSize: 12,
    color: "#b91c1c",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 12,
  },
  quickLinksWrapper: {
    gap: 10,
  },
  quickLinkCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
  },
  quickLinkIndicator: {
    width: 4,
    height: "100%",
    borderRadius: 2,
    marginRight: 12,
  },
  quickLinkTextWrapper: {
    flex: 1,
  },
  quickLinkTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
  },
  quickLinkDesc: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "500",
  },
});

export default DashboardScreen;
