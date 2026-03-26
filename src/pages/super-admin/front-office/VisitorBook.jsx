import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Plus, Pencil, Trash2, Eye, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import AddEditVisitorModal from '@/components/front-office/AddEditVisitorModal';
import ViewVisitorDetailsModal from '@/components/front-office/ViewVisitorDetailsModal';

const VisitorBook = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { toast } = useToast();
  const branchId = user?.user_metadata?.branch_id;
  
  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  useEffect(() => {
    if (branchId) fetchVisitors();
  }, [branchId]);

  const fetchVisitors = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('visitor_book')
      .select('*, purpose:front_office_purposes(purpose)')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });
    
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else setVisitors(data || []);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this visitor record?')) return;
    const { error } = await supabase.from('visitor_book').delete().eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else {
      toast({ title: 'Deleted successfully' });
      fetchVisitors();
    }
  };

  const filteredVisitors = visitors.filter(v => 
    v.visitor_name.toLowerCase().includes(search.toLowerCase()) || 
    v.phone?.includes(search) || 
    v.id_card?.includes(search)
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Visitor Book</h1>
          <Button onClick={() => { setSelectedVisitor(null); setModalOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Add Visitor</Button>
        </div>

        <div className="flex justify-end">
          <Input 
            placeholder="Search..." 
            className="max-w-xs" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Meeting With</TableHead>
                  <TableHead>Visitor Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>ID Card</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>In Time</TableHead>
                  <TableHead>Out Time</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
                ) : filteredVisitors.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8">No records found</TableCell></TableRow>
                ) : (
                  filteredVisitors.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.purpose?.purpose}</TableCell>
                      <TableCell className="capitalize">{item.meeting_with}</TableCell>
                      <TableCell className="font-medium">{item.visitor_name}</TableCell>
                      <TableCell>{item.phone}</TableCell>
                      <TableCell>{item.id_card}</TableCell>
                      <TableCell>{format(new Date(item.date), 'dd-MMM-yyyy')}</TableCell>
                      <TableCell>{item.in_time}</TableCell>
                      <TableCell>{item.out_time}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedVisitor(item); setViewModalOpen(true); }}><Eye className="h-4 w-4" /></Button>
                        {item.document_url && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={item.document_url} target="_blank" rel="noreferrer"><Download className="h-4 w-4" /></a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedVisitor(item); setModalOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AddEditVisitorModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        visitor={selectedVisitor} 
        branchId={branchId}
        sessionId={currentSessionId}
        organizationId={organizationId}
        onSave={fetchVisitors} 
      />

      <ViewVisitorDetailsModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        visitor={selectedVisitor}
      />
    </DashboardLayout>
  );
};

export default VisitorBook;
