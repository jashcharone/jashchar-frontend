import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const MultiClassStudent = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Multi Class Student</h1>

        <div className="bg-card rounded-lg shadow p-6 mb-6 border">
          <h2 className="text-lg font-semibold mb-4">Assign Multi Class</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Class 1</SelectItem>
                  <SelectItem value="2">Class 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Student</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student1">John Doe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-6">
            <Button>Search</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MultiClassStudent;
