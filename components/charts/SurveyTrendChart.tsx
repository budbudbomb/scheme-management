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

// Weekly survey target vs actual submissions — last 6 weeks
const WEEKLY_DATA = [
  { week: 'Wk 31', target: 420, achieved: 310 },
  { week: 'Wk 32', target: 420, achieved: 388 },
  { week: 'Wk 33', target: 420, achieved: 402 },
  { week: 'Wk 34', target: 420, achieved: 376 },
  { week: 'Wk 35', target: 420, achieved: 415 },
  { week: 'Wk 36', target: 420, achieved: 309 },
];

const TOOLTIP_STYLE = {
  borderRadius: '10px',
  border: '1px solid hsl(220,13%,91%)',
  fontSize: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

export default function SurveyWeeklyChart() {
  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={WEEKLY_DATA}
          margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          barGap={4}
          barSize={20}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,93%)" vertical={false} />
          <XAxis
            dataKey="week"
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
            contentStyle={TOOLTIP_STYLE}
            formatter={(val: number, name: string) => [
              val,
              name === 'target' ? 'Weekly Target' : 'Surveys Submitted',
            ]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ fontSize: '11px', color: 'hsl(215,16%,47%)' }}>
                {value === 'target' ? 'Weekly Target' : 'Surveys Submitted'}
              </span>
            )}
          />
          {/* Target — dashed look via low opacity fill + distinct color */}
          <Bar
            dataKey="target"
            fill="hsl(220,13%,88%)"
            radius={[4, 4, 0, 0]}
            name="target"
          />
          <Bar
            dataKey="achieved"
            fill="#162F5E"
            radius={[4, 4, 0, 0]}
            name="achieved"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
