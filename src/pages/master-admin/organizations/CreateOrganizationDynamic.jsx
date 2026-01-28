/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * JASHCHAR ERP - DYNAMIC ORGANIZATION CREATION FORM (SINGLE PAGE WITH TABS)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Full form visible at once with tabs - No step-by-step wizard
 * Each organization type has its own specific tabs and fields
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, ArrowLeft, Save, Loader2, Phone, Mail, MapPin, FileText, 
  CreditCard, GraduationCap, Users, Briefcase, Heart, Factory, ShoppingBag, Landmark,
  CheckCircle, AlertCircle, Building, Stethoscope, BookOpen, Clock, Calendar, Globe,
  Banknote, Shield, Award, Target, Truck, Package, Store, HeartPulse, Scale, Gavel,
  Eye, EyeOff, XCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import SelectOrganizationType from './SelectOrganizationType';

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGNATION OPTIONS BY ORGANIZATION TYPE (India-specific)
// ═══════════════════════════════════════════════════════════════════════════════
const DESIGNATION_BY_TYPE = {
  education: [
    { value: 'principal', label: 'Principal' },
    { value: 'vice_principal', label: 'Vice Principal' },
    { value: 'director', label: 'Director' },
    { value: 'correspondent', label: 'Correspondent / Secretary' },
    { value: 'chairman', label: 'Chairman / Chairperson' },
    { value: 'manager', label: 'Manager' },
    { value: 'administrator', label: 'Administrator' },
    { value: 'trustee', label: 'Trustee' },
    { value: 'dean', label: 'Dean' },
    { value: 'registrar', label: 'Registrar' },
    { value: 'owner', label: 'Owner / Proprietor' },
  ],
  company: [
    { value: 'ceo', label: 'CEO (Chief Executive Officer)' },
    { value: 'md', label: 'Managing Director' },
    { value: 'director', label: 'Director' },
    { value: 'cfo', label: 'CFO (Chief Financial Officer)' },
    { value: 'coo', label: 'COO (Chief Operating Officer)' },
    { value: 'cto', label: 'CTO (Chief Technology Officer)' },
    { value: 'gm', label: 'General Manager' },
    { value: 'partner', label: 'Partner' },
    { value: 'proprietor', label: 'Proprietor' },
    { value: 'founder', label: 'Founder' },
    { value: 'hr_head', label: 'HR Head / Director' },
    { value: 'admin_head', label: 'Admin Head' },
  ],
  hospital: [
    { value: 'cmo', label: 'CMO (Chief Medical Officer)' },
    { value: 'medical_director', label: 'Medical Director' },
    { value: 'md_doctor', label: 'MD / Medical Superintendent' },
    { value: 'administrator', label: 'Hospital Administrator' },
    { value: 'ceo', label: 'CEO' },
    { value: 'director', label: 'Director' },
    { value: 'chairman', label: 'Chairman' },
    { value: 'nursing_director', label: 'Nursing Director' },
    { value: 'owner', label: 'Owner / Proprietor' },
  ],
  government: [
    { value: 'ias', label: 'IAS Officer' },
    { value: 'ips', label: 'IPS Officer' },
    { value: 'collector', label: 'District Collector' },
    { value: 'commissioner', label: 'Commissioner' },
    { value: 'director', label: 'Director' },
    { value: 'joint_director', label: 'Joint Director' },
    { value: 'deputy_director', label: 'Deputy Director' },
    { value: 'secretary', label: 'Secretary' },
    { value: 'under_secretary', label: 'Under Secretary' },
    { value: 'superintendent', label: 'Superintendent' },
    { value: 'tahsildar', label: 'Tahsildar' },
    { value: 'bdo', label: 'BDO (Block Development Officer)' },
    { value: 'deo', label: 'DEO (District Education Officer)' },
  ],
  factory: [
    { value: 'plant_head', label: 'Plant Head / Plant Manager' },
    { value: 'gm', label: 'General Manager' },
    { value: 'factory_manager', label: 'Factory Manager' },
    { value: 'operations_head', label: 'Operations Head' },
    { value: 'production_manager', label: 'Production Manager' },
    { value: 'director', label: 'Director' },
    { value: 'md', label: 'Managing Director' },
    { value: 'owner', label: 'Owner / Proprietor' },
    { value: 'partner', label: 'Partner' },
  ],
  retail: [
    { value: 'store_manager', label: 'Store Manager' },
    { value: 'regional_manager', label: 'Regional Manager' },
    { value: 'area_manager', label: 'Area Manager' },
    { value: 'operations_manager', label: 'Operations Manager' },
    { value: 'owner', label: 'Owner / Proprietor' },
    { value: 'partner', label: 'Partner' },
    { value: 'franchise_owner', label: 'Franchise Owner' },
    { value: 'director', label: 'Director' },
    { value: 'ceo', label: 'CEO' },
  ],
  ngo: [
    { value: 'executive_director', label: 'Executive Director' },
    { value: 'secretary', label: 'Secretary' },
    { value: 'general_secretary', label: 'General Secretary' },
    { value: 'president', label: 'President' },
    { value: 'vice_president', label: 'Vice President' },
    { value: 'chairman', label: 'Chairman / Chairperson' },
    { value: 'trustee', label: 'Trustee' },
    { value: 'managing_trustee', label: 'Managing Trustee' },
    { value: 'ceo', label: 'CEO' },
    { value: 'program_director', label: 'Program Director' },
    { value: 'founder', label: 'Founder' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// INDIAN STATES LIST
// ═══════════════════════════════════════════════════════════════════════════════
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
  'Andaman and Nicobar', 'Dadra and Nagar Haveli', 'Daman and Diu', 'Lakshadweep'
];

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════════
const TYPE_CONFIG = {
  education: { icon: GraduationCap, color: 'bg-green-500', title: 'Education Institution' },
  company: { icon: Building2, color: 'bg-blue-500', title: 'Company / Enterprise' },
  hospital: { icon: HeartPulse, color: 'bg-red-500', title: 'Hospital / Healthcare' },
  government: { icon: Landmark, color: 'bg-purple-500', title: 'Government Office' },
  factory: { icon: Factory, color: 'bg-orange-500', title: 'Factory / Manufacturing' },
  retail: { icon: Store, color: 'bg-pink-500', title: 'Retail / Store' },
  ngo: { icon: Heart, color: 'bg-teal-500', title: 'NGO / Non-Profit' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const CreateOrganizationDynamic = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // State
  const [organizationType, setOrganizationType] = useState(location.state?.organizationType || null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Initialize with defaults
    country: 'India',
    initialize_roles: true,
    initialize_departments: true,
    createDefaultBranch: false, // Branch creation is optional
    enablePublicWebsite: true, // Front CMS enabled by default
    createHomepage: true,
    initializeCmsMenus: true,
    sendWelcomeEmail: true,
    subscriptionDuration: '12',
    subscriptionStartDate: new Date().toISOString().split('T')[0],
  });
  
  // Education-specific data
  const [institutionTypes, setInstitutionTypes] = useState([]);
  const [educationBoards, setEducationBoards] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Subscription Plans
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  
  // Pincode lookup
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const [postOffices, setPostOffices] = useState([]);
  
  // Form validation errors
  const [errors, setErrors] = useState({});
  
  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  
  // Duplicate checking
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);

  // Get config for current type
  const typeCode = organizationType?.type_code || searchParams.get('type');
  const config = TYPE_CONFIG[typeCode] || null;
  
  // Get designation options for current type
  const designationOptions = DESIGNATION_BY_TYPE[typeCode] || [];

  useEffect(() => {
    const typeFromUrl = searchParams.get('type');
    if (typeFromUrl && !organizationType) {
      fetchTypeByCode(typeFromUrl);
    }
  }, []);

  useEffect(() => {
    if (typeCode === 'education') {
      fetchEducationData();
    }
  }, [typeCode]);

  // Fetch subscription plans on mount
  useEffect(() => {
    fetchSubscriptionPlans();
  }, []);

  const fetchSubscriptionPlans = async () => {
    setLoadingPlans(true);
    try {
      const response = await api.get('/master-admin/subscription-plans');
      if (response.data.success) {
        setSubscriptionPlans(response.data.data || []);
        // Auto-select first plan if available
        if (response.data.data?.length > 0 && !formData.planId) {
          handleChange('planId', response.data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchTypeByCode = async (code) => {
    try {
      const response = await api.get(`/organization-management/types/code/${code}`);
      if (response.data.success) {
        setOrganizationType(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching type:', error);
    }
  };

  const fetchEducationData = async () => {
    setLoadingData(true);
    try {
      const [typesRes, boardsRes, unisRes] = await Promise.all([
        api.get('/institution-management/institution-types'),
        api.get('/master/education-boards'),
        api.get('/master/universities')
      ]);
      if (typesRes.data.success) setInstitutionTypes(typesRes.data.data || []);
      if (boardsRes.data.success) setEducationBoards(boardsRes.data.data || []);
      if (unisRes.data.success) setUniversities(unisRes.data.data || []);
    } catch (error) {
      console.error('Error fetching education data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear duplicate flags when editing
    if (field === 'ownerEmail') {
      setEmailExists(false);
    }
    if (field === 'ownerPhone') {
      setPhoneExists(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // DUPLICATE CHECK - Email & Mobile
  // ═══════════════════════════════════════════════════════════════════════════════
  const checkEmailDuplicate = async (email) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailExists(false);
      return;
    }
    
    setCheckingEmail(true);
    try {
      const response = await api.post('/auth/check-email', { email });
      setEmailExists(response.data.exists === true);
      if (response.data.exists) {
        setErrors(prev => ({ ...prev, ownerEmail: 'This email is already registered' }));
      } else {
        // Clear the error if email is available
        setErrors(prev => {
          const { ownerEmail, ...rest } = prev;
          return rest;
        });
      }
    } catch (error) {
      // If API fails, assume not duplicate (will be caught on submit)
      console.error('Email check error:', error);
      setEmailExists(false);
    } finally {
      setCheckingEmail(false);
    }
  };

  const checkPhoneDuplicate = async (phone) => {
    if (!phone || phone.length !== 10) {
      setPhoneExists(false);
      return;
    }
    
    setCheckingPhone(true);
    try {
      const response = await api.post('/auth/check-phone', { phone });
      setPhoneExists(response.data.exists === true);
      if (response.data.exists) {
        setErrors(prev => ({ ...prev, ownerPhone: 'This mobile number is already registered' }));
      } else {
        // Clear the error if phone is available
        setErrors(prev => {
          const { ownerPhone, ...rest } = prev;
          return rest;
        });
      }
    } catch (error) {
      console.error('Phone check error:', error);
      setPhoneExists(false);
    } finally {
      setCheckingPhone(false);
    }
  };

  // Debounced duplicate check handlers
  const handleEmailBlur = () => {
    if (formData.ownerEmail) {
      checkEmailDuplicate(formData.ownerEmail);
    }
  };

  const handlePhoneBlur = () => {
    if (formData.ownerPhone && formData.ownerPhone.length === 10) {
      checkPhoneDuplicate(formData.ownerPhone);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // PINCODE API - Auto-fetch address from India Post API
  // ═══════════════════════════════════════════════════════════════════════════════
  const fetchAddressFromPincode = async (pincode) => {
    if (!pincode || pincode.length !== 6) {
      setPincodeError('');
      setPostOffices([]);
      return;
    }

    setPincodeLoading(true);
    setPincodeError('');
    setPostOffices([]);

    try {
      // India Post Pincode API
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();

      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice?.length > 0) {
        const offices = data[0].PostOffice;
        setPostOffices(offices);
        
        // Auto-fill with first result
        const firstOffice = offices[0];
        setFormData(prev => ({
          ...prev,
          pincode: pincode,
          city: firstOffice.Block || firstOffice.Taluk || firstOffice.District,
          district: firstOffice.District,
          state: firstOffice.State,
          country: 'India',
          // If only one post office, auto-fill address
          address_line2: offices.length === 1 ? firstOffice.Name : prev.address_line2,
        }));

        toast({
          title: '✅ Address Found!',
          description: `${firstOffice.District}, ${firstOffice.State}`,
        });
      } else {
        setPincodeError('Invalid pincode or no data found');
        toast({
          variant: 'destructive',
          title: 'Invalid Pincode',
          description: 'Please enter a valid 6-digit pincode',
        });
      }
    } catch (error) {
      console.error('Pincode API error:', error);
      setPincodeError('Failed to fetch address. Please enter manually.');
    } finally {
      setPincodeLoading(false);
    }
  };

  // Handle pincode change with debounce
  const handlePincodeChange = (value) => {
    const pincode = value.replace(/\D/g, '').slice(0, 6);
    handleChange('pincode', pincode);
    
    if (pincode.length === 6) {
      fetchAddressFromPincode(pincode);
    }
  };

  // Select post office from dropdown
  const handlePostOfficeSelect = (officeName) => {
    const office = postOffices.find(po => po.Name === officeName);
    if (office) {
      setFormData(prev => ({
        ...prev,
        address_line2: office.Name,
        city: office.Block || office.Taluk || office.District,
        district: office.District,
        state: office.State,
      }));
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // AUTO-GENERATE DISPLAY NAME FROM NAME (Code is server-generated)
  // ═══════════════════════════════════════════════════════════════════════════════

  const handleNameChange = (value) => {
    handleChange('name', value);
    
    // Auto-generate display name (short version - first 2-3 words)
    if (!formData.display_name || formData.display_name === formData.name?.trim().split(/\s+/).slice(0, 3).join(' ')) {
      const words = value.trim().split(/\s+/);
      handleChange('display_name', words.slice(0, 3).join(' '));
    }
    
    // NOTE: org_code is now SERVER-GENERATED for guaranteed uniqueness
    // Format: ORG-2026-001, ORG-2026-002, etc.
  };

  const handleTypeSelect = (type) => {
    setOrganizationType(type);
    setFormData({
      country: 'India',
      initialize_roles: true,
      initialize_departments: true,
      createDefaultBranch: false, // Branch creation is optional
      enablePublicWebsite: true,
      createHomepage: true,
      initializeCmsMenus: true,
      sendWelcomeEmail: true,
      subscriptionDuration: '12',
      subscriptionStartDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleSubmit = async () => {
    // ═══════════════════════════════════════════════════════════════════════════════
    // COMPREHENSIVE VALIDATION
    // ═══════════════════════════════════════════════════════════════════════════════
    const newErrors = {};
    
    // Basic required fields
    if (!formData.name?.trim()) newErrors.name = 'Organization name is required';
    
    // Admin/Owner required fields
    if (!formData.ownerName?.trim()) newErrors.ownerName = 'Admin name is required';
    if (!formData.ownerEmail?.trim()) newErrors.ownerEmail = 'Admin email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail)) newErrors.ownerEmail = 'Invalid email format';
    if (!formData.ownerPhone?.trim()) newErrors.ownerPhone = 'Admin phone is required';
    else if (!/^[0-9]{10}$/.test(formData.ownerPhone)) newErrors.ownerPhone = 'Phone must be 10 digits';
    if (!formData.ownerPassword?.trim()) newErrors.ownerPassword = 'Password is required';
    else if (formData.ownerPassword.length < 8) newErrors.ownerPassword = 'Password must be at least 8 characters';
    
    // Subscription Plan
    if (!formData.planId) newErrors.planId = 'Please select a subscription plan';
    
    // Contact - Optional but validated if present
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (formData.phone && !/^[0-9+\-\s]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone number';
    }
    
    // Address - optional now, auto-filled from pincode
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }
    
    // Type-specific validation
    if (typeCode === 'education') {
      if (!formData.institution_type_id) newErrors.institution_type_id = 'Institution type is required';
      if (!formData.school_category) newErrors.school_category = 'School category is required';
      if (!formData.medium_of_instruction) newErrors.medium_of_instruction = 'Medium is required';
    }
    if (typeCode === 'company') {
      if (!formData.company_type) newErrors.company_type = 'Company type is required';
      if (!formData.industry) newErrors.industry = 'Industry is required';
    }
    if (typeCode === 'hospital') {
      if (!formData.facility_type) newErrors.facility_type = 'Facility type is required';
    }
    if (typeCode === 'government') {
      if (!formData.department_type) newErrors.department_type = 'Department type is required';
      if (!formData.office_level) newErrors.office_level = 'Office level is required';
    }
    if (typeCode === 'factory') {
      if (!formData.factory_type) newErrors.factory_type = 'Factory type is required';
      if (!formData.industry_sector) newErrors.industry_sector = 'Industry sector is required';
    }
    if (typeCode === 'retail') {
      if (!formData.store_type) newErrors.store_type = 'Store type is required';
      if (!formData.product_category) newErrors.product_category = 'Product category is required';
    }
    if (typeCode === 'ngo') {
      if (!formData.ngo_type) newErrors.ngo_type = 'Organization type is required';
      if (!formData.focus_area) newErrors.focus_area = 'Focus area is required';
    }

    // If errors exist, show them
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.values(newErrors)[0];
      toast({ 
        variant: 'destructive', 
        title: 'Validation Error', 
        description: firstError 
      });
      return;
    }

    setLoading(true);
    try {
      // Map frontend field names to backend expected field names
      const payload = {
        // Required fields (mapped to backend expectations)
        orgName: formData.name,
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail,
        ownerPhone: formData.ownerPhone,
        ownerPassword: formData.ownerPassword,
        ownerDesignation: formData.ownerDesignation,
        planId: formData.planId,
        
        // Organization details
        organization_type_id: organizationType.id,
        type_code: organizationType.type_code,
        displayName: formData.display_name,
        slug: formData.slug,
        description: formData.description,
        establishedYear: formData.establishment_date ? new Date(formData.establishment_date).getFullYear() : null,
        logoUrl: formData.logo_url,
        website: formData.website,
        tagline: formData.tagline,
        
        // Contact
        email: formData.email,
        phone: formData.phone,
        altPhone: formData.alt_phone,
        
        // Address
        addressLine1: formData.address_line1,
        addressLine2: formData.address_line2,
        city: formData.city,
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode,
        country: formData.country || 'India',
        
        // Legal
        registrationNo: formData.registration_no,
        panNo: formData.pan_no,
        gstNo: formData.gst_no,
        tanNo: formData.tan_no,
        
        // Bank
        bankName: formData.bank_name,
        bankBranch: formData.bank_branch,
        accountNo: formData.account_no,
        ifscCode: formData.ifsc_code,
        accountType: formData.account_type,
        
        // Subscription
        subscriptionDuration: formData.subscriptionDuration || '12',
        subscriptionStartDate: formData.subscriptionStartDate,
        
        // Flags
        createDefaultRoles: formData.initialize_roles !== false,
        createDefaultBranch: formData.createDefaultBranch || false,
        sendWelcomeEmail: formData.sendWelcomeEmail !== false,
        enablePublicWebsite: formData.enablePublicWebsite !== false,
        
        // Education-specific
        institution_type_id: formData.institution_type_id,
        school_category: formData.school_category,
        medium_of_instruction: formData.medium_of_instruction,
        board_id: formData.board_id,
        university_id: formData.university_id,
        affiliation_no: formData.affiliation_no,
        
        // Company-specific
        company_type: formData.company_type,
        industry: formData.industry,
        cin_no: formData.cin_no,
        
        // Hospital-specific
        facility_type: formData.facility_type,
        bed_count: formData.bed_count,
        
        // Government-specific
        department_type: formData.department_type,
        office_level: formData.office_level,
        
        // Factory-specific
        factory_type: formData.factory_type,
        industry_sector: formData.industry_sector,
        
        // Retail-specific
        store_type: formData.store_type,
        product_category: formData.product_category,
        
        // NGO-specific
        ngo_type: formData.ngo_type,
        focus_area: formData.focus_area,
        trust_deed_no: formData.trust_deed_no,
        fcra_registration: formData.fcra_registration,
        fcra_number: formData.fcra_number,
      };
      
      const response = await api.post('/organization-management/organizations/create-full', payload);
      
      if (response.data.success) {
        toast({ title: '🎉 Success!', description: `${config?.title || 'Organization'} created successfully` });
        navigate('/master-admin/organizations');
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error.response?.data?.message || error.message || 'Failed to create organization' 
      });
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // STEP 1: TYPE SELECTION
  // ═══════════════════════════════════════════════════════════════════════════════
  if (!organizationType) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <SelectOrganizationType 
            onSelect={handleTypeSelect}
            onCancel={() => navigate('/master-admin/organizations')}
          />
        </div>
      </DashboardLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // FULL FORM (Based on Type)
  // ═══════════════════════════════════════════════════════════════════════════════
  const TypeIcon = config?.icon || Building2;

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setOrganizationType(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className={`p-3 rounded-lg ${config?.color || 'bg-gray-500'} text-white`}>
            <TypeIcon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Create {config?.title || 'Organization'}
              <Badge variant="outline">{typeCode}</Badge>
            </h1>
            <p className="text-muted-foreground">{organizationType?.description}</p>
          </div>
          <Button onClick={handleSubmit} disabled={loading} size="lg" className={config?.color}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Create {config?.title || 'Organization'}
          </Button>
        </div>

        {/* TABS - All visible at once */}
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto gap-1">
            <TabsTrigger value="basic" className="flex items-center gap-1 text-xs px-2">
              <Building2 className="w-3 h-3" />
              <span className="hidden sm:inline">Basic</span>
            </TabsTrigger>
            
            <TabsTrigger value="admin" className="flex items-center gap-1 text-xs px-2">
              <Users className="w-3 h-3" />
              <span className="hidden sm:inline">Admin</span>
            </TabsTrigger>
            
            <TabsTrigger value="subscription" className="flex items-center gap-1 text-xs px-2">
              <CreditCard className="w-3 h-3" />
              <span className="hidden sm:inline">Plan</span>
            </TabsTrigger>
            
            <TabsTrigger value="contact" className="flex items-center gap-1 text-xs px-2">
              <MapPin className="w-3 h-3" />
              <span className="hidden sm:inline">Contact</span>
            </TabsTrigger>
            
            <TabsTrigger value="legal" className="flex items-center gap-1 text-xs px-2">
              <FileText className="w-3 h-3" />
              <span className="hidden sm:inline">Legal</span>
            </TabsTrigger>
            
            <TabsTrigger value="bank" className="flex items-center gap-1 text-xs px-2">
              <Banknote className="w-3 h-3" />
              <span className="hidden sm:inline">Bank</span>
            </TabsTrigger>
            
            <TabsTrigger value="settings" className="flex items-center gap-1 text-xs px-2">
              <Shield className="w-3 h-3" />
              <span className="hidden sm:inline">Setup</span>
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* BASIC INFO TAB */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the primary details. Fields marked with <span className="text-red-500">*</span> are required.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-1">
                    Organization Name <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="name"
                    placeholder="Enter full organization name"
                    value={formData.name || ''}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={`text-lg ${errors.name ? 'border-red-500' : ''}`}
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="display_name" className="flex items-center gap-1">
                    Display Name / Short Name
                    {formData.display_name && <Badge variant="secondary" className="ml-2 text-xs">Auto</Badge>}
                  </Label>
                  <Input 
                    id="display_name"
                    placeholder="Short name (auto-generated)"
                    value={formData.display_name || ''}
                    onChange={(e) => handleChange('display_name', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="org_code" className="flex items-center gap-1">
                    Organization Code
                    <Badge variant="secondary" className="ml-2 text-xs">
                      🔒 Server Generated
                    </Badge>
                  </Label>
                  <div className="relative">
                    <Input 
                      id="org_code"
                      placeholder="Auto-generated on server (e.g., ORG-2026-001)"
                      value="Will be auto-generated: ORG-YYYY-NNN"
                      disabled
                      className="bg-muted text-muted-foreground"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Unique code generated automatically by server when you click Create
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="establishment_date">Establishment Date</Label>
                  <Input 
                    id="establishment_date"
                    type="date"
                    value={formData.establishment_date || ''}
                    onChange={(e) => handleChange('establishment_date', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input 
                    id="logo_url"
                    type="url"
                    placeholder="https://..."
                    value={formData.logo_url || ''}
                    onChange={(e) => handleChange('logo_url', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input 
                    id="website"
                    type="url"
                    placeholder="https://..."
                    value={formData.website || ''}
                    onChange={(e) => handleChange('website', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <Label htmlFor="tagline">Tagline / Motto</Label>
                  <Input 
                    id="tagline"
                    placeholder="Enter tagline or motto"
                    value={formData.tagline || ''}
                    onChange={(e) => handleChange('tagline', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <Label htmlFor="description">Description / About</Label>
                  <Textarea 
                    id="description"
                    placeholder="Brief description..."
                    value={formData.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* EDUCATION-SPECIFIC FIELDS */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {typeCode === 'education' && (
                  <>
                    <Separator className="md:col-span-2 lg:col-span-3 my-2" />
                    <div className="md:col-span-2 lg:col-span-3">
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-4">
                        <GraduationCap className="w-4 h-4" />
                        Education-Specific Details
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Institution Type <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={formData.institution_type_id || ''} 
                        onValueChange={(v) => handleChange('institution_type_id', v)}
                      >
                        <SelectTrigger className={errors.institution_type_id ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select institution type" />
                        </SelectTrigger>
                        <SelectContent>
                          {institutionTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.institution_type_id && (
                        <p className="text-xs text-red-500">{errors.institution_type_id}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        School Category <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={formData.school_category || ''} 
                        onValueChange={(v) => handleChange('school_category', v)}
                      >
                        <SelectTrigger className={errors.school_category ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="co-ed">Co-Education</SelectItem>
                          <SelectItem value="boys">Boys Only</SelectItem>
                          <SelectItem value="girls">Girls Only</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.school_category && (
                        <p className="text-xs text-red-500">{errors.school_category}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Medium of Instruction <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={formData.medium_of_instruction || ''} 
                        onValueChange={(v) => handleChange('medium_of_instruction', v)}
                      >
                        <SelectTrigger className={errors.medium_of_instruction ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select medium" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="english">English Medium</SelectItem>
                          <SelectItem value="kannada">Kannada Medium</SelectItem>
                          <SelectItem value="hindi">Hindi Medium</SelectItem>
                          <SelectItem value="tamil">Tamil Medium</SelectItem>
                          <SelectItem value="telugu">Telugu Medium</SelectItem>
                          <SelectItem value="malayalam">Malayalam Medium</SelectItem>
                          <SelectItem value="marathi">Marathi Medium</SelectItem>
                          <SelectItem value="urdu">Urdu Medium</SelectItem>
                          <SelectItem value="semi-english">Semi-English</SelectItem>
                          <SelectItem value="bilingual">Bilingual</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.medium_of_instruction && (
                        <p className="text-xs text-red-500">{errors.medium_of_instruction}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Education Board</Label>
                      <Select 
                        value={formData.board_id || ''} 
                        onValueChange={(v) => handleChange('board_id', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select board (if applicable)" />
                        </SelectTrigger>
                        <SelectContent>
                          {educationBoards.map((board) => (
                            <SelectItem key={board.id} value={board.id}>
                              {board.name} ({board.short_name || board.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Affiliated University</Label>
                      <Select 
                        value={formData.university_id || ''} 
                        onValueChange={(v) => handleChange('university_id', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select university (if applicable)" />
                        </SelectTrigger>
                        <SelectContent>
                          {universities.map((uni) => (
                            <SelectItem key={uni.id} value={uni.id}>
                              {uni.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Affiliation Number</Label>
                      <Input 
                        placeholder="Board/University affiliation number"
                        value={formData.affiliation_no || ''}
                        onChange={(e) => handleChange('affiliation_no', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* COMPANY-SPECIFIC FIELDS */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {typeCode === 'company' && (
                  <>
                    <Separator className="md:col-span-2 lg:col-span-3 my-2" />
                    <div className="md:col-span-2 lg:col-span-3">
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-4">
                        <Building2 className="w-4 h-4" />
                        Company-Specific Details
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Company Type <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={formData.company_type || ''} 
                        onValueChange={(v) => handleChange('company_type', v)}
                      >
                        <SelectTrigger className={errors.company_type ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select company type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private_limited">Private Limited</SelectItem>
                          <SelectItem value="public_limited">Public Limited</SelectItem>
                          <SelectItem value="llp">LLP (Limited Liability Partnership)</SelectItem>
                          <SelectItem value="partnership">Partnership Firm</SelectItem>
                          <SelectItem value="proprietorship">Proprietorship</SelectItem>
                          <SelectItem value="opc">One Person Company (OPC)</SelectItem>
                          <SelectItem value="startup">Startup</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.company_type && <p className="text-xs text-red-500">{errors.company_type}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Industry <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={formData.industry || ''} 
                        onValueChange={(v) => handleChange('industry', v)}
                      >
                        <SelectTrigger className={errors.industry ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="it_software">IT / Software</SelectItem>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="trading">Trading</SelectItem>
                          <SelectItem value="consulting">Consulting</SelectItem>
                          <SelectItem value="finance">Finance / Banking</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="real_estate">Real Estate</SelectItem>
                          <SelectItem value="hospitality">Hospitality</SelectItem>
                          <SelectItem value="ecommerce">E-commerce</SelectItem>
                          <SelectItem value="logistics">Logistics</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.industry && <p className="text-xs text-red-500">{errors.industry}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>CIN Number</Label>
                      <Input 
                        placeholder="Corporate Identity Number"
                        value={formData.cin_no || ''}
                        onChange={(e) => handleChange('cin_no', e.target.value.toUpperCase())}
                      />
                    </div>
                  </>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* HOSPITAL-SPECIFIC FIELDS */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {typeCode === 'hospital' && (
                  <>
                    <Separator className="md:col-span-2 lg:col-span-3 my-2" />
                    <div className="md:col-span-2 lg:col-span-3">
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-4">
                        <HeartPulse className="w-4 h-4" />
                        Healthcare-Specific Details
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Facility Type <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={formData.facility_type || ''} 
                        onValueChange={(v) => handleChange('facility_type', v)}
                      >
                        <SelectTrigger className={errors.facility_type ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select facility type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hospital">Hospital</SelectItem>
                          <SelectItem value="multi_specialty">Multi-Specialty Hospital</SelectItem>
                          <SelectItem value="super_specialty">Super Specialty Hospital</SelectItem>
                          <SelectItem value="clinic">Clinic</SelectItem>
                          <SelectItem value="nursing_home">Nursing Home</SelectItem>
                          <SelectItem value="diagnostic_center">Diagnostic Center</SelectItem>
                          <SelectItem value="pharmacy">Pharmacy</SelectItem>
                          <SelectItem value="ayurveda">Ayurveda Center</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.facility_type && <p className="text-xs text-red-500">{errors.facility_type}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label>Number of Beds</Label>
                      <Input 
                        type="number"
                        placeholder="Total beds"
                        value={formData.bed_count || ''}
                        onChange={(e) => handleChange('bed_count', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* GOVERNMENT-SPECIFIC FIELDS */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {typeCode === 'government' && (
                  <>
                    <Separator className="md:col-span-2 lg:col-span-3 my-2" />
                    <div className="md:col-span-2 lg:col-span-3">
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-4">
                        <Landmark className="w-4 h-4" />
                        Government Office Details
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Department Type <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={formData.department_type || ''} 
                        onValueChange={(v) => handleChange('department_type', v)}
                      >
                        <SelectTrigger className={errors.department_type ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select department type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="health">Health & Family Welfare</SelectItem>
                          <SelectItem value="revenue">Revenue</SelectItem>
                          <SelectItem value="police">Police / Home</SelectItem>
                          <SelectItem value="agriculture">Agriculture</SelectItem>
                          <SelectItem value="pwf">Public Works</SelectItem>
                          <SelectItem value="transport">Transport</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="urban">Urban Development</SelectItem>
                          <SelectItem value="rural">Rural Development</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.department_type && <p className="text-xs text-red-500">{errors.department_type}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Office Level <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={formData.office_level || ''} 
                        onValueChange={(v) => handleChange('office_level', v)}
                      >
                        <SelectTrigger className={errors.office_level ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="central">Central / National</SelectItem>
                          <SelectItem value="state">State Level</SelectItem>
                          <SelectItem value="division">Division Level</SelectItem>
                          <SelectItem value="district">District Level</SelectItem>
                          <SelectItem value="taluk">Taluk / Block Level</SelectItem>
                          <SelectItem value="gram">Gram Panchayat Level</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.office_level && <p className="text-xs text-red-500">{errors.office_level}</p>}
                    </div>
                  </>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* FACTORY-SPECIFIC FIELDS */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {typeCode === 'factory' && (
                  <>
                    <Separator className="md:col-span-2 lg:col-span-3 my-2" />
                    <div className="md:col-span-2 lg:col-span-3">
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-4">
                        <Factory className="w-4 h-4" />
                        Factory/Manufacturing Details
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Factory Type <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={formData.factory_type || ''} 
                        onValueChange={(v) => handleChange('factory_type', v)}
                      >
                        <SelectTrigger className={errors.factory_type ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select factory type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manufacturing">Manufacturing Unit</SelectItem>
                          <SelectItem value="processing">Processing Plant</SelectItem>
                          <SelectItem value="assembly">Assembly Unit</SelectItem>
                          <SelectItem value="warehouse">Warehouse</SelectItem>
                          <SelectItem value="cold_storage">Cold Storage</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.factory_type && <p className="text-xs text-red-500">{errors.factory_type}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Industry Sector <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={formData.industry_sector || ''} 
                        onValueChange={(v) => handleChange('industry_sector', v)}
                      >
                        <SelectTrigger className={errors.industry_sector ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select sector" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="textile">Textile</SelectItem>
                          <SelectItem value="food_processing">Food Processing</SelectItem>
                          <SelectItem value="automobile">Automobile</SelectItem>
                          <SelectItem value="electronics">Electronics</SelectItem>
                          <SelectItem value="pharmaceuticals">Pharmaceuticals</SelectItem>
                          <SelectItem value="chemicals">Chemicals</SelectItem>
                          <SelectItem value="construction">Construction Materials</SelectItem>
                          <SelectItem value="packaging">Packaging</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.industry_sector && <p className="text-xs text-red-500">{errors.industry_sector}</p>}
                    </div>
                  </>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* RETAIL-SPECIFIC FIELDS */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {typeCode === 'retail' && (
                  <>
                    <Separator className="md:col-span-2 lg:col-span-3 my-2" />
                    <div className="md:col-span-2 lg:col-span-3">
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-4">
                        <Store className="w-4 h-4" />
                        Retail/Store Details
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Store Type <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={formData.store_type || ''} 
                        onValueChange={(v) => handleChange('store_type', v)}
                      >
                        <SelectTrigger className={errors.store_type ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select store type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="supermarket">Supermarket</SelectItem>
                          <SelectItem value="department_store">Department Store</SelectItem>
                          <SelectItem value="specialty">Specialty Store</SelectItem>
                          <SelectItem value="convenience">Convenience Store</SelectItem>
                          <SelectItem value="warehouse">Warehouse Club</SelectItem>
                          <SelectItem value="franchise">Franchise</SelectItem>
                          <SelectItem value="ecommerce">E-Commerce</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.store_type && <p className="text-xs text-red-500">{errors.store_type}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Product Category <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={formData.product_category || ''} 
                        onValueChange={(v) => handleChange('product_category', v)}
                      >
                        <SelectTrigger className={errors.product_category ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="groceries">Groceries & FMCG</SelectItem>
                          <SelectItem value="electronics">Electronics</SelectItem>
                          <SelectItem value="fashion">Fashion & Apparel</SelectItem>
                          <SelectItem value="furniture">Furniture & Home</SelectItem>
                          <SelectItem value="pharmacy">Pharmacy</SelectItem>
                          <SelectItem value="automobile">Automobile Parts</SelectItem>
                          <SelectItem value="sports">Sports & Fitness</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.product_category && <p className="text-xs text-red-500">{errors.product_category}</p>}
                    </div>
                  </>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* NGO-SPECIFIC FIELDS */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {typeCode === 'ngo' && (
                  <>
                    <Separator className="md:col-span-2 lg:col-span-3 my-2" />
                    <div className="md:col-span-2 lg:col-span-3">
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-4">
                        <Heart className="w-4 h-4" />
                        NGO / Non-Profit Details
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Organization Type <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={formData.ngo_type || ''} 
                        onValueChange={(v) => handleChange('ngo_type', v)}
                      >
                        <SelectTrigger className={errors.ngo_type ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trust">Trust</SelectItem>
                          <SelectItem value="society">Society</SelectItem>
                          <SelectItem value="section8">Section 8 Company</SelectItem>
                          <SelectItem value="foundation">Foundation</SelectItem>
                          <SelectItem value="association">Association</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.ngo_type && <p className="text-xs text-red-500">{errors.ngo_type}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Focus Area <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={formData.focus_area || ''} 
                        onValueChange={(v) => handleChange('focus_area', v)}
                      >
                        <SelectTrigger className={errors.focus_area ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select focus area" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="health">Health & Nutrition</SelectItem>
                          <SelectItem value="environment">Environment</SelectItem>
                          <SelectItem value="women">Women Empowerment</SelectItem>
                          <SelectItem value="child">Child Welfare</SelectItem>
                          <SelectItem value="rural">Rural Development</SelectItem>
                          <SelectItem value="disability">Disability Support</SelectItem>
                          <SelectItem value="elderly">Elderly Care</SelectItem>
                          <SelectItem value="animal">Animal Welfare</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.focus_area && <p className="text-xs text-red-500">{errors.focus_area}</p>}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* ADMIN / SUPER ADMIN TAB */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Super Admin Account
                </CardTitle>
                <CardDescription>
                  Create the primary administrator who will manage this organization. 
                  <span className="text-primary font-medium ml-1">Email & Mobile can be used for login.</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Owner/Admin Name <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    placeholder="Full name of the admin"
                    value={formData.ownerName || ''}
                    onChange={(e) => handleChange('ownerName', e.target.value)}
                    className={errors.ownerName ? 'border-red-500' : ''}
                  />
                  {errors.ownerName && <p className="text-xs text-red-500">{errors.ownerName}</p>}
                </div>
                
                {/* EMAIL with duplicate check */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Admin Email <span className="text-red-500">*</span>
                    {checkingEmail && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
                    {!checkingEmail && formData.ownerEmail && !emailExists && !errors.ownerEmail && (
                      <CheckCircle className="w-4 h-4 text-primary ml-1" />
                    )}
                    {emailExists && <XCircle className="w-4 h-4 text-red-500 ml-1" />}
                  </Label>
                  <Input 
                    type="email"
                    placeholder="admin@organization.com"
                    value={formData.ownerEmail || ''}
                    onChange={(e) => handleChange('ownerEmail', e.target.value)}
                    onBlur={handleEmailBlur}
                    className={`${errors.ownerEmail || emailExists ? 'border-red-500' : ''}`}
                  />
                  {errors.ownerEmail && <p className="text-xs text-red-500">{errors.ownerEmail}</p>}
                  {emailExists && !errors.ownerEmail && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> This email is already registered
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">Used for login & notifications</p>
                </div>
                
                {/* MOBILE with duplicate check */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Admin Mobile <span className="text-red-500">*</span>
                    {checkingPhone && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
                    {!checkingPhone && formData.ownerPhone?.length === 10 && !phoneExists && !errors.ownerPhone && (
                      <CheckCircle className="w-4 h-4 text-primary ml-1" />
                    )}
                    {phoneExists && <XCircle className="w-4 h-4 text-red-500 ml-1" />}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">+91</span>
                    <Input 
                      type="tel"
                      placeholder="9876543210"
                      value={formData.ownerPhone || ''}
                      onChange={(e) => handleChange('ownerPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      onBlur={handlePhoneBlur}
                      className={`pl-12 ${errors.ownerPhone || phoneExists ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.ownerPhone && <p className="text-xs text-red-500">{errors.ownerPhone}</p>}
                  {phoneExists && !errors.ownerPhone && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> This mobile is already registered
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">Used for login & OTP verification</p>
                </div>
                
                {/* PASSWORD with show/hide */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Initial Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 8 characters"
                      value={formData.ownerPassword || ''}
                      onChange={(e) => handleChange('ownerPassword', e.target.value)}
                      className={`pr-10 ${errors.ownerPassword ? 'border-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.ownerPassword && <p className="text-xs text-red-500">{errors.ownerPassword}</p>}
                  {formData.ownerPassword && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`h-1 flex-1 rounded ${formData.ownerPassword.length >= 8 ? 'bg-primary' : 'bg-muted'}`} />
                      <div className={`h-1 flex-1 rounded ${formData.ownerPassword.length >= 10 ? 'bg-primary' : 'bg-muted'}`} />
                      <div className={`h-1 flex-1 rounded ${/[A-Z]/.test(formData.ownerPassword) && /[0-9]/.test(formData.ownerPassword) ? 'bg-primary' : 'bg-muted'}`} />
                      <span className="text-xs text-muted-foreground">
                        {formData.ownerPassword.length >= 10 && /[A-Z]/.test(formData.ownerPassword) && /[0-9]/.test(formData.ownerPassword) ? 'Strong' : 
                         formData.ownerPassword.length >= 8 ? 'Medium' : 'Weak'}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">User can change after first login</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Contact Person Name</Label>
                  <Input 
                    placeholder="If different from admin"
                    value={formData.contactPersonName || ''}
                    onChange={(e) => handleChange('contactPersonName', e.target.value)}
                  />
                </div>
                
                {/* DYNAMIC DESIGNATION based on org type */}
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Select value={formData.ownerDesignation || ''} onValueChange={(v) => handleChange('ownerDesignation', v === 'none' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select designation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Select Designation --</SelectItem>
                      {designationOptions.length > 0 ? (
                        designationOptions.map((d) => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="director">Director</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="administrator">Administrator</SelectItem>
                          <SelectItem value="owner">Owner</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {typeCode ? `Designations for ${config?.title || typeCode}` : 'Select organization type first'}
                  </p>
                </div>

                <Separator className="md:col-span-2 lg:col-span-3 my-2" />
                
                <div className="md:col-span-2 lg:col-span-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                    <div>
                      <Label className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Send Welcome Email
                      </Label>
                      <p className="text-xs text-muted-foreground">Send login credentials to admin email</p>
                    </div>
                    <Switch 
                      checked={formData.sendWelcomeEmail !== false}
                      onCheckedChange={(v) => handleChange('sendWelcomeEmail', v)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* SUBSCRIPTION PLAN TAB */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Subscription Plan
                </CardTitle>
                <CardDescription>
                  Select a subscription plan for this organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingPlans ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Loading plans...
                  </div>
                ) : subscriptionPlans.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>No subscription plans available</p>
                    <p className="text-xs">Please create plans in Master Admin → Subscription Plans</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subscriptionPlans.map((plan) => (
                      <div 
                        key={plan.id}
                        onClick={() => handleChange('planId', plan.id)}
                        className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          formData.planId === plan.id 
                            ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        {formData.planId === plan.id && (
                          <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-primary" />
                        )}
                        <h4 className="font-semibold text-lg">{plan.name}</h4>
                        <p className="text-2xl font-bold text-primary mt-2">
                          ₹{plan.price?.toLocaleString() || '0'}
                          <span className="text-sm font-normal text-muted-foreground">
                            /{plan.billing_cycle || 'year'}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                        {plan.features && (
                          <ul className="mt-3 space-y-1">
                            {(Array.isArray(plan.features) ? plan.features : []).slice(0, 4).map((feature, idx) => (
                              <li key={idx} className="text-xs flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {errors.planId && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.planId}
                  </p>
                )}

                <Separator className="my-4" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Subscription Start Date</Label>
                    <Input 
                      type="date"
                      value={formData.subscriptionStartDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleChange('subscriptionStartDate', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Billing Duration</Label>
                    <Select value={formData.subscriptionDuration || '12'} onValueChange={(v) => handleChange('subscriptionDuration', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Month</SelectItem>
                        <SelectItem value="3">3 Months</SelectItem>
                        <SelectItem value="6">6 Months</SelectItem>
                        <SelectItem value="12">1 Year (Recommended)</SelectItem>
                        <SelectItem value="24">2 Years</SelectItem>
                        <SelectItem value="36">3 Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* CONTACT TAB (Common) */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Contact & Address
                </CardTitle>
                <CardDescription>
                  Contact information and location. 
                  <span className="text-primary font-medium ml-2">💡 Enter pincode to auto-fill address!</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    type="email"
                    placeholder="contact@organization.com"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    placeholder="+91 XXXXXXXXXX"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label>Alternate Phone</Label>
                  <Input 
                    placeholder="+91 XXXXXXXXXX"
                    value={formData.alt_phone || ''}
                    onChange={(e) => handleChange('alt_phone', e.target.value)}
                  />
                </div>

                {/* PINCODE - Smart Auto-Fill */}
                <div className="space-y-2 lg:col-span-1">
                  <Label className="flex items-center gap-1">
                    Pincode <span className="text-red-500">*</span>
                    {pincodeLoading && <Loader2 className="w-3 h-3 animate-spin ml-2" />}
                    {formData.city && formData.state && !pincodeLoading && (
                      <CheckCircle className="w-4 h-4 text-primary ml-2" />
                    )}
                  </Label>
                  <Input 
                    placeholder="Enter 6-digit pincode"
                    maxLength={6}
                    value={formData.pincode || ''}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    className={`text-lg font-mono ${errors.pincode ? 'border-red-500' : formData.city ? 'border-primary' : ''}`}
                  />
                  {pincodeError && <p className="text-xs text-red-500">{pincodeError}</p>}
                  {errors.pincode && <p className="text-xs text-red-500">{errors.pincode}</p>}
                  {formData.pincode?.length === 6 && formData.city && (
                    <p className="text-xs text-primary">✓ {formData.city}, {formData.state}</p>
                  )}
                </div>

                {/* Post Office Selection (if multiple) */}
                {postOffices.length > 1 && (
                  <div className="space-y-2 lg:col-span-2">
                    <Label>Select Area / Post Office</Label>
                    <Select 
                      value={formData.address_line2 || ''} 
                      onValueChange={handlePostOfficeSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your area" />
                      </SelectTrigger>
                      <SelectContent>
                        {postOffices.map((po, idx) => (
                          <SelectItem key={idx} value={po.Name}>
                            {po.Name} ({po.BranchType})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{postOffices.length} areas found for this pincode</p>
                  </div>
                )}
                
                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <Label className="flex items-center gap-1">
                    Address Line 1 <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    placeholder="Street address, Building name, Door number"
                    value={formData.address_line1 || ''}
                    onChange={(e) => handleChange('address_line1', e.target.value)}
                    className={errors.address_line1 ? 'border-red-500' : ''}
                  />
                  {errors.address_line1 && <p className="text-xs text-red-500">{errors.address_line1}</p>}
                </div>
                
                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <Label>Address Line 2 / Area</Label>
                  <Input 
                    placeholder="Area, Landmark, Post Office"
                    value={formData.address_line2 || ''}
                    onChange={(e) => handleChange('address_line2', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    City / Town <span className="text-red-500">*</span>
                    {formData.city && <Badge variant="secondary" className="ml-2">Auto-filled</Badge>}
                  </Label>
                  <Input 
                    placeholder="City"
                    value={formData.city || ''}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
                </div>

                <div className="space-y-2">
                  <Label>District</Label>
                  <Input 
                    placeholder="District"
                    value={formData.district || ''}
                    onChange={(e) => handleChange('district', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    State <span className="text-red-500">*</span>
                    {formData.state && <Badge variant="secondary" className="ml-2">Auto-filled</Badge>}
                  </Label>
                  <Select value={formData.state || ''} onValueChange={(v) => handleChange('state', v)}>
                    <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* LEGAL TAB (Common) */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="legal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Legal & Registration
                </CardTitle>
                <CardDescription>Registration and compliance details</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Registration Number</Label>
                  <Input 
                    placeholder="Registration/Incorporation number"
                    value={formData.registration_no || ''}
                    onChange={(e) => handleChange('registration_no', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>PAN Number</Label>
                  <Input 
                    placeholder="XXXXXXXXXX"
                    maxLength={10}
                    value={formData.pan_no || ''}
                    onChange={(e) => handleChange('pan_no', e.target.value.toUpperCase())}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>GST Number</Label>
                  <Input 
                    placeholder="XXAAAAXXXXAXXXX"
                    maxLength={15}
                    value={formData.gst_no || ''}
                    onChange={(e) => handleChange('gst_no', e.target.value.toUpperCase())}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>TAN Number</Label>
                  <Input 
                    placeholder="XXXXXXXXXX"
                    maxLength={10}
                    value={formData.tan_no || ''}
                    onChange={(e) => handleChange('tan_no', e.target.value.toUpperCase())}
                  />
                </div>

                {/* NGO specific */}
                {typeCode === 'ngo' && (
                  <>
                    <div className="space-y-2">
                      <Label>Trust/Society Registration</Label>
                      <Input 
                        placeholder="Registration number"
                        value={formData.trust_deed_no || ''}
                        onChange={(e) => handleChange('trust_deed_no', e.target.value)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label>FCRA Registration</Label>
                        <p className="text-xs text-muted-foreground">Foreign Contribution</p>
                      </div>
                      <Switch 
                        checked={formData.fcra_registration || false}
                        onCheckedChange={(v) => handleChange('fcra_registration', v)}
                      />
                    </div>

                    {formData.fcra_registration && (
                      <div className="space-y-2">
                        <Label>FCRA Number</Label>
                        <Input 
                          placeholder="FCRA number"
                          value={formData.fcra_number || ''}
                          onChange={(e) => handleChange('fcra_number', e.target.value)}
                        />
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* BANK TAB (Common) */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="bank">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Bank Details
                </CardTitle>
                <CardDescription>Banking and payment information</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input 
                    placeholder="e.g., State Bank of India"
                    value={formData.bank_name || ''}
                    onChange={(e) => handleChange('bank_name', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Input 
                    placeholder="Branch name"
                    value={formData.bank_branch || ''}
                    onChange={(e) => handleChange('bank_branch', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input 
                    placeholder="Account number"
                    value={formData.account_no || ''}
                    onChange={(e) => handleChange('account_no', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input 
                    placeholder="XXXXXXXXXXX"
                    maxLength={11}
                    value={formData.ifsc_code || ''}
                    onChange={(e) => handleChange('ifsc_code', e.target.value.toUpperCase())}
                  />
                </div>

                {/* NGO FCRA Bank */}
                {typeCode === 'ngo' && formData.fcra_registration && (
                  <>
                    <Separator className="md:col-span-2 lg:col-span-3 my-4" />
                    <div className="md:col-span-2 lg:col-span-3">
                      <h3 className="font-semibold mb-2">FCRA Designated Bank Account</h3>
                      <p className="text-sm text-muted-foreground mb-4">For receiving foreign contributions</p>
                    </div>
                    <div className="space-y-2">
                      <Label>FCRA Bank Name</Label>
                      <Input 
                        placeholder="FC designated bank"
                        value={formData.fcra_bank_name || ''}
                        onChange={(e) => handleChange('fcra_bank_name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>FCRA Account Number</Label>
                      <Input 
                        placeholder="FC account number"
                        value={formData.fcra_account_no || ''}
                        onChange={(e) => handleChange('fcra_account_no', e.target.value)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* SETTINGS TAB - Setup Options, Homepage, Front CMS */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Setup & Configuration
                </CardTitle>
                <CardDescription>Configure automatic setup options, homepage, and website settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Initial Setup Options */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Auto-Creation Options
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label>Initialize Default Roles</Label>
                        <p className="text-xs text-muted-foreground">Super Admin, Admin, Staff, etc.</p>
                      </div>
                      <Switch 
                        checked={formData.initialize_roles !== false}
                        onCheckedChange={(v) => handleChange('initialize_roles', v)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label>Initialize Departments</Label>
                        <p className="text-xs text-muted-foreground">Standard department structure</p>
                      </div>
                      <Switch 
                        checked={formData.initialize_departments !== false}
                        onCheckedChange={(v) => handleChange('initialize_departments', v)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                      <div>
                        <Label className="flex items-center gap-2">
                          Create Initial Branch
                          <Badge variant="secondary" className="text-xs">Optional</Badge>
                        </Label>
                        <p className="text-xs text-muted-foreground">You can add branches later</p>
                      </div>
                      <Switch 
                        checked={formData.createDefaultBranch === true}
                        onCheckedChange={(v) => handleChange('createDefaultBranch', v)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Homepage & Front CMS */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    Website & Homepage
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/10">
                      <div>
                        <Label className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Enable Public Website
                        </Label>
                        <p className="text-xs text-muted-foreground">Create public-facing website (Front CMS)</p>
                      </div>
                      <Switch 
                        checked={formData.enablePublicWebsite !== false}
                        onCheckedChange={(v) => handleChange('enablePublicWebsite', v)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label>Auto-Create Homepage</Label>
                        <p className="text-xs text-muted-foreground">Generate default landing page</p>
                      </div>
                      <Switch 
                        checked={formData.createHomepage !== false}
                        onCheckedChange={(v) => handleChange('createHomepage', v)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label>Initialize CMS Menus</Label>
                        <p className="text-xs text-muted-foreground">Create default navigation menus</p>
                      </div>
                      <Switch 
                        checked={formData.initializeCmsMenus !== false}
                        onCheckedChange={(v) => handleChange('initializeCmsMenus', v)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* URL Settings */}
                <div>
                  <h3 className="font-semibold mb-4">URL Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Website URL Slug</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">jashchar.com/</span>
                        <Input 
                          placeholder="your-organization"
                          value={formData.slug || ''}
                          onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Auto-generated from organization name if left empty</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Custom Domain (Optional)</Label>
                      <Input 
                        placeholder="www.yourschool.edu"
                        value={formData.customDomain || ''}
                        onChange={(e) => handleChange('customDomain', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Point your domain to our servers</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Subscription Summary */}
                {formData.planId && subscriptionPlans.length > 0 && (
                  <div className="p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-primary/10">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" />
                      Selected Plan Summary
                    </h3>
                    {(() => {
                      const selectedPlan = subscriptionPlans.find(p => p.id === formData.planId);
                      if (!selectedPlan) return null;
                      return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Plan</p>
                            <p className="font-semibold">{selectedPlan.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Price</p>
                            <p className="font-semibold">₹{selectedPlan.price?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Duration</p>
                            <p className="font-semibold">{formData.subscriptionDuration || '12'} months</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge variant="default">Will be Active</Badge>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom Submit Button */}
        <div className="flex justify-end mt-6">
          <Button onClick={handleSubmit} disabled={loading} size="lg" className={`${config?.color} min-w-[200px]`}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Create {config?.title || 'Organization'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateOrganizationDynamic;
