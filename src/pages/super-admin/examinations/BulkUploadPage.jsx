/**
 * Bulk Upload Page - Marks Entry via Excel/CSV
 * Phase 4 of Examination Module
 * @file jashchar-frontend/src/pages/super-admin/examinations/BulkUploadPage.jsx
 * @date 2026-03-13
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { 
    examGroupService, 
    examService, 
    bulkUploadService 
} from '@/services/examinationService';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatDateTime } from '@/utils/dateUtils';
import DashboardLayout from '@/components/DashboardLayout';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

// Icons
import { 
    Upload,
    Download,
    Sheet,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Clock,
    RefreshCw,
    History
} from 'lucide-react';

const BulkUploadPage = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const fileInputRef = useRef(null);

    // Selection State
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [uploadType, setUploadType] = useState('theory'); // theory, practical, internal

    // Data State
    const [examGroups, setExamGroups] = useState([]);
    const [exams, setExams] = useState([]);
    const [subjects, setSubjects] = useState([]);

    // Upload State
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);

    // History State
    const [uploadHistory, setUploadHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Dialogs
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Stats
    const [previewStats, setPreviewStats] = useState({ total: 0, valid: 0, errors: 0 });

    // Fetch exam groups on mount
    useEffect(() => {
        fetchExamGroups();
        fetchUploadHistory();
    }, []);

    // Fetch exams when group changes
    useEffect(() => {
        if (selectedGroup) {
            fetchExams(selectedGroup);
        } else {
            setExams([]);
            setSelectedExam('');
        }
    }, [selectedGroup]);

    // Fetch subjects when exam changes
    useEffect(() => {
        if (selectedExam) {
            fetchSubjects(selectedExam);
        } else {
            setSubjects([]);
            setSelectedSubject('');
        }
    }, [selectedExam]);

    const fetchExamGroups = async () => {
        try {
            const response = await examGroupService.getAll({ status: 'published' });
            if (response.success) {
                setExamGroups(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching exam groups:', error);
        }
    };

    const fetchExams = async (groupId) => {
        try {
            const response = await examService.getAll({ exam_group_id: groupId });
            if (response.success) {
                setExams(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching exams:', error);
        }
    };

    const fetchSubjects = async (examId) => {
        try {
            const exam = exams.find(e => e.id === examId);
            if (exam?.subjects) {
                setSubjects(exam.subjects);
            } else {
                const response = await examService.getById(examId);
                if (response.success && response.data?.subjects) {
                    setSubjects(response.data.subjects);
                }
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const fetchUploadHistory = async () => {
        setHistoryLoading(true);
        try {
            const response = await bulkUploadService.getHistory();
            if (response.success) {
                setUploadHistory(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching upload history:', error);
        }
        setHistoryLoading(false);
    };

    const handleDownloadTemplate = async () => {
        if (!selectedExam || !selectedSubject) {
            toast({
                title: 'Selection Required',
                description: 'Please select exam and subject to download template',
                variant: 'destructive'
            });
            return;
        }

        try {
            const response = await bulkUploadService.getTemplate({
                exam_id: selectedExam,
                exam_subject_id: selectedSubject,
                type: uploadType
            });

            if (response.success && response.data) {
                // Create and download CSV
                const blob = new Blob([response.data], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `marks_template_${uploadType}_${Date.now()}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                toast({ title: 'Template downloaded' });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to download template',
                variant: 'destructive'
            });
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['.csv', '.xlsx', '.xls'];
        const fileExt = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!validTypes.includes(fileExt)) {
            toast({
                title: 'Invalid File Type',
                description: 'Please upload CSV or Excel file',
                variant: 'destructive'
            });
            return;
        }

        setSelectedFile(file);
        parseFile(file);
    };

    const parseFile = (file) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const lines = content.split('\n').filter(line => line.trim());
                
                if (lines.length < 2) {
                    toast({
                        title: 'Empty File',
                        description: 'File must contain header and data rows',
                        variant: 'destructive'
                    });
                    return;
                }

                const headers = lines[0].split(',').map(h => h.trim());
                const dataRows = lines.slice(1).map((line, idx) => {
                    const values = line.split(',').map(v => v.trim());
                    const row = {};
                    headers.forEach((header, i) => {
                        row[header] = values[i] || '';
                    });
                    row._rowIndex = idx + 2; // Row number in file (1-indexed + header)
                    row._errors = validateRow(row, headers);
                    row._isValid = row._errors.length === 0;
                    return row;
                });

                setPreviewData(dataRows);
                
                // Calculate stats
                const validRows = dataRows.filter(r => r._isValid).length;
                setPreviewStats({
                    total: dataRows.length,
                    valid: validRows,
                    errors: dataRows.length - validRows
                });

            } catch (error) {
                toast({
                    title: 'Parse Error',
                    description: 'Failed to parse file',
                    variant: 'destructive'
                });
            }
        };

        reader.readAsText(file);
    };

    const validateRow = (row, headers) => {
        const errors = [];

        // Check required fields
        if (!row['Roll Number'] && !row['roll_number'] && !row['enrollment_id']) {
            errors.push('Missing student identifier');
        }

        // Check marks are numbers
        const marksFields = ['Theory Marks', 'theory_marks', 'marks', 'Marks'];
        for (const field of marksFields) {
            if (row[field] !== undefined && row[field] !== '' && isNaN(parseFloat(row[field]))) {
                errors.push(`Invalid marks: ${row[field]}`);
            }
        }

        return errors;
    };

    const handleUpload = async () => {
        if (!selectedFile || previewData.length === 0) {
            toast({
                title: 'No File',
                description: 'Please select a file to upload',
                variant: 'destructive'
            });
            return;
        }

        if (previewStats.errors > 0) {
            setShowConfirmDialog(true);
            return;
        }

        executeUpload();
    };

    const executeUpload = async () => {
        setUploading(true);
        setUploadProgress(0);
        setShowConfirmDialog(false);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            const response = await bulkUploadService.upload({
                exam_id: selectedExam,
                exam_subject_id: selectedSubject,
                type: uploadType,
                data: previewData.filter(r => r._isValid)
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (response.success) {
                setUploadResult({
                    success: true,
                    inserted: response.data?.inserted || 0,
                    updated: response.data?.updated || 0,
                    errors: response.data?.errors || []
                });

                toast({ title: 'Upload Complete', description: `${response.data?.inserted || 0} records processed` });
                fetchUploadHistory();
            } else {
                setUploadResult({
                    success: false,
                    message: response.message || 'Upload failed'
                });
            }

        } catch (error) {
            setUploadResult({
                success: false,
                message: error.message || 'Upload failed'
            });
            toast({
                title: 'Upload Failed',
                description: error.message,
                variant: 'destructive'
            });
        }

        setUploading(false);
    };

    const resetUpload = () => {
        setSelectedFile(null);
        setPreviewData([]);
        setUploadProgress(0);
        setUploadResult(null);
        setPreviewStats({ total: 0, valid: 0, errors: 0 });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            completed: { variant: 'success', icon: CheckCircle },
            processing: { variant: 'default', icon: Clock },
            failed: { variant: 'destructive', icon: XCircle },
            partial: { variant: 'warning', icon: AlertTriangle }
        };
        const config = variants[status] || variants.processing;
        const Icon = config.icon;
        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {status}
            </Badge>
        );
    };

    return (
        <DashboardLayout>
            <div className="container mx-auto py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Sheet className="h-6 w-6" />
                            Bulk Upload Marks
                        </h1>
                        <p className="text-muted-foreground">
                            Upload marks via Excel or CSV
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="upload" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="upload">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                        </TabsTrigger>
                        <TabsTrigger value="history">
                            <History className="h-4 w-4 mr-2" />
                            History
                        </TabsTrigger>
                    </TabsList>

                    {/* Upload Tab */}
                    <TabsContent value="upload" className="space-y-4">
                        {/* Step 1: Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Step 1: Select Exam & Subject</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label>Exam Group *</Label>
                                        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Group" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {examGroups.map(group => (
                                                    <SelectItem key={group.id} value={group.id}>
                                                        {group.group_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Exam *</Label>
                                        <Select value={selectedExam} onValueChange={setSelectedExam} disabled={!selectedGroup}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Exam" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {exams.map(exam => (
                                                    <SelectItem key={exam.id} value={exam.id}>
                                                        {exam.exam_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Subject *</Label>
                                        <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedExam}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Subject" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {subjects.map(subject => (
                                                    <SelectItem key={subject.id} value={subject.id}>
                                                        {subject.subject_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Upload Type</Label>
                                        <Select value={uploadType} onValueChange={setUploadType}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="theory">Theory Marks</SelectItem>
                                                <SelectItem value="practical">Practical Marks</SelectItem>
                                                <SelectItem value="internal">Internal Assessment</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Step 2: Download Template */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Step 2: Download Template</CardTitle>
                                <CardDescription>
                                    Download the template, fill in marks, and upload
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button 
                                    variant="outline" 
                                    onClick={handleDownloadTemplate}
                                    disabled={!selectedSubject}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Template
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Step 3: Upload File */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Step 3: Upload File</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div 
                                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv,.xlsx,.xls"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    {selectedFile ? (
                                        <div>
                                            <Sheet className="h-12 w-12 mx-auto text-primary mb-2" />
                                            <p className="font-medium">{selectedFile.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {(selectedFile.size / 1024).toFixed(2)} KB
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-muted-foreground">
                                                Click to select CSV or Excel file
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Preview Stats */}
                                {previewData.length > 0 && (
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                            <Sheet className="h-5 w-5" />
                                            <div>
                                                <div className="text-lg font-semibold">{previewStats.total}</div>
                                                <div className="text-xs text-muted-foreground">Total Rows</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                            <div>
                                                <div className="text-lg font-semibold text-green-600">{previewStats.valid}</div>
                                                <div className="text-xs text-muted-foreground">Valid</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                                            <XCircle className="h-5 w-5 text-red-600" />
                                            <div>
                                                <div className="text-lg font-semibold text-red-600">{previewStats.errors}</div>
                                                <div className="text-xs text-muted-foreground">Errors</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Upload Progress */}
                                {uploading && (
                                    <div className="space-y-2">
                                        <Progress value={uploadProgress} />
                                        <p className="text-sm text-center text-muted-foreground">
                                            Uploading... {uploadProgress}%
                                        </p>
                                    </div>
                                )}

                                {/* Upload Result */}
                                {uploadResult && (
                                    <div className={`p-4 rounded-lg ${uploadResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            {uploadResult.success ? (
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-red-600" />
                                            )}
                                            <span className="font-medium">
                                                {uploadResult.success ? 'Upload Successful' : 'Upload Failed'}
                                            </span>
                                        </div>
                                        {uploadResult.success ? (
                                            <p className="text-sm">
                                                {uploadResult.inserted} inserted, {uploadResult.updated} updated
                                            </p>
                                        ) : (
                                            <p className="text-sm text-red-600">{uploadResult.message}</p>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button 
                                        onClick={handleUpload}
                                        disabled={!selectedFile || uploading || previewStats.total === 0}
                                    >
                                        {uploading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload Marks
                                    </Button>
                                    <Button variant="outline" onClick={resetUpload}>
                                        Reset
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Preview Table */}
                        {previewData.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Preview</CardTitle>
                                    <CardDescription>
                                        Review data before uploading. Red rows have errors.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="border rounded-lg overflow-auto max-h-96">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[60px]">Row</TableHead>
                                                    <TableHead className="w-[60px]">Status</TableHead>
                                                    {Object.keys(previewData[0] || {})
                                                        .filter(k => !k.startsWith('_'))
                                                        .slice(0, 6)
                                                        .map(key => (
                                                            <TableHead key={key}>{key}</TableHead>
                                                        ))
                                                    }
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {previewData.slice(0, 20).map((row, idx) => (
                                                    <TableRow 
                                                        key={idx}
                                                        className={!row._isValid ? 'bg-red-50' : ''}
                                                    >
                                                        <TableCell>{row._rowIndex}</TableCell>
                                                        <TableCell>
                                                            {row._isValid ? (
                                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                            ) : (
                                                                <XCircle className="h-4 w-4 text-red-600" />
                                                            )}
                                                        </TableCell>
                                                        {Object.keys(row)
                                                            .filter(k => !k.startsWith('_'))
                                                            .slice(0, 6)
                                                            .map(key => (
                                                                <TableCell key={key}>{row[key]}</TableCell>
                                                            ))
                                                        }
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    {previewData.length > 20 && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Showing first 20 of {previewData.length} rows
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Upload History</CardTitle>
                                    <CardDescription>Previous bulk upload records</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={fetchUploadHistory}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {historyLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : uploadHistory.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <History className="h-12 w-12 mx-auto mb-2" />
                                        <p>No upload history found</p>
                                    </div>
                                ) : (
                                    <div className="border rounded-lg">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Exam</TableHead>
                                                    <TableHead>Subject</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Records</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Uploaded By</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {uploadHistory.map((record, idx) => (
                                                    <TableRow key={record.id || idx}>
                                                        <TableCell>
                                                            {formatDateTime(record.created_at)}
                                                        </TableCell>
                                                        <TableCell>{record.exam_name || '-'}</TableCell>
                                                        <TableCell>{record.subject_name || '-'}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{record.upload_type}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {record.total_records} / {record.success_records} / {record.error_records}
                                                            <span className="text-xs text-muted-foreground ml-1">
                                                                (T/S/E)
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                                                        <TableCell>{record.uploaded_by_name || '-'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Confirm Dialog */}
                <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                Errors Found
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {previewStats.errors} rows have errors and will be skipped. 
                                Do you want to proceed with uploading {previewStats.valid} valid rows?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={executeUpload}>
                                Proceed
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
};

export default BulkUploadPage;
