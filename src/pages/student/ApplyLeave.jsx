import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send } from 'lucide-react';
import DatePicker from '@/components/ui/DatePicker';
import { format } from 'date-fns';

const ApplyLeave = () => {
    const { user, currentSessionId, organizationId } = useAuth();
    const { toast } = useToast();
    const [studentProfile, setStudentProfile] = useState(null);
    const [pastRequests, setPastRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        from_date: format(new Date(), 'yyyy-MM-dd'),
        to_date: format(new Date(), 'yyyy-MM-dd'),
        reason: '',
    });
    
    const branchId = user?.profile?.branch_id;

    const fetchData = useCallback(async () => {
        if (!branchId || !user) return;
        setLoading(true);
        try {
            // Get student's class_id and section_id from student_profiles
            const { data: profile } = await supabase
                .from('student_profiles')
                .select('id, class_id, section_id')
                .eq('id', user.id)
                .maybeSingle();
            
            setStudentProfile(profile);

            // Fetch past leave requests from student_leaves table
            const { data: requests, error } = await supabase
                .from('student_leaves')
                .select('*')
                .eq('student_id', user.id)
                .eq('branch_id', branchId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPastRequests(requests || []);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error fetching data', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [branchId, user, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInputChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.from_date || !formData.to_date || !formData.reason) {
            toast({ variant: 'destructive', title: 'All fields are required.' });
            return;
        }
        if (!studentProfile?.class_id || !studentProfile?.section_id) {
            toast({ variant: 'destructive', title: 'Student profile incomplete. Please contact admin.' });
            return;
        }
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('student_leaves').insert({
                branch_id: branchId,
                student_id: user.id,
                class_id: studentProfile.class_id,
                section_id: studentProfile.section_id,
                apply_date: format(new Date(), 'yyyy-MM-dd'),
                from_date: formData.from_date,
                to_date: formData.to_date,
                reason: formData.reason,
                status: 'Pending',
            });

            if (error) throw error;

            toast({ title: 'Success', description: 'Leave request submitted successfully.' });
            // Reset form and refresh list
            setFormData({
                from_date: format(new Date(), 'yyyy-MM-dd'),
                to_date: format(new Date(), 'yyyy-MM-dd'),
                reason: '',
            });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error submitting request', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const getStatusPill = (status) => {
        const baseClasses = 'px-2 py-0.5 text-xs font-medium rounded-full';
        const statusLower = status?.toLowerCase() || '';
        switch (statusLower) {
            case 'approved': return `${baseClasses} bg-green-100 text-green-800`;
            case 'rejected': return `${baseClasses} bg-red-100 text-red-800`;
            case 'pending': return `${baseClasses} bg-yellow-100 text-yellow-800`;
            default: return `${baseClasses} bg-gray-100 text-gray-800`;
        }
    };

    return (
        <DashboardLayout>
            <h1 className="text-3xl font-bold mb-6">Apply for Leave</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <CardHeader><CardTitle>New Leave Request</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <DatePicker label="From Date" value={formData.from_date} onChange={(d) => handleInputChange('from_date', d)} />
                                <DatePicker label="To Date" value={formData.to_date} onChange={(d) => handleInputChange('to_date', d)} />
                            </div>
                            <div>
                                <Label htmlFor="reason">Reason</Label>
                                <Textarea id="reason" placeholder="State your reason for leave..." value={formData.reason} onChange={(e) => handleInputChange('reason', e.target.value)} />
                            </div>
                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-4 w-4" />} Submit Request
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>My Leave History</CardTitle></CardHeader>
                    <CardContent>
                        {loading ? (
                             <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin" /></div>
                        ) : pastRequests.length > 0 ? (
                            <ul className="space-y-3">
                                {pastRequests.map(req => (
                                    <li key={req.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                        <div>
                                            <p className="font-bold">{format(new Date(req.from_date), 'MMM d')} - {format(new Date(req.to_date), 'MMM d, yyyy')}</p>
                                            <p className="text-xs text-gray-500 mt-1">{req.reason}</p>
                                        </div>
                                        <span className={getStatusPill(req.status)}>
                                            {req.status}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center p-8 text-gray-500">You haven't applied for any leave yet.</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default ApplyLeave;
