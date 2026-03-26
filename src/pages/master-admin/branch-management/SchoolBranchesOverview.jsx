import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Loader2, Building2, Search, RefreshCw, Eye, GitBranch, School, ArrowRight, MapPin
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

/**
 * Master Admin - Schools with Branches Overview
 * Shows all schools with their branch counts
 */
const SchoolBranchesOverview = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const response = await api.get('/master-admin/branch-management/schools-overview');
      if (response.data.success) {
        setSchools(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast({
        title: "Error",
        description: "Failed to fetch schools with branch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewBranches = (branchId) => {
    navigate(`/master-admin/branch-management/schools/${branchId}/branches`);
  };

  const filteredSchools = schools.filter(school => 
    school.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSchools = schools.length;
  const schoolsWithMultiBranch = schools.filter(s => s.has_multi_branch).length;
  const totalBranches = schools.reduce((acc, s) => acc + (s.branch_count || 0), 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[80vh]">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-10">
        
        {/* Header Section with Gradient */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-600 to-orange-600 p-8 text-white shadow-lg">
            <div className="relative z-10">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <GitBranch className="h-8 w-8" /> Branch Management
                </h1>
                <p className="text-indigo-100 mt-2 max-w-2xl text-lg">
                    Oversee and manage branch structures across all registered schools. Monitor multi-branch configurations and expansion.
                </p>
            </div>
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-t-4 border-t-blue-500 shadow-md hover:shadow-lg transition-all dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Schools</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{totalSchools}</p>
              </div>
              <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <School className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-emerald-500 shadow-md hover:shadow-lg transition-all dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Branches</p>
                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{totalBranches}</p>
              </div>
              <div className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                <Building2 className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-purple-500 shadow-md hover:shadow-lg transition-all dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Multi-Branch Orgs</p>
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">{schoolsWithMultiBranch}</p>
              </div>
              <div className="p-4 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <GitBranch className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Card */}
        <Card className="shadow-md border-0 dark:bg-slate-900">
          <CardHeader className="border-b dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl text-gray-800 dark:text-gray-100">Registered Schools</CardTitle>
                <CardDescription className="mt-1">Select a school to view and manage its branches</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search by name or email..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="pl-10 w-full md:w-[300px] bg-white dark:bg-slate-950 dark:border-slate-700 focus:ring-indigo-500" 
                  />
                </div>
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={fetchSchools}
                    className="dark:bg-slate-950 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredSchools.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 rounded-full bg-gray-100 dark:bg-slate-800 mb-4">
                    <School className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No schools found</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mt-1">
                    We couldn't find any schools matching your search criteria. Try adjusting your filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-gray-50 dark:bg-slate-900/50">
                    <TableRow>
                        <TableHead className="w-[250px] py-4 pl-6">Organization</TableHead>
                        <TableHead className="w-[250px]">School Details</TableHead>
                        <TableHead>Subscription Plan</TableHead>
                        <TableHead className="w-[250px]">Branches</TableHead>
                        <TableHead className="text-center">Configuration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right pr-6">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredSchools.map((school) => (
                        <TableRow 
                            key={school.id} 
                            className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors border-b dark:border-slate-800"
                        >
                        <TableCell className="py-4 pl-6">
                            {school.organization ? (
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Building2 className="h-4 w-4 text-purple-500" />
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                                            {school.organization.name}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="text-xs font-mono bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800">
                                        {school.organization.code}
                                    </Badge>
                                </div>
                            ) : (
                                <span className="text-muted-foreground italic text-sm">No Organization</span>
                            )}
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-lg">
                                    {school.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                                        {school.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        {school.email}
                                    </p>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className="bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-700 font-normal">
                                {school.plan_name || 'Free Plan'}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="font-bold bg-gray-100 dark:bg-slate-800">
                                        {school.branch_count}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">Total Branches</span>
                                </div>
                                {school.branches && school.branches.length > 0 ? (
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                        {school.branches.map(b => b.branch_name).join(', ')}
                                    </div>
                                ) : (
                                    <span className="text-xs text-muted-foreground italic mt-1">No branches created</span>
                                )}
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            {school.has_multi_branch ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                                Multi-Branch
                            </Badge>
                            ) : (
                            <Badge variant="outline" className="text-muted-foreground border-dashed">
                                Single Campus
                            </Badge>
                            )}
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${school.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                <span className="capitalize text-sm font-medium">{school.status || 'Active'}</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                            <Button 
                            size="sm" 
                            onClick={() => handleViewBranches(school.id)}
                            className="bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-sm dark:bg-slate-950 dark:border-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                            >
                            Manage Branches <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SchoolBranchesOverview;
