import React, { useState } from 'react';
import { SubjectCountSummary } from '../types';
import { toPersianDigits, getSubjectStyle } from '../constants';
import {
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Filter,
  GraduationCap,
  PenTool,
  BookOpen,
  LayoutGrid,
  ListTree,
  Hash,
} from 'lucide-react';

interface SummaryStatsProps {
  summaries: SubjectCountSummary[];
  totalSlots: number;
  completedSlots: number;
  slotDurationMinutes: number;
  highlightedSubject: string | null;
  onSelectHighlight: (subject: string | null) => void;
}

export const SummaryStats: React.FC<SummaryStatsProps> = ({
  summaries,
  totalSlots,
  completedSlots,
  slotDurationMinutes,
  highlightedSubject,
  onSelectHighlight,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'cards' | 'sessions'>('cards');

  const totalHours = ((totalSlots * slotDurationMinutes) / 60).toFixed(1);
  const totalClassSlots = summaries.reduce((acc, curr) => acc + curr.classCount, 0);
  const totalTestSlots = summaries.reduce((acc, curr) => acc + curr.testCount, 0);
  const totalStudySlots = summaries.reduce((acc, curr) => acc + curr.studyCount, 0);
  const completionPercentage = totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : 0;

  const selectedSummary = highlightedSubject
    ? summaries.find((s) => s.name === highlightedSubject)
    : null;

  return (
    <section className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-stone-200/80 dark:border-zinc-800/80 shadow-xs p-4 mb-4 transition-colors">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Main Metrics Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Total Parts */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-zinc-800/80 border border-stone-200/70 dark:border-zinc-700/60">
            <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
            <span className="text-stone-500 dark:text-zinc-400 font-medium">مجموع:</span>
            <span className="font-extrabold text-stone-900 dark:text-zinc-100">
              {toPersianDigits(totalSlots)} پارت
            </span>
            <span className="text-stone-400 dark:text-zinc-500 text-[11px]">
              ({toPersianDigits(totalHours)} ساعت)
            </span>
          </div>

          {/* Slot Duration */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/50 text-[11px] font-bold">
            <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>هر پارت {toPersianDigits(slotDurationMinutes)}د</span>
          </div>

          {/* Breakdown counts */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-50 dark:bg-zinc-800/50 border border-stone-200/60 dark:border-zinc-700/50 font-bold text-[11px]">
            <span className="text-cyan-700 dark:text-cyan-400 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              {toPersianDigits(totalClassSlots)} کلاس
            </span>
            <span className="text-stone-300 dark:text-zinc-700">•</span>
            <span className="text-violet-700 dark:text-violet-400 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {toPersianDigits(totalStudySlots)} مطالعه
            </span>
            <span className="text-stone-300 dark:text-zinc-700">•</span>
            <span className="text-stone-800 dark:text-zinc-200 flex items-center gap-1">
              <PenTool className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-400" />
              {toPersianDigits(totalTestSlots)} تمرین
            </span>
          </div>

          {/* Progress */}
          {completedSlots > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>
                {toPersianDigits(completedSlots)} انجام‌شده ({toPersianDigits(completionPercentage)}٪)
              </span>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {isExpanded && (
            <div className="flex items-center bg-stone-100 dark:bg-zinc-800 p-0.5 rounded-xl text-[11px] border border-stone-200/80 dark:border-zinc-700/80">
              <button
                type="button"
                onClick={() => setActiveTab('cards')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                  activeTab === 'cards'
                    ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-zinc-100 shadow-2xs'
                    : 'text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>کارت دروس</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sessions')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                  activeTab === 'sessions'
                    ? 'bg-white dark:bg-zinc-700 text-teal-700 dark:text-teal-300 shadow-2xs'
                    : 'text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200'
                }`}
              >
                <ListTree className="w-3.5 h-3.5" />
                <span>تفکیک جلسات</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs font-semibold text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200 px-2.5 py-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'خلاصه کردن' : 'جزئیات دروس'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Panel */}
      {isExpanded && (
        <div className="mt-3.5 pt-3.5 border-t border-stone-100 dark:border-zinc-800/80 space-y-3.5 animate-in fade-in duration-200">
          {/* Proportional Distribution Bar */}
          <div className="h-2 w-full rounded-full bg-stone-100 dark:bg-zinc-800 flex overflow-hidden p-0.5 gap-0.5">
            {summaries.map((item) => {
              if (item.total === 0) return null;
              const subStyle = getSubjectStyle(item.name);
              return (
                <div
                  key={item.name}
                  title={`${item.name}: ${toPersianDigits(item.total)} پارت`}
                  style={{ width: `${item.percentage}%` }}
                  onClick={() => onSelectHighlight(highlightedSubject === item.name ? null : item.name)}
                  className={`h-full rounded-full transition-all cursor-pointer ${
                    highlightedSubject === item.name ? 'opacity-100 ring-2 ring-teal-500 scale-y-125' : 'opacity-85 hover:opacity-100'
                  } ${subStyle.dotColor}`}
                />
              );
            })}
          </div>

          {/* TAB 1: Subject Cards */}
          {activeTab === 'cards' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {summaries.map((s) => {
                const isSelected = highlightedSubject === s.name;
                const subStyle = getSubjectStyle(s.name);
                const hasClassSessions = s.classSessions && s.classSessions.length > 0;
                const hasStudySessions = s.studySessions && s.studySessions.length > 0;
                const hasTestSessions = s.testSessions && s.testSessions.length > 0;

                return (
                  <div
                    key={s.name}
                    onClick={() => onSelectHighlight(isSelected ? null : s.name)}
                    className={`p-3 rounded-2xl text-right transition-all duration-200 border text-xs cursor-pointer flex flex-col justify-between min-w-0 select-none ${
                      isSelected
                        ? `${subStyle.statsCardBg} ${subStyle.statsCardBorder} shadow-md ring-2 ring-teal-500/60 ring-offset-1 dark:ring-offset-zinc-900 -translate-y-0.5`
                        : 'bg-stone-50/80 dark:bg-zinc-800/40 border-stone-200/80 dark:border-zinc-800/80 hover:bg-stone-100/90 dark:hover:bg-zinc-800/80 hover:-translate-y-0.5 hover:shadow-md'
                    }`}
                  >
                    <div className="w-full min-w-0">
                      {/* Header row */}
                      <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 dark:border-zinc-700/60 min-w-0">
                        <span className="font-extrabold text-stone-900 dark:text-zinc-100 text-sm truncate">
                          {s.name}
                        </span>
                        <span className="font-black text-xs bg-white dark:bg-zinc-800/90 text-stone-800 dark:text-zinc-200 border border-stone-200/80 dark:border-zinc-700/80 px-2 py-0.5 rounded-lg shadow-2xs shrink-0 tabular-nums">
                          {toPersianDigits(s.total)}{' '}
                          <span className="text-[10px] font-normal text-stone-400 dark:text-zinc-500">پارت</span>
                        </span>
                      </div>

                      {/* Mode activity counts for week (no session mentions) */}
                      <div className="space-y-1.5 mt-2 text-[11px] min-w-0 font-bold">
                        {s.classCount > 0 && (
                          <div className="flex items-center justify-between text-cyan-700 dark:text-cyan-300 bg-cyan-50/70 dark:bg-cyan-950/40 px-2 py-1 rounded-lg border border-cyan-200/50 dark:border-cyan-800/40">
                            <span className="inline-flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5" />
                              کلاس
                            </span>
                            <span className="tabular-nums">{toPersianDigits(s.classCount)} پارت</span>
                          </div>
                        )}

                        {s.studyCount > 0 && (
                          <div className="flex items-center justify-between text-violet-700 dark:text-violet-300 bg-violet-50/70 dark:bg-violet-950/40 px-2 py-1 rounded-lg border border-violet-200/50 dark:border-violet-800/40">
                            <span className="inline-flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-violet-500" />
                              مطالعه
                            </span>
                            <span className="tabular-nums">{toPersianDigits(s.studyCount)} پارت</span>
                          </div>
                        )}

                        {s.testCount > 0 && (
                          <div className="flex items-center justify-between text-stone-800 dark:text-zinc-200 bg-stone-100/80 dark:bg-zinc-800 px-2 py-1 rounded-lg border border-stone-200/80 dark:border-zinc-700/80">
                            <span className="inline-flex items-center gap-1.5">
                              <PenTool className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-400" />
                              تمرین
                            </span>
                            <span className="tabular-nums">{toPersianDigits(s.testCount)} پارت</span>
                          </div>
                        )}

                        {s.total === 0 && (
                          <div className="text-[10px] text-stone-400 dark:text-zinc-500 py-1.5 text-center font-medium">
                            بدون پارت ثبت‌شده
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: Detailed Session Matrix */}
          {activeTab === 'sessions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {summaries
                .filter((s) => s.total > 0)
                .map((s) => {
                  const isSelected = highlightedSubject === s.name;
                  const subStyle = getSubjectStyle(s.name);
                  return (
                    <div
                      key={s.name}
                      onClick={() => onSelectHighlight(isSelected ? null : s.name)}
                      className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? `${subStyle.statsCardBg} ${subStyle.statsCardBorder} shadow-sm ring-2 ring-teal-500/60 ring-offset-1 dark:ring-offset-zinc-900`
                          : 'bg-stone-50/80 dark:bg-zinc-800/40 border-stone-200/80 dark:border-zinc-800 hover:bg-stone-100/90 dark:hover:bg-zinc-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200/60 dark:border-zinc-700/60">
                        <span className="font-extrabold text-stone-900 dark:text-zinc-100 text-sm">{s.name}</span>
                        <span className="text-[11px] font-bold text-stone-500 dark:text-zinc-400">
                          {toPersianDigits(s.total)} پارت کل
                        </span>
                      </div>

                      {/* Sessions Breakdown for this subject */}
                      <div className="space-y-1.5">
                        {s.sessionsBreakdown && s.sessionsBreakdown.length > 0 ? (
                          s.sessionsBreakdown.map((sess) => (
                            <div
                              key={String(sess.sessionNumber)}
                              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-stone-200/70 dark:border-zinc-800 text-[11px]"
                            >
                              <div className="flex items-center gap-1 font-black text-stone-800 dark:text-zinc-200 shrink-0">
                                <Hash className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                <span>
                                  {sess.sessionNumber === 'بدون شماره'
                                    ? 'بدون شماره جلسه'
                                    : `جلسه ${toPersianDigits(sess.sessionNumber)}`}
                                  :
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                {sess.classCount > 0 && (
                                  <span className="inline-flex items-center gap-1 text-cyan-700 dark:text-cyan-300 font-semibold bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-200/60 dark:border-cyan-900/50">
                                    <GraduationCap className="w-3 h-3" />
                                    {toPersianDigits(sess.classCount)} کلاس
                                  </span>
                                )}
                                {sess.studyCount > 0 && (
                                  <span className="inline-flex items-center gap-1 text-violet-700 dark:text-violet-300 font-semibold bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-lg border border-violet-200/60 dark:border-violet-900/50">
                                    <BookOpen className="w-3 h-3 text-violet-500" />
                                    {toPersianDigits(sess.studyCount)} مطالعه
                                  </span>
                                )}
                                {sess.testCount > 0 && (
                                  <span className="inline-flex items-center gap-1 text-stone-800 dark:text-zinc-200 font-bold bg-stone-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg border border-stone-200 dark:border-zinc-700">
                                    <PenTool className="w-3 h-3 text-stone-400 dark:text-zinc-400" />
                                    {toPersianDigits(sess.testCount)} تمرین
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-[11px] text-stone-400 dark:text-zinc-500 py-1 text-center font-medium">
                            بدون جلسه ثبت‌شده
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Active Highlight Banner & Subject Detailed Session Inspector */}
          {selectedSummary && (() => {
            const selStyle = getSubjectStyle(selectedSummary.name);
            return (
              <div className={`p-3.5 rounded-2xl border text-xs space-y-2.5 ${selStyle.statsCardBg} ${selStyle.statsCardBorder}`}>
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1.5 font-black ${selStyle.highlightCellText}`}>
                    <Filter className="w-3.5 h-3.5" />
                    تفکیک جلسات درس {selectedSummary.name} (مجموع {toPersianDigits(selectedSummary.total)} پارت):
                  </span>
                  <button
                    onClick={() => onSelectHighlight(null)}
                    className="underline opacity-80 hover:opacity-100 cursor-pointer text-[11px] font-semibold"
                  >
                    حذف فیلتر و نمایش همه
                  </button>
                </div>

                {selectedSummary.sessionsBreakdown && selectedSummary.sessionsBreakdown.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
                    {selectedSummary.sessionsBreakdown.map((sess) => (
                      <div
                        key={String(sess.sessionNumber)}
                        className={`p-2.5 rounded-xl bg-white dark:bg-zinc-900 border ${selStyle.statsCardBorder} shadow-2xs space-y-1 text-[11px]`}
                      >
                        <div className={`font-extrabold ${selStyle.highlightCellText} border-b border-stone-100 dark:border-zinc-800 pb-1 flex items-center justify-between`}>
                          <span>
                            {sess.sessionNumber === 'بدون شماره'
                              ? 'بدون شماره'
                              : `جلسه ${toPersianDigits(sess.sessionNumber)}`}
                          </span>
                          <span className="text-[10px] font-bold text-stone-400 dark:text-zinc-500">
                            {toPersianDigits(sess.total)} پارت
                          </span>
                        </div>
                        <div className="space-y-0.5 text-[10px] pt-0.5">
                          {sess.classCount > 0 && (
                            <div className="text-cyan-700 dark:text-cyan-300 font-semibold flex items-center gap-1">
                              <GraduationCap className="w-2.5 h-2.5" />
                              {toPersianDigits(sess.classCount)} کلاس
                            </div>
                          )}
                          {sess.studyCount > 0 && (
                            <div className="text-violet-700 dark:text-violet-300 font-semibold flex items-center gap-1">
                              <BookOpen className="w-2.5 h-2.5" />
                              {toPersianDigits(sess.studyCount)} مطالعه
                            </div>
                          )}
                          {sess.testCount > 0 && (
                            <div className="text-stone-800 dark:text-zinc-200 font-bold flex items-center gap-1">
                              <PenTool className="w-2.5 h-2.5" />
                              {toPersianDigits(sess.testCount)} تمرین
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-[11px] opacity-80 pt-1 ${selStyle.highlightCellText}`}>
                    هنوز شماره جلسه‌ای برای پارت‌های این درس ثبت نشده است.
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </section>
  );
};
