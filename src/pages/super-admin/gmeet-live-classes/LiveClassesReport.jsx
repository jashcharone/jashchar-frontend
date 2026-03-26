import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, List } from 'lucide-react';
import { format } from 'date-fns';
import JoinListModal from '@/components/gmeet/JoinListModal';

const LiveClassesReport = () => {
  const { user } = useAuth();
  const branchId = user?.user_metadata?.branch_id;

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({ class_id: '', section_id: '' });
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (branchId) fetchClasses();
  }, [branchId]);

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('id, name').eq('branch_id', branchId);
    setClasses(data || []);
  };

  useEffect(() => {
    if (filters.class_id) {
      const fetchSections = async () => {
        const { data } = await supabase.from('class_sections').select('sections(id, name)').eq('class_id', filters.class_id);
        setSections(data?.map(i => i.sections) || []);
      };
      fetchSections();
    } else {
      setSections([]);
    }
  }, [filters.class_id]);

  const handleSearch = async () => {
    setLoading(true);
    let query = supabase
      .from('gmeet_live_classes')
      .select('id, title, date, created_by, joins:gmeet_live_class_joins(count)')
      .eq('branch_id', branchId)
      .order('date', { ascending: false });

    if (filters.class_id) query = query.eq('class_id', filters.class_id);
    // Note: section filtering in JSONB is trickier, skipping for basic implementation or doing client side if needed.
    // Assuming basic filtering for now.

    const { data, error } = await query;
    if (!error) {
      setReports(data || []);
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Live Classes Report</h1>
        
        <Card>
          <CardHeader><CardTitle>Select Criteria</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={filters.class_id} onValueChange={v => setFilters({ ...filters, class_id: v, section_id: '' })}>
                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={filters.section_id} onValueChange={v => setFilters({ ...filters, section_id: v })} disabled={!filters.class_id}>
                <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Total Join</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
                ) : reports.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">No records found</TableCell></TableRow>
                ) : (
                  reports.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>{format(new Date(item.date), 'dd-MMM-yyyy HH:mm')}</TableCell>
                      <TableCell>Self</TableCell>
                      <TableCell>{item.joins?.[0]?.count || 0}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedClassId(item.id); setModalOpen(true); }}>
                          <List className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <JoinListModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        type="class" 
        itemId={selectedClassId} 
        branchId={branchId} 
      />
    </DashboardLayout>
  );
};

export default LiveClassesReport;
