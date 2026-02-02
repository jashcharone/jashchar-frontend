import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from '@/lib/supabaseClient';
import { 
    Loader2, Trash2, Edit, Plus, Search, Users, 
    Building, AlertCircle, Check, X, RefreshCw
} from 'lucide-react';

// ============================================================================
// CASTE MANAGEMENT COMPONENT
// ============================================================================
const CasteManagement = ({ embedded = false }) => {
    const { toast } = useToast();
    
    // States for data
    const [loading, setLoading] = useState(true);
    const [states, setStates] = useState([]);
    const [selectedState, setSelectedState] = useState(null);
    const [categories, setCategories] = useState([]);
    const [subCastes, setSubCastes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Dialog states
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);
    const [showSubCasteDialog, setShowSubCasteDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteType, setDeleteType] = useState(null); // 'category' or 'subcaste'
    const [deleteItem, setDeleteItem] = useState(null);
    
    // Form states
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingSubCaste, setEditingSubCaste] = useState(null);
    const [categoryForm, setCategoryForm] = useState({
        name: '', code: '', display_order: 0, reservation_percent: 0
    });
    const [subCasteForm, setSubCasteForm] = useState({
        name: '', code: '', caste_category_id: ''
    });
    
    // Saving states
    const [savingCategory, setSavingCategory] = useState(false);
    const [savingSubCaste, setSavingSubCaste] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // ==================== FETCH DATA ====================
    const fetchStates = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('indian_states')
                .select('*')
                .eq('is_active', true)
                .order('name');
            
            if (error) throw error;
            setStates(data || []);
            
            // Default to Karnataka
            const karnataka = data?.find(s => s.code === 'KA');
            if (karnataka && !selectedState) {
                setSelectedState(karnataka.id);
            }
        } catch (error) {
            console.error('Error fetching states:', error);
            toast({ variant: 'destructive', title: 'Error loading states' });
        }
    }, [toast]);

    const fetchCategories = useCallback(async () => {
        if (!selectedState) return;
        
        try {
            const { data, error } = await supabase
                .from('caste_categories')
                .select('*')
                .eq('state_id', selectedState)
                .order('display_order');
            
            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast({ variant: 'destructive', title: 'Error loading categories' });
        }
    }, [selectedState, toast]);

    const fetchSubCastes = useCallback(async () => {
        if (!selectedState) return;
        
        try {
            // Get all category IDs for selected state
            const categoryIds = categories.map(c => c.id);
            
            if (categoryIds.length === 0) {
                setSubCastes([]);
                return;
            }
            
            const { data, error } = await supabase
                .from('sub_castes')
                .select('*, caste_categories(name, code)')
                .in('caste_category_id', categoryIds)
                .order('name');
            
            if (error) throw error;
            setSubCastes(data || []);
        } catch (error) {
            console.error('Error fetching sub-castes:', error);
            toast({ variant: 'destructive', title: 'Error loading sub-castes' });
        }
    }, [selectedState, categories, toast]);

    // Initial load
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await fetchStates();
            setLoading(false);
        };
        init();
    }, [fetchStates]);

    // Load categories when state changes
    useEffect(() => {
        if (selectedState) {
            fetchCategories();
        }
    }, [selectedState, fetchCategories]);

    // Load sub-castes when categories change
    useEffect(() => {
        if (categories.length > 0) {
            fetchSubCastes();
        }
    }, [categories, fetchSubCastes]);

    // ==================== CATEGORY OPERATIONS ====================
    const openAddCategory = () => {
        setEditingCategory(null);
        setCategoryForm({ name: '', code: '', display_order: 0, reservation_percent: 0 });
        setShowCategoryDialog(true);
    };

    const openEditCategory = (category) => {
        setEditingCategory(category);
        setCategoryForm({
            name: category.name,
            code: category.code,
            display_order: category.display_order || 0,
            reservation_percent: category.reservation_percent || 0
        });
        setShowCategoryDialog(true);
    };

    const saveCategory = async () => {
        if (!categoryForm.name.trim() || !categoryForm.code.trim()) {
            toast({ variant: 'destructive', title: 'Please fill name and code' });
            return;
        }

        setSavingCategory(true);
        try {
            if (editingCategory) {
                // Update
                const { error } = await supabase
                    .from('caste_categories')
                    .update({
                        name: categoryForm.name.trim(),
                        code: categoryForm.code.trim().toUpperCase(),
                        display_order: parseInt(categoryForm.display_order) || 0,
                        reservation_percent: parseFloat(categoryForm.reservation_percent) || 0
                    })
                    .eq('id', editingCategory.id);
                
                if (error) throw error;
                toast({ title: 'Category updated successfully' });
            } else {
                // Insert
                const { error } = await supabase
                    .from('caste_categories')
                    .insert({
                        state_id: selectedState,
                        name: categoryForm.name.trim(),
                        code: categoryForm.code.trim().toUpperCase(),
                        display_order: parseInt(categoryForm.display_order) || 0,
                        reservation_percent: parseFloat(categoryForm.reservation_percent) || 0,
                        is_active: true
                    });
                
                if (error) throw error;
                toast({ title: 'Category added successfully' });
            }
            
            setShowCategoryDialog(false);
            fetchCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            toast({ variant: 'destructive', title: 'Error saving category', description: error.message });
        } finally {
            setSavingCategory(false);
        }
    };

    const confirmDeleteCategory = (category) => {
        setDeleteType('category');
        setDeleteItem(category);
        setShowDeleteDialog(true);
    };

    // ==================== SUB-CASTE OPERATIONS ====================
    const openAddSubCaste = () => {
        setEditingSubCaste(null);
        setSubCasteForm({ name: '', code: '', caste_category_id: categories[0]?.id || '' });
        setShowSubCasteDialog(true);
    };

    const openEditSubCaste = (subCaste) => {
        setEditingSubCaste(subCaste);
        setSubCasteForm({
            name: subCaste.name,
            code: subCaste.code || '',
            caste_category_id: subCaste.caste_category_id
        });
        setShowSubCasteDialog(true);
    };

    const saveSubCaste = async () => {
        if (!subCasteForm.name.trim() || !subCasteForm.caste_category_id) {
            toast({ variant: 'destructive', title: 'Please fill name and select category' });
            return;
        }

        setSavingSubCaste(true);
        try {
            if (editingSubCaste) {
                // Update
                const { error } = await supabase
                    .from('sub_castes')
                    .update({
                        name: subCasteForm.name.trim(),
                        code: subCasteForm.code.trim() || null,
                        caste_category_id: subCasteForm.caste_category_id
                    })
                    .eq('id', editingSubCaste.id);
                
                if (error) throw error;
                toast({ title: 'Sub-caste updated successfully' });
            } else {
                // Insert
                const { error } = await supabase
                    .from('sub_castes')
                    .insert({
                        caste_category_id: subCasteForm.caste_category_id,
                        name: subCasteForm.name.trim(),
                        code: subCasteForm.code.trim() || null,
                        is_active: true
                    });
                
                if (error) throw error;
                toast({ title: 'Sub-caste added successfully' });
            }
            
            setShowSubCasteDialog(false);
            fetchSubCastes();
        } catch (error) {
            console.error('Error saving sub-caste:', error);
            toast({ variant: 'destructive', title: 'Error saving sub-caste', description: error.message });
        } finally {
            setSavingSubCaste(false);
        }
    };

    const confirmDeleteSubCaste = (subCaste) => {
        setDeleteType('subcaste');
        setDeleteItem(subCaste);
        setShowDeleteDialog(true);
    };

    // ==================== DELETE OPERATION ====================
    const handleDelete = async () => {
        if (!deleteItem) return;
        
        setDeleting(true);
        try {
            if (deleteType === 'category') {
                // First check if category has sub-castes
                const { data: subCastesCount } = await supabase
                    .from('sub_castes')
                    .select('id', { count: 'exact' })
                    .eq('caste_category_id', deleteItem.id);
                
                if (subCastesCount && subCastesCount.length > 0) {
                    // Delete all sub-castes first
                    await supabase
                        .from('sub_castes')
                        .delete()
                        .eq('caste_category_id', deleteItem.id);
                }
                
                // Then delete category
                const { error } = await supabase
                    .from('caste_categories')
                    .delete()
                    .eq('id', deleteItem.id);
                
                if (error) throw error;
                toast({ title: 'Category deleted successfully' });
                fetchCategories();
            } else {
                // Delete sub-caste
                const { error } = await supabase
                    .from('sub_castes')
                    .delete()
                    .eq('id', deleteItem.id);
                
                if (error) throw error;
                toast({ title: 'Sub-caste deleted successfully' });
                fetchSubCastes();
            }
            
            setShowDeleteDialog(false);
            setDeleteItem(null);
            setDeleteType(null);
        } catch (error) {
            console.error('Error deleting:', error);
            toast({ variant: 'destructive', title: 'Error deleting', description: error.message });
        } finally {
            setDeleting(false);
        }
    };

    // Toggle active status
    const toggleCategoryActive = async (category) => {
        try {
            const { error } = await supabase
                .from('caste_categories')
                .update({ is_active: !category.is_active })
                .eq('id', category.id);
            
            if (error) throw error;
            fetchCategories();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error updating status' });
        }
    };

    const toggleSubCasteActive = async (subCaste) => {
        try {
            const { error } = await supabase
                .from('sub_castes')
                .update({ is_active: !subCaste.is_active })
                .eq('id', subCaste.id);
            
            if (error) throw error;
            fetchSubCastes();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error updating status' });
        }
    };

    // Filter sub-castes by search
    const filteredSubCastes = subCastes.filter(sc => 
        sc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sc.code && sc.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sc.caste_categories?.name && sc.caste_categories.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // ==================== RENDER ====================
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const content = (
        <div className="space-y-6">
            {/* State Selector */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Select State</CardTitle>
                            <CardDescription>Choose state to manage caste categories</CardDescription>
                        </div>
                        <Select value={selectedState || ''} onValueChange={setSelectedState}>
                            <SelectTrigger className="w-64">
                                <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                            <SelectContent>
                                {states.map(state => (
                                    <SelectItem key={state.id} value={state.id}>
                                        {state.name} ({state.code})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
            </Card>

            {selectedState && (
                <Tabs defaultValue="categories" className="w-full">
                    <TabsList className="w-full justify-start gap-2 bg-muted/50 p-1">
                        <TabsTrigger value="categories" className="gap-2 data-[state=active]:bg-background">
                            <Building className="h-4 w-4" />
                            Caste Categories ({categories.length})
                        </TabsTrigger>
                        <TabsTrigger value="subcastes" className="gap-2 data-[state=active]:bg-background">
                            <Users className="h-4 w-4" />
                            Sub-Castes ({subCastes.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Categories Tab */}
                    <TabsContent value="categories" className="mt-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Caste Categories</CardTitle>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={fetchCategories}>
                                            <RefreshCw className="h-4 w-4 mr-1" />
                                            Refresh
                                        </Button>
                                        <Button size="sm" onClick={openAddCategory}>
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add Category
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {categories.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Building className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>No categories found for this state</p>
                                        <Button className="mt-3" onClick={openAddCategory}>
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add First Category
                                        </Button>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Code</TableHead>
                                                <TableHead>Reservation %</TableHead>
                                                <TableHead>Order</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {categories.map(category => (
                                                <TableRow key={category.id}>
                                                    <TableCell className="font-medium">{category.name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{category.code}</Badge>
                                                    </TableCell>
                                                    <TableCell>{category.reservation_percent || 0}%</TableCell>
                                                    <TableCell>{category.display_order || 0}</TableCell>
                                                    <TableCell>
                                                        <Switch
                                                            checked={category.is_active !== false}
                                                            onCheckedChange={() => toggleCategoryActive(category)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex gap-1 justify-end">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openEditCategory(category)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-destructive hover:text-destructive"
                                                                onClick={() => confirmDeleteCategory(category)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Sub-Castes Tab */}
                    <TabsContent value="subcastes" className="mt-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Sub-Castes</CardTitle>
                                    <div className="flex gap-2">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search sub-castes..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-8 w-64"
                                            />
                                        </div>
                                        <Button variant="outline" size="sm" onClick={fetchSubCastes}>
                                            <RefreshCw className="h-4 w-4 mr-1" />
                                            Refresh
                                        </Button>
                                        <Button size="sm" onClick={openAddSubCaste} disabled={categories.length === 0}>
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add Sub-Caste
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {categories.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>Please add caste categories first</p>
                                    </div>
                                ) : filteredSubCastes.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>{searchTerm ? 'No sub-castes found matching search' : 'No sub-castes found'}</p>
                                        {!searchTerm && (
                                            <Button className="mt-3" onClick={openAddSubCaste}>
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add First Sub-Caste
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <ScrollArea className="h-[500px]">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Code</TableHead>
                                                    <TableHead>Category</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredSubCastes.map(subCaste => (
                                                    <TableRow key={subCaste.id}>
                                                        <TableCell className="font-medium">{subCaste.name}</TableCell>
                                                        <TableCell>
                                                            {subCaste.code ? (
                                                                <Badge variant="outline">{subCaste.code}</Badge>
                                                            ) : '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary">
                                                                {subCaste.caste_categories?.name || subCaste.caste_categories?.code || '-'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Switch
                                                                checked={subCaste.is_active !== false}
                                                                onCheckedChange={() => toggleSubCasteActive(subCaste)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex gap-1 justify-end">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => openEditSubCaste(subCaste)}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-destructive hover:text-destructive"
                                                                    onClick={() => confirmDeleteSubCaste(subCaste)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}

            {/* Add/Edit Category Dialog */}
            <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
                        <DialogDescription>
                            {editingCategory ? 'Update caste category details' : 'Add new caste category for selected state'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Category Name *</Label>
                            <Input
                                placeholder="e.g., General Merit, SC, ST..."
                                value={categoryForm.name}
                                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Category Code *</Label>
                            <Input
                                placeholder="e.g., GM, SC, ST, CAT1..."
                                value={categoryForm.code}
                                onChange={(e) => setCategoryForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Reservation %</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.5"
                                    placeholder="0"
                                    value={categoryForm.reservation_percent}
                                    onChange={(e) => setCategoryForm(prev => ({ ...prev, reservation_percent: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Display Order</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={categoryForm.display_order}
                                    onChange={(e) => setCategoryForm(prev => ({ ...prev, display_order: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveCategory} disabled={savingCategory}>
                            {savingCategory && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {editingCategory ? 'Update' : 'Add'} Category
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add/Edit Sub-Caste Dialog */}
            <Dialog open={showSubCasteDialog} onOpenChange={setShowSubCasteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingSubCaste ? 'Edit Sub-Caste' : 'Add Sub-Caste'}</DialogTitle>
                        <DialogDescription>
                            {editingSubCaste ? 'Update sub-caste details' : 'Add new sub-caste under a category'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Select Category *</Label>
                            <Select 
                                value={subCasteForm.caste_category_id} 
                                onValueChange={(val) => setSubCasteForm(prev => ({ ...prev, caste_category_id: val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name} ({cat.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Sub-Caste Name *</Label>
                            <Input
                                placeholder="e.g., Vokkaliga, Lingayat..."
                                value={subCasteForm.name}
                                onChange={(e) => setSubCasteForm(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Code (Optional)</Label>
                            <Input
                                placeholder="Optional code"
                                value={subCasteForm.code}
                                onChange={(e) => setSubCasteForm(prev => ({ ...prev, code: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSubCasteDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveSubCaste} disabled={savingSubCaste}>
                            {savingSubCaste && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {editingSubCaste ? 'Update' : 'Add'} Sub-Caste
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteType === 'category' ? (
                                <>
                                    This will delete the category <strong>"{deleteItem?.name}"</strong> and all its sub-castes.
                                    This action cannot be undone.
                                </>
                            ) : (
                                <>
                                    This will delete the sub-caste <strong>"{deleteItem?.name}"</strong>.
                                    This action cannot be undone.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );

    if (embedded) {
        return content;
    }

    return (
        <div className="p-6">
            {content}
        </div>
    );
};

export default CasteManagement;
