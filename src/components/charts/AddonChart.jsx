import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: 'Timetable', value: 2 },
  { name: 'Attendance', value: 7 },
  { name: 'Staff', value: 1 },
  { name: 'Expense', value: 1 },
  { name: 'School Gallery', value: 1 },
  { name: 'Fees', value: 1 },
  { name: 'Staff Leave', value: 1 },
  { name: 'Lesson', value: 1 },
  { name: 'Exam', value: 1 },
  { name: 'Website', value: 1 },
  { name: 'Chat Module', value: 1 },
  { name: 'Transportation', value: 1 },
];

const colors = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f', 
  '#ffbb28', '#ff8c00', '#d0ed57', '#a4de6c', '#8dd1e1', '#83a6ed'
];

const AddonChart = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
            borderRadius: 'var(--radius)',
          }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default AddonChart;
