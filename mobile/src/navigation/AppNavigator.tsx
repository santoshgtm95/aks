import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import {
  LayoutDashboard,
  Boxes,
  Activity,
  DollarSign,
  Menu,
} from "lucide-react-native";

// Import Screens
import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import InventoryScreen from "../screens/InventoryScreen";
import ProductionHubScreen from "../screens/ProductionHubScreen";
import SalesHubScreen from "../screens/SalesHubScreen";
import MoreScreen from "../screens/MoreScreen";

// Detail/Module Screens
import WashGradingScreen from "../screens/WashGradingScreen";
import MessLabourScreen from "../screens/MessLabourScreen";
import PurificationScreen from "../screens/PurificationScreen";
import RefinementScreen from "../screens/RefinementScreen";
import SingleDoubleDrawnScreen from "../screens/SingleDoubleDrawnScreen";
import SemiExportScreen from "../screens/SemiExportScreen";
import SemiExportPurchaseScreen from "../screens/SemiExportPurchaseScreen";
import SalesScreen from "../screens/SalesScreen";
import Sales6Screen from "../screens/Sales6Screen";
import WorkerScreen from "../screens/WorkerScreen";
import StaffScreen from "../screens/StaffScreen";
import CashFlowScreen from "../screens/CashFlowScreen";
import ExchangeRatesScreen from "../screens/ExchangeRatesScreen";
import ReportsScreen from "../screens/ReportsScreen";

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  WashGrading: undefined;
  MessLabour: undefined;
  Purification: undefined;
  Refinement: undefined;
  SingleDoubleDrawn: undefined;
  SemiExport: undefined;
  SemiExportPurchase: undefined;
  Sales: undefined;
  Sales6: undefined;
  Worker: undefined;
  Staff: undefined;
  CashFlow: undefined;
  ExchangeRates: undefined;
  Reports: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#e2e8f0",
          backgroundColor: "#ffffff",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: "#ffffff",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 3,
        },
        headerTitleStyle: {
          fontWeight: "800",
          fontSize: 18,
          color: "#0f172a",
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          title: "Dashboard",
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="InventoryTab"
        component={InventoryScreen}
        options={{
          title: "Inventory",
          tabBarLabel: "Inventory",
          tabBarIcon: ({ color, size }) => (
            <Boxes color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProductionTab"
        component={ProductionHubScreen}
        options={{
          title: "Production",
          tabBarLabel: "Production",
          tabBarIcon: ({ color, size }) => (
            <Activity color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="SalesTab"
        component={SalesHubScreen}
        options={{
          title: "Sales & Finance",
          tabBarLabel: "Sales",
          tabBarIcon: ({ color, size }) => (
            <DollarSign color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="MoreTab"
        component={MoreScreen}
        options={{
          title: "More Settings",
          tabBarLabel: "More",
          tabBarIcon: ({ color, size }) => (
            <Menu color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: "#ffffff",
          },
          headerTitleStyle: {
            fontWeight: "800",
            color: "#0f172a",
          },
          headerTintColor: "#2563eb",
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="WashGrading"
              component={WashGradingScreen}
              options={{ title: "Wash & Grading" }}
            />
            <Stack.Screen
              name="MessLabour"
              component={MessLabourScreen}
              options={{ title: "Mess Labour Sorting" }}
            />
            <Stack.Screen
              name="Purification"
              component={PurificationScreen}
              options={{ title: "Purification" }}
            />
            <Stack.Screen
              name="Refinement"
              component={RefinementScreen}
              options={{ title: "Refinement" }}
            />
            <Stack.Screen
              name="SingleDoubleDrawn"
              component={SingleDoubleDrawnScreen}
              options={{ title: "Single & Double Drawn" }}
            />
            <Stack.Screen
              name="SemiExport"
              component={SemiExportScreen}
              options={{ title: "Semi-Export" }}
            />
            <Stack.Screen
              name="SemiExportPurchase"
              component={SemiExportPurchaseScreen}
              options={{ title: "Semi-Export Purchase" }}
            />
            <Stack.Screen
              name="Sales"
              component={SalesScreen}
              options={{ title: "Sales" }}
            />
            <Stack.Screen
              name="Sales6"
              component={Sales6Screen}
              options={{ title: "Sales 6" }}
            />
            <Stack.Screen
              name="Worker"
              component={WorkerScreen}
              options={{ title: "Workers" }}
            />
            <Stack.Screen
              name="Staff"
              component={StaffScreen}
              options={{ title: "Staff" }}
            />
            <Stack.Screen
              name="CashFlow"
              component={CashFlowScreen}
              options={{ title: "Cash Flow" }}
            />
            <Stack.Screen
              name="ExchangeRates"
              component={ExchangeRatesScreen}
              options={{ title: "Exchange Rates" }}
            />
            <Stack.Screen
              name="Reports"
              component={ReportsScreen}
              options={{ title: "Reports" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
});
