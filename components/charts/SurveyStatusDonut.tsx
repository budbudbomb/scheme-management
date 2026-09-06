'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const DATA = [
  { name: 'Completed', value: 3240, color: '#162F5E' },
  { name: 'In Progress', value: 812, color: 'hsl(199,89%,48%)' },
  { name: 'Not Started', value: 448, color: 'hsl(220,13%,82%)' },
];

const TOOLTIP_STYLE = {
  borderRadius: '10px',
  border: '1px solid hsl(220,13%,91%)',
  fontSize: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

const total = DATA.reduce((s, d) => s + d.value, 0);
const pct = Math.round((DATA[0].value / total) * 100);

export default function SurveyStatusDonut() {
  return (
    <div className="h-[210px] relative">
      {/* Centre label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: 28 }}>
        <div className="text-center">
          <div className="text-2xl font-black text-slate-900">{pct}%</div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Done</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={DATA}
            cx="50%"
            cy="44%"
            innerRadius={56}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {DATA.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(val: number) => [`${val.toLocaleString('en-IN')} surveys`, '']}
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
