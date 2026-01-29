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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BookOpen, User, Key, Users, Bus, FileText, UserCog, Save, Shield, Loader2, UserPlus, FileCheck2, Copy, Percent, Wallet, AlertCircle, Building, X, Sparkles, BedDouble, GraduationCap, Phone, MapPin, Files, CheckCircle2, ChevronDown, ChevronUp, Camera, Mail, CreditCard, Home, Heart, School, CalendarDays, Hash, Globe, FileUp, Info, Zap, Search } from 'lucide-react';
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

// Enhanced Section Box with modern design
const SectionBox = ({ icon, title, children, className, collapsible = false, defaultOpen = true, badge, badgeColor = 'primary' }) => {
  const Icon = icon || FileText;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const badgeColors = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  return (
    <div className={cn(
      "bg-gradient-to-br from-card to-card/80 rounded-2xl shadow-xl border border-border/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-primary/20",
      className
    )}>
      <div 
        className={cn(
          "flex items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-primary/5 via-transparent to-transparent border-b border-border/50",
          collapsible && "cursor-pointer hover:bg-primary/5 transition-colors"
        )}
        onClick={() => collapsible && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="bg-gradient-to-br from-primary to-primary/80 p-3 rounded-xl shadow-lg shadow-primary/25">
              <Icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-card animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">{title}</h2>
            {badge && (
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", badgeColors[badgeColor])}>
                {badge}
              </span>
            )}
          </div>
        </div>
        {collapsible && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        )}
      </div>
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        isOpen ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
      )}>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Smart Input Field with floating label effect
const SmartField = ({ label, required, error, touched, children, className, hint, icon: FieldIcon }) => (
  <div className={cn("space-y-1.5", className)}>
    <Label className="flex items-center gap-2 text-sm font-medium text-foreground/80">
      {FieldIcon && <FieldIcon className="h-3.5 w-3.5 text-muted-foreground" />}
      {label}
      {required && <span className="text-red-500 font-bold">*</span>}
      {hint && (
        <span className="ml-auto text-xs text-muted-foreground font-normal flex items-center gap-1">
          <Info className="h-3 w-3" />{hint}
        </span>
      )}
    </Label>
    {children}
    {touched && error && (
      <p className="text-xs text-red-500 flex items-center gap-1 animate-in slide-in-from-top-1">
        <AlertCircle className="h-3 w-3" />{error}
      </p>
    )}
  </div>
);

// Photo Upload Card with preview
const PhotoUploadCard = ({ label, preview, onFileChange, required }) => (
  <div className="space-y-2">
    <Label className="flex items-center gap-2 text-sm font-medium">
      <Camera className="h-3.5 w-3.5 text-muted-foreground" />
      {label}
      {required && <span className="text-red-500">*</span>}
    </Label>
    <div className="relative group">
      <div className={cn(
        "w-full aspect-square max-w-[120px] rounded-xl border-2 border-dashed transition-all duration-300 flex items-center justify-center overflow-hidden",
        preview ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50 hover:bg-primary/5"
      )}>
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center p-2">
            <Camera className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">Click to upload</span>
          </div>
        )}
      </div>
      <div className="absolute inset-0 max-w-[120px]">
        <ImageUploader onFileChange={onFileChange} initialPreview={preview} className="opacity-0 absolute inset-0 cursor-pointer" />
      </div>
    </div>
  </div>
);

const initialFormData = {
  school_code: '',
  admission_date: format(new Date(), 'yyyy-MM-dd'),
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
  email: '',
  aadhar_no: '',
  city: '',
  state: '',
  present_address: '',
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
  const DynamicField = ({ field }) => {
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
                <div className="md:col-span-1">
                    <PhotoUploadCard 
                      label={label} 
                      preview={handler.preview}
                      onFileChange={file => handleFileChange(file, handler.setFile, handler.setPreview)}
                      required={isRequired}
                    />
                    {isRequired && !handler.file && touched[field.field_name] && <span className="text-xs text-red-500 mt-1 block">Image is required</span>}
                </div>
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
        case 'national_id_no':
        case 'father_aadhar_no':
        case 'mother_aadhar_no':
            return (
              <SmartField label={label} required={isRequired} error={(field.field_name === 'national_id_no' ? aadharError : null) || (touched[field.field_name] && errors[field.field_name])} touched icon={CreditCard}>
                <AadharInput 
                  value={formData[field.field_name] || ''} 
                  onChange={val => {
                    handleChange(field.field_name, val);
                    if(field.field_name === 'national_id_no') validateAadhar(val);
                  }} 
                  checkDuplicates={field.field_name === 'national_id_no'} 
                  error={null}
                  className="h-11"
                />
              </SmartField>
            )
        case 'pincode':
            return (
              <SmartField label={label} required={isRequired} error={errors.pincode} touched={touched.pincode} icon={MapPin} hint="Auto-fills address">
                <div className="relative">
                  <Input
                    value={pincode}
                    placeholder="Enter 6-digit pincode"
                    onChange={e => {
                      const cleaned = (e.target.value || '').replace(/\D/g, '').slice(0, 6);
                      setPincode(cleaned);
                    }}
                    onBlur={() => handleBlur('pincode')}
                    maxLength={6}
                    className="h-11"
                  />
                  {pincodeLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
                  {pincode.length === 6 && !pincodeLoading && formData.city && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
              </SmartField>
            );
        case 'username':
        case 'parent_username':
             const isDisabled = field.field_name === 'username' ? schoolSettings?.student_username_auto_generation : schoolSettings?.parent_username_auto_generation;
             return (
              <SmartField label={label} required={isRequired} error={errors[field.field_name]} touched={touched[field.field_name]} icon={User} hint={isDisabled ? "Auto-generated" : null}>
                <Input 
                  value={formData[field.field_name]} 
                  placeholder={label}
                  onChange={e => handleChange(field.field_name, e.target.value)} 
                  onBlur={() => handleBlur(field.field_name)} 
                  disabled={isDisabled} 
                  className={cn("h-11", isDisabled && "bg-muted/50")}
                />
              </SmartField>
             );
        case 'password':
        case 'retype_password':
        case 'parent_password':
        case 'parent_retype_password':
            return (
              <SmartField label={label} required={isRequired} error={errors[field.field_name]} touched={touched[field.field_name]} icon={Key} hint={schoolSettings?.password_auto_generation ? "Auto-generated" : null}>
                <Input 
                  type="password" 
                  value={formData[field.field_name]} 
                  placeholder="••••••••"
                  onChange={e => handleChange(field.field_name, e.target.value)} 
                  onBlur={() => handleBlur(field.field_name)} 
                  disabled={schoolSettings?.password_auto_generation} 
                  className={cn("h-11", schoolSettings?.password_auto_generation && "bg-muted/50")}
                />
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
        case 'father_phone':
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
        case 'present_address':
        case 'permanent_address':
             return (
              <SmartField label={label} required={isRequired} className="lg:col-span-2" icon={Home}>
                <Textarea 
                  value={formData[field.field_name]} 
                  placeholder={`Enter ${label.toLowerCase()}...`}
                  onChange={e => handleChange(field.field_name, e.target.value)}
                  onBlur={() => handleBlur(field.field_name)}
                  className="min-h-[80px] resize-none"
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


  // Validation Logic
  useEffect(() => {
    const validateForm = () => {
      const newErrors = {};
      
      allFields.forEach(field => {
         if(!field.is_enabled) return;
         if(field.is_required) {
             const val = field.is_system ? formData[field.field_name] : customFieldValues[field.field_key];
             const isEmpty = val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0);
             if(isEmpty) {
                 const errKey = field.is_system ? field.field_name : `custom_${field.id}`;
                 newErrors[errKey] = `${field.field_label} is required`;
             }
         }
         
         if(field.field_name === 'pincode' && (!pincode || !/^\d{6}$/.test(pincode))) newErrors.pincode = "Valid 6-digit Pincode is required";
         if((field.field_name === 'phone' || field.field_name === 'father_phone') && formData[field.field_name] && !/^\d{10}$/.test(formData[field.field_name])) {
             newErrors[field.field_name] = "Valid 10-digit Mobile No is required";
         }
         if((field.field_name === 'national_id_no' || field.field_name === 'father_aadhar_no' || field.field_name === 'mother_aadhar_no') && formData[field.field_name] && formData[field.field_name].length !== 12) {
             newErrors[field.field_name] = "Valid 12-digit Aadhar No is required";
         }
      });

      // Complex Validations
      if (formData.password && formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
      if (formData.password !== formData.retype_password) newErrors.retype_password = "Passwords do not match";
      if (formData.parent_password && formData.parent_password.length < 6) newErrors.parent_password = "Password must be at least 6 characters";
      if (formData.parent_password !== formData.parent_retype_password) newErrors.parent_retype_password = "Passwords do not match";

      // Fees
      if (!Object.values(formData.fee_groups).some(v => v)) newErrors.fee_groups = "At least one fee must be selected";

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
      setIsFormValid(Object.keys(newErrors).length === 0 && !rollNumberError && !studentEmailError && !fatherEmailError && !aadharError);
    };

    validateForm();
  }, [formData, customFieldValues, allFields, pincode, profilePictureFile, rollNumberError, studentEmailError, fatherEmailError, aadharError, masterDocuments]);

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

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
    setFormData(prev => ({
      ...prev,
      school_code: newId,
      username: settings.student_username_auto_generation ? `${settings.student_username_prefix || ''}${newId}` : prev.username,
      parent_username: settings.parent_username_auto_generation ? `${settings.parent_username_prefix || ''}${newId}` : prev.parent_username,
      password: settings.password_auto_generation ? settings.password_default || '' : prev.password,
      retype_password: settings.password_auto_generation ? settings.password_default || '' : prev.retype_password,
      parent_password: settings.password_auto_generation ? settings.password_default || '' : prev.parent_password,
      parent_retype_password: settings.password_auto_generation ? settings.password_default || '' : prev.parent_retype_password
    }));
    return newId;
  }, [selectedBranch?.id, toast]);
  
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
        customFieldsRes
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
        api.get('/form-settings', { params: { branchId, module: 'student_admission' } })
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
    // Use branch_id as school_id since in this system they are often the same
    const schoolId = schoolSettings?.school_id || selectedBranch?.id;
    const { data, error } = await supabase.rpc('get_last_roll_number', { p_branch_id: selectedBranch.id, p_class_id: classId, p_school_id: schoolId, p_section_id: sectionId });
    if (error) {
      console.error('[StudentAdmission] Roll number fetch error:', error);
      toast({ variant: 'destructive', title: 'Could not fetch next roll number.' });
    } else {
      const nextRollNumber = (data || 0) + 1;
      handleChange('roll_number', nextRollNumber.toString().padStart(2, '0'));
    }
    setIsRollNumberLoading(false);
  }, [selectedBranch?.id, schoolSettings?.school_id, toast, rollNumberManuallyEdited]);
  
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
    setFormData(prev => ({ ...prev, section_id: '' }));
  }, [formData.class_id]);

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
      handleChange('transport_pickup_point_id', '');
      handleChange('transport_fee', 0);
    };
    fetchTransportDetails();
  }, [formData.transport_route_id, toast]);

  useEffect(() => {
    const selectedPoint = pickupPoints.find(p => p.pickup_point.id === formData.transport_pickup_point_id);
    if (selectedPoint) {
      handleChange('transport_fee', selectedPoint.monthly_fees);
      handleChange('pickup_time', selectedPoint.pickup_time);
    } else {
      handleChange('transport_fee', 0);
      handleChange('pickup_time', '');
    }
  }, [formData.transport_pickup_point_id, pickupPoints]);
  
  useEffect(() => {
    const selectedRoomType = hostelRoomTypes.find(rt => rt.id === formData.hostel_room_type);
    if (selectedRoomType) {
        handleChange('hostel_fee', selectedRoomType.cost);
    } else {
        handleChange('hostel_fee', 0);
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
    if (!isFormValid) {
        const firstErrorField = Object.keys(errors)[0];
        if(firstErrorField) {
            const element = document.querySelector(`[name="${firstErrorField}"], [id="${firstErrorField}"]`);
            if(element) element.focus();
        }
        toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fill all mandatory fields marked with *.' });
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
        class_id, section_id, admission_date, school_code, 
        siblings, sibling_group_id, fee_groups, fee_discounts, 
        ...restOfForm 
    } = formData;
    
    const current_session_id = schoolSettings?.current_session_id;
    if (!current_session_id) {
      toast({ variant: 'destructive', title: 'Session Error', description: 'Current session not found for school. Please configure the current session in System Settings.' });
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
        session_id: current_session_id,
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
      {/* Modern Header with Gradient */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/5 to-blue-500/10 rounded-3xl blur-xl" />
        <div className="relative bg-gradient-to-br from-card via-card to-card/80 rounded-2xl border border-border/50 p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="bg-gradient-to-br from-primary via-purple-500 to-blue-500 p-4 rounded-2xl shadow-lg shadow-primary/30">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <span className="flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-card"></span>
                  </span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Student Admission
                </h1>
                <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span>{selectedBranch?.branch_name || 'Select a branch'}</span>
                </p>
              </div>
            </div>
            
            {/* Quick Stats / Progress */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Quick Fill Enabled</span>
              </div>
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl transition-colors",
                isFormValid ? "bg-green-100 dark:bg-green-900/30" : "bg-amber-100 dark:bg-amber-900/30"
              )}>
                {isFormValid ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">Ready to Submit</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Fill Required Fields</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {formSections.sort((a,b) => a.order - b.order).map(section => {
          // Special Blocks
          if (section.key === 'documents') {
            return (
                <SectionBox key={section.key} icon={ICON_MAP[section.icon] || Files} title={section.label} badge="Required" badgeColor="warning">
                    <div className="col-span-full">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {masterDocuments.length > 0 ? masterDocuments.map(doc => (
                                <label 
                                  key={doc.name} 
                                  htmlFor={`doc-${doc.name}`}
                                  className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200",
                                    formData.documents_received[doc.name] 
                                      ? "border-primary bg-primary/5 shadow-sm" 
                                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                                  )}
                                >
                                    <Checkbox 
                                      id={`doc-${doc.name}`} 
                                      checked={!!formData.documents_received[doc.name]} 
                                      onCheckedChange={checked => handleCheckboxChange(doc.name, checked)}
                                      className="data-[state=checked]:bg-primary"
                                    />
                                    <span className="text-sm font-medium leading-tight">
                                      {doc.name}
                                      {doc.is_required && <span className="text-red-500 ml-1">*</span>}
                                    </span>
                                </label>
                            )) : <p className="text-muted-foreground text-sm col-span-full text-center py-8">No document types configured.</p>}
                        </div>
                        {errors.documents_received && (
                          <p className="text-sm text-red-500 mt-3 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />{errors.documents_received}
                          </p>
                        )}
                    </div>
                </SectionBox>
            );
          }
          if (section.key === 'transport') {
              return (
                <SectionBox key={section.key} icon={Bus} title={section.label} badge={formData.transport_required ? "Enabled" : "Optional"} badgeColor={formData.transport_required ? "success" : "info"}>
                    <div className="col-span-full">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl mb-4">
                        <div className="flex items-center gap-3">
                          <Bus className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Enable Transport Facility</p>
                            <p className="text-xs text-muted-foreground">Student will use school transport</p>
                          </div>
                        </div>
                        <Switch id="transport-required" checked={formData.transport_required} onCheckedChange={(checked) => handleChange('transport_required', checked)} />
                      </div>
                    </div>
                    {formData.transport_required && (
                      <>
                        <SmartField label="Route Name" required error={errors.transport_route_id} touched={touched.transport_route_id} icon={MapPin}>
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
                        <SmartField label="Transport Fee" hint="Auto-calculated">
                          <Input value={formData.transport_fee} readOnly disabled className="h-11 bg-muted/50" />
                        </SmartField>
                        <SmartField label="Pickup Time">
                          <Input type="time" value={formData.pickup_time} onChange={e => handleChange('pickup_time', e.target.value)} className="h-11" />
                        </SmartField>
                        <SmartField label="Drop Time">
                          <Input type="time" value={formData.drop_time} onChange={e => handleChange('drop_time', e.target.value)} className="h-11" />
                        </SmartField>
                        <SmartField label="Vehicle Number">
                          <Input value={formData.vehicle_number} onChange={e => handleChange('vehicle_number', e.target.value)} placeholder="KA-01-XX-1234" className="h-11" />
                        </SmartField>
                        <SmartField label="Driver Name">
                          <Input value={formData.driver_name} onChange={e => handleChange('driver_name', e.target.value)} className="h-11" />
                        </SmartField>
                        <SmartField label="Driver Contact" icon={Phone}>
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
                <SectionBox key={section.key} icon={BedDouble} title={section.label} badge={formData.hostel_required ? "Enabled" : "Optional"} badgeColor={formData.hostel_required ? "success" : "info"}>
                    <div className="col-span-full">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl mb-4">
                        <div className="flex items-center gap-3">
                          <BedDouble className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Enable Hostel Facility</p>
                            <p className="text-xs text-muted-foreground">Student will stay in school hostel</p>
                          </div>
                        </div>
                        <Switch id="hostel-required" checked={formData.hostel_required} onCheckedChange={(checked) => handleChange('hostel_required', checked)} />
                      </div>
                    </div>
                    {formData.hostel_required && (
                      <>
                        <SmartField label="Hostel Name" required error={errors.hostel_id} touched={touched.hostel_id} icon={Building}>
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
                        <SmartField label="Hostel Fee" hint="Auto-calculated">
                          <Input value={formData.hostel_fee} readOnly disabled className="h-11 bg-muted/50" />
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
          
          if (!hasFields && !isAcademic) return null;

          return (
            <SectionBox key={section.key} icon={ICON_MAP[section.icon] || User} title={section.label}>
                {sectionFields.map(field => <DynamicField key={field.id || field.key} field={field} />)}
                
                {/* Academic Extra: Siblings */}
                {isAcademic && (
                    <div className="lg:col-span-2 md:col-span-2">
                        <Label className="flex items-center gap-2 mb-2">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          Siblings
                        </Label>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full h-11 border-dashed hover:border-primary hover:bg-primary/5">
                              <UserPlus className="mr-2 h-4 w-4" /> Add Sibling from Existing Students
                            </Button>
                          </DialogTrigger>
                          <AddSiblingModal onSiblingAdd={handleSiblingAdd} />
                        </Dialog>
                        {formData.siblings && formData.siblings.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {formData.siblings.map(s => (
                              <div key={s.id} className="flex items-center justify-between bg-primary/5 border border-primary/20 p-3 rounded-xl">
                                <div className="flex items-center gap-2">
                                  <div className="bg-primary/10 p-1.5 rounded-lg">
                                    <User className="h-4 w-4 text-primary" />
                                  </div>
                                  <span className="font-medium">{s.full_name}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-100 hover:text-red-600" onClick={() => removeSibling(s.id)}>
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

        {/* Fees Block with Enhanced Design */}
        <SectionBox icon={Wallet} title="Fees Details" badge="Required" badgeColor="warning">
          <div className="col-span-full space-y-4">
            {formData.siblings.length > 0 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <SmartField label="Carry Forward Fees from Siblings" hint="Amount in ₹" icon={CreditCard}>
                  <Input 
                    value={formData.carry_forward_fees} 
                    type="number" 
                    placeholder="0.00" 
                    onChange={e => handleChange('carry_forward_fees', e.target.value)} 
                    className="h-11"
                  />
                </SmartField>
              </div>
            )}
            
            <div className="space-y-3">
              {feeGroups.filter(group => !group.name.startsWith('Quick Fees')).map(group => (
                <Collapsible key={group.id}>
                  <div className={cn(
                    "flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200",
                    formData.fee_groups[group.id] 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}>
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        id={`fee-group-${group.id}`} 
                        checked={!!formData.fee_groups[group.id]} 
                        onCheckedChange={checked => handleFeeGroupChange(group.id, checked)}
                        className="data-[state=checked]:bg-primary"
                      />
                      <label htmlFor={`fee-group-${group.id}`} className="font-semibold text-foreground cursor-pointer">{group.name}</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">₹{group.fee_masters.reduce((acc, master) => acc + master.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                  <CollapsibleContent className="mt-2 ml-8 space-y-1">
                    {group.fee_masters.map(master => (
                      <div key={master.id} className="flex justify-between text-sm text-muted-foreground p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <span className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                          {master.fee_types.name} ({master.fee_types.code})
                        </span>
                        <div className="flex items-center gap-6">
                          <span className="text-xs">{new Date(master.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          <span className="font-medium">₹{master.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
            {errors.fee_groups && (
              <p className="text-sm text-red-500 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{errors.fee_groups}
              </p>
            )}
          </div>
        </SectionBox>
        
        {/* Discount Block */}
        <SectionBox icon={Percent} title="Fees Discount" badge="Optional" badgeColor="info">
          <div className="col-span-full">
            {feeDiscounts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {feeDiscounts.map(discount => (
                  <label 
                    key={discount.id}
                    htmlFor={`discount-${discount.id}`}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200",
                      formData.fee_discounts[discount.id] 
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20" 
                        : "border-border hover:border-green-500/50 hover:bg-muted/50"
                    )}
                  >
                    <Checkbox 
                      id={`discount-${discount.id}`} 
                      checked={!!formData.fee_discounts[discount.id]} 
                      onCheckedChange={checked => handleDiscountChange(discount.id, checked)}
                      className="data-[state=checked]:bg-green-500"
                    />
                    <span className="text-sm font-medium">{discount.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No fee discounts available.</p>
            )}
          </div>
        </SectionBox>

        {/* Submit Section */}
        <div className="sticky bottom-4 z-10">
          <div className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-sm">
                {isFormValid ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">All required fields are filled</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Please fill all required fields marked with *</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={resetForm}
                  className="h-12 px-6"
                >
                  <X className="mr-2 h-4 w-4" /> Reset Form
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={loading || isAadharChecking || !!rollNumberError || !isFormValid} 
                  size="lg"
                  className={cn(
                    "h-12 px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25",
                    !isFormValid && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-5 w-5" /> Save Student
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Success Dialog with Enhanced Design */}
      <AlertDialog open={!!admissionSuccessData}>
        <AlertDialogContent className="max-w-lg bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-950 dark:to-emerald-950 border-green-300 dark:border-green-800">
          <AlertDialogHeader className="items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-400/20 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-green-400 to-emerald-500 p-4 rounded-full">
                <FileCheck2 className="w-12 h-12 text-white" />
              </div>
            </div>
            <AlertDialogTitle className="text-2xl font-bold text-green-800 dark:text-green-300 mt-4">
              🎉 Admission Successful!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600 dark:text-gray-300">
              The student has been successfully admitted. Below are the login credentials:
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-6 space-y-4">
            <div className="p-4 bg-white/80 dark:bg-black/20 rounded-xl border border-green-200 dark:border-green-800 space-y-3">
              <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Student Credentials
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm"><strong>Admission No:</strong> {admissionSuccessData?.school_code}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm"><strong>Username:</strong> {admissionSuccessData?.username}</span>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => copyToClipboard(admissionSuccessData?.username)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm"><strong>Password:</strong> {admissionSuccessData?.password}</span>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => copyToClipboard(admissionSuccessData?.password)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {admissionSuccessData?.parent_username && (
              <div className="p-4 bg-white/80 dark:bg-black/20 rounded-xl border border-green-200 dark:border-green-800 space-y-3">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Parent Credentials
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm"><strong>Username:</strong> {admissionSuccessData?.parent_username}</span>
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => copyToClipboard(admissionSuccessData?.parent_username)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-sm"><strong>Password:</strong> {admissionSuccessData?.parent_password}</span>
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => copyToClipboard(admissionSuccessData?.parent_password)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <AlertDialogAction 
            onClick={handleContinue} 
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white h-12 text-lg font-semibold shadow-lg"
          >
            <UserPlus className="mr-2 h-5 w-5" /> Continue to Next Admission
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};
export default StudentAdmission;
