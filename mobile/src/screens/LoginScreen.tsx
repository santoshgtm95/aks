import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { CustomInput } from "../components/CustomInput";
import { CustomButton } from "../components/CustomButton";
import { Lock, User, Settings, Globe } from "lucide-react-native";
import { setApiBaseUrl } from "../services/api";
import { LinearGradient } from "expo-linear-gradient";
import { storage } from "../services/storage";

const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // API Config State
  const [showConfig, setShowConfig] = useState(false);
  const [apiUrl, setApiUrl] = useState("http://10.0.2.2:5159/api");

  // Load stored custom API Url on mount
  React.useEffect(() => {
    const loadApiUrl = async () => {
      const storedUrl = await storage.getItem("custom_api_url");
      if (storedUrl) {
        setApiUrl(storedUrl);
        setApiBaseUrl(storedUrl);
      }
    };
    loadApiUrl();
  }, []);

  const handleSaveConfig = async () => {
    try {
      setApiBaseUrl(apiUrl);
      await storage.setItem("custom_api_url", apiUrl);
      Alert.alert("Success", "API Base URL updated!");
      setShowConfig(false);
    } catch {
      Alert.alert("Error", "Failed to save API URL config.");
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Validation", "Please enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      await login({ username, password });
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Invalid credentials or network error.";
      Alert.alert("Login Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={["#1e3a8a", "#1e40af"]}
          style={styles.headerBackground}
        >
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>AKZ</Text>
            <Text style={styles.subtitleText}>Enterprise Management System</Text>
          </View>
        </LinearGradient>

        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.instructionsText}>
            Sign in to manage warehouse and sorting processes.
          </Text>

          <CustomInput
            label="Username"
            placeholder="Enter username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            icon={<User size={20} color="#94a3b8" />}
          />

          <CustomInput
            label="Password"
            placeholder="Enter password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon={<Lock size={20} color="#94a3b8" />}
          />

          <CustomButton
            title="Log In"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginBtn}
          />

          {/* Config Settings Toggle */}
          <TouchableOpacity
            style={styles.configToggle}
            onPress={() => setShowConfig(!showConfig)}
          >
            <Settings size={16} color="#64748b" style={styles.configIcon} />
            <Text style={styles.configToggleText}>
              {showConfig ? "Hide Connection Settings" : "Configure API Connection"}
            </Text>
          </TouchableOpacity>

          {showConfig && (
            <View style={styles.configBox}>
              <Text style={styles.configTitle}>Backend Configuration</Text>
              <CustomInput
                label="API Base URL"
                placeholder="http://192.168.1.100:5159/api"
                value={apiUrl}
                onChangeText={setApiUrl}
                autoCapitalize="none"
                autoCorrect={false}
                icon={<Globe size={18} color="#94a3b8" />}
              />
              <CustomButton
                title="Save & Apply"
                variant="secondary"
                onPress={handleSaveConfig}
                style={styles.configSaveBtn}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  headerBackground: {
    height: 240,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoContainer: {
    alignItems: "center",
  },
  logoText: {
    fontSize: 48,
    fontWeight: "900",
    color: "white",
    letterSpacing: 2,
  },
  subtitleText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
    fontWeight: "600",
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },
  instructionsText: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 28,
  },
  loginBtn: {
    marginTop: 8,
  },
  configToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    padding: 10,
  },
  configIcon: {
    marginRight: 6,
  },
  configToggleText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  configBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  configTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 12,
  },
  configSaveBtn: {
    height: 40,
    marginTop: 4,
  },
});

export default LoginScreen;
