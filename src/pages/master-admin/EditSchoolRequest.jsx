import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import apiClient from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, School, MapPin, Phone, Mail, User, Lock, Globe, Building2, Plus, Trash2, GitBranch, ArrowLeft, Save, Check, Layers, Calendar } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

const EditSchoolRequest = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [postOffices, setPostOffices] = useState([]);
  const [errors, setErrors] = useState({});
  const [countryCode, setCountryCode] = useState('+91');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingMobile, setIsCheckingMobile] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [requestStatus, setRequestStatus] = useState('pending'); // Track request status
  
  // Session Management
  const [sessionTemplates, setSessionTemplates] = useState([]);
  // Store session per branch index (0 = Primary, 1..n = Additional)
  const [branchSessions, setBranchSessions] = useState({});
  
  // Password fields are optional in edit mode (only if changing)
  const [password, setPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [boardOptions, setBoardOptions] = useState([]);

  // Branch list for multi-branch registration
  const [branchList, setBranchList] = useState([
    { name: '', board: '' }
  ]);

  const [formData, setFormData] = useState({
    registration_type: 'organization',
    organization_name: '',
    organization_code: '',
    school_name: '',
    contact_number: '',
    contact_email: '',
    address: '',
    pincode: '',
    city: '',
    state: '',
    board: '',
    owner_name: '',
    owner_email: '',
    owner_mobile: '',
    notes: '',
    slug: '',
    post_office: ''
  });

  useEffect(() => {
    fetchRequestDetails();
    fetchPlans();
    fetchSessionTemplates();
    fetchBoardOptions();
  }, [id]);

  const fetchBoardOptions = async () => {
    try {
        const response = await apiClient.get('/system-settings');
        const settingsData = response;
        
        if (settingsData && settingsData['board_affiliations']) {
            const parsed = typeof settingsData['board_affiliations'] === 'string' 
                ? JSON.parse(settingsData['board_affiliations']) 
                : (settingsData['board_affiliations'] || []);
            setBoardOptions(Array.isArray(parsed) ? parsed : []);
        }
    } catch (err) {
        console.error("Error fetching board options:", err);
    }
  };

  const fetchSessionTemplates = async () => {
    try {
        const response = await apiClient.get('/system-settings');
        // apiClient returns the data directly, not wrapped in { data: ... }
        // The API returns the settings object directly (key-value pairs)
        const settingsData = response; 
        
        if (settingsData) {
            const templatesValue = settingsData['session_templates'];
            if (templatesValue) {
                try {
                    const parsed = typeof templatesValue === 'string' 
                        ? JSON.parse(templatesValue) 
                        : (templatesValue || []);
                    setSessionTemplates(Array.isArray(parsed) ? parsed : []);
                } catch (e) {
                    console.error("Error parsing session templates", e);
                    setSessionTemplates([]);
                }
            }
        }
    } catch (error) {
        console.error("Error fetching session templates", error);
    }
  };

  const fetchPlans = async () => {
    const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });
    
    if (error) {
        console.error('Error fetching plans:', error);
    } else {
        setPlans(data || []);
    }
  };

  const fetchRequestDetails = async () => {
    try {
      setInitialLoading(true);
      const { data, error } = await supabase
        .from('school_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        // Store request status
        setRequestStatus(data.status || 'pending');
        
        // Parse notes for extra data (password, org/branch data)
        let orgData = null;
        let branchesData = null;
        let sessionData = null;
        let cleanNotes = data.notes || '';

        if (data.notes) {
            if (data.notes.includes('||ORG_BRANCH_DATA:')) {
                // Extract JSON by finding balanced braces
                const startIdx = data.notes.indexOf('||ORG_BRANCH_DATA:') + '||ORG_BRANCH_DATA:'.length;
                let braceCount = 0;
                let endIdx = startIdx;
                let jsonStarted = false;
                
                for (let i = startIdx; i < data.notes.length; i++) {
                    if (data.notes[i] === '{') {
                        braceCount++;
                        jsonStarted = true;
                    } else if (data.notes[i] === '}') {
                        braceCount--;
                    }
                    if (jsonStarted && braceCount === 0) {
                        endIdx = i + 1;
                        break;
                    }
                }
                
                // Get clean notes (everything before ||ORG_BRANCH_DATA:)
                const orgBranchIdx = data.notes.indexOf('||ORG_BRANCH_DATA:');
                cleanNotes = data.notes.substring(0, orgBranchIdx);
                
                try {
                    const jsonStr = data.notes.substring(startIdx, endIdx);
                    const parsed = JSON.parse(jsonStr);
                    orgData = parsed.organization;
                    branchesData = parsed.branches;
                    
                    // Load existing session data if available
                    // Check if session data is embedded in branches (new format) or global (old format)
                    const loadedSessions = {};
                    
                    if (branchesData && Array.isArray(branchesData)) {
                        branchesData.forEach((branch, idx) => {
                            if (branch.session) {
                                loadedSessions[idx] = branch.session;
                            }
                        });
                    }
                    
                    // Fallback to global session if per-branch not found
                    if (Object.keys(loadedSessions).length === 0 && parsed.session) {
                        // Assign global session to primary branch (0)
                        loadedSessions[0] = parsed.session;
                    }
                    
                    setBranchSessions(loadedSessions);
                    
                } catch (e) {
                    console.error("Error parsing metadata", e);
                }
            }
            if (cleanNotes.includes('||PWD:')) {
                const parts = cleanNotes.split('||PWD:');
                cleanNotes = parts[0];
            }
        }

        const regType = (data.registration_type === 'single_school' || !data.registration_type) ? 'organization' : data.registration_type;

        setFormData({
            registration_type: regType,
            organization_name: orgData?.name || (data.registration_type === 'single_school' ? data.school_name : ''),
            organization_code: orgData?.code || '',
            school_name: data.school_name || '',
            contact_number: data.contact_number || '',
            contact_email: data.contact_email || '',
            address: data.address || '',
            pincode: data.pincode || '',
            city: data.city || '',
            state: data.state || '',
            board: data.board || '',
            owner_name: data.owner_name || '',
            owner_email: data.owner_email || '',
            owner_mobile: data.owner_mobile || '',
            notes: cleanNotes,
            slug: data.slug || '',
            post_office: data.post_office || ''
        });

        if (branchesData && Array.isArray(branchesData) && branchesData.length > 0) {
            setBranchList(branchesData);
        }
      }
    } catch (error) {
      console.error("Error fetching request:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load request details." });
      navigate('/master-admin/school-requests');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-generate slug from Organization Name (or School Name for single school)
    if (name === 'organization_name' || (name === 'school_name' && formData.registration_type === 'single_school')) {
        const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        setFormData(prev => ({ ...prev, [name]: value, slug }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (name === 'owner_email' && value) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.owner_email;
        return newErrors;
      });
      const timeout = setTimeout(() => {
        if (value.includes('@')) {
          checkDuplicate('owner_email', value);
        }
      }, 1000);
      return () => clearTimeout(timeout);
    }
  };

  const handleValueChange = (name, value) => {
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      if (name === 'registration_type' && (value === 'organization' || value === 'organization_multi_branch')) {
        if (!prev.organization_code) {
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          const timestamp = Date.now().toString().slice(-4);
          newData.organization_code = `ORG-${timestamp}${randomSuffix}`;
        }
      }
      
      return newData;
    });
  };

  const checkDuplicate = async (field, value) => {
    if (!value) return false;
    
    try {
      if (field === 'owner_email') {
        setIsCheckingEmail(true);
        
        const { data: request } = await supabase
          .from('school_requests')
          .select('id')
          .eq('owner_email', value)
          .neq('id', id) // Exclude current request
          .neq('status', 'rejected')
          .maybeSingle();
        
        if (request) {
          setErrors(prev => ({ ...prev, owner_email: 'This email is already used in another pending request.' }));
          setIsCheckingEmail(false);
          return true;
        }

        // Removed check against profiles table to allow existing users to request new schools
        // The backend handles existing users gracefully by linking them
        
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.owner_email;
          return newErrors;
        });
        setIsCheckingEmail(false);
        return false;

      } else if (field === 'owner_mobile' || field === 'contact_number') {
        setIsCheckingMobile(true);
        const mobileToCheck = value.replace(/\D/g, '');
        
        if (mobileToCheck.length === 10) {
          const { data: request } = await supabase
            .from('school_requests')
            .select('id')
            .or(`owner_mobile.eq.${mobileToCheck},contact_number.eq.${mobileToCheck}`)
            .neq('id', id) // Exclude current request
            .neq('status', 'rejected')
            .maybeSingle();
          
          if (request) {
            setErrors(prev => ({ 
              ...prev, 
              owner_mobile: 'Mobile number used in another request.',
              contact_number: 'Mobile number used in another request.'
            }));
            setIsCheckingMobile(false);
            return true;
          }
          
          // Removed check against users table to allow existing users to request new schools
          // The backend handles existing users gracefully
          
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.owner_mobile;
            delete newErrors.contact_number;
            return newErrors;
          });
          setIsCheckingMobile(false);
          return false;
        }
        setIsCheckingMobile(false);
        return false;

      } else if (field === 'slug') {
        setIsCheckingSlug(true);
        const slugToCheck = value.toLowerCase();

        const { data: request } = await supabase
          .from('school_requests')
          .select('id')
          .eq('slug', slugToCheck)
          .neq('id', id) // Exclude current request
          .neq('status', 'rejected')
          .maybeSingle();

        if (request) {
          setErrors(prev => ({ ...prev, slug: 'URL code taken by another request.' }));
          setIsCheckingSlug(false);
          return true;
        }

        const { data: school } = await supabase
          .from('schools')
          .select('id')
          .eq('slug', slugToCheck)
          .maybeSingle();

        if (school) {
          setErrors(prev => ({ ...prev, slug: 'URL code already taken.' }));
          setIsCheckingSlug(false);
          return true;
        }

        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.slug;
          return newErrors;
        });
        setIsCheckingSlug(false);
        return false;
      }
    } catch (error) {
      console.error('Duplicate check error:', error);
      setIsCheckingEmail(false);
      setIsCheckingMobile(false);
      setIsCheckingSlug(false);
      return false;
    }
    return false;
  };

  const handlePincodeChange = useCallback(async (e) => {
    const pincode = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, pincode, city: '', state: '', post_office: '' }));
    setPostOffices([]);
    
    if (pincode.length === 6) {
      setPincodeLoading(true);
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data[0]?.Status === 'Success') {
            const offices = data[0].PostOffice;
            setPostOffices(offices);

            if (offices?.length > 0) {
              setFormData(prev => ({
                ...prev,
                city: offices[0].District,
                state: offices[0].State,
                post_office: offices.length === 1 ? offices[0].Name : '',
                pincode
              }));
            }
          }
        }
      } catch (error) {
        console.error("Pincode fetch error", error);
      } finally {
        setPincodeLoading(false);
      }
    }
  }, []);

  const handlePostOfficeChange = (value) => {
      setFormData(prev => ({ ...prev, post_office: value }));
      const selectedOffice = postOffices.find(po => po.Name === value);
      if (selectedOffice) {
          setFormData(prev => ({
              ...prev,
              city: selectedOffice.District,
              state: selectedOffice.State,
              post_office: value
          }));
      }
  };

  const addBranch = () => {
    setBranchList(prev => [...prev, { name: '', board: '' }]);
  };

  const removeBranch = (index) => {
    if (branchList.length > 1) {
      setBranchList(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateBranch = (index, field, value) => {
    setBranchList(prev => prev.map((branch, i) => 
      i === index ? { ...branch, [field]: value } : branch
    ));
  };

  const generateOrgCode = (name) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 20);
  };

  const handleMobileChange = (e) => {
      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, contact_number: value }));
      
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.contact_number;
        return newErrors;
      });
      
      if (value.length === 10) {
        checkDuplicate('contact_number', value);
      }
  };

  const handleSubmit = async (e, shouldApprove = false) => {
    e.preventDefault();
    
    // Prevent re-approval of already approved requests
    if (shouldApprove && requestStatus === 'approved') {
        toast({ variant: "destructive", title: "Already Approved", description: "This request has already been approved." });
        navigate('/master-admin/school-requests');
        return;
    }
    
    if (shouldApprove && !selectedPlanId) {
        toast({ variant: "destructive", title: "Validation Error", description: "Please select a subscription plan to approve." });
        return;
    }

    if (password && password !== retypePassword) {
        toast({ variant: "destructive", title: "Password Mismatch", description: "Passwords do not match." });
        return;
    }

    if (!formData.board) {
      toast({ variant: "destructive", title: "Validation Error", description: "Board Affiliation is required." });
      return;
    }

    if (formData.registration_type === 'organization_multi_branch') {
        const missingBranchBoard = branchList.some(b => !b.board);
        if (missingBranchBoard) {
            toast({ variant: "destructive", title: "Validation Error", description: "Board Affiliation is required for all branches." });
            return;
        }
    }

    // Validate Session Assignment (Required for Approval)
    if (shouldApprove) {
        // Check Primary Branch Session
        if (!branchSessions[0] || !branchSessions[0].name) {
            toast({ variant: "destructive", title: "Validation Error", description: "Initial Academic Session is required for Primary Branch." });
            return;
        }

        // Check Additional Branches Sessions
        if (formData.registration_type === 'organization_multi_branch') {
            for (let i = 1; i < branchList.length; i++) {
                if (!branchSessions[i] || !branchSessions[i].name) {
                    toast({ variant: "destructive", title: "Validation Error", description: `Initial Academic Session is required for Branch-${i + 1}.` });
                    return;
                }
            }
        }
    }

    // Skip duplicate validation if request is already approved (to allow updates)
    if (requestStatus !== 'approved') {
      const emailDuplicate = formData.owner_email ? await checkDuplicate('owner_email', formData.owner_email) : false;
      const mobileDuplicate = (formData.owner_mobile && formData.owner_mobile.length === 10) 
        ? await checkDuplicate('owner_mobile', formData.owner_mobile)
        : false;
      const slugDuplicate = formData.slug ? await checkDuplicate('slug', formData.slug) : false;
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (emailDuplicate || mobileDuplicate || slugDuplicate) {
        toast({ variant: "destructive", title: "Validation Error", description: "Please fix duplicate fields." });
        return;
      }
    }

    setLoading(true);

    try {
      const organizationData = {
        name: formData.registration_type === 'single_school' 
          ? formData.school_name 
          : (formData.organization_name || formData.school_name),
        code: formData.registration_type === 'single_school'
          ? generateOrgCode(formData.school_name)
          : (formData.organization_code || generateOrgCode(formData.organization_name || formData.school_name))
      };

      let branchData = [];
      if (formData.registration_type === 'organization_multi_branch') {
        const primaryBranch = {
            name: formData.school_name,
            board: formData.board,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            sequence: 1,
            is_primary: true,
            session: branchSessions[0] || null // Attach session
        };

        const secondaryBranches = branchList.slice(1).map((branch, index) => ({
          name: branch.name || `Branch ${index + 2}`,
          board: branch.board,
          address: null,
          city: null,
          state: null,
          pincode: null,
          sequence: index + 2,
          is_primary: false,
          session: branchSessions[index + 1] || null // Attach session (offset by 1 because slice(1))
        }));

        branchData = [primaryBranch, ...secondaryBranches];
      } else {
        branchData = [{
          name: formData.school_name,
          board: formData.board,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          sequence: 1,
          is_primary: true,
          session: branchSessions[0] || null // Attach session
        }];
      }
      
      const metadataJson = JSON.stringify({
        organization: organizationData,
        branches: branchData
      });
      
      // If password changed, update it in notes, else keep existing logic (or fetch old notes and replace)
      // Since we don't have the old password, if user leaves it blank, we assume they don't want to change it.
      // But we need to preserve the old password if it was in the notes.
      // For simplicity, if password is provided, we update it. If not, we try to preserve it from the fetch.
      // However, we don't have the old password in state (security).
      // We will fetch the current notes again to preserve the password if not changed.
      
      let finalNotes = formData.notes;
      let finalPassword = password;

      if (!password) {
          // Fetch current notes to preserve password
          const { data: currentData } = await supabase.from('school_requests').select('notes').eq('id', id).single();
          if (currentData?.notes && currentData.notes.includes('||PWD:')) {
              const parts = currentData.notes.split('||PWD:');
              const pwdPart = parts[1].split('||')[0]; // Assuming format notes||PWD:pass||ORG...
              finalPassword = pwdPart;
          }
      }

      const notesWithPassword = `${formData.notes || ''}||PWD:${finalPassword || ''}||ORG_BRANCH_DATA:${metadataJson}`;

      const { error: updateError } = await supabase
        .from('school_requests')
        .update({
            school_name: formData.school_name,
            slug: formData.slug,
            board: formData.board,
            contact_number: formData.contact_number,
            contact_email: formData.contact_email,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            post_office: formData.post_office,
            owner_name: formData.owner_name,
            owner_email: formData.owner_email,
            owner_mobile: formData.owner_mobile,
            registration_type: formData.registration_type,
            notes: notesWithPassword
        })
        .eq('id', id);

      if (updateError) throw updateError;

      if (shouldApprove) {
          // Call backend approval endpoint
          const result = await apiClient.post('/admin/approve-request', {
              requestId: id,
              planId: selectedPlanId
          });
          
          toast({ title: "? Success", description: result.message || "Request updated and approved successfully." });
      } else {
          toast({ title: "Success", description: "Request updated successfully." });
      }
      
      navigate('/master-admin/school-requests');

    } catch (error) {
      console.error("Update error:", error);
      
      // Extract detailed error information from backend response
      const errorData = error.response?.data || {};
      const errorMessage = errorData.message || error.message || 'Unknown error occurred';
      const errorHint = errorData.hint || '';
      const failedAt = errorData.failedAt || '';
      const technicalError = errorData.error || '';
      
      // Show detailed error toast
      toast({ 
          variant: "destructive", 
          title: "? Approval Failed - ???????", 
          description: (
              <div className="space-y-2">
                  <p className="font-semibold">{errorMessage}</p>
                  {technicalError && <p className="text-sm opacity-90">???: {technicalError}</p>}
                  {failedAt && <p className="text-sm opacity-90">????: {failedAt}</p>}
                  {errorHint && <p className="text-xs opacity-75 mt-1">{errorHint}</p>}
              </div>
          ),
          duration: 10000 // Show for 10 seconds
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
      return <DashboardLayout><div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-10">
        
        {/* Header Section with Gradient */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white shadow-lg">
            <div className="relative z-10 flex items-center gap-4">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => navigate('/master-admin/school-requests')}
                    className="text-white hover:bg-white/20 hover:text-white"
                >
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit School Request</h1>
                    <p className="text-indigo-100 mt-1">Update registration details for <span className="font-semibold text-white">{formData.school_name}</span></p>
                </div>
            </div>
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
          
          {/* Registration Type Card */}
          <Card className="border-t-4 border-t-indigo-500 shadow-md dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
                <CardTitle className="flex items-center text-xl text-indigo-700 dark:text-indigo-400">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3">
                        <School className="h-6 w-6" />
                    </div>
                    Registration Type
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['organization', 'organization_multi_branch'].map(type => (
                      <div 
                        key={type}
                        onClick={() => handleValueChange('registration_type', type)}
                        className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                          formData.registration_type === type 
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-500' 
                            : 'border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 dark:bg-slate-950'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                              formData.registration_type === type ? 'border-indigo-600 bg-indigo-600' : 'border-gray-400'
                          }`}>
                              {formData.registration_type === type && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
                          </div>
                          <label className="font-semibold capitalize text-gray-900 dark:text-white cursor-pointer">
                              {type.replace(/_/g, ' ')}
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-400 ml-8">
                            {type === 'single_school' ? 'One standalone campus' : 
                             type === 'organization' ? 'Central org structure' : 'Org with multiple campuses'}
                        </p>
                      </div>
                  ))}
                </div>
            </CardContent>
          </Card>

          {/* Organization Details (Conditional) */}
          {(formData.registration_type === 'organization' || formData.registration_type === 'organization_multi_branch') && (
            <Card className="border-t-4 border-t-purple-500 shadow-md dark:bg-slate-900 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-purple-700 dark:text-purple-400">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-3">
                        <Building2 className="h-6 w-6" />
                    </div>
                    Organization Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="organization_name" className="dark:text-slate-300">Organization Name <span className="text-red-500">*</span></Label>
                      <Input 
                        id="organization_name" 
                        name="organization_name" 
                        required 
                        value={formData.organization_name} 
                        onChange={handleInputChange}
                        className="dark:bg-slate-950 dark:border-slate-700"
                      />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="contact_number" className="dark:text-slate-300">Official Contact Number <span className="text-red-500">*</span></Label>
                        <div className="flex">
                            <div className="flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium bg-gray-100 border border-gray-300 rounded-l-lg dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                                {countryCode}
                            </div>
                            <Input 
                                id="contact_number" 
                                name="contact_number" 
                                required 
                                value={formData.contact_number} 
                                onChange={handleMobileChange} 
                                className="rounded-l-none dark:bg-slate-950 dark:border-slate-700"
                                maxLength={10}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contact_email" className="dark:text-slate-300">Official Email <span className="text-red-500">*</span></Label>
                        <Input 
                            id="contact_email" 
                            name="contact_email" 
                            type="email" 
                            required 
                            value={formData.contact_email} 
                            onChange={handleInputChange} 
                            className="dark:bg-slate-950 dark:border-slate-700"
                        />
                    </div>
                  </div>
              </CardContent>
            </Card>
          )}

          {/* Location */}
          <Card className="border-t-4 border-t-emerald-500 shadow-md dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
                <CardTitle className="flex items-center text-xl text-emerald-700 dark:text-emerald-400">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg mr-3">
                        <MapPin className="h-6 w-6" />
                    </div>
                    Location Details
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                    <Label htmlFor="pincode" className="dark:text-slate-300">Pincode <span className="text-red-500">*</span></Label>
                    <div className="relative">
                        <Input 
                            id="pincode" 
                            name="pincode" 
                            required 
                            value={formData.pincode} 
                            onChange={handlePincodeChange} 
                            maxLength={6} 
                            className="dark:bg-slate-950 dark:border-slate-700"
                        />
                        {pincodeLoading && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-emerald-600" />}
                    </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="post_office" className="dark:text-slate-300">Area / Post Office <span className="text-red-500">*</span></Label>
                        <Select name="post_office" value={formData.post_office} onValueChange={handlePostOfficeChange}>
                            <SelectTrigger className="dark:bg-slate-950 dark:border-slate-700">
                                <SelectValue placeholder={postOffices.length === 0 ? formData.post_office || "Enter Pincode" : "Select Area"} />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                                {postOffices.map((po, idx) => (
                                    <SelectItem key={`${po.Name}-${idx}`} value={po.Name}>{po.Name}</SelectItem>
                                ))}
                                {formData.post_office && !postOffices.find(p => p.Name === formData.post_office) && (
                                    <SelectItem value={formData.post_office}>{formData.post_office}</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                    <Label htmlFor="city" className="dark:text-slate-300">City</Label>
                    <Input id="city" name="city" value={formData.city} readOnly className="bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400" />
                    </div>

                    <div className="space-y-2">
                    <Label htmlFor="state" className="dark:text-slate-300">State</Label>
                    <Input id="state" name="state" value={formData.state} readOnly className="bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400" />
                    </div>
                </div>
                <div className="mt-4 space-y-2">
                    <Label htmlFor="address" className="dark:text-slate-300">Full Address</Label>
                    <Input 
                        id="address" 
                        name="address" 
                        value={formData.address} 
                        onChange={handleInputChange} 
                        className="dark:bg-slate-950 dark:border-slate-700"
                    />
                </div>
            </CardContent>
          </Card>

          {/* School Details */}
          <Card className="border-t-4 border-t-blue-500 shadow-md dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
                <CardTitle className="flex items-center text-xl text-blue-700 dark:text-blue-400">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                        {formData.registration_type === 'organization_multi_branch' ? <GitBranch className="h-6 w-6" /> : <School className="h-6 w-6" />}
                    </div>
                    {formData.registration_type === 'organization_multi_branch' ? 'Primary Branch (Branch-1)' : 'School Information'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="school_name" className="dark:text-slate-300">
                      {formData.registration_type === 'single_school' ? 'School Name' : 'Branch Name'} 
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="school_name" 
                      name="school_name" 
                      required 
                      value={formData.school_name} 
                      onChange={handleInputChange} 
                      className="dark:bg-slate-950 dark:border-slate-700"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="board" className="dark:text-slate-300">Board Affiliation <span className="text-red-500">*</span></Label>
                    <Select 
                      name="board" 
                      value={formData.board} 
                      onValueChange={(v) => handleValueChange('board', v)} 
                    >
                      <SelectTrigger className="dark:bg-slate-950 dark:border-slate-700">
                        <SelectValue placeholder="Select Board" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] dark:bg-slate-900 dark:border-slate-800">
                        {boardOptions.length > 0 ? (
                            <>
                                {['School Boards (Up to 10th)', 'PUC / 12th Boards', 'Degree / Higher Education', 'Other'].map((category, idx) => {
                                    const items = boardOptions.filter(b => b.category === category);
                                    if (items.length === 0) return null;
                                    
                                    return (
                                        <React.Fragment key={idx}>
                                            <div className={`px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 ${idx > 0 ? 'border-t dark:border-slate-700 mt-1' : ''}`}>
                                                {category}
                                            </div>
                                            {items.map((item, i) => (
                                                <SelectItem key={`${idx}-${i}`} value={item.value}>{item.name}</SelectItem>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </>
                        ) : (
                            <SelectItem value="Other">Other</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.registration_type === 'single_school' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="contact_number" className="dark:text-slate-300">Contact Number <span className="text-red-500">*</span></Label>
                        <div className="flex">
                            <div className="flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium bg-gray-100 border border-gray-300 rounded-l-lg dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                                {countryCode}
                            </div>
                            <Input 
                                id="contact_number" 
                                name="contact_number" 
                                required 
                                value={formData.contact_number} 
                                onChange={handleMobileChange} 
                                className="rounded-l-none dark:bg-slate-950 dark:border-slate-700"
                                maxLength={10}
                            />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contact_email" className="dark:text-slate-300">Contact Email <span className="text-red-500">*</span></Label>
                        <Input 
                            id="contact_email" 
                            name="contact_email" 
                            type="email" 
                            required 
                            value={formData.contact_email} 
                            onChange={handleInputChange} 
                            className="dark:bg-slate-950 dark:border-slate-700"
                        />
                      </div>
                    </>
                  )}
                </div>
            </CardContent>
          </Card>

          {/* Owner */}
          <Card className="border-t-4 border-t-amber-500 shadow-md dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
                <CardTitle className="flex items-center text-xl text-amber-700 dark:text-amber-400">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg mr-3">
                        <User className="h-6 w-6" />
                    </div>
                    Owner Details
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                    <Label htmlFor="owner_name" className="dark:text-slate-300">Owner Name <span className="text-red-500">*</span></Label>
                    <Input 
                        id="owner_name" 
                        name="owner_name" 
                        required 
                        value={formData.owner_name} 
                        readOnly
                        className="bg-gray-100 dark:bg-slate-800 dark:border-slate-700 cursor-not-allowed text-gray-500"
                    />
                    </div>

                    <div className="space-y-2">
                    <Label htmlFor="owner_email" className="dark:text-slate-300">Owner Email <span className="text-red-500">*</span></Label>
                    <div className="relative">
                        <Input 
                            id="owner_email" 
                            name="owner_email" 
                            type="email" 
                            required 
                            value={formData.owner_email} 
                            readOnly
                            className="bg-gray-100 dark:bg-slate-800 dark:border-slate-700 cursor-not-allowed text-gray-500"
                        />
                    </div>
                    </div>

                    <div className="space-y-2">
                    <Label htmlFor="owner_mobile" className="dark:text-slate-300">Owner Mobile <span className="text-red-500">*</span></Label>
                    <div className="relative">
                        <Input 
                            id="owner_mobile" 
                            name="owner_mobile" 
                            required 
                            value={formData.owner_mobile} 
                            readOnly
                            className="bg-gray-100 dark:bg-slate-800 dark:border-slate-700 cursor-not-allowed text-gray-500"
                        />
                    </div>
                    </div>

                    <div className="space-y-2">
                    <Label htmlFor="slug" className="dark:text-slate-300">URL Code (Slug) <span className="text-red-500">*</span></Label>
                    <div className="relative">
                        <Input 
                            id="slug" 
                            name="slug" 
                            required 
                            value={formData.slug} 
                            onChange={(e) => {
                                const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                handleValueChange('slug', val);
                            }} 
                            onBlur={() => {
                                if (formData.slug) checkDuplicate('slug', formData.slug);
                            }}
                            className={`dark:bg-slate-950 dark:border-slate-700 ${errors.slug ? "border-red-500" : ""}`}
                        />
                        {isCheckingSlug && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-amber-600" />}
                    </div>
                    {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug}</p>}
                    </div>
                </div>
            </CardContent>
          </Card>

          {/* Additional Branches Section (for multi-branch) */}
          {formData.registration_type === 'organization_multi_branch' && (
            <Card className="border-t-4 border-t-cyan-500 shadow-md dark:bg-slate-900 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-cyan-700 dark:text-cyan-400">
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg mr-3">
                        <GitBranch className="h-6 w-6" />
                    </div>
                    Additional Branches
                </CardTitle>
                <CardDescription className="dark:text-slate-400">
                    Add your additional branches below. The primary branch (Branch-1) details are already filled above.
                </CardDescription>
              </CardHeader>
              <CardContent>
                  {branchList.slice(1).map((branch, index) => (
                    <div key={index + 1} className="mb-4 p-4 border rounded-lg dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Branch-{index + 2}
                        </h4>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeBranch(index + 1)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="dark:text-slate-300">Branch Name <span className="text-red-500">*</span></Label>
                          <Input 
                            value={branch.name}
                            onChange={(e) => updateBranch(index + 1, 'name', e.target.value)}
                            placeholder="e.g. PU College Campus"
                            className="dark:bg-slate-950 dark:border-slate-700"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="dark:text-slate-300">Board/Type</Label>
                          <Select 
                            value={branch.board} 
                            onValueChange={(v) => updateBranch(index + 1, 'board', v)}
                          >
                            <SelectTrigger className="dark:bg-slate-950 dark:border-slate-700">
                              <SelectValue placeholder="Select Board" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px] dark:bg-slate-900 dark:border-slate-800">
                              {boardOptions.length > 0 ? (
                                  <>
                                      {['School Boards (Up to 10th)', 'PUC / 12th Boards', 'Degree / Higher Education', 'Other'].map((category, idx) => {
                                          const items = boardOptions.filter(b => b.category === category);
                                          if (items.length === 0) return null;
                                          
                                          return (
                                              <React.Fragment key={idx}>
                                                  <div className={`px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 ${idx > 0 ? 'border-t dark:border-slate-700 mt-1' : ''}`}>
                                                      {category}
                                                  </div>
                                                  {items.map((item, i) => (
                                                      <SelectItem key={`${idx}-${i}`} value={item.value}>{item.name}</SelectItem>
                                                  ))}
                                              </React.Fragment>
                                          );
                                      })}
                                  </>
                              ) : (
                                  <SelectItem value="Other">Other</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addBranch}
                    className="w-full mt-2 border-dashed border-2 dark:border-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Another Branch
                  </Button>
              </CardContent>
            </Card>
          )}

          {/* Subscription Plan (For Approval) */}
          <Card className="border-t-4 border-t-green-500 shadow-md dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
                <CardTitle className="flex items-center text-xl text-green-700 dark:text-green-400">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                        <Layers className="h-6 w-6" />
                    </div>
                    Subscription Plan (Required for Approval)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="plan" className="dark:text-slate-300">Select Plan</Label>
                        <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                            <SelectTrigger className="dark:bg-slate-950 dark:border-slate-700">
                                <SelectValue placeholder="Choose a plan" />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                                {plans.map((plan) => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                        {plan.name} ({plan.plan_type})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">Select a plan to enable the "Save & Approve" button.</p>
                    </div>

                    {selectedPlanId && (() => {
                        const plan = plans.find(p => p.id === selectedPlanId);
                        if (!plan) return null;
                        return (
                            <div className="mt-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700">
                                <h4 className="font-semibold text-lg mb-2 text-slate-900 dark:text-white">{plan.name} <span className="text-sm font-normal text-slate-500">({plan.tagline})</span></h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-slate-500 dark:text-slate-400">Plan Type</p>
                                        <p className="font-medium dark:text-slate-200">{plan.plan_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 dark:text-slate-400">Duration</p>
                                        <p className="font-medium dark:text-slate-200">{plan.duration_months} Months</p>
                                    </div>
                                    {plan.plan_type === 'Postpaid' ? (
                                        <>
                                            <div>
                                                <p className="text-slate-500 dark:text-slate-400">Per Student Charge</p>
                                                <p className="font-medium dark:text-slate-200">₹{plan.per_student_charge}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 dark:text-slate-400">Per Staff Charge</p>
                                                <p className="font-medium dark:text-slate-200">₹{plan.per_staff_charge}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <div>
                                            <p className="text-slate-500 dark:text-slate-400">Price</p>
                                            <p className="font-medium dark:text-slate-200">₹{plan.price}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-slate-500 dark:text-slate-400">GST</p>
                                        <p className="font-medium dark:text-slate-200">{plan.gst_percentage}%</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 dark:text-slate-400">Max Branches</p>
                                        <p className="font-medium dark:text-slate-200">{plan.max_branches_allowed}</p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <p className="text-slate-500 dark:text-slate-400 mb-1">Modules Included ({plan.modules?.length || 0})</p>
                                    <div className="flex flex-wrap gap-1">
                                        {plan.modules?.map((mod, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded text-xs capitalize">
                                                {mod.replace(/_/g, ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </CardContent>
          </Card>

          {/* Initial Academic Session */}
          <Card className="border-t-4 border-t-indigo-500 shadow-md dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
                <CardTitle className="flex items-center text-xl text-indigo-700 dark:text-indigo-400">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3">
                        <Calendar className="h-6 w-6" />
                    </div>
                    Initial Academic Session
                </CardTitle>
                <CardDescription>
                    Set the first academic session for each branch. This will be created and activated automatically upon approval.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Primary Branch Session */}
                <div className="p-4 border rounded-lg bg-gray-50 dark:bg-slate-800/50 dark:border-slate-700">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <School className="h-4 w-4 text-indigo-500" />
                        Primary Branch: {formData.school_name || 'Main Campus'}
                    </h4>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="dark:text-slate-300">Select Template</Label>
                            <Select 
                                onValueChange={(val) => {
                                    const template = sessionTemplates[parseInt(val)];
                                    if (template) {
                                        setBranchSessions(prev => ({
                                            ...prev,
                                            0: {
                                                name: template.name,
                                                startDate: template.startDate,
                                                endDate: template.endDate
                                            }
                                        }));
                                    }
                                }}
                            >
                                <SelectTrigger className="dark:bg-slate-950 dark:border-slate-700">
                                    <SelectValue placeholder="Choose a template..." />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                                    {sessionTemplates.map((t, idx) => (
                                        <SelectItem key={idx} value={idx.toString()}>
                                            {t.type ? `[${t.type}] ` : ''}{t.name} ({t.startDate} to {t.endDate})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="dark:text-slate-300">Session Name <span className="text-red-500">*</span></Label>
                                <Input 
                                    value={branchSessions[0]?.name || ''}
                                    onChange={(e) => setBranchSessions(prev => ({
                                        ...prev,
                                        0: { ...prev[0], name: e.target.value }
                                    }))}
                                    placeholder="2025-2026"
                                    className="dark:bg-slate-950 dark:border-slate-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="dark:text-slate-300">Start Date <span className="text-red-500">*</span></Label>
                                <Input 
                                    type="date"
                                    value={branchSessions[0]?.startDate || ''}
                                    onChange={(e) => setBranchSessions(prev => ({
                                        ...prev,
                                        0: { ...prev[0], startDate: e.target.value }
                                    }))}
                                    className="dark:bg-slate-950 dark:border-slate-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="dark:text-slate-300">End Date <span className="text-red-500">*</span></Label>
                                <Input 
                                    type="date"
                                    value={branchSessions[0]?.endDate || ''}
                                    onChange={(e) => setBranchSessions(prev => ({
                                        ...prev,
                                        0: { ...prev[0], endDate: e.target.value }
                                    }))}
                                    className="dark:bg-slate-950 dark:border-slate-700"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Branches Sessions */}
                {formData.registration_type === 'organization_multi_branch' && branchList.slice(1).map((branch, index) => {
                    const branchIdx = index + 1;
                    return (
                        <div key={branchIdx} className="p-4 border rounded-lg bg-gray-50 dark:bg-slate-800/50 dark:border-slate-700">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <GitBranch className="h-4 w-4 text-cyan-500" />
                                Additional Branch: {branch.name || `Branch ${branchIdx + 1}`}
                            </h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="dark:text-slate-300">Select Template</Label>
                                    <Select 
                                        onValueChange={(val) => {
                                            const template = sessionTemplates[parseInt(val)];
                                            if (template) {
                                                setBranchSessions(prev => ({
                                                    ...prev,
                                                    [branchIdx]: {
                                                        name: template.name,
                                                        startDate: template.startDate,
                                                        endDate: template.endDate
                                                    }
                                                }));
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="dark:bg-slate-950 dark:border-slate-700">
                                            <SelectValue placeholder="Choose a template..." />
                                        </SelectTrigger>
                                        <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                                            {sessionTemplates.map((t, idx) => (
                                                <SelectItem key={idx} value={idx.toString()}>
                                                    {t.type ? `[${t.type}] ` : ''}{t.name} ({t.startDate} to {t.endDate})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label className="dark:text-slate-300">Session Name <span className="text-red-500">*</span></Label>
                                        <Input 
                                            value={branchSessions[branchIdx]?.name || ''}
                                            onChange={(e) => setBranchSessions(prev => ({
                                                ...prev,
                                                [branchIdx]: { ...prev[branchIdx], name: e.target.value }
                                            }))}
                                            placeholder="2025-2026"
                                            className="dark:bg-slate-950 dark:border-slate-700"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="dark:text-slate-300">Start Date <span className="text-red-500">*</span></Label>
                                        <Input 
                                            type="date"
                                            value={branchSessions[branchIdx]?.startDate || ''}
                                            onChange={(e) => setBranchSessions(prev => ({
                                                ...prev,
                                                [branchIdx]: { ...prev[branchIdx], startDate: e.target.value }
                                            }))}
                                            className="dark:bg-slate-950 dark:border-slate-700"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="dark:text-slate-300">End Date <span className="text-red-500">*</span></Label>
                                        <Input 
                                            type="date"
                                            value={branchSessions[branchIdx]?.endDate || ''}
                                            onChange={(e) => setBranchSessions(prev => ({
                                                ...prev,
                                                [branchIdx]: { ...prev[branchIdx], endDate: e.target.value }
                                            }))}
                                            className="dark:bg-slate-950 dark:border-slate-700"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/master-admin/school-requests')}
                className="px-6 py-6 text-base dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                  Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="px-8 py-6 text-base bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-[1.02]"
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                Update Request
              </Button>
              <Button 
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading || !selectedPlanId}
                className="px-8 py-6 text-base bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 dark:shadow-none transition-all hover:scale-[1.02]"
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" />}
                Save & Approve
              </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EditSchoolRequest;

