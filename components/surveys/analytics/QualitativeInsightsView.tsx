'use client';

import React, { useState } from 'react';
import {
  Microphone,
  VideoCamera,
  Image as ImageIcon,
  ChatTeardropText,
  MapPin,
  Calendar,
  User,
  X,
  CaretLeft,
  CaretRight,
  Play,
  Pause,
  SpeakerHigh,
  FileText,
} from '@phosphor-icons/react';
import type { QuestionAnalytics, ParticipantDescriptiveResponse } from '@/lib/utils/surveyAnalytics';
import { cn } from '@/lib/utils/formatters';

interface QualitativeInsightsViewProps {
  analytics: QuestionAnalytics;
}

export default function QualitativeInsightsView({
  analytics,
}: QualitativeInsightsViewProps) {
  const responses = analytics.participantResponses || [];
  const [selectedResponse, setSelectedResponse] = useState<ParticipantDescriptiveResponse | null>(null);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'voice' | 'video' | 'image' | 'text'>('all');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const filteredResponses = responses.filter(r => {
    if (mediaFilter === 'all') return true;
    return r.responseType === mediaFilter;
  });

  const getMediaTypeIcon = (type: ParticipantDescriptiveResponse['responseType'], size = 12) => {
    switch (type) {
      case 'voice':
        return <Microphone size={size} weight="fill" className="text-amber-600" />;
      case 'video':
        return <VideoCamera size={size} weight="fill" className="text-purple-600" />;
      case 'image':
        return <ImageIcon size={size} weight="fill" className="text-emerald-600" />;
      case 'text':
      default:
        return <ChatTeardropText size={size} weight="fill" className="text-indigo-600" />;
    }
  };

  const getMediaTypeBadge = (type: ParticipantDescriptiveResponse['responseType']) => {
    switch (type) {
      case 'voice':
        return { label: 'Voice Note Recording', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'video':
        return { label: 'Video Interview', bg: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'image':
        return { label: 'Photo Document', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'text':
      default:
        return { label: 'Written Response', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
    }
  };

  const currentIndex = selectedResponse
    ? filteredResponses.findIndex(r => r.id === selectedResponse.id)
    : -1;

  const handleNext = () => {
    if (currentIndex >= 0 && currentIndex < filteredResponses.length - 1) {
      setSelectedResponse(filteredResponses[currentIndex + 1]);
      setIsPlayingAudio(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedResponse(filteredResponses[currentIndex - 1]);
      setIsPlayingAudio(false);
    }
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 p-1 sm:p-2 overflow-hidden">
      {/* ── Submissions & Filter Strip ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 pb-3 w-full min-w-0">
        <div className="min-w-0 flex-1">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Participant Responses ({responses.length})
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Click any participant circle to view voice note, video, image, or text response.
          </p>
        </div>

        {/* Media Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 max-w-full overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: `All (${responses.length})` },
            { id: 'voice', label: `🎙️ Voice (${responses.filter(r => r.responseType === 'voice').length})` },
            { id: 'video', label: `🎥 Video (${responses.filter(r => r.responseType === 'video').length})` },
            { id: 'image', label: `🖼️ Image (${responses.filter(r => r.responseType === 'image').length})` },
            { id: 'text', label: `📝 Text (${responses.filter(r => r.responseType === 'text').length})` },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMediaFilter(tab.id as any)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap',
                mediaFilter === tab.id
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid of Participant Circles (Bounded to 3 rows with visible scrollbar) ── */}
      {filteredResponses.length === 0 ? (
        <div className="py-8 px-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 my-2 space-y-2">
          <p className="text-xs font-bold text-slate-700">No participant responses match the current filter</p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            {responses.length === 0
              ? 'No qualitative submissions were recorded for this selected location. Try expanding the administrative location filter above.'
              : `No responses found for the "${mediaFilter.toUpperCase()}" media filter in this location.`}
          </p>
          {mediaFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setMediaFilter('all')}
              className="mt-1 px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Reset to All Media Types
            </button>
          )}
        </div>
      ) : (
        <div className="custom-scrollbar max-h-[305px] sm:max-h-[320px] pr-1.5 py-1 -mr-1">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {filteredResponses.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedResponse(item);
                  setIsPlayingAudio(false);
                }}
                className="group flex flex-col items-center p-1.5 sm:p-2 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                {/* Circle Avatar */}
                <div className="relative">
                  <div
                    className="w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white font-extrabold text-sm shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md border-2 border-white ring-2 ring-slate-100"
                    style={{ backgroundColor: item.avatarColor }}
                  >
                    {item.initials}
                  </div>

                  {/* Media Type Corner Badge */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center">
                    {getMediaTypeIcon(item.responseType, 11)}
                  </div>
                </div>

                {/* Participant Name & Village */}
                <span className="text-xs font-bold text-slate-800 mt-1.5 truncate w-full group-hover:text-indigo-600 transition-colors">
                  {item.participantName}
                </span>
                <span className="text-[10px] text-slate-400 truncate w-full">
                  {item.village}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Response Modal Popup ── */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-base shadow-sm shrink-0 border-2 border-white"
                  style={{ backgroundColor: selectedResponse.avatarColor }}
                >
                  {selectedResponse.initials}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                      {selectedResponse.participantName}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                      Participant #{selectedResponse.participantNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="text-indigo-600" />
                    <span>
                      {selectedResponse.village}, {selectedResponse.block}, {selectedResponse.district}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedResponse(null);
                  setIsPlayingAudio(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Media Type Banner */}
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5',
                    getMediaTypeBadge(selectedResponse.responseType).bg
                  )}
                >
                  {getMediaTypeIcon(selectedResponse.responseType, 13)}
                  <span>{getMediaTypeBadge(selectedResponse.responseType).label}</span>
                </span>

                <span className="text-[11px] text-slate-400 font-medium">
                  {selectedResponse.interviewDate}
                </span>
              </div>

              {/* 1. Voice Note Player */}
              {selectedResponse.responseType === 'voice' && (
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <SpeakerHigh size={16} className="text-amber-600" />
                      <span>Audio Recording</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-800">
                      {selectedResponse.voiceDuration || '01:30'}
                    </span>
                  </div>

                  {/* Waveform Player */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-amber-100 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-md transition-all cursor-pointer shrink-0"
                    >
                      {isPlayingAudio ? (
                        <Pause size={18} weight="fill" />
                      ) : (
                        <Play size={18} weight="fill" className="ml-0.5" />
                      )}
                    </button>

                    {/* Animated Waveform bars */}
                    <div className="flex-1 flex items-center gap-1 h-8">
                      {[35, 60, 45, 80, 50, 95, 70, 40, 85, 30, 65, 90, 45, 75, 50, 30, 60].map(
                        (h, bIdx) => (
                          <div
                            key={bIdx}
                            className={cn(
                              'flex-1 rounded-full transition-all duration-300',
                              isPlayingAudio ? 'bg-amber-500 animate-pulse' : 'bg-amber-300'
                            )}
                            style={{ height: `${h}%` }}
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Video Player Preview */}
              {selectedResponse.responseType === 'video' && (
                <div className="rounded-2xl overflow-hidden border border-purple-200 bg-slate-900 text-white relative group aspect-video flex flex-col items-center justify-center p-4">
                  <div className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white cursor-pointer shadow-lg transition-transform group-hover:scale-110">
                    <Play size={24} weight="fill" className="ml-1" />
                  </div>
                  <span className="text-xs font-semibold text-slate-300 mt-2">
                    Click to Play Field Video ({selectedResponse.videoDuration || '02:15'})
                  </span>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono font-bold text-white">
                    HD 1080p
                  </div>
                </div>
              )}

              {/* 3. Image Photo Preview */}
              {selectedResponse.responseType === 'image' && (
                <div className="rounded-2xl overflow-hidden border border-emerald-200 bg-slate-50 p-4 flex flex-col items-center justify-center space-y-2">
                  <div className="w-full aspect-[4/3] rounded-xl bg-emerald-100/60 border border-emerald-200 flex flex-col items-center justify-center text-emerald-800 p-4 text-center">
                    <ImageIcon size={48} weight="duotone" className="text-emerald-600 mb-2" />
                    <span className="text-xs font-bold text-emerald-950">
                      {selectedResponse.imageCaption || 'Field Inspection Photograph'}
                    </span>
                    <span className="text-[10px] text-emerald-700 mt-1">
                      High-resolution photographic proof captured via Field App
                    </span>
                  </div>
                </div>
              )}

              {/* Descriptive Text / Transcript */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  {selectedResponse.responseType === 'voice'
                    ? 'Voice Note Transcription'
                    : selectedResponse.responseType === 'video'
                    ? 'Video Notes & Highlights'
                    : selectedResponse.responseType === 'image'
                    ? 'Image Field Observation'
                    : 'Verbatim Participant Response'}
                </span>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed italic">
                  "{selectedResponse.textResponse}"
                </p>
              </div>

              {/* Interviewer attribution */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1.5">
                  <User size={13} className="text-indigo-600" />
                  <span>
                    Interviewer: <strong>{selectedResponse.interviewerName}</strong> (
                    {selectedResponse.interviewerRole.toUpperCase()})
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={13} className="text-slate-400" />
                  <span>{selectedResponse.interviewDate}</span>
                </span>
              </div>
            </div>

            {/* Modal Navigation Footer */}
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex <= 0}
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
                  currentIndex <= 0
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-700 hover:bg-slate-200 cursor-pointer'
                )}
              >
                <CaretLeft size={14} weight="bold" />
                <span>Previous</span>
              </button>

              <span className="text-xs font-bold text-slate-500">
                {currentIndex + 1} of {filteredResponses.length}
              </span>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex >= filteredResponses.length - 1}
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
                  currentIndex >= filteredResponses.length - 1
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-700 hover:bg-slate-200 cursor-pointer'
                )}
              >
                <span>Next</span>
                <CaretRight size={14} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
