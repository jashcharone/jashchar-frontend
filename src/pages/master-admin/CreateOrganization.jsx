import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, User, Save, Loader2, CheckCircle, XCircle, AlertCircle, MapPin } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';
import { supabase } from '@/lib/customSupabaseClient';

const CreateOrganization = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Pincode State
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [postOffices, setPostOffices] = useState([]);

  // Validation State
  const [emailStatus, setEmailStatus] = useState('idle'); // idle, checking, valid, invalid
  const [emailError, setEmailError] = useState('');
  const [mobileStatus, setMobileStatus] = useState('idle');
  const [mobileError, setMobileError] = useState('');

  const [formData, setFormData] = useState({
    orgName: '',
    orgCode: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerPassword: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    postOffice: ''
  });

  // Auto-generate Org Code
  const generateOrgCode = (name) => {
    if (!name) return '';
    // Take first 4 chars of name + random 4 digits
    const prefix = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${random}`;
  };

  // Check Duplicate Email
  const checkEmail = useCallback(async (email) => {
    if (!email) {
        setEmailStatus('idle');
        return;
    }

    // Strict Gmail Validation
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
        setEmailStatus('invalid');
        setEmailError('Only @gmail.com addresses are allowed');
        return;
    }

    setEmailStatus('checking');
    try {
        // Use backend API to bypass RLS restrictions
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/public/check-duplicate`, { email });
        
        // If we get here (200 OK), it means no duplicate found
        setEmailStatus('valid');
        setEmailError('');
    } catch (e) {
        if (e.response && e.response.status === 409) {
            setEmailStatus('invalid');
            setEmailError(e.response.data.errors?.email || 'Email already registered');
        } else {
            console.error(e);
            setEmailStatus('idle');
        }
    }
  }, []);

  // Check Duplicate Mobile
  const checkMobile = useCallback(async (mobile) => {
    // Remove any non-digit characters
    const cleanMobile = mobile.replace(/\D/g, '');
    
    if (!cleanMobile) {
        setMobileStatus('idle');
        setMobileError('');
        return;
    }

    if (cleanMobile.length !== 10) {
        setMobileStatus('invalid');
        setMobileError('Mobile number must be exactly 10 digits');
        return;
    }

    setMobileStatus('checking');
    try {
        // Use backend API to bypass RLS restrictions
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/public/check-duplicate`, { mobile: cleanMobile });
        
        // If we get here (200 OK), it means no duplicate found
        setMobileStatus('valid');
        setMobileError('');
    } catch (e) {
        if (e.response && e.response.status === 409) {
            setMobileStatus('invalid');
            setMobileError(e.response.data.errors?.mobile || 'Mobile number already registered');
        } else {
            console.error(e);
            setMobileStatus('idle');
        }
    }
  }, []);

  // Pincode Lookup
  const handlePincodeChange = async (code) => {
    if (code.length === 6) {
      setPincodeLoading(true);
      try {
        // Use backend proxy to avoid CORS issues
        // VITE_API_URL already includes /api, so we just append /address/pincode
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/address/pincode/${code}`);
        const data = response.data;
        
        if (data.found && data.postOffices && data.postOffices.length > 0) {
            const places = data.postOffices;
            const place = places[0];
            
            setFormData(prev => ({
                ...prev,
                state: place.state,
                city: place.city,
                postOffice: place.name
            }));
            
            setPostOffices(places);
            toast({ title: "Address Found", description: `${place.city}, ${place.state}` });
        } else {
            toast({ variant: 'destructive', title: 'Invalid Pincode', description: 'Could not fetch details.' });
            setPostOffices([]);
        }
      } catch (error) {
        console.error('Pincode fetch error:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch address details.' });
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'orgName') {
        const code = generateOrgCode(value);
        setFormData(prev => ({ ...prev, [name]: value, orgCode: code }));
    } else if (name === 'pincode') {
        // Only allow digits for pincode
        const cleanPincode = value.replace(/\D/g, '').slice(0, 6);
        setFormData(prev => ({ ...prev, [name]: cleanPincode }));
        if (cleanPincode.length === 6) handlePincodeChange(cleanPincode);
    } else if (name === 'ownerPhone') {
        // Only allow digits for mobile
        const cleanPhone = value.replace(/\D/g, '').slice(0, 10);
        setFormData(prev => ({ ...prev, [name]: cleanPhone }));
        // Check validity on change if it reaches 10 digits, or clear error if less
        if (cleanPhone.length === 10) {
            checkMobile(cleanPhone);
        } else {
            setMobileStatus('idle'); // Reset status while typing
        }
    } else if (name === 'ownerEmail') {
        setFormData(prev => ({ ...prev, [name]: value }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === 'ownerEmail') checkEmail(value);
    if (name === 'ownerPhone') checkMobile(value);
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'postOffice') {
        const selected = postOffices.find(p => p.name === value);
        if (selected) {
            setFormData(prev => ({ ...prev, city: selected.city, state: selected.state }));
        }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (emailStatus === 'invalid' || mobileStatus === 'invalid') {
        toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fix duplicate email/mobile errors.' });
        return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("Authentication token not found");
      }
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/org/create-full`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Organization created successfully!",
          variant: "default"
        });
        navigate('/master-admin/schools');
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to create organization",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Create New Organization</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Organization Details */}
          <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border">
            <div className="flex items-center mb-4">
              <Building className="h-5 w-5 mr-2 text-primary" />
              <h2 className="text-lg font-semibold">Organization Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name *</Label>
                <Input
                  id="orgName"
                  name="orgName"
                  value={formData.orgName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Jashchar Group of Institutions"
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgCode">Organization Code (Auto-Generated)</Label>
                <div className="relative">
                    <Input
                    id="orgCode"
                    name="orgCode"
                    value={formData.orgCode}
                    readOnly
                    className="bg-muted text-muted-foreground font-mono"
                    />
                    <CheckCircle className="absolute right-3 top-2.5 h-4 w-4 text-green-500" />
                </div>
              </div>
              
              {/* Address Section */}
              <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <div className="relative">
                        <Input
                        id="pincode"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        maxLength={6}
                        placeholder="Enter 6-digit Pincode"
                        className="bg-background"
                        />
                        {pincodeLoading && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="postOffice">Post Office</Label>
                    <Select 
                        value={formData.postOffice} 
                        onValueChange={(val) => handleSelectChange('postOffice', val)}
                        disabled={postOffices.length === 0}
                    >
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select Post Office" />
                        </SelectTrigger>
                        <SelectContent>
                            {postOffices.map((po, idx) => (
                                <SelectItem key={idx} value={po.name}>{po.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" value={formData.city} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" name="state" value={formData.state} readOnly className="bg-muted" />
                  </div>
                  
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="House No, Street, Area"
                      className="bg-background"
                    />
                  </div>
              </div>
            </div>
          </div>

          {/* Owner Details */}
          <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border">
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 mr-2 text-primary" />
              <h2 className="text-lg font-semibold">Owner & Login Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner Name *</Label>
                <Input
                  id="ownerName"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  required
                  placeholder="Full Name"
                  className="bg-background"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ownerPhone">Mobile Number (Login ID) *</Label>
                <div className="relative">
                    <Input
                    id="ownerPhone"
                    name="ownerPhone"
                    value={formData.ownerPhone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    className={`bg-background ${mobileStatus === 'invalid' ? 'border-red-500' : mobileStatus === 'valid' ? 'border-green-500' : ''}`}
                    />
                    {mobileStatus === 'checking' && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                    {mobileStatus === 'valid' && <CheckCircle className="absolute right-3 top-2.5 h-4 w-4 text-green-500" />}
                    {mobileStatus === 'invalid' && <XCircle className="absolute right-3 top-2.5 h-4 w-4 text-red-500" />}
                </div>
                {mobileError && <p className="text-xs text-red-500 mt-1">{mobileError}</p>}
                <p className="text-xs text-muted-foreground mt-1">This number will be used for login.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerEmail">Email Address *</Label>
                <div className="relative">
                    <Input
                    id="ownerEmail"
                    name="ownerEmail"
                    type="email"
                    value={formData.ownerEmail}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    placeholder="owner@example.com"
                    className={`bg-background ${emailStatus === 'invalid' ? 'border-red-500' : emailStatus === 'valid' ? 'border-green-500' : ''}`}
                    />
                    {emailStatus === 'checking' && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                    {emailStatus === 'valid' && <CheckCircle className="absolute right-3 top-2.5 h-4 w-4 text-green-500" />}
                    {emailStatus === 'invalid' && <XCircle className="absolute right-3 top-2.5 h-4 w-4 text-red-500" />}
                </div>
                {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerPassword">Password *</Label>
                <Input
                  id="ownerPassword"
                  name="ownerPassword"
                  type="text"
                  value={formData.ownerPassword}
                  onChange={handleChange}
                  required
                  placeholder="Set initial password"
                  className="bg-background"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading || emailStatus === 'invalid' || mobileStatus === 'invalid'} size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Organization
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateOrganization;
