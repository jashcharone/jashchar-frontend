import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Loader2, Upload, ArrowLeft } from 'lucide-react';
import DatePicker from '@/components/ui/DatePicker';
import { Checkbox } from '@/components/ui/checkbox';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

const recipientRoles = [
    { id: 'student', label: 'Student' },
    { id: 'parent', label: 'Parent' },
    { id: 'admin', label: 'Admin' },
    { id: 'teacher', label: 'Teacher' },
    { id: 'accountant', label: 'Accountant' },
    { id: 'librarian', label: 'Librarian' },
    { id: 'receptionist', label: 'Receptionist' },
];

const ComposeMessage = () => {
    const { noticeId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();
    const branchId = user?.profile?.branch_id;

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        notice_date: new Date(),
        publish_on: new Date(),
        message_to: [],
        send_email: false,
        send_sms: false,
        send_mobile_app: false,
    });
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [existingAttachment, setExistingAttachment] = useState(null);
    const [loading, setLoading] = useState(false);

    const onDrop = useCallback(acceptedFiles => {
        setAttachmentFile(acceptedFiles[0]);
    }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1 });

    useEffect(() => {
        if (noticeId && branchId) {
            const fetchNotice = async () => {
                let query = supabase
                    .from('notices')
                    .select('*')
                    .eq('id', noticeId)
                    .eq('branch_id', branchId);

                if (selectedBranch) {
                    query = query.eq('branch_id', selectedBranch.id);
                }

                const { data, error } = await query.single();
                
                if (error) {
                    toast({ variant: 'destructive', title: 'Failed to fetch notice details.' });
                    navigate('/school-owner/communicate/notice-board');
                } else {
                    setFormData({
                        title: data.title,
                        message: data.message,
                        notice_date: new Date(data.notice_date),
                        publish_on: new Date(data.publish_on),
                        message_to: data.message_to || [],
                        send_email: data.send_email,
                        send_sms: data.send_sms,
                        send_mobile_app: data.send_mobile_app,
                    });
                    if (data.attachment_url) {
                        setExistingAttachment({ url: data.attachment_url, name: data.attachment_name });
                    }
                }
            };
            fetchNotice();
        }
    }, [noticeId, branchId, selectedBranch, toast, navigate]);

    const handleRecipientChange = (roleId) => {
        setFormData(prev => {
            const newRecipients = prev.message_to.includes(roleId)
                ? prev.message_to.filter(r => r !== roleId)
                : [...prev.message_to, roleId];
            return { ...prev, message_to: newRecipients };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.message || formData.message_to.length === 0) {
            toast({ variant: 'destructive', title: 'Please fill all required fields: Title, Message, and at least one recipient.' });
            return;
        }
        setLoading(true);

        let attachmentUrl = existingAttachment?.url || null;
        let attachmentName = existingAttachment?.name || null;

        if (attachmentFile) {
            const fileName = `notice-attachments/${branchId}/${uuidv4()}`;
            const { error: uploadError } = await supabase.storage.from('school-assets').upload(fileName, attachmentFile);

            if (uploadError) {
                toast({ variant: 'destructive', title: 'Failed to upload attachment.', description: uploadError.message });
                setLoading(false);
                return;
            }
            const { data: urlData } = supabase.storage.from('school-assets').getPublicUrl(fileName);
            attachmentUrl = urlData.publicUrl;
            attachmentName = attachmentFile.name;
        }

        const dataToSave = {
            ...formData,
            branch_id: branchId,
            branch_id: selectedBranch?.id,
            notice_date: format(formData.notice_date, 'yyyy-MM-dd'),
            publish_on: format(formData.publish_on, 'yyyy-MM-dd'),
            attachment_url: attachmentUrl,
            attachment_name: attachmentName,
        };

        const { error } = noticeId
            ? await supabase.from('notices').update(dataToSave).eq('id', noticeId)
            : await supabase.from('notices').insert(dataToSave);

        if (error) {
            toast({ variant: 'destructive', title: `Failed to ${noticeId ? 'update' : 'post'} message.`, description: error.message });
        } else {
            toast({ title: 'Success!', description: `Message ${noticeId ? 'updated' : 'posted'} successfully.` });
            navigate('/school-owner/communicate/notice-board');
        }
        setLoading(false);
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">{noticeId ? 'Edit' : 'Compose New'} Message</h1>
                <Button variant="outline" onClick={() => navigate('/school-owner/communicate/notice-board')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Notice Board
                </Button>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <Label htmlFor="title" required>Title</Label>
                                        <Input id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                                    </div>
                                    <div>
                                        <Label>Attachment</Label>
                                        <div {...getRootProps()} className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer">
                                            <input {...getInputProps()} />
                                            <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
                                            {isDragActive ? <p>Drop file...</p> : <p className="text-sm">Drag & drop or click to select</p>}
                                            {attachmentFile && <p className="text-xs text-green-600 mt-1">{attachmentFile.name}</p>}
                                            {!attachmentFile && existingAttachment && <p className="text-xs text-blue-600 mt-1">Current: {existingAttachment.name}</p>}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <Label required>Message</Label>
                                    <ReactQuill theme="snow" value={formData.message} onChange={value => setFormData({...formData, message: value})} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="notice_date" required>Notice Date</Label>
                                    <DatePicker value={formData.notice_date} onChange={date => setFormData({...formData, notice_date: date})} />
                                </div>
                                <div>
                                    <Label htmlFor="publish_on" required>Publish On</Label>
                                    <DatePicker value={formData.publish_on} onChange={date => setFormData({...formData, publish_on: date})} />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Message To</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                                {recipientRoles.map(role => (
                                    <div key={role.id} className="flex items-center space-x-2">
                                        <Checkbox id={role.id} checked={formData.message_to.includes(role.id)} onCheckedChange={() => handleRecipientChange(role.id)} />
                                        <Label htmlFor={role.id} className="font-normal">{role.label}</Label>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Send By</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="send_email" checked={formData.send_email} onCheckedChange={checked => setFormData({...formData, send_email: checked})} />
                                    <Label htmlFor="send_email" className="font-normal">Email</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="send_sms" checked={formData.send_sms} onCheckedChange={checked => setFormData({...formData, send_sms: checked})} />
                                    <Label htmlFor="send_sms" className="font-normal">SMS</Label>
                                </div>
                                {formData.message_to.includes('student') && (
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="send_mobile_app" checked={formData.send_mobile_app} onCheckedChange={checked => setFormData({...formData, send_mobile_app: checked})} />
                                        <Label htmlFor="send_mobile_app" className="font-normal">Mobile App Notification</Label>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {noticeId ? 'Update Message' : 'Post Message'}
                        </Button>
                    </div>
                </div>
            </form>
        </DashboardLayout>
    );
};

export default ComposeMessage;
