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
import { ChevronRight, Sparkles } from "lucide-react-native";

type ProductionHubNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Main"
>;

const ProductionHubScreen: React.FC = () => {
  const navigation = useNavigation<ProductionHubNavigationProp>();

  const ProductionCard: React.FC<{
    title: string;
    description: string;
    screen: keyof RootStackParamList;
    iconText: string;
    bgGradient: string[];
  }> = ({ title, description, screen, iconText }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate(screen as any)}
    >
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>{iconText}</Text>
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
          <Sparkles size={20} color="#2563eb" />
          <Text style={styles.headerTitle}>Production Workflows</Text>
        </View>
        <Text style={styles.headerDesc}>
          Select a step in the factory pipeline to register work, check ongoing
          processes, or track raw bundle refining.
        </Text>

        <View style={styles.cardWrapper}>
          <ProductionCard
            title="1. Wash & Grading"
            description="Register washed raw wet bundles, check grading categories, assign workers."
            screen="WashGrading"
            iconText="WG"
            bgGradient={["#3b82f6", "#1d4ed8"]}
          />
          <ProductionCard
            title="2. Mess Labour Sorting"
            description="Assign sorted wet bundle categories (Regular, Regular Extra, White Extra, etc.)"
            screen="MessLabour"
            iconText="ML"
            bgGradient={["#8b5cf6", "#6d28d9"]}
          />
          <ProductionCard
            title="3. Purification"
            description="Bundle cleaning, chemical/acid treatment, drying, and supervisor assignment."
            screen="Purification"
            iconText="PU"
            bgGradient={["#06b6d4", "#0891b2"]}
          />
          <ProductionCard
            title="4. Refinement"
            description="Grade final output weights, log lost weights, return items, and spoilage."
            screen="Refinement"
            iconText="RF"
            bgGradient={["#10b981", "#047857"]}
          />
          <ProductionCard
            title="5. Single & Double Drawn"
            description="Map final sorted double-drawn lengths (from 6 inches to 28 inches)."
            screen="SingleDoubleDrawn"
            iconText="SD"
            bgGradient={["#f59e0b", "#d97706"]}
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
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  iconText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2563eb",
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

export default ProductionHubScreen;
