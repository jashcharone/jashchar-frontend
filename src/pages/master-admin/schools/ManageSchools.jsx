import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Plus, Search, Eye, Edit, Trash2, Power } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ManageSchools = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('schools')
      .select('*, subscription_plans!schools_plan_id_fkey(name)')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load schools.' });
    } else {
      setSchools(data || []);
    }
    setLoading(false);
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const { error } = await supabase.from('schools').update({ status: newStatus }).eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } else {
      toast({ title: 'Status Updated', description: `School is now ${newStatus}` });
      fetchSchools();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this school? This action cannot be undone.')) return;
    // Soft delete logic if column exists, else hard delete with cascade warning
    // For safety, we'll try to update status to 'Deleted' first if schema supports it, else delete
    const { error } = await supabase.from('schools').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
    } else {
      toast({ title: 'School Deleted' });
      fetchSchools();
    }
  };

  const filteredSchools = schools.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Manage Schools</h1>
          <Button onClick={() => navigate('/master-admin/schools/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add New School
          </Button>
        </div>

        <div className="flex items-center py-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search schools..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="border rounded-md bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : filteredSchools.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No schools found.</TableCell></TableRow>
              ) : (
                filteredSchools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">
                      {school.name}
                      <div className="text-xs text-muted-foreground">{school.contact_email}</div>
                    </TableCell>
                    <TableCell>{school.school_code_number || 'N/A'}</TableCell>
                    <TableCell><Badge variant="outline">{school.subscription_plans?.name || 'No Plan'}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={school.status === 'Active' ? 'default' : 'destructive'}>
                        {school.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(school.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/master-admin/schools/${school.id}`)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/master-admin/schools/${school.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusToggle(school.id, school.status)}>
                            <Power className="mr-2 h-4 w-4" /> {school.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(school.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageSchools;
