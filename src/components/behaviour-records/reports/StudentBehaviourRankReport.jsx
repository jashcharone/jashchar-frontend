import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Eye, Loader2 } from 'lucide-react';
import ReportDetailsModal from './ReportDetailsModal';

const StudentBehaviourRankReport = ({ classes, sections, onClassChange, fetchData, loading }) => {
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [sessionType, setSessionType] = useState('all');
  const [filterType, setFilterType] = useState('lte'); // lte (<=) or gte (>=)
  const [pointValue, setPointValue] = useState('');
  const [reportData, setReportData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudentData, setSelectedStudentData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSearch = async () => {
    const data = await fetchData();
    if (!data) return;

    const studentMap = new Map();

    data.forEach(record => {
      const studentId = record.student_id;
      if (!studentId || !record.student) return;

      if (selectedClass !== 'all' && record.student.class_id !== selectedClass) return;
      if (selectedSection !== 'all' && record.student.section_id !== selectedSection) return;

      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          student: record.student,
          totalPoints: 0,
          records: []
        });
      }

      const entry = studentMap.get(studentId);
      entry.totalPoints += (record.incident?.point || 0);
      entry.records.push(record);
    });

    let aggregated = Array.from(studentMap.values());

    // Filter by points if value provided
    if (pointValue !== '') {
      const limit = parseInt(pointValue);
      aggregated = aggregated.filter(entry => 
        filterType === 'lte' ? entry.totalPoints <= limit : entry.totalPoints >= limit
      );
    }

    // Sort by points DESC for ranking
    aggregated.sort((a, b) => b.totalPoints - a.totalPoints);

    // Assign Rank
    aggregated = aggregated.map((entry, index) => ({ ...entry, rank: index + 1 }));

    setReportData(aggregated);
    setCurrentPage(1);
  };

  const handleShowDetails = (entry) => {
    setSelectedStudentData({
      title: `Incidents for ${entry.student.full_name} (Rank #${entry.rank})`,
      data: entry.records
    });
    setShowModal(true);
  };

  const paginatedData = reportData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(reportData.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end bg-slate-50 p-4 rounded-lg border">
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
            <SelectTrigger><SelectValue placeholder="Session" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Session</SelectItem>
              <SelectItem value="all">All Sessions</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="lte">Lesser Than Or Equal</SelectItem>
              <SelectItem value="gte">Greater Than Or Equal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Point</Label>
          <Input 
            type="number" 
            value={pointValue} 
            onChange={(e) => setPointValue(e.target.value)} 
            placeholder="Enter points" 
          />
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
              <TableHead>Rank</TableHead>
              <TableHead>Admission No</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Class (Section)</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Total Points</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((entry) => (
                <TableRow key={entry.rank}>
                  <TableCell className="font-bold">#{entry.rank}</TableCell>
                  <TableCell>{entry.student.admission_no}</TableCell>
                  <TableCell className="font-medium">{entry.student.full_name}</TableCell>
                  <TableCell>{entry.student.class?.name} ({entry.student.section?.name})</TableCell>
                  <TableCell>{entry.student.gender}</TableCell>
                  <TableCell>{entry.student.phone}</TableCell>
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
                  No data found.
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

export default StudentBehaviourRankReport;
