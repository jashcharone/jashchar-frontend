/**
 * ParentNoticeBoard - View school notices
 */
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useParentChild } from '@/contexts/ParentChildContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const ParentNoticeBoard = () => {
  const { user } = useAuth();
  const { selectedChild } = useParentChild();
  const { toast } = useToast();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      const branchId = selectedChild?.branch_id || user?.profile?.branch_id;
      if (!branchId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('notice_board')
          .select('*')
          .eq('branch_id', branchId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setNotices(data || []);
      } catch (error) {
        console.error('Error fetching notices:', error);
        toast({ variant: 'destructive', title: 'Error loading notices', description: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, [selectedChild, user, toast]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Notice Board
        </h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : notices.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No notices available
          </Card>
        ) : (
          <div className="space-y-4">
            {notices.map(notice => (
              <Card key={notice.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{notice.title}</h3>
                      {notice.description && (
                        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{notice.description}</p>
                      )}
                      {notice.message && !notice.description && (
                        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{notice.message}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                      <Calendar className="h-3 w-3" />
                      <span>{notice.created_at ? format(new Date(notice.created_at), 'dd MMM yyyy') : '-'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ParentNoticeBoard;
