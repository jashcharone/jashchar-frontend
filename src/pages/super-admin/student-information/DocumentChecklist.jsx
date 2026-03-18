import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { getApiBaseUrl } from '@/utils/platform';
import { supabase } from '@/lib/supabaseClient';
import {
  ClipboardCheck, Plus, Pencil, Trash2, Save, X, GripVertical,
  FileText, CheckCircle2, AlertCircle, Loader2, Shield, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const _apiBase = getApiBaseUrl();
const BASE_URL = _apiBase ? `${_apiBase}/api` : '/api';

const CATEGORY_OPTIONS = [
  'General', 'SC', 'ST', 'OBC', 'EWS', 'Minority', 'International', 'NRI', 'All'
];

export default function DocumentChecklist() {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editItem, setEditItem] = useState(null);

  // Form state
  const [form, setForm] = useState({
    document_name: '',
    is_required: false,
    applies_to_categories: [],
    description: '',
    display_order: 0,
  });

  const getAuthHeaders = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data?.session?.access_token}`,
      'x-branch-id': selectedBranch?.id,
    };
  }, [selectedBranch]);

  const fetchItems = useCallback(async () => {
    if (!selectedBranch?.id) return;
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BASE_URL}/document-checklist/config`, { headers });
      const json = await res.json();
      if (json.success) setItems(json.data);
    } catch (err) {
      toast.error('Failed to load checklist items');
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, getAuthHeaders]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const resetForm = () => {
    setForm({ document_name: '', is_required: false, applies_to_categories: [], description: '', display_order: items.length });
    setEditItem(null);
  };

  const openAddDialog = () => {
    resetForm();
    setForm(f => ({ ...f, display_order: items.length }));
    setDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setEditItem(item);
    setForm({
      document_name: item.document_name,
      is_required: item.is_required,
      applies_to_categories: item.applies_to_categories || [],
      description: item.description || '',
      display_order: item.display_order || 0,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.document_name.trim()) {
      toast.error('Document name is required');
      return;
    }
    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      const url = editItem
        ? `${BASE_URL}/document-checklist/config/${editItem.id}`
        : `${BASE_URL}/document-checklist/config`;
      const method = editItem ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) {
        toast.success(editItem ? 'Item updated' : 'Item added');
        setDialogOpen(false);
        resetForm();
        fetchItems();
      } else {
        toast.error(json.error || 'Save failed');
      }
    } catch (err) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${BASE_URL}/document-checklist/config/${deleteTarget.id}`, {
        method: 'DELETE', headers
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Item removed');
        fetchItems();
      }
    } catch (err) {
      toast.error('Delete failed');
    } finally {
      setDeleteTarget(null);
    }
  };

  const toggleCategory = (cat) => {
    setForm(f => {
      const cats = f.applies_to_categories || [];
      if (cat === 'All') return { ...f, applies_to_categories: cats.includes('All') ? [] : ['All'] };
      const updated = cats.filter(c => c !== 'All');
      return {
        ...f,
        applies_to_categories: updated.includes(cat) ? updated.filter(c => c !== cat) : [...updated, cat]
      };
    });
  };

  if (!selectedBranch?.id) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <AlertCircle className="mr-2 h-5 w-5" /> Please select a branch first
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            Document Checklist Configuration
          </h1>
          <p className="text-muted-foreground mt-1">
            Define required documents for student admissions
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" /> Add Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 mx-auto text-blue-500 mb-1" />
            <div className="text-2xl font-bold">{items.length}</div>
            <div className="text-xs text-muted-foreground">Total Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 mx-auto text-amber-500 mb-1" />
            <div className="text-2xl font-bold">{items.filter(i => i.is_required).length}</div>
            <div className="text-xs text-muted-foreground">Required</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-8 w-8 mx-auto text-emerald-500 mb-1" />
            <div className="text-2xl font-bold">{items.filter(i => !i.is_required).length}</div>
            <div className="text-xs text-muted-foreground">Optional</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto text-purple-500 mb-1" />
            <div className="text-2xl font-bold">{new Set(items.flatMap(i => i.applies_to_categories || [])).size}</div>
            <div className="text-xs text-muted-foreground">Categories</div>
          </CardContent>
        </Card>
      </div>

      {/* Items List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading...
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">No checklist items configured</p>
            <p className="text-sm mt-1">Click "Add Document" to define required documents for student admissions</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <GripVertical className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{item.document_name}</span>
                        {item.is_required && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                        {!item.is_required && (
                          <Badge variant="secondary" className="text-xs">Optional</Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">{item.description}</p>
                      )}
                      {(item.applies_to_categories || []).length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1">
                          {item.applies_to_categories.map(cat => (
                            <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(item)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Document' : 'Add Document'}</DialogTitle>
            <DialogDescription>
              {editItem ? 'Update the document checklist item' : 'Add a new document to the admission checklist'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Document Name *</Label>
              <Input
                value={form.document_name}
                onChange={e => setForm(f => ({ ...f, document_name: e.target.value }))}
                placeholder="e.g. Aadhaar Card, Transfer Certificate"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Additional notes about this document"
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_required}
                onCheckedChange={v => setForm(f => ({ ...f, is_required: v }))}
              />
              <Label>Required Document</Label>
            </div>
            <div>
              <Label>Display Order</Label>
              <Input
                type="number"
                value={form.display_order}
                onChange={e => setForm(f => ({ ...f, display_order: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label className="mb-2 block">Applies to Categories</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map(cat => (
                  <Badge
                    key={cat}
                    variant={form.applies_to_categories?.includes(cat) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleCategory(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {editItem ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Document?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{deleteTarget?.document_name}" from the checklist?
              This won't delete existing submissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
