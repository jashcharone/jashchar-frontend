import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import DashboardLayout from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Trash2, Save, Database } from 'lucide-react';
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

const MasterTableEditor = ({ tableName, title, description }) => {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load data." });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [tableName]);

  const handleAdd = async () => {
    if (!newItem.trim()) return;
    setAdding(true);
    
    const { error } = await supabase
      .from(tableName)
      .insert([{ name: newItem.trim() }]);

    if (error) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: error.code === '23505' ? "This item already exists." : "Failed to add item." 
      });
    } else {
      toast({ title: "Success", description: "Item added successfully." });
      setNewItem('');
      fetchItems();
    }
    setAdding(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete item." });
    } else {
      toast({ title: "Success", description: "Item deleted successfully." });
      fetchItems();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <Input 
            placeholder={`Add new ${title.toLowerCase()}...`} 
            value={newItem} 
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={adding || !newItem.trim()}>
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span className="ml-2">Add</span>
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                <span className="font-medium">{item.name}</span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete "{item.name}" from the master list.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
            {items.length === 0 && <p className="text-muted-foreground col-span-full text-center py-4">No items found.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const MasterDataSettings = () => {
  return (
    <DashboardLayout>
      <div className="flex items-center gap-2 mb-6">
        <Database className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Master Data Settings</h1>
      </div>
      
      <Tabs defaultValue="religions" className="w-full space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0 justify-start">
          <TabsTrigger value="religions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">Religions</TabsTrigger>
          <TabsTrigger value="castes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">Castes</TabsTrigger>
          <TabsTrigger value="blood-groups" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">Blood Groups</TabsTrigger>
          <TabsTrigger value="mother-tongues" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">Mother Tongues</TabsTrigger>
          <TabsTrigger value="genders" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">Genders</TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="religions">
          <MasterTableEditor tableName="master_religions" title="Religions" description="Manage the list of religions available in dropdowns." />
        </TabsContent>
        
        <TabsContent value="castes">
          <MasterTableEditor tableName="master_castes" title="Castes" description="Manage the list of castes available in dropdowns." />
        </TabsContent>
        
        <TabsContent value="blood-groups">
          <MasterTableEditor tableName="master_blood_groups" title="Blood Groups" description="Manage the list of blood groups available in dropdowns." />
        </TabsContent>
        
        <TabsContent value="mother-tongues">
          <MasterTableEditor tableName="master_mother_tongues" title="Mother Tongues" description="Manage the list of mother tongues available in dropdowns." />
        </TabsContent>
        
        <TabsContent value="genders">
          <MasterTableEditor tableName="master_genders" title="Genders" description="Manage the list of genders available in dropdowns." />
        </TabsContent>

        <TabsContent value="documents">
          <MasterTableEditor tableName="master_documents" title="Documents" description="Manage the list of documents required for admission." />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default MasterDataSettings;
