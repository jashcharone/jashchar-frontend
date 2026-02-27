import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { sortClasses, sortSections } from '@/utils/classOrderUtils';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { BookOpen, User, Key, Users, Bus, FileText, UserCog, Save, Shield, Loader2, UserPlus, FileCheck2, Copy, Percent, Wallet, AlertCircle, Building, X, Sparkles, BedDouble, GraduationCap, Phone, MapPin, Files, ChevronDown, Home, Heart, School, Mail, CreditCard, CheckCircle2, Camera, UserCircle2 } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import { v4 as uuidv4 } from 'uuid';
import api from '@/lib/api';
import DatePicker from '@/components/ui/DatePicker';
import AadharInput from '@/components/AadharInput';
import { cn } from '@/lib/utils';

// Icon mapping
const ICON_MAP = {
  BookOpen, User, Key, Users, Bus, FileText, UserCog, Shield, Files, Building, BedDouble, GraduationCap, Phone, MapPin, School, Home, Heart, CreditCard, Mail
};

// 🌟 WORLD-CLASS Premium Section Card Component (Same as StudentAdmission)
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
      {/* Premium Gradient Background */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Component to render fields (Moved outside to prevent cursor jumping)
const FieldRenderer = ({ field, formData, customFieldValues, onChange, masterData, handlePostOfficeChange }) => {
    if (!field.is_enabled) return null;

    const label = (
      <Label>
        {field.field_label} {field.is_required && <span className="text-red-500">*</span>}
      </Label>
    );

    // Handle System Fields
    if (field.is_system) {
        switch (field.field_name) {
             case 'admission_no':
                  return <div className="lg:col-span-1">{label}<Input value={formData.school_code || ''} disabled className="bg-muted" /></div>;
             case 'session':
                  return <div className="lg:col-span-1">{label}<Select value={formData.session_id} onValueChange={v => onChange('session_id', v, true)}><SelectTrigger><SelectValue placeholder="Select Session" /></SelectTrigger><SelectContent>{masterData.sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name} {s.is_active ? '(Active)' : ''}</SelectItem>)}</SelectContent></Select></div>;
             case 'class':
                  return <div className="lg:col-span-1">{label}<Select value={formData.class_id} onValueChange={v => onChange('class_id', v, true)}><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent>{masterData.classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>;
             case 'section':
                  return <div className="lg:col-span-1">{label}<Select value={formData.section_id} onValueChange={v => onChange('section_id', v, true)}><SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger><SelectContent>{masterData.sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>;
             case 'date': case 'dob': case 'admission_date': case 'father_dob': case 'mother_dob':
                  return <div className="lg:col-span-1"><DatePicker label={field.field_label} required={field.is_required} value={formData[field.field_name]} onChange={date => onChange(field.field_name, date, true)} /></div>;
             case 'category':
                  return <div className="lg:col-span-1">{label}<Select value={formData.category_id || ''} onValueChange={v => onChange('category_id', v, true)}><SelectTrigger><SelectValue placeholder="Select Admission Type" /></SelectTrigger><SelectContent>{masterData.categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>;
             case 'caste_category':
                  return <div className="lg:col-span-1">{label}<Select value={formData.caste_category_id || ''} onValueChange={v => onChange('caste_category_id', v, true)}><SelectTrigger><SelectValue placeholder="Select Caste Category" /></SelectTrigger><SelectContent>{masterData.casteCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>;
             case 'sub_caste':
                  // Filter sub-castes based on selected category
                  const filteredSubCastes = formData.caste_category_id 
                    ? masterData.subCastes.filter(sc => sc.caste_category_id === formData.caste_category_id)
                    : []; 
                  return <div className="lg:col-span-1">{label}<Select value={formData.sub_caste_id || ''} onValueChange={v => onChange('sub_caste_id', v, true)} disabled={!formData.caste_category_id}><SelectTrigger><SelectValue placeholder="Select Sub Caste" /></SelectTrigger><SelectContent>{filteredSubCastes.map(sc => <SelectItem key={sc.id} value={sc.id}>{sc.name}</SelectItem>)}</SelectContent></Select></div>;
             // PHOTOS ARE NOW RENDERED IN DEDICATED PHOTO GALLERY SECTION AT THE END
             // Skip rendering here to avoid duplicates
             case 'student_photo': case 'father_photo': case 'mother_photo': case 'guardian_photo':
                return null; // Photos moved to Photo Gallery section
             case 'national_id_no': case 'father_aadhar_no': case 'mother_aadhar_no':
                 return <div className="lg:col-span-1">{label}<AadharInput value={formData[field.field_name] || ''} onChange={val => onChange(field.field_name, val, true)} /></div>;
             case 'religion':
                  return <div className="lg:col-span-1">{label}<Select value={formData.religion || ''} onValueChange={v => onChange('religion', v, true)}><SelectTrigger><SelectValue placeholder="Select Religion" /></SelectTrigger><SelectContent>{masterData.religions.map(r => <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>)}</SelectContent></Select></div>;
             case 'mother_tongue':
                  return <div className="lg:col-span-1">{label}<Select value={formData.mother_tongue || ''} onValueChange={v => onChange('mother_tongue', v, true)}><SelectTrigger><SelectValue placeholder="Select Mother Tongue" /></SelectTrigger><SelectContent>{masterData.motherTongues.map(mt => <SelectItem key={mt.name} value={mt.name}>{mt.name}</SelectItem>)}</SelectContent></Select></div>;
             
             // Pincode Handling
             case 'current_pincode': case 'present_pincode': case 'permanent_pincode':
             case 'pincode':
                return <div className="lg:col-span-1">{label}<Input value={formData[field.field_name] || ''} onChange={e => onChange(field.field_name, e.target.value.replace(/\D/g, '').slice(0, 6), true)} maxLength={6} placeholder="6 digits" /></div>;

             // Mobile/Phone Handling - 10 digits only
             case 'mobile_no': case 'phone': case 'father_phone': case 'mother_phone': 
             case 'guardian_phone': case 'driver_contact': case 'hostel_guardian_contact': 
             case 'hostel_emergency_contact':
                return <div className="lg:col-span-1">{label}<Input value={formData[field.field_name] || ''} onChange={e => onChange(field.field_name, e.target.value.replace(/\D/g, '').slice(0, 10), true)} maxLength={10} placeholder="10 digits" type="tel" /></div>;

             // Name fields - Only allow letters and spaces
             case 'first_name': case 'last_name': case 'father_name': case 'mother_name': case 'guardian_name': case 'full_name':
                return <div className="lg:col-span-1">{label}<Input value={formData[field.field_name] || ''} onChange={e => onChange(field.field_name, e.target.value.replace(/[^a-zA-Z\s]/g, ''), true)} placeholder="Letters only" /></div>;

             // Post Office - If it's a dropdown in logic
             case 'post_office':
                return <div className="lg:col-span-1">{label}<Select onValueChange={handlePostOfficeChange} disabled={masterData.postOffices.length === 0}><SelectTrigger><SelectValue placeholder={masterData.postOffices.length > 0 ? "Select Post Office" : "Enter valid pincode"} /></SelectTrigger><SelectContent>{masterData.postOffices.map(po => <SelectItem key={po.Name} value={po.Name}>{po.Name}</SelectItem>)}</SelectContent></Select></div>;

             // Login Details - SKIP (not editable on Edit page)
             case 'username': case 'parent_username':
             case 'password': case 'retype_password': case 'parent_password': case 'parent_retype_password':
                return null; // Don't render login fields on edit page
        }
    }

    // Generic
    const value = field.is_system ? (formData[field.field_name] ?? '') : (customFieldValues[field.field_key] ?? '');
    const onFieldChange = (val) => onChange(field.is_system ? field.field_name : field.field_key, val, field.is_system);

    if (field.type === 'select' || field.field_type === 'select') {
       return <div className="lg:col-span-1">{label}<Select value={value} onValueChange={onFieldChange}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{(field.field_options || []).map((opt, i) => <SelectItem key={i} value={typeof opt === 'object' ? opt.value : opt}>{typeof opt === 'object' ? opt.label : opt}</SelectItem>)}</SelectContent></Select></div>;
    }
    if (field.type === 'textarea' || field.field_type === 'textarea') {
        return <div className="md:col-span-2">{label}<Textarea value={value} onChange={e => onFieldChange(e.target.value)} /></div>;
    }
    if (field.type === 'date' || field.field_type === 'date') {
        return <div className="lg:col-span-1"><DatePicker label={field.field_label} required={field.is_required} value={value} onChange={onFieldChange} /></div>;
    }
    if (field.type === 'checkbox' || field.field_type === 'checkbox') {
         return <div className="flex items-center space-x-2 mt-8"><Checkbox id={field.field_key} checked={!!value} onCheckedChange={onFieldChange} /><label htmlFor={field.field_key} className="text-sm font-medium">{field.field_label}</label></div>;
    }
    return <div className="lg:col-span-1">{label}<Input value={value} type={field.type === 'number' || field.field_type === 'number' ? 'number' : 'text'} onChange={e => onFieldChange(e.target.value)} /></div>;
};

const AddSiblingModal = ({ onSiblingAdd, currentStudentId }) => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    if (!user?.profile?.branch_id || !selectedBranch?.id) return;
    const fetchClasses = async () => {
      const { data } = await supabase.from('classes').select('id, name').eq('branch_id', selectedBranch.id);
      setClasses(sortClasses(data || []));
    };
    fetchClasses();
  }, [user?.profile?.branch_id, selectedBranch]);

  useEffect(() => {
    if (selectedClass) {
      const fetchSections = async () => {
        const { data } = await supabase.from('class_sections').select('sections(id, name)').eq('class_id', selectedClass);
        const sectionsList = data ? data.map(item => item.sections).filter(Boolean) : [];
        setSections(sortSections(sectionsList));
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
        const { data } = await supabase.from('student_profiles')
            .select('id, full_name, sibling_group_id, carry_forward_fees')
            .eq('class_id', selectedClass)
            .eq('section_id', selectedSection)
            .eq('branch_id', selectedBranch.id)
            .neq('id', currentStudentId); // Exclude self
        setStudents(data || []);
      };
      fetchStudents();
    } else {
      setStudents([]);
    }
    setSelectedStudent(null);
  }, [selectedSection, selectedClass, selectedBranch, currentStudentId]);

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

const EditStudentProfile = () => {
    const { id } = useParams();
    const studentId = id;
    const navigate = useNavigate();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Data States
    const [formSections, setFormSections] = useState([]);
    const [allFields, setAllFields] = useState([]);
    const [formData, setFormData] = useState({});
    const [customFieldValues, setCustomFieldValues] = useState({});
    const [siblings, setSiblings] = useState([]);
    
    // Master Lists
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [pickupPoints, setPickupPoints] = useState([]);
    const [hostels, setHostels] = useState([]);
    const [hostelRoomTypes, setHostelRoomTypes] = useState([]);
    const [religions, setReligions] = useState([]);
    const [castes, setCastes] = useState([]);
    const [casteCategories, setCasteCategories] = useState([]);
    const [subCastes, setSubCastes] = useState([]);
    const [masterDocuments, setMasterDocuments] = useState([]);
    const [motherTongues, setMotherTongues] = useState([]);
    const [postOffices, setPostOffices] = useState([]);
    const [pincodeLoading, setPincodeLoading] = useState(false);
    
    // Photos
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [fatherPictureFile, setFatherPictureFile] = useState(null);
    const [motherPictureFile, setMotherPictureFile] = useState(null);
    const [guardianPictureFile, setGuardianPictureFile] = useState(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState(null);
    const [fatherPicturePreview, setFatherPicturePreview] = useState(null);
    const [motherPicturePreview, setMotherPicturePreview] = useState(null);
    const [guardianPicturePreview, setGuardianPicturePreview] = useState(null);

    // Errors
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    
    // Roll Number Auto-Generation
    const [originalSectionId, setOriginalSectionId] = useState(null);
    const [isRollNumberLoading, setIsRollNumberLoading] = useState(false);

    useEffect(() => {
        if (!user?.profile?.branch_id || !selectedBranch?.id) return;
        const init = async () => {
            setLoading(true);
            try {
                const branchId = selectedBranch?.id || user?.profile?.branch_id;
                
                // 1. Fetch Settings & Master Data
                const [
                    customFieldsRes,
                    classesRes, categoriesRes, routesRes, hostelsRes, hostelRoomTypesRes, religionsRes, castesRes, motherTonguesRes, masterDocsRes, sessionsRes, branchRes
                ] = await Promise.all([
                    api.get('/form-settings', { params: { branchId, module: 'student_admission' } }),
                    supabase.from('classes').select('id, name').eq('branch_id', branchId),
                    supabase.from('student_categories').select('id, name').eq('branch_id', branchId),
                    supabase.from('transport_routes').select('id, route_title, fare, billing_cycle').eq('branch_id', branchId),
                    supabase.from('hostels').select('id, name').eq('branch_id', branchId),
                    supabase.from('hostel_room_types').select('*').eq('branch_id', branchId),
                    supabase.from('master_religions').select('name'),
                    supabase.from('master_castes').select('name'),
                    supabase.from('master_mother_tongues').select('name'),
                    supabase.from('master_documents').select('name, is_required'),
                    supabase.from('sessions').select('id, name, is_active').eq('branch_id', branchId).order('name', { ascending: false }),
                    supabase.from('branches').select('state_id').eq('id', branchId).single()
                ]);

                // Fetch Caste Data based on State
                let casteCategoriesData = [];
                let subCastesData = [];
                if (branchRes.data?.state_id) {
                     const casteCatRes = await supabase.from('caste_categories').select('id, name').eq('state_id', branchRes.data.state_id).eq('is_active', true).order('display_order');
                     casteCategoriesData = casteCatRes.data || [];
                     
                     if (casteCategoriesData.length > 0) {
                        const subCasteRes = await supabase.from('sub_castes').select('id, name, caste_category_id').in('caste_category_id', casteCategoriesData.map(c => c.id)).eq('is_active', true).order('name');
                        subCastesData = subCasteRes.data || [];
                     }
                }

                if (customFieldsRes.data?.success) {
                    setAllFields([...(customFieldsRes.data.systemFields || []), ...(customFieldsRes.data.customFields || [])]);
                    setFormSections(customFieldsRes.data.sections || []);
                }
                
                setClasses(sortClasses(classesRes.data || []));
                setCategories(categoriesRes.data || []);
                setRoutes(routesRes.data || []);
                setHostels(hostelsRes.data || []);
                setHostelRoomTypes(hostelRoomTypesRes.data || []);
                setReligions(religionsRes.data || []);
                setCastes(castesRes.data || []);
                setMotherTongues(motherTonguesRes.data || []);
                setMasterDocuments(masterDocsRes.data || []);
                setSessions(sessionsRes.data || []);
                setCasteCategories(casteCategoriesData);
                setSubCastes(subCastesData);

                // 2. Fetch Student Data (basic profile only, fetch transport/hostel separately)
                const { data: student, error } = await supabase
                    .from('student_profiles')
                    .select('*')
                    .eq('id', studentId)
                    .single();
                
                if (error) throw error;
                
                // 2b. Fetch Transport Details separately (by student_id FK)
                const { data: transportDetails } = await supabase
                    .from('student_transport_details')
                    .select('*')
                    .eq('student_id', studentId)
                    .maybeSingle();
                
                // 2c. Fetch Hostel Details separately (by student_id FK)
                const { data: hostelDetails } = await supabase
                    .from('student_hostel_details')
                    .select('*')
                    .eq('student_id', studentId)
                    .maybeSingle();
                
                // Attach to student object for easier mapping
                student.transport_details = transportDetails;
                student.hostel_details = hostelDetails;
                
                // 3. Fetch Custom Data
                const { data: customData } = await supabase.from('student_custom_data').select('custom_data').eq('student_id', studentId).maybeSingle();
                
                // 4. Fetch Siblings
                if (student.sibling_group_id) {
                    const { data: siblingData } = await supabase.from('student_profiles').select('id, full_name, sibling_group_id').eq('sibling_group_id', student.sibling_group_id).neq('id', studentId);
                    setSiblings(siblingData || []);
                }
                
                // Map Student Data to Form (DB columns -> Form field names)
                // IMPORTANT: Keep field names consistent with StudentAdmission.jsx form
                setFormData({
                    ...student,
                    // Date Mapping: DB 'date_of_birth' -> Form 'dob'
                    dob: student.date_of_birth,
                    // Address Mapping: DB 'present_address' -> Form 'current_address'
                    current_address: student.present_address,
                    // Pincode Mapping: DB 'pincode' -> Form 'current_pincode'  
                    current_pincode: student.pincode,
                    // Phone Mapping: DB 'phone' -> Form 'mobile_no'
                    mobile_no: student.phone,
                    // Aadhar Mapping: DB 'aadhar_no' -> Form 'national_id_no'
                    national_id_no: student.aadhar_no,
                    // Transport Details
                    transport_required: !!student.transport_details,
                    transport_route_id: student.transport_details?.transport_route_id,
                    transport_pickup_point_id: student.transport_details?.transport_pickup_point_id,
                    transport_fee: student.transport_details?.transport_fee || 0,
                    pickup_time: student.transport_details?.pickup_time,
                    drop_time: student.transport_details?.drop_time,
                    vehicle_number: student.transport_details?.vehicle_number,
                    driver_name: student.transport_details?.driver_name,
                    driver_contact: student.transport_details?.driver_contact,
                    transport_special_instructions: student.transport_details?.special_instructions,
                    
                    hostel_required: !!student.hostel_details,
                    hostel_id: student.hostel_details?.hostel_id,
                    hostel_room_type: student.hostel_details?.room_type,
                    room_number: student.hostel_details?.room_number,
                    bed_number: student.hostel_details?.bed_number,
                    hostel_fee: student.hostel_details?.hostel_fee || 0,
                    check_in_date: student.hostel_details?.check_in_date,
                    check_out_date: student.hostel_details?.check_out_date,
                    hostel_guardian_contact: student.hostel_details?.guardian_contact,
                    hostel_emergency_contact: student.hostel_details?.emergency_contact,
                    hostel_special_requirements: student.hostel_details?.special_requirements
                });
                
                // Store original section ID to detect changes
                setOriginalSectionId(student.section_id);
                
                if (customData?.custom_data) {
                    setCustomFieldValues(customData.custom_data);
                    // MERGE custom data into formData for "System" fields that are stored in custom_data (e.g. mother_tongue, mismatched schema fields)
                    setFormData(prev => ({ ...prev, ...customData.custom_data }));
                }
                
                // Previews
                if(student.photo_url) setProfilePicturePreview(student.photo_url);
                if(student.father_photo_url) setFatherPicturePreview(student.father_photo_url);
                if(student.mother_photo_url) setMotherPicturePreview(student.mother_photo_url);
                if(student.guardian_photo_url) setGuardianPicturePreview(student.guardian_photo_url);

                // Fetch sections for class
                if(student.class_id) {
                    const { data: sRes } = await supabase.from('class_sections').select('sections(id, name)').eq('class_id', student.class_id);
                    setSections(sRes ? sRes.map(item => item.sections).filter(Boolean) : []);
                }
                // Fetch pickup points if route
                if(student.transport_details?.transport_route_id) {
                     const { data: pRes } = await supabase.from('route_pickup_point_mappings').select('pickup_point:transport_pickup_points(id, name), monthly_fees, pickup_time').eq('route_id', student.transport_details.transport_route_id);
                     setPickupPoints(pRes || []);
                }

            } catch (err) {
                console.error(err);
                toast({ variant: 'destructive', title: 'Start Error', description: err.message });
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [user, selectedBranch, studentId, toast]);

    // Handle Class Change -> Update Sections
    useEffect(() => {
        if (formData.class_id && !loading) {
          const fetchSections = async () => {
            const { data } = await supabase.from('class_sections').select('sections(id, name)').eq('class_id', formData.class_id);
            setSections(data ? data.map(item => item.sections).filter(Boolean) : []);
          };
          fetchSections();
        }
    }, [formData.class_id]);
    
    // Auto-generate Roll Number when Section Changes (excluding current student)
    const generateNextRollNumber = async (classId, sectionId) => {
        if (!classId || !sectionId || !selectedBranch?.id || !formData.session_id) return;
        
        setIsRollNumberLoading(true);
        try {
            // Get all roll numbers for this class/section/session, excluding current student
            const { data, error } = await supabase
                .from('student_profiles')
                .select('roll_number')
                .eq('branch_id', selectedBranch.id)
                .eq('session_id', formData.session_id)
                .eq('class_id', classId)
                .eq('section_id', sectionId)
                .neq('id', studentId) // Exclude current student
                .not('roll_number', 'is', null)
                .order('roll_number', { ascending: false })
                .limit(1);
            
            if (error) {
                console.error('[EditStudentProfile] Roll number fetch error:', error);
                toast({ variant: 'destructive', title: 'Could not fetch next roll number.' });
            } else {
                const lastRoll = data?.[0]?.roll_number;
                const lastRollNum = lastRoll ? parseInt(lastRoll.replace(/\D/g, ''), 10) : 0;
                const nextRollNumber = (lastRollNum || 0) + 1;
                setFormData(prev => ({ ...prev, roll_number: nextRollNumber.toString().padStart(2, '0') }));
                toast({ title: 'Roll Number Updated', description: `Auto-assigned: ${nextRollNumber.toString().padStart(2, '0')}` });
            }
        } catch (err) {
            console.error('[EditStudentProfile] Roll number error:', err);
        }
        setIsRollNumberLoading(false);
    };
    
    // Watch for Section Change and Auto-Generate Roll Number
    useEffect(() => {
        // Only trigger if section actually changed from original AND not during initial load
        if (!loading && originalSectionId && formData.section_id && formData.section_id !== originalSectionId) {
            generateNextRollNumber(formData.class_id, formData.section_id);
        }
    }, [formData.section_id]);

    // Handle Route Change -> Update Pickup Points & Vehicle/Driver Info
     useEffect(() => {
      const fetchTransportDetails = async () => {
        if (formData.transport_route_id && !loading) {
          // Fetch pickup points
          const { data, error } = await supabase.from('route_pickup_point_mappings').select('pickup_point:transport_pickup_points(id, name), monthly_fees, pickup_time').eq('route_id', formData.transport_route_id);
          if (data) setPickupPoints(data);
          
          // 🚗 AUTO-FETCH Vehicle & Driver info from route_vehicle_assignments
          const { data: assignmentData } = await supabase
            .from('route_vehicle_assignments')
            .select('vehicle:vehicle_id(vehicle_number, driver_name, driver_contact)')
            .eq('route_id', formData.transport_route_id)
            .maybeSingle();
          
          if (assignmentData?.vehicle) {
            // Auto-populate vehicle and driver info
            setFormData(prev => ({
              ...prev,
              vehicle_number: assignmentData.vehicle.vehicle_number || prev.vehicle_number || '',
              driver_name: assignmentData.vehicle.driver_name || prev.driver_name || '',
              driver_contact: assignmentData.vehicle.driver_contact || prev.driver_contact || ''
            }));
          }
        } else {
            if(!loading) setPickupPoints([]);
        }
      };
      fetchTransportDetails();
    }, [formData.transport_route_id]);

    // Handle Pincode Auto-fetch (Logic from StudentAdmission)
    useEffect(() => {
        const fetchPincodeData = async () => {
          // We assume 'pincode' field is named 'pincode' or 'current_pincode' or 'present_pincode'
          // We can check all pincode-like fields or simpler, just check 'pincode', 'present_pincode'
          const currentPincode = formData.pincode || formData.current_pincode || formData.present_pincode;
          
          if (!currentPincode || currentPincode.length !== 6) {
            setPostOffices([]);
            return;
          }
          setPincodeLoading(true);
          try {
            // Use api.postalpincode.in (allowed in CSP)
            const response = await fetch(`https://api.postalpincode.in/pincode/${currentPincode}`);
            const data = await response.json();
            
            if (data && data[0] && data[0].Status === 'Success' && Array.isArray(data[0].PostOffice) && data[0].PostOffice.length > 0) {
              setPostOffices(data[0].PostOffice);
              const { District, State } = data[0].PostOffice[0];
              // Update City/State if they are empty or just update them
              setFormData(prev => ({ ...prev, city: District || prev.city, state: State || prev.state }));
            } else {
              setPostOffices([]);
              // Don't clear city/state automatically to avoid data loss if API fails but user typed it
              toast({ variant: 'destructive', title: 'Invalid Pincode', description: 'No location found for this pincode.' });
            }
          } catch (error) {
            console.error('Pincode API error:', error);
            setPostOffices([]);
            // Silent fail or toast
          } finally {
            setPincodeLoading(false);
          }
        };
        const timer = setTimeout(fetchPincodeData, 500);
        return () => clearTimeout(timer);
    }, [formData.pincode, formData.current_pincode, formData.present_pincode]);

    const handlePostOfficeChange = (postOfficeName) => {
        const selected = postOffices.find(po => po.Name === postOfficeName);
        if (selected) {
          setFormData(prev => ({
            ...prev,
            city: selected.District,
            state: selected.State,
            // If there's a post_office field
            post_office: postOfficeName
          }));
        }
    };
    
    // Unified Change Handler
    const handleFieldChange = (key, value, isSystem) => {
        if (isSystem) {
            // Special handling for pincode input to limit length
            if ((key.includes('pincode')) && value && value.length > 6) return;
            handleChange(key, value);
        } else {
            handleCustomFieldChange(key, value); 
        }
    };

    const handleChange = (key, value) => {
        // If pincode changes, it triggers the useEffect above
        setFormData(prev => ({ ...prev, [key]: value }));
    };
    const handleCustomFieldChange = (key, value) => setCustomFieldValues(prev => ({ ...prev, [key]: value }));
    const handleBlur = (key) => setTouched(prev => ({ ...prev, [key]: true }));

    const handleFileChange = (file, setFile, setPreview) => {
        setFile(file);
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setPreview(reader.result);
          reader.readAsDataURL(file);
        }
    };
    
    // SIBLING LOGIC
    const handleSiblingAdd = async (selectedSibling) => {
        let newGroupId = formData.sibling_group_id;
        if (!newGroupId) {
             if(selectedSibling.sibling_group_id) newGroupId = selectedSibling.sibling_group_id;
             else newGroupId = uuidv4();
        }
        
        // Update both profiles to have this group ID
        try {
            await supabase.from('student_profiles').update({ sibling_group_id: newGroupId }).eq('id', studentId);
            await supabase.from('student_profiles').update({ sibling_group_id: newGroupId }).eq('id', selectedSibling.id);
            
            setFormData(prev => ({ ...prev, sibling_group_id: newGroupId }));
            setSiblings(prev => [...prev, selectedSibling]);
            toast({ title: 'Sibling Added' });
        } catch(e) {
            toast({ variant: 'destructive', title: 'Error adding sibling' });
        }
    };

    const removeSibling = async (siblingIdToRemove) => {
         try {
            await supabase.from('student_profiles').update({ sibling_group_id: null }).eq('id', siblingIdToRemove);
            setSiblings(prev => prev.filter(s => s.id !== siblingIdToRemove));
            // Check if current user is now alone? Handle backend trigger or manual logic if needed. 
            // For now, if no siblings left, we can clear group id
            if (siblings.length <= 1) { // including the one being removed, if length was 1, now 0
                await supabase.from('student_profiles').update({ sibling_group_id: null }).eq('id', studentId);
                setFormData(prev => ({ ...prev, sibling_group_id: null }));
            }
            toast({ title: 'Sibling Removed' });
         } catch(e) { 
             toast({ variant: 'destructive', title: 'Error removing sibling' });
         }
    };


    // DynamicField removed - using FieldRenderer


    const uploadFile = async (file, bucket) => {
        if (!file) return null;
        const fileName = `${uuidv4()}-${file.name}`;
        const { data, error } = await supabase.storage.from(bucket).upload(fileName, file);
        if (error) throw new Error(`Failed to upload ${file.name}`);
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
        return publicUrl;
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Photos
            const [pUrl, fUrl, mUrl, gUrl] = await Promise.all([
                uploadFile(profilePictureFile, 'student-photos'),
                uploadFile(fatherPictureFile, 'student-photos'),
                uploadFile(motherPictureFile, 'student-photos'),
                uploadFile(guardianPictureFile, 'student-photos'),
            ]);
            
            // CRITICAL: Store transport/hostel values BEFORE cleaning updates object
            const transportRequired = formData.transport_required;
            const hostelRequired = formData.hostel_required;
            
            // Get billing_cycle from selected route
            const selectedRoute = routes.find(r => r.id === formData.transport_route_id);
            const transportBillingCycle = selectedRoute?.billing_cycle || 'monthly';
            
            const transportData = {
                transport_route_id: formData.transport_route_id,
                transport_pickup_point_id: formData.transport_pickup_point_id,
                transport_fee: formData.transport_fee,
                billing_cycle: transportBillingCycle, // 🔧 Save billing_cycle from route
                pickup_time: formData.pickup_time,
                drop_time: formData.drop_time,
                vehicle_number: formData.vehicle_number,
                driver_name: formData.driver_name,
                driver_contact: formData.driver_contact,
                special_instructions: formData.transport_special_instructions
            };
            
            // Get billing_cycle from selected room type
            const selectedRoomType = hostelRoomTypes.find(rt => rt.id === formData.hostel_room_type);
            const hostelBillingCycle = selectedRoomType?.billing_cycle || 'monthly';
            
            const hostelData = {
                hostel_id: formData.hostel_id,
                room_type: formData.hostel_room_type,
                room_number: formData.room_number,
                bed_number: formData.bed_number,
                hostel_fee: formData.hostel_fee,
                billing_cycle: hostelBillingCycle, // 🔧 Save billing_cycle from room type
                check_in_date: formData.check_in_date,
                check_out_date: formData.check_out_date,
                guardian_contact: formData.hostel_guardian_contact,
                emergency_contact: formData.hostel_emergency_contact,
                special_requirements: formData.hostel_special_requirements
            };
            
            const updates = { ...formData };
            if(pUrl) updates.photo_url = pUrl;
            if(fUrl) updates.father_photo_url = fUrl;
            if(mUrl) updates.mother_photo_url = mUrl;
            if(gUrl) updates.guardian_photo_url = gUrl;
            
            // ========================================================================
            // CRITICAL FIX: Update full_name when first_name or last_name changes
            // This ensures Profile page displays correct name after editing
            // ========================================================================
            if (updates.first_name || updates.last_name) {
                const firstName = (updates.first_name || formData.first_name || '').trim();
                const lastName = (updates.last_name || formData.last_name || '').trim();
                updates.full_name = lastName ? `${firstName} ${lastName}`.trim() : firstName;
            }
            
            // ========================================================================
            // COMPLETE FIELD MAPPING (Same as StudentAdmission.jsx)
            // Maps frontend form field names to actual DB column names
            // ========================================================================
            
            // Date of Birth: Form uses 'dob' -> DB uses 'date_of_birth'
            if (updates.dob) {
                updates.date_of_birth = updates.dob;
                delete updates.dob;
            }
            
            // Address: Form uses 'current_address' -> DB uses 'present_address'
            if (updates.current_address !== undefined) {
                updates.present_address = updates.current_address;
                delete updates.current_address;
            }
            
            // Phone: Form uses 'mobile_no' -> DB uses 'phone'
            if (updates.mobile_no !== undefined) {
                updates.phone = updates.mobile_no?.replace(/[^0-9]/g, '').slice(0, 10) || null;
                delete updates.mobile_no;
            }
            
            // Pincode mapping
            if (updates.current_pincode !== undefined) {
                updates.pincode = updates.current_pincode;
                delete updates.current_pincode;
            }
            if (updates.present_pincode !== undefined) {
                updates.pincode = updates.present_pincode;
                delete updates.present_pincode;
            }
            
            // Aadhar: Form may use 'national_id_no' -> DB uses 'aadhar_no'
            if (updates.national_id_no !== undefined) {
                updates.aadhar_no = updates.national_id_no;
                delete updates.national_id_no;
            }
            
            // ========================================================================
            // REMOVE RELATIONAL/COMPUTED FIELDS (Not DB columns)
            // ========================================================================
            delete updates.transport_details;
            delete updates.hostel_details;
            delete updates.siblings;
            delete updates.class; // relational object
            delete updates.section; // relational object
            delete updates.session; // relational object
            delete updates.category; // relational object
            
            // ========================================================================
            // FIELDS TO STORE IN custom_data (Not in student_profiles schema)
            // ========================================================================
            const fieldsForCustomData = [
                'post_office', // Pincode API field
                'father_dob', 'mother_dob', // Parent DOBs not in main table
                'caste_category', 'sub_caste', // Text variations (IDs exist but text doesn't)
            ];
            
            const extraCustomData = {};
            fieldsForCustomData.forEach(field => {
                if (updates[field] !== undefined) {
                    extraCustomData[field] = updates[field];
                    delete updates[field];
                }
            });
            
            // Merge with existing custom values
            const finalCustomValues = { ...customFieldValues, ...extraCustomData };

            // Remove transport-related fields (stored in student_transport_details)
            delete updates.transport_required;
            delete updates.transport_route_id;
            delete updates.transport_pickup_point_id;
            delete updates.transport_fee;
            delete updates.pickup_time;
            delete updates.drop_time;
            delete updates.vehicle_number;
            delete updates.driver_name;
            delete updates.driver_contact;
            delete updates.transport_special_instructions;
            
            // Remove hostel-related fields (stored in student_hostel_details)
            delete updates.hostel_required;
            delete updates.hostel_id;
            delete updates.hostel_room_type;
            delete updates.room_number;
            delete updates.bed_number;
            delete updates.hostel_fee;
            delete updates.check_in_date;
            delete updates.check_out_date;
            delete updates.hostel_guardian_contact;
            delete updates.hostel_emergency_contact;
            delete updates.hostel_special_requirements;
            
            const { error: updateError } = await supabase.from('student_profiles').update(updates).eq('id', studentId);
            if(updateError) throw updateError;
            
            // Update Transport (using saved values from BEFORE delete)
            if (transportRequired) {
                 if (formData.transport_details?.id) {
                     await supabase.from('student_transport_details').update(transportData).eq('id', formData.transport_details.id);
                 } else {
                     // Note: organization_id not in student_transport_details schema
                     await supabase.from('student_transport_details').insert({ ...transportData, student_id: studentId, branch_id: selectedBranch?.id || user?.profile?.branch_id, session_id: currentSessionId });
                 }
            } else if (formData.transport_details?.id) {
                await supabase.from('student_transport_details').delete().eq('id', formData.transport_details.id);
            }

            // Update Hostel (using saved values from BEFORE delete)
            if (hostelRequired) {
                if (formData.hostel_details?.id) {
                     await supabase.from('student_hostel_details').update(hostelData).eq('id', formData.hostel_details.id);
                } else {
                     await supabase.from('student_hostel_details').insert({ ...hostelData, student_id: studentId, branch_id: selectedBranch?.id || user?.profile?.branch_id, session_id: currentSessionId, organization_id: organizationId });
                }
            } else if (formData.hostel_details?.id) {
                await supabase.from('student_hostel_details').delete().eq('id', formData.hostel_details.id);
            }
            
            // Update Custom Data
             if (Object.keys(finalCustomValues).length > 0) {
                await supabase
                  .from('student_custom_data')
                  .upsert({
                    branch_id: selectedBranch?.id || user?.profile?.branch_id,
                    session_id: currentSessionId,
                    student_id: studentId,
                    custom_data: finalCustomValues,
                    updated_at: new Date()
                  }, { onConflict: 'student_id' });
             }

            toast({ title: 'Profile Updated' });
            // Navigate to student profile page after save with refresh state
            navigate(`/super-admin/student-information/profile/${studentId}`, { 
              state: { refreshTime: Date.now() },
              replace: true 
            });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        } finally {
            setSaving(false);
        }
    };

    
    // Create master data object for FieldRenderer
    const masterData = { classes, sections, sessions, categories, casteCategories, subCastes, religions, motherTongues, postOffices };

    if (loading) return <DashboardLayout><div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2"><UserCog className="w-8 h-8 text-primary" /> Edit Student</h1>
                <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
            </div>
            
            <div className="space-y-8">
            {formSections.sort((a,b) => a.order - b.order).map(section => {
                 // Skip login details sections on Edit page - credentials should not be edited here
                 if (section.key === 'student_login_details' || section.key === 'parent_login_details' || 
                     section.key === 'login_details' || section.key === 'student_login' || section.key === 'parent_login') {
                     return null;
                 }
                 
                 if (section.key === 'documents') {
                     // Simplified documents view for edit
                      return (
                        <SectionBox key={section.key} icon={ICON_MAP[section.icon] || Files} title={section.label} gradient="orange" badge="Required" badgeColor="warning">
                            <div className="col-span-full">
                                <Label className="mb-3 block text-sm font-semibold">Available Documents</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                {masterDocuments.map(doc => (
                                     <div key={doc.name} className={cn(
                                        "flex items-center gap-2 p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md",
                                        formData.documents_received?.[doc.name] 
                                          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700" 
                                          : "bg-muted/30 border-border hover:bg-muted/50"
                                     )}>
                                        <Checkbox 
                                            id={`doc-${doc.name}`} 
                                            checked={!!formData.documents_received?.[doc.name]} 
                                            onCheckedChange={checked => setFormData(prev => ({...prev, documents_received: {...prev.documents_received, [doc.name]: checked}}))} 
                                            className={formData.documents_received?.[doc.name] ? "border-emerald-500 data-[state=checked]:bg-emerald-500" : ""}
                                        />
                                        <label htmlFor={`doc-${doc.name}`} className="text-sm font-medium cursor-pointer">{doc.name}</label>
                                     </div>
                                ))}
                                </div>
                            </div>
                        </SectionBox>
                      );
                 }
                 if (section.key === 'transport') {
                    return (
                        <div key={section.key} className="group relative overflow-hidden rounded-3xl border border-border/40 bg-card shadow-xl transition-all duration-500 hover:shadow-2xl hover:border-primary/30">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-green-500/10 to-teal-500/5 opacity-60 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/80 via-transparent to-transparent dark:from-gray-900/80 pointer-events-none" />
                            <div className="relative flex items-center justify-between gap-4 px-6 py-5 border-b border-border/30">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="relative bg-gradient-to-br from-emerald-500 to-green-600 p-3.5 rounded-2xl shadow-lg">
                                            <Bus className="h-6 w-6 text-white drop-shadow-sm" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                                            {section.label}
                                            <span className="text-xs px-2.5 py-1 rounded-full font-semibold border bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-800">Optional</span>
                                        </h2>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-muted-foreground">Enable Transport Facility</span>
                                    <Switch id="transport-required" checked={formData.transport_required} onCheckedChange={(checked) => handleChange('transport_required', checked)} />
                                </div>
                            </div>
                            <div className={cn("relative transition-all duration-500 ease-out", formData.transport_required ? "opacity-100" : "opacity-0 h-0 overflow-hidden")}>
                                <div className="p-6 pt-5">
                                    <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2"><Bus className="h-4 w-4" />Student will use school transport service</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="lg:col-span-1"><Label>Route Name <span className="text-red-500">*</span></Label><Select value={formData.transport_route_id || ''} onValueChange={v => handleChange('transport_route_id', v)}><SelectTrigger><SelectValue placeholder="Select a route" /></SelectTrigger><SelectContent>{routes.map(r => <SelectItem key={r.id} value={r.id}>{r.route_title}</SelectItem>)}</SelectContent></Select></div>
                                        <div className="lg:col-span-1"><Label>Stop Name <span className="text-red-500">*</span></Label><Select value={formData.transport_pickup_point_id || ''} onValueChange={v => handleChange('transport_pickup_point_id', v)} disabled={!formData.transport_route_id}><SelectTrigger><SelectValue placeholder="Select pickup point" /></SelectTrigger><SelectContent>{pickupPoints.map(p => <SelectItem key={p.pickup_point.id} value={p.pickup_point.id}>{p.pickup_point.name}</SelectItem>)}</SelectContent></Select></div>
                                        <div className="lg:col-span-1"><Label>Transport Fee</Label><Input value={formData.transport_fee} readOnly disabled className="bg-muted" /></div>
                                        <div className="lg:col-span-1"><Label>Pickup Time</Label><Input type="time" value={formData.pickup_time || ''} onChange={e => handleChange('pickup_time', e.target.value)} /></div>
                                        <div className="lg:col-span-1"><Label>Drop Time</Label><Input type="time" value={formData.drop_time || ''} onChange={e => handleChange('drop_time', e.target.value)} /></div>
                                        <div className="lg:col-span-1"><Label>Vehicle Number</Label><Input value={formData.vehicle_number || ''} onChange={e => handleChange('vehicle_number', e.target.value)} /></div>
                                        <div className="lg:col-span-1"><Label>Driver Name</Label><Input value={formData.driver_name || ''} onChange={e => handleChange('driver_name', e.target.value)} /></div>
                                        <div className="lg:col-span-1"><Label>Driver Contact</Label><Input type="tel" value={formData.driver_contact || ''} onChange={e => handleChange('driver_contact', e.target.value)} /></div>
                                        <div className="lg:col-span-4"><Label>Special Instructions</Label><Textarea value={formData.transport_special_instructions || ''} onChange={e => handleChange('transport_special_instructions', e.target.value)} /></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                 }
                 if (section.key === 'hostel') {
                      return (
                        <div key={section.key} className="group relative overflow-hidden rounded-3xl border border-border/40 bg-card shadow-xl transition-all duration-500 hover:shadow-2xl hover:border-primary/30">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-violet-500/10 to-fuchsia-500/5 opacity-60 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/80 via-transparent to-transparent dark:from-gray-900/80 pointer-events-none" />
                            <div className="relative flex items-center justify-between gap-4 px-6 py-5 border-b border-border/30">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="relative bg-gradient-to-br from-purple-500 to-violet-600 p-3.5 rounded-2xl shadow-lg">
                                            <BedDouble className="h-6 w-6 text-white drop-shadow-sm" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                                            {section.label}
                                            <span className="text-xs px-2.5 py-1 rounded-full font-semibold border bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-800">Optional</span>
                                        </h2>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-muted-foreground">Enable Hostel Facility</span>
                                    <Switch id="hostel-required" checked={formData.hostel_required} onCheckedChange={(checked) => handleChange('hostel_required', checked)} />
                                </div>
                            </div>
                            <div className={cn("relative transition-all duration-500 ease-out", formData.hostel_required ? "opacity-100" : "opacity-0 h-0 overflow-hidden")}>
                                <div className="p-6 pt-5">
                                    <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2"><BedDouble className="h-4 w-4" />Student will stay in school hostel</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="lg:col-span-1"><Label>Hostel Name <span className="text-red-500">*</span></Label><Select value={formData.hostel_id || ''} onValueChange={v => handleChange('hostel_id', v)}><SelectTrigger><SelectValue placeholder="Select Hostel" /></SelectTrigger><SelectContent>{hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent></Select></div>
                                        <div className="lg:col-span-1"><Label>Room Type <span className="text-red-500">*</span></Label><Select value={formData.hostel_room_type || ''} onValueChange={v => handleChange('hostel_room_type', v)}><SelectTrigger><SelectValue placeholder="Select Room Type" /></SelectTrigger><SelectContent>{hostelRoomTypes.map(rt => <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>)}</SelectContent></Select></div>
                                        <div className="lg:col-span-1"><Label>Room Number</Label><Input value={formData.room_number || ''} onChange={e => handleChange('room_number', e.target.value)} /></div>
                                        <div className="lg:col-span-1"><Label>Bed Number</Label><Input value={formData.bed_number || ''} onChange={e => handleChange('bed_number', e.target.value)} /></div>
                                        <div className="lg:col-span-1"><Label>Hostel Fee</Label><Input value={formData.hostel_fee || ''} readOnly disabled className="bg-muted" /></div>
                                        <DatePicker id="check_in_date" label="Check-in Date" value={formData.check_in_date} onChange={date => handleChange('check_in_date', date)} />
                                        <DatePicker id="check_out_date" label="Check-out Date" value={formData.check_out_date} onChange={date => handleChange('check_out_date', date)} />
                                        <div className="lg:col-span-1"><Label>Guardian Contact</Label><Input type="tel" value={formData.hostel_guardian_contact || ''} onChange={e => handleChange('hostel_guardian_contact', e.target.value)} /></div>
                                        <div className="lg:col-span-1"><Label>Emergency Contact</Label><Input type="tel" value={formData.hostel_emergency_contact || ''} onChange={e => handleChange('hostel_emergency_contact', e.target.value)} /></div>
                                        <div className="lg:col-span-4"><Label>Special Requirements</Label><Textarea value={formData.hostel_special_requirements || ''} onChange={e => handleChange('hostel_special_requirements', e.target.value)} /></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                      );
                 }

                 const sectionFields = allFields.filter(f => f.section_key === section.key).sort((a,b) => a.sort_order - b.sort_order);
                 const isEmpty = sectionFields.length === 0;
                 const isAcademic = section.key === 'academic_details';
                 if (isEmpty && !isAcademic) return null;

                 return (
                    <SectionBox key={section.key} icon={ICON_MAP[section.icon] || User} title={section.label}>
                         {sectionFields.map(field => (
                            <FieldRenderer 
                                key={field.id || field.key} 
                                field={field} 
                                formData={formData} 
                                customFieldValues={customFieldValues} 
                                onChange={handleFieldChange} 
                                masterData={masterData}
                                handlePostOfficeChange={handlePostOfficeChange}
                            />
                         ))}
                         {isAcademic && (
                             <div className="lg:col-span-2 md:col-span-2">
                                <Label>Siblings</Label>
                                <div className="flex items-center gap-2">
                                    <Dialog><DialogTrigger asChild><Button variant="outline" className="w-full"><UserPlus className="mr-2 h-4 w-4" /> Add Sibling</Button></DialogTrigger><AddSiblingModal onSiblingAdd={handleSiblingAdd} currentStudentId={studentId} /></Dialog>
                                </div>
                                {siblings && siblings.length > 0 && <div className="mt-2 space-y-1">{siblings.map(s => <div key={s.id} className="flex items-center justify-between bg-muted p-1.5 rounded-md text-sm"><span>{s.full_name}</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeSibling(s.id)}><X className="h-4 w-4 text-destructive" /></Button></div>)}</div>}
                            </div>
                         )}
                    </SectionBox>
                 );
            })}

            {/* 📸 PHOTO GALLERY - All Photos in One Place at the End */}
            <SectionBox icon={Camera} title="Photo Gallery" badge="Upload Photos" badgeColor="info" gradient="purple">
              <div className="col-span-full space-y-6">
                {/* Student Identity Header */}
                <div className="bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-fuchsia-500/10 border-2 border-purple-500/30 rounded-2xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-violet-500/20 rounded-2xl blur-xl opacity-60" />
                      <div className="relative bg-gradient-to-br from-purple-500 to-violet-600 p-4 rounded-2xl shadow-xl">
                        <UserCircle2 className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Editing photos for</p>
                      <h3 className="text-2xl font-black text-transparent bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 dark:from-purple-400 dark:via-violet-400 dark:to-fuchsia-400 bg-clip-text">
                        {formData.full_name || formData.first_name || 'Student'}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.admission_no && `Admission No: ${formData.admission_no}`}
                        {formData.roll_number && ` • Roll: ${formData.roll_number}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Photo Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {/* Student Photo */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "relative w-full aspect-[3.5/4.5] rounded-2xl overflow-hidden border-3 transition-all duration-300 shadow-lg group",
                      profilePicturePreview 
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" 
                        : "border-dashed border-purple-300 dark:border-purple-700 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 hover:border-purple-500"
                    )}>
                      <ImageUploader 
                        onFileChange={file => handleFileChange(file, setProfilePictureFile, setProfilePicturePreview)} 
                        initialPreview={profilePicturePreview} 
                        showInstruction={false}
                        showCamera={false}
                        aspectRatio={3.5/4.5}
                        showCrop={true}
                      />
                      {profilePicturePreview && (
                        <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <p className="text-sm font-bold text-purple-700 dark:text-purple-300 flex items-center justify-center gap-1.5">
                        <GraduationCap className="h-4 w-4" />
                        Student Photo
                      </p>
                    </div>
                  </div>

                  {/* Father Photo */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "relative w-full aspect-[3.5/4.5] rounded-2xl overflow-hidden border-3 transition-all duration-300 shadow-lg group",
                      fatherPicturePreview 
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" 
                        : "border-dashed border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 hover:border-blue-500"
                    )}>
                      <ImageUploader 
                        onFileChange={file => handleFileChange(file, setFatherPictureFile, setFatherPicturePreview)} 
                        initialPreview={fatherPicturePreview} 
                        showInstruction={false}
                        showCamera={false}
                        aspectRatio={3.5/4.5}
                        showCrop={true}
                      />
                      {fatherPicturePreview && (
                        <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <p className="text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center justify-center gap-1.5">
                        <User className="h-4 w-4" />
                        Father Photo
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formData.father_name || ''}</p>
                    </div>
                  </div>

                  {/* Mother Photo */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "relative w-full aspect-[3.5/4.5] rounded-2xl overflow-hidden border-3 transition-all duration-300 shadow-lg group",
                      motherPicturePreview 
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" 
                        : "border-dashed border-pink-300 dark:border-pink-700 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 hover:border-pink-500"
                    )}>
                      <ImageUploader 
                        onFileChange={file => handleFileChange(file, setMotherPictureFile, setMotherPicturePreview)} 
                        initialPreview={motherPicturePreview} 
                        showInstruction={false}
                        showCamera={false}
                        aspectRatio={3.5/4.5}
                        showCrop={true}
                      />
                      {motherPicturePreview && (
                        <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <p className="text-sm font-bold text-pink-700 dark:text-pink-300 flex items-center justify-center gap-1.5">
                        <Heart className="h-4 w-4" />
                        Mother Photo
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formData.mother_name || ''}</p>
                    </div>
                  </div>

                  {/* Guardian Photo */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "relative w-full aspect-[3.5/4.5] rounded-2xl overflow-hidden border-3 transition-all duration-300 shadow-lg group",
                      guardianPicturePreview 
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" 
                        : "border-dashed border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 hover:border-amber-500"
                    )}>
                      <ImageUploader 
                        onFileChange={file => handleFileChange(file, setGuardianPictureFile, setGuardianPicturePreview)} 
                        initialPreview={guardianPicturePreview} 
                        showInstruction={false}
                        showCamera={false}
                        aspectRatio={3.5/4.5}
                        showCrop={true}
                      />
                      {guardianPicturePreview && (
                        <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <p className="text-sm font-bold text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1.5">
                        <Shield className="h-4 w-4" />
                        Guardian Photo
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formData.guardian_name || ''}</p>
                    </div>
                  </div>
                </div>

                {/* Upload Status Summary */}
                <div className="flex items-center justify-center gap-6 pt-4 border-t border-border/30">
                  <div className="flex items-center gap-2 text-sm">
                    <div className={cn("w-3 h-3 rounded-full", profilePicturePreview ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600")} />
                    <span className={profilePicturePreview ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground"}>Student</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={cn("w-3 h-3 rounded-full", fatherPicturePreview ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600")} />
                    <span className={fatherPicturePreview ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground"}>Father</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={cn("w-3 h-3 rounded-full", motherPicturePreview ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600")} />
                    <span className={motherPicturePreview ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground"}>Mother</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={cn("w-3 h-3 rounded-full", guardianPicturePreview ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600")} />
                    <span className={guardianPicturePreview ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground"}>Guardian</span>
                  </div>
                </div>
              </div>
            </SectionBox>
            
            <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={saving} size="lg"><Save className="mr-2 h-5 w-5" /> {saving ? 'Saving...' : 'Update Student'}</Button>
            </div>
            
            </div>
        </DashboardLayout>
    );
};

export default EditStudentProfile;
