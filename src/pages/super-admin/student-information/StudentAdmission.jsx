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
import { BookOpen, User, Key, Users, Bus, FileText, UserCog, Save, Shield, Loader2, UserPlus, FileCheck2, Copy, Percent, Wallet, AlertCircle, Building, X, Sparkles, BedDouble, GraduationCap, Phone, MapPin, Files } from 'lucide-react'; // Added missing icons
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

// Icon mapping
const ICON_MAP = {
  BookOpen, User, Key, Users, Bus, FileText, UserCog, Shield, Files, Building, BedDouble, GraduationCap, Phone, MapPin
};

const SectionBox = ({ icon, title, children }) => {
  const Icon = icon || FileText; // Fallback icon
  return (
    <div className="bg-card p-6 rounded-2xl shadow-lg border border-white/10">
      <div className="flex items-center gap-4 mb-6 pb-3 border-b-2 border-primary/20">
        <div className="bg-primary/10 p-3 rounded-full">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {children}
      </div>
    </div>
  );
};

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

  // --- Dynamic Field Renderer ---
  const DynamicField = ({ field }) => {
    if (!field.is_enabled) return null;

    const label = (
      <Label>
        {field.field_label} {field.is_required && <span className="text-red-500">*</span>}
      </Label>
    );

    // Common error display
    const errorMsg = (touched[field.field_name] && errors[field.field_name]) || 
                    (field.is_system ? null : errors[`custom_${field.id}`]);

    // Handle System Fields with special components
    if (field.is_system) {
      switch (field.field_name) {
        case 'admission_no':
          return (
            <div className="lg:col-span-1">
              {label}
              <Input
                value={formData.school_code}
                placeholder={field.field_label}
                onChange={e => handleChange('school_code', e.target.value)}
                disabled={Boolean(schoolSettings?.student_admission_no_auto_generation) && isStudentAdmissionAutoGenConfigValid(schoolSettings)}
                onBlur={() => handleBlur('school_code')}
              />
              {touched.school_code && errors.school_code && <span className="text-xs text-red-500">{errors.school_code}</span>}
            </div>
          );
        case 'class':
          return (
            <div className="lg:col-span-1">
              {label}
              <Select value={formData.class_id} onValueChange={v => handleChange('class_id', v)}>
                <SelectTrigger onBlur={() => handleBlur('class_id')}><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              {touched.class_id && errors.class_id && <span className="text-xs text-red-500">{errors.class_id}</span>}
            </div>
          );
        case 'section':
          return (
            <div className="lg:col-span-1">
              {label}
              <Select value={formData.section_id} onValueChange={v => handleChange('section_id', v)} disabled={!formData.class_id}>
                <SelectTrigger onBlur={() => handleBlur('section_id')}><SelectValue placeholder="Select Section" /></SelectTrigger>
                <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
              {touched.section_id && errors.section_id && <span className="text-xs text-red-500">{errors.section_id}</span>}
            </div>
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
                label={field.field_label} 
                required={field.is_required} 
                value={formData[field.field_name]} 
                onChange={date => handleChange(field.field_name, date)} 
                disableFuture={field.field_name !== 'as_on_date'} // Allow future for measurement date maybe?
              />
              {touched[field.field_name] && errors[field.field_name] && <span className="text-xs text-red-500">{errors[field.field_name]}</span>}
            </div>
          );
        case 'roll_number':
           return (
            <div className="lg:col-span-1">
              {label}
              <div className="relative">
                <Input value={formData.roll_number} type="text" placeholder={field.field_label} onChange={handleRollNumberChange} onBlur={() => handleBlur('roll_number')} />
                {(isRollNumberLoading || isCheckingRollNumber) && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              {rollNumberError && <p className="text-sm text-red-500 mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{rollNumberError}</p>}
              {touched.roll_number && errors.roll_number && <span className="text-xs text-red-500">{errors.roll_number}</span>}
            </div>
           );
         case 'category':
            return (
                <div className="lg:col-span-1">
                    {label}
                    <Select value={formData.category_id || ''} onValueChange={v => handleChange('category_id', v)}>
                        <SelectTrigger onBlur={() => handleBlur('category_id')}><SelectValue placeholder="Select Category" /></SelectTrigger>
                        <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                    {touched.category_id && errors.category_id && <span className="text-xs text-red-500">{errors.category_id}</span>}
                </div>
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
                    {label}
                    <ImageUploader onFileChange={file => handleFileChange(file, handler.setFile, handler.setPreview)} initialPreview={handler.preview} key={`${field.field_name}-${handler.preview}`} />
                    {field.is_required && !handler.file && touched[field.field_name] && <span className="text-xs text-red-500">Image is required</span>}
                </div>
            );
        case 'email':
        case 'father_email':
             const isChecking = field.field_name === 'email' ? isStudentEmailChecking : isFatherEmailChecking;
             const emailErr = field.field_name === 'email' ? studentEmailError : fatherEmailError;
             return (
                <div className="lg:col-span-1">
                    {label}
                    <div className="relative">
                        <Input value={formData[field.field_name]} type="email" placeholder={field.field_label} onChange={e => handleEmailChange(e, field.field_name)} />
                        {isChecking && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                    {emailErr && <p className="text-sm text-red-500 mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{emailErr}</p>}
                </div>
             );
        case 'national_id_no':
        case 'father_aadhar_no':
        case 'mother_aadhar_no':
            return (
                <div className="lg:col-span-1">
                    {label}
                    <AadharInput 
                        value={formData[field.field_name] || ''} 
                        onChange={val => {
                            handleChange(field.field_name, val);
                            if(field.field_name === 'national_id_no') validateAadhar(val);
                        }} 
                        checkDuplicates={field.field_name === 'national_id_no'} 
                        error={(field.field_name === 'national_id_no' ? aadharError : null) || (touched[field.field_name] && errors[field.field_name])} 
                    />
                </div>
            )
        case 'pincode':
            return (
                <div className="lg:col-span-1">
                    {label}
                    <div className="relative">
                      <Input
                        value={pincode}
                        placeholder="Pincode"
                        onChange={e => {
                          const cleaned = (e.target.value || '').replace(/\D/g, '').slice(0, 6);
                          setPincode(cleaned);
                        }}
                        onBlur={() => handleBlur('pincode')}
                        maxLength={6}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">{pincodeLoading && <Loader2 className="animate-spin h-4 w-4" />}</div>
                    </div>
                    {touched.pincode && errors.pincode && <span className="text-xs text-red-500">{errors.pincode}</span>}
                </div>
            );
        case 'username':
        case 'parent_username':
             const isDisabled = field.field_name === 'username' ? schoolSettings?.student_username_auto_generation : schoolSettings?.parent_username_auto_generation;
             return (
                 <div className="lg:col-span-1">
                    {label}
                    <Input value={formData[field.field_name]} placeholder={field.field_label} onChange={e => handleChange(field.field_name, e.target.value)} onBlur={() => handleBlur(field.field_name)} disabled={isDisabled} />
                    {touched[field.field_name] && errors[field.field_name] && <span className="text-xs text-red-500">{errors[field.field_name]}</span>}
                 </div>
             );
        case 'password':
        case 'retype_password':
        case 'parent_password':
        case 'parent_retype_password':
            return (
                 <div className="lg:col-span-1">
                    {label}
                    <Input type="password" value={formData[field.field_name]} placeholder={field.field_label} onChange={e => handleChange(field.field_name, e.target.value)} onBlur={() => handleBlur(field.field_name)} disabled={schoolSettings?.password_auto_generation} />
                    {touched[field.field_name] && errors[field.field_name] && <span className="text-xs text-red-500">{errors[field.field_name]}</span>}
                 </div>
            );
        // Add specific Selects for Religion, Caste, etc if needed to map to master data
        case 'religion':
            return (
                <div className="lg:col-span-1">
                    {label}
                    <Select value={formData.religion} onValueChange={v => handleChange('religion', v)}>
                        <SelectTrigger><SelectValue placeholder="Select Religion" /></SelectTrigger>
                        <SelectContent>{religions.map(r => <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            );
        case 'caste':
             return (
                <div className="lg:col-span-1">
                    {label}
                    <Select value={formData.caste} onValueChange={v => handleChange('caste', v)}>
                        <SelectTrigger><SelectValue placeholder="Select Caste" /></SelectTrigger>
                        <SelectContent>{castes.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            );
        case 'post_office': // Not in systemFields but might be needed
             return (
                 <div className="lg:col-span-1"><Label>Post Office</Label><Select onValueChange={handlePostOfficeChange} disabled={postOffices.length === 0}><SelectTrigger><SelectValue placeholder="Select Post Office" /></SelectTrigger><SelectContent>{postOffices.map(po => <SelectItem key={po.Name} value={po.Name}>{po.Name}</SelectItem>)}</SelectContent></Select></div>
             );
      }
    }

    // Generic Handlers for System or Custom fields that didn't match special cases above
    // or Custom fields
    const value = field.is_system ? (formData[field.field_name] ?? '') : (customFieldValues[field.field_key] ?? '');
    const onChange = (val) => {
        field.is_system ? handleChange(field.field_name, val) : handleCustomFieldChange(field.field_key, val);
    };

    if (field.type === 'select' || field.field_type === 'select') {
       return (
         <div className="lg:col-span-1">
           {label}
           <Select value={value} onValueChange={onChange}>
             <SelectTrigger><SelectValue placeholder={`Select ${field.field_label}`} /></SelectTrigger>
             <SelectContent>
               {(field.field_options || []).map((opt, idx) => {
                 const optVal = typeof opt === 'object' ? opt.value : opt;
                 const optLabel = typeof opt === 'object' ? opt.label : opt;
                 return <SelectItem key={idx} value={optVal}>{optLabel}</SelectItem>;
               })}
             </SelectContent>
           </Select>
           {errorMsg && <span className="text-xs text-red-500">{errorMsg}</span>}
         </div>
       );
    }
    
    if (field.type === 'textarea' || field.field_type === 'textarea') {
      return (
        <div className="md:col-span-2 lg:col-span-2">
            {label}
            <Textarea value={value} placeholder={field.field_label} onChange={e => onChange(e.target.value)} onBlur={() => !field.is_system && handleBlur(field.field_name)} />
            {errorMsg && <span className="text-xs text-red-500">{errorMsg}</span>}
        </div>
      );
    }

    if (field.type === 'date' || field.field_type === 'date') {
       return ( // Fallback for custom dates or generic dates
         <div className="lg:col-span-1">
            <DatePicker id={field.field_key} label={field.field_label} required={field.is_required} value={value} onChange={onChange} />
         </div>
       );
    }

    if (field.type === 'checkbox' || field.field_type === 'checkbox') {
        // Simple checkbox
        return (
            <div className="flex items-center space-x-2 mt-8">
              <Checkbox id={field.field_key} checked={!!value} onCheckedChange={onChange} />
              <label htmlFor={field.field_key} className="text-sm font-medium leading-none">{field.field_label}</label>
            </div>
        )
    }

    // Default Text Input
    return (
      <div className="lg:col-span-1">
        {label}
        <Input 
          value={value} 
          type={field.type === 'number' || field.field_type === 'number' ? 'number' : 'text'}
          placeholder={field.field_label} 
          onChange={e => onChange(e.target.value)} 
          onBlur={() => field.is_system && handleBlur(field.field_name)} 
        />
        {errorMsg && <span className="text-xs text-red-500">{errorMsg}</span>}
      </div>
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
    const { data, error } = await supabase.rpc('get_last_roll_number', { p_branch_id: selectedBranch.id, p_class_id: classId, p_section_id: sectionId });
    if (error) {
      toast({ variant: 'destructive', title: 'Could not fetch next roll number.' });
    } else {
      const nextRollNumber = (data || 0) + 1;
      handleChange('roll_number', nextRollNumber.toString().padStart(2, '0'));
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground/90 flex items-center gap-2"><Sparkles className="text-primary w-8 h-8"/>Student Admission</h1>
          {selectedBranch?.branch_name && (
            <p className="text-muted-foreground text-sm mt-1">Adding student to: <span className="font-medium text-primary">{selectedBranch.branch_name}</span></p>
          )}
        </div>
      </div>
      <div className="space-y-8">
        {formSections.sort((a,b) => a.order - b.order).map(section => {
          // Special Blocks
          if (section.key === 'documents') {
            return (
                <SectionBox key={section.key} icon={ICON_MAP[section.icon] || Files} title={section.label}>
                    <div className="col-span-full">
                        <Label className="mb-2 block">Select Documents</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {masterDocuments.length > 0 ? masterDocuments.map(doc => (
                                <div key={doc.name} className="flex items-center space-x-2">
                                    <Checkbox id={`doc-${doc.name}`} checked={!!formData.documents_received[doc.name]} onCheckedChange={checked => handleCheckboxChange(doc.name, checked)} />
                                    <label htmlFor={`doc-${doc.name}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                      {doc.name} {doc.is_required && <span className="text-red-500">*</span>}
                                    </label>
                                </div>
                            )) : <p className="text-muted-foreground text-sm">No document types configured.</p>}
                        </div>
                        {errors.documents_received && <p className="text-sm text-red-500 mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.documents_received}</p>}
                    </div>
                </SectionBox>
            );
          }
          if (section.key === 'transport') {
              return (
                <div key={section.key} className="bg-card p-6 rounded-2xl shadow-lg border border-white/10">
                    <div className="flex items-center justify-between gap-4 mb-6 pb-3 border-b-2 border-primary/20"><div className="flex items-center gap-4"><div className="bg-primary/10 p-3 rounded-full"><Bus className="h-6 w-6 text-primary" /></div><h2 className="text-xl font-bold text-foreground">{section.label}</h2></div><div className="flex items-center gap-2"><Label htmlFor="transport-required">Required</Label><Switch id="transport-required" checked={formData.transport_required} onCheckedChange={(checked) => handleChange('transport_required', checked)} /></div></div>
                    {formData.transport_required && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-1"><Label>Route Name <span className="text-red-500">*</span></Label><Select value={formData.transport_route_id || ''} onValueChange={v => handleChange('transport_route_id', v)}><SelectTrigger onBlur={() => handleBlur('transport_route_id')}><SelectValue placeholder="Select a route" /></SelectTrigger><SelectContent>{routes.map(r => <SelectItem key={r.id} value={r.id}>{r.route_title}</SelectItem>)}</SelectContent></Select>{touched.transport_route_id && errors.transport_route_id && <span className="text-xs text-red-500">{errors.transport_route_id}</span>}</div>
                        <div className="lg:col-span-1"><Label>Stop Name <span className="text-red-500">*</span></Label><Select value={formData.transport_pickup_point_id || ''} onValueChange={v => handleChange('transport_pickup_point_id', v)} disabled={!formData.transport_route_id}><SelectTrigger onBlur={() => handleBlur('transport_pickup_point_id')}><SelectValue placeholder="Select pickup point" /></SelectTrigger><SelectContent>{pickupPoints.map(p => <SelectItem key={p.pickup_point.id} value={p.pickup_point.id}>{p.pickup_point.name}</SelectItem>)}</SelectContent></Select>{touched.transport_pickup_point_id && errors.transport_pickup_point_id && <span className="text-xs text-red-500">{errors.transport_pickup_point_id}</span>}</div>
                        <div className="lg:col-span-1"><Label>Transport Fee</Label><Input value={formData.transport_fee} readOnly disabled /></div><div className="lg:col-span-1"><Label>Pickup Time</Label><Input type="time" value={formData.pickup_time} onChange={e => handleChange('pickup_time', e.target.value)} /></div><div className="lg:col-span-1"><Label>Drop Time</Label><Input type="time" value={formData.drop_time} onChange={e => handleChange('drop_time', e.target.value)} /></div><div className="lg:col-span-1"><Label>Vehicle Number</Label><Input value={formData.vehicle_number} onChange={e => handleChange('vehicle_number', e.target.value)} /></div><div className="lg:col-span-1"><Label>Driver Name</Label><Input value={formData.driver_name} onChange={e => handleChange('driver_name', e.target.value)} /></div><div className="lg:col-span-1"><Label>Driver Contact</Label><Input type="tel" value={formData.driver_contact} onChange={e => handleChange('driver_contact', e.target.value)} /></div><div className="lg:col-span-4"><Label>Special Instructions</Label><Textarea value={formData.transport_special_instructions} onChange={e => handleChange('transport_special_instructions', e.target.value)} /></div>
                    </div>}
                </div>
              );
          }
          if (section.key === 'hostel') {
              return (
                <div key={section.key} className="bg-card p-6 rounded-2xl shadow-lg border border-white/10">
                    <div className="flex items-center justify-between gap-4 mb-6 pb-3 border-b-2 border-primary/20"><div className="flex items-center gap-4"><div className="bg-primary/10 p-3 rounded-full"><BedDouble className="h-6 w-6 text-primary" /></div><h2 className="text-xl font-bold text-foreground">{section.label}</h2></div><div className="flex items-center gap-2"><Label htmlFor="hostel-required">Required</Label><Switch id="hostel-required" checked={formData.hostel_required} onCheckedChange={(checked) => handleChange('hostel_required', checked)} /></div></div>
                    {formData.hostel_required && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-1"><Label>Hostel Name <span className="text-red-500">*</span></Label><Select value={formData.hostel_id || ''} onValueChange={v => handleChange('hostel_id', v)}><SelectTrigger onBlur={() => handleBlur('hostel_id')}><SelectValue placeholder="Select Hostel" /></SelectTrigger><SelectContent>{hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent></Select>{touched.hostel_id && errors.hostel_id && <span className="text-xs text-red-500">{errors.hostel_id}</span>}</div>
                        <div className="lg:col-span-1"><Label>Room Type <span className="text-red-500">*</span></Label><Select value={formData.hostel_room_type || ''} onValueChange={v => handleChange('hostel_room_type', v)}><SelectTrigger onBlur={() => handleBlur('hostel_room_type')}><SelectValue placeholder="Select Room Type" /></SelectTrigger><SelectContent>{hostelRoomTypes.map(rt => <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>)}</SelectContent></Select>{touched.hostel_room_type && errors.hostel_room_type && <span className="text-xs text-red-500">{errors.hostel_room_type}</span>}</div>
                        <div className="lg:col-span-1"><Label>Room Number</Label><Input value={formData.room_number} onChange={e => handleChange('room_number', e.target.value)} /></div><div className="lg:col-span-1"><Label>Bed Number</Label><Input value={formData.bed_number} onChange={e => handleChange('bed_number', e.target.value)} /></div><div className="lg:col-span-1"><Label>Hostel Fee</Label><Input value={formData.hostel_fee} readOnly disabled /></div><DatePicker id="check_in_date" label="Check-in Date" value={formData.check_in_date} onChange={date => handleChange('check_in_date', date)} /><DatePicker id="check_out_date" label="Check-out Date" value={formData.check_out_date} onChange={date => handleChange('check_out_date', date)} /><div className="lg:col-span-1"><Label>Guardian Contact</Label><Input type="tel" value={formData.hostel_guardian_contact} onChange={e => handleChange('hostel_guardian_contact', e.target.value)} /></div><div className="lg:col-span-1"><Label>Emergency Contact</Label><Input type="tel" value={formData.hostel_emergency_contact} onChange={e => handleChange('hostel_emergency_contact', e.target.value)} /></div><div className="lg:col-span-4"><Label>Special Requirements</Label><Textarea value={formData.hostel_special_requirements} onChange={e => handleChange('hostel_special_requirements', e.target.value)} /></div>
                    </div>}
                </div>
              );
          }
          
          // Regular Dynamic Sections
          const sectionFields = allFields.filter(f => f.section_key === section.key).sort((a,b) => a.sort_order - b.sort_order);
          // If no fields and not special, skip rendering section unless it has hardcoded children (like Siblings)
          const hasFields = sectionFields.length > 0;
          const isAcademic = section.key === 'academic_details';
          
          if (!hasFields && !isAcademic) return null;

          return (
            <SectionBox key={section.key} icon={ICON_MAP[section.icon] || User} title={section.label}>
                {sectionFields.map(field => <DynamicField key={field.id || field.key} field={field} />)}
                
                {/* Academic Extra: Siblings */}
                {isAcademic && (
                    <div className="lg:col-span-2 md:col-span-2">
                        <Label>Siblings</Label>
                        <div className="flex items-center gap-2">
                            <Dialog><DialogTrigger asChild><Button variant="outline" className="w-full"><UserPlus className="mr-2 h-4 w-4" /> Add Sibling</Button></DialogTrigger><AddSiblingModal onSiblingAdd={handleSiblingAdd} /></Dialog>
                        </div>
                        {formData.siblings && formData.siblings.length > 0 && <div className="mt-2 space-y-1">{formData.siblings.map(s => <div key={s.id} className="flex items-center justify-between bg-muted p-1.5 rounded-md text-sm"><span>{s.full_name}</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeSibling(s.id)}><X className="h-4 w-4 text-destructive" /></Button></div>)}</div>}
                    </div>
                )}
            </SectionBox>
          );
        })}

        {/* Fees Block (Always at end or after Academic? Let's keep it here for now) */}
        <div className="bg-card p-6 rounded-2xl shadow-lg border border-white/10 space-y-4">
          <div className="flex items-center gap-4 pb-3 border-b-2 border-primary/20">
            <div className="bg-primary/10 p-3 rounded-full"><Wallet className="h-6 w-6 text-primary" /></div>
            <h2 className="text-xl font-bold text-foreground">Fees Details <span className="text-red-500">*</span></h2>
          </div>
          {formData.siblings.length > 0 && <div className="lg:col-span-1"><Label>Carry Forward Fees from Siblings</Label><Input value={formData.carry_forward_fees} type="number" placeholder="Carry Forward Fees" onChange={e => handleChange('carry_forward_fees', e.target.value)} /></div>}
          {feeGroups.filter(group => !group.name.startsWith('Quick Fees')).map(group => <Collapsible key={group.id}><div className="flex items-center space-x-3 px-1"><CollapsibleTrigger asChild><Button variant="ghost" size="sm" className="w-9 p-0">{formData.fee_groups[group.id] ? "-" : "+"}</Button></CollapsibleTrigger><Checkbox id={`fee-group-${group.id}`} checked={!!formData.fee_groups[group.id]} onCheckedChange={checked => handleFeeGroupChange(group.id, checked)} /><label htmlFor={`fee-group-${group.id}`} className="font-semibold text-foreground flex-1">{group.name}</label><span className="font-semibold">{group.fee_masters.reduce((acc, master) => acc + master.amount, 0).toFixed(2)}</span></div><CollapsibleContent className="pl-12 mt-2 space-y-1">{group.fee_masters.map(master => <div key={master.id} className="flex justify-between text-sm text-muted-foreground p-2 rounded-md hover:bg-muted/50"><span>{master.fee_types.name} ({master.fee_types.code})</span><div className="flex items-center gap-8"><span>{new Date(master.due_date).toLocaleDateString()}</span><span>{master.amount.toFixed(2)}</span></div></div>)}</CollapsibleContent></Collapsible>)}
          {errors.fee_groups && <p className="text-sm text-red-500 mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.fee_groups}</p>}
        </div>
        
        <div className="bg-card p-6 rounded-2xl shadow-lg border border-white/10 space-y-4">
          <div className="flex items-center gap-4 pb-3 border-b-2 border-primary/20"><div className="bg-primary/10 p-3 rounded-full"><Percent className="h-6 w-6 text-primary" /></div><h2 className="text-xl font-bold text-foreground">Fees Discount Details</h2></div>
          {feeDiscounts.length > 0 ? <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{feeDiscounts.map(discount => <div key={discount.id} className="flex items-center space-x-2"><Checkbox id={`discount-${discount.id}`} checked={!!formData.fee_discounts[discount.id]} onCheckedChange={checked => handleDiscountChange(discount.id, checked)} /><label htmlFor={`discount-${discount.id}`} className="text-sm font-medium">{discount.name}</label></div>)}</div> : <p className="text-muted-foreground">No fee discounts available.</p>}
        </div>

        <div className="flex justify-end items-center mt-8 gap-4">
            <div title={!isFormValid ? "Please fill all required fields" : ""}>
                <Button 
                    onClick={handleSave} 
                    disabled={loading || isAadharChecking || !!rollNumberError || !isFormValid} 
                    size="lg"
                    className={!isFormValid ? "opacity-50 cursor-not-allowed" : ""}
                >
                    <Save className="mr-2 h-5 w-5" />{loading ? 'Saving...' : 'Save Student'}
                </Button>
            </div>
        </div>
      </div>
      
      <AlertDialog open={!!admissionSuccessData}><AlertDialogContent className="max-w-lg bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-800 dark:to-green-900 border-green-400"><AlertDialogHeader className="items-center"><FileCheck2 className="w-16 h-16 text-green-500 mb-4" /><AlertDialogTitle className="text-2xl font-bold text-green-800 dark:text-green-300">Admission Successful!</AlertDialogTitle><AlertDialogDescription className="text-center text-gray-600 dark:text-gray-300">The student has been admitted. Here are the login credentials:</AlertDialogDescription></AlertDialogHeader><div className="my-4 space-y-3"><div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg"><h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">Student Credentials</h3><p><strong>Admission No:</strong> {admissionSuccessData?.school_code}</p><div className="flex items-center justify-between"><span><strong>Username:</strong> {admissionSuccessData?.username}</span> <Button size="sm" variant="ghost" onClick={() => copyToClipboard(admissionSuccessData?.username)}><Copy className="w-4 h-4" /></Button></div><div className="flex items-center justify-between"><span><strong>Password:</strong> {admissionSuccessData?.password}</span> <Button size="sm" variant="ghost" onClick={() => copyToClipboard(admissionSuccessData?.password)}><Copy className="w-4 h-4" /></Button></div></div>{admissionSuccessData?.parent_username && <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg"><h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">Parent Credentials</h3><div className="flex items-center justify-between"><span><strong>Username:</strong> {admissionSuccessData?.parent_username}</span> <Button size="sm" variant="ghost" onClick={() => copyToClipboard(admissionSuccessData?.parent_username)}><Copy className="w-4 h-4" /></Button></div><div className="flex items-center justify-between"><span><strong>Password:</strong> {admissionSuccessData?.parent_password}</span> <Button size="sm" variant="ghost" onClick={() => copyToClipboard(admissionSuccessData?.parent_password)}><Copy className="w-4 h-4" /></Button></div></div>}</div><AlertDialogAction onClick={handleContinue} className="w-full bg-green-600 hover:bg-green-700">Continue to Next Admission</AlertDialogAction></AlertDialogContent></AlertDialog>
    </DashboardLayout>
  );
};
export default StudentAdmission;
