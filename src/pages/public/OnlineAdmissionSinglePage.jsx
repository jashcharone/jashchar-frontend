/**
 * 🚀 JASHCHAR ERP - SINGLE PAGE ONLINE ADMISSION FORM
 * All sections on one page - no next/back buttons
 * Clean, scrollable, professional design
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import publicCmsService from '@/services/publicCmsService';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import DocumentUploadField from '@/components/common/DocumentUploadField';
import { Helmet } from 'react-helmet';

// Icons
import { 
  Loader2, CheckCircle2, AlertCircle, 
  School, User, Users, MapPin, FileText, Send,
  Building2, GraduationCap, Sparkles, Shield,
  Phone, Mail, Calendar, Upload, 
  Home, BookOpen, Briefcase, UserCheck, Check, CreditCard, Heart
} from 'lucide-react';

// ============================================================================
// 🎨 DESIGN CONSTANTS
// ============================================================================
const GRADIENT_BG = "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900";
const GLASS_CARD = "backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl";
const SECTION_HEADER = "bg-gradient-to-r from-purple-500/20 to-transparent border-b border-white/10";

// Section Card Component
const SectionCard = ({ icon: Icon, title, iconColor = "text-purple-400", children }) => (
  <Card className={`${GLASS_CARD} overflow-hidden`}>
    <CardHeader className={SECTION_HEADER}>
      <CardTitle className="text-lg text-white flex items-center gap-2">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-6">
      {children}
    </CardContent>
  </Card>
);

// Input Field Component
const FormInput = ({ label, required, icon: Icon, error, className, ...props }) => (
  <div className={`space-y-2 ${className}`}>
    <Label className="text-gray-300 flex items-center gap-2 text-sm">
      {Icon && <Icon className="w-4 h-4 text-purple-400" />}
      {label}
      {required && <span className="text-red-400">*</span>}
    </Label>
    <Input 
      {...props}
      className={`
        bg-white/5 border-gray-600/50 text-white placeholder:text-gray-500
        focus:border-purple-500 focus:ring-purple-500/20
        ${error ? 'border-red-500' : ''}
      `}
    />
    {error && <p className="text-red-400 text-xs">{error}</p>}
  </div>
);

// Select Field Component
const FormSelect = ({ label, required, icon: Icon, placeholder, options, value, onChange, error }) => (
  <div className="space-y-2">
    <Label className="text-gray-300 flex items-center gap-2 text-sm">
      {Icon && <Icon className="w-4 h-4 text-purple-400" />}
      {label}
      {required && <span className="text-red-400">*</span>}
    </Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`
        bg-white/5 border-gray-600/50 text-white
        focus:border-purple-500
        ${error ? 'border-red-500' : ''}
      `}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-gray-900 border-gray-700">
        {options.map((opt) => (
          <SelectItem 
            key={opt.value} 
            value={opt.value}
            className="text-white hover:bg-purple-500/20"
          >
            {opt.label}
          </SelectItem>
        ))}
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
      relative p-4 rounded-xl cursor-pointer transition-all duration-300
      ${isSelected 
        ? 'bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border-2 border-purple-500' 
        : 'bg-white/5 border border-gray-700/50 hover:border-purple-500/50'
      }
    `}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    {isSelected && (
      <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
        <Check className="w-4 h-4 text-white" />
      </div>
    )}
    <div className="flex items-center gap-3">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isSelected ? 'bg-purple-500' : 'bg-gray-700/50'}`}>
        <School className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
      </div>
      <div>
        <h3 className="font-medium text-white">{branch.name}</h3>
        <p className="text-gray-400 text-sm">{branch.address || 'Campus'}</p>
      </div>
    </div>
  </motion.div>
);

// Success Screen
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
        transition={{ type: "spring", delay: 0.2 }}
        className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-6"
      >
        <CheckCircle2 className="w-10 h-10 text-white" />
      </motion.div>
      
      <h2 className="text-2xl font-bold text-white mb-2">ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ!</h2>
      <p className="text-gray-400 mb-6">Application Submitted Successfully</p>
      
      <div className="bg-white/10 rounded-xl p-6 mb-6">
        <p className="text-gray-400 text-sm mb-2">Reference Number</p>
        <p className="text-3xl font-mono font-bold text-purple-400 tracking-wider">
          {referenceNo}
        </p>
      </div>
      
      <Alert className="bg-blue-500/10 border-blue-500/30 text-left mb-6">
        <AlertCircle className="w-4 h-4 text-blue-400" />
        <AlertTitle className="text-blue-300">Important</AlertTitle>
        <AlertDescription className="text-blue-200/80">
          Save this reference number to track your application status.
        </AlertDescription>
      </Alert>
      
      <Button onClick={onNewApplication} className="bg-purple-500 hover:bg-purple-600">
        New Application
      </Button>
    </Card>
  </motion.div>
);

// ============================================================================
// 🚀 MAIN COMPONENT
// ============================================================================
const OnlineAdmissionSinglePage = () => {
  const { schoolAlias } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const branchIdFromQR = searchParams.get('branch');
  
  // State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNo, setReferenceNo] = useState('');
  
  const [organization, setOrganization] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [classes, setClasses] = useState([]);
  const [settings, setSettings] = useState(null);
  
  const [religions, setReligions] = useState([]);
  const [castes, setCastes] = useState([]);
  const [bloodGroups, setBloodGroups] = useState([]);
  
  // Form Data
  const [formData, setFormData] = useState({
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
    religion: '',
    caste: '',
    national_id_no: '',
    father_name: '',
    father_phone: '',
    father_occupation: '',
    mother_name: '',
    mother_phone: '',
    mother_occupation: '',
    guardian_is: 'father',
    guardian_name: '',
    guardian_relation: '',
    guardian_phone: '',
    guardian_occupation: '',
    pincode: '',
    city: '',
    state: '',
    current_address: '',
    permanent_address: '',
    is_permanent_same: false,
    documents: [],
    previous_school_details: '',
    terms_accepted: false,
  });
  
  const [errors, setErrors] = useState({});
  
  // ========== EFFECTS ==========
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const siteRes = await publicCmsService.getPublicSite(schoolAlias);
        if (!siteRes.success) throw new Error('Institution not found');
        
        const schoolData = siteRes.data.school;
        setOrganization(schoolData);
        
        const branchesRes = await publicCmsService.getBranches(schoolAlias);
        if (branchesRes.success && branchesRes.data?.length > 0) {
          setBranches(branchesRes.data);
          // Auto-select if single branch or from QR
          if (branchesRes.data.length === 1) {
            const branch = branchesRes.data[0];
            setSelectedBranch(branch);
            setFormData(prev => ({ ...prev, branch_id: branch.id }));
          } else if (branchIdFromQR) {
            const qrBranch = branchesRes.data.find(b => b.id === branchIdFromQR);
            if (qrBranch) {
              setSelectedBranch(qrBranch);
              setFormData(prev => ({ ...prev, branch_id: qrBranch.id }));
            }
          }
        } else {
          setBranches([{ id: schoolData.id, name: schoolData.name }]);
        }
        
        const settingsRes = await publicCmsService.getOnlineAdmissionSettings(schoolAlias);
        if (settingsRes.success) setSettings(settingsRes.data);
        
        const [religionsRes, castesRes, bloodGroupsRes] = await Promise.all([
          supabase.from('master_religions').select('name'),
          supabase.from('master_castes').select('name'),
          supabase.from('master_blood_groups').select('name'),
        ]);
        
        setReligions(religionsRes.data || []);
        setCastes(castesRes.data || []);
        setBloodGroups(bloodGroupsRes.data || []);
        
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      } finally {
        setLoading(false);
      }
    };
    
    if (schoolAlias) fetchData();
  }, [schoolAlias, branchIdFromQR, toast]);
  
  // Fetch classes when branch changes
  useEffect(() => {
    const fetchClasses = async () => {
      if (!selectedBranch?.id || !schoolAlias) return;
      try {
        const classesResponse = await publicCmsService.getClassesByBranch(schoolAlias, selectedBranch.id);
        setClasses(classesResponse.data || []);
      } catch (error) {
        setClasses([]);
      }
    };
    fetchClasses();
  }, [selectedBranch, schoolAlias]);
  
  // Auto-fill guardian from parent
  useEffect(() => {
    if (formData.guardian_is === 'father') {
      setFormData(prev => ({
        ...prev,
        guardian_name: prev.father_name,
        guardian_relation: 'Father',
        guardian_phone: prev.father_phone,
        guardian_occupation: prev.father_occupation,
      }));
    } else if (formData.guardian_is === 'mother') {
      setFormData(prev => ({
        ...prev,
        guardian_name: prev.mother_name,
        guardian_relation: 'Mother',
        guardian_phone: prev.mother_phone,
        guardian_occupation: prev.mother_occupation,
      }));
    }
  }, [formData.guardian_is, formData.father_name, formData.mother_name]);
  
  // Auto-fill permanent address
  useEffect(() => {
    if (formData.is_permanent_same) {
      setFormData(prev => ({ ...prev, permanent_address: prev.current_address }));
    }
  }, [formData.is_permanent_same, formData.current_address]);
  
  // Pincode lookup
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
      } catch (err) {}
    };
    const timer = setTimeout(fetchPincode, 500);
    return () => clearTimeout(timer);
  }, [formData.pincode]);
  
  // ========== HANDLERS ==========
  
  const handleChange = useCallback((key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
  }, [errors]);
  
  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    setFormData(prev => ({ ...prev, branch_id: branch.id, class_id: '' }));
    setClasses([]);
  };
  
  const validate = () => {
    const newErrors = {};
    if (!formData.branch_id) newErrors.branch_id = 'Select a branch';
    if (!formData.class_id) newErrors.class_id = 'Select a class';
    if (!formData.first_name) newErrors.first_name = 'First name required';
    if (!formData.gender) newErrors.gender = 'Gender required';
    if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth required';
    if (!formData.mobile_number) newErrors.mobile_number = 'Mobile number required';
    if (!formData.current_address) newErrors.current_address = 'Address required';
    if (settings?.terms_conditions && !formData.terms_accepted) {
      newErrors.terms_accepted = 'Accept terms & conditions';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validate()) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fill all required fields' });
      return;
    }
    
    setSubmitting(true);
    try {
      const admissionData = {
        branch_id: formData.branch_id,
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
        guardian_phone: formData.guardian_phone,
        guardian_occupation: formData.guardian_occupation,
        current_address: `${formData.current_address}${formData.city ? ', ' + formData.city : ''}${formData.state ? ', ' + formData.state : ''}${formData.pincode ? ' - ' + formData.pincode : ''}`,
        permanent_address: formData.permanent_address || formData.current_address,
        previous_school_details: formData.previous_school_details,
        documents: formData.documents,
      };
      
      const { data, error } = await supabase
        .from('online_admissions')
        .insert(admissionData)
        .select('reference_no')
        .single();
      
      if (error) throw error;
      
      setReferenceNo(data.reference_no);
      setSubmitted(true);
      toast({ title: 'Success!', description: 'Application submitted successfully' });
      
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleNewApplication = () => {
    setSubmitted(false);
    setReferenceNo('');
    setFormData({
      branch_id: selectedBranch?.id || '',
      class_id: '',
      first_name: '',
      last_name: '',
      gender: '',
      date_of_birth: '',
      mobile_number: '',
      email: '',
      student_photo: '',
      blood_group: '',
      religion: '',
      caste: '',
      national_id_no: '',
      father_name: '',
      father_phone: '',
      father_occupation: '',
      mother_name: '',
      mother_phone: '',
      mother_occupation: '',
      guardian_is: 'father',
      guardian_name: '',
      guardian_relation: '',
      guardian_phone: '',
      guardian_occupation: '',
      pincode: '',
      city: '',
      state: '',
      current_address: '',
      permanent_address: '',
      is_permanent_same: false,
      documents: [],
      previous_school_details: '',
      terms_accepted: false,
    });
  };
  
  // ========== RENDER ==========
  
  if (loading) {
    return (
      <div className={`min-h-screen ${GRADIENT_BG} flex items-center justify-center`}>
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
      </div>
    );
  }
  
  if (submitted) {
    return (
      <div className={`min-h-screen ${GRADIENT_BG}`}>
        <SuccessScreen referenceNo={referenceNo} onNewApplication={handleNewApplication} />
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen ${GRADIENT_BG}`}>
      <Helmet>
        <title>Online Admission | {organization?.name}</title>
      </Helmet>
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-black/30 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {organization?.logo_url && (
              <img src={organization.logo_url} alt="Logo" className="h-10 w-10 rounded-lg object-contain bg-white/10 p-1" />
            )}
            <div>
              <h1 className="text-lg font-bold text-white">{organization?.name}</h1>
              <p className="text-xs text-gray-400">Online Admission Form</p>
            </div>
          </div>
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
            <Sparkles className="w-3 h-3 mr-1" /> Powered by AI
          </Badge>
        </div>
      </header>
      
      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        
        {/* Section 1: Branch Selection */}
        {branches.length > 1 && (
          <SectionCard icon={Building2} title="Select Branch" iconColor="text-indigo-400">
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
              <p className="text-red-400 text-sm mt-2">{errors.branch_id}</p>
            )}
          </SectionCard>
        )}
        
        {/* Section 2: Student Information */}
        <SectionCard icon={User} title="Student Information" iconColor="text-purple-400">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormSelect
              label="Class"
              required
              icon={GraduationCap}
              placeholder="Select Class"
              options={classes.map(c => ({ value: c.id, label: c.name }))}
              value={formData.class_id}
              onChange={(v) => handleChange('class_id', v)}
              error={errors.class_id}
            />
            <FormInput
              label="First Name"
              required
              icon={User}
              value={formData.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              error={errors.first_name}
              placeholder="Enter first name"
            />
            <FormInput
              label="Last Name"
              icon={User}
              value={formData.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              placeholder="Enter last name"
            />
            <FormSelect
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
            <FormInput
              label="Date of Birth"
              required
              icon={Calendar}
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => handleChange('date_of_birth', e.target.value)}
              error={errors.date_of_birth}
            />
            <FormInput
              label="Mobile Number"
              required
              icon={Phone}
              value={formData.mobile_number}
              onChange={(e) => handleChange('mobile_number', e.target.value.replace(/\D/g, '').slice(0, 10))}
              error={errors.mobile_number}
              placeholder="10-digit mobile"
            />
            <FormInput
              label="Email"
              icon={Mail}
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="student@email.com"
            />
            <FormSelect
              label="Blood Group"
              icon={Heart}
              placeholder="Select"
              options={bloodGroups.map(bg => ({ value: bg.name, label: bg.name }))}
              value={formData.blood_group}
              onChange={(v) => handleChange('blood_group', v)}
            />
            <FormSelect
              label="Religion"
              placeholder="Select"
              options={religions.map(r => ({ value: r.name, label: r.name }))}
              value={formData.religion}
              onChange={(v) => handleChange('religion', v)}
            />
            <FormSelect
              label="Caste"
              placeholder="Select"
              options={castes.map(c => ({ value: c.name, label: c.name }))}
              value={formData.caste}
              onChange={(v) => handleChange('caste', v)}
            />
            <FormInput
              label="Aadhar Number"
              icon={CreditCard}
              value={formData.national_id_no}
              onChange={(e) => handleChange('national_id_no', e.target.value.replace(/\D/g, '').slice(0, 12))}
              placeholder="12-digit Aadhar"
            />
          </div>
          
          {/* Photo Upload */}
          <div className="mt-6">
            <Label className="text-gray-300 text-sm mb-2 block">Student Photo</Label>
            <DocumentUploadField
              onUploadComplete={(url) => handleChange('student_photo', url)}
              label="Click to upload photo"
              className="border-dashed border-2 border-gray-600 hover:border-purple-500"
            />
          </div>
        </SectionCard>
        
        {/* Section 3: Parent Details */}
        <SectionCard icon={Users} title="Parent Details" iconColor="text-blue-400">
          {/* Father */}
          <div className="mb-6">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" /> Father Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormInput
                label="Father's Name"
                value={formData.father_name}
                onChange={(e) => handleChange('father_name', e.target.value)}
                placeholder="Enter father's name"
              />
              <FormInput
                label="Phone"
                icon={Phone}
                value={formData.father_phone}
                onChange={(e) => handleChange('father_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Mobile number"
              />
              <FormInput
                label="Occupation"
                icon={Briefcase}
                value={formData.father_occupation}
                onChange={(e) => handleChange('father_occupation', e.target.value)}
                placeholder="Occupation"
              />
            </div>
          </div>
          
          {/* Mother */}
          <div>
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-pink-400" /> Mother Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormInput
                label="Mother's Name"
                value={formData.mother_name}
                onChange={(e) => handleChange('mother_name', e.target.value)}
                placeholder="Enter mother's name"
              />
              <FormInput
                label="Phone"
                icon={Phone}
                value={formData.mother_phone}
                onChange={(e) => handleChange('mother_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Mobile number"
              />
              <FormInput
                label="Occupation"
                icon={Briefcase}
                value={formData.mother_occupation}
                onChange={(e) => handleChange('mother_occupation', e.target.value)}
                placeholder="Occupation"
              />
            </div>
          </div>
        </SectionCard>
        
        {/* Section 4: Guardian */}
        <SectionCard icon={UserCheck} title="Guardian Information" iconColor="text-green-400">
          <div className="mb-4">
            <Label className="text-gray-300 text-sm mb-3 block">Primary Guardian</Label>
            <RadioGroup
              value={formData.guardian_is}
              onValueChange={(v) => handleChange('guardian_is', v)}
              className="flex flex-wrap gap-4"
            >
              {['father', 'mother', 'other'].map((type) => (
                <Label
                  key={type}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer
                    ${formData.guardian_is === type 
                      ? 'bg-purple-500/20 border border-purple-500' 
                      : 'bg-white/5 border border-gray-700'
                    }
                  `}
                >
                  <RadioGroupItem value={type} />
                  <span className="capitalize text-white">{type}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
          
          {formData.guardian_is === 'other' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormInput
                label="Guardian Name"
                required
                value={formData.guardian_name}
                onChange={(e) => handleChange('guardian_name', e.target.value)}
                placeholder="Guardian name"
              />
              <FormInput
                label="Relation"
                value={formData.guardian_relation}
                onChange={(e) => handleChange('guardian_relation', e.target.value)}
                placeholder="e.g., Uncle, Aunt"
              />
              <FormInput
                label="Phone"
                icon={Phone}
                value={formData.guardian_phone}
                onChange={(e) => handleChange('guardian_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Mobile number"
              />
              <FormInput
                label="Occupation"
                icon={Briefcase}
                value={formData.guardian_occupation}
                onChange={(e) => handleChange('guardian_occupation', e.target.value)}
                placeholder="Occupation"
              />
            </div>
          )}
        </SectionCard>
        
        {/* Section 5: Address */}
        <SectionCard icon={MapPin} title="Address Details" iconColor="text-emerald-400">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <FormInput
              label="Pincode"
              value={formData.pincode}
              onChange={(e) => handleChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit pincode"
            />
            <FormInput
              label="City/District"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="Auto-filled"
            />
            <FormInput
              label="State"
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              placeholder="Auto-filled"
            />
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300 text-sm mb-2 block">
                Current Address <span className="text-red-400">*</span>
              </Label>
              <Textarea
                value={formData.current_address}
                onChange={(e) => handleChange('current_address', e.target.value)}
                className={`bg-white/5 border-gray-600/50 text-white ${errors.current_address ? 'border-red-500' : ''}`}
                placeholder="Enter complete address"
              />
              {errors.current_address && <p className="text-red-400 text-xs mt-1">{errors.current_address}</p>}
            </div>
            
            <Label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={formData.is_permanent_same}
                onCheckedChange={(v) => handleChange('is_permanent_same', v)}
              />
              <span className="text-gray-300 text-sm">Permanent address same as current</span>
            </Label>
            
            {!formData.is_permanent_same && (
              <div>
                <Label className="text-gray-300 text-sm mb-2 block">Permanent Address</Label>
                <Textarea
                  value={formData.permanent_address}
                  onChange={(e) => handleChange('permanent_address', e.target.value)}
                  className="bg-white/5 border-gray-600/50 text-white"
                  placeholder="Enter permanent address"
                />
              </div>
            )}
          </div>
        </SectionCard>
        
        {/* Section 6: Documents */}
        <SectionCard icon={FileText} title="Documents (Optional)" iconColor="text-amber-400">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-white/5 border border-dashed border-gray-600">
              <DocumentUploadField
                onUploadComplete={(url) => url && handleChange('documents', [...formData.documents, { type: 'birth_certificate', url }])}
                label="Birth Certificate"
              />
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-dashed border-gray-600">
              <DocumentUploadField
                onUploadComplete={(url) => url && handleChange('documents', [...formData.documents, { type: 'aadhar', url }])}
                label="Aadhar Card"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <Label className="text-gray-300 text-sm mb-2 block">Previous School Details (if any)</Label>
            <Textarea
              value={formData.previous_school_details}
              onChange={(e) => handleChange('previous_school_details', e.target.value)}
              className="bg-white/5 border-gray-600/50 text-white"
              placeholder="School name, last class, year..."
            />
          </div>
        </SectionCard>
        
        {/* Terms & Submit */}
        <Card className={`${GLASS_CARD}`}>
          <CardContent className="p-6">
            {settings?.terms_conditions && (
              <div className="mb-6">
                <div className="prose prose-invert prose-sm max-h-32 overflow-y-auto text-gray-300 mb-4 p-4 bg-white/5 rounded-lg">
                  <div dangerouslySetInnerHTML={{ __html: settings.terms_conditions }} />
                </div>
                <Label className={`flex items-center gap-2 cursor-pointer ${errors.terms_accepted ? 'text-red-400' : ''}`}>
                  <Checkbox
                    checked={formData.terms_accepted}
                    onCheckedChange={(v) => handleChange('terms_accepted', v)}
                  />
                  <span className="text-gray-300">I accept the terms and conditions</span>
                </Label>
                {errors.terms_accepted && <p className="text-red-400 text-xs mt-1">{errors.terms_accepted}</p>}
              </div>
            )}
            
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 text-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="text-center py-6 text-gray-500 text-sm">
          <div className="flex items-center justify-center gap-4 mb-2">
            <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> Secure</span>
            <span>•</span>
            <span>24/7 Available</span>
          </div>
          <p>© {new Date().getFullYear()} {organization?.name}</p>
        </div>
      </main>
    </div>
  );
};

export default OnlineAdmissionSinglePage;
