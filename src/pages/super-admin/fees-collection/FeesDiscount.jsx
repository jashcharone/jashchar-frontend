import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash, UserPlus, Loader2, Search, Copy, FileDown, Printer, LayoutGrid } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DatePicker from '@/components/ui/DatePicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

const FeesDiscount = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(50);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        discount_code: '',
        discount_type: 'fix_amount',
        percentage: '',
        amount: '',
        use_count: '',
        expire_date: null,
        description: ''
    });

    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedDiscount, setSelectedDiscount] = useState(null);
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [filters, setFilters] = useState({ class_id: '', section_id: '', category_id: '', gender: '', rte: '' });
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [categories, setCategories] = useState([]);
    
    const branchId = user?.profile?.branch_id;

    const fetchDropdownData = useCallback(async () => {
      if (!selectedBranch) return;
      const [
        { data: classesData },
        { data: sectionsData },
        { data: categoriesData }
      ] = await Promise.all([
        supabase.from('classes').select('id, name').eq('branch_id', selectedBranch.id),
        supabase.from('sections').select('id, name').eq('branch_id', selectedBranch.id),
        supabase.from('student_categories').select('id, name').eq('branch_id', selectedBranch.id)
      ]);
      setClasses(classesData || []);
      setSections(sectionsData || []);
      setCategories(categoriesData || []);
    }, [selectedBranch]);

    const fetchDiscounts = useCallback(async () => {
        if (!selectedBranch) return;
        setLoading(true);
        
        // Fetch discounts with usage count
        const { data, error } = await supabase
            .from('discounts')
            .select('*')
            .eq('branch_id', selectedBranch.id)
            .order('created_at', { ascending: false });
            
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching discounts', description: error.message });
            setLoading(false);
            return;
        }
        
        // Fetch usage count for each discount
        if (data && data.length > 0) {
            const discountIds = data.map(d => d.id);
            const { data: usageData, error: usageError } = await supabase
                .from('student_fee_discounts')
                .select('discount_id')
                .in('discount_id', discountIds);
            
            if (!usageError && usageData) {
                // Count usage per discount
                const usageMap = {};
                usageData.forEach(item => {
                    usageMap[item.discount_id] = (usageMap[item.discount_id] || 0) + 1;
                });
                
                // Add used_count to each discount
                const discountsWithUsage = data.map(d => ({
                    ...d,
                    used_count: usageMap[d.id] || 0
                }));
                setDiscounts(discountsWithUsage);
            } else {
                setDiscounts(data.map(d => ({ ...d, used_count: 0 })));
            }
        } else {
            setDiscounts([]);
        }
        
        setLoading(false);
    }, [selectedBranch, toast]);

    const fetchStudents = useCallback(async () => {
        if (!selectedBranch) return;
        // No need to fetch role for student_profiles table
        
        const { data, error } = await supabase
            .from('student_profiles')
            .select('id, full_name, roll_number, class_id, section_id, class:classes!student_profiles_class_id_fkey(name), section:sections!student_profiles_section_id_fkey(name)')
            .eq('branch_id', selectedBranch.id);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching students', description: error.message });
        } else {
            setStudents(data);
            setFilteredStudents(data);
        }
    }, [selectedBranch, toast]);


    useEffect(() => {
        fetchDiscounts();
        fetchDropdownData();
        fetchStudents();
    }, [fetchDiscounts, fetchDropdownData, fetchStudents]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleDateChange = (date) => {
        setFormData(prev => ({ ...prev, expire_date: date }));
    };

    const resetForm = () => {
        setFormData({ name: '', discount_code: '', discount_type: 'fix_amount', percentage: '', amount: '', use_count: '', expire_date: null, description: '' });
        setEditingDiscount(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        if (!selectedBranch) {
            toast({ variant: 'destructive', title: 'Error', description: 'Branch not selected.' });
            setIsSubmitting(false);
            return;
        }

        // Prepare data based on discount type
        const dataToSubmit = {
            name: formData.name,
            discount_code: formData.discount_code,
            discount_type: formData.discount_type,
            amount: formData.discount_type === 'fix_amount' ? (parseFloat(formData.amount) || 0) : (parseFloat(formData.percentage) || 0),
            use_count: formData.use_count ? parseInt(formData.use_count) : null,
            expire_date: formData.expire_date ? format(formData.expire_date, 'yyyy-MM-dd') : null,
            description: formData.description,
            branch_id: selectedBranch.id,
        };
        
        let error;
        if (editingDiscount) {
            ({ error } = await supabase.from('discounts').update(dataToSubmit).eq('id', editingDiscount.id));
        } else {
            ({ error } = await supabase.from('discounts').insert([dataToSubmit]));
        }

        if (error) {
            toast({ variant: 'destructive', title: 'Error saving discount', description: error.message });
        } else {
            toast({ title: 'Success!', description: `Discount ${editingDiscount ? 'updated' : 'added'} successfully.` });
            resetForm();
            fetchDiscounts();
        }
        setIsSubmitting(false);
    };

    const handleEdit = (discount) => {
        setEditingDiscount(discount);
        setFormData({
            name: discount.name || '',
            discount_code: discount.discount_code || '',
            discount_type: discount.discount_type || 'fix_amount',
            percentage: discount.discount_type === 'percentage' ? discount.amount : '',
            amount: discount.discount_type === 'fix_amount' ? discount.amount : '',
            use_count: discount.use_count || '',
            expire_date: discount.expire_date ? new Date(discount.expire_date) : null,
            description: discount.description || ''
        });
    };

    const handleView = (discount) => {
        setSelectedDiscount(discount);
        setViewModalOpen(true);
    };

    const handleDelete = async (discountId) => {
        if (!window.confirm('Are you sure you want to delete this discount? This will also unassign it from all students.')) return;
        
        const { error } = await supabase.from('discounts').delete().eq('id', discountId);
        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting discount', description: error.message });
        } else {
            toast({ title: 'Success!', description: 'Discount deleted.' });
            fetchDiscounts();
        }
    };
    
    const handleAssignClick = async (discount) => {
        setSelectedDiscount(discount);
        
        const { data, error } = await supabase
            .from('student_fee_discounts')
            .select('student_id')
            .eq('discount_id', discount.id);
            
        if(error) {
            toast({ variant: 'destructive', title: 'Error fetching assigned students', description: error.message });
            return;
        }

        setSelectedStudents(new Set(data.map(item => item.student_id)));
        setAssignModalOpen(true);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({...prev, [key]: value}));
    };
    
    useEffect(() => {
        let result = students;
        if(filters.class_id) result = result.filter(s => s.class_id === filters.class_id);
        if(filters.section_id) result = result.filter(s => s.section_id === filters.section_id);
        // Add more filters here as data becomes available in profiles table
        setFilteredStudents(result);
    }, [filters, students]);
    
    const handleStudentSelect = (studentId) => {
        setSelectedStudents(prev => {
            const newSet = new Set(prev);
            if(newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                // Check use_count limit before adding
                if (selectedDiscount?.use_count && newSet.size >= selectedDiscount.use_count) {
                    toast({ 
                        variant: 'destructive', 
                        title: 'Limit Reached', 
                        description: `This discount can only be assigned to ${selectedDiscount.use_count} students.` 
                    });
                    return prev;
                }
                newSet.add(studentId);
            }
            return newSet;
        });
    };
    
    const handleAssignSave = async () => {
        if (!selectedDiscount) return;
        
        // Validate use_count limit
        if (selectedDiscount.use_count && selectedStudents.size > selectedDiscount.use_count) {
            toast({ 
                variant: 'destructive', 
                title: 'Limit Exceeded', 
                description: `This discount can only be assigned to ${selectedDiscount.use_count} students. You selected ${selectedStudents.size}.` 
            });
            return;
        }
        
        setIsSubmitting(true);
        
        const { error: deleteError } = await supabase
            .from('student_fee_discounts')
            .delete()
            .eq('discount_id', selectedDiscount.id);

        if (deleteError) {
             toast({ variant: 'destructive', title: 'Error updating assignments', description: deleteError.message });
             setIsSubmitting(false);
             return;
        }

        const assignments = Array.from(selectedStudents).map(student_id => ({
            discount_id: selectedDiscount.id,
            student_id,
            branch_id: selectedBranch.id,
        }));
        
        if (assignments.length > 0) {
            const { error: insertError } = await supabase
                .from('student_fee_discounts')
                .insert(assignments);

            if (insertError) {
                toast({ variant: 'destructive', title: 'Error saving assignments', description: insertError.message });
                setIsSubmitting(false);
                return;
            }
        }
        
        toast({ title: 'Success!', description: 'Student assignments updated.' });
        setIsSubmitting(false);
        setAssignModalOpen(false);
        fetchDiscounts(); // Refresh to update used_count
    };


    // Filter discounts based on search
    const filteredDiscounts = discounts.filter(d => 
        d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.discount_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Side - Add Fees Discount Form */}
                <div className="lg:col-span-4">
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-semibold">
                                {editingDiscount ? 'Edit Fees Discount' : 'Add Fees Discount'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Name */}
                                <div>
                                    <Label htmlFor="name" className="text-sm">
                                        Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input 
                                        id="name" 
                                        name="name" 
                                        value={formData.name} 
                                        onChange={handleInputChange} 
                                        required 
                                        className="mt-1"
                                    />
                                </div>

                                {/* Discount Code */}
                                <div>
                                    <Label htmlFor="discount_code" className="text-sm">
                                        Discount Code <span className="text-red-500">*</span>
                                    </Label>
                                    <Input 
                                        id="discount_code" 
                                        name="discount_code" 
                                        value={formData.discount_code} 
                                        onChange={handleInputChange} 
                                        required 
                                        className="mt-1"
                                    />
                                </div>

                                {/* Discount Type */}
                                <div>
                                    <Label className="text-sm">Discount Type</Label>
                                    <RadioGroup 
                                        name="discount_type" 
                                        value={formData.discount_type} 
                                        onValueChange={(v) => setFormData(p=>({...p, discount_type: v}))} 
                                        className="flex gap-6 mt-2"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="percentage" id="percentage" />
                                            <Label htmlFor="percentage" className="font-normal cursor-pointer">Percentage</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="fix_amount" id="fix_amount" />
                                            <Label htmlFor="fix_amount" className="font-normal cursor-pointer">Fix Amount</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {/* Percentage and Amount side by side */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="percentage" className="text-sm">
                                            Percentage (%) {formData.discount_type === 'percentage' && <span className="text-red-500">*</span>}
                                        </Label>
                                        <Input 
                                            type="number" 
                                            id="percentage" 
                                            name="percentage" 
                                            value={formData.percentage} 
                                            onChange={handleInputChange}
                                            disabled={formData.discount_type !== 'percentage'}
                                            required={formData.discount_type === 'percentage'}
                                            className="mt-1"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="amount" className="text-sm">
                                            Amount ($) {formData.discount_type === 'fix_amount' && <span className="text-red-500">*</span>}
                                        </Label>
                                        <Input 
                                            type="number" 
                                            id="amount" 
                                            name="amount" 
                                            value={formData.amount} 
                                            onChange={handleInputChange}
                                            disabled={formData.discount_type !== 'fix_amount'}
                                            required={formData.discount_type === 'fix_amount'}
                                            className="mt-1"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                {/* Number Of Use Count and Expiry Date side by side */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="use_count" className="text-sm">
                                            Number Of Use Count
                                        </Label>
                                        <Input 
                                            type="number" 
                                            id="use_count" 
                                            name="use_count" 
                                            value={formData.use_count} 
                                            onChange={handleInputChange}
                                            className="mt-1"
                                            min="1"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm">Expiry Date</Label>
                                        <div className="mt-1">
                                            <DatePicker 
                                                value={formData.expire_date} 
                                                onChange={handleDateChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <Label htmlFor="description" className="text-sm">Description</Label>
                                    <Textarea 
                                        id="description" 
                                        name="description" 
                                        value={formData.description} 
                                        onChange={handleInputChange}
                                        className="mt-1"
                                        rows={3}
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="flex justify-end gap-2 pt-2">
                                    {editingDiscount && (
                                        <Button type="button" variant="outline" onClick={resetForm}>
                                            Cancel
                                        </Button>
                                    )}
                                    <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
                                        {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Save'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side - Fees Discount List */}
                <div className="lg:col-span-8">
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold">Fees Discount List</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Search and Actions Row */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search" 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                                        <SelectTrigger className="w-20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" size="icon" title="Copy">
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" title="Excel">
                                        <FileDown className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" title="Print">
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" title="Columns">
                                        <LayoutGrid className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Table */}
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="overflow-x-auto border rounded-lg">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                            <tr className="border-b">
                                                <th className="p-3 text-left font-medium">Name</th>
                                                <th className="p-3 text-left font-medium">Discount Code</th>
                                                <th className="p-3 text-left font-medium">Percentage (%)</th>
                                                <th className="p-3 text-left font-medium">Amount ($)</th>
                                                <th className="p-3 text-left font-medium">Used / Limit</th>
                                                <th className="p-3 text-left font-medium">Expiry Date</th>
                                                <th className="p-3 text-center font-medium">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredDiscounts.slice(0, pageSize).map(d => (
                                                <tr key={d.id} className="border-b hover:bg-muted/30">
                                                    <td className="p-3 text-blue-600 hover:underline cursor-pointer" onClick={() => handleView(d)}>
                                                        {d.name}
                                                    </td>
                                                    <td className="p-3 text-blue-600">{d.discount_code}</td>
                                                    <td className="p-3">
                                                        {d.discount_type === 'percentage' ? d.amount?.toFixed(2) : ''}
                                                    </td>
                                                    <td className="p-3">
                                                        {d.discount_type === 'fix_amount' ? d.amount?.toFixed(2) : ''}
                                                    </td>
                                                    <td className="p-3">
                                                        {d.use_count ? (
                                                            <span className={d.used_count >= d.use_count ? 'text-red-500 font-medium' : ''}>
                                                                {d.used_count || 0} / {d.use_count}
                                                                {d.used_count >= d.use_count && ' (Full)'}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                {d.used_count || 0} / ∞
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3">
                                                        {d.expire_date ? format(new Date(d.expire_date), 'MM/dd/yyyy') : ''}
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex justify-center gap-1">
                                                            <Button 
                                                                variant="default" 
                                                                size="icon" 
                                                                className="h-7 w-7 bg-blue-500 hover:bg-blue-600"
                                                                onClick={() => handleAssignClick(d)}
                                                                title="Assign to Students"
                                                            >
                                                                <UserPlus className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button 
                                                                variant="default" 
                                                                size="icon" 
                                                                className="h-7 w-7 bg-green-500 hover:bg-green-600"
                                                                onClick={() => handleEdit(d)}
                                                                title="Edit"
                                                            >
                                                                <Edit className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button 
                                                                variant="default" 
                                                                size="icon" 
                                                                className="h-7 w-7 bg-red-500 hover:bg-red-600"
                                                                onClick={() => handleDelete(d.id)}
                                                                title="Delete"
                                                            >
                                                                <Trash className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredDiscounts.length === 0 && (
                                                <tr>
                                                    <td colSpan="7" className="p-8 text-center text-muted-foreground">
                                                        No discounts found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination Info */}
                            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                                <span>Showing 1 to {Math.min(filteredDiscounts.length, pageSize)} of {filteredDiscounts.length} entries</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" disabled>{'<'}</Button>
                                    <Button variant="default" size="sm" className="bg-blue-500">1</Button>
                                    <Button variant="outline" size="sm" disabled>{'>'}</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Assign Discount to Students</DialogTitle>
                        <DialogDescription>
                            Assign "{selectedDiscount?.name}" to selected students.
                            {selectedDiscount?.use_count && (
                                <span className={`ml-2 font-medium ${selectedStudents.size >= selectedDiscount.use_count ? 'text-red-500' : 'text-green-600'}`}>
                                    (Limit: {selectedStudents.size} / {selectedDiscount.use_count})
                                </span>
                            )}
                            {!selectedDiscount?.use_count && (
                                <span className="ml-2 text-muted-foreground">(No limit)</span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    
                    {/* Usage Warning */}
                    {selectedDiscount?.use_count && selectedStudents.size >= selectedDiscount.use_count && (
                        <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm">
                            ⚠️ Use count limit reached! Maximum {selectedDiscount.use_count} students allowed.
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 my-4 p-4 border rounded-lg">
                        <Select onValueChange={(v) => handleFilterChange('class_id', v)}><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                        <Select onValueChange={(v) => handleFilterChange('section_id', v)}><SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger><SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
                        <Select onValueChange={(v) => handleFilterChange('category_id', v)}><SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                        <Select onValueChange={(v) => handleFilterChange('gender', v)}><SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent></Select>
                        <Button>Search</Button>
                    </div>
                     <div className="max-h-[400px] overflow-y-auto">
                        <table className="w-full text-sm">
                           <thead className="bg-muted sticky top-0"><tr><th className="p-2 w-10"><Checkbox onCheckedChange={(checked) => {
                               if (checked) {
                                   // Respect use_count limit when selecting all
                                   const limit = selectedDiscount?.use_count || Infinity;
                                   const studentsToSelect = filteredStudents.slice(0, limit).map(s => s.id);
                                   setSelectedStudents(new Set(studentsToSelect));
                                   if (limit < filteredStudents.length) {
                                       toast({ title: 'Limit Applied', description: `Only first ${limit} students selected due to use count limit.` });
                                   }
                               } else {
                                   setSelectedStudents(new Set());
                               }
                           }}/></th><th className="p-2 text-left">Student Name</th><th className="p-2 text-left">Roll No</th><th className="p-2 text-left">Class</th></tr></thead>
                           <tbody>
                               {filteredStudents.map(s => (
                                   <tr key={s.id} className="border-b">
                                       <td className="p-2"><Checkbox checked={selectedStudents.has(s.id)} onCheckedChange={() => handleStudentSelect(s.id)} /></td>
                                       <td className="p-2">{s.full_name}</td>
                                       <td className="p-2">{s.roll_number}</td>
                                       <td className="p-2">{s.class?.name} ({s.section?.name})</td>
                                   </tr>
                               ))}
                           </tbody>
                        </table>
                    </div>
                    <DialogFooter>
                        <div className="flex items-center gap-2 mr-auto text-sm text-muted-foreground">
                            Selected: <span className="font-medium">{selectedStudents.size}</span>
                            {selectedDiscount?.use_count && (
                                <span>/ {selectedDiscount.use_count} max</span>
                            )}
                        </div>
                        <Button variant="outline" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
                        <Button 
                            onClick={handleAssignSave} 
                            disabled={isSubmitting || (selectedDiscount?.use_count && selectedStudents.size > selectedDiscount.use_count)}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin"/> : 'Save Assignments'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Modal */}
            <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Discount Details</DialogTitle>
                    </DialogHeader>
                    {selectedDiscount && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Name</Label>
                                    <p className="font-medium">{selectedDiscount.name}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Discount Code</Label>
                                    <p className="font-medium">{selectedDiscount.discount_code}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Discount Type</Label>
                                    <p className="font-medium capitalize">{selectedDiscount.discount_type?.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">
                                        {selectedDiscount.discount_type === 'percentage' ? 'Percentage' : 'Amount'}
                                    </Label>
                                    <p className="font-medium">
                                        {selectedDiscount.discount_type === 'percentage' 
                                            ? `${selectedDiscount.amount}%` 
                                            : `₹${selectedDiscount.amount}`}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Use Count</Label>
                                    <p className="font-medium">
                                        {selectedDiscount.use_count 
                                            ? `${selectedDiscount.used_count || 0} / ${selectedDiscount.use_count} used`
                                            : `${selectedDiscount.used_count || 0} used (Unlimited)`}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Expiry Date</Label>
                                    <p className="font-medium">
                                        {selectedDiscount.expire_date 
                                            ? format(new Date(selectedDiscount.expire_date), 'dd MMM yyyy') 
                                            : 'No Expiry'}
                                    </p>
                                </div>
                            </div>
                            {selectedDiscount.description && (
                                <div>
                                    <Label className="text-muted-foreground">Description</Label>
                                    <p className="font-medium">{selectedDiscount.description}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewModalOpen(false)}>Close</Button>
                        <Button onClick={() => { setViewModalOpen(false); handleEdit(selectedDiscount); }}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </DashboardLayout>
    );
};

export default FeesDiscount;
