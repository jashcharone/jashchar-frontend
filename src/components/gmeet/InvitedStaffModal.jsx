import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';

const InvitedStaffModal = ({ isOpen, onClose, invitedIds, branchId }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && invitedIds?.length > 0) {
      fetchStaff();
    } else {
      setStaff([]);
    }
  }, [isOpen, invitedIds]);

  const fetchStaff = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('employee_profiles')
      .select('id, full_name, role:roles(name), staff_id')
      .in('id', invitedIds)
      .eq('branch_id', branchId);
    setStaff(data || []);
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invited Staff</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
          ) : staff.length === 0 ? (
            <p className="text-center text-muted-foreground p-4">No staff found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Name</TableHead>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.full_name}</TableCell>
                    <TableCell>{s.staff_id || '-'}</TableCell>
                    <TableCell>{s.role?.name}</TableCell>
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

export default InvitedStaffModal;
