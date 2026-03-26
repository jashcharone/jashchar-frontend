import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const feeCollectionData = [
  { month: 'Jan', Collected: 50000, Due: 10000 },
  { month: 'Feb', Collected: 45000, Due: 15000 },
  { month: 'Mar', Collected: 60000, Due: 5000 },
  { month: 'Apr', Collected: 55000, Due: 8000 },
];

const FeeCollectionChart = () => {
  return (
    <div className="h-full w-full">
      <h2 className="text-xl font-bold text-foreground mb-4">Monthly Fee Collection</h2>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={feeCollectionData}>
             <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))"/>
            <YAxis stroke="hsl(var(--muted-foreground))"/>
            <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend />
            <Line type="monotone" dataKey="Collected" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }}/>
            <Line type="monotone" dataKey="Due" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FeeCollectionChart;
