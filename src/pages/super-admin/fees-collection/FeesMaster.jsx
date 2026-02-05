import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
    Plus, Edit, Trash2, UserPlus, Loader2, Search, 
    Download, FileText, Printer, Copy, Table, Columns,
    ChevronDown, ChevronRight, Calendar, IndianRupee,
    AlertCircle, CheckCircle2, Users, GraduationCap
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import DatePicker from '@/components/ui/DatePicker';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================================================
// FEES MASTER - SMART SCHOOL STYLE
// Left Panel: Add Form | Right Panel: Grouped List by Fees Group
// With "Assign to Class" functionality for bulk student fee allocation
// ============================================================================

const FeesMaster = () => {
    const { user, school, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const currencySymbol = school?.currency_symbol || '₹';
    const { toast } = useToast();
    const navigate = useNavigate();
    
    // Data States
    const [feeMasters, setFeeMasters] = useState([]);
    const [feeGroups, setFeeGroups] = useState([]);
    const [feeTypes, setFeeTypes] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // UI States
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedGroups, setExpandedGroups] = useState({});
    const [pageSize, setPageSize] = useState(50);
    
    // Assign to Class Dialog States
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedFeeGroupForAssign, setSelectedFeeGroupForAssign] = useState(null);
    const [assignClassId, setAssignClassId] = useState('');
    const [assignSectionId, setAssignSectionId] = useState('');
    const [assignLoading, setAssignLoading] = useState(false);
    const [filteredSections, setFilteredSections] = useState([]);
    const [classAssignments, setClassAssignments] = useState([]);
    
    // Form State
    const [formData, setFormData] = useState({
        id: null,
        fee_group_id: '',
        fee_type_id: '',
        due_date: null,
        amount: '',
        fine_type: 'none',
        fine_value: '',
        is_fine_per_day: false,
    });
    const [isEditing, setIsEditing] = useState(false);

    const branchId = user?.profile?.branch_id;

    // Fetch Fee Masters with related data
    const fetchFeeMasters = useCallback(async () => {
        if (!branchId || !selectedBranch) return;
        setLoading(true);
        
        const { data, error } = await supabase
            .from('fee_masters')
            .select(`
                *,
                fee_groups(id, name),
                fee_types(id, name, code)
            `)
            .eq('branch_id', selectedBranch.id)
            .eq('session_id', currentSessionId)
            .order('created_at', { ascending: false });

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching fee masters', description: error.message });
        } else {
            setFeeMasters(data || []);
            // Expand all groups by default
            const groups = {};
            data?.forEach(m => {
                if (m.fee_groups?.id) groups[m.fee_groups.id] = true;
            });
            setExpandedGroups(groups);
        }
        setLoading(false);
    }, [branchId, selectedBranch, currentSessionId, toast]);

    // Fetch Dropdowns
    const fetchDropdowns = useCallback(async () => {
        if (!branchId || !selectedBranch) return;
        
        const [groupsRes, typesRes, classesRes, sectionsRes] = await Promise.all([
            supabase.from('fee_groups').select('id, name, description').eq('branch_id', selectedBranch.id).order('name'),
            supabase.from('fee_types').select('id, name, code, description').eq('branch_id', selectedBranch.id).order('name'),
            supabase.from('classes').select('id, name').eq('branch_id', selectedBranch.id).order('name'),
            supabase.from('sections').select('id, name, class_id:classes(id)').eq('branch_id', selectedBranch.id).order('name')
        ]);
        
        if (groupsRes.error) toast({ variant: 'destructive', title: 'Error fetching fee groups' });
        else setFeeGroups(groupsRes.data || []);
        
        if (typesRes.error) toast({ variant: 'destructive', title: 'Error fetching fee types' });
        else setFeeTypes(typesRes.data || []);
        
        if (classesRes.error) {
            console.error('Classes fetch error:', classesRes.error);
            toast({ variant: 'destructive', title: 'Error fetching classes' });
        } else setClasses(classesRes.data || []);
        
        if (sectionsRes.error) {
            console.error('Sections fetch error:', sectionsRes.error);
            toast({ variant: 'destructive', title: 'Error fetching sections' });
        } else setSections(sectionsRes.data || []);
    }, [branchId, selectedBranch, toast]);

    useEffect(() => {
        fetchFeeMasters();
        fetchDropdowns();
    }, [fetchFeeMasters, fetchDropdowns]);

    // Group fee masters by fee_group
    const groupedFeeMasters = useMemo(() => {
        const groups = {};
        
        feeMasters.forEach(master => {
            const groupName = master.fee_groups?.name || 'Ungrouped';
            const groupId = master.fee_groups?.id || 'ungrouped';
            
            if (!groups[groupId]) {
                groups[groupId] = {
                    id: groupId,
                    name: groupName,
                    items: []
                };
            }
            groups[groupId].items.push(master);
        });
        
        return Object.values(groups);
    }, [feeMasters]);

    // Filter based on search
    const filteredGroups = useMemo(() => {
        if (!searchQuery.trim()) return groupedFeeMasters;
        
        const query = searchQuery.toLowerCase();
        return groupedFeeMasters.map(group => ({
            ...group,
            items: group.items.filter(item => 
                item.fee_types?.name?.toLowerCase().includes(query) ||
                item.fee_types?.code?.toLowerCase().includes(query) ||
                group.name.toLowerCase().includes(query)
            )
        })).filter(group => group.items.length > 0);
    }, [groupedFeeMasters, searchQuery]);

    // Reset Form
    const resetForm = () => {
        setFormData({
            id: null,
            fee_group_id: '',
            fee_type_id: '',
            due_date: null,
            amount: '',
            fine_type: 'none',
            fine_value: '',
            is_fine_per_day: false,
        });
        setIsEditing(false);
    };

    // Handle Edit
    const handleEdit = (master) => {
        setFormData({
            id: master.id,
            fee_group_id: master.fee_group_id,
            fee_type_id: master.fee_type_id,
            due_date: master.due_date,
            amount: master.amount?.toString() || '',
            fine_type: master.fine_type || 'none',
            fine_value: master.fine_value?.toString() || '',
            is_fine_per_day: master.is_fine_per_day || false,
        });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.fee_group_id || !formData.fee_type_id || !formData.due_date || !formData.amount) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fill all required fields.' });
            return;
        }
        
        setIsSubmitting(true);

        const dataToSubmit = {
            fee_group_id: formData.fee_group_id,
            fee_type_id: formData.fee_type_id,
            due_date: formData.due_date,
            amount: parseFloat(formData.amount),
            fine_type: formData.fine_type,
            fine_value: formData.fine_value ? parseFloat(formData.fine_value) : null,
            is_fine_per_day: formData.is_fine_per_day,
            branch_id: selectedBranch.id,
            session_id: currentSessionId,
            organization_id: organizationId,
        };

        let error;
        if (isEditing && formData.id) {
            ({ error } = await supabase.from('fee_masters').update(dataToSubmit).eq('id', formData.id));
        } else {
            ({ error } = await supabase.from('fee_masters').insert([dataToSubmit]));
        }

        if (error) {
            toast({ variant: 'destructive', title: 'Error saving fee master', description: error.message });
        } else {
            toast({ title: 'Success!', description: `Fee master ${isEditing ? 'updated' : 'added'} successfully.` });
            resetForm();
            fetchFeeMasters();
        }
        setIsSubmitting(false);
    };

    // Handle Delete
    const handleDelete = async (masterId) => {
        const { data: allocations, error: allocError } = await supabase
            .from('student_fee_allocations')
            .select('id')
            .eq('fee_master_id', masterId)
            .limit(1);
            
        if (allocError) {
            toast({ variant: 'destructive', title: 'Error checking dependencies', description: allocError.message });
            return;
        }
        
        if (allocations && allocations.length > 0) {
            toast({ 
                variant: 'destructive', 
                title: 'Cannot Delete', 
                description: 'This fee master is already assigned to students. Remove allocations first.' 
            });
            return;
        }

        const { error } = await supabase.from('fee_masters').delete().eq('id', masterId);
        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting', description: error.message });
        } else {
            toast({ title: 'Deleted!', description: 'Fee master removed successfully.' });
            fetchFeeMasters();
        }
    };

    // Toggle group expansion
    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    // Open assign dialog for a fee group
    const openAssignDialog = (group) => {
        setSelectedFeeGroupForAssign(group);
        setAssignClassId('');
        setAssignSectionId('');
        setFilteredSections([]);
        setAssignDialogOpen(true);
        
        // Fetch existing assignments for this group
        fetchClassAssignments(group.id);
    };
    
    // Handle class selection - filter sections
    const handleClassChange = (classId) => {
        setAssignClassId(classId);
        setAssignSectionId('');
        const secs = sections.filter(s => s.class_id?.id === classId);
        setFilteredSections(secs);
    };
    
    // Fetch existing class assignments for a fee group
    const fetchClassAssignments = async (feeGroupId) => {
        const { data, error } = await supabase
            .from('fee_group_class_assignments')
            .select(`
                id, class_id, section_id, created_at,
                classes(id, name),
                sections(id, name)
            `)
            .eq('fee_group_id', feeGroupId)
            .eq('branch_id', selectedBranch.id)
            .eq('session_id', currentSessionId);
            
        if (!error) {
            setClassAssignments(data || []);
        }
    };

    // Handle assign to class submission
    const handleAssignToClass = async () => {
        if (!assignClassId) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Please select a class.' });
            return;
        }
        
        // Convert "all" to null for section
        const sectionId = assignSectionId === 'all' || !assignSectionId ? null : assignSectionId;
        
        setAssignLoading(true);
        
        try {
            // Step 1: Check if assignment already exists
            let existingQuery = supabase
                .from('fee_group_class_assignments')
                .select('id')
                .eq('fee_group_id', selectedFeeGroupForAssign.id)
                .eq('class_id', assignClassId)
                .eq('branch_id', selectedBranch.id)
                .eq('session_id', currentSessionId);
            
            // Handle null section_id properly
            if (sectionId) {
                existingQuery = existingQuery.eq('section_id', sectionId);
            } else {
                existingQuery = existingQuery.is('section_id', null);
            }
            
            const { data: existing } = await existingQuery.maybeSingle();
                
            if (existing) {
                toast({ variant: 'destructive', title: 'Already Assigned', description: 'This fee group is already assigned to the selected class/section.' });
                setAssignLoading(false);
                return;
            }
            
            // Step 2: Create fee_group_class_assignment record
            const assignmentData = {
                fee_group_id: selectedFeeGroupForAssign.id,
                class_id: assignClassId,
                section_id: sectionId,
                branch_id: selectedBranch.id,
                session_id: currentSessionId,
                organization_id: organizationId,
            };
            
            const { error: assignError } = await supabase
                .from('fee_group_class_assignments')
                .insert([assignmentData]);
                
            if (assignError) {
                throw assignError;
            }
            
            // Step 3: Get all fee masters for this fee group
            const { data: feeMastersForGroup } = await supabase
                .from('fee_masters')
                .select('id')
                .eq('fee_group_id', selectedFeeGroupForAssign.id)
                .eq('branch_id', selectedBranch.id)
                .eq('session_id', currentSessionId);
                
            if (!feeMastersForGroup || feeMastersForGroup.length === 0) {
                toast({ variant: 'default', title: 'No Fees', description: 'This fee group has no fee masters. Assignment saved but no fees allocated.' });
                setAssignLoading(false);
                fetchClassAssignments(selectedFeeGroupForAssign.id);
                return;
            }
            
            // Step 4: Get all students in the class/section
            let studentsQuery = supabase
                .from('student_profiles')
                .select('id')
                .eq('branch_id', selectedBranch.id)
                .eq('session_id', currentSessionId)
                .eq('class_id', assignClassId);
                
            if (sectionId) {
                studentsQuery = studentsQuery.eq('section_id', sectionId);
            }
            
            const { data: students } = await studentsQuery;
            
            if (!students || students.length === 0) {
                toast({ variant: 'default', title: 'No Students', description: 'No students found in the selected class/section. Assignment saved but no fees allocated.' });
                setAssignLoading(false);
                fetchClassAssignments(selectedFeeGroupForAssign.id);
                return;
            }
            
            // Step 5: Create student_fee_allocations for each student × fee_master combination
            const allocations = [];
            for (const student of students) {
                for (const feeMaster of feeMastersForGroup) {
                    allocations.push({
                        student_id: student.id,
                        fee_master_id: feeMaster.id,
                        branch_id: selectedBranch.id,
                        session_id: currentSessionId,
                        organization_id: organizationId,
                    });
                }
            }
            
            // Insert in batches to avoid hitting limits
            const batchSize = 100;
            let insertedCount = 0;
            let skippedCount = 0;
            
            for (let i = 0; i < allocations.length; i += batchSize) {
                const batch = allocations.slice(i, i + batchSize);
                const { error: insertError } = await supabase
                    .from('student_fee_allocations')
                    .upsert(batch, { 
                        onConflict: 'student_id,fee_master_id',
                        ignoreDuplicates: true 
                    });
                    
                if (insertError) {
                    console.warn('Batch insert error (may be duplicates):', insertError);
                    skippedCount += batch.length;
                } else {
                    insertedCount += batch.length;
                }
            }
            
            // Success message
            const className = classes.find(c => c.id === assignClassId)?.name || 'Class';
            const sectionName = sectionId ? sections.find(s => s.id === sectionId)?.name : 'All Sections';
            
            toast({ 
                title: 'Fees Assigned!', 
                description: `${selectedFeeGroupForAssign.name} assigned to ${className} - ${sectionName}. ${students.length} students × ${feeMastersForGroup.length} fees = ${insertedCount} allocations created.`
            });
            
            // Refresh assignments list
            fetchClassAssignments(selectedFeeGroupForAssign.id);
            
            // Reset form
            setAssignClassId('');
            setAssignSectionId('');
            
        } catch (error) {
            console.error('Assign to class error:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setAssignLoading(false);
        }
    };
    
    // Remove class assignment
    const removeClassAssignment = async (assignmentId) => {
        const { error } = await supabase
            .from('fee_group_class_assignments')
            .delete()
            .eq('id', assignmentId);
            
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
            toast({ title: 'Removed', description: 'Class assignment removed. Note: Existing student fee allocations are NOT deleted.' });
            fetchClassAssignments(selectedFeeGroupForAssign.id);
        }
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Get fine type display
    const getFineTypeDisplay = (master) => {
        if (master.fine_type === 'none' || !master.fine_type) return 'None';
        if (master.fine_type === 'percentage') return 'Percentage';
        if (master.fine_type === 'fix_amount') return 'Fix';
        return master.fine_type;
    };

    // Get fine value display
    const getFineValueDisplay = (master) => {
        if (master.fine_type === 'none' || !master.fine_value) return '-';
        if (master.fine_type === 'percentage') return `${master.fine_value}%`;
        return `${currencySymbol}${master.fine_value}`;
    };

    // Get current session year
    const sessionYear = useMemo(() => {
        const year = new Date().getFullYear();
        const month = new Date().getMonth();
        if (month < 3) return `${year - 1}-${year.toString().slice(-2)}`;
        return `${year}-${(year + 1).toString().slice(-2)}`;
    }, []);

    return (
        <DashboardLayout>
            <TooltipProvider>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">Fees Master</h1>
                            <p className="text-muted-foreground text-sm">Session: {sessionYear}</p>
                        </div>
                    </div>

                    {/* Main Content - Split Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* LEFT PANEL - Add/Edit Form */}
                        <div className="lg:col-span-4 xl:col-span-3">
                            <Card className="sticky top-4">
                                <CardHeader className="pb-4 border-b">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Plus className="h-5 w-5 text-primary" />
                                        {isEditing ? 'Edit Fees Master' : 'Add Fees Master'}
                                        <Badge variant="outline" className="ml-auto">{sessionYear}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {/* Fees Group */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">
                                                Fees Group <span className="text-destructive">*</span>
                                            </Label>
                                            <Select 
                                                value={formData.fee_group_id} 
                                                onValueChange={(v) => setFormData(p => ({ ...p, fee_group_id: v }))}
                                            >
                                                <SelectTrigger className="h-10">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {feeGroups.map(g => (
                                                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Fees Type */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">
                                                Fees Type <span className="text-destructive">*</span>
                                            </Label>
                                            <Select 
                                                value={formData.fee_type_id} 
                                                onValueChange={(v) => setFormData(p => ({ ...p, fee_type_id: v }))}
                                            >
                                                <SelectTrigger className="h-10">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {feeTypes.map(t => (
                                                        <SelectItem key={t.id} value={t.id}>
                                                            {t.name} {t.code && <span className="text-muted-foreground">({t.code})</span>}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Due Date */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">
                                                Due Date <span className="text-destructive">*</span>
                                            </Label>
                                            <DatePicker 
                                                value={formData.due_date} 
                                                onChange={(date) => setFormData(p => ({ ...p, due_date: date }))}
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Amount */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">
                                                Amount ({currencySymbol}) <span className="text-destructive">*</span>
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={formData.amount}
                                                    onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                                                    className="pl-8 h-10"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        {/* Fine Type */}
                                        <div className="space-y-3">
                                            <Label className="text-sm font-medium">Fine Type</Label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="fine_type"
                                                        value="none"
                                                        checked={formData.fine_type === 'none'}
                                                        onChange={(e) => setFormData(p => ({ ...p, fine_type: e.target.value, fine_value: '' }))}
                                                        className="h-4 w-4 text-primary"
                                                    />
                                                    <span className="text-sm">None</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="fine_type"
                                                        value="percentage"
                                                        checked={formData.fine_type === 'percentage'}
                                                        onChange={(e) => setFormData(p => ({ ...p, fine_type: e.target.value }))}
                                                        className="h-4 w-4 text-primary"
                                                    />
                                                    <span className="text-sm">Percentage</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="fine_type"
                                                        value="fix_amount"
                                                        checked={formData.fine_type === 'fix_amount'}
                                                        onChange={(e) => setFormData(p => ({ ...p, fine_type: e.target.value }))}
                                                        className="h-4 w-4 text-primary"
                                                    />
                                                    <span className="text-sm">Fix Amount</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Percentage / Fix Amount */}
                                        {formData.fine_type !== 'none' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                {formData.fine_type === 'percentage' && (
                                                    <div className="space-y-2">
                                                        <Label className="text-sm font-medium">Percentage (%)</Label>
                                                        <div className="relative">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                max="100"
                                                                value={formData.fine_value}
                                                                onChange={(e) => setFormData(p => ({ ...p, fine_value: e.target.value }))}
                                                                className="h-10 pr-8"
                                                                placeholder="0"
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {formData.fine_type === 'fix_amount' && (
                                                    <div className="space-y-2">
                                                        <Label className="text-sm font-medium">Fix Amount ({currencySymbol})</Label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={formData.fine_value}
                                                                onChange={(e) => setFormData(p => ({ ...p, fine_value: e.target.value }))}
                                                                className="h-10 pl-8"
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="space-y-2 flex items-end">
                                                    <label className="flex items-center gap-2 cursor-pointer pb-2">
                                                        <Checkbox
                                                            checked={formData.is_fine_per_day}
                                                            onCheckedChange={(checked) => setFormData(p => ({ ...p, is_fine_per_day: checked }))}
                                                        />
                                                        <span className="text-sm">Per Day</span>
                                                    </label>
                                                </div>
                                            </div>
                                        )}

                                        {/* Submit Button */}
                                        <div className="flex gap-2 pt-2">
                                            {isEditing && (
                                                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                                                    Cancel
                                                </Button>
                                            )}
                                            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white">
                                                {isSubmitting ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    'Save'
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT PANEL - Fees Master List */}
                        <div className="lg:col-span-8 xl:col-span-9">
                            <Card>
                                <CardHeader className="pb-4 border-b">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <CardTitle className="text-lg">
                                            Fees Master List
                                            <Badge variant="secondary" className="ml-2">{sessionYear}</Badge>
                                        </CardTitle>
                                        
                                        {/* Search & Tools */}
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <div className="relative flex-1 sm:w-48">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="pl-9 h-9"
                                                />
                                            </div>
                                            
                                            <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(parseInt(v))}>
                                                <SelectTrigger className="w-20 h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="10">10</SelectItem>
                                                    <SelectItem value="25">25</SelectItem>
                                                    <SelectItem value="50">50</SelectItem>
                                                    <SelectItem value="100">100</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            
                                            <div className="flex items-center gap-1 border rounded-md">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9">
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Copy</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9">
                                                            <FileText className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Excel</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9">
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>CSV</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9">
                                                            <Printer className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Print</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9">
                                                            <Columns className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Columns</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : filteredGroups.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No fee masters found for this session.</p>
                                            <p className="text-sm">Add fee masters using the form on the left.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b bg-muted/50">
                                                        <th className="text-left p-3 font-medium">Fees Group</th>
                                                        <th className="text-left p-3 font-medium">Fees Code</th>
                                                        <th className="text-right p-3 font-medium">Amount</th>
                                                        <th className="text-center p-3 font-medium">Fine Type</th>
                                                        <th className="text-center p-3 font-medium">Due Date</th>
                                                        <th className="text-center p-3 font-medium">Per Day</th>
                                                        <th className="text-center p-3 font-medium">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredGroups.map((group) => (
                                                        <React.Fragment key={group.id}>
                                                            {/* Group Header Row */}
                                                            <tr 
                                                                className="bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 border-b border-amber-200 dark:border-amber-900"
                                                            >
                                                                <td colSpan={7} className="p-3">
                                                                    <div className="flex items-center justify-between">
                                                                        <div 
                                                                            className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400 cursor-pointer flex-1"
                                                                            onClick={() => toggleGroup(group.id)}
                                                                        >
                                                                            {expandedGroups[group.id] ? (
                                                                                <ChevronDown className="h-4 w-4" />
                                                                            ) : (
                                                                                <ChevronRight className="h-4 w-4" />
                                                                            )}
                                                                            {group.name}
                                                                            <Badge variant="secondary" className="ml-2 font-normal">
                                                                                {group.items.length} fee{group.items.length !== 1 ? 's' : ''}
                                                                            </Badge>
                                                                        </div>
                                                                        
                                                                        {/* Assign to Class Button */}
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    className="h-7 text-xs bg-green-50 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        openAssignDialog(group);
                                                                                    }}
                                                                                >
                                                                                    <GraduationCap className="h-3 w-3 mr-1" />
                                                                                    Assign to Class
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                Assign all fees in this group to a class/section
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            
                                                            {/* Group Items */}
                                                            {expandedGroups[group.id] && group.items.map((master) => (
                                                                <tr key={master.id} className="border-b hover:bg-muted/30 transition-colors">
                                                                    <td className="p-3 pl-8">
                                                                        <div className="flex items-center gap-2">
                                                                            <Checkbox className="opacity-0" />
                                                                            <span className="text-primary hover:underline cursor-pointer">
                                                                                {master.fee_types?.name || '-'}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-3">
                                                                        <Badge variant="outline" className="font-mono text-xs">
                                                                            {master.fee_types?.code || '-'}
                                                                        </Badge>
                                                                    </td>
                                                                    <td className="p-3 text-right font-medium">
                                                                        {currencySymbol}{parseFloat(master.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                                    </td>
                                                                    <td className="p-3 text-center">
                                                                        <Badge variant={master.fine_type === 'none' ? 'secondary' : 'default'} className="text-xs">
                                                                            {getFineTypeDisplay(master)}
                                                                            {master.fine_type !== 'none' && master.fine_value && (
                                                                                <span className="ml-1">({getFineValueDisplay(master)})</span>
                                                                            )}
                                                                        </Badge>
                                                                    </td>
                                                                    <td className="p-3 text-center">
                                                                        <div className="flex items-center justify-center gap-1 text-muted-foreground">
                                                                            <Calendar className="h-3 w-3" />
                                                                            {formatDate(master.due_date)}
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-3 text-center">
                                                                        {master.is_fine_per_day ? (
                                                                            <Badge variant="default" className="bg-green-500">Yes</Badge>
                                                                        ) : (
                                                                            <span className="text-muted-foreground">No</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="p-3">
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button 
                                                                                        variant="ghost" 
                                                                                        size="icon"
                                                                                        className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                                                        onClick={() => handleEdit(master)}
                                                                                    >
                                                                                        <Edit className="h-4 w-4" />
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>Edit</TooltipContent>
                                                                            </Tooltip>
                                                                            
                                                                            <AlertDialog>
                                                                                <AlertDialogTrigger asChild>
                                                                                    <Button 
                                                                                        variant="ghost" 
                                                                                        size="icon"
                                                                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                                    >
                                                                                        <Trash2 className="h-4 w-4" />
                                                                                    </Button>
                                                                                </AlertDialogTrigger>
                                                                                <AlertDialogContent>
                                                                                    <AlertDialogHeader>
                                                                                        <AlertDialogTitle>Delete Fee Master?</AlertDialogTitle>
                                                                                        <AlertDialogDescription>
                                                                                            This will permanently delete "{master.fee_types?.name}" from "{group.name}".
                                                                                            This action cannot be undone.
                                                                                        </AlertDialogDescription>
                                                                                    </AlertDialogHeader>
                                                                                    <AlertDialogFooter>
                                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                        <AlertDialogAction 
                                                                                            onClick={() => handleDelete(master.id)}
                                                                                            className="bg-red-600 hover:bg-red-700"
                                                                                        >
                                                                                            Delete
                                                                                        </AlertDialogAction>
                                                                                    </AlertDialogFooter>
                                                                                </AlertDialogContent>
                                                                            </AlertDialog>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </React.Fragment>
                                                    ))}
                                                </tbody>
                                            </table>
                                            
                                            {/* Footer */}
                                            <div className="flex items-center justify-between px-4 py-4 border-t">
                                                <p className="text-sm text-muted-foreground">
                                                    Showing 1 to {feeMasters.length} of {feeMasters.length} entries
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="outline" size="sm" disabled>Previous</Button>
                                                    <Button variant="default" size="sm" className="bg-primary">1</Button>
                                                    <Button variant="outline" size="sm" disabled>Next</Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </TooltipProvider>
            
            {/* Assign to Class Dialog */}
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-green-600" />
                            Assign Fee Group to Class
                        </DialogTitle>
                    </DialogHeader>
                    
                    {selectedFeeGroupForAssign && (
                        <div className="space-y-6">
                            {/* Selected Fee Group Info */}
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200">
                                <p className="text-sm text-muted-foreground">Fee Group:</p>
                                <p className="font-semibold text-amber-700 dark:text-amber-400">
                                    {selectedFeeGroupForAssign.name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {selectedFeeGroupForAssign.items?.length || 0} fee master(s) will be assigned
                                </p>
                            </div>
                            
                            {/* Class & Section Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                        Class <span className="text-destructive">*</span>
                                    </Label>
                                    <Select value={assignClassId} onValueChange={handleClassChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Section</Label>
                                    <Select 
                                        value={assignSectionId} 
                                        onValueChange={setAssignSectionId}
                                        disabled={!assignClassId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={assignClassId ? "All Sections" : "Select class first"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Sections</SelectItem>
                                            {filteredSections.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            {/* Existing Assignments */}
                            {classAssignments.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">
                                        Existing Assignments
                                    </Label>
                                    <div className="max-h-32 overflow-y-auto space-y-1">
                                        {classAssignments.map(a => (
                                            <div 
                                                key={a.id} 
                                                className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                                            >
                                                <span>
                                                    {a.classes?.name || 'Unknown'} 
                                                    {a.sections?.name ? ` - ${a.sections.name}` : ' - All Sections'}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-red-500 hover:text-red-700"
                                                    onClick={() => removeClassAssignment(a.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Info Note */}
                            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 text-sm">
                                <Users className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-blue-700 dark:text-blue-300">
                                    <p className="font-medium">How it works:</p>
                                    <ul className="list-disc list-inside text-xs mt-1 space-y-0.5">
                                        <li>All fee masters in this group will be assigned to students in the selected class/section</li>
                                        <li>Fees will appear on each student's StudentFees page</li>
                                        <li>Duplicate allocations are automatically skipped</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="outline">Close</Button>
                        </DialogClose>
                        <Button 
                            onClick={handleAssignToClass}
                            disabled={!assignClassId || assignLoading}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {assignLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Assigning...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Assign Fees
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default FeesMaster;
