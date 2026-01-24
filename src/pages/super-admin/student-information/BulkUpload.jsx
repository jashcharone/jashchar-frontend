import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const BulkUpload = () => {
    const { user, currentSessionId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [uploadResults, setUploadResults] = useState({ success: 0, failed: 0, errors: [] });
    const [step, setStep] = useState(1); // 1: Select class, 2: Upload file, 3: Preview, 4: Results

    const branchId = user?.profile?.branch_id || selectedBranch?.id;

    // Fetch classes
    useEffect(() => {
        if (!branchId) return;
        const fetchClasses = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('classes')
                    .select('id, name')
                    .eq('branch_id', branchId)
                    .order('name');
                
                if (error) throw error;
                setClasses(data || []);
            } catch (error) {
                console.error('Error fetching classes:', error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch classes' });
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, [branchId, toast]);

    // Fetch sections when class is selected
    useEffect(() => {
        if (!selectedClass) {
            setSections([]);
            return;
        }
        const fetchSections = async () => {
            try {
                const { data, error } = await supabase
                    .from('class_sections')
                    .select('sections(id, name)')
                    .eq('class_id', selectedClass);
                
                if (error) throw error;
                setSections(data ? data.map(item => item.sections).filter(Boolean) : []);
            } catch (error) {
                console.error('Error fetching sections:', error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch sections' });
            }
        };
        fetchSections();
    }, [selectedClass, toast]);

    // Download template
    const downloadTemplate = () => {
        const templateData = [
            {
                'Admission No': 'STU001',
                'First Name': 'John',
                'Last Name': 'Doe',
                'Gender': 'Male',
                'Date of Birth': '2010-05-15',
                'Religion': 'Hindu',
                'Caste': 'General',
                'Blood Group': 'O+',
                'Email': 'john.doe@email.com',
                'Phone': '9876543210',
                'Address': '123 Main Street',
                'City': 'Bangalore',
                'State': 'Karnataka',
                'Pincode': '560001',
                'Father Name': 'Robert Doe',
                'Father Phone': '9876543211',
                'Father Email': 'robert.doe@email.com',
                'Father Occupation': 'Engineer',
                'Mother Name': 'Mary Doe',
                'Mother Phone': '9876543212',
                'Mother Email': 'mary.doe@email.com',
                'Mother Occupation': 'Teacher',
                'Previous School': 'ABC School',
                'Previous Class': '5th Grade',
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Students');
        
        // Set column widths
        const colWidths = Object.keys(templateData[0]).map(() => ({ wch: 20 }));
        ws['!cols'] = colWidths;
        
        XLSX.writeFile(wb, `Student_Bulk_Upload_Template.xlsx`);
        toast({ title: 'Template Downloaded', description: 'Please fill in the data and upload.' });
    };

    // Handle file selection
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv'
        ];
        
        if (!validTypes.includes(selectedFile.type)) {
            toast({ variant: 'destructive', title: 'Invalid File', description: 'Please upload an Excel or CSV file.' });
            return;
        }
        
        setFile(selectedFile);
        parseFile(selectedFile);
    };

    // Parse uploaded file
    const parseFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                if (jsonData.length === 0) {
                    toast({ variant: 'destructive', title: 'Empty File', description: 'The uploaded file contains no data.' });
                    return;
                }
                
                setPreviewData(jsonData);
                setStep(3);
            } catch (error) {
                console.error('Error parsing file:', error);
                toast({ variant: 'destructive', title: 'Parse Error', description: 'Failed to parse the uploaded file.' });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // Process and upload students
    const handleUpload = async () => {
        if (!selectedClass || !selectedSection) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select class and section.' });
            return;
        }

        setUploading(true);
        setProgress(0);
        const results = { success: 0, failed: 0, errors: [] };
        const totalRows = previewData.length;
        
        for (let i = 0; i < previewData.length; i++) {
            const row = previewData[i];
            try {
                const studentData = {
                    branch_id: branchId,
                    session_id: currentSessionId,
                    class_id: selectedClass,
                    section_id: selectedSection,
                    admission_no: row['Admission No'] || `ADM${Date.now()}${i}`,
                    first_name: row['First Name'],
                    last_name: row['Last Name'] || '',
                    gender: row['Gender'] || 'Male',
                    date_of_birth: row['Date of Birth'] || null,
                    religion: row['Religion'] || null,
                    cast: row['Caste'] || null,
                    blood_group: row['Blood Group'] || null,
                    email: row['Email'] || null,
                    mobile_number: row['Phone'] || null,
                    current_address: row['Address'] || null,
                    city: row['City'] || null,
                    state: row['State'] || null,
                    pincode: row['Pincode'] || null,
                    father_name: row['Father Name'] || null,
                    father_phone: row['Father Phone'] || null,
                    father_email: row['Father Email'] || null,
                    father_occupation: row['Father Occupation'] || null,
                    mother_name: row['Mother Name'] || null,
                    mother_phone: row['Mother Phone'] || null,
                    mother_email: row['Mother Email'] || null,
                    mother_occupation: row['Mother Occupation'] || null,
                    previous_school: row['Previous School'] || null,
                    previous_class: row['Previous Class'] || null,
                    student_status: 'active',
                    admission_date: new Date().toISOString().split('T')[0],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };

                // Validate required fields
                if (!studentData.first_name) {
                    throw new Error('First Name is required');
                }

                const { error } = await supabase
                    .from('student_profiles')
                    .insert([studentData]);

                if (error) throw error;
                results.success++;
            } catch (error) {
                console.error(`Error uploading row ${i + 1}:`, error);
                results.failed++;
                results.errors.push({
                    row: i + 1,
                    name: row['First Name'] || 'Unknown',
                    error: error.message
                });
            }
            
            setProgress(Math.round(((i + 1) / totalRows) * 100));
        }
        
        setUploadResults(results);
        setStep(4);
        setUploading(false);
        
        if (results.success > 0) {
            toast({ 
                title: 'Upload Complete', 
                description: `${results.success} students uploaded successfully. ${results.failed} failed.` 
            });
        }
    };

    // Reset form
    const resetForm = () => {
        setStep(1);
        setFile(null);
        setPreviewData([]);
        setUploadResults({ success: 0, failed: 0, errors: [] });
        setProgress(0);
        setSelectedClass('');
        setSelectedSection('');
    };

    return (
        <DashboardLayout>
            <div className="container mx-auto py-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Bulk Upload Students</h1>
                        <p className="text-muted-foreground">Upload multiple students at once using Excel/CSV file</p>
                    </div>
                    <Button onClick={downloadTemplate} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                    </Button>
                </div>

                {/* Step indicators */}
                <div className="flex items-center justify-center space-x-4 py-4">
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                            }`}>
                                {s}
                            </div>
                            {s < 4 && <div className={`w-16 h-1 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
                        </div>
                    ))}
                </div>

                {/* Step 1: Select Class and Section */}
                {step === 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Step 1: Select Class and Section</CardTitle>
                            <CardDescription>Choose the class and section for the students you want to upload</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Class *</label>
                                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map((cls) => (
                                                <SelectItem key={cls.id} value={cls.id}>
                                                    {cls.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Section *</label>
                                    <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Section" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sections.map((sec) => (
                                                <SelectItem key={sec.id} value={sec.id}>
                                                    {sec.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={() => setStep(2)} disabled={!selectedClass || !selectedSection}>
                                    Next: Upload File
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Upload File */}
                {step === 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Step 2: Upload File</CardTitle>
                            <CardDescription>Upload an Excel or CSV file with student data</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
                                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <div className="space-y-2">
                                    <p className="text-lg font-medium">Drop your file here or click to browse</p>
                                    <p className="text-sm text-muted-foreground">Supports Excel (.xlsx, .xls) and CSV files</p>
                                </div>
                                <Input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileChange}
                                    className="mt-4 max-w-xs mx-auto"
                                />
                            </div>
                            {file && (
                                <Alert>
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertTitle>File Selected</AlertTitle>
                                    <AlertDescription>{file.name}</AlertDescription>
                                </Alert>
                            )}
                            <div className="flex justify-between">
                                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Preview Data */}
                {step === 3 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Step 3: Preview Data</CardTitle>
                            <CardDescription>Review the data before uploading ({previewData.length} students found)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="border rounded-lg overflow-auto max-h-96">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>#</TableHead>
                                            <TableHead>Admission No</TableHead>
                                            <TableHead>First Name</TableHead>
                                            <TableHead>Last Name</TableHead>
                                            <TableHead>Gender</TableHead>
                                            <TableHead>Date of Birth</TableHead>
                                            <TableHead>Father Name</TableHead>
                                            <TableHead>Phone</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewData.slice(0, 20).map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{idx + 1}</TableCell>
                                                <TableCell>{row['Admission No'] || '-'}</TableCell>
                                                <TableCell>{row['First Name'] || '-'}</TableCell>
                                                <TableCell>{row['Last Name'] || '-'}</TableCell>
                                                <TableCell>{row['Gender'] || '-'}</TableCell>
                                                <TableCell>{row['Date of Birth'] || '-'}</TableCell>
                                                <TableCell>{row['Father Name'] || '-'}</TableCell>
                                                <TableCell>{row['Phone'] || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {previewData.length > 20 && (
                                <p className="text-sm text-muted-foreground text-center">
                                    Showing first 20 of {previewData.length} records
                                </p>
                            )}
                            <div className="flex justify-between">
                                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                                <Button onClick={handleUpload} disabled={uploading}>
                                    {uploading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4 mr-2" />
                                            Upload {previewData.length} Students
                                        </>
                                    )}
                                </Button>
                            </div>
                            {uploading && (
                                <div className="space-y-2">
                                    <Progress value={progress} />
                                    <p className="text-sm text-center text-muted-foreground">{progress}% Complete</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Step 4: Results */}
                {step === 4 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Complete</CardTitle>
                            <CardDescription>Here are the results of your upload</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Alert className="border-green-500">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <AlertTitle className="text-green-500">Successful</AlertTitle>
                                    <AlertDescription className="text-2xl font-bold">{uploadResults.success}</AlertDescription>
                                </Alert>
                                <Alert className="border-red-500">
                                    <XCircle className="h-4 w-4 text-red-500" />
                                    <AlertTitle className="text-red-500">Failed</AlertTitle>
                                    <AlertDescription className="text-2xl font-bold">{uploadResults.failed}</AlertDescription>
                                </Alert>
                            </div>
                            
                            {uploadResults.errors.length > 0 && (
                                <div className="border rounded-lg overflow-auto max-h-64">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Row</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Error</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {uploadResults.errors.map((err, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>{err.row}</TableCell>
                                                    <TableCell>{err.name}</TableCell>
                                                    <TableCell className="text-red-500">{err.error}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                            
                            <div className="flex justify-end">
                                <Button onClick={resetForm}>Upload More Students</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default BulkUpload;
