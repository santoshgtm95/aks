import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { ChevronRight, CircleDollarSign } from "lucide-react-native";

type SalesHubNavigationProp = StackNavigationProp<RootStackParamList, "Main">;

const SalesHubScreen: React.FC = () => {
  const navigation = useNavigation<SalesHubNavigationProp>();

  const HubCard: React.FC<{
    title: string;
    description: string;
    screen: keyof RootStackParamList;
    iconText: string;
    color: string;
  }> = ({ title, description, screen, iconText, color }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate(screen as any)}
    >
      <View style={[styles.iconCircle, { backgroundColor: color + "15" }]}>
        <Text style={[styles.iconText, { color: color }]}>{iconText}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{description}</Text>
      </View>
      <ChevronRight size={18} color="#94a3b8" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <CircleDollarSign size={20} color="#059669" />
          <Text style={styles.headerTitle}>Finance & Sales Hub</Text>
        </View>
        <Text style={styles.headerDesc}>
          Register sales shipments, log currency exchange rates, purchase orders
          from vendor warehouses, and check operational cash flows.
        </Text>

        <View style={styles.cardWrapper}>
          <HubCard
            title="Semi-Export Purchase"
            description="Manage and track sorted hair purchase orders from external dealers."
            screen="SemiExportPurchase"
            iconText="SEP"
            color="#e11d48"
          />
          <HubCard
            title="Semi-Export Sales"
            description="Create sorted semi-export batches, track billing and exchange rates."
            screen="SemiExport"
            iconText="SES"
            color="#4f46e5"
          />
          <HubCard
            title="Standard Sales"
            description="Sell standard sorted bundles from inventory. Generate invoices."
            screen="Sales"
            iconText="SLS"
            color="#059669"
          />
          <HubCard
            title="Sales 6 Module"
            screen="Sales6"
            description="Manage colored refined hair sales logs, grand totals, and P&L."
            iconText="SL6"
            color="#db2777"
          />
          <HubCard
            title="Cash Flow Management"
            screen="CashFlow"
            description="Register expenses, salaries, raw materials, log cash card details."
            iconText="CF"
            color="#16a34a"
          />
          <HubCard
            title="Exchange Rates"
            screen="ExchangeRates"
            description="Maintain current exchange ratios for CNY and MMK currencies."
            iconText="EX"
            color="#d97706"
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  headerDesc: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
    marginBottom: 24,
    fontWeight: "500",
  },
  cardWrapper: {
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  iconText: {
    fontSize: 14,
    fontWeight: "800",
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
  },
  cardDesc: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    lineHeight: 16,
    fontWeight: "500",
  },
});

export default SalesHubScreen;
