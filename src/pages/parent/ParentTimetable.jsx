/**
 * ParentTimetable - View child's class timetable
 */
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ChildSelector from '@/components/ChildSelector';
import { useParentChild } from '@/contexts/ParentChildContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Clock, Calendar } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ParentTimetable = () => {
  const { selectedChild } = useParentChild();
  const { toast } = useToast();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimetable = async () => {
      if (!selectedChild?.id || !selectedChild?.branch_id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('class_timetable')
          .select(`
            id, day, start_time, end_time,
            subject:subjects(name, code),
            teacher:employee_profiles(full_name)
          `)
          .eq('branch_id', selectedChild.branch_id)
          .eq('class_id', selectedChild.class_id)
          .eq('section_id', selectedChild.section_id)
          .order('day')
          .order('start_time');

        if (error) throw error;
        setTimetable(data || []);
      } catch (error) {
        console.error('Error fetching timetable:', error);
        toast({ variant: 'destructive', title: 'Error loading timetable', description: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [selectedChild, toast]);

  const childName = selectedChild ? (selectedChild.full_name || `${selectedChild.first_name} ${selectedChild.last_name}`) : '';

  // Group by day
  const timetableByDay = DAYS.reduce((acc, day) => {
    acc[day] = timetable.filter(t => t.day?.toLowerCase() === day.toLowerCase());
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Class Timetable
        </h1>

        <ChildSelector />

        {!selectedChild ? (
          <Card className="p-8 text-center text-muted-foreground">No child selected</Card>
        ) : loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : timetable.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No timetable found for {childName}'s class
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Timetable for {selectedChild.class_name} {selectedChild.section_name ? `(${selectedChild.section_name})` : ''}
            </p>

            {DAYS.map(day => {
              const daySlots = timetableByDay[day];
              if (!daySlots || daySlots.length === 0) return null;

              return (
                <Card key={day}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">{day}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {daySlots.map(slot => (
                        <div key={slot.id} className="flex items-center gap-4 px-4 py-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground w-32 shrink-0">
                            <Clock className="h-4 w-4" />
                            <span>{slot.start_time || '?'} - {slot.end_time || '?'}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{slot.subject?.name || 'Free Period'}</p>
                            {slot.teacher?.full_name && (
                              <p className="text-sm text-muted-foreground">{slot.teacher.full_name}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ParentTimetable;
