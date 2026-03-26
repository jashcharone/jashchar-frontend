import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, Building2 } from 'lucide-react';
import { usePincodeLookup } from '@/hooks/usePincodeLookup';

/**
 * Master Admin - Edit Branch for a Specific School
 */
const EditBranchForSchool = () => {
  const { schoolId, branchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  
  // Pincode lookup hook
  const {
    pincode, setPincode, pincodeLoading, postOffices,
    city, setCity, state, setState,
    handlePincodeChange, setInitialValues
  } = usePincodeLookup();
  
  const [selectedPostOffice, setSelectedPostOffice] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    board_type: 'CBSE',
    affiliation_number: '',
    logo_url: '',
    is_active: true
  });

  useEffect(() => {
    fetchBranchData();
  }, [schoolId, branchId]);

  const fetchBranchData = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/master-admin/branch-management/schools/${schoolId}/branches/${branchId}`
      );
      if (response.data.success) {
        const branch = response.data.data;
        setFormData({
          name: branch.name || branch.branch_name || '',
          code: branch.code || branch.branch_code || '',
          address: branch.address || '',
          phone: branch.phone || branch.contact_mobile || '',
          email: branch.email || branch.contact_email || '',
          board_type: branch.board_type || 'CBSE',
          affiliation_number: branch.affiliation_number || '',
          logo_url: branch.logo_url || '',
          is_active: branch.is_active !== false
        });
        // Set pincode, city, state from existing data
        setInitialValues(branch.pincode || '', branch.city || '', branch.state || '');
      }

      // Fetch school name
      const schoolResponse = await api.get(
        `/master-admin/branch-management/schools/${schoolId}/branches`
      );
      if (schoolResponse.data.school) {
        setSchoolName(schoolResponse.data.school.name);
      }
    } catch (error) {
      console.error('Error fetching branch:', error);
      toast({
        title: "Error",
        description: "Failed to fetch branch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Include pincode, city, state in the submission
      const submitData = {
        ...formData,
        pincode,
        city,
        state
      };
      
      const response = await api.put(
        `/master-admin/branch-management/schools/${schoolId}/branches/${branchId}`, 
        submitData
      );
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Branch updated successfully",
        });
        navigate(`/master-admin/branch-management/schools/${schoolId}/branches`);
      }
    } catch (error) {
      console.error('Error updating branch:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update branch",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    navigate(`/master-admin/branch-management/schools/${schoolId}/branches`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <Button variant="ghost" className="mb-4" onClick={goBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Branches
        </Button>

        {schoolName && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <span className="text-blue-800 dark:text-blue-200">
              Editing branch for: <strong>{schoolName}</strong>
            </span>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Edit Branch
            </CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Status Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label htmlFor="is_active" className="text-base font-medium">Branch Status</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.is_active ? 'Branch is active and operational' : 'Branch is inactive'}
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
                />
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Branch Name *</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                    placeholder="e.g. Main Campus"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Branch Code *</Label>
                  <Input 
                    id="code" 
                    name="code" 
                    value={formData.code} 
                    onChange={handleChange} 
                    required 
                    placeholder="e.g. MAIN01"
                  />
                </div>
              </div>

              {/* Pincode and Location */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 relative">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input 
                    id="pincode" 
                    name="pincode" 
                    value={pincode} 
                    onChange={handlePincodeChange} 
                    required 
                    maxLength={6}
                    placeholder="Enter 6-digit Pincode"
                  />
                  {pincodeLoading && (
                    <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                
                {postOffices.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="post_office">Post Office</Label>
                    <Select 
                      value={selectedPostOffice} 
                      onValueChange={(value) => setSelectedPostOffice(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Post Office" />
                      </SelectTrigger>
                      <SelectContent>
                        {postOffices.map((po, idx) => (
                          <SelectItem key={idx} value={po.Name}>{po.Name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input 
                    id="city" 
                    name="city" 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)} 
                    required 
                    placeholder="City"
                    className={city ? 'bg-green-50' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input 
                    id="state" 
                    name="state" 
                    value={state} 
                    onChange={(e) => setState(e.target.value)} 
                    required 
                    placeholder="State"
                    className={state ? 'bg-green-50' : ''}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input 
                  id="address" 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange} 
                  required 
                  placeholder="Street, Building, Landmark"
                />
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    required 
                    placeholder="Contact number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email"
                    value={formData.email} 
                    onChange={handleChange} 
                    required 
                    placeholder="branch@school.com"
                  />
                </div>
              </div>

              {/* Academic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="board_type">Board Type</Label>
                  <Select 
                    value={formData.board_type} 
                    onValueChange={(value) => handleSelectChange('board_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Board" />
                    </SelectTrigger>
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
                <div className="space-y-2">
                  <Label htmlFor="affiliation_number">Affiliation Number</Label>
                  <Input 
                    id="affiliation_number" 
                    name="affiliation_number" 
                    value={formData.affiliation_number} 
                    onChange={handleChange} 
                    placeholder="e.g. CBSE12345"
                  />
                </div>
              </div>

              {/* Logo */}
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input 
                  id="logo_url" 
                  name="logo_url" 
                  value={formData.logo_url} 
                  onChange={handleChange} 
                  placeholder="https://example.com/logo.png"
                />
              </div>

            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={goBack}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EditBranchForSchool;
