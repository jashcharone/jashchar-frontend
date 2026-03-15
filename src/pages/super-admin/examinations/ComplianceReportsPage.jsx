/**
 * Compliance Reports Page
 * Generate compliance and audit reports for examination module
 * @file jashchar-frontend/src/pages/super-admin/examinations/ComplianceReportsPage.jsx
 * @date 2026-03-14
 */

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { Loader2, RefreshCw, FileCheck, Download, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { complianceService, examService } from '@/services/examinationService';
import { formatDate } from '@/utils/dateUtils';

const ComplianceReportsPage = () => {
  const { toast } = useToast();
  const [reports, setReports] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedExam, setSelectedExam] = useState('');
  const [reportType, setReportType] = useState('compliance_summary');
  const [activeTab, setActiveTab] = useState('reports');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rRes, eRes, aRes] = await Promise.all([
        complianceService.getReports(),
        examService.getAll(),
        complianceService.getAuditTrail()
      ]);
      if (rRes.success) setReports(rRes.data || []);
      if (eRes.success) setExams(eRes.data || []);
      if (aRes.success) setAuditTrail(aRes.data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const response = await complianceService.generateReport({
        exam_id: selectedExam || undefined,
        report_type: reportType,
      });
      if (response.success) {
        toast({ title: 'Compliance report generated successfully' });
        fetchAll();
      } else {
        throw new Error(response.error || 'Failed to generate');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (reportId) => {
    try {
      const response = await complianceService.downloadReport(reportId);
      if (response.success) {
        toast({ title: 'Report downloaded' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const reportTypes = [
    { value: 'compliance_summary', label: 'Compliance Summary' },
    { value: 'marks_audit', label: 'Marks Audit Report' },
    { value: 'moderation_report', label: 'Moderation Report' },
    { value: 'revaluation_report', label: 'Revaluation Report' },
    { value: 'result_verification', label: 'Result Verification Report' },
    { value: 'data_integrity', label: 'Data Integrity Check' },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Compliance Reports</h1>
            <p className="text-muted-foreground">Generate and manage examination compliance and audit reports</p>
          </div>
          <Button variant="outline" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {/* Report Generation */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              Generate Report
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Exam (Optional)</Label>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger><SelectValue placeholder="All exams" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Exams</SelectItem>
                    {exams.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.exam_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Button onClick={generateReport} disabled={generating} className="w-full">
                  {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileCheck className="w-4 h-4 mr-2" />}
                  Generate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tab Toggle */}
        <div className="flex gap-2">
          <Button variant={activeTab === 'reports' ? 'default' : 'outline'} onClick={() => setActiveTab('reports')}>
            <FileCheck className="w-4 h-4 mr-2" /> Reports
          </Button>
          <Button variant={activeTab === 'audit' ? 'default' : 'outline'} onClick={() => setActiveTab('audit')}>
            <Shield className="w-4 h-4 mr-2" /> Audit Trail
          </Button>
        </div>

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Generated Reports ({reports.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
              ) : reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileCheck className="w-12 h-12 mb-4 opacity-50" /><p>No compliance reports generated yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report Type</TableHead>
                      <TableHead>Exam</TableHead>
                      <TableHead>Generated</TableHead>
                      <TableHead>Generated By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.report_type}</TableCell>
                        <TableCell>{r.exam_name || 'All Exams'}</TableCell>
                        <TableCell>{r.created_at ? formatDate(r.created_at) : '-'}</TableCell>
                        <TableCell>{r.generated_by_name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={r.status === 'completed' ? 'default' : 'outline'}>
                            {r.status === 'completed' ? <CheckCircle className="w-3 h-3 mr-1" /> : null}
                            {r.status || 'Completed'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(r.id)}>
                            <Download className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Audit Trail Tab */}
        {activeTab === 'audit' && (
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Audit Trail ({auditTrail.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
              ) : auditTrail.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Shield className="w-12 h-12 mb-4 opacity-50" /><p>No audit trail entries found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditTrail.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <Badge variant={a.action === 'delete' ? 'destructive' : a.action === 'create' ? 'default' : 'outline'}>
                            {a.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{a.entity_type} {a.entity_id && `#${a.entity_id.slice(0, 8)}`}</TableCell>
                        <TableCell>{a.user_name || a.user_id}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{a.details || '-'}</TableCell>
                        <TableCell>{a.created_at ? formatDate(a.created_at) : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ComplianceReportsPage;
