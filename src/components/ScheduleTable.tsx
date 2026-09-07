import React, { useState, useMemo } from 'react';
import { ActiveBrush, DayConfig, ScheduleCell, StudyMode } from '../types';
import {
  getSlotInfo,
  getCellTimeInfo,
  toPersianDigits,
  getSubjectStyle,
  parseTimeToMinutes,
  formatMinutesToPersianTime,
  formatMinutesToStandardTime,
  getSlotDefaultMinutes,
  isTimeForbidden,
} from '../constants';
import { CheckCircle2, Circle, Clock, GraduationCap, BookOpen, PenTool, Plus, GripVertical } from 'lucide-react';

interface ScheduleTableProps {
  days: DayConfig[];
  cells: ScheduleCell[];
  onCellClick: (cell: ScheduleCell) => void;
  onCellDrop: (
    targetCellId: string,
    sourceData: {
      type: 'cell' | 'palette-subject' | 'palette-session';
      id?: string;
      subject?: string;
      mode?: StudyMode;
      sessionNumber?: number | string | '__CLEAR_SESSION__';
    }
  ) => void;
  onClearCell: (cellId: string) => void;
  onToggleComplete: (cellId: string) => void;
  onToggleMode: (cellId: string) => void;
  highlightedSubject: string | null;
  direction: 'rtl' | 'ltr';
  slotCount: number;
  slotDurationMinutes: number;
  activeBrush?: ActiveBrush | null;
  onApplyBrush?: (cellId: string) => void;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
  days,
  cells,
  onCellClick,
  onCellDrop,
  onToggleComplete,
  onToggleMode,
  highlightedSubject,
  direction,
  slotCount,
  slotDurationMinutes,
  activeBrush,
  onApplyBrush,
}) => {
  const [dragOverCellId, setDragOverCellId] = useState<string | null>(null);
  const [draggedCellId, setDraggedCellId] = useState<string | null>(null);

  // Pre-calculate cascaded/dynamic start and end times for all cells
  const cellTimeMap = useMemo(() => {
    const map = new Map<string, {
      isCustom: boolean;
      startTimeStr: string;
      endTimeStr: string;
      time: string;
      durationMinutes: number;
      rawStartTime: string;
      rawEndTime: string;
    }>();

    const DEFAULT_BREAKS = [15, 15, 60, 15, 15, 45, 15, 15, 15, 15];

    days.forEach((day) => {
      let prevSlotEndMins: number | null = null;
      let hasSeenCustom = false;

      for (let slotIndex = 0; slotIndex < slotCount; slotIndex++) {
        const cell = cells.find((c) => c.day === day.key && c.slotIndex === slotIndex);
        if (!cell) continue;

        let durationMinutes =
          cell.durationMinutes && cell.durationMinutes > 0 ? cell.durationMinutes : slotDurationMinutes;

        const breakAfterPrev = slotIndex > 0 ? (DEFAULT_BREAKS[slotIndex - 1] ?? 15) : 0;

        let startMins: number;

        const isExplicitCustom = Boolean(
          cell.customStartTime && cell.customStartTime.trim() !== ''
        ) || Boolean(
          cell.durationMinutes && cell.durationMinutes !== slotDurationMinutes
        );

        if (isExplicitCustom) {
          hasSeenCustom = true;
        }

        if (cell.customStartTime && cell.customStartTime.trim() !== '') {
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
          const maxAllowedEnd = startMins >= 420 ? 1530 : 90;
          if (endMins > maxAllowedEnd) {
            endMins = maxAllowedEnd;
            durationMinutes = Math.max(10, endMins - startMins);
          }
        }

        prevSlotEndMins = endMins;

        const startPersian = formatMinutesToPersianTime(startMins);
        const endPersian = formatMinutesToPersianTime(endMins);

        map.set(cell.id, {
          isCustom: hasSeenCustom,
          startTimeStr: startPersian,
          endTimeStr: endPersian,
          time: `${startPersian} - ${endPersian}`,
          durationMinutes: durationMinutes,
          rawStartTime: formatMinutesToStandardTime(startMins),
          rawEndTime: formatMinutesToStandardTime(endMins),
        });
      }
    });

    return map;
  }, [days, cells, slotCount, slotDurationMinutes]);

  const getCell = (dayKey: string, slotIndex: number) => {
    return cells.find((c) => c.day === dayKey && c.slotIndex === slotIndex);
  };

  const handleDragStart = (e: React.DragEvent, cell: ScheduleCell) => {
    setDraggedCellId(cell.id);
    const payload = {
      type: 'cell',
      id: cell.id,
      subject: cell.subject,
      mode: cell.mode,
      sessionNumber: cell.sessionNumber,
    };
    e.dataTransfer.setData('text/plain', JSON.stringify(payload));
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDragOver = (e: React.DragEvent, cellId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverCellId !== cellId) {
      setDragOverCellId(cellId);
    }
  };

  const handleDragEnter = (e: React.DragEvent, cellId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCellId(cellId);
  };

  const handleDragLeave = (e: React.DragEvent, cellId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if leaving to an element outside the cell
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    if (dragOverCellId === cellId) {
      setDragOverCellId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetCellId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCellId(null);
    setDraggedCellId(null);

    try {
      const jsonStr = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
      if (jsonStr) {
        try {
          const parsed = JSON.parse(jsonStr);
          onCellDrop(targetCellId, parsed);
          return;
        } catch {
          // If plain text
          if (jsonStr.trim()) {
            onCellDrop(targetCellId, { type: 'palette-subject', subject: jsonStr.trim() });
            return;
          }
        }
      }

      const subjectName = e.dataTransfer.getData('subject-name');
      const subjectMode = e.dataTransfer.getData('subject-mode') as StudyMode;
      if (subjectName !== undefined) {
        onCellDrop(targetCellId, { type: 'palette-subject', subject: subjectName, mode: subjectMode || 'study' });
      }
    } catch (err) {
      console.error('Failed to parse dropped data', err);
    }
  };

  const handleCellClick = (cell: ScheduleCell) => {
    if (activeBrush && onApplyBrush) {
      onApplyBrush(cell.id);
    } else {
      onCellClick(cell);
    }
  };

  return (
    <div
      id="schedule-table-printable"
      className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-stone-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden mb-5 transition-colors"
    >
      {/* Header Bar */}
      <div className="px-4 py-2.5 bg-stone-50/90 dark:bg-zinc-800/90 border-b border-stone-200/80 dark:border-zinc-700/80 flex items-center justify-between gap-3 flex-wrap">
        <span className="font-bold text-sm text-stone-900 dark:text-zinc-100">
          جدول هفتگی برنامه‌ریزی
        </span>
        <span className="text-xs font-semibold text-stone-600 dark:text-zinc-300 bg-stone-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-stone-200/80 dark:border-zinc-700/80 tabular-nums">
          {toPersianDigits(slotCount)} پارت در روز • هر پارت {toPersianDigits(slotDurationMinutes)} دقیقه
        </span>
      </div>

      {/* Scrollable container for responsive design */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-right min-w-[760px] table-fixed" dir={direction}>
          <thead>
            <tr className="bg-stone-100/90 dark:bg-zinc-800/80 border-b border-stone-200/90 dark:border-zinc-700/80 text-stone-800 dark:text-zinc-200">
              {/* Row index / Time column header */}
              <th className="p-3 text-center text-xs font-bold w-[12%] border-l border-stone-200/80 dark:border-zinc-700/80">
                <span className="flex flex-col items-center justify-center gap-0.5 text-stone-600 dark:text-zinc-400">
                  <span className="flex items-center gap-1 font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    زنگ / روز
                  </span>
                  <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 tabular-nums">
                    {toPersianDigits(slotDurationMinutes)} دقیقه
                  </span>
                </span>
              </th>

              {/* Day Headers */}
              {days.map((day) => {
                const dayDone = cells.filter((c) => c.day === day.key && c.completed).length;
                const dayTotal = cells.filter((c) => c.day === day.key && c.subject.trim()).length;

                return (
                  <th
                    key={day.key}
                    className={`p-2.5 text-center border-l border-stone-200/80 dark:border-zinc-700/80 last:border-l-0 w-[12.57%] ${
                      day.isWeekend
                        ? 'bg-amber-50/60 dark:bg-zinc-800/90 text-amber-900 dark:text-amber-300'
                        : 'text-stone-800 dark:text-zinc-200'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <span className="text-sm font-black">{day.label}</span>
                      <div className="flex items-center gap-1">
                        {day.isWeekend && (
                          <span className="text-[9px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded">
                            تعطیل
                          </span>
                        )}
                        {dayTotal > 0 && (
                          <span className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400 tabular-nums">
                            {toPersianDigits(dayDone)}/{toPersianDigits(dayTotal)}
                          </span>
                        )}
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/70">
            {Array.from({ length: slotCount }).map((_, slotIdx) => {
              const slotInfo = getSlotInfo(slotIdx, slotDurationMinutes);

              return (
                <tr
                  key={slotIdx}
                  className={`transition-colors ${
                    slotIdx % 2 === 0
                      ? 'bg-stone-50/30 dark:bg-zinc-900/30 hover:bg-stone-50/70 dark:hover:bg-zinc-800/40'
                      : 'bg-white dark:bg-zinc-900/70 hover:bg-stone-50/70 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  {/* Time slot label on the side */}
                  <td className="p-2 text-center border-l border-stone-200/70 dark:border-zinc-800 bg-stone-100/40 dark:bg-zinc-800/40 text-stone-600 dark:text-zinc-400 select-none">
                    <div className="font-bold text-xs text-stone-800 dark:text-zinc-200">{slotInfo.name}</div>
                    <div className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400 mt-0.5 dir-ltr text-center tabular-nums">
                      {slotInfo.time}
                    </div>
                    <div className="text-[10px] font-medium text-teal-600/90 dark:text-teal-400/90 tabular-nums mt-0.5">
                      {toPersianDigits(slotDurationMinutes)} دقیقه
                    </div>
                  </td>

                  {/* Day cells */}
                  {days.map((day) => {
                    const cell = getCell(day.key, slotIdx);
                    if (!cell) {
                      return (
                        <td
                          key={day.key}
                          className="p-2 border-l border-stone-200/50 dark:border-zinc-800/60 last:border-l-0 text-center text-stone-300 dark:text-zinc-700"
                        >
                          -
                        </td>
                      );
                    }

                    const hasSubject = Boolean(cell.subject?.trim());
                    const isHighlighted = Boolean(highlightedSubject && cell.subject === highlightedSubject);
                    const isDimmed = Boolean(highlightedSubject && cell.subject !== highlightedSubject && hasSubject);
                    const isDragTarget = dragOverCellId === cell.id;
                    const isDraggingThis = draggedCellId === cell.id;
                    const isClass = cell.mode === 'class';
                    const isStudy = cell.mode === 'study';
                    const isTest = cell.mode === 'test';
                    const isCompleted = !!cell.completed;
                    const cellTime = cellTimeMap.get(cell.id) || getCellTimeInfo(cell, slotDurationMinutes);
                    const subStyle = hasSubject ? getSubjectStyle(cell.subject!) : null;

                    return (
                      <td
                        key={day.key}
                        onDragOver={(e) => handleDragOver(e, cell.id)}
                        onDragEnter={(e) => handleDragEnter(e, cell.id)}
                        onDragLeave={(e) => handleDragLeave(e, cell.id)}
                        onDrop={(e) => handleDrop(e, cell.id)}
                        className={`p-1 md:p-1.5 border-l border-stone-200/60 dark:border-zinc-800/70 last:border-l-0 relative transition-all ${
                          isDragTarget
                            ? 'bg-teal-100/70 dark:bg-teal-950/70 ring-2 ring-teal-500 ring-inset z-20 scale-[1.02]'
                            : ''
                        }`}
                      >
                        <div
                          draggable={hasSubject}
                          onDragStart={(e) => handleDragStart(e, cell)}
                          onClick={() => handleCellClick(cell)}
                          className={`group relative min-h-[50px] p-1.5 rounded-xl flex flex-col justify-center items-center text-center cursor-pointer select-none transition-all duration-200 border ${
                            isDragTarget
                              ? 'border-teal-500 bg-teal-50/90 dark:bg-teal-900/40 shadow-md scale-[1.02]'
                              : isHighlighted && subStyle
                              ? `${subStyle.highlightCellBg} ${subStyle.highlightCellBorder} ${subStyle.highlightCellRing} font-black z-10 scale-[1.03] shadow-md`
                              : hasSubject
                              ? isCompleted
                                ? 'bg-stone-50/80 dark:bg-zinc-800/40 border-stone-200/60 dark:border-zinc-800 opacity-60 hover:opacity-90'
                                : 'bg-white dark:bg-zinc-800/90 border-stone-200/80 dark:border-zinc-700/60 shadow-2xs hover:shadow-md hover:border-teal-400 dark:hover:border-teal-500 hover:-translate-y-0.5'
                              : 'bg-stone-50/30 dark:bg-zinc-800/20 border-dashed border-stone-200 dark:border-zinc-800 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50/20 dark:hover:bg-teal-950/20'
                          } ${isDimmed ? 'opacity-30 grayscale-[25%] scale-[0.98]' : ''} ${
                            isDraggingThis ? 'opacity-20' : ''
                          }`}
                        >
                          {/* Done Checkbox */}
                          {hasSubject && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleComplete(cell.id);
                              }}
                              className="absolute top-1 right-1 text-stone-300 dark:text-zinc-600 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                              title={isCompleted ? 'تکمیل شده' : 'تیک انجام پارت'}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />
                              )}
                            </button>
                          )}

                          {/* Custom Time Badge if customized */}
                          {cellTime.isCustom && hasSubject && (
                            <div
                              className="absolute top-1 left-1 px-1 py-0.2 rounded text-[9px] font-bold tabular-nums bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/80 flex items-center gap-0.5"
                              title={`زمان‌بندی اختصاصی: ${cellTime.time}`}
                            >
                              <Clock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                              <span>{cellTime.startTimeStr}</span>
                            </div>
                          )}

                          {/* Subject Name & Details */}
                          {hasSubject ? (
                            <div className="w-full flex flex-col items-center justify-center">
                              <div className="flex items-center justify-center gap-1">
                                <span
                                  className={`text-xs sm:text-sm font-black tracking-tight leading-tight transition-colors ${
                                    isCompleted
                                      ? 'line-through text-stone-400 dark:text-zinc-600'
                                      : isClass
                                      ? 'text-cyan-600 dark:text-cyan-400 font-black'
                                      : isStudy
                                      ? 'text-violet-600 dark:text-violet-400 font-black'
                                      : 'text-stone-900 dark:text-white font-black'
                                  }`}
                                >
                                  {cell.subject}
                                </span>

                                {cell.sessionNumber !== undefined && cell.sessionNumber !== null && cell.sessionNumber !== '' && (
                                  <span
                                    className={`inline-flex items-center justify-center min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-black tabular-nums border leading-none shrink-0 ${
                                      isClass
                                        ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border-cyan-300/80 dark:border-cyan-800/80'
                                        : isStudy
                                        ? 'bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 border-violet-300/80 dark:border-violet-800/80'
                                        : 'bg-stone-100 dark:bg-zinc-700 text-stone-800 dark:text-zinc-200 border-stone-300 dark:border-zinc-600'
                                    }`}
                                    title={`جلسه ${cell.sessionNumber}`}
                                  >
                                    {toPersianDigits(cell.sessionNumber)}
                                  </span>
                                )}
                              </div>

                              {/* Mode Indicator */}
                              <div className="flex items-center justify-center gap-1 text-[9px] font-semibold mt-0.5 leading-none">
                                {isClass && (
                                  <span className="inline-flex items-center gap-0.5 text-cyan-600 dark:text-cyan-400">
                                    <GraduationCap className="w-2.5 h-2.5 text-cyan-500" />
                                    کلاس
                                  </span>
                                )}

                                {isStudy && (
                                  <span className="inline-flex items-center gap-0.5 text-violet-600 dark:text-violet-400">
                                    <BookOpen className="w-2.5 h-2.5 text-violet-500" />
                                    مطالعه
                                  </span>
                                )}

                                {isTest && (
                                  <span className="inline-flex items-center gap-0.5 text-stone-500 dark:text-zinc-400">
                                    <PenTool className="w-2.5 h-2.5 text-stone-400 dark:text-zinc-400" />
                                    تمرین
                                  </span>
                                )}
                              </div>

                              {cell.notes && (
                                <div
                                  className="text-[9px] text-stone-400 dark:text-zinc-500 truncate max-w-[85px] mt-0.5 leading-tight"
                                  title={cell.notes}
                                >
                                  {cell.notes}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-stone-300 dark:text-zinc-700 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                              {isDragTarget ? (
                                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">رها کنید</span>
                              ) : (
                                <Plus className="w-3.5 h-3.5" />
                              )}
                            </div>
                          )}

                          {/* Quick Mode Switcher on Hover */}
                          {hasSubject && !isCompleted && !activeBrush && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleMode(cell.id);
                              }}
                              className="absolute bottom-1 left-1 p-0.5 rounded text-stone-300 dark:text-zinc-600 hover:text-stone-700 dark:hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title={
                                isClass
                                  ? 'تغییر به ۲. مطالعه فردی (بنفش)'
                                  : isStudy
                                  ? 'تغییر به ۳. تست و تمرین (سفید)'
                                  : 'تغییر به ۱. کلاس درس (آبی)'
                              }
                            >
                              {isClass ? (
                                <BookOpen className="w-3 h-3 text-violet-500" />
                              ) : isStudy ? (
                                <PenTool className="w-3 h-3 text-stone-400 dark:text-zinc-300" />
                              ) : (
                                <GraduationCap className="w-3 h-3 text-cyan-500" />
                              )}
                            </button>
                          )}

                          {/* Grip icon when draggable */}
                          {hasSubject && !isCompleted && (
                            <div className="absolute top-1.5 left-1.5 text-stone-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <GripVertical className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer Guide (Order: 1. کلاس, 2. مطالعه, 3. تست) */}
      <div className="px-4 py-2.5 bg-stone-50/90 dark:bg-zinc-800/50 border-t border-stone-200/80 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500 dark:text-zinc-400">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <span className="text-cyan-600 dark:text-cyan-400 font-bold">۱. کلاس درس:</span>
            <span className="inline-flex items-center gap-1 text-cyan-700 dark:text-cyan-300 font-semibold">
              <GraduationCap className="w-3.5 h-3.5 text-cyan-500" />
              متن آبی
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
            <span className="text-violet-600 dark:text-violet-400 font-bold">۲. مطالعه فردی:</span>
            <span className="inline-flex items-center gap-1 text-violet-700 dark:text-violet-300 font-semibold">
              <BookOpen className="w-3.5 h-3.5 text-violet-500" />
              متن بنفش
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-800 dark:bg-zinc-100 ring-1 ring-stone-400/40" />
            <span className="font-bold text-stone-800 dark:text-zinc-100">۳. تست و تمرین:</span>
            <span className="inline-flex items-center gap-1 text-stone-700 dark:text-zinc-300">
              <PenTool className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-400" />
              متن سفید
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">تیک:</span>
            <span>پارت انجام شده</span>
          </div>
        </div>

        <div className="text-[11px] text-stone-400 dark:text-zinc-500">
          برای ویرایش یا تغییر وضعیت، روی خانه کلیک کنید.
        </div>
      </div>
    </div>
  );
};

