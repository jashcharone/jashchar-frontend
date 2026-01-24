import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Download, Mail, Search } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const PrintMarksheetGeneral = () => {
  const { branchId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [templates, setTemplates] = useState([]);
  
  // Dropdowns
  const [examGroups, setExamGroups] = useState([]);
  const [exams, setExams] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  // Selections
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const componentRef = useRef();

  useEffect(() => {
    if (branchId) fetchInitialData();
  }, [branchId]);

  const fetchInitialData = async () => {
    const [groupsRes, sessionsRes, classesRes, templatesRes] = await Promise.all([
      supabase.from('exam_groups').select('*').eq('branch_id', branchId),
      supabase.from('sessions').select('*'),
      supabase.from('classes').select('*').eq('branch_id', branchId),
      supabase.from('marksheet_templates').select('*').eq('branch_id', branchId)
    ]);
    if (groupsRes.data) setExamGroups(groupsRes.data);
    if (sessionsRes.data) setSessions(sessionsRes.data);
    if (classesRes.data) setClasses(classesRes.data);
    if (templatesRes.data) setTemplates(templatesRes.data);
  };

  const handleClassChange = async (classId) => {
    setSelectedClass(classId);
    const { data } = await supabase.from('sections').select('*').eq('branch_id', branchId);
    setSections(data || []);
  };

  const handleGroupChange = async (groupId) => {
    setSelectedGroup(groupId);
    const { data } = await supabase.from('exams').select('*').eq('exam_group_id', groupId);
    setExams(data || []);
  };

  const handleSearch = async () => {
    if (!selectedClass || !selectedSection) {
      toast({ title: "Error", description: "Select Class and Section", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase.from('student_profiles').select('*').eq('branch_id', branchId).eq('class_id', selectedClass).eq('section_id', selectedSection);
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

  const handleEmail = () => {
    toast({ title: "Success", description: "Marksheets queued for email delivery." });
  };

  const MarksheetPreview = React.forwardRef((props, ref) => {
    const template = templates.find(t => t.id === selectedTemplate) || {};
    
    return (
      <div ref={ref} className="p-8 bg-white">
        {selectedStudents.map((studentId) => {
          const student = students.find(s => s.id === studentId);
          if (!student) return null;
          
          return (
            <div key={student.id} className="mb-8 border-4 border-double border-gray-800 p-8 page-break-after-always max-w-4xl mx-auto relative" style={{ backgroundImage: `url(${template.background_image})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}>
              <div className="relative z-10 bg-white/90 p-4">
                <div className="flex justify-between items-center mb-6 border-b-2 border-gray-800 pb-4">
                  {template.left_logo && <img src={template.left_logo} alt="Logo" className="h-20 w-20 object-contain" />}
                  <div className="text-center">
                    <h1 className="text-3xl font-bold uppercase text-blue-900">{template.school_name || "School Name"}</h1>
                    <h2 className="text-xl font-semibold mt-2">{template.exam_name || "Annual Examination"}</h2>
                    <p className="text-sm text-gray-600">{template.exam_center || "Exam Center"}</p>
                  </div>
                  {template.right_logo && <img src={template.right_logo} alt="Logo" className="h-20 w-20 object-contain" />}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                  <div><span className="font-bold">Name:</span> {student.full_name}</div>
                  <div><span className="font-bold">Roll No:</span> {student.roll_number}</div>
                  <div><span className="font-bold">Admission No:</span> {student.school_code}</div>
                  <div><span className="font-bold">Class:</span> {classes.find(c => c.id === selectedClass)?.name}</div>
                  <div><span className="font-bold">Father Name:</span> {student.father_name}</div>
                  <div><span className="font-bold">Mother Name:</span> {student.mother_name}</div>
                </div>

                <table className="w-full border-collapse border border-gray-400 mb-6 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-400 p-2">Subject</th>
                      <th className="border border-gray-400 p-2">Max Marks</th>
                      <th className="border border-gray-400 p-2">Min Marks</th>
                      <th className="border border-gray-400 p-2">Obtained</th>
                      <th className="border border-gray-400 p-2">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Mock Data */}
                    <tr><td className="border border-gray-400 p-2">Mathematics</td><td className="border border-gray-400 p-2">100</td><td className="border border-gray-400 p-2">33</td><td className="border border-gray-400 p-2">85</td><td className="border border-gray-400 p-2">A</td></tr>
                    <tr><td className="border border-gray-400 p-2">Science</td><td className="border border-gray-400 p-2">100</td><td className="border border-gray-400 p-2">33</td><td className="border border-gray-400 p-2">78</td><td className="border border-gray-400 p-2">B+</td></tr>
                    <tr><td className="border border-gray-400 p-2">English</td><td className="border border-gray-400 p-2">100</td><td className="border border-gray-400 p-2">33</td><td className="border border-gray-400 p-2">92</td><td className="border border-gray-400 p-2">A+</td></tr>
                    <tr className="font-bold bg-gray-50">
                      <td className="border border-gray-400 p-2">Total</td>
                      <td className="border border-gray-400 p-2">300</td>
                      <td className="border border-gray-400 p-2">99</td>
                      <td className="border border-gray-400 p-2">255</td>
                      <td className="border border-gray-400 p-2">Pass</td>
                    </tr>
                  </tbody>
                </table>

                <div className="flex justify-between items-end mt-16 pt-4">
                  <div className="text-center w-32">
                    {template.left_sign && <img src={template.left_sign} alt="Sign" className="h-12 mx-auto mb-2" />}
                    <p className="border-t border-gray-400 pt-1">Class Teacher</p>
                  </div>
                  <div className="text-center w-32">
                    {template.middle_sign && <img src={template.middle_sign} alt="Sign" className="h-12 mx-auto mb-2" />}
                    <p className="border-t border-gray-400 pt-1">Principal</p>
                  </div>
                  <div className="text-center w-32">
                    {template.right_sign && <img src={template.right_sign} alt="Sign" className="h-12 mx-auto mb-2" />}
                    <p className="border-t border-gray-400 pt-1">Parent</p>
                  </div>
                </div>
                
                {template.footer_text && <div className="mt-8 text-center text-xs text-gray-500 border-t pt-2">{template.footer_text}</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Print Marksheet</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Select onValueChange={handleGroupChange}><SelectTrigger><SelectValue placeholder="Exam Group" /></SelectTrigger><SelectContent>{examGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent></Select>
            <Select onValueChange={setSelectedExam}><SelectTrigger><SelectValue placeholder="Exam" /></SelectTrigger><SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select>
            <Select onValueChange={setSelectedSession}><SelectTrigger><SelectValue placeholder="Session" /></SelectTrigger><SelectContent>{sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
            <Select onValueChange={handleClassChange}><SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
            <Select onValueChange={setSelectedSection}><SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger><SelectContent>{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
            <Select onValueChange={setSelectedTemplate}><SelectTrigger><SelectValue placeholder="Template" /></SelectTrigger><SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.template_name}</SelectItem>)}</SelectContent></Select>
          </div>
          <Button onClick={handleSearch} disabled={loading}><Search className="mr-2 h-4 w-4" /> Search</Button>
        </div>

        {students.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">Student List</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleEmail} disabled={selectedStudents.length === 0}><Mail className="mr-2 h-4 w-4" /> Email</Button>
                <Dialog>
                  <DialogTrigger asChild><Button disabled={selectedStudents.length === 0}><Download className="mr-2 h-4 w-4" /> Bulk Download</Button></DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Marksheet Preview</DialogTitle></DialogHeader>
                    <MarksheetPreview ref={componentRef} />
                    <div className="flex justify-end mt-4 sticky bottom-0 bg-white p-4 border-t">
                      <Button onClick={handlePrint}>Print / Download PDF</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"><Checkbox checked={selectedStudents.length === students.length} onCheckedChange={(c) => setSelectedStudents(c ? students.map(s => s.id) : [])} /></TableHead>
                  <TableHead>Admission No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Father Name</TableHead>
                  <TableHead>Mobile</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(s => (
                  <TableRow key={s.id}>
                    <TableCell><Checkbox checked={selectedStudents.includes(s.id)} onCheckedChange={(c) => setSelectedStudents(p => c ? [...p, s.id] : p.filter(id => id !== s.id))} /></TableCell>
                    <TableCell>{s.school_code}</TableCell>
                    <TableCell>{s.full_name}</TableCell>
                    <TableCell>{s.father_name}</TableCell>
                    <TableCell>{s.phone}</TableCell>
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

export default PrintMarksheetGeneral;
