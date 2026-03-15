/**
 * Revaluation Request Page
 * Students/Parents can request revaluation of exam marks
 * @file jashchar-frontend/src/pages/super-admin/examinations/RevaluationRequestPage.jsx
 * @date 2026-03-14
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, RotateCcw, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { revaluationService, examService } from '@/services/examinationService';
import { formatDate } from '@/utils/dateUtils';

const RevaluationRequestPage = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedExam, setSelectedExam] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      exam_id: '',
      student_name: '',
      subject_name: '',
      current_marks: 0,
      reason: '',
      request_type: 'revaluation',
    }
  });

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [selectedExam, statusFilter]);

  const fetchExams = async () => {
    try {
      const res = await examService.getAll();
      if (res.success) setExams(res.data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedExam) params.exam_id = selectedExam;
      if (statusFilter !== 'all') params.status = statusFilter;
      const response = await revaluationService.getRequests(params);
      if (response.success) setRequests(response.data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const response = await revaluationService.createRequest(data);
      if (response.success) {
        toast({ title: 'Revaluation request submitted successfully' });
        reset();
        fetchRequests();
      } else {
        throw new Error(response.error || 'Failed to submit');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: { variant: 'outline', icon: <Clock className="w-3 h-3 mr-1" />, label: 'Pending' },
      in_progress: { variant: 'secondary', icon: <RotateCcw className="w-3 h-3 mr-1" />, label: 'In Progress' },
      completed: { variant: 'default', icon: <CheckCircle className="w-3 h-3 mr-1" />, label: 'Completed' },
      rejected: { variant: 'destructive', icon: <XCircle className="w-3 h-3 mr-1" />, label: 'Rejected' },
    };
    const s = map[status] || map.pending;
    return <Badge variant={s.variant} className="flex items-center w-fit">{s.icon}{s.label}</Badge>;
  };

  const requestTypes = [
    { value: 'revaluation', label: 'Revaluation' },
    { value: 'retotaling', label: 'Re-totaling' },
    { value: 'photocopy', label: 'Photocopy Request' },
    { value: 'challenge', label: 'Challenge Evaluation' },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Revaluation Requests</h1>
            <p className="text-muted-foreground">Submit and track revaluation/re-totaling requests</p>
          </div>
          <Button variant="outline" onClick={fetchRequests} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request Form */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5" />
                  New Request
                </CardTitle>
                <CardDescription>Submit a revaluation request</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Exam</Label>
                    <Select value={watch('exam_id')} onValueChange={(val) => setValue('exam_id', val)}>
                      <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
                      <SelectContent>
                        {exams.map((e) => <SelectItem key={e.id} value={e.id}>{e.exam_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="student_name">Student Name <span className="text-destructive">*</span></Label>
                    <Input id="student_name" {...register('student_name', { required: 'Student name is required' })} className={errors.student_name ? 'border-destructive' : ''} />
                    {errors.student_name && <span className="text-xs text-destructive">{errors.student_name.message}</span>}
                  </div>

                  <div className="space-y-2">
                    <Label>Subject <span className="text-destructive">*</span></Label>
                    <Input {...register('subject_name', { required: 'Subject is required' })} className={errors.subject_name ? 'border-destructive' : ''} />
                    {errors.subject_name && <span className="text-xs text-destructive">{errors.subject_name.message}</span>}
                  </div>

                  <div className="space-y-2">
                    <Label>Current Marks</Label>
                    <Input type="number" min="0" {...register('current_marks', { valueAsNumber: true })} />
                  </div>

                  <div className="space-y-2">
                    <Label>Request Type</Label>
                    <Select value={watch('request_type')} onValueChange={(val) => setValue('request_type', val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {requestTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Reason <span className="text-destructive">*</span></Label>
                    <Textarea {...register('reason', { required: 'Reason is required' })} placeholder="Provide reason for revaluation" className={errors.reason ? 'border-destructive' : ''} />
                    {errors.reason && <span className="text-xs text-destructive">{errors.reason.message}</span>}
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Submit Request
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Request List */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Filter by Exam</Label>
                    <Select value={selectedExam} onValueChange={setSelectedExam}>
                      <SelectTrigger><SelectValue placeholder="All exams" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Exams</SelectItem>
                        {exams.map((e) => <SelectItem key={e.id} value={e.id}>{e.exam_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
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

            <Card>
              <CardHeader className="border-b">
                <CardTitle>Revaluation Requests ({requests.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                ) : requests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <RotateCcw className="w-12 h-12 mb-4 opacity-50" /><p>No revaluation requests found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Current Marks</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>New Marks</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.student_name}</TableCell>
                          <TableCell>{r.subject_name}</TableCell>
                          <TableCell>{r.current_marks}</TableCell>
                          <TableCell><Badge variant="outline">{r.request_type}</Badge></TableCell>
                          <TableCell>{getStatusBadge(r.status)}</TableCell>
                          <TableCell className="font-semibold">{r.new_marks || '-'}</TableCell>
                          <TableCell>{r.created_at ? formatDate(r.created_at) : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RevaluationRequestPage;
