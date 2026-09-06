'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Eye,
  User,
  Phone,
  MapPin,
  CalendarBlank,
  MagnifyingGlass,
  CheckCircle,
  Clock,
  ChatCircleText,
} from '@phosphor-icons/react';
import type { SurveyQuestion } from '@/types/models';

interface StakeholderRecord {
  id: string;
  fullName: string;
  contactInfo?: string;
  location?: string;
  interviewedAt: string;
  answers: Record<string, any>;
  isCurrentDraft?: boolean;
}

interface StakeholderResponsesPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyTitle: string;
  questions: SurveyQuestion[];
  currentStakeholder?: {
    name: string;
    contact?: string;
    location?: string;
    answers?: Record<string, any>;
  };
  totalInterviewedCount?: number;
}

// Generates representative field survey responses for preview
function getMockResponses(
  surveyTitle: string,
  questions: SurveyQuestion[],
  currentStakeholder?: {
    name: string;
    contact?: string;
    location?: string;
    answers?: Record<string, any>;
  }
): StakeholderRecord[] {
  const records: StakeholderRecord[] = [];

  // Add currently active participant if available with any inputs
  if (currentStakeholder && (currentStakeholder.name.trim() || Object.keys(currentStakeholder.answers || {}).length > 0)) {
    records.push({
      id: 'current-draft',
      fullName: currentStakeholder.name.trim() || 'Current Participant (Unsaved)',
      contactInfo: currentStakeholder.contact?.trim() || undefined,
      location: currentStakeholder.location?.trim() || undefined,
      interviewedAt: 'In Progress (Current)',
      answers: currentStakeholder.answers || {},
      isCurrentDraft: true,
    });
  }

  // Pre-loaded realistic field responses
  const sampleStakeholders = [
    { name: 'Ramesh Kumar Verma', contact: '+91 98765 43210', location: 'Gram Panchayat Pipariya, Block Hoshangabad', time: 'Today, 10:45 AM' },
    { name: 'Savita Devi', contact: '+91 98231 77412', location: 'Village Bori, Ward 3', time: 'Yesterday, 04:15 PM' },
    { name: 'Mohan Lal Patel', contact: '+91 97112 34567', location: 'Gram Tarana, Block Ujjain', time: '04 Sep 2026, 02:30 PM' },
    { name: 'Anita Sharma', contact: '+91 94250 88912', location: 'Khachrod Rural, Ward 5', time: '03 Sep 2026, 11:20 AM' },
    { name: 'Rajesh Verma', contact: '+91 91314 55678', location: 'Village Mahidpur', time: '02 Sep 2026, 03:50 PM' },
    { name: 'Kavita Bai', contact: '+91 96850 12345', location: 'Gram Unhel, Sector 2', time: '01 Sep 2026, 01:10 PM' },
  ];

  sampleStakeholders.forEach((s, idx) => {
    const dummyAnswers: Record<string, any> = {};
    questions.forEach((q, qIdx) => {
      if (q.type === 'single_choice' && q.options && q.options.length > 0) {
        dummyAnswers[q.id] = q.options[(idx + qIdx) % q.options.length];
      } else if (q.type === 'multiple_choice' && q.options && q.options.length > 0) {
        const o1 = q.options[idx % q.options.length];
        const o2 = q.options[(idx + 1) % q.options.length];
        dummyAnswers[q.id] = Array.from(new Set([o1, o2]));
      } else if (q.type === 'dichotomous') {
        const labels = q.dichotomousLabels || ['Yes', 'No'];
        dummyAnswers[q.id] = labels[idx % 2];
      } else if (q.type === 'likert_scale') {
        const pts = q.likertConfig?.points || 5;
        dummyAnswers[q.id] = ((idx + 2) % pts) + 1;
      } else {
        const notes = [
          'Adequate road access, but power cuts occur during peak afternoon hours.',
          'Benefited through SHG poultry linkage program; needs financial literacy workshop.',
          'Clean drinking water pipeline established under Har Ghar Jal mission.',
          'Requested additional health worker visits at local sub-centre.',
          'Pleased with direct benefit transfer speed on mobile.',
          'Satisfactory scheme coverage; community awareness is high.',
        ];
        dummyAnswers[q.id] = notes[idx % notes.length];
      }
    });

    records.push({
      id: `sample-${idx + 1}`,
      fullName: s.name,
      contactInfo: s.contact,
      location: s.location,
      interviewedAt: s.time,
      answers: dummyAnswers,
    });
  });

  return records;
}

export default function StakeholderResponsesPreviewModal({
  isOpen,
  onClose,
  surveyTitle,
  questions,
  currentStakeholder,
  totalInterviewedCount = 112,
}: StakeholderResponsesPreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while preview modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const allRecords = useMemo(() => {
    return getMockResponses(surveyTitle, questions, currentStakeholder);
  }, [surveyTitle, questions, currentStakeholder]);

  // By default all responses are collapsed (expandedRecordId starts null)

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return allRecords;
    const q = searchQuery.toLowerCase();
    return allRecords.filter(
      r =>
        r.fullName.toLowerCase().includes(q) ||
        (r.location && r.location.toLowerCase().includes(q)) ||
        (r.contactInfo && r.contactInfo.includes(q))
    );
  }, [allRecords, searchQuery]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="card max-w-2xl w-full max-h-[90dvh] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-2.5 bg-slate-50/90">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 shadow-2xs">
              <Eye size={22} weight="bold" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  Stakeholder Survey Responses
                </h2>
                <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0 whitespace-nowrap">
                  {totalInterviewedCount} Recorded
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">
                {surveyTitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0 ml-1"
            aria-label="Close"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100 bg-white">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by participant name, phone, or village..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            />
            <MagnifyingGlass size={16} className="absolute left-3 top-2.5 sm:top-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Responses List Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/40">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <User size={36} className="mx-auto text-slate-300" />
              <p className="text-sm font-medium">No stakeholder responses matched "{searchQuery}"</p>
            </div>
          ) : (
            filteredRecords.map((record, index) => {
              const isExpanded = expandedRecordId === record.id;
              const answeredCount = Object.keys(record.answers || {}).length;

              return (
                <div
                  key={record.id}
                  className={`rounded-xl border transition-all overflow-hidden bg-white ${
                    record.isCurrentDraft
                      ? 'border-indigo-300 ring-1 ring-indigo-200 shadow-xs'
                      : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  {/* Stakeholder Card Summary Header */}
                  <div
                    onClick={() => setExpandedRecordId(isExpanded ? null : record.id)}
                    className="p-3.5 sm:p-4 cursor-pointer flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        record.isCurrentDraft
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {record.fullName.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {record.fullName}
                          </h3>
                          {record.isCurrentDraft && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Current Draft
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                          {record.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} className="text-slate-400" />
                              <span className="truncate max-w-[180px]">{record.location}</span>
                            </span>
                          )}
                          {record.contactInfo && (
                            <span className="flex items-center gap-1">
                              <Phone size={11} className="text-slate-400" />
                              <span>{record.contactInfo}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {answeredCount} / {questions.length} answered
                      </span>
                      <span className="text-slate-400 text-xs font-bold">
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Questions & Answers */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-4 bg-slate-50/50 space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-200/60 pb-2">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock size={12} />
                          Interviewed: {record.interviewedAt}
                        </span>
                        <span>{questions.length} Questions</span>
                      </div>

                      <div className="space-y-2.5">
                        {questions.map((q, qNum) => {
                          const val = record.answers[q.id];
                          const hasAnswer = val !== undefined && val !== null && val !== '';

                          let displayVal = 'Not answered yet';
                          if (hasAnswer) {
                            if (Array.isArray(val)) {
                              displayVal = val.join(', ');
                            } else if (q.type === 'likert_scale') {
                              displayVal = `${val} / ${q.likertConfig?.points || 5} (${
                                Number(val) >= 4 ? 'High / Satisfied' : Number(val) === 3 ? 'Neutral' : 'Needs Improvement'
                              })`;
                            } else {
                              displayVal = String(val);
                            }
                          }

                          return (
                            <div key={q.id} className="p-3 rounded-xl bg-white border border-slate-200/70 shadow-2xs space-y-1">
                              <div className="text-xs font-semibold text-slate-800 leading-snug">
                                <span className="font-bold text-indigo-600 mr-1.5">Q{qNum + 1}.</span>
                                {q.question}
                              </div>
                              <div className="text-xs text-slate-600 pl-5 pt-0.5 flex items-start gap-1.5">
                                <ChatCircleText size={13} className="text-emerald-600 shrink-0 mt-0.5" weight="bold" />
                                <span className={hasAnswer ? 'font-medium text-slate-900' : 'italic text-slate-400'}>
                                  {displayVal}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredRecords.length} of {allRecords.length} stakeholder entries
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            Close Preview
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
