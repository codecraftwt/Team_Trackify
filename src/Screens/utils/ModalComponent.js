import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native"

const ModalComponent = ({
  isVisible,
  onClose,
  title,
  content,
  buttonText = "Submit",
  buttonBackgroundColor = "#438aff",
  onConfirm,
}) => {
  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <View style={{ marginVertical: 12 }}>{content}</View>

          <View style={styles.row}>
            <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={onClose}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { backgroundColor: buttonBackgroundColor }]} onPress={onConfirm}>
              <Text style={[styles.btnText, { color: "#fff" }]}>{buttonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  card: { width: "88%", backgroundColor: "#fff", borderRadius: 12, padding: 16 },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  row: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 12 },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  cancel: { backgroundColor: "#E5E7EB" },
  btnText: { fontSize: 16, color: "#111827" },
})

export default ModalComponent
