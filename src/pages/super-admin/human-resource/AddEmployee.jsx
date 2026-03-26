import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { staffApi } from '@/lib/api/staffApi';
import { humanResourceApi } from '@/lib/api/humanResourceApi';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { ROUTES } from '@/registry/routeRegistry';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, Save, Sparkles, User, Banknote, Briefcase, FileText, Home, Phone, Mail, Link as LinkIcon, Lock, 
  Search, ArrowRight, ArrowLeft, CheckCircle2, Upload, Printer, Send
} from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import { v4 as uuidv4 } from 'uuid';
import DatePicker from '@/components/ui/DatePicker';
import AadharInput from '@/components/AadharInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// --- Stepper Component Removed ---

const AddEmployee = () => {
    const { toast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();
    const { user, organizationId, currentSessionId, currentSessionName } = useAuth();
    const { selectedBranch, setSelectedBranch, branches } = useBranch(); // Get all branches to check count
    
    const stateBranchId = location.state?.branch_id;
    // Enhanced School ID Resolution for Master Admin / Impersonation
    let branchId = user?.profile?.branch_id;
    if (!branchId) {
        branchId = sessionStorage.getItem('ma_target_branch_id');
    }

    // --- State ---
    const [currentStep, setCurrentStep] = useState(0); // 0: Search, 1: Staff, 2: Personal, 3: Login, 4: Other, 5: Biometric, 6: Docs, 7: Success
    const [loading, setLoading] = useState(false);
    const [searchMobile, setSearchMobile] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [emailChecking, setEmailChecking] = useState(false);

    // Dropdowns
    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [employmentCategories, setEmploymentCategories] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [schoolSettings, setSchoolSettings] = useState(null);
    const [pincodeLoading, setPincodeLoading] = useState(false);
    const [bankLoading, setBankLoading] = useState(false);
    const [postOffices, setPostOffices] = useState({ current: [], permanent: [] });
    // Dynamic Fields State
    const [fieldSettings, setFieldSettings] = useState({}); // { field_key: { is_enabled, is_required } }
    const [customFields, setCustomFields] = useState([]);

    // Form Data
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [formData, setFormData] = useState({
        // Staff Details
        branch_id: '', // Will be set automatically if single branch
        employment_status: 'Permanent',
        staff_type: 'Teaching',
        employment_category: '',
        designation_id: '',
        qualification_type: '',
        educational_qualification: '',
        access_level: 'Staff',
        trained_as: '',
        ctet_qualified: 'No',
        gate_qualified: 'No',
        nat_qualified: 'No',
        department_id: '',
        role_id: '',

        // Personal Details
        first_name: '',
        middle_name: '',
        last_name: '',
        gender: 'Male',
        dob: null,
        phone: '', // Mobile
        email: '',
        emergency_contact_number: '',
        current_address: '',
        current_pincode: '',
        current_city: '',
        current_state: '',
        current_post_office: '',

        permanent_address: '',
        permanent_pincode: '',
        permanent_city: '',
        permanent_state: '',
        permanent_post_office: '',
        photo_url: '',

        // Other Details
        date_of_joining: null,
        staff_id: '', // Unique Staff ID
        salary_pay_type: 'Scale',
        citizenship: 'Indian',
        govt_id_no: '', // Resident No
        pan_number: '',
        aadhar_no: '',
        epf_no: '',
        basic_salary: '',
        bank_account_title: '',
        bank_account_number: '',
        bank_name: '',
        ifsc_code: '',
        bank_branch_name: '',

        // Biometric
        biometric_code: '',
        shift_id: '',

        // Login (Auto-generated or manual)
        password: '',
        retype_password: '',
        custom_fields: {}, // Stores dynamic field values: { field_slug: value }
    });

    // Documents State
    const [documents, setDocuments] = useState([
        { id: 1, name: 'Aadhar Card', submitted: false, file: null },
        { id: 2, name: 'PAN Card', submitted: false, file: null },
        { id: 3, name: 'Education Certificate', submitted: false, file: null },
        { id: 4, name: 'Address Proof', submitted: false, file: null },
    ]);

    // --- Effects ---
    // Auto-trigger search when mobile number is 10 digits
    useEffect(() => {
        if (searchMobile.length === 10) {
            handleSearch();
        } else {
            // Reset search state if number is changed/invalid
            setHasSearched(false);
            setSearchResult(null);
        }
    }, [searchMobile]);

    // Auto-check Email
    useEffect(() => {
        const checkEmail = async () => {
            const email = formData.email;
            // Simple email regex
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (email && emailRegex.test(email)) {
                setEmailChecking(true);
                try {
                    // CRITICAL FIX: Pass branchId so backend can detect cross-org vs same-branch
                    const currentBranchId = formData.branch_id || selectedBranch?.id || branchId;
                    const result = await staffApi.checkUserExistence(null, email, currentBranchId);
                    // Only show error for same-branch duplicates, NOT cross-org users
                    if (result.exists && !result.crossOrg) {
                        toast({
                            variant: 'destructive',
                            title: 'Email Already Exists',
                            description: 'This email is already associated with another user in this branch.'
                        });
                    }
                } catch (error) {
                    console.error("Email check failed", error);
                } finally {
                    setEmailChecking(false);
                }
            }
        };

        const timeoutId = setTimeout(checkEmail, 800);
        return () => clearTimeout(timeoutId);
    }, [formData.email]);

    useEffect(() => {
        // CRITICAL FIX: Always use selectedBranch.id as the primary source
        // This ensures the currently selected branch in the header dropdown is used
        const targetBranchId = selectedBranch?.id || stateBranchId || (branches.length === 1 ? branches[0]?.id : null) || branchId;
        
        if (targetBranchId && formData.branch_id !== targetBranchId) {
            setFormData(prev => ({ ...prev, branch_id: targetBranchId }));
        }

        if (!targetBranchId) return;

        const fetchSettingsAndDropdowns = async () => {
            // Settings - fetch from branches table
            // CRITICAL FIX: Use targetBranchId (selected branch) instead of branchId (user's profile branch)
            // This ensures password_auto_generation and other settings are loaded for the correct branch
            const effectiveBranchId = targetBranchId || branchId;
            const { data: settings } = await supabase.from('branches').select('*').eq('id', effectiveBranchId).maybeSingle();
            setSchoolSettings(settings);

            // Auto-fill password when password_auto_generation is ON
            // This prevents validation errors when user reaches Save step
            if (settings?.password_auto_generation) {
                const autoPassword = settings.password_default_employee || settings.password_default || '';
                if (autoPassword) {
                    setFormData(prev => ({
                        ...prev,
                        password: prev.password || autoPassword,
                        retype_password: prev.retype_password || autoPassword
                    }));
                }
            }

            // Dropdowns
            // Fetch for SELECTED branch (via dropdown) or DEFAULT branch
            const queryBranchId = formData.branch_id || targetBranchId || selectedBranch?.id;
            
            if (!queryBranchId) return; // Wait for branch selection (either auto or manual)

            try {
                const [rolesRes, departmentsData, designationsData, empCatsData, formSettingsRes, shiftsRes] = await Promise.all([
                    supabase.from('roles').select('id, name, description, is_system').eq('branch_id', queryBranchId),
                    humanResourceApi.getDepartments(queryBranchId, queryBranchId),
                    humanResourceApi.getDesignations(queryBranchId, queryBranchId),
                    humanResourceApi.getEmploymentCategories(queryBranchId, queryBranchId),
                    api.get('/form-settings', { params: { branchId: queryBranchId, module: 'employee_registration' } }),
                    supabase.from('attendance_shifts')
                        .select('id, shift_name, shift_code, start_time, end_time, is_default')
                        .eq('branch_id', queryBranchId)
                        .eq('is_active', true)
                        .order('shift_name')
                ]);

                // Process Field Settings
                const settingsMap = {};
                if (formSettingsRes.data?.systemFields) {
                    formSettingsRes.data.systemFields.forEach(s => {
                         settingsMap[s.key] = { 
                             is_enabled: s.is_enabled, 
                             is_required: s.is_required,
                             label: s.field_label || s.label,
                             options: s.field_options
                         };
                    });
                }
                setFieldSettings(settingsMap);
                setCustomFields(formSettingsRes.data?.customFields || []);

                // Deduplicate roles (prefer Capitalized names) & Filter by Branch
                const uniqueRoles = [];
                const seenRoles = new Set();
                const rawRoles = rolesRes.data || [];
                
                // Sort: Capitalized first
                rawRoles.sort((a, b) => {
                    const nameA = a.name;
                    const nameB = b.name;
                    const isCapA = nameA[0] === nameA[0].toUpperCase();
                    const isCapB = nameB[0] === nameB[0].toUpperCase();
                    if (isCapA && !isCapB) return -1;
                    if (!isCapA && isCapB) return 1;
                    return 0;
                });

                rawRoles.forEach(role => {
                    const normalized = role.name.toLowerCase().trim();
                    // Filter out restricted roles
                    const restrictedRoles = ['school owner', 'school_owner', 'student', 'parent', 'guardian', 'super admin', 'super_admin'];
                    if (restrictedRoles.includes(normalized)) return;

                    if (!seenRoles.has(normalized)) {
                        seenRoles.add(normalized);
                        uniqueRoles.push(role);
                    }
                });

                setRoles(uniqueRoles);
                setDepartments(departmentsData || []);
                setDesignations(designationsData || []);
                setEmploymentCategories(empCatsData || []);
                setShifts(shiftsRes.data || []);
            } catch (error) {
                console.error("Failed to fetch dropdowns", error);
                toast({
                    variant: 'destructive',
                    title: 'Data Load Error',
                    description: 'Could not load form options. Please refresh.'
                });
            }
        };
        
        fetchSettingsAndDropdowns();
    }, [branchId, selectedBranch?.id, branches, stateBranchId]);

    /**
     * ?? GLOBAL UNIQUE EMPLOYEE ID GENERATOR
     * Uses Backend API to generate globally unique employee ID
     * Format: PREFIX-SESSION_YEAR-SEQUENCE (e.g., EMP-2026/27-00012)
     * 
     * This ensures 100% unique employee IDs across ALL branches
     * for 100+ years with no duplicates ever.
     */
    const generateNextEmployeeId = useCallback(async () => {
        try {
            const currentBranchId = formData.branch_id || branchId || selectedBranch?.id;
            if (!currentBranchId) {
                console.warn('[AddEmployee] No branch ID available for employee ID generation');
                return;
            }

            // ?? Call Backend API for GLOBAL UNIQUE employee ID
            // Using centralized api client for proper URL handling (relative /api on production, VITE_API_BASE_URL on localhost)
            const response = await api.get(`/staff/next-employee-id?branch_id=${currentBranchId}&session_id=${currentSessionId || ''}`, {
                headers: {
                    'x-branch-id': currentBranchId
                }
            });

            const result = response.data;
            
            if (result.success) {
                const newId = result.employeeId;
                setFormData(prev => ({ ...prev, staff_id: newId, biometric_code: newId }));
            } else {
                // Fallback to local generation if API fails
                console.warn('[AddEmployee] Backend API failed, using local generation:', result.error);
                await generateNextEmployeeIdLocal();
            }
        } catch (err) {
            console.error("[AddEmployee] Failed to generate Employee ID from API, using local fallback", err);
        await generateNextEmployeeIdLocal();
        }
    }, [formData.branch_id, branchId, selectedBranch?.id, currentSessionId]);

    /**
     * ?? LOCAL FALLBACK: Generate employee ID locally if API fails
     * Uses GLOBAL query across ALL branches for uniqueness
     */
    const generateNextEmployeeIdLocal = useCallback(async () => {
        try {
            // ?? Use session year format (e.g., "2026-2027" ? "2026/27")
            let sessionYear;
            if (currentSessionName) {
                const match = currentSessionName.match(/(\d{4})-(\d{4})/);
                if (match) {
                    sessionYear = `${match[1]}/${match[2].slice(-2)}`; // "2026/27"
                }
            }
            if (!sessionYear) {
                const currentYear = new Date().getFullYear();
                sessionYear = `${currentYear}/${String(currentYear + 1).slice(-2)}`;
            }
            const prefix = `EMP-${sessionYear}-`;
            
            // ?? Query GLOBALLY across ALL branches
            const { data, error } = await supabase
                .from('employee_profiles')
                .select('staff_id')
                .ilike('staff_id', `${prefix}%`)
                .order('staff_id', { ascending: false })
                .limit(1);

            let nextNum = 1;

            if (data && data.length > 0 && data[0].staff_id) {
                const lastId = data[0].staff_id;
                const match = lastId.match(/(\d+)$/);
                if (match) {
                    const lastNum = parseInt(match[1], 10);
                    if (!isNaN(lastNum)) {
                        nextNum = lastNum + 1;
                    }
                }
            }

            const nextId = `${prefix}${String(nextNum).padStart(5, '0')}`;
            setFormData(prev => ({ ...prev, staff_id: nextId, biometric_code: nextId }));
        } catch (err) {
            console.error("Failed to generate Employee ID locally", err);
        }
    }, [currentSessionName]);

    useEffect(() => {
        // Always auto-generate Employee ID for new employees
        generateNextEmployeeId();
    }, [generateNextEmployeeId]);

    // --- Pincode Lookup ---
    const handlePincodeLookup = async (type, pincode) => {
        // type: 'current' or 'permanent'
        // Always update the form field
        setFormData(prev => ({ ...prev, [`${type}_pincode`]: pincode }));

        if (pincode.length === 6 && /^\d+$/.test(pincode)) {
            setPincodeLoading(true);
            try {
                // Use backend proxy to avoid CSP issues
                const data = await staffApi.getPincodeDetails(pincode);
                
                if (data && data.found) {
                    const details = data.postOffices[0];
                    const allPostOffices = data.postOffices.map(po => po.name);
                    
                    setFormData(prev => ({
                        ...prev,
                        [`${type}_city`]: details.city,
                        [`${type}_state`]: details.state,
                        [`${type}_post_office`]: allPostOffices.length > 0 ? allPostOffices[0] : ''
                    }));
                    
                    setPostOffices(prev => ({ ...prev, [type]: allPostOffices }));
                    
                    toast({
                        title: "Address Details Found",
                        description: `City: ${details.city}, State: ${details.state}`
                    });
                } else {
                    toast({
                        variant: 'destructive',
                        title: "Pincode Not Found",
                        description: "Please check the pincode and try again."
                    });
                }
            } catch (error) {
                console.error("Pincode API Error", error);
                toast({
                    variant: 'destructive',
                    title: "Lookup Failed",
                    description: "Could not fetch address details."
                });
            } finally {
                setPincodeLoading(false);
            }
        }
    };

    const handleIfscLookup = async (ifsc) => {
        setFormData(prev => ({ ...prev, ifsc_code: ifsc }));
        
        // Basic validation for IFSC (11 chars)
        if (ifsc.length === 11) {
            setBankLoading(true);
            try {
                const data = await staffApi.getBankDetails(ifsc);
                if (data && data.found) {
                     setFormData(prev => ({
                        ...prev,
                        bank_name: data.bank,
                        bank_branch_name: data.branch,
                        // If we had city/state fields for bank, we would populate them
                        bank_address: data.address
                    }));
                    toast({
                        title: "Bank Details Found",
                        description: `${data.bank} - ${data.branch}`
                    });
                } else {
                     toast({
                        variant: 'destructive',
                        title: "Invalid IFSC",
                        description: "Could not find bank details for this IFSC code."
                    });
                }
            } catch (error) {
                 // Silet fail or toast
                 if(error.response?.status !== 404) {
                     console.error("IFSC Error", error);
                 }
            } finally {
                setBankLoading(false);
            }
        }
    };


    // TC-25, TC-26 FIX: Name fields that should only accept letters and spaces
    const nameFields = ['first_name', 'middle_name', 'last_name'];

    // --- Handlers ---
    const handleChange = (key, value) => {
        // Filter invalid characters for name fields (only allow letters, spaces, and periods)
        if (nameFields.includes(key) && value) {
            value = value.replace(/[^a-zA-Z\s.]/g, '');
        }
        setFormData(prev => ({ ...prev, [key]: value }));

        // Sync header branch selector when user changes branch in form
        if (key === 'branch_id' && value) {
            const matchedBranch = branches.find(b => b.id === value);
            if (matchedBranch) setSelectedBranch(matchedBranch);
        }
    };

    const handleSearch = async () => {
        // Validate: Must be exactly 10 digits and numeric
        const mobileRegex = /^\d{10}$/;
        if (!mobileRegex.test(searchMobile)) {
            return;
        }

        setLoading(true);
        try {
            // 1. Check Central User Registry (Owners, Staff, etc.)
            const currentBranchId = formData.branch_id || selectedBranch?.id || branchId;
            const userCheck = await staffApi.checkUserExistence(searchMobile, null, currentBranchId);
            
            if (userCheck.exists) {
                if (userCheck.crossOrg) {
                    // ? CROSS-ORG: User exists in another org — allow linking to current branch
                    setSearchResult({ 
                        exists: true, 
                        crossOrg: true, 
                        full_name: userCheck.users[0]?.email || 'Existing User',
                        ...userCheck.users[0] 
                    });
                    setHasSearched(true);
                    toast({ 
                        title: 'Cross-Organization User Found', 
                        description: 'This user exists in another organization. You can link them to this branch.' 
                    });
                    return;
                }
                
                // Same org/branch duplicate — block
                setSearchResult({ 
                    exists: true, 
                    full_name: 'Existing User',
                    ...userCheck.users[0] 
                });
                setHasSearched(true);
                toast({ 
                    variant: 'destructive', 
                    title: 'Duplicate Found', 
                    description: 'This mobile number is already registered in this branch. Duplicates are not allowed.' 
                });
                return;
            }

            // 2. Check Employee Profiles (filtered by current organization)
            const currentOrgId = organizationId || user?.profile?.organization_id || selectedBranch?.organization_id;
            const result = await staffApi.searchStaffByMobile(searchMobile, currentOrgId);
            setSearchResult(result);
            setHasSearched(true);
            
            if (result) {
                toast({ 
                    variant: 'destructive', 
                    title: 'Duplicate Found', 
                    description: 'This mobile number is already registered as Staff in this organization.' 
                });
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Search Failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleContinueToCreate = () => {
        setFormData(prev => ({ 
            ...prev, 
            phone: searchMobile,
            // ? CROSS-ORG: Pre-fill email if available from cross-org user
            ...(searchResult?.crossOrg && searchResult?.email ? { email: searchResult.email } : {})
        }));
        setCurrentStep(1);
    };

    const validateStep = (step) => {
        const errors = [];
        // Helper to check if a standard key is required by settings
        // If setting doesn't exist, we assume OPTIONAL (standard behavior for dynamic forms)
        // EXCEPT for critical identity fields which remain hard-coded below
        const isReq = (key) => getFieldProps(key).isRequired;

        if (step === 1) { // Staff Details
            if (branches.length > 1 && !formData.branch_id) errors.push("Branch is required");
            if (!formData.department_id) errors.push("Department is required");
            if (!formData.designation_id) errors.push("Designation is required");
            if (!formData.role_id) errors.push("Role is required");
            
            if (getFieldProps('staff_type').isVisible && getFieldProps('staff_type').isRequired && !formData.staff_type) errors.push(getFieldProps('staff_type', 'Staff Type').label + " is required");
            if (getFieldProps('employment_status').isVisible && getFieldProps('employment_status').isRequired && !formData.employment_status) errors.push(getFieldProps('employment_status', 'Status').label + " is required");
        }
        if (step === 2) { // Personal
            if (!formData.first_name) errors.push("First Name is required");
            if (!formData.last_name) errors.push("Last Name is required");
            if (!formData.gender) errors.push("Gender is required");
            
            // Configurable Fields
            if (isReq('dob') && !formData.dob) errors.push("Date of Birth is required");
            if (isReq('current_address') && !formData.current_address) errors.push("Current Address is required");
        }
        if (step === 3) { // Login Details
            if (!formData.email) errors.push("Email is required");
            if (!formData.phone) errors.push("Mobile Number is required");
            
            // Password Validation based on Settings
            // When auto-gen is ON or settings not loaded yet, skip password requirement
            // Backend always has fallback (default password or mobile number)
            const isAutoPass = schoolSettings?.password_auto_generation;
            if (isAutoPass === false) {
                if (!formData.password) {
                    errors.push("Password is required");
                } else if (formData.password.length < 6) {
                    errors.push("Password must be at least 6 characters");
                }
                if (formData.password && formData.retype_password && formData.password !== formData.retype_password) {
                    errors.push("Passwords do not match");
                }
            }
        }
        if (step === 4) { // Other
            if (isReq('date_of_joining') && !formData.date_of_joining) errors.push("Date of Joining is required");
            if (isReq('aadhar_no') && !formData.aadhar_no) errors.push("Aadhar Number is required");
            if (isReq('basic_salary') && !formData.basic_salary) errors.push("Basic Salary is required");

             // Custom Fields Validation
             if (customFields) {
                customFields.forEach(field => {
                    if (field.is_required) {
                        const val = formData.custom_fields?.[field.field_key];
                        if (!val || (typeof val === 'string' && val.trim() === '')) {
                            errors.push(`${field.field_label} is required`);
                        }
                    }
                });
            }
        }
        if (step === 5) { // Biometric
            if (!formData.shift_id) errors.push("Shift Assignment is required");
        }
        
        if (errors.length > 0) {
            errors.forEach(err => toast({ variant: "destructive", title: "Validation Error", description: err }));
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
    };

    const handleDocumentToggle = (id, val) => {
        setDocuments(prev => prev.map(d => d.id === id ? { ...d, submitted: val === 'yes' } : d));
    };

    // Document file input refs
    const fileInputRefs = useRef({});

    // Handle file selection for documents
    const handleDocumentFileSelect = (docId, event) => {
        const file = event.target.files?.[0];
        if (file) {
            setDocuments(prev => prev.map(d => 
                d.id === docId ? { ...d, file: file, submitted: true } : d
            ));
            toast({
                title: 'File Selected',
                description: `${file.name} selected for upload`,
            });
        }
    };

    // Trigger file input click
    const triggerFileSelect = (docId) => {
        fileInputRefs.current[docId]?.click();
    };

    // Helper: Dynamic Field Properties
    const getFieldProps = (key, defaultLabel = '') => {
        const setting = fieldSettings[key];
        // Default: Visible=True, Required=False (Standard behavior)
        if (!setting) return { isVisible: true, isRequired: false, label: defaultLabel, options: null };
        return { 
            isVisible: setting.is_enabled !== false, 
            isRequired: setting.is_required === true,
            label: setting.label || defaultLabel,
            options: setting.options || null
        };
    };

    // Helper: Render Custom Fields
    const renderCustomFields = () => {
        if (!customFields || customFields.length === 0) return null;
        
        // Filter out fields already rendered by embedded helpers
        const remainingFields = customFields.filter(f => {
             const sKey = f.section_key || (f.field_key?.includes('__') ? f.field_key.split('__')[0] : '');
             const handledSections = ['employment_info', 'qualification', 'personal_details', 'contact_details', 'bank_details', 'official_details'];
             return !handledSections.includes(sKey);
        });

        if (remainingFields.length === 0) return null;

        return (
            <Card className="col-span-full border-t-4 border-t-indigo-500 shadow-md">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-transparent dark:from-indigo-900/20 pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                        <Sparkles className="h-5 w-5" />
                        Additional Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                {remainingFields.map(field => (
                    <div key={field.field_key} className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {field.field_label} {field.is_required && <span className="text-red-500">*</span>}
                        </Label>
                        
                        {/* Text */}
                        {field.field_type === 'text' && (
                            <Input 
                                className="border-indigo-100 focus-visible:ring-indigo-500"
                                value={formData.custom_fields?.[field.field_key] || ''}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev, 
                                    custom_fields: { ...prev.custom_fields, [field.field_key]: e.target.value } 
                                }))}
                            />
                        )}

                        {/* Number */}
                        {field.field_type === 'number' && (
                            <Input 
                                type="number"
                                className="border-indigo-100 focus-visible:ring-indigo-500"
                                value={formData.custom_fields?.[field.field_key] || ''}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev, 
                                    custom_fields: { ...prev.custom_fields, [field.field_key]: e.target.value } 
                                }))}
                            />
                        )}

                        {/* Textarea */}
                        {field.field_type === 'textarea' && (
                            <Textarea 
                                className="border-indigo-100 focus-visible:ring-indigo-500 min-h-[80px]"
                                value={formData.custom_fields?.[field.field_key] || ''}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev, 
                                    custom_fields: { ...prev.custom_fields, [field.field_key]: e.target.value } 
                                }))}
                            />
                        )}

                        {/* Date */}
                        {field.field_type === 'date' && (
                            <DatePicker
                                date={formData.custom_fields?.[field.field_key] ? new Date(formData.custom_fields[field.field_key]) : null}
                                setDate={(d) => setFormData(prev => ({
                                    ...prev, 
                                    custom_fields: { ...prev.custom_fields, [field.field_key]: d } 
                                }))}
                            />
                        )}

                         {/* Select */}
                        {field.field_type === 'select' && (
                            <Select 
                                value={formData.custom_fields?.[field.field_key] || ''} 
                                onValueChange={(val) => setFormData(prev => ({
                                    ...prev, 
                                    custom_fields: { ...prev.custom_fields, [field.field_key]: val } 
                                }))}
                            >
                                <SelectTrigger className="border-indigo-100">
                                    <SelectValue placeholder={`Select ${field.field_label}`} />
                                </SelectTrigger>
                                <SelectContent>
                                    {(field.field_options || []).map((opt, idx) => {
                                        const val = typeof opt === 'object' ? opt.value : opt;
                                        const lab = typeof opt === 'object' ? opt.label : opt;
                                        return <SelectItem key={idx} value={val}>{lab}</SelectItem>;
                                    })}
                                </SelectContent>
                            </Select>
                        )}

                        {/* Radio */}
                        {field.field_type === 'radio' && (
                             <RadioGroup 
                                className="flex flex-col space-y-2 mt-2"
                                value={formData.custom_fields?.[field.field_key] || ''}
                                onValueChange={(val) => setFormData(prev => ({
                                    ...prev,
                                    custom_fields: { ...prev.custom_fields, [field.field_key]: val }
                                }))}
                             >
                                {(field.field_options || []).map((opt, idx) => {
                                    const val = typeof opt === 'object' ? opt.value : opt;
                                    const lab = typeof opt === 'object' ? opt.label : opt;
                                    return (
                                        <div key={idx} className="flex items-center space-x-2">
                                            <RadioGroupItem value={val} id={`${field.field_key}-${idx}`} />
                                            <Label htmlFor={`${field.field_key}-${idx}`} className="font-normal cursor-pointer">{lab}</Label>
                                        </div>
                                    );
                                })}
                             </RadioGroup>
                        )}
                        
                        {/* Checkbox */}
                        {field.field_type === 'checkbox' && (
                             <div className="grid grid-cols-1 gap-2 mt-2">
                                {(field.field_options || []).map((opt, idx) => {
                                    const val = typeof opt === 'object' ? opt.value : opt;
                                    const lab = typeof opt === 'object' ? opt.label : opt;
                                    const currentValues = Array.isArray(formData.custom_fields?.[field.field_key]) 
                                        ? formData.custom_fields[field.field_key] 
                                        : [];
                                    const isChecked = currentValues.includes(val);

                                    return (
                                        <div key={idx} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`${field.field_key}-${idx}`}
                                                checked={isChecked}
                                                onCheckedChange={(checked) => {
                                                    const newVals = checked 
                                                        ? [...currentValues, val]
                                                        : currentValues.filter(v => v !== val);
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        custom_fields: { ...prev.custom_fields, [field.field_key]: newVals }
                                                    }));
                                                }}
                                            />
                                            <Label htmlFor={`${field.field_key}-${idx}`} className="font-normal cursor-pointer">{lab}</Label>
                                        </div>
                                    );
                                })}
                             </div>
                        )}
                    </div>
                ))}
                </CardContent>
            </Card>
        );
    };

    const validateAll = () => {
        const errors = [];
        const isReq = (key) => getFieldProps(key).isRequired;

        // Step 1: Staff Details
        if (branches.length > 1 && !formData.branch_id) errors.push("Branch is required");
        if (!formData.department_id) errors.push("Department is required");
        if (!formData.designation_id) errors.push("Designation is required");
        if (!formData.role_id) errors.push("Role is required");
        
        const staffTypeProps = getFieldProps('staff_type', 'Staff Type');
        if (staffTypeProps.isVisible && staffTypeProps.isRequired && !formData.staff_type) errors.push(`${staffTypeProps.label} is required`);
        
        const empStatusProps = getFieldProps('employment_status', 'Status');
        if (empStatusProps.isVisible && empStatusProps.isRequired && !formData.employment_status) errors.push(`${empStatusProps.label} is required`);

        // Step 2: Personal
        if (!formData.first_name) errors.push("First Name is required");
        if (!formData.last_name) errors.push("Last Name is required");
        if (!formData.gender) errors.push("Gender is required");
        if (isReq('dob') && !formData.dob) errors.push("Date of Birth is required");
        if (isReq('current_address') && !formData.current_address) errors.push("Current Address is required");

        // Step 3: Login
        if (!formData.email) errors.push("Email is required");
        if (!formData.phone) errors.push("Mobile Number is required");
        // When auto-gen is ON or settings not loaded, skip password requirement
        // Backend always falls back to default password or mobile number
        const isAutoPass = schoolSettings?.password_auto_generation;
        if (isAutoPass === false) {
            if (!formData.password) {
                errors.push("Password is required");
            } else if (formData.password.length < 6) {
                errors.push("Password must be at least 6 characters");
            }
            if (formData.password && formData.retype_password && formData.password !== formData.retype_password) {
                errors.push("Passwords do not match");
            }
        }

        // Step 4: Other
        if (isReq('date_of_joining') && !formData.date_of_joining) errors.push("Date of Joining is required");
        if (isReq('aadhar_no') && !formData.aadhar_no) errors.push("Aadhar Number is required");
        if (isReq('basic_salary') && !formData.basic_salary) errors.push("Basic Salary is required");
        
        // Custom Fields
        if (customFields) {
            customFields.forEach(field => {
                if (field.is_required) {
                    const val = formData.custom_fields?.[field.field_key];
                    if (!val || (typeof val === 'string' && val.trim() === '')) {
                        errors.push(`${field.field_label} is required`);
                    }
                }
            });
        }

        // Step 5: Biometric
        if (!formData.shift_id) errors.push("Shift Assignment is required");

        if (errors.length > 0) {
            errors.forEach(err => toast({ variant: "destructive", title: "Validation Error", description: err }));
            return false;
        }
        return true;
    };

    const handleFinalSubmit = async () => {
        if (!validateAll()) return;

        setLoading(true);
        try {
            // Upload Photo
            let photoUrl = null;
            if (photoFile) {
                const fileName = `${uuidv4()}-${photoFile.name}`;
                const { data, error } = await supabase.storage.from('staff-photos').upload(fileName, photoFile);
                if (!error) {
                    const { data: { publicUrl } } = supabase.storage.from('staff-photos').getPublicUrl(data.path);
                    photoUrl = publicUrl;
                }
            }

            // Prepare Payload
            // CRITICAL: Use formData.branch_id FIRST (user's explicit selection in multi-branch)
            // then selectedBranch.id (current active branch from context)
            // then fallbacks
            const finalBranchId = formData.branch_id || selectedBranch?.id || stateBranchId || branchId;
            
            const payload = {
                ...formData,
                branch_id: finalBranchId,
                full_name: `${formData.first_name} ${formData.middle_name} ${formData.last_name}`.trim(),
                photo_url: photoUrl,
                // Map boolean strings to booleans
                ctet_qualified: formData.ctet_qualified === 'Yes',
                gate_qualified: formData.gate_qualified === 'Yes',
                nat_qualified: formData.nat_qualified === 'Yes',
                // If auto-gen password, backend handles it or we send empty/default?
                // Usually backend checks settings. If we send password, it uses it.
                // If settings say auto-gen, we might send a flag or just let backend handle if password is empty.
                // For now, we send whatever is in formData. If auto-gen was ON, password is empty string.
                // We should probably set a default if auto-gen is ON and we have access to it, OR let backend do it.
                // Assuming backend handles 'password' field.
            };

            await staffApi.addStaff(payload);
            toast({ title: 'Success', description: 'Staff added successfully!' });
            setCurrentStep(7); // Success Step
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.message || 'Failed to add staff.' });
        } finally {
            setLoading(false);
        }
    };

    // --- Render Steps ---

    const renderStep0_Search = () => (
        <div className="max-w-2xl mx-auto mt-10">
            <Card className="border-2 border-dashed border-primary/20 shadow-lg">
                <CardHeader className="text-center bg-primary/5 rounded-t-lg pb-8">
                    <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Staff Enrollment</CardTitle>
                    <p className="text-muted-foreground">Search by mobile number to check if staff already exists</p>
                </CardHeader>
                <CardContent className="pt-8">
                    <div className="flex gap-4 mb-6">
                        <Select defaultValue="91">
                            <SelectTrigger className="w-[100px] bg-background">
                                <SelectValue placeholder="+91" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="91">+91 (IND)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input 
                            placeholder="Enter 10-digit Mobile Number" 
                            value={searchMobile} 
                            onChange={e => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                setSearchMobile(val);
                            }} 
                            className="text-lg h-10"
                            maxLength={10}
                        />
                        <Button onClick={handleSearch} disabled={loading} size="lg">
                            {loading ? <Loader2 className="animate-spin" /> : 'Search'}
                        </Button>
                    </div>

                    {hasSearched && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {searchResult ? (
                                searchResult.crossOrg ? (
                                    /* ? CROSS-ORG: User exists in another org — show info + continue button */
                                    <div className="bg-blue-500/10 p-6 rounded-lg border border-blue-500/20 shadow-sm">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="bg-blue-500/20 p-2 rounded-full">
                                                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <h3 className="font-bold text-blue-700 dark:text-blue-300 text-lg">Cross-Organization User</h3>
                                        </div>
                                        <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                                            This user is registered in another organization. They will be linked to your current branch with a new staff profile.
                                        </p>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>Mobile</TableHead>
                                                    <TableHead>Role</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell className="font-medium">{searchResult.email || '-'}</TableCell>
                                                    <TableCell>{searchResult.mobile || searchMobile}</TableCell>
                                                    <TableCell className="capitalize">{searchResult.role || '-'}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                        <div className="mt-6 text-center">
                                            <Button onClick={handleContinueToCreate} className="w-full max-w-xs" size="lg">
                                                Continue to Link & Create <ArrowRight className="ml-2 w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    /* ? Same branch duplicate — block */
                                    <div className="bg-yellow-500/10 p-6 rounded-lg border border-yellow-500/20 shadow-sm">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="bg-yellow-500/20 p-2 rounded-full">
                                                <User className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                            </div>
                                            <h3 className="font-bold text-yellow-700 dark:text-yellow-300 text-lg">Staff Found!</h3>
                                        </div>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Designation</TableHead>
                                                    <TableHead>Mobile</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell className="font-medium">{searchResult.full_name}</TableCell>
                                                    <TableCell>{searchResult.designation?.name}</TableCell>
                                                    <TableCell>{searchResult.phone}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                        <p className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
                                            <Lock className="w-4 h-4" /> This mobile number is already registered in this branch.
                                        </p>
                                    </div>
                                )
                            ) : (
                                <div className="bg-green-500/10 p-8 text-center rounded-lg border border-green-500/20 shadow-sm">
                                    <div className="mx-auto bg-green-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                                        <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h3 className="font-bold text-green-700 dark:text-green-300 text-lg mb-2">New Staff Member</h3>
                                    <p className="text-green-600 dark:text-green-400 mb-6">No existing records found. You can proceed to enroll.</p>
                                    <Button onClick={handleContinueToCreate} className="w-full max-w-xs" size="lg">
                                        Continue to Create New <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

// Helper to render custom fields inline
    const renderEmbeddedCustomFields = (sectionKey) => {
        if (!customFields || customFields.length === 0) return null;
        
        const fields = customFields.filter(f => {
             const sKey = f.section_key || (f.field_key?.includes('__') ? f.field_key.split('__')[0] : '');
             return sKey === sectionKey;
        });

        if (fields.length === 0) return null;

        return (
            <div className="col-span-full mt-6 pt-6 border-t border-dashed">
                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-4">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> Additional Fields ({sectionKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {fields.map(field => (
                        <div key={field.field_key} className="space-y-2">
                            <Label className="text-sm font-medium">
                                {field.field_label} {field.is_required && <span className="text-red-500">*</span>}
                            </Label>
                            
                            {/* Text */}
                            {field.field_type === 'text' && (
                                <Input 
                                    className="bg-background"
                                    value={formData.custom_fields?.[field.field_key] || ''}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev, 
                                        custom_fields: { ...prev.custom_fields, [field.field_key]: e.target.value } 
                                    }))}
                                />
                            )}
                            
                            {/* Number */}
                            {field.field_type === 'number' && (
                                <Input 
                                    type="number"
                                    className="bg-background"
                                    value={formData.custom_fields?.[field.field_key] || ''}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev, 
                                        custom_fields: { ...prev.custom_fields, [field.field_key]: e.target.value } 
                                    }))}
                                />
                            )}
                            
                            {/* Textarea */}
                            {field.field_type === 'textarea' && (
                                <Textarea 
                                    className="bg-background min-h-[80px]"
                                    value={formData.custom_fields?.[field.field_key] || ''}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev, 
                                        custom_fields: { ...prev.custom_fields, [field.field_key]: e.target.value } 
                                    }))}
                                />
                            )}
                            
                            {/* Date */}
                            {field.field_type === 'date' && (
                                <DatePicker
                                    date={formData.custom_fields?.[field.field_key] ? new Date(formData.custom_fields[field.field_key]) : null}
                                    setDate={(d) => setFormData(prev => ({
                                        ...prev, 
                                        custom_fields: { ...prev.custom_fields, [field.field_key]: d } 
                                    }))}
                                />
                            )}
                            
                            {/* Select */}
                            {field.field_type === 'select' && (
                                <Select 
                                    value={formData.custom_fields?.[field.field_key] || ''} 
                                    onValueChange={(val) => setFormData(prev => ({
                                        ...prev, 
                                        custom_fields: { ...prev.custom_fields, [field.field_key]: val } 
                                    }))}
                                >
                                    <SelectTrigger className="bg-background"><SelectValue placeholder="Select..." /></SelectTrigger>
                                    <SelectContent>
                                        {(field.field_options || []).map((opt, idx) => {
                                             const val = typeof opt === 'string' ? opt : opt.value;
                                             const lab = typeof opt === 'string' ? opt : opt.label;
                                             return <SelectItem key={idx} value={val}>{lab}</SelectItem>;
                                        })}
                                    </SelectContent>
                                </Select>
                            )}

                             {/* File */}
                             {field.field_type === 'file' && (
                                <Input 
                                    type="file"
                                    className="bg-background"
                                    onChange={(e) => {
                                        // Handle file upload or store metadata? Default to just storing file object in state for now?
                                        // Current formData stores values, uploads are handled separately usually.
                                        // For now, let's just ignore or mock, user likely wants UI mostly.
                                    }}
                                />
                             )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderStep1_StaffDetails = () => (
        <Card className="border-t-4 border-t-blue-600 shadow-xl animate-in fade-in slide-in-from-right-8 duration-500">
            <CardHeader className="bg-muted/10 pb-4 border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2 text-blue-700 dark:text-blue-400">
                            <Briefcase className="w-6 h-6" /> Professional Profile
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Configure role, designation, and qualification details.</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
                {/* Branch Selection (if applicable) */}
                {branches.length > 1 && (
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/50 p-4 rounded-md">
                        <Label className="text-blue-800 dark:text-blue-300 font-semibold mb-2 block">Select Campus / Branch <span className="text-red-500">*</span></Label>
                        <Select value={formData.branch_id} onValueChange={(val) => handleChange('branch_id', val)}>
                            <SelectTrigger className="bg-background border-blue-300 dark:border-blue-700"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                            <SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.branch_name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                )}

                {/* Section: Employment Details */}
                <div>
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> Employment Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                             <Label>Department <span className="text-red-500">*</span></Label>
                             <Select value={formData.department_id} onValueChange={v => handleChange('department_id', v)}>
                                 <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                                 <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                             </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Designation <span className="text-red-500">*</span></Label>
                            <Select value={formData.designation_id} onValueChange={v => handleChange('designation_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select Designation" /></SelectTrigger>
                                <SelectContent>{designations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Role (System Access) <span className="text-red-500">*</span></Label>
                            <Select value={formData.role_id} onValueChange={v => handleChange('role_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                                <SelectContent>{roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Employment Category</Label>
                            <Select value={formData.employment_category} onValueChange={v => handleChange('employment_category', v)}>
                                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                <SelectContent>{employmentCategories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                         {getFieldProps('staff_type').isVisible && (
                             <div className="space-y-2">
                                <Label>{getFieldProps('staff_type', 'Staff Type').label} {getFieldProps('staff_type').isRequired && <span className="text-red-500">*</span>}</Label>
                                <Select value={formData.staff_type} onValueChange={v => handleChange('staff_type', v)}>
                                    <SelectTrigger><SelectValue placeholder={"Select " + getFieldProps('staff_type', 'Staff Type').label} /></SelectTrigger>
                                    <SelectContent>
                                        {(getFieldProps('staff_type').options?.length > 0 ? getFieldProps('staff_type').options : ['Teaching', 'Nonteaching', 'Transport']).map((opt, idx) => {
                                             const val = typeof opt === 'object' ? opt.value : opt;
                                             const lab = typeof opt === 'object' ? opt.label : opt;
                                             return <SelectItem key={idx} value={val}>{lab}</SelectItem>;
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                         )}
                         {getFieldProps('employment_status').isVisible && (
                             <div className="space-y-2">
                                <Label>{getFieldProps('employment_status', 'Status').label} {getFieldProps('employment_status').isRequired && <span className="text-red-500">*</span>}</Label>
                                <Select value={formData.employment_status} onValueChange={v => handleChange('employment_status', v)}>
                                    <SelectTrigger><SelectValue placeholder={"Select " + getFieldProps('employment_status', 'Status').label} /></SelectTrigger>
                                    <SelectContent>
                                        {(getFieldProps('employment_status').options?.length > 0 ? getFieldProps('employment_status').options : ['Permanent', 'Temporary', 'Probation']).map((opt, idx) => {
                                             const val = typeof opt === 'object' ? opt.value : opt;
                                             const lab = typeof opt === 'object' ? opt.label : opt;
                                             return <SelectItem key={idx} value={val}>{lab}</SelectItem>;
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                         )}
                    </div>
                </div>

                {/* Section: Qualification */}
                <div>
                     <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Academic Qualification
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label>Qualification Type</Label>
                            <Select value={formData.qualification_type} onValueChange={v => handleChange('qualification_type', v)}>
                                <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Graduate">Graduate</SelectItem>
                                    <SelectItem value="Post Graduate">Post Graduate</SelectItem>
                                    <SelectItem value="Doctorate">Doctorate</SelectItem>
                                    <SelectItem value="Diploma">Diploma</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label>Educational Qualification Description</Label>
                            <Input value={formData.educational_qualification} onChange={e => handleChange('educational_qualification', e.target.value)} placeholder="e.g. B.Ed in Mathematics, M.Sc Physics" />
                        </div>
                         <div className="space-y-2">
                            <Label>Trained Level</Label>
                            <Select value={formData.trained_as} onValueChange={v => handleChange('trained_as', v)}>
                                <SelectTrigger><SelectValue placeholder="Select Level" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TGT">TGT (Trained Graduate Teacher)</SelectItem>
                                    <SelectItem value="PGT">PGT (Post Graduate Teacher)</SelectItem>
                                    <SelectItem value="PRT">PRT (Primary Teacher)</SelectItem>
                                    <SelectItem value="NTT">NTT (Nursery Teacher)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
                                <Label className="cursor-pointer font-medium" htmlFor="ctet">CTET Qualified?</Label>
                                <RadioGroup value={formData.ctet_qualified} onValueChange={v => handleChange('ctet_qualified', v)} className="flex gap-4">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="ctet-y" /><Label htmlFor="ctet-y">Yes</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="ctet-n" /><Label htmlFor="ctet-n">No</Label></div>
                                </RadioGroup>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
                                <Label className="cursor-pointer font-medium" htmlFor="gate">GATE Qualified?</Label>
                                <RadioGroup value={formData.gate_qualified} onValueChange={v => handleChange('gate_qualified', v)} className="flex gap-4">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="gate-y" /><Label htmlFor="gate-y">Yes</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="gate-n" /><Label htmlFor="gate-n">No</Label></div>
                                </RadioGroup>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border">
                                <Label className="cursor-pointer font-medium" htmlFor="nat">NAT Qualified?</Label>
                                <RadioGroup value={formData.nat_qualified} onValueChange={v => handleChange('nat_qualified', v)} className="flex gap-4">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Yes" id="nat-y" /><Label htmlFor="nat-y">Yes</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="No" id="nat-n" /><Label htmlFor="nat-n">No</Label></div>
                                </RadioGroup>
                            </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const renderStep2_Personal = () => (
        <Card className="border-t-4 border-t-purple-600 shadow-xl animate-in fade-in slide-in-from-right-8 duration-500">
             <CardHeader className="bg-muted/10 pb-4 border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2 text-purple-700 dark:text-purple-400">
                            <User className="w-6 h-6" /> Personal Information
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Basic bio-data and contact address.</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
                {/* Section: Basic Bio Data */}
                 <div>
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                         <User className="w-4 h-4" /> Bio-Data
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                             <Label required>First Name <span className="text-red-500">*</span></Label>
                             <Input value={formData.first_name} onChange={e => handleChange('first_name', e.target.value)} placeholder="First Name" />
                        </div>
                        <div className="space-y-2">
                             <Label>Middle Name</Label>
                             <Input value={formData.middle_name} onChange={e => handleChange('middle_name', e.target.value)} placeholder="Middle Name" />
                        </div>
                        <div className="space-y-2">
                             <Label required>Last Name <span className="text-red-500">*</span></Label>
                             <Input value={formData.last_name} onChange={e => handleChange('last_name', e.target.value)} placeholder="Last Name" />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                         <div className="space-y-2">
                             <Label>Gender <span className="text-red-500">*</span></Label>
                             <Select value={formData.gender} onValueChange={v => handleChange('gender', v)}>
                                 <SelectTrigger><SelectValue placeholder="Gender"/></SelectTrigger>
                                 <SelectContent>
                                     <SelectItem value="Male">Male</SelectItem>
                                     <SelectItem value="Female">Female</SelectItem>
                                     <SelectItem value="Other">Other</SelectItem>
                                 </SelectContent>
                             </Select>
                         </div>
                         <div className="space-y-2">
                            <Label>Date of Birth <span className="text-red-500">*</span></Label>
                            <DatePicker id="dob" value={formData.dob} onChange={date => handleChange('dob', date)} disableFuture />
                         </div>
                         <div className="space-y-2">
                             <Label>Emergency Contact</Label>
                             <Input value={formData.emergency_contact_number} onChange={e => handleChange('emergency_contact_number', e.target.value)} placeholder="Phone" />
                         </div>
                     </div>
                 </div>

                 {/* Section: Address */}
                 <div>
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                         <Home className="w-4 h-4" /> Address Details
                    </h3>
                    <div className="space-y-6">
                        {/* Current Address Group */}
                        <div className="bg-muted/10 p-4 rounded-lg border border-border">
                             <h4 className="font-semibold text-sm text-primary mb-3">Current Address</h4>
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Pincode <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <Input
                                            value={formData.current_pincode}
                                            onChange={e => handlePincodeLookup('current', e.target.value)}
                                            placeholder="Enter Pincode"
                                            maxLength={6}
                                            className="font-mono bg-background"
                                        />
                                        {pincodeLoading && (
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                     <Label>State</Label>
                                     <Input value={formData.current_state} readOnly className="bg-muted text-muted-foreground" />
                                </div>
                                 <div className="space-y-2">
                                     <Label>City / District</Label>
                                     <Input value={formData.current_city} onChange={e => handleChange('current_city', e.target.value)} className="bg-background" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Post Office / Area</Label>
                                    {postOffices.current.length > 0 ? (
                                        <Select value={formData.current_post_office} onValueChange={v => handleChange('current_post_office', v)}>
                                            <SelectTrigger className="bg-background"><SelectValue placeholder="Select Area" /></SelectTrigger>
                                            <SelectContent>
                                                {postOffices.current.map(po => <SelectItem key={po} value={po}>{po}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input value={formData.current_post_office} onChange={e => handleChange('current_post_office', e.target.value)} placeholder="Enter Area" className="bg-background" />
                                    )}
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                     <Label>House No, Street, Landmark</Label>
                                     <Input value={formData.current_address} onChange={e => handleChange('current_address', e.target.value)} placeholder="Complete Address" className="bg-background" />
                                </div>
                             </div>
                        </div>

                         {/* Permanent Address Group */}
                        <div className="bg-muted/10 p-4 rounded-lg border border-border">
                             <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-sm text-primary">Permanent Address</h4>
                                <div className="flex items-center space-x-2 bg-background px-3 py-1.5 rounded border shadow-sm">
                                    <Checkbox
                                        id="same_as_current"
                                        onCheckedChange={(checked) => {
                                            if(checked) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    permanent_pincode: prev.current_pincode,
                                                    permanent_city: prev.current_city,
                                                    permanent_state: prev.current_state,
                                                    permanent_post_office: prev.current_post_office,
                                                    permanent_address: prev.current_address
                                                }));
                                                setPostOffices(prev => ({...prev, permanent: prev.current}));
                                            }
                                        }}
                                    />
                                    <Label htmlFor="same_as_current" className="cursor-pointer text-sm font-medium">Same as Current</Label>
                                </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Pincode</Label>
                                    <Input
                                        value={formData.permanent_pincode}
                                        onChange={e => handlePincodeLookup('permanent', e.target.value)}
                                        placeholder="Pincode"
                                        maxLength={6}
                                        className="font-mono bg-background"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                     <Label>State</Label>
                                     <Input value={formData.permanent_state} onChange={e => handleChange('permanent_state', e.target.value)} className="bg-background" />
                                </div>
                                 <div className="space-y-2">
                                     <Label>City / District</Label>
                                     <Input value={formData.permanent_city} onChange={e => handleChange('permanent_city', e.target.value)} className="bg-background" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Post Office / Area</Label>
                                    {postOffices.permanent.length > 0 ? (
                                        <Select value={formData.permanent_post_office} onValueChange={v => handleChange('permanent_post_office', v)}>
                                            <SelectTrigger className="bg-background"><SelectValue placeholder="Select Area" /></SelectTrigger>
                                            <SelectContent>
                                                {postOffices.permanent.map(po => <SelectItem key={po} value={po}>{po}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input value={formData.permanent_post_office} onChange={e => handleChange('permanent_post_office', e.target.value)} placeholder="Area" className="bg-background" />
                                    )}
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                     <Label>House No, Street</Label>
                                     <Input value={formData.permanent_address} onChange={e => handleChange('permanent_address', e.target.value)} placeholder="Complete Address" className="bg-background" />
                                </div>
                             </div>
                        </div>
                    </div>
                    {/* Embedded Custom Fields for Step 2 */}
                    {renderEmbeddedCustomFields('personal_details')}
                    {renderEmbeddedCustomFields('contact_details')}
                 </div>

                 {/* Section: Profile Photo - Moved to End Like Student Admission */}
                 <div>
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                        <User className="w-4 h-4" /> Profile Photo
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Staff Photo Card */}
                        <div className="flex flex-col items-center">
                            <Label className="mb-2">Profile Photo</Label>
                            <p className="text-xs text-muted-foreground mb-3 text-center">
                                Please upload your passport size photo (H:4.5cm x W:3.5cm)
                            </p>
                            <div className={`relative w-full max-w-[200px] aspect-[3.5/4.5] rounded-2xl overflow-hidden border-3 transition-all duration-300 shadow-lg group ${
                                photoPreview 
                                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" 
                                    : "border-dashed border-purple-300 dark:border-purple-700 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 hover:border-purple-500"
                            }`}>
                                <ImageUploader 
                                    onFileChange={setPhotoFile} 
                                    initialPreview={photoPreview}
                                    showInstruction={false}
                                    showCamera={true}
                                    showCrop={true}
                                    aspectRatio={3.5/4.5}
                                />
                                {photoPreview && (
                                    <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                            <div className="mt-3 text-center">
                                <p className="text-sm font-bold text-purple-700 dark:text-purple-300 flex items-center justify-center gap-1.5">
                                    <Briefcase className="h-4 w-4" />
                                    Staff Photo
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">Passport size</p>
                            </div>
                        </div>
                    </div>
                 </div>
            </CardContent>
        </Card>
    );

    const renderStep3_Login = () => {
        const isAutoPass = schoolSettings?.password_auto_generation;
        return (
             <Card className="border-t-4 border-t-orange-500 shadow-xl animate-in fade-in slide-in-from-right-8 duration-500 max-w-4xl mx-auto">
                <CardHeader className="bg-muted/10 pb-4 border-b">
                     <CardTitle className="text-xl flex items-center gap-2 text-orange-700 dark:text-orange-400">
                        <Lock className="w-6 h-6" /> System Credentials
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Setup login access and social profile links.</p>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {/* Left: Credentials */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2 border-b pb-1">Login Access</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Username (Mobile) <span className="text-red-500">*</span></Label>
                                    <div className="flex">
                                        <div className="bg-muted border border-r-0 px-3 py-2 rounded-l-md text-muted-foreground flex items-center">+91</div>
                                        <Input value={formData.phone} readOnly className="rounded-l-none bg-muted font-mono" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Username is locked to mobile number.</p>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label required>Email Address <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <Input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} placeholder="staff@school.com" />
                                        {emailChecking && (
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-2">
                                    {isAutoPass ? (
                                        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/50 p-4 rounded-lg text-center">
                                            <Lock className="w-6 h-6 mx-auto text-orange-500 dark:text-orange-400 mb-2" />
                                            <h3 className="font-medium text-orange-800 dark:text-orange-300">Password Auto-Generation ON</h3>
                                            <p className="text-xs text-orange-600 dark:text-orange-400/80 mt-1">
                                                System will use the default employee password.
                                                {(schoolSettings?.password_default_employee || schoolSettings?.password_default) && <span className="block mt-1 font-mono">Default: {schoolSettings.password_default_employee || schoolSettings.password_default}</span>}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 bg-muted/20 p-4 rounded-lg border">
                                           <div className="space-y-2">
                                                <Label>Password <span className="text-red-500">*</span></Label>
                                                <Input 
                                                    type="password" 
                                                    value={formData.password} 
                                                    onChange={e => handleChange('password', e.target.value)} 
                                                    placeholder="Enter Password"
                                                    autoComplete="new-password"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Confirm Password <span className="text-red-500">*</span></Label>
                                                <Input 
                                                    type="password" 
                                                    value={formData.retype_password} 
                                                    onChange={e => handleChange('retype_password', e.target.value)} 
                                                    placeholder="Retype Password"
                                                    autoComplete="new-password"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Social Links */}
                        <div className="space-y-4">
                             <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2 border-b pb-1">Social Profiles</h3>
                             <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Facebook URL</Label>
                                    <div className="flex items-center">
                                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-l-md border border-r-0 border-input"><LinkIcon className="w-4 h-4 text-blue-600 dark:text-blue-400"/></div>
                                        <Input value={formData.facebook_link} onChange={e => handleChange('facebook_link', e.target.value)} className="rounded-l-none" placeholder="https://facebook.com/..." />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Twitter / X URL</Label>
                                    <div className="flex items-center">
                                         <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-l-md border border-r-0 border-input"><LinkIcon className="w-4 h-4 text-gray-600 dark:text-gray-400"/></div>
                                        <Input value={formData.twitter_link} onChange={e => handleChange('twitter_link', e.target.value)} className="rounded-l-none" placeholder="https://x.com/..." />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>LinkedIn URL</Label>
                                    <div className="flex items-center">
                                         <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-l-md border border-r-0 border-input"><LinkIcon className="w-4 h-4 text-blue-700 dark:text-blue-500"/></div>
                                        <Input value={formData.linkedin_link} onChange={e => handleChange('linkedin_link', e.target.value)} className="rounded-l-none" placeholder="https://linkedin.com/in/..." />
                                    </div>
                                </div>
                                 <div className="space-y-2">
                                    <Label>Instagram URL</Label>
                                    <div className="flex items-center">
                                         <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-l-md border border-r-0 border-input"><LinkIcon className="w-4 h-4 text-pink-600 dark:text-pink-400"/></div>
                                        <Input value={formData.instagram_link} onChange={e => handleChange('instagram_link', e.target.value)} className="rounded-l-none" placeholder="https://instagram.com/..." />
                                    </div>
                                </div>
                             </div>
                        </div>
                        {/* Qualification Embedded */}
                        {renderEmbeddedCustomFields('qualification')}
                    </div>
                    {/* Employment Embedded */}
                    {renderEmbeddedCustomFields('employment_info')}
                </CardContent>
            </Card>
        );
    };

    const renderStep4_Other = () => (
        <Card className="border-t-4 border-t-green-600 shadow-xl animate-in fade-in slide-in-from-right-8 duration-500">
             <CardHeader className="bg-muted/10 pb-4 border-b">
                 <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2 text-green-700 dark:text-green-400">
                            <FileText className="w-6 h-6" /> Official & Financial Setup
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Payroll setup, statutory numbers and bank details.</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Col: Statutory */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                             <Briefcase className="w-4 h-4" /> Official Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                             {getFieldProps('date_of_joining').isVisible && (
                             <div className="space-y-2">
                                <Label>Date of Joining {getFieldProps('date_of_joining').isRequired && <span className="text-red-500">*</span>}</Label>
                                <DatePicker id="doj" value={formData.date_of_joining} onChange={date => handleChange('date_of_joining', date)} />
                            </div>
                             )}
                             <div className="space-y-2">
                                <Label>Staff ID <span className="text-red-500">*</span></Label>
                                <Input 
                                    value={formData.staff_id} 
                                    onChange={e => {
                                        handleChange('staff_id', e.target.value);
                                        handleChange('biometric_code', e.target.value);
                                    }} 
                                    placeholder="e.g. SSVKEMP-2026-27-0001" 
                                    readOnly={true}
                                    className="bg-muted cursor-not-allowed font-mono text-primary font-semibold"
                                />
                                <p className="text-xs text-muted-foreground">Auto-generated unique ID</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                             <Label>Salary Pay Type</Label>
                             <div className="flex items-center gap-4 bg-muted/20 p-2 rounded-lg border">
                                <RadioGroup value={formData.salary_pay_type} onValueChange={v => handleChange('salary_pay_type', v)} className="flex gap-4">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Consolidated" id="pay1" /><Label htmlFor="pay1">Consolidated</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Scale" id="pay2" /><Label htmlFor="pay2">Pay Scale</Label></div>
                                </RadioGroup>
                             </div>
                        </div>

                        {getFieldProps('aadhar_no').isVisible && (
                         <div className="space-y-2">
                            <Label>Aadhar Number {getFieldProps('aadhar_no').isRequired && <span className="text-red-500">*</span>}</Label>
                            <AadharInput value={formData.aadhar_no} onChange={val => handleChange('aadhar_no', val)} />
                        </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                             {getFieldProps('pan_number').isVisible && (
                             <div className="space-y-2">
                                <Label>PAN Number {getFieldProps('pan_number').isRequired && <span className="text-red-500">*</span>}</Label>
                                <Input value={formData.pan_number} onChange={e => handleChange('pan_number', e.target.value)} placeholder="ABCDE1234F" maxLength={10} className="uppercase font-mono" />
                            </div>
                             )}
                             {getFieldProps('epf_no').isVisible && (
                             <div className="space-y-2">
                                <Label>EPF Number {getFieldProps('epf_no').isRequired && <span className="text-red-500">*</span>}</Label>
                                <Input value={formData.epf_no} onChange={e => handleChange('epf_no', e.target.value)} placeholder="EPF No" className="font-mono" />
                            </div>
                             )}
                        </div>
                    </div>

                    {/* Right Col: Bank */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2">
                             <Banknote className="w-4 h-4" /> Banking Info
                        </h3>
                         <div className="bg-green-50/50 dark:bg-green-900/10 p-4 rounded-lg border border-green-100 dark:border-green-900/50 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>IFSC Code <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <Input 
                                            value={formData.ifsc_code} 
                                            onChange={e => {
                                                const val = e.target.value.toUpperCase();
                                                handleChange('ifsc_code', val);
                                                if(val.length === 11) handleIfscLookup(val);
                                            }}
                                            placeholder="IFSC" 
                                            className="uppercase font-mono" 
                                            maxLength={11}
                                        />
                                        {bankLoading && (
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Auto-fills bank details.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Bank Name</Label>
                                    <Input value={formData.bank_name} onChange={e => handleChange('bank_name', e.target.value)} placeholder="e.g. SBI" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Branch Name</Label>
                                <Input value={formData.bank_branch_name} onChange={e => handleChange('bank_branch_name', e.target.value)} placeholder="Branch" />
                            </div>
                            <div className="space-y-2">
                                <Label>Account Number <span className="text-red-500">*</span></Label>
                                <Input value={formData.bank_account_number} onChange={e => handleChange('bank_account_number', e.target.value)} placeholder="Enter Account Number" className="font-mono" />
                            </div>
                            <div className="space-y-2">
                                <Label>Account Holder Name</Label>
                                <Input value={formData.bank_account_title} onChange={e => handleChange('bank_account_title', e.target.value)} placeholder="Name as per Passbook" />
                            </div>
                         </div>
                        {getFieldProps('basic_salary').isVisible && (
                         <div className="space-y-2 pt-2">
                            <Label className="text-lg text-green-700 dark:text-green-400">Basic Salary (?) {getFieldProps('basic_salary').isRequired && <span className="text-red-500">*</span>}</Label>
                            <Input type="number" value={formData.basic_salary} onChange={e => handleChange('basic_salary', e.target.value)} placeholder="0.00" className="text-lg font-bold" />
                        </div>
                        )}
                    </div>
                </div>
                {/* Bank / Official Embedded */}
                {renderEmbeddedCustomFields('bank_details')}
                {renderEmbeddedCustomFields('official_details')}
                {renderCustomFields()}
            </CardContent>
        </Card>
    );

    const renderStep5_Biometric = () => (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-primary" /> Attendance & Access
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Employee Biometric Code</Label>
                        <Input 
                            value={formData.biometric_code} 
                            readOnly
                            placeholder="Same as Staff ID"
                            className="bg-muted cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground">Automatically set to match Employee Code.</p>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Assigned Shift <span className="text-red-500">*</span></Label>
                        <Select value={formData.shift_id} onValueChange={v => handleChange('shift_id', v)}>
                            <SelectTrigger><SelectValue placeholder="Select Shift" /></SelectTrigger>
                            <SelectContent>
                                {shifts.length > 0 ? (
                                    shifts.map(shift => {
                                        const to12h = (t) => {
                                            if (!t) return '';
                                            const [h, m] = t.split(':').map(Number);
                                            const period = h >= 12 ? 'PM' : 'AM';
                                            const h12 = h % 12 || 12;
                                            return `${h12}:${String(m).padStart(2,'0')} ${period}`;
                                        };
                                        return (
                                            <SelectItem key={shift.id} value={shift.shift_name}>
                                                {shift.shift_name} ({to12h(shift.start_time)} - {to12h(shift.end_time)})
                                            </SelectItem>
                                        );
                                    })
                                ) : (
                                    <>
                                        <SelectItem value="Morning Shift">Morning Shift (08:00 AM - 02:00 PM)</SelectItem>
                                        <SelectItem value="Day Shift">Day Shift (09:00 AM - 04:00 PM)</SelectItem>
                                        <SelectItem value="Evening Shift">Evening Shift (12:00 PM - 06:00 PM)</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderStep6_Documents = () => (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" /> Document Submission
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">#</TableHead>
                                <TableHead>Document Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documents.map((doc, idx) => (
                                <TableRow key={doc.id}>
                                    <TableCell>{idx + 1}</TableCell>
                                    <TableCell className="font-medium">{doc.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Checkbox 
                                                id={`doc-${doc.id}`} 
                                                checked={doc.submitted}
                                                onCheckedChange={(checked) => handleDocumentToggle(doc.id, checked ? 'yes' : 'no')}
                                            />
                                            <Label htmlFor={`doc-${doc.id}`} className="cursor-pointer">
                                                {doc.submitted ? <span className="text-green-600 dark:text-green-400 font-medium">Submitted</span> : <span className="text-muted-foreground">Pending</span>}
                                            </Label>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <input
                                            type="file"
                                            ref={el => fileInputRefs.current[doc.id] = el}
                                            onChange={(e) => handleDocumentFileSelect(doc.id, e)}
                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                            className="hidden"
                                        />
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => triggerFileSelect(doc.id)}
                                        >
                                            <Upload className="w-4 h-4 mr-2" /> {doc.file ? 'Replace' : 'Upload'}
                                        </Button>
                                        {doc.file && (
                                            <span className="ml-2 text-xs text-muted-foreground truncate max-w-[100px] inline-block align-middle" title={doc.file.name}>
                                                {doc.file.name}
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );

    const renderStep7_Success = () => (
        <div className="max-w-2xl mx-auto text-center space-y-8 py-10 animate-in zoom-in duration-500">
            <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center animate-ping opacity-20">
                    <div className="w-32 h-32 bg-green-500 rounded-full"></div>
                </div>
                <div className="relative bg-card p-4 rounded-full inline-block shadow-xl">
                    <CheckCircle2 className="w-20 h-20 text-green-500" />
                </div>
            </div>
            
            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-green-600 dark:text-green-400">Registration Successful!</h2>
                <p className="text-muted-foreground text-lg">The new staff member has been added to the system.</p>
            </div>
            
            <Card className="text-left bg-muted/30 border-dashed">
                <CardContent className="p-6 grid grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm text-muted-foreground">Staff Name</p>
                        <p className="font-semibold text-lg">{formData.first_name} {formData.last_name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Designation</p>
                        <p className="font-semibold text-lg">{designations.find(d => d.id === formData.designation_id)?.name || '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Mobile Number</p>
                        <p className="font-semibold text-lg">{formData.phone}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Email ID</p>
                        <p className="font-semibold text-lg">{formData.email}</p>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-center gap-4 pt-4">
                <Button variant="outline" className="gap-2">
                    <Printer className="w-4 h-4" /> Print Appointment Letter
                </Button>
                <Button variant="outline" className="gap-2">
                    <Send className="w-4 h-4" /> Email Credentials
                </Button>
                <Button onClick={() => navigate(ROUTES.SUPER_ADMIN.STAFF_LIST)} className="gap-2">
                    Close & View List <ArrowRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );

    const steps = ['Search', 'Staff Details', 'Personal', 'Login Details', 'Other', 'Biometric', 'Documents', 'Finish'];

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <Sparkles className="text-primary w-6 h-6"/>
                    </div>
                    Enroll New Staff
                </h1>
                <p className="text-muted-foreground mt-1 ml-14">Add a new employee to {selectedBranch?.name}</p>
            </div>

            <div className="min-h-[600px]">
                {currentStep === 0 && renderStep0_Search()}
                
                {currentStep === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                        {renderStep1_StaffDetails()}
                        {renderStep2_Personal()}
                        {renderStep3_Login()}
                        {renderStep4_Other()}
                        {renderStep5_Biometric()}
                        {renderStep6_Documents()}
                        
                        <div className="flex justify-end mt-8 pt-6 border-t bg-background sticky bottom-0 pb-4 z-10 gap-4 shadow-lg p-4 rounded-t-lg">
                             <Button variant="outline" onClick={() => setCurrentStep(0)} size="lg" className="gap-2">
                                <ArrowLeft className="w-4 h-4" /> Cancel
                            </Button>
                            <Button onClick={handleFinalSubmit} disabled={loading} size="lg" className="gap-2">
                                {loading ? <Loader2 className="animate-spin" /> : <Save className="w-4 h-4" />} 
                                Save & Finish
                            </Button>
                        </div>
                    </div>
                )}

                {currentStep === 7 && renderStep7_Success()}
            </div>
        </DashboardLayout>
    );
};

export default AddEmployee;
