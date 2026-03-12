import React from 'react';
import { useState, useEffect, useCallback } from "react"
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    Dimensions, 
    PixelRatio, 
    Alert, 
    ActivityIndicator, 
    TouchableOpacity, 
    Platform,
    PermissionsAndroid, 
    Share,
 
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { SafeAreaView } from "react-native-safe-area-context"
import AsyncStorage from "@react-native-async-storage/async-storage"
import BASE_URL from "../../config/server" 
import { jwtDecode } from "jwt-decode" 

// --- Imports for PDF Generation and File System ---
import { 
    generatePDF, 
} from 'react-native-html-to-pdf'; 
import RNFS from 'react-native-fs'; 
import Icon from "react-native-vector-icons/FontAwesome" 
// --- End of Imports ---


const { width } = Dimensions.get('window');

// Function for responsive font size
const RF = (size) => {
    const scale = width / 375; 
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Helper function to format numbers with commas
const formatAmount = (amount) => {
    if (amount === null || amount === undefined || isNaN(Number(amount))) return '0.00';
    const numericAmount = Number(amount);
    return numericAmount.toLocaleString('en-IN', {
        minimumFractionDigits: 2, // Use 2 decimal places for salary
        maximumFractionDigits: 2,
    });
};

// --- Mock decodeJWT function
const decodeJWT = jwtDecode;

// =========================================================================
// FUNCTION TO GENERATE HTML CONTENT FOR PDF (MODIFIED HERE)
// =========================================================================

// Helper function to create reimbursement rows
const createReimbursementRows = (items) => {
    return (items || []).map(item => {
        if (item.reimbursementName && Number(item.reimbursedAmount) > 0) {
            return `
                <tr>
                    <td class="item">${item.reimbursementName}</td>
                    <td class="amount">${formatAmount(item.reimbursedAmount)}</td>
                </tr>
            `;
        }
        return '';
    }).join('');
};

const generateHtmlContent = (slipData) => {
    // Fallbacks using actual data from the API console output
    const getSafeData = (key, fallback) => slipData[key] !== undefined && slipData[key] !== null ? slipData[key] : fallback;

    // --- Data Extraction (Your additions are included here) ---
    const companyName = getSafeData('companyName', "HRMS Solutions Pvt. Ltd.");
    const companyAddress = getSafeData('companyAddress', "123 Technology Hub, Mumbai - 400001, India");
    const employeeId = getSafeData('employeeId', 'EMP-00123'); 
    const designation = getSafeData('designation', "Software Developer"); 
    const department = getSafeData('department', "IT Services"); 
    const joiningDate = getSafeData('dateOfJoining', "01/01/2022"); 
    const panNo = getSafeData('panNumber', "N/A"); // Changed generic fallback to N/A
    
    // 🎯 YOUR NEW API FIELDS 
    const bankName = getSafeData('bankName', "N/A"); // Set generic fallback to N/A
    const accountNo = getSafeData('accountNo', "N/A"); // Set generic fallback to N/A
    
    // Location is still missing from API, so keep it dummy or set N/A
    const location = "Mumbai"; 
    // --- End Data Extraction ---

    // --- Employee Details Mapping ---
    const employeeDetails = {
        'Employee Name': slipData.employeeName || 'N/A',
        'Employee ID': employeeId,
        'Designation': designation,
        'Department': department,
        'Date of Joining': joiningDate,
        'PF No.': slipData.pfNum || 'N/A',
    };
    
    // --- Period Details Mapping ---
    const periodDetails = {
        // You moved PAN here, which is fine to balance the columns:
        'PAN No.': panNo, 
        'Month/Year': `${slipData.month || 'N/A'} ${slipData.year || 'N/A'}`,
        'Total Working Days': slipData.workingDays || 0,
        'Present Days': slipData.presentDays || 0,
        
        // 🎯 FIX: Use the 'absentDays' field directly from the API 
        'Leaves/Absent Days': getSafeData('absentDays', 0), 
        
        // 🎯 YOUR NEW FIELDS ARE CORRECTLY PLACED HERE
        'Bank Name': bankName, 
        'Account No.': accountNo,
    };
    
    // Function to create detail rows (key-value pairs)
    const createDetailRows = (details) => {
        return Object.entries(details).map(([key, value]) => `
            <tr>
                <td style="width: 40%;">${key}</td> 
                <td style="width: 60%;">${value}</td>
            </tr>
        `).join('');
    };
    
    // Function to create earning/deduction rows
    const createSalaryRows = (items, type) => {
        return (items || []).map(item => {
            const name = type === 'earnings' ? item.earningName : item.deductionName;
            const amount = type === 'earnings' ? item.earnedAmount : item.deductedAmount;
            
            // Only include rows with a name and a non-zero amount
            if (name && Number(amount) > 0) {
                return `
                    <tr>
                        <td class="item">${name}</td>
                        <td class="amount">${formatAmount(amount)}</td>
                    </tr>
                `;
            }
            return '';
        }).join('');
    };
    
    const totalReimbursements = slipData.reimbursements || 0; 
    
    // Calculate the subtotal (A - B)
    const totalAminusB = Number(slipData.totalEarnings) - Number(slipData.totalDeductions);
    
    // --- BASIC CSS STYLES ---
    const css = `
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; font-size: 10px; color: #333; }
        .page { padding: 30px; }
        
        /* Header Styles */
        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; border-bottom: 2px solid #ddd; }
        .company-info { text-align: left; vertical-align: top; width: 70%; padding: 10px 0;}
        .logo-container { text-align: right; vertical-align: top; width: 30%; padding: 10px 0;}
        
        .logo { max-width: 120px; max-height: 60px; margin-bottom: 10px;} 
        .company-name { font-size: 18px; font-weight: bold; color: #2c3e50; margin-bottom: 5px; }
        .company-address { font-size: 10px; color: #7f8c8d; }
        
        .title { 
            font-size: 14px; font-weight: bold; margin-bottom: 15px; padding: 5px; 
            background-color: #e8f5e9; border: 1px solid #c8e6c9; text-align: center;
        }

        /* Detail Tables Styles */
        .details-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .details-table td { padding: 5px 10px; border: 1px solid #eee; font-size: 10px; }
        .details-table tr > td:first-child { font-weight: bold; color: #2c3e50; } /* BOLD: First column (key) of details table */
        .details-table tr:nth-child(even) { background-color: #fafafa; }

        /* Section Header for one-line Amount display */
        .section-header-row { 
            display: table; 
            width: 100%; 
            font-size: 12px; 
            font-weight: 700; 
            color: white; 
            padding: 8px 0; 
            border-radius: 3px 3px 0 0; 
        }
        .section-header-name { 
            display: table-cell; 
            padding-left: 10px;
            text-align: left; 
        }
        .section-header-amount { 
            display: table-cell; 
            padding-right: 10px;
            text-align: right; 
            font-size: 10px; 
            font-weight: 500;
            vertical-align: middle;
        }

        /* Salary Breakup Styles */
        .salary-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .salary-table td { border: 1px solid #ddd; padding: 8px; font-size: 10px; } 
        .salary-table .item { width: 70%; text-align: left; font-weight: bold; } 
        .salary-table .amount { width: 30%; text-align: right; }

        .total-row td { font-weight: bold; background-color: #ecf0f1; border-top: 2px solid #ddd; }
        
        /* --- NEW NET SUMMARY TABLE STYLES --- */
        .net-summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 25px;
            margin-bottom: 10px;
            border: 2px solid #ddd;
        }
        .net-summary-table td {
            padding: 8px 12px;
            border-left: 1px solid #eee;
            border-right: 1px solid #eee;
        }
        .summary-label {
            width: 70%;
            font-size: 11px;
            font-weight: 500;
            text-align: left;
            background-color: #f7f7f7;
        }
        .summary-amount {
            width: 30%;
            font-size: 11px;
            font-weight: 600;
            text-align: right;
            background-color: #f7f7f7;
        }
        .deduction-label, .reimbursement-label {
            font-style: italic;
        }
        /* Subtotal Row - Visual distinction for A-B */
        .subtotal-row td {
            background-color: #eaf6ff;
            border-top: 1px solid #a0d0f0;
            border-bottom: 1px solid #a0d0f0;
        }
        .subtotal-label {
            font-size: 12px;
            font-weight: 700;
            color: #337ab7;
        }
        .subtotal-amount {
            font-size: 12px;
            font-weight: 700;
            color: #337ab7;
        }
        /* Final Net Salary Row */
        .final-row td {
            background-color: #d4edda; /* Light green */
            border-top: 2px solid #28a745;
        }
        .final-label {
            font-size: 13px;
            font-weight: 900;
            color: #155724;
            text-transform: uppercase;
        }
        .final-amount {
            font-size: 16px;
            font-weight: 900;
            color: #155724;
        }
        /* Amount in Words Row */
        .words-row td {
            padding: 8px 12px;
            font-size: 10px;
            font-weight: 700;
            color: #555;
            background-color: #ffffff;
            border: none;
            border-top: 1px dashed #ddd;
        }
        /* --- END NEW NET SUMMARY TABLE STYLES --- */


        .footer-clear { clear: both; margin-top: 50px; }
    `;

    // --- HTML STRUCTURE ---
    let html = `
        <html>
        <head><style>${css}</style></head>
        <body>
            <div class="page">
                
                <table class="header-table">
                    <tr>
                        <td class="company-info">
                            <div class="company-name">${companyName}</div>
                            <div class="company-address">${companyAddress}</div>
                        </td>
                        <td class="logo-container">
                            ${slipData.companyLogo ? `<img class="logo" src="${slipData.companyLogo}" />` : ''}
                        </td>
                    </tr>
                </table>
                <div class="title">Salary Slip for the Month of ${slipData.month || 'N/A'} ${slipData.year || 'N/A'}</div>

                <table class="details-table">
                    <tr>
                        <td style="padding: 0;" colspan="2">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px; font-weight: 700; background-color: #f0f0f0;">Employee Details</td>
                                    <td style="padding: 8px; font-weight: 700; background-color: #f0f0f0;">Pay Period & Bank Details</td>
                                </tr>
                                <tr>
                                    <td style="padding: 0;">
                                        <table class="details-table" style="margin: 0; border: none;">
                                            ${createDetailRows(employeeDetails)}
                                        </table>
                                    </td>
                                    <td style="padding: 0;">
                                        <table class="details-table" style="margin: 0; border: none;">
                                            ${createDetailRows(periodDetails)}
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <div style="display: flex;">
                    <div style="flex: 1; margin-right: 15px;">
                        <div class="section-header-row" style="background-color: #4CAF50;">
                            <div class="section-header-name">Earnings (A)</div>
                            <div class="section-header-amount">Amount (₹)</div>
                        </div>
                        <table class="salary-table">
                            <tbody>
                                ${createSalaryRows(slipData.earnings, 'earnings')}
                                <tr class="total-row">
                                    <td class="item">Total Earnings (A)</td>
                                    <td class="amount">${formatAmount(slipData.totalEarnings)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div style="flex: 1; margin-left: 15px;">
                        
                        <div class="section-header-row" style="background-color: #E74C3C;">
                            <div class="section-header-name">Deductions (B)</div>
                            <div class="section-header-amount">Amount (₹)</div>
                        </div>
                        <table class="salary-table">
                            <tbody>
                                ${createSalaryRows(slipData.deductions, 'deductions')}
                                <tr class="total-row">
                                    <td class="item">Total Deductions (B)</td>
                                    <td class="amount">${formatAmount(slipData.totalDeductions)}</td>
                                </tr>
                            </tbody>
                        </table>
                        
                        ${slipData.reimbursementDetails && slipData.reimbursementDetails.length > 0 ? `
                            <div style="margin-top: 15px;"> <div class="section-header-row" style="background-color: #f39c12;">
                                    <div class="section-header-name">Reimbursements (C)</div>
                                    <div class="section-header-amount">Amount (₹)</div>
                                </div>
                                <table class="salary-table">
                                    <tbody>
                                        ${createReimbursementRows(slipData.reimbursementDetails)}
                                        <tr class="total-row">
                                            <td class="item">Total Reimbursements (C)</td>
                                            <td class="amount">${formatAmount(totalReimbursements)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ` : ''}
                        </div>
                </div>
                
                <table class="net-summary-table">
                    <tbody>  
                        <tr class="final-row">
                            <td class="final-label">NET SALARY PAYABLE (A - B ${totalReimbursements > 0 ? '+ C' : ''})</td>
                            <td class="final-amount">₹ ${formatAmount(slipData.netSalary)}</td>
                        </tr>
                        <tr class="words-row">
                            <td colspan="2" class="words-content">${slipData.amountInWords || 'N/A'} Only.</td>
                        </tr>
                    </tbody>
                </table>
                <div class="footer-clear"></div>
                
                <p style="text-align: center; margin-top: 30px; font-size: 9px; color: #7f8c8d;">
                    * This is a computer generated salary slip and does not require a signature.
                </p>

            </div>
        </body>
        </html>
    `;
    return html;
};
// =========================================================================

// Function to request permissions on older Android versions (pre-Scoped Storage)
const requestStoragePermission = async () => {
    // Permission is only required on Android for older APIs (less than 29, before Scoped Storage)
    if (Platform.OS === 'android' && Platform.Version < 29) {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                {
                    title: "Storage Permission Required",
                    message: "This app needs access to your storage to save the salary slip.",
                    buttonPositive: "OK"
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            console.warn('Permission request failed:', err);
            return false;
        }
    }
    return true; 
};


const SalarySlipScreen = ({route}) => {
    const [salaryslip, setSalaryslip] = useState(null); 
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const { yearId, monthId } = route.params;
    
    // Fetch salary slip from API
    const fetchSalarySlip = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = await AsyncStorage.getItem("authToken");
            if (!token) {
                throw new Error("Authentication token not found.");
            }
            
            const cleanToken = token.replace("Bearer ", "") || "";
            let employeeId;
            
            try {
                const decoded = decodeJWT(cleanToken);
                employeeId = decoded?.EmployeeId;
            } catch (e) {
                employeeId = '11134'; 
            }

            if (!employeeId) {
                employeeId = '11134'; 
            }
            

            const url = `${BASE_URL}/Payroll/GetSalarySlip?employeeId=${employeeId}&monthId=${monthId}&yearId=${yearId}`;
            console.log("url",url);
            
            const response = await fetch(
                url,
                { headers: { Authorization: `Bearer ${cleanToken}` } }
            );

            if (!response.ok) {
                const errorText = await response.text();
               throw new Error(`Server call failed (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            
            // THE CRUCIAL FIX: Extract the object from the array
         if (Array.isArray(data) && data.length > 0) {
                setSalaryslip(data[0]); 
            } else {
                
                throw new Error("No salary slip data found for the selected month.");}

        } catch (e) {
            console.error("Error fetching salary slip:", e);
            
            // Set the error state.
            const errorMessage = e.message;
            setError(errorMessage);
            
            // Still suppressing the Alert for the expected "No data found" case
            if (!errorMessage.includes('No salary slip data found')) {
                Alert.alert("Error", `Failed to fetch salary slip: ${errorMessage}`);
            }

            setSalaryslip(null); 
        } finally {
            setIsLoading(false);
        }
    }, [monthId, yearId]); 

    useEffect(() => {
        fetchSalarySlip();
    }, [fetchSalarySlip]);
    
    // --- SHARE FUNCTION (Reliable way to open a local file) ---
    const handleOpenShare = useCallback(async (filePath) => {
        try {
            await Share.share({
                url: `file://${filePath}`,
                title: 'Salary Slip Export',
                message: 'Download complete. Open file.',
            });
        } catch (error) {
            console.error('Share Error:', error);
            Alert.alert('Error', 'Could not open or share the PDF.');
        }
    }, []);
    
    // =========================================================================
    // ROBUST PDF GENERATION AND SAVING LOGIC 
    // =========================================================================
    const downloadSalarySlipPDF = useCallback(async () => {
        if (!salaryslip) {
            Alert.alert("Error", "Salary slip data is not loaded yet.");
            return;
        }

        setIsDownloading(true);

        // 1. Check for legacy permissions (required for older Android phones)
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
            setIsDownloading(false);
            Alert.alert('Permission Required', 'Please grant storage permission if you are on an older Android device.');
            return;
        }
        
        // Use safe fallbacks for file naming
        const safeMonthName = salaryslip.month?.replace(/\s/g, '') || 'MonthNameMissing';
        const safeYear = salaryslip.year || 'NoYear';
        const baseFileName = `SalarySlip_${safeMonthName}_${safeYear}`;

        const options = { 
            html: generateHtmlContent(salaryslip), // <--- Uses the actual salary data and new HTML design
            fileName: baseFileName, 
            base64: false,
        };

        let internalFilePath = '';
        let finalDownloadPath = '';
        let finalFileName = '';

        try {
            // Step 1: Generate PDF to a temporary internal file path
            const result = await generatePDF(options);

            if (!result.filePath) {
                throw new Error('PDF generation failed: No internal file path returned.');
            }
            internalFilePath = result.filePath;
            
            // Step 2: Define the final public path in the Downloads folder
            finalFileName = `${baseFileName}-${Date.now()}.pdf`;
            
            const targetDir = Platform.select({
                ios: RNFS.DocumentDirectoryPath,
                android: RNFS.DownloadDirectoryPath,
            });
            finalDownloadPath = `${targetDir}/${finalFileName}`;

            // Step 3: Ensure target directory exists and Copy the file from internal storage 
            if (!(await RNFS.exists(targetDir))) {
                await RNFS.mkdir(targetDir);
            }
            await RNFS.copyFile(internalFilePath, finalDownloadPath);
            
            // Optional: Clean up the temporary internal file
            await RNFS.unlink(internalFilePath).catch(e => console.log("Failed to unlink temp file:", e));

            // Step 4: 🎯 Trigger the System Notification Banner (Android specific)
            if (Platform.OS === 'android' && RNFS.scanFile) {
                await RNFS.scanFile(finalDownloadPath); 
            }

            // Step 5: Show simple confirmation alert
            Alert.alert(
                '✅ Download Successfully',
                `Salary Slip saved to your ${Platform.OS === 'android' ? 'Downloads' : 'Files'} folder.`
            );
            
        } catch (error) {
            console.error('PDF Download Error:', error);
            Alert.alert(
                '❌ Download Failed',
                `Error: ${error instanceof Error ? error.message : String(error)}.`,
                [{ text: 'OK', style: 'destructive' }]
            );
        } finally {
            setIsDownloading(false);
        }
    }, [salaryslip, handleOpenShare]);
    // =========================================================================


   // 1. Check for a non-null Error FIRST
  if (error) {
        return (
            <View style={styles.loadingContainer}>
                {/* 🎯 Change 1: Remove the "Error: " prefix from the Text component */}
                <Text style={styles.errorText}>
                    {error} 
                </Text>
                {/* 🎯 Change 2: Optional, but helpful for the user */}
                <Text style={styles.retryText} onPress={fetchSalarySlip}>Tap to Retry</Text> 
            </View>
        );
    }
    
 if (isLoading || !salaryslip) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#438aff" />
                <Text style={styles.loadingText}>Loading Salary Slip...</Text>
            </View>
        );
    }
    
    // Destructure data now that we know salaryslip is an object
    const {
        employeeName,
        pfNum,
        month,
        year,
        workingDays,
        presentDays,
        totalEarnings,
        totalDeductions,
        netSalary,
        earnings = [],
        deductions = [],
        reimbursementDetails = [],
    } = salaryslip;


    return (
        // Changed to SafeAreaView as per your request
        <SafeAreaView style={styles.mainScreenWrapper}> 
            <ScrollView contentContainerStyle={styles.scrollContentContainer}>
                
                {/* Header (without button) */}
                <View style={styles.headerContainer}>
                    <Text style={styles.headerTitle}>Salary Slip</Text>
                    <Text style={styles.headerSubtitle}>For the Month of {month} {year}</Text>
                </View>
                
                {/* Employee Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Employee Details</Text>
                    <View style={styles.card}>
                        <InfoRow label="Employee Name" value={employeeName} />
                        <InfoRow label="PF Number" value={pfNum} />
                        <InfoRow label="Month/Year" value={`${month} ${year}`} />
                        <InfoRow label="Working Days" value={workingDays} />
                        <InfoRow label="Present Days" value={presentDays} />
                        <InfoRow label="Absent Days" value={workingDays - presentDays} />
                        <InfoRow label="OT Hours" value="0" isLast /> 
                    </View>
                </View>

                {/* Salary Breakup (Earnings) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Earnings</Text>
                    <View style={styles.card}>
                        {earnings.map((item, index) => (
                            <InfoRow 
                                key={item.earningName} 
                                label={item.earningName} 
                                value={formatAmount(item.earnedAmount)}
                                isLast={index === earnings.length - 1 && deductions.length === 0 && reimbursementDetails.length === 0}
                            />
                        ))}
                        <InfoRow 
                            label="Total Earnings" 
                            value={formatAmount(totalEarnings)} 
                            bold 
                            isLast={deductions.length === 0 && reimbursementDetails.length === 0} 
                        />
                    </View>
                </View>

                {/* Deductions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Deductions</Text>
                    <View style={styles.card}>
                        {deductions.map((item, index) => (
                            <InfoRow 
                                key={item.deductionName} 
                                label={`${item.deductionName}`} 
                                value={formatAmount(item.deductedAmount)}
                                isLast={index === deductions.length - 1} 
                            />
                        ))}
                        <InfoRow 
                            label="Total Deduction" 
                            value={formatAmount(totalDeductions)} 
                            bold 
                            isLast
                        />
                    </View>
                </View>

                {/* Net Salary Calculation / Reimbursements */}
                <View style={styles.section}>
                    {reimbursementDetails.length > 0 && (
                        <View style={styles.cardLast}>
                            <Text style={styles.sectionTitle}>Reimbursements</Text>
                            {reimbursementDetails.map((item, index) => (
                                <InfoRow 
                                    key={item.reimbursementName} 
                                    label={`${item.reimbursementName}`} 
                                    value={formatAmount(item.reimbursedAmount)} 
                                    highlight 
                                    isLast={index === reimbursementDetails.length - 1} 
                                />
                            ))}
                        </View>
                    )}
                    
                    <View style={styles.cardNet}>
                        <InfoRow label="NET SALARY PAYABLE" value={formatAmount(netSalary)} bold highlight isLast />
                    </View>
                </View>

            </ScrollView>

            {/* --- FLOATING DOWNLOAD BUTTON (Positioned safely above the bottom notch) --- */}
            <TouchableOpacity 
                style={styles.floatingDownloadButton}
                onPress={downloadSalarySlipPDF} 
                disabled={isDownloading}
                activeOpacity={0.7}
            >
                {isDownloading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                    <Icon name="file-pdf-o" size={RF(18)} color="#ffffff" />
                )}
                <Text style={styles.downloadButtonText}>
                    {isDownloading ? "Generating PDF..." : "Download PDF Slip"}
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const InfoRow = ({ label, value, bold, highlight, isLast }) => (
    <View style={[styles.row, isLast && styles.rowLast]}>
        <Text
            style={[
                styles.label,
                bold && styles.boldLabel,
                highlight && styles.highlightLabel 
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
        >
            {label}
        </Text>
        <Text
            style={[
                styles.value,
                bold && styles.boldValue,
                highlight && styles.highlightValue 
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
        >
            {value}
        </Text>
    </View>
);

const styles = StyleSheet.create({
    mainScreenWrapper: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContentContainer: {
        paddingHorizontal: wp(4),
        paddingBottom: hp(12), // Padding to prevent content hiding under the floating button
    },
    headerContainer: {
        alignItems: 'center',
        paddingVertical: hp(2),
        marginBottom: hp(2), 
    },
    headerTitle: {
        fontSize: RF(20),
        fontWeight: '700',
        color: '#000000',
    },
    headerSubtitle: {
        fontSize: RF(14),
        fontWeight: '500',
        color: '#6b7280',
        marginTop: hp(0.5),
    },
    
    // --- FLOATING BUTTON STYLE FIX ---
    floatingDownloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3498db',
        paddingVertical: hp(1.5),
        paddingHorizontal: wp(6),
        borderRadius: wp(1.5),
        // position: 'absolute', 
        bottom: 20, // Fixed offset for safety area clearance
        left: wp(4), 
        right: wp(4), 
        elevation: 10, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
    },
    downloadButtonText: {
        fontSize: RF(14),
        color: '#ffffff',
        fontWeight: '600',
        marginLeft: wp(2),
    },
    // --- END OF FLOATING BUTTON STYLE FIX ---
    
    section: {
        marginBottom: hp(1.5),
    },
    sectionTitle: {
        fontSize: RF(16),
        fontWeight: '600',
        marginBottom: hp(1),
        marginTop: hp(1),
        color: '#000000',
        marginLeft: wp(2),
    },
    card: {
        padding: wp(3),
        borderRadius: wp(2.5),
        borderColor: '#E5E7EB',
        borderWidth: 1,
        backgroundColor: '#ffffff',
    },
    cardNet: {
        backgroundColor: '#e6f0ff', 
        padding: wp(3),
        borderRadius: wp(2.5),
        marginTop: hp(1),
        borderColor: '#438aff', 
        borderWidth: 1,
    },
    cardLast: {
        backgroundColor: '#f0fff0', 
        padding: wp(3),
        borderRadius: wp(2.5),
        marginTop: hp(1),
        borderColor: '#E5E7EB',
        borderWidth: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: hp(0.9),
        flexWrap: 'wrap',
        borderBottomWidth: 0.5,
        borderColor: "#e5e7eb", 
    },
    rowLast: {
        borderBottomWidth: 0,
    },
    label: {
        fontSize: RF(14),
        color: '#6b7280',
        fontWeight: '400',
        flex: 1,
        marginRight: wp(2),
    },
    value: {
        fontSize: RF(14),
        color: '#212529',
        fontWeight: '500',
        flexShrink: 1,
        textAlign: 'right',
    },
    boldLabel: {
        fontSize: RF(15),
        fontWeight: '700',
        color: '#000000',
    },
    boldValue: {
        fontSize: RF(15),
        fontWeight: '700',
        color: '#000000',
    },
    highlightLabel: {
        color: '#000000', 
    },
    highlightValue: {
        color: '#0056b3', 
        fontWeight: '800',
        fontSize: RF(16),
    },
    // Loading/Error Styles
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        fontSize: RF(16),
        color: '#6b7280',
        marginTop: hp(1),
        textAlign: 'center',
        paddingHorizontal: wp(10),
    },
    errorText: {
        fontSize: RF(16),
        color: 'red',
        marginBottom: hp(1),
        textAlign: 'center',
        paddingHorizontal: wp(5),
    },
    retryText: {
        fontSize: RF(14),
        color: '#438aff',
        textDecorationLine: 'underline',
    }
});

export default SalarySlipScreen;