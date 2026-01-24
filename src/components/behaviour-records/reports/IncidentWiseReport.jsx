import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Eye, Loader2 } from 'lucide-react';
import ReportDetailsModal from './ReportDetailsModal';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const IncidentWiseReport = ({ fetchData, loading }) => {
  const [sessionType, setSessionType] = useState('all');
  const [reportData, setReportData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedData, setSelectedData] = useState(null);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57'];

  const handleSearch = async () => {
    const data = await fetchData();
    if (!data) return;

    const incidentMap = new Map();

    data.forEach(record => {
      if (!record.incident?.id) return;
      const id = record.incident.id;
      const title = record.incident.title;

      if (!incidentMap.has(id)) {
        incidentMap.set(id, {
          id: id,
          name: title,
          uniqueStudents: new Set(),
          records: []
        });
      }

      const entry = incidentMap.get(id);
      entry.uniqueStudents.add(record.student_id);
      entry.records.push(record);
    });

    const aggregated = Array.from(incidentMap.values()).map(item => ({
      ...item,
      studentCount: item.uniqueStudents.size,
      value: item.uniqueStudents.size // for pie chart
    }));

    setReportData(aggregated);
  };

  const handleShowDetails = (entry) => {
    setSelectedData({
      title: `Students assigned with incident: ${entry.name}`,
      data: entry.records
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-lg border">
        <div className="space-y-2">
          <Label>Session</Label>
          <Select value={sessionType} onValueChange={setSessionType}>
            <SelectTrigger><SelectValue placeholder="Session" /></SelectTrigger>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incident</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.length > 0 ? (
                reportData.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.name}</TableCell>
                    <TableCell className="text-right">{entry.studentCount}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => handleShowDetails(entry)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                    No data found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {reportData.length > 0 && (
          <div className="h-[400px] w-full border rounded-md p-4">
            <h3 className="text-sm font-medium mb-4 text-center">Incident Performance</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {reportData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {showModal && selectedData && (
        <ReportDetailsModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedData.title}
          data={selectedData.data}
        />
      )}
    </div>
  );
};

export default IncidentWiseReport;
