import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building, User, Save, Eye, EyeOff, UploadCloud, Image, Loader2, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { useEmailValidation } from '@/hooks/useEmailValidation';
import { useSchoolContactValidation } from '@/hooks/useSchoolContactValidation';
import ImageUploader from '@/components/ImageUploader';
import { currencies } from '@/data/currencies';

const AddNewSchool = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showReenteredPassword, setShowReenteredPassword] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [postOffices, setPostOffices] = useState([]);

  const {
    isChecking: isEmailChecking,
    error: emailError,
    validateEmail: validateOwnerEmail,
  } = useEmailValidation();

  const {
    checkingField: isContactChecking,
    errors: contactErrors,
    validateContact
  } = useSchoolContactValidation();

  const [formData, setFormData] = useState({
    schoolName: '',
    contactNumber: '',
    contactEmail: '',
    pincode: '',
    city: '',
    state: '',
    postOffice: '',
    address: '',
    board: '', // Added Board
    currency: 'INR',
    currencySymbol: '₹',
    school_code_prefix: 'SCH',
    school_code_number: Math.floor(100000 + Math.random() * 900000).toString(),
    domainType: 'Default',
    subscription_plan: '',
    status: 'Active',
    ownerName: '',
    ownerEmail: '',
    ownerMobile: '', // Added Owner Mobile
    ownerPassword: '123456', // Default fixed password
    ownerReenteredPassword: '123456', // Default fixed password
    logo_url: ''
  });

  const [slug, setSlug] = useState('');
  const [domain, setDomain] = useState('');
  const [ownerMobileError, setOwnerMobileError] = useState('');
  const [isOwnerMobileChecking, setIsOwnerMobileChecking] = useState(false);
  const ownerMobileTimeout = React.useRef(null);

  const validateOwnerMobile = useCallback((mobile) => {
    if (ownerMobileTimeout.current) clearTimeout(ownerMobileTimeout.current);
    setOwnerMobileError('');
    
    if (!mobile) return;
    
    if (mobile.length !== 10) {
        // Don't show error while typing, only on submit or blur if needed, 
        // but for duplicate check we wait for 10 digits
        return;
    }

    setIsOwnerMobileChecking(true);
    ownerMobileTimeout.current = setTimeout(async () => {
        try {
            // Check against profiles table
            // We check both raw number and +91 prefixed number to be safe
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .or(`phone.eq.${mobile},phone.eq.+91${mobile}`)
                .maybeSingle();
            
            if (error) {
                console.error("Error checking owner mobile:", error);
            } else if (data) {
                setOwnerMobileError('This mobile number is already registered.');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsOwnerMobileChecking(false);
        }
    }, 800);
  }, []);

  // Pre-fill from School Request
  useEffect(() => {
    if (location.state?.requestData) {
        const req = location.state.requestData;
        setFormData(prev => ({
            ...prev,
            schoolName: req.school_name || '',
            contactNumber: req.contact_number || '',
            contactEmail: req.contact_email || '',
            pincode: req.pincode || '',
            city: req.city || '',
            state: req.state || '',
            address: req.address || '',
            board: req.board || '',
            ownerName: req.owner_name || '',
            ownerEmail: req.owner_email || '',
        }));
        
        // Trigger slug generation
        if (req.school_name) {
            const newSlug = req.school_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            setSlug(newSlug);
        }
    }
  }, [location.state]);

  // Auto-generate slug from school name if not manually edited
  useEffect(() => {
      if (formData.schoolName && !slug) {
          const newSlug = formData.schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          setSlug(newSlug);
      }
  }, [formData.schoolName]);

  // Update domain based on slug
  useEffect(() => {
      setDomain(`${slug}.jashcharerp.com`);
  }, [slug]);

  useEffect(() => {
    const fetchPlans = async () => {
      // Fetch only active plans
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, name, plan_type, price, modules')
        .eq('status', true)
        .order('name');
        
      if (error) {
        toast({ variant: "destructive", title: "Could not fetch subscription plans." });
      } else {
        setSubscriptionPlans(data);
      }
    };
    fetchPlans();
  }, [toast]);

  const handlePincodeChange = useCallback(async (pincode) => {
    setFormData(prev => ({ ...prev, pincode, city: '', state: '', postOffice: '' }));
    setPostOffices([]);
    if (pincode.length === 6) {
      setPincodeLoading(true);
      try {
        // Try Primary API (PostOffice API)
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();
        
        if (data && data[0] && data[0].Status === 'Success') {
          setPostOffices(data[0].PostOffice);
          if (data[0].PostOffice.length === 1) {
            const postOffice = data[0].PostOffice[0];
            setFormData(prev => ({
              ...prev,
              city: postOffice.District,
              state: postOffice.State,
              postOffice: postOffice.Name,
            }));
          }
        } else {
          throw new Error("Primary API failed");
        }
      } catch (error) {
        // Fallback to Zippopotam.us
        try {
            const response = await fetch(`https://api.zippopotam.us/in/${pincode}`);
            if (!response.ok) throw new Error("Fallback API failed");
            const data = await response.json();
            
            if (data && data.places && data.places.length > 0) {
                const place = data.places[0];
                setFormData(prev => ({
                    ...prev,
                    state: place['state'],
                    city: place['place name'], // Use place name as city proxy
                    postOffice: place['place name']
                }));
                // Create a mock post office list for the dropdown
                setPostOffices(data.places.map(p => ({ Name: p['place name'], District: p['place name'], State: p['state'] })));
            }
        } catch (fallbackError) {
            toast({ variant: 'destructive', title: 'Invalid Pincode', description: 'Could not fetch details for this pincode.' });
        }
      } finally {
        setPincodeLoading(false);
      }
    }
  }, [toast]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;

    if (id === 'pincode') {
      setFormData((prev) => ({ ...prev, [id]: value }));
      handlePincodeChange(value);
    } else if (id === 'contactNumber') {
      // Allow only digits and limit to 10
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [id]: digits, ownerMobile: digits }));
      validateContact('phone', digits);
      validateOwnerMobile(digits);
    } else if (id === 'ownerMobile') {
      // Allow only digits and limit to 10
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [id]: digits }));
      validateOwnerMobile(digits);
    } else if (id === 'contactEmail') {
      setFormData((prev) => ({ ...prev, [id]: value, ownerEmail: value }));
      validateContact('email', value);
      validateOwnerEmail(value);
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
    
    if (id === 'ownerEmail') {
      validateOwnerEmail(value);
    }

    if (id === 'schoolName' && formData.domainType === 'Default') {
      const newDomain = `${value.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.jashcharerp.com`;
      setDomain(newDomain);
    }
  };

  const handleSelectChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (id === 'domainType') {
      if (value === 'Default') {
        const newDomain = `${formData.schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.jashcharerp.com`;
        setDomain(newDomain);
      } else {
        setDomain('');
      }
    }
    if (id === 'postOffice') {
      const selectedOffice = postOffices.find(po => po.Name === value);
      if (selectedOffice) {
        setFormData(prev => ({...prev, city: selectedOffice.District, state: selectedOffice.State }));
      }
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return null;
    const fileName = `public/${uuidv4()}-${logoFile.name}`;
    const { data, error } = await supabase.storage
      .from('school-logos')
      .upload(fileName, logoFile);

    if (error) {
      throw new Error('Failed to upload logo: ' + error.message);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('school-logos')
      .getPublicUrl(fileName);
      
    return publicUrl;
  };

  const handleCurrencyChange = (value) => {
    const selectedCurrency = currencies.find(c => c.code === value);
    setFormData(prev => ({
      ...prev,
      currency: value,
      currencySymbol: selectedCurrency ? selectedCurrency.symbol : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (emailError) {
      toast({ variant: 'destructive', title: 'Invalid Owner Email', description: emailError });
      return;
    }
    if (contactErrors.email) {
      toast({ variant: 'destructive', title: 'Invalid Contact Email', description: contactErrors.email });
      return;
    }
    if (contactErrors.phone) {
      toast({ variant: 'destructive', title: 'Invalid Contact Number', description: contactErrors.phone });
      return;
    }
    if (!formData.ownerMobile || formData.ownerMobile.length !== 10) {
      toast({ variant: 'destructive', title: 'Invalid Owner Mobile', description: 'Owner mobile number must be exactly 10 digits.' });
      return;
    }
    if (ownerMobileError) {
      toast({ variant: 'destructive', title: 'Invalid Owner Mobile', description: ownerMobileError });
      return;
    }
    if (formData.ownerPassword !== formData.ownerReenteredPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match', description: 'Please ensure both password fields are identical.' });
      return;
    }
    if (!formData.subscription_plan) {
      toast({ variant: 'destructive', title: 'Subscription Plan Required', description: 'Please select a subscription plan for the school.' });
      return;
    }

    setLoading(true);

    try {
      const logoUrl = await uploadLogo();

      // Format phone number with +91 prefix
      const formattedContactNumber = `+91${formData.contactNumber}`;

      // 1. Check Duplicate Slug
      const { data: existingSchool } = await supabase
        .from('schools')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (existingSchool) {
        throw new Error('This branch subdomain is already taken.');
      }

      // 1.5 Create Organization implicitly for this Branch
      // In a multi-branch setup, you might select an existing Org. Here we create a specific Org for this new setup.
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: formData.schoolName,
          contact_email: formData.contactEmail,
          contact_phone: formattedContactNumber,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          plan_id: formData.subscription_plan,
          status: 'Active'
        })
        .select()
        .single();
      
      if (orgError) throw new Error("Failed to create Organization: " + orgError.message);

      // 2. Create School (Branch)
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .insert({
          organization_id: org.id, // Link to Organization
          name: formData.schoolName,
          slug: slug,
          plan_id: formData.subscription_plan,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          contact_number: formattedContactNumber,
          contact_email: formData.contactEmail,
          board: formData.board,
          logo_url: logoUrl,
          currency: formData.currency,
          currency_symbol: formData.currencySymbol,
          school_code_prefix: formData.school_code_prefix,
          school_code_number: formData.school_code_number,
          domain_type: formData.domainType,
          status: formData.status || 'Active'
        })
        .select()
        .single();

      if (schoolError) throw schoolError;

      // 3. Calculate Subscription End Date
      const { data: planDetails } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', formData.subscription_plan)
        .single();

      let endDate = new Date();
      if (planDetails) {
          const val = planDetails.subscription_period_value || planDetails.duration_months || 12;
          const type = planDetails.subscription_period_type || 'Months';
          
          if (type === 'Days') endDate.setDate(endDate.getDate() + val);
          else if (type === 'Months') endDate.setMonth(endDate.getMonth() + val);
          else if (type === 'Years') endDate.setFullYear(endDate.getFullYear() + val);
          else endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
          endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // 4. Create Subscription
      const { error: subError } = await supabase
        .from('school_subscriptions')
        .insert({
          branch_id: school.id,
          plan_id: formData.subscription_plan,
          status: 'active',
          billing_type: 'prepaid', // Must be 'prepaid' or 'postpaid' per schema
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString()
        });

      if (subError) throw subError;

      // 5. Create Default Roles
      const defaultRoles = [
          'Super Admin', 'Admin', 'Principal', 'Accountant', 
          'Receptionist', 'Teacher', 'Librarian', 'Parent', 'Student'
      ];

      const roleInserts = defaultRoles.map(rName => ({
          branch_id: school.id,
          name: rName,
          is_system_default: true
      }));

      const { error: rolesError } = await supabase
          .from('roles')
          .upsert(roleInserts, { onConflict: 'branch_id, name' });

      if (rolesError) console.error("Error creating roles:", rolesError);

      // If created from a request, update the request status
      if (location.state?.requestData?.id) {
          await supabase
            .from('school_requests')
            .update({ status: 'Approved' })
            .eq('id', location.state.requestData.id);
      }

      toast({
        title: 'Branch Created Successfully!',
        description: `Branch "${formData.schoolName}" has been created. NOTE: Since you are on a static host, the Super Admin account could not be auto-created. Please ask the super admin to register using the Branch Slug.`,
      });
      navigate('/master-admin/schools');

    } catch (error) {
      console.error("Creation Error:", error);
      toast({
        variant: 'destructive',
        title: 'Error creating branch',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Add New Branch</h1>
      </div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        <div className="bg-card p-8 rounded-xl shadow-lg border">
          <h2 className="text-xl font-bold mb-6 flex items-center"><Building className="mr-3 text-primary" />Branch Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div><Label htmlFor="schoolName" required>Branch Name</Label><Input id="schoolName" value={formData.schoolName} onChange={handleInputChange} required /></div>
            <div>
                <Label htmlFor="board">Board</Label>
                <Select value={formData.board} onValueChange={(v) => handleSelectChange('board', v)}>
                    <SelectTrigger><SelectValue placeholder="Select Board" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="CBSE">CBSE</SelectItem>
                        <SelectItem value="ICSE">ICSE</SelectItem>
                        <SelectItem value="State Board">State Board</SelectItem>
                        <SelectItem value="IB">IB</SelectItem>
                        <SelectItem value="IGCSE">IGCSE</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
              <Label htmlFor="contactEmail" required>Contact Email</Label>
              <div className="relative">
                <Input id="contactEmail" type="email" value={formData.contactEmail} onChange={handleInputChange} required />
                {isContactChecking === 'email' && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              {contactErrors.email && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/>{contactErrors.email}</p>}
            </div>
            <div>
              <Label htmlFor="contactNumber" required>Branch Contact Number</Label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-muted-foreground font-medium">+91</span>
                <Input 
                  id="contactNumber" 
                  value={formData.contactNumber} 
                  onChange={handleInputChange} 
                  required 
                  className="pl-12" 
                  placeholder="9876543210"
                  maxLength={10}
                />
                {isContactChecking === 'phone' && <Loader2 className="absolute right-2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              {contactErrors.phone && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/>{contactErrors.phone}</p>}
            </div>
            <div className="relative">
              <Label htmlFor="pincode" required>Pincode</Label>
              <Input id="pincode" value={formData.pincode} onChange={handleInputChange} required maxLength="6" />
              {pincodeLoading && <Loader2 className="absolute right-2 top-8 h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
             <div>
              <Label required>Post Office</Label>
              <Select value={formData.postOffice} onValueChange={(v) => handleSelectChange('postOffice', v)} disabled={postOffices.length === 0}>
                <SelectTrigger><SelectValue placeholder="Select post office" /></SelectTrigger>
                <SelectContent>
                  {postOffices.map(po => <SelectItem key={po.Name} value={po.Name}>{po.Name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label htmlFor="city">City</Label><Input id="city" value={formData.city} onChange={handleInputChange} readOnly className="bg-muted" /></div>
            <div><Label htmlFor="state">State</Label><Input id="state" value={formData.state} onChange={handleInputChange} readOnly className="bg-muted" /></div>
            <div className="md:col-span-2"><Label htmlFor="address">Address</Label><Input id="address" value={formData.address} onChange={handleInputChange} /></div>
            <div>
              <Label>Currency</Label>
              <Select value={formData.currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger><SelectValue placeholder="Select Currency" /></SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {currencies.map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Currency Symbol</Label><Input value={formData.currencySymbol} readOnly className="bg-muted" /></div>
            <div><Label>Branch Code Prefix</Label><Input value={formData.school_code_prefix} readOnly className="bg-muted" /></div>
            <div><Label>Branch Code Number</Label><Input value={formData.school_code_number} readOnly className="bg-muted" /></div>
            
            <div className="md:col-span-2">
                <Label required>Branch URL Alias (Subdomain)</Label>
                <div className="flex items-center gap-2">
                    <Input 
                        value={slug} 
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} 
                        placeholder="e.g. my-school"
                        className="font-mono"
                    />
                    <span className="text-muted-foreground font-medium">.jashcharerp.com</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Full URL: <a href={`http://${domain}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">http://{domain}</a>
                </p>
            </div>

            <div>
              <Label required>Subscription Plan</Label>
              <Select value={formData.subscription_plan} onValueChange={(v) => handleSelectChange('subscription_plan', v)} required>
                <SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger>
                <SelectContent>
                  {subscriptionPlans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} ({plan.plan_type} - {plan.plan_type === 'Prepaid' ? `₹${plan.price}` : 'Usage Based'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div><Label>Status</Label><Select value={formData.status} onValueChange={(v) => handleSelectChange('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent></Select></div>
             <div className="md:col-span-1 lg:col-span-3">
              <Label>School Logo</Label>
              <div className="mt-2">
                <ImageUploader onFileChange={setLogoFile} fileType="png" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card p-8 rounded-xl shadow-lg border">
          <h2 className="text-xl font-bold mb-6 flex items-center"><User className="mr-3 text-primary" />Owner Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div><Label htmlFor="ownerName" required>Owner Name</Label><Input id="ownerName" value={formData.ownerName} onChange={handleInputChange} required /></div>
            <div>
              <Label htmlFor="ownerEmail" required>Owner Email</Label>
              <div className="relative">
                <Input id="ownerEmail" type="email" value={formData.ownerEmail} onChange={handleInputChange} required />
                {isEmailChecking && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              {emailError && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/>{emailError}</p>}
            </div>
            <div>
              <Label htmlFor="ownerMobile" required>Mobile Number</Label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-muted-foreground font-medium">+91</span>
                <Input 
                  id="ownerMobile" 
                  value={formData.ownerMobile} 
                  onChange={handleInputChange} 
                  required 
                  className="pl-12" 
                  placeholder="9876543210"
                  maxLength={10}
                />
                {isOwnerMobileChecking && <Loader2 className="absolute right-2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              {ownerMobileError && <p className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/>{ownerMobileError}</p>}
            </div>
            <div className="space-y-4">
              <div className="relative">
                <Label htmlFor="ownerPassword" required>Initial Password</Label>
                <Input 
                  id="ownerPassword" 
                  type="text" 
                  value={formData.ownerPassword} 
                  readOnly 
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>
              <div className="relative">
                <Label htmlFor="ownerReenteredPassword" required>Re-enter Password</Label>
                <Input 
                  id="ownerReenteredPassword" 
                  type="text" 
                  value={formData.ownerReenteredPassword} 
                  readOnly 
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading} size="lg" className="text-lg">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-5 w-5" /> Create School & Owner</>}
          </Button>
        </div>
      </motion.form>
    </DashboardLayout>
  );
};

export default AddNewSchool;
