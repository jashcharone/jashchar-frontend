import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Loader2, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const NoticeBoard = () => {
    const { user } = useAuth();
    const { selectedBranch } = useBranch();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [noticeToDelete, setNoticeToDelete] = useState(null);

    const branchId = user?.profile?.branch_id;

    const fetchNotices = useCallback(async () => {
        if (!branchId) return;
        setLoading(true);
        let query = supabase
            .from('notices')
            .select('*')
            .eq('branch_id', branchId)
            .order('publish_on', { ascending: false });

        if (selectedBranch) {
            query = query.eq('branch_id', selectedBranch.id);
        }

        const { data, error } = await query;

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching notices', description: error.message });
        } else {
            setNotices(data);
        }
        setLoading(false);
    }, [branchId, selectedBranch, toast]);

    useEffect(() => {
        fetchNotices();
    }, [fetchNotices]);

    const handleDeleteClick = (notice) => {
        setNoticeToDelete(notice);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!noticeToDelete) return;

        const { error } = await supabase.from('notices').delete().eq('id', noticeToDelete.id);
        if (error) {
            toast({ variant: 'destructive', title: 'Error deleting notice', description: error.message });
        } else {
            toast({ title: 'Success', description: 'Notice deleted.' });
            fetchNotices();
        }
        setDeleteDialogOpen(false);
        setNoticeToDelete(null);
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Notice Board</h1>
                <Button onClick={() => navigate('/school-owner/communicate/compose')}>
                    <Plus className="mr-2 h-4 w-4" /> Add Notice
                </Button>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-4">Posted Notices</h2>
                {loading ? (
                    <div className="text-center py-10"><Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : notices.length === 0 ? (
                    <p className="text-center text-muted-foreground py-10">No notices posted yet.</p>
                ) : (
                    <div className="space-y-4">
                        {notices.map((notice) => (
                            <div key={notice.id} className="border p-4 rounded-lg flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-lg">{notice.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-1" dangerouslySetInnerHTML={{ __html: notice.message.substring(0, 150) + '...' }}></p>
                                    <div className="text-xs text-muted-foreground mt-2">
                                        <span>Publish On: {format(new Date(notice.publish_on), 'PPP')}</span>
                                        <span className="mx-2">|</span>
                                        <span>Notice Date: {format(new Date(notice.notice_date), 'PPP')}</span>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <Button variant="ghost" size="icon" onClick={() => navigate(`/school-owner/communicate/compose/${notice.id}`)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(notice)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                    </DialogHeader>
                    <p>This action cannot be undone. This will permanently delete the notice "{noticeToDelete?.title}".</p>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default NoticeBoard;
