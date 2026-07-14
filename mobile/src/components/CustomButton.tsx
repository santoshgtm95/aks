import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface CustomButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "success";
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  loading,
  variant = "primary",
  style,
  disabled,
  ...props
}) => {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const isSuccess = variant === "success";

  // Gradient Colors
  let gradientColors: [string, string] = ["#3b82f6", "#2563eb"]; // default blue
  if (isDanger) gradientColors = ["#ef4444", "#dc2626"];
  if (isSuccess) gradientColors = ["#10b981", "#059669"];

  if (variant === "secondary") {
    return (
      <TouchableOpacity
        style={[styles.button, styles.secondaryButton, style]}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color="#475569" size="small" />
        ) : (
          <Text style={[styles.text, styles.secondaryText]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      disabled={disabled || loading}
      {...props}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={styles.text}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  gradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  text: {
    fontSize: 15,
    fontWeight: "700",
    color: "white",
  },
  secondaryText: {
    color: "#475569",
  },
});
