import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import supabase from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Search, FileSpreadsheet, FileText, Loader2, Users, BookOpen,
  Shield, Clock, Key, UserPlus, Users2, BarChart3, GraduationCap,
  ChevronLeft, ChevronRight, User, Calendar
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// 📊 STUDENT INFORMATION REPORT - 100-Year Future-Proof Design
// ═══════════════════════════════════════════════════════════════════
// 13 Sub-reports with Excel & PDF Download
// Fully multi-tenant: organization_id + branch_id + session_id
// ═══════════════════════════════════════════════════════════════════

const REPORT_TYPES = [
  { key: 'student_report', label: 'Student Report', icon: Users, color: 'bg-blue-500' },
  { key: 'student_history', label: 'Student History', icon: Clock, color: 'bg-purple-500' },
  { key: 'class_subject_report', label: 'Class Subject Report', icon: BookOpen, color: 'bg-teal-500' },
  { key: 'student_profile', label: 'Student Profile', icon: User, color: 'bg-indigo-500' },
  { key: 'online_admission_report', label: 'Online Admission Report', icon: UserPlus, color: 'bg-pink-500' },
  { key: 'class_section_report', label: 'Class & Section Report', icon: GraduationCap, color: 'bg-green-500' },
  { key: 'student_login_credential', label: 'Student Login Credential', icon: Key, color: 'bg-amber-500' },
  { key: 'admission_report', label: 'Admission Report', icon: UserPlus, color: 'bg-rose-500' },
  { key: 'gender_ratio_report', label: 'Student Gender Ratio Report', icon: BarChart3, color: 'bg-cyan-500' },
  { key: 'guardian_report', label: 'Guardian Report', icon: Shield, color: 'bg-orange-500' },
  { key: 'parent_login_credential', label: 'Parent Login Credential', icon: Key, color: 'bg-lime-500' },
  { key: 'sibling_report', label: 'Sibling Report', icon: Users2, color: 'bg-violet-500' },
  { key: 'student_teacher_ratio', label: 'Student Teacher Ratio Report', icon: BarChart3, color: 'bg-sky-500' },
];

// ═══════════ EXPORT UTILITIES ═══════════

const exportToCSV = (data, columns, filename) => {
  if (!data || data.length === 0) return;
  const headers = columns.map(c => c.label).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      const val = typeof c.accessor === 'function' ? c.accessor(row) : (row[c.accessor] ?? '');
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(',')
  );
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

const exportToPDF = (data, columns, title) => {
  if (!data || data.length === 0) return;
  const printWindow = window.open('', '_blank');
  const tableRows = data.map(row =>
    `<tr>${columns.map(c => {
      const val = typeof c.accessor === 'function' ? c.accessor(row) : (row[c.accessor] ?? '');
      return `<td style="border:1px solid #ddd;padding:6px 10px;font-size:11px;">${val}</td>`;
    }).join('')}</tr>`
  ).join('');

  printWindow.document.write(`
    <html><head><title>${title}</title>
    <style>
      body{font-family:Arial,sans-serif;margin:20px;}
      h2{color:#1a365d;margin-bottom:5px;}
      p{color:#666;font-size:12px;margin-bottom:15px;}
      table{width:100%;border-collapse:collapse;font-size:11px;}
      th{background:#2563eb;color:white;padding:8px 10px;text-align:left;border:1px solid #2563eb;}
      td{border:1px solid #ddd;padding:6px 10px;}
      tr:nth-child(even){background:#f8f9fa;}
      .footer{margin-top:20px;font-size:10px;color:#999;text-align:center;}
    </style></head><body>
    <h2>${title}</h2>
    <p>Generated: ${new Date().toLocaleString('en-IN')} | Total Records: ${data.length}</p>
    <table>
      <thead><tr>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
    <div class="footer">Jashchar ERP - Student Information Report</div>
    </body></html>
  `);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 300);
};

// ═══════════ PAGINATION COMPONENT ═══════════

const Pagination = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }) => {
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between mt-4 px-2 flex-wrap gap-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Show</span>
        <Select value={String(itemsPerPage)} onValueChange={v => onItemsPerPageChange(Number(v))}>
          <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[10, 25, 50, 100, 250].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
        <span>entries</span>
      </div>
      <div className="text-sm text-muted-foreground">
        Showing {totalItems > 0 ? start : 0} to {end} of {totalItems} entries
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let page;
          if (totalPages <= 5) { page = i + 1; }
          else if (currentPage <= 3) { page = i + 1; }
          else if (currentPage >= totalPages - 2) { page = totalPages - 4 + i; }
          else { page = currentPage - 2 + i; }
          return (
            <Button key={page} variant={page === currentPage ? 'default' : 'outline'} size="sm"
              className="w-8 h-8" onClick={() => onPageChange(page)}>
              {page}
            </Button>
          );
        })}
        <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// ═══════════ DATA TABLE COMPONENT ═══════════

const DataTable = ({ data, columns, loading, title, searchText, onSearchChange }) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  useEffect(() => { setPage(1); }, [data?.length]);

  const filtered = useMemo(() => {
    if (!searchText || !data) return data || [];
    const lower = searchText.toLowerCase();
    return data.filter(row =>
      columns.some(c => {
        const val = typeof c.accessor === 'function' ? c.accessor(row) : (row[c.accessor] ?? '');
        return String(val).toLowerCase().includes(lower);
      })
    );
  }, [data, searchText, columns]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice((page - 1) * perPage, page * perPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading report data...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Input
            type="text" placeholder="Search in results..."
            value={searchText} onChange={e => onSearchChange(e.target.value)}
            className="w-64 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToCSV(filtered, columns, title)}
            className="text-green-700 border-green-300 hover:bg-green-50">
            <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToPDF(filtered, columns, title)}
            className="text-red-700 border-red-300 hover:bg-red-50">
            <FileText className="h-4 w-4 mr-1" /> PDF
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-auto max-h-[600px]">
        <Table>
          <TableHeader className="sticky top-0 bg-primary z-10">
            <TableRow>
              <TableHead className="text-primary-foreground font-semibold text-xs w-12">#</TableHead>
              {columns.map(c => (
                <TableHead key={c.key} className="text-primary-foreground font-semibold text-xs whitespace-nowrap">{c.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-10 text-muted-foreground">
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              pageData.map((row, idx) => (
                <TableRow key={row.id || idx} className="hover:bg-accent/50">
                  <TableCell className="text-xs text-muted-foreground">{(page - 1) * perPage + idx + 1}</TableCell>
                  {columns.map(c => (
                    <TableCell key={c.key} className="text-xs whitespace-nowrap">
                      {typeof c.accessor === 'function' ? c.accessor(row) : (row[c.accessor] ?? '-')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > 0 && (
        <Pagination
          currentPage={page} totalPages={totalPages} totalItems={filtered.length}
          itemsPerPage={perPage} onPageChange={setPage}
          onItemsPerPageChange={v => { setPerPage(v); setPage(1); }}
        />
      )}
    </div>
  );
};

// ═══════════ MAIN COMPONENT ═══════════

const StudentInformationReport = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();

  const [activeReport, setActiveReport] = useState('student_report');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [searchText, setSearchText] = useState('');

  // Dropdown data
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sessions, setSessions] = useState([]);

  // Filters
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedRte, setSelectedRte] = useState('');
  const [selectedSearchType, setSelectedSearchType] = useState('this_month');
  const [admissionYear, setAdmissionYear] = useState('');
  const [selectedSession, setSelectedSession] = useState('');

  const branchId = selectedBranch?.id;

  // ═══════════ LOAD DROPDOWN DATA ═══════════
  useEffect(() => {
    if (!branchId) return;
    const loadDropdowns = async () => {
      try {
        const [classRes, catRes, sessRes] = await Promise.all([
          api.get('/academics/classes'),
          api.get('/academics/student-categories').catch(() => ({ data: [] })),
          supabase.from('sessions').select('id, name, is_active').eq('branch_id', branchId).order('name', { ascending: false })
        ]);
        setClasses(Array.isArray(classRes.data) ? classRes.data : classRes.data?.data || []);
        setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.data || []);
        setSessions(sessRes.data || []);
        
        // Auto-select current session
        if (currentSessionId) {
          setSelectedSession(currentSessionId);
        } else {
          const activeSession = (sessRes.data || []).find(s => s.is_active);
          if (activeSession) setSelectedSession(activeSession.id);
        }
      } catch (err) {
        console.error('Failed to load dropdowns:', err);
      }
    };
    loadDropdowns();
  }, [branchId, currentSessionId]);

  // Load sections when class changes
  useEffect(() => {
    if (!selectedClass) { setSections([]); return; }
    const loadSections = async () => {
      try {
        const res = await api.get(`/academics/sections?classId=${selectedClass}`);
        setSections(Array.isArray(res.data) ? res.data : res.data?.data || []);
      } catch (err) {
        console.error('Failed to load sections:', err);
        setSections([]);
      }
    };
    loadSections();
  }, [selectedClass]);

  // Reset filters on report change
  useEffect(() => {
    setReportData([]);
    setSearchText('');
    setSelectedClass('');
    setSelectedSection('');
    setSelectedCategory('');
    setSelectedGender('');
    setSelectedRte('');
    setSelectedSearchType('this_month');
    setAdmissionYear('');
    // Keep selectedSession as it is - don't reset
  }, [activeReport]);

  // ═══════════ FETCH REPORT DATA ═══════════
  const fetchReport = useCallback(async () => {
    if (!branchId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a branch first.' });
      return;
    }

    setLoading(true);
    setSearchText('');
    try {
      let endpoint = '';
      const params = new URLSearchParams();

      // Add session filter for all reports
      if (selectedSession) {
        params.append('sessionId', selectedSession);
      }

      switch (activeReport) {
        case 'student_report':
        case 'student_profile':
        case 'class_subject_report':
          endpoint = '/student-reports/student-report';
          if (selectedClass) params.append('classId', selectedClass);
          if (selectedSection) params.append('sectionId', selectedSection);
          if (selectedCategory) params.append('categoryId', selectedCategory);
          if (selectedGender) params.append('gender', selectedGender);
          if (selectedRte) params.append('isRte', selectedRte);
          break;

        case 'class_section_report':
          endpoint = '/student-reports/class-section-report';
          break;

        case 'guardian_report':
          endpoint = '/student-reports/guardian-report';
          if (selectedClass) params.append('classId', selectedClass);
          if (selectedSection) params.append('sectionId', selectedSection);
          break;

        case 'student_history':
          endpoint = '/student-reports/student-history';
          if (selectedClass) params.append('classId', selectedClass);
          if (admissionYear) params.append('admissionYear', admissionYear);
          break;

        case 'student_login_credential':
        case 'parent_login_credential':
          endpoint = '/student-reports/login-credential-report';
          if (selectedClass) params.append('classId', selectedClass);
          if (selectedSection) params.append('sectionId', selectedSection);
          break;

        case 'admission_report':
        case 'online_admission_report':
          endpoint = '/student-reports/admission-report';
          if (selectedSearchType) params.append('searchType', selectedSearchType);
          break;

        case 'sibling_report':
          endpoint = '/student-reports/sibling-report';
          if (selectedClass) params.append('classId', selectedClass);
          if (selectedSection) params.append('sectionId', selectedSection);
          break;

        case 'gender_ratio_report':
          endpoint = '/student-reports/gender-ratio-report';
          break;

        case 'student_teacher_ratio':
          endpoint = '/student-reports/student-teacher-ratio';
          break;

        default:
          endpoint = '/student-reports/student-report';
      }

      const queryString = params.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      const res = await api.get(url);

      const result = res.data?.data || res.data || [];
      setReportData(result);

      if (Array.isArray(result) && result.length === 0) {
        toast({ title: 'No Records', description: 'No data found for the selected criteria.' });
      }
    } catch (error) {
      console.error(`[${activeReport}] Error:`, error);
      toast({ variant: 'destructive', title: 'Error', description: error.response?.data?.message || error.message });
      setReportData([]);
    } finally {
      setLoading(false);
    }
  }, [activeReport, branchId, selectedClass, selectedSection, selectedCategory, selectedGender, selectedRte, selectedSearchType, admissionYear, selectedSession, toast]);

  // ═══════════ COLUMN DEFINITIONS ═══════════
  const getColumns = () => {
    switch (activeReport) {
      case 'student_report':
        return [
          { key: 'class', label: 'Class', accessor: r => r.class?.name || '-' },
          { key: 'section', label: 'Section', accessor: r => r.section?.name || '-' },
          { key: 'admission_no', label: 'Admission No', accessor: 'admission_number' },
          { key: 'student_name', label: 'Student Name', accessor: r => [r.first_name, r.last_name].filter(Boolean).join(' ') || r.full_name || '-' },
          { key: 'father_name', label: 'Father Name', accessor: 'father_name' },
          { key: 'dob', label: 'Date Of Birth', accessor: r => r.date_of_birth ? new Date(r.date_of_birth).toLocaleDateString('en-IN') : '-' },
          { key: 'gender', label: 'Gender', accessor: 'gender' },
          { key: 'category', label: 'Admission Type', accessor: r => r.category?.name || '-' },
          { key: 'mobile', label: 'Mobile Number', accessor: 'phone' },
          { key: 'aadhaar', label: 'National ID (Aadhaar)', accessor: 'aadhar_no' },
        ];

      case 'student_profile':
        return [
          { key: 'admission_no', label: 'Admission No', accessor: 'admission_number' },
          { key: 'student_name', label: 'Student Name', accessor: r => [r.first_name, r.last_name].filter(Boolean).join(' ') || r.full_name || '-' },
          { key: 'class', label: 'Class', accessor: r => r.class?.name || '-' },
          { key: 'section', label: 'Section', accessor: r => r.section?.name || '-' },
          { key: 'father_name', label: 'Father Name', accessor: 'father_name' },
          { key: 'dob', label: 'Date Of Birth', accessor: r => r.date_of_birth ? new Date(r.date_of_birth).toLocaleDateString('en-IN') : '-' },
          { key: 'gender', label: 'Gender', accessor: 'gender' },
          { key: 'mobile', label: 'Mobile', accessor: 'phone' },
          { key: 'email', label: 'Email', accessor: 'email' },
        ];

      case 'class_section_report':
        return [
          { key: 'class', label: 'Class', accessor: 'className' },
          { key: 'students', label: 'Total Students', accessor: 'totalStudents' },
          { key: 'sections', label: 'Section Breakdown', accessor: r => (r.sections || []).map(s => `${s.sectionName} (${s.students})`).join(', ') || 'No sections' },
        ];

      case 'guardian_report':
        return [
          { key: 'class_section', label: 'Class (Section)', accessor: r => `${r.class?.name || '-'} (${r.section?.name || '-'})` },
          { key: 'admission_no', label: 'Admission No', accessor: 'admission_number' },
          { key: 'student_name', label: 'Student Name', accessor: r => [r.first_name, r.last_name].filter(Boolean).join(' ') || r.full_name || '-' },
          { key: 'mobile', label: 'Mobile Number', accessor: 'phone' },
          { key: 'guardian_name', label: 'Guardian Name', accessor: 'guardian_name' },
          { key: 'guardian_relation', label: 'Guardian Relation', accessor: 'guardian_relation' },
          { key: 'guardian_phone', label: 'Guardian Phone', accessor: 'guardian_phone' },
          { key: 'father_name', label: 'Father Name', accessor: 'father_name' },
          { key: 'father_phone', label: 'Father Phone', accessor: 'father_phone' },
          { key: 'mother_name', label: 'Mother Name', accessor: 'mother_name' },
          { key: 'mother_phone', label: 'Mother Phone', accessor: 'mother_phone' },
        ];

      case 'student_history':
        return [
          { key: 'admission_no', label: 'Admission No', accessor: 'admission_number' },
          { key: 'student_name', label: 'Student Name', accessor: r => [r.first_name, r.last_name].filter(Boolean).join(' ') || '-' },
          { key: 'admission_date', label: 'Admission Date', accessor: r => r.admission_date ? new Date(r.admission_date).toLocaleDateString('en-IN') : '-' },
          { key: 'class', label: 'Class', accessor: r => r.class?.name || '-' },
          { key: 'section', label: 'Section', accessor: r => r.section?.name || '-' },
          { key: 'mobile', label: 'Mobile Number', accessor: 'phone' },
          { key: 'guardian_name', label: 'Guardian Name', accessor: 'guardian_name' },
          { key: 'guardian_phone', label: 'Guardian Phone', accessor: 'guardian_phone' },
        ];

      case 'student_login_credential':
        return [
          { key: 'admission_no', label: 'Admission No', accessor: 'admission_number' },
          { key: 'student_name', label: 'Student Name', accessor: r => [r.first_name, r.last_name].filter(Boolean).join(' ') || '-' },
          { key: 'class', label: 'Class', accessor: r => r.class?.name || '-' },
          { key: 'section', label: 'Section', accessor: r => r.section?.name || '-' },
          { key: 'username', label: 'Username', accessor: 'email' },
          { key: 'phone', label: 'Phone', accessor: 'phone' },
        ];

      case 'parent_login_credential':
        return [
          { key: 'admission_no', label: 'Admission No', accessor: 'admission_number' },
          { key: 'student_name', label: 'Student Name', accessor: r => [r.first_name, r.last_name].filter(Boolean).join(' ') || '-' },
          { key: 'class', label: 'Class', accessor: r => r.class?.name || '-' },
          { key: 'father_name', label: 'Father Name', accessor: 'father_name' },
          { key: 'father_phone', label: 'Father Phone', accessor: 'father_phone' },
          { key: 'mother_name', label: 'Mother Name', accessor: 'mother_name' },
          { key: 'mother_phone', label: 'Mother Phone', accessor: 'mother_phone' },
          { key: 'guardian_name', label: 'Guardian Name', accessor: 'guardian_name' },
          { key: 'guardian_phone', label: 'Guardian Phone', accessor: 'guardian_phone' },
        ];

      case 'admission_report':
      case 'online_admission_report':
        return [
          { key: 'admission_no', label: 'Admission No', accessor: 'admission_number' },
          { key: 'student_name', label: 'Student Name', accessor: r => [r.first_name, r.last_name].filter(Boolean).join(' ') || '-' },
          { key: 'class', label: 'Class', accessor: r => r.class?.name || '-' },
          { key: 'father_name', label: 'Father Name', accessor: 'father_name' },
          { key: 'dob', label: 'Date Of Birth', accessor: r => r.date_of_birth ? new Date(r.date_of_birth).toLocaleDateString('en-IN') : '-' },
          { key: 'admission_date', label: 'Admission Date', accessor: r => r.admission_date ? new Date(r.admission_date).toLocaleDateString('en-IN') : '-' },
          { key: 'gender', label: 'Gender', accessor: 'gender' },
          { key: 'category', label: 'Admission Type', accessor: r => r.category?.name || '-' },
          { key: 'mobile', label: 'Mobile Number', accessor: 'phone' },
        ];

      case 'gender_ratio_report':
        return [
          { key: 'class', label: 'Class', accessor: 'className' },
          { key: 'male', label: 'Boys', accessor: 'male' },
          { key: 'female', label: 'Girls', accessor: 'female' },
          { key: 'other', label: 'Other', accessor: 'other' },
          { key: 'total', label: 'Total', accessor: 'total' },
        ];

      case 'student_teacher_ratio':
        return [
          { key: 'class', label: 'Class', accessor: 'className' },
          { key: 'students', label: 'Students', accessor: 'students' },
          { key: 'teachers', label: 'Teachers', accessor: 'teachers' },
          { key: 'ratio', label: 'Ratio (S:T)', accessor: 'ratio' },
        ];

      case 'class_subject_report':
        return [
          { key: 'admission_no', label: 'Admission No', accessor: 'admission_number' },
          { key: 'student_name', label: 'Student Name', accessor: r => [r.first_name, r.last_name].filter(Boolean).join(' ') || '-' },
          { key: 'class', label: 'Class', accessor: r => r.class?.name || '-' },
          { key: 'section', label: 'Section', accessor: r => r.section?.name || '-' },
          { key: 'gender', label: 'Gender', accessor: 'gender' },
          { key: 'mobile', label: 'Mobile', accessor: 'phone' },
        ];

      default:
        return [
          { key: 'admission_no', label: 'Admission No', accessor: 'admission_number' },
          { key: 'student_name', label: 'Student Name', accessor: r => [r.first_name, r.last_name].filter(Boolean).join(' ') || '-' },
        ];
    }
  };

  // Normalize data for special report structures
  const getTableData = () => {
    if (activeReport === 'gender_ratio_report') return reportData?.classes || [];
    if (activeReport === 'student_teacher_ratio') return reportData?.classes || [];
    if (activeReport === 'sibling_report') {
      const flat = [];
      (reportData || []).forEach((group, gIdx) => {
        group.students.forEach((s, sIdx) => {
          flat.push({
            ...s, id: s.id || `${gIdx}-${sIdx}`,
            groupNo: gIdx + 1,
            fatherName: group.fatherName,
            fatherPhone: group.fatherPhone,
            motherName: group.motherName
          });
        });
      });
      return flat;
    }
    return Array.isArray(reportData) ? reportData : [];
  };

  const getSiblingColumns = () => [
    { key: 'group', label: 'Group #', accessor: 'groupNo' },
    { key: 'admission_no', label: 'Admission No', accessor: 'admissionNo' },
    { key: 'student_name', label: 'Student Name', accessor: 'name' },
    { key: 'class', label: 'Class', accessor: 'className' },
    { key: 'section', label: 'Section', accessor: 'sectionName' },
    { key: 'father_name', label: 'Father Name', accessor: 'fatherName' },
    { key: 'father_phone', label: 'Father Phone', accessor: 'fatherPhone' },
    { key: 'mother_name', label: 'Mother Name', accessor: 'motherName' },
    { key: 'phone', label: 'Student Phone', accessor: 'phone' },
  ];

  const columns = activeReport === 'sibling_report' ? getSiblingColumns() : getColumns();
  const tableData = getTableData();
  const activeReportInfo = REPORT_TYPES.find(r => r.key === activeReport);

  // Session dropdown component (reusable)
  const SessionDropdown = () => (
    <div>
      <Label className="text-xs font-medium mb-1 block">Session <span className="text-red-500">*</span></Label>
      <Select value={selectedSession} onValueChange={setSelectedSession}>
        <SelectTrigger className="h-9">
          <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
          <SelectValue placeholder="Select Session" />
        </SelectTrigger>
        <SelectContent>
          {sessions.map(s => (
            <SelectItem key={s.id} value={s.id}>
              {s.name} {s.is_active ? '(Active)' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  // ═══════════ RENDER FILTER SECTION ═══════════
  const renderFilters = () => {
    switch (activeReport) {
      case 'student_report':
      case 'student_profile':
      case 'class_subject_report':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <SessionDropdown />
            <div>
              <Label className="text-xs font-medium mb-1 block">Class <span className="text-red-500">*</span></Label>
              <Select value={selectedClass} onValueChange={v => { setSelectedClass(v); setSelectedSection(''); }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1 block">Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1 block">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1 block">Gender</Label>
              <Select value={selectedGender} onValueChange={setSelectedGender}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1 block">RTE</Label>
              <Select value={selectedRte} onValueChange={setSelectedRte}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchReport} className="w-full h-9 bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
                Generate Report
              </Button>
            </div>
          </div>
        );

      case 'guardian_report':
      case 'student_login_credential':
      case 'parent_login_credential':
      case 'sibling_report':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <SessionDropdown />
            <div>
              <Label className="text-xs font-medium mb-1 block">Class <span className="text-red-500">*</span></Label>
              <Select value={selectedClass} onValueChange={v => { setSelectedClass(v); setSelectedSection(''); }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1 block">Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchReport} className="h-9 bg-blue-600 hover:bg-blue-700 px-8" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
                Generate Report
              </Button>
            </div>
          </div>
        );

      case 'student_history':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <SessionDropdown />
            <div>
              <Label className="text-xs font-medium mb-1 block">Class <span className="text-red-500">*</span></Label>
              <Select value={selectedClass} onValueChange={v => { setSelectedClass(v); setSelectedSection(''); }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1 block">Admission Year</Label>
              <Input
                type="number" placeholder="e.g. 2024" value={admissionYear}
                onChange={e => setAdmissionYear(e.target.value)} className="h-9"
                min="2000" max="2100"
              />
            </div>
            <div className="flex items-end col-span-1 sm:col-span-2">
              <Button onClick={fetchReport} className="h-9 bg-blue-600 hover:bg-blue-700 px-8" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
                Generate Report
              </Button>
            </div>
          </div>
        );

      case 'admission_report':
      case 'online_admission_report':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <SessionDropdown />
            <div>
              <Label className="text-xs font-medium mb-1 block">Search Type <span className="text-red-500">*</span></Label>
              <Select value={selectedSearchType} onValueChange={setSelectedSearchType}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                  <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end col-span-2">
              <Button onClick={fetchReport} className="h-9 bg-blue-600 hover:bg-blue-700 px-8" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
                Generate Report
              </Button>
            </div>
          </div>
        );

      case 'class_section_report':
      case 'gender_ratio_report':
      case 'student_teacher_ratio':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <SessionDropdown />
            <div className="flex items-end sm:col-span-2">
              <Button onClick={fetchReport} className="h-9 bg-blue-600 hover:bg-blue-700 px-8" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
                Generate Report
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ═══════════ TOTALS ROW FOR SPECIAL REPORTS ═══════════
  const renderTotalsRow = () => {
    if (activeReport === 'gender_ratio_report' && reportData?.totals) {
      const t = reportData.totals;
      return (
        <div className="mt-3 p-3 bg-muted rounded-lg flex items-center gap-6 text-sm font-semibold">
          <span>Totals:</span>
          <span className="text-blue-500">Boys: {t.male}</span>
          <span className="text-pink-500">Girls: {t.female}</span>
          <span className="text-muted-foreground">Other: {t.other}</span>
          <span className="text-foreground">Grand Total: {t.total}</span>
        </div>
      );
    }
    if (activeReport === 'student_teacher_ratio' && reportData?.totals) {
      const t = reportData.totals;
      return (
        <div className="mt-3 p-3 bg-muted rounded-lg flex items-center gap-6 text-sm font-semibold">
          <span>Overall:</span>
          <span className="text-blue-500">Students: {t.students}</span>
          <span className="text-green-500">Teachers: {t.teachers}</span>
          <span className="text-foreground">Ratio: {t.ratio}</span>
        </div>
      );
    }
    if (activeReport === 'class_section_report' && tableData.length > 0) {
      const totalStudents = tableData.reduce((sum, r) => sum + (r.totalStudents || 0), 0);
      return (
        <div className="mt-3 p-3 bg-muted rounded-lg flex items-center gap-6 text-sm font-semibold">
          <span>Total Classes: {tableData.length}</span>
          <span className="text-blue-500">Total Students: {totalStudents}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
    <div className="p-4 md:p-6 space-y-4">
      {/* ═══════════ PAGE HEADER ═══════════ */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Student Information Report</h1>
      </div>

      {/* ═══════════ REPORT NAVIGATION GRID ═══════════ */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {REPORT_TYPES.map(report => {
              const Icon = report.icon;
              const isActive = activeReport === report.key;
              return (
                <button
                  key={report.key}
                  onClick={() => setActiveReport(report.key)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all text-xs font-medium
                    ${isActive
                      ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border'
                    }`}
                >
                  <div className={`p-1.5 rounded ${isActive ? 'bg-white/20' : 'bg-primary/10'}`}>
                    <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
                  </div>
                  <span className="truncate">{report.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ═══════════ FILTER + RESULTS ═══════════ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {activeReportInfo && <activeReportInfo.icon className="h-5 w-5 text-primary" />}
            {activeReportInfo?.label || 'Report'}
            {tableData.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-normal">
                {tableData.length} records
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Select Criteria */}
          <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3">Select Criteria</h3>
            {renderFilters()}
          </div>

          {/* Results Table */}
          {(tableData.length > 0 || loading) && (
            <div>
              <DataTable
                data={tableData}
                columns={columns}
                loading={loading}
                title={activeReportInfo?.label || 'Report'}
                searchText={searchText}
                onSearchChange={setSearchText}
              />
              {renderTotalsRow()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
};

export default StudentInformationReport;
