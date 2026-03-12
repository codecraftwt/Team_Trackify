import { useLayoutEffect, useState, useEffect } from "react"
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native"
import { useRoute, useNavigation } from "@react-navigation/native"
import Ionicons from "react-native-vector-icons/Ionicons"
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from "react-native-vector-icons/FontAwesome5"
import DateTimePickerModal from "react-native-modal-datetime-picker"
import { pick } from '@react-native-documents/picker'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen"

export default function ExperienceDetailsEdit() {
    const route = useRoute()
    const navigation = useNavigation()

    // Get data from navigation params
    const { experienceData, updatedExperience, editIndex, isUpdate, isNew } = route.params || {}

    // State for all experience entries
    const [experiences, setExperiences] = useState([])

    // State for showing/hiding the add form
    const [showForm, setShowForm] = useState(false)

    // Form state for new entry
    const [companyName, setCompanyName] = useState("")
    const [jobTitle, setJobTitle] = useState("")
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [isFromDatePickerVisible, setFromDatePickerVisible] = useState(false)
    const [isToDatePickerVisible, setToDatePickerVisible] = useState(false)
    const [relevantExperience, setRelevantExperience] = useState("")
    const [experienceInMonths, setExperienceInMonths] = useState("")
    const [jobDescription, setJobDescription] = useState("")
    const [newFileName, setNewFileName] = useState('No file')
    const [newFileData, setNewFileData] = useState(null)

    // State for editing
    const [editingId, setEditingId] = useState(null)
    const [isEditing, setIsEditing] = useState(false)

    // Initialize with data from route params
    useEffect(() => {
        if (experienceData && isNew) {
            setExperiences(prev => {
                if (prev.some(exp => exp.id === experienceData.id)) return prev
                return [...prev, experienceData]
            })
        }
    
        if (updatedExperience && isUpdate && editIndex !== undefined) {
            setExperiences(prev => {
                const updated = [...prev]
                updated[editIndex] = updatedExperience
                return updated
            })
        }
    }, [experienceData, updatedExperience, editIndex, isNew, isUpdate])
    

    // Date picker handlers
    const handleFromDateConfirm = (date) => {
        setFromDate(date)
        setFromDatePickerVisible(false)
    }

    const handleToDateConfirm = (date) => {
        setToDate(date)
        setToDatePickerVisible(false)
    }

    // Document picker handler
    const handlePickDocument = async () => {
        try {
            const res = await pick({
                type: ['application/pdf'],
            })

            if (res && res[0]) {
                const file = res[0]
                setNewFileData(file)
                setNewFileName(file.name || 'Document.pdf')
            }
        } catch (err) {
            if (err.code !== 'DOCUMENT_PICKER_CANCELED') {
                console.error('Document pick error:', err)
            }
        }
    }

    // Save new experience entry
    const handleSave = () => {
        // Validate required fields
        if (!companyName || !jobTitle || !fromDate) {
            Alert.alert('Required Fields', 'Please fill in all required fields')
            return
        }

        if (isEditing && editingId) {
            // Update existing entry
            const updatedExperiences = experiences.map(exp =>
                exp.id === editingId ? {
                    ...exp,
                    companyName,
                    jobTitle,
                    fromDate,
                    toDate,
                    relevantExperience,
                    experienceInMonths,
                    jobDescription,
                    fileName: newFileData?.name || exp.fileName,
                    fileSize: newFileData?.size ? `${Math.round(newFileData.size / 1024)}kb` : exp.fileSize,
                    fileData: newFileData || exp.fileData,
                } : exp
            )

            setExperiences(updatedExperiences)
            Alert.alert('Success', 'Experience updated successfully')
        } else {
            // Add new entry
            const newEntry = {
                id: Date.now().toString(),
                companyName,
                jobTitle,
                fromDate,
                toDate,
                relevantExperience,
                experienceInMonths,
                jobDescription,
                fileName: newFileData?.name || 'Document.pdf',
                fileSize: newFileData?.size ? `${Math.round(newFileData.size / 1024)}kb` : '256kb',
                fileData: newFileData,
            }

            setExperiences([...experiences, newEntry])
            Alert.alert('Success', 'New experience added successfully')
        }

        // Reset form
        resetForm()
        setShowForm(false)
        setIsEditing(false)
        setEditingId(null)
    }

    // Delete experience entry
    const handleDelete = (id) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this experience?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    onPress: () => {
                        const updatedExperiences = experiences.filter(exp => exp.id !== id)
                        setExperiences(updatedExperiences)
                    },
                    style: 'destructive',
                },
            ]
        )
    }

    // Edit experience entry - Navigate to ExperienceDetails
    const handleEdit = (experience, index) => {
        // Navigate to ExperienceDetails with the experience data
        navigation.navigate('ExperienceDetails', {
            editData: experience,
            editIndex: index
        })
    }

    // Reset form fields
    const resetForm = () => {
        setCompanyName("")
        setJobTitle("")
        setFromDate(null)
        setToDate(null)
        setRelevantExperience("")
        setExperienceInMonths("")
        setJobDescription("")
        setNewFileName('No file')
        setNewFileData(null)
    }

    // Add the + button to header
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => {
                        resetForm()
                        setIsEditing(false)
                        setEditingId(null)
                        setShowForm(prev => !prev)
                    }}
                    style={{ marginRight: 15 }}
                >
                    <Icon
                        name={showForm ? "close-circle-outline" : "add-circle-outline"}
                        size={wp('7%')}
                        color="#438aff"
                    />
                </TouchableOpacity>
            )
        })
    }, [navigation, showForm])

    // Format date for display
    const formatDate = (date) => {
        if (!date) return ""
        const dateObj = date instanceof Date ? date : new Date(date)
        return dateObj.toLocaleDateString()
    }

    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            {/* Experience Cards */}
            {experiences.map((exp, index) => (
                <View key={exp.id} style={[styles.card, { marginBottom: 20 }]}>
                    {/* Experience Details */}
                    {[
                        ["Company Name", exp.companyName],
                        ["Job Title", exp.jobTitle],
                        ["From Date", formatDate(exp.fromDate)],
                        ["To Date", formatDate(exp.toDate)],
                        ["Relevant Experience", exp.relevantExperience],
                        ["Experience (In Months)", exp.experienceInMonths],
                    ].map(([label, value]) => (
                        <View style={styles.row} key={label}>
                            <Text style={styles.rowLabel}>{label}</Text>
                            <Text style={styles.rowValue}>{value}</Text>
                        </View>
                    ))}

                    {/* Job Description */}
                    <Text style={[styles.rowLabel, { marginTop: 12 }]}>Job Description</Text>
                    <View style={styles.textAreaWrapper}>
                        <TextInput
                            style={styles.textArea}
                            value={exp.jobDescription}
                            multiline
                            editable={false}
                        />
                    </View>

                    {/* Attached File */}
                    <Text style={[styles.attachLabel, { marginTop: 16 }]}>Attached File</Text>
                    <View style={styles.fileCard}>
                        <FontAwesome5 name="file-pdf" size={24} color="red" />
                        <View style={{ flex: 1, marginHorizontal: 12 }}>
                            <Text style={styles.fileName}>{exp.fileName || exp.fileData?.name || 'File'}</Text>
                            <Text style={styles.fileSize}>{exp.fileSize || (exp.fileData?.size ? `${Math.round(exp.fileData.size / 1024)}kb` : '256kb')}</Text>
                        </View>
                        <TouchableOpacity>
                            <Text style={styles.viewText}>View</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.editButton]}
                            onPress={() => handleEdit(exp, index)}
                        >
                            <Ionicons name="pencil" size={18} color="#007bff" />
                            <Text style={styles.buttonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={() => handleDelete(exp.id)}
                        >
                            <Ionicons name="trash-outline" size={18} color="red" />
                            <Text style={styles.buttonText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}

            {/* Add/Edit Form */}
            {showForm && (
                <View style={styles.formContainer}>
                    {/* Form Title */}
                    <View style={styles.formTitleContainer}>
                        <Text style={styles.formTitle}>
                            {isEditing ? 'Edit Experience' : 'Add New Experience'}
                        </Text>
                    </View>

                    {/* Company Name */}
                    <View style={styles.formField}>
                        <Text style={styles.label}>Company Name<Text style={{ color: "red" }}>*</Text></Text>
                        <View style={styles.inputGrey}>
                            <TextInput
                                style={styles.input}
                                placeholder="Type here"
                                placeholderTextColor="#aaa"
                                value={companyName}
                                onChangeText={setCompanyName}
                            />
                        </View>
                    </View>

                    {/* Job Title */}
                    <View style={styles.formField}>
                        <Text style={styles.label}>Job Title<Text style={{ color: "red" }}>*</Text></Text>
                        <View style={styles.inputGrey}>
                            <TextInput
                                style={styles.input}
                                placeholder="Type here"
                                placeholderTextColor="#aaa"
                                value={jobTitle}
                                onChangeText={setJobTitle}
                            />
                        </View>
                    </View>

                    {/* Dates side-by-side */}
                    <View style={styles.rowFields}>
                        <View style={styles.halfField}>
                            <Text style={styles.datelabel}>From Date<Text style={{ color: "red" }}>*</Text></Text>
                            <TouchableOpacity
                                style={styles.inputGreyRow}
                                onPress={() => setFromDatePickerVisible(true)}
                            >
                                <Text style={styles.dateText}>
                                    {fromDate ? formatDate(fromDate) : "Select date"}
                                </Text>
                                <Ionicons name="calendar-outline" size={20} color="#888" />
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.halfField, { marginLeft: 12 }]}>
                            <Text style={styles.datelabel}>To Date</Text>
                            <TouchableOpacity
                                style={styles.inputGreyRow}
                                onPress={() => setToDatePickerVisible(true)}
                            >
                                <Text style={styles.dateText}>
                                    {toDate ? formatDate(toDate) : "Select date"}
                                </Text>
                                <Ionicons name="calendar-outline" size={20} color="#888" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Date Pickers */}
                    <DateTimePickerModal
                        isVisible={isFromDatePickerVisible}
                        mode="date"
                        onConfirm={handleFromDateConfirm}
                        onCancel={() => setFromDatePickerVisible(false)}
                        date={fromDate || new Date()}
                    />

                    <DateTimePickerModal
                        isVisible={isToDatePickerVisible}
                        mode="date"
                        onConfirm={handleToDateConfirm}
                        onCancel={() => setToDatePickerVisible(false)}
                        date={toDate || new Date()}
                    />

                    {/* Relevant Experience */}
                    <View style={styles.formField}>
                        <Text style={styles.label}>Relevant Experience</Text>
                        <View style={styles.inputGrey}>
                            <TextInput
                                style={styles.input}
                                placeholder="Type here"
                                placeholderTextColor="#aaa"
                                value={relevantExperience}
                                onChangeText={setRelevantExperience}
                            />
                        </View>
                    </View>

                    {/* Experience (In Months) */}
                    <View style={styles.formField}>
                        <Text style={styles.label}>Experience (In Months)</Text>
                        <View style={styles.inputGrey}>
                            <TextInput
                                style={styles.input}
                                placeholder="Type here"
                                placeholderTextColor="#aaa"
                                keyboardType="numeric"
                                value={experienceInMonths}
                                onChangeText={setExperienceInMonths}
                            />
                        </View>
                    </View>

                    {/* Job Description */}
                    <View style={styles.formField}>
                        <Text style={styles.label}>Job Description</Text>
                        <View style={[styles.inputGrey, styles.textAreaWrapper]}>
                            <TextInput
                                style={[ styles.textArea]}
                                multiline
                                placeholder="Type here"
                                placeholderTextColor="#aaa"
                                value={jobDescription}
                                onChangeText={setJobDescription}
                            />
                        </View>
                    </View>

                    {/* Attach File */}
                    <View style={styles.formField}>
                        <Text style={styles.label}>
                            Attach File <Text style={{ color: "red" }}>*</Text>
                        </Text>
                        <TouchableOpacity onPress={handlePickDocument}>
                            <View style={styles.inputGreyRow}>
                                <Text>
                                    {newFileData ? newFileName : 'Tap to attach PDF'}
                                </Text>
                                <Ionicons name="attach-outline" size={20} color="#888" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>
                            {isEditing ? 'Update' : 'Save'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Empty state message */}
            {experiences.length === 0 && !showForm && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                        No experiences added yet. Tap the + icon to add one.
                    </Text>
                </View>
            )}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: wp(4),
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: hp(10),
    },
    emptyStateText: {
        fontSize: wp(4),
        color: '#666',
        textAlign: 'center',
    },

    // Card Styles
    card: {
        backgroundColor: "#fff",
        borderRadius: wp(3),
        padding: wp(4),
        borderWidth: 1,
        borderColor: "#ddd",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: wp(1.5),
        // shadowOffset: { width: 0, height: hp(0.5) },
        // elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: hp(1),
        marginBottom: hp(1),
    },
    cardTitle: {
        fontSize: wp(4),
        fontWeight: 'bold',
        color: '#438aff',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        marginTop: hp(1.5),
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: wp(1.5),
        paddingHorizontal: wp(5),
        paddingVertical: hp(1),
        gap: wp(1),
    },
    editButton: {
        borderColor: '#007bff',
    },
    deleteButton: {
        borderColor: 'red',
    },
    buttonText: {
        fontWeight: '600',
        fontSize: wp(3.5),
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: hp(1),
        borderBottomWidth: 1,
        borderColor: "#eee",
    },
    rowLabel: {
        fontSize: wp('3.5%'),
        color: '#5F6368',
        fontWeight: '500',
        left: wp(2),
    },
    attachLabel: {
        fontSize: wp(3.5),
        color: "#000",
        fontWeight: "500",
        left: wp(2),
        bottom: hp(0.5),
    },
    rowValue: {
        fontSize: wp(3.5),
        color: "#000",
        fontWeight: "500"
    },
    textAreaWrapper: {
        // backgroundColor: "#f5f6fa",
        backgroundColor: '#f5f6fa',
        justifyContent: "center",
        paddingHorizontal: wp(3),
        height: hp(6),
        borderRadius: wp(2),
        borderWidth: 1,
        borderColor: "#ddd",
        marginTop: hp(0.5),
    },
    textArea: {
        minHeight: hp(10),
        color: "#000",
        // paddingHorizontal: wp(2),
        padding: wp(4),
        
    },
    fileCard: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E5E5E5",
        borderRadius: wp(2),
        backgroundColor: "#fff",
        paddingHorizontal: wp(3),
        paddingVertical: hp(1.5),
        marginBottom: hp(1),
    },
    fileName: { fontSize: wp(3.5), fontWeight: "500" },
    fileSize: { fontSize: wp(3), color: "#999" },
    viewText: { color: "#007aff", fontWeight: "500" },

    // Form Styles
    formContainer: {
        marginTop: hp(2),
        // backgroundColor: '#f9f9f9',
        borderRadius: wp(3),
        padding: wp(4),
        borderWidth: 1,
        borderColor: '#eee',
    },
    formTitleContainer: {
        marginBottom: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
        paddingBottom: hp(1),
    },
    formTitle: {
        fontSize: wp(4.5),
        fontWeight: "bold",
        color: "#333",
    },
    formField: { marginBottom: hp(2) },
    label: {
        fontSize: wp('3.5%'),
        color: '#5F6368',
        fontWeight: '500',
        marginBottom: hp(0.5),
        left: wp(2),
    },
    inputGrey: {
        // backgroundColor: "#f5f6fa",
        borderRadius: wp(2),
        justifyContent: "center",
        paddingHorizontal: wp(3),
        height: hp(6),
    },
    inputGreyRow: {
        backgroundColor: "#f5f6fa",
        borderRadius: wp(2),
        height: hp(6),
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: wp(3),
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#E5E5E5",
        borderRadius: wp(2),
    },
    rowFields: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: hp(2),
    },
    datelabel: {
        fontSize: wp(3.5),
        color: "#73767b",
        marginBottom: hp(0.5),
        fontWeight: "500",
        left: wp(2),
    },
    halfField: { flex: 1 },
    input: {
         flex: 1, fontSize: wp(4), color: "#000",  borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: wp(3),
        padding: wp(4),
        // shadowColor: "#000",
        // shadowOpacity: 0.1,
        // shadowRadius: wp(1.5),
        backgroundColor: '#f5f6fa',
    },


    dateText: { color: "#000" },
    saveButton: {
        backgroundColor: "#438aff",
        paddingVertical: hp(1.8),
        borderRadius: wp(2),
        alignItems: "center",
        marginTop: hp(1),
        marginBottom: hp(2),
    },
    saveButtonText: {
        color: "#fff",
        fontSize: wp(4),
        fontWeight: "600"
    },
    cancelButton: {
        backgroundColor: "#f5f5f5",
        paddingVertical: hp(1.8),
        borderRadius: wp(2),
        alignItems: "center",
        marginBottom: hp(2),
        borderWidth: 1,
        borderColor: "#ddd",
    },
    cancelButtonText: {
        color: "#333",
        fontSize: wp(4),
        fontWeight: "600"
    },
});
