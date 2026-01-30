import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { BookOpen, User, Key, Users, Bus, FileText, UserCog, Save, Shield, Loader2, UserPlus, FileCheck2, Copy, Percent, Wallet, AlertCircle, Building, X, Sparkles, BedDouble, GraduationCap, Phone, MapPin, Files, CheckCircle2, ChevronDown, Eye, EyeOff, Lock, RefreshCw, Camera } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import { v4 as uuidv4 } from 'uuid';
import api from '@/lib/api';
import DatePicker from '@/components/ui/DatePicker';
import AadharInput from '@/components/AadharInput';
import { cn } from '@/lib/utils';

// Icon mapping
const ICON_MAP = {
  BookOpen, User, Key, Users, Bus, FileText, UserCog, Shield, Files, Building, BedDouble, GraduationCap, Phone, MapPin
};

// Premium Section Card (matching StudentAdmission.jsx)
const SectionBox = ({ icon, title, children, className, gradient = 'blue', badge, badgeColor = 'primary' }) => {
  const Icon = icon || FileText;
  
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
  };

  return (
    <div className={cn("group relative overflow-hidden rounded-3xl border border-border/40 bg-card shadow-xl transition-all duration-500 hover:shadow-2xl hover:border-primary/30", className)}>
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none", gradientStyles[gradient])} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/80 via-transparent to-transparent dark:from-gray-900/80 pointer-events-none" />
      
      <div className="relative flex items-center justify-between gap-4 px-6 py-5 border-b border-border/30">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className={cn("relative bg-gradient-to-br p-3.5 rounded-2xl shadow-lg", iconGradients[gradient])}>
              <Icon className="h-6 w-6 text-white drop-shadow-sm" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 border-2 border-card shadow-lg pointer-events-none">
              <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
              {title}
              {badge && <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold border", badgeColors[badgeColor])}>{badge}</span>}
            </h2>
          </div>
        </div>
      </div>
      
      <div className="relative p-6 pt-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Smart Field Component
const SmartField = ({ label, required, error, touched, children, className, hint, icon: FieldIcon, colSpan = 1 }) => (
  <div className={cn("group space-y-2", colSpan === 2 && "md:col-span-2", colSpan === 4 && "md:col-span-2 lg:col-span-4", className)}>
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
    <div className="relative">{children}</div>
    {touched && error && (
      <p className="text-xs text-red-500 flex items-center gap-1.5 animate-in slide-in-from-top-1 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded-lg border border-red-200 dark:border-red-900">
        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /><span>{error}</span>
      </p>
    )}
  </div>
);

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
      setClasses(data || []);
    };
    fetchClasses();
  }, [user?.profile?.branch_id, selectedBranch]);

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
        const { data } = await supabase.from('student_profiles')
            .select('id, full_name, sibling_group_id, carry_forward_fees')
            .eq('class_id', selectedClass)
            .eq('section_id', selectedSection)
            .eq('branch_id', selectedBranch.id)
            .neq('id', currentStudentId);
        setStudents(data || []);
      };
      fetchStudents();
    } else {
      setStudents([]);
    }
    setSelectedStudent(null);
  }, [selectedSection, selectedClass, selectedBranch, currentStudentId]);

  const handleAdd = () => {
    if (selectedStudent) onSiblingAdd(selectedStudent);
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
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingCredentials, setSavingCredentials] = useState(false);
    
    // Data States
    const [formSections, setFormSections] = useState([]);
    const [allFields, setAllFields] = useState([]);
    const [formData, setFormData] = useState({});
    const [customFieldValues, setCustomFieldValues] = useState({});
    const [siblings, setSiblings] = useState([]);
    
    // Login Details States
    const [studentPassword, setStudentPassword] = useState('');
    const [studentRetypePassword, setStudentRetypePassword] = useState('');
    const [parentPassword, setParentPassword] = useState('');
    const [parentRetypePassword, setParentRetypePassword] = useState('');
    const [showStudentPassword, setShowStudentPassword] = useState(false);
    const [showStudentRetypePassword, setShowStudentRetypePassword] = useState(false);
    const [showParentPassword, setShowParentPassword] = useState(false);
    const [showParentRetypePassword, setShowParentRetypePassword] = useState(false);
    
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
    const [motherTongues, setMotherTongues] = useState([]);
    const [masterDocuments, setMasterDocuments] = useState([]);
    const [genders] = useState([{ name: 'Male' }, { name: 'Female' }, { name: 'Other' }]);
    const [bloodGroups] = useState([{ name: 'A+' }, { name: 'A-' }, { name: 'B+' }, { name: 'B-' }, { name: 'AB+' }, { name: 'AB-' }, { name: 'O+' }, { name: 'O-' }]);
    
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

    // Save Credentials Handler
    const handleSaveCredentials = async () => {
        // Validate
        if (studentPassword && studentPassword !== studentRetypePassword) {
            toast({ variant: 'destructive', title: 'Student passwords do not match' });
            return;
        }
        if (parentPassword && parentPassword !== parentRetypePassword) {
            toast({ variant: 'destructive', title: 'Parent passwords do not match' });
            return;
        }
        if (!studentPassword && !parentPassword) {
            toast({ variant: 'destructive', title: 'Please enter at least one password to update' });
            return;
        }
        
        setSavingCredentials(true);
        try {
            const payload = {};
            if (studentPassword) payload.student_password = studentPassword;
            if (parentPassword) payload.parent_password = parentPassword;
            
            const response = await api.put(`/students/${studentId}/credentials`, payload);
            
            if (response.data.success) {
                const results = response.data.results;
                let message = '';
                if (results.student?.success) message += 'Student password updated. ';
                if (results.parent?.success) message += results.parent.message;
                
                toast({ title: 'Credentials Updated', description: message });
                
                // Clear password fields
                setStudentPassword('');
                setStudentRetypePassword('');
                setParentPassword('');
                setParentRetypePassword('');
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to update credentials', description: error.response?.data?.error || error.message });
        } finally {
            setSavingCredentials(false);
        }
    };

    useEffect(() => {
        if (!user?.profile?.branch_id || !selectedBranch?.id) return;
        const init = async () => {
            setLoading(true);
            try {
                const branchId = user.profile.branch_id;
                
                // 1. Fetch Settings & Master Data
                const [
                    customFieldsRes,
                    classesRes, sessionsRes, categoriesRes, routesRes, hostelsRes, hostelRoomTypesRes, religionsRes, castesRes, motherTonguesRes, masterDocsRes
                ] = await Promise.all([
                    api.get('/form-settings', { params: { branchId, module: 'student_admission' } }),
                    supabase.from('classes').select('id, name').eq('branch_id', branchId).eq('branch_id', selectedBranch.id),
                    supabase.from('sessions').select('id, name, is_active').eq('branch_id', selectedBranch.id).order('name', { ascending: false }),
                    supabase.from('student_categories').select('id, name').eq('branch_id', branchId),
                    supabase.from('transport_routes').select('id, route_title').eq('branch_id', branchId),
                    supabase.from('hostels').select('id, name').eq('branch_id', branchId),
                    supabase.from('hostel_room_types').select('*').eq('branch_id', branchId),
                    supabase.from('master_religions').select('name'),
                    supabase.from('master_castes').select('name'),
                    supabase.from('master_mother_tongues').select('name'),
                    supabase.from('master_documents').select('name, is_required')
                ]);

                if (customFieldsRes.data?.success) {
                    setAllFields([...(customFieldsRes.data.systemFields || []), ...(customFieldsRes.data.customFields || [])]);
                    setFormSections(customFieldsRes.data.sections || []);
                }
                
                setClasses(classesRes.data || []);
                setSessions(sessionsRes.data || []);
                setCategories(categoriesRes.data || []);
                setRoutes(routesRes.data || []);
                setHostels(hostelsRes.data || []);
                setHostelRoomTypes(hostelRoomTypesRes.data || []);
                setReligions(religionsRes.data || []);
                setCastes(castesRes.data || []);
                setMotherTongues(motherTonguesRes.data || []);
                setMasterDocuments(masterDocsRes.data || []);

                // 2. Fetch Student Data
                const { data: student, error } = await supabase
                    .from('student_profiles')
                    .select('*, transport_details:student_transport_details(*), hostel_details:student_hostel_details(*)')
                    .eq('id', studentId)
                    .single();
                
                if (error) throw error;
                
                // 3. Fetch Custom Data
                const { data: customData } = await supabase.from('student_custom_data').select('custom_data').eq('student_id', studentId).maybeSingle();
                
                // 4. Fetch Siblings
                if (student.sibling_group_id) {
                    const { data: siblingData } = await supabase.from('student_profiles').select('id, full_name, sibling_group_id').eq('sibling_group_id', student.sibling_group_id).neq('id', studentId);
                    setSiblings(siblingData || []);
                }
                
                // Map Student Data to Form
                setFormData({
                    ...student,
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
                
                if (customData?.custom_data) setCustomFieldValues(customData.custom_data);
                
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.profile?.branch_id, selectedBranch?.id, studentId]);

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

    // Handle Route Change -> Update Pickup Points
     useEffect(() => {
      const fetchTransportDetails = async () => {
        if (formData.transport_route_id && !loading) {
          const { data, error } = await supabase.from('route_pickup_point_mappings').select('pickup_point:transport_pickup_points(id, name), monthly_fees, pickup_time').eq('route_id', formData.transport_route_id);
          if (data) setPickupPoints(data);
        } else {
            if(!loading) setPickupPoints([]);
        }
      };
      fetchTransportDetails();
    }, [formData.transport_route_id]);

    const handleChange = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));
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

    const renderDynamicField = (field) => {
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
                      return <SmartField label={field.field_label} required={field.is_required} hint="Auto-generated"><Input value={formData.school_code || ''} disabled className="bg-muted/50 h-11" /></SmartField>;
                 case 'class':
                      return <SmartField label={field.field_label} required={field.is_required}><Select value={formData.class_id} onValueChange={v => handleChange('class_id', v)}><SelectTrigger className="h-11"><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></SmartField>;
                 case 'section':
                      return <SmartField label={field.field_label} required={field.is_required}><Select value={formData.section_id} onValueChange={v => handleChange('section_id', v)}><SelectTrigger className="h-11"><SelectValue placeholder="Select Section" /></SelectTrigger><SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></SmartField>;
                 case 'session':
                      const activeSession = sessions.find(s => s.is_active);
                      return <SmartField label={field.field_label || 'Session'} required={field.is_required} hint={activeSession ? "Current Active Session" : null}><Select value={formData.session_id || ''} onValueChange={v => handleChange('session_id', v)}><SelectTrigger className={cn("h-11", activeSession && formData.session_id === activeSession.id && "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20")}><SelectValue placeholder="Select Session" /></SelectTrigger><SelectContent>{sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name} {s.is_active && <span className="text-green-600 font-semibold ml-2">(Active)</span>}</SelectItem>)}</SelectContent></Select></SmartField>;
                 case 'roll_number':
                      return <SmartField label={field.field_label || 'Roll Number'} required={field.is_required}><Input type="text" value={formData.roll_number || ''} onChange={e => handleChange('roll_number', e.target.value)} className="h-11" placeholder="Enter Roll Number" /></SmartField>;
                 case 'dob':
                      return <SmartField label={field.field_label} required={field.is_required}><DatePicker value={formData.date_of_birth} onChange={date => handleChange('date_of_birth', date)} /></SmartField>;
                 case 'date': case 'admission_date': case 'father_dob': case 'mother_dob':
                      return <SmartField label={field.field_label} required={field.is_required}><DatePicker value={formData[field.field_name]} onChange={date => handleChange(field.field_name, date)} /></SmartField>;
                 case 'category':
                      return <SmartField label={field.field_label} required={field.is_required}><Select value={formData.category_id || ''} onValueChange={v => handleChange('category_id', v)}><SelectTrigger className="h-11"><SelectValue placeholder="Select Category" /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></SmartField>;
                 case 'gender':
                      return <SmartField label={field.field_label} required={field.is_required}><Select value={formData.gender || ''} onValueChange={v => handleChange('gender', v)}><SelectTrigger className="h-11"><SelectValue placeholder="Select Gender" /></SelectTrigger><SelectContent>{genders.map(g => <SelectItem key={g.name} value={g.name}>{g.name}</SelectItem>)}</SelectContent></Select></SmartField>;
                 case 'blood_group':
                      return <SmartField label={field.field_label} required={field.is_required}><Select value={formData.blood_group || ''} onValueChange={v => handleChange('blood_group', v)}><SelectTrigger className="h-11"><SelectValue placeholder="Select Blood Group" /></SelectTrigger><SelectContent>{bloodGroups.map(bg => <SelectItem key={bg.name} value={bg.name}>{bg.name}</SelectItem>)}</SelectContent></Select></SmartField>;
                 case 'student_photo': case 'father_photo': case 'mother_photo': case 'guardian_photo':
                    const photoHandlers = {
                        student_photo: { setFile: setProfilePictureFile, preview: profilePicturePreview, setPreview: setProfilePicturePreview },
                        father_photo: { setFile: setFatherPictureFile, preview: fatherPicturePreview, setPreview: setFatherPicturePreview },
                        mother_photo: { setFile: setMotherPictureFile, preview: motherPicturePreview, setPreview: setMotherPicturePreview },
                        guardian_photo: { setFile: setGuardianPictureFile, preview: guardianPicturePreview, setPreview: setGuardianPicturePreview },
                    };
                    const h = photoHandlers[field.field_name];
                    return <div className="md:col-span-1"><Label className="flex items-center gap-2 mb-2"><Camera className="h-4 w-4" />{field.field_label}</Label><ImageUploader onFileChange={file => handleFileChange(file, h.setFile, h.setPreview)} initialPreview={h.preview} /></div>;
                 case 'national_id_no': case 'father_aadhar_no': case 'mother_aadhar_no':
                     return <SmartField label={field.field_label} required={field.is_required}><AadharInput value={formData[field.field_name] || ''} onChange={val => handleChange(field.field_name, val)} /></SmartField>;
                 case 'religion':
                      return <SmartField label={field.field_label} required={field.is_required}><Select value={formData.religion || ''} onValueChange={v => handleChange('religion', v)}><SelectTrigger className="h-11"><SelectValue placeholder="Select Religion" /></SelectTrigger><SelectContent>{religions.map(r => <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>)}</SelectContent></Select></SmartField>;
                 case 'caste':
                      return <SmartField label={field.field_label} required={field.is_required}><Select value={formData.caste || ''} onValueChange={v => handleChange('caste', v)}><SelectTrigger className="h-11"><SelectValue placeholder="Select Caste" /></SelectTrigger><SelectContent>{castes.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select></SmartField>;
                 case 'mother_tongue':
                      return <SmartField label={field.field_label} required={field.is_required}><Select value={formData.mother_tongue || ''} onValueChange={v => handleChange('mother_tongue', v)}><SelectTrigger className="h-11"><SelectValue placeholder="Select Mother Tongue" /></SelectTrigger><SelectContent>{motherTongues.map(mt => <SelectItem key={mt.name} value={mt.name}>{mt.name}</SelectItem>)}</SelectContent></Select></SmartField>;
                 case 'phone': case 'mobile_no': case 'father_phone': case 'mother_phone': case 'guardian_phone':
                      return <SmartField label={field.field_label} required={field.is_required} icon={Phone}><Input type="tel" value={formData[field.field_name] || ''} onChange={e => handleChange(field.field_name, e.target.value)} placeholder="10 digit mobile" className="h-11" /></SmartField>;
                 case 'email': case 'father_email': case 'mother_email':
                      return <SmartField label={field.field_label} required={field.is_required}><Input type="email" value={formData[field.field_name] || ''} onChange={e => handleChange(field.field_name, e.target.value)} placeholder="email@example.com" className="h-11" /></SmartField>;
                 case 'current_address': case 'permanent_address': case 'present_address':
                      const addressKey = field.field_name === 'current_address' ? 'present_address' : field.field_name;
                      return <SmartField label={field.field_label} required={field.is_required} colSpan={2}><Textarea value={formData[addressKey] || ''} onChange={e => handleChange(addressKey, e.target.value)} placeholder="Enter address" rows={3} /></SmartField>;
            }
        }

        // Generic field handling
        const value = field.is_system ? (formData[field.field_name] ?? '') : (customFieldValues[field.field_key] ?? '');
        const onChange = (val) => field.is_system ? handleChange(field.field_name, val) : handleCustomFieldChange(field.field_key, val);

        if (field.type === 'select' || field.field_type === 'select') {
           return <SmartField label={field.field_label} required={field.is_required}><Select value={value} onValueChange={onChange}><SelectTrigger className="h-11"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{(field.field_options || []).map((opt, i) => <SelectItem key={i} value={typeof opt === 'object' ? opt.value : opt}>{typeof opt === 'object' ? opt.label : opt}</SelectItem>)}</SelectContent></Select></SmartField>;
        }
        if (field.type === 'textarea' || field.field_type === 'textarea') {
            return <SmartField label={field.field_label} required={field.is_required} colSpan={2}><Textarea value={value} onChange={e => onChange(e.target.value)} rows={3} /></SmartField>;
        }
        if (field.type === 'date' || field.field_type === 'date') {
            return <SmartField label={field.field_label} required={field.is_required}><DatePicker value={value} onChange={onChange} /></SmartField>;
        }
        if (field.type === 'checkbox' || field.field_type === 'checkbox') {
             return <div className="flex items-center space-x-2 mt-8"><Checkbox id={field.field_key} checked={!!value} onCheckedChange={onChange} /><label htmlFor={field.field_key} className="text-sm font-medium">{field.field_label}</label></div>;
        }
        return <SmartField label={field.field_label} required={field.is_required}><Input value={value} type={field.type === 'number' || field.field_type === 'number' ? 'number' : 'text'} onChange={e => onChange(e.target.value)} className="h-11" /></SmartField>;
    }

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
            
            const updates = { ...formData };
            if(pUrl) updates.photo_url = pUrl;
            if(fUrl) updates.father_photo_url = fUrl;
            if(mUrl) updates.mother_photo_url = mUrl;
            if(gUrl) updates.guardian_photo_url = gUrl;
            
            // Clean up updates object - remove fields that don't belong in student_profiles table
            delete updates.transport_details;
            delete updates.hostel_details;
            delete updates.siblings; // not a column
            // Transport fields - stored in student_transport_details table
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
            // Hostel fields - stored in student_hostel_details table
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
            
            // Update Transport (use formData since we removed these fields from updates)
            if (formData.transport_required) {
                 const tData = {
                    transport_route_id: formData.transport_route_id,
                    transport_pickup_point_id: formData.transport_pickup_point_id,
                    transport_fee: formData.transport_fee,
                    pickup_time: formData.pickup_time,
                    drop_time: formData.drop_time,
                    vehicle_number: formData.vehicle_number,
                    driver_name: formData.driver_name,
                    driver_contact: formData.driver_contact,
                    special_instructions: formData.transport_special_instructions
                 };
                 if (formData.transport_details?.id) {
                     await supabase.from('student_transport_details').update(tData).eq('id', formData.transport_details.id);
                 } else {
                     await supabase.from('student_transport_details').insert({ ...tData, student_id: studentId, branch_id: user.profile.branch_id });
                 }
            } else if (formData.transport_details?.id) {
                await supabase.from('student_transport_details').delete().eq('id', formData.transport_details.id);
            }

            // Update Hostel (use formData since we removed these fields from updates)
            if (formData.hostel_required) {
                const hData = {
                    hostel_id: formData.hostel_id,
                    room_type: formData.hostel_room_type,
                    room_number: formData.room_number,
                    bed_number: formData.bed_number,
                    hostel_fee: formData.hostel_fee,
                    check_in_date: formData.check_in_date,
                    check_out_date: formData.check_out_date,
                    guardian_contact: formData.hostel_guardian_contact,
                    emergency_contact: formData.hostel_emergency_contact,
                    special_requirements: formData.hostel_special_requirements
                };
                if (formData.hostel_details?.id) {
                     await supabase.from('student_hostel_details').update(hData).eq('id', formData.hostel_details.id);
                } else {
                     await supabase.from('student_hostel_details').insert({ ...hData, student_id: studentId, branch_id: user.profile.branch_id });
                }
            } else if (formData.hostel_details?.id) {
                await supabase.from('student_hostel_details').delete().eq('id', formData.hostel_details.id);
            }
            
            // Update Custom Data
             if (Object.keys(customFieldValues).length > 0) {
                await supabase
                  .from('student_custom_data')
                  .upsert({
                    branch_id: user.profile.branch_id,
                    student_id: studentId,
                    custom_data: customFieldValues,
                    updated_at: new Date()
                  }, { onConflict: 'student_id' });
             }

            toast({ title: 'Profile Updated' });
            navigate(-1);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <DashboardLayout><div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2"><UserCog className="w-8 h-8 text-primary" /> Edit Student</h1>
                <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
            </div>
            
            <div className="space-y-8">
            
            {/* LOGIN DETAILS SECTION - Always show first */}
            <SectionBox icon={Key} title="Login Details" gradient="purple" badge="Credentials" badgeColor="warning">
                <div className="lg:col-span-4 mb-4">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                            <div>
                                <p className="font-medium text-amber-800 dark:text-amber-200">Login Information</p>
                                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                    <strong>Student Login:</strong> Admission Number ({formData.school_code || 'N/A'})<br />
                                    <strong>Parent Login:</strong> Mobile Number ({formData.father_phone || formData.mother_phone || formData.guardian_phone || 'N/A'})
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Student Password */}
                <SmartField label="New Student Password" icon={Lock} hint="Leave empty to keep current">
                    <div className="relative">
                        <Input 
                            type={showStudentPassword ? "text" : "password"} 
                            value={studentPassword}
                            onChange={e => setStudentPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="h-11 pr-10"
                            autoComplete="new-password"
                        />
                        <Button type="button" variant="ghost" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => setShowStudentPassword(!showStudentPassword)}>
                            {showStudentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                </SmartField>
                
                <SmartField label="Retype Student Password" icon={Lock}>
                    <div className="relative">
                        <Input 
                            type={showStudentRetypePassword ? "text" : "password"} 
                            value={studentRetypePassword}
                            onChange={e => setStudentRetypePassword(e.target.value)}
                            placeholder="Re-type password"
                            autoComplete="new-password"
                            className={cn("h-11 pr-10", studentPassword && studentRetypePassword && studentPassword !== studentRetypePassword && "border-red-500")}
                        />
                        <Button type="button" variant="ghost" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => setShowStudentRetypePassword(!showStudentRetypePassword)}>
                            {showStudentRetypePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                    {studentPassword && studentRetypePassword && studentPassword !== studentRetypePassword && (
                        <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                </SmartField>
                
                {/* Parent Password */}
                <SmartField label="New Parent Password" icon={Lock} hint="Leave empty to keep current">
                    <div className="relative">
                        <Input 
                            type={showParentPassword ? "text" : "password"} 
                            value={parentPassword}
                            onChange={e => setParentPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="h-11 pr-10"
                            autoComplete="new-password"
                        />
                        <Button type="button" variant="ghost" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => setShowParentPassword(!showParentPassword)}>
                            {showParentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                </SmartField>
                
                <SmartField label="Retype Parent Password" icon={Lock}>
                    <div className="relative">
                        <Input 
                            type={showParentRetypePassword ? "text" : "password"} 
                            value={parentRetypePassword}
                            onChange={e => setParentRetypePassword(e.target.value)}
                            placeholder="Re-type password"
                            autoComplete="new-password"
                            className={cn("h-11 pr-10", parentPassword && parentRetypePassword && parentPassword !== parentRetypePassword && "border-red-500")}
                        />
                        <Button type="button" variant="ghost" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => setShowParentRetypePassword(!showParentRetypePassword)}>
                            {showParentRetypePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                    {parentPassword && parentRetypePassword && parentPassword !== parentRetypePassword && (
                        <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                </SmartField>
                
                <div className="lg:col-span-4 flex justify-end pt-2">
                    <Button 
                        onClick={handleSaveCredentials} 
                        disabled={savingCredentials || (!studentPassword && !parentPassword)}
                        variant="outline"
                        className="bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
                    >
                        <RefreshCw className={cn("mr-2 h-4 w-4", savingCredentials && "animate-spin")} />
                        {savingCredentials ? 'Updating...' : 'Update Credentials'}
                    </Button>
                </div>
            </SectionBox>
            
            {formSections.sort((a,b) => a.order - b.order).map(section => {
                 if (section.key === 'documents') {
                     // Simplified documents view for edit
                      return (
                        <SectionBox key={section.key} icon={ICON_MAP[section.icon] || Files} title={section.label}>
                            <div className="col-span-full">
                                <Label className="mb-2 block">Available Documents</Label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {masterDocuments.map(doc => (
                                     <div key={doc.name} className="flex items-center space-x-2">
                                        <Checkbox id={`doc-${doc.name}`} checked={!!formData.documents_received?.[doc.name]} onCheckedChange={checked => setFormData(prev => ({...prev, documents_received: {...prev.documents_received, [doc.name]: checked}}))} />
                                        <label htmlFor={`doc-${doc.name}`} className="text-sm font-medium">{doc.name}</label>
                                     </div>
                                ))}
                                </div>
                            </div>
                        </SectionBox>
                      );
                 }
                 if (section.key === 'transport') {
                    return (
                        <div key={section.key} className="bg-card p-6 rounded-2xl shadow-lg border border-white/10">
                            <div className="flex items-center justify-between gap-4 mb-6 pb-3 border-b-2 border-primary/20"><div className="flex items-center gap-4"><div className="bg-primary/10 p-3 rounded-full"><Bus className="h-6 w-6 text-primary" /></div><h2 className="text-xl font-bold text-foreground">{section.label}</h2></div><div className="flex items-center gap-2"><Label htmlFor="transport-required">Required</Label><Switch id="transport-required" checked={formData.transport_required} onCheckedChange={(checked) => handleChange('transport_required', checked)} /></div></div>
                            {formData.transport_required && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="lg:col-span-1"><Label>Route Name <span className="text-red-500">*</span></Label><Select value={formData.transport_route_id || ''} onValueChange={v => handleChange('transport_route_id', v)}><SelectTrigger><SelectValue placeholder="Select a route" /></SelectTrigger><SelectContent>{routes.map(r => <SelectItem key={r.id} value={r.id}>{r.route_title}</SelectItem>)}</SelectContent></Select></div>
                                <div className="lg:col-span-1"><Label>Stop Name <span className="text-red-500">*</span></Label><Select value={formData.transport_pickup_point_id || ''} onValueChange={v => handleChange('transport_pickup_point_id', v)} disabled={!formData.transport_route_id}><SelectTrigger><SelectValue placeholder="Select pickup point" /></SelectTrigger><SelectContent>{pickupPoints.map(p => <SelectItem key={p.pickup_point.id} value={p.pickup_point.id}>{p.pickup_point.name}</SelectItem>)}</SelectContent></Select></div>
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
                                <div className="lg:col-span-1"><Label>Hostel Name <span className="text-red-500">*</span></Label><Select value={formData.hostel_id || ''} onValueChange={v => handleChange('hostel_id', v)}><SelectTrigger><SelectValue placeholder="Select Hostel" /></SelectTrigger><SelectContent>{hostels.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent></Select></div>
                                <div className="lg:col-span-1"><Label>Room Type <span className="text-red-500">*</span></Label><Select value={formData.hostel_room_type || ''} onValueChange={v => handleChange('hostel_room_type', v)}><SelectTrigger><SelectValue placeholder="Select Room Type" /></SelectTrigger><SelectContent>{hostelRoomTypes.map(rt => <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>)}</SelectContent></Select></div>
                                <div className="lg:col-span-1"><Label>Room Number</Label><Input value={formData.room_number} onChange={e => handleChange('room_number', e.target.value)} /></div><div className="lg:col-span-1"><Label>Bed Number</Label><Input value={formData.bed_number} onChange={e => handleChange('bed_number', e.target.value)} /></div><div className="lg:col-span-1"><Label>Hostel Fee</Label><Input value={formData.hostel_fee} readOnly disabled /></div><DatePicker id="check_in_date" label="Check-in Date" value={formData.check_in_date} onChange={date => handleChange('check_in_date', date)} /><DatePicker id="check_out_date" label="Check-out Date" value={formData.check_out_date} onChange={date => handleChange('check_out_date', date)} /><div className="lg:col-span-1"><Label>Guardian Contact</Label><Input type="tel" value={formData.hostel_guardian_contact} onChange={e => handleChange('hostel_guardian_contact', e.target.value)} /></div><div className="lg:col-span-1"><Label>Emergency Contact</Label><Input type="tel" value={formData.hostel_emergency_contact} onChange={e => handleChange('hostel_emergency_contact', e.target.value)} /></div><div className="lg:col-span-4"><Label>Special Requirements</Label><Textarea value={formData.hostel_special_requirements} onChange={e => handleChange('hostel_special_requirements', e.target.value)} /></div>
                            </div>}
                        </div>
                      );
                 }

                 const sectionFields = allFields.filter(f => f.section_key === section.key).sort((a,b) => a.sort_order - b.sort_order);
                 const isEmpty = sectionFields.length === 0;
                 const isAcademic = section.key === 'academic_details';
                 if (isEmpty && !isAcademic) return null;

                 return (
                    <SectionBox key={section.key} icon={ICON_MAP[section.icon] || User} title={section.label}>
                         {sectionFields.map(field => <React.Fragment key={field.id || field.key}>{renderDynamicField(field)}</React.Fragment>)}
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
            
            <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={saving} size="lg"><Save className="mr-2 h-5 w-5" /> {saving ? 'Saving...' : 'Update Student'}</Button>
            </div>
            
            </div>
        </DashboardLayout>
    );
};

export default EditStudentProfile;
