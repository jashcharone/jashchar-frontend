/**
 * Verification Dashboard
 * Review and verify exam results with approval workflow
 * @file jashchar-frontend/src/pages/super-admin/examinations/VerificationDashboard.jsx
 * @date 2026-03-14
 */

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, XCircle, Eye, ShieldCheck, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { verificationService, examService } from '@/services/examinationService';

const VerificationDashboard = () => {
  const { toast } = useToast();
  const [verifications, setVerifications] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam) fetchVerifications();
  }, [selectedExam, statusFilter]);

  const fetchExams = async () => {
    try {
      const res = await examService.getAll();
      if (res.success) setExams(res.data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const params = { exam_id: selectedExam };
      if (statusFilter !== 'all') params.status = statusFilter;
      const response = await verificationService.getAll(params);
      if (response.success) setVerifications(response.data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedItem) return;
    setProcessing(true);
    try {
      const response = await verificationService.approve(selectedItem.id, { remarks });
      if (response.success) {
        toast({ title: 'Verification approved successfully' });
        fetchVerifications();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setProcessing(false);
      setIsApproveOpen(false);
      setSelectedItem(null);
      setRemarks('');
    }
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    setProcessing(true);
    try {
      const response = await verificationService.reject(selectedItem.id, { remarks });
      if (response.success) {
        toast({ title: 'Verification rejected' });
        fetchVerifications();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setProcessing(false);
      setIsRejectOpen(false);
      setSelectedItem(null);
      setRemarks('');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { variant: 'outline', icon: <Clock className="w-3 h-3 mr-1" />, label: 'Pending' },
      approved: { variant: 'default', icon: <CheckCircle className="w-3 h-3 mr-1" />, label: 'Approved' },
      rejected: { variant: 'destructive', icon: <XCircle className="w-3 h-3 mr-1" />, label: 'Rejected' },
      flagged: { variant: 'secondary', icon: <AlertTriangle className="w-3 h-3 mr-1" />, label: 'Flagged' },
    };
    const s = variants[status] || variants.pending;
    return <Badge variant={s.variant} className="flex items-center w-fit">{s.icon}{s.label}</Badge>;
  };

  const stats = {
    total: verifications.length,
    pending: verifications.filter(v => v.status === 'pending').length,
    approved: verifications.filter(v => v.status === 'approved').length,
    rejected: verifications.filter(v => v.status === 'rejected').length,
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Verification Dashboard</h1>
            <p className="text-muted-foreground">Review and verify exam results before publishing</p>
          </div>
          <Button variant="outline" onClick={fetchVerifications} disabled={loading || !selectedExam}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{stats.total}</div><p className="text-sm text-muted-foreground">Total Records</p></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div><p className="text-sm text-muted-foreground">Pending</p></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.approved}</div><p className="text-sm text-muted-foreground">Approved</p></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</div><p className="text-sm text-muted-foreground">Rejected</p></CardContent></Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Select Exam</Label>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger><SelectValue placeholder="Choose exam" /></SelectTrigger>
                  <SelectContent>
                    {exams.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.exam_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status Filter</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Table */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Verification Records
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!selectedExam ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShieldCheck className="w-12 h-12 mb-4 opacity-50" /><p>Select an exam to view verification records</p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : verifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShieldCheck className="w-12 h-12 mb-4 opacity-50" /><p>No verification records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Verified By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verifications.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.student_name || v.student_id}</TableCell>
                      <TableCell>{v.subject_name || v.subject_id}</TableCell>
                      <TableCell className="font-semibold">{v.marks_obtained}/{v.total_marks}</TableCell>
                      <TableCell>{v.verified_by_name || '-'}</TableCell>
                      <TableCell>{getStatusBadge(v.status)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{v.remarks || '-'}</TableCell>
                      <TableCell className="text-right">
                        {v.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" className="text-green-600 dark:text-green-400" onClick={() => { setSelectedItem(v); setIsApproveOpen(true); }}>
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { setSelectedItem(v); setIsRejectOpen(true); }}>
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
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

      {/* Approve Dialog */}
      <AlertDialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Verification?</AlertDialogTitle>
            <AlertDialogDescription>Confirm that the marks are verified and correct.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-4">
            <Label>Remarks (optional)</Label>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add verification remarks" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemarks('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Verification?</AlertDialogTitle>
            <AlertDialogDescription>The marks will be sent back for re-entry.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-4">
            <Label>Rejection Reason <span className="text-destructive">*</span></Label>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Provide reason for rejection" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemarks('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={processing || !remarks.trim()} className="bg-destructive text-destructive-foreground">
              {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default VerificationDashboard;
