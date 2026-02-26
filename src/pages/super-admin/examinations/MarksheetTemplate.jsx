import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Save, Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import ImageUploader from '@/components/ImageUploader';
import { v4 as uuidv4 } from 'uuid';

const MarksheetTemplate = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        is_default: false,
        header_image_url: '',
        footer_content: '',
        show_student_photo: true,
        show_school_logo: true,
        show_attendance: false,
        show_total_marks: true,
        show_percentage: true,
        show_rank: true,
        show_grade: true,
        show_observations: false,
        background_image_url: '',
        left_sign_url: '',
        middle_sign_url: '',
        right_sign_url: '',
        show_father_name: true,
        show_mother_name: true,
        show_academic_session: true,
        show_admission_no: true,
        show_roll_no: true,
        show_class: true,
        show_section: true,
        show_dob: true,
        show_teacher_remark: true,
    });

    const [headerImageFile, setHeaderImageFile] = useState(null);
    const [bgImageFile, setBgImageFile] = useState(null);
    const [leftSignFile, setLeftSignFile] = useState(null);
    const [middleSignFile, setMiddleSignFile] = useState(null);
    const [rightSignFile, setRightSignFile] = useState(null);

    const branchId = selectedBranch?.id || user?.profile?.branch_id;

    const fetchTemplates = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('cbse_marksheet_templates')
            .select('*')
            .eq('branch_id', branchId)
            .order('created_at', { ascending: false });

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching templates', description: error.message });
        } else {
            setTemplates(data);
        }
        setLoading(false);
    }, [branchId, toast]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const resetForm = () => {
        setFormData({
            name: '', is_default: false, header_image_url: '', footer_content: '',
            show_student_photo: true, show_school_logo: true, show_attendance: false,
            show_total_marks: true, show_percentage: true, show_rank: true, show_grade: true,
            show_observations: false, background_image_url: '', left_sign_url: '',
            middle_sign_url: '', right_sign_url: '', show_father_name: true,
            show_mother_name: true, show_academic_session: true, show_admission_no: true,
            show_roll_no: true, show_class: true, show_section: true, show_dob: true,
            show_teacher_remark: true,
        });
        setEditingTemplate(null);
        setHeaderImageFile(null);
        setBgImageFile(null);
        setLeftSignFile(null);
        setMiddleSignFile(null);
        setRightSignFile(null);
    };

    const handleOpenDialog = (template = null) => {
        if (template) {
            setEditingTemplate(template);
            setFormData(template);
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const uploadFile = async (file) => {
        if (!file) return null;
        const fileName = `${uuidv4()}-${file.name}`;
        const { data, error } = await supabase.storage.from('marksheet-assets').upload(fileName, file);
        if (error) throw error;
        return supabase.storage.from('marksheet-assets').getPublicUrl(data.path).data.publicUrl;
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const [headerUrl, bgUrl, leftUrl, middleUrl, rightUrl] = await Promise.all([
                uploadFile(headerImageFile),
                uploadFile(bgImageFile),
                uploadFile(leftSignFile),
                uploadFile(middleSignFile),
                uploadFile(rightSignFile),
            ]);

            const dataToSave = {
                ...formData,
                branch_id: branchId,
                session_id: currentSessionId,
                organization_id: organizationId,
                header_image_url: headerUrl || formData.header_image_url,
                background_image_url: bgUrl || formData.background_image_url,
                left_sign_url: leftUrl || formData.left_sign_url,
                middle_sign_url: middleUrl || formData.middle_sign_url,
                right_sign_url: rightUrl || formData.right_sign_url,
            };

            let error;
            if (editingTemplate) {
                ({ error } = await supabase.from('cbse_marksheet_templates').update(dataToSave).eq('id', editingTemplate.id));
            } else {
                ({ error } = await supabase.from('cbse_marksheet_templates').insert([dataToSave]));
            }

            if (error) throw error;

            toast({ title: 'Success', description: `Template ${editingTemplate ? 'updated' : 'created'}.` });
            setIsDialogOpen(false);
            fetchTemplates();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving template', description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (templateId) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;
        const { error } = await supabase.from('cbse_marksheet_templates').delete().eq('id', templateId);
        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting template', description: error.message });
        } else {
            toast({ title: 'Success', description: 'Template deleted.' });
            fetchTemplates();
        }
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Marksheet Templates</h1>
                <Button onClick={() => handleOpenDialog()}><Plus className="mr-2 h-4 w-4" /> Add Template</Button>
            </div>

            {loading ? (
                <div className="text-center py-10"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(template => (
                        <Card key={template.id}>
                            <CardHeader>
                                <CardTitle>{template.name}</CardTitle>
                                {template.is_default && <CardDescription>Default Template</CardDescription>}
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-end space-x-2">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(template)}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{editingTemplate ? 'Edit' : 'Create'} Marksheet Template</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[70vh] overflow-y-auto p-4 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><Label htmlFor="name" required>Template Name</Label><Input id="name" name="name" value={formData.name} onChange={handleInputChange} /></div>
                            <div className="flex items-center space-x-2 pt-6"><Checkbox id="is_default" name="is_default" checked={formData.is_default} onCheckedChange={(c) => setFormData(p => ({...p, is_default: c}))} /><Label htmlFor="is_default">Set as Default</Label></div>
                        </div>
                        
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" /> Images & Content</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><Label>Header Image</Label><ImageUploader onFileChange={setHeaderImageFile} initialPreview={formData.header_image_url} /></div>
                                <div><Label>Background Image</Label><ImageUploader onFileChange={setBgImageFile} initialPreview={formData.background_image_url} /></div>
                                <div><Label>Left Signature</Label><ImageUploader onFileChange={setLeftSignFile} initialPreview={formData.left_sign_url} /></div>
                                <div><Label>Middle Signature</Label><ImageUploader onFileChange={setMiddleSignFile} initialPreview={formData.middle_sign_url} /></div>
                                <div><Label>Right Signature</Label><ImageUploader onFileChange={setRightSignFile} initialPreview={formData.right_sign_url} /></div>
                                <div className="md:col-span-2"><Label>Footer Content</Label><Textarea name="footer_content" value={formData.footer_content} onChange={handleInputChange} /></div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Display Settings</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {Object.keys(formData).filter(k => k.startsWith('show_')).map(key => (
                                    <div key={key} className="flex items-center space-x-2">
                                        <Checkbox id={key} name={key} checked={formData[key]} onCheckedChange={(c) => setFormData(p => ({...p, [key]: c}))} />
                                        <Label htmlFor={key} className="capitalize">{key.replace('show_', '').replace(/_/g, ' ')}</Label>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleSave} disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin" /> : 'Save Template'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default MarksheetTemplate;
