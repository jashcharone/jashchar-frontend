import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2, Search, CreditCard } from 'lucide-react';

const GenerateStaffIDCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [filters, setFilters] = useState({
    role_id: '',
    template_id: ''
  });

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user]);

  const fetchInitialData = async () => {
    try {
      // Fetch Roles
      const { data: rolesData } = await supabase
        .from('roles')
        .select('*')
        .eq('branch_id', user.branch_id)
        .not('name', 'in', '("student", "parent")'); // Exclude student/parent
      setRoles(rolesData || []);

      // Fetch Staff ID Card Templates
      const { data: templatesData } = await supabase
        .from('staff_id_cards')
        .select('*')
        .eq('branch_id', user.branch_id);
      setTemplates(templatesData || []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const handleSearch = async () => {
    if (!filters.template_id) {
      toast({
        title: 'Validation Error',
        description: 'Please select an ID Card Template',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('employee_profiles')
        .select('*, roles:role_id(name), designations:designation_id(name)')
        .eq('branch_id', user.branch_id);

      if (filters.role_id) {
        query = query.eq('role_id', filters.role_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setStaff(data || []);
      setSelectedStaff([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedStaff(staff.map(s => s.id));
    } else {
      setSelectedStaff([]);
    }
  };

  const handleSelectStaff = (staffId, checked) => {
    if (checked) {
      setSelectedStaff(prev => [...prev, staffId]);
    } else {
      setSelectedStaff(prev => prev.filter(id => id !== staffId));
    }
  };

  const handleGenerate = async () => {
    if (selectedStaff.length === 0) {
      toast({
        title: 'Selection Error',
        description: 'Please select at least one staff member',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const cardsToInsert = selectedStaff.map(staffId => ({
        branch_id: user.branch_id,
        staff_id: staffId,
        id_card_template_id: filters.template_id,
        generated_date: new Date().toISOString(),
        card_data: {
            generated_by: user.id
        }
      }));

      const { error } = await supabase
        .from('generated_staff_id_cards')
        .insert(cardsToInsert);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Successfully generated ${selectedStaff.length} Staff ID Cards`
      });
      
      setSelectedStaff([]);
      
    } catch (error) {
      toast({
        title: 'Generation Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Generate Staff ID Card</h1>

        <Card>
          <CardHeader>
            <CardTitle>Select Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Role (Optional)</label>
                <Select 
                  value={filters.role_id} 
                  onValueChange={(val) => setFilters(prev => ({ ...prev, role_id: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">ID Card Template</label>
                <Select 
                  value={filters.template_id} 
                  onValueChange={(val) => setFilters(prev => ({ ...prev, template_id: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((temp) => (
                      <SelectItem key={temp.id} value={temp.id}>{temp.id_card_title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSearch} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {staff.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Staff List</CardTitle>
              <Button onClick={handleGenerate} disabled={loading || selectedStaff.length === 0}>
                <CreditCard className="mr-2 h-4 w-4" />
                Generate Selected ({selectedStaff.length})
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedStaff.length === staff.length && staff.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Staff Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedStaff.includes(employee.id)}
                          onCheckedChange={(checked) => handleSelectStaff(employee.id, checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{employee.full_name}</TableCell>
                      <TableCell>{employee.roles?.name}</TableCell>
                      <TableCell>{employee.designations?.name}</TableCell>
                      <TableCell>{employee.phone}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GenerateStaffIDCard;
