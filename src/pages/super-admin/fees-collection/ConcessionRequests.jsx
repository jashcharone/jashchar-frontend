import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  FileText, Plus, Loader2, MoreVertical, Check, X, Eye, Clock,
  IndianRupee, Calendar, User, AlertCircle, CheckCircle2, XCircle,
  Search, Filter, Download, MessageSquare, FileCheck, ArrowUpRight,
  Users, Receipt, Percent, Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/dateUtils';

// ═══════════════════════════════════════════════════════════════════════════════
// FEE CONCESSION REQUESTS - Request → Review → Approve/Reject Workflow
// Complete workflow for fee waivers, economic hardship, special cases
// ═══════════════════════════════════════════════════════════════════════════════

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
  under_review: { label: 'Under Review', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Eye },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
  escalated: { label: 'Escalated', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: ArrowUpRight },
};

const CONCESSION_TYPES = [
  { value: 'economic_hardship', label: 'Economic Hardship', desc: 'Financial difficulty due to family situation' },
  { value: 'medical', label: 'Medical Emergency', desc: 'Health-related expenses affecting fee payment' },
  { value: 'single_parent', label: 'Single Parent', desc: 'Single parent or guardian household' },
  { value: 'sibling_discount', label: 'Sibling Discount', desc: 'Multiple siblings in the institution' },
  { value: 'merit_based', label: 'Merit Based', desc: 'Academic excellence qualification' },
  { value: 'sports_quota', label: 'Sports Quota', desc: 'Sports achievement based' },
  { value: 'staff_ward', label: 'Staff Ward', desc: 'Child of institution employee' },
  { value: 'special_category', label: 'Special Category', desc: 'SC/ST/OBC or other reserved category' },
  { value: 'orphan', label: 'Orphan/Destitute', desc: 'No parents or guardians' },
  { value: 'other', label: 'Other', desc: 'Other valid reason with documentation' },
];

// ─────────────────────────────────────────────────────────────────────────────────
// REQUEST CARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────────

const RequestCard = ({ request, onView, onApprove, onReject, onEscalate }) => {
  const status = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;
  const concessionType = CONCESSION_TYPES.find(t => t.value === request.concession_type);
  
  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {request.student_name?.charAt(0) || 'S'}
            </div>
            <div>
              <CardTitle className="text-base">{request.student_name || 'Student'}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span>{request.admission_number || 'N/A'}</span>
                <span>•</span>
                <span>{request.class_name || 'N/A'}</span>
              </CardDescription>
            </div>
          </div>
          <Badge className={cn("border", status.color)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Requested Amount</p>
            <p className="text-lg font-bold text-blue-700">{formatCurrency(request.requested_amount)}</p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Approved Amount</p>
            <p className="text-lg font-bold text-green-700">{formatCurrency(request.approved_amount || 0)}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{concessionType?.label || request.concession_type}</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{request.reason}</p>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Requested: {formatDate(request.created_at)}</span>
          {request.documents && <span>{request.documents.length} documents</span>}
        </div>
      </CardContent>
      <CardFooter className="pt-0 gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onView(request)}>
          <Eye className="h-4 w-4 mr-1" /> View
        </Button>
        {request.status === 'pending' && (
          <>
            <Button variant="default" size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => onApprove(request)}>
              <Check className="h-4 w-4 mr-1" /> Approve
            </Button>
            <Button variant="destructive" size="sm" className="flex-1" onClick={() => onReject(request)}>
              <X className="h-4 w-4 mr-1" /> Reject
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────────

const ConcessionRequests = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  
  const branchId = selectedBranch?.id || user?.profile?.branch_id || user?.user_metadata?.branch_id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState([]);
  const [students, setStudents] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('pending');

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    student_id: '',
    concession_type: '',
    reason: '',
    requested_amount: '',
    fee_type_ids: [],
    documents: [],
  });

  const [approvalData, setApprovalData] = useState({
    approved_amount: '',
    remarks: '',
  });

  const [rejectionData, setRejectionData] = useState({
    remarks: '',
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // FETCH DATA
  // ─────────────────────────────────────────────────────────────────────────────

  const fetchRequests = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('fee_concession_requests')
        .select(`
          *,
          student:student_id (
            id,
            full_name,
            school_code,
            class:class_id (name)
          )
        `)
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data
      const transformed = (data || []).map(req => ({
        ...req,
        student_name: req.student?.full_name || 'Unknown',
        admission_number: req.student?.school_code,
        class_name: req.student?.class?.name,
      }));
      
      setRequests(transformed);
    } catch (error) {
      console.error('Fetch requests error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load concession requests' });
    }
    setLoading(false);
  }, [branchId, toast]);

  const fetchStudents = useCallback(async () => {
    if (!branchId) return;
    const { data } = await supabase
      .from('student_profiles')
      .select('id, full_name, school_code, class_id')
      .eq('branch_id', branchId)
      .or('status.is.null,status.eq.active')
      .order('full_name');
    setStudents(data || []);
  }, [branchId]);

  const fetchFeeTypes = useCallback(async () => {
    if (!branchId) return;
    const { data } = await supabase
      .from('fee_types')
      .select('id, name')
      .eq('branch_id', branchId)
      .order('name');
    setFeeTypes(data || []);
  }, [branchId]);

  useEffect(() => {
    fetchRequests();
    fetchStudents();
    fetchFeeTypes();
  }, [fetchRequests, fetchStudents, fetchFeeTypes]);

  // ─────────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormData({
      student_id: '',
      concession_type: '',
      reason: '',
      requested_amount: '',
      fee_type_ids: [],
      documents: [],
    });
  };

  const handleCreateNew = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const handleView = (request) => {
    setSelectedRequest(request);
    setShowViewDialog(true);
  };

  const handleApproveClick = (request) => {
    setSelectedRequest(request);
    setApprovalData({
      approved_amount: request.requested_amount?.toString() || '',
      remarks: '',
    });
    setShowApproveDialog(true);
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectionData({ remarks: '' });
    setShowRejectDialog(true);
  };

  const handleSubmitRequest = async () => {
    if (!formData.student_id || !formData.concession_type || !formData.reason || !formData.requested_amount) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill all required fields' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('fee_concession_requests')
        .insert({
          student_id: formData.student_id,
          requested_by: user?.id,
          concession_type: formData.concession_type,
          reason: formData.reason,
          requested_amount: parseFloat(formData.requested_amount),
          fee_type_ids: formData.fee_type_ids,
          status: 'pending',
          branch_id: branchId,
          session_id: currentSessionId,
          organization_id: organizationId,
        });

      if (error) throw error;

      toast({ title: 'Success', description: 'Concession request submitted successfully' });
      setShowCreateDialog(false);
      resetForm();
      fetchRequests();
    } catch (error) {
      console.error('Submit error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit request' });
    }
    setSaving(false);
  };

  const handleApprove = async () => {
    if (!approvalData.approved_amount) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter approved amount' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('fee_concession_requests')
        .update({
          status: 'approved',
          approved_amount: parseFloat(approvalData.approved_amount),
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          remarks: approvalData.remarks,
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast({ title: 'Approved!', description: 'Concession request has been approved' });
      setShowApproveDialog(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Approve error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to approve request' });
    }
    setSaving(false);
  };

  const handleReject = async () => {
    if (!rejectionData.remarks) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please provide rejection reason' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('fee_concession_requests')
        .update({
          status: 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          remarks: rejectionData.remarks,
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast({ title: 'Rejected', description: 'Concession request has been rejected' });
      setShowRejectDialog(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Reject error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to reject request' });
    }
    setSaving(false);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // FILTERED DATA
  // ─────────────────────────────────────────────────────────────────────────────

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.admission_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || req.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    totalRequested: requests.reduce((sum, r) => sum + (r.requested_amount || 0), 0),
    totalApproved: requests.filter(r => r.status === 'approved').reduce((sum, r) => sum + (r.approved_amount || 0), 0),
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Receipt className="h-7 w-7 text-primary" />
              Fee Concession Requests
            </h1>
            <p className="text-muted-foreground">Manage fee waiver and concession requests</p>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4 text-center">
              <p className="text-blue-100 text-sm">Total Requests</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
            <CardContent className="p-4 text-center">
              <p className="text-yellow-100 text-sm">Pending</p>
              <p className="text-3xl font-bold">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-4 text-center">
              <p className="text-green-100 text-sm">Approved</p>
              <p className="text-3xl font-bold">{stats.approved}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white">
            <CardContent className="p-4 text-center">
              <p className="text-red-100 text-sm">Rejected</p>
              <p className="text-3xl font-bold">{stats.rejected}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground text-sm">Total Requested</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalRequested)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground text-sm">Total Approved</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalApproved)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Tabs */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                <TabsList>
                  <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                  <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                  <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card className="p-12 text-center">
            <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Concession Requests</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? 'No requests match your search' : 'Create a new concession request to get started'}
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onView={handleView}
                onApprove={handleApproveClick}
                onReject={handleRejectClick}
                onEscalate={() => {}}
              />
            ))}
          </div>
        )}

        {/* Create Request Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                New Concession Request
              </DialogTitle>
              <DialogDescription>
                Submit a new fee concession request for a student
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Student *</Label>
                <Select value={formData.student_id} onValueChange={(v) => setFormData({ ...formData, student_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Search and select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.full_name} ({student.school_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Concession Type *</Label>
                <Select value={formData.concession_type} onValueChange={(v) => setFormData({ ...formData, concession_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select concession type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONCESSION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <p className="font-medium">{type.label}</p>
                          <p className="text-xs text-muted-foreground">{type.desc}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Requested Concession Amount *</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={formData.requested_amount}
                    onChange={(e) => setFormData({ ...formData, requested_amount: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reason / Justification *</Label>
                <Textarea
                  placeholder="Explain the reason for requesting concession..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleSubmitRequest} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Concession Request Details</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Student</p>
                    <p className="font-medium">{selectedRequest.student_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Admission No</p>
                    <p className="font-medium">{selectedRequest.admission_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Concession Type</p>
                    <p className="font-medium">{CONCESSION_TYPES.find(t => t.value === selectedRequest.concession_type)?.label}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={cn("border", STATUS_CONFIG[selectedRequest.status]?.color)}>
                      {STATUS_CONFIG[selectedRequest.status]?.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Requested Amount</p>
                    <p className="font-bold text-blue-600">{formatCurrency(selectedRequest.requested_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Approved Amount</p>
                    <p className="font-bold text-green-600">{formatCurrency(selectedRequest.approved_amount || 0)}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Reason</p>
                  <p className="text-sm">{selectedRequest.reason}</p>
                </div>
                {selectedRequest.remarks && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Remarks</p>
                    <p className="text-sm">{selectedRequest.remarks}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Approve Dialog */}
        <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                Approve Concession Request
              </AlertDialogTitle>
              <AlertDialogDescription>
                Approve the concession request for {selectedRequest?.student_name}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Approved Amount *</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Enter approved amount"
                    value={approvalData.approved_amount}
                    onChange={(e) => setApprovalData({ ...approvalData, approved_amount: e.target.value })}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Requested: {formatCurrency(selectedRequest?.requested_amount)}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Remarks (Optional)</Label>
                <Textarea
                  placeholder="Add any remarks..."
                  value={approvalData.remarks}
                  onChange={(e) => setApprovalData({ ...approvalData, remarks: e.target.value })}
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleApprove} className="bg-green-600 hover:bg-green-700" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Approve
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reject Dialog */}
        <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                Reject Concession Request
              </AlertDialogTitle>
              <AlertDialogDescription>
                Reject the concession request for {selectedRequest?.student_name}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Rejection Reason *</Label>
                <Textarea
                  placeholder="Provide reason for rejection..."
                  value={rejectionData.remarks}
                  onChange={(e) => setRejectionData({ ...rejectionData, remarks: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReject} className="bg-red-600 hover:bg-red-700" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Reject
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default ConcessionRequests;
