import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Printer, Download, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const ReportDetailsModal = ({ isOpen, onClose, title, data = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredData = data.filter(item => 
    item.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.incident?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.student?.enrollment_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <div className="flex items-center gap-2 mr-8">
            <Button variant="ghost" size="icon" title="Print">
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Export">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Total Records: {filteredData.length}
            </div>
          </div>

          <div className="rounded-md border flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enroll ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Class (Section)</TableHead>
                  <TableHead>House</TableHead>
                  <TableHead>Assigned Incident</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Point</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.length > 0 ? (
                  currentData.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>{record.student?.enrollment_id || '-'}</TableCell>
                      <TableCell className="font-medium">{record.student?.full_name}</TableCell>
                      <TableCell>
                        {record.student?.class?.name} ({record.student?.section?.name})
                      </TableCell>
                      <TableCell>{record.student?.house?.name || '-'}</TableCell>
                      <TableCell>{record.incident?.title}</TableCell>
                      <TableCell className="max-w-xs truncate" title={record.incident?.description}>
                        {record.incident?.description}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={record.incident?.point < 0 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                          {record.incident?.point}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                      No records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-end space-x-2 py-2">
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDetailsModal;
