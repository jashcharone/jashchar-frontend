import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Plus, PhoneCall, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import AddEditAdmissionEnquiryModal from '@/components/front-office/AddEditAdmissionEnquiryModal';
import FollowUpModal from '@/components/front-office/FollowUpModal';

const AdmissionEnquiry = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const branchId = user?.user_metadata?.branch_id;
  
  const [loading, setLoading] = useState(true);
  const [enquiries, setEnquiries] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sources, setSources] = useState([]);
  
  const [filters, setFilters] = useState({
    class_id: 'all', source_id: 'all', from_date: '', to_date: '', status: 'all'
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  useEffect(() => {
    if (branchId) {
      fetchDropdowns();
      fetchEnquiries();
    }
  }, [branchId]);

  const fetchDropdowns = async () => {
    const [classRes, sourceRes] = await Promise.all([
      supabase.from('classes').select('*').eq('branch_id', branchId),
      supabase.from('front_office_sources').select('*').eq('branch_id', branchId)
    ]);
    setClasses(classRes.data || []);
    setSources(sourceRes.data || []);
  };

  const fetchEnquiries = async () => {
    setLoading(true);
    let query = supabase.from('admission_enquiries')
      .select('*, class:classes(name), source:front_office_sources(source), reference:front_office_references(reference)')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });

    if (filters.class_id !== 'all') query = query.eq('class_id', filters.class_id);
    if (filters.source_id !== 'all') query = query.eq('source_id', filters.source_id);
    if (filters.status !== 'all') query = query.eq('status', filters.status);
    if (filters.from_date) query = query.gte('date', filters.from_date);
    if (filters.to_date) query = query.lte('date', filters.to_date);

    const { data, error } = await query;
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else setEnquiries(data || []);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this enquiry?')) return;
    const { error } = await supabase.from('admission_enquiries').delete().eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else {
      toast({ title: 'Deleted successfully' });
      fetchEnquiries();
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admission Enquiry</h1>
          <Button onClick={() => { setSelectedEnquiry(null); setModalOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Add</Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Select Criteria</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={filters.class_id} onValueChange={v => setFilters({...filters, class_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={filters.source_id} onValueChange={v => setFilters({...filters, source_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {sources.map(s => <SelectItem key={s.id} value={s.id}>{s.source}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Enquiry From Date</Label><Input type="date" value={filters.from_date} onChange={e => setFilters({...filters, from_date: e.target.value})} /></div>
              <div className="space-y-2"><Label>Enquiry To Date</Label><Input type="date" value={filters.to_date} onChange={e => setFilters({...filters, to_date: e.target.value})} /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={v => setFilters({...filters, status: v})}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {['Active', 'Passive', 'Won', 'Lost', 'Dead'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={fetchEnquiries}>Search</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Enquiry Date</TableHead>
                  <TableHead>Next Follow Up</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
                ) : enquiries.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">No enquiries found</TableCell></TableRow>
                ) : (
                  enquiries.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.phone}</TableCell>
                      <TableCell>{item.source?.source}</TableCell>
                      <TableCell>{format(new Date(item.date), 'dd-MMM-yyyy')}</TableCell>
                      <TableCell>{item.next_follow_up_date ? format(new Date(item.next_follow_up_date), 'dd-MMM-yyyy') : '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${item.status === 'Won' ? 'bg-green-100 text-green-800' : item.status === 'Dead' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" title="Follow Up" onClick={() => { setSelectedEnquiry(item); setFollowUpModalOpen(true); }}><PhoneCall className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" onClick={() => { setSelectedEnquiry(item); setModalOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AddEditAdmissionEnquiryModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        enquiry={selectedEnquiry} 
        branchId={branchId} 
        onSave={fetchEnquiries} 
      />

      <FollowUpModal 
        isOpen={followUpModalOpen} 
        onClose={() => setFollowUpModalOpen(false)} 
        enquiry={selectedEnquiry} 
        onSave={fetchEnquiries}
      />
    </DashboardLayout>
  );
};

export default AdmissionEnquiry;
