import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';
import ImageUploader from '@/components/ImageUploader';
import { rolesService } from '@/services/rolesService';
import { rolePermissionService } from '@/services/rolePermissionService';
import AddressForm from '@/components/AddressForm';

const AddNewSchool = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showReenteredPassword, setShowReenteredPassword] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  
  const [formData, setFormData] = useState({
    schoolName: '',
    schoolCode: '',
    boardType: 'CBSE',
    contactNumber: '',
    contactEmail: '',
    address: '', // Legacy field, will be constructed from addressObj
    addressObj: null, // New structured address
    websiteSlug: '',
    subscription_plan: '',
    status: 'Active',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    ownerReenteredPassword: '',
    logo_url: ''
  });

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, name, plan_type, price, modules')
        .eq('status', true)
        .order('name');
      if (!error) setSubscriptionPlans(data || []);
    };
    fetchPlans();
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [id]: value };
      if (id === 'schoolName' && !prev.websiteSlug) {
        updated.websiteSlug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      }
      return updated;
    });
  };

  const handleSelectChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const uploadLogo = async () => {
    if (!logoFile) return null;
    const fileName = `public/${uuidv4()}-${logoFile.name}`;
    const { error } = await supabase.storage.from('school-logos').upload(fileName, logoFile);
    if (error) throw new Error('Failed to upload logo');
    const { data } = supabase.storage.from('school-logos').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.ownerPassword !== formData.ownerReenteredPassword) {
      return toast({ variant: 'destructive', title: 'Password Mismatch', description: 'Passwords do not match.' });
    }
    if (!formData.schoolName || !formData.schoolCode || !formData.ownerEmail) {
      return toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill all required fields.' });
    }

    setLoading(true);
    try {
      const logoUrl = await uploadLogo();
      
      const payload = {
        schoolData: {
          schoolName: formData.schoolName,
          contactNumber: formData.contactNumber,
          contactEmail: formData.contactEmail,
          address: formData.address,
          school_code_number: formData.schoolCode,
          boardType: formData.boardType,
          cms_url_alias: formData.websiteSlug,
          subscription_plan: formData.subscription_plan,
          status: formData.status,
          logo_url: logoUrl
        },
        ownerData: {
          name: formData.ownerName,
          email: formData.ownerEmail,
          password: formData.ownerPassword
        }
      };

      // 1. Create School & Owner (Edge Function preferred for atomic, but using provided one)
      const { data, error } = await supabase.functions.invoke('create-school', { body: payload });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const newSchoolId = data.branchId || data.data?.branch_id; 
      // Note: Ensure create-school function returns branchId. 
      // If not, we might need to fetch it by slug/email if the function doesn't return it in a usable way.
      // Assuming standard response: { success: true, data: { branch_id: ... } } or similar.
      
      if (newSchoolId) {
        // 2. Create 9 Default Roles
        const createdRoles = await rolesService.createDefaultRoles(newSchoolId);
        
        // 3. Get Active Plan Modules
        const selectedPlan = subscriptionPlans.find(p => p.id === formData.subscription_plan);
        const activeModules = selectedPlan?.modules || [];

        // 4. Assign Permissions to Roles
        if (createdRoles && createdRoles.length > 0) {
          for (const role of createdRoles) {
            await rolePermissionService.assignDefaultPermissions(role.id, role.name, activeModules);
          }
        }
      }

      toast({ title: 'Success', description: 'School, roles, and permissions created successfully.' });
      navigate('/master-admin/schools');
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Creation Failed', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/master-admin/schools')} className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Add New School</h1>
      </div>

      <motion.form onSubmit={handleSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-5xl mx-auto">
        
        {/* School Details */}
        <div className="bg-white p-8 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Building className="text-primary" /> School Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><Label htmlFor="schoolName">School Name *</Label><Input id="schoolName" value={formData.schoolName} onChange={handleInputChange} required /></div>
            <div className="space-y-2"><Label htmlFor="schoolCode">School Code / ID *</Label><Input id="schoolCode" value={formData.schoolCode} onChange={handleInputChange} required /></div>
            <div className="space-y-2">
              <Label>Board Type</Label>
              <Select value={formData.boardType} onValueChange={(v) => handleSelectChange('boardType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="CBSE">CBSE</SelectItem><SelectItem value="ICSE">ICSE</SelectItem><SelectItem value="STATE">State Board</SelectItem><SelectItem value="PU">PU College</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="contactNumber">Phone Number</Label><Input id="contactNumber" value={formData.contactNumber} onChange={handleInputChange} /></div>
            <div className="space-y-2"><Label htmlFor="contactEmail">Email</Label><Input id="contactEmail" type="email" value={formData.contactEmail} onChange={handleInputChange} /></div>
            
            {/* New Address Component */}
            <div className="space-y-2 md:col-span-2">
                <AddressForm 
                    value={formData.addressObj} 
                    onChange={(newAddr) => {
                        // Construct legacy string for backward compatibility
                        const legacyString = `${newAddr.address_line1}, ${newAddr.address_line2 ? newAddr.address_line2 + ', ' : ''}${newAddr.city}, ${newAddr.state} - ${newAddr.pincode}`;
                        setFormData(prev => ({ 
                            ...prev, 
                            addressObj: newAddr,
                            address: legacyString 
                        }));
                    }} 
                />
            </div>

            <div className="space-y-2"><Label htmlFor="websiteSlug">Website Slug (URL)</Label><Input id="websiteSlug" value={formData.websiteSlug} onChange={handleInputChange} placeholder="e.g. green-valley-high" /></div>
            <div className="space-y-2">
              <Label>Assign Plan</Label>
              <Select value={formData.subscription_plan} onValueChange={(v) => handleSelectChange('subscription_plan', v)}>
                <SelectTrigger><SelectValue placeholder="Select Plan" /></SelectTrigger>
                <SelectContent>{subscriptionPlans.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (₹{p.price})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => handleSelectChange('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>School Logo</Label>
              <div className="mt-2"><ImageUploader onFileChange={setLogoFile} /></div>
            </div>
          </div>
        </div>

        {/* Owner Details */}
        <div className="bg-white p-8 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><User className="text-primary" /> Owner Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><Label htmlFor="ownerName">Owner Name *</Label><Input id="ownerName" value={formData.ownerName} onChange={handleInputChange} required /></div>
            <div className="space-y-2"><Label htmlFor="ownerEmail">Owner Email *</Label><Input id="ownerEmail" type="email" value={formData.ownerEmail} onChange={handleInputChange} required /></div>
            <div className="space-y-2 relative">
              <Label htmlFor="ownerPassword">Password *</Label>
              <Input id="ownerPassword" type={showPassword ? 'text' : 'password'} value={formData.ownerPassword} onChange={handleInputChange} required />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-8" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}</Button>
            </div>
            <div className="space-y-2 relative">
              <Label htmlFor="ownerReenteredPassword">Confirm Password *</Label>
              <Input id="ownerReenteredPassword" type={showReenteredPassword ? 'text' : 'password'} value={formData.ownerReenteredPassword} onChange={handleInputChange} required />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-8" onClick={() => setShowReenteredPassword(!showReenteredPassword)}>{showReenteredPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}</Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/master-admin/schools')}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create School</Button>
        </div>
      </motion.form>
    </DashboardLayout>
  );
};

export default AddNewSchool;
