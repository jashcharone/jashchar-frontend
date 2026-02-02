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
import { Plus, Edit, Trash, UserPlus, Loader2 } from 'lucide-react';
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

const FeesDiscount = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        discount_code: '',
        discount_type: 'percentage',
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
        const { data, error } = await supabase
            .from('discounts')
            .select('*')
            .eq('branch_id', selectedBranch.id);
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching discounts', description: error.message });
        } else {
            setDiscounts(data);
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
        setFormData({ name: '', discount_code: '', discount_type: 'percentage', amount: '', use_count: '', expire_date: null, description: '' });
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

        const dataToSubmit = {
            ...formData,
            branch_id: selectedBranch.id,
            amount: parseFloat(formData.amount) || 0,
            use_count: formData.use_count ? parseInt(formData.use_count) : null,
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
            ...discount,
        });
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
                newSet.add(studentId);
            }
            return newSet;
        });
    };
    
    const handleAssignSave = async () => {
        if (!selectedDiscount) return;
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
    };


    return (
        <DashboardLayout>
            <h1 className="text-3xl font-bold mb-6">Fees Discount</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <form onSubmit={handleSubmit} className="bg-card p-6 rounded-lg shadow-sm space-y-4">
                        <h2 className="text-xl font-bold mb-4">{editingDiscount ? 'Edit Discount' : 'Add Discount'}</h2>
                        <div><Label htmlFor="name" required>Discount Name</Label><Input id="name" name="name" value={formData.name} onChange={handleInputChange} required /></div>
                        <div><Label htmlFor="discount_code" required>Discount Code</Label><Input id="discount_code" name="discount_code" value={formData.discount_code} onChange={handleInputChange} required /></div>
                        <div>
                            <Label required>Discount Type</Label>
                            <RadioGroup name="discount_type" value={formData.discount_type} onValueChange={(v) => setFormData(p=>({...p, discount_type: v}))} className="flex mt-2"><div className="flex items-center space-x-2"><RadioGroupItem value="percentage" id="percentage" /><Label htmlFor="percentage">Percentage</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="fix_amount" id="fix_amount" /><Label htmlFor="fix_amount">Fix Amount</Label></div></RadioGroup>
                        </div>
                        <div><Label htmlFor="amount" required>{formData.discount_type === 'percentage' ? 'Percentage (%)' : 'Amount'}</Label><Input type="number" id="amount" name="amount" value={formData.amount} onChange={handleInputChange} required /></div>
                        <div><Label htmlFor="use_count">Number of Use Count</Label><Input type="number" id="use_count" name="use_count" value={formData.use_count} onChange={handleInputChange} /></div>
                        <div>
                            <Label>Expire Date</Label>
                            <DatePicker value={formData.expire_date} onChange={handleDateChange} />
                        </div>
                        <div><Label htmlFor="description">Description</Label><Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} /></div>
                        <div className="flex justify-end space-x-2">
                           {editingDiscount && <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>}
                           <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : <><Plus className="w-4 h-4 mr-2" />{editingDiscount ? 'Update' : 'Save'}</>}</Button>
                        </div>
                    </form>
                </div>
                <div className="lg:col-span-2 bg-card p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-bold mb-4">Fees Discount List</h2>
                    {loading ? <p>Loading...</p> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Discount Code</th>
                                        <th className="p-3">Amount</th>
                                        <th className="p-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {discounts.map(d => (
                                        <tr key={d.id} className="border-b">
                                            <td className="p-3">{d.name}</td>
                                            <td className="p-3">{d.discount_code}</td>
                                            <td className="p-3">{d.discount_type === 'percentage' ? `${d.amount}%` : `$${d.amount}`}</td>
                                            <td className="p-3 flex space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleAssignClick(d)}><UserPlus className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(d)}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}><Trash className="h-4 w-4 text-destructive" /></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            
            <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Assign Discount to Students</DialogTitle>
                        <DialogDescription>Assign "{selectedDiscount?.name}" to selected students.</DialogDescription>
                    </DialogHeader>
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
                               const allStudentIds = new Set(filteredStudents.map(s => s.id));
                               setSelectedStudents(checked ? allStudentIds : new Set());
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
                        <Button variant="outline" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleAssignSave} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin"/> : 'Save Assignments'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </DashboardLayout>
    );
};

export default FeesDiscount;
