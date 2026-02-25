import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { ROUTES } from '@/registry/routeRegistry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, Save, Building2 } from 'lucide-react';
import { usePincodeLookup } from '@/hooks/usePincodeLookup';
import { usePermissions } from '@/contexts/PermissionContext';

const EditBranch = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canEdit } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!canEdit('multi_branch.branch_list')) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to edit branches.",
        variant: "destructive"
      });
      navigate(ROUTES.SUPER_ADMIN.BRANCH_LIST);
    }
  }, [canEdit, navigate, toast]);
  
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
    is_active: true,
    description: ''
  });

  useEffect(() => {
    if (id) {
      fetchBranchDetails();
    }
  }, [id]);

  const fetchBranchDetails = async () => {
    try {
      const response = await api.get(`/branches/${id}`);
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
          is_active: branch.is_active !== false,
          description: branch.description || ''
        });
        // Set pincode, city, state
        setInitialValues(branch.pincode || '', branch.city || '', branch.state || '');
      }
    } catch (error) {
      console.error('Error fetching branch:', error);
      // Try fallback: get from list
      try {
        const listResponse = await api.get('/branches');
        if (listResponse.data.success) {
          const branch = listResponse.data.data.find(b => String(b.id) === String(id));
          if (branch) {
            setFormData({
              name: branch.name || branch.branch_name || '',
              code: branch.code || branch.branch_code || '',
              address: branch.address || '',
              phone: branch.phone || branch.contact_mobile || '',
              email: branch.email || branch.contact_email || '',
              board_type: branch.board_type || 'CBSE',
              affiliation_number: branch.affiliation_number || '',
              logo_url: branch.logo_url || '',
              is_active: branch.is_active !== false,
              description: branch.description || ''
            });
            // Set pincode, city, state
            setInitialValues(branch.pincode || '', branch.city || '', branch.state || '');
          } else {
            toast({ title: "Error", description: "Branch not found", variant: "destructive" });
            navigate(ROUTES.SUPER_ADMIN.BRANCH_LIST);
          }
        }
      } catch (e) {
        toast({ title: "Error", description: "Failed to fetch branch details", variant: "destructive" });
        navigate(ROUTES.SUPER_ADMIN.BRANCH_LIST);
      }
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
      // Include pincode, city, state, post_office in the submission
      const submitData = {
        ...formData,
        pincode,
        city,
        state,
        post_office: selectedPostOffice || undefined
      };
      
      const response = await api.put(`/branches/${id}`, submitData);
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Branch updated successfully",
        });
        navigate(ROUTES.SUPER_ADMIN.BRANCH_LIST);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout>
    <div className="p-6 max-w-4xl mx-auto">
      <Button variant="ghost" className="mb-4" onClick={() => navigate(ROUTES.SUPER_ADMIN.BRANCH_LIST)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Branches
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Edit Branch</CardTitle>
              <CardDescription>Update branch information and settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Branch Name *</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                    placeholder="e.g. Downtown Campus"
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
                    placeholder="e.g. BR001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  placeholder="Brief description of the branch"
                  rows={3}
                />
              </div>

              {/* Pincode and Location Fields */}
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

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea 
                  id="address" 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange} 
                  required 
                  placeholder="Street, Building, Landmark"
                  rows={2}
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
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
                    placeholder="Branch email"
                  />
                </div>
              </div>
            </div>

            {/* Academic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Academic Information</h3>
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
                      <SelectItem value="Cambridge">Cambridge</SelectItem>
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
            </div>

            {/* Branding */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Branding</h3>
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input 
                  id="logo_url" 
                  name="logo_url" 
                  value={formData.logo_url} 
                  onChange={handleChange} 
                  placeholder="https://example.com/logo.png"
                />
                {formData.logo_url && (
                  <div className="mt-2">
                    <img 
                      src={formData.logo_url} 
                      alt="Branch Logo Preview" 
                      className="h-20 w-20 object-contain border rounded-lg"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Status</h3>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active" className="text-base">Branch Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Inactive branches won't appear in branch selector
                  </p>
                </div>
                <Switch 
                  id="is_active" 
                  checked={formData.is_active} 
                  onCheckedChange={(checked) => handleSwitchChange('is_active', checked)} 
                />
              </div>
            </div>

          </CardContent>
          <CardFooter className="flex justify-end space-x-2 border-t pt-6">
            <Button type="button" variant="outline" onClick={() => navigate(ROUTES.SUPER_ADMIN.BRANCH_LIST)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
    </DashboardLayout>
  );
};

export default EditBranch;
