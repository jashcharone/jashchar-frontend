import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BookOpen, User, Key, Users, Bus, FileText, UserCog, Save, Shield, Loader2, UserPlus, FileCheck2, Copy, Percent, Wallet, AlertCircle, Building, X, Sparkles, BedDouble, GraduationCap, Phone, MapPin, Files, CheckCircle2, ChevronDown, ChevronUp, Camera, Mail, CreditCard, Home, Heart, School, CalendarDays, Hash, Globe, FileUp, Info, Zap, Search, Star, Award, BadgeCheck, Fingerprint, UserCircle2, MapPinned, Landmark, ShieldCheck, Clock, FileImage, Upload, Eye, EyeOff, Lock, Unlock, IndianRupee, Gift, Truck, Building2, Bed, PhoneCall, AlertTriangle, CircleDot, ArrowRight, Check, Ban, Banknote, Receipt, Tag, Percent as PercentIcon } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import { v4 as uuidv4 } from 'uuid';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useEmailValidation } from '@/hooks/useEmailValidation';
import { useAadharValidation } from '@/hooks/useAadharValidation';
import AadharInput from '@/components/AadharInput';
import DatePicker from '@/components/ui/DatePicker';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

// Icon mapping
const ICON_MAP = {
  BookOpen, User, Key, Users, Bus, FileText, UserCog, Shield, Files, Building, BedDouble, GraduationCap, Phone, MapPin, School, Home, Heart, CreditCard, Mail
};

// ? WORLD-CLASS Premium Section Card Component
const SectionBox = ({ icon, title, children, className, collapsible = false, defaultOpen = true, badge, badgeColor = 'primary', gradient = 'blue' }) => {
  const Icon = icon || FileText;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const gradientStyles = {
    blue: 'from-blue-500/20 via-indigo-500/10 to-purple-500/5',
    green: 'from-emerald-500/20 via-green-500/10 to-teal-500/5',
    orange: 'from-orange-500/20 via-amber-500/10 to-yellow-500/5',
    purple: 'from-purple-500/20 via-violet-500/10 to-fuchsia-500/5',
    pink: 'from-pink-500/20 via-rose-500/10 to-red-500/5',
  };
  
  const iconGradients = {
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-emerald-500 to-green-600',
    orange: 'from-orange-500 to-amber-600',
    purple: 'from-purple-500 to-violet-600',
    pink: 'from-pink-500 to-rose-600',
  };
  
  const badgeColors = {
    primary: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    info: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  };

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-3xl border border-border/40 bg-card shadow-xl transition-all duration-500 hover:shadow-2xl hover:border-primary/30",
      className
    )}>
      {/* Premium Gradient Background - pointer-events-none to allow clicks through */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none", gradientStyles[gradient])} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/80 via-transparent to-transparent dark:from-gray-900/80 pointer-events-none" />
      
      {/* Header */}
      <div 
        className={cn(
          "relative flex items-center justify-between gap-4 px-6 py-5 border-b border-border/30",
          collapsible && "cursor-pointer group/header"
        )}
        onClick={() => collapsible && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          {/* Premium Icon Container */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className={cn("relative bg-gradient-to-br p-3.5 rounded-2xl shadow-lg", iconGradients[gradient])}>
              <Icon className="h-6 w-6 text-white drop-shadow-sm" />
            </div>
            {/* Status Indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 border-2 border-card shadow-lg pointer-events-none">
              <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
            </div>
          </div>
          
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
              {title}
              {badge && (
                <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold border", badgeColors[badgeColor])}>
                  {badge}
                </span>
              )}
            </h2>
          </div>
        </div>
        
        {collapsible && (
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 transition-all duration-300">
            <ChevronDown className={cn("h-5 w-5 transition-transform duration-300", !isOpen && "-rotate-90")} />
          </Button>
        )}
      </div>
      
      {/* Content */}
      <div className={cn(
        "relative transition-all duration-500 ease-out",
        isOpen ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
      )}>
        <div className="p-6 pt-5">
          {children}
        </div>
      </div>
    </div>
  );
};

// ? Premium Smart Input Field Component
const SmartField = ({ label, required, error, touched, children, className, hint, icon: FieldIcon, success }) => (
  <div className={cn("group space-y-2", className)}>
    <Label className="flex items-center justify-between text-sm font-semibold text-foreground/90">
      <span className="flex items-center gap-2">
        {FieldIcon && (
          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary/10 group-focus-within:bg-primary/20 transition-colors">
            <FieldIcon className="h-3.5 w-3.5 text-primary" />
          </span>
        )}
        <span>{label}</span>
        {required && <span className="text-red-500 font-bold ml-0.5">*</span>}
      </span>
      {hint && (
        <span className="text-xs text-muted-foreground font-normal flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-md">
          <Sparkles className="h-3 w-3 text-primary" />{hint}
        </span>
      )}
    </Label>
    <div className="relative">
      {children}
      {success && !error && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </div>
      )}
    </div>
    {touched && error && (
      <p className="text-xs text-red-500 flex items-center gap-1.5 animate-in slide-in-from-top-1 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded-lg border border-red-200 dark:border-red-900">
        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{error}</span>
      </p>
    )}
  </div>
);

// ? Simple Photo Upload Card
const PhotoUploadCard = ({ label, preview, onFileChange, required }) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <Label className="text-xs font-medium flex items-center gap-1 text-muted-foreground">
        <Camera className="h-3 w-3" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="w-32">
        <ImageUploader 
          onFileChange={onFileChange} 
          initialPreview={preview} 
          showInstruction={false}
          showCamera={false}
          aspectRatio={3.5/4.5}
          showCrop={true}
        />
      </div>
    </div>
  );
};

const initialFormData = {
  school_code: '',
  admission_date: format(new Date(), 'yyyy-MM-dd'),
  session_id: '', // Session field
  class_id: '',
  section_id: '',
  category_id: null,
  roll_number: '',
  first_name: '',
  last_name: '',
  gender: '',
  blood_group: '',
  dob: null,
  mother_tongue: '',
  religion: '',
  caste: '',
  phone: '',
  mobile_no: '',
  email: '',
  aadhar_no: '',
  post_office: '',
  city: '',
  state: '',
  current_address: '',
  permanent_address: '',
  username: '',
  password: '',
  retype_password: '',
  parent_username: '',
  parent_password: '',
  parent_retype_password: '',
  father_name: '',
  father_dob: null,
  father_aadhar_no: '',
  father_phone: '',
  father_occupation: '',
  father_income: '',
  father_education: '',
  father_email: '',
  father_photo: null, // Added
  mother_name: '',
  mother_dob: null,
  mother_aadhar_no: '',
  mother_phone: '',
  mother_occupation: '',
  mother_income: '',
  mother_education: '',
  mother_photo: null, // Added
  guardian_name: '',
  guardian_relation: '',
  guardian_phone: '',
  guardian_occupation: '',
  guardian_photo: null,
  documents_received: {},
  is_rte_student: false,
  siblings: [],
  sibling_group_id: null,
  carry_forward_fees: '',
  transport_required: false,
  transport_route_id: null,
  transport_pickup_point_id: null,
  transport_fee: 0,
  pickup_time: '',
  drop_time: '',
  vehicle_number: '',
  driver_name: '',
  driver_contact: '',
  transport_special_instructions: '',
  hostel_required: false,
  hostel_id: null,
  hostel_room_type: '',
  room_number: '',
  bed_number: '',
  hostel_fee: 0,
  check_in_date: null,
  check_out_date: null,
  hostel_guardian_contact: '',
  hostel_emergency_contact: '',
  hostel_special_requirements: '',
  fee_groups: {},
  fee_discounts: {},
  // Additional Details placeholders
  student_house: '',
  height: '',
  weight: '',
  as_on_date: null,
  previous_school_details: '',
  local_id_no: '',
  bank_account_no: '',
  bank_name: '',
  ifsc_code: ''
};

const AddSiblingModal = ({ onSiblingAdd }) => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    if (!selectedBranch?.id) return;
    const fetchClasses = async () => {
      const { data } = await supabase.from('classes').select('id, name').eq('branch_id', selectedBranch.id);
      setClasses(data || []);
    };
    fetchClasses();
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedClass) {
      const fetchSections = async () => {
        const { data } = await supabase.from('class_sections').select('sections(id, name)').eq('class_id', selectedClass);
        setSections(data ? data.map(item => item.sections).filter(Boolean) : []);
      };
      fetchSections();
    } else {
      setSections([]);
      setSelectedSection('');
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedSection && selectedBranch?.id) {
      const fetchStudents = async () => {
        const { data } = await supabase.from('student_profiles').select('id, full_name, sibling_group_id, carry_forward_fees').eq('class_id', selectedClass).eq('section_id', selectedSection).eq('branch_id', selectedBranch.id);
        setStudents(data || []);
      };
      fetchStudents();
    } else {
      setStudents([]);
    }
    setSelectedStudent(null);
  }, [selectedSection, selectedClass, selectedBranch]);

  const handleAdd = () => {
    if (selectedStudent) {
      onSiblingAdd(selectedStudent);
    }
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Add Sibling</DialogTitle></DialogHeader>
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-1 gap-4"><Label>Class</Label><Select value={selectedClass} onValueChange={setSelectedClass}><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="grid grid-cols-1 gap-4"><Label>Section</Label><Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}><SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger><SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="grid grid-cols-1 gap-4"><Label>Student</Label><Select onValueChange={val => setSelectedStudent(students.find(s => s.id === val))} disabled={!selectedSection}><SelectTrigger><SelectValue placeholder="Select Student" /></SelectTrigger><SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <DialogFooter><Button onClick={handleAdd} disabled={!selectedStudent}>Add</Button></DialogFooter>
    </DialogContent>
  );
};

const StudentAdmission = () => {
  const { toast } = useToast();
  const { user, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [pickupPoints, setPickupPoints] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [hostelRoomTypes, setHostelRoomTypes] = useState([]);
  const [feeGroups, setFeeGroups] = useState([]);
  const [feeDiscounts, setFeeDiscounts] = useState([]);
  const [sessions, setSessions] = useState([]); // Sessions list
  
  // Master Data States
  const [religions, setReligions] = useState([]);
  const [castes, setCastes] = useState([]);
  const [bloodGroups, setBloodGroups] = useState([]);
  const [motherTongues, setMotherTongues] = useState([]);
  const [genders, setGenders] = useState([]);
  const [studentHouses, setStudentHouses] = useState([]);
  const [masterDocuments, setMasterDocuments] = useState([]);
  const [allFields, setAllFields] = useState([]); // Combined system and custom fields
  const [formSections, setFormSections] = useState([]); // Sections from API
  const [customFieldValues, setCustomFieldValues] = useState({});

  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [fatherPictureFile, setFatherPictureFile] = useState(null);
  const [motherPictureFile, setMotherPictureFile] = useState(null);
  const [guardianPictureFile, setGuardianPictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [fatherPicturePreview, setFatherPicturePreview] = useState(null);
  const [motherPicturePreview, setMotherPicturePreview] = useState(null);
  const [guardianPicturePreview, setGuardianPicturePreview] = useState(null);
  const [schoolSettings, setSchoolSettings] = useState(null);
  const [pincode, setPincode] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [postOffices, setPostOffices] = useState([]);
  const [admissionSuccessData, setAdmissionSuccessData] = useState(null);
  const [isRollNumberLoading, setIsRollNumberLoading] = useState(false);
  const [isCheckingRollNumber, setIsCheckingRollNumber] = useState(false);
  const [rollNumberError, setRollNumberError] = useState('');
  const [rollNumberManuallyEdited, setRollNumberManuallyEdited] = useState(false);
  
  // Validation States
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  
  // Username duplicate check states
  const [isCheckingStudentUsername, setIsCheckingStudentUsername] = useState(false);
  const [studentUsernameError, setStudentUsernameError] = useState('');
  const [isCheckingParentUsername, setIsCheckingParentUsername] = useState(false);
  const [parentUsernameError, setParentUsernameError] = useState('');
  const [existingParentData, setExistingParentData] = useState(null); // Stores existing parent info if found
  
  // Password visibility states
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [showStudentRetypePassword, setShowStudentRetypePassword] = useState(false);
  const [showParentPassword, setShowParentPassword] = useState(false);
  const [showParentRetypePassword, setShowParentRetypePassword] = useState(false);

  const { isChecking: isStudentEmailChecking, error: studentEmailError, validateEmail: validateStudentEmail, resetValidation: resetStudentEmailValidation } = useEmailValidation();
  const { isChecking: isFatherEmailChecking, error: fatherEmailError, validateEmail: validateFatherEmail, resetValidation: resetFatherEmailValidation } = useEmailValidation();
  const { isChecking: isAadharChecking, error: aadharError, validateAadhar, resetValidation: resetAadharValidation } = useAadharValidation();

  const isStudentAdmissionAutoGenConfigValid = useCallback((settings) => {
    const prefix = (settings?.student_admission_no_prefix ?? '').trim();
    const digit = Number(settings?.student_admission_no_digit);
    const startFrom = Number(settings?.student_admission_start_from);
    return Boolean(prefix) && Number.isFinite(digit) && digit > 0 && Number.isFinite(startFrom);
  }, []);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleCustomFieldChange = (key, value) => {
    setCustomFieldValues(prev => ({ ...prev, [key]: value }));
  };

  // --- Dynamic Field Renderer with Enhanced Styling ---
  // Changed from component to function to prevent re-mounting and focus loss
  const renderDynamicField = (field) => {
    if (!field.is_enabled) return null;

    const label = field.field_label;
    const isRequired = field.is_required;

    // Common error display
    const errorMsg = (touched[field.field_name] && errors[field.field_name]) || 
                    (field.is_system ? null : errors[`custom_${field.id}`]);

    // Handle System Fields with special components
    if (field.is_system) {
      switch (field.field_name) {
        case 'admission_no':
          return (
            <SmartField label={label} required={isRequired} error={errors.school_code} touched={touched.school_code} icon={Hash} hint={schoolSettings?.student_admission_no_auto_generation ? "Auto-generated" : null}>
              <Input
                value={formData.school_code}
                placeholder="Enter admission number"
                onChange={e => handleChange('school_code', e.target.value)}
                disabled={Boolean(schoolSettings?.student_admission_no_auto_generation) && isStudentAdmissionAutoGenConfigValid(schoolSettings)}
                onBlur={() => handleBlur('school_code')}
                className={cn("h-11", schoolSettings?.student_admission_no_auto_generation && "bg-muted/50")}
              />
            </SmartField>
          );
        case 'class':
          return (
            <SmartField label={label} required={isRequired} error={errors.class_id} touched={touched.class_id} icon={BookOpen}>
              <Select value={formData.class_id} onValueChange={v => handleChange('class_id', v)}>
                <SelectTrigger onBlur={() => handleBlur('class_id')} className="h-11"><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </SmartField>
          );
        case 'section':
          return (
            <SmartField label={label} required={isRequired} error={errors.section_id} touched={touched.section_id} icon={School}>
              <Select value={formData.section_id} onValueChange={v => handleChange('section_id', v)} disabled={!formData.class_id}>
                <SelectTrigger onBlur={() => handleBlur('section_id')} className="h-11"><SelectValue placeholder="Select Section" /></SelectTrigger>
                <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </SmartField>
          );
        case 'session':
          const activeSession = sessions.find(s => s.is_active);
          return (
            <SmartField label={label} required={isRequired} error={errors.session_id} touched={touched.session_id} icon={CalendarDays} hint={activeSession ? "Active session auto-selected" : null}>
              <Select value={formData.session_id} onValueChange={v => handleChange('session_id', v)}>
                <SelectTrigger onBlur={() => handleBlur('session_id')} className={cn("h-11", activeSession && formData.session_id === activeSession.id && "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20")}>
                  <SelectValue placeholder="Select Session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.is_active && <span className="ml-2 text-xs text-emerald-600 font-semibold">(Active)</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SmartField>
          );
        case 'date': 
        case 'dob':
        case 'admission_date':
        case 'father_dob':
        case 'mother_dob':
        case 'as_on_date':
          return (
            <div className="lg:col-span-1">
              <DatePicker 
                id={field.field_name}
                label={label} 
                required={isRequired} 
                value={formData[field.field_name]} 
                onChange={date => handleChange(field.field_name, date)} 
                disableFuture={field.field_name !== 'as_on_date'}
              />
              {touched[field.field_name] && errors[field.field_name] && <span className="text-xs text-red-500">{errors[field.field_name]}</span>}
            </div>
          );
        case 'roll_number':
           return (
            <SmartField label={label} required={isRequired} error={rollNumberError || errors.roll_number} touched={touched.roll_number || !!rollNumberError}>
              <div className="relative">
                <Input 
                  value={formData.roll_number} 
                  type="text" 
                  placeholder="Auto-assigned" 
                  onChange={handleRollNumberChange} 
                  onBlur={() => handleBlur('roll_number')} 
                  className="h-11"
                />
                {(isRollNumberLoading || isCheckingRollNumber) && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
                )}
              </div>
            </SmartField>
           );
         case 'category':
            return (
              <SmartField label={label} required={isRequired} error={errors.category_id} touched={touched.category_id}>
                <Select value={formData.category_id || ''} onValueChange={v => handleChange('category_id', v)}>
                  <SelectTrigger onBlur={() => handleBlur('category_id')} className="h-11"><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </SmartField>
            )
        case 'student_photo':
        case 'father_photo':
        case 'mother_photo':
        case 'guardian_photo':
            const photoHandlers = {
                student_photo: { file: profilePictureFile, setFile: setProfilePictureFile, preview: profilePicturePreview, setPreview: setProfilePicturePreview },
                father_photo: { file: fatherPictureFile, setFile: setFatherPictureFile, preview: fatherPicturePreview, setPreview: setFatherPicturePreview },
                mother_photo: { file: motherPictureFile, setFile: setMotherPictureFile, preview: motherPicturePreview, setPreview: setMotherPicturePreview },
                guardian_photo: { file: guardianPictureFile, setFile: setGuardianPictureFile, preview: guardianPicturePreview, setPreview: setGuardianPicturePreview },
            };
            const handler = photoHandlers[field.field_name];
            return (
                <PhotoUploadCard 
                  label={label}
                  preview={handler.preview}
                  onFileChange={file => handleFileChange(file, handler.setFile, handler.setPreview)}
                  required={isRequired}
                />
            );
        case 'email':
        case 'father_email':
             const isChecking = field.field_name === 'email' ? isStudentEmailChecking : isFatherEmailChecking;
             const emailErr = field.field_name === 'email' ? studentEmailError : fatherEmailError;
             return (
              <SmartField label={label} required={isRequired} error={emailErr} touched={!!emailErr} icon={Mail}>
                <div className="relative">
                  <Input 
                    value={formData[field.field_name]} 
                    type="email" 
                    placeholder="email@example.com" 
                    onChange={e => handleEmailChange(e, field.field_name)} 
                    className="h-11"
                  />
                  {isChecking && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
                </div>
              </SmartField>
             );
        case 'aadhar_no':
        case 'father_aadhar_no':
        case 'mother_aadhar_no':
            return (
              <SmartField label={label} required={isRequired} error={(field.field_name === 'aadhar_no' ? aadharError : null) || (touched[field.field_name] && errors[field.field_name])} touched icon={Fingerprint} hint="12 digits">
                <AadharInput 
                  value={formData[field.field_name] || ''} 
                  onChange={val => {
                    handleChange(field.field_name, val);
                    if(field.field_name === 'aadhar_no') validateAadhar(val);
                  }} 
                  checkDuplicates={field.field_name === 'aadhar_no'} 
                  error={null}
                  className="h-11"
                />
              </SmartField>
            )
        case 'pincode':
            return (
              <SmartField label={label} required={isRequired} error={errors.pincode} touched={touched.pincode} icon={MapPinned} hint="6 digits ? Auto-fills">
                <div className="relative">
                  <Input
                    value={pincode}
                    placeholder="Enter 6-digit pincode"
                    onChange={e => {
                      const cleaned = (e.target.value || '').replace(/\D/g, '').slice(0, 6);
                      setPincode(cleaned);
                      if (cleaned.length < 6) {
                        handleChange('post_office', '');
                      }
                    }}
                    onBlur={() => handleBlur('pincode')}
                    maxLength={6}
                    className="h-11 font-mono text-lg tracking-widest"
                  />
                  {pincodeLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
                  {pincode.length === 6 && !pincodeLoading && formData.city && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
              </SmartField>
            );
        case 'post_office':
            return (
              <SmartField label={label} required={isRequired} error={errors.post_office} touched={touched.post_office} icon={Building} hint={postOffices.length > 0 ? `${postOffices.length} found` : "Enter pincode first"}>
                <Select 
                  value={formData.post_office || ''} 
                  onValueChange={v => {
                    handleChange('post_office', v);
                    // Update city from selected post office
                    const selectedPO = postOffices.find(po => po.Name === v);
                    if (selectedPO) {
                      handleChange('city', selectedPO.District || formData.city);
                      handleChange('state', selectedPO.State || formData.state);
                    }
                  }}
                  disabled={postOffices.length === 0}
                >
                  <SelectTrigger onBlur={() => handleBlur('post_office')} className={cn("h-11", postOffices.length === 0 && "bg-muted/50")}>
                    <SelectValue placeholder={postOffices.length === 0 ? "Enter pincode first" : "Select Post Office"} />
                  </SelectTrigger>
                  <SelectContent>
                    {postOffices.map((po, idx) => (
                      <SelectItem key={idx} value={po.Name}>
                        <div className="flex flex-col">
                          <span className="font-medium">{po.Name}</span>
                          <span className="text-xs text-muted-foreground">{po.BranchType} - {po.DeliveryStatus}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SmartField>
            );
        case 'username':
             // Student username = Admission Number (always auto-generated, read-only)
             return (
              <SmartField 
                label={label} 
                required={isRequired} 
                error={studentUsernameError || errors[field.field_name]} 
                touched={touched[field.field_name]} 
                icon={User} 
                hint="= Admission Number (Auto)"
              >
                <div className="relative">
                  <Input 
                    value={formData[field.field_name]} 
                    placeholder="Auto-generated from Admission No"
                    readOnly
                    disabled
                    className={cn(
                      "h-11 bg-muted/50",
                      studentUsernameError && "border-red-500 bg-red-50 dark:bg-red-900/20"
                    )}
                  />
                  {isCheckingStudentUsername && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                  )}
                  {!isCheckingStudentUsername && formData.username && !studentUsernameError && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                  {!isCheckingStudentUsername && studentUsernameError && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                  )}
                </div>
              </SmartField>
             );
        case 'parent_username':
             // Parent username = Father Phone (auto-generated, read-only)
             return (
              <SmartField 
                label={label} 
                required={isRequired} 
                error={parentUsernameError || errors[field.field_name]} 
                touched={touched[field.field_name]} 
                icon={Phone} 
                hint="= Father Mobile (Auto)"
              >
                <div className="relative">
                  <Input 
                    value={formData[field.field_name]} 
                    placeholder="Auto-filled from Father Phone"
                    readOnly
                    disabled
                    className={cn(
                      "h-11 bg-muted/50",
                      parentUsernameError && "border-red-500 bg-red-50 dark:bg-red-900/20"
                    )}
                  />
                  {isCheckingParentUsername && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                  )}
                  {!isCheckingParentUsername && formData.parent_username && !parentUsernameError && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                  {!isCheckingParentUsername && parentUsernameError && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                  )}
                </div>
                {existingParentData && !parentUsernameError && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2 text-sm">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-blue-700 dark:text-blue-300">
                      Parent exists ({existingParentData.name}) with {existingParentData.studentCount} student(s)
                    </span>
                  </div>
                )}
              </SmartField>
             );
        case 'password':
            return (
              <SmartField label={label} required={isRequired} error={errors[field.field_name]} touched={touched[field.field_name]} icon={Key} hint={schoolSettings?.password_auto_generation ? "Auto-generated" : null}>
                <div className="relative">
                  <Input 
                    type={showStudentPassword ? "text" : "password"} 
                    value={formData[field.field_name]} 
                    placeholder="Enter password"
                    onChange={e => handleChange(field.field_name, e.target.value)} 
                    onBlur={() => handleBlur(field.field_name)} 
                    disabled={schoolSettings?.password_auto_generation} 
                    className={cn("h-11 pr-10", schoolSettings?.password_auto_generation && "bg-muted/50")}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-primary/10"
                    onClick={() => setShowStudentPassword(!showStudentPassword)}
                  >
                    {showStudentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </SmartField>
            );
        case 'retype_password':
            return (
              <SmartField label={label} required={isRequired} error={errors[field.field_name]} touched={touched[field.field_name]} icon={Key}>
                <div className="relative">
                  <Input 
                    type={showStudentRetypePassword ? "text" : "password"} 
                    value={formData[field.field_name]} 
                    placeholder="Re-type password"
                    onChange={e => handleChange(field.field_name, e.target.value)} 
                    onBlur={() => handleBlur(field.field_name)} 
                    disabled={schoolSettings?.password_auto_generation} 
                    className={cn("h-11 pr-10", schoolSettings?.password_auto_generation && "bg-muted/50")}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-primary/10"
                    onClick={() => setShowStudentRetypePassword(!showStudentRetypePassword)}
                  >
                    {showStudentRetypePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </SmartField>
            );
        case 'parent_password':
            return (
              <SmartField label={label} required={isRequired} error={errors[field.field_name]} touched={touched[field.field_name]} icon={Key} hint={schoolSettings?.password_auto_generation ? "Auto-generated" : null}>
                <div className="relative">
                  <Input 
                    type={showParentPassword ? "text" : "password"} 
                    value={formData[field.field_name]} 
                    placeholder="Enter password"
                    onChange={e => handleChange(field.field_name, e.target.value)} 
                    onBlur={() => handleBlur(field.field_name)} 
                    disabled={schoolSettings?.password_auto_generation} 
                    className={cn("h-11 pr-10", schoolSettings?.password_auto_generation && "bg-muted/50")}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-primary/10"
                    onClick={() => setShowParentPassword(!showParentPassword)}
                  >
                    {showParentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </SmartField>
            );
        case 'parent_retype_password':
            return (
              <SmartField label={label} required={isRequired} error={errors[field.field_name]} touched={touched[field.field_name]} icon={Key}>
                <div className="relative">
                  <Input 
                    type={showParentRetypePassword ? "text" : "password"} 
                    value={formData[field.field_name]} 
                    placeholder="Re-type password"
                    onChange={e => handleChange(field.field_name, e.target.value)} 
                    onBlur={() => handleBlur(field.field_name)} 
                    disabled={schoolSettings?.password_auto_generation} 
                    className={cn("h-11 pr-10", schoolSettings?.password_auto_generation && "bg-muted/50")}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-primary/10"
                    onClick={() => setShowParentRetypePassword(!showParentRetypePassword)}
                  >
                    {showParentRetypePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </SmartField>
            );
        case 'religion':
            return (
              <SmartField label={label} required={isRequired}>
                <Select value={formData.religion} onValueChange={v => handleChange('religion', v)}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select Religion" /></SelectTrigger>
                  <SelectContent>{religions.map(r => <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>)}</SelectContent>
                </Select>
              </SmartField>
            );
        case 'caste':
             return (
              <SmartField label={label} required={isRequired}>
                <Select value={formData.caste} onValueChange={v => handleChange('caste', v)}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select Caste" /></SelectTrigger>
                  <SelectContent>{castes.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </SmartField>
            );
        case 'blood_group':
             return (
              <SmartField label={label} required={isRequired} icon={Heart}>
                <Select value={formData.blood_group} onValueChange={v => handleChange('blood_group', v)}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select Blood Group" /></SelectTrigger>
                  <SelectContent>{bloodGroups.map(bg => <SelectItem key={bg.name} value={bg.name}>{bg.name}</SelectItem>)}</SelectContent>
                </Select>
              </SmartField>
            );
        case 'gender':
             return (
              <SmartField label={label} required={isRequired}>
                <Select value={formData.gender} onValueChange={v => handleChange('gender', v)}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select Gender" /></SelectTrigger>
                  <SelectContent>{genders.map(g => <SelectItem key={g.name} value={g.name}>{g.name}</SelectItem>)}</SelectContent>
                </Select>
              </SmartField>
            );
        case 'mother_tongue':
             return (
              <SmartField label={label} required={isRequired} icon={Globe}>
                <Select value={formData.mother_tongue} onValueChange={v => handleChange('mother_tongue', v)}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select Mother Tongue" /></SelectTrigger>
                  <SelectContent>{motherTongues.map(mt => <SelectItem key={mt.name} value={mt.name}>{mt.name}</SelectItem>)}</SelectContent>
                </Select>
              </SmartField>
            );
        case 'student_house':
             return (
              <SmartField label={label} required={isRequired} icon={Home}>
                <Select value={formData.student_house} onValueChange={v => handleChange('student_house', v)}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select Student House" /></SelectTrigger>
                  <SelectContent>{studentHouses.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
                </Select>
              </SmartField>
            );
        case 'post_office':
             return (
               <SmartField label="Post Office" hint={postOffices.length > 0 ? `${postOffices.length} found` : null}>
                 <Select onValueChange={handlePostOfficeChange} disabled={postOffices.length === 0}>
                   <SelectTrigger className="h-11"><SelectValue placeholder="Select Post Office" /></SelectTrigger>
                   <SelectContent>{postOffices.map(po => <SelectItem key={po.Name} value={po.Name}>{po.Name}</SelectItem>)}</SelectContent>
                 </Select>
               </SmartField>
             );
        case 'city':
        case 'state':
             return (
              <SmartField label={label} required={isRequired} hint="Auto-filled from pincode">
                <Input 
                  value={formData[field.field_name]} 
                  placeholder={label}
                  onChange={e => handleChange(field.field_name, e.target.value)}
                  className={cn("h-11", formData[field.field_name] && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800")}
                />
              </SmartField>
             );
        case 'phone':
        case 'mobile_no':
        case 'guardian_phone':
             return (
              <SmartField label={label} required={isRequired} error={errors[field.field_name]} touched={touched[field.field_name]} icon={Phone} hint="10 digits">
                <Input 
                  value={formData[field.field_name]} 
                  type="tel"
                  placeholder="9876543210"
                  onChange={e => handleChange(field.field_name, e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onBlur={() => handleBlur(field.field_name)}
                  className="h-11"
                  maxLength={10}
                />
              </SmartField>
             );
        case 'father_phone':
             return (
              <SmartField 
                label={label} 
                required={isRequired} 
                error={parentUsernameError || errors[field.field_name]} 
                touched={touched[field.field_name]} 
                icon={Phone} 
                hint="10 digits - Will be Parent Username"
              >
                <div className="relative">
                  <Input 
                    value={formData[field.field_name]} 
                    type="tel"
                    placeholder="9876543210"
                    onChange={e => {
                      const phone = e.target.value.replace(/\D/g, '').slice(0, 10);
                      // Update both father_phone AND parent_username in single state update
                      setFormData(prev => ({ 
                        ...prev, 
                        [field.field_name]: phone,
                        parent_username: phone 
                      }));
                      // Check for duplicate parent when 10 digits
                      if (phone.length === 10) {
                        checkParentUsernameDuplicate(phone);
                      } else {
                        setParentUsernameError('');
                        setExistingParentData(null);
                      }
                    }}
                    onBlur={() => handleBlur(field.field_name)}
                    className={cn("h-11", parentUsernameError && "border-red-500")}
                    maxLength={10}
                  />
                  {isCheckingParentUsername && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                  )}
                </div>
                {existingParentData && !parentUsernameError && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2 text-sm">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-blue-700 dark:text-blue-300">
                      ? ???????? ?????? {existingParentData.studentCount} ??????????????????? ({existingParentData.name}) - ???????? ??????????????? ??????????
                    </span>
                  </div>
                )}
              </SmartField>
             );
        case 'mother_phone':
             return (
              <SmartField label={label} required={isRequired} error={errors[field.field_name]} touched={touched[field.field_name]} icon={Phone} hint="10 digits">
                <Input 
                  value={formData[field.field_name]} 
                  type="tel"
                  placeholder="9876543210"
                  onChange={e => handleChange(field.field_name, e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onBlur={() => handleBlur(field.field_name)}
                  className="h-11"
                  maxLength={10}
                />
              </SmartField>
             );
        case 'current_address':
        case 'present_address':
        case 'permanent_address':
             return (
              <SmartField label={label} required={isRequired} className="lg:col-span-2" icon={Home}>
                <Textarea 
                  value={formData[field.field_name]} 
                  placeholder={`Enter ${label.toLowerCase()}...`}
                  onChange={e => handleChange(field.field_name, e.target.value)}
                  onBlur={() => handleBlur(field.field_name)}
                  className="min-h-[100px] resize-none"
                />
              </SmartField>
             );
      }
    }

    // Generic Handlers for System or Custom fields that didn't match special cases above
    const value = field.is_system ? (formData[field.field_name] ?? '') : (customFieldValues[field.field_key] ?? '');
    const onChange = (val) => {
        field.is_system ? handleChange(field.field_name, val) : handleCustomFieldChange(field.field_key, val);
    };

    if (field.type === 'select' || field.field_type === 'select') {
       return (
        <SmartField label={label} required={isRequired} error={errorMsg} touched={touched[field.field_name]}>
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="h-11"><SelectValue placeholder={`Select ${label}`} /></SelectTrigger>
            <SelectContent>
              {(field.field_options || []).map((opt, idx) => {
                const optVal = typeof opt === 'object' ? opt.value : opt;
                const optLabel = typeof opt === 'object' ? opt.label : opt;
                return <SelectItem key={idx} value={optVal}>{optLabel}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </SmartField>
       );
    }
    
    if (field.type === 'textarea' || field.field_type === 'textarea') {
      return (
        <SmartField label={label} required={isRequired} error={errorMsg} touched={touched[field.field_name]} className="md:col-span-2 lg:col-span-2">
          <Textarea 
            value={value} 
            placeholder={`Enter ${label.toLowerCase()}...`}
            onChange={e => onChange(e.target.value)} 
            onBlur={() => !field.is_system && handleBlur(field.field_name)} 
            className="min-h-[80px]"
          />
        </SmartField>
      );
    }

    if (field.type === 'date' || field.field_type === 'date') {
       return (
         <div className="lg:col-span-1">
            <DatePicker id={field.field_key} label={label} required={isRequired} value={value} onChange={onChange} />
         </div>
       );
    }

    if (field.type === 'checkbox' || field.field_type === 'checkbox') {
        return (
          <div className="flex items-center space-x-3 h-11 mt-6">
            <Checkbox id={field.field_key} checked={!!value} onCheckedChange={onChange} className="data-[state=checked]:bg-primary" />
            <label htmlFor={field.field_key} className="text-sm font-medium leading-none cursor-pointer">{label}</label>
          </div>
        )
    }

    // Default Text Input with enhanced styling
    return (
      <SmartField label={label} required={isRequired} error={errorMsg} touched={touched[field.field_name]}>
        <Input 
          value={value} 
          type={field.type === 'number' || field.field_type === 'number' ? 'number' : 'text'}
          placeholder={`Enter ${label.toLowerCase()}`}
          onChange={e => onChange(e.target.value)} 
          onBlur={() => field.is_system && handleBlur(field.field_name)} 
          className="h-11"
        />
      </SmartField>
    );
  };


  // Validation Logic - Debounced to prevent excessive re-renders
  const validationTimeoutRef = useRef(null);
  
  // Real-time validation for LOGIN DETAILS ONLY (password match)
  useEffect(() => {
    const loginErrors = {};
    
    // Only validate password fields in real-time
    if (formData.password && formData.password.length < 6) {
      loginErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password && formData.retype_password && formData.password !== formData.retype_password) {
      loginErrors.retype_password = "Passwords do not match";
    }
    if (formData.parent_password && formData.parent_password.length < 6) {
      loginErrors.parent_password = "Password must be at least 6 characters";
    }
    if (formData.parent_password && formData.parent_retype_password && formData.parent_password !== formData.parent_retype_password) {
      loginErrors.parent_retype_password = "Passwords do not match";
    }
    
    // Update only login-related errors, preserve other errors
    setErrors(prev => {
      const { password, retype_password, parent_password, parent_retype_password, ...otherErrors } = prev;
      return { ...otherErrors, ...loginErrors };
    });
  }, [formData.password, formData.retype_password, formData.parent_password, formData.parent_retype_password]);
  
  // Full form validation function - called only on save
  const validateFullForm = useCallback(() => {
    const newErrors = {};
    
    // Field name mapping: API field name -> formData key
    const fieldNameMap = {
      'class': 'class_id',
      'section': 'section_id',
      'session': 'session_id',
      'category': 'category_id',
      'admission_no': 'school_code',
    };
    
    allFields.forEach(field => {
       if(!field.is_enabled) return;
       if(field.is_required) {
           // Use mapped field name if exists, otherwise use original
           const mappedFieldName = fieldNameMap[field.field_name] || field.field_name;
           const val = field.is_system ? formData[mappedFieldName] : customFieldValues[field.field_key];
           const isEmpty = val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0);
           if(isEmpty) {
               const errKey = field.is_system ? mappedFieldName : `custom_${field.id}`;
               newErrors[errKey] = `${field.field_label} is required`;
           }
       }
       
       if(field.field_name === 'pincode' && pincode && !/^\d{6}$/.test(pincode)) newErrors.pincode = "Valid 6-digit Pincode is required";
       if((field.field_name === 'phone' || field.field_name === 'father_phone') && formData[field.field_name] && !/^\d{10}$/.test(formData[field.field_name])) {
           newErrors[field.field_name] = "Valid 10-digit Mobile No is required";
       }
       if((field.field_name === 'aadhar_no' || field.field_name === 'father_aadhar_no' || field.field_name === 'mother_aadhar_no') && formData[field.field_name] && formData[field.field_name].length !== 12) {
           newErrors[field.field_name] = "Valid 12-digit Aadhar No is required";
       }
    });

    // Password Validations
    if (formData.password && formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.retype_password) newErrors.retype_password = "Passwords do not match";
    if (formData.parent_password && formData.parent_password.length < 6) newErrors.parent_password = "Password must be at least 6 characters";
    if (formData.parent_password !== formData.parent_retype_password) newErrors.parent_retype_password = "Passwords do not match";

    // Fees - Only validate if there are fee groups defined
    if (feeGroups.length > 0 && !Object.values(formData.fee_groups).some(v => v)) {
      newErrors.fee_groups = "At least one fee must be selected";
    }

    // Documents - Check required documents
    const missingDocs = masterDocuments
      .filter(doc => doc.is_required && !formData.documents_received[doc.name])
      .map(doc => doc.name);
    if (missingDocs.length > 0) newErrors.documents_received = `Missing required documents: ${missingDocs.join(', ')}`;

    // Transport Conditional
    if (formData.transport_required) {
      if (!formData.transport_route_id) newErrors.transport_route_id = "Transport Route is required";
      if (!formData.transport_pickup_point_id) newErrors.transport_pickup_point_id = "Pickup Point is required";
    }

    // Hostel Conditional
    if (formData.hostel_required) {
      if (!formData.hostel_id) newErrors.hostel_id = "Hostel Name is required";
      if (!formData.hostel_room_type) newErrors.hostel_room_type = "Room Type is required";
    }

    setErrors(newErrors);
    const valid = Object.keys(newErrors).length === 0 && !rollNumberError && !studentEmailError && !fatherEmailError && !aadharError && !studentUsernameError && !parentUsernameError;
    setIsFormValid(valid);
    return valid;
  }, [formData, customFieldValues, allFields, pincode, rollNumberError, studentEmailError, fatherEmailError, aadharError, masterDocuments, studentUsernameError, parentUsernameError, feeGroups]);

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };
  
  // Check duplicate student username (Admission Number)
  const checkStudentUsernameDuplicate = useCallback(async (username) => {
    if (!username || !selectedBranch?.id) {
      setStudentUsernameError('');
      return;
    }
    setIsCheckingStudentUsername(true);
    setStudentUsernameError('');
    try {
      // Check in student_profiles table using school_code (which equals admission_no/username)
      const { data, error } = await supabase
        .from('student_profiles')
        .select('id, first_name, last_name')
        .eq('branch_id', selectedBranch.id)
        .eq('school_code', username)
        .limit(1);
      
      if (error) throw error;
      if (data && data.length > 0) {
        const studentName = `${data[0].first_name || ''} ${data[0].last_name || ''}`.trim();
        setStudentUsernameError(`Admission No "${username}" already exists for ${studentName}`);
      }
    } catch (err) {
      console.error('Error checking student username:', err);
    } finally {
      setIsCheckingStudentUsername(false);
    }
  }, [selectedBranch?.id]);
  
  // Check duplicate parent username (Father Phone) and find existing parent
  const checkParentUsernameDuplicate = useCallback(async (phone) => {
    if (!phone || phone.length !== 10 || !selectedBranch?.id) {
      setParentUsernameError('');
      setExistingParentData(null);
      return;
    }
    setIsCheckingParentUsername(true);
    setParentUsernameError('');
    setExistingParentData(null);
    try {
      // Check if parent with this phone exists in profiles table
      // Only check phone column since school_code and students don't exist in profiles table
      // REMOVED .eq('role', 'parent') as the column might not exist or be named differently
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .eq('phone', phone)
        .limit(1);
      
      if (error) {
        // If error (likely column doesn't exist), log it but don't show error to user
        console.error('Error checking parent phone:', error);
        return;
      }
      if (data && data.length > 0) {
        const parent = data[0];
        // Count students linked to this parent from student_profiles
        const { data: studentsData } = await supabase
          .from('student_profiles')
          .select('id')
          .eq('father_phone', phone)
          .eq('branch_id', selectedBranch.id);
        const studentCount = studentsData?.length || 0;
        setExistingParentData({
          id: parent.id,
          name: parent.full_name,
          studentCount
        });
        // This is NOT an error - parent can have multiple students
        // Just informational message
      }
    } catch (err) {
      console.error('Error checking parent username:', err);
    } finally {
      setIsCheckingParentUsername(false);
    }
  }, [selectedBranch?.id]);

  const generateNextId = useCallback(async (settings, branchIdParam) => {
    const branchId = branchIdParam || selectedBranch?.id;
    if (!branchId) return null;

    const prefix = (settings?.student_admission_no_prefix ?? '').trim();
    const digit = Number(settings?.student_admission_no_digit);
    const startFrom = Number(settings?.student_admission_start_from);

    if (!prefix || !Number.isFinite(digit) || digit <= 0 || !Number.isFinite(startFrom)) {
      toast({
        variant: 'destructive',
        title: 'Admission No auto-generation not configured',
        description: 'Set Admission No Prefix, Digit, and Start From in General Setting > ID Auto Generation.'
      });
      return null;
    }

    const { data, error } = await supabase
      .from('student_profiles')
      .select('school_code')
      .eq('branch_id', branchId)
      .like('school_code', `${prefix}%`)
      .order('school_code', { ascending: false, nullsFirst: false })
      .limit(1);
    
    let nextNumber;
    if (data && data.length > 0 && data[0].school_code) {
      const latestCode = data[0].school_code;
      const numberPart = parseInt(latestCode.replace(prefix, ''), 10);
      nextNumber = isNaN(numberPart) ? startFrom : numberPart + 1;
    } else {
      nextNumber = startFrom;
    }
    const newId = `${prefix}${String(nextNumber).padStart(digit, '0')}`;
    // Student username = Admission Number (school_code) - Always auto-set
    const studentUsername = newId;
    setFormData(prev => ({
      ...prev,
      school_code: newId,
      username: studentUsername, // Student username is ALWAYS admission number
      password: settings.password_auto_generation ? settings.password_default || '' : prev.password,
      retype_password: settings.password_auto_generation ? settings.password_default || '' : prev.retype_password,
      parent_password: settings.password_auto_generation ? settings.password_default || '' : prev.parent_password,
      parent_retype_password: settings.password_auto_generation ? settings.password_default || '' : prev.parent_retype_password
    }));
    // Check student username for duplicates
    checkStudentUsernameDuplicate(studentUsername);
    return newId;
  }, [selectedBranch?.id, toast, checkStudentUsernameDuplicate]);
  
  const fetchSchoolSettings = useCallback(async () => {
    const branchId = selectedBranch?.id;
    if (!branchId) return;
    console.log('[StudentAdmission] Fetching settings for branch:', branchId);
    const { data, error } = await supabase.from('branches').select('*').eq('id', branchId).single();
    if (error) {
      console.error('Could not fetch branch settings:', error);
      toast({ variant: 'destructive', title: 'Could not fetch school settings.' });
      return;
    }
    console.log('[StudentAdmission] Branch settings loaded:', data?.branch_name, data);
    setSchoolSettings(data);
    if (data?.student_admission_no_auto_generation) {
      await generateNextId(data, branchId);
    }
  }, [selectedBranch?.id, toast, generateNextId]);
  
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setCustomFieldValues({});
    setPincode('');
    setPostOffices([]);
    setProfilePictureFile(null);
    setFatherPictureFile(null);
    setMotherPictureFile(null);
    setGuardianPictureFile(null);
    setProfilePicturePreview(null);
    setFatherPicturePreview(null);
    setMotherPicturePreview(null);
    setGuardianPicturePreview(null);
    setRollNumberManuallyEdited(false);
    setRollNumberError('');
    setErrors({});
    setTouched({});
    resetStudentEmailValidation();
    resetFatherEmailValidation();
    resetAadharValidation();
    fetchSchoolSettings();
  }, [fetchSchoolSettings, resetStudentEmailValidation, resetFatherEmailValidation, resetAadharValidation]);
  
  useEffect(() => {
    if (!selectedBranch?.id) return;
    const branchId = selectedBranch.id;
    console.log('[StudentAdmission] Loading data for branch:', branchId, selectedBranch?.branch_name);
    fetchSchoolSettings();
    const fetchPrereqs = async () => {
      const [
        classesRes, 
        categoriesRes, 
        routesRes, 
        hostelsRes, 
        hostelRoomTypesRes, 
        feeGroupsRes, 
        feeDiscountsRes,
        religionsRes,
        castesRes,
        bloodGroupsRes,
        motherTonguesRes,
        gendersRes,
        studentHousesRes,
        masterDocumentsRes,
        customFieldsRes,
        sessionsRes
      ] = await Promise.all([
        supabase.from('classes').select('id, name').eq('branch_id', branchId),
        supabase.from('student_categories').select('id, name').eq('branch_id', branchId),
        supabase.from('transport_routes').select('id, route_title').eq('branch_id', branchId),
        supabase.from('hostels').select('id, name').eq('branch_id', branchId),
        supabase.from('hostel_room_types').select('*').eq('branch_id', branchId),
        supabase.from('fee_groups').select(`id, name, fee_masters (*, fee_types(name, code))`).eq('branch_id', branchId),
        supabase.from('discounts').select('id, name').eq('branch_id', branchId),
        supabase.from('master_religions').select('name'),
        supabase.from('master_castes').select('name'),
        supabase.from('master_blood_groups').select('name'),
        supabase.from('master_mother_tongues').select('name'),
        supabase.from('master_genders').select('name'),
        supabase.from('student_houses').select('id, name').eq('branch_id', branchId),
        supabase.from('master_documents').select('name, is_required'),
        api.get('/form-settings', { params: { branchId, module: 'student_admission' } }),
        supabase.from('sessions').select('id, name, is_active').eq('branch_id', branchId).order('name', { ascending: false })
      ]);

      setClasses(classesRes.data || []);
      setCategories(categoriesRes.data || []);
      setRoutes(routesRes.data || []);
      setHostels(hostelsRes.data || []);
      setHostelRoomTypes(hostelRoomTypesRes.data || []);
      setFeeGroups(feeGroupsRes.data || []);
      setFeeDiscounts(feeDiscountsRes.data || []);
      setReligions(religionsRes.data || []);
      setCastes(castesRes.data || []);
      setBloodGroups(bloodGroupsRes.data || []);
      setMotherTongues(motherTonguesRes.data || []);
      setGenders(gendersRes.data || []);
      setStudentHouses(studentHousesRes.data || []);
      setMasterDocuments(masterDocumentsRes.data || []);
      
      // Set sessions and auto-select active session
      const sessionsData = sessionsRes.data || [];
      setSessions(sessionsData);
      const activeSession = sessionsData.find(s => s.is_active);
      if (activeSession) {
        setFormData(prev => ({ ...prev, session_id: activeSession.id }));
      }
      
      if(customFieldsRes.data && customFieldsRes.data.success) {
          const systemFields = customFieldsRes.data.systemFields || [];
          const customFields = customFieldsRes.data.customFields || [];
          setAllFields([...systemFields, ...customFields]);
          setFormSections(customFieldsRes.data.sections || []);
      }
    };
    fetchPrereqs();
  }, [user, selectedBranch, fetchSchoolSettings]);
  
  const checkDuplicateRollNumber = useCallback(async (rollNumber, classId, sectionId) => {
    if (!selectedBranch?.id) return false;
    if (!rollNumber || !classId || !sectionId) {
      setRollNumberError('');
      return false;
    }
    setIsCheckingRollNumber(true);
    setRollNumberError('');
    const { data, error } = await supabase.from('student_profiles').select('id').eq('branch_id', selectedBranch.id).eq('class_id', classId).eq('section_id', sectionId).eq('roll_number', rollNumber).limit(1);
    setIsCheckingRollNumber(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Error checking roll number.' });
      return false;
    }
    if (data.length > 0) {
      setRollNumberError('This Roll Number already exists for this class and section.');
      return true;
    }
    return false;
  }, [selectedBranch?.id, toast]);

  const getNextRollNumber = useCallback(async (classId, sectionId) => {
    if (!classId || !sectionId || rollNumberManuallyEdited || !selectedBranch?.id) return;
    setIsRollNumberLoading(true);
    setRollNumberError('');
    try {
      // Get max roll number from student_profiles table directly
      const { data, error } = await supabase
        .from('student_profiles')
        .select('roll_number')
        .eq('branch_id', selectedBranch.id)
        .eq('class_id', classId)
        .eq('section_id', sectionId)
        .not('roll_number', 'is', null)
        .order('roll_number', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('[StudentAdmission] Roll number fetch error:', error);
        toast({ variant: 'destructive', title: 'Could not fetch next roll number.' });
      } else {
        // Parse existing roll number and increment
        const lastRoll = data?.[0]?.roll_number;
        const lastRollNum = lastRoll ? parseInt(lastRoll.replace(/\D/g, ''), 10) : 0;
        const nextRollNumber = (lastRollNum || 0) + 1;
        handleChange('roll_number', nextRollNumber.toString().padStart(2, '0'));
      }
    } catch (err) {
      console.error('[StudentAdmission] Roll number error:', err);
    }
    setIsRollNumberLoading(false);
  }, [selectedBranch?.id, toast, rollNumberManuallyEdited]);
  
  useEffect(() => {
    if (rollNumberManuallyEdited) {
      const handler = setTimeout(() => {
        checkDuplicateRollNumber(formData.roll_number, formData.class_id, formData.section_id);
      }, 500);
      return () => clearTimeout(handler);
    }
  }, [formData.roll_number, formData.class_id, formData.section_id, rollNumberManuallyEdited, checkDuplicateRollNumber]);
  
  useEffect(() => {
    if (formData.class_id && formData.section_id) {
      if (!rollNumberManuallyEdited) {
        getNextRollNumber(formData.class_id, formData.section_id);
      } else {
        checkDuplicateRollNumber(formData.roll_number, formData.class_id, formData.section_id);
      }
    } else {
      handleChange('roll_number', '');
      setRollNumberError('');
    }
  }, [formData.class_id, formData.section_id, getNextRollNumber, rollNumberManuallyEdited, checkDuplicateRollNumber]);
  
  // Track previous class_id to detect actual changes
  const prevClassIdRef = useRef(formData.class_id);
  
  useEffect(() => {
    if (formData.class_id) {
      const fetchSections = async () => {
        const { data } = await supabase.from('class_sections').select('sections(id, name)').eq('class_id', formData.class_id);
        setSections(data ? data.map(item => item.sections).filter(Boolean) : []);
      };
      fetchSections();
    } else {
      setSections([]);
    }
    // Only reset section_id if class_id actually changed
    if (prevClassIdRef.current !== formData.class_id) {
      setFormData(prev => ({ ...prev, section_id: '' }));
      prevClassIdRef.current = formData.class_id;
    }
  }, [formData.class_id]);

  // Track previous transport_route_id
  const prevTransportRouteRef = useRef(formData.transport_route_id);
  
  useEffect(() => {
    const fetchTransportDetails = async () => {
      if (formData.transport_route_id) {
        const { data, error } = await supabase.from('route_pickup_point_mappings').select('pickup_point:transport_pickup_points(id, name), monthly_fees, pickup_time').eq('route_id', formData.transport_route_id);
        if (error) {
          toast({ variant: 'destructive', title: 'Error fetching pickup points' });
          setPickupPoints([]);
        } else {
          setPickupPoints(data || []);
        }
      } else {
        setPickupPoints([]);
      }
      // Only reset if transport_route_id actually changed
      if (prevTransportRouteRef.current !== formData.transport_route_id) {
        setFormData(prev => ({ ...prev, transport_pickup_point_id: '', transport_fee: 0 }));
        prevTransportRouteRef.current = formData.transport_route_id;
      }
    };
    fetchTransportDetails();
  }, [formData.transport_route_id, toast]);

  useEffect(() => {
    const selectedPoint = pickupPoints.find(p => p.pickup_point?.id === formData.transport_pickup_point_id);
    if (selectedPoint) {
      setFormData(prev => {
        if (prev.transport_fee !== selectedPoint.monthly_fees || prev.pickup_time !== selectedPoint.pickup_time) {
          return { ...prev, transport_fee: selectedPoint.monthly_fees, pickup_time: selectedPoint.pickup_time };
        }
        return prev;
      });
    }
  }, [formData.transport_pickup_point_id, pickupPoints]);
  
  useEffect(() => {
    const selectedRoomType = hostelRoomTypes.find(rt => rt.id === formData.hostel_room_type);
    if (selectedRoomType) {
      setFormData(prev => {
        if (prev.hostel_fee !== selectedRoomType.cost) {
          return { ...prev, hostel_fee: selectedRoomType.cost };
        }
        return prev;
      });
    }
  }, [formData.hostel_room_type, hostelRoomTypes]);

  useEffect(() => {
    const fetchPincodeData = async () => {
      if (pincode.length !== 6) {
        setPostOffices([]);
        setFormData(prev => ({ ...prev, city: '', state: '' }));
        return;
      }
      setPincodeLoading(true);
      try {
        let found = false;
        try {
          const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
          const data = await response.json();
          if (data && data[0] && data[0].Status === 'Success' && Array.isArray(data[0].PostOffice) && data[0].PostOffice.length > 0) {
            found = true;
            setPostOffices(data[0].PostOffice);
            const { District, State } = data[0].PostOffice[0];
            setFormData(prev => ({ ...prev, city: District || '', state: State || '' }));
          }
        } catch {}

        if (!found) {
          try {
            const response = await fetch(`https://api.zippopotam.us/in/${pincode}`);
            if (response.ok) {
              const data = await response.json();
              if (data?.places?.length) {
                const place = data.places[0];
                found = true;
                setPostOffices([]);
                setFormData(prev => ({
                  ...prev,
                  state: place?.state || '',
                  city: place?.['place name'] || ''
                }));
              }
            }
          } catch {}
        }
        if (!found) {
          setPostOffices([]);
          toast({ variant: 'destructive', title: 'Invalid Pincode', description: 'No location found.' });
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'API Error', description: error.message });
      } finally {
        setPincodeLoading(false);
      }
    };
    const timer = setTimeout(fetchPincodeData, 500);
    return () => clearTimeout(timer);
  }, [pincode, toast]);
  
  const handleEmailChange = (e, emailType) => {
    const email = e.target.value;
    handleChange(emailType, email);
    if (email) {
      if (emailType === 'email') validateStudentEmail(email);
      else if (emailType === 'father_email') validateFatherEmail(email);
    } else {
      if (emailType === 'email') resetStudentEmailValidation();
      else if (emailType === 'father_email') resetFatherEmailValidation();
    }
  };

  const handlePostOfficeChange = postOfficeName => {
    const selected = postOffices.find(po => po.Name === postOfficeName);
    if (selected) {
      setFormData(prev => ({ ...prev, city: selected.District, state: selected.State }));
    }
  };
  
  const handleRollNumberChange = e => {
    setRollNumberManuallyEdited(true);
    handleChange('roll_number', e.target.value);
  };
  
  const handleCheckboxChange = (key, checked) => {
    setFormData(prev => ({ ...prev, documents_received: { ...prev.documents_received, [key]: checked } }));
  };
  
  const handleFeeGroupChange = (groupId, checked) => {
    setFormData(prev => ({ ...prev, fee_groups: { ...prev.fee_groups, [groupId]: checked } }));
  };
  
  const handleDiscountChange = (discountId, checked) => {
    setFormData(prev => ({ ...prev, fee_discounts: { ...prev.fee_discounts, [discountId]: checked } }));
  };
  
  const handleSiblingAdd = selectedSibling => {
    setFormData(prev => {
      const newSiblings = [...(prev.siblings || [])];
      if (!newSiblings.find(s => s.id === selectedSibling.id)) {
        newSiblings.push(selectedSibling);
      }
      let newSiblingGroupId = prev.sibling_group_id;
      const existingSiblingGroupId = newSiblings.map(s => s.sibling_group_id).find(id => id);
      if (existingSiblingGroupId) newSiblingGroupId = existingSiblingGroupId;
      else if (!newSiblingGroupId) newSiblingGroupId = uuidv4();
      
      const carryForward = newSiblings.reduce((sum, s) => sum + (Number(s.carry_forward_fees) || 0), 0);

      return { ...prev, siblings: newSiblings, sibling_group_id: newSiblingGroupId, carry_forward_fees: carryForward > 0 ? String(carryForward) : '' };
    });
    toast({ title: 'Sibling Added', description: `${selectedSibling.full_name} has been linked.` });
  };
  
  const removeSibling = siblingId => {
    setFormData(prev => {
      const newSiblings = prev.siblings.filter(s => s.id !== siblingId);
      const carryForward = newSiblings.reduce((sum, s) => sum + (Number(s.carry_forward_fees) || 0), 0);
      return { ...prev, siblings: newSiblings, carry_forward_fees: carryForward > 0 ? String(carryForward) : '' }
    });
  };
  
  const handleFileChange = (file, setFile, setPreview) => {
    setFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };
  
  const uploadFile = async (file, bucket) => {
    if (!file) return null;
    const fileName = `${uuidv4()}-${file.name}`;
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrl;
  };
  
  const handleSave = async () => {
    // Run full validation on save
    const isValid = validateFullForm();
    
    if (!isValid) {
        const firstErrorField = Object.keys(errors)[0];
        if(firstErrorField) {
            const element = document.querySelector(`[name="${firstErrorField}"], [id="${firstErrorField}"]`);
            if(element) element.focus();
        }
        
        // Detailed error message
        const missingFields = Object.keys(errors).map(key => {
             // Try to find label from allFields
             const field = allFields.find(f => {
                 const mapped = { 'class_id': 'class', 'section_id': 'section', 'session_id': 'session', 'category_id': 'category', 'school_code': 'admission_no' }[key]; 
                 return f.field_name === key || f.field_name === mapped;
             });
             return field ? field.field_label : key.replace(/_/g, ' ');
        }).join(', ');

        toast({ 
            variant: 'destructive', 
            title: 'Validation Error', 
            description: `Please fill mandatory fields: ${missingFields}` 
        });
        return;
    }

    if (studentEmailError || fatherEmailError || aadharError || rollNumberError) {
      toast({ variant: 'destructive', title: 'Invalid Data', description: studentEmailError || fatherEmailError || aadharError || rollNumberError });
      return;
    }
    setLoading(true);
    
    // Extract everything for meta data
    const { 
        password, retype_password, parent_password, parent_retype_password, 
        username, parent_username,
        class_id, section_id, session_id, admission_date, school_code, 
        siblings, sibling_group_id, fee_groups, fee_discounts, 
        ...restOfForm 
    } = formData;
    
    // Use selected session_id from form, or fallback to current_session from settings
    const final_session_id = session_id || schoolSettings?.current_session_id;
    if (!final_session_id) {
      toast({ variant: 'destructive', title: 'Session Error', description: 'Please select a session or configure current session in System Settings.' });
      setLoading(false);
      return;
    }
    
    try {
      let transport_details_id = null;
      if (formData.transport_required) {
        const { data: transportData, error: transportError } = await supabase
          .from('student_transport_details')
          .insert({
            branch_id: selectedBranch.id,
            transport_route_id: formData.transport_route_id,
            transport_pickup_point_id: formData.transport_pickup_point_id,
            transport_fee: formData.transport_fee,
            pickup_time: formData.pickup_time || null,
            drop_time: formData.drop_time || null,
            vehicle_number: formData.vehicle_number,
            driver_name: formData.driver_name,
            driver_contact: formData.driver_contact,
            special_instructions: formData.transport_special_instructions,
          }).select().single();
        if (transportError) throw transportError;
        transport_details_id = transportData.id;
      }
      
      let hostel_details_id = null;
      if (formData.hostel_required) {
        const { data: hostelData, error: hostelError } = await supabase
          .from('student_hostel_details')
          .insert({
            branch_id: selectedBranch.id,
            hostel_id: formData.hostel_id,
            room_type: formData.hostel_room_type,
            room_number: formData.room_number,
            bed_number: formData.bed_number,
            hostel_fee: formData.hostel_fee,
            check_in_date: formData.check_in_date,
            check_out_date: formData.check_out_date,
            guardian_contact: formData.hostel_guardian_contact,
            emergency_contact: formData.hostel_emergency_contact,
            special_requirements: formData.hostel_special_requirements,
          }).select().single();
        if (hostelError) throw hostelError;
        hostel_details_id = hostelData.id;
      }

      const allSiblingIds = (siblings || []).map(s => s.id);
      if (allSiblingIds.length > 0) {
        await Promise.all(allSiblingIds.map(id => supabase.from('profiles').update({ sibling_group_id }).eq('id', id)));
      }
      
      const [profilePhotoUrl, fatherPhotoUrl, motherPhotoUrl, guardianPhotoUrl] = await Promise.all([
        uploadFile(profilePictureFile, 'student-photos'),
        uploadFile(fatherPictureFile, 'student-photos'),
        uploadFile(motherPictureFile, 'student-photos'),
        uploadFile(guardianPictureFile, 'student-photos'),
      ]);

      let final_organization_id = organizationId;
      if (!final_organization_id && selectedBranch?.id) {
        const { data: schoolData } = await supabase.from('branches').select('organization_id').eq('id', selectedBranch.id).single();
        final_organization_id = schoolData?.organization_id || null;
      }

      const studentMetaData = Object.fromEntries(Object.entries({
        ...restOfForm,
        username,
        school_code,
        admission_date,
        class_id,
        section_id,
        session_id: final_session_id,
        full_name: `${formData.first_name} ${formData.last_name || ''}`.trim(),
        photo_url: profilePhotoUrl,
        father_photo_url: fatherPhotoUrl,
        mother_photo_url: motherPhotoUrl,
        guardian_photo_url: guardianPhotoUrl,
        branch_id: selectedBranch.id,
        organization_id: final_organization_id,
        role: 'student',
        pincode,
        sibling_group_id,
        transport_details_id,
        hostel_details_id,
        custom_fields: customFieldValues,
      }).map(([key, value]) => [key, value === '' ? null : value]));
      
      const studentEmail = formData.email || `${uuidv4()}@example.com`;
      const { data: studentUserResult, error: studentError } = await supabase.functions.invoke('create-user', { body: { email: studentEmail, password, metadata: studentMetaData } });
      if (studentError) throw studentError;
      const studentId = studentUserResult.user.id;

      if (transport_details_id) await supabase.from('student_transport_details').update({ student_id: studentId }).eq('id', transport_details_id);
      if (hostel_details_id) await supabase.from('student_hostel_details').update({ student_id: studentId }).eq('id', hostel_details_id);

      const feeMasterPromises = [];
      const selectedFeeMasters = feeGroups.filter(fg => fee_groups[fg.id]).flatMap(fg => fg.fee_masters.map(fm => fm.id));
      if (selectedFeeMasters.length > 0) {
        const feeAllocations = selectedFeeMasters.map(masterId => ({ branch_id: selectedBranch.id, student_id: studentId, fee_master_id: masterId }));
        feeMasterPromises.push(supabase.from('student_fee_allocations').insert(feeAllocations));
      }
      if (formData.carry_forward_fees && parseFloat(formData.carry_forward_fees) > 0) {
        feeMasterPromises.push(supabase.rpc('carry_forward_fees', { p_branch_id: selectedBranch.id, p_due_date: format(new Date(), 'yyyy-MM-dd'), p_students_balance: [{id: studentId, balance: formData.carry_forward_fees}] }));
      }
      await Promise.all(feeMasterPromises);
      
      const selectedDiscounts = Object.keys(fee_discounts).filter(id => fee_discounts[id]);
      if (selectedDiscounts.length > 0) {
        const discountAllocations = selectedDiscounts.map(discountId => ({ branch_id: selectedBranch.id, student_id: studentId, discount_id: discountId }));
        await supabase.from('student_fee_discounts').insert(discountAllocations);
      }

      if (parent_username && formData.father_email) {
        await supabase.functions.invoke('create-user', { body: { email: formData.father_email, password: parent_password, metadata: { username: parent_username, full_name: formData.father_name, role: 'parent', branch_id: selectedBranch.id, students: [studentId] } } });
      }

      if (Object.keys(customFieldValues).length > 0) {
        const { error: customDataError } = await supabase
          .from('student_custom_data')
          .insert({
            branch_id: selectedBranch.id,
            student_id: studentId,
            custom_data: customFieldValues
          });
        if (customDataError) console.error("Error saving custom data:", customDataError);
      }

      setAdmissionSuccessData({ school_code, username, password, parent_username, parent_password });
    } catch (error) {
      console.error("Admission Error:", error);
      const errorMessage = error.message || error.context?.error_description || 'An unknown error occurred.';
      const isDuplicate = errorMessage.includes('duplicate key value') || errorMessage.includes('already exists');
      toast({ variant: 'destructive', title: 'Admission Failed', description: isDuplicate ? `Duplicate Entry Detect (ID, Email or Aadhar)` : errorMessage });
      if (isDuplicate && schoolSettings?.student_admission_no_auto_generation) await generateNextId(schoolSettings);
    } finally {
      setLoading(false);
    }
  };
  
  const handleContinue = () => {
    setAdmissionSuccessData(null);
    resetForm();
  };
  
  const copyToClipboard = text => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Credentials copied to clipboard.' });
  };
  
  return (
    <DashboardLayout>
      {/* ? WORLD-CLASS Premium Header */}
      <div className="relative mb-10">
        {/* Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-blue-500/30 via-purple-500/20 to-pink-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-cyan-500/5 rounded-full blur-3xl animate-pulse delay-700" />
        </div>
        
        <div className="relative bg-gradient-to-br from-card/95 via-card/90 to-card/80 backdrop-blur-xl rounded-3xl border border-border/50 overflow-hidden">
          {/* Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 pointer-events-none" />
          
          <div className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left Side - Title & Info */}
              <div className="flex items-start gap-5">
                {/* Premium Icon */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-50 animate-pulse pointer-events-none" />
                  <div className="relative bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-5 rounded-2xl shadow-2xl">
                    <GraduationCap className="h-10 w-10 text-white drop-shadow-lg" />
                  </div>
                  {/* Live Indicator */}
                  <div className="absolute -top-1 -right-1 pointer-events-none">
                    <span className="relative flex h-5 w-5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-5 w-5 bg-gradient-to-r from-green-400 to-emerald-500 border-2 border-white shadow-lg"></span>
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-200 bg-clip-text text-transparent">
                      Student Admission
                    </h1>
                    <span className="px-3 py-1 bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-700 dark:text-emerald-300 text-sm font-bold rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      New
                    </span>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium">{selectedBranch?.branch_name || 'Select a branch'}</span>
                    </p>
                    <span className="text-muted-foreground/50">•</span>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      <span>{format(new Date(), 'dd MMM yyyy')}</span>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Right Side - Status Cards */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Quick Fill Badge */}
                <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl border border-blue-500/20 shadow-lg shadow-blue-500/5">
                  <div className="relative">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <div className="absolute inset-0 animate-ping">
                      <Zap className="h-4 w-4 text-blue-500 opacity-50" />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-blue-700 dark:text-blue-300">Smart Auto-Fill</span>
                </div>
                
                {/* Form Status Card */}
                <div className={cn(
                  "flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-lg transition-all duration-500",
                  isFormValid 
                    ? "bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/30 shadow-emerald-500/10" 
                    : "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 shadow-amber-500/10"
                )}>
                  {isFormValid ? (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500 rounded-full blur-md opacity-30 animate-pulse" />
                        <div className="relative bg-gradient-to-r from-emerald-500 to-green-500 p-2 rounded-full">
                          <BadgeCheck className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Ready to Submit</p>
                        <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">All fields validated</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 bg-amber-500 rounded-full blur-md opacity-30 animate-pulse" />
                        <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 p-2 rounded-full">
                          <AlertTriangle className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Incomplete Form</p>
                        <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Fill required fields</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {formSections.sort((a,b) => a.order - b.order).map(section => {
          // Special Blocks
          if (section.key === 'documents') {
            return (
                <SectionBox key={section.key} icon={ICON_MAP[section.icon] || Files} title={section.label} badge="Required" badgeColor="warning" gradient="orange">
                    <div className="col-span-full">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {masterDocuments.length > 0 ? masterDocuments.map(doc => (
                                <label 
                                  key={doc.name} 
                                  htmlFor={`doc-${doc.name}`}
                                  className={cn(
                                    "group flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300",
                                    formData.documents_received[doc.name] 
                                      ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/20 shadow-lg shadow-emerald-500/10" 
                                      : "border-border hover:border-primary/50 hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10 hover:shadow-md"
                                  )}
                                >
                                    <Checkbox 
                                      id={`doc-${doc.name}`} 
                                      checked={!!formData.documents_received[doc.name]} 
                                      onCheckedChange={checked => handleCheckboxChange(doc.name, checked)}
                                      className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 h-5 w-5"
                                    />
                                    <span className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors">
                                      {doc.name}
                                      {doc.is_required && <span className="text-red-500 ml-1">*</span>}
                                    </span>
                                </label>
                            )) : <p className="text-muted-foreground text-sm col-span-full text-center py-8">No document types configured.</p>}
                        </div>
                        {errors.documents_received && (
                          <p className="text-sm text-red-500 mt-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />{errors.documents_received}
                          </p>
                        )}
                    </div>
                </SectionBox>
            );
          }
          if (section.key === 'transport') {
              return (
                <SectionBox key={section.key} icon={Bus} title={section.label} badge={formData.transport_required ? "Enabled" : "Optional"} badgeColor={formData.transport_required ? "success" : "info"} gradient="green">
                    <div className="col-span-full">
                      <div className="flex items-center justify-between p-5 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl mb-6 border border-primary/20">
                        <div className="flex items-center gap-4">
                          <div className="bg-gradient-to-br from-primary to-primary/80 p-3 rounded-xl">
                            <Truck className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground">Enable Transport Facility</p>
                            <p className="text-sm text-muted-foreground">Student will use school transport service</p>
                          </div>
                        </div>
                        <Switch id="transport-required" checked={formData.transport_required} onCheckedChange={(checked) => handleChange('transport_required', checked)} className="scale-110" />
                      </div>
                    </div>
                    {formData.transport_required && (
                      <>
                        <SmartField label="Route Name" required error={errors.transport_route_id} touched={touched.transport_route_id} icon={MapPinned}>
                          <Select value={formData.transport_route_id || ''} onValueChange={v => handleChange('transport_route_id', v)}>
                            <SelectTrigger onBlur={() => handleBlur('transport_route_id')} className="h-11"><SelectValue placeholder="Select a route" /></SelectTrigger>
                            <SelectContent>{routes.map(r => <SelectItem key={r.id} value={r.id}>{r.route_title}</SelectItem>)}</SelectContent>
                          </Select>
                        </SmartField>
                        <SmartField label="Stop Name" required error={errors.transport_pickup_point_id} touched={touched.transport_pickup_point_id}>
                          <Select value={formData.transport_pickup_point_id || ''} onValueChange={v => handleChange('transport_pickup_point_id', v)} disabled={!formData.transport_route_id}>
                            <SelectTrigger onBlur={() => handleBlur('transport_pickup_point_id')} className="h-11"><SelectValue placeholder="Select pickup point" /></SelectTrigger>
                            <SelectContent>{pickupPoints.map(p => <SelectItem key={p.pickup_point.id} value={p.pickup_point.id}>{p.pickup_point.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </SmartField>
                        <SmartField label="Transport Fee" hint="Auto-calculated" icon={IndianRupee}>
                          <Input value={formData.transport_fee} readOnly disabled className="h-11 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" />
                        </SmartField>
                        <SmartField label="Pickup Time" icon={Clock}>
                          <Input type="time" value={formData.pickup_time} onChange={e => handleChange('pickup_time', e.target.value)} className="h-11" />
                        </SmartField>
                        <SmartField label="Drop Time" icon={Clock}>
                          <Input type="time" value={formData.drop_time} onChange={e => handleChange('drop_time', e.target.value)} className="h-11" />
                        </SmartField>
                        <SmartField label="Vehicle Number">
                          <Input value={formData.vehicle_number} onChange={e => handleChange('vehicle_number', e.target.value)} placeholder="KA-01-XX-1234" className="h-11" />
                        </SmartField>
                        <SmartField label="Driver Name" icon={User}>
                          <Input value={formData.driver_name} onChange={e => handleChange('driver_name', e.target.value)} className="h-11" />
                        </SmartField>
                        <SmartField label="Driver Contact" icon={PhoneCall}>
                          <Input type="tel" value={formData.driver_contact} onChange={e => handleChange('driver_contact', e.target.value)} className="h-11" />
                        </SmartField>
                        <SmartField label="Special Instructions" className="lg:col-span-4">
                          <Textarea value={formData.transport_special_instructions} onChange={e => handleChange('transport_special_instructions', e.target.value)} placeholder="Any special requirements or instructions..." className="min-h-[80px]" />
                        </SmartField>
                      </>
                    )}
                </SectionBox>
              );
          }
          if (section.key === 'hostel') {
              return (
                <SectionBox key={section.key} icon={BedDouble} title={section.label} badge={formData.hostel_required ? "Enabled" : "Optional"} badgeColor={formData.hostel_required ? "success" : "info"} gradient="purple">
                    <div className="col-span-full">
                      <div className="flex items-center justify-between p-5 bg-gradient-to-r from-purple-500/10 to-violet-500/10 rounded-2xl mb-6 border border-purple-500/20">
                        <div className="flex items-center gap-4">
                          <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-3 rounded-xl">
                            <Bed className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground">Enable Hostel Facility</p>
                            <p className="text-sm text-muted-foreground">Student will stay in school hostel</p>
                          </div>
                        </div>
                        <Switch id="hostel-required" checked={formData.hostel_required} onCheckedChange={(checked) => handleChange('hostel_required', checked)} className="scale-110" />
                      </div>
                    </div>
                    {formData.hostel_required && (
                      <>
                        <SmartField label="Hostel Name" required error={errors.hostel_id} touched={touched.hostel_id} icon={Building2}>
                          <Select value={formData.hostel_id || ''} onValueChange={v => handleChange('hostel_id', v)}>
                            <SelectTrigger onBlur={() => handleBlur('hostel_id')} className="h-11"><SelectValue placeholder="Select Hostel" /></SelectTrigger>
                            <SelectContent>{hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </SmartField>
                        <SmartField label="Room Type" required error={errors.hostel_room_type} touched={touched.hostel_room_type}>
                          <Select value={formData.hostel_room_type || ''} onValueChange={v => handleChange('hostel_room_type', v)}>
                            <SelectTrigger onBlur={() => handleBlur('hostel_room_type')} className="h-11"><SelectValue placeholder="Select Room Type" /></SelectTrigger>
                            <SelectContent>{hostelRoomTypes.map(rt => <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </SmartField>
                        <SmartField label="Room Number">
                          <Input value={formData.room_number} onChange={e => handleChange('room_number', e.target.value)} className="h-11" />
                        </SmartField>
                        <SmartField label="Bed Number">
                          <Input value={formData.bed_number} onChange={e => handleChange('bed_number', e.target.value)} className="h-11" />
                        </SmartField>
                        <SmartField label="Hostel Fee" hint="Auto-calculated" icon={IndianRupee}>
                          <Input value={formData.hostel_fee} readOnly disabled className="h-11 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800" />
                        </SmartField>
                        <DatePicker id="check_in_date" label="Check-in Date" value={formData.check_in_date} onChange={date => handleChange('check_in_date', date)} />
                        <DatePicker id="check_out_date" label="Check-out Date" value={formData.check_out_date} onChange={date => handleChange('check_out_date', date)} />
                        <SmartField label="Guardian Contact" icon={Phone}>
                          <Input type="tel" value={formData.hostel_guardian_contact} onChange={e => handleChange('hostel_guardian_contact', e.target.value)} className="h-11" />
                        </SmartField>
                        <SmartField label="Emergency Contact" icon={Phone}>
                          <Input type="tel" value={formData.hostel_emergency_contact} onChange={e => handleChange('hostel_emergency_contact', e.target.value)} className="h-11" />
                        </SmartField>
                        <SmartField label="Special Requirements" className="lg:col-span-3">
                          <Textarea value={formData.hostel_special_requirements} onChange={e => handleChange('hostel_special_requirements', e.target.value)} placeholder="Dietary requirements, medical needs, etc..." className="min-h-[80px]" />
                        </SmartField>
                      </>
                    )}
                </SectionBox>
              );
          }
          
          // Regular Dynamic Sections
          const sectionFields = allFields.filter(f => f.section_key === section.key).sort((a,b) => a.sort_order - b.sort_order);
          const hasFields = sectionFields.length > 0;
          const isAcademic = section.key === 'academic_details';
          
          // Skip mother_details as it's combined with father_details
          if (section.key === 'mother_details') return null;
          
          // Assign gradient colors based on section type
          const sectionGradients = {
            'academic_details': 'blue',
            'student_details': 'purple',
            'address_details': 'green',
            'student_login': 'orange',
            'parent_login': 'orange',
            'father_details': 'blue', // Now contains both Father & Mother
            'mother_details': 'pink',
            'guardian_details': 'purple',
            'additional_details': 'green',
          };
          
          if (!hasFields && !isAcademic) return null;

          // For father_details, also include mother_details fields
          let combinedFields = sectionFields;
          let combinedTitle = section.label;
          if (section.key === 'father_details') {
            const motherSection = formSections.find(s => s.key === 'mother_details');
            const motherFields = allFields.filter(f => f.section_key === 'mother_details').sort((a,b) => a.sort_order - b.sort_order);
            combinedFields = [...sectionFields, ...motherFields];
            combinedTitle = 'Parents Details'; // Combined title
          }
          
          // Separate photo fields from regular fields for better layout
          const photoFields = combinedFields.filter(f => ['student_photo', 'father_photo', 'mother_photo', 'guardian_photo'].includes(f.field_name));
          const regularFields = combinedFields.filter(f => !['student_photo', 'father_photo', 'mother_photo', 'guardian_photo'].includes(f.field_name));
          
          // For combined Parents Details, separate Father and Mother fields for cleaner display
          const fatherFields = regularFields.filter(f => f.section_key === 'father_details');
          const motherFields = regularFields.filter(f => f.section_key === 'mother_details');
          const fatherPhotos = photoFields.filter(f => f.field_name === 'father_photo');
          const motherPhotos = photoFields.filter(f => f.field_name === 'mother_photo');
          const otherPhotos = photoFields.filter(f => !['father_photo', 'mother_photo'].includes(f.field_name));
          const isCombinedParents = section.key === 'father_details' && motherFields.length > 0;

          return (
            <SectionBox key={section.key} icon={ICON_MAP[section.icon] || User} title={combinedTitle} gradient={sectionGradients[section.key] || 'blue'}>
                {isCombinedParents ? (
                  <>
                    {/* Father Section */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-blue-200 dark:border-blue-800">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-blue-700 dark:text-blue-300">Father Details</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {fatherFields.map(field => (
                            <React.Fragment key={field.id || field.key}>
                                {renderDynamicField(field)}
                            </React.Fragment>
                        ))}
                        {fatherPhotos.map(field => (
                            <React.Fragment key={field.id || field.key}>
                                {renderDynamicField(field)}
                            </React.Fragment>
                        ))}
                      </div>
                    </div>
                    
                    {/* Mother Section */}
                    <div>
                      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-pink-200 dark:border-pink-800">
                        <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-2.5 rounded-xl">
                          <Heart className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-pink-700 dark:text-pink-300">Mother Details</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {motherFields.map(field => (
                            <React.Fragment key={field.id || field.key}>
                                {renderDynamicField(field)}
                            </React.Fragment>
                        ))}
                        {motherPhotos.map(field => (
                            <React.Fragment key={field.id || field.key}>
                                {renderDynamicField(field)}
                            </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Simple 4-column grid - Photo integrated */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {regularFields.map(field => (
                        <React.Fragment key={field.id || field.key}>
                            {renderDynamicField(field)}
                        </React.Fragment>
                    ))}
                    {/* Photo in same grid */}
                    {photoFields.map(field => (
                        <React.Fragment key={field.id || field.key}>
                            {renderDynamicField(field)}
                        </React.Fragment>
                    ))}
                  </div>
                )}
                
                {/* Academic Extra: Siblings */}
                {isAcademic && (
                    <div className="mt-6 pt-6 border-t border-border/30">
                        <Label className="flex items-center gap-2 mb-3 text-sm font-semibold">
                          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary/10">
                            <Users className="h-3.5 w-3.5 text-primary" />
                          </span>
                          Linked Siblings
                        </Label>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full h-12 border-2 border-dashed hover:border-primary hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 rounded-xl transition-all duration-300 group">
                              <UserPlus className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" /> Add Sibling from Existing Students
                            </Button>
                          </DialogTrigger>
                          <AddSiblingModal onSiblingAdd={handleSiblingAdd} />
                        </Dialog>
                        {formData.siblings && formData.siblings.length > 0 && (
                          <div className="mt-4 space-y-3">
                            {formData.siblings.map(s => (
                              <div key={s.id} className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200">
                                <div className="flex items-center gap-3">
                                  <div className="bg-gradient-to-br from-primary to-primary/80 p-2 rounded-xl">
                                    <User className="h-4 w-4 text-white" />
                                  </div>
                                  <span className="font-bold">{s.full_name}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors" onClick={() => removeSibling(s.id)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                )}
            </SectionBox>
          );
        })}

        {/* ? Premium Fees Block */}
        <SectionBox icon={Banknote} title="Fees Details" badge="Required" badgeColor="warning" gradient="green">
          <div className="space-y-6">
            {formData.siblings.length > 0 && (
              <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-300 dark:border-amber-800 rounded-2xl">
                <SmartField label="Carry Forward Fees from Siblings" hint="Amount in ?" icon={IndianRupee}>
                  <Input 
                    value={formData.carry_forward_fees} 
                    type="number" 
                    placeholder="0.00" 
                    onChange={e => handleChange('carry_forward_fees', e.target.value)} 
                    className="h-12 text-lg font-bold"
                  />
                </SmartField>
              </div>
            )}
            
            <div className="space-y-4">
              {feeGroups.filter(group => !group.name.startsWith('Quick Fees')).map(group => (
                <Collapsible key={group.id}>
                  <div className={cn(
                    "flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300",
                    formData.fee_groups[group.id] 
                      ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/20 shadow-lg shadow-emerald-500/10" 
                      : "border-border hover:border-primary/50 hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10 hover:shadow-md"
                  )}>
                    <div className="flex items-center gap-4">
                      <Checkbox 
                        id={`fee-group-${group.id}`} 
                        checked={!!formData.fee_groups[group.id]} 
                        onCheckedChange={checked => handleFeeGroupChange(group.id, checked)}
                        className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 h-5 w-5"
                      />
                      <label htmlFor={`fee-group-${group.id}`} className="font-bold text-foreground cursor-pointer text-base">{group.name}</label>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-100 dark:bg-emerald-900/40 px-4 py-2 rounded-xl">
                        <span className="font-black text-xl text-emerald-700 dark:text-emerald-300">?{group.fee_masters.reduce((acc, master) => acc + master.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-primary/10">
                          <ChevronDown className="h-5 w-5" />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                  <CollapsibleContent className="mt-3 ml-10 space-y-2">
                    {group.fee_masters.map(master => (
                      <div key={master.id} className="flex justify-between text-sm p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 hover:from-primary/10 hover:to-primary/5 transition-all duration-200 border border-border/50">
                        <span className="flex items-center gap-3 text-foreground/80">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-primary/50" />
                          <span className="font-medium">{master.fee_types.name}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{master.fee_types.code}</span>
                        </span>
                        <div className="flex items-center gap-8">
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(master.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="font-bold text-foreground">?{master.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
            {errors.fee_groups && (
              <p className="text-sm text-red-500 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />{errors.fee_groups}
              </p>
            )}
          </div>
        </SectionBox>
        
        {/* ? Premium Discount Block */}
        <SectionBox icon={Gift} title="Fees Discount" badge="Optional" badgeColor="info" gradient="pink">
          <div>
            {feeDiscounts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {feeDiscounts.map(discount => (
                  <label 
                    key={discount.id}
                    htmlFor={`discount-${discount.id}`}
                    className={cn(
                      "group flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300",
                      formData.fee_discounts[discount.id] 
                        ? "border-pink-500 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/30 dark:to-rose-900/20 shadow-lg shadow-pink-500/10" 
                        : "border-border hover:border-pink-500/50 hover:bg-gradient-to-br hover:from-pink-50/50 hover:to-rose-50/50 dark:hover:from-pink-900/20 dark:hover:to-rose-900/10 hover:shadow-md"
                    )}
                  >
                    <Checkbox 
                      id={`discount-${discount.id}`} 
                      checked={!!formData.fee_discounts[discount.id]} 
                      onCheckedChange={checked => handleDiscountChange(discount.id, checked)}
                      className="data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500 h-5 w-5"
                    />
                    <span className="text-sm font-semibold group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">{discount.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-muted to-muted/50 p-4 rounded-2xl w-fit mx-auto mb-4">
                  <Tag className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No fee discounts available</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Discounts can be configured in Fee Management</p>
              </div>
            )}
          </div>
        </SectionBox>

        {/* ? Premium Submit Section */}
        <div className="sticky bottom-4 z-10">
          <div className="relative overflow-hidden bg-card/95 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent pointer-events-none" />
            
            <div className="relative p-5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Status Info */}
                <div className="flex items-center gap-4">
                  {isFormValid ? (
                    <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-xl border border-emerald-500/20">
                      <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-1.5 rounded-lg">
                        <ShieldCheck className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Validation Passed</p>
                        <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">All required fields are filled correctly</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-1.5 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Validation Required</p>
                        <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Please fill all fields marked with *</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={resetForm}
                    className="h-12 px-6 rounded-xl border-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-950 dark:hover:border-red-800 dark:hover:text-red-400 transition-all duration-300"
                  >
                    <X className="mr-2 h-4 w-4" /> Reset
                  </Button>
                  
                  <Button 
                    onClick={handleSave} 
                    disabled={loading || isAadharChecking} 
                    size="lg"
                    className="h-12 px-8 rounded-xl font-bold text-base transition-all duration-500 relative overflow-hidden group bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105"
                  >
                    {/* Button Shine Effect */}
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        <span>Save Student</span>
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* ? Premium Success Dialog */}
      <AlertDialog open={!!admissionSuccessData}>
        <AlertDialogContent className="max-w-lg p-0 overflow-hidden border-0 bg-transparent shadow-2xl">
          <div className="relative bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-gray-900 dark:via-emerald-950 dark:to-green-950 rounded-3xl overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-emerald-400/30 to-green-500/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-br from-teal-400/20 to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500" />
            </div>
            
            <div className="relative p-8">
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full blur-2xl opacity-40 animate-pulse pointer-events-none" />
                  <div className="relative bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 p-5 rounded-full shadow-2xl">
                    <Award className="w-12 h-12 text-white drop-shadow-lg" />
                  </div>
                  {/* Confetti Effect */}
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce pointer-events-none" />
                  <div className="absolute -top-1 -right-3 w-3 h-3 bg-pink-400 rounded-full animate-bounce delay-100 pointer-events-none" />
                  <div className="absolute -bottom-2 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-bounce delay-200 pointer-events-none" />
                </div>
              </div>
              
              <AlertDialogHeader className="items-center space-y-2">
                <AlertDialogTitle className="text-3xl font-black text-transparent bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 dark:from-emerald-400 dark:via-green-400 dark:to-teal-400 bg-clip-text">
                  ?? Admission Successful!
                </AlertDialogTitle>
                <AlertDialogDescription className="text-center text-gray-600 dark:text-gray-300 text-base">
                  The student has been successfully enrolled. Please share the credentials below.
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="mt-8 space-y-4">
                {/* Student Credentials Card */}
                <div className="p-5 bg-white/80 dark:bg-black/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-lg backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-emerald-100 dark:border-emerald-900">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-xl">
                      <UserCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Student Login</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl group hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <Hash className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300"><strong>Admission No:</strong></span>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{admissionSuccessData?.school_code}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl group hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300"><strong>Username:</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">{admissionSuccessData?.username}</span>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-800" onClick={() => copyToClipboard(admissionSuccessData?.username)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl group hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <Key className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300"><strong>Password:</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">{admissionSuccessData?.password}</span>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-800" onClick={() => copyToClipboard(admissionSuccessData?.password)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Parent Credentials Card */}
                {admissionSuccessData?.parent_username && (
                  <div className="p-5 bg-white/80 dark:bg-black/30 rounded-2xl border border-purple-200 dark:border-purple-800 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-purple-100 dark:border-purple-900">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-xl">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Parent Login</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl group hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-300"><strong>Username:</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">{admissionSuccessData?.parent_username}</span>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800" onClick={() => copyToClipboard(admissionSuccessData?.parent_username)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl group hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <Key className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-300"><strong>Password:</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">{admissionSuccessData?.parent_password}</span>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800" onClick={() => copyToClipboard(admissionSuccessData?.parent_password)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <AlertDialogAction 
                onClick={handleContinue} 
                className="w-full mt-6 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 text-white h-14 text-lg font-bold rounded-2xl shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02] group"
              >
                <UserPlus className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Add Next Student
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};
export default StudentAdmission;
