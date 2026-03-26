import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Copy, Sheet, FileText, Printer } from 'lucide-react';
import { format } from 'date-fns';

const StudentListModal = ({ isOpen, onClose, title, students }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredStudents = students.filter(student => 
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.enrollment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.class_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="text-xl font-semibold text-gray-800">{title}</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Copy"><Copy className="h-3.5 w-3.5" /></Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Excel"><Sheet className="h-3.5 w-3.5" /></Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="CSV"><FileText className="h-3.5 w-3.5" /></Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Print"><Printer className="h-3.5 w-3.5" /></Button>
            </div>
          </div>

          <div className="border rounded-md flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50 sticky top-0">
                  <TableHead className="font-semibold text-gray-700">Enroll ID</TableHead>
                  <TableHead className="font-semibold text-gray-700">Student Name</TableHead>
                  <TableHead className="font-semibold text-gray-700">Class</TableHead>
                  <TableHead className="font-semibold text-gray-700">Father Name</TableHead>
                  <TableHead className="font-semibold text-gray-700">Date Of Birth</TableHead>
                  <TableHead className="font-semibold text-gray-700">Gender</TableHead>
                  <TableHead className="font-semibold text-gray-700">Mobile Number</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                      No records found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedStudents.map((student, idx) => (
                    <TableRow key={student.id || idx}>
                      <TableCell>{student.enrollment_id || '-'}</TableCell>
                      <TableCell className="font-medium">{student.full_name}</TableCell>
                      <TableCell>{student.class_name} ({student.section_name})</TableCell>
                      <TableCell>{student.father_name || '-'}</TableCell>
                      <TableCell>{student.dob ? format(new Date(student.dob), 'dd/MM/yyyy') : '-'}</TableCell>
                      <TableCell>{student.gender || '-'}</TableCell>
                      <TableCell>{student.phone || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="text-xs text-muted-foreground">
              Records: {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredStudents.length)} of {filteredStudents.length}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-gray-50">
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StudentListModal;
