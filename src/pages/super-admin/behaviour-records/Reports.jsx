import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';

// Tab Components
import StudentIncidentReport from '@/components/behaviour-records/reports/StudentIncidentReport';
import StudentBehaviourRankReport from '@/components/behaviour-records/reports/StudentBehaviourRankReport';
import ClassRankReport from '@/components/behaviour-records/reports/ClassRankReport';
import ClassSectionRankReport from '@/components/behaviour-records/reports/ClassSectionRankReport';
import HouseRankReport from '@/components/behaviour-records/reports/HouseRankReport';
import IncidentWiseReport from '@/components/behaviour-records/reports/IncidentWiseReport';

const Reports = () => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    if (user?.user_metadata?.branch_id) {
      fetchMeta();
    }
  }, [user, selectedBranch]);

  const fetchMeta = async () => {
    try {
      let query = supabase
        .from('classes')
        .select('id, name')
        .eq('branch_id', user.user_metadata.branch_id);

      if (selectedBranch) {
        query = query.eq('branch_id', selectedBranch.id);
      }

      const { data: classData } = await query;
      setClasses(classData || []);
    } catch (error) {
      console.error('Error fetching meta:', error);
    }
  };

  const fetchSections = async (classId) => {
    if (classId === 'all') {
      setSections([]);
      return;
    }
    try {
      const { data: classSectionsData } = await supabase
        .from('class_sections')
        .select('sections(id, name)')
        .eq('class_id', classId);

      setSections(classSectionsData ? classSectionsData.map(cs => cs.sections).filter(Boolean) : []);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('student_behaviour_incidents')
        .select(`
          *,
          student:student_profiles!student_behaviour_incidents_student_id_fkey(
            id, full_name, admission_no, gender, phone,
            class_id, section_id, house_id,
            class:classes!student_profiles_class_id_fkey(id, name),
            section:sections!student_profiles_section_id_fkey(id, name),
            house:student_houses!student_profiles_house_id_fkey(id, name)
          ),
          incident:behaviour_incidents!student_behaviour_incidents_incident_id_fkey(
            id, title, point, description
          )
        `)
        .eq('branch_id', user.user_metadata.branch_id);

      if (selectedBranch) {
        query = query.eq('branch_id', selectedBranch.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLoading(false);
      return data;
    } catch (error) {
      console.error('Error generating report:', error);
      toast({ variant: "destructive", title: "Error", description: error.message });
      setLoading(false);
      return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1400px] mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Behaviour Reports</h1>

        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="student_incident" className="w-full">
              <TabsList className="w-full justify-start mb-6 overflow-x-auto h-auto flex-wrap">
                <TabsTrigger value="student_incident">Student Incident Report</TabsTrigger>
                <TabsTrigger value="student_rank">Student Behaviour Rank Report</TabsTrigger>
                <TabsTrigger value="class_rank">Class Wise Rank Report</TabsTrigger>
                <TabsTrigger value="class_section_rank">Class Section Wise Rank Report</TabsTrigger>
                <TabsTrigger value="house_rank">House Wise Rank Report</TabsTrigger>
                <TabsTrigger value="incident_wise">Incident Wise Report</TabsTrigger>
              </TabsList>

              <TabsContent value="student_incident">
                <StudentIncidentReport 
                  classes={classes} 
                  sections={sections} 
                  onClassChange={fetchSections}
                  fetchData={fetchReportData}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent value="student_rank">
                <StudentBehaviourRankReport 
                  classes={classes} 
                  sections={sections} 
                  onClassChange={fetchSections}
                  fetchData={fetchReportData}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent value="class_rank">
                <ClassRankReport 
                  fetchData={fetchReportData}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent value="class_section_rank">
                <ClassSectionRankReport 
                  fetchData={fetchReportData}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent value="house_rank">
                <HouseRankReport 
                  fetchData={fetchReportData}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent value="incident_wise">
                <IncidentWiseReport 
                  fetchData={fetchReportData}
                  loading={loading}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
