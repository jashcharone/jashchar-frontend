import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useBranch } from '@/contexts/BranchContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { formatDate, formatDateTime } from '@/utils/dateUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, GraduationCap, IndianRupee, CalendarCheck, Heart, AlertTriangle,
  Award, FileText, Clock, BookOpen, Bus, BedDouble, UserPlus, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

const EVENT_TYPES = {
  admission: { icon: UserPlus, color: 'bg-blue-500', label: 'Admission' },
  fee_payment: { icon: IndianRupee, color: 'bg-green-500', label: 'Fee Payment' },
  attendance: { icon: CalendarCheck, color: 'bg-yellow-500', label: 'Attendance' },
  exam_result: { icon: BookOpen, color: 'bg-purple-500', label: 'Exam Result' },
  health: { icon: Heart, color: 'bg-pink-500', label: 'Health' },
  behavior: { icon: AlertTriangle, color: 'bg-red-500', label: 'Behavior' },
  document: { icon: FileText, color: 'bg-cyan-500', label: 'Document' },
  transport: { icon: Bus, color: 'bg-orange-500', label: 'Transport' },
  hostel: { icon: BedDouble, color: 'bg-indigo-500', label: 'Hostel' },
  achievement: { icon: Award, color: 'bg-amber-500', label: 'Achievement' },
  general: { icon: Clock, color: 'bg-gray-500', label: 'General' },
};

export default function StudentProfileTimeline({ studentId, student }) {
  const { selectedBranch } = useBranch();
  const { currentSessionId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [filterType, setFilterType] = useState('all');

  const branchId = selectedBranch?.id;

  const fetchEvents = useCallback(async () => {
    if (!studentId || !branchId) return;
    setLoading(true);
    const allEvents = [];

    try {
      // 1. Admission event
      if (student?.admission_date) {
        allEvents.push({
          type: 'admission',
          date: student.admission_date,
          title: 'Student Admitted',
          description: `Admitted to ${student.classes?.name || ''} ${student.sections?.name || ''}. Admission No: ${student.school_code || 'N/A'}`,
        });
      }

      // 2. Fee payments
      const { data: fees } = await supabase
        .from('fee_payments')
        .select('id, amount, payment_date, payment_mode, receipt_number')
        .eq('student_id', studentId)
        .eq('branch_id', branchId)
        .eq('status', 'completed')
        .order('payment_date', { ascending: false })
        .limit(20);
      (fees || []).forEach(f => {
        allEvents.push({
          type: 'fee_payment',
          date: f.payment_date,
          title: `Fee Payment - ₹${(f.amount || 0).toLocaleString('en-IN')}`,
          description: `Receipt: ${f.receipt_number || 'N/A'} | Mode: ${f.payment_mode || 'N/A'}`,
        });
      });

      // 3. Attendance notable events (absent days)
      const { data: absents } = await supabase
        .from('student_attendance')
        .select('date, status')
        .eq('student_id', studentId)
        .eq('branch_id', branchId)
        .in('status', ['absent', 'leave'])
        .order('date', { ascending: false })
        .limit(15);
      (absents || []).forEach(a => {
        allEvents.push({
          type: 'attendance',
          date: a.date,
          title: a.status === 'leave' ? 'Leave Taken' : 'Absent',
          description: `Student was ${a.status} on ${formatDate(a.date)}`,
        });
      });

      // 4. Exam results
      const { data: marks } = await supabase
        .from('exam_marks')
        .select('marks, created_at, exam_subjects(max_marks, subjects(name), exams(name))')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(15);
      (marks || []).forEach(m => {
        const subName = m.exam_subjects?.subjects?.name || 'Subject';
        const examName = m.exam_subjects?.exams?.name || 'Exam';
        const maxMarks = m.exam_subjects?.max_marks || 100;
        const pct = maxMarks > 0 ? Math.round(((m.marks || 0) / maxMarks) * 100) : 0;
        allEvents.push({
          type: 'exam_result',
          date: m.created_at,
          title: `${examName} - ${subName}`,
          description: `Scored ${m.marks || 0}/${maxMarks} (${pct}%)`,
        });
      });

      // 5. Health records
      const { data: health } = await supabase
        .from('student_health_records')
        .select('created_at, height_cm, weight_kg, bmi')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(5);
      (health || []).forEach(h => {
        allEvents.push({
          type: 'health',
          date: h.created_at,
          title: 'Health Check-up',
          description: `Height: ${h.height_cm || '-'}cm | Weight: ${h.weight_kg || '-'}kg | BMI: ${h.bmi || '-'}`,
        });
      });

      // 6. Behavior incidents
      const { data: behavior } = await supabase
        .from('student_behaviour_incidents')
        .select('incident_date, incident_type, severity, description')
        .eq('student_id', studentId)
        .order('incident_date', { ascending: false })
        .limit(10);
      (behavior || []).forEach(b => {
        allEvents.push({
          type: 'behavior',
          date: b.incident_date,
          title: `${b.incident_type || 'Incident'} (${b.severity || 'N/A'})`,
          description: b.description || 'Behavior incident recorded',
        });
      });

      // 7. Document submissions
      const { data: docs } = await supabase
        .from('student_document_submissions')
        .select('submitted_at, status, document_checklist_config(document_name)')
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false })
        .limit(10);
      (docs || []).forEach(d => {
        allEvents.push({
          type: 'document',
          date: d.submitted_at,
          title: `Document Submitted: ${d.document_checklist_config?.document_name || 'Document'}`,
          description: `Status: ${d.status || 'submitted'}`,
        });
      });

      // 8. Profile created
      if (student?.created_at) {
        allEvents.push({
          type: 'general',
          date: student.created_at,
          title: 'Profile Created',
          description: 'Student profile was created in the system',
        });
      }
    } catch (err) {
      console.error('Timeline fetch error:', err);
    }

    // Sort by date descending
    allEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
    setEvents(allEvents);
    setLoading(false);
  }, [studentId, branchId, student]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return events;
    return events.filter(e => e.type === filterType);
  }, [events, filterType]);

  // Group by month
  const groupedEvents = useMemo(() => {
    const groups = {};
    filteredEvents.forEach(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = { label, events: [] };
      groups[key].events.push(e);
    });
    return Object.values(groups);
  }, [filteredEvents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading timeline...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events ({events.length})</SelectItem>
            {Object.entries(EVENT_TYPES).map(([k, v]) => {
              const count = events.filter(e => e.type === k).length;
              if (count === 0) return null;
              return <SelectItem key={k} value={k}>{v.label} ({count})</SelectItem>;
            })}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="text-xs">{filteredEvents.length} events</Badge>
      </div>

      {/* Timeline */}
      {groupedEvents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No timeline events found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedEvents.map((group, gi) => (
            <div key={gi}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-0 bg-background py-1">{group.label}</h3>
              <div className="relative ml-4 border-l-2 border-muted pl-6 space-y-4">
                {group.events.map((event, ei) => {
                  const et = EVENT_TYPES[event.type] || EVENT_TYPES.general;
                  const Icon = et.icon;
                  return (
                    <div key={ei} className="relative">
                      {/* Dot on timeline */}
                      <div className={cn('absolute -left-[31px] w-4 h-4 rounded-full flex items-center justify-center', et.color)}>
                        <Icon className="h-2.5 w-2.5 text-white" />
                      </div>
                      {/* Event card */}
                      <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{event.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-3">
                            {formatDate(event.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
