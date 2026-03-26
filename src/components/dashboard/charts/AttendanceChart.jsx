import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const attendanceData = [
  { name: 'Class A', Present: 95, Absent: 5 },
  { name: 'Class B', Present: 92, Absent: 8 },
  { name: 'Class C', Present: 88, Absent: 12 },
  { name: 'Class D', Present: 98, Absent: 2 },
  { name: 'Class E', Present: 90, Absent: 10 },
];

const AttendanceChart = () => {
  return (
    <div className="h-full w-full">
      <h2 className="text-xl font-bold text-foreground mb-4">Today's Attendance</h2>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={attendanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))"/>
            <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend />
            <Bar dataKey="Present" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Absent" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AttendanceChart;
