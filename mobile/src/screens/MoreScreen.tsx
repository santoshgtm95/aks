import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import {
  ChevronRight,
  Users,
  Settings,
  ShieldAlert,
  LogOut,
  FileSpreadsheet,
} from "lucide-react-native";

type MoreScreenNavigationProp = StackNavigationProp<RootStackParamList, "Main">;

const MoreScreen: React.FC = () => {
  const { logout } = useAuth();
  const navigation = useNavigation<MoreScreenNavigationProp>();

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (e) {
            Alert.alert("Error", "Logout failed.");
          }
        },
      },
    ]);
  };

  const MenuItem: React.FC<{
    title: string;
    icon: React.ReactNode;
    onPress: () => void;
    destructive?: boolean;
  }> = ({ title, icon, onPress, destructive }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        {icon}
        <Text
          style={[styles.menuItemText, destructive ? styles.destructiveText : null]}
        >
          {title}
        </Text>
      </View>
      <ChevronRight size={18} color="#94a3b8" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HR & Roster Management</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              title="Factory Workers"
              icon={<Users size={20} color="#2563eb" />}
              onPress={() => navigation.navigate("Worker")}
            />
            <MenuItem
              title="Staff Members"
              icon={<Settings size={20} color="#2563eb" />}
              onPress={() => navigation.navigate("Staff")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Settings & Utilities</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              title="Exchange Rates Settings"
              icon={<ShieldAlert size={20} color="#64748b" />}
              onPress={() => navigation.navigate("ExchangeRates")}
            />
            <MenuItem
              title="Excel Export Reports"
              icon={<FileSpreadsheet size={20} color="#16a34a" />}
              onPress={() => navigation.navigate("Reports")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Session</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              title="Log Out"
              icon={<LogOut size={20} color="#ef4444" />}
              onPress={handleLogout}
              destructive
            />
          </View>
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
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
  menuGroup: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
  },
  destructiveText: {
    color: "#ef4444",
  },
});

export default MoreScreen;
