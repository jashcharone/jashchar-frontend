/**
 * ParentHomework - View child's homework assignments
 */
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ChildSelector from '@/components/ChildSelector';
import { useParentChild } from '@/contexts/ParentChildContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';

const ParentHomework = () => {
  const { selectedChild } = useParentChild();
  const { toast } = useToast();
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomework = async () => {
      if (!selectedChild?.id || !selectedChild?.branch_id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch homework assigned to child's class and section
        let query = supabase
          .from('homework')
          .select(`
            id, title, description, homework_date, submission_date, 
            created_at, document,
            class:classes(name),
            section:sections(name),
            subject:subjects(name)
          `)
          .eq('branch_id', selectedChild.branch_id)
          .eq('class_id', selectedChild.class_id)
          .order('homework_date', { ascending: false })
          .limit(50);

        if (selectedChild.section_id) {
          query = query.eq('section_id', selectedChild.section_id);
        }

        const { data, error } = await query;
        if (error) throw error;
        setHomework(data || []);
      } catch (error) {
        console.error('Error fetching homework:', error);
        toast({ variant: 'destructive', title: 'Error loading homework', description: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchHomework();
  }, [selectedChild, toast]);

  const childName = selectedChild ? (selectedChild.full_name || `${selectedChild.first_name} ${selectedChild.last_name}`) : '';

  const isOverdue = (submissionDate) => {
    if (!submissionDate) return false;
    return new Date(submissionDate) < new Date();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Homework
        </h1>

        <ChildSelector />

        {!selectedChild ? (
          <Card className="p-8 text-center text-muted-foreground">No child selected</Card>
        ) : loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : homework.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No homework found for {childName}
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Showing homework for {childName} - {selectedChild.class_name} {selectedChild.section_name ? `(${selectedChild.section_name})` : ''}</p>
            
            {homework.map(hw => (
              <Card key={hw.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {hw.subject?.name || 'General'}
                        </Badge>
                        {hw.submission_date && isOverdue(hw.submission_date) && (
                          <Badge variant="destructive" className="text-xs">Overdue</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg">{hw.title || 'Untitled Homework'}</h3>
                      {hw.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{hw.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:text-right shrink-0">
                      <div className="flex items-center gap-1 sm:justify-end">
                        <Calendar className="h-3 w-3" />
                        <span>Assigned: {hw.homework_date ? format(new Date(hw.homework_date), 'dd MMM yyyy') : '-'}</span>
                      </div>
                      {hw.submission_date && (
                        <div className="flex items-center gap-1 sm:justify-end">
                          <FileText className="h-3 w-3" />
                          <span>Due: {format(new Date(hw.submission_date), 'dd MMM yyyy')}</span>
                        </div>
                      )}
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

export default ParentHomework;
