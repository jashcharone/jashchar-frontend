import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Search, User } from 'lucide-react';

const ParentLoginCredentialReport = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const branchId = selectedBranch?.id || user?.profile?.branch_id;
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingOptions, setIsFetchingOptions] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      if (!branchId) return;
      setIsFetchingOptions(true);
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, name')
        .eq('branch_id', branchId)
        .order('name', { ascending: true });

      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('id, name')
        .eq('branch_id', branchId)
        .order('name', { ascending: true });

      if (classesError) {
        toast({ variant: 'destructive', title: 'Error fetching classes', description: classesError.message });
      } else {
        setClasses(classesData);
      }
      if (sectionsError) {
        toast({ variant: 'destructive', title: 'Error fetching sections', description: sectionsError.message });
      } else {
        setSections(sectionsData);
      }
      setIsFetchingOptions(false);
    };
    fetchOptions();
  }, [branchId, toast]);

  const handleSearch = async () => {
    if (!selectedClass || !selectedSection) {
      toast({ variant: 'destructive', title: 'Selection Required', description: 'Please select both a Class and a Section.' });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('student_profiles')
      .select('school_code, full_name, username, email') // Assuming parent username/password are tied to student profile for simplicity
      .eq('branch_id', branchId)
      .eq('class_id', selectedClass)
      .eq('section_id', selectedSection);

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching report', description: error.message });
      setReportData([]);
    } else {
      // For parent password, we'll use a placeholder as passwords are not stored directly
      // In a real scenario, this would involve a secure method to retrieve/reset parent passwords.
      const formattedData = data.map(student => ({
        admissionNo: student.school_code,
        studentName: student.full_name,
        parentUsername: student.username, // Assuming student username is used for parent login for now
        parentPassword: '********' // Placeholder for security
      }));
      setReportData(formattedData);
      if (formattedData.length === 0) {
        toast({ title: 'No Data', description: 'No parent login credentials found for the selected class and section.' });
      }
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Parent Login Credential Report - Jashchar ERP</title>
        <meta name="description" content="View parent login credentials by class and section." />
      </Helmet>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Parent Login Credential Report</h1>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-6 h-6" />
            Filter Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="class-select">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass} disabled={isFetchingOptions}>
                <SelectTrigger id="class-select">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="section-select">Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection} disabled={isFetchingOptions}>
                <SelectTrigger id="section-select">
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(sec => (
                    <SelectItem key={sec.id} value={sec.id}>{sec.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSearch} disabled={loading || isFetchingOptions}>
              <Search className="mr-2 h-4 w-4" />
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Results</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading report data...</div>
          ) : reportData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3">Admission No</th>
                    <th scope="col" className="px-6 py-3">Student Name</th>
                    <th scope="col" className="px-6 py-3">Parent Username</th>
                    <th scope="col" className="px-6 py-3">Parent Password</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, index) => (
                    <tr key={index} className="bg-white dark:bg-gray-900 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 font-medium">{row.admissionNo}</td>
                      <td className="px-6 py-4">{row.studentName}</td>
                      <td className="px-6 py-4">{row.parentUsername}</td>
                      <td className="px-6 py-4">{row.parentPassword}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Use the filters above to generate the report.
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ParentLoginCredentialReport;
