// QualificationDetailsEdit.js
import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { pick } from '@react-native-documents/picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

export default function QualificationDetailsEdit() {
    const route = useRoute();
    const navigation = useNavigation();
    
    const {
        qualificationData,
        updatedQualification,
        editIndex,
        isUpdate,
        isNew,
        postQualificationDetails // Add this line to get post qualification data
    } = route.params || {};

    const [topQualification, setTopQualification] = useState(qualificationData || null);
    const [additionalQualifications, setAdditionalQualifications] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newQualificationType, setNewQualificationType] = useState('');
    const [newSpecialization, setNewSpecialization] = useState('');
    const [newCompletionDate, setNewCompletionDate] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [newFileData, setNewFileData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);
    const [isEditingTopCard, setIsEditingTopCard] = useState(false);

    useEffect(() => {
        if (qualificationData && isNew) {
            setTopQualification(qualificationData);
        }

        if (updatedQualification && isUpdate) {
            if (editIndex !== undefined) {
                if (editIndex === 0 || editIndex === -1) {
                    setTopQualification(updatedQualification);
                } else {
                    setAdditionalQualifications(prev => {
                        const updated = [...prev];
                        updated[editIndex - 1] = updatedQualification;
                        return updated;
                    });
                }
            }
        }
    }, [qualificationData, updatedQualification, editIndex, isUpdate, isNew]);

    const handlePickDocument = async () => {
        try {
            const res = await pick({ type: ['application/pdf'] });
            if (res && res[0]) {
                setNewFileData(res[0]);
            }
        } catch (err) {
            if (err.code !== 'DOCUMENT_PICKER_CANCELED') {
                console.error('Document pick error:', err);
            }
        }
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) setNewCompletionDate(selectedDate);
    };

    const handleSave = () => {
        if (!newQualificationType.trim()) {
            Alert.alert('Error', 'Please enter qualification type');
            return;
        }
        if (!newFileData) {
            Alert.alert('Error', 'Please attach a file');
            return;
        }

        const newQualification = {
            id: isEditing ? editingId : Date.now().toString(),
            qualificationType: newQualificationType,
            specialization: newSpecialization,
            completionDate: newCompletionDate,
            fileData: newFileData
        };

        if (isEditing) {
            if (isEditingTopCard) {
                setTopQualification(newQualification);
            } else {
                const updatedQualifications = [...additionalQualifications];
                updatedQualifications[editingIndex] = newQualification;
                setAdditionalQualifications(updatedQualifications);
            }
        } else {
            setAdditionalQualifications([...additionalQualifications, newQualification]);
        }

        resetForm();
    };

    const resetForm = () => {
        setNewQualificationType('');
        setNewSpecialization('');
        setNewCompletionDate(null);
        setNewFileData(null);
        setIsEditing(false);
        setEditingId(null);
        setEditingIndex(null);
        setIsEditingTopCard(false);
        setShowForm(false);
    };

    const handleEdit = (qualification, index, isTopCard = false) => {
        navigation.navigate('QualificationDetails', {
            editData: qualification,
            editIndex: isTopCard ? 0 : index + 1
        });
    };

    const handleDelete = (id, index, isTopCard = false) => {
        Alert.alert("Delete Qualification", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                onPress: () => {
                    if (isTopCard) {
                        if (additionalQualifications.length > 0) {
                            setTopQualification(additionalQualifications[0]);
                            setAdditionalQualifications(additionalQualifications.slice(1));
                        } else {
                            setTopQualification(null);
                        }
                    } else {
                        setAdditionalQualifications(prev => prev.filter((_, i) => i !== index));
                    }
                },
                style: "destructive"
            }
        ]);
    };

    const toggleForm = () => {
        if (showForm) resetForm();
        else setShowForm(true);
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={toggleForm} style={{ marginRight: 15 }}>
                    <Icon name={showForm ? "close-circle-outline" : "add-circle-outline"} size={wp('7%')} color="#438aff" />
                </TouchableOpacity>
            )
        });
    }, [navigation, showForm]);

    const formatDate = (date) => {
        if (!date) return '';
        try {
            return new Date(date).toLocaleDateString();
        } catch (e) {
            return typeof date === 'string' ? date : '';
        }
    };

    const renderQualificationCard = (qualification, index, isTopCard = false) => {
        if (!qualification) return null;
        return (
            <View key={qualification.id || index} style={styles.card}>
                <View style={styles.row}>
                    <Text style={styles.cardLabel}>Qualification Type</Text>
                    <Text style={styles.cardValue}>{qualification.qualificationType}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.cardLabel}>Specialization</Text>
                    <Text style={styles.cardValue}>{qualification.specialization}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.cardLabel}>Completion Date</Text>
                    <Text style={styles.cardValue}>{formatDate(qualification.completionDate)}</Text>
                </View>

                <Text style={styles.attachedlabel}>Attached File</Text>
                <View style={styles.fileCard}>
                    <MaterialCommunityIcons style={styles.icon} name="file-pdf-box" size={hp(5)} color="red" />
                    <View style={{ flex: 1, marginLeft: wp(3) }}>
                        <Text style={{ fontSize: wp(3.2), fontWeight: 'bold' }}>{qualification.fileData?.name || 'File'}</Text>
                        <Text style={{ fontSize: wp(3), color: '#666' }}>
                            {qualification.fileData?.size ? `${Math.round(qualification.fileData.size / 1024)} KB` : ''}
                        </Text>
                    </View>
                    <TouchableOpacity>
                        <Text style={styles.viewText}>View</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => handleEdit(qualification, index, isTopCard)}>
                        <Ionicons name="pencil" size={18} color="#007bff" />
                        <Text style={styles.buttonText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(qualification.id, index, isTopCard)}>
                        <Ionicons name="trash-outline" size={18} color="red" />
                        <Text style={styles.buttonText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderPostQualificationDetails = () => {
        if (!postQualificationDetails) return null;

        return (
            <View style={[styles.card, { borderColor: '#438aff' }]}>
                <Text style={[styles.formTitle, { marginBottom: hp(2), color: '#438aff' }]}>Post Qualification Details</Text>
                <View style={styles.row}>
                    <Text style={styles.cardLabel}>Designation</Text>
                    <Text style={styles.cardValue}>{postQualificationDetails.designation}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.cardLabel}>Organization</Text>
                    <Text style={styles.cardValue}>{postQualificationDetails.organization}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.cardLabel}>Experience</Text>
                    <Text style={styles.cardValue}>{postQualificationDetails.experience}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.cardLabel}>Duration</Text>
                    <Text style={styles.cardValue}>{postQualificationDetails.duration}</Text>
                </View>
            </View>
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, paddingBottom: hp(5) }} keyboardShouldPersistTaps="handled">
            {/* ✅ Post Qualification Section */}
            {renderPostQualificationDetails()}

            {/* Top Qualification */}
            {topQualification && renderQualificationCard(topQualification, 0, true)}

            {/* Additional Qualifications */}
            {additionalQualifications.map((qualification, index) => renderQualificationCard(qualification, index))}

            {/* Form to Add/Edit */}
            {showForm && (
                <View style={styles.formContainer}>
                    <Text style={styles.formTitle}>{isEditing ? 'Edit Qualification' : 'Add New Qualification'}</Text>

                    <Text style={styles.label}>Qualification Type</Text>
                    <TextInput style={styles.input} value={newQualificationType} onChangeText={setNewQualificationType} placeholder="Type here" placeholderTextColor="#999" />

                    <Text style={styles.label}>Specialization</Text>
                    <TextInput style={styles.input} value={newSpecialization} onChangeText={setNewSpecialization} placeholder="Select Type" placeholderTextColor="#999" />

                    <Text style={styles.label}>Completion Date</Text>
                    <View style={styles.inputWithIcon}>
                        <TextInput style={{ flex: 1 }} value={newCompletionDate ? formatDate(newCompletionDate) : ''} placeholder="Select date" placeholderTextColor="#999" editable={false} />
                        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                            <Ionicons name="calendar-outline" size={hp(2.5)} color="#999" />
                        </TouchableOpacity>
                    </View>

                    {showDatePicker && (
                        <DateTimePicker value={newCompletionDate ? new Date(newCompletionDate) : new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handleDateChange} />
                    )}

                    <Text style={styles.label}>Attach File <Text style={{ color: 'red' }}>*</Text></Text>
                    <TouchableOpacity style={styles.inputWithattachIcon} onPress={handlePickDocument}>
                        <Text style={{ color: newFileData ? '#000' : '#666' }}>{newFileData ? newFileData.name : 'Tap to attach PDF'}</Text>
                        <Ionicons name="attach-outline" size={hp(3)} color="#999" />
                    </TouchableOpacity>

                    <View style={styles.formButtonRow}>
                        <TouchableOpacity style={[styles.formButton, styles.saveButton]} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>{isEditing ? 'Update' : 'Save'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {!topQualification && additionalQualifications.length === 0 && !showForm && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No qualifications added yet. Tap the + icon to add one.</Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: wp(5),
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
    formContainer: {
        marginTop: hp(2),
        padding: wp(4),
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: hp(2),
    },
    formTitle: {
        fontSize: wp(4.5),
        fontWeight: 'bold',
        marginBottom: hp(2),
        color: '#438aff',
    },
    formButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: hp(3),
    },
    formButton: {
        paddingVertical: hp(1.5),
    
        borderRadius: 8,
        alignItems: 'center',
        flex: 0.48,
            marginLeft: 5,
    },
    saveButton: {
        backgroundColor: '#438aff',
        marginLeft: 110,
     
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: wp(4),
        fontWeight: '600',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: wp(4),
        fontWeight: '600',
    },
    card: {
        backgroundColor: '#fff',
        padding: wp(4),
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: hp(2),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: hp(1.5),
    },
    cardLabel: {
        fontSize: wp(3.5),
        color: '#888',
    },
    cardValue: {
        fontSize: wp(3.5),
        fontWeight: '600',
        color: '#000',
    },
    attachedlabel: {
        fontSize: wp(3.5),
        color: '#333',
        marginTop: 6,
    },
    fileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        padding: wp(1),
        marginBottom: hp(0.5),
        backgroundColor: '#fff',
    },
    icon: {
        marginLeft: -10,
    },
    viewText: {
        color: '#007bff',
        fontWeight: '500',
    },
    label: {
        fontSize: wp('3.5%'),
    color: '#5F6368',
    fontWeight: '500',
        marginBottom: 6,
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: wp(3),
        paddingVertical: hp(1.5),
        backgroundColor: '#f5f5f5',
        marginBottom: hp(2),
    },
    inputWithIcon: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: wp(3),
        backgroundColor: '#f5f5f5',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(2),
        height: hp(5.5),
    },
    inputWithattachIcon: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: wp(3),
        backgroundColor: '#f5f5f5',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(2),
        height: hp(5.5),
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        marginTop: hp(2),
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 20,
        paddingVertical: 5,
        gap: 5,
    },
    editButton: {
        borderColor: '#007bff',
    },
    deleteButton: {
        borderColor: 'red',
    },
    buttonText: {
        fontWeight: '600',
        fontSize: 14,
    },
});