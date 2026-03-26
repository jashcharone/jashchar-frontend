import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Eye, Loader2 } from 'lucide-react';
import ReportDetailsModal from './ReportDetailsModal';

const StudentIncidentReport = ({ classes, sections, onClassChange, fetchData, loading }) => {
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [sessionType, setSessionType] = useState('all'); // 'all' or 'current'
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudentData, setSelectedStudentData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSearch = async () => {
    const data = await fetchData();
    if (!data) return;

    // Aggregate by student
    const studentMap = new Map();

    data.forEach(record => {
      const studentId = record.student_id;
      if (!studentId || !record.student) return;

      // Filter checks
      if (selectedClass !== 'all' && record.student.class_id !== selectedClass) return;
      if (selectedSection !== 'all' && record.student.section_id !== selectedSection) return;

      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          student: record.student,
          totalIncidents: 0,
          totalPoints: 0,
          records: []
        });
      }

      const entry = studentMap.get(studentId);
      entry.totalIncidents += 1;
      entry.totalPoints += (record.incident?.point || 0);
      entry.records.push(record);
    });

    setReportData(Array.from(studentMap.values()));
    setCurrentPage(1);
  };

  const handleShowDetails = (studentEntry) => {
    setSelectedStudentData({
      title: `Incidents for ${studentEntry.student.full_name}`,
      data: studentEntry.records
    });
    setShowModal(true);
  };

  const paginatedData = reportData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(reportData.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-lg border">
        <div className="space-y-2">
          <Label>Class</Label>
          <Select value={selectedClass} onValueChange={(val) => { setSelectedClass(val); onClassChange(val); }}>
            <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Section</Label>
          <Select value={selectedSection} onValueChange={setSelectedSection} disabled={selectedClass === 'all'}>
            <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Session</Label>
          <Select value={sessionType} onValueChange={setSessionType}>
            <SelectTrigger><SelectValue placeholder="Select Session" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Session Points</SelectItem>
              <SelectItem value="all">All Session Points</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
          Search
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Enroll ID</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Class (Section)</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Total Incidents</TableHead>
              <TableHead>Total Points</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((entry, i) => (
                <TableRow key={i}>
                  <TableCell>{entry.student.enrollment_id}</TableCell>
                  <TableCell className="font-medium">{entry.student.full_name}</TableCell>
                  <TableCell>{entry.student.class?.name} ({entry.student.section?.name})</TableCell>
                  <TableCell>{entry.student.gender}</TableCell>
                  <TableCell>{entry.student.phone}</TableCell>
                  <TableCell>{entry.totalIncidents}</TableCell>
                  <TableCell>
                    <span className={entry.totalPoints < 0 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                      {entry.totalPoints}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => handleShowDetails(entry)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                  No data found or click Search to view.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
          <div className="flex items-center text-sm text-muted-foreground">Page {currentPage} of {totalPages}</div>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
        </div>
      )}

      {showModal && selectedStudentData && (
        <ReportDetailsModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedStudentData.title}
          data={selectedStudentData.data}
        />
      )}
    </div>
  );
};

export default StudentIncidentReport;
