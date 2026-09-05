'use client';

import React, { useMemo } from 'react';
import { MapPin, ArrowRight, XCircle, Funnel, Buildings, HouseLine } from '@phosphor-icons/react';
import {
  MP_LOCATION_HIERARCHY,
  type LocationFilterState,
} from '@/lib/utils/locationData';
import { cn } from '@/lib/utils/formatters';

interface LocationHierarchyFilterProps {
  value: LocationFilterState;
  onChange: (filter: LocationFilterState) => void;
  filteredCount?: number;
  totalCount?: number;
}

export default function LocationHierarchyFilter({
  value,
  onChange,
  filteredCount,
  totalCount,
}: LocationHierarchyFilterProps) {
  // Find selected division object
  const selectedDivision = useMemo(() => {
    if (!value.division) return null;
    return MP_LOCATION_HIERARCHY.find(d => d.name === value.division) || null;
  }, [value.division]);

  // Available districts for selected division
  const availableDistricts = useMemo(() => {
    if (!selectedDivision) {
      // Return all districts across MP if no division chosen
      return MP_LOCATION_HIERARCHY.flatMap(d => d.districts || []);
    }
    return selectedDivision.districts || [];
  }, [selectedDivision]);

  // Find selected district object
  const selectedDistrict = useMemo(() => {
    if (!value.district) return null;
    return availableDistricts.find(dst => dst.name === value.district) || null;
  }, [value.district, availableDistricts]);

  // Available blocks for selected district
  const availableBlocks = useMemo(() => {
    if (!selectedDistrict) return [];
    return selectedDistrict.blocks || [];
  }, [selectedDistrict]);

  // Find selected block object
  const selectedBlock = useMemo(() => {
    if (!value.block) return null;
    return availableBlocks.find(b => b.name === value.block) || null;
  }, [value.block, availableBlocks]);

  // Available panchayats for selected block
  const availablePanchayats = useMemo(() => {
    if (!selectedBlock) return [];
    return selectedBlock.panchayats || [];
  }, [selectedBlock]);

  // Find selected panchayat object
  const selectedPanchayat = useMemo(() => {
    if (!value.gramPanchayat) return null;
    return availablePanchayats.find(p => p.name === value.gramPanchayat) || null;
  }, [value.gramPanchayat, availablePanchayats]);

  // Available villages for selected panchayat
  const availableVillages = useMemo(() => {
    if (!selectedPanchayat) return [];
    return selectedPanchayat.villages || [];
  }, [selectedPanchayat]);

  // Event Handlers (Stop at any stage, resetting downstream fields)
  const handleDivisionChange = (divisionName: string) => {
    if (!divisionName) {
      onChange({});
    } else {
      onChange({ division: divisionName });
    }
  };

  const handleDistrictChange = (districtName: string) => {
    if (!districtName) {
      onChange({ division: value.division });
    } else {
      // If division was not set, find it from the district
      let parentDiv = value.division;
      if (!parentDiv) {
        const foundDiv = MP_LOCATION_HIERARCHY.find(d =>
          d.districts?.some(dst => dst.name === districtName)
        );
        if (foundDiv) parentDiv = foundDiv.name;
      }
      onChange({ division: parentDiv, district: districtName });
    }
  };

  const handleBlockChange = (blockName: string) => {
    if (!blockName) {
      onChange({ division: value.division, district: value.district });
    } else {
      onChange({
        division: value.division,
        district: value.district,
        block: blockName,
      });
    }
  };

  const handlePanchayatChange = (panchayatName: string) => {
    if (!panchayatName) {
      onChange({
        division: value.division,
        district: value.district,
        block: value.block,
      });
    } else {
      onChange({
        division: value.division,
        district: value.district,
        block: value.block,
        gramPanchayat: panchayatName,
      });
    }
  };

  const handleVillageChange = (villageName: string) => {
    if (!villageName) {
      onChange({
        division: value.division,
        district: value.district,
        block: value.block,
        gramPanchayat: value.gramPanchayat,
      });
    } else {
      onChange({
        division: value.division,
        district: value.district,
        block: value.block,
        gramPanchayat: value.gramPanchayat,
        village: villageName,
      });
    }
  };

  const handleClear = () => {
    onChange({});
  };

  const isFiltered = Boolean(
    value.division || value.district || value.block || value.gramPanchayat || value.village
  );

  return (
    <div className="card p-3.5 sm:p-4 border border-slate-200/90 bg-white rounded-2xl shadow-xs space-y-3">
      {/* ── Header & Filter Title ── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Funnel size={15} weight="bold" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block leading-tight">
              Administrative Drilldown Filter
            </span>
            <span className="text-[11px] text-slate-400">
              Filter data by Division → District → Block → Gram Panchayat → Village (Stop at any stage)
            </span>
          </div>
        </div>

        {/* Clear & Count Indicator */}
        <div className="flex items-center gap-2">
          {filteredCount !== undefined && totalCount !== undefined && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              👥 <strong>{filteredCount}</strong> / {totalCount} Responses
            </span>
          )}

          {isFiltered && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <XCircle size={15} weight="bold" />
              <span>Reset to Statewide</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 5 Cascading Dropdowns (Responsive Grid) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {/* 1. Division */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            1. Division
          </label>
          <select
            value={value.division || ''}
            onChange={e => handleDivisionChange(e.target.value)}
            className="w-full text-xs font-medium py-1.5 px-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          >
            <option value="">All Divisions (MP)</option>
            {MP_LOCATION_HIERARCHY.map(d => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2. District */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            2. District
          </label>
          <select
            value={value.district || ''}
            onChange={e => handleDistrictChange(e.target.value)}
            className="w-full text-xs font-medium py-1.5 px-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          >
            <option value="">
              {value.division ? `All in ${value.division}` : 'All Districts'}
            </option>
            {availableDistricts.map(dst => (
              <option key={dst.id} value={dst.name}>
                {dst.name}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Block */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            3. Block
          </label>
          <select
            value={value.block || ''}
            onChange={e => handleBlockChange(e.target.value)}
            disabled={!value.district}
            className={cn(
              'w-full text-xs font-medium py-1.5 px-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500',
              !value.district
                ? 'bg-slate-100/60 text-slate-400 cursor-not-allowed'
                : 'bg-slate-50/50 hover:bg-white text-slate-800 cursor-pointer'
            )}
          >
            <option value="">
              {value.district ? `All in ${value.district}` : 'Select District first'}
            </option>
            {availableBlocks.map(b => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Gram Panchayat */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            4. Gram Panchayat
          </label>
          <select
            value={value.gramPanchayat || ''}
            onChange={e => handlePanchayatChange(e.target.value)}
            disabled={!value.block}
            className={cn(
              'w-full text-xs font-medium py-1.5 px-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500',
              !value.block
                ? 'bg-slate-100/60 text-slate-400 cursor-not-allowed'
                : 'bg-slate-50/50 hover:bg-white text-slate-800 cursor-pointer'
            )}
          >
            <option value="">
              {value.block ? `All in ${value.block}` : 'Select Block first'}
            </option>
            {availablePanchayats.map(p => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* 5. Village / Ward */}
        <div className="space-y-1 col-span-2 sm:col-span-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            5. Village / Ward
          </label>
          <select
            value={value.village || ''}
            onChange={e => handleVillageChange(e.target.value)}
            disabled={!value.gramPanchayat}
            className={cn(
              'w-full text-xs font-medium py-1.5 px-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500',
              !value.gramPanchayat
                ? 'bg-slate-100/60 text-slate-400 cursor-not-allowed'
                : 'bg-slate-50/50 hover:bg-white text-slate-800 cursor-pointer'
            )}
          >
            <option value="">
              {value.gramPanchayat ? `All in ${value.gramPanchayat}` : 'Select GP first'}
            </option>
            {availableVillages.map((v, vIdx) => (
              <option key={vIdx} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Active Breadcrumb Tag Strip ── */}
      <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 flex-wrap">
        <MapPin size={13} className="text-indigo-600 shrink-0" />
        <span className="font-bold text-slate-700">Active Scope:</span>
        {!isFiltered ? (
          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
            Statewide (All Madhya Pradesh)
          </span>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-semibold text-slate-800">
            {value.division && (
              <span className="bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-md border border-indigo-200">
                {value.division}
              </span>
            )}
            {value.district && (
              <>
                <ArrowRight size={10} className="text-slate-400" />
                <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200">
                  {value.district}
                </span>
              </>
            )}
            {value.block && (
              <>
                <ArrowRight size={10} className="text-slate-400" />
                <span className="bg-purple-50 text-purple-800 px-2 py-0.5 rounded-md border border-purple-200">
                  {value.block}
                </span>
              </>
            )}
            {value.gramPanchayat && (
              <>
                <ArrowRight size={10} className="text-slate-400" />
                <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                  {value.gramPanchayat}
                </span>
              </>
            )}
            {value.village && (
              <>
                <ArrowRight size={10} className="text-slate-400" />
                <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                  {value.village}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
