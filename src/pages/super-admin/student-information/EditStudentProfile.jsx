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
import { BookOpen, User, Key, Users, Bus, FileText, UserCog, Save, Shield, Loader2, UserPlus, FileCheck2, Copy, Percent, Wallet, AlertCircle, Building, X, Sparkles, BedDouble, GraduationCap, Phone, MapPin, Files, ChevronDown, Home, Heart, School, Mail, CreditCard, CheckCircle2 } from 'lucide-react';
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

    useEffect(() => {
        if (!user?.profile?.branch_id || !selectedBranch?.id) return;
        const init = async () => {
            setLoading(true);
            try {
                const branchId = user.profile.branch_id;
                
                // 1. Fetch Settings & Master Data
                const [
                    customFieldsRes,
                    classesRes, categoriesRes, routesRes, hostelsRes, hostelRoomTypesRes, religionsRes, castesRes, masterDocsRes, sessionsRes, branchRes
                ] = await Promise.all([
                    api.get('/form-settings', { params: { branchId, module: 'student_admission' } }),
                    supabase.from('classes').select('id, name').eq('branch_id', branchId).eq('branch_id', selectedBranch.id),
                    supabase.from('student_categories').select('id, name').eq('branch_id', branchId),
                    supabase.from('transport_routes').select('id, route_title').eq('branch_id', branchId),
                    supabase.from('hostels').select('id, name').eq('branch_id', branchId),
                    supabase.from('hostel_room_types').select('*').eq('branch_id', branchId),
                    supabase.from('master_religions').select('name'),
                    supabase.from('master_castes').select('name'),
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
                
                setClasses(classesRes.data || []);
                setCategories(categoriesRes.data || []);
                setRoutes(routesRes.data || []);
                setHostels(hostelsRes.data || []);
                setHostelRoomTypes(hostelRoomTypesRes.data || []);
                setReligions(religionsRes.data || []);
                setCastes(castesRes.data || []);
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

    const DynamicField = ({ field }) => {
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
                      return <div className="lg:col-span-1">{label}<Select value={formData.session_id} onValueChange={v => handleChange('session_id', v)}><SelectTrigger><SelectValue placeholder="Select Session" /></SelectTrigger><SelectContent>{sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name} {s.is_active ? '(Active)' : ''}</SelectItem>)}</SelectContent></Select></div>;
                 case 'class':
                      return <div className="lg:col-span-1">{label}<Select value={formData.class_id} onValueChange={v => handleChange('class_id', v)}><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>;
                 case 'section':
                      return <div className="lg:col-span-1">{label}<Select value={formData.section_id} onValueChange={v => handleChange('section_id', v)}><SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger><SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>;
                 case 'date': case 'dob': case 'admission_date': case 'father_dob': case 'mother_dob':
                      return <div className="lg:col-span-1"><DatePicker label={field.field_label} required={field.is_required} value={formData[field.field_name]} onChange={date => handleChange(field.field_name, date)} /></div>;
                 case 'category':
                      return <div className="lg:col-span-1">{label}<Select value={formData.category_id || ''} onValueChange={v => handleChange('category_id', v)}><SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>;
                 case 'caste_category':
                      return <div className="lg:col-span-1">{label}<Select value={formData.caste_category_id || ''} onValueChange={v => handleChange('caste_category_id', v)}><SelectTrigger><SelectValue placeholder="Select Caste Category" /></SelectTrigger><SelectContent>{casteCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>;
                 case 'sub_caste':
                      // Filter sub-castes based on selected category
                      const filteredSubCastes = formData.caste_category_id 
                        ? subCastes.filter(sc => sc.caste_category_id === formData.caste_category_id)
                        : []; 
                      return <div className="lg:col-span-1">{label}<Select value={formData.sub_caste_id || ''} onValueChange={v => handleChange('sub_caste_id', v)} disabled={!formData.caste_category_id}><SelectTrigger><SelectValue placeholder="Select Sub Caste" /></SelectTrigger><SelectContent>{filteredSubCastes.map(sc => <SelectItem key={sc.id} value={sc.id}>{sc.name}</SelectItem>)}</SelectContent></Select></div>;
                 case 'student_photo': case 'father_photo': case 'mother_photo': case 'guardian_photo':
                    const photoHandlers = {
                        student_photo: { setFile: setProfilePictureFile, preview: profilePicturePreview, setPreview: setProfilePicturePreview },
                        father_photo: { setFile: setFatherPictureFile, preview: fatherPicturePreview, setPreview: setFatherPicturePreview },
                        mother_photo: { setFile: setMotherPictureFile, preview: motherPicturePreview, setPreview: setMotherPicturePreview },
                        guardian_photo: { setFile: setGuardianPictureFile, preview: guardianPicturePreview, setPreview: setGuardianPicturePreview },
                    };
                    const h = photoHandlers[field.field_name];
                    return <div className="md:col-span-1">{label}<ImageUploader onFileChange={file => handleFileChange(file, h.setFile, h.setPreview)} initialPreview={h.preview} /></div>;
                 case 'national_id_no': case 'father_aadhar_no': case 'mother_aadhar_no':
                     return <div className="lg:col-span-1">{label}<AadharInput value={formData[field.field_name] || ''} onChange={val => handleChange(field.field_name, val)} /></div>;
                 case 'religion':
                      return <div className="lg:col-span-1">{label}<Select value={formData.religion || ''} onValueChange={v => handleChange('religion', v)}><SelectTrigger><SelectValue placeholder="Select Religion" /></SelectTrigger><SelectContent>{religions.map(r => <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>)}</SelectContent></Select></div>;
                 
                 // Login Details - Explicit Handling
                 case 'username': case 'parent_username':
                    return <div className="lg:col-span-1">{label}<Input value={formData[field.field_name] || ''} readOnly className="bg-muted" /></div>;
                 case 'password': case 'retype_password': case 'parent_password': case 'parent_retype_password':
                    const isParent = field.field_name.startsWith('parent_');
                    const updatesKey = field.field_name;
                    return <div className="lg:col-span-1">{label}<Input type="text" placeholder="Leave blank to keep unchanged" value={formData[updatesKey] || ''} onChange={e => handleChange(updatesKey, e.target.value)} /></div>;
            }
        }

        // Generic
        const value = field.is_system ? (formData[field.field_name] ?? '') : (customFieldValues[field.field_key] ?? '');
        const onChange = (val) => field.is_system ? handleChange(field.field_name, val) : handleCustomFieldChange(field.field_key, val);

        if (field.type === 'select' || field.field_type === 'select') {
           return <div className="lg:col-span-1">{label}<Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{(field.field_options || []).map((opt, i) => <SelectItem key={i} value={typeof opt === 'object' ? opt.value : opt}>{typeof opt === 'object' ? opt.label : opt}</SelectItem>)}</SelectContent></Select></div>;
        }
        if (field.type === 'textarea' || field.field_type === 'textarea') {
            return <div className="md:col-span-2">{label}<Textarea value={value} onChange={e => onChange(e.target.value)} /></div>;
        }
        if (field.type === 'date' || field.field_type === 'date') {
            return <div className="lg:col-span-1"><DatePicker label={field.field_label} required={field.is_required} value={value} onChange={onChange} /></div>;
        }
        if (field.type === 'checkbox' || field.field_type === 'checkbox') {
             return <div className="flex items-center space-x-2 mt-8"><Checkbox id={field.field_key} checked={!!value} onCheckedChange={onChange} /><label htmlFor={field.field_key} className="text-sm font-medium">{field.field_label}</label></div>;
        }
        return <div className="lg:col-span-1">{label}<Input value={value} type={field.type === 'number' || field.field_type === 'number' ? 'number' : 'text'} onChange={e => onChange(e.target.value)} /></div>;
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
            
            // Clean up updates object
            delete updates.transport_details;
            delete updates.hostel_details;
            delete updates.siblings; // not a column
            
            const { error: updateError } = await supabase.from('student_profiles').update(updates).eq('id', studentId);
            if(updateError) throw updateError;
            
            // Update Transport
            if (updates.transport_required) {
                 const tData = {
                    transport_route_id: updates.transport_route_id,
                    transport_pickup_point_id: updates.transport_pickup_point_id,
                    transport_fee: updates.transport_fee,
                    pickup_time: updates.pickup_time,
                    drop_time: updates.drop_time,
                    vehicle_number: updates.vehicle_number,
                    driver_name: updates.driver_name,
                    driver_contact: updates.driver_contact,
                    special_instructions: updates.transport_special_instructions
                 };
                 if (formData.transport_details?.id) {
                     await supabase.from('student_transport_details').update(tData).eq('id', formData.transport_details.id);
                 } else {
                     // Note: organization_id not in student_transport_details schema
                     await supabase.from('student_transport_details').insert({ ...tData, student_id: studentId, branch_id: user.profile.branch_id, session_id: currentSessionId });
                 }
            } else if (formData.transport_details?.id) {
                await supabase.from('student_transport_details').delete().eq('id', formData.transport_details.id);
            }

            // Update Hostel
            if (updates.hostel_required) {
                const hData = {
                    hostel_id: updates.hostel_id,
                    room_type: updates.hostel_room_type,
                    room_number: updates.room_number,
                    bed_number: updates.bed_number,
                    hostel_fee: updates.hostel_fee,
                    check_in_date: updates.check_in_date,
                    check_out_date: updates.check_out_date,
                    guardian_contact: updates.hostel_guardian_contact,
                    emergency_contact: updates.hostel_emergency_contact,
                    special_requirements: updates.hostel_special_requirements
                };
                if (formData.hostel_details?.id) {
                     await supabase.from('student_hostel_details').update(hData).eq('id', formData.hostel_details.id);
                } else {
                     await supabase.from('student_hostel_details').insert({ ...hData, student_id: studentId, branch_id: user.profile.branch_id, session_id: currentSessionId, organization_id: organizationId });
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
                    session_id: currentSessionId,
                    organization_id: organizationId,
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
            {formSections.sort((a,b) => a.order - b.order).map(section => {
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
                         {sectionFields.map(field => <DynamicField key={field.id || field.key} field={field} />)}
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
