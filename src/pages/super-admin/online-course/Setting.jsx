import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Trash2 } from 'lucide-react';

const Setting = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { toast } = useToast();
  const branchId = user?.user_metadata?.branch_id;
  
  // Category State
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [catLoading, setCatLoading] = useState(false);

  // Settings State (placeholder for Payment Gateway)
  const [settings, setSettings] = useState({}); 

  useEffect(() => {
    if (branchId) fetchCategories();
  }, [branchId]);

  const fetchCategories = async () => {
    const { data } = await supabase.from('online_course_categories').select('*').eq('branch_id', branchId).order('created_at');
    setCategories(data || []);
  };

  const handleAddCategory = async () => {
    if (!newCategory) return;
    setCatLoading(true);
    const { error } = await supabase.from('online_course_categories').insert({ name: newCategory, branch_id: branchId, session_id: currentSessionId, organization_id: organizationId });
    if (error) toast({ variant: 'destructive', title: 'Error' });
    else {
      setNewCategory('');
      fetchCategories();
      toast({ title: 'Category Added' });
    }
    setCatLoading(false);
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete category?')) return;
    const { error } = await supabase.from('online_course_categories').delete().eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Error' });
    else fetchCategories();
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        
        <Tabs defaultValue="category">
          <TabsList>
            <TabsTrigger value="category">Course Category</TabsTrigger>
            <TabsTrigger value="payment">Payment Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="category" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="h-fit">
                <CardHeader><CardTitle>Add Category</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Enter Category Name" />
                  </div>
                  <Button onClick={handleAddCategory} disabled={catLoading} className="w-full">
                    {catLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
                  </Button>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader><CardTitle>Category List</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {categories.length === 0 ? <TableRow><TableCell colSpan={2} className="text-center">No categories</TableCell></TableRow> :
                        categories.map(c => (
                          <TableRow key={c.id}>
                            <TableCell>{c.name}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteCategory(c.id)}><Trash2 className="h-4 w-4" /></Button>
                            </TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payment" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Payment Gateway Configuration</CardTitle></CardHeader>
              <CardContent>
                <p className="text-gray-500 text-sm">Payment gateway settings for online courses will be configured here. (Currently using System Payment Settings by default).</p>
                {/* Future implementation for specific course gateways if different from main system */}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Setting;
