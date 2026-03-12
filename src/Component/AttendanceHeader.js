import { View, Text, StyleSheet } from "react-native"
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen"

const AttendanceHeader = () => {
  return (
    <View style={styles.headerRow}>
      <Text style={[styles.headerText, styles.photoColor]}>Photo</Text>
      <Text style={[styles.headerText, styles.dateColor]}>Date</Text>
      <Text style={[styles.headerText, styles.punchInColor]}>Punch In</Text>
      <Text style={[styles.headerText, styles.punchOutColor]}>Punch Out</Text>
      <Text style={[styles.headerText, styles.totalHrsColor]}>Total Hrs</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    paddingVertical: hp("2%"),
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    alignItems: "center",
    paddingHorizontal: wp('0.1%'),
  },
  headerText: {
    flex: 1,
    fontSize: Math.max(wp("3.5%"), 14),
    textAlign: "center",
    fontWeight: "500",
  },
  photoColor: {
    color: "#374151",
    right: 8,
  },
  dateColor: {
    color: "#374151",
    right: 12,
  },
  punchInColor: {
    color: "#34A853",
    right: 12,
  },
  punchOutColor: {
    color: "#C6303E",
    right: 1,
    flex: 1
  },
  totalHrsColor: {
    color: "#6E7079",
    // right: 0.1,
    flex: 1
  },
})

export default AttendanceHeader
