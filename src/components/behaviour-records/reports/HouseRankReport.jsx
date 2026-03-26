import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Loader2 } from 'lucide-react';
import ReportDetailsModal from './ReportDetailsModal';

const HouseRankReport = ({ fetchData, loading }) => {
  const [reportData, setReportData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedData, setSelectedData] = useState(null);

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    const data = await fetchData();
    if (!data) return;

    const houseMap = new Map();

    data.forEach(record => {
      if (!record.student?.house?.id) return;
      const houseId = record.student.house.id;
      const houseName = record.student.house.name;

      if (!houseMap.has(houseId)) {
        houseMap.set(houseId, {
          id: houseId,
          name: houseName,
          totalPoints: 0,
          uniqueStudents: new Set(),
          records: []
        });
      }

      const entry = houseMap.get(houseId);
      entry.totalPoints += (record.incident?.point || 0);
      entry.uniqueStudents.add(record.student_id);
      entry.records.push(record);
    });

    let aggregated = Array.from(houseMap.values()).map(item => ({
      ...item,
      studentCount: item.uniqueStudents.size
    }));

    aggregated.sort((a, b) => b.totalPoints - a.totalPoints);
    aggregated = aggregated.map((entry, index) => ({ ...entry, rank: index + 1 }));

    setReportData(aggregated);
  };

  const handleShowDetails = (entry) => {
    setSelectedData({
      title: `Incidents for House: ${entry.name}`,
      data: entry.records
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {loading && <div className="flex justify-center"><Loader2 className="animate-spin" /></div>}
      
      {!loading && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>House</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Total Points</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.length > 0 ? (
                reportData.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-bold">#{entry.rank}</TableCell>
                    <TableCell>{entry.name}</TableCell>
                    <TableCell>{entry.studentCount}</TableCell>
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
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    No records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

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

export default HouseRankReport;
