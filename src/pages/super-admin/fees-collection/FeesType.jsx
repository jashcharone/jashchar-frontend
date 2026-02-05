import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Edit, Trash2, Loader2, Search, Copy, FileText, Download, Printer, Columns, AlertCircle } from 'lucide-react';
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
// FEES TYPE - SMART SCHOOL STYLE
// Left Panel: Add Form | Right Panel: List with Search & Actions
// ============================================================================

const FeesType = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    
    // Data States
    const [feesTypes, setFeesTypes] = useState([]);
    const [formData, setFormData] = useState({ id: null, name: '', code: '', description: '' });
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    // UI States
    const [searchQuery, setSearchQuery] = useState('');
    const [pageSize, setPageSize] = useState(50);

    const fetchFeesTypes = async () => {
        const branchId = user?.profile?.branch_id || user?.user_metadata?.branch_id;
        if (!branchId || !selectedBranch) return;
        setLoading(true);
        
        const { data, error } = await supabase
            .from('fee_types')
            .select('*')
            .eq('branch_id', selectedBranch.id)
            .order('name', { ascending: true });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching data', description: error.message });
        } else {
            setFeesTypes(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchFeesTypes();
    }, [user, selectedBranch]);

    // Filter based on search
    const filteredTypes = useMemo(() => {
        if (!searchQuery.trim()) return feesTypes;
        const query = searchQuery.toLowerCase();
        return feesTypes.filter(t => 
            t.name?.toLowerCase().includes(query) || 
            t.code?.toLowerCase().includes(query) ||
            t.description?.toLowerCase().includes(query)
        );
    }, [feesTypes, searchQuery]);

    const resetForm = () => {
        setFormData({ id: null, name: '', code: '', description: '' });
        setIsEditing(false);
    };

    // Auto-generate code from name
    const generateCode = (name) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 30);
    };

    const handleNameChange = (name) => {
        setFormData(prev => ({
            ...prev,
            name,
            code: prev.code || generateCode(name)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Name is required.' });
            return;
        }
        
        setIsSubmitting(true);
        
        const branchId = user?.profile?.branch_id || user?.user_metadata?.branch_id;
        
        if (!branchId || !selectedBranch) {
            toast({ variant: 'destructive', title: 'Error', description: 'Branch not selected.' });
            setIsSubmitting(false);
            return;
        }

        const upsertData = {
            branch_id: selectedBranch.id,
            session_id: currentSessionId,
            organization_id: organizationId,
            name: formData.name.trim(),
            code: formData.code?.trim() || generateCode(formData.name),
            description: formData.description?.trim() || null,
        };

        if (isEditing && formData.id) {
            upsertData.id = formData.id;
        }

        const { error } = await supabase.from('fee_types').upsert(upsertData);

        if (error) {
            toast({ variant: 'destructive', title: 'Error saving fee type', description: error.message });
        } else {
            toast({ title: isEditing ? 'Fee Type Updated!' : 'Fee Type Added!' });
            resetForm();
            await fetchFeesTypes();
        }
        setIsSubmitting(false);
    };

    const handleEdit = (type) => {
        setFormData({ id: type.id, name: type.name, code: type.code || '', description: type.description || '' });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        // Check for dependencies
        const { data: masters, error: checkError } = await supabase
            .from('fee_masters')
            .select('id')
            .eq('fee_type_id', id)
            .limit(1);
            
        if (checkError) {
            toast({ variant: 'destructive', title: 'Error checking dependencies', description: checkError.message });
            return;
        }
        
        if (masters && masters.length > 0) {
            toast({ 
                variant: 'destructive', 
                title: 'Cannot Delete', 
                description: 'This fee type is used in Fee Masters. Remove those first.' 
            });
            return;
        }

        const { error } = await supabase.from('fee_types').delete().eq('id', id);
        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting fee type', description: error.message });
        } else {
            toast({ title: 'Fee Type Deleted' });
            await fetchFeesTypes();
        }
    };

    return (
        <DashboardLayout>
            <TooltipProvider>
                <div className="space-y-6">
                    {/* Header */}
                    <h1 className="text-2xl font-bold">Fees Type</h1>

                    {/* Main Content - Split Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* LEFT PANEL - Add/Edit Form */}
                        <div className="lg:col-span-4 xl:col-span-3">
                            <Card className="sticky top-4">
                                <CardHeader className="pb-4 border-b">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <PlusCircle className="h-5 w-5 text-primary" />
                                        {isEditing ? 'Edit Fees Type' : 'Add Fees Type'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {/* Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-medium">
                                                Name <span className="text-destructive">*</span>
                                            </Label>
                                            <Input 
                                                id="name" 
                                                value={formData.name} 
                                                onChange={(e) => handleNameChange(e.target.value)} 
                                                placeholder="Enter fee type name"
                                                className="h-10"
                                            />
                                        </div>
                                        
                                        {/* Fees Code */}
                                        <div className="space-y-2">
                                            <Label htmlFor="code" className="text-sm font-medium">
                                                Fees Code <span className="text-destructive">*</span>
                                            </Label>
                                            <Input 
                                                id="code" 
                                                value={formData.code} 
                                                onChange={(e) => setFormData({...formData, code: e.target.value})}
                                                placeholder="e.g., apr-month-fees"
                                                className="h-10 font-mono text-sm"
                                            />
                                            <p className="text-xs text-muted-foreground">Auto-generated from name if left empty</p>
                                        </div>
                                        
                                        {/* Description */}
                                        <div className="space-y-2">
                                            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                                            <Textarea 
                                                id="description" 
                                                value={formData.description} 
                                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                                placeholder="Optional description"
                                                rows={3}
                                            />
                                        </div>
                                        
                                        {/* Buttons */}
                                        <div className="flex gap-2 pt-2">
                                            {isEditing && (
                                                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                                                    Cancel
                                                </Button>
                                            )}
                                            <Button 
                                                type="submit" 
                                                disabled={isSubmitting} 
                                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                                            >
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

                        {/* RIGHT PANEL - Fees Type List */}
                        <div className="lg:col-span-8 xl:col-span-9">
                            <Card>
                                <CardHeader className="pb-4 border-b">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <CardTitle className="text-lg">Fees Type List</CardTitle>
                                        
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
                                                        <Button variant="ghost" size="icon" className="h-9 w-9"><Copy className="h-4 w-4" /></Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Copy</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9"><FileText className="h-4 w-4" /></Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Excel</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9"><Download className="h-4 w-4" /></Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>CSV</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9"><Printer className="h-4 w-4" /></Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Print</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9"><Columns className="h-4 w-4" /></Button>
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
                                    ) : filteredTypes.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No fee types found.</p>
                                            <p className="text-sm">Add a fee type using the form on the left.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b bg-muted/50">
                                                        <th className="text-left p-3 font-medium">Name</th>
                                                        <th className="text-left p-3 font-medium">Fees Code</th>
                                                        <th className="text-center p-3 font-medium w-32">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredTypes.map(type => (
                                                        <tr key={type.id} className="border-b hover:bg-muted/30 transition-colors">
                                                            <td className="p-3">
                                                                <span className="text-primary hover:underline cursor-pointer font-medium">
                                                                    {type.name}
                                                                </span>
                                                            </td>
                                                            <td className="p-3">
                                                                <Badge variant="outline" className="font-mono text-xs">
                                                                    {type.code || '-'}
                                                                </Badge>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button 
                                                                                variant="ghost" 
                                                                                size="icon"
                                                                                className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                                                onClick={() => handleEdit(type)}
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
                                                                                <AlertDialogTitle>Delete Fee Type?</AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    This will permanently delete "{type.name}". This action cannot be undone.
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                <AlertDialogAction 
                                                                                    onClick={() => handleDelete(type.id)}
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
                                                </tbody>
                                            </table>
                                            
                                            {/* Footer */}
                                            <div className="flex items-center justify-between px-4 py-4 border-t">
                                                <p className="text-sm text-muted-foreground">
                                                    Showing 1 to {filteredTypes.length} of {feesTypes.length} entries
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
        </DashboardLayout>
    );
};

export default FeesType;
