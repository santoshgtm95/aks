# Walkthrough: React Native Mobile Application Setup

We have successfully initialized and set up the cross-platform mobile application utilizing **React Native (Expo)** under the `mobile/` directory, connecting to the `AKZ.API` backend service.

---

## Technical Stack & Configuration

1. **Framework**: Expo (React Native SDK 57)
2. **Language**: TypeScript
3. **Dependencies Installed**:
   - `axios` (API networking)
   - `expo-secure-store` (secure client JWT session storage)
   - `lucide-react-native` (UI icons)
   - `@react-navigation/native`, `@react-navigation/stack`, `@react-navigation/bottom-tabs` (tab-based & nested screen stack navigation)
   - `expo-linear-gradient` (gradient styling)
   - `react-native-safe-area-context`, `react-native-screens`, `react-native-gesture-handler` (required stack navigation dependencies)
   - `react-native-web`, `react-dom` (web bundling compatibility dependencies)
4. **API Base URL Configuration**:
   - Implemented dynamic configuration support in `mobile/src/services/api.ts`.
   - Defaults to `http://10.0.2.2:5159/api` (standard Android emulator loopback).
   - Can be adjusted dynamically via the gear/settings toggle on the login screen (e.g. to a local Wi-Fi IP like `http://192.168.x.x:5159/api` for testing on physical devices running the Expo Go app).

---

## App Directory Structure & Key Files Created

- **`mobile/App.tsx`**: Wired up safe-area-context, dynamic `AuthProvider`, and `AppNavigator` stack router.
- **`mobile/src/types/index.ts`**: Ported typescript interfaces from client 1:1.
- **`mobile/src/services/api.ts`**: Refactored frontend API request layers to consume custom platform-aware local/secure storage and dynamic URL bindings.
- **`mobile/src/context/AuthContext.tsx`**: Custom login state provider, attaching auth headers and handling `401 Unauthorized` logouts.
- **`mobile/src/navigation/AppNavigator.tsx`**: Screen tab-bar setup (Dashboard, Inventory, Production hub, Sales hub, Settings/More) with nested screens for each production step.
- **`mobile/src/components/`**: Custom input box (`CustomInput`), gradient button (`CustomButton`), and overlay dialog (`Modal`).
- **`mobile/src/screens/`**:
  - `LoginScreen`: Connection config toggle + login credentials.
  - `DashboardScreen`: Launchpad quick shortcuts, warning alerts, and summary stats.
  - `InventoryScreen`: Product list cards, warehouse filter pills, totals banner, and a new **"Register Product"** form modal.
  - `WashGradingScreen`: Available bundles tab, assign-to-worker dialog, ongoing wash processes tab, and washed stock records list.
  - `MessLabourScreen`: Available washed bundles, assign-to-worker form with color category distribution, and completed logs.
  - `PurificationScreen`: Available sorted categories, ongoing purification processes, completed purified logs, and supervisor mapping.
  - `RefinementScreen`: Available purified categories, refinement ongoing log, and completed refined stock list.
  - `SingleDoubleDrawnScreen`: Available refined categories, drawn log, and size-by-size (6" through Bar) weight distribution entries.
  - `SemiExportScreen`: Available drawn stock, assign to semi-export worker modal, and history.
  - `SemiExportPurchaseScreen`: Supplier purchase logs and registration modal.
  - `SalesScreen`: Direct direct sales manager form (product selection scroll, currency pills, viss/kg toggles) and history.
  - `Sales6Screen`: Customer ledger dropdown (with live add-customer dialog) and currency exchange rates.
  - `WorkerScreen`: Lists workers and supports creating workers with department check-list toggles (Wash, Mess Labour, Refinement, Drawn, Purchase).
  - `StaffScreen`: Renders staff users and adds role-based account registration form.
  - `CashFlowScreen`: Displays worker payment tracker, fee breakdown by process type, and a payment recording modal.
  - `ExchangeRatesScreen`: Current currency rate updating cards and histories.
  - `ReportsScreen`: Charts displaying stock weight by product, sales summary revenue by currency, and inventory numbers.

---

## Verification Results
- Executed `npx tsc --noEmit` within the `mobile/` directory to verify TypeScript code compilation.
- **Result**: Compilation completed successfully with **zero errors**.
- Web bundling compatibility verified.
