'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// TODO: Replace with /dashboard/task-completion API
const DATA = [
  { name: 'Completed', value: 1248, color: 'hsl(160,84%,39%)' },
  { name: 'In Progress', value: 856, color: 'hsl(199,89%,48%)' },
  { name: 'Pending', value: 432, color: 'hsl(38,92%,50%)' },
  { name: 'Overdue', value: 124, color: 'hsl(347,77%,50%)' },
];

export default function TaskCompletionChart() {
  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={DATA}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {DATA.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: '10px',
              border: '1px solid hsl(220,13%,91%)',
              fontSize: '12px',
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ fontSize: '11px', color: 'hsl(215,16%,47%)' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
