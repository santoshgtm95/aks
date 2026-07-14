import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { usersAPI } from "../services/api";
import { User } from "../types";
import { CustomButton } from "../components/CustomButton";
import { CustomInput } from "../components/CustomInput";
import Modal from "../components/Modal";
import { Search, UserPlus, Trash2, ShieldAlert } from "lucide-react-native";

const StaffScreen: React.FC = () => {
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [roleId, setRoleId] = useState<number>(3); // default: Staff

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usersAPI.getAll ? await usersAPI.getAll() : [];
      setStaff(data);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to fetch staff members.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleCreate = async () => {
    if (!username.trim() || !password || !fullName.trim() || !email.trim()) {
      Alert.alert("Validation", "Username, Password, Full Name, and Email are required.");
      return;
    }

    try {
      await usersAPI.create({
        username: username.trim(),
        password: password,
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        roleId: roleId,
      });
      setIsCreateOpen(false);
      fetchStaff();
      Alert.alert("Success", "Staff member created successfully.");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e.response?.data?.message || "Failed to create staff member.");
    }
  };

  const handleDelete = (id: number, staffName: string) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete staff user ${staffName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await usersAPI.delete(id);
              fetchStaff();
              Alert.alert("Deleted", "Staff member successfully removed.");
            } catch (e: any) {
              Alert.alert("Error", e.response?.data?.message || "Failed to delete.");
            }
          },
        },
      ]
    );
  };

  const filteredStaff = useMemo(() => {
    return staff.filter(
      (s) =>
        (s.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.roleName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [staff, searchTerm]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.searchWrapper}>
            <Search size={18} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search staff by name, email, role..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#94a3b8"
            />
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              setUsername("");
              setPassword("");
              setFullName("");
              setEmail("");
              setPhoneNumber("");
              setRoleId(3);
              setIsCreateOpen(true);
            }}
          >
            <UserPlus size={18} color="white" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <FlatList
            data={filteredStaff}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.fullName ? item.fullName[0].toUpperCase() : "U"}</Text>
                  </View>
                  <View style={styles.details}>
                    <Text style={styles.nameText}>{item.fullName}</Text>
                    <Text style={styles.usernameText}>@{item.username}</Text>
                    <Text style={styles.emailText}>{item.email}</Text>
                    <Text style={styles.roleBadge}>{item.roleName}</Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id, item.fullName)}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <ShieldAlert size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>No staff members registered yet</Text>
              </View>
            }
          />
        )}

        {/* Create Staff Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Add New Staff Member"
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <CustomInput
              label="Full Name"
              placeholder="Enter full name"
              value={fullName}
              onChangeText={setFullName}
            />

            <CustomInput
              label="Username"
              placeholder="Enter username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <CustomInput
              label="Password"
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <CustomInput
              label="Email"
              placeholder="Enter email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <CustomInput
              label="Phone Number"
              placeholder="Enter phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            <Text style={styles.selectLabel}>Select Role</Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={[styles.dropdownItem, roleId === 1 && styles.dropdownItemActive]}
                onPress={() => setRoleId(1)}
              >
                <Text style={[styles.dropdownItemText, roleId === 1 && styles.dropdownItemTextActive]}>Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dropdownItem, roleId === 2 && styles.dropdownItemActive]}
                onPress={() => setRoleId(2)}
              >
                <Text style={[styles.dropdownItemText, roleId === 2 && styles.dropdownItemTextActive]}>Manager</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dropdownItem, roleId === 3 && styles.dropdownItemActive]}
                onPress={() => setRoleId(3)}
              >
                <Text style={[styles.dropdownItemText, roleId === 3 && styles.dropdownItemTextActive]}>Staff</Text>
              </TouchableOpacity>
            </View>

            <CustomButton
              title="Save User"
              onPress={handleCreate}
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
  header: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  searchWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
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
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#16a34a",
  },
  details: {
    flex: 1,
  },
  nameText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
  },
  usernameText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 1,
  },
  emailText: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  roleBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563eb",
    backgroundColor: "#dbeafe",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 6,
    textTransform: "uppercase",
  },
  cardActions: {
    alignItems: "flex-end",
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#fff5f5",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "600",
  },
  selectLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  dropdownContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  dropdownItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    alignItems: "center",
  },
  dropdownItemActive: {
    borderColor: "#2563eb",
    backgroundColor: "#dbeafe",
  },
  dropdownItemText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  dropdownItemTextActive: {
    color: "#1e40af",
  },
  modalSubmitBtn: {
    marginTop: 8,
    marginBottom: 24,
  },
});

export default StaffScreen;
