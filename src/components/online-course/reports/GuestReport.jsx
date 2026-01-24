import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Trash2, Printer, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const GuestReport = ({ branchId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (branchId) fetchData();
  }, [branchId]);

  const fetchData = async () => {
    setLoading(true);
    const { data: guests, error } = await supabase.from('guest_users').select('*').eq('branch_id', branchId).order('created_at', { ascending: false });
    if (!error) setData(guests || []);
    setLoading(false);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const { error } = await supabase.from('guest_users').update({ is_active: !currentStatus }).eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else {
      toast({ title: 'Status updated' });
      fetchData();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this guest user?')) return;
    const { error } = await supabase.from('guest_users').delete().eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Error' });
    else {
      toast({ title: 'Deleted' });
      fetchData();
    }
  };

  const filteredData = data.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (g.email && g.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4 flex justify-between items-center border-b">
          <Input placeholder="Search..." className="max-w-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          <Button variant="outline" size="icon" onClick={() => window.print()}><Printer className="h-4 w-4" /></Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow> :
              filteredData.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No guest users found</TableCell></TableRow> :
              filteredData.map(g => (
                <TableRow key={g.id}>
                  <TableCell>
                    <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                      {g.photo_url ? <img src={g.photo_url} alt="" className="h-full w-full object-cover" /> : <User className="h-4 w-4 text-gray-500" />}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell>{g.email || '-'}</TableCell>
                  <TableCell>{g.mobile || '-'}</TableCell>
                  <TableCell>{g.gender || '-'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{g.address || '-'}</TableCell>
                  <TableCell className="text-right flex justify-end items-center gap-2">
                    <Switch checked={g.is_active} onCheckedChange={() => handleToggleStatus(g.id, g.is_active)} />
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(g.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default GuestReport;
