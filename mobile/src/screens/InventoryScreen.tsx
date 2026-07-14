import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
} from "react-native";
import { productsAPI, warehousesAPI } from "../services/api";
import { Product, Warehouse } from "../types";
import { Search, Calendar, Filter, X, Plus } from "lucide-react-native";
import { formatDateTime, getMyanmarNow } from "../utils/format";
import { CustomInput } from "../components/CustomInput";
import { CustomButton } from "../components/CustomButton";
import Modal from "../components/Modal";

const InventoryScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("");

  // Register Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [marker, setMarker] = useState("");
  const [packages, setPackages] = useState("");
  const [weight, setWeight] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState<"kg" | "viss">("kg");
  const [currency, setCurrency] = useState<"MMK" | "USD" | "CNY">("MMK");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
  const [date, setDate] = useState(getMyanmarNow());

  const fetchInventory = async () => {
    try {
      const data = await productsAPI.getAll(true);
      setProducts(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to fetch inventory.");
    }
  };

  const fetchWarehouses = async () => {
    try {
      const data = await warehousesAPI.getAll();
      setWarehouses(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchInventory(), fetchWarehouses()]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRegister = async () => {
    if (!marker.trim()) {
      Alert.alert("Validation", "Marker name is required.");
      return;
    }
    const weightVal = parseFloat(weight);
    if (!weightVal || weightVal <= 0) {
      Alert.alert("Validation", "Please enter a valid weight.");
      return;
    }

    try {
      await productsAPI.create({
        date: new Date(date).toISOString(),
        packages: packages.trim() || "0",
        marker: marker.trim(),
        unit,
        weight: weightVal,
        price: parseFloat(price) || 0,
        currency,
        warehouseId: selectedWarehouseId || undefined,
      });

      setIsRegisterOpen(false);
      setMarker("");
      setPackages("");
      setWeight("");
      setPrice("");
      setUnit("kg");
      setCurrency("MMK");
      setSelectedWarehouseId(null);
      setDate(getMyanmarNow());
      fetchInventory();
      Alert.alert("Success", "Inventory product registered successfully.");
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || "Failed to register product.");
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        (p.marker || "").toLowerCase().includes(term) ||
        (p.unit || "").toLowerCase().includes(term) ||
        (p.warehouseName || "").toLowerCase().includes(term);

      const matchesWarehouse =
        !filterWarehouse ||
        (p.warehouseName || "").toLowerCase() === filterWarehouse.toLowerCase();

      return matchesSearch && matchesWarehouse;
    });
  }, [products, searchTerm, filterWarehouse]);

  const stats = useMemo(() => {
    let totalBundles = 0;
    let totalWeight = 0;
    filteredProducts.forEach((p) => {
      totalBundles += parseInt(p.packages) || 0;
      totalWeight += p.remainingWeight || 0;
    });
    return { totalBundles, totalWeight };
  }, [filteredProducts]);

  const uniqueWarehouses = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.warehouseName) set.add(p.warehouseName);
    });
    return Array.from(set);
  }, [products]);

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.markerText}>{item.marker}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.unit}</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Remaining Weight</Text>
          <Text style={styles.detailValue}>{item.remainingWeight.toFixed(3)} viss</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Packages</Text>
          <Text style={styles.detailValue}>{item.packages} bundles</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Warehouse</Text>
          <Text style={styles.detailValue}>{item.warehouseName || "N/A"}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Calendar size={14} color="#64748b" />
        <Text style={styles.dateText}>
          Registered: {formatDateTime(item.date)}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Filters, Search and Add Bar */}
        <View style={styles.filterSection}>
          <View style={styles.headerRow}>
            <View style={styles.searchWrapper}>
              <Search size={18} color="#94a3b8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search marker, category..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholderTextColor="#94a3b8"
              />
              {searchTerm !== "" && (
                <TouchableOpacity onPress={() => setSearchTerm("")}>
                  <X size={18} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => {
                setDate(getMyanmarNow());
                setIsRegisterOpen(true);
              }}
            >
              <Plus size={18} color="white" />
            </TouchableOpacity>
          </View>

          {uniqueWarehouses.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.warehouseFilterList}
              contentContainerStyle={styles.filterListContent}
            >
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filterWarehouse === "" ? styles.filterPillActive : null,
                ]}
                onPress={() => setFilterWarehouse("")}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filterWarehouse === "" ? styles.filterPillTextActive : null,
                  ]}
                >
                  All Warehouses
                </Text>
              </TouchableOpacity>
              {uniqueWarehouses.map((wh) => (
                <TouchableOpacity
                  key={wh}
                  style={[
                    styles.filterPill,
                    filterWarehouse === wh ? styles.filterPillActive : null,
                  ]}
                  onPress={() => setFilterWarehouse(wh)}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      filterWarehouse === wh ? styles.filterPillTextActive : null,
                    ]}
                  >
                    {wh}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Summary Banner */}
        <View style={styles.summaryBanner}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {stats.totalWeight.toFixed(3)}
            </Text>
            <Text style={styles.summaryLabel}>Total Weight (viss)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{stats.totalBundles}</Text>
            <Text style={styles.summaryLabel}>Total Bundles</Text>
          </View>
        </View>

        {/* List of Inventory items */}
        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshing={loading}
            onRefresh={fetchInventory}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Filter size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>No inventory bundles found</Text>
              </View>
            }
          />
        )}

        {/* Register Product Modal */}
        <Modal
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
          title="Register New Inventory Product"
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <CustomInput
              label="Product Marker"
              placeholder="e.g. AKZ-001"
              value={marker}
              onChangeText={setMarker}
            />

            <CustomInput
              label="Packages (bundles)"
              placeholder="0"
              keyboardType="numeric"
              value={packages}
              onChangeText={setPackages}
            />

            <CustomInput
              label="Weight"
              placeholder="0"
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />

            <Text style={styles.selectLabel}>Unit</Text>
            <View style={styles.pillsContainer}>
              {(["kg", "viss"] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.pillOption, unit === u && styles.pillOptionActive]}
                  onPress={() => setUnit(u)}
                >
                  <Text style={[styles.pillOptionText, unit === u && styles.pillOptionTextActive]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <CustomInput
              label="Price"
              placeholder="0"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />

            <Text style={styles.selectLabel}>Currency</Text>
            <View style={styles.pillsContainer}>
              {(["MMK", "USD", "CNY"] as const).map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.pillOption, currency === c && styles.pillOptionActive]}
                  onPress={() => setCurrency(c)}
                >
                  <Text style={[styles.pillOptionText, currency === c && styles.pillOptionTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.selectLabel}>Warehouse</Text>
            <ScrollView style={styles.dropdownList} nestedScrollEnabled>
              {warehouses.map((wh) => (
                <TouchableOpacity
                  key={wh.id}
                  style={[
                    styles.dropdownItem,
                    selectedWarehouseId === wh.id && styles.dropdownItemActive,
                  ]}
                  onPress={() => setSelectedWarehouseId(wh.id)}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedWarehouseId === wh.id && styles.dropdownItemTextActive,
                    ]}
                  >
                    {wh.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <CustomInput
              label="Date"
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />

            <CustomButton
              title="Register Product"
              onPress={handleRegister}
              style={styles.modalSubmitBtn}
            />
          </ScrollView>
        </Modal>
      </View>
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
  filterSection: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  searchWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0f172a",
    height: "100%",
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  warehouseFilterList: {
    marginTop: 12,
    flexDirection: "row",
  },
  filterListContent: {
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  filterPillActive: {
    backgroundColor: "#2563eb",
  },
  filterPillText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },
  filterPillTextActive: {
    color: "white",
  },
  summaryBanner: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "white",
  },
  summaryLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
    marginTop: 2,
  },
  divider: {
    width: 1,
    backgroundColor: "#334155",
    marginVertical: 4,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  markerText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1e293b",
  },
  categoryBadge: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563eb",
  },
  cardDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
  },
  dateText: {
    fontSize: 11,
    color: "#64748b",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "600",
  },
  selectLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 10,
  },
  pillsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  pillOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    alignItems: "center",
  },
  pillOptionActive: {
    borderColor: "#2563eb",
    backgroundColor: "#dbeafe",
  },
  pillOptionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  pillOptionTextActive: {
    color: "#1e40af",
  },
  dropdownList: {
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    marginBottom: 16,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
  },
  dropdownItemActive: {
    backgroundColor: "#dbeafe",
  },
  dropdownItemText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "600",
  },
  dropdownItemTextActive: {
    color: "#1e40af",
  },
  modalSubmitBtn: {
    marginTop: 12,
    marginBottom: 32,
  },
});

export default InventoryScreen;
