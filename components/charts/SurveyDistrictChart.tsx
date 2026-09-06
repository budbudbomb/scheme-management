'use client';

import { useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ArrowLeft, CaretRight } from '@phosphor-icons/react';

// ─── Data ────────────────────────────────────────────────────────────────────

interface RegionData {
  id: string;
  name: string;
  completed: number;
  inProgress: number;
  notStarted: number;
}

const DIVISIONS: RegionData[] = [
  { id: 'bhopal',        name: 'Bhopal',        completed: 420, inProgress: 95,  notStarted: 45  },
  { id: 'indore',        name: 'Indore',        completed: 480, inProgress: 120, notStarted: 80  },
  { id: 'jabalpur',     name: 'Jabalpur',     completed: 290, inProgress: 70,  notStarted: 90  },
  { id: 'gwalior',      name: 'Gwalior',      completed: 310, inProgress: 85,  notStarted: 65  },
  { id: 'sagar',        name: 'Sagar',        completed: 380, inProgress: 90,  notStarted: 50  },
  { id: 'ujjain',       name: 'Ujjain',       completed: 340, inProgress: 88,  notStarted: 72  },
  { id: 'rewa',         name: 'Rewa',         completed: 250, inProgress: 60,  notStarted: 90  },
  { id: 'chambal',      name: 'Chambal',      completed: 185, inProgress: 55,  notStarted: 110 },
  { id: 'narmadapuram', name: 'Narmadapuram', completed: 200, inProgress: 50,  notStarted: 90  },
  { id: 'shahdol',      name: 'Shahdol',      completed: 165, inProgress: 45,  notStarted: 90  },
];

const DISTRICTS: Record<string, RegionData[]> = {
  bhopal: [
    { id: 'bhopal_d',  name: 'Bhopal',   completed: 142, inProgress: 28, notStarted: 10 },
    { id: 'sehore',    name: 'Sehore',   completed: 98,  inProgress: 34, notStarted: 18 },
    { id: 'raisen',    name: 'Raisen',   completed: 76,  inProgress: 41, notStarted: 23 },
    { id: 'vidisha',   name: 'Vidisha',  completed: 112, inProgress: 19, notStarted: 9  },
    { id: 'rajgarh',   name: 'Rajgarh',  completed: 65,  inProgress: 52, notStarted: 33 },
  ],
  indore: [
    { id: 'indore_d',  name: 'Indore',   completed: 148, inProgress: 32, notStarted: 20 },
    { id: 'dhar',      name: 'Dhar',     completed: 88,  inProgress: 28, notStarted: 24 },
    { id: 'jhabua',    name: 'Jhabua',   completed: 62,  inProgress: 22, notStarted: 16 },
    { id: 'khargone',  name: 'Khargone', completed: 94,  inProgress: 18, notStarted: 12 },
    { id: 'khandwa',   name: 'Khandwa',  completed: 72,  inProgress: 20, notStarted: 8  },
  ],
  jabalpur: [
    { id: 'jabalpur_d', name: 'Jabalpur', completed: 92, inProgress: 24, notStarted: 34 },
    { id: 'katni',      name: 'Katni',    completed: 68, inProgress: 18, notStarted: 24 },
    { id: 'mandla',     name: 'Mandla',   completed: 54, inProgress: 16, notStarted: 20 },
    { id: 'narsinghpur',name: 'Narsinghpur',completed:76,inProgress: 12, notStarted: 12 },
  ],
  gwalior: [
    { id: 'gwalior_d', name: 'Gwalior', completed: 112, inProgress: 24, notStarted: 14 },
    { id: 'morena',    name: 'Morena',   completed: 82,  inProgress: 22, notStarted: 26 },
    { id: 'bhind',     name: 'Bhind',    completed: 68,  inProgress: 20, notStarted: 12 },
    { id: 'datia',     name: 'Datia',    completed: 48,  inProgress: 19, notStarted: 13 },
  ],
  sagar: [
    { id: 'sagar_d',   name: 'Sagar',    completed: 120, inProgress: 28, notStarted: 12 },
    { id: 'chhatarpur',name: 'Chhatarpur',completed: 88, inProgress: 24, notStarted: 18 },
    { id: 'panna',     name: 'Panna',    completed: 64,  inProgress: 20, notStarted: 16 },
    { id: 'damoh',     name: 'Damoh',    completed: 72,  inProgress: 18, notStarted: 4  },
    { id: 'tikamgarh', name: 'Tikamgarh',completed: 36,  inProgress: 10, notStarted: 14 },
  ],
  ujjain: [
    { id: 'ujjain_d',  name: 'Ujjain',   completed: 104, inProgress: 24, notStarted: 22 },
    { id: 'ratlam',    name: 'Ratlam',   completed: 82,  inProgress: 24, notStarted: 14 },
    { id: 'mandsaur',  name: 'Mandsaur', completed: 76,  inProgress: 22, notStarted: 16 },
    { id: 'neemuch',   name: 'Neemuch',  completed: 52,  inProgress: 14, notStarted: 12 },
    { id: 'shajapur',  name: 'Shajapur', completed: 60,  inProgress: 18, notStarted: 8  },
  ],
  rewa: [
    { id: 'rewa_d',    name: 'Rewa',     completed: 88,  inProgress: 22, notStarted: 30 },
    { id: 'satna',     name: 'Satna',    completed: 72,  inProgress: 18, notStarted: 30 },
    { id: 'sidhi',     name: 'Sidhi',    completed: 54,  inProgress: 12, notStarted: 24 },
    { id: 'singrauli', name: 'Singrauli',completed: 52,  inProgress: 14, notStarted: 14 },
  ],
  chambal: [
    { id: 'morena_c',  name: 'Morena',   completed: 68,  inProgress: 22, notStarted: 40 },
    { id: 'bhind_c',   name: 'Bhind',    completed: 58,  inProgress: 18, notStarted: 34 },
    { id: 'sheopur',   name: 'Sheopur',  completed: 59,  inProgress: 15, notStarted: 36 },
  ],
  narmadapuram: [
    { id: 'hoshangabad',name:'Hoshangabad',completed:88, inProgress: 22, notStarted: 30 },
    { id: 'betul',     name: 'Betul',    completed: 68,  inProgress: 18, notStarted: 34 },
    { id: 'harda',     name: 'Harda',    completed: 44,  inProgress: 10, notStarted: 26 },
  ],
  shahdol: [
    { id: 'shahdol_d', name: 'Shahdol',  completed: 60,  inProgress: 16, notStarted: 34 },
    { id: 'umaria',    name: 'Umaria',   completed: 54,  inProgress: 16, notStarted: 28 },
    { id: 'annupur',   name: 'Anuppur',  completed: 51,  inProgress: 13, notStarted: 28 },
  ],
};

const BLOCKS: Record<string, RegionData[]> = {
  bhopal_d: [
    { id: 'b1', name: 'Berasia',    completed: 38, inProgress: 8,  notStarted: 4  },
    { id: 'b2', name: 'Phanda',     completed: 34, inProgress: 6,  notStarted: 2  },
    { id: 'b3', name: 'Huzur',      completed: 42, inProgress: 10, notStarted: 3  },
    { id: 'b4', name: 'Kolua Kheri',completed: 28, inProgress: 4,  notStarted: 1  },
  ],
  sehore: [
    { id: 'b5', name: 'Sehore',     completed: 32, inProgress: 10, notStarted: 6  },
    { id: 'b6', name: 'Nasrullaganj',completed:28, inProgress: 12, notStarted: 6  },
    { id: 'b7', name: 'Ashta',      completed: 22, inProgress: 8,  notStarted: 4  },
    { id: 'b8', name: 'Budhni',     completed: 16, inProgress: 4,  notStarted: 2  },
  ],
  raisen: [
    { id: 'b9',  name: 'Raisen',    completed: 24, inProgress: 14, notStarted: 8  },
    { id: 'b10', name: 'Silwani',   completed: 18, inProgress: 12, notStarted: 8  },
    { id: 'b11', name: 'Gairatganj',completed: 20, inProgress: 10, notStarted: 5  },
    { id: 'b12', name: 'Sanchi',    completed: 14, inProgress: 5,  notStarted: 2  },
  ],
};

// ─── Colours ──────────────────────────────────────────────────────────────────
const C_COMPLETED  = '#162F5E';
const C_INPROGRESS = '#22d3ee';  // cyan-400
const C_NOTSTARTED = '#e2e8f0';  // slate-200

const TOOLTIP_STYLE = {
  borderRadius: '10px',
  border: '1px solid hsl(220,13%,91%)',
  fontSize: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + p.value, 0);
  return (
    <div style={TOOLTIP_STYLE} className="bg-white p-3 min-w-[140px]">
      <p className="font-bold text-slate-800 text-xs mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 text-xs mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
            <span className="text-slate-500">{p.name}</span>
          </div>
          <span className="font-bold text-slate-800">{p.value}</span>
        </div>
      ))}
      <div className="border-t border-slate-100 mt-2 pt-1 flex justify-between text-xs">
        <span className="text-slate-400">Total</span>
        <span className="font-black text-slate-800">{total}</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
type DrillLevel = 'division' | 'district' | 'block';

export default function SurveyDrillChart() {
  const [level, setLevel] = useState<DrillLevel>('division');
  const [selectedDivision, setSelectedDivision] = useState<RegionData | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<RegionData | null>(null);

  const currentData: RegionData[] = level === 'division'
    ? DIVISIONS
    : level === 'district' && selectedDivision
      ? DISTRICTS[selectedDivision.id] ?? []
      : level === 'block' && selectedDistrict
        ? BLOCKS[selectedDistrict.id] ?? []
        : [];

  const handleBarClick = useCallback((data: { activePayload?: Array<{ payload: RegionData }> }) => {
    const item = data?.activePayload?.[0]?.payload;
    if (!item) return;

    if (level === 'division') {
      if (DISTRICTS[item.id]) {
        setSelectedDivision(item);
        setLevel('district');
      }
    } else if (level === 'district') {
      if (BLOCKS[item.id]) {
        setSelectedDistrict(item);
        setLevel('block');
      }
    }
  }, [level]);

  const handleBack = () => {
    if (level === 'block') {
      setLevel('district');
      setSelectedDistrict(null);
    } else if (level === 'district') {
      setLevel('division');
      setSelectedDivision(null);
    }
  };

  const levelLabel = level === 'division' ? 'All Divisions'
    : level === 'district' ? selectedDivision?.name ?? 'Districts'
    : selectedDistrict?.name ?? 'Blocks';

  const nextLevelHint = level === 'division'
    ? 'Click a bar to drill down to districts'
    : level === 'district'
      ? 'Click a bar to drill down to blocks'
      : null;

  return (
    <div>
      {/* Breadcrumb + Back */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 flex-wrap">
          <button
            type="button"
            onClick={() => { setLevel('division'); setSelectedDivision(null); setSelectedDistrict(null); }}
            className={level === 'division' ? 'text-slate-800 font-bold cursor-default' : 'text-indigo-600 hover:underline cursor-pointer'}
          >
            Divisions
          </button>
          {selectedDivision && (
            <>
              <CaretRight size={12} className="text-slate-300" />
              <button
                type="button"
                onClick={() => { setLevel('district'); setSelectedDistrict(null); }}
                className={level === 'district' ? 'text-slate-800 font-bold cursor-default' : 'text-indigo-600 hover:underline cursor-pointer'}
              >
                {selectedDivision.name}
              </button>
            </>
          )}
          {selectedDistrict && (
            <>
              <CaretRight size={12} className="text-slate-300" />
              <span className="text-slate-800 font-bold">{selectedDistrict.name}</span>
            </>
          )}
        </div>
        {level !== 'division' && (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer transition-colors"
          >
            <ArrowLeft size={13} />
            Back
          </button>
        )}
      </div>

      {/* Level label */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{levelLabel}</p>
        {nextLevelHint && (
          <p className="text-[10px] text-slate-300 italic">{nextLevelHint}</p>
        )}
      </div>

      {/* Chart */}
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={currentData}
            margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
            barSize={currentData.length <= 5 ? 32 : currentData.length <= 7 ? 24 : 18}
            onClick={handleBarClick}
            style={{ cursor: level !== 'block' ? 'pointer' : 'default' }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,93%)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: 'hsl(215,16%,55%)' }}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={currentData.length > 6 ? -30 : 0}
              textAnchor={currentData.length > 6 ? 'end' : 'middle'}
              height={currentData.length > 6 ? 40 : 24}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(215,16%,55%)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="completed"  name="Completed"   stackId="s" fill={C_COMPLETED}  radius={[0, 0, 0, 0]}>
              {currentData.map((_, i) => <Cell key={i} fill={C_COMPLETED} />)}
            </Bar>
            <Bar dataKey="inProgress" name="In Progress"  stackId="s" fill={C_INPROGRESS} radius={[0, 0, 0, 0]}>
              {currentData.map((_, i) => <Cell key={i} fill={C_INPROGRESS} />)}
            </Bar>
            <Bar dataKey="notStarted" name="To be Started" stackId="s" fill={C_NOTSTARTED} radius={[4, 4, 0, 0]}>
              {currentData.map((_, i) => <Cell key={i} fill={C_NOTSTARTED} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 justify-center">
        {[
          { color: C_COMPLETED,  label: 'Completed' },
          { color: C_INPROGRESS, label: 'In Progress' },
          { color: C_NOTSTARTED, label: 'To be Started' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block border border-slate-200" style={{ background: color }} />
            <span className="text-[11px] text-slate-500 font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
