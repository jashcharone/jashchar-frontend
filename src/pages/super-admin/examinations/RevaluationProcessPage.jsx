/**
 * Revaluation Process Page
 * Admin processes revaluation requests - assign evaluators, update marks
 * @file jashchar-frontend/src/pages/super-admin/examinations/RevaluationProcessPage.jsx
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
import { Loader2, RefreshCw, RotateCcw, CheckCircle, XCircle, UserCheck, Clock } from 'lucide-react';
import { revaluationService } from '@/services/examinationService';
import { formatDate } from '@/utils/dateUtils';

const RevaluationProcessPage = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isProcessOpen, setIsProcessOpen] = useState(false);
  const [newMarks, setNewMarks] = useState('');
  const [evaluatorRemarks, setEvaluatorRemarks] = useState('');
  const [action, setAction] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const response = await revaluationService.getRequests(params);
      if (response.success) setRequests(response.data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const openProcessDialog = (req, act) => {
    setSelectedRequest(req);
    setAction(act);
    setNewMarks('');
    setEvaluatorRemarks('');
    setIsProcessOpen(true);
  };

  const handleProcess = async () => {
    if (!selectedRequest) return;
    setProcessing(true);
    try {
      let response;
      if (action === 'complete') {
        response = await revaluationService.processRequest(selectedRequest.id, {
          new_marks: Number(newMarks) || selectedRequest.current_marks,
          evaluator_remarks: evaluatorRemarks,
          status: 'completed'
        });
      } else if (action === 'reject') {
        response = await revaluationService.processRequest(selectedRequest.id, {
          evaluator_remarks: evaluatorRemarks,
          status: 'rejected'
        });
      } else {
        response = await revaluationService.processRequest(selectedRequest.id, {
          evaluator_remarks: evaluatorRemarks,
          status: 'in_progress'
        });
      }
      if (response.success) {
        toast({ title: `Revaluation ${action === 'complete' ? 'completed' : action === 'reject' ? 'rejected' : 'marked in progress'}` });
        fetchRequests();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setProcessing(false);
      setIsProcessOpen(false);
      setSelectedRequest(null);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: { variant: 'outline', label: 'Pending' },
      in_progress: { variant: 'secondary', label: 'In Progress' },
      completed: { variant: 'default', label: 'Completed' },
      rejected: { variant: 'destructive', label: 'Rejected' },
    };
    const s = map[status] || map.pending;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Revaluation Processing</h1>
            <p className="text-muted-foreground">Process revaluation requests, assign evaluators, and update marks</p>
          </div>
          <Button variant="outline" onClick={fetchRequests} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-yellow-600">{stats.pending}</div><p className="text-sm text-muted-foreground">Pending</p></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div><p className="text-sm text-muted-foreground">In Progress</p></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{stats.completed}</div><p className="text-sm text-muted-foreground">Completed</p></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-red-600">{stats.rejected}</div><p className="text-sm text-muted-foreground">Rejected</p></CardContent></Card>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="space-y-2 w-64">
                <Label>Status Filter</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Revaluation Queue ({requests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <RotateCcw className="w-12 h-12 mb-4 opacity-50" /><p>No requests in this filter</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>New</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.student_name}</TableCell>
                      <TableCell>{r.subject_name}</TableCell>
                      <TableCell>{r.current_marks}</TableCell>
                      <TableCell className="font-semibold">{r.new_marks || '-'}</TableCell>
                      <TableCell><Badge variant="outline">{r.request_type}</Badge></TableCell>
                      <TableCell>{getStatusBadge(r.status)}</TableCell>
                      <TableCell>{r.created_at ? formatDate(r.created_at) : '-'}</TableCell>
                      <TableCell className="text-right">
                        {(r.status === 'pending' || r.status === 'in_progress') && (
                          <div className="flex justify-end gap-1">
                            {r.status === 'pending' && (
                              <Button variant="ghost" size="sm" onClick={() => openProcessDialog(r, 'start')}>
                                <UserCheck className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="text-green-600" onClick={() => openProcessDialog(r, 'complete')}>
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => openProcessDialog(r, 'reject')}>
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Process Dialog */}
      <AlertDialog open={isProcessOpen} onOpenChange={setIsProcessOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === 'complete' ? 'Complete Revaluation' : action === 'reject' ? 'Reject Request' : 'Start Processing'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRequest && `${selectedRequest.student_name} - ${selectedRequest.subject_name} (Current: ${selectedRequest.current_marks})`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-4 space-y-4">
            {action === 'complete' && (
              <div className="space-y-2">
                <Label>New Marks</Label>
                <Input type="number" min="0" value={newMarks} onChange={(e) => setNewMarks(e.target.value)} placeholder="Enter new marks after revaluation" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Evaluator Remarks</Label>
              <Textarea value={evaluatorRemarks} onChange={(e) => setEvaluatorRemarks(e.target.value)} placeholder="Add remarks" />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProcess}
              disabled={processing}
              className={action === 'reject' ? 'bg-destructive text-destructive-foreground' : ''}
            >
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {action === 'complete' ? 'Complete' : action === 'reject' ? 'Reject' : 'Start Processing'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default RevaluationProcessPage;
