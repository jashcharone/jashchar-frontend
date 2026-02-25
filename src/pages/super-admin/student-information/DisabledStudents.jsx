import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Search, Eye, RefreshCcw, UserX, Users, Loader2, 
  Copy, FileDown, Printer, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ROUTES } from '@/registry/routeRegistry';
import { sortClasses, sortSections } from '@/utils/classOrderUtils';

const DisabledStudents = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Data States
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [disableReasons, setDisableReasons] = useState([]);
  
  // Filter States
  const [filters, setFilters] = useState({ 
    class_id: '', 
    section_id: '', 
    keyword: '',
    reason_id: ''
  });
  
  // Selection States
  const [selectedStudents, setSelectedStudents] = useState([]);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  // Dialog States
  const [isEnableDialogOpen, setIsEnableDialogOpen] = useState(false);
  const [studentToEnable, setStudentToEnable] = useState(null);
  const [isBulkEnableDialogOpen, setIsBulkEnableDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Helper function to get reason text from ID
  const getReasonText = (reasonId) => {
    if (!reasonId) return null;
    const reason = disableReasons.find(r => r.id === reasonId);
    return reason?.reason || null;
  };

  // Fetch classes and disable reasons on mount
  useEffect(() => {
    if (!selectedBranch?.id) return;
    
    const fetchPrereqs = async () => {
      // Fetch classes
      const { data: classData } = await supabase
        .from('classes')
        .select('id, name')
        .eq('branch_id', selectedBranch.id);
      setClasses(sortClasses(classData || []));
      
      // Fetch disable reasons
      const { data: reasonsData } = await supabase
        .from('disable_reasons')
        .select('id, reason')
        .eq('branch_id', selectedBranch.id)
        .order('reason');
      setDisableReasons(reasonsData || []);
    };
    fetchPrereqs();
  }, [selectedBranch]);

  // Fetch sections when class changes
  useEffect(() => {
    if (filters.class_id) {
      const fetchSections = async () => {
        const { data } = await supabase
          .from('class_sections')
          .select('sections(id, name)')
          .eq('class_id', filters.class_id);
        const sectionsList = data ? data.map(item => item.sections).filter(Boolean) : [];
        setSections(sortSections(sectionsList));
      };
      fetchSections();
    } else {
      setSections([]);
    }
  }, [filters.class_id]);

  // Auto-search on component mount
  useEffect(() => {
    if (selectedBranch?.id) {
      handleSearch();
    }
  }, [selectedBranch]);

  // Re-fetch when session changes from header dropdown
  useEffect(() => {
    if (currentSessionId && selectedBranch?.id) {
      handleSearch();
    }
  }, [currentSessionId]);

  const handleSearch = async () => {
    if (!selectedBranch?.id) {
      toast({ variant: 'destructive', title: 'Please select a branch' });
      return;
    }
    
    setLoading(true);
    
    // Use session from header dropdown (currentSessionId) — respects user's session selection
    const activeSessionId = currentSessionId;

    let query = supabase
      .from('student_profiles')
      .select(`
        id, full_name, first_name, last_name, school_code, roll_number, gender, 
        date_of_birth, phone, photo_url, father_name, is_disabled, disabled_at, 
        disable_note, disable_reason_id, session_id,
        class:classes!student_profiles_class_id_fkey(name),
        section:sections!student_profiles_section_id_fkey(name)
      `)
      .eq('branch_id', selectedBranch.id)
      .eq('is_disabled', true)
      .order('disabled_at', { ascending: false });
    
    // Filter by session
    if (activeSessionId) {
      query = query.eq('session_id', activeSessionId);
    }
    
    // Apply filters
    if (filters.class_id) {
      query = query.eq('class_id', filters.class_id);
    }
    if (filters.section_id && filters.section_id !== 'all') {
      query = query.eq('section_id', filters.section_id);
    }
    if (filters.reason_id && filters.reason_id !== 'all') {
      query = query.eq('disable_reason_id', filters.reason_id);
    }
    if (filters.keyword) {
      query = query.or(`full_name.ilike.%${filters.keyword}%,school_code.ilike.%${filters.keyword}%,phone.ilike.%${filters.keyword}%`);
    }

    const { data, error, count } = await query;
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching students', description: error.message });
      setStudents([]);
    } else {
      setStudents(data || []);
      if (data && data.length > 0) {
        toast({ title: `${data.length} disabled students found` });
      }
    }
    
    setSelectedStudents([]);
    setLoading(false);
  };

  // Enable single student
  const handleEnableStudent = async () => {
    if (!studentToEnable) return;
    setActionLoading(true);
    
    const { error } = await supabase
      .from('student_profiles')
      .update({
        is_disabled: false,
        disabled_at: null,
        disable_reason_id: null,
        disable_note: null,
        status: 'Active'
      })
      .eq('id', studentToEnable.id);
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error enabling student', description: error.message });
    } else {
      toast({ title: 'Success', description: `${studentToEnable.full_name} has been re-enabled` });
      setStudents(prev => prev.filter(s => s.id !== studentToEnable.id));
    }
    
    setActionLoading(false);
    setIsEnableDialogOpen(false);
    setStudentToEnable(null);
  };

  // Bulk enable students
  const handleBulkEnable = async () => {
    if (selectedStudents.length === 0) return;
    setActionLoading(true);
    
    const { error } = await supabase
      .from('student_profiles')
      .update({
        is_disabled: false,
        disabled_at: null,
        disable_reason_id: null,
        disable_note: null,
        status: 'Active'
      })
      .in('id', selectedStudents);
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error enabling students', description: error.message });
    } else {
      toast({ title: 'Success', description: `${selectedStudents.length} students have been re-enabled` });
      setStudents(prev => prev.filter(s => !selectedStudents.includes(s.id)));
      setSelectedStudents([]);
    }
    
    setActionLoading(false);
    setIsBulkEnableDialogOpen(false);
  };

  // Copy to clipboard
  const handleCopyToClipboard = useCallback(() => {
    if (students.length === 0) {
      toast({ variant: 'destructive', title: 'No data to copy' });
      return;
    }
    const headers = ['Name', 'Class', 'Section', 'Admission No', 'Father', 'Reason', 'Disabled Date'];
    const rows = students.map(s => [
      s.full_name || '',
      s.class?.name || '',
      s.section?.name || '',
      s.school_code || '',
      s.father_name || '',
      getReasonText(s.disable_reason_id) || s.disable_note || '',
      s.disabled_at ? format(new Date(s.disabled_at), 'dd/MM/yyyy') : ''
    ].join('\t'));
    navigator.clipboard.writeText([headers.join('\t'), ...rows].join('\n'));
    toast({ title: 'Copied!', description: `${students.length} records copied` });
  }, [students, toast, disableReasons]);

  // Export to Excel
  const handleExportExcel = useCallback(() => {
    if (students.length === 0) {
      toast({ variant: 'destructive', title: 'No data to export' });
      return;
    }
    const headers = ['Name', 'Class', 'Section', 'Admission No', 'Phone', 'Father', 'Reason', 'Note', 'Disabled Date'];
    const rows = students.map(s => [
      s.full_name || '',
      s.class?.name || '',
      s.section?.name || '',
      s.school_code || '',
      s.phone || '',
      s.father_name || '',
      getReasonText(s.disable_reason_id) || '',
      s.disable_note || '',
      s.disabled_at ? format(new Date(s.disabled_at), 'dd/MM/yyyy') : ''
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disabled_students_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast({ title: 'Downloaded!', description: `${students.length} records exported` });
  }, [students, toast, disableReasons]);

  // Print functionality
  const handlePrint = useCallback(() => {
    if (students.length === 0) {
      toast({ variant: 'destructive', title: 'No data to print' });
      return;
    }
    
    // Pre-compute reason texts for students
    const studentsWithReasons = students.map(s => ({
      ...s,
      reasonText: disableReasons.find(r => r.id === s.disable_reason_id)?.reason || s.disable_note || ''
    }));
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
      <head><title>Disabled Students List</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #dc2626; color: white; }
        tr:nth-child(even) { background-color: #fef2f2; }
        h1 { color: #dc2626; }
      </style>
      </head>
      <body>
      <h1>Disabled Students List</h1>
      <p>Total: ${students.length} | Printed: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
      <table>
        <thead><tr><th>#</th><th>Name</th><th>Class</th><th>Admission No</th><th>Father</th><th>Reason</th><th>Disabled Date</th></tr></thead>
        <tbody>
        ${studentsWithReasons.map((s, i) => `<tr>
          <td>${i + 1}</td>
          <td>${s.full_name || ''}</td>
          <td>${s.class?.name || ''}-${s.section?.name || ''}</td>
          <td>${s.school_code || ''}</td>
          <td>${s.father_name || ''}</td>
          <td>${s.reasonText}</td>
          <td>${s.disabled_at ? format(new Date(s.disabled_at), 'dd/MM/yyyy') : ''}</td>
        </tr>`).join('')}
        </tbody>
      </table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  }, [students, disableReasons]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key === 'class_id') setFilters(prev => ({ ...prev, section_id: '' }));
  };

  const toggleSelectAll = () => {
    setSelectedStudents(prev => 
      prev.length === students.length ? [] : students.map(s => s.id)
    );
  };

  const toggleSelectStudent = (id) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  // Pagination
  const paginatedStudents = students.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(students.length / pageSize);

  // Stats
  const reasonCounts = students.reduce((acc, s) => {
    const reason = getReasonText(s.disable_reason_id) || 'Other';
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserX className="h-6 w-6 text-red-500" />
          Disabled Students
        </h1>
        {selectedStudents.length > 0 && (
          <Button 
            variant="default" 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setIsBulkEnableDialogOpen(true)}
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> 
            Re-Enable Selected ({selectedStudents.length})
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-red-50 dark:bg-red-950 border-red-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{students.length}</div>
            <div className="text-sm text-red-700">Total Disabled</div>
          </CardContent>
        </Card>
        {Object.entries(reasonCounts).slice(0, 3).map(([reason, count]) => (
          <Card key={reason} className="border-gray-200">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm text-muted-foreground truncate" title={reason}>{reason}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div>
              <label className="text-sm font-medium mb-1 block">Class</label>
              <Select value={filters.class_id} onValueChange={v => handleFilterChange('class_id', v)}>
                <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Section</label>
              <Select value={filters.section_id} onValueChange={v => handleFilterChange('section_id', v)} disabled={!filters.class_id}>
                <SelectTrigger><SelectValue placeholder="All Sections" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Reason</label>
              <Select value={filters.reason_id} onValueChange={v => handleFilterChange('reason_id', v)}>
                <SelectTrigger><SelectValue placeholder="All Reasons" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reasons</SelectItem>
                  {disableReasons.map(r => <SelectItem key={r.id} value={r.id}>{r.reason}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Search</label>
              <Input 
                placeholder="Name, Admission No, Phone..." 
                value={filters.keyword} 
                onChange={e => handleFilterChange('keyword', e.target.value)} 
              />
            </div>
            <Button onClick={handleSearch} disabled={loading} className="h-10">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      {students.length > 0 && (
        <Card>
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" title="Copy" onClick={handleCopyToClipboard}><Copy className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" title="Excel" onClick={handleExportExcel}><FileDown className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" title="Print" onClick={handlePrint}><Printer className="h-4 w-4" /></Button>
            </div>
            <Badge variant="destructive">{students.length} Disabled Students</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-red-50 dark:bg-red-950/50">
                <tr className="border-b">
                  <th className="p-3 w-10">
                    <Checkbox 
                      checked={selectedStudents.length === students.length && students.length > 0} 
                      onCheckedChange={toggleSelectAll} 
                    />
                  </th>
                  <th className="p-3 text-left font-medium">Photo</th>
                  <th className="p-3 text-left font-medium">Student Name</th>
                  <th className="p-3 text-left font-medium">Class</th>
                  <th className="p-3 text-left font-medium">Admission No</th>
                  <th className="p-3 text-left font-medium">Father Name</th>
                  <th className="p-3 text-left font-medium">Disable Reason</th>
                  <th className="p-3 text-left font-medium">Note</th>
                  <th className="p-3 text-left font-medium">Disabled Date</th>
                  <th className="p-3 text-center font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <Checkbox 
                        checked={selectedStudents.includes(s.id)} 
                        onCheckedChange={() => toggleSelectStudent(s.id)} 
                      />
                    </td>
                    <td className="p-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={s.photo_url} alt={s.full_name} className="object-cover grayscale" />
                        <AvatarFallback className="bg-red-100 text-red-600 font-semibold">
                          {s.first_name?.charAt(0)}{s.last_name?.charAt(0) || s.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </td>
                    <td className="p-3">
                      <span 
                        className="font-medium text-primary hover:underline cursor-pointer"
                        onClick={() => navigate(ROUTES.SUPER_ADMIN.STUDENT_PROFILE.replace(':studentId', s.id))}
                      >
                        {s.full_name}
                      </span>
                      <div className="text-xs text-muted-foreground">{s.phone}</div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{s.class?.name}-{s.section?.name}</Badge>
                    </td>
                    <td className="p-3 font-mono text-sm">{s.school_code}</td>
                    <td className="p-3">{s.father_name || '-'}</td>
                    <td className="p-3">
                      <Badge variant="destructive" className="font-normal">
                        {getReasonText(s.disable_reason_id) || 'N/A'}
                      </Badge>
                    </td>
                    <td className="p-3 max-w-[150px] truncate" title={s.disable_note}>
                      {s.disable_note || '-'}
                    </td>
                    <td className="p-3 text-sm">
                      {s.disabled_at ? format(new Date(s.disabled_at), 'dd MMM yyyy') : '-'}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 bg-blue-500/10 hover:bg-blue-500/20" 
                          onClick={() => navigate(ROUTES.SUPER_ADMIN.STUDENT_PROFILE.replace(':studentId', s.id))} 
                          title="View Profile"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 bg-green-500/10 hover:bg-green-500/20" 
                          onClick={() => { setStudentToEnable(s); setIsEnableDialogOpen(true); }}
                          title="Re-Enable Student"
                        >
                          <RefreshCcw className="h-4 w-4 text-green-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t">
            <span className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, students.length)} of {students.length}
            </span>
            <div className="flex items-center gap-2">
              <Select value={pageSize.toString()} onValueChange={v => { setPageSize(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 py-1 bg-red-600 text-white rounded text-sm font-medium">{currentPage}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {students.length === 0 && !loading && (
        <Card className="p-10">
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No Disabled Students Found</p>
            <p className="text-sm mt-1">All students in this session are active.</p>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="p-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p>Loading disabled students...</p>
          </div>
        </Card>
      )}

      {/* Single Enable Dialog */}
      <AlertDialog open={isEnableDialogOpen} onOpenChange={setIsEnableDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-Enable Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to re-enable <strong>{studentToEnable?.full_name}</strong>?
              <br />
              The student will be able to appear in attendance, fees, and other modules again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleEnableStudent} 
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Re-Enable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Enable Dialog */}
      <AlertDialog open={isBulkEnableDialogOpen} onOpenChange={setIsBulkEnableDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-Enable Multiple Students</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to re-enable <strong>{selectedStudents.length}</strong> students?
              <br />
              All selected students will become active again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkEnable} 
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Re-Enable All ({selectedStudents.length})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default DisabledStudents;
