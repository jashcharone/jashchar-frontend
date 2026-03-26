import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const data = [
  { name: 'Jan', value: 1.5 },
  { name: 'Feb', value: 1.2 },
  { name: 'Mar', value: 2.0 },
  { name: 'Apr', value: 1.0 },
  { name: 'May', value: 0.8 },
  { name: 'Jun', value: 1.8 },
  { name: 'Jul', value: 0.0 },
  { name: 'Aug', value: 0.0 },
  { name: 'Sep', value: 0.0 },
  { name: 'Oct', value: 0.0 },
  { name: 'Nov', value: 0.0 },
  { name: 'Dec', value: 0.0 },
];

const TransactionChart = () => {
    const [year, setYear] = useState('2025');
  return (
      <div className="relative">
        <div className="absolute top-0 right-0 z-10">
             <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 'dataMax + 0.5']} tickFormatter={(value) => `${value.toFixed(2)}`} />
                <Tooltip 
                    contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                    }}
                />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
};

export default TransactionChart;
