import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const JoinListModal = ({ isOpen, onClose, type, itemId, branchId }) => {
  const [joins, setJoins] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && itemId) {
      fetchJoins();
    } else {
      setJoins([]);
    }
  }, [isOpen, itemId, type]);

  const fetchJoins = async () => {
    setLoading(true);
    try {
      let data = [];
      if (type === 'class') {
        const res = await supabase
          .from('gmeet_live_class_joins')
          .select('join_time, student:student_profiles(full_name, enrollment_id, father_name)')
          .eq('live_class_id', itemId)
          .eq('branch_id', branchId);
        data = res.data?.map(j => ({
          name: j.student?.full_name,
          id_no: j.student?.enrollment_id,
          extra: j.student?.father_name,
          time: j.join_time
        })) || [];
      } else {
        const res = await supabase
          .from('gmeet_live_meeting_joins')
          .select('join_time, staff:employee_profiles(full_name, staff_id, role:roles(name))')
          .eq('live_meeting_id', itemId)
          .eq('branch_id', branchId);
        data = res.data?.map(j => ({
          name: j.staff?.full_name,
          id_no: j.staff?.staff_id || '-',
          extra: j.staff?.role?.name,
          time: j.join_time
        })) || [];
      }
      setJoins(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Join List</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
          ) : joins.length === 0 ? (
            <p className="text-center text-muted-foreground p-4">No join records found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{type === 'class' ? 'Enroll ID' : 'Staff ID'}</TableHead>
                  <TableHead>{type === 'class' ? 'Student Name' : 'Staff Name'}</TableHead>
                  <TableHead>{type === 'class' ? 'Father Name' : 'Role'}</TableHead>
                  <TableHead>Last Join</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {joins.map((j, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{j.id_no}</TableCell>
                    <TableCell className="font-medium">{j.name}</TableCell>
                    <TableCell>{j.extra}</TableCell>
                    <TableCell>{format(new Date(j.time), 'dd-MMM-yyyy HH:mm:ss')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JoinListModal;
