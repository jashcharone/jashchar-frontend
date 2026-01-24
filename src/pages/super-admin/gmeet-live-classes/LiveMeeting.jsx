import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Play, Trash2, Search, Users } from 'lucide-react';
import { format } from 'date-fns';
import AddEditLiveMeetingModal from '@/components/gmeet/AddEditLiveMeetingModal';
import InvitedStaffModal from '@/components/gmeet/InvitedStaffModal';
import { Badge } from '@/components/ui/badge';

const LiveMeeting = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const branchId = user?.user_metadata?.branch_id;

  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState([]);
  const [filteredMeetings, setFilteredMeetings] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [invitedModalOpen, setInvitedModalOpen] = useState(false);
  const [selectedInvitedIds, setSelectedInvitedIds] = useState([]);

  useEffect(() => {
    if (branchId) fetchMeetings();
  }, [branchId]);

  useEffect(() => {
    const lowerSearch = search.toLowerCase();
    setFilteredMeetings(meetings.filter(m => m.title.toLowerCase().includes(lowerSearch)));
  }, [search, meetings]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gmeet_live_meetings')
        .select('*')
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) return;
    try {
      const { error } = await supabase.from('gmeet_live_meetings').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Deleted successfully' });
      fetchMeetings();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleStart = (url) => {
    window.open(url, '_blank');
  };

  const showInvited = (ids) => {
    setSelectedInvitedIds(ids || []);
    setInvitedModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Live Meetings</h1>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Live Meeting
          </Button>
        </div>

        <div className="flex justify-end">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search..." 
              className="pl-8" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meeting Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
                ) : filteredMeetings.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">No meetings found</TableCell></TableRow>
                ) : (
                  filteredMeetings.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>{format(new Date(item.date), 'dd-MMM-yyyy HH:mm')}</TableCell>
                      <TableCell>Self</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'Finished' ? 'secondary' : item.status === 'Cancelled' ? 'destructive' : 'default'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleStart(item.gmeet_url)}>
                          <Play className="mr-1 h-3 w-3" /> Start
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => showInvited(item.invited_staff_ids)}>
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="destructive" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
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

      <AddEditLiveMeetingModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        branchId={branchId} 
        onSave={fetchMeetings}
      />

      <InvitedStaffModal
        isOpen={invitedModalOpen}
        onClose={() => setInvitedModalOpen(false)}
        invitedIds={selectedInvitedIds}
        branchId={branchId}
      />
    </DashboardLayout>
  );
};

export default LiveMeeting;
