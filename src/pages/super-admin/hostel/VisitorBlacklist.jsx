import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { formatDate } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Ban, Plus, Trash2, Loader2, Shield } from 'lucide-react';

const VisitorBlacklist = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;

  const [loading, setLoading] = useState(true);
  const [blacklist, setBlacklist] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ visitor_name: '', visitor_phone: '', reason: '' });

  const fetchBlacklist = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await api.get('/hostel-visitors/blacklist');
      if (res.data?.success) setBlacklist(res.data.data || []);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally { setLoading(false); }
  }, [branchId, toast]);

  useEffect(() => { fetchBlacklist(); }, [fetchBlacklist]);

  const handleAdd = async () => {
    if (!form.visitor_name || !form.visitor_phone || !form.reason) {
      toast({ variant: 'destructive', title: 'Fill all fields' });
      return;
    }
    setSaving(true);
    try {
      await api.post('/hostel-visitors/blacklist', form);
      toast({ title: 'Added to blacklist' });
      setShowAdd(false);
      setForm({ visitor_name: '', visitor_phone: '', reason: '' });
      fetchBlacklist();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally { setSaving(false); }
  };

  const handleRemove = async (blacklistId) => {
    if (!confirm('Remove this person from blacklist?')) return;
    try {
      await api.delete(`/hostel-visitors/blacklist/${blacklistId}`);
      toast({ title: 'Removed from blacklist' });
      fetchBlacklist();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold">🚫 Visitor Blacklist</h1>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add to Blacklist
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" /> Blacklisted Visitors
              <Badge variant="destructive" className="ml-2">{blacklist.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>
            ) : blacklist.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">No blacklisted visitors</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blacklist.map(b => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.visitor_name}</TableCell>
                      <TableCell>{b.visitor_phone}</TableCell>
                      <TableCell className="text-sm">{b.reason}</TableCell>
                      <TableCell className="text-xs">{formatDate(b.created_at)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleRemove(b.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add Dialog */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add to Blacklist</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Visitor Name *</Label>
                <Input value={form.visitor_name} onChange={e => setForm(prev => ({ ...prev, visitor_name: e.target.value }))} placeholder="Full Name" />
              </div>
              <div>
                <Label>Phone Number *</Label>
                <Input value={form.visitor_phone} onChange={e => setForm(prev => ({ ...prev, visitor_phone: e.target.value }))} placeholder="10-digit mobile" maxLength={10} />
              </div>
              <div>
                <Label>Reason *</Label>
                <Textarea value={form.reason} onChange={e => setForm(prev => ({ ...prev, reason: e.target.value }))} placeholder="Why is this person being blacklisted?" rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={saving} variant="destructive">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Ban className="w-4 h-4 mr-2" />}
                Blacklist
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default VisitorBlacklist;
