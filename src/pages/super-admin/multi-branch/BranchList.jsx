import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { ROUTES } from '@/registry/routeRegistry';
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
  Loader2, Plus, Settings, Edit, Trash2, MoreHorizontal, 
  UserCog, Building2, Search, RefreshCw, Users, GraduationCap, Star 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import DeleteBranchModal from '@/components/multi-branch/DeleteBranchModal';
import AssignPrincipalModal from '@/components/multi-branch/AssignPrincipalModal';
import { usePermissions } from '@/contexts/PermissionContext';

const BranchList = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, branch: null });
  const [principalModal, setPrincipalModal] = useState({ open: false, branch: null });
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canAdd, canEdit, canDelete } = usePermissions();
  const canAddBranch = canAdd('multi_branch.branch_list');
  const canEditBranch = canEdit('multi_branch.branch_list');
  const canDeleteBranch = canDelete('multi_branch.branch_list');

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await api.get('/branches');
      if (response.data.success) {
        setBranches(response.data.data || []);
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
    navigate(ROUTES.SUPER_ADMIN.ADD_BRANCH);
  };

  const handleEdit = (id) => {
    navigate(ROUTES.SUPER_ADMIN.EDIT_BRANCH.replace(':id', id));
  };

  const handleSettings = (id) => {
    navigate(ROUTES.SUPER_ADMIN.BRANCH_SETTINGS.replace(':id', id));
  };

  const handleDeleteClick = (branch) => {
    setDeleteModal({ open: true, branch });
  };

  const handleDeleteConfirm = async (branchId) => {
    setActionLoading(true);
    try {
      const response = await api.delete(`/branches/${branchId}`);
      if (response.data.success) {
        toast({ title: "Success", description: "Branch deleted successfully" });
        setDeleteModal({ open: false, branch: null });
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

  const handleAssignPrincipalClick = (branch) => {
    navigate(ROUTES.SUPER_ADMIN.ADD_EMPLOYEE, { state: { branch_id: branch.id, role_name: 'Principal' } });
  };

  const handleSetMainBranch = async (branchId) => {
    setActionLoading(true);
    try {
      const response = await api.put(`/branches/${branchId}/set-main`);
      if (response.data.success) {
        toast({ title: "Success", description: "Main branch updated successfully" });
        fetchBranches();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to set main branch",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignPrincipal = async (branchId, userId) => {
    setActionLoading(true);
    try {
      const response = await api.post(`/branches/${branchId}/assign-principal`, { user_id: userId });
      if (response.data.success) {
        toast({ title: "Success", description: userId ? "Principal assigned" : "Principal removed" });
        setPrincipalModal({ open: false, branch: null });
        fetchBranches();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to assign principal",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getInitials = (name) => (name || 'B').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const filteredBranches = branches.filter(branch => {
    const name = branch.name || branch.branch_name || '';
    const code = branch.code || branch.branch_code || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || code.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalBranches = branches.length;
  const activeBranches = branches.filter(b => b.is_active !== false).length;
  const branchesWithPrincipal = branches.filter(b => b.principal || b.principal_user_id).length;
  const [lastRefresh, setLastRefresh] = useState(null);

  const handleRefresh = () => {
    setLastRefresh(new Date());
    fetchBranches();
  };

  if (loading && branches.length === 0) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <DashboardLayout>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" /> Multi-Branch Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage all your school branches from one place</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canAddBranch && (
            <Button onClick={handleAddBranch} className="bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-600">
              <Plus className="mr-2 h-4 w-4" /> Add Branch
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalBranches}</p>
              <p className="text-sm text-muted-foreground">Total Branches</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeBranches}</p>
              <p className="text-sm text-muted-foreground">Active Branches</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{branchesWithPrincipal}</p>
              <p className="text-sm text-muted-foreground">With Principal</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>All Branches</CardTitle>
            <CardDescription>Complete list of school branches</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-[200px]" />
            </div>
            <Button variant="outline" size="icon" onClick={fetchBranches}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Board</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBranches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Building2 className="h-12 w-12 text-muted-foreground/50" />
                        <p className="font-medium">No branches found</p>
                        <p className="text-sm text-muted-foreground">{searchTerm ? 'Try different search' : 'Create your first branch'}</p>
                        {!searchTerm && canAddBranch && <Button onClick={handleAddBranch} className="mt-2"><Plus className="mr-2 h-4 w-4" /> Add Branch</Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBranches.map((branch, index) => {
                    const branchName = branch.name || branch.branch_name || 'Unnamed';
                    const branchCode = branch.code || branch.branch_code || '-';
                    const principal = branch.principal;
                    return (
                      <TableRow key={branch.id}>
                        <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              {branch.logo_url && <AvatarImage src={branch.logo_url} />}
                              <AvatarFallback className="bg-primary/10 text-primary">{getInitials(branchName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {branchName}
                                {branch.is_main && <Badge variant="default" className="text-[10px] h-5 px-1.5 bg-yellow-500 hover:bg-yellow-600 text-white border-none"><Star className="h-3 w-3 mr-1 fill-current" /> Main</Badge>}
                              </div>
                              {branch.address && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{branch.address}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{branchCode}</Badge></TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {branch.phone || branch.contact_mobile || '-'}
                            {(branch.email || branch.contact_email) && <p className="text-xs text-muted-foreground truncate max-w-[150px]">{branch.email || branch.contact_email}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {principal ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={principal.avatar_url} />
                                <AvatarFallback className="text-xs">{getInitials(principal.full_name || principal.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{principal.full_name || principal.name}</p>
                                <p className="text-xs text-muted-foreground">{principal.email}</p>
                              </div>
                            </div>
                          ) : (
                            canEditBranch && (
                              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => handleAssignPrincipalClick(branch)}>
                                <UserCog className="h-4 w-4 mr-1" /> Assign
                              </Button>
                            )
                          )}
                        </TableCell>
                        <TableCell><Badge variant="secondary">{branch.board_type || '-'}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={branch.is_active !== false ? "default" : "secondary"}>
                            {branch.is_active !== false ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {canEditBranch && (
                                <>
                                  <DropdownMenuItem onClick={() => handleEdit(branch.id)}><Edit className="h-4 w-4 mr-2" /> Edit Branch</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleSettings(branch.id)}><Settings className="h-4 w-4 mr-2" /> Settings</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAssignPrincipalClick(branch)}><UserCog className="h-4 w-4 mr-2" /> {principal ? 'Change' : 'Assign'} Principal</DropdownMenuItem>
                                  {!branch.is_main && (
                                    <DropdownMenuItem onClick={() => handleSetMainBranch(branch.id)}>
                                      <Star className="h-4 w-4 mr-2" /> Set as Main Branch
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                              {canDeleteBranch && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleDeleteClick(branch)} className="text-destructive focus:text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <DeleteBranchModal open={deleteModal.open} onOpenChange={(open) => setDeleteModal({ ...deleteModal, open })} branch={deleteModal.branch} onConfirm={handleDeleteConfirm} loading={actionLoading} />
      <AssignPrincipalModal open={principalModal.open} onOpenChange={(open) => setPrincipalModal({ ...principalModal, open })} branch={principalModal.branch} onAssign={handleAssignPrincipal} loading={actionLoading} />
    </div>
    </DashboardLayout>
  );
};

export default BranchList;
