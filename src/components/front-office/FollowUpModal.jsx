import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

const FollowUpModal = ({ isOpen, onClose, enquiry, onSave }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    next_follow_up_date: '',
    response: '',
    note: '',
    status: 'Active'
  });

  useEffect(() => {
    if (isOpen && enquiry) {
      fetchHistory();
      setFormData(prev => ({ ...prev, status: enquiry.status || 'Active' }));
    }
  }, [isOpen, enquiry]);

  const fetchHistory = async () => {
    const { data } = await supabase.from('admission_enquiry_followups')
      .select('*').eq('enquiry_id', enquiry.id).order('created_at', { ascending: false });
    setHistory(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.next_follow_up_date || !formData.response) {
      return toast({ variant: 'destructive', title: 'Required fields missing' });
    }

    setLoading(true);
    try {
      // Insert follow up
      const { error: followUpError } = await supabase.from('admission_enquiry_followups').insert({
        enquiry_id: enquiry.id,
        date: formData.date,
        next_follow_up_date: formData.next_follow_up_date,
        response: formData.response,
        note: formData.note,
        status: formData.status,
        created_by: (await supabase.auth.getUser()).data.user.id
      });
      if (followUpError) throw followUpError;

      // Update enquiry status and next follow up
      const { error: enquiryError } = await supabase.from('admission_enquiries').update({
        status: formData.status,
        next_follow_up_date: formData.next_follow_up_date
      }).eq('id', enquiry.id);
      if (enquiryError) throw enquiryError;

      toast({ title: 'Follow up saved' });
      onSave();
      onClose();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!enquiry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Follow Up Admission Enquiry</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-lg bg-slate-50">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Follow Up Date *</Label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Next Follow Up Date *</Label>
                  <Input type="date" value={formData.next_follow_up_date} onChange={e => setFormData({...formData, next_follow_up_date: e.target.value})} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Response *</Label>
                <Textarea value={formData.response} onChange={e => setFormData({...formData, response: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Note</Label>
                <Textarea value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Active', 'Passive', 'Won', 'Lost', 'Dead'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
              </div>
            </form>

            <div className="space-y-4">
              <h3 className="font-bold text-lg">Follow Up History</h3>
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {history.map(h => (
                  <div key={h.id} className="bg-white border rounded p-3 shadow-sm">
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                      <span>{format(new Date(h.date), 'dd-MMM-yyyy')}</span>
                      <span className="font-semibold text-blue-600">{h.status}</span>
                    </div>
                    <p className="text-sm text-gray-800">{h.response}</p>
                    <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Next: {format(new Date(h.next_follow_up_date), 'dd-MMM-yyyy')}
                    </div>
                  </div>
                ))}
                {history.length === 0 && <p className="text-sm text-gray-500 text-center">No history found.</p>}
              </div>
            </div>
          </div>

          <div className="md:col-span-1 bg-slate-100 p-4 rounded-lg h-fit">
            <h3 className="font-bold mb-4">Summary</h3>
            <div className="space-y-3 text-sm">
              <div><span className="font-semibold block">Name:</span> {enquiry.name}</div>
              <div><span className="font-semibold block">Phone:</span> {enquiry.phone}</div>
              <div><span className="font-semibold block">Email:</span> {enquiry.email || '-'}</div>
              <div><span className="font-semibold block">Address:</span> {enquiry.address || '-'}</div>
              <div><span className="font-semibold block">Class:</span> {enquiry.class?.name || '-'}</div>
              <div><span className="font-semibold block">Source:</span> {enquiry.source?.source || '-'}</div>
              <div><span className="font-semibold block">Reference:</span> {enquiry.reference?.reference || '-'}</div>
              <div><span className="font-semibold block">Enquiry Date:</span> {format(new Date(enquiry.date), 'dd-MMM-yyyy')}</div>
              <div><span className="font-semibold block">Description:</span> {enquiry.description || '-'}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FollowUpModal;
