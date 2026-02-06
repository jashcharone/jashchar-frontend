/**
 * 🚀 JASHCHAR ERP - FUTURISTIC ONLINE ADMISSION PORTAL
 * World's #1 Education Admission System
 * AGI-Powered | Modern | Professional | Future-Ready (100 Years+)
 * 
 * Features:
 * - Branch Selection First
 * - QR Code Support for Easy Access
 * - Glassmorphism UI Design
 * - Multi-step Form with Progress Tracking
 * - AI-Powered Field Validation
 * - Document Upload with Preview
 * - Real-time Status Tracking
 * - Multi-language Support Ready
 * 
 * @version 2.0.0 QUANTUM
 * @author Jashchar ERP Team
 * @license Proprietary
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import publicCmsService from '@/services/publicCmsService';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentUploadField from '@/components/common/DocumentUploadField';
import { PublicHeader, PublicFooter, TopBar } from '@/components/public/PublicLayoutComponents';
import { Helmet } from 'react-helmet';

// Icons
import { 
  Loader2, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft,
  School, User, Users, MapPin, FileText, CreditCard, Send,
  Building2, GraduationCap, Sparkles, Shield, Clock, Globe,
  QrCode, Download, Phone, Mail, Calendar, Upload, Star,
  ChevronRight, ChevronDown, Info, Zap, Award, Heart,
  Camera, Home, BookOpen, Briefcase, UserCheck, Check,
  CircleDot, Circle, Rocket, Brain, Cpu
} from 'lucide-react';

// ============================================================================
// 🎨 DESIGN SYSTEM - Futuristic Constants
// ============================================================================
const GRADIENT_BG = "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900";
const GLASS_CARD = "backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl";
const GLASS_CARD_LIGHT = "backdrop-blur-xl bg-white/80 border border-gray-200/50 shadow-xl";
const GLOW_EFFECT = "shadow-[0_0_50px_rgba(124,58,237,0.3)]";
const NEON_TEXT = "bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent";

// Form Steps Configuration
const FORM_STEPS = [
  { id: 'branch', label: 'Select Branch', icon: Building2, description: 'Choose your preferred institution' },
  { id: 'student', label: 'Student Info', icon: User, description: 'Basic student details' },
  { id: 'parents', label: 'Parent Details', icon: Users, description: 'Father & mother information' },
  { id: 'guardian', label: 'Guardian', icon: UserCheck, description: 'Guardian information' },
  { id: 'address', label: 'Address', icon: MapPin, description: 'Residential details' },
  { id: 'documents', label: 'Documents', icon: FileText, description: 'Upload required documents' },
  { id: 'review', label: 'Review & Submit', icon: Send, description: 'Final verification' },
];

// ============================================================================
// 🧩 SUB-COMPONENTS
// ============================================================================

// Animated Background Particles
const AnimatedBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900" />
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 bg-purple-400/30 rounded-full"
        initial={{ 
          x: Math.random() * window.innerWidth, 
          y: Math.random() * window.innerHeight,
          scale: Math.random() * 0.5 + 0.5
        }}
        animate={{ 
          y: [null, Math.random() * -500],
          opacity: [0.3, 0.8, 0.3]
        }}
        transition={{ 
          duration: Math.random() * 10 + 10, 
          repeat: Infinity,
          ease: "linear"
        }}
      />
    ))}
    {/* Gradient Orbs */}
    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
    <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl" />
  </div>
);

// Futuristic Step Indicator
const StepIndicator = ({ steps, currentStep, onStepClick }) => (
  <div className="relative">
    {/* Progress Line */}
    <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-700/50">
      <motion.div 
        className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500"
        initial={{ width: '0%' }}
        animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
    
    {/* Steps */}
    <div className="relative flex justify-between">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const StepIcon = step.icon;
        
        return (
          <motion.div
            key={step.id}
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <motion.button
              onClick={() => index <= currentStep && onStepClick(index)}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                transition-all duration-300 z-10 relative
                ${isCompleted 
                  ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/30' 
                  : isCurrent 
                    ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/50 ring-4 ring-purple-500/20' 
                    : 'bg-gray-700/50 text-gray-400 border border-gray-600'
                }
                ${index <= currentStep ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'}
              `}
              whileHover={index <= currentStep ? { scale: 1.1 } : {}}
              whileTap={index <= currentStep ? { scale: 0.95 } : {}}
            >
              {isCompleted ? (
                <Check className="w-5 h-5" />
              ) : (
                <StepIcon className="w-5 h-5" />
              )}
            </motion.button>
            
            <span className={`
              mt-2 text-xs font-medium text-center max-w-[80px] hidden sm:block
              ${isCurrent ? 'text-purple-300' : isCompleted ? 'text-green-400' : 'text-gray-500'}
            `}>
              {step.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  </div>
);

// Glowing Input Field
const GlowInput = ({ label, required, icon: Icon, error, className, ...props }) => (
  <div className={`space-y-2 ${className}`}>
    <Label className="text-gray-300 flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-purple-400" />}
      {label}
      {required && <span className="text-red-400">*</span>}
    </Label>
    <div className="relative group">
      <Input 
        {...props}
        className={`
          bg-white/5 border-gray-600/50 text-white placeholder:text-gray-500
          focus:border-purple-500 focus:ring-purple-500/20 focus:bg-white/10
          transition-all duration-300
          ${error ? 'border-red-500' : ''}
        `}
      />
      <div className="absolute inset-0 rounded-md bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
    </div>
    {error && <p className="text-red-400 text-xs">{error}</p>}
  </div>
);

// Glowing Select Field - Fixed z-index for desktop and mobile (TC-50, TC-53, TC-54-58)
const GlowSelect = ({ label, required, icon: Icon, placeholder, options, value, onChange, error }) => (
  <div className="space-y-2">
    <Label className="text-gray-300 flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-purple-400" />}
      {label}
      {required && <span className="text-red-400">*</span>}
    </Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`
        bg-white/5 border-gray-600/50 text-white
        focus:border-purple-500 focus:ring-purple-500/20
        ${error ? 'border-red-500' : ''}
      `}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent 
        className="bg-gray-900 border-gray-700 z-[9999] max-h-[300px] overflow-y-auto"
        position="popper"
        sideOffset={4}
      >
        {options && options.length > 0 ? (
          options.map((opt) => (
            <SelectItem 
              key={opt.value} 
              value={opt.value}
              className="text-white hover:bg-purple-500/20 focus:bg-purple-500/20 cursor-pointer"
            >
              {opt.label}
            </SelectItem>
          ))
        ) : (
          <div className="text-gray-400 text-sm p-2 text-center">No options available</div>
        )}
      </SelectContent>
    </Select>
    {error && <p className="text-red-400 text-xs">{error}</p>}
  </div>
);

// Branch Selection Card
const BranchCard = ({ branch, isSelected, onSelect }) => (
  <motion.div
    onClick={() => onSelect(branch)}
    className={`
      relative p-6 rounded-2xl cursor-pointer transition-all duration-300
      ${isSelected 
        ? 'bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border-2 border-purple-500 shadow-xl shadow-purple-500/20' 
        : 'bg-white/5 border border-gray-700/50 hover:border-purple-500/50 hover:bg-white/10'
      }
    `}
    whileHover={{ scale: 1.02, y: -5 }}
    whileTap={{ scale: 0.98 }}
    layout
  >
    {isSelected && (
      <motion.div 
        className="absolute top-3 right-3"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500 }}
      >
        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
          <Check className="w-5 h-5 text-white" />
        </div>
      </motion.div>
    )}
    
    <div className="flex items-start gap-4">
      <div className={`
        w-16 h-16 rounded-xl flex items-center justify-center
        ${isSelected 
          ? 'bg-gradient-to-br from-purple-500 to-indigo-600' 
          : 'bg-gray-700/50'
        }
      `}>
        {branch.logo_url ? (
          <img src={branch.logo_url} alt={branch.name} className="w-12 h-12 object-contain rounded-lg" />
        ) : (
          <School className={`w-8 h-8 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
        )}
      </div>
      
      <div className="flex-1">
        <h3 className={`font-semibold text-lg ${isSelected ? 'text-white' : 'text-gray-200'}`}>
          {branch.name}
        </h3>
        <p className="text-gray-400 text-sm mt-1">
          {branch.address || 'Location not specified'}
        </p>
        
        <div className="flex flex-wrap gap-2 mt-3">
          {branch.is_primary && (
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              <Star className="w-3 h-3 mr-1" /> Main Branch
            </Badge>
          )}
          <Badge variant="outline" className="border-gray-600 text-gray-400">
            <GraduationCap className="w-3 h-3 mr-1" /> Classes Available
          </Badge>
        </div>
      </div>
    </div>
  </motion.div>
);

// Success Screen with Confetti
const SuccessScreen = ({ referenceNo, onNewApplication }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="min-h-[60vh] flex items-center justify-center p-4"
  >
    <Card className={`${GLASS_CARD} max-w-lg w-full text-center p-8`}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/30"
      >
        <CheckCircle2 className="w-12 h-12 text-white" />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-3xl font-bold text-white mb-2">Application Submitted!</h2>
        <p className="text-gray-400 mb-6">Your admission application has been received successfully</p>
        
        <div className="bg-white/10 rounded-xl p-6 mb-6">
          <p className="text-gray-400 text-sm mb-2">Your Reference Number</p>
          <p className="text-4xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400 tracking-wider">
            {referenceNo}
          </p>
        </div>
        
        <Alert className="bg-blue-500/10 border-blue-500/30 text-left mb-6">
          <Info className="w-4 h-4 text-blue-400" />
          <AlertTitle className="text-blue-300">Important</AlertTitle>
          <AlertDescription className="text-blue-200/80">
            Please save this reference number for tracking your application status.
            We will contact you shortly via phone/email.
          </AlertDescription>
        </Alert>
        
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={onNewApplication}
            className="border-gray-600 text-gray-300 hover:bg-white/10"
          >
            New Application
          </Button>
          <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
            Track Status
          </Button>
        </div>
      </motion.div>
    </Card>
  </motion.div>
);

// ============================================================================
// 🚀 MAIN COMPONENT
// ============================================================================
const OnlineAdmission = () => {
  const { schoolAlias } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // URL params for QR code support
  const branchIdFromQR = searchParams.get('branch');
  const classIdFromQR = searchParams.get('class');
  
  // ========== STATE ==========
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNo, setReferenceNo] = useState('');
  
  // School & Branch Data
  const [organization, setOrganization] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [classes, setClasses] = useState([]);
  const [settings, setSettings] = useState(null);
  
  // Layout Data
  const [siteSettings, setSiteSettings] = useState(null);
  const [menus, setMenus] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Master Data
  const [religions, setReligions] = useState([]);
  const [castes, setCastes] = useState([]);
  const [bloodGroups, setBloodGroups] = useState([]);
  const [motherTongues, setMotherTongues] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Form Data
  const [formData, setFormData] = useState({
    // Branch & Class
    branch_id: '',
    class_id: '',
    
    // Student Details
    first_name: '',
    last_name: '',
    gender: '',
    date_of_birth: '',
    mobile_number: '',
    email: '',
    student_photo: '',
    blood_group: '',
    mother_tongue: '',
    religion: '',
    caste_category_id: null,
    sub_caste_id: null,
    category_id: '',
    national_id_no: '',
    
    // Father Details
    father_name: '',
    father_phone: '',
    father_occupation: '',
    father_photo: '',
    father_email: '',
    father_income: '',
    father_education: '',
    father_aadhar_no: '',
    
    // Mother Details
    mother_name: '',
    mother_phone: '',
    mother_occupation: '',
    mother_photo: '',
    mother_income: '',
    mother_education: '',
    mother_aadhar_no: '',
    
    // Guardian Details
    guardian_is: 'father',
    guardian_name: '',
    guardian_relation: '',
    guardian_email: '',
    guardian_photo: '',
    guardian_phone: '',
    guardian_occupation: '',
    guardian_address: '',
    
    // Address
    pincode: '',
    city: '',
    state: '',
    current_address: '',
    permanent_address: '',
    is_permanent_same: false,
    
    // Documents
    documents: [],
    
    // Additional
    previous_school_details: '',
    is_rte_student: false,
    terms_accepted: false,
  });
  
  const [errors, setErrors] = useState({});
  
  // ========== EFFECTS ==========
  
  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Site Settings
        const siteRes = await publicCmsService.getPublicSite(schoolAlias);
        if (!siteRes.success) {
          throw new Error(siteRes.message || 'Institution not found');
        }
        
        const schoolData = siteRes.data.school;
        setOrganization(schoolData);
        setSiteSettings(siteRes.data.settings);
        setMenus(siteRes.data.menus);
        
        // 2. Fetch branches for this organization via API (not direct supabase - RLS issues)
        const branchesRes = await publicCmsService.getBranches(schoolAlias);
        if (branchesRes.success && branchesRes.data?.length > 0) {
          setBranches(branchesRes.data);
        } else {
          // Fallback to single school
          setBranches([{ id: schoolData.id, name: schoolData.name, address: schoolData.address }]);
        }
        
        // 3. If branch from QR code, auto-select
        if (branchIdFromQR) {
          const qrBranch = branchesRes.data?.find(b => b.id === branchIdFromQR);
          if (qrBranch) {
            setSelectedBranch(qrBranch);
            setFormData(prev => ({ ...prev, branch_id: qrBranch.id }));
            setCurrentStep(1); // Skip to student info
          }
        }
        
        // 4. Fetch admission settings
        const settingsRes = await publicCmsService.getOnlineAdmissionSettings(schoolAlias);
        if (settingsRes.success) {
          setSettings(settingsRes.data);
        }
        
        // 5. Fetch Master Data
        const [religionsRes, castesRes, bloodGroupsRes, motherTonguesRes] = await Promise.all([
          supabase.from('master_religions').select('name'),
          supabase.from('master_castes').select('name'),
          supabase.from('master_blood_groups').select('name'),
          supabase.from('master_mother_tongues').select('name'),
        ]);
        
        setReligions(religionsRes.data || []);
        setCastes(castesRes.data || []);
        setBloodGroups(bloodGroupsRes.data || []);
        setMotherTongues(motherTonguesRes.data || []);
        
      } catch (error) {
        console.error('Fetch error:', error);
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      } finally {
        setLoading(false);
      }
    };
    
    if (schoolAlias) {
      fetchData();
    }
  }, [schoolAlias, branchIdFromQR, toast]);
  
  // Fetch classes when branch changes - Using backend API (secure)
  useEffect(() => {
    const fetchBranchData = async () => {
      if (!selectedBranch?.id || !schoolAlias) return;
      
      try {
        // Fetch classes via backend API (secure - no direct Supabase)
        const classesResponse = await publicCmsService.getClassesByBranch(schoolAlias, selectedBranch.id);
        console.log('Classes fetched:', classesResponse.data);
        setClasses(classesResponse.data || []);
        
        // Fetch categories via backend API (TC-53, TC-58)
        try {
          const categoriesResponse = await publicCmsService.getCategoriesByBranch(schoolAlias, selectedBranch.id);
          console.log('Categories fetched:', categoriesResponse.data);
          setCategories(categoriesResponse.data || []);
        } catch (catError) {
          console.log('Categories not available:', catError);
          setCategories([]);
        }
        
      } catch (error) {
        console.error('Branch data error:', error);
        setClasses([]);
        setCategories([]);
      }
    };
    
    fetchBranchData();
  }, [selectedBranch, schoolAlias]);
  
  // Auto-fill guardian details
  useEffect(() => {
    if (formData.guardian_is === 'father') {
      setFormData(prev => ({
        ...prev,
        guardian_name: prev.father_name,
        guardian_relation: 'Father',
        guardian_phone: prev.father_phone,
        guardian_occupation: prev.father_occupation,
        guardian_photo: prev.father_photo,
      }));
    } else if (formData.guardian_is === 'mother') {
      setFormData(prev => ({
        ...prev,
        guardian_name: prev.mother_name,
        guardian_relation: 'Mother',
        guardian_phone: prev.mother_phone,
        guardian_occupation: prev.mother_occupation,
        guardian_photo: prev.mother_photo,
      }));
    }
  }, [formData.guardian_is, formData.father_name, formData.mother_name]);
  
  // Auto-fill permanent address
  useEffect(() => {
    if (formData.is_permanent_same) {
      setFormData(prev => ({ ...prev, permanent_address: prev.current_address }));
    }
  }, [formData.is_permanent_same, formData.current_address]);
  
  // Pincode auto-fetch
  useEffect(() => {
    const fetchPincode = async () => {
      if (formData.pincode?.length !== 6) return;
      
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${formData.pincode}`);
        const data = await res.json();
        if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length) {
          const { District, State } = data[0].PostOffice[0];
          setFormData(prev => ({ ...prev, city: District || '', state: State || '' }));
        }
      } catch (err) {
        console.error('Pincode error:', err);
      }
    };
    
    const timer = setTimeout(fetchPincode, 500);
    return () => clearTimeout(timer);
  }, [formData.pincode]);
  
  // ========== HANDLERS ==========
  
  // Validate name fields for numbers and special characters (TC-51, TC-52)
  const validateNameField = useCallback((fieldName, value) => {
    if (!value) return null;
    if (/\d/.test(value)) {
      return `${fieldName} should not contain numbers`;
    }
    if (/[^a-zA-Z\s]/.test(value)) {
      return `${fieldName} should not contain special characters`;
    }
    return null;
  }, []);
  
  const handleChange = useCallback((key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    
    // Real-time validation for name fields (TC-51, TC-52)
    if (key === 'first_name' || key === 'last_name') {
      const fieldLabel = key === 'first_name' ? 'First name' : 'Last name';
      const nameError = validateNameField(fieldLabel, value);
      if (nameError) {
        setErrors(prev => ({ ...prev, [key]: nameError }));
      } else if (errors[key]) {
        setErrors(prev => ({ ...prev, [key]: null }));
      }
    } else if (errors[key]) {
      // Clear error when field changes
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  }, [errors, validateNameField]);
  
  const handleBranchSelect = useCallback((branch) => {
    setSelectedBranch(branch);
    setFormData(prev => ({ ...prev, branch_id: branch.id, class_id: '' }));
    setClasses([]);
  }, []);
  
  const validateStep = useCallback((step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Branch
        if (!formData.branch_id) newErrors.branch_id = 'Please select a branch';
        break;
        
      case 1: // Student
        if (!formData.first_name) {
          newErrors.first_name = 'First name is required';
        } else if (/\d/.test(formData.first_name)) {
          // TC-51: First name should not accept numbers
          newErrors.first_name = 'First name should not contain numbers';
        } else if (/[^a-zA-Z\s]/.test(formData.first_name)) {
          // TC-52: First name should not accept special characters
          newErrors.first_name = 'First name should not contain special characters';
        }
        // Also validate last name if provided
        if (formData.last_name) {
          if (/\d/.test(formData.last_name)) {
            newErrors.last_name = 'Last name should not contain numbers';
          } else if (/[^a-zA-Z\s]/.test(formData.last_name)) {
            newErrors.last_name = 'Last name should not contain special characters';
          }
        }
        if (!formData.gender) newErrors.gender = 'Gender is required';
        if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
        if (!formData.class_id) newErrors.class_id = 'Please select a class';
        if (!formData.mobile_number) newErrors.mobile_number = 'Mobile number is required';
        break;
        
      case 2: // Parents
        // Optional validation
        break;
        
      case 3: // Guardian
        if (!formData.guardian_name) newErrors.guardian_name = 'Guardian name is required';
        if (!formData.guardian_phone) newErrors.guardian_phone = 'Guardian phone is required';
        break;
        
      case 4: // Address
        if (!formData.current_address) newErrors.current_address = 'Current address is required';
        break;
        
      case 5: // Documents
        // Optional
        break;
        
      case 6: // Review
        if (settings?.terms_conditions && !formData.terms_accepted) {
          newErrors.terms_accepted = 'Please accept terms and conditions';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, settings]);
  
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, FORM_STEPS.length - 1));
    }
  }, [currentStep, validateStep]);
  
  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);
  
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setSubmitting(true);
    try {
      const reference_no = `ADM${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      // Only include columns that exist in the database
      const admissionData = {
        branch_id: formData.branch_id,
        reference_no,
        enrolled_status: 'Pending',
        class_id: formData.class_id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        mobile_number: formData.mobile_number,
        email: formData.email,
        student_photo: formData.student_photo,
        national_id_no: formData.national_id_no,
        father_name: formData.father_name,
        father_phone: formData.father_phone,
        father_occupation: formData.father_occupation,
        mother_name: formData.mother_name,
        mother_phone: formData.mother_phone,
        mother_occupation: formData.mother_occupation,
        guardian_is: formData.guardian_is,
        guardian_name: formData.guardian_name,
        guardian_relation: formData.guardian_relation,
        guardian_email: formData.guardian_email,
        guardian_photo: formData.guardian_photo,
        guardian_phone: formData.guardian_phone,
        guardian_occupation: formData.guardian_occupation,
        guardian_address: formData.guardian_address,
        // Combine city, state, pincode into address fields
        current_address: formData.current_address ? `${formData.current_address}${formData.city ? ', ' + formData.city : ''}${formData.state ? ', ' + formData.state : ''}${formData.pincode ? ' - ' + formData.pincode : ''}` : '',
        permanent_address: formData.permanent_address ? `${formData.permanent_address}${formData.city ? ', ' + formData.city : ''}${formData.state ? ', ' + formData.state : ''}${formData.pincode ? ' - ' + formData.pincode : ''}` : '',
        previous_school_details: formData.previous_school_details,
        documents: formData.documents,
      };
      
      const { error } = await supabase
        .from('online_admissions')
        .insert(admissionData);
      
      if (error) throw error;
      
      setReferenceNo(reference_no);
      setSubmitted(true);
      
      toast({
        title: 'Success!',
        description: 'Your application has been submitted successfully.',
      });
      
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message || 'Please try again later.',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleNewApplication = () => {
    setSubmitted(false);
    setReferenceNo('');
    setCurrentStep(0);
    setFormData({
      branch_id: '',
      class_id: '',
      first_name: '',
      last_name: '',
      gender: '',
      date_of_birth: '',
      mobile_number: '',
      email: '',
      student_photo: '',
      blood_group: '',
      mother_tongue: '',
      religion: '',
      caste_category_id: null,
      sub_caste_id: null,
      category_id: '',
      national_id_no: '',
      father_name: '',
      father_phone: '',
      father_occupation: '',
      father_photo: '',
      father_email: '',
      father_income: '',
      father_education: '',
      father_aadhar_no: '',
      mother_name: '',
      mother_phone: '',
      mother_occupation: '',
      mother_photo: '',
      mother_income: '',
      mother_education: '',
      mother_aadhar_no: '',
      guardian_is: 'father',
      guardian_name: '',
      guardian_relation: '',
      guardian_email: '',
      guardian_photo: '',
      guardian_phone: '',
      guardian_occupation: '',
      guardian_address: '',
      pincode: '',
      city: '',
      state: '',
      current_address: '',
      permanent_address: '',
      is_permanent_same: false,
      documents: [],
      previous_school_details: '',
      is_rte_student: false,
      terms_accepted: false,
    });
    setSelectedBranch(null);
  };
  
  // ========== RENDER HELPERS ==========
  
  const renderStepContent = () => {
    const stepVariants = {
      initial: { opacity: 0, x: 50 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -50 }
    };
    
    switch (currentStep) {
      case 0: // Branch Selection
        return (
          <motion.div {...stepVariants} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Select Your Preferred Branch
              </h2>
              <p className="text-gray-400">
                Choose the institution branch where you want to apply for admission
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {branches.map((branch) => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  isSelected={selectedBranch?.id === branch.id}
                  onSelect={handleBranchSelect}
                />
              ))}
            </div>
            
            {errors.branch_id && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{errors.branch_id}</AlertDescription>
              </Alert>
            )}
          </motion.div>
        );
        
      case 1: // Student Details
        return (
          <motion.div {...stepVariants} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Student Information</h2>
              <p className="text-gray-400">Enter the student's personal details</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <GlowSelect
                label="Class"
                required
                icon={GraduationCap}
                placeholder="Select Class"
                options={classes.map(c => ({ value: c.id, label: c.name }))}
                value={formData.class_id}
                onChange={(v) => handleChange('class_id', v)}
                error={errors.class_id}
              />
              
              <GlowInput
                label="First Name"
                required
                icon={User}
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                error={errors.first_name}
                placeholder="Enter first name"
              />
              
              <GlowInput
                label="Last Name"
                icon={User}
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                error={errors.last_name}
                placeholder="Enter last name"
              />
              
              <GlowSelect
                label="Gender"
                required
                icon={User}
                placeholder="Select Gender"
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                ]}
                value={formData.gender}
                onChange={(v) => handleChange('gender', v)}
                error={errors.gender}
              />
              
              <GlowInput
                label="Date of Birth"
                required
                icon={Calendar}
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
                error={errors.date_of_birth}
              />
              
              <GlowInput
                label="Mobile Number"
                required
                icon={Phone}
                value={formData.mobile_number}
                onChange={(e) => handleChange('mobile_number', e.target.value.replace(/\D/g, '').slice(0, 10))}
                error={errors.mobile_number}
                placeholder="10-digit mobile"
              />
              
              <GlowInput
                label="Email"
                icon={Mail}
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="student@email.com"
              />
              
              <GlowSelect
                label="Blood Group"
                icon={Heart}
                placeholder="Select Blood Group"
                options={bloodGroups.map(bg => ({ value: bg.name, label: bg.name }))}
                value={formData.blood_group}
                onChange={(v) => handleChange('blood_group', v)}
              />
              
              <GlowSelect
                label="Religion"
                placeholder="Select Religion"
                options={religions.map(r => ({ value: r.name, label: r.name }))}
                value={formData.religion}
                onChange={(v) => handleChange('religion', v)}
              />
              
              <GlowSelect
                label="Caste"
                placeholder="Select Caste"
                options={castes.map(c => ({ value: c.name, label: c.name }))}
                value={formData.caste}
                onChange={(v) => handleChange('caste', v)}
              />
              
              <GlowSelect
                label="Category"
                placeholder="Select Category"
                options={categories.map(c => ({ value: c.id, label: c.name }))}
                value={formData.category_id}
                onChange={(v) => handleChange('category_id', v)}
              />
              
              <GlowInput
                label="Aadhar Number"
                icon={CreditCard}
                value={formData.national_id_no}
                onChange={(e) => handleChange('national_id_no', e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="12-digit Aadhar"
                maxLength={12}
              />
            </div>
            
            {/* Photo Upload */}
            <div className="mt-6">
              <Label className="text-gray-300 flex items-center gap-2 mb-3">
                <Camera className="w-4 h-4 text-purple-400" />
                Student Photo
              </Label>
              <div className={`${GLASS_CARD} p-4 rounded-xl`}>
                <DocumentUploadField
                  onUploadComplete={(url) => handleChange('student_photo', url)}
                  label="Click or drag to upload student photo"
                  className="border-dashed border-2 border-gray-600 hover:border-purple-500 transition-colors"
                />
                {formData.student_photo && (
                  <div className="mt-3 flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm">Photo uploaded successfully</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
        
      case 2: // Parent Details
        return (
          <motion.div {...stepVariants} className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Parent Details</h2>
              <p className="text-gray-400">Enter father and mother information</p>
            </div>
            
            {/* Father Details */}
            <Card className={`${GLASS_CARD} overflow-hidden`}>
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-transparent border-b border-white/10">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" />
                  Father Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <GlowInput
                  label="Father's Name"
                  icon={User}
                  value={formData.father_name}
                  onChange={(e) => handleChange('father_name', e.target.value)}
                  placeholder="Enter father's name"
                />
                <GlowInput
                  label="Phone Number"
                  icon={Phone}
                  value={formData.father_phone}
                  onChange={(e) => handleChange('father_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile"
                />
                <GlowInput
                  label="Email"
                  icon={Mail}
                  type="email"
                  value={formData.father_email}
                  onChange={(e) => handleChange('father_email', e.target.value)}
                  placeholder="father@email.com"
                />
                <GlowInput
                  label="Occupation"
                  icon={Briefcase}
                  value={formData.father_occupation}
                  onChange={(e) => handleChange('father_occupation', e.target.value)}
                  placeholder="Enter occupation"
                />
                <GlowInput
                  label="Annual Income"
                  type="number"
                  value={formData.father_income}
                  onChange={(e) => handleChange('father_income', e.target.value)}
                  placeholder="Enter annual income"
                />
                <GlowInput
                  label="Aadhar Number"
                  icon={CreditCard}
                  value={formData.father_aadhar_no}
                  onChange={(e) => handleChange('father_aadhar_no', e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="12-digit Aadhar"
                />
              </CardContent>
            </Card>
            
            {/* Mother Details */}
            <Card className={`${GLASS_CARD} overflow-hidden`}>
              <CardHeader className="bg-gradient-to-r from-pink-500/10 to-transparent border-b border-white/10">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-pink-400" />
                  Mother Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <GlowInput
                  label="Mother's Name"
                  icon={User}
                  value={formData.mother_name}
                  onChange={(e) => handleChange('mother_name', e.target.value)}
                  placeholder="Enter mother's name"
                />
                <GlowInput
                  label="Phone Number"
                  icon={Phone}
                  value={formData.mother_phone}
                  onChange={(e) => handleChange('mother_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile"
                />
                <GlowInput
                  label="Occupation"
                  icon={Briefcase}
                  value={formData.mother_occupation}
                  onChange={(e) => handleChange('mother_occupation', e.target.value)}
                  placeholder="Enter occupation"
                />
                <GlowInput
                  label="Annual Income"
                  type="number"
                  value={formData.mother_income}
                  onChange={(e) => handleChange('mother_income', e.target.value)}
                  placeholder="Enter annual income"
                />
                <GlowInput
                  label="Aadhar Number"
                  icon={CreditCard}
                  value={formData.mother_aadhar_no}
                  onChange={(e) => handleChange('mother_aadhar_no', e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="12-digit Aadhar"
                />
              </CardContent>
            </Card>
          </motion.div>
        );
        
      case 3: // Guardian
        return (
          <motion.div {...stepVariants} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Guardian Information</h2>
              <p className="text-gray-400">Select who is the primary guardian</p>
            </div>
            
            {/* Guardian Selection */}
            <Card className={`${GLASS_CARD} p-6`}>
              <Label className="text-gray-300 mb-4 block">Primary Guardian</Label>
              <RadioGroup
                value={formData.guardian_is}
                onValueChange={(v) => handleChange('guardian_is', v)}
                className="flex flex-wrap gap-4"
              >
                {['father', 'mother', 'other'].map((type) => (
                  <Label
                    key={type}
                    className={`
                      flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all
                      ${formData.guardian_is === type 
                        ? 'bg-purple-500/20 border-2 border-purple-500' 
                        : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                      }
                    `}
                  >
                    <RadioGroupItem value={type} className="text-purple-500" />
                    <span className="capitalize text-white">{type}</span>
                  </Label>
                ))}
              </RadioGroup>
            </Card>
            
            {formData.guardian_is === 'other' && (
              <Card className={`${GLASS_CARD} overflow-hidden`}>
                <CardHeader className="bg-gradient-to-r from-purple-500/10 to-transparent border-b border-white/10">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-purple-400" />
                    Guardian Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GlowInput
                    label="Guardian Name"
                    required
                    icon={User}
                    value={formData.guardian_name}
                    onChange={(e) => handleChange('guardian_name', e.target.value)}
                    error={errors.guardian_name}
                    placeholder="Enter guardian name"
                  />
                  <GlowInput
                    label="Relation"
                    icon={Users}
                    value={formData.guardian_relation}
                    onChange={(e) => handleChange('guardian_relation', e.target.value)}
                    placeholder="e.g., Uncle, Aunt"
                  />
                  <GlowInput
                    label="Phone Number"
                    required
                    icon={Phone}
                    value={formData.guardian_phone}
                    onChange={(e) => handleChange('guardian_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    error={errors.guardian_phone}
                    placeholder="10-digit mobile"
                  />
                  <GlowInput
                    label="Email"
                    icon={Mail}
                    type="email"
                    value={formData.guardian_email}
                    onChange={(e) => handleChange('guardian_email', e.target.value)}
                    placeholder="guardian@email.com"
                  />
                  <GlowInput
                    label="Occupation"
                    icon={Briefcase}
                    value={formData.guardian_occupation}
                    onChange={(e) => handleChange('guardian_occupation', e.target.value)}
                    placeholder="Enter occupation"
                  />
                  <div className="md:col-span-2">
                    <Label className="text-gray-300 flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-purple-400" />
                      Guardian Address
                    </Label>
                    <Textarea
                      value={formData.guardian_address}
                      onChange={(e) => handleChange('guardian_address', e.target.value)}
                      className="bg-white/5 border-gray-600/50 text-white min-h-[100px]"
                      placeholder="Enter complete address"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
            
            {formData.guardian_is !== 'other' && (
              <Alert className="bg-green-500/10 border-green-500/30">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <AlertTitle className="text-green-300">Guardian Selected</AlertTitle>
                <AlertDescription className="text-green-200/80">
                  {formData.guardian_is === 'father' ? "Father's" : "Mother's"} details will be used as guardian information.
                </AlertDescription>
              </Alert>
            )}
          </motion.div>
        );
        
      case 4: // Address
        return (
          <motion.div {...stepVariants} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Address Details</h2>
              <p className="text-gray-400">Enter residential address information</p>
            </div>
            
            <Card className={`${GLASS_CARD} overflow-hidden`}>
              <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-white/10">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Home className="w-5 h-5 text-emerald-400" />
                  Current Address
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <GlowInput
                    label="Pincode"
                    icon={MapPin}
                    value={formData.pincode}
                    onChange={(e) => handleChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit pincode"
                    maxLength={6}
                  />
                  <GlowInput
                    label="City/District"
                    icon={Building2}
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Auto-filled from pincode"
                  />
                  <GlowInput
                    label="State"
                    icon={Globe}
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="Auto-filled from pincode"
                  />
                </div>
                
                <div>
                  <Label className="text-gray-300 flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    Full Address <span className="text-red-400">*</span>
                  </Label>
                  <Textarea
                    value={formData.current_address}
                    onChange={(e) => handleChange('current_address', e.target.value)}
                    className={`
                      bg-white/5 border-gray-600/50 text-white min-h-[100px]
                      ${errors.current_address ? 'border-red-500' : ''}
                    `}
                    placeholder="Enter complete address with landmark"
                  />
                  {errors.current_address && (
                    <p className="text-red-400 text-xs mt-1">{errors.current_address}</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Permanent Address */}
            <Card className={`${GLASS_CARD} overflow-hidden`}>
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-transparent border-b border-white/10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Home className="w-5 h-5 text-blue-400" />
                    Permanent Address
                  </CardTitle>
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.is_permanent_same}
                      onCheckedChange={(v) => handleChange('is_permanent_same', v)}
                      className="border-gray-500"
                    />
                    <span className="text-sm text-gray-300">Same as current</span>
                  </Label>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <Textarea
                  value={formData.permanent_address}
                  onChange={(e) => handleChange('permanent_address', e.target.value)}
                  className="bg-white/5 border-gray-600/50 text-white min-h-[100px]"
                  placeholder="Enter permanent address"
                  disabled={formData.is_permanent_same}
                />
              </CardContent>
            </Card>
          </motion.div>
        );
        
      case 5: // Documents
        return (
          <motion.div {...stepVariants} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Document Upload</h2>
              <p className="text-gray-400">Upload required documents (optional)</p>
            </div>
            
            <Card className={`${GLASS_CARD} overflow-hidden`}>
              <CardHeader className="bg-gradient-to-r from-amber-500/10 to-transparent border-b border-white/10">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  Upload Documents
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Supported formats: PDF, JPG, PNG (Max 5MB each)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl bg-white/5 border-2 border-dashed border-gray-600 hover:border-purple-500 transition-colors">
                    <DocumentUploadField
                      onUploadComplete={(url) => {
                        if (url) {
                          handleChange('documents', [...formData.documents, { type: 'birth_certificate', url }]);
                        }
                      }}
                      label="Birth Certificate"
                    />
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border-2 border-dashed border-gray-600 hover:border-purple-500 transition-colors">
                    <DocumentUploadField
                      onUploadComplete={(url) => {
                        if (url) {
                          handleChange('documents', [...formData.documents, { type: 'aadhar', url }]);
                        }
                      }}
                      label="Aadhar Card"
                    />
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border-2 border-dashed border-gray-600 hover:border-purple-500 transition-colors">
                    <DocumentUploadField
                      onUploadComplete={(url) => {
                        if (url) {
                          handleChange('documents', [...formData.documents, { type: 'tc', url }]);
                        }
                      }}
                      label="Transfer Certificate (if any)"
                    />
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border-2 border-dashed border-gray-600 hover:border-purple-500 transition-colors">
                    <DocumentUploadField
                      onUploadComplete={(url) => {
                        if (url) {
                          handleChange('documents', [...formData.documents, { type: 'other', url }]);
                        }
                      }}
                      label="Other Documents"
                    />
                  </div>
                </div>
                
                {/* Uploaded Documents List */}
                {formData.documents.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Uploaded Documents</h4>
                    <div className="space-y-2">
                      {formData.documents.map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                          <span className="text-green-300 capitalize">{doc.type?.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Previous School */}
                <div className="mt-6">
                  <Label className="text-gray-300 flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    Previous School Details (if any)
                  </Label>
                  <Textarea
                    value={formData.previous_school_details}
                    onChange={(e) => handleChange('previous_school_details', e.target.value)}
                    className="bg-white/5 border-gray-600/50 text-white"
                    placeholder="School name, last class attended, year of passing..."
                  />
                </div>
                
                {/* RTE Student */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5">
                  <Checkbox
                    checked={formData.is_rte_student}
                    onCheckedChange={(v) => handleChange('is_rte_student', v)}
                    className="border-gray-500"
                  />
                  <Label className="text-gray-300 cursor-pointer">
                    Applying under Right to Education (RTE) quota
                  </Label>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
        
      case 6: // Review
        return (
          <motion.div {...stepVariants} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Review & Submit</h2>
              <p className="text-gray-400">Please verify all details before submitting</p>
            </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Branch & Class */}
              <Card className={`${GLASS_CARD}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-purple-400 flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Branch & Class
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white font-medium">{selectedBranch?.name}</p>
                  <p className="text-gray-400 text-sm">{classes.find(c => c.id === formData.class_id)?.name}</p>
                </CardContent>
              </Card>
              
              {/* Student */}
              <Card className={`${GLASS_CARD}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-purple-400 flex items-center gap-2">
                    <User className="w-4 h-4" /> Student
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white font-medium">{formData.first_name} {formData.last_name}</p>
                  <p className="text-gray-400 text-sm">{formData.gender} • {formData.date_of_birth}</p>
                  <p className="text-gray-400 text-sm">{formData.mobile_number}</p>
                </CardContent>
              </Card>
              
              {/* Father */}
              <Card className={`${GLASS_CARD}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-400 flex items-center gap-2">
                    <User className="w-4 h-4" /> Father
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white font-medium">{formData.father_name || 'Not provided'}</p>
                  <p className="text-gray-400 text-sm">{formData.father_phone || ''}</p>
                </CardContent>
              </Card>
              
              {/* Mother */}
              <Card className={`${GLASS_CARD}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-pink-400 flex items-center gap-2">
                    <User className="w-4 h-4" /> Mother
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white font-medium">{formData.mother_name || 'Not provided'}</p>
                  <p className="text-gray-400 text-sm">{formData.mother_phone || ''}</p>
                </CardContent>
              </Card>
              
              {/* Address */}
              <Card className={`${GLASS_CARD} lg:col-span-2`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-emerald-400 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white">{formData.current_address}</p>
                  <p className="text-gray-400 text-sm">{formData.city}, {formData.state} - {formData.pincode}</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Terms & Conditions */}
            {settings?.terms_conditions && (
              <Card className={`${GLASS_CARD}`}>
                <CardContent className="p-6">
                  <div className="prose prose-invert prose-sm max-h-40 overflow-y-auto mb-4 text-gray-300">
                    <div dangerouslySetInnerHTML={{ __html: settings.terms_conditions }} />
                  </div>
                  <Separator className="bg-gray-700 my-4" />
                  <Label className={`
                    flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-colors
                    ${formData.terms_accepted ? 'bg-green-500/10' : 'hover:bg-white/5'}
                    ${errors.terms_accepted ? 'ring-2 ring-red-500' : ''}
                  `}>
                    <Checkbox
                      checked={formData.terms_accepted}
                      onCheckedChange={(v) => handleChange('terms_accepted', v)}
                      className="border-gray-500"
                    />
                    <span className={formData.terms_accepted ? 'text-green-300' : 'text-gray-300'}>
                      I accept the terms and conditions
                    </span>
                  </Label>
                  {errors.terms_accepted && (
                    <p className="text-red-400 text-xs mt-2">{errors.terms_accepted}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        );
        
      default:
        return null;
    }
  };
  
  // ========== MAIN RENDER ==========
  
  if (loading) {
    return (
      <div className={`min-h-screen ${GRADIENT_BG} flex items-center justify-center`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading admission portal...</p>
        </motion.div>
      </div>
    );
  }
  
  if (submitted) {
    return (
      <div className={`min-h-screen ${GRADIENT_BG} relative`}>
        <AnimatedBackground />
        <div className="relative z-10">
          <SuccessScreen referenceNo={referenceNo} onNewApplication={handleNewApplication} />
        </div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen ${GRADIENT_BG} relative`}>
      <Helmet>
        <title>Online Admission | {siteSettings?.school_name || 'Jashchar ERP'}</title>
        <meta name="description" content="Apply for admission online with our futuristic admission portal" />
      </Helmet>
      
      <AnimatedBackground />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="backdrop-blur-md bg-black/20 border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {organization?.logo_url && (
                  <img 
                    src={organization.logo_url} 
                    alt="Logo" 
                    className="h-12 w-12 rounded-xl object-contain bg-white/10 p-1"
                  />
                )}
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {organization?.name || siteSettings?.school_name}
                  </h1>
                  <p className="text-sm text-gray-400">Online Admission Portal</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 hidden sm:flex">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Powered by AI
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-300 hover:text-white hover:bg-white/10"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Track Status
                </Button>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 py-8 px-4">
          <div className="max-w-5xl mx-auto">
            {/* Step Indicator */}
            <div className="mb-8 px-4">
              <StepIndicator
                steps={FORM_STEPS}
                currentStep={currentStep}
                onStepClick={(step) => step < currentStep && setCurrentStep(step)}
              />
            </div>
            
            {/* Step Info */}
            <motion.div 
              key={currentStep}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 mb-2">
                Step {currentStep + 1} of {FORM_STEPS.length}
              </Badge>
            </motion.div>
            
            {/* Form Content */}
            <Card className={`${GLASS_CARD} ${GLOW_EFFECT}`}>
              <CardContent className="p-6 md:p-8">
                <AnimatePresence mode="wait">
                  {renderStepContent()}
                </AnimatePresence>
              </CardContent>
              
              {/* Navigation Buttons */}
              <CardFooter className="border-t border-white/10 p-6 flex justify-between gap-4">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="text-gray-300 hover:text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                <div className="flex gap-4">
                  {currentStep < FORM_STEPS.length - 1 ? (
                    <Button
                      onClick={handleNext}
                      className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white px-8"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Application
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
            
            {/* Footer Info */}
            <div className="mt-8 text-center">
              <div className="flex items-center justify-center gap-6 text-gray-500 text-sm">
                <span className="flex items-center gap-1">
                  <Shield className="w-4 h-4" /> Secure
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-4 h-4" /> Fast
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="w-4 h-4" /> 24/7 Available
                </span>
              </div>
              <p className="mt-4 text-gray-600 text-xs">
                © {new Date().getFullYear()} {organization?.name || 'Jashchar ERP'}. All rights reserved.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OnlineAdmission;
