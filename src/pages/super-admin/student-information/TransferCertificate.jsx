import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { getApiBaseUrl } from '@/utils/platform';
import { formatDate } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileText, Search, Plus, Printer, Copy, X, Eye, AlertTriangle, ChevronDown, ChevronUp, GraduationCap, Calendar } from 'lucide-react';

const _apiBase = getApiBaseUrl();
const BASE_URL = _apiBase ? `${_apiBase}/api` : '/api';

const apiCall = async (endpoint, method = 'GET', body = null) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
  if (body && method !== 'GET') options.body = JSON.stringify(body);
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  return response.json();
};

// ===================== TC PRINT TEMPLATE =====================
const TCPrintTemplate = ({ tc, schoolInfo }) => {
  if (!tc) return null;
  return (
    <div className="print-only p-8 max-w-[800px] mx-auto font-serif text-black bg-white" style={{ fontSize: '14px' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wide">{schoolInfo?.name || 'School Name'}</h1>
        <p className="text-sm">{schoolInfo?.address || 'School Address'}</p>
        <p className="text-sm">Affiliation No: {schoolInfo?.affiliation_no || '___'} | School Code: {schoolInfo?.school_code || '___'}</p>
        <h2 className="text-xl font-bold mt-3 uppercase border-2 border-black inline-block px-6 py-1">
          {tc.is_duplicate ? 'DUPLICATE TRANSFER CERTIFICATE' : 'TRANSFER CERTIFICATE'}
        </h2>
      </div>

      {/* TC Number & Date */}
      <div className="flex justify-between mb-4">
        <p><strong>TC No:</strong> {tc.tc_number}</p>
        <p><strong>Date:</strong> {formatDate(tc.issued_date)}</p>
      </div>

      {/* Student Details Table */}
      <table className="w-full border-collapse" style={{ border: '1px solid black' }}>
        <tbody>
          {[
            ['1', 'Name of the Student', tc.student_name],
            ['2', "Father's Name", tc.father_name],
            ['3', "Mother's Name", tc.mother_name],
            ['4', 'Date of Birth (in words)', tc.date_of_birth ? formatDate(tc.date_of_birth) : ''],
            ['5', 'Admission Number', tc.admission_number],
            ['6', 'Date of Admission', tc.admission_date ? formatDate(tc.admission_date) : ''],
            ['7', 'Class at the time of Admission', tc.class_at_admission],
            ['8', 'Class at the time of Leaving', tc.class_at_leaving],
            ['9', 'Date of Leaving', tc.date_of_leaving ? formatDate(tc.date_of_leaving) : ''],
            ['10', 'Reason for Leaving', tc.reason_for_leaving],
            ['11', 'Conduct & Behaviour', tc.conduct],
            ['12', 'Character Certificate', tc.character_certificate],
            ['13', 'Last Examination Appeared', tc.last_exam_appeared || ''],
            ['14', 'Result of Last Examination', tc.result_of_exam || ''],
            ['15', 'Subjects Studied', tc.subjects_studied || ''],
            ['16', 'Fee Concession Availed', tc.fee_concession || 'None'],
            ['17', 'Total Working Days', tc.total_working_days || ''],
            ['18', 'Total Days Present', tc.total_present_days || ''],
            ['19', 'General Remarks', tc.general_remarks || ''],
          ].map(([num, label, value]) => (
            <tr key={num} style={{ border: '1px solid black' }}>
              <td className="p-2 text-center w-10" style={{ border: '1px solid black' }}>{num}</td>
              <td className="p-2 w-1/2" style={{ border: '1px solid black' }}>{label}</td>
              <td className="p-2 font-semibold" style={{ border: '1px solid black' }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Signatures */}
      <div className="flex justify-between mt-12 pt-4">
        <div className="text-center">
          <div className="border-t border-black w-40 pt-1">Class Teacher</div>
        </div>
        <div className="text-center">
          <div className="border-t border-black w-40 pt-1">Principal</div>
        </div>
      </div>

      {tc.is_duplicate && (
        <p className="mt-6 text-center text-sm italic text-red-600">
          This is a DUPLICATE Transfer Certificate issued on {formatDate(tc.issued_date)}
        </p>
      )}
    </div>
  );
};

// ===================== MAIN COMPONENT =====================
export default function TransferCertificate() {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();

  const [tcs, setTcs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Generate TC modal state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    date_of_leaving: new Date().toISOString().split('T')[0],
    reason_for_leaving: 'Parent Request',
    conduct: 'Good',
    character_certificate: 'Good',
    general_remarks: '',
    last_exam_appeared: '',
    result_of_exam: '',
    subjects_studied: '',
    fee_concession: 'None',
    total_working_days: '',
    total_present_days: '',
  });
  const [generating, setGenerating] = useState(false);

  // View / Print
  const [viewTC, setViewTC] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const printRef = useRef(null);

  // Cancel
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTC, setCancelTC] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // School info for print
  const [schoolInfo, setSchoolInfo] = useState(null);

  // Expanded row
  const [expandedRow, setExpandedRow] = useState(null);

  // ─── Load TCs ────────────────────
  const fetchTCs = async () => {
    if (!selectedBranch?.id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const result = await apiCall(`/transfer-certificates?${params.toString()}`);
      if (result.success) setTcs(result.data);
    } catch (e) {
      console.error('Error fetching TCs:', e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTCs(); }, [selectedBranch?.id, currentSessionId]);

  // ─── Load school info ────────────
  useEffect(() => {
    if (!selectedBranch?.id) return;
    (async () => {
      const { data } = await supabase
        .from('schools')
        .select('name, address, phone, email, logo, affiliation_no, school_code')
        .eq('id', selectedBranch.id)
        .single();
      if (data) setSchoolInfo(data);
    })();
  }, [selectedBranch?.id]);

  // ─── Search students for TC ─────
  const searchStudents = async (query) => {
    if (!query || query.length < 2) { setStudents([]); return; }
    const { data } = await supabase
      .from('student_profiles')
      .select('id, full_name, father_name, mother_name, date_of_birth, school_code, admission_date, class_id, classes!student_profiles_class_id_fkey(name), photo_url')
      .eq('branch_id', selectedBranch.id)
      .eq('session_id', currentSessionId)
      .eq('is_disabled', false)
      .or(`full_name.ilike.%${query}%,school_code.ilike.%${query}%`)
      .limit(10);
    setStudents(data || []);
  };

  useEffect(() => {
    const tid = setTimeout(() => searchStudents(studentSearch), 300);
    return () => clearTimeout(tid);
  }, [studentSearch]);

  // ─── Generate TC ────────────────
  const handleGenerateTC = async () => {
    if (!selectedStudent) return;
    setGenerating(true);
    try {
      const result = await apiCall('/transfer-certificates', 'POST', {
        student_id: selectedStudent.id,
        ...formData,
      });
      if (result.success) {
        setShowGenerateModal(false);
        setSelectedStudent(null);
        setStudentSearch('');
        setStudents([]);
        resetForm();
        fetchTCs();
      } else {
        alert(result.error || 'Failed to generate TC');
      }
    } catch (e) {
      alert('Error generating TC');
    }
    setGenerating(false);
  };

  const resetForm = () => {
    setFormData({
      date_of_leaving: new Date().toISOString().split('T')[0],
      reason_for_leaving: 'Parent Request',
      conduct: 'Good',
      character_certificate: 'Good',
      general_remarks: '',
      last_exam_appeared: '',
      result_of_exam: '',
      subjects_studied: '',
      fee_concession: 'None',
      total_working_days: '',
      total_present_days: '',
    });
  };

  // ─── Duplicate TC ───────────────
  const handleDuplicate = async (tcId) => {
    if (!confirm('Are you sure you want to generate a DUPLICATE TC?')) return;
    const result = await apiCall(`/transfer-certificates/${tcId}/duplicate`, 'POST');
    if (result.success) fetchTCs();
    else alert(result.error || 'Failed to generate duplicate');
  };

  // ─── Cancel TC ──────────────────
  const handleCancelTC = async () => {
    if (!cancelTC) return;
    const result = await apiCall(`/transfer-certificates/${cancelTC.id}/cancel`, 'PUT', { reason: cancelReason });
    if (result.success) {
      setShowCancelModal(false);
      setCancelTC(null);
      setCancelReason('');
      fetchTCs();
    } else {
      alert(result.error || 'Failed to cancel TC');
    }
  };

  // ─── Print TC ───────────────────
  const handlePrint = (tc) => {
    setViewTC(tc);
    setTimeout(() => {
      const content = printRef.current;
      if (!content) return;
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>TC - ${tc.tc_number}</title>
            <style>
              body { margin: 0; padding: 20px; font-family: 'Times New Roman', serif; font-size: 14px; }
              table { width: 100%; border-collapse: collapse; }
              td { padding: 8px; border: 1px solid #000; }
              h1 { font-size: 22px; } h2 { font-size: 18px; }
              .text-center { text-align: center; } .text-red-600 { color: #dc2626; }
              .font-bold { font-weight: bold; } .font-semibold { font-weight: 600; }
              .uppercase { text-transform: uppercase; } .italic { font-style: italic; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>${content.innerHTML}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }, 200);
  };

  const statusBadge = (status) => {
    const colors = {
      issued: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
      cancelled: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
      draft: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full border ${colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
        {status?.toUpperCase()}
      </span>
    );
  };

  const filteredTCs = tcs.filter((tc) => {
    if (search) {
      const q = search.toLowerCase();
      return tc.student_name?.toLowerCase().includes(q) ||
        tc.tc_number?.toLowerCase().includes(q) ||
        tc.admission_number?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" /> Transfer Certificate
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Generate, manage and print Transfer Certificates</p>
          </div>
          <Button onClick={() => setShowGenerateModal(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Generate TC
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, TC number, admission number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchTCs}>
                <Search className="h-4 w-4 mr-1" /> Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total TCs', value: tcs.length, color: 'text-blue-600' },
            { label: 'Issued', value: tcs.filter(t => t.status === 'issued').length, color: 'text-green-600' },
            { label: 'Cancelled', value: tcs.filter(t => t.status === 'cancelled').length, color: 'text-red-600' },
            { label: 'Duplicates', value: tcs.filter(t => t.is_duplicate).length, color: 'text-orange-600' },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* TC List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Transfer Certificates ({filteredTCs.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : filteredTCs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>No Transfer Certificates found</p>
                <p className="text-sm mt-1">Click "Generate TC" to create one</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-y text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="p-3 text-left">TC Number</th>
                      <th className="p-3 text-left">Student</th>
                      <th className="p-3 text-left hidden md:table-cell">Adm. No</th>
                      <th className="p-3 text-left hidden lg:table-cell">Class</th>
                      <th className="p-3 text-left hidden lg:table-cell">Date of Leaving</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredTCs.map((tc) => (
                      <tr key={tc.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium">
                          <div className="flex items-center gap-2">
                            {tc.tc_number}
                            {tc.is_duplicate && <Badge variant="outline" className="text-[10px]">DUP</Badge>}
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{tc.student_name}</p>
                            <p className="text-xs text-muted-foreground">{tc.father_name}</p>
                          </div>
                        </td>
                        <td className="p-3 hidden md:table-cell">{tc.admission_number}</td>
                        <td className="p-3 hidden lg:table-cell">{tc.class_at_leaving}</td>
                        <td className="p-3 hidden lg:table-cell">{formatDate(tc.date_of_leaving)}</td>
                        <td className="p-3 text-center">{statusBadge(tc.status)}</td>
                        <td className="p-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm" variant="ghost"
                              onClick={() => { setViewTC(tc); setShowViewModal(true); }}
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handlePrint(tc)} title="Print">
                              <Printer className="h-4 w-4" />
                            </Button>
                            {tc.status === 'issued' && !tc.is_duplicate && (
                              <Button size="sm" variant="ghost" onClick={() => handleDuplicate(tc.id)} title="Duplicate">
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
                            {tc.status === 'issued' && (
                              <Button
                                size="sm" variant="ghost" className="text-red-500 hover:text-red-700"
                                onClick={() => { setCancelTC(tc); setShowCancelModal(true); }}
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hidden Print Area */}
        <div ref={printRef} className="hidden">
          <TCPrintTemplate tc={viewTC} schoolInfo={schoolInfo} />
        </div>

        {/* ─── GENERATE TC MODAL ──── */}
        <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" /> Generate Transfer Certificate
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Student Search */}
              <div>
                <label className="text-sm font-medium mb-1 block">Search Student</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Type student name or admission number..."
                    value={studentSearch}
                    onChange={(e) => { setStudentSearch(e.target.value); setSelectedStudent(null); }}
                    className="pl-9"
                  />
                </div>

                {/* Student List */}
                {students.length > 0 && !selectedStudent && (
                  <div className="border rounded-md mt-2 max-h-48 overflow-y-auto divide-y">
                    {students.map((s) => (
                      <div
                        key={s.id}
                        className="p-3 hover:bg-muted/50 cursor-pointer flex items-center gap-3"
                        onClick={() => { setSelectedStudent(s); setStudents([]); setStudentSearch(s.full_name); }}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {s.full_name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{s.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.school_code} | {s.classes?.name || 'N/A'} | Father: {s.father_name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Student Card */}
                {selectedStudent && (
                  <Card className="mt-2 bg-green-50 dark:bg-green-900/20 border-green-200">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg font-bold text-green-700">
                        {selectedStudent.full_name?.[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{selectedStudent.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Adm: {selectedStudent.school_code} | Class: {selectedStudent.classes?.name} |
                          DOB: {formatDate(selectedStudent.date_of_birth)}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedStudent(null); setStudentSearch(''); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* TC Form Fields */}
              {selectedStudent && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Date of Leaving *</label>
                    <Input
                      type="date" value={formData.date_of_leaving}
                      onChange={(e) => setFormData(p => ({ ...p, date_of_leaving: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Reason for Leaving</label>
                    <Select value={formData.reason_for_leaving} onValueChange={(v) => setFormData(p => ({ ...p, reason_for_leaving: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Parent Request', 'Transfer', 'Completed Studies', 'Migration', 'Discontinued', 'Other'].map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Conduct</label>
                    <Select value={formData.conduct} onValueChange={(v) => setFormData(p => ({ ...p, conduct: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Excellent', 'Very Good', 'Good', 'Satisfactory', 'Needs Improvement'].map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Character Certificate</label>
                    <Select value={formData.character_certificate} onValueChange={(v) => setFormData(p => ({ ...p, character_certificate: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Excellent', 'Very Good', 'Good', 'Satisfactory'].map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Last Exam Appeared</label>
                    <Input
                      value={formData.last_exam_appeared}
                      onChange={(e) => setFormData(p => ({ ...p, last_exam_appeared: e.target.value }))}
                      placeholder="e.g., Final Term 2025-26"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Result of Last Exam</label>
                    <Input
                      value={formData.result_of_exam}
                      onChange={(e) => setFormData(p => ({ ...p, result_of_exam: e.target.value }))}
                      placeholder="e.g., Passed / Promoted to Class X"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-1 block">Subjects Studied</label>
                    <Input
                      value={formData.subjects_studied}
                      onChange={(e) => setFormData(p => ({ ...p, subjects_studied: e.target.value }))}
                      placeholder="e.g., English, Hindi, Maths, Science, Social Science"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Fee Concession</label>
                    <Input
                      value={formData.fee_concession}
                      onChange={(e) => setFormData(p => ({ ...p, fee_concession: e.target.value }))}
                      placeholder="None"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Total Working Days</label>
                    <Input
                      type="number" value={formData.total_working_days}
                      onChange={(e) => setFormData(p => ({ ...p, total_working_days: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Total Days Present</label>
                    <Input
                      type="number" value={formData.total_present_days}
                      onChange={(e) => setFormData(p => ({ ...p, total_present_days: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-1 block">General Remarks</label>
                    <Textarea
                      value={formData.general_remarks}
                      onChange={(e) => setFormData(p => ({ ...p, general_remarks: e.target.value }))}
                      placeholder="Any additional remarks..."
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGenerateModal(false)}>Cancel</Button>
              <Button onClick={handleGenerateTC} disabled={!selectedStudent || generating}>
                {generating ? 'Generating...' : 'Generate TC'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── VIEW TC MODAL ──── */}
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>TC Details - {viewTC?.tc_number}</DialogTitle>
            </DialogHeader>
            {viewTC && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['TC Number', viewTC.tc_number],
                    ['Status', viewTC.status?.toUpperCase()],
                    ['Student Name', viewTC.student_name],
                    ['Father Name', viewTC.father_name],
                    ['Mother Name', viewTC.mother_name],
                    ['DOB', formatDate(viewTC.date_of_birth)],
                    ['Admission No', viewTC.admission_number],
                    ['Admission Date', formatDate(viewTC.admission_date)],
                    ['Class at Admission', viewTC.class_at_admission],
                    ['Class at Leaving', viewTC.class_at_leaving],
                    ['Date of Leaving', formatDate(viewTC.date_of_leaving)],
                    ['Reason', viewTC.reason_for_leaving],
                    ['Conduct', viewTC.conduct],
                    ['Character', viewTC.character_certificate],
                    ['Issued Date', formatDate(viewTC.issued_date)],
                    ['Is Duplicate', viewTC.is_duplicate ? 'Yes' : 'No'],
                  ].map(([label, val], i) => (
                    <div key={i}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-medium">{val || '-'}</p>
                    </div>
                  ))}
                </div>
                {viewTC.general_remarks && (
                  <div>
                    <p className="text-xs text-muted-foreground">General Remarks</p>
                    <p className="text-sm">{viewTC.general_remarks}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowViewModal(false)}>Close</Button>
              <Button onClick={() => { setShowViewModal(false); handlePrint(viewTC); }}>
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── CANCEL TC MODAL ──── */}
        <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" /> Cancel TC - {cancelTC?.tc_number}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm">Are you sure you want to cancel this TC for <strong>{cancelTC?.student_name}</strong>?</p>
              <div>
                <label className="text-sm font-medium mb-1 block">Reason for Cancellation *</label>
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter reason for cancellation..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelModal(false)}>No, Keep</Button>
              <Button variant="destructive" onClick={handleCancelTC} disabled={!cancelReason.trim()}>
                Yes, Cancel TC
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
