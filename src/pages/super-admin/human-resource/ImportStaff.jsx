import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Upload, Download } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/lib/customSupabaseClient';

const ImportStaff = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);

    const [selectedRole, setSelectedRole] = useState('');
    const [selectedDesignation, setSelectedDesignation] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [csvFile, setCsvFile] = useState(null);

    const [loading, setLoading] = useState(false);

    // Fetch roles, departments, designations
    React.useEffect(() => {
        const fetchPrereqs = async () => {
            if (!selectedBranch?.id && !user?.profile?.branch_id) return;
            const branchId = selectedBranch?.id || user?.profile?.branch_id;
            const [rolesRes, deptsRes, desigsRes] = await Promise.all([
                supabase.from('roles').select('id, name').eq('branch_id', branchId).not('name', 'in', '("student","parent")'),
                supabase.from('departments').select('id, name').eq('branch_id', branchId),
                supabase.from('designations').select('id, name').eq('branch_id', branchId)
            ]);
            setRoles(rolesRes.data || []);
            setDepartments(deptsRes.data || []);
            setDesignations(desigsRes.data || []);
        };
        fetchPrereqs();
    }, [user, selectedBranch]);

    const onDrop = React.useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            setCsvFile(acceptedFiles[0]);
            toast({ title: 'File selected!', description: acceptedFiles[0].name });
        }
    }, [toast]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'] },
        multiple: false
    });

    const handleImport = () => {
        if (!selectedBranch) {
            toast({ variant: "destructive", title: "Please select a branch" });
            return;
        }
        toast({
            title: "ðŸš§ Feature In Development",
            description: "Staff import functionality is coming soon!",
        });
    };
    
    const downloadSample = () => {
        const header = "staff_id,first_name,last_name,father_name,mother_name,email,gender,dob(YYYY-MM-DD),date_of_joining(YYYY-MM-DD),phone,emergency_contact,marital_status,current_address,permanent_address,qualification,work_experience,note,pan_number\n";
        const example = "STF001,John,Doe,Richard Doe,Jane Doe,john.doe@example.com,male,1990-01-15,2022-08-01,9876543210,1234567890,married,123 Main St, Apt 4B,123 Main St, Apt 4B,M.Sc. Computer Science,5 years at TechCorp,A dedicated professional,ABCDE1234F\n";
        const csvContent = "data:text/csv;charset=utf-8," + header + example;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "sample_staff_import.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <DashboardLayout>
            <h1 className="text-3xl font-bold mb-6">Staff Import</h1>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Import Staff from CSV</CardTitle>
                    <Button variant="outline" onClick={downloadSample}><Download className="mr-2 h-4 w-4"/> Download Sample Import File</Button>
                </CardHeader>
                <CardContent>
                    <div className="prose prose-sm max-w-none mb-6">
                        <p>Follow the instructions below to import staff:</p>
                        <ol>
                            <li>Your CSV data should be in the format below. The first line of your CSV file should be the column headers as in the table example. Also make sure that your file is UTF-8 to avoid unnecessary encoding problems.</li>
                            <li>If the column you are trying to import is date type make sure that is formatted in format Y-m-d (2025-11-11).</li>
                            <li>Do not use double quotes in the CSV file.</li>
                            <li>Required fields are marked with *.</li>
                        </ol>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <Label>Role *</Label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}><SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger><SelectContent>{roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <div>
                            <Label>Designation</Label>
                            <Select value={selectedDesignation} onValueChange={setSelectedDesignation}><SelectTrigger><SelectValue placeholder="Select Designation" /></SelectTrigger><SelectContent>{designations.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <div>
                            <Label>Department</Label>
                            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}><SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger><SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                    </div>

                    <div {...getRootProps()} className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'}`}>
                        <input {...getInputProps()} />
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                        {csvFile ? <p>{csvFile.name}</p> : <p>Drag & drop your CSV file here, or click to select a file</p>}
                    </div>

                    <div className="flex justify-end mt-6">
                        <Button onClick={handleImport} disabled={loading || !csvFile || !selectedRole}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Staff Import
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default ImportStaff;
