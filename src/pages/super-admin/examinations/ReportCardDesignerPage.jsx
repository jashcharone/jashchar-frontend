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
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { reportCardTemplateService } from '@/services/examinationService';
import { 
    Plus, Edit, Trash2, Eye, Save, FileText, 
    Copy, Star, BookOpen, TrendingUp, Activity
} from 'lucide-react';

const ReportCardDesignerPage = () => {
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
        board_type: 'state',
        report_type: 'term',
        page_size: 'A4',
        orientation: 'portrait',
        linked_exam_ids: [],
        // School Info
        show_school_logo: true,
        school_name: '',
        school_address: '',
        affiliation_no: '',
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
        show_blood_group: false,
        show_contact_info: false,
        // Report Card Specific
        show_term_wise_comparison: false,
        show_subject_trend_chart: false,
        show_class_average: false,
        show_highest_marks: false,
        show_lowest_marks: false,
        // Marks Display
        show_subject_code: false,
        show_max_marks: true,
        show_marks_obtained: true,
        show_percentage: true,
        show_grade: true,
        show_grade_point: false,
        show_rank: true,
        // Life Skills (CBSE)
        show_life_skills: false,
        life_skills: [],
        // Activities
        show_activities: false,
        activities_list: [],
        // Health Record
        show_health_record: false,
        health_fields: ['height', 'weight', 'vision', 'hearing'],
        // Attendance
        show_attendance: true,
        show_attendance_breakdown: false,
        // Remarks
        show_teacher_remark: true,
        show_principal_remark: true,
        show_parent_feedback: false,
        // Signatures
        show_class_teacher_sign: true,
        show_principal_sign: true,
        show_parent_sign: true,
        left_sign_title: 'Class Teacher',
        middle_sign_title: 'Parent/Guardian',
        right_sign_title: 'Principal',
        left_sign_url: '',
        middle_sign_url: '',
        right_sign_url: '',
        // Images
        logo_url: '',
        header_image_url: '',
        background_image_url: '',
        watermark_url: '',
        // Styling
        header_text: '',
        footer_text: '',
        template_css: '',
        font_family: 'Arial',
        primary_color: '#1a365d',
        secondary_color: '#2b6cb0',
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
            const response = await reportCardTemplateService.getTemplates({
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
            report_type: 'term',
            page_size: 'A4',
            orientation: 'portrait',
            linked_exam_ids: [],
            show_school_logo: true,
            school_name: '',
            school_address: '',
            affiliation_no: '',
            show_student_photo: true,
            show_father_name: true,
            show_mother_name: true,
            show_dob: true,
            show_admission_no: true,
            show_roll_no: true,
            show_class: true,
            show_section: true,
            show_academic_session: true,
            show_blood_group: false,
            show_contact_info: false,
            show_term_wise_comparison: false,
            show_subject_trend_chart: false,
            show_class_average: false,
            show_highest_marks: false,
            show_lowest_marks: false,
            show_subject_code: false,
            show_max_marks: true,
            show_marks_obtained: true,
            show_percentage: true,
            show_grade: true,
            show_grade_point: false,
            show_rank: true,
            show_life_skills: false,
            life_skills: [],
            show_activities: false,
            activities_list: [],
            show_health_record: false,
            health_fields: ['height', 'weight', 'vision', 'hearing'],
            show_attendance: true,
            show_attendance_breakdown: false,
            show_teacher_remark: true,
            show_principal_remark: true,
            show_parent_feedback: false,
            show_class_teacher_sign: true,
            show_principal_sign: true,
            show_parent_sign: true,
            left_sign_title: 'Class Teacher',
            middle_sign_title: 'Parent/Guardian',
            right_sign_title: 'Principal',
            left_sign_url: '',
            middle_sign_url: '',
            right_sign_url: '',
            logo_url: '',
            header_image_url: '',
            background_image_url: '',
            watermark_url: '',
            header_text: '',
            footer_text: '',
            template_css: '',
            font_family: 'Arial',
            primary_color: '#1a365d',
            secondary_color: '#2b6cb0',
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
            const response = await reportCardTemplateService.createTemplate(duplicatedData);
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
                response = await reportCardTemplateService.updateTemplate(selectedTemplate.id, payload);
            } else {
                response = await reportCardTemplateService.createTemplate(payload);
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
            const response = await reportCardTemplateService.deleteTemplate(template.id);
            if (response.data.success) {
                toast.success('Template deleted successfully');
                loadTemplates();
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            toast.error('Failed to delete template');
        }
    };

    const getReportTypeBadge = (type) => {
        const types = {
            term: { label: 'Term Report', variant: 'default' },
            annual: { label: 'Annual', variant: 'secondary' },
            progressive: { label: 'Progressive', variant: 'outline' },
            custom: { label: 'Custom', variant: 'destructive' }
        };
        return types[type] || { label: type, variant: 'default' };
    };

    // Preview Component
    const ReportCardPreview = ({ template }) => {
        if (!template) return null;

        return (
            <div 
                className="bg-white p-8 mx-auto border-2"
                style={{ 
                    width: '700px', 
                    fontFamily: template.font_family || 'Arial',
                    borderColor: template.primary_color,
                    minHeight: '950px'
                }}
            >
                {/* Header */}
                <div className="text-center mb-6 pb-4" style={{ borderBottom: `2px solid ${template.primary_color}` }}>
                    <div className="flex justify-center items-center gap-4 mb-2">
                        {template.show_school_logo && (
                            <div className="w-20 h-20 border-2 rounded flex items-center justify-center bg-gray-50">
                                <span className="text-gray-400 text-xs">LOGO</span>
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold" style={{ color: template.primary_color }}>
                                {template.school_name || 'School Name'}
                            </h1>
                            <p className="text-sm">{template.school_address || 'School Address'}</p>
                        </div>
                    </div>
                    <h2 className="text-xl font-bold mt-4" style={{ color: template.secondary_color }}>
                        {template.header_text || 'PROGRESS REPORT CARD'}
                    </h2>
                    <p className="text-sm">Academic Session: 2025-2026</p>
                </div>

                {/* Student Info */}
                <div className="flex gap-6 mb-6">
                    <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
                        <div className="flex gap-2">
                            <span className="font-semibold">Name:</span>
                            <span>John Doe</span>
                        </div>
                        {template.show_class && (
                            <div className="flex gap-2">
                                <span className="font-semibold">Class:</span>
                                <span>X - A</span>
                            </div>
                        )}
                        {template.show_roll_no && (
                            <div className="flex gap-2">
                                <span className="font-semibold">Roll No:</span>
                                <span>15</span>
                            </div>
                        )}
                        {template.show_admission_no && (
                            <div className="flex gap-2">
                                <span className="font-semibold">Adm No:</span>
                                <span>2024001</span>
                            </div>
                        )}
                        {template.show_father_name && (
                            <div className="flex gap-2 col-span-2">
                                <span className="font-semibold">Father:</span>
                                <span>Mr. James Doe</span>
                            </div>
                        )}
                    </div>
                    {template.show_student_photo && (
                        <div className="w-24 h-28 border-2 border-gray-400 flex items-center justify-center bg-gray-100">
                            <span className="text-gray-400 text-xs">PHOTO</span>
                        </div>
                    )}
                </div>

                {/* Term Comparison (if enabled) */}
                {template.show_term_wise_comparison && (
                    <div className="mb-6">
                        <h3 className="font-semibold mb-2" style={{ color: template.primary_color }}>
                            Term-wise Performance Comparison
                        </h3>
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border p-2 text-left">Subject</th>
                                    <th className="border p-2 text-center">Term 1</th>
                                    <th className="border p-2 text-center">Term 2</th>
                                    {template.show_subject_trend_chart && <th className="border p-2 text-center">Trend</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {['English', 'Mathematics', 'Science'].map((subject, idx) => (
                                    <tr key={idx}>
                                        <td className="border p-2">{subject}</td>
                                        <td className="border p-2 text-center">{80 + idx * 3}</td>
                                        <td className="border p-2 text-center">{85 + idx * 2}</td>
                                        {template.show_subject_trend_chart && (
                                            <td className="border p-2 text-center">
                                                <TrendingUp className="w-4 h-4 inline text-green-600" />
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Main Marks Table */}
                <div className="mb-6">
                    <h3 className="font-semibold mb-2" style={{ color: template.primary_color }}>
                        Scholastic Areas
                    </h3>
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border p-2 text-left">Subject</th>
                                {template.show_max_marks && <th className="border p-2 text-center">Max</th>}
                                {template.show_marks_obtained && <th className="border p-2 text-center">Obtained</th>}
                                {template.show_grade && <th className="border p-2 text-center">Grade</th>}
                                {template.show_class_average && <th className="border p-2 text-center">Class Avg</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi'].map((subject, idx) => (
                                <tr key={idx}>
                                    <td className="border p-2">{subject}</td>
                                    {template.show_max_marks && <td className="border p-2 text-center">100</td>}
                                    {template.show_marks_obtained && <td className="border p-2 text-center">{85 + idx}</td>}
                                    {template.show_grade && <td className="border p-2 text-center">A</td>}
                                    {template.show_class_average && <td className="border p-2 text-center">{75 + idx}</td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Life Skills (CBSE) */}
                {template.show_life_skills && (
                    <div className="mb-6">
                        <h3 className="font-semibold mb-2" style={{ color: template.primary_color }}>
                            Life Skills
                        </h3>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                            {['Self Awareness', 'Problem Solving', 'Creative Thinking', 'Decision Making', 'Empathy'].map((skill, idx) => (
                                <div key={idx} className="border p-2 flex justify-between">
                                    <span>{skill}</span>
                                    <Badge variant="outline">A</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Co-Curricular Activities */}
                {template.show_activities && (
                    <div className="mb-6">
                        <h3 className="font-semibold mb-2" style={{ color: template.primary_color }}>
                            Co-Curricular Activities
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            {['Sports', 'Music', 'Art', 'Drama'].map((activity, idx) => (
                                <div key={idx} className="border p-2 flex justify-between">
                                    <span>{activity}</span>
                                    <span className="text-green-600">Active</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Health Record */}
                {template.show_health_record && (
                    <div className="mb-6">
                        <h3 className="font-semibold mb-2" style={{ color: template.primary_color }}>
                            Health Record
                        </h3>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                            <div className="border p-2 text-center">
                                <span className="block text-xs text-gray-500">Height</span>
                                <span>152 cm</span>
                            </div>
                            <div className="border p-2 text-center">
                                <span className="block text-xs text-gray-500">Weight</span>
                                <span>45 kg</span>
                            </div>
                            <div className="border p-2 text-center">
                                <span className="block text-xs text-gray-500">Vision</span>
                                <span>Normal</span>
                            </div>
                            <div className="border p-2 text-center">
                                <span className="block text-xs text-gray-500">Hearing</span>
                                <span>Normal</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Attendance */}
                {template.show_attendance && (
                    <div className="mb-6 text-sm">
                        <div className="flex gap-4">
                            <span><strong>Total Working Days:</strong> 220</span>
                            <span><strong>Days Present:</strong> 210</span>
                            <span><strong>Attendance:</strong> 95.5%</span>
                        </div>
                    </div>
                )}

                {/* Remarks */}
                <div className="mb-6 text-sm space-y-2">
                    {template.show_teacher_remark && (
                        <div>
                            <span className="font-semibold">Class Teacher's Remark:</span>
                            <span className="ml-2 italic">Excellent performance. Very attentive in class.</span>
                        </div>
                    )}
                    {template.show_principal_remark && (
                        <div>
                            <span className="font-semibold">Principal's Remark:</span>
                            <span className="ml-2 italic">Keep up the good work!</span>
                        </div>
                    )}
                </div>

                {/* Signatures */}
                <div className="flex justify-between items-end mt-8 pt-4 border-t text-sm">
                    {template.show_class_teacher_sign && (
                        <div className="text-center">
                            <div className="w-24 h-10 border-b border-gray-400 mb-1" />
                            <span>{template.left_sign_title}</span>
                        </div>
                    )}
                    {template.show_parent_sign && (
                        <div className="text-center">
                            <div className="w-24 h-10 border-b border-gray-400 mb-1" />
                            <span>{template.middle_sign_title}</span>
                        </div>
                    )}
                    {template.show_principal_sign && (
                        <div className="text-center">
                            <div className="w-24 h-10 border-b border-gray-400 mb-1" />
                            <span>{template.right_sign_title}</span>
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
                    <h1 className="text-2xl font-bold">Report Card Designer</h1>
                    <p className="text-muted-foreground">Create comprehensive progress report cards</p>
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
                                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold">No Templates Found</h3>
                                <p className="text-muted-foreground mb-4">Create your first report card template</p>
                                <Button onClick={handleCreate}>
                                    <Plus className="w-4 h-4 mr-2" /> Create Template
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {templates.map((template) => {
                                const typeBadge = getReportTypeBadge(template.report_type);
                                return (
                                    <Card key={template.id} className="hover:shadow-lg transition-shadow">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="text-lg flex items-center gap-2">
                                                        {template.template_name}
                                                        {template.is_default && (
                                                            <Badge variant="secondary">
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
                                                <BookOpen className="w-8 h-8" />
                                            </div>
                                            
                                            {/* Features summary */}
                                            <div className="flex flex-wrap gap-1 mb-4">
                                                {template.show_term_wise_comparison && <Badge variant="outline" className="text-xs">Comparison</Badge>}
                                                {template.show_life_skills && <Badge variant="outline" className="text-xs">Life Skills</Badge>}
                                                {template.show_activities && <Badge variant="outline" className="text-xs">Activities</Badge>}
                                                {template.show_health_record && <Badge variant="outline" className="text-xs">Health</Badge>}
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
                            <CardDescription>Configure default settings for report cards</CardDescription>
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
                            {editMode ? 'Edit Report Card Template' : 'Create Report Card Template'}
                        </DialogTitle>
                    </DialogHeader>

                    <ScrollArea className="max-h-[70vh]">
                        <Tabs defaultValue="basic" className="w-full pr-4">
                            <TabsList className="grid w-full grid-cols-5">
                                <TabsTrigger value="basic">Basic</TabsTrigger>
                                <TabsTrigger value="display">Display</TabsTrigger>
                                <TabsTrigger value="cbse">CBSE/Extras</TabsTrigger>
                                <TabsTrigger value="signatures">Signatures</TabsTrigger>
                                <TabsTrigger value="styling">Styling</TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Template Name *</Label>
                                        <Input
                                            value={formData.template_name}
                                            onChange={(e) => handleInputChange('template_name', e.target.value)}
                                            placeholder="e.g., Progress Report Card"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Report Type</Label>
                                        <Select
                                            value={formData.report_type}
                                            onValueChange={(value) => handleInputChange('report_type', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="term">Term Report</SelectItem>
                                                <SelectItem value="annual">Annual Report</SelectItem>
                                                <SelectItem value="progressive">Progressive Report</SelectItem>
                                                <SelectItem value="custom">Custom Range</SelectItem>
                                            </SelectContent>
                                        </Select>
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
                                </div>

                                <div className="flex items-center justify-between mt-4">
                                    <Label>Set as Default Template</Label>
                                    <Switch
                                        checked={formData.is_default}
                                        onCheckedChange={() => handleSwitchChange('is_default')}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="display" className="space-y-4 mt-4">
                                <h4 className="font-semibold">Student Information</h4>
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
                                        { key: 'show_blood_group', label: 'Blood Group' },
                                        { key: 'show_contact_info', label: 'Contact Info' },
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

                                <h4 className="font-semibold">Report Features</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { key: 'show_term_wise_comparison', label: 'Term Comparison' },
                                        { key: 'show_subject_trend_chart', label: 'Trend Chart' },
                                        { key: 'show_class_average', label: 'Class Average' },
                                        { key: 'show_highest_marks', label: 'Highest Marks' },
                                        { key: 'show_lowest_marks', label: 'Lowest Marks' },
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

                                <h4 className="font-semibold">Marks Display</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { key: 'show_max_marks', label: 'Max Marks' },
                                        { key: 'show_marks_obtained', label: 'Marks Obtained' },
                                        { key: 'show_percentage', label: 'Percentage' },
                                        { key: 'show_grade', label: 'Grade' },
                                        { key: 'show_grade_point', label: 'Grade Point' },
                                        { key: 'show_rank', label: 'Rank' },
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

                            <TabsContent value="cbse" className="space-y-4 mt-4">
                                <h4 className="font-semibold">CBSE-Specific Sections</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { key: 'show_life_skills', label: 'Life Skills Section' },
                                        { key: 'show_activities', label: 'Co-Curricular Activities' },
                                        { key: 'show_health_record', label: 'Health Record' },
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

                                <h4 className="font-semibold">Attendance & Remarks</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { key: 'show_attendance', label: 'Show Attendance' },
                                        { key: 'show_attendance_breakdown', label: 'Attendance Breakdown' },
                                        { key: 'show_teacher_remark', label: "Teacher's Remark" },
                                        { key: 'show_principal_remark', label: "Principal's Remark" },
                                        { key: 'show_parent_feedback', label: 'Parent Feedback Section' },
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

                            <TabsContent value="signatures" className="space-y-4 mt-4">
                                <h4 className="font-semibold">Signature Options</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { key: 'show_class_teacher_sign', label: 'Class Teacher Sign' },
                                        { key: 'show_principal_sign', label: 'Principal Sign' },
                                        { key: 'show_parent_sign', label: 'Parent/Guardian Sign' },
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

                                <div className="grid grid-cols-3 gap-4">
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
                                            placeholder="Parent/Guardian"
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
                                                <SelectItem value="Arial">Arial</SelectItem>
                                                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
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
                                            placeholder="e.g., PROGRESS REPORT CARD"
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
                            <ReportCardPreview template={selectedTemplate} />
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ReportCardDesignerPage;
