import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserCog, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';

const AssignPrincipalModal = ({ open, onOpenChange, branch, onAssign, loading }) => {
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const branchName = branch?.name || branch?.branch_name || '';
  const currentPrincipalId = branch?.principal_user_id || branch?.principal_id || '';

  useEffect(() => {
    if (open && branch) {
      fetchStaff();
      setSelectedUserId(currentPrincipalId || 'none');
    }
  }, [open, branch]);

  const fetchStaff = async () => {
    setLoadingStaff(true);
    try {
      // Fetch staff who can be principals (teachers, admins, etc.)
      const response = await api.get('/staff', {
        params: { eligible_for_principal: true }
      });
      if (response.data.success) {
        setStaffList(response.data.data || []);
      }
    } catch (error) {
      console.log('Staff fetch failed:', error);
      // Fallback: try branch_users endpoint
      try {
        const fallback = await api.get('/school-users');
        if (fallback.data.success) {
          const eligibleStaff = (fallback.data.data || []).filter(
            u => ['teacher', 'admin', 'principal', 'vice_principal'].includes(u.role?.name || u.role)
          );
          setStaffList(eligibleStaff);
        }
      } catch (e) {
        console.log('Fallback also failed', e);
        setStaffList([]);
      }
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleAssign = () => {
    const userId = selectedUserId === 'none' ? null : selectedUserId;
    onAssign(branch.id, userId);
  };

  const filteredStaff = staffList.filter(staff => {
    const name = staff.full_name || staff.name || '';
    const email = staff.email || '';
    const term = searchTerm.toLowerCase();
    return name.toLowerCase().includes(term) || email.toLowerCase().includes(term);
  });

  const getInitials = (name) => {
    return (name || 'U')
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Assign Principal
          </DialogTitle>
          <DialogDescription>
            Select a staff member to be the principal of <strong>{branchName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Staff Selection */}
          <div className="space-y-2">
            <Label>Select Principal</Label>
            {loadingStaff ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="border rounded-md max-h-[300px] overflow-y-auto">
                {/* No Principal Option */}
                <div
                  className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 border-b ${
                    selectedUserId === 'none' ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                  }`}
                  onClick={() => setSelectedUserId('none')}
                >
                  <Avatar className="h-10 w-10 bg-muted">
                    <AvatarFallback>”</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-muted-foreground italic">No Principal</p>
                    <p className="text-xs text-muted-foreground">Remove principal assignment</p>
                  </div>
                </div>

                {/* Staff List */}
                {filteredStaff.length === 0 && !loadingStaff && (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No eligible staff found
                  </div>
                )}
                {filteredStaff.map((staff) => {
                  const staffId = staff.user_id || staff.id;
                  const isSelected = selectedUserId === staffId;
                  const isCurrent = currentPrincipalId === staffId;
                  
                  return (
                    <div
                      key={staffId}
                      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 border-b last:border-b-0 ${
                        isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                      }`}
                      onClick={() => setSelectedUserId(staffId)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={staff.avatar_url || staff.photo_url} />
                        <AvatarFallback>{getInitials(staff.full_name || staff.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{staff.full_name || staff.name}</p>
                          {isCurrent && (
                            <Badge variant="secondary" className="text-xs">Current</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{staff.email}</p>
                        {staff.role && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {typeof staff.role === 'string' ? staff.role : staff.role.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={loading || loadingStaff}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Principal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignPrincipalModal;
