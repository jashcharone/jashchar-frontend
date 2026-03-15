import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { 
    Loader2, Plus, Edit, Trash2, MoreHorizontal, ClipboardList, CheckSquare,
    Copy, GripVertical, FileText, Calendar, User, Settings, ListChecks, Search
} from 'lucide-react';

// Checklist item categories
const ITEM_CATEGORIES = [
    { value: 'documentation', label: 'Documentation' },
    { value: 'it_setup', label: 'IT Setup' },
    { value: 'training', label: 'Training' },
    { value: 'orientation', label: 'Orientation' },
    { value: 'access', label: 'Access & Permissions' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'introduction', label: 'Introductions' },
    { value: 'hr', label: 'HR Formalities' },
    { value: 'other', label: 'Other' },
];

// Default checklist templates
const DEFAULT_TEMPLATES = [
    { name: 'Teaching Staff Onboarding', department: 'teaching', items_count: 15 },
    { name: 'Non-Teaching Staff Onboarding', department: 'non-teaching', items_count: 12 },
    { name: 'Administrative Staff Onboarding', department: 'admin', items_count: 10 },
];

const initialFormData = {
    name: '',
    description: '',
    department_id: '',
    is_default: false,
    is_active: true,
};

const initialItemFormData = {
    title: '',
    description: '',
    category: 'documentation',
    is_mandatory: true,
    due_days: '',
    assigned_role: '',
    order_index: 0,
};

const OnboardingChecklist = () => {
    const { toast } = useToast();
    const { user, currentSessionId, organizationId } = useAuth();
    const { selectedBranch } = useBranch();
    
    // State
    const [checklists, setChecklists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [showDialog, setShowDialog] = useState(false);
    const [showItemsDialog, setShowItemsDialog] = useState(false);
    const [showAddItemDialog, setShowAddItemDialog] = useState(false);
    const [editingChecklist, setEditingChecklist] = useState(null);
    const [selectedChecklist, setSelectedChecklist] = useState(null);
    const [checklistItems, setChecklistItems] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [itemFormData, setItemFormData] = useState(initialItemFormData);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch checklists
    const fetchChecklists = useCallback(async () => {
        if (!selectedBranch?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('onboarding_checklists')
                .select(`
                    *,
                    departments(id, name)
                `)
                .eq('branch_id', selectedBranch.id)
                .order('name');
            
            if (error) throw error;
            setChecklists(data || []);
        } catch (error) {
            console.error('Error fetching checklists:', error);
            toast({ variant: 'destructive', title: 'Error loading checklists' });
        } finally {
            setLoading(false);
        }
    }, [selectedBranch?.id, toast]);

    const fetchDepartments = useCallback(async () => {
        if (!selectedBranch?.id) return;
        try {
            const { data } = await supabase
                .from('departments')
                .select('id, name')
                .eq('branch_id', selectedBranch.id)
                .order('name');
            setDepartments(data || []);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    }, [selectedBranch?.id]);

    const fetchChecklistItems = useCallback(async (checklistId) => {
        try {
            const { data, error } = await supabase
                .from('onboarding_checklist_items')
                .select('*')
                .eq('checklist_id', checklistId)
                .order('order_index');
            
            if (error) throw error;
            setChecklistItems(data || []);
        } catch (error) {
            console.error('Error fetching items:', error);
        }
    }, []);

    useEffect(() => {
        fetchChecklists();
        fetchDepartments();
    }, [fetchChecklists, fetchDepartments]);

    // Stats calculation
    const stats = useMemo(() => {
        const total = checklists.length;
        const active = checklists.filter(c => c.is_active).length;
        const defaultCount = checklists.filter(c => c.is_default).length;
        const totalItems = checklists.reduce((acc, c) => acc + (c.items_count || 0), 0);
        return { total, active, defaultCount, totalItems };
    }, [checklists]);

    // Filtered checklists
    const filteredChecklists = useMemo(() => {
        if (!searchTerm) return checklists;
        const term = searchTerm.toLowerCase();
        return checklists.filter(c => 
            c.name?.toLowerCase().includes(term) ||
            c.departments?.name?.toLowerCase().includes(term)
        );
    }, [checklists, searchTerm]);

    // Handlers
    const resetForm = () => {
        setFormData(initialFormData);
        setEditingChecklist(null);
    };

    const resetItemForm = () => {
        setItemFormData(initialItemFormData);
        setEditingItem(null);
    };

    const handleOpenDialog = (checklist = null) => {
        if (checklist) {
            setEditingChecklist(checklist);
            setFormData({
                name: checklist.name || '',
                description: checklist.description || '',
                department_id: checklist.department_id || '',
                is_default: checklist.is_default || false,
                is_active: checklist.is_active ?? true,
            });
        } else {
            resetForm();
        }
        setShowDialog(true);
    };

    const handleOpenItemsDialog = async (checklist) => {
        setSelectedChecklist(checklist);
        await fetchChecklistItems(checklist.id);
        setShowItemsDialog(true);
    };

    const handleOpenAddItemDialog = (item = null) => {
        if (item) {
            setEditingItem(item);
            setItemFormData({
                title: item.title || '',
                description: item.description || '',
                category: item.category || 'documentation',
                is_mandatory: item.is_mandatory ?? true,
                due_days: item.due_days?.toString() || '',
                assigned_role: item.assigned_role || '',
                order_index: item.order_index || 0,
            });
        } else {
            resetItemForm();
            setItemFormData(prev => ({
                ...prev,
                order_index: checklistItems.length,
            }));
        }
        setShowAddItemDialog(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast({ variant: 'destructive', title: 'Checklist name is required' });
            return;
        }
        
        setSaving(true);
        try {
            const payload = {
                ...formData,
                department_id: formData.department_id || null,
                branch_id: selectedBranch.id,
                organization_id: organizationId,
            };
            
            let error;
            if (editingChecklist) {
                ({ error } = await supabase.from('onboarding_checklists').update(payload).eq('id', editingChecklist.id));
            } else {
                ({ error } = await supabase.from('onboarding_checklists').insert(payload));
            }
            
            if (error) throw error;
            
            toast({ title: editingChecklist ? 'Checklist updated' : 'Checklist created successfully' });
            setShowDialog(false);
            resetForm();
            fetchChecklists();
        } catch (error) {
            console.error('Error saving checklist:', error);
            toast({ variant: 'destructive', title: 'Error saving checklist' });
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitItem = async () => {
        if (!itemFormData.title.trim()) {
            toast({ variant: 'destructive', title: 'Item title is required' });
            return;
        }
        
        try {
            const payload = {
                ...itemFormData,
                due_days: itemFormData.due_days ? parseInt(itemFormData.due_days) : null,
                checklist_id: selectedChecklist.id,
            };
            
            let error;
            if (editingItem) {
                ({ error } = await supabase.from('onboarding_checklist_items').update(payload).eq('id', editingItem.id));
            } else {
                ({ error } = await supabase.from('onboarding_checklist_items').insert(payload));
            }
            
            if (error) throw error;
            
            // Update items count on checklist
            const { count } = await supabase
                .from('onboarding_checklist_items')
                .select('id', { count: 'exact' })
                .eq('checklist_id', selectedChecklist.id);
            
            await supabase.from('onboarding_checklists').update({ items_count: count }).eq('id', selectedChecklist.id);
            
            toast({ title: editingItem ? 'Item updated' : 'Item added successfully' });
            setShowAddItemDialog(false);
            resetItemForm();
            fetchChecklistItems(selectedChecklist.id);
            fetchChecklists();
        } catch (error) {
            console.error('Error saving item:', error);
            toast({ variant: 'destructive', title: 'Error saving item' });
        }
    };

    const handleDeleteChecklist = async (checklist) => {
        if (!confirm(`Delete checklist "${checklist.name}"? This will also delete all items.`)) return;
        try {
            const { error } = await supabase.from('onboarding_checklists').delete().eq('id', checklist.id);
            if (error) throw error;
            toast({ title: 'Checklist deleted' });
            fetchChecklists();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error deleting checklist' });
        }
    };

    const handleDeleteItem = async (item) => {
        if (!confirm(`Delete item "${item.title}"?`)) return;
        try {
            const { error } = await supabase.from('onboarding_checklist_items').delete().eq('id', item.id);
            if (error) throw error;
            toast({ title: 'Item deleted' });
            fetchChecklistItems(selectedChecklist.id);
            
            // Update items count
            const { count } = await supabase
                .from('onboarding_checklist_items')
                .select('id', { count: 'exact' })
                .eq('checklist_id', selectedChecklist.id);
            await supabase.from('onboarding_checklists').update({ items_count: count }).eq('id', selectedChecklist.id);
            fetchChecklists();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error deleting item' });
        }
    };

    const handleDuplicateChecklist = async (checklist) => {
        try {
            // Create new checklist
            const newChecklist = {
                name: `${checklist.name} (Copy)`,
                description: checklist.description,
                department_id: checklist.department_id,
                is_default: false,
                is_active: true,
                branch_id: selectedBranch.id,
                organization_id: organizationId,
            };
            
            const { data: created, error: createError } = await supabase
                .from('onboarding_checklists')
                .insert(newChecklist)
                .select()
                .single();
            
            if (createError) throw createError;
            
            // Copy items
            const { data: items } = await supabase
                .from('onboarding_checklist_items')
                .select('*')
                .eq('checklist_id', checklist.id);
            
            if (items && items.length > 0) {
                const newItems = items.map(item => ({
                    checklist_id: created.id,
                    title: item.title,
                    description: item.description,
                    category: item.category,
                    is_mandatory: item.is_mandatory,
                    due_days: item.due_days,
                    assigned_role: item.assigned_role,
                    order_index: item.order_index,
                }));
                
                await supabase.from('onboarding_checklist_items').insert(newItems);
                await supabase.from('onboarding_checklists').update({ items_count: items.length }).eq('id', created.id);
            }
            
            toast({ title: 'Checklist duplicated successfully' });
            fetchChecklists();
        } catch (error) {
            console.error('Error duplicating:', error);
            toast({ variant: 'destructive', title: 'Error duplicating checklist' });
        }
    };

    const handleToggleActive = async (checklist) => {
        try {
            const { error } = await supabase
                .from('onboarding_checklists')
                .update({ is_active: !checklist.is_active })
                .eq('id', checklist.id);
            if (error) throw error;
            fetchChecklists();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error updating status' });
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <ClipboardList className="h-6 w-6 text-primary" />
                            Onboarding Checklists
                        </h1>
                        <p className="text-muted-foreground">Create and manage onboarding checklist templates</p>
                    </div>
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Checklist
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-xs text-muted-foreground">Total Checklists</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                                <p className="text-xs text-muted-foreground">Active</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{stats.defaultCount}</p>
                                <p className="text-xs text-muted-foreground">Default</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-purple-600">{stats.totalItems}</p>
                                <p className="text-xs text-muted-foreground">Total Items</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <div className="flex justify-end">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search checklists..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 w-64"
                        />
                    </div>
                </div>

                {/* Checklists Grid */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : filteredChecklists.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No checklists found. Create your first onboarding checklist.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredChecklists.map((checklist) => (
                            <Card key={checklist.id} className={`hover:shadow-md transition-shadow ${!checklist.is_active ? 'opacity-60' : ''}`}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                {checklist.name}
                                                {checklist.is_default && (
                                                    <Badge variant="secondary" className="text-xs">Default</Badge>
                                                )}
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                {checklist.departments?.name || 'All Departments'}
                                            </CardDescription>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleOpenItemsDialog(checklist)}>
                                                    <ListChecks className="h-4 w-4 mr-2" /> Manage Items
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleOpenDialog(checklist)}>
                                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDuplicateChecklist(checklist)}>
                                                    <Copy className="h-4 w-4 mr-2" /> Duplicate
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggleActive(checklist)}>
                                                    <Settings className="h-4 w-4 mr-2" /> 
                                                    {checklist.is_active ? 'Deactivate' : 'Activate'}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleDeleteChecklist(checklist)} className="text-red-600">
                                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {checklist.description && (
                                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                            {checklist.description}
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm">
                                            <CheckSquare className="h-4 w-4 text-muted-foreground" />
                                            <span>{checklist.items_count || 0} items</span>
                                        </div>
                                        <Badge variant={checklist.is_active ? 'default' : 'secondary'}>
                                            {checklist.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        className="w-full mt-3"
                                        onClick={() => handleOpenItemsDialog(checklist)}
                                    >
                                        <ListChecks className="h-4 w-4 mr-2" />
                                        View Items
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Checklist Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingChecklist ? 'Edit Checklist' : 'Create New Checklist'}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Checklist Name <span className="text-red-500">*</span></Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="e.g., Teaching Staff Onboarding"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Brief description of this checklist..."
                                rows={3}
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Department (Optional)</Label>
                            <Select value={formData.department_id} onValueChange={(v) => setFormData({...formData, department_id: v})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Departments</SelectItem>
                                    {departments.map(d => (
                                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Set as Default</Label>
                                <p className="text-xs text-muted-foreground">Auto-assign to new employees</p>
                            </div>
                            <Switch
                                checked={formData.is_default}
                                onCheckedChange={(checked) => setFormData({...formData, is_default: checked})}
                            />
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Active</Label>
                                <p className="text-xs text-muted-foreground">Available for use</p>
                            </div>
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                            />
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {editingChecklist ? 'Update' : 'Create Checklist'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Checklist Items Dialog */}
            <Dialog open={showItemsDialog} onOpenChange={setShowItemsDialog}>
                <DialogContent className="max-w-3xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ListChecks className="h-5 w-5" />
                            {selectedChecklist?.name} - Items
                        </DialogTitle>
                        <DialogDescription>
                            Manage checklist items. Items will be shown to employees during onboarding.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex justify-end mb-2">
                        <Button size="sm" onClick={() => handleOpenAddItemDialog()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                        </Button>
                    </div>
                    
                    <div className="max-h-[50vh] overflow-y-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-10">#</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Due</TableHead>
                                    <TableHead>Required</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {checklistItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-20 text-muted-foreground">
                                            No items yet. Add your first checklist item.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    checklistItems.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-sm">{item.title}</p>
                                                    {item.description && (
                                                        <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {ITEM_CATEGORIES.find(c => c.value === item.category)?.label || item.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {item.due_days ? `Day ${item.due_days}` : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={item.is_mandatory ? 'destructive' : 'secondary'}>
                                                    {item.is_mandatory ? 'Mandatory' : 'Optional'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenAddItemDialog(item)}>
                                                        <Edit className="h-3 w-3" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDeleteItem(item)}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowItemsDialog(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add/Edit Item Dialog */}
            <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit Item' : 'Add Checklist Item'}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Item Title <span className="text-red-500">*</span></Label>
                            <Input
                                value={itemFormData.title}
                                onChange={(e) => setItemFormData({...itemFormData, title: e.target.value})}
                                placeholder="e.g., Submit ID proof documents"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={itemFormData.description}
                                onChange={(e) => setItemFormData({...itemFormData, description: e.target.value})}
                                placeholder="Additional details for this item..."
                                rows={2}
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={itemFormData.category} onValueChange={(v) => setItemFormData({...itemFormData, category: v})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ITEM_CATEGORIES.map(c => (
                                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Due By (Day)</Label>
                                <Input
                                    type="number"
                                    value={itemFormData.due_days}
                                    onChange={(e) => setItemFormData({...itemFormData, due_days: e.target.value})}
                                    placeholder="e.g., 7"
                                />
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Mandatory</Label>
                                <p className="text-xs text-muted-foreground">Must complete to finish onboarding</p>
                            </div>
                            <Switch
                                checked={itemFormData.is_mandatory}
                                onCheckedChange={(checked) => setItemFormData({...itemFormData, is_mandatory: checked})}
                            />
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddItemDialog(false)}>Cancel</Button>
                        <Button onClick={handleSubmitItem}>
                            {editingItem ? 'Update Item' : 'Add Item'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default OnboardingChecklist;
