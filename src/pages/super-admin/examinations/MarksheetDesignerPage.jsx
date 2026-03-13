import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { marksheetTemplateService } from '@/services/examinationService';
import { 
    Plus, Edit, Trash2, Eye, Save, FileText, Settings, 
    Image, Palette, Copy, Star, Printer
} from 'lucide-react';

const MarksheetDesignerPage = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('templates');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    
    // Form state with all marksheet-specific fields
    const [formData, setFormData] = useState({
        template_name: '',
        board_type: 'state',
        page_size: 'A4',
        orientation: 'portrait',
        marksheet_type: 'term_wise',
        // School Info
        show_school_logo: true,
        school_name: '',
        school_address: '',
        affiliation_no: '',
        exam_center: '',
        school_code: '',
        // Student Info Display
        show_student_photo: true,
        show_father_name: true,
        show_mother_name: true,
        show_dob: true,
        show_admission_no: true,
        show_roll_no: true,
        show_class: true,
        show_section: true,
        show_academic_session: true,
        show_category: false,
        show_caste: false,
        show_aadhar_no: false,
        // Marks Display
        show_subject_code: false,
        show_max_marks: true,
        show_theory_marks: true,
        show_practical_marks: false,
        show_internal_marks: false,
        show_total_marks: true,
        show_percentage: true,
        show_grade: true,
        show_grade_point: false,
        show_credit: false,
        // Results Display
        show_overall_grade: true,
        show_overall_percentage: true,
        show_rank: true,
        show_division: false,
        show_cgpa: false,
        show_attendance: true,
        show_attendance_percentage: false,
        show_result_status: true,
        show_total_working_days: false,
        // Additional Sections
        show_co_scholastic: false,
        co_scholastic_areas: [],
        show_observations: false,
        show_teacher_remark: true,
        show_principal_remark: false,
        show_discipline_grade: false,
        // Signatures
        show_class_teacher_sign: true,
        show_principal_sign: true,
        show_examiner_sign: false,
        show_parent_sign: false,
        left_sign_title: 'Class Teacher',
        middle_sign_title: '',
        right_sign_title: 'Principal',
        left_sign_url: '',
        middle_sign_url: '',
        right_sign_url: '',
        // Images
        logo_url: '',
        header_image_url: '',
        background_image_url: '',
        watermark_url: '',
        watermark_opacity: 0.1,
        // Styling
        header_text: '',
        footer_text: '',
        printing_date_text: 'Date of Issue:',
        template_css: '',
        font_family: 'Times New Roman',
        font_size: 12,
        primary_color: '#1a365d',
        secondary_color: '#2b6cb0',
        border_style: 'double',
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
            const response = await marksheetTemplateService.getTemplates({
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
            board_type: 'state',
            page_size: 'A4',
            orientation: 'portrait',
            marksheet_type: 'term_wise',
            show_school_logo: true,
            school_name: '',
            school_address: '',
            affiliation_no: '',
            exam_center: '',
            school_code: '',
            show_student_photo: true,
            show_father_name: true,
            show_mother_name: true,
            show_dob: true,
            show_admission_no: true,
            show_roll_no: true,
            show_class: true,
            show_section: true,
            show_academic_session: true,
            show_category: false,
            show_caste: false,
            show_aadhar_no: false,
            show_subject_code: false,
            show_max_marks: true,
            show_theory_marks: true,
            show_practical_marks: false,
            show_internal_marks: false,
            show_total_marks: true,
            show_percentage: true,
            show_grade: true,
            show_grade_point: false,
            show_credit: false,
            show_overall_grade: true,
            show_overall_percentage: true,
            show_rank: true,
            show_division: false,
            show_cgpa: false,
            show_attendance: true,
            show_attendance_percentage: false,
            show_result_status: true,
            show_total_working_days: false,
            show_co_scholastic: false,
            co_scholastic_areas: [],
            show_observations: false,
            show_teacher_remark: true,
            show_principal_remark: false,
            show_discipline_grade: false,
            show_class_teacher_sign: true,
            show_principal_sign: true,
            show_examiner_sign: false,
            show_parent_sign: false,
            left_sign_title: 'Class Teacher',
            middle_sign_title: '',
            right_sign_title: 'Principal',
            left_sign_url: '',
            middle_sign_url: '',
            right_sign_url: '',
            logo_url: '',
            header_image_url: '',
            background_image_url: '',
            watermark_url: '',
            watermark_opacity: 0.1,
            header_text: '',
            footer_text: '',
            printing_date_text: 'Date of Issue:',
            template_css: '',
            font_family: 'Times New Roman',
            font_size: 12,
            primary_color: '#1a365d',
            secondary_color: '#2b6cb0',
            border_style: 'double',
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
            const response = await marksheetTemplateService.createTemplate(duplicatedData);
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
                response = await marksheetTemplateService.updateTemplate(selectedTemplate.id, payload);
            } else {
                response = await marksheetTemplateService.createTemplate(payload);
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
            const response = await marksheetTemplateService.deleteTemplate(template.id);
            if (response.data.success) {
                toast.success('Template deleted successfully');
                loadTemplates();
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            toast.error('Failed to delete template');
        }
    };

    const getMarksheetTypeBadge = (type) => {
        const types = {
            term_wise: { label: 'Term-wise', variant: 'default' },
            consolidated: { label: 'Consolidated', variant: 'secondary' },
            progressive: { label: 'Progressive', variant: 'outline' }
        };
        return types[type] || { label: type, variant: 'default' };
    };

    // Preview Component
    const MarksheetPreview = ({ template }) => {
        if (!template) return null;

        const borderClass = template.border_style === 'double' ? 'border-4 border-double' : 
                          template.border_style === 'single' ? 'border-2' : 'border-0';

        return (
            <div 
                className={`bg-white p-8 mx-auto ${borderClass}`}
                style={{ 
                    width: '700px', 
                    fontFamily: template.font_family || 'Times New Roman',
                    fontSize: `${template.font_size || 12}px`,
                    borderColor: template.primary_color,
                    minHeight: '900px'
                }}
            >
                {/* Header */}
                <div className="text-center mb-6 pb-4" style={{ borderBottom: `2px solid ${template.primary_color}` }}>
                    <div className="flex justify-center items-center gap-4 mb-2">
                        {template.show_school_logo && (
                            <div className="w-20 h-20 border-2 rounded flex items-center justify-center bg-gray-50">
                                {template.logo_url ? (
                                    <img src={template.logo_url} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <span className="text-gray-400 text-xs">LOGO</span>
                                )}
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold" style={{ color: template.primary_color }}>
                                {template.school_name || 'School Name'}
                            </h1>
                            <p className="text-sm">{template.school_address || 'School Address'}</p>
                            {template.affiliation_no && (
                                <p className="text-xs text-gray-600">Affiliation No: {template.affiliation_no}</p>
                            )}
                        </div>
                    </div>
                    <h2 className="text-xl font-bold mt-4" style={{ color: template.secondary_color }}>
                        {template.header_text || 'MARKSHEET'}
                    </h2>
                    <p className="text-sm">
                        {template.marksheet_type === 'term_wise' ? 'Term Examination' :
                         template.marksheet_type === 'consolidated' ? 'Consolidated Report' : 'Progressive Report'}
                    </p>
                </div>

                {/* Student Info */}
                <div className="flex gap-6 mb-6">
                    <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
                        {template.show_admission_no && (
                            <div className="flex gap-2">
                                <span className="font-semibold">Admission No:</span>
                                <span>2024001</span>
                            </div>
                        )}
                        {template.show_roll_no && (
                            <div className="flex gap-2">
                                <span className="font-semibold">Roll No:</span>
                                <span>15</span>
                            </div>
                        )}
                        <div className="flex gap-2 col-span-2">
                            <span className="font-semibold">Student Name:</span>
                            <span>John Doe</span>
                        </div>
                        {template.show_father_name && (
                            <div className="flex gap-2">
                                <span className="font-semibold">Father:</span>
                                <span>Mr. James Doe</span>
                            </div>
                        )}
                        {template.show_mother_name && (
                            <div className="flex gap-2">
                                <span className="font-semibold">Mother:</span>
                                <span>Mrs. Jane Doe</span>
                            </div>
                        )}
                        {template.show_class && (
                            <div className="flex gap-2">
                                <span className="font-semibold">Class:</span>
                                <span>X</span>
                            </div>
                        )}
                        {template.show_section && (
                            <div className="flex gap-2">
                                <span className="font-semibold">Section:</span>
                                <span>A</span>
                            </div>
                        )}
                        {template.show_dob && (
                            <div className="flex gap-2">
                                <span className="font-semibold">DOB:</span>
                                <span>15-03-2010</span>
                            </div>
                        )}
                    </div>
                    {template.show_student_photo && (
                        <div className="w-24 h-28 border-2 border-gray-400 flex items-center justify-center bg-gray-100">
                            <span className="text-gray-400 text-xs">PHOTO</span>
                        </div>
                    )}
                </div>

                {/* Marks Table */}
                <table className="w-full border-collapse text-sm mb-6">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border p-2 text-left">S.No</th>
                            {template.show_subject_code && <th className="border p-2 text-left">Code</th>}
                            <th className="border p-2 text-left">Subject</th>
                            {template.show_max_marks && <th className="border p-2 text-center">Max</th>}
                            {template.show_theory_marks && <th className="border p-2 text-center">Theory</th>}
                            {template.show_practical_marks && <th className="border p-2 text-center">Practical</th>}
                            {template.show_internal_marks && <th className="border p-2 text-center">Internal</th>}
                            {template.show_total_marks && <th className="border p-2 text-center">Total</th>}
                            {template.show_grade && <th className="border p-2 text-center">Grade</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi'].map((subject, idx) => (
                            <tr key={idx}>
                                <td className="border p-2">{idx + 1}</td>
                                {template.show_subject_code && <td className="border p-2">SUB{String(idx + 1).padStart(3, '0')}</td>}
                                <td className="border p-2">{subject}</td>
                                {template.show_max_marks && <td className="border p-2 text-center">100</td>}
                                {template.show_theory_marks && <td className="border p-2 text-center">{75 + idx * 2}</td>}
                                {template.show_practical_marks && <td className="border p-2 text-center">{20 - idx}</td>}
                                {template.show_internal_marks && <td className="border p-2 text-center">{8 + idx}</td>}
                                {template.show_total_marks && <td className="border p-2 text-center font-semibold">{85 + idx}</td>}
                                {template.show_grade && <td className="border p-2 text-center">A</td>}
                            </tr>
                        ))}
                        <tr className="bg-gray-50 font-bold">
                            <td colSpan={template.show_subject_code ? 3 : 2} className="border p-2 text-right">Total</td>
                            {template.show_max_marks && <td className="border p-2 text-center">500</td>}
                            {template.show_theory_marks && <td className="border p-2 text-center">385</td>}
                            {template.show_practical_marks && <td className="border p-2 text-center">85</td>}
                            {template.show_internal_marks && <td className="border p-2 text-center">50</td>}
                            {template.show_total_marks && <td className="border p-2 text-center">435</td>}
                            {template.show_grade && <td className="border p-2 text-center">A</td>}
                        </tr>
                    </tbody>
                </table>

                {/* Result Summary */}
                <div className="grid grid-cols-4 gap-4 mb-6 text-sm">
                    {template.show_overall_percentage && (
                        <div className="border p-2 text-center">
                            <span className="font-semibold block">Percentage</span>
                            <span className="text-lg font-bold" style={{ color: template.primary_color }}>87%</span>
                        </div>
                    )}
                    {template.show_overall_grade && (
                        <div className="border p-2 text-center">
                            <span className="font-semibold block">Grade</span>
                            <span className="text-lg font-bold" style={{ color: template.primary_color }}>A</span>
                        </div>
                    )}
                    {template.show_rank && (
                        <div className="border p-2 text-center">
                            <span className="font-semibold block">Rank</span>
                            <span className="text-lg font-bold" style={{ color: template.primary_color }}>5</span>
                        </div>
                    )}
                    {template.show_result_status && (
                        <div className="border p-2 text-center">
                            <span className="font-semibold block">Result</span>
                            <span className="text-lg font-bold text-green-600">PASS</span>
                        </div>
                    )}
                </div>

                {/* Remarks */}
                {template.show_teacher_remark && (
                    <div className="mb-4 text-sm">
                        <span className="font-semibold">Teacher's Remark:</span>
                        <span className="ml-2 italic">Excellent performance. Keep it up!</span>
                    </div>
                )}

                {/* Signatures */}
                <div className="flex justify-between items-end mt-8 pt-4 border-t text-sm">
                    {template.show_class_teacher_sign && (
                        <div className="text-center">
                            <div className="w-28 h-12 border-b border-gray-400 mb-1" />
                            <span>{template.left_sign_title || 'Class Teacher'}</span>
                        </div>
                    )}
                    <div className="text-center text-xs text-gray-500">
                        {template.printing_date_text} 15-03-2026
                    </div>
                    {template.show_principal_sign && (
                        <div className="text-center">
                            <div className="w-28 h-12 border-b border-gray-400 mb-1" />
                            <span>{template.right_sign_title || 'Principal'}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout>
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Marksheet Designer</h1>
                    <p className="text-muted-foreground">Create and manage marksheet templates</p>
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
                                <p className="text-muted-foreground mb-4">Create your first marksheet template</p>
                                <Button onClick={handleCreate}>
                                    <Plus className="w-4 h-4 mr-2" /> Create Template
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {templates.map((template) => {
                                const typeBadge = getMarksheetTypeBadge(template.marksheet_type);
                                return (
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
                                                    <div className="flex gap-2 mt-1">
                                                        <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
                                                        <Badge variant="outline">{template.board_type?.toUpperCase() || 'STATE'}</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {/* Mini preview placeholder */}
                                            <div className="border rounded bg-gray-50 p-2 mb-4 h-24 flex items-center justify-center text-gray-400 text-sm">
                                                <Printer className="w-8 h-8" />
                                            </div>
                                            
                                            {/* Options summary */}
                                            <div className="flex flex-wrap gap-1 mb-4">
                                                {template.show_student_photo && <Badge variant="outline" className="text-xs">Photo</Badge>}
                                                {template.show_grade && <Badge variant="outline" className="text-xs">Grade</Badge>}
                                                {template.show_rank && <Badge variant="outline" className="text-xs">Rank</Badge>}
                                                {template.show_percentage && <Badge variant="outline" className="text-xs">%</Badge>}
                                                {template.show_attendance && <Badge variant="outline" className="text-xs">Attendance</Badge>}
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
                                );
                            })}
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
                <DialogContent className="max-w-5xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>
                            {editMode ? 'Edit Marksheet Template' : 'Create Marksheet Template'}
                        </DialogTitle>
                    </DialogHeader>

                    <ScrollArea className="max-h-[70vh]">
                        <Tabs defaultValue="basic" className="w-full pr-4">
                            <TabsList className="grid w-full grid-cols-5">
                                <TabsTrigger value="basic">Basic</TabsTrigger>
                                <TabsTrigger value="student">Student Info</TabsTrigger>
                                <TabsTrigger value="marks">Marks Display</TabsTrigger>
                                <TabsTrigger value="extras">Extras</TabsTrigger>
                                <TabsTrigger value="styling">Styling</TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Template Name *</Label>
                                        <Input
                                            value={formData.template_name}
                                            onChange={(e) => handleInputChange('template_name', e.target.value)}
                                            placeholder="e.g., Standard Marksheet"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Board Type</Label>
                                        <Select
                                            value={formData.board_type}
                                            onValueChange={(value) => handleInputChange('board_type', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="state">State Board</SelectItem>
                                                <SelectItem value="cbse">CBSE</SelectItem>
                                                <SelectItem value="icse">ICSE</SelectItem>
                                                <SelectItem value="ib">IB</SelectItem>
                                                <SelectItem value="custom">Custom</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Marksheet Type</Label>
                                        <Select
                                            value={formData.marksheet_type}
                                            onValueChange={(value) => handleInputChange('marksheet_type', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="term_wise">Term-wise</SelectItem>
                                                <SelectItem value="consolidated">Consolidated</SelectItem>
                                                <SelectItem value="progressive">Progressive</SelectItem>
                                            </SelectContent>
                                        </Select>
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
                                                <SelectItem value="Letter">Letter</SelectItem>
                                                <SelectItem value="Legal">Legal</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Separator />

                                <h4 className="font-semibold">School Information</h4>
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
                                    <div className="space-y-2">
                                        <Label>Affiliation No</Label>
                                        <Input
                                            value={formData.affiliation_no}
                                            onChange={(e) => handleInputChange('affiliation_no', e.target.value)}
                                            placeholder="e.g., 1234567"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>School Code</Label>
                                        <Input
                                            value={formData.school_code}
                                            onChange={(e) => handleInputChange('school_code', e.target.value)}
                                            placeholder="e.g., 12345"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-4">
                                    <Label>Set as Default Template</Label>
                                    <Switch
                                        checked={formData.is_default}
                                        onCheckedChange={() => handleSwitchChange('is_default')}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="student" className="space-y-4 mt-4">
                                <h4 className="font-semibold">Display Options</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { key: 'show_school_logo', label: 'School Logo' },
                                        { key: 'show_student_photo', label: 'Student Photo' },
                                        { key: 'show_father_name', label: "Father's Name" },
                                        { key: 'show_mother_name', label: "Mother's Name" },
                                        { key: 'show_dob', label: 'Date of Birth' },
                                        { key: 'show_admission_no', label: 'Admission No' },
                                        { key: 'show_roll_no', label: 'Roll No' },
                                        { key: 'show_class', label: 'Class' },
                                        { key: 'show_section', label: 'Section' },
                                        { key: 'show_academic_session', label: 'Academic Session' },
                                        { key: 'show_category', label: 'Category' },
                                        { key: 'show_aadhar_no', label: 'Aadhar No' },
                                    ].map(({ key, label }) => (
                                        <div key={key} className="flex items-center justify-between border p-2 rounded">
                                            <Label className="text-sm">{label}</Label>
                                            <Switch
                                                checked={formData[key]}
                                                onCheckedChange={() => handleSwitchChange(key)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="marks" className="space-y-4 mt-4">
                                <h4 className="font-semibold">Marks Table Columns</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { key: 'show_subject_code', label: 'Subject Code' },
                                        { key: 'show_max_marks', label: 'Max Marks' },
                                        { key: 'show_theory_marks', label: 'Theory Marks' },
                                        { key: 'show_practical_marks', label: 'Practical Marks' },
                                        { key: 'show_internal_marks', label: 'Internal Marks' },
                                        { key: 'show_total_marks', label: 'Total Marks' },
                                        { key: 'show_percentage', label: 'Subject %' },
                                        { key: 'show_grade', label: 'Grade' },
                                        { key: 'show_grade_point', label: 'Grade Point' },
                                        { key: 'show_credit', label: 'Credit Hours' },
                                    ].map(({ key, label }) => (
                                        <div key={key} className="flex items-center justify-between border p-2 rounded">
                                            <Label className="text-sm">{label}</Label>
                                            <Switch
                                                checked={formData[key]}
                                                onCheckedChange={() => handleSwitchChange(key)}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <Separator />

                                <h4 className="font-semibold">Result Summary</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { key: 'show_overall_percentage', label: 'Overall %' },
                                        { key: 'show_overall_grade', label: 'Overall Grade' },
                                        { key: 'show_rank', label: 'Rank' },
                                        { key: 'show_division', label: 'Division' },
                                        { key: 'show_cgpa', label: 'CGPA' },
                                        { key: 'show_result_status', label: 'Pass/Fail Status' },
                                        { key: 'show_attendance', label: 'Attendance' },
                                        { key: 'show_attendance_percentage', label: 'Attendance %' },
                                        { key: 'show_total_working_days', label: 'Total Working Days' },
                                    ].map(({ key, label }) => (
                                        <div key={key} className="flex items-center justify-between border p-2 rounded">
                                            <Label className="text-sm">{label}</Label>
                                            <Switch
                                                checked={formData[key]}
                                                onCheckedChange={() => handleSwitchChange(key)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="extras" className="space-y-4 mt-4">
                                <h4 className="font-semibold">Additional Sections</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { key: 'show_co_scholastic', label: 'Co-Scholastic Areas' },
                                        { key: 'show_observations', label: 'Observations' },
                                        { key: 'show_teacher_remark', label: "Teacher's Remark" },
                                        { key: 'show_principal_remark', label: "Principal's Remark" },
                                        { key: 'show_discipline_grade', label: 'Discipline Grade' },
                                    ].map(({ key, label }) => (
                                        <div key={key} className="flex items-center justify-between border p-2 rounded">
                                            <Label className="text-sm">{label}</Label>
                                            <Switch
                                                checked={formData[key]}
                                                onCheckedChange={() => handleSwitchChange(key)}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <Separator />

                                <h4 className="font-semibold">Signatures</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { key: 'show_class_teacher_sign', label: 'Class Teacher Sign' },
                                        { key: 'show_principal_sign', label: 'Principal Sign' },
                                        { key: 'show_examiner_sign', label: 'Examiner Sign' },
                                        { key: 'show_parent_sign', label: 'Parent Sign' },
                                    ].map(({ key, label }) => (
                                        <div key={key} className="flex items-center justify-between border p-2 rounded">
                                            <Label className="text-sm">{label}</Label>
                                            <Switch
                                                checked={formData[key]}
                                                onCheckedChange={() => handleSwitchChange(key)}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-3 gap-4 mt-4">
                                    <div className="space-y-2">
                                        <Label>Left Sign Title</Label>
                                        <Input
                                            value={formData.left_sign_title}
                                            onChange={(e) => handleInputChange('left_sign_title', e.target.value)}
                                            placeholder="Class Teacher"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Middle Sign Title</Label>
                                        <Input
                                            value={formData.middle_sign_title}
                                            onChange={(e) => handleInputChange('middle_sign_title', e.target.value)}
                                            placeholder="Examiner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Right Sign Title</Label>
                                        <Input
                                            value={formData.right_sign_title}
                                            onChange={(e) => handleInputChange('right_sign_title', e.target.value)}
                                            placeholder="Principal"
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
                                                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                                                <SelectItem value="Arial">Arial</SelectItem>
                                                <SelectItem value="Georgia">Georgia</SelectItem>
                                                <SelectItem value="Helvetica">Helvetica</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Border Style</Label>
                                        <Select
                                            value={formData.border_style}
                                            onValueChange={(value) => handleInputChange('border_style', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                <SelectItem value="single">Single</SelectItem>
                                                <SelectItem value="double">Double</SelectItem>
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
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Header Text</Label>
                                        <Input
                                            value={formData.header_text}
                                            onChange={(e) => handleInputChange('header_text', e.target.value)}
                                            placeholder="e.g., MARKSHEET"
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
                                    <Label>Custom CSS</Label>
                                    <Textarea
                                        value={formData.template_css}
                                        onChange={(e) => handleInputChange('template_css', e.target.value)}
                                        rows={5}
                                        className="font-mono text-sm"
                                        placeholder="/* Custom CSS */"
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </ScrollArea>

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
                <DialogContent className="max-w-4xl max-h-[95vh]">
                    <DialogHeader>
                        <DialogTitle>Template Preview - {selectedTemplate?.template_name}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[80vh]">
                        <div className="py-4">
                            <MarksheetPreview template={selectedTemplate} />
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
        </DashboardLayout>
    );
};

export default MarksheetDesignerPage;
