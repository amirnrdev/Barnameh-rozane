import React, { useState, useMemo } from 'react';
import { DayKey, DayConfig, ScheduleCell, StudyMode } from '../types';
import {
  SUBJECT_METADATA_MAP,
  DEFAULT_SUBJECT_META,
  toPersianDigits,
  getCellTimeInfo,
  getSlotDefaultMinutes,
  parseTimeToMinutes,
  formatMinutesToPersianTime,
  formatMinutesToStandardTime,
  isTimeForbidden,
} from '../constants';

const DEFAULT_BREAKS = [15, 15, 60, 15, 15, 45, 15, 15, 15, 15];

export function calculateDynamicDaySlots(
  dayCells: ScheduleCell[],
  slotCount: number,
  selectedDayKey: DayKey,
  defaultSlotDuration = 90
) {
  let prevSlotEndMins: number | null = null;
  let hasSeenCustom = false;

  return Array.from({ length: slotCount }).map((_, slotIndex) => {
    const cell = dayCells.find((c) => c.slotIndex === slotIndex && c.day === selectedDayKey);
    let durationMinutes =
      cell?.durationMinutes && cell.durationMinutes > 0 ? cell.durationMinutes : defaultSlotDuration;

    const breakAfterPrev = slotIndex > 0 ? (DEFAULT_BREAKS[slotIndex - 1] ?? 15) : 0;

    let startMins: number;

    const isExplicitCustom = Boolean(
      cell?.customStartTime && cell.customStartTime.trim() !== ''
    ) || Boolean(
      cell?.durationMinutes && cell.durationMinutes !== defaultSlotDuration
    );

    if (isExplicitCustom) {
      hasSeenCustom = true;
    }

    if (cell?.customStartTime && cell.customStartTime.trim() !== '') {
      const parsed = parseTimeToMinutes(cell.customStartTime);
      if (parsed !== null) {
        startMins = parsed;
      } else if (prevSlotEndMins !== null) {
        startMins = prevSlotEndMins + breakAfterPrev;
      } else {
        startMins = getSlotDefaultMinutes(slotIndex, durationMinutes).startTotalMinutes;
      }
    } else {
      if (prevSlotEndMins !== null) {
        startMins = prevSlotEndMins + breakAfterPrev;
      } else {
        startMins = getSlotDefaultMinutes(slotIndex, durationMinutes).startTotalMinutes;
      }
    }

    let endMins = startMins + durationMinutes;
    // Maximum after 1:30 AM is forbidden
    if (isTimeForbidden(endMins)) {
      const maxAllowedEnd = startMins >= 420 ? 1530 : 90; // 1530 is next-day 01:30 AM, 90 is same-day early morning 01:30 AM
      if (endMins > maxAllowedEnd) {
        endMins = maxAllowedEnd;
        durationMinutes = Math.max(10, endMins - startMins);
      }
    }

    prevSlotEndMins = endMins;

    const startPersian = formatMinutesToPersianTime(startMins);
    const endPersian = formatMinutesToPersianTime(endMins);

    return {
      slotIndex,
      cell,
      timeInfo: {
        isCustom: hasSeenCustom,
        startTimeStr: startPersian,
        endTimeStr: endPersian,
        time: `${startPersian} - ${endPersian}`,
        durationMinutes,
        startTotalMinutes: startMins,
        endTotalMinutes: endMins,
        rawStartTime: formatMinutesToStandardTime(startMins),
        rawEndTime: formatMinutesToStandardTime(endMins),
      },
    };
  });
}
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  BookOpen,
  PieChart,
  Award,
  Zap,
  Target,
  ChevronLeft,
  CalendarDays,
  ListChecks,
  Edit3,
} from 'lucide-react';

interface PerformanceViewProps {
  days: DayConfig[];
  cells: ScheduleCell[];
  slotCount: number;
  slotDurationMinutes: number;
  onToggleComplete?: (cellId: string) => void;
  onSaveCell?: (updatedCell: ScheduleCell) => void;
  onCellClick?: (cell: ScheduleCell) => void;
  highlightedSubject?: string | null;
}

// Helper to format total minutes into "X ساعت و Y دقیقه" or "X.Y ساعت"
function formatMinutesToHoursAndMins(minutes: number): string {
  if (!minutes || minutes <= 0) return '۰ دقیقه';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hrs > 0 && mins > 0) {
    return `${toPersianDigits(hrs)} ساعت و ${toPersianDigits(mins)} دقیقه`;
  } else if (hrs > 0) {
    return `${toPersianDigits(hrs)} ساعت`;
  } else {
    return `${toPersianDigits(mins)} دقیقه`;
  }
}

export const PerformanceView: React.FC<PerformanceViewProps> = ({
  days,
  cells,
  slotCount,
  slotDurationMinutes,
  onToggleComplete,
  onSaveCell,
  onCellClick,
  highlightedSubject,
}) => {
  // Mode switcher: 'weekly' vs 'daily'
  const [subTab, setSubTab] = useState<'weekly' | 'daily'>('weekly');

  // Determine today's day key as initial selected day
  const todayDayKey = useMemo<DayKey>(() => {
    const jsDay = new Date().getDay();
    const map: Record<number, DayKey> = {
      6: 'sat',
      0: 'sun',
      1: 'mon',
      2: 'tue',
      3: 'wed',
      4: 'thu',
      5: 'fri',
    };
    return map[jsDay] || 'sat';
  }, []);

  const [selectedDayKey, setSelectedDayKey] = useState<DayKey>(todayDayKey);

  // Calculate dynamic slots for all 7 days with cascading times
  const allDynamicDaySlots = useMemo(() => {
    const map: Record<DayKey, ReturnType<typeof calculateDynamicDaySlots>> = {} as any;
    days.forEach((dayObj) => {
      const dayKey = dayObj.key;
      const dayCells = cells.filter((c) => c.day === dayKey && c.slotIndex < slotCount);
      map[dayKey] = calculateDynamicDaySlots(dayCells, slotCount, dayKey, slotDurationMinutes);
    });
    return map;
  }, [days, cells, slotCount, slotDurationMinutes]);

  // Overall Weekly Calculations
  const weeklyStats = useMemo(() => {
    let totalPlannedMins = 0;
    let totalCompletedMins = 0;
    let completedCount = 0;
    let activeSlotsCount = 0;

    days.forEach((dayObj) => {
      const daySlots = allDynamicDaySlots[dayObj.key] || [];
      daySlots.forEach(({ cell, timeInfo }) => {
        if (cell && cell.subject && cell.subject.trim() !== '' && cell.subject !== 'تعطیل') {
          activeSlotsCount++;
          totalPlannedMins += timeInfo.durationMinutes;
          if (cell.completed) {
            totalCompletedMins += timeInfo.durationMinutes;
            completedCount++;
          }
        }
      });
    });

    const completionRate =
      totalPlannedMins > 0 ? Math.round((totalCompletedMins / totalPlannedMins) * 100) : 0;

    return {
      totalPlannedMins,
      totalCompletedMins,
      totalActiveSlots: activeSlotsCount,
      completedSlotsCount: completedCount,
      completionRate,
    };
  }, [days, allDynamicDaySlots]);

  // Subject Breakdown Data
  const subjectBreakdown = useMemo(() => {
    const map: Record<
      string,
      {
        subject: string;
        plannedMins: number;
        completedMins: number;
        totalSlots: number;
        completedSlots: number;
        modes: Record<StudyMode, number>;
      }
    > = {};

    days.forEach((dayObj) => {
      const daySlots = allDynamicDaySlots[dayObj.key] || [];
      daySlots.forEach(({ cell, timeInfo }) => {
        if (cell && cell.subject && cell.subject.trim() !== '' && cell.subject !== 'تعطیل') {
          const subj = cell.subject;
          const mins = timeInfo.durationMinutes;

          if (!map[subj]) {
            map[subj] = {
              subject: subj,
              plannedMins: 0,
              completedMins: 0,
              totalSlots: 0,
              completedSlots: 0,
              modes: { study: 0, class: 0, test: 0, review: 0, free: 0 },
            };
          }

          map[subj].plannedMins += mins;
          map[subj].totalSlots += 1;
          const mode = cell.mode || 'study';
          map[subj].modes[mode] = (map[subj].modes[mode] || 0) + mins;

          if (cell.completed) {
            map[subj].completedMins += mins;
            map[subj].completedSlots += 1;
          }
        }
      });
    });

    return Object.values(map).sort((a, b) => b.plannedMins - a.plannedMins);
  }, [days, allDynamicDaySlots]);

  // Daily Breakdown Data for all 7 days
  const dailyBreakdown = useMemo(() => {
    return days.map((dayObj) => {
      const daySlots = allDynamicDaySlots[dayObj.key] || [];
      let plannedMins = 0;
      let completedMins = 0;
      let completedCount = 0;
      let activeCount = 0;

      daySlots.forEach(({ cell, timeInfo }) => {
        if (cell && cell.subject && cell.subject.trim() !== '' && cell.subject !== 'تعطیل') {
          activeCount++;
          const mins = timeInfo.durationMinutes;
          plannedMins += mins;
          if (cell.completed) {
            completedMins += mins;
            completedCount++;
          }
        }
      });

      const rate = plannedMins > 0 ? Math.round((completedMins / plannedMins) * 100) : 0;

      return {
        day: dayObj,
        plannedMins,
        completedMins,
        totalSlots: activeCount,
        completedSlots: completedCount,
        rate,
      };
    });
  }, [days, allDynamicDaySlots]);

  // Mode Breakdown Data
  const modeBreakdown = useMemo(() => {
    const modes: Record<StudyMode, { label: string; plannedMins: number; completedMins: number; icon: string }> = {
      study: { label: 'مطالعه و پیش‌خوانی', plannedMins: 0, completedMins: 0, icon: '📖' },
      class: { label: 'کلاس و تدریس', plannedMins: 0, completedMins: 0, icon: '👨‍🏫' },
      test: { label: 'تست و تمرین', plannedMins: 0, completedMins: 0, icon: '📝' },
      review: { label: 'مرور و جمع‌بندی', plannedMins: 0, completedMins: 0, icon: '🔄' },
      free: { label: 'آزاد', plannedMins: 0, completedMins: 0, icon: '☕' },
    };

    days.forEach((dayObj) => {
      const daySlots = allDynamicDaySlots[dayObj.key] || [];
      daySlots.forEach(({ cell, timeInfo }) => {
        if (cell && cell.subject && cell.subject.trim() !== '' && cell.subject !== 'تعطیل') {
          const mins = timeInfo.durationMinutes;
          const m = cell.mode || 'study';

          if (modes[m]) {
            modes[m].plannedMins += mins;
            if (cell.completed) {
              modes[m].completedMins += mins;
            }
          }
        }
      });
    });

    return modes;
  }, [days, allDynamicDaySlots]);

  // Selected Day Details for Daily Sub-tab
  const selectedDayData = useMemo(() => {
    const found = dailyBreakdown.find((d) => d.day.key === selectedDayKey);
    const dayObj = days.find((d) => d.key === selectedDayKey) || days[0];
    const slots = allDynamicDaySlots[selectedDayKey] || [];

    return {
      dayConfig: dayObj,
      summary: found || {
        plannedMins: 0,
        completedMins: 0,
        totalSlots: 0,
        completedSlots: 0,
        rate: 0,
      },
      slots,
    };
  }, [dailyBreakdown, days, selectedDayKey, allDynamicDaySlots]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Sub-tab Switcher */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-stone-200/80 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" />
            <span>تحلیل دقیق عملکرد برنامه‌ریزی</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-zinc-100 mt-1">
            آمار و میزان ساعات مطالعه
          </h2>
          <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
            بررسی مجموع زمان‌های مطالعه‌شده، میزان پیشرفت دروس و بازدهی روزانه و هفتگی
          </p>
        </div>

        {/* Sub-tab Switcher (هفتگی / روزانه) */}
        <div className="flex items-center p-1 bg-stone-100 dark:bg-zinc-800 rounded-xl border border-stone-200 dark:border-zinc-700/80 w-full sm:w-auto justify-center">
          <button
            type="button"
            onClick={() => setSubTab('weekly')}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer w-1/2 sm:w-auto ${
              subTab === 'weekly'
                ? 'bg-white dark:bg-zinc-700 text-teal-700 dark:text-teal-300 shadow-2xs'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>عملکرد هفتگی</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('daily')}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer w-1/2 sm:w-auto ${
              subTab === 'daily'
                ? 'bg-white dark:bg-zinc-700 text-teal-700 dark:text-teal-300 shadow-2xs'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>عملکرد روزانه</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Completed Hours Card */}
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white p-4 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <Clock className="w-28 h-28" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-100">مطالعه‌شده تاکنون</span>
            <div className="p-1.5 rounded-lg bg-white/20 text-white">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black tabular-nums">
              {formatMinutesToHoursAndMins(weeklyStats.totalCompletedMins)}
            </div>
            <div className="text-[11px] text-teal-100/90 mt-1 flex items-center gap-1">
              <span>از مجموع {formatMinutesToHoursAndMins(weeklyStats.totalPlannedMins)}</span>
            </div>
          </div>
        </div>

        {/* Completion Percentage Card */}
        <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 p-4 rounded-2xl shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-zinc-400">درصد تحقق برنامه</span>
            <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-zinc-100 tabular-nums">
                %{toPersianDigits(weeklyStats.completionRate)}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-stone-100 dark:bg-zinc-800 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-teal-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, weeklyStats.completionRate)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Completed Slots Count Card */}
        <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 p-4 rounded-2xl shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-zinc-400">زنگ‌های تکمیل‌شده</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <ListChecks className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-zinc-100 tabular-nums">
              {toPersianDigits(weeklyStats.completedSlotsCount)} <span className="text-sm font-normal text-stone-400">از {toPersianDigits(weeklyStats.totalActiveSlots)} زنگ</span>
            </div>
            <div className="text-[11px] text-stone-500 dark:text-zinc-400 mt-1">
              پارت‌های فعال برنامه هفتگی
            </div>
          </div>
        </div>

        {/* Total Planned Time Card */}
        <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 p-4 rounded-2xl shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-zinc-400">کل تایم برنامه‌ریزی</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-stone-900 dark:text-zinc-100 tabular-nums">
              {formatMinutesToHoursAndMins(weeklyStats.totalPlannedMins)}
            </div>
            <div className="text-[11px] text-stone-500 dark:text-zinc-400 mt-1">
              مجموع ۷ روز هفته
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: WEEKLY PERFORMANCE */}
      {subTab === 'weekly' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Subject Breakdown Section */}
          <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-base font-bold text-stone-900 dark:text-zinc-100">
                  تفکیک زمان مطالعه بر اساس دروس
                </h3>
              </div>
              <span className="text-xs text-stone-500 dark:text-zinc-400 font-medium">
                {toPersianDigits(subjectBreakdown.length)} درس فعال
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {subjectBreakdown.map((item) => {
                const meta = SUBJECT_METADATA_MAP[item.subject] || DEFAULT_SUBJECT_META;
                const percentage = item.plannedMins > 0 ? Math.round((item.completedMins / item.plannedMins) * 100) : 0;
                const isHighlighted = highlightedSubject === item.subject;

                return (
                  <div
                    key={item.subject}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isHighlighted
                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 ring-1 ring-teal-500'
                        : 'border-stone-200/90 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${meta.bgClass} ${meta.textClass}`}>
                          {item.subject}
                        </span>
                        <span className="text-xs font-medium text-stone-500 dark:text-zinc-400">
                          ({toPersianDigits(item.completedSlots)} از {toPersianDigits(item.totalSlots)} زنگ)
                        </span>
                      </div>
                      <div className="text-xs font-bold text-teal-700 dark:text-teal-400 tabular-nums">
                        %{toPersianDigits(percentage)}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-stone-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden mb-2.5">
                      <div
                        className="bg-teal-600 dark:bg-teal-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-stone-600 dark:text-zinc-300 pt-1 border-t border-stone-200/60 dark:border-zinc-700/60">
                      <div className="flex items-center gap-1 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>مطالعه‌شده: {formatMinutesToHoursAndMins(item.completedMins)}</span>
                      </div>
                      <div className="text-stone-400 dark:text-zinc-500">
                        کل برنامه: {formatMinutesToHoursAndMins(item.plannedMins)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Comparison Bar Charts */}
          <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-base font-bold text-stone-900 dark:text-zinc-100">
                  مقایسه روزهای هفته (ساعات مطالعه)
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {dailyBreakdown.map((item) => {
                const maxPlanned = Math.max(...dailyBreakdown.map((d) => d.plannedMins), 1);
                const plannedWidthPct = Math.round((item.plannedMins / maxPlanned) * 100);
                const completedWidthPct = item.plannedMins > 0 ? Math.round((item.completedMins / item.plannedMins) * 100) : 0;

                return (
                  <div key={item.day.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-stone-700 dark:text-zinc-300">
                      <div className="flex items-center gap-2">
                        <span className="w-16 font-bold text-stone-900 dark:text-zinc-100">
                          {item.day.label}
                        </span>
                        <span className="text-stone-400 text-[11px]">
                          ({toPersianDigits(item.completedSlots)} از {toPersianDigits(item.totalSlots)} زنگ)
                        </span>
                      </div>
                      <div className="flex items-center gap-3 tabular-nums">
                        <span className="text-teal-700 dark:text-teal-400 font-bold">
                          {formatMinutesToHoursAndMins(item.completedMins)}
                        </span>
                        <span className="text-stone-400 text-[11px]">
                          / {formatMinutesToHoursAndMins(item.plannedMins)}
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-stone-100 dark:bg-zinc-800/80 h-3 rounded-full overflow-hidden p-0.5 flex items-center">
                      <div
                        className="bg-gradient-to-l from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (item.completedMins / maxPlanned) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mode Breakdown */}
          <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h3 className="text-base font-bold text-stone-900 dark:text-zinc-100">
                تفکیک نوع فعالیت‌ها (مطالعه، کلاس، تست، مرور)
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['study', 'class', 'test', 'review'] as StudyMode[]).map((modeKey) => {
                const info = modeBreakdown[modeKey];
                const pct = info.plannedMins > 0 ? Math.round((info.completedMins / info.plannedMins) * 100) : 0;

                return (
                  <div
                    key={modeKey}
                    className="bg-stone-50/80 dark:bg-zinc-800/50 border border-stone-200/80 dark:border-zinc-700/70 p-3.5 rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{info.icon}</span>
                      <span className="text-xs font-bold text-teal-600 dark:text-teal-400 tabular-nums">
                        %{toPersianDigits(pct)}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-stone-800 dark:text-zinc-200">
                      {info.label}
                    </div>
                    <div className="text-xs font-semibold text-stone-900 dark:text-zinc-100 tabular-nums">
                      {formatMinutesToHoursAndMins(info.completedMins)}
                    </div>
                    <div className="text-[10px] text-stone-400">
                      کل: {formatMinutesToHoursAndMins(info.plannedMins)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DAILY PERFORMANCE */}
      {subTab === 'daily' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Day Selector Buttons */}
          <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl p-2 sm:p-3 shadow-2xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {days.map((dayObj) => {
              const isSelected = dayObj.key === selectedDayKey;
              const isToday = dayObj.key === todayDayKey;
              const dayStat = dailyBreakdown.find((d) => d.day.key === dayObj.key);
              const completedCount = dayStat?.completedSlots || 0;
              const totalSlots = dayStat?.totalSlots || 0;

              return (
                <button
                  key={dayObj.key}
                  type="button"
                  onClick={() => setSelectedDayKey(dayObj.key)}
                  className={`flex flex-col items-center justify-center py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 min-w-[76px] ${
                    isSelected
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-stone-50 dark:bg-zinc-800/80 text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-700 border border-stone-200/80 dark:border-zinc-700/60'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span>{dayObj.label}</span>
                    {isToday && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-teal-500'}`} />
                    )}
                  </div>
                  <span className={`text-[10px] mt-1 font-normal ${isSelected ? 'text-teal-100' : 'text-stone-400'}`}>
                    {toPersianDigits(completedCount)} از {toPersianDigits(totalSlots)} زنگ
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Day Stats Header */}
          <div className="bg-gradient-to-r from-stone-900 to-zinc-800 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-teal-400 font-bold">
                عملکرد روز {selectedDayData.dayConfig.label}
              </div>
              <div className="text-xl font-black mt-1">
                {formatMinutesToHoursAndMins(selectedDayData.summary.completedMins)} مطالعه‌شده
              </div>
              <div className="text-xs text-stone-300 mt-0.5">
                از مجموع {formatMinutesToHoursAndMins(selectedDayData.summary.plannedMins)} برنامه‌ریزی‌شده برای این روز
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-xl border border-white/10">
              <div className="text-center">
                <div className="text-xs text-stone-300">درصد تحقق</div>
                <div className="text-lg font-black text-amber-300 tabular-nums">
                  %{toPersianDigits(selectedDayData.summary.rate)}
                </div>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="text-center">
                <div className="text-xs text-stone-300">زنگ‌های کامل</div>
                <div className="text-lg font-black text-emerald-300 tabular-nums">
                  {toPersianDigits(selectedDayData.summary.completedSlots)} / {toPersianDigits(selectedDayData.summary.totalSlots)}
                </div>
              </div>
            </div>
          </div>

          {/* Slot Timeline List */}
          <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>برنامه زمان‌بندی زنگ‌های روز {selectedDayData.dayConfig.label}</span>
              </h3>
            </div>

            <div className="space-y-2.5">
              {selectedDayData.slots.map(({ slotIndex, cell, timeInfo }) => {
                const hasCell = Boolean(cell && cell.subject && cell.subject !== 'تعطیل');
                const meta = hasCell ? SUBJECT_METADATA_MAP[cell!.subject] || DEFAULT_SUBJECT_META : null;
                const isCompleted = Boolean(cell?.completed);

                const handleEditClick = () => {
                  if (onCellClick) {
                    onCellClick(cell || {
                      id: `${selectedDayKey}-${slotIndex}`,
                      day: selectedDayKey,
                      slotIndex,
                      subject: '',
                      mode: 'study',
                      completed: false,
                    });
                  }
                };

                return (
                  <div
                    key={slotIndex}
                    className={`p-3 sm:p-3.5 rounded-xl border transition-all ${
                      isCompleted
                        ? 'border-emerald-300 dark:border-emerald-800/70 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : hasCell
                        ? 'border-stone-200 dark:border-zinc-800 bg-stone-50/60 dark:bg-zinc-800/40'
                        : 'border-dashed border-stone-200 dark:border-zinc-800 bg-stone-50/20 dark:bg-zinc-900/30 opacity-60'
                    }`}
                  >
                    {/* Display Slot Card Content */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
                      {/* Time & Slot Info */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 bg-stone-100 dark:bg-zinc-800 rounded-lg text-xs font-mono font-bold text-stone-700 dark:text-zinc-300 tabular-nums shrink-0" dir="ltr">
                            {timeInfo.time}
                          </span>
                          {/* Edit Time/Cell Button (Opens Edit Panel) */}
                          <button
                            type="button"
                            onClick={handleEditClick}
                            className="p-1 rounded-lg hover:bg-stone-200/80 dark:hover:bg-zinc-700 text-stone-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
                            title="ویرایش این پارت و زمان آن"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {hasCell ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${meta?.bgClass} ${meta?.textClass}`}>
                              {cell!.subject}
                            </span>
                            {cell!.sessionNumber && (
                              <span className="text-xs font-bold text-stone-600 dark:text-zinc-400">
                                (پارت {toPersianDigits(cell!.sessionNumber)})
                              </span>
                            )}
                            <span className="text-[11px] text-stone-500 dark:text-zinc-400 font-medium">
                              • {formatMinutesToHoursAndMins(timeInfo.durationMinutes)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-stone-400 italic">بدون برنامه</span>
                            <button
                              type="button"
                              onClick={handleEditClick}
                              className="text-xs text-teal-600 dark:text-teal-400 underline cursor-pointer font-bold"
                            >
                              + ثبت تایم مطالعه
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Completion Toggle Button */}
                      <div className="flex items-center gap-2 shrink-0">
                        {hasCell && onToggleComplete && (
                          <button
                            type="button"
                            onClick={() => onToggleComplete(cell!.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                              isCompleted
                                ? 'bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700'
                                : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700 hover:bg-stone-200 dark:hover:bg-zinc-700'
                            }`}
                          >
                            {isCompleted ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-white" />
                                <span>تکمیل شد ✓</span>
                              </>
                            ) : (
                              <>
                                <Circle className="w-4 h-4 text-stone-400" />
                                <span>علامت به‌عنوان کامل</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
