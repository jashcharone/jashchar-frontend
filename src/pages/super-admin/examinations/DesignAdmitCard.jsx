import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { Loader2, Eye, Pencil, Trash2, Save } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const DesignAdmitCard = () => {
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editId, setEditId] = useState(null);
    const [previewTemplate, setPreviewTemplate] = useState(null);

    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    const { register, handleSubmit, reset, setValue, watch } = useForm({
        defaultValues: {
            template_name: '',
            heading: '',
            title: '',
            exam_name: '',
            school_name: '',
            exam_center: '',
            footer_text: '',
            left_logo: '',
            right_logo: '',
            sign: '',
            background_image: '',
            is_active: true
        }
    });

    useEffect(() => {
        if (branchId) fetchTemplates();
    }, [branchId]);

    const fetchTemplates = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('admit_card_templates').select('*').eq('branch_id', branchId);
        if (error) toast({ variant: 'destructive', title: 'Error fetching templates' });
        else setTemplates(data || []);
        setLoading(false);
    };

    const onSubmit = async (data) => {
        setSaving(true);
        try {
            const payload = { ...data, branch_id: branchId };
            
            if (editId) {
                const { error } = await supabase.from('admit_card_templates').update(payload).eq('id', editId);
                if (error) throw error;
                toast({ title: 'Template updated' });
            } else {
                const { error } = await supabase.from('admit_card_templates').insert([payload]);
                if (error) throw error;
                toast({ title: 'Template created' });
            }
            reset();
            setEditId(null);
            fetchTemplates();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving template', description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (tpl) => {
        setEditId(tpl.id);
        Object.keys(tpl).forEach(key => setValue(key, tpl[key]));
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        const { error } = await supabase.from('admit_card_templates').delete().eq('id', id);
        if (error) toast({ variant: 'destructive', title: 'Error deleting' });
        else fetchTemplates();
    };

    // Simulating file upload for UI purposes - normally would use Supabase Storage
    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            // In real app: Upload to storage, get URL, setValue(field, url)
            toast({ title: "File selected (Mock upload)", description: file.name });
            setValue(field, 'https://placehold.co/100x100?text=Logo'); // Mock URL
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1">
                        <CardHeader><CardTitle>Add Admit Card</CardTitle></CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div><Label>Template Name *</Label><Input {...register('template_name', { required: true })} /></div>
                                <div><Label>Heading</Label><Input {...register('heading')} /></div>
                                <div><Label>Title</Label><Input {...register('title')} /></div>
                                <div><Label>Exam Name</Label><Input {...register('exam_name')} /></div>
                                <div><Label>School Name</Label><Input {...register('school_name')} /></div>
                                <div><Label>Exam Center</Label><Input {...register('exam_center')} /></div>
                                <div><Label>Footer Text</Label><Textarea {...register('footer_text')} /></div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <div><Label>Left Logo</Label><Input type="file" onChange={e => handleFileChange(e, 'left_logo')} /></div>
                                    <div><Label>Right Logo</Label><Input type="file" onChange={e => handleFileChange(e, 'right_logo')} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><Label>Sign</Label><Input type="file" onChange={e => handleFileChange(e, 'sign')} /></div>
                                    <div><Label>Background</Label><Input type="file" onChange={e => handleFileChange(e, 'background_image')} /></div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch id="active" checked={watch('is_active')} onCheckedChange={c => setValue('is_active', c)} />
                                    <Label htmlFor="active">Active</Label>
                                </div>

                                <Button type="submit" className="w-full" disabled={saving}>
                                    {saving ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2 h-4 w-4"/>} Save
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader><CardTitle>Admit Card List</CardTitle></CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Background</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {templates.map(tpl => (
                                            <TableRow key={tpl.id}>
                                                <TableCell>{tpl.template_name}</TableCell>
                                                <TableCell>{tpl.background_image ? 'Yes' : 'No'}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button size="icon" variant="ghost" onClick={() => setPreviewTemplate(tpl)}>
                                                        <Eye className="h-4 w-4 text-blue-500" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => handleEdit(tpl)}>
                                                        <Pencil className="h-4 w-4 text-green-500" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => handleDelete(tpl.id)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Preview Modal */}
            <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
                <DialogContent className="max-w-3xl">
                    <div className="border-2 border-gray-800 p-8 relative" style={{ backgroundImage: `url(${previewTemplate?.background_image})`, backgroundSize: 'cover' }}>
                        <div className="flex justify-between items-start mb-4">
                            {previewTemplate?.left_logo && <img src={previewTemplate.left_logo} className="h-16 w-16 object-contain" alt="Left Logo" />}
                            <div className="text-center">
                                <h2 className="text-xl font-bold uppercase">{previewTemplate?.heading}</h2>
                                <h3 className="text-lg font-semibold">{previewTemplate?.title}</h3>
                                <p className="font-medium">{previewTemplate?.school_name}</p>
                            </div>
                            {previewTemplate?.right_logo && <img src={previewTemplate.right_logo} className="h-16 w-16 object-contain" alt="Right Logo" />}
                        </div>

                        <div className="text-center mb-6 border-b-2 border-gray-800 pb-2">
                            <h4 className="text-lg font-bold underline">{previewTemplate?.exam_name}</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                            <div><strong>Roll Number:</strong> 1001</div>
                            <div><strong>Admission No:</strong> 2023001</div>
                            <div><strong>Candidate Name:</strong> John Doe</div>
                            <div><strong>Class:</strong> Class 1 (A)</div>
                            <div><strong>D.O.B:</strong> 01-01-2015</div>
                            <div><strong>Gender:</strong> Male</div>
                            <div><strong>Father's Name:</strong> Mr. Doe</div>
                            <div><strong>Exam Center:</strong> {previewTemplate?.exam_center}</div>
                        </div>

                        <Table className="mb-8 border border-gray-800">
                            <TableHeader>
                                <TableRow className="bg-gray-100">
                                    <TableHead className="text-gray-900 font-bold border border-gray-800">Subject</TableHead>
                                    <TableHead className="text-gray-900 font-bold border border-gray-800">Date & Time</TableHead>
                                    <TableHead className="text-gray-900 font-bold border border-gray-800">Room No</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="border border-gray-800">Mathematics</TableCell>
                                    <TableCell className="border border-gray-800">2023-12-01 09:00 AM</TableCell>
                                    <TableCell className="border border-gray-800">101</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="border border-gray-800">English</TableCell>
                                    <TableCell className="border border-gray-800">2023-12-03 09:00 AM</TableCell>
                                    <TableCell className="border border-gray-800">101</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>

                        <div className="flex justify-between items-end mt-12">
                            <div className="text-sm italic">{previewTemplate?.footer_text}</div>
                            {previewTemplate?.sign && <img src={previewTemplate.sign} className="h-12 object-contain" alt="Signature" />}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default DesignAdmitCard;
