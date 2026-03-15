/**
 * Exam Archive Page
 * Archive past examination data for long-term storage
 * @file jashchar-frontend/src/pages/super-admin/examinations/ExamArchivePage.jsx
 * @date 2026-03-14
 */

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Loader2, RefreshCw, Archive, Download, Eye, RotateCcw } from 'lucide-react';
import { archiveService, examService } from '@/services/examinationService';
import { formatDate } from '@/utils/dateUtils';

const ExamArchivePage = () => {
  const { toast } = useToast();
  const [archives, setArchives] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState(false);
  const [selectedExam, setSelectedExam] = useState('');
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [aRes, eRes] = await Promise.all([
        archiveService.getAll(),
        examService.getAll()
      ]);
      if (aRes.success) setArchives(aRes.data || []);
      if (eRes.success) setExams(eRes.data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedExam) return;
    setArchiving(true);
    try {
      const response = await archiveService.archiveExam(selectedExam);
      if (response.success) {
        toast({ title: 'Exam archived successfully' });
        setSelectedExam('');
        setIsArchiveOpen(false);
        fetchAll();
      } else {
        throw new Error(response.error || 'Failed to archive');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setArchiving(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedArchive) return;
    setArchiving(true);
    try {
      const response = await archiveService.restoreExam(selectedArchive.id);
      if (response.success) {
        toast({ title: 'Exam restored successfully' });
        setIsRestoreOpen(false);
        setSelectedArchive(null);
        fetchAll();
      } else {
        throw new Error(response.error || 'Failed to restore');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setArchiving(false);
    }
  };

  const handleDownload = async (archiveId) => {
    try {
      const response = await archiveService.download(archiveId);
      if (response.success) {
        toast({ title: 'Archive data downloaded' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Exam Archive</h1>
            <p className="text-muted-foreground">Archive and manage past examination data for long-term storage</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchAll} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button onClick={() => setIsArchiveOpen(true)}>
              <Archive className="w-4 h-4 mr-2" /> Archive Exam
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{archives.length}</div>
              <p className="text-sm text-muted-foreground">Total Archives</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{exams.length}</div>
              <p className="text-sm text-muted-foreground">Active Exams</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{archives.filter(a => a.status === 'archived').length}</div>
              <p className="text-sm text-muted-foreground">Stored Archives</p>
            </CardContent>
          </Card>
        </div>

        {/* Archive Table */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5" />
              Archived Examinations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : archives.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Archive className="w-12 h-12 mb-4 opacity-50" /><p>No archived examinations yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Name</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Archived On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archives.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.exam_name}</TableCell>
                      <TableCell>{a.session_name || '-'}</TableCell>
                      <TableCell>{a.student_count || 0}</TableCell>
                      <TableCell>{a.subject_count || 0}</TableCell>
                      <TableCell>{a.archived_at ? formatDate(a.archived_at) : '-'}</TableCell>
                      <TableCell>
                        <Badge variant={a.status === 'archived' ? 'default' : 'secondary'}>
                          {a.status || 'Archived'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(a.id)} title="Download">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedArchive(a); setIsRestoreOpen(true); }} title="Restore">
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Archive Dialog */}
      <AlertDialog open={isArchiveOpen} onOpenChange={setIsArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Examination</AlertDialogTitle>
            <AlertDialogDescription>Select an exam to archive. This will move all associated data to archive storage.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-4">
            <Label>Select Exam</Label>
            <Select value={selectedExam} onValueChange={setSelectedExam}>
              <SelectTrigger><SelectValue placeholder="Choose exam to archive" /></SelectTrigger>
              <SelectContent>
                {exams.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.exam_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={archiving || !selectedExam}>
              {archiving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Archive className="w-4 h-4 mr-2" />}
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Dialog */}
      <AlertDialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Examination?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore "{selectedArchive?.exam_name}" from archive back to active examinations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={archiving}>
              {archiving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default ExamArchivePage;
