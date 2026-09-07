'use client';

import { useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
  PieChart, Pie, Cell, Sector,
  ReferenceLine,
  Cell as RCell,
} from 'recharts';
import { CaretDown, CaretRight, House } from '@phosphor-icons/react';
import { cn } from '@/lib/utils/formatters';

// ─── Survey options (shared) ─────────────────────────────────────────────────
const SURVEYS = [
  { id: 'all', label: 'All Surveys' },
  { id: 's1',  label: 'Livelihood Survey Q3' },
  { id: 's2',  label: 'Block Development Survey' },
  { id: 's3',  label: 'Health & Sanitation Survey' },
];

const TIP: React.CSSProperties = {
  borderRadius: '10px',
  border: '1px solid hsl(220,13%,91%)',
  fontSize: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  padding: '8px 12px',
};

const TARGET = 15;

// ─────────────────────────────────────────────────────────────────────────────
// Drill-down data: Division → District → Block
// Each entry has a stable `id` used as the key into the next level
// ─────────────────────────────────────────────────────────────────────────────
type DrillRow = { id: string; name: string; avgMin: number };

// Multipliers per survey so we only define the base data once
const SURVEY_MULT: Record<string, number> = { all: 1, s1: 0.88, s2: 1.14, s3: 0.78 };

function scale(base: number, surveyId: string) {
  return Math.round(base * (SURVEY_MULT[surveyId] ?? 1) * 10) / 10;
}

// Base division data (used as source for all surveys via multiplier)
const BASE_DIVISIONS: DrillRow[] = [
  { id: 'bhopal',       name: 'Bhopal',       avgMin: 14.8 },
  { id: 'indore',       name: 'Indore',       avgMin: 11.2 },
  { id: 'jabalpur',     name: 'Jabalpur',     avgMin: 13.5 },
  { id: 'gwalior',      name: 'Gwalior',      avgMin: 16.1 },
  { id: 'ujjain',       name: 'Ujjain',       avgMin: 18.3 },
  { id: 'sagar',        name: 'Sagar',        avgMin: 20.4 },
  { id: 'rewa',         name: 'Rewa',         avgMin: 12.7 },
  { id: 'chambal',      name: 'Chambal',      avgMin: 15.6 },
  { id: 'narmadapuram', name: 'Narmadapuram', avgMin: 17.2 },
];

// Base district data keyed by divisionId
const BASE_DISTRICTS: Record<string, DrillRow[]> = {
  bhopal:       [
    { id: 'bhopal-d',   name: 'Bhopal',   avgMin: 13.4 },
    { id: 'sehore',     name: 'Sehore',   avgMin: 15.1 },
    { id: 'raisen',     name: 'Raisen',   avgMin: 16.8 },
    { id: 'rajgarh',    name: 'Rajgarh',  avgMin: 14.2 },
    { id: 'vidisha',    name: 'Vidisha',  avgMin: 15.6 },
  ],
  indore:       [
    { id: 'indore-d',   name: 'Indore',   avgMin: 10.4 },
    { id: 'dhar',       name: 'Dhar',     avgMin: 12.8 },
    { id: 'khargone',   name: 'Khargone', avgMin: 11.5 },
    { id: 'khandwa',    name: 'Khandwa',  avgMin: 13.2 },
    { id: 'barwani',    name: 'Barwani',  avgMin: 14.1 },
  ],
  jabalpur:     [
    { id: 'jabalpur-d', name: 'Jabalpur', avgMin: 12.1 },
    { id: 'narsinghpur',name: 'Narsinghpur', avgMin: 13.7 },
    { id: 'chhindwara', name: 'Chhindwara', avgMin: 15.3 },
    { id: 'seoni',      name: 'Seoni',    avgMin: 14.8 },
  ],
  gwalior:      [
    { id: 'gwalior-d',  name: 'Gwalior',  avgMin: 15.2 },
    { id: 'shivpuri',   name: 'Shivpuri', avgMin: 17.4 },
    { id: 'datia',      name: 'Datia',    avgMin: 16.1 },
    { id: 'guna',       name: 'Guna',     avgMin: 15.8 },
  ],
  ujjain:       [
    { id: 'ujjain-d',   name: 'Ujjain',   avgMin: 17.6 },
    { id: 'dewas',      name: 'Dewas',    avgMin: 18.9 },
    { id: 'ratlam',     name: 'Ratlam',   avgMin: 19.2 },
    { id: 'mandsaur',   name: 'Mandsaur', avgMin: 17.8 },
  ],
  sagar:        [
    { id: 'sagar-d',    name: 'Sagar',    avgMin: 19.3 },
    { id: 'damoh',      name: 'Damoh',    avgMin: 20.8 },
    { id: 'panna',      name: 'Panna',    avgMin: 22.1 },
    { id: 'chhatarpur', name: 'Chhatarpur', avgMin: 21.4 },
  ],
  rewa:         [
    { id: 'rewa-d',     name: 'Rewa',     avgMin: 11.8 },
    { id: 'satna',      name: 'Satna',    avgMin: 13.4 },
    { id: 'sidhi',      name: 'Sidhi',    avgMin: 14.1 },
    { id: 'singrauli',  name: 'Singrauli',avgMin: 12.6 },
  ],
  chambal:      [
    { id: 'morena',     name: 'Morena',   avgMin: 14.8 },
    { id: 'bhind',      name: 'Bhind',    avgMin: 16.3 },
    { id: 'sheopur',    name: 'Sheopur',  avgMin: 15.9 },
  ],
  narmadapuram: [
    { id: 'hoshangabad',name: 'Hoshangabad', avgMin: 16.4 },
    { id: 'harda',      name: 'Harda',    avgMin: 18.2 },
    { id: 'betul',      name: 'Betul',    avgMin: 17.8 },
  ],
};

// Base block data keyed by districtId
const BASE_BLOCKS: Record<string, DrillRow[]> = {
  'bhopal-d':    [{ id: 'b1', name: 'Bhopal Urban', avgMin: 12.1 }, { id: 'b2', name: 'Phanda', avgMin: 14.2 }, { id: 'b3', name: 'Berasia', avgMin: 15.8 }],
  sehore:        [{ id: 'b4', name: 'Sehore Urban', avgMin: 13.9 }, { id: 'b5', name: 'Nasrullaganj', avgMin: 16.4 }, { id: 'b6', name: 'Budhni', avgMin: 15.2 }],
  raisen:        [{ id: 'b7', name: 'Raisen Urban', avgMin: 15.6 }, { id: 'b8', name: 'Gairatganj', avgMin: 17.1 }, { id: 'b9', name: 'Udaipura', avgMin: 18.3 }],
  rajgarh:       [{ id: 'b10', name: 'Rajgarh Urban', avgMin: 13.4 }, { id: 'b11', name: 'Biaora', avgMin: 14.8 }, { id: 'b12', name: 'Pachore', avgMin: 14.2 }],
  vidisha:       [{ id: 'b13', name: 'Vidisha Urban', avgMin: 14.6 }, { id: 'b14', name: 'Lateri', avgMin: 16.2 }, { id: 'b15', name: 'Gyaraspur', avgMin: 15.9 }],
  'indore-d':    [{ id: 'b16', name: 'Indore Urban', avgMin: 9.8 }, { id: 'b17', name: 'Mhow', avgMin: 11.4 }, { id: 'b18', name: 'Depalpur', avgMin: 12.6 }],
  dhar:          [{ id: 'b19', name: 'Dhar Urban', avgMin: 12.1 }, { id: 'b20', name: 'Badnawar', avgMin: 13.4 }, { id: 'b21', name: 'Kukshi', avgMin: 14.8 }],
  khargone:      [{ id: 'b22', name: 'Khargone Urban', avgMin: 10.8 }, { id: 'b23', name: 'Bhikangaon', avgMin: 12.5 }, { id: 'b24', name: 'Maheshwar', avgMin: 11.2 }],
  khandwa:       [{ id: 'b25', name: 'Khandwa Urban', avgMin: 12.4 }, { id: 'b26', name: 'Harsud', avgMin: 14.1 }, { id: 'b27', name: 'Khalwa', avgMin: 13.8 }],
  barwani:       [{ id: 'b28', name: 'Barwani Urban', avgMin: 13.2 }, { id: 'b29', name: 'Sendhwa', avgMin: 15.4 }, { id: 'b30', name: 'Anjad', avgMin: 14.6 }],
  'jabalpur-d':  [{ id: 'b31', name: 'Jabalpur Urban', avgMin: 11.4 }, { id: 'b32', name: 'Patan', avgMin: 13.2 }, { id: 'b33', name: 'Sihora', avgMin: 12.8 }],
  narsinghpur:   [{ id: 'b34', name: 'Narsinghpur Urban', avgMin: 12.9 }, { id: 'b35', name: 'Gadarwara', avgMin: 14.6 }],
  chhindwara:    [{ id: 'b36', name: 'Chhindwara Urban', avgMin: 14.1 }, { id: 'b37', name: 'Amarwara', avgMin: 16.8 }],
  seoni:         [{ id: 'b38', name: 'Seoni Urban', avgMin: 13.6 }, { id: 'b39', name: 'Lakhnadon', avgMin: 15.4 }],
  'gwalior-d':   [{ id: 'b40', name: 'Gwalior Urban', avgMin: 14.2 }, { id: 'b41', name: 'Dabra', avgMin: 16.8 }],
  shivpuri:      [{ id: 'b42', name: 'Shivpuri Urban', avgMin: 16.4 }, { id: 'b43', name: 'Kolaras', avgMin: 18.2 }],
  datia:         [{ id: 'b44', name: 'Datia Urban', avgMin: 15.1 }, { id: 'b45', name: 'Bhander', avgMin: 17.4 }],
  guna:          [{ id: 'b46', name: 'Guna Urban', avgMin: 14.8 }, { id: 'b47', name: 'Raghogarh', avgMin: 16.9 }],
  'ujjain-d':    [{ id: 'b48', name: 'Ujjain Urban', avgMin: 16.2 }, { id: 'b49', name: 'Khachrod', avgMin: 19.1 }],
  dewas:         [{ id: 'b50', name: 'Dewas Urban', avgMin: 17.6 }, { id: 'b51', name: 'Kannod', avgMin: 20.4 }],
  ratlam:        [{ id: 'b52', name: 'Ratlam Urban', avgMin: 18.4 }, { id: 'b53', name: 'Sailana', avgMin: 20.8 }],
  mandsaur:      [{ id: 'b54', name: 'Mandsaur Urban', avgMin: 16.9 }, { id: 'b55', name: 'Malhargarh', avgMin: 19.2 }],
  'sagar-d':     [{ id: 'b56', name: 'Sagar Urban', avgMin: 18.1 }, { id: 'b57', name: 'Khurai', avgMin: 21.4 }],
  damoh:         [{ id: 'b58', name: 'Damoh Urban', avgMin: 19.4 }, { id: 'b59', name: 'Jabera', avgMin: 22.8 }],
  panna:         [{ id: 'b60', name: 'Panna Urban', avgMin: 20.8 }, { id: 'b61', name: 'Ajaigarh', avgMin: 24.1 }],
  chhatarpur:    [{ id: 'b62', name: 'Chhatarpur Urban', avgMin: 19.8 }, { id: 'b63', name: 'Nowgong', avgMin: 22.6 }],
  'rewa-d':      [{ id: 'b64', name: 'Rewa Urban', avgMin: 10.8 }, { id: 'b65', name: 'Teonthar', avgMin: 12.9 }],
  satna:         [{ id: 'b66', name: 'Satna Urban', avgMin: 12.4 }, { id: 'b67', name: 'Maihar', avgMin: 14.8 }],
  sidhi:         [{ id: 'b68', name: 'Sidhi Urban', avgMin: 13.2 }, { id: 'b69', name: 'Churhat', avgMin: 15.6 }],
  singrauli:     [{ id: 'b70', name: 'Singrauli Urban', avgMin: 11.6 }, { id: 'b71', name: 'Chitrangi', avgMin: 14.2 }],
  morena:        [{ id: 'b72', name: 'Morena Urban', avgMin: 13.8 }, { id: 'b73', name: 'Ambah', avgMin: 16.4 }],
  bhind:         [{ id: 'b74', name: 'Bhind Urban', avgMin: 15.1 }, { id: 'b75', name: 'Lahar', avgMin: 18.2 }],
  sheopur:       [{ id: 'b76', name: 'Sheopur Urban', avgMin: 14.6 }, { id: 'b77', name: 'Vijaypur', avgMin: 17.8 }],
  hoshangabad:   [{ id: 'b78', name: 'Hoshangabad Urban', avgMin: 15.2 }, { id: 'b79', name: 'Sohagpur', avgMin: 18.4 }],
  harda:         [{ id: 'b80', name: 'Harda Urban', avgMin: 16.8 }, { id: 'b81', name: 'Timarni', avgMin: 20.1 }],
  betul:         [{ id: 'b82', name: 'Betul Urban', avgMin: 16.4 }, { id: 'b83', name: 'Amla', avgMin: 19.8 }],
};

// Apply survey multiplier to a row array
function applyScale(rows: DrillRow[], surveyId: string): DrillRow[] {
  return rows.map(r => ({ ...r, avgMin: scale(r.avgMin, surveyId) }));
}

// ─── Bar colour helper ────────────────────────────────────────────────────────
function barColor(v: number) {
  if (v <= TARGET)     return '#10b981'; // emerald
  if (v <= TARGET + 3) return '#6366f1'; // indigo
  return '#f59e0b';                      // amber
}

// ─── Shared survey dropdown ───────────────────────────────────────────────────
function SurveyDropdown({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-2.5 pr-7 py-1.5 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 cursor-pointer transition-colors"
      >
        {SURVEYS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
      <CaretDown size={11} weight="bold" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}

// ─── Shared card wrapper (used by weekly & distribution) ─────────────────────
function Card({ title, subtitle, surveyId, onSurveyChange, children }: {
  title: string; subtitle: string; surveyId: string;
  onSurveyChange: (id: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-bold text-slate-900 text-sm leading-snug">{title}</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <SurveyDropdown value={surveyId} onChange={onSurveyChange} />
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card 1 — Drill-down: Division → District → Block (horizontal bar, 2-col wide)
// ─────────────────────────────────────────────────────────────────────────────
type DrillLevel = 'division' | 'district' | 'block';

interface DrillState {
  level: DrillLevel;
  divisionId?: string;
  divisionName?: string;
  districtId?: string;
  districtName?: string;
}

export function AvgTimeByDivisionCard() {
  const [surveyId, setSurveyId] = useState('all');
  const [drill, setDrill] = useState<DrillState>({ level: 'division' });

  // Compute current chart data based on drill level
  const chartData: DrillRow[] = (() => {
    if (drill.level === 'division') {
      return applyScale(BASE_DIVISIONS, surveyId);
    }
    if (drill.level === 'district' && drill.divisionId) {
      return applyScale(BASE_DISTRICTS[drill.divisionId] ?? [], surveyId);
    }
    if (drill.level === 'block' && drill.districtId) {
      return applyScale(BASE_BLOCKS[drill.districtId] ?? [], surveyId);
    }
    return [];
  })();

  const sortedData = [...chartData].sort((a, b) => a.avgMin - b.avgMin);
  const canDrillDown = drill.level !== 'block';

  const handleBarClick = useCallback((data: any) => {
    if (!canDrillDown || !data?.activePayload?.[0]) return;
    const row: DrillRow = data.activePayload[0].payload;

    if (drill.level === 'division') {
      setDrill({ level: 'district', divisionId: row.id, divisionName: row.name });
    } else if (drill.level === 'district') {
      setDrill({ ...drill, level: 'block', districtId: row.id, districtName: row.name });
    }
  }, [drill, canDrillDown]);

  const handleSurveyChange = (id: string) => {
    setSurveyId(id);
    setDrill({ level: 'division' }); // reset drill on survey change
  };

  const levelLabel = drill.level === 'division' ? 'Division' : drill.level === 'district' ? 'District' : 'Block';

  return (
    <div className="card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="font-bold text-slate-900 text-sm leading-snug">
            Avg Completion Time — {levelLabel} View
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {canDrillDown ? 'Click any bar to drill down · ' : ''}Sorted fastest → slowest · target {TARGET} min
          </p>
        </div>
        <SurveyDropdown value={surveyId} onChange={handleSurveyChange} />
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => setDrill({ level: 'division' })}
          className={cn(
            'flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors',
            drill.level === 'division'
              ? 'bg-indigo-50 text-indigo-700 cursor-default'
              : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer'
          )}
        >
          <House size={11} />
          <span>All Divisions</span>
        </button>

        {drill.divisionName && (
          <>
            <CaretRight size={11} className="text-slate-300 shrink-0" />
            <button
              type="button"
              onClick={() => setDrill({ level: 'district', divisionId: drill.divisionId, divisionName: drill.divisionName })}
              className={cn(
                'text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors',
                drill.level === 'district'
                  ? 'bg-indigo-50 text-indigo-700 cursor-default'
                  : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer'
              )}
            >
              {drill.divisionName}
            </button>
          </>
        )}

        {drill.districtName && (
          <>
            <CaretRight size={11} className="text-slate-300 shrink-0" />
            <span className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700">
              {drill.districtName}
            </span>
          </>
        )}
      </div>

      {/* Chart */}
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 0, right: 52, left: 8, bottom: 0 }}
            barSize={12}
            onClick={handleBarClick}
            style={{ cursor: canDrillDown ? 'pointer' : 'default' }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,93%)" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, Math.ceil(Math.max(...sortedData.map(d => d.avgMin)) / 5) * 5 + 2]}
              unit=" m"
              tick={{ fontSize: 10, fill: 'hsl(215,16%,55%)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={88}
              tick={{ fontSize: 10, fill: 'hsl(215,16%,47%)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={TIP}
              formatter={(v: number) => [`${v} min`, 'Avg Time']}
              cursor={{ fill: 'rgba(99,102,241,0.05)' }}
            />
            <ReferenceLine
              x={TARGET}
              stroke="#6366f1"
              strokeDasharray="5 3"
              strokeWidth={1.5}
              label={{ value: `${TARGET}m target`, fontSize: 9, fill: '#6366f1', position: 'insideTopRight' }}
            />
            <Bar
              dataKey="avgMin"
              name="Avg Time"
              radius={[0, 5, 5, 0]}
              label={{ position: 'right', fontSize: 10, fill: 'hsl(215,16%,45%)', formatter: (v: number) => `${v}m` }}
            >
              {sortedData.map((entry, i) => (
                <RCell key={i} fill={barColor(entry.avgMin)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend + drill hint */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          {[
            { color: 'bg-emerald-500', label: `≤ ${TARGET} min` },
            { color: 'bg-indigo-500',  label: `${TARGET}–${TARGET + 3} min` },
            { color: 'bg-amber-500',   label: `> ${TARGET + 3} min` },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
              <span className="text-[10px] text-slate-500">{label}</span>
            </div>
          ))}
        </div>
        {canDrillDown && (
          <span className="text-[10px] text-indigo-500 font-semibold">
            ↙ click a bar to drill into {drill.level === 'division' ? 'districts' : 'blocks'}
          </span>
        )}
        {drill.level === 'block' && (
          <span className="text-[10px] text-slate-400 italic">Block level — deepest view</span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card 2 — Weekly Trend (gradient area chart)
// ─────────────────────────────────────────────────────────────────────────────
const WEEKLY_DATA: Record<string, { week: string; avgMin: number }[]> = {
  all: [
    { week: 'Wk 1', avgMin: 19.4 }, { week: 'Wk 2', avgMin: 17.8 },
    { week: 'Wk 3', avgMin: 16.2 }, { week: 'Wk 4', avgMin: 15.5 },
    { week: 'Wk 5', avgMin: 14.9 }, { week: 'Wk 6', avgMin: 14.2 },
    { week: 'Wk 7', avgMin: 13.8 }, { week: 'Wk 8', avgMin: 13.1 },
  ],
  s1: [
    { week: 'Wk 1', avgMin: 16.2 }, { week: 'Wk 2', avgMin: 15.1 },
    { week: 'Wk 3', avgMin: 14.3 }, { week: 'Wk 4', avgMin: 13.8 },
    { week: 'Wk 5', avgMin: 12.9 }, { week: 'Wk 6', avgMin: 12.1 },
    { week: 'Wk 7', avgMin: 11.4 }, { week: 'Wk 8', avgMin: 10.8 },
  ],
  s2: [
    { week: 'Wk 1', avgMin: 22.1 }, { week: 'Wk 2', avgMin: 20.8 },
    { week: 'Wk 3', avgMin: 19.4 }, { week: 'Wk 4', avgMin: 18.2 },
    { week: 'Wk 5', avgMin: 17.5 }, { week: 'Wk 6', avgMin: 16.8 },
    { week: 'Wk 7', avgMin: 16.1 }, { week: 'Wk 8', avgMin: 15.4 },
  ],
  s3: [
    { week: 'Wk 1', avgMin: 14.2 }, { week: 'Wk 2', avgMin: 13.4 },
    { week: 'Wk 3', avgMin: 12.8 }, { week: 'Wk 4', avgMin: 12.1 },
    { week: 'Wk 5', avgMin: 11.6 }, { week: 'Wk 6', avgMin: 11.1 },
    { week: 'Wk 7', avgMin: 10.6 }, { week: 'Wk 8', avgMin: 10.2 },
  ],
};

export function WeeklyTrendCard() {
  const [surveyId, setSurveyId] = useState('all');
  const data = WEEKLY_DATA[surveyId] ?? WEEKLY_DATA.all;
  const delta = ((data[0]?.avgMin ?? 0) - (data[data.length - 1]?.avgMin ?? 0)).toFixed(1);

  return (
    <Card title="Weekly Completion Time Trend" subtitle="Avg minutes per week · dashed = 15 min target"
      surveyId={surveyId} onSurveyChange={setSurveyId}>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,93%)" />
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'hsl(215,16%,55%)' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(215,16%,55%)' }} tickLine={false} axisLine={false} unit=" m" domain={['auto', 'auto']} />
            <Tooltip contentStyle={TIP} formatter={(v: number) => [`${v} min`, 'Avg Time']} />
            <ReferenceLine y={15} stroke="#10b981" strokeDasharray="5 3" strokeWidth={1.5} />
            <Area type="monotone" dataKey="avgMin" stroke="#8b5cf6" strokeWidth={2.5}
              fill="url(#areaGrad)" dot={{ r: 3.5, fill: '#8b5cf6', strokeWidth: 0 }}
              activeDot={{ r: 5.5, fill: '#8b5cf6' }} name="Avg Time" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-violet-500" />
          <span className="text-[10px] text-slate-500">Avg completion time</span>
        </div>
        <p className="text-[11px] text-emerald-600 font-bold">↓ {delta} min over 8 weeks</p>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card 3 — Time Distribution (interactive donut)
// ─────────────────────────────────────────────────────────────────────────────
const DIST_DATA: Record<string, { name: string; value: number; color: string }[]> = {
  all: [{ name: '< 10 min', value: 15, color: '#10b981' }, { name: '10–15 min', value: 32, color: '#6366f1' }, { name: '15–20 min', value: 39, color: '#f59e0b' }, { name: '> 20 min', value: 14, color: '#f43f5e' }],
  s1:  [{ name: '< 10 min', value: 28, color: '#10b981' }, { name: '10–15 min', value: 41, color: '#6366f1' }, { name: '15–20 min', value: 24, color: '#f59e0b' }, { name: '> 20 min', value:  7, color: '#f43f5e' }],
  s2:  [{ name: '< 10 min', value:  8, color: '#10b981' }, { name: '10–15 min', value: 22, color: '#6366f1' }, { name: '15–20 min', value: 45, color: '#f59e0b' }, { name: '> 20 min', value: 25, color: '#f43f5e' }],
  s3:  [{ name: '< 10 min', value: 35, color: '#10b981' }, { name: '10–15 min', value: 42, color: '#6366f1' }, { name: '15–20 min', value: 18, color: '#f59e0b' }, { name: '> 20 min', value:  5, color: '#f43f5e' }],
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#0f172a" fontSize={20} fontWeight={800}>{payload.value}%</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#94a3b8" fontSize={10} fontWeight={600}>{payload.name}</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 16} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.4} />
    </g>
  );
};

const renderInactiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />;
};

export function TimeDistributionCard() {
  const [surveyId, setSurveyId] = useState('all');
  const [activeIndex, setActiveIndex] = useState(1);
  const data = DIST_DATA[surveyId] ?? DIST_DATA.all;

  return (
    <Card title="Completion Time Distribution" subtitle="% of surveys by duration bucket · hover a slice"
      surveyId={surveyId} onSurveyChange={setSurveyId}>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={80}
              dataKey="value" activeIndex={activeIndex}
              activeShape={renderActiveShape} inactiveShape={renderInactiveShape}
              onMouseEnter={(_, idx) => setActiveIndex(idx)} paddingAngle={3}>
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {data.map(({ name, value, color }) => (
          <div key={name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-slate-500 truncate">{name}</span>
            <span className="text-[10px] font-bold text-slate-800 ml-auto">{value}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
