import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building, Save, UploadCloud, Image, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { currencies } from '@/data/currencies';

const EditSchool = () => {
  const navigate = useNavigate();
  const { id: branchId } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [postOffices, setPostOffices] = useState([]);

  // Helper function to fetch post offices for existing pincode
  const fetchPostOfficesForPincode = useCallback(async (pincode, existingPostOffice = null) => {
    if (!pincode || pincode.length !== 6) return;
    
    setPincodeLoading(true);
    let offices = [];
    console.log("Fetching offices for pincode:", pincode);

    try {
      // Try backend proxy first
      try {
        const proxyResponse = await fetch(`/api/address/pincode/${pincode}`);
        const contentType = proxyResponse.headers.get('content-type') || '';

        if (proxyResponse.ok && contentType.includes('application/json')) {
          const proxyData = await proxyResponse.json();

          if (proxyData?.found && Array.isArray(proxyData.postOffices)) {
            offices = proxyData.postOffices.map((po) => ({
              Name: po.name,
              District: po.city,
              State: po.state,
            }));
          }
        }
      } catch (_) {
        // ignore proxy failure
      }

      // Fallback: direct external API call if proxy failed
      if (offices.length === 0) {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
            offices = data[0].PostOffice;
          }
        }
      }

      // Last fallback: Zippopotam.us
      if (offices.length === 0) {
        try {
          const response = await fetch(`https://api.zippopotam.us/in/${pincode}`);
          if (response.ok) {
            const zipData = await response.json();
            if (zipData?.places?.length > 0) {
              offices = zipData.places.map(p => ({
                Name: p['place name'],
                District: p['place name'],
                State: p['state']
              }));
            }
          }
        } catch (_) {
          // ignore
        }
      }
    } catch (error) {
      console.error("Pincode fetch error", error);
    } finally {
      // Ensure existing post office is in the list if provided
      if (existingPostOffice && !offices.find(o => o.Name === existingPostOffice)) {
        offices.push({
            Name: existingPostOffice,
            District: '', // Will be filled from form data if selected
            State: ''
        });
      }
      
      setPostOffices(offices);
      console.log("Found offices:", offices);

      // Auto-select if only one option and no existing value
      if (offices.length === 1 && !existingPostOffice) {
          setFormData(prev => {
              if (!prev.post_office) {
                  return { 
                      ...prev, 
                      post_office: offices[0].Name,
                      city: offices[0].District || prev.city,
                      state: offices[0].State || prev.state
                  };
              }
              return prev;
          });
      }

      setPincodeLoading(false);
    }
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    contact_number: '',
    contact_email: '',
    pincode: '',
    city: '',
    state: '',
    address: '',
    post_office: '',
    board: '',
    currency: '',
    currency_symbol: '',
    subscription_plan: '',
    current_session_id: '',
    status: 'Active',
    logo_url: ''
  });

  useEffect(() => {
    const fetchSchoolData = async () => {
      setInitialLoading(true);
      
      const { data: plans, error: plansError } = await supabase.from('subscription_plans').select('id, name');
      if (plansError) {
        toast({ variant: "destructive", title: "Could not fetch subscription plans." });
      } else {
        setSubscriptionPlans(plans);
      }

      // Fetch Sessions (Global Only to avoid duplicates)
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('id, name, start_date, end_date')
        .is('branch_id', null)
        .order('name', { ascending: false });
      
      if (sessionsError) {
        console.error("Error fetching sessions:", sessionsError);
      } else {
        setSessions(sessionsData || []);
      }

      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('*')
        .eq('id', branchId)
        .single();
      
      if (schoolError) {
        toast({ variant: 'destructive', title: 'Failed to fetch school data', description: schoolError.message });
        navigate('/master-admin/schools');
        setInitialLoading(false);
        return;
      }

      // Fetch active subscription separately to ensure accuracy
      const { data: activeSub } = await supabase
        .from('school_subscriptions')
        .select('plan_id')
        .eq('branch_id', branchId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Fallback to school.plan_id if no active subscription record found
      const currentPlanId = activeSub ? activeSub.plan_id : (schoolData.plan_id || '');
          
        // Initialize form data with proper defaults for null/undefined values
        setFormData({
          name: schoolData.name || '',
          contact_number: schoolData.contact_number || '',
          contact_email: schoolData.contact_email || '',
          pincode: schoolData.pincode || '',
          city: schoolData.city || '',
          state: schoolData.state || '',
          address: schoolData.address || '',
          post_office: schoolData.post_office || '',
          board: schoolData.board || '',
          currency: schoolData.currency || 'INR',
          currency_symbol: schoolData.currency_symbol || '?',
          subscription_plan: currentPlanId,
          current_session_id: schoolData.current_session_id || '',
          status: schoolData.status || 'Active',
          logo_url: schoolData.logo_url || ''
        });
        setLogoPreview(schoolData.logo_url || '');
        
        // If pincode exists, fetch post offices to populate dropdown
        if (schoolData.pincode && schoolData.pincode.length === 6) {
          // Pass the existing post office to ensure it's included in the list
          fetchPostOfficesForPincode(schoolData.pincode, schoolData.post_office);
        }
      
      setInitialLoading(false);
    };

    fetchSchoolData();
  }, [branchId, navigate, toast]); // Removed fetchPostOfficesForPincode from dependency to avoid loop if it changes



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

  const handlePincodeChange = (pincode) => {
    setFormData(prev => ({ ...prev, pincode }));
    if (pincode.length === 6) {
      fetchPostOfficesForPincode(pincode);
    } else {
      setPostOffices([]);
      setFormData(prev => ({ ...prev, post_office: '', city: '', state: '' }));
    }
  };

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, contact_number: value }));
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    if (id === 'pincode') {
      const pincode = value.replace(/\D/g, '').slice(0, 6);
      // Call handlePincodeChange directly with the pincode value
      handlePincodeChange(pincode);
    } else if (id === 'contact_number') {
      handleMobileChange(e);
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleSelectChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  
  const uploadLogo = async () => {
    if (!logoFile) return formData.logo_url;
    const fileName = `public/${uuidv4()}-${logoFile.name}`;
    const { data, error } = await supabase.storage.from('school-logos').upload(fileName, logoFile);
    if (error) throw new Error('Failed to upload logo: ' + error.message);
    const { data: { publicUrl } } = supabase.storage.from('school-logos').getPublicUrl(fileName);
    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name?.trim()) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'School Name is required' });
      return;
    }
    if (!formData.contact_number?.trim()) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Contact Number is required' });
      return;
    }
    if (!formData.contact_email?.trim()) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Contact Email is required' });
      return;
    }
    if (!formData.subscription_plan) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Subscription Plan is required' });
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contact_email)) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Please enter a valid email address' });
      return;
    }
    
    setLoading(true);

    try {
      const logoUrl = await uploadLogo();
      
      // 1. Update School Details - only include fields that have values
      const schoolUpdates = {
        name: formData.name.trim(),
        contact_number: formData.contact_number.trim(),
        contact_email: formData.contact_email.trim().toLowerCase(),
        pincode: formData.pincode?.trim() || null,
        city: formData.city?.trim() || null,
        state: formData.state?.trim() || null,
        address: formData.address?.trim() || null,
        post_office: formData.post_office?.trim() || null, // Save post office
        board: formData.board?.trim() || null,
        currency: formData.currency || 'INR',
        currency_symbol: formData.currency_symbol || '?',
        status: formData.status || 'Active',
        logo_url: logoUrl || null,
        plan_id: formData.subscription_plan, // Ensure plan_id is synced in schools table
        current_session_id: formData.current_session_id || null
      };

      const { error: schoolUpdateError } = await supabase.from('schools').update(schoolUpdates).eq('id', branchId);
      if (schoolUpdateError) throw schoolUpdateError;

      // 2. Update Subscription Plan
      if (formData.subscription_plan) {
        // Check if subscription exists
        const { data: existingSub } = await supabase
            .from('school_subscriptions')
            .select('id, billing_type')
            .eq('branch_id', branchId)
            .maybeSingle();

        if (existingSub) {
            // Preserve existing billing_type or use default 'prepaid'
            const updateData = {
              plan_id: formData.subscription_plan,
              billing_type: existingSub.billing_type || 'prepaid'
            };
            
            const { error: subUpdateError } = await supabase
                .from('school_subscriptions')
                .update(updateData)
                .eq('id', existingSub.id);
            if (subUpdateError) throw subUpdateError;
        } else {
            const { error: subInsertError } = await supabase
                .from('school_subscriptions')
                .insert({
                    branch_id: branchId,
                    plan_id: formData.subscription_plan,
                    billing_type: 'prepaid', // Required field: 'prepaid' or 'postpaid'
                    status: 'active',
                    auto_renew: true,
                    start_date: new Date().toISOString().split('T')[0]
                });
            if (subInsertError) throw subInsertError;
        }
      }

      toast({ title: 'School Updated Successfully!' });
      navigate('/master-admin/schools');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error updating school', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <DashboardLayout><div className="flex justify-center items-center h-full">Loading school details...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/master-admin/schools')} className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Edit School</h1>
      </div>

      <motion.form onSubmit={handleSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
        <div className="bg-card p-8 rounded-xl shadow-lg border">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center"><Building className="mr-3 text-primary" />School Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div><Label htmlFor="name">School Name *</Label><Input id="name" value={formData.name} onChange={handleInputChange} required /></div>
            <div>
              <Label htmlFor="contact_number">School Contact Number *</Label>
              <div className="flex">
                <div className="flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center text-gray-900 bg-gray-100 border border-gray-300 rounded-l-lg dark:bg-slate-800 dark:text-white dark:border-slate-700">
                  +91
                </div>
                <Input 
                  id="contact_number" 
                  value={formData.contact_number} 
                  onChange={handleInputChange} 
                  required 
                  maxLength={10}
                  placeholder="9876543210"
                  className="rounded-l-none"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Enter 10-digit mobile number</p>
            </div>
            <div><Label htmlFor="contact_email">School Email *</Label><Input id="contact_email" value={formData.contact_email} onChange={handleInputChange} required /></div>
            <div className="relative">
              <Label htmlFor="pincode">Pincode *</Label>
              <Input 
                id="pincode" 
                value={formData.pincode} 
                onChange={handleInputChange} 
                required 
                maxLength={6}
                placeholder="Enter 6-digit Pincode"
              />
              {pincodeLoading && <Loader2 className="absolute right-2 top-9 h-4 w-4 animate-spin" />}
            </div>
            <div>
              <Label htmlFor="post_office">Area / Post Office</Label>
              <Select 
                value={formData.post_office} 
                onValueChange={handlePostOfficeChange} 
                disabled={postOffices.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={postOffices.length === 0 ? (pincodeLoading ? "Loading..." : "Enter Pincode first") : "Select Area"} />
                </SelectTrigger>
                <SelectContent>
                  {postOffices.map((po, idx) => (
                    <SelectItem key={`${po.Name}-${idx}`} value={po.Name}>{po.Name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {postOffices.length > 0 && <p className="text-xs text-muted-foreground mt-1">{postOffices.length} areas found for this pincode.</p>}
            </div>
            <div>
              <Label htmlFor="city">City / District</Label>
              <Input id="city" value={formData.city} readOnly className="bg-muted" />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input id="state" value={formData.state} readOnly className="bg-muted" />
            </div>
            <div className="md:col-span-2"><Label htmlFor="address">Address</Label><Input id="address" value={formData.address} onChange={handleInputChange} /></div>
            <div>
                <Label htmlFor="board">Board Affiliation</Label>
                <Select value={formData.board} onValueChange={(v) => handleSelectChange('board', v)}>
                    <SelectTrigger><SelectValue placeholder="Select Board" /></SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        <SelectItem value="CBSE">CBSE - Central Board of Secondary Education</SelectItem>
                        <SelectItem value="ICSE">ICSE - Indian Certificate of Secondary Education</SelectItem>
                        <SelectItem value="IB">IB - International Baccalaureate</SelectItem>
                        <SelectItem value="IGCSE">IGCSE - Cambridge International</SelectItem>
                        <SelectItem value="NIOS">NIOS - National Institute of Open Schooling</SelectItem>
                        <SelectItem value="State Board">State Board (General)</SelectItem>
                        <SelectItem value="Andhra Pradesh Board">Andhra Pradesh Board of Secondary Education</SelectItem>
                        <SelectItem value="Assam Board">Assam Higher Secondary Education Council</SelectItem>
                        <SelectItem value="Bihar Board">Bihar School Examination Board</SelectItem>
                        <SelectItem value="Chhattisgarh Board">Chhattisgarh Board of Secondary Education</SelectItem>
                        <SelectItem value="Goa Board">Goa Board of Secondary & Higher Secondary Education</SelectItem>
                        <SelectItem value="Gujarat Board">Gujarat Secondary & Higher Secondary Education Board</SelectItem>
                        <SelectItem value="Haryana Board">Haryana Board of School Education</SelectItem>
                        <SelectItem value="Himachal Pradesh Board">Himachal Pradesh Board of School Education</SelectItem>
                        <SelectItem value="J&K Board">J&K State Board of School Education</SelectItem>
                        <SelectItem value="Jharkhand Board">Jharkhand Academic Council</SelectItem>
                        <SelectItem value="Karnataka State Board">Karnataka State Board (KSEAB/PU)</SelectItem>
                        <SelectItem value="Kerala Board">Kerala Board of Public Examinations</SelectItem>
                        <SelectItem value="Madhya Pradesh Board">Madhya Pradesh Board of Secondary Education</SelectItem>
                        <SelectItem value="Maharashtra State Board">Maharashtra State Board</SelectItem>
                        <SelectItem value="Manipur Board">Manipur Board of Secondary Education</SelectItem>
                        <SelectItem value="Meghalaya Board">Meghalaya Board of School Education</SelectItem>
                        <SelectItem value="Mizoram Board">Mizoram Board of School Education</SelectItem>
                        <SelectItem value="Nagaland Board">Nagaland Board of School Education</SelectItem>
                        <SelectItem value="Odisha Board">Odisha Board of Secondary Education</SelectItem>
                        <SelectItem value="Punjab Board">Punjab School Education Board</SelectItem>
                        <SelectItem value="Rajasthan Board">Rajasthan Board of Secondary Education</SelectItem>
                        <SelectItem value="Tamil Nadu State Board">Tamil Nadu State Board</SelectItem>
                        <SelectItem value="Telangana Board">Telangana Board of Secondary Education</SelectItem>
                        <SelectItem value="Tripura Board">Tripura Board of Secondary Education</SelectItem>
                        <SelectItem value="Uttar Pradesh Board">Uttar Pradesh Madhyamik Shiksha Parishad</SelectItem>
                        <SelectItem value="Uttarakhand Board">Uttarakhand Board of School Education</SelectItem>
                        <SelectItem value="West Bengal Board">West Bengal Board of Secondary Education</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency || 'INR'} onValueChange={(v) => {
                    const selectedCurrency = currencies.find(c => c.code === v);
                    setFormData(prev => ({
                        ...prev,
                        currency: v,
                        currency_symbol: selectedCurrency?.symbol || '?'
                    }));
                }}>
                    <SelectTrigger><SelectValue placeholder="Select Currency" /></SelectTrigger>
                    <SelectContent>
                        {currencies.map(currency => (
                            <SelectItem key={currency.code} value={currency.code}>
                                {currency.code} - {currency.name} ({currency.symbol})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div><Label htmlFor="currency_symbol">Currency Symbol</Label><Input id="currency_symbol" value={formData.currency_symbol} onChange={handleInputChange} placeholder="?" readOnly className="bg-muted" /></div>
            <div><Label>Subscription Plan *</Label><Select value={formData.subscription_plan} onValueChange={(v) => handleSelectChange('subscription_plan', v)} required><SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger><SelectContent>{subscriptionPlans.map(plan => <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>)}</SelectContent></Select></div>
            <div>
              <Label>Current Academic Session</Label>
              <Select 
                value={formData.current_session_id} 
                onValueChange={(v) => handleSelectChange('current_session_id', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map(session => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name} {session.start_date ? `(${new Date(session.start_date).getFullYear()}-${new Date(session.end_date).getFullYear()})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Assign a specific academic calendar to this school (e.g., PUC vs Standard).
              </p>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => {
                if (v === 'Inactive') {
                  if (window.confirm(' Ô∏è Warning: Setting school to Inactive will:\n\nï Block all users from logging in\nï Prevent access to school dashboard\nï Suspend all school operations\n\nYou can reactivate it anytime by changing status back to Active.\n\nAre you sure you want to deactivate this school?')) {
                    handleSelectChange('status', v);
                  }
                } else if (v === 'Active') {
                  // Reactivating - show confirmation
                  if (formData.status === 'Inactive') {
                    if (window.confirm('? Reactivate School:\n\nï All users will be able to login again\nï School dashboard will be accessible\nï All operations will resume\n\nDo you want to activate this school?')) {
                      handleSelectChange('status', v);
                    }
                  } else {
                    handleSelectChange('status', v);
                  }
                } else {
                  handleSelectChange('status', v);
                }
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">? Active</SelectItem>
                  <SelectItem value="Inactive">? Inactive</SelectItem>
                </SelectContent>
              </Select>
              {formData.status === 'Inactive' && (
                <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                  <p className="text-xs text-amber-800 dark:text-amber-300 font-medium mb-1">
                     Ô∏è This school is currently inactive
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    ï Users cannot login or access the system<br/>
                    ï You can reactivate by changing status to "Active" above
                  </p>
                </div>
              )}
              {formData.status === 'Active' && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ? School is active. All users can access the system.
                </p>
              )}
            </div>
            <div className="md:col-span-1 lg:col-span-3"><Label>School Logo</Label><div className="mt-2 flex items-center gap-x-4"><div className="w-24 h-24 rounded-lg border border-dashed flex items-center justify-center bg-muted/50">{logoPreview ? <img src={logoPreview} alt="Logo Preview" className="h-full w-full object-contain" /> : <Image className="h-8 w-8 text-muted-foreground" />}</div><label htmlFor="logo-upload" className="cursor-pointer bg-card py-2 px-3 border rounded-md text-sm font-medium hover:bg-accent"><UploadCloud className="inline-block h-5 w-5 mr-2" /><span>Change Logo</span><input id="logo-upload" type="file" className="sr-only" onChange={handleLogoChange} accept="image/*" /></label></div></div>
          </div>
        </div>
        <div className="flex justify-between items-center">
            <Button type="button" variant="outline" onClick={() => navigate('/master-admin/schools')}>Back to Schools List</Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-5 w-5" /> Save Changes</>}
            </Button>
        </div>
      </motion.form>
    </DashboardLayout>
  );
};

export default EditSchool;
