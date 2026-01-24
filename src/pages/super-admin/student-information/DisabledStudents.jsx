import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search } from 'lucide-react';

const DisabledStudents = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Disabled Students</h1>

        <div className="bg-card rounded-lg shadow p-6 border">
          <div className="flex items-center mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input placeholder="Search disabled students..." className="pl-8" />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admission No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Father Name</TableHead>
                <TableHead>Disable Reason</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No disabled students found.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DisabledStudents;
