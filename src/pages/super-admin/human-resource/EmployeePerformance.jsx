import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import hrApi from '@/services/hrApi';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Star, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

const EmployeePerformance = () => {
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newReview, setNewReview] = useState({
        employee_id: '',
        rating: 3,
        feedback: '',
        review_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (selectedBranch?.id) fetchData();
    }, [selectedBranch?.id]);

    const fetchData = async () => {
        if (!selectedBranch?.id) return;
        setLoading(true);
        try {
            const [staffRes, reviewsRes] = await Promise.all([
                hrApi.getPerformanceStaffList({ branchId: selectedBranch.id }),
                hrApi.getPerformanceReviews({ branchId: selectedBranch.id })
            ]);
            setStaffList(staffRes.data?.data || []);
            setReviews(reviewsRes.data?.data || []);
        } catch (err) {
            console.error('Failed to fetch performance data:', err);
        }
        setLoading(false);
    };

    const handleSubmit = async () => {
        if (!newReview.employee_id) {
            toast({ variant: 'destructive', title: 'Please select an employee' });
            return;
        }
        if (!selectedBranch?.id) {
            toast({ variant: 'destructive', title: 'Please select a branch' });
            return;
        }
        try {
            await hrApi.createPerformanceReview({
                ...newReview,
                branch_id: selectedBranch.id,
                reviewer_id: user.id
            });
            toast({ title: 'Success', description: 'Performance review added.' });
            setIsModalOpen(false);
            fetchData();
            setNewReview({ employee_id: '', rating: 3, feedback: '', review_date: new Date().toISOString().split('T')[0] });
        } catch (err) {
            toast({ variant: 'destructive', title: 'Failed to add review', description: err.message });
        }
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Employee Performance</h1>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4"/> Add Review</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add Performance Review</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Employee</Label>
                                <Select value={newReview.employee_id} onValueChange={v => setNewReview({...newReview, employee_id: v})}>
                                    <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                                    <SelectContent>{staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Rating (1-5)</Label>
                                <Select value={String(newReview.rating)} onValueChange={v => setNewReview({...newReview, rating: parseInt(v)})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{[1,2,3,4,5].map(r => <SelectItem key={r} value={r.toString()}>{r} Star{r > 1 ? 's' : ''}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Review Date</Label>
                                <Input type="date" value={newReview.review_date} onChange={e => setNewReview({...newReview, review_date: e.target.value})} />
                            </div>
                            <div>
                                <Label>Feedback</Label>
                                <Textarea value={newReview.feedback} onChange={e => setNewReview({...newReview, feedback: e.target.value})} placeholder="Enter feedback..." />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSubmit}>Save Review</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader><CardTitle>Performance Reviews</CardTitle></CardHeader>
                <CardContent>
                    {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin"/></div> : 
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Employee</th>
                                    <th className="px-6 py-3">Review Date</th>
                                    <th className="px-6 py-3">Rating</th>
                                    <th className="px-6 py-3">Feedback</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.length === 0 ? <tr><td colSpan="4" className="text-center p-4">No reviews found.</td></tr> : 
                                reviews.map(review => (
                                    <tr key={review.id} className="border-b hover:bg-muted/20">
                                        <td className="px-6 py-4 font-medium">{review.employee?.full_name}</td>
                                        <td className="px-6 py-4">{review.review_date}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-yellow-500">
                                                {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground italic">{review.feedback}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>}
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default EmployeePerformance;
