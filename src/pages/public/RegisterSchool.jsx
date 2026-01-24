import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, School, MapPin, Phone, Mail, User, Lock, Globe, FileText, Eye, EyeOff, Building2, Plus, Trash2, GitBranch } from 'lucide-react';
import { HomepageHeader } from '@/components/homepage/Header';
import Footer from '@/components/homepage/Footer';

const RegisterSchool = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [postOffices, setPostOffices] = useState([]);
  const [errors, setErrors] = useState({});
  const [countryCode, setCountryCode] = useState('+91');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingMobile, setIsCheckingMobile] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [isGeneratingOrgCode, setIsGeneratingOrgCode] = useState(false);
  const [orgCodeGenerated, setOrgCodeGenerated] = useState(false);
  
  const [retypePassword, setRetypePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [cmsContent, setCmsContent] = useState(null);
  const [boardOptions, setBoardOptions] = useState([]);

  useEffect(() => {
    const fetchCmsContent = async () => {
      try {
        // Always use relative /api path - Vercel rewrites to backend
        const apiBase = '/api';
        const response = await fetch(`${apiBase}/public/saas/homepage`);
        if (response.ok) {
          const payload = await response.json();
          if (payload.success && payload.data?.settings) {
            setCmsContent(payload.data.settings);
          }
        }
      } catch (error) {
        console.error('Failed to fetch CMS content:', error);
      }
    };
    
    const fetchBoardOptions = async () => {
        try {
            // Always use relative /api path
            const apiBase = '/api';
            const response = await fetch(`${apiBase}/public/saas/boards`);
            if (response.ok) {
                const payload = await response.json();
                if (payload.success && Array.isArray(payload.data)) {
                    setBoardOptions(payload.data);
                }
            }
        } catch (err) {
            console.error("Error fetching board options:", err);
        }
    };

    fetchCmsContent();
    fetchBoardOptions();
  }, []);

  // Branch list for multi-branch registration
  const [branchList, setBranchList] = useState([
    { name: '', board: '' }
  ]);

  const [formData, setFormData] = useState({
    registration_type: 'organization', // 'organization', 'organization_multi_branch'
    // Organization fields
    organization_name: '',
    // School/Branch fields (for single school, this is the main branch)
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
    password: '',
    post_office: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-generate slug from organization name
    if (name === 'organization_name') {
        const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        setFormData(prev => ({ ...prev, [name]: value, slug }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Real-time validation for email and mobile
    if (name === 'owner_email' && value) {
      // Clear previous error
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.owner_email;
        return newErrors;
      });
      // Check duplicate after user stops typing
      const timeout = setTimeout(() => {
        if (value.includes('@')) {
          checkDuplicate('owner_email', value);
        }
      }, 1000);
      return () => clearTimeout(timeout);
    }
  };

  const handleValueChange = async (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const checkDuplicate = async (field, value) => {
    if (!value) return false;
    
    try {
      if (field === 'owner_email') {
        setIsCheckingEmail(true);
        
        // Check in school_requests (pending requests)
        const { data: request } = await supabase
          .from('school_requests')
          .select('id')
          .eq('owner_email', value)
          .neq('status', 'rejected')
          .maybeSingle();
        
        if (request) {
          setErrors(prev => ({ ...prev, owner_email: 'This email is already used in a pending registration request.' }));
          setIsCheckingEmail(false);
          return true; // Duplicate found
        }

        // Also check in profiles (already registered users)
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', value)
          .maybeSingle();

        if (profile) {
          setErrors(prev => ({ ...prev, owner_email: 'This email address is already registered. Please use a different email.' }));
          setIsCheckingEmail(false);
          return true; // Duplicate found
        }
        
        // Check if email format is valid
        if (!/^\S+@\S+\.\S+$/.test(value)) {
          setErrors(prev => ({ ...prev, owner_email: 'Please enter a valid email address.' }));
          setIsCheckingEmail(false);
          return false;
        }
        
        // Clear error if valid and not duplicate
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.owner_email;
          return newErrors;
        });
        setIsCheckingEmail(false);
        return false; // No duplicate
      } else if (field === 'owner_mobile' || field === 'contact_number') {
        setIsCheckingMobile(true);
        const mobileToCheck = value.replace(/\D/g, '');
        
        if (mobileToCheck.length === 10) {
          // Check in school_requests (pending requests)
          const { data: request } = await supabase
            .from('school_requests')
            .select('id')
            .or(`owner_mobile.eq.${mobileToCheck},contact_number.eq.${mobileToCheck}`)
            .neq('status', 'rejected')
            .maybeSingle();
          
          if (request) {
            setErrors(prev => ({ 
              ...prev, 
              owner_mobile: 'This mobile number is already used in a pending registration request.',
              contact_number: 'This mobile number is already used in a pending registration request.'
            }));
            setIsCheckingMobile(false);
            return true; // Duplicate found
          }
          
          // Also check in users table
          const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('mobile', mobileToCheck)
            .maybeSingle();
          
          if (user) {
            setErrors(prev => ({ 
              ...prev, 
              owner_mobile: 'This mobile number is already registered.',
              contact_number: 'This mobile number is already registered.'
            }));
            setIsCheckingMobile(false);
            return true; // Duplicate found
          }

          // Also check in profiles table
          const { data: mobileProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('phone', mobileToCheck)
            .maybeSingle();

          if (mobileProfile) {
            setErrors(prev => ({ 
              ...prev, 
              owner_mobile: 'This mobile number is already registered.',
              contact_number: 'This mobile number is already registered.'
            }));
            setIsCheckingMobile(false);
            return true; // Duplicate found
          }
          
          // Clear error if not duplicate
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.owner_mobile;
            delete newErrors.contact_number;
            return newErrors;
          });
          setIsCheckingMobile(false);
          return false; // No duplicate
        } else if (mobileToCheck.length > 0 && mobileToCheck.length < 10) {
          // Don't show error while typing, only when complete
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

        // Check in school_requests
        const { data: request } = await supabase
          .from('school_requests')
          .select('id')
          .eq('slug', slugToCheck)
          .neq('status', 'rejected')
          .maybeSingle();

        if (request) {
          setErrors(prev => ({ ...prev, slug: 'This URL code is already taken by a pending request.' }));
          setIsCheckingSlug(false);
          return true;
        }

        // Check in schools table
        const { data: school } = await supabase
          .from('schools')
          .select('id')
          .eq('slug', slugToCheck)
          .maybeSingle();

        if (school) {
          setErrors(prev => ({ ...prev, slug: 'This URL code is already taken.' }));
          setIsCheckingSlug(false);
          return true;
        }

        // Clear error
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

  // Auto-generate organization code on mount if registration type is organization
  // Removed as per requirement - code will be generated on backend approval

  const handlePincodeChange = useCallback(async (e) => {
    const pincode = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, pincode, city: '', state: '', post_office: '' }));
    setPostOffices([]);
    
    if (pincode.length === 6) {
      setPincodeLoading(true);
      try {
        // Prefer backend proxy to avoid CORS/rate-limit issues in production.
        // NOTE: On some hosts, "/api" may be routed to the SPA (HTML). If so, we must fall back.
        try {
          const proxyResponse = await fetch(`/api/address/pincode/${pincode}`);
          const contentType = proxyResponse.headers.get('content-type') || '';

          if (proxyResponse.ok && contentType.includes('application/json')) {
            const proxyData = await proxyResponse.json();

            if (proxyData?.found && Array.isArray(proxyData.postOffices)) {
              // Normalize to India Post API shape used by this page.
              const offices = proxyData.postOffices.map((po) => ({
                Name: po.name,
                District: po.city,
                State: po.state,
              }));

              setPostOffices(offices);
              if (offices.length > 0) {
                setFormData(prev => ({
                  ...prev,
                  city: offices[0].District,
                  state: offices[0].State,
                  // If only one option, auto-select it.
                  post_office: offices.length === 1 ? offices[0].Name : '',
                  pincode
                }));
              }
              return;
            }
          }
        } catch (_) {
          // ignore proxy failure; fall back to public APIs
        }

        // Fallback: direct external API call
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
            return;
          }
        }

        // Last fallback: Zippopotam.us (gives state + place name)
        try {
          const response = await fetch(`https://api.zippopotam.us/in/${pincode}`);
          if (response.ok) {
            const zipData = await response.json();
            if (zipData?.places?.length > 0) {
              const place = zipData.places[0];
              const city = place['place name'] || '';
              const state = place['state'] || '';

              setPostOffices(zipData.places.map(p => ({
                Name: p['place name'],
                District: p['place name'],
                State: p['state']
              })));

              setFormData(prev => ({
                ...prev,
                city,
                state,
                post_office: city,
                pincode
              }));
              return;
            }
          }
        } catch (_) {
          // ignore
        }

        toast({ variant: "destructive", title: "Invalid Pincode", description: "Could not fetch details for this pincode." });
      } catch (error) {
        console.error("Pincode fetch error", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to fetch pincode details." });
      } finally {
        setPincodeLoading(false);
      }
    }
  }, [toast]);

  const handlePostOfficeChange = (value) => {
      setFormData(prev => ({ ...prev, post_office: value }));
      // Optionally update city/state if different post offices have different districts (rare but possible)
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

  // Branch list management for multi-branch registration
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


  const handleMobileChange = (e) => {
      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, contact_number: value }));
      
      // Clear previous error
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.contact_number;
        return newErrors;
      });
      
      // Check duplicate when 10 digits entered
      if (value.length === 10) {
        checkDuplicate('contact_number', value);
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== retypePassword) {
        toast({ variant: "destructive", title: "Password Mismatch", description: "Passwords do not match." });
        return;
    }

    if (!formData.board) {
        toast({ variant: "destructive", title: "Validation Error", description: "Board Affiliation is required." });
        return;
    }

    if (formData.registration_type === 'organization_multi_branch') {
        const missingBranchBoard = branchList.slice(1).some(b => !b.board);
        if (missingBranchBoard) {
            toast({ variant: "destructive", title: "Validation Error", description: "Board Affiliation is required for all branches." });
            return;
        }
    }

    // Final duplicate check before submission - check both separately
    const emailDuplicate = formData.owner_email ? await checkDuplicate('owner_email', formData.owner_email) : false;
    const mobileDuplicate = (formData.owner_mobile && formData.owner_mobile.length === 10) 
      ? await checkDuplicate('owner_mobile', formData.owner_mobile)
      : (formData.contact_number && formData.contact_number.length === 10)
      ? await checkDuplicate('contact_number', formData.contact_number)
      : false;
    const slugDuplicate = formData.slug ? await checkDuplicate('slug', formData.slug) : false;
    
    // Wait for state updates to complete
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Get final error state from errors state
    const finalErrors = errors;
    const hasEmailErr = emailDuplicate || !!finalErrors.owner_email;
    const hasMobileErr = mobileDuplicate || !!(finalErrors.owner_mobile || finalErrors.contact_number);
    const hasSlugErr = slugDuplicate || !!finalErrors.slug;
    
    if (hasEmailErr || hasMobileErr || hasSlugErr) {
      // Show specific toast based on which fields have errors
      if (hasSlugErr) {
        toast({ 
          variant: "destructive", 
          title: "URL Code Taken", 
          description: "This URL code is already taken. Please choose a different one.",
          duration: 5000
        });
      } else if (hasEmailErr && hasMobileErr) {
        toast({ 
          variant: "destructive", 
          title: "Duplicate Information", 
          description: "Both email and mobile number are already registered. Please check the fields below.",
          duration: 5000
        });
      } else if (hasEmailErr) {
        toast({ 
          variant: "destructive", 
          title: "Email Already Registered", 
          description: "This email address is already registered. Please use a different email.",
          duration: 5000
        });
      } else if (hasMobileErr) {
        toast({ 
          variant: "destructive", 
          title: "Mobile Number Already Registered", 
          description: "This mobile number is already registered. Please use a different mobile number.",
          duration: 5000
        });
      }
      return;
    }
    
    // Check for other validation errors
    if (Object.keys(finalErrors).length > 0) {
      const errorMessages = Object.values(finalErrors).filter(Boolean);
      toast({ 
        variant: "destructive", 
        title: "Validation Error", 
        description: errorMessages[0] || "Please fix the errors in the form.",
        duration: 5000
      });
      return;
    }

    setLoading(true);

    try {
      // ✅ IMPORTANT: DO NOT create auth user here
      // Auth user will be created ONLY when Jashchar ERP team approves
      // This prevents duplicate user errors and allows rejected requests to be resubmitted

      // 1. Prepare Request Data
      // ✅ We send the password in the notes field temporarily so it can be used during approval
      const { password, ...requestData } = formData;
      
      // Prepare organization data for new model
      // Organization code will be auto-generated by backend on approval
      const organizationData = {
        name: formData.organization_name || formData.school_name,
        code: null // Will be generated by backend
      };

      // Prepare branch data
      let branchData = [];
      if (formData.registration_type === 'organization_multi_branch') {
        // Multi-branch: use branchList
        branchData = branchList.map((branch, index) => {
          if (index === 0) {
             return {
                name: formData.school_name,
                board: formData.board,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
                sequence: 1,
                is_primary: true
             };
          }
          return {
            name: branch.name || `Branch ${index + 1}`,
            board: branch.board,
            // Address details are not collected for additional branches during registration
            address: null,
            city: null,
            state: null,
            pincode: null,
            sequence: index + 1,
            is_primary: false
          };
        });
      } else {
        // Single school or organization: main branch from form
        branchData = [{
          name: formData.school_name,
          board: formData.board,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          sequence: 1,
          is_primary: true
        }];
      }
      
      // Append password and org/branch data to notes with special delimiters
      const metadataJson = JSON.stringify({
        organization: organizationData,
        branches: branchData
      });
      const notesWithPassword = `${formData.notes || ''}||PWD:${formData.password}||ORG_BRANCH_DATA:${metadataJson}`;
      
      // 2. Check if there's a rejected request with same email (allow resubmission)
      const { data: existingRequest } = await supabase
        .from('school_requests')
        .select('id, status')
        .eq('owner_email', formData.owner_email)
        .eq('status', 'rejected')
        .maybeSingle();

      // If rejected request exists, we'll update it instead of creating new one
      let requestPayload = {
        ...requestData,
        notes: notesWithPassword, // Send password in notes
        owner_mobile: formData.owner_mobile || formData.contact_number,
        owner_user_id: null, // Will be set when Jashchar ERP team approves
        status: 'pending'
      };

      let dbError;
      if (existingRequest) {
        // Update existing rejected request
        const { error: updateError } = await supabase
          .from('school_requests')
          .update({
            ...requestPayload,
            status: 'pending', // Reset to pending
            created_at: new Date().toISOString() // Update timestamp
          })
          .eq('id', existingRequest.id);
        dbError = updateError;
      } else {
        // Insert new request
        const { error: insertError } = await supabase
          .from('school_requests')
          .insert([requestPayload]);
        dbError = insertError;
      }

      if (dbError) throw dbError;

      setSubmitted(true);
      toast({ 
        title: "Registration Submitted Successfully", 
        description: "Your school registration request has been submitted. Please wait for Jashchar ERP team approval. You will be able to login after approval." 
      });
    } catch (error) {
      console.error("Registration error:", error);
      
      // Check both email and mobile separately to show specific errors
      let emailDuplicate = false;
      let mobileDuplicate = false;
      
      // Check email duplicate
      if (formData.owner_email) {
        const { data: emailRequest } = await supabase
          .from('school_requests')
          .select('id')
          .eq('owner_email', formData.owner_email)
          .neq('status', 'rejected')
          .maybeSingle();
        
        if (emailRequest) {
          emailDuplicate = true;
          setErrors(prev => ({ 
            ...prev, 
            owner_email: 'This email is already used in a pending registration request.' 
          }));
        }
      }
      
      // Check mobile duplicate
      const mobileToCheck = (formData.owner_mobile || formData.contact_number)?.replace(/\D/g, '');
      if (mobileToCheck && mobileToCheck.length === 10) {
        const { data: mobileRequest } = await supabase
          .from('school_requests')
          .select('id')
          .or(`owner_mobile.eq.${mobileToCheck},contact_number.eq.${mobileToCheck}`)
          .neq('status', 'rejected')
          .maybeSingle();
        
        if (mobileRequest) {
          mobileDuplicate = true;
          setErrors(prev => ({ 
            ...prev, 
            owner_mobile: 'This mobile number is already used in a pending registration request.',
              contact_number: 'This mobile number is already used in a pending registration request.'
          }));
        }
      }
      
      // Check Supabase Auth errors
      if (error.message?.includes('User already registered') || error.message?.includes('already registered')) {
        if (!emailDuplicate) {
          emailDuplicate = true;
          setErrors(prev => ({ 
            ...prev, 
            owner_email: 'This email address is already registered. Please use a different email or try logging in.' 
          }));
        }
      }
      
      // Show specific toast based on which fields are duplicate
      if (emailDuplicate && mobileDuplicate) {
        toast({ 
          variant: "destructive", 
          title: "Duplicate Information", 
          description: "Both email and mobile number are already registered. Please check the fields below.",
          duration: 5000
        });
      } else if (emailDuplicate) {
        toast({ 
          variant: "destructive", 
          title: "Email Already Registered", 
          description: "This email address is already registered. Please use a different email.",
          duration: 5000
        });
      } else if (mobileDuplicate) {
        toast({ 
          variant: "destructive", 
          title: "Mobile Number Already Registered", 
          description: "This mobile number is already registered. Please use a different mobile number.",
          duration: 5000
        });
      } else {
        // Handle other errors
        let errorMessage = error.message || "An error occurred. Please try again.";
        let errorTitle = "Registration Failed";
        
        if (error.message?.includes('Invalid email')) {
          errorTitle = "Invalid Email";
          errorMessage = "Please enter a valid email address.";
          setErrors(prev => ({ ...prev, owner_email: errorMessage }));
        } else if (error.message?.includes('slug') || error.message?.toLowerCase().includes('url code')) {
          errorTitle = "URL Code Already Taken";
          errorMessage = "This URL code is already in use. Please choose a different one.";
          setErrors(prev => ({ ...prev, slug: errorMessage }));
        }
        
        toast({ 
          variant: "destructive", 
          title: errorTitle, 
          description: errorMessage,
          duration: 5000
        });
      }
      
      // Don't set submitted to true - keep form data
      // Form data is already preserved in state
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950">
        <HomepageHeader settings={cmsContent} isSticky={false} />
        <div className="flex-grow flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <div className="mx-auto bg-green-100 dark:bg-green-900/30 p-3 rounded-full w-fit mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl text-green-700 dark:text-green-400">Registration Submitted Successfully!</CardTitle>
              <CardDescription className="dark:text-slate-400">
                Thank you for registering <strong>{formData.school_name}</strong> 
                {formData.registration_type === 'organization' ? ' (Organization)' : 
                 ' (Multi-Branch Organization)'}.
                <br/><br/>
                <strong className="text-amber-600 dark:text-amber-400"> ï¸ Important:</strong> Your registration is pending Jashchar ERP team approval. 
                You <strong>cannot login</strong> until your request is approved.
                <br/><br/>
                Your organization approval will be completed within <strong>24 hours</strong>. 
                Please wait for the confirmation email at {formData.contact_email}.
                {formData.registration_type === 'organization_multi_branch' && (
                  <>
                    <br/><br/>
                    <strong>Note:</strong> Our team will contact you to set up your multiple branches after approval.
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} variant="outline" className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Homepage</Button>
            </CardContent>
          </Card>
        </div>
        <Footer content={cmsContent?.footer} contact={cmsContent?.contact} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900">
      <HomepageHeader settings={cmsContent} isSticky={false} />
      <div className="flex-grow py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
        <div className="max-w-4xl w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <School className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Join Jashchar ERP</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-slate-400">Empower your institution with next-gen management tools.</p>
          </div>

          <Card className="shadow-2xl border-0 overflow-hidden rounded-2xl dark:bg-slate-900 dark:border dark:border-slate-800">
            <div className="bg-indigo-600 h-2 w-full"></div>
            <CardContent className="p-8 sm:p-10">
              <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Section 0: Registration Type */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4 border-b dark:border-slate-800 pb-2">
                  <School className="mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-400" /> Registration Type
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div 
                    onClick={() => handleValueChange('registration_type', 'organization')}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.registration_type === 'organization' 
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-500' 
                        : 'border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <input 
                        type="radio" 
                        name="registration_type" 
                        value="organization"
                        checked={formData.registration_type === 'organization'}
                        onChange={() => handleValueChange('registration_type', 'organization')}
                        className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                      />
                      <label className="font-semibold text-gray-900 dark:text-white cursor-pointer">Organization</label>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 ml-6">Register an organization (can add branches later)</p>
                  </div>

                  <div 
                    onClick={() => handleValueChange('registration_type', 'organization_multi_branch')}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.registration_type === 'organization_multi_branch' 
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-500' 
                        : 'border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <input 
                        type="radio" 
                        name="registration_type" 
                        value="organization_multi_branch"
                        checked={formData.registration_type === 'organization_multi_branch'}
                        onChange={() => handleValueChange('registration_type', 'organization_multi_branch')}
                        className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                      />
                      <label className="font-semibold text-gray-900 dark:text-white cursor-pointer">Multi-Branch Organization</label>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 ml-6">Organization with multiple school branches</p>
                  </div>
                </div>
                {formData.registration_type === 'organization' || formData.registration_type === 'organization_multi_branch' ? (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>Note:</strong> For {formData.registration_type === 'organization_multi_branch' ? 'multi-branch organizations' : 'organizations'}, 
                      you'll need a plan that supports {formData.registration_type === 'organization_multi_branch' ? 'multiple branches' : 'organization features'}. 
                      Our team will contact you after approval to set up your branches.
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Organization Details Section (for org types) */}
              {(formData.registration_type === 'organization' || formData.registration_type === 'organization_multi_branch') && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4 border-b dark:border-slate-800 pb-2">
                    <Building2 className="mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-400" /> Organization Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <Label htmlFor="organization_name" className="dark:text-slate-300">
                        Organization Name <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="organization_name" 
                        name="organization_name" 
                        required 
                        value={formData.organization_name} 
                        onChange={(e) => {
                          handleInputChange(e);
                        }}
                        placeholder="e.g. ABC Education Trust"
                        className="focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-700 dark:text-white" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contact_number" className="dark:text-slate-300">Official Contact Number <span className="text-red-500">*</span></Label>
                      <div className="flex">
                          <div className="flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center text-gray-900 bg-gray-100 border border-gray-300 rounded-l-lg hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700">
                              {countryCode}
                          </div>
                          <Input 
                              id="contact_number" 
                              name="contact_number" 
                              required 
                              value={formData.contact_number} 
                              onChange={handleMobileChange} 
                              className={`rounded-l-none dark:bg-slate-950 dark:text-white dark:border-slate-700 ${errors.contact_number ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"}`}
                              placeholder="9876543210"
                              maxLength={10}
                          />
                      </div>
                      {errors.contact_number && <p className="text-xs text-red-500 mt-1">{errors.contact_number}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_email" className="dark:text-slate-300">Official Email <span className="text-red-500">*</span></Label>
                      <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-slate-500" />
                          <Input id="contact_email" name="contact_email" type="email" required value={formData.contact_email} onChange={handleInputChange} className="pl-10 focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-700 dark:text-white" placeholder="info@school.com" />
                      </div>
                    </div>
                  </div>

                  {/* Location Details moved inside Organization Details */}
                  <h4 className="text-md font-semibold text-gray-800 dark:text-slate-200 flex items-center mb-4">
                    <MapPin className="mr-2 h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Location Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                      <Label htmlFor="pincode" className="dark:text-slate-300">Pincode <span className="text-red-500">*</span></Label>
                      <div className="relative">
                          <Input id="pincode" name="pincode" required value={formData.pincode} onChange={handlePincodeChange} maxLength={6} placeholder="Enter 6-digit Pincode" className="focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-700 dark:text-white" />
                          {pincodeLoading && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />}
                      </div>
                      </div>

                      <div className="space-y-2">
                          <Label htmlFor="post_office" className="dark:text-slate-300">Area / Post Office <span className="text-red-500">*</span></Label>
                          <Select name="post_office" value={formData.post_office} onValueChange={handlePostOfficeChange} disabled={postOffices.length === 0}>
                              <SelectTrigger className="focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-700 dark:text-white">
                                  <SelectValue placeholder={postOffices.length === 0 ? "Enter Pincode first" : "Select Area"} />
                              </SelectTrigger>
                              <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                                  {postOffices.map((po, idx) => (
                                      <SelectItem key={`${po.Name}-${idx}`} value={po.Name}>{po.Name}</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>

                      <div className="space-y-2">
                      <Label htmlFor="city" className="dark:text-slate-300">City / District</Label>
                      <Input id="city" name="city" value={formData.city} readOnly className="bg-gray-50 text-gray-500 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" />
                      </div>

                      <div className="space-y-2">
                      <Label htmlFor="state" className="dark:text-slate-300">State</Label>
                      <Input id="state" name="state" value={formData.state} readOnly className="bg-gray-50 text-gray-500 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" />
                      </div>
                  </div>
                  <div className="mt-4 space-y-2">
                      <Label htmlFor="address" className="dark:text-slate-300">Full Address <span className="text-gray-400 dark:text-slate-500 font-normal">(Optional)</span></Label>
                      <Input id="address" name="address" value={formData.address} onChange={handleInputChange} placeholder="Street, Landmark, Building No." className="focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-700 dark:text-white" />
                  </div>
                </div>
              )}

              {/* Section 1: School/Organization Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4 border-b dark:border-slate-800 pb-2">
                  {formData.registration_type === 'organization_multi_branch' ? (
                    <><GitBranch className="mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-400" /> Primary Branch (Branch-1)</>
                  ) : (
                    <><School className="mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-400" /> 
                    Main Branch Information</>
                  )}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="school_name" className="dark:text-slate-300">
                      Branch Name 
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="school_name" 
                      name="school_name" 
                      required 
                      value={formData.school_name} 
                      onChange={handleInputChange} 
                      placeholder={
                        formData.registration_type === 'organization'
                          ? "e.g. Main Campus"
                          : "e.g. CBSE School - Main Campus"
                      } 
                      className="focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-700 dark:text-white" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="board" className="dark:text-slate-300">
                      Board Affiliation 
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      name="board" 
                      value={formData.board} 
                      onValueChange={(v) => handleValueChange('board', v)}
                    >
                      <SelectTrigger className="focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-700 dark:text-white">
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
                    {(formData.registration_type === 'organization' || formData.registration_type === 'organization_multi_branch') && (
                      <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                        Board affiliation can be set at the branch level. You can leave this blank for now.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Location - Removed as it is now inside Organization Details */}
              {/* 
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4 border-b dark:border-slate-800 pb-2">
                  <MapPin className="mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-400" /> Location Details
                </h3>
                ...
              </div>
              */}

              {/* Section 3: Owner & Login */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4 border-b dark:border-slate-800 pb-2">
                  <User className="mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-400" /> Owner & Login Credentials
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                    <Label htmlFor="owner_name" className="dark:text-slate-300">Owner/Principal Name <span className="text-red-500">*</span></Label>
                    <Input id="owner_name" name="owner_name" required value={formData.owner_name} onChange={handleInputChange} className="focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-700 dark:text-white" />
                    </div>

                    <div className="space-y-2">
                    <Label htmlFor="owner_email" className="dark:text-slate-300">Owner Email (Login ID) <span className="text-red-500">*</span></Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-slate-500" />
                        <Input 
                            id="owner_email" 
                            name="owner_email" 
                            type="email" 
                            required 
                            value={formData.owner_email} 
                            onChange={handleInputChange}
                            onBlur={() => {
                              if (formData.owner_email) {
                                checkDuplicate('owner_email', formData.owner_email);
                              }
                            }}
                            className={`pl-10 pr-10 dark:bg-slate-950 dark:text-white dark:border-slate-700 ${errors.owner_email ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"}`}
                            placeholder="owner@school.com"
                        />
                        {isCheckingEmail && (
                          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                        )}
                    </div>
                    {errors.owner_email && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <span> ï¸</span> {errors.owner_email}
                      </p>
                    )}
                    </div>

                    <div className="space-y-2">
                    <Label htmlFor="owner_mobile" className="dark:text-slate-300">Owner Mobile Number (Login ID) <span className="text-red-500">*</span></Label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-slate-500" />
                        <div className="flex">
                            <div className="flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center text-gray-900 bg-gray-100 border border-gray-300 rounded-l-lg hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700">
                                {countryCode}
                            </div>
                            <Input 
                                id="owner_mobile" 
                                name="owner_mobile" 
                                type="tel" 
                                required 
                                value={formData.owner_mobile} 
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setFormData(prev => ({ ...prev, owner_mobile: value }));
                                    
                                    // Clear previous error
                                    setErrors(prev => {
                                      const newErrors = { ...prev };
                                      delete newErrors.owner_mobile;
                                      return newErrors;
                                    });
                                    
                                    // Check duplicate when 10 digits entered
                                    if (value.length === 10) {
                                      checkDuplicate('owner_mobile', value);
                                    }
                                }}
                                onBlur={() => {
                                  if (formData.owner_mobile && formData.owner_mobile.length === 10) {
                                    checkDuplicate('owner_mobile', formData.owner_mobile);
                                  }
                                }}
                                className={`pl-10 rounded-l-none dark:bg-slate-950 dark:text-white dark:border-slate-700 ${errors.owner_mobile ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"}`}
                                placeholder="9876543210"
                                maxLength={10}
                            />
                        </div>
                        {isCheckingMobile && (
                          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                        )}
                    </div>
                    {errors.owner_mobile && <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <span> ï¸</span> {errors.owner_mobile}
                    </p>}
                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">You can login using either email or mobile number</p>
                    </div>

                    <div className="space-y-2">
                    <Label htmlFor="password" className="dark:text-slate-300">Password <span className="text-red-500">*</span></Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-slate-500" />
                        <Input 
                            id="password" 
                            name="password" 
                            type={showPassword ? "text" : "password"} 
                            required 
                            value={formData.password} 
                            onChange={handleInputChange} 
                            minLength={6} 
                            className="pl-10 pr-10 focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-700 dark:text-white" 
                            placeholder="••••••••" 
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-none"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    </div>

                    <div className="space-y-2">
                    <Label htmlFor="retypePassword" className="dark:text-slate-300">Retype Password <span className="text-red-500">*</span></Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-slate-500" />
                        <Input 
                            id="retypePassword" 
                            name="retypePassword" 
                            type={showRetypePassword ? "text" : "password"} 
                            required 
                            value={retypePassword} 
                            onChange={(e) => setRetypePassword(e.target.value)} 
                            minLength={6} 
                            className="pl-10 pr-10 focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-700 dark:text-white" 
                            placeholder="••••••••" 
                        />
                        <button
                            type="button"
                            onClick={() => setShowRetypePassword(!showRetypePassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-none"
                        >
                            {showRetypePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    </div>

                    <div className="space-y-2">
                    <Label htmlFor="slug" className="dark:text-slate-300">
                      Organization URL Code 
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                        <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-slate-500" />
                        <Input 
                            id="slug" 
                            name="slug" 
                            required 
                            value={formData.slug} 
                            onChange={(e) => {
                                const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                handleValueChange('slug', val);
                                // Clear error when typing
                                if (errors.slug) {
                                    setErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors.slug;
                                        return newErrors;
                                    });
                                }
                            }} 
                            onBlur={() => {
                                if (formData.slug) {
                                    checkDuplicate('slug', formData.slug);
                                }
                            }}
                            placeholder="e.g. st-josephs"
                            className={`pl-10 pr-10 dark:bg-slate-950 dark:text-white dark:border-slate-700 ${errors.slug ? "border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"}`}
                        />
                        {isCheckingSlug && (
                          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
                        )}
                    </div>
                    {errors.slug && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <span> ï¸</span> {errors.slug}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                      Your public URL will be: 
                    </p>
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-md">
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">
                        Your School Website URL:
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-mono break-all">
                        https://www.jashcharerp.com/{formData.slug || 'your-code'}
                      </p>
                    </div>
                    </div>
                </div>
              </div>

              {/* Additional Branches Section (for multi-branch) */}
              {formData.registration_type === 'organization_multi_branch' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4 border-b dark:border-slate-800 pb-2">
                    <GitBranch className="mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-400" /> Additional Branches
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                    Add your additional branches below. The primary branch (Branch-1) details are already filled above.
                  </p>
                  
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
                          className="text-red-500 hover:text-red-700"
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
                            className="dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="dark:text-slate-300">Board Affiliation <span className="text-red-500">*</span></Label>
                          <Select 
                            value={branch.board} 
                            onValueChange={(v) => updateBranch(index + 1, 'board', v)}
                          >
                            <SelectTrigger className="dark:bg-slate-950 dark:border-slate-700 dark:text-white">
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
                    className="w-full mt-2 dark:border-slate-700 dark:text-slate-300"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Another Branch
                  </Button>
                  
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      <strong>Tip:</strong> You can add more branches later from your dashboard after registration is approved.
                      Branch-1 will be your primary branch, and others will be numbered sequentially (Branch-2, Branch-3, etc.)
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes" className="dark:text-slate-300">
                  Additional Notes 
                  <span className="text-gray-400 dark:text-slate-500 font-normal">(Optional)</span>
                </Label>
                <div className="relative">
                    <Textarea 
                      id="notes" 
                      name="notes" 
                      value={formData.notes} 
                      onChange={handleInputChange} 
                      placeholder={
                        formData.registration_type === 'organization_multi_branch' 
                          ? "Any additional information about your organization or branches..." 
                          : formData.registration_type === 'organization'
                          ? "Mention if you plan to add branches later..."
                          : "Any specific requirements..."
                      } 
                      className="min-h-[120px] focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-700 dark:text-white" 
                    />
                </div>
                {formData.registration_type === 'organization_multi_branch' && (
                  <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                    Listing your branches here helps our team set up your organization structure faster.
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-lg font-semibold shadow-lg transition-all duration-200 transform hover:scale-[1.01]" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Submit Registration
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <p className="text-center text-sm text-gray-500 dark:text-slate-400">
            Already registered? <a href="/login" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">Sign in here</a>
        </p>
      </div>
      </div>
      <Footer content={cmsContent?.footer} contact={cmsContent?.contact} />
    </div>
  );
};

export default RegisterSchool;
