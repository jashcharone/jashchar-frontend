import React, { useState, useEffect } from 'react';
import { formatDate } from '@/utils/dateUtils';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { Loader2, Plus, Pencil, Trash2, Eye } from 'lucide-react';

const CertificateTemplates = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_html: '',
    background_image: ''
  });

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user, selectedBranch]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('certificate_templates')
        .select('*')
        .eq('branch_id', user.branch_id)
        .order('created_at', { ascending: false });

      if (selectedBranch) {
        query = query.eq('branch_id', selectedBranch.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        branch_id: selectedBranch?.id,
      };

      let error;
      if (currentTemplate) {
        const { error: updateError } = await supabase
          .from('certificate_templates')
          .update(payload)
          .eq('id', currentTemplate.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('certificate_templates')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Template ${currentTemplate ? 'updated' : 'created'} successfully`,
      });
      
      setIsDialogOpen(false);
      setFormData({ name: '', description: '', template_html: '', background_image: '' });
      setCurrentTemplate(null);
      fetchTemplates();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (template) => {
    setCurrentTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      template_html: template.template_html || '',
      background_image: template.background_image || ''
    });
    setIsDialogOpen(true);
  };

  const initiateDelete = (template) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;

    try {
      const { error } = await supabase
        .from('certificate_templates')
        .delete()
        .eq('id', templateToDelete.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      });
      fetchTemplates();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handlePreview = (template) => {
    setCurrentTemplate(template);
    setIsPreviewOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Certificate Templates</h1>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setCurrentTemplate(null);
              setFormData({ name: '', description: '', template_html: '', background_image: '' });
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{currentTemplate ? 'Edit Template' : 'Add New Template'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Merit Certificate"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of the template"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="background_image">Background Image URL</Label>
                  <Input
                    id="background_image"
                    name="background_image"
                    value={formData.background_image}
                    onChange={handleInputChange}
                    placeholder="https://example.com/background.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template_html">Template HTML Content</Label>
                  <div className="text-xs text-muted-foreground mb-2">
                    Use placeholders like {'{student_name}'}, {'{class}'}, {'{date}'}, etc.
                  </div>
                  <Textarea
                    id="template_html"
                    name="template_html"
                    value={formData.template_html}
                    onChange={handleInputChange}
                    placeholder="<div><h1>Certificate of Achievement</h1><p>This is to certify that {student_name}...</p></div>"
                    className="min-h-[200px] font-mono text-sm"
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">Save Template</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Templates List</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                No templates found. Create your first certificate template.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{template.description}</TableCell>
                      <TableCell>{formatDate(template.created_at)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handlePreview(template)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => initiateDelete(template)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview: {currentTemplate?.name}</DialogTitle>
            </DialogHeader>
            <div className="border p-4 rounded-lg relative min-h-[600px] flex items-center justify-center bg-white text-black">
              {currentTemplate?.background_image && (
                <img 
                  src={currentTemplate.background_image} 
                  alt="Background" 
                  className="absolute inset-0 w-full h-full object-cover z-0 opacity-50"
                />
              )}
              <div 
                className="relative z-10 w-full h-full"
                dangerouslySetInnerHTML={{ 
                  __html: currentTemplate?.template_html
                    ?.replace(/{student_name}/g, 'John Doe')
                    ?.replace(/{class}/g, 'X-A')
                    ?.replace(/{date}/g, formatDate(new Date()))
                    || '' 
                }} 
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the certificate template.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default CertificateTemplates;
