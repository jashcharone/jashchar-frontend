import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, FileText, Download, Trash2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { v4 as uuidv4 } from 'uuid';

const EmployeeDocuments = () => {
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [file, setFile] = useState(null);
    const [newDoc, setNewDoc] = useState({
        employee_id: '',
        document_name: '',
        document_type: 'Contract',
        expiry_date: ''
    });

    let branchId = user?.profile?.branch_id;
    if (!branchId) {
        branchId = sessionStorage.getItem('ma_target_branch_id');
    }

    useEffect(() => {
        if (branchId && selectedBranch) fetchData();
    }, [branchId, selectedBranch]);

    const fetchData = async () => {
        setLoading(true);
        const [staffRes, docsRes] = await Promise.all([
            supabase.from('employee_profiles').select('id, full_name').eq('branch_id', branchId).eq('branch_id', selectedBranch.id),
            supabase.from('employee_documents').select('*, employee:employee_id(full_name)').eq('branch_id', branchId).eq('branch_id', selectedBranch.id).order('upload_date', { ascending: false })
        ]);
        setStaffList(staffRes.data || []);
        setDocuments(docsRes.data || []);
        setLoading(false);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
    };

    const handleSubmit = async () => {
        if (!newDoc.employee_id || !newDoc.document_name || !file) {
            toast({ variant: 'destructive', title: 'Please fill all fields and select a file' });
            return;
        }
        if (!selectedBranch) {
            toast({ variant: 'destructive', title: 'Please select a branch' });
            return;
        }

        setLoading(true);
        const fileName = `${uuidv4()}-${file.name}`;
        const { data, error: uploadError } = await supabase.storage.from('marksheet-assets').upload(`documents/${fileName}`, file); // Reusing bucket for now

        if (uploadError) {
             toast({ variant: 'destructive', title: 'Upload failed', description: uploadError.message });
             setLoading(false);
             return;
        }

        const { data: { publicUrl } } = supabase.storage.from('marksheet-assets').getPublicUrl(`documents/${fileName}`);

        const { error } = await supabase.from('employee_documents').insert({
            ...newDoc,
            branch_id: branchId,
            branch_id: selectedBranch.id,
            document_url: publicUrl,
            upload_date: new Date().toISOString()
        });

        if (error) {
            toast({ variant: 'destructive', title: 'Database save failed', description: error.message });
        } else {
            toast({ title: 'Success', description: 'Document uploaded.' });
            setIsModalOpen(false);
            fetchData();
            setNewDoc({ employee_id: '', document_name: '', document_type: 'Contract', expiry_date: '' });
            setFile(null);
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if(!window.confirm('Are you sure?')) return;
        const { error } = await supabase.from('employee_documents').delete().eq('id', id);
        if (error) toast({ variant: 'destructive', title: 'Delete failed' });
        else fetchData();
    };

    return (
        <DashboardLayout>
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Employee Documents</h1>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4"/> Upload Document</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Employee</Label>
                                <Select value={newDoc.employee_id} onValueChange={v => setNewDoc({...newDoc, employee_id: v})}>
                                    <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                                    <SelectContent>{staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Document Name</Label>
                                <Input value={newDoc.document_name} onChange={e => setNewDoc({...newDoc, document_name: e.target.value})} placeholder="e.g., Offer Letter" />
                            </div>
                            <div>
                                <Label>Type</Label>
                                <Select value={newDoc.document_type} onValueChange={v => setNewDoc({...newDoc, document_type: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Contract">Contract</SelectItem>
                                        <SelectItem value="ID Proof">ID Proof</SelectItem>
                                        <SelectItem value="Resume">Resume</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Expiry Date (Optional)</Label>
                                <Input type="date" value={newDoc.expiry_date} onChange={e => setNewDoc({...newDoc, expiry_date: e.target.value})} />
                            </div>
                            <div>
                                <Label>File</Label>
                                <Input type="file" onChange={handleFileChange} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSubmit} disabled={loading}>{loading ? <Loader2 className="animate-spin"/> : 'Upload'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader><CardTitle>Document Repository</CardTitle></CardHeader>
                <CardContent>
                     {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin"/></div> : 
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documents.length === 0 ? <p className="col-span-3 text-center text-muted-foreground py-8">No documents found.</p> : 
                        documents.map(doc => (
                            <Card key={doc.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4 flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-blue-100 p-2 rounded-lg"><FileText className="h-6 w-6 text-blue-600" /></div>
                                        <div>
                                            <h4 className="font-bold">{doc.document_name}</h4>
                                            <p className="text-xs text-muted-foreground">{doc.employee?.full_name} • {doc.document_type}</p>
                                            {doc.expiry_date && <p className="text-xs text-red-500 mt-1">Expires: {doc.expiry_date}</p>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
                                            <Button size="icon" variant="ghost" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                                        </a>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(doc.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>}
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default EmployeeDocuments;
