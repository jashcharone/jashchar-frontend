import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { ROUTES } from '@/registry/routeRegistry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { usePermissions } from '@/contexts/PermissionContext';

const BranchSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canEdit } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branch, setBranch] = useState(null);

  useEffect(() => {
    if (!canEdit('multi_branch.branch_list')) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to edit branch settings.",
        variant: "destructive"
      });
      navigate(ROUTES.SUPER_ADMIN.BRANCH_LIST);
    }
  }, [canEdit, navigate, toast]);
  
  const [branches, setBranches] = useState([]);
  const [staffList, setStaffList] = useState([]);
  
  // Form states
  const [detailsForm, setDetailsForm] = useState({});
  const [principalId, setPrincipalId] = useState('');
  const [settingsForm, setSettingsForm] = useState({});

  useEffect(() => {
    if (id) {
      fetchBranchDetails();
      fetchStaff();
      return;
    }

    // Opened from submenu without selecting a branch
    fetchBranchesForPicker();
  }, [id]);

  const fetchBranchesForPicker = async () => {
    try {
      const response = await api.get('/branches');
      if (response.data.success) {
        setBranches(response.data.data || []);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch branches', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchDetails = async () => {
    try {
      const response = await api.get('/branches');
      if (response.data.success) {
        const foundBranch = (response.data.data || []).find(b => String(b.id) === String(id));
        if (foundBranch) {
          setBranch(foundBranch);
          // Map DB columns (branch_name, branch_code, etc.) to form fields
          setDetailsForm({
            name: foundBranch.branch_name || foundBranch.name || '',
            code: foundBranch.branch_code || foundBranch.code || '',
            address: foundBranch.branch_address || foundBranch.address || '',
            phone: foundBranch.contact_number || foundBranch.phone || '',
            email: foundBranch.contact_email || foundBranch.email || '',
            board_type: foundBranch.board_type || 'CBSE',
            affiliation_number: foundBranch.affiliation_number || '',
            logo_url: foundBranch.logo_url || '',
            is_active: foundBranch.is_active !== false
          });
          setPrincipalId(foundBranch.principal_id || 'none');
          setSettingsForm(foundBranch.settings || {
            allow_online_admission: false,
            enable_transport: false,
            enable_hostel: false
          });
        } else {
          toast({ title: "Error", description: "Branch not found", variant: "destructive" });
          navigate(ROUTES.SUPER_ADMIN.BRANCH_LIST);
        }
      }
    } catch (error) {
      console.error('Error fetching branch:', error);
      toast({ title: "Error", description: "Failed to fetch branch details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      // Attempt to fetch staff list. 
      // If this endpoint doesn't exist or fails, the dropdown will just be empty.
      const response = await api.get('/staff'); 
      if (response.data.success) {
        setStaffList(response.data.data);
      }
    } catch (error) {
      console.log('Staff fetch failed or not implemented yet', error);
    }
  };

  const handleDetailsChange = (e) => {
    const { name, value } = e.target;
    setDetailsForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await api.put(`/branches/${id}`, detailsForm);
      if (response.data.success) {
        toast({ title: "Success", description: "Branch details updated" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update details", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePrincipalSubmit = async () => {
    setSaving(true);
    try {
      const response = await api.post(`/branches/${id}/assign-principal`, {
        user_id: principalId === 'none' ? null : principalId
      });
      if (response.data.success) {
        toast({ title: "Success", description: "Principal assigned successfully" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to assign principal", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSettingsChange = (key, checked) => {
    setSettingsForm(prev => ({ ...prev, [key]: checked }));
  };

  const handleSettingsSubmit = async () => {
    setSaving(true);
    try {
      const response = await api.put(`/branches/${id}/settings`, {
        settings: settingsForm
      });
      if (response.data.success) {
        toast({ title: "Success", description: "Branch settings updated" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!id) {
    return (
      <DashboardLayout>
        <div className="p-6 max-w-4xl mx-auto">
          <Button variant="ghost" className="mb-4" onClick={() => navigate(ROUTES.SUPER_ADMIN.BRANCH_LIST)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Overview
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Branch Settings</CardTitle>
              <CardDescription>Select a branch to manage its settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {branches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No branches found.</p>
                  <Button variant="link" onClick={() => navigate(ROUTES.SUPER_ADMIN.ADD_BRANCH)}>
                    Create a Branch
                  </Button>
                </div>
              ) : (
                branches.map((b) => (
                  <div key={b.id} className="flex items-center justify-between border rounded-md p-4 hover:bg-muted/50 transition-colors">
                    <div>
                      <div className="font-medium text-lg">{b.name}</div>
                      <div className="text-sm text-muted-foreground">Code: {b.code}</div>
                    </div>
                    <Button onClick={() => navigate(ROUTES.SUPER_ADMIN.BRANCH_SETTINGS.replace(':id', b.id))}>
                      Open Settings
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="p-6 max-w-4xl mx-auto">
      <Button variant="ghost" className="mb-4" onClick={() => navigate(ROUTES.SUPER_ADMIN.BRANCH_LIST)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
      </Button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Branch Settings: {branch?.name}</h1>
      </div>

      <Tabs defaultValue="details">
        <TabsList className="mb-4">
          <TabsTrigger value="details">General Details</TabsTrigger>
          <TabsTrigger value="principal">Principal Assignment</TabsTrigger>
          <TabsTrigger value="settings">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>Update basic details of the branch.</CardDescription>
            </CardHeader>
            <form onSubmit={handleDetailsSubmit}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Branch Name</Label>
                    <Input id="name" name="name" value={detailsForm.name} onChange={handleDetailsChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Branch Code</Label>
                    <Input id="code" name="code" value={detailsForm.code} onChange={handleDetailsChange} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" value={detailsForm.address} onChange={handleDetailsChange} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" value={detailsForm.phone} onChange={handleDetailsChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" value={detailsForm.email} onChange={handleDetailsChange} required />
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-4">
                  <Switch 
                    id="is_active" 
                    checked={detailsForm.is_active} 
                    onCheckedChange={(checked) => setDetailsForm(prev => ({ ...prev, is_active: checked }))} 
                  />
                  <Label htmlFor="is_active">Branch Active Status</Label>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="principal">
          <Card>
            <CardHeader>
              <CardTitle>Assign Principal</CardTitle>
              <CardDescription>Select a staff member to be the principal of this branch.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Principal</Label>
                <Select value={principalId} onValueChange={setPrincipalId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- No Principal --</SelectItem>
                    {staffList.map(staff => (
                      <SelectItem key={staff.id} value={staff.user_id || staff.id}>
                        {staff.first_name} {staff.last_name} ({staff.staff_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  The selected user will have administrative access to this branch.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handlePrincipalSubmit} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Principal
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Branch Configuration</CardTitle>
              <CardDescription>Enable or disable specific features for this branch.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Online Admission</Label>
                  <p className="text-sm text-muted-foreground">Allow students to apply online for this branch.</p>
                </div>
                <Switch 
                  checked={settingsForm.allow_online_admission} 
                  onCheckedChange={(c) => handleSettingsChange('allow_online_admission', c)} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Transport Module</Label>
                  <p className="text-sm text-muted-foreground">Enable transport management for this branch.</p>
                </div>
                <Switch 
                  checked={settingsForm.enable_transport} 
                  onCheckedChange={(c) => handleSettingsChange('enable_transport', c)} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Hostel Module</Label>
                  <p className="text-sm text-muted-foreground">Enable hostel management for this branch.</p>
                </div>
                <Switch 
                  checked={settingsForm.enable_hostel} 
                  onCheckedChange={(c) => handleSettingsChange('enable_hostel', c)} 
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSettingsSubmit} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Configuration
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </DashboardLayout>
  );
};

export default BranchSettings;
