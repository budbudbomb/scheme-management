'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// TODO: Replace with /dashboard/division-breakdown API
const DATA = [
  { division: 'Bhopal', fellows: 6, interns: 510 },
  { division: 'Indore', fellows: 8, interns: 680 },
  { division: 'Jabalpur', fellows: 6, interns: 510 },
  { division: 'Gwalior', fellows: 5, interns: 425 },
  { division: 'Ujjain', fellows: 5, interns: 425 },
  { division: 'Sagar', fellows: 5, interns: 425 },
  { division: 'Rewa', fellows: 5, interns: 425 },
  { division: 'Chambal', fellows: 4, interns: 340 },
  { division: 'Narmadapuram', fellows: 4, interns: 340 },
  { division: 'Shahdol', fellows: 4, interns: 340 },
];

export default function DivisionBreakdownChart() {
  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={DATA}
          margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
          barCategoryGap="30%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,93%)" vertical={false} />
          <XAxis
            dataKey="division"
            tick={{ fontSize: 10, fill: 'hsl(215,16%,55%)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'hsl(215,16%,55%)' }}
            tickLine={false}
            axisLine={false}
          />
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
            formatter={(v) => (
              <span style={{ fontSize: '11px', color: 'hsl(215,16%,47%)' }}>
                {v === 'fellows' ? 'Fellows' : 'Interns'}
              </span>
            )}
          />
          <Bar dataKey="fellows" fill="hsl(221,83%,53%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="interns" fill="hsl(160,84%,39%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
