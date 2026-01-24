import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Pencil, Trash2, UserCheck, ExternalLink, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const OnlineAdmissionList = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [admissions, setAdmissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolAlias, setSchoolAlias] = useState('');

  useEffect(() => {
    const fetchAdmissions = async () => {
      if (!user?.profile?.branch_id || !selectedBranch) return;
      
      try {
        setLoading(true);
        // Fetch alias for the public link
        const { data: schoolData } = await supabase.from('schools').select('cms_url_alias').eq('id', user.profile.branch_id).single();
        if (schoolData) setSchoolAlias(schoolData.cms_url_alias);

        let query = supabase
          .from('online_admissions')
          .select(`
            *,
            class:classes(name)
          `)
          .eq('branch_id', user.profile.branch_id)
          .eq('branch_id', selectedBranch.id)
          .order('created_at', { ascending: false });

        if (searchTerm) {
          query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,reference_no.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        setAdmissions(data || []);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error fetching admissions', description: error.message });
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchAdmissions, 500);
    return () => clearTimeout(timer);
  }, [user, selectedBranch, searchTerm, toast]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    try {
      const { error } = await supabase.from('online_admissions').delete().eq('id', id);
      if (error) throw error;
      setAdmissions(prev => prev.filter(a => a.id !== id));
      toast({ title: 'Deleted successfully' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting', description: error.message });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Online Admission</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage online admission applications</p>
          </div>
          {schoolAlias && (
            <Button variant="outline" asChild>
              <Link to={`/${schoolAlias}/admission`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" /> Online Admission Link
              </Link>
            </Button>
          )}
        </div>

        <div className="bg-card rounded-lg shadow p-4 border">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by Name or Ref No..." 
                className="pl-8" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Father Name</TableHead>
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Mobile Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admissions.map((admission) => (
                    <TableRow key={admission.id}>
                      <TableCell className="font-medium">{admission.reference_no}</TableCell>
                      <TableCell>{admission.first_name} {admission.last_name}</TableCell>
                      <TableCell>{admission.class?.name}</TableCell>
                      <TableCell>{admission.father_name}</TableCell>
                      <TableCell>{admission.date_of_birth ? format(new Date(admission.date_of_birth), 'dd-MMM-yyyy') : ''}</TableCell>
                      <TableCell>{admission.gender}</TableCell>
                      <TableCell>{admission.mobile_number}</TableCell>
                      <TableCell>
                        {admission.enrolled_status === 'Enrolled' ? (
                          <Badge className="bg-green-500 hover:bg-green-600"><UserCheck className="w-3 h-3 mr-1" /> Enrolled</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => navigate(`/school-owner/student-information/online-admission/edit/${admission.id}`)}
                          title={admission.enrolled_status === 'Enrolled' ? "View Details" : "Edit & Enroll"}
                        >
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(admission.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {admissions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No online admissions found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OnlineAdmissionList;
