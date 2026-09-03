'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// TODO: Replace with real API data from /dashboard/attendance-trend
const MOCK_DATA = [
  { date: '1 Aug', present: 2100, absent: 200 },
  { date: '5 Aug', present: 2250, absent: 150 },
  { date: '10 Aug', present: 2180, absent: 220 },
  { date: '15 Aug', present: 2300, absent: 180 },
  { date: '20 Aug', present: 2190, absent: 210 },
  { date: '25 Aug', present: 2280, absent: 160 },
  { date: '30 Aug', present: 2350, absent: 140 },
];

export default function AttendanceTrendChart() {
  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={MOCK_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,93%)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'hsl(215,16%,55%)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(215,16%,55%)' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '10px',
              border: '1px solid hsl(220,13%,91%)',
              fontSize: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          />
          <Line
            type="monotone"
            dataKey="present"
            stroke="hsl(221,83%,53%)"
            strokeWidth={2}
            dot={false}
            name="Present"
          />
          <Line
            type="monotone"
            dataKey="absent"
            stroke="hsl(347,77%,50%)"
            strokeWidth={2}
            dot={false}
            name="Absent"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
