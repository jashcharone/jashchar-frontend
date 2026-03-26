import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { ROUTES } from '@/registry/routeRegistry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, Building2, MapPin, Phone, Mail, School, Hash } from 'lucide-react';
import { usePincodeLookup } from '@/hooks/usePincodeLookup';
import { usePermissions } from '@/contexts/PermissionContext';
import { Separator } from '@/components/ui/separator';

const AddBranch = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canAdd, loading: permLoading } = usePermissions();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (permLoading) return; // Wait for permissions to load

    if (!canAdd('multi_branch.branch_list')) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to add branches.",
        variant: "destructive"
      });
      navigate(ROUTES.SUPER_ADMIN.BRANCH_LIST);
    }
  }, [canAdd, permLoading, navigate, toast]);

  if (permLoading) {
      return (
          <DashboardLayout>
              <div className="flex items-center justify-center h-screen">
                  <Loader2 className="h-8 w-8 animate-spin" />
              </div>
          </DashboardLayout>
      );
  }
  
  // Pincode lookup hook
  const {
    pincode, pincodeLoading, postOffices,
    city, setCity, state, setState,
    handlePincodeChange
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
    logo_url: ''
  });

  // Auto-generate Branch Code on mount
  useEffect(() => {
    const randomCode = 'BR' + Math.floor(1000 + Math.random() * 9000);
    setFormData(prev => ({ ...prev, code: randomCode }));
  }, []);

  // Handle Post Office Selection directly
  const handlePostOfficeSelect = (value) => {
    setSelectedPostOffice(value);
    if (value && postOffices.length > 0) {
      const selectedPO = postOffices.find(po => po.Name === value);
      if (selectedPO) {
        setCity(selectedPO.District);
        setState(selectedPO.State);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Mobile number validation (only numbers, max 10)
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Include pincode, city, state in the submission
      const submitData = {
        ...formData,
        pincode,
        city,
        state
      };
      
      const response = await api.post('/branches', submitData);
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Branch created successfully",
        });
        navigate(ROUTES.SUPER_ADMIN.BRANCH_LIST);
      }
    } catch (error) {
      console.error('Error creating branch:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create branch",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Branch</h1>
          <p className="text-muted-foreground mt-1">Create a new branch for your school network.</p>
        </div>
        <Button variant="outline" onClick={() => navigate(ROUTES.SUPER_ADMIN.BRANCH_LIST)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Branch Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Branch Details
                </CardTitle>
                <CardDescription>Basic information about the new branch.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Branch Name <span className="text-red-500">*</span></Label>
                    <Input 
                      id="name" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                      required 
                      placeholder="e.g. Downtown Campus"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Branch Code <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="code" 
                        name="code" 
                        value={formData.code} 
                        readOnly
                        className="pl-9 bg-muted text-muted-foreground cursor-not-allowed h-10"
                        placeholder="Auto-generated"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="board_type">Board Type</Label>
                    <Select 
                      value={formData.board_type} 
                      onValueChange={(value) => handleSelectChange('board_type', value)}
                    >
                      <SelectTrigger className="h-10">
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
                      className="h-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Location Details
                </CardTitle>
                <CardDescription>Address and location information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 relative">
                    <Label htmlFor="pincode">Pincode <span className="text-red-500">*</span></Label>
                    <Input 
                      id="pincode" 
                      name="pincode" 
                      value={pincode} 
                      onChange={handlePincodeChange} 
                      required 
                      maxLength={6}
                      placeholder="6-digit Pincode"
                      className="h-10"
                    />
                    {pincodeLoading && (
                      <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="post_office">Post Office</Label>
                    <Select 
                      value={selectedPostOffice} 
                      onValueChange={handlePostOfficeSelect}
                      disabled={postOffices.length === 0}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder={postOffices.length > 0 ? "Select Post Office" : "Enter Pincode first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {postOffices.map((po, idx) => (
                          <SelectItem key={idx} value={po.Name}>{po.Name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                    <Input 
                      id="city" 
                      name="city" 
                      value={city} 
                      onChange={(e) => setCity(e.target.value)} 
                      required 
                      placeholder="City"
                      className={`h-10 ${city ? 'bg-green-50/50 border-green-200' : ''}`}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State <span className="text-red-500">*</span></Label>
                    <Input 
                      id="state" 
                      name="state" 
                      value={state} 
                      onChange={(e) => setState(e.target.value)} 
                      required 
                      placeholder="State"
                      className={`h-10 ${state ? 'bg-green-50/50 border-green-200' : ''}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Full Address <span className="text-red-500">*</span></Label>
                  <Input 
                    id="address" 
                    name="address" 
                    value={formData.address} 
                    onChange={handleChange} 
                    required 
                    placeholder="Street, Building, Landmark"
                    className="h-10"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Contact & Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Contact Info
                </CardTitle>
                <CardDescription>Branch contact details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                  <div className="flex items-center">
                    <div className="bg-muted border border-r-0 rounded-l-md px-3 h-10 flex items-center text-sm text-muted-foreground">
                      +91
                    </div>
                    <Input 
                      id="phone" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleChange} 
                      required 
                      className="rounded-l-none h-10"
                      placeholder="10-digit mobile"
                      maxLength={10}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      name="email" 
                      type="email"
                      value={formData.email} 
                      onChange={handleChange} 
                      required 
                      className="pl-9 h-10"
                      placeholder="branch@school.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-dashed">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3">
                  <Button type="submit" disabled={loading} className="w-full h-11 text-base">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Branch...
                      </>
                    ) : (
                      <>
                        <School className="mr-2 h-4 w-4" /> Create Branch
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate(ROUTES.SUPER_ADMIN.BRANCH_LIST)} className="w-full">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </form>
    </div>
    </DashboardLayout>
  );
};

export default AddBranch;
