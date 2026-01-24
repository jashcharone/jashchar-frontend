import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Eye, Edit } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";

const DesignMarksheet = () => {
  const { branchId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [deleteId, setDeleteId] = useState(null); // State to track item to delete
  
  const [formData, setFormData] = useState({
    template_name: '',
    heading: '',
    title: '',
    exam_name: '',
    school_name: '',
    exam_center: '',
    body_text: '',
    footer_text: '',
    printing_date: '',
    left_logo: '',
    right_logo: '',
    left_sign: '',
    middle_sign: '',
    right_sign: '',
    background_image: '',
    is_active: true
  });

  useEffect(() => {
    if (branchId) fetchTemplates();
  }, [branchId]);

  const fetchTemplates = async () => {
    const { data } = await supabase.from('marksheet_templates').select('*').eq('branch_id', branchId);
    setTemplates(data || []);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const fileName = `${branchId}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from('marksheet-assets').upload(fileName, file);
    
    if (error) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } else {
      const { data: { publicUrl } } = supabase.storage.from('marksheet-assets').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, [fieldName]: publicUrl }));
      toast({ title: "Success", description: "File uploaded successfully" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('marksheet_templates').insert([{ ...formData, branch_id: branchId }]);
      if (error) throw error;
      toast({ title: "Success", description: "Template saved successfully" });
      fetchTemplates();
      setFormData({
        template_name: '', heading: '', title: '', exam_name: '', school_name: '', exam_center: '',
        body_text: '', footer_text: '', printing_date: '', left_logo: '', right_logo: '',
        left_sign: '', middle_sign: '', right_sign: '', background_image: '', is_active: true
      });
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from('marksheet_templates').delete().eq('id', deleteId);
      if (error) throw error;
      toast({ title: "Success", description: "Template deleted successfully" });
      fetchTemplates();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Design Marksheet</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Create Template</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Template Name</Label><Input name="template_name" value={formData.template_name} onChange={handleInputChange} required /></div>
                  <div className="space-y-2"><Label>Heading</Label><Input name="heading" value={formData.heading} onChange={handleInputChange} /></div>
                  <div className="space-y-2"><Label>Title</Label><Input name="title" value={formData.title} onChange={handleInputChange} /></div>
                  <div className="space-y-2"><Label>Exam Name</Label><Input name="exam_name" value={formData.exam_name} onChange={handleInputChange} /></div>
                  <div className="space-y-2"><Label>School Name</Label><Input name="school_name" value={formData.school_name} onChange={handleInputChange} /></div>
                  <div className="space-y-2"><Label>Exam Center</Label><Input name="exam_center" value={formData.exam_center} onChange={handleInputChange} /></div>
                  <div className="space-y-2"><Label>Printing Date</Label><Input type="date" name="printing_date" value={formData.printing_date} onChange={handleInputChange} /></div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Left Logo</Label><Input type="file" onChange={(e) => handleFileUpload(e, 'left_logo')} /></div>
                  <div className="space-y-2"><Label>Right Logo</Label><Input type="file" onChange={(e) => handleFileUpload(e, 'right_logo')} /></div>
                  <div className="space-y-2"><Label>Background</Label><Input type="file" onChange={(e) => handleFileUpload(e, 'background_image')} /></div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Left Sign</Label><Input type="file" onChange={(e) => handleFileUpload(e, 'left_sign')} /></div>
                  <div className="space-y-2"><Label>Middle Sign</Label><Input type="file" onChange={(e) => handleFileUpload(e, 'middle_sign')} /></div>
                  <div className="space-y-2"><Label>Right Sign</Label><Input type="file" onChange={(e) => handleFileUpload(e, 'right_sign')} /></div>
                </div>

                <div className="space-y-2"><Label>Body Text</Label><Textarea name="body_text" value={formData.body_text} onChange={handleInputChange} /></div>
                <div className="space-y-2"><Label>Footer Text</Label><Textarea name="footer_text" value={formData.footer_text} onChange={handleInputChange} /></div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="active" checked={formData.is_active} onCheckedChange={(c) => setFormData(p => ({...p, is_active: c}))} />
                  <Label htmlFor="active">Is Active</Label>
                </div>

                <Button type="submit" disabled={loading} className="w-full">Save Template</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Template List</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {templates.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>{t.template_name}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" onClick={() => setDeleteId(t.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the marksheet template.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DesignMarksheet;
