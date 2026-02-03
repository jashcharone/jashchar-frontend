import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { 
    Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, Loader2, 
    ArrowRight, ArrowLeft, Eye, Save, Check, Users, GraduationCap, Building2, 
    Calendar, MapPin, Phone, Mail, User, Shield, Database, Settings, Sparkles, 
    Info, FileUp, RotateCcw, Wand2, ArrowUpDown, Star, Hash
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { format, parse, isValid } from 'date-fns';

// ═══════════════════════════════════════════════════════════════════════════════
// JASHCHAR ERP - WORLD-CLASS BULK UPLOAD SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
// Features:
// 1. Multi-source Import (Excel, CSV, Other ERPs)
// 2. Smart Field Mapping with auto-detection
// 3. Comprehensive Data Validation
// 4. Duplicate Detection
// 5. Preview with corrections
// 6. Batch Processing with progress
// 7. Fee Assignment during import
// 8. Parent Account Creation option
// 9. Error Recovery & Export Failed Records
// 10. Support for Fedena, Entab, CampusCare migration
// ═══════════════════════════════════════════════════════════════════════════════

// Known ERP field mappings for easy migration
const ERP_FIELD_MAPPINGS = {
    'Fedena': {
        'admission_no': ['admission_no', 'admission_number', 'adm_no'],
        'first_name': ['first_name', 'firstname', 'student_name'],
        'last_name': ['last_name', 'lastname', 'surname'],
        'date_of_birth': ['date_of_birth', 'dob', 'birth_date'],
        'gender': ['gender', 'sex'],
        'father_name': ['father_name', 'fathers_name', 'guardian_name'],
        'father_phone': ['father_phone', 'parent_phone', 'guardian_phone'],
        'mother_name': ['mother_name', 'mothers_name'],
        'address': ['address', 'permanent_address', 'present_address'],
        'city': ['city', 'district'],
        'state': ['state'],
        'pincode': ['pincode', 'pin_code', 'zip'],
        'phone': ['phone', 'mobile', 'contact_no'],
        'email': ['email', 'student_email'],
        'blood_group': ['blood_group', 'blood'],
        'religion': ['religion'],
        'caste': ['caste', 'community'],
        'category': ['category', 'reservation_category'],
        'previous_school': ['previous_school', 'prev_school', 'last_school'],
    },
    'Entab': {
        'admission_no': ['AdmNo', 'AdmissionNo', 'StudentID'],
        'first_name': ['FName', 'FirstName', 'StudentName'],
        'last_name': ['LName', 'LastName', 'Surname'],
        'date_of_birth': ['DOB', 'DateOfBirth', 'BirthDate'],
        'gender': ['Gender', 'Sex'],
        'father_name': ['FatherName', 'Father', 'GuardianName'],
        'father_phone': ['FatherMobile', 'FatherPhone', 'ParentMobile'],
        'mother_name': ['MotherName', 'Mother'],
        'address': ['Address', 'ResAddress', 'PermAddress'],
        'city': ['City', 'Town', 'District'],
        'state': ['State'],
        'pincode': ['Pincode', 'PinCode', 'ZIP'],
        'phone': ['Mobile', 'Phone', 'ContactNo'],
        'email': ['Email', 'StudentEmail'],
        'blood_group': ['BloodGroup', 'Blood'],
        'religion': ['Religion'],
        'caste': ['Caste', 'Community'],
        'category': ['Category', 'Reservation'],
        'previous_school': ['PreviousSchool', 'LastSchool'],
    },
    'CampusCare': {
        'admission_no': ['Reg_No', 'Registration_No', 'Student_ID'],
        'first_name': ['Student_First_Name', 'First_Name'],
        'last_name': ['Student_Last_Name', 'Last_Name'],
        'date_of_birth': ['Date_Of_Birth', 'DOB'],
        'gender': ['Gender'],
        'father_name': ['Father_Name'],
        'father_phone': ['Father_Mobile', 'Father_Contact'],
        'mother_name': ['Mother_Name'],
        'address': ['Address', 'Residential_Address'],
        'city': ['City'],
        'state': ['State'],
        'pincode': ['Pin_Code', 'Pincode'],
        'phone': ['Student_Mobile', 'Contact_No'],
        'email': ['Student_Email', 'Email_ID'],
    },
    'Generic': {
        'admission_no': ['admission_no', 'admission_number', 'adm_no', 'reg_no', 'registration', 'student_id', 'roll_no', 'id', 'admission no', 'admno'],
        'first_name': ['first_name', 'firstname', 'fname', 'student_name', 'name', 'student', 'first name', 'first_name *'],
        'last_name': ['last_name', 'lastname', 'lname', 'surname', 'family_name', 'last name'],
        'date_of_birth': ['date_of_birth', 'dob', 'birth_date', 'birthday', 'birthdate', 'date of birth'],
        'gender': ['gender', 'sex', 'gender *'],
        'father_name': ['father_name', 'fathers_name', 'father', 'dad_name', 'guardian_name', 'guardian', 'father name'],
        'father_phone': ['father_phone', 'father_mobile', 'father_contact', 'parent_phone', 'guardian_phone', 'guardian_mobile', 'father phone'],
        'father_occupation': ['father_occupation', 'father_job', 'father_profession', 'father occupation'],
        'father_email': ['father_email', 'parent_email', 'father email'],
        'mother_name': ['mother_name', 'mothers_name', 'mother', 'mom_name', 'mother name'],
        'mother_phone': ['mother_phone', 'mother_mobile', 'mother_contact', 'mother phone'],
        'mother_occupation': ['mother_occupation', 'mother_job', 'mother_profession', 'mother occupation'],
        'guardian_name': ['guardian_name', 'guardian', 'guardian name'],
        'guardian_relation': ['guardian_relation', 'relation', 'guardian relation'],
        'guardian_phone': ['guardian_phone', 'guardian phone'],
        'address': ['address', 'permanent_address', 'present_address', 'residential_address', 'home_address', 'street', 'current_address'],
        'city': ['city', 'town', 'district', 'place'],
        'state': ['state', 'province', 'region'],
        'pincode': ['pincode', 'pin_code', 'zip', 'zipcode', 'postal_code'],
        'phone': ['phone', 'mobile', 'contact_no', 'mobile_no', 'cell', 'telephone'],
        'email': ['email', 'student_email', 'email_id', 'mail'],
        'blood_group': ['blood_group', 'blood', 'bloodgroup', 'blood group'],
        'religion': ['religion', 'faith'],
        'caste': ['caste', 'community', 'subcaste'],
        'category': ['category', 'reservation_category', 'reservation', 'quota'],
        'previous_school': ['previous_school', 'prev_school', 'last_school', 'old_school', 'tc_school', 'previous school'],
        'aadhar_no': ['aadhar', 'aadhaar', 'aadhar_no', 'aadhaar_no', 'uid', 'aadhar_number', 'aadhar number', 'aadhaar number'],
        'nationality': ['nationality', 'nation', 'country'],
        'mother_tongue': ['mother_tongue', 'native_language', 'language', 'mother tongue'],
        'roll_number': ['roll_number', 'roll_no', 'roll', 'class_roll', 'roll number'],
    }
};

// Target fields for Jashchar ERP student_profiles table
const TARGET_FIELDS = [
    { key: 'admission_no', label: 'Admission No', required: false, type: 'text' },
    { key: 'roll_number', label: 'Roll Number', required: false, type: 'text' },
    { key: 'first_name', label: 'First Name', required: true, type: 'text' },
    { key: 'last_name', label: 'Last Name', required: false, type: 'text' },
    { key: 'date_of_birth', label: 'Date of Birth', required: false, type: 'date' },
    { key: 'gender', label: 'Gender', required: true, type: 'select', options: ['Male', 'Female', 'Other'] },
    { key: 'blood_group', label: 'Blood Group', required: false, type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    { key: 'religion', label: 'Religion', required: false, type: 'text' },
    { key: 'caste', label: 'Caste', required: false, type: 'text' },
    { key: 'category', label: 'Category', required: false, type: 'select', options: ['General', 'OBC', 'SC', 'ST', 'EWS'] },
    { key: 'nationality', label: 'Nationality', required: false, type: 'text' },
    { key: 'mother_tongue', label: 'Mother Tongue', required: false, type: 'text' },
    { key: 'aadhar_no', label: 'Aadhar Number', required: false, type: 'text' },
    { key: 'email', label: 'Email', required: false, type: 'email' },
    { key: 'phone', label: 'Phone', required: false, type: 'phone' },
    { key: 'address', label: 'Address', required: false, type: 'textarea' },
    { key: 'city', label: 'City', required: false, type: 'text' },
    { key: 'state', label: 'State', required: false, type: 'text' },
    { key: 'pincode', label: 'Pincode', required: false, type: 'text' },
    { key: 'father_name', label: 'Father Name', required: false, type: 'text' },
    { key: 'father_phone', label: 'Father Phone', required: false, type: 'phone' },
    { key: 'father_email', label: 'Father Email', required: false, type: 'email' },
    { key: 'father_occupation', label: 'Father Occupation', required: false, type: 'text' },
    { key: 'mother_name', label: 'Mother Name', required: false, type: 'text' },
    { key: 'mother_phone', label: 'Mother Phone', required: false, type: 'phone' },
    { key: 'mother_occupation', label: 'Mother Occupation', required: false, type: 'text' },
    { key: 'guardian_name', label: 'Guardian Name', required: false, type: 'text' },
    { key: 'guardian_relation', label: 'Guardian Relation', required: false, type: 'text' },
    { key: 'guardian_phone', label: 'Guardian Phone', required: false, type: 'phone' },
    { key: 'previous_school', label: 'Previous School', required: false, type: 'text' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// STEP INDICATOR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const StepIndicator = ({ currentStep, steps }) => {
    return (
        <div className="flex items-center justify-center py-6">
            {steps.map((step, idx) => (
                <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center">
                        <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-lg",
                            currentStep > idx + 1 ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" :
                            currentStep === idx + 1 ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white ring-4 ring-blue-500/30 scale-110" :
                            "bg-muted text-muted-foreground"
                        )}>
                            {currentStep > idx + 1 ? <Check className="h-5 w-5" /> : step.icon}
                        </div>
                        <span className={cn(
                            "text-xs mt-2 font-medium transition-colors",
                            currentStep === idx + 1 ? "text-primary" : "text-muted-foreground"
                        )}>
                            {step.label}
                        </span>
                    </div>
                    {idx < steps.length - 1 && (
                        <div className={cn(
                            "w-20 h-1 mx-2 rounded-full transition-all duration-500",
                            currentStep > idx + 1 ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-muted"
                        )} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN BULK UPLOAD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const BulkUpload = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    
    // Core States
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    
    // Master Data
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [sessions, setSessions] = useState([]);
    
    // Selection States
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedSession, setSelectedSession] = useState('');
    
    // File & Data States
    const [file, setFile] = useState(null);
    const [rawData, setRawData] = useState([]);
    const [sourceColumns, setSourceColumns] = useState([]);
    const [fieldMappings, setFieldMappings] = useState({});
    const [detectedERP, setDetectedERP] = useState('Generic');
    
    // Validated Data
    const [validatedData, setValidatedData] = useState([]);
    const [validationErrors, setValidationErrors] = useState([]);
    const [duplicates, setDuplicates] = useState([]);
    
    // Upload Results
    const [uploadResults, setUploadResults] = useState({ success: 0, failed: 0, errors: [], successRecords: [] });
    
    // Options
    const [createParentAccounts, setCreateParentAccounts] = useState(false);
    const [skipDuplicates, setSkipDuplicates] = useState(true);
    const [autoGenerateAdmissionNo, setAutoGenerateAdmissionNo] = useState(true);
    const [autoGenerateRollNo, setAutoGenerateRollNo] = useState(true);

    // CRITICAL: Use selectedBranch directly for branch-wise operation (like StudentAdmission)
    const branchId = selectedBranch?.id;
    
    // Steps configuration
    const steps = [
        { id: 1, label: 'Setup', icon: <Settings className="h-5 w-5" /> },
        { id: 2, label: 'Upload', icon: <Upload className="h-5 w-5" /> },
        { id: 3, label: 'Map Fields', icon: <ArrowUpDown className="h-5 w-5" /> },
        { id: 4, label: 'Validate', icon: <Shield className="h-5 w-5" /> },
        { id: 5, label: 'Import', icon: <Database className="h-5 w-5" /> },
        { id: 6, label: 'Results', icon: <CheckCircle className="h-5 w-5" /> },
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA FETCHING - Re-fetch when branch changes
    // ═══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!branchId) {
            console.log('[BulkUpload] No branch selected, waiting...');
            return;
        }
        
        console.log('[BulkUpload] Loading data for branch:', branchId, selectedBranch?.branch_name);
        
        // Reset selections when branch changes
        setSelectedClass('');
        setSelectedSection('');
        setSections([]);
        
        const fetchMasterData = async () => {
            setLoading(true);
            try {
                const [classesRes, sessionsRes] = await Promise.all([
                    supabase.from('classes').select('id, name').eq('branch_id', branchId).order('name'),
                    supabase.from('sessions').select('id, name, is_active').eq('branch_id', branchId).order('name', { ascending: false }),
                ]);
                
                console.log('[BulkUpload] Classes loaded:', classesRes.data?.length || 0);
                console.log('[BulkUpload] Sessions loaded:', sessionsRes.data?.length || 0);
                
                setClasses(classesRes.data || []);
                setSessions(sessionsRes.data || []);
                
                // Set default session
                const activeSession = sessionsRes.data?.find(s => s.is_active);
                if (activeSession) {
                    setSelectedSession(activeSession.id);
                    console.log('[BulkUpload] Active session set:', activeSession.name);
                } else if (currentSessionId) {
                    setSelectedSession(currentSessionId);
                }
            } catch (error) {
                console.error('[BulkUpload] Error fetching master data:', error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to load master data' });
            } finally {
                setLoading(false);
            }
        };
        fetchMasterData();
    }, [branchId, selectedBranch?.branch_name, currentSessionId, toast]);

    // Fetch sections when class changes
    useEffect(() => {
        if (!selectedClass) {
            setSections([]);
            return;
        }
        const fetchSections = async () => {
            const { data } = await supabase
                .from('class_sections')
                .select('sections(id, name)')
                .eq('class_id', selectedClass);
            setSections(data ? data.map(item => item.sections).filter(Boolean) : []);
        };
        fetchSections();
    }, [selectedClass]);

    // ═══════════════════════════════════════════════════════════════════════════
    // TEMPLATE DOWNLOAD
    // ═══════════════════════════════════════════════════════════════════════════
    const downloadTemplate = () => {
        const templateData = [{
            'Admission No': 'Leave blank for auto-generate',
            'Roll Number': 'Leave blank for auto-generate',
            'First Name *': 'John',
            'Last Name': 'Doe',
            'Gender *': 'Male',
            'Date of Birth': '2010-05-15',
            'Blood Group': 'O+',
            'Religion': 'Hindu',
            'Caste': 'General',
            'Category': 'General',
            'Nationality': 'Indian',
            'Mother Tongue': 'Kannada',
            'Aadhar Number': '1234 5678 9012',
            'Email': 'student@email.com',
            'Phone': '9876543210',
            'Address': '123 Main Street',
            'City': 'Bangalore',
            'State': 'Karnataka',
            'Pincode': '560001',
            'Father Name': 'Robert Doe',
            'Father Phone': '9876543211',
            'Father Email': 'robert@email.com',
            'Father Occupation': 'Engineer',
            'Mother Name': 'Mary Doe',
            'Mother Phone': '9876543212',
            'Mother Occupation': 'Teacher',
            'Guardian Name': '',
            'Guardian Relation': '',
            'Guardian Phone': '',
            'Previous School': 'ABC School',
        }];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Students');
        
        // Set column widths
        ws['!cols'] = Object.keys(templateData[0]).map(() => ({ wch: 20 }));
        
        // Add instructions sheet
        const instructions = [
            { 'Instructions': 'JASHCHAR ERP - Student Bulk Upload Template' },
            { 'Instructions': '' },
            { 'Instructions': '1. Fields marked with * are mandatory' },
            { 'Instructions': '2. Date format: YYYY-MM-DD (e.g., 2010-05-15)' },
            { 'Instructions': '3. Gender: Male, Female, or Other' },
            { 'Instructions': '4. Category: General, OBC, SC, ST, EWS' },
            { 'Instructions': '5. Blood Group: A+, A-, B+, B-, AB+, AB-, O+, O-' },
            { 'Instructions': '6. Phone numbers: 10 digits only' },
            { 'Instructions': '7. Aadhar: 12 digits (spaces allowed)' },
            { 'Instructions': '' },
            { 'Instructions': 'Supported file formats: .xlsx, .xls, .csv' },
            { 'Instructions': '' },
            { 'Instructions': 'For migrating from other ERPs:' },
            { 'Instructions': '- Fedena: Export to Excel and upload directly' },
            { 'Instructions': '- Entab: Export student data and upload' },
            { 'Instructions': '- CampusCare: Export and our system will auto-detect' },
            { 'Instructions': '' },
            { 'Instructions': 'Need help? Contact support@jashchar.com' },
        ];
        const wsInstructions = XLSX.utils.json_to_sheet(instructions);
        wsInstructions['!cols'] = [{ wch: 60 }];
        XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');
        
        XLSX.writeFile(wb, `Jashchar_Student_Upload_Template_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
        toast({ title: 'Template Downloaded', description: 'Fill in data and upload in Step 2.' });
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // FILE PARSING & ERP DETECTION
    // ═══════════════════════════════════════════════════════════════════════════
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        
        // Check file extension
        const ext = selectedFile.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext)) {
            toast({ variant: 'destructive', title: 'Invalid File', description: 'Please upload Excel (.xlsx, .xls) or CSV file.' });
            return;
        }
        
        setFile(selectedFile);
        parseFile(selectedFile);
    };

    const parseFile = (file) => {
        setLoading(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                
                if (jsonData.length === 0) {
                    toast({ variant: 'destructive', title: 'Empty File', description: 'No data found in the file.' });
                    setLoading(false);
                    return;
                }
                
                // Get source columns
                const columns = Object.keys(jsonData[0]);
                setSourceColumns(columns);
                setRawData(jsonData);
                
                // Auto-detect ERP and map fields
                const { erp, mappings } = autoDetectERPAndMap(columns);
                setDetectedERP(erp);
                setFieldMappings(mappings);
                
                setStep(3);
                toast({ 
                    title: 'File Parsed Successfully', 
                    description: `Found ${jsonData.length} records. Detected source: ${erp}` 
                });
            } catch (error) {
                console.error('Parse error:', error);
                toast({ variant: 'destructive', title: 'Parse Error', description: 'Failed to read the file. Please check format.' });
            } finally {
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const autoDetectERPAndMap = (columns) => {
        const normalizedColumns = columns.map(c => c.toLowerCase().replace(/[^a-z0-9]/g, '_'));
        
        // Try to detect ERP based on column patterns
        let bestMatch = 'Generic';
        let bestScore = 0;
        
        for (const [erpName, fieldMap] of Object.entries(ERP_FIELD_MAPPINGS)) {
            let score = 0;
            for (const [targetField, sourceVariants] of Object.entries(fieldMap)) {
                for (const variant of sourceVariants) {
                    if (normalizedColumns.includes(variant.toLowerCase().replace(/[^a-z0-9]/g, '_'))) {
                        score++;
                        break;
                    }
                }
            }
            if (score > bestScore) {
                bestScore = score;
                bestMatch = erpName;
            }
        }
        
        // Create mappings
        const mappings = {};
        const erpFieldMap = ERP_FIELD_MAPPINGS[bestMatch];
        
        for (const [targetField, sourceVariants] of Object.entries(erpFieldMap)) {
            for (const variant of sourceVariants) {
                const matchedCol = columns.find(c => 
                    c.toLowerCase().replace(/[^a-z0-9]/g, '_') === variant.toLowerCase().replace(/[^a-z0-9]/g, '_')
                );
                if (matchedCol) {
                    mappings[targetField] = matchedCol;
                    break;
                }
            }
        }
        
        return { erp: bestMatch, mappings };
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA VALIDATION
    // ═══════════════════════════════════════════════════════════════════════════
    const validateData = async () => {
        setLoading(true);
        const validated = [];
        const errors = [];
        const dupes = [];
        
        // Fetch existing admission numbers for duplicate check
        const { data: existingStudents } = await supabase
            .from('student_profiles')
            .select('admission_no, aadhar_no, email, phone')
            .eq('branch_id', branchId);
        
        const existingAdmNos = new Set(existingStudents?.map(s => s.admission_no?.toLowerCase()).filter(Boolean) || []);
        const existingAadhars = new Set(existingStudents?.map(s => s.aadhar_no?.replace(/\s/g, '')).filter(Boolean) || []);
        const existingEmails = new Set(existingStudents?.map(s => s.email?.toLowerCase()).filter(Boolean) || []);
        
        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            const rowNum = i + 2; // Excel row (1-indexed + header)
            const rowErrors = [];
            const record = { _rowNum: rowNum, _original: row };
            
            // Map fields
            for (const field of TARGET_FIELDS) {
                const sourceCol = fieldMappings[field.key];
                let value = sourceCol ? row[sourceCol] : '';
                
                // Clean and transform value
                if (value !== null && value !== undefined) {
                    value = String(value).trim();
                }
                
                // Type-specific transformations
                if (field.type === 'date' && value) {
                    const parsed = parseDate(value);
                    if (parsed) {
                        value = format(parsed, 'yyyy-MM-dd');
                    } else if (value) {
                        rowErrors.push(`Invalid date format for ${field.label}: ${value}`);
                    }
                }
                
                if (field.type === 'phone' && value) {
                    value = value.replace(/\D/g, '').slice(-10);
                    if (value.length !== 10 && value.length > 0) {
                        rowErrors.push(`Invalid phone for ${field.label}: must be 10 digits`);
                    }
                }
                
                if (field.key === 'aadhar_no' && value) {
                    value = value.replace(/\s/g, '');
                    if (value.length !== 12 || !/^\d+$/.test(value)) {
                        rowErrors.push('Aadhar must be 12 digits');
                    }
                }
                
                if (field.key === 'gender' && value) {
                    value = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                    if (!['Male', 'Female', 'Other'].includes(value)) {
                        rowErrors.push(`Invalid gender: ${value}. Use Male/Female/Other`);
                    }
                }
                
                if (field.key === 'email' && value) {
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        rowErrors.push(`Invalid email format: ${value}`);
                    }
                }
                
                // Required field check
                if (field.required && !value) {
                    rowErrors.push(`${field.label} is required`);
                }
                
                record[field.key] = value || null;
            }
            
            // Duplicate checks
            const isDuplicate = {
                admission_no: record.admission_no && existingAdmNos.has(record.admission_no.toLowerCase()),
                aadhar_no: record.aadhar_no && existingAadhars.has(record.aadhar_no),
                email: record.email && existingEmails.has(record.email.toLowerCase()),
            };
            
            if (isDuplicate.admission_no || isDuplicate.aadhar_no || isDuplicate.email) {
                dupes.push({
                    row: rowNum,
                    name: `${record.first_name || ''} ${record.last_name || ''}`.trim(),
                    duplicateFields: Object.entries(isDuplicate).filter(([k, v]) => v).map(([k]) => k),
                    record
                });
            }
            
            record._errors = rowErrors;
            record._isDuplicate = isDuplicate.admission_no || isDuplicate.aadhar_no || isDuplicate.email;
            
            if (rowErrors.length > 0) {
                errors.push({ row: rowNum, name: `${record.first_name || ''} ${record.last_name || ''}`.trim(), errors: rowErrors });
            }
            
            validated.push(record);
        }
        
        setValidatedData(validated);
        setValidationErrors(errors);
        setDuplicates(dupes);
        setStep(4);
        setLoading(false);
        
        toast({
            title: 'Validation Complete',
            description: `${validated.length - errors.length - dupes.length} valid, ${errors.length} with errors, ${dupes.length} duplicates`
        });
    };

    const parseDate = (value) => {
        if (!value) return null;
        
        // If it's already a Date object
        if (value instanceof Date && isValid(value)) {
            return value;
        }
        
        const str = String(value);
        
        // Try various date formats
        const formats = [
            'yyyy-MM-dd',
            'dd-MM-yyyy',
            'dd/MM/yyyy',
            'MM/dd/yyyy',
            'yyyy/MM/dd',
            'dd-MMM-yyyy',
            'dd MMM yyyy',
        ];
        
        for (const fmt of formats) {
            try {
                const parsed = parse(str, fmt, new Date());
                if (isValid(parsed)) return parsed;
            } catch (e) {}
        }
        
        // Try native Date parsing
        const native = new Date(str);
        if (isValid(native)) return native;
        
        return null;
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // BULK UPLOAD EXECUTION
    // ═══════════════════════════════════════════════════════════════════════════
    const executeUpload = async () => {
        if (!selectedClass || !selectedSection || !selectedSession) {
            toast({ variant: 'destructive', title: 'Missing Selection', description: 'Please select Class, Section and Session.' });
            return;
        }
        
        setUploading(true);
        setProgress(0);
        setStep(5);
        
        const results = { success: 0, failed: 0, errors: [], successRecords: [] };
        
        // Filter records to upload
        const recordsToUpload = validatedData.filter(r => {
            if (r._errors?.length > 0) return false;
            if (r._isDuplicate && skipDuplicates) return false;
            return true;
        });
        
        const total = recordsToUpload.length;
        let lastRollNumber = 0;
        let lastAdmissionNo = 0;
        
        // Get last roll number and admission number for auto-generation
        if (autoGenerateRollNo || autoGenerateAdmissionNo) {
            const { data: lastStudent } = await supabase
                .from('student_profiles')
                .select('roll_number, admission_no')
                .eq('branch_id', branchId)
                .eq('class_id', selectedClass)
                .eq('section_id', selectedSection)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            
            if (lastStudent) {
                lastRollNumber = parseInt(lastStudent.roll_number?.replace(/\D/g, '') || '0', 10);
            }
            
            // Get max admission number across branch
            const { data: maxAdm } = await supabase
                .from('student_profiles')
                .select('admission_no')
                .eq('branch_id', branchId)
                .order('admission_no', { ascending: false })
                .limit(1)
                .maybeSingle();
            
            if (maxAdm) {
                lastAdmissionNo = parseInt(maxAdm.admission_no?.replace(/\D/g, '') || '0', 10);
            }
        }
        
        for (let i = 0; i < recordsToUpload.length; i++) {
            const record = recordsToUpload[i];
            
            try {
                // Build student data - CRITICAL: Include organization_id, branch_id, session_id (PROJECT MANIFESTO)
                const studentData = {
                    // Multi-tenant (MANDATORY as per PROJECT_MANIFESTO)
                    organization_id: organizationId,
                    branch_id: branchId,
                    
                    // Academic
                    class_id: selectedClass,
                    section_id: selectedSection,
                    session_id: selectedSession,
                    
                    // Auto-generate if needed
                    admission_no: record.admission_no || (autoGenerateAdmissionNo ? `STU${String(++lastAdmissionNo).padStart(5, '0')}` : null),
                    roll_number: record.roll_number || (autoGenerateRollNo ? String(++lastRollNumber).padStart(2, '0') : null),
                    
                    // Basic Info
                    first_name: record.first_name,
                    last_name: record.last_name || null,
                    full_name: `${record.first_name || ''} ${record.last_name || ''}`.trim(),
                    gender: record.gender?.toLowerCase() || 'male',
                    date_of_birth: record.date_of_birth || null,
                    blood_group: record.blood_group || null,
                    religion: record.religion || null,
                    caste: record.caste || null,
                    category: record.category || null,
                    nationality: record.nationality || 'Indian',
                    mother_tongue: record.mother_tongue || null,
                    aadhar_no: record.aadhar_no || null,
                    
                    // Contact
                    email: record.email || null,
                    phone: record.phone || null,
                    present_address: record.address || null,
                    city: record.city || null,
                    state: record.state || null,
                    pincode: record.pincode || null,
                    
                    // Parents
                    father_name: record.father_name || null,
                    father_phone: record.father_phone || null,
                    father_email: record.father_email || null,
                    father_occupation: record.father_occupation || null,
                    mother_name: record.mother_name || null,
                    mother_phone: record.mother_phone || null,
                    mother_occupation: record.mother_occupation || null,
                    guardian_name: record.guardian_name || null,
                    guardian_relation: record.guardian_relation || null,
                    guardian_phone: record.guardian_phone || null,
                    
                    // School Info
                    previous_school_name: record.previous_school || null,
                    admission_date: format(new Date(), 'yyyy-MM-dd'),
                    status: 'active',
                    
                    // Metadata
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                
                // Use API for proper auth user creation if needed
                if (createParentAccounts && record.father_phone) {
                    // Call backend API that handles auth user creation
                    const response = await api.post('/students', {
                        ...studentData,
                        password: '123456',
                        parent_password: '123456',
                    });
                    
                    if (!response.data?.success) {
                        throw new Error(response.data?.error || 'API error');
                    }
                } else {
                    // Direct insert (faster for bulk)
                    const { error } = await supabase.from('student_profiles').insert([studentData]);
                    if (error) throw error;
                }
                
                results.success++;
                results.successRecords.push({
                    row: record._rowNum,
                    name: `${record.first_name} ${record.last_name || ''}`.trim(),
                    admission_no: studentData.admission_no,
                    roll_number: studentData.roll_number
                });
                
            } catch (error) {
                console.error(`Row ${record._rowNum} error:`, error);
                results.failed++;
                results.errors.push({
                    row: record._rowNum,
                    name: `${record.first_name || ''} ${record.last_name || ''}`.trim(),
                    error: error.message || 'Unknown error'
                });
            }
            
            setProgress(Math.round(((i + 1) / total) * 100));
        }
        
        setUploadResults(results);
        setUploading(false);
        setStep(6);
        
        toast({
            title: results.failed === 0 ? 'Upload Successful!' : 'Upload Complete with Errors',
            description: `${results.success} students uploaded, ${results.failed} failed.`,
            variant: results.failed > 0 ? 'warning' : 'default'
        });
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // EXPORT FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    const exportFailedRecords = () => {
        if (uploadResults.errors.length === 0) return;
        
        const failedData = uploadResults.errors.map(err => {
            const original = validatedData.find(v => v._rowNum === err.row)?._original || {};
            return { ...original, 'Error': err.error };
        });
        
        const ws = XLSX.utils.json_to_sheet(failedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Failed Records');
        XLSX.writeFile(wb, `Failed_Records_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`);
        toast({ title: 'Exported', description: 'Failed records exported for correction.' });
    };

    const exportSuccessReport = () => {
        if (uploadResults.successRecords.length === 0) return;
        
        const ws = XLSX.utils.json_to_sheet(uploadResults.successRecords.map(r => ({
            'Row': r.row,
            'Name': r.name,
            'Admission No': r.admission_no,
            'Roll Number': r.roll_number,
            'Status': 'Uploaded'
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Success Report');
        XLSX.writeFile(wb, `Upload_Success_Report_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RESET
    // ═══════════════════════════════════════════════════════════════════════════
    const resetForm = () => {
        setStep(1);
        setFile(null);
        setRawData([]);
        setSourceColumns([]);
        setFieldMappings({});
        setValidatedData([]);
        setValidationErrors([]);
        setDuplicates([]);
        setUploadResults({ success: 0, failed: 0, errors: [], successRecords: [] });
        setProgress(0);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <DashboardLayout>
            <div className="container mx-auto py-6 space-y-6 max-w-6xl">
                {/* Header */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                    <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                                <Users className="h-10 w-10" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Bulk Student Upload</h1>
                                <p className="text-white/80 mt-1">
                                    Import students from Excel, CSV or migrate from other ERPs
                                </p>
                            </div>
                        </div>
                        <Button onClick={downloadTemplate} variant="secondary" className="shadow-lg">
                            <Download className="h-4 w-4 mr-2" />
                            Download Template
                        </Button>
                    </div>
                    
                    {/* Supported ERPs */}
                    <div className="mt-6 flex flex-wrap gap-2">
                        <span className="text-xs text-white/60 mr-2">Supports migration from:</span>
                        {['Fedena', 'Entab', 'CampusCare', 'Any Excel/CSV'].map(erp => (
                            <Badge key={erp} variant="secondary" className="bg-white/20 text-white border-white/30">
                                {erp}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Step Indicator */}
                <StepIndicator currentStep={step} steps={steps} />

                {/* Step 1: Setup */}
                {step === 1 && (
                    <Card className="border-2">
                        <CardHeader className="bg-muted/30">
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5 text-primary" />
                                Step 1: Setup Import Configuration
                            </CardTitle>
                            <CardDescription>
                                Select class, section and configure import options
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {/* Class/Section/Session Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-semibold">Class <span className="text-red-500">*</span></Label>
                                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="Select Class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-semibold">Section <span className="text-red-500">*</span></Label>
                                    <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="Select Section" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sections.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-semibold">Session <span className="text-red-500">*</span></Label>
                                    <Select value={selectedSession} onValueChange={setSelectedSession}>
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="Select Session" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sessions.map(s => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.name} {s.is_active && <Badge className="ml-2">Active</Badge>}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Import Options */}
                            <div className="border rounded-xl p-4 bg-muted/20">
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <Wand2 className="h-4 w-4 text-primary" />
                                    Import Options
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                                        <div>
                                            <Label className="font-medium">Auto-generate Admission No</Label>
                                            <p className="text-xs text-muted-foreground">If blank in file</p>
                                        </div>
                                        <Switch checked={autoGenerateAdmissionNo} onCheckedChange={setAutoGenerateAdmissionNo} />
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                                        <div>
                                            <Label className="font-medium">Auto-generate Roll No</Label>
                                            <p className="text-xs text-muted-foreground">Sequential roll numbers</p>
                                        </div>
                                        <Switch checked={autoGenerateRollNo} onCheckedChange={setAutoGenerateRollNo} />
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                                        <div>
                                            <Label className="font-medium">Skip Duplicates</Label>
                                            <p className="text-xs text-muted-foreground">Skip if Admission/Aadhar exists</p>
                                        </div>
                                        <Switch checked={skipDuplicates} onCheckedChange={setSkipDuplicates} />
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                                        <div>
                                            <Label className="font-medium">Create Parent Accounts</Label>
                                            <p className="text-xs text-muted-foreground">Auto-create login for parents</p>
                                        </div>
                                        <Switch checked={createParentAccounts} onCheckedChange={setCreateParentAccounts} />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 justify-end">
                            <Button 
                                onClick={() => setStep(2)} 
                                disabled={!selectedClass || !selectedSection || !selectedSession}
                                className="gap-2"
                            >
                                Next: Upload File <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {/* Step 2: Upload File */}
                {step === 2 && (
                    <Card className="border-2">
                        <CardHeader className="bg-muted/30">
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="h-5 w-5 text-primary" />
                                Step 2: Upload Student Data File
                            </CardTitle>
                            <CardDescription>
                                Upload Excel or CSV file. System will auto-detect format from other ERPs.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-2xl p-12 text-center transition-colors cursor-pointer bg-gradient-to-br from-primary/5 to-transparent"
                                 onClick={() => document.getElementById('file-input').click()}>
                                <div className="flex flex-col items-center gap-4">
                                    <div className="p-6 bg-primary/10 rounded-full">
                                        <FileSpreadsheet className="h-16 w-16 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-semibold">Drop your file here or click to browse</p>
                                        <p className="text-muted-foreground mt-1">
                                            Supports: Excel (.xlsx, .xls) and CSV files
                                        </p>
                                    </div>
                                    <Input
                                        id="file-input"
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <Button variant="outline" className="mt-2">
                                        <FileUp className="h-4 w-4 mr-2" />
                                        Select File
                                    </Button>
                                </div>
                            </div>
                            
                            {file && (
                                <Alert className="mt-4 border-green-500 bg-green-50 dark:bg-green-950/20">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <AlertTitle className="text-green-700 dark:text-green-400">File Selected</AlertTitle>
                                    <AlertDescription className="text-green-600 dark:text-green-300">
                                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                    </AlertDescription>
                                </Alert>
                            )}
                            
                            {loading && (
                                <div className="flex items-center justify-center gap-2 mt-4">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                    <span>Parsing file...</span>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="bg-muted/30 justify-between">
                            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {/* Step 3: Field Mapping */}
                {step === 3 && (
                    <Card className="border-2">
                        <CardHeader className="bg-muted/30">
                            <CardTitle className="flex items-center gap-2">
                                <ArrowUpDown className="h-5 w-5 text-primary" />
                                Step 3: Map Fields
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                                <Badge variant="secondary">{detectedERP}</Badge>
                                format detected. Verify and adjust field mappings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <ScrollArea className="h-[500px] pr-4">
                                <div className="space-y-3">
                                    {TARGET_FIELDS.map(field => (
                                        <div key={field.key} className="flex items-center gap-4 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                            <div className="w-1/3">
                                                <Label className="font-medium flex items-center gap-2">
                                                    {field.label}
                                                    {field.required && <span className="text-red-500">*</span>}
                                                </Label>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <div className="flex-1">
                                                <Select 
                                                    value={fieldMappings[field.key] || ''} 
                                                    onValueChange={val => setFieldMappings(prev => ({ ...prev, [field.key]: val }))}
                                                >
                                                    <SelectTrigger className={fieldMappings[field.key] ? "border-green-500" : ""}>
                                                        <SelectValue placeholder="Select source column" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="">-- Not Mapped --</SelectItem>
                                                        {sourceColumns.map(col => (
                                                            <SelectItem key={col} value={col}>{col}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {fieldMappings[field.key] && (
                                                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                            
                            <Alert className="mt-4">
                                <Info className="h-4 w-4" />
                                <AlertTitle>Mapping Summary</AlertTitle>
                                <AlertDescription>
                                    {Object.keys(fieldMappings).filter(k => fieldMappings[k]).length} of {TARGET_FIELDS.length} fields mapped.
                                    Required fields: First Name, Gender
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                        <CardFooter className="bg-muted/30 justify-between">
                            <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                            <Button 
                                onClick={validateData} 
                                disabled={!fieldMappings.first_name || !fieldMappings.gender || loading}
                                className="gap-2"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                Validate Data <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {/* Step 4: Validation Results */}
                {step === 4 && (
                    <Card className="border-2">
                        <CardHeader className="bg-muted/30">
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                Step 4: Validation Results
                            </CardTitle>
                            <CardDescription>
                                Review validation results before importing
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <CheckCircle className="h-8 w-8 text-green-600" />
                                        <div>
                                            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                                                {validatedData.filter(r => !r._errors?.length && !r._isDuplicate).length}
                                            </p>
                                            <p className="text-sm text-green-600">Valid Records</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <XCircle className="h-8 w-8 text-red-600" />
                                        <div>
                                            <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                                                {validationErrors.length}
                                            </p>
                                            <p className="text-sm text-red-600">With Errors</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <AlertTriangle className="h-8 w-8 text-amber-600" />
                                        <div>
                                            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                                                {duplicates.length}
                                            </p>
                                            <p className="text-sm text-amber-600">Duplicates</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <Users className="h-8 w-8 text-blue-600" />
                                        <div>
                                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                                                {validatedData.length}
                                            </p>
                                            <p className="text-sm text-blue-600">Total Records</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Error Details */}
                            {validationErrors.length > 0 && (
                                <div className="border rounded-xl overflow-hidden">
                                    <div className="bg-red-100 dark:bg-red-950/30 px-4 py-2 border-b flex items-center gap-2">
                                        <XCircle className="h-4 w-4 text-red-600" />
                                        <span className="font-semibold text-red-700 dark:text-red-400">Validation Errors</span>
                                    </div>
                                    <ScrollArea className="h-48">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-16">Row</TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Errors</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {validationErrors.map((err, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell className="font-mono">{err.row}</TableCell>
                                                        <TableCell>{err.name || '-'}</TableCell>
                                                        <TableCell className="text-red-600 text-sm">
                                                            {err.errors.join(', ')}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </div>
                            )}

                            {/* Duplicates */}
                            {duplicates.length > 0 && (
                                <div className="border rounded-xl overflow-hidden">
                                    <div className="bg-amber-100 dark:bg-amber-950/30 px-4 py-2 border-b flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                                        <span className="font-semibold text-amber-700 dark:text-amber-400">
                                            Duplicate Records {skipDuplicates && '(Will be skipped)'}
                                        </span>
                                    </div>
                                    <ScrollArea className="h-32">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-16">Row</TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Duplicate Fields</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {duplicates.map((dup, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell className="font-mono">{dup.row}</TableCell>
                                                        <TableCell>{dup.name || '-'}</TableCell>
                                                        <TableCell>
                                                            {dup.duplicateFields.map(f => (
                                                                <Badge key={f} variant="outline" className="mr-1">{f}</Badge>
                                                            ))}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </div>
                            )}

                            {/* Preview */}
                            <div className="border rounded-xl overflow-hidden">
                                <div className="bg-muted px-4 py-2 border-b flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    <span className="font-semibold">Data Preview (First 10 Records)</span>
                                </div>
                                <ScrollArea className="h-64">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12">#</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Gender</TableHead>
                                                <TableHead>DOB</TableHead>
                                                <TableHead>Father</TableHead>
                                                <TableHead>Phone</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {validatedData.slice(0, 10).map((row, idx) => (
                                                <TableRow key={idx} className={row._errors?.length ? "bg-red-50 dark:bg-red-950/10" : row._isDuplicate ? "bg-amber-50 dark:bg-amber-950/10" : ""}>
                                                    <TableCell className="font-mono">{row._rowNum}</TableCell>
                                                    <TableCell>{`${row.first_name || ''} ${row.last_name || ''}`.trim() || '-'}</TableCell>
                                                    <TableCell>{row.gender || '-'}</TableCell>
                                                    <TableCell>{row.date_of_birth || '-'}</TableCell>
                                                    <TableCell>{row.father_name || '-'}</TableCell>
                                                    <TableCell>{row.phone || row.father_phone || '-'}</TableCell>
                                                    <TableCell>
                                                        {row._errors?.length ? (
                                                            <Badge variant="destructive">Error</Badge>
                                                        ) : row._isDuplicate ? (
                                                            <Badge className="bg-amber-500">Duplicate</Badge>
                                                        ) : (
                                                            <Badge className="bg-green-500">Valid</Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 justify-between">
                            <Button variant="outline" onClick={() => setStep(3)} className="gap-2">
                                <ArrowLeft className="h-4 w-4" /> Back to Mapping
                            </Button>
                            <Button 
                                onClick={executeUpload}
                                disabled={validatedData.filter(r => !r._errors?.length && (!r._isDuplicate || !skipDuplicates)).length === 0}
                                className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                            >
                                <Upload className="h-4 w-4" />
                                Import {validatedData.filter(r => !r._errors?.length && (!r._isDuplicate || !skipDuplicates)).length} Students
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {/* Step 5: Import Progress */}
                {step === 5 && (
                    <Card className="border-2">
                        <CardHeader className="bg-muted/30">
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5 text-primary" />
                                Step 5: Importing Students...
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-12 text-center">
                            <div className="max-w-md mx-auto space-y-6">
                                <div className="relative">
                                    <div className="w-32 h-32 mx-auto rounded-full border-8 border-primary/20 flex items-center justify-center">
                                        <span className="text-4xl font-bold text-primary">{progress}%</span>
                                    </div>
                                    <Loader2 className="h-8 w-8 animate-spin text-primary absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4" />
                                </div>
                                <Progress value={progress} className="h-3" />
                                <p className="text-muted-foreground">
                                    Please wait while students are being imported...
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 6: Results */}
                {step === 6 && (
                    <Card className="border-2">
                        <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                <CheckCircle className="h-6 w-6" />
                                Import Complete!
                            </CardTitle>
                            <CardDescription>
                                Here's a summary of the import operation
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {/* Result Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                                    <CardContent className="p-6 text-center">
                                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                        <p className="text-5xl font-bold text-green-700 dark:text-green-400">
                                            {uploadResults.success}
                                        </p>
                                        <p className="text-green-600 font-medium mt-2">Students Imported Successfully</p>
                                    </CardContent>
                                </Card>
                                <Card className={uploadResults.failed > 0 ? "border-red-500 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30" : "border-muted"}>
                                    <CardContent className="p-6 text-center">
                                        {uploadResults.failed > 0 ? (
                                            <>
                                                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                                                <p className="text-5xl font-bold text-red-700 dark:text-red-400">
                                                    {uploadResults.failed}
                                                </p>
                                                <p className="text-red-600 font-medium mt-2">Failed to Import</p>
                                            </>
                                        ) : (
                                            <>
                                                <Star className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                                                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                                                    Perfect!
                                                </p>
                                                <p className="text-amber-600 font-medium mt-2">No Errors</p>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Failed Records */}
                            {uploadResults.errors.length > 0 && (
                                <div className="border rounded-xl overflow-hidden">
                                    <div className="bg-red-100 dark:bg-red-950/30 px-4 py-3 border-b flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <XCircle className="h-4 w-4 text-red-600" />
                                            <span className="font-semibold text-red-700 dark:text-red-400">
                                                Failed Records ({uploadResults.errors.length})
                                            </span>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={exportFailedRecords}>
                                            <Download className="h-4 w-4 mr-2" />
                                            Export for Retry
                                        </Button>
                                    </div>
                                    <ScrollArea className="h-48">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-16">Row</TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Error</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {uploadResults.errors.map((err, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell className="font-mono">{err.row}</TableCell>
                                                        <TableCell>{err.name}</TableCell>
                                                        <TableCell className="text-red-600">{err.error}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </div>
                            )}

                            {/* Success Records Preview */}
                            {uploadResults.successRecords.length > 0 && (
                                <div className="border rounded-xl overflow-hidden">
                                    <div className="bg-green-100 dark:bg-green-950/30 px-4 py-3 border-b flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            <span className="font-semibold text-green-700 dark:text-green-400">
                                                Imported Students (First 10)
                                            </span>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={exportSuccessReport}>
                                            <Download className="h-4 w-4 mr-2" />
                                            Export Report
                                        </Button>
                                    </div>
                                    <ScrollArea className="h-48">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-16">Row</TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Admission No</TableHead>
                                                    <TableHead>Roll No</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {uploadResults.successRecords.slice(0, 10).map((rec, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell className="font-mono">{rec.row}</TableCell>
                                                        <TableCell>{rec.name}</TableCell>
                                                        <TableCell className="font-mono">{rec.admission_no}</TableCell>
                                                        <TableCell>{rec.roll_number}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="bg-muted/30 justify-between">
                            <Button variant="outline" onClick={resetForm} className="gap-2">
                                <RotateCcw className="h-4 w-4" />
                                Upload More Students
                            </Button>
                            <Button 
                                onClick={() => window.location.href = '/super-admin/student-information/students'}
                                className="gap-2"
                            >
                                View All Students <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default BulkUpload;
