import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Printer, Search, FileDown } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const PrintAdmitCard = () => {
  const { branchId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  
  // Dropdown states
  const [examGroups, setExamGroups] = useState([]);
  const [exams, setExams] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [templates, setTemplates] = useState([]);

  // Selection states
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const componentRef = React.useRef();

  useEffect(() => {
    if (branchId) {
      fetchInitialData();
    }
  }, [branchId]);

  const fetchInitialData = async () => {
    try {
      const [groupsRes, sessionsRes, classesRes, templatesRes] = await Promise.all([
        supabase.from('exam_groups').select('*').eq('branch_id', branchId),
        supabase.from('sessions').select('*'), // Assuming global or school specific
        supabase.from('classes').select('*').eq('branch_id', branchId),
        supabase.from('admit_card_templates').select('*').eq('branch_id', branchId)
      ]);

      if (groupsRes.data) setExamGroups(groupsRes.data);
      if (sessionsRes.data) setSessions(sessionsRes.data);
      if (classesRes.data) setClasses(classesRes.data);
      if (templatesRes.data) setTemplates(templatesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleClassChange = async (classId) => {
    setSelectedClass(classId);
    const { data } = await supabase.from('sections').select('*').eq('branch_id', branchId);
    // In a real app, filter sections by class_sections table
    setSections(data || []);
  };

  const handleGroupChange = async (groupId) => {
    setSelectedGroup(groupId);
    const { data } = await supabase.from('exams').select('*').eq('exam_group_id', groupId);
    setExams(data || []);
  };

  const handleSearch = async () => {
    if (!selectedClass || !selectedSection) {
      toast({ title: "Error", description: "Please select Class and Section", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('branch_id', branchId)
        .eq('class_id', selectedClass)
        .eq('section_id', selectedSection);

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch students", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  const AdmitCardPreview = React.forwardRef((props, ref) => {
    const template = templates.find(t => t.id === selectedTemplate) || {};
    
    return (
      <div ref={ref} className="p-8 bg-white">
        {selectedStudents.map((studentId) => {
          const student = students.find(s => s.id === studentId);
          if (!student) return null;
          
          return (
            <div key={student.id} className="mb-8 border-2 border-gray-800 p-6 page-break-after-always max-w-3xl mx-auto">
              <div className="flex justify-between items-center mb-6 border-b-2 border-gray-800 pb-4">
                {template.left_logo && <img src={template.left_logo} alt="Logo" className="h-16 w-16 object-contain" />}
                <div className="text-center">
                  <h2 className="text-2xl font-bold uppercase">{template.school_name || "School Name"}</h2>
                  <h3 className="text-xl font-semibold">{template.exam_name || "Examination 2024"}</h3>
                  <p className="text-sm text-gray-600">{template.exam_center || "Exam Center"}</p>
                </div>
                {template.right_logo && <img src={template.right_logo} alt="Logo" className="h-16 w-16 object-contain" />}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="col-span-2 space-y-2">
                  <div className="flex"><span className="font-bold w-32">Name:</span> <span>{student.full_name}</span></div>
                  <div className="flex"><span className="font-bold w-32">Roll No:</span> <span>{student.roll_number}</span></div>
                  <div className="flex"><span className="font-bold w-32">Class:</span> <span>{classes.find(c => c.id === selectedClass)?.name}</span></div>
                  <div className="flex"><span className="font-bold w-32">Section:</span> <span>{sections.find(s => s.id === selectedSection)?.name}</span></div>
                </div>
                <div className="flex justify-end">
                  <div className="h-32 w-28 border border-gray-300 flex items-center justify-center bg-gray-50">
                    {student.photo_url ? <img src={student.photo_url} alt="Student" className="h-full w-full object-cover" /> : "Photo"}
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="font-bold mb-2 border-b border-gray-400">Exam Schedule</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left">Subject</th>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-left">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Mock schedule data as real schedule fetching is complex */}
                    <tr><td className="p-2 border-b">Mathematics</td><td className="p-2 border-b">10-12-2024</td><td className="p-2 border-b">09:00 AM</td></tr>
                    <tr><td className="p-2 border-b">Science</td><td className="p-2 border-b">12-12-2024</td><td className="p-2 border-b">09:00 AM</td></tr>
                    <tr><td className="p-2 border-b">English</td><td className="p-2 border-b">14-12-2024</td><td className="p-2 border-b">09:00 AM</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-end mt-12 pt-4">
                <div className="text-center">
                  {template.sign && <img src={template.sign} alt="Sign" className="h-10 mx-auto" />}
                  <p className="border-t border-gray-400 px-4 mt-1">Principal Signature</p>
                </div>
                <div className="text-center">
                  <p className="border-t border-gray-400 px-4 mt-1">Controller of Exam</p>
                </div>
              </div>
              
              {template.footer_text && <div className="mt-4 text-center text-xs text-gray-500">{template.footer_text}</div>}
            </div>
          );
        })}
      </div>
    );
  });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Print Admit Card</h1>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Select onValueChange={handleGroupChange}>
              <SelectTrigger><SelectValue placeholder="Exam Group" /></SelectTrigger>
              <SelectContent>{examGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select onValueChange={setSelectedExam}>
              <SelectTrigger><SelectValue placeholder="Select Exam" /></SelectTrigger>
              <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select onValueChange={setSelectedSession}>
              <SelectTrigger><SelectValue placeholder="Session" /></SelectTrigger>
              <SelectContent>{sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select onValueChange={handleClassChange}>
              <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select onValueChange={setSelectedSection}>
              <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
              <SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select onValueChange={setSelectedTemplate}>
              <SelectTrigger><SelectValue placeholder="Template" /></SelectTrigger>
              <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.template_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={handleSearch} disabled={loading} className="w-full md:w-auto">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Search
          </Button>
        </div>

        {students.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">Student List</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button disabled={selectedStudents.length === 0}>Generate Admit Card</Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Admit Card Preview</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <AdmitCardPreview ref={componentRef} />
                    <div className="flex justify-end gap-2 mt-4 sticky bottom-0 bg-white p-4 border-t">
                      <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
                      <Button onClick={handlePrint}><FileDown className="mr-2 h-4 w-4" /> Save as PDF</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedStudents.length === students.length}
                      onCheckedChange={(checked) => setSelectedStudents(checked ? students.map(s => s.id) : [])}
                    />
                  </TableHead>
                  <TableHead>Admission No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Father Name</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={(checked) => {
                          setSelectedStudents(prev => checked ? [...prev, student.id] : prev.filter(id => id !== student.id));
                        }}
                      />
                    </TableCell>
                    <TableCell>{student.school_code}</TableCell>
                    <TableCell>{student.full_name}</TableCell>
                    <TableCell>{student.father_name}</TableCell>
                    <TableCell>{student.gender}</TableCell>
                    <TableCell>{student.category_id}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PrintAdmitCard;
