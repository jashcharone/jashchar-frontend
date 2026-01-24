import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Loader2, Plus, Edit, Trash2, MoreHorizontal, 
  Building2, Search, RefreshCw, ArrowLeft, School
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

/**
 * Master Admin - Manage Branches for a Specific School
 */
const SchoolBranches = () => {
  const { branchId } = useParams();
  const [branches, setBranches] = useState([]);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, branch: null });
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchBranches();
  }, [branchId]);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/master-admin/branch-management/schools/${branchId}/branches`);
      if (response.data.success) {
        setBranches(response.data.data || []);
        setSchool(response.data.school || null);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast({
        title: "Error",
        description: "Failed to fetch branches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = () => {
    navigate(`/master-admin/branch-management/schools/${branchId}/branches/add`);
  };

  const handleEdit = (branchId) => {
    navigate(`/master-admin/branch-management/schools/${branchId}/branches/${branchId}/edit`);
  };

  const handleDeleteClick = (branch) => {
    setDeleteDialog({ open: true, branch });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.branch) return;
    
    setActionLoading(true);
    try {
      const response = await api.delete(
        `/master-admin/branch-management/schools/${branchId}/branches/${deleteDialog.branch.id}`
      );
      if (response.data.success) {
        toast({ title: "Success", description: "Branch deleted successfully" });
        setDeleteDialog({ open: false, branch: null });
        fetchBranches();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete branch",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getInitials = (name) => (name || 'B').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const filteredBranches = branches.filter(branch => {
    const name = branch.branch_name || '';
    const code = branch.branch_code || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           code.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Button 
              variant="ghost" 
              className="mb-2 -ml-2" 
              onClick={() => navigate('/master-admin/branch-management')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Schools
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8" /> 
              {school?.name || 'School'} - Branches
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage branches for this school
            </p>
          </div>
          <Button onClick={handleAddBranch} size="lg">
            <Plus className="mr-2 h-5 w-5" /> Add New Branch
          </Button>
        </div>

        {/* School Info Card */}
        {school && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <School className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{school.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {branches.length} branch{branches.length !== 1 ? 'es' : ''} configured
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Branches Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>All Branches</CardTitle>
              <CardDescription>Complete list of school branches</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-9 w-[200px]" 
                />
              </div>
              <Button variant="outline" size="icon" onClick={fetchBranches}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredBranches.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">No branches found for this school</p>
                <Button onClick={handleAddBranch}>
                  <Plus className="mr-2 h-4 w-4" /> Create First Branch
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Board</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBranches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={branch.logo_url} alt={branch.branch_name} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(branch.branch_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{branch.branch_name}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {branch.address || 'No address'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{branch.branch_code}</Badge>
                      </TableCell>
                      <TableCell>{branch.board_type || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{branch.contact_email || '-'}</p>
                          <p className="text-muted-foreground">{branch.contact_mobile || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={branch.is_active !== false ? 'default' : 'secondary'}>
                          {branch.is_active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEdit(branch.id)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit Branch
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteClick(branch)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Branch
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, branch: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteDialog.branch?.branch_name}</strong>? 
              This action cannot be undone and will remove all branch data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default SchoolBranches;
