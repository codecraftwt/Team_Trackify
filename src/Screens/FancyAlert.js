// FancyAlert.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Modal from "react-native-modal";
import Icon from "react-native-vector-icons/FontAwesome";

const FancyAlert = ({
  visible,
  onClose,
  type = "success",
  title,
  message,
  showConfirm = false,   // ✅ whether to show Confirm/Cancel
  onConfirm,             // ✅ confirm action callback
  confirmText = "Yes",
  cancelText = "Cancel",
   hideButtons = false, 
}) => {
  // Colors based on type
  const colors = {
    success: "#34a853",
    error: "#C6303E",
    info: "#0d6efd",
    warning: "#fede3a",
    coffee: "#0d6efd",
    briefcase: "#fede3a",
    signIn: "#34a853",
    signOut: "#C6303E",
  };

  const icons = {
    success: "check-circle",
    error: "exclamation-circle",
    info: "info-circle",
    warning: "exclamation-triangle",
    coffee: "coffee",
    briefcase: "briefcase",
    signIn: "sign-in",
    signOut: "sign-out",
  };

  return (
    <Modal
      isVisible={visible}
      animationIn="zoomIn"
      animationOut="zoomOut"
      backdropOpacity={0.5}
      onBackdropPress={onClose}
    >
      <View style={styles.container}>
        {/* Circle background for icon */}
        <View style={[styles.iconWrapper, { borderColor: colors[type] }]}>
          <Icon name={icons[type]} size={40} color={colors[type]} />
        </View>

        <Text style={[styles.title, { color: colors[type] }]}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        {/* ✅ Conditional Buttons */}
        {!hideButtons && (
          showConfirm ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.button, { backgroundColor: "#6c757d" }]}
              >
                <Text style={styles.buttonText}>{cancelText}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  if (onConfirm) onConfirm();
                }}
                style={[styles.button, { backgroundColor: colors[type] }]}
              >
                <Text style={styles.buttonText}>{confirmText}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={onClose}
              style={[styles.button, { backgroundColor: colors[type] }]}
            >
              <Text style={styles.buttonText}>OK</Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    borderWidth: 3,
    borderRadius: 50,
    padding: 12,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 5,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 15,
    color: "#333",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginTop: 10,
    minWidth: 100,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default FancyAlert;
