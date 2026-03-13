import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { admitCardTemplateService } from '@/services/examinationService';
import { 
    Plus, Edit, Trash2, Eye, Save, FileText, Settings, 
    Image, Palette, CheckCircle, Copy, Star
} from 'lucide-react';

const AdmitCardDesignerPage = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('templates');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        template_name: '',
        page_size: 'A4',
        orientation: 'portrait',
        cards_per_page: 1,
        // Content Settings
        show_logo: true,
        show_photo: true,
        show_barcode: false,
        show_qr_code: false,
        show_signature: true,
        show_instructions: true,
        // Field Settings
        show_student_name: true,
        show_father_name: true,
        show_mother_name: false,
        show_dob: true,
        show_address: false,
        show_category: false,
        show_admission_no: true,
        show_roll_no: true,
        show_class_section: true,
        // Text Content
        school_name: '',
        school_address: '',
        header_text: '',
        footer_text: '',
        instructions: 'Students must bring this admit card to the examination hall. No student will be allowed without admit card.',
        // Exam Schedule Display
        show_exam_schedule: true,
        show_venue: true,
        show_time_slot: true,
        // Styling
        font_family: 'Arial',
        primary_color: '#1a365d',
        secondary_color: '#2b6cb0',
        // Images
        logo_url: '',
        header_image_url: '',
        background_image_url: '',
        signature_url: '',
        watermark_url: '',
        template_css: '',
        is_default: false
    });

    useEffect(() => {
        if (selectedBranch?.id) {
            loadTemplates();
        }
    }, [selectedBranch?.id]);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const response = await admitCardTemplateService.getTemplates({
                organization_id: organizationId,
                branch_id: selectedBranch.id
            });
            if (response.data.success) {
                setTemplates(response.data.data);
            }
        } catch (error) {
            console.error('Error loading templates:', error);
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSwitchChange = (field) => {
        setFormData(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const resetForm = () => {
        setFormData({
            template_name: '',
            page_size: 'A4',
            orientation: 'portrait',
            cards_per_page: 1,
            show_logo: true,
            show_photo: true,
            show_barcode: false,
            show_qr_code: false,
            show_signature: true,
            show_instructions: true,
            show_student_name: true,
            show_father_name: true,
            show_mother_name: false,
            show_dob: true,
            show_address: false,
            show_category: false,
            show_admission_no: true,
            show_roll_no: true,
            show_class_section: true,
            school_name: '',
            school_address: '',
            header_text: '',
            footer_text: '',
            instructions: 'Students must bring this admit card to the examination hall. No student will be allowed without admit card.',
            show_exam_schedule: true,
            show_venue: true,
            show_time_slot: true,
            font_family: 'Arial',
            primary_color: '#1a365d',
            secondary_color: '#2b6cb0',
            logo_url: '',
            header_image_url: '',
            background_image_url: '',
            signature_url: '',
            watermark_url: '',
            template_css: '',
            is_default: false
        });
        setEditMode(false);
        setSelectedTemplate(null);
    };

    const handleCreate = () => {
        resetForm();
        setDialogOpen(true);
    };

    const handleEdit = (template) => {
        setFormData(template);
        setSelectedTemplate(template);
        setEditMode(true);
        setDialogOpen(true);
    };

    const handlePreview = (template) => {
        setSelectedTemplate(template);
        setPreviewOpen(true);
    };

    const handleDuplicate = async (template) => {
        const duplicatedData = {
            ...template,
            template_name: `${template.template_name} (Copy)`,
            is_default: false,
            organization_id: organizationId,
            branch_id: selectedBranch.id
        };
        delete duplicatedData.id;
        delete duplicatedData.created_at;
        delete duplicatedData.updated_at;

        try {
            const response = await admitCardTemplateService.createTemplate(duplicatedData);
            if (response.data.success) {
                toast.success('Template duplicated successfully');
                loadTemplates();
            }
        } catch (error) {
            console.error('Error duplicating template:', error);
            toast.error('Failed to duplicate template');
        }
    };

    const handleSave = async () => {
        if (!formData.template_name.trim()) {
            toast.error('Template name is required');
            return;
        }

        try {
            const payload = {
                ...formData,
                organization_id: organizationId,
                branch_id: selectedBranch.id
            };

            let response;
            if (editMode && selectedTemplate?.id) {
                response = await admitCardTemplateService.updateTemplate(selectedTemplate.id, payload);
            } else {
                response = await admitCardTemplateService.createTemplate(payload);
            }

            if (response.data.success) {
                toast.success(editMode ? 'Template updated successfully' : 'Template created successfully');
                setDialogOpen(false);
                resetForm();
                loadTemplates();
            }
        } catch (error) {
            console.error('Error saving template:', error);
            toast.error('Failed to save template');
        }
    };

    const handleDelete = async (template) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;

        try {
            const response = await admitCardTemplateService.deleteTemplate(template.id);
            if (response.data.success) {
                toast.success('Template deleted successfully');
                loadTemplates();
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            toast.error('Failed to delete template');
        }
    };

    // Preview Component
    const AdmitCardPreview = ({ template }) => {
        if (!template) return null;

        return (
            <div 
                className="border-2 border-gray-300 bg-white p-6 mx-auto"
                style={{ 
                    width: '600px', 
                    fontFamily: template.font_family || 'Arial',
                    minHeight: '400px'
                }}
            >
                {/* Header */}
                <div className="text-center mb-4" style={{ borderBottom: `2px solid ${template.primary_color}` }}>
                    {template.show_logo && (
                        <div className="w-16 h-16 mx-auto bg-gray-200 rounded flex items-center justify-center mb-2">
                            {template.logo_url ? (
                                <img src={template.logo_url} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-gray-400 text-xs">LOGO</span>
                            )}
                        </div>
                    )}
                    <h1 className="text-xl font-bold" style={{ color: template.primary_color }}>
                        {template.school_name || 'School Name'}
                    </h1>
                    <p className="text-sm text-gray-600">{template.school_address || 'School Address'}</p>
                    <h2 className="text-lg font-semibold mt-2" style={{ color: template.secondary_color }}>
                        {template.header_text || 'ADMIT CARD'}
                    </h2>
                </div>

                {/* Student Info */}
                <div className="flex gap-4 mb-4">
                    <div className="flex-1 space-y-2">
                        {template.show_student_name && (
                            <div className="flex">
                                <span className="font-semibold w-32">Student Name:</span>
                                <span className="border-b border-gray-400 flex-1">John Doe</span>
                            </div>
                        )}
                        {template.show_father_name && (
                            <div className="flex">
                                <span className="font-semibold w-32">Father's Name:</span>
                                <span className="border-b border-gray-400 flex-1">Mr. James Doe</span>
                            </div>
                        )}
                        {template.show_mother_name && (
                            <div className="flex">
                                <span className="font-semibold w-32">Mother's Name:</span>
                                <span className="border-b border-gray-400 flex-1">Mrs. Jane Doe</span>
                            </div>
                        )}
                        {template.show_class_section && (
                            <div className="flex">
                                <span className="font-semibold w-32">Class/Section:</span>
                                <span className="border-b border-gray-400 flex-1">10 - A</span>
                            </div>
                        )}
                        {template.show_roll_no && (
                            <div className="flex">
                                <span className="font-semibold w-32">Roll No:</span>
                                <span className="border-b border-gray-400 flex-1">15</span>
                            </div>
                        )}
                        {template.show_dob && (
                            <div className="flex">
                                <span className="font-semibold w-32">Date of Birth:</span>
                                <span className="border-b border-gray-400 flex-1">15-03-2010</span>
                            </div>
                        )}
                    </div>
                    {template.show_photo && (
                        <div className="w-24 h-28 border-2 border-gray-400 flex items-center justify-center bg-gray-100">
                            <span className="text-gray-400 text-xs">PHOTO</span>
                        </div>
                    )}
                </div>

                {/* Exam Schedule */}
                {template.show_exam_schedule && (
                    <div className="mb-4">
                        <h3 className="font-semibold text-sm mb-2" style={{ color: template.primary_color }}>
                            Examination Schedule
                        </h3>
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border p-1 text-left">Date</th>
                                    <th className="border p-1 text-left">Subject</th>
                                    {template.show_time_slot && <th className="border p-1 text-left">Time</th>}
                                    {template.show_venue && <th className="border p-1 text-left">Room</th>}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border p-1">10-03-2026</td>
                                    <td className="border p-1">Mathematics</td>
                                    {template.show_time_slot && <td className="border p-1">9:00 AM</td>}
                                    {template.show_venue && <td className="border p-1">Room 101</td>}
                                </tr>
                                <tr>
                                    <td className="border p-1">12-03-2026</td>
                                    <td className="border p-1">Science</td>
                                    {template.show_time_slot && <td className="border p-1">9:00 AM</td>}
                                    {template.show_venue && <td className="border p-1">Room 102</td>}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Instructions */}
                {template.show_instructions && template.instructions && (
                    <div className="mb-4 text-xs border p-2 bg-gray-50">
                        <span className="font-semibold">Instructions: </span>
                        {template.instructions}
                    </div>
                )}

                {/* Footer & Signature */}
                <div className="flex justify-between items-end mt-6 pt-4 border-t">
                    {template.show_signature && (
                        <div className="text-center">
                            <div className="w-24 h-12 border-b border-gray-400 mb-1" />
                            <span className="text-xs">Principal's Signature</span>
                        </div>
                    )}
                    {template.footer_text && (
                        <div className="text-xs text-gray-500 text-center flex-1">
                            {template.footer_text}
                        </div>
                    )}
                    {template.show_signature && (
                        <div className="text-center">
                            <div className="w-24 h-12 border-b border-gray-400 mb-1" />
                            <span className="text-xs">Class Teacher</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Admit Card Designer</h1>
                    <p className="text-muted-foreground">Create and manage admit card templates</p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" /> Create Template
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="templates" className="mt-4">
                    {loading ? (
                        <div className="text-center py-8">Loading templates...</div>
                    ) : templates.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-12">
                                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold">No Templates Found</h3>
                                <p className="text-muted-foreground mb-4">Create your first admit card template</p>
                                <Button onClick={handleCreate}>
                                    <Plus className="w-4 h-4 mr-2" /> Create Template
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {templates.map((template) => (
                                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    {template.template_name}
                                                    {template.is_default && (
                                                        <Badge variant="secondary" className="ml-2">
                                                            <Star className="w-3 h-3 mr-1" /> Default
                                                        </Badge>
                                                    )}
                                                </CardTitle>
                                                <CardDescription className="text-xs mt-1">
                                                    {template.page_size} • {template.orientation} • {template.cards_per_page} per page
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Mini preview */}
                                        <div className="border rounded bg-gray-50 p-2 mb-4 h-24 flex items-center justify-center text-gray-400 text-sm">
                                            <FileText className="w-8 h-8" />
                                        </div>
                                        
                                        {/* Field toggles summary */}
                                        <div className="flex flex-wrap gap-1 mb-4">
                                            {template.show_photo && <Badge variant="outline" className="text-xs">Photo</Badge>}
                                            {template.show_logo && <Badge variant="outline" className="text-xs">Logo</Badge>}
                                            {template.show_exam_schedule && <Badge variant="outline" className="text-xs">Schedule</Badge>}
                                            {template.show_qr_code && <Badge variant="outline" className="text-xs">QR</Badge>}
                                            {template.show_signature && <Badge variant="outline" className="text-xs">Signature</Badge>}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handlePreview(template)}>
                                                <Eye className="w-4 h-4 mr-1" /> Preview
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                                                <Edit className="w-4 h-4 mr-1" /> Edit
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleDuplicate(template)}>
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                            <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(template)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="settings" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Default Settings</CardTitle>
                            <CardDescription>Configure default settings for new templates</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Settings will be implemented in future updates.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editMode ? 'Edit Admit Card Template' : 'Create Admit Card Template'}
                        </DialogTitle>
                    </DialogHeader>

                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="basic">Basic</TabsTrigger>
                            <TabsTrigger value="fields">Fields</TabsTrigger>
                            <TabsTrigger value="content">Content</TabsTrigger>
                            <TabsTrigger value="styling">Styling</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Template Name *</Label>
                                    <Input
                                        value={formData.template_name}
                                        onChange={(e) => handleInputChange('template_name', e.target.value)}
                                        placeholder="Enter template name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Page Size</Label>
                                    <Select
                                        value={formData.page_size}
                                        onValueChange={(value) => handleInputChange('page_size', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="A4">A4</SelectItem>
                                            <SelectItem value="A5">A5</SelectItem>
                                            <SelectItem value="Letter">Letter</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Orientation</Label>
                                    <Select
                                        value={formData.orientation}
                                        onValueChange={(value) => handleInputChange('orientation', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="portrait">Portrait</SelectItem>
                                            <SelectItem value="landscape">Landscape</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Cards Per Page</Label>
                                    <Select
                                        value={String(formData.cards_per_page)}
                                        onValueChange={(value) => handleInputChange('cards_per_page', parseInt(value))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1 Card</SelectItem>
                                            <SelectItem value="2">2 Cards</SelectItem>
                                            <SelectItem value="3">3 Cards</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h4 className="font-semibold">Content Options</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center justify-between">
                                        <Label>Show Logo</Label>
                                        <Switch
                                            checked={formData.show_logo}
                                            onCheckedChange={() => handleSwitchChange('show_logo')}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label>Show Photo</Label>
                                        <Switch
                                            checked={formData.show_photo}
                                            onCheckedChange={() => handleSwitchChange('show_photo')}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label>Show Barcode</Label>
                                        <Switch
                                            checked={formData.show_barcode}
                                            onCheckedChange={() => handleSwitchChange('show_barcode')}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label>Show QR Code</Label>
                                        <Switch
                                            checked={formData.show_qr_code}
                                            onCheckedChange={() => handleSwitchChange('show_qr_code')}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label>Show Signature</Label>
                                        <Switch
                                            checked={formData.show_signature}
                                            onCheckedChange={() => handleSwitchChange('show_signature')}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label>Show Instructions</Label>
                                        <Switch
                                            checked={formData.show_instructions}
                                            onCheckedChange={() => handleSwitchChange('show_instructions')}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label>Set as Default</Label>
                                        <Switch
                                            checked={formData.is_default}
                                            onCheckedChange={() => handleSwitchChange('is_default')}
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="fields" className="space-y-4 mt-4">
                            <h4 className="font-semibold">Student Information Fields</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center justify-between">
                                    <Label>Student Name</Label>
                                    <Switch
                                        checked={formData.show_student_name}
                                        onCheckedChange={() => handleSwitchChange('show_student_name')}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Father's Name</Label>
                                    <Switch
                                        checked={formData.show_father_name}
                                        onCheckedChange={() => handleSwitchChange('show_father_name')}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Mother's Name</Label>
                                    <Switch
                                        checked={formData.show_mother_name}
                                        onCheckedChange={() => handleSwitchChange('show_mother_name')}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Date of Birth</Label>
                                    <Switch
                                        checked={formData.show_dob}
                                        onCheckedChange={() => handleSwitchChange('show_dob')}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Address</Label>
                                    <Switch
                                        checked={formData.show_address}
                                        onCheckedChange={() => handleSwitchChange('show_address')}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Category</Label>
                                    <Switch
                                        checked={formData.show_category}
                                        onCheckedChange={() => handleSwitchChange('show_category')}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Admission No</Label>
                                    <Switch
                                        checked={formData.show_admission_no}
                                        onCheckedChange={() => handleSwitchChange('show_admission_no')}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Roll No</Label>
                                    <Switch
                                        checked={formData.show_roll_no}
                                        onCheckedChange={() => handleSwitchChange('show_roll_no')}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Class/Section</Label>
                                    <Switch
                                        checked={formData.show_class_section}
                                        onCheckedChange={() => handleSwitchChange('show_class_section')}
                                    />
                                </div>
                            </div>

                            <Separator />

                            <h4 className="font-semibold">Exam Schedule Display</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center justify-between">
                                    <Label>Show Exam Schedule</Label>
                                    <Switch
                                        checked={formData.show_exam_schedule}
                                        onCheckedChange={() => handleSwitchChange('show_exam_schedule')}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Show Venue/Room</Label>
                                    <Switch
                                        checked={formData.show_venue}
                                        onCheckedChange={() => handleSwitchChange('show_venue')}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Show Time Slot</Label>
                                    <Switch
                                        checked={formData.show_time_slot}
                                        onCheckedChange={() => handleSwitchChange('show_time_slot')}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="content" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>School Name</Label>
                                    <Input
                                        value={formData.school_name}
                                        onChange={(e) => handleInputChange('school_name', e.target.value)}
                                        placeholder="Enter school name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>School Address</Label>
                                    <Input
                                        value={formData.school_address}
                                        onChange={(e) => handleInputChange('school_address', e.target.value)}
                                        placeholder="Enter school address"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Header Text</Label>
                                    <Input
                                        value={formData.header_text}
                                        onChange={(e) => handleInputChange('header_text', e.target.value)}
                                        placeholder="e.g., ADMIT CARD - Annual Examination 2026"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Footer Text</Label>
                                    <Input
                                        value={formData.footer_text}
                                        onChange={(e) => handleInputChange('footer_text', e.target.value)}
                                        placeholder="Footer text"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Instructions</Label>
                                <Textarea
                                    value={formData.instructions}
                                    onChange={(e) => handleInputChange('instructions', e.target.value)}
                                    placeholder="Enter instructions for students"
                                    rows={3}
                                />
                            </div>

                            <Separator />

                            <h4 className="font-semibold">Images</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Logo URL</Label>
                                    <Input
                                        value={formData.logo_url}
                                        onChange={(e) => handleInputChange('logo_url', e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Signature URL</Label>
                                    <Input
                                        value={formData.signature_url}
                                        onChange={(e) => handleInputChange('signature_url', e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Header Image URL</Label>
                                    <Input
                                        value={formData.header_image_url}
                                        onChange={(e) => handleInputChange('header_image_url', e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Background Image URL</Label>
                                    <Input
                                        value={formData.background_image_url}
                                        onChange={(e) => handleInputChange('background_image_url', e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="styling" className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Font Family</Label>
                                    <Select
                                        value={formData.font_family}
                                        onValueChange={(value) => handleInputChange('font_family', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Arial">Arial</SelectItem>
                                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                                            <SelectItem value="Georgia">Georgia</SelectItem>
                                            <SelectItem value="Verdana">Verdana</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Primary Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            value={formData.primary_color}
                                            onChange={(e) => handleInputChange('primary_color', e.target.value)}
                                            className="w-12 h-10 p-1"
                                        />
                                        <Input
                                            value={formData.primary_color}
                                            onChange={(e) => handleInputChange('primary_color', e.target.value)}
                                            placeholder="#1a365d"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Secondary Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            value={formData.secondary_color}
                                            onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                                            className="w-12 h-10 p-1"
                                        />
                                        <Input
                                            value={formData.secondary_color}
                                            onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                                            placeholder="#2b6cb0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label>Custom CSS</Label>
                                <Textarea
                                    value={formData.template_css}
                                    onChange={(e) => handleInputChange('template_css', e.target.value)}
                                    placeholder="/* Add custom CSS styles here */"
                                    rows={6}
                                    className="font-mono text-sm"
                                />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            <Save className="w-4 h-4 mr-2" />
                            {editMode ? 'Update Template' : 'Create Template'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Template Preview - {selectedTemplate?.template_name}</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-auto max-h-[70vh] py-4">
                        <AdmitCardPreview template={selectedTemplate} />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdmitCardDesignerPage;
