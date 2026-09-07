import React, { useState } from 'react';
import { ActiveBrush, DayConfig, ScheduleCell, StudyMode } from '../types';
import { getSlotInfo, getCellTimeInfo, toPersianDigits, getSubjectStyle } from '../constants';
import { CheckCircle2, Circle, Edit3, ArrowLeft, ArrowRight, GraduationCap, PenTool, BookOpen, Plus, GripVertical, Clock } from 'lucide-react';

interface DayKanbanViewProps {
  days: DayConfig[];
  cells: ScheduleCell[];
  selectedDayKey: string;
  onSelectDay: (dayKey: string) => void;
  onCellClick: (cell: ScheduleCell) => void;
  onCellDrop?: (
    targetCellId: string,
    sourceData: {
      type: 'cell' | 'palette-subject' | 'palette-session';
      id?: string;
      subject?: string;
      mode?: StudyMode;
      sessionNumber?: number | string | '__CLEAR_SESSION__';
    }
  ) => void;
  onToggleComplete: (cellId: string) => void;
  onToggleMode: (cellId: string) => void;
  slotDurationMinutes: number;
  slotCount: number;
  activeBrush?: ActiveBrush | null;
  onApplyBrush?: (cellId: string) => void;
  highlightedSubject?: string | null;
}

export const DayKanbanView: React.FC<DayKanbanViewProps> = ({
  days,
  cells,
  selectedDayKey,
  onSelectDay,
  onCellClick,
  onCellDrop,
  onToggleComplete,
  onToggleMode,
  slotDurationMinutes,
  slotCount,
  activeBrush,
  onApplyBrush,
  highlightedSubject,
}) => {
  const [dragOverCellId, setDragOverCellId] = useState<string | null>(null);
  const [draggedCellId, setDraggedCellId] = useState<string | null>(null);

  const currentDay = days.find((d) => d.key === selectedDayKey) || days[0];
  const dayCells = cells
    .filter((c) => c.day === currentDay.key && c.slotIndex < slotCount)
    .sort((a, b) => a.slotIndex - b.slotIndex);

  const completedCount = dayCells.filter((c) => c.completed).length;
  const totalWithSubject = dayCells.filter((c) => c.subject.trim()).length;
  const progressPercent = totalWithSubject > 0 ? Math.round((completedCount / totalWithSubject) * 100) : 0;

  const currentIndex = days.findIndex((d) => d.key === currentDay.key);
  const handlePrevDay = () => {
    const prevIdx = (currentIndex - 1 + days.length) % days.length;
    onSelectDay(days[prevIdx].key);
  };
  const handleNextDay = () => {
    const nextIdx = (currentIndex + 1) % days.length;
    onSelectDay(days[nextIdx].key);
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

    if (!onCellDrop) return;

    try {
      const jsonStr = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
      if (jsonStr) {
        try {
          const parsed = JSON.parse(jsonStr);
          onCellDrop(targetCellId, parsed);
          return;
        } catch {
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
    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-stone-200/80 dark:border-zinc-800/80 shadow-xs p-4 sm:p-5 mb-5 transition-colors">
      {/* Day Selector Tabs Bar */}
      <div className="flex items-center justify-between gap-2 pb-4 border-b border-stone-100 dark:border-zinc-800/80 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-stone-100/80 dark:bg-zinc-800/60 rounded-xl overflow-x-auto max-w-full">
          {days.map((day) => {
            const isActive = day.key === currentDay.key;
            const dayDone = cells.filter((c) => c.day === day.key && c.completed).length;
            const dayTotal = cells.filter((c) => c.day === day.key && c.subject.trim()).length;

            return (
              <button
                key={day.key}
                type="button"
                onClick={() => onSelectDay(day.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-zinc-100 shadow-xs'
                    : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
                }`}
              >
                <span>{day.label}</span>
                {dayTotal > 0 && (
                  <span className="text-[10px] opacity-70 font-mono">
                    {toPersianDigits(dayDone)}/{toPersianDigits(dayTotal)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Navigation Prev / Next arrows */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
            title="روز قبل"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-stone-800 dark:text-zinc-200 min-w-[60px] text-center">
            {currentDay.label}
          </span>
          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
            title="روز بعد"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day Progress & Header Banner */}
      <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-stone-900 dark:text-zinc-100">
            برنامه {currentDay.label}
          </h3>
          <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5 font-mono">
            {toPersianDigits(dayCells.length)} پارت • {toPersianDigits(((dayCells.length * slotDurationMinutes) / 60).toFixed(1))} ساعت
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2.5 bg-stone-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-xl border border-stone-200/70 dark:border-zinc-800">
          <div className="w-20 bg-stone-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-teal-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-xs font-bold text-stone-700 dark:text-zinc-300">
            {toPersianDigits(progressPercent)}٪
          </div>
        </div>
      </div>

      {/* Cards List for the Selected Day */}
      <div className="space-y-2">
        {dayCells.map((cell) => {
          const slotInfo = getSlotInfo(cell.slotIndex, slotDurationMinutes);
          const cellTime = getCellTimeInfo(cell, slotDurationMinutes);
          const isClass = cell.mode === 'class';
          const isStudy = cell.mode === 'study';
          const isTest = cell.mode === 'test';
          const isCompleted = !!cell.completed;
          const isDragTarget = dragOverCellId === cell.id;
          const isDraggingThis = draggedCellId === cell.id;
          const hasSubject = Boolean(cell.subject?.trim());
          const isHighlighted = Boolean(highlightedSubject && cell.subject === highlightedSubject);
          const isDimmed = Boolean(highlightedSubject && cell.subject !== highlightedSubject && hasSubject);
          const subStyle = hasSubject ? getSubjectStyle(cell.subject) : null;

          return (
            <div
              key={cell.id}
              draggable={hasSubject}
              onDragStart={(e) => handleDragStart(e, cell)}
              onDragOver={(e) => handleDragOver(e, cell.id)}
              onDragEnter={(e) => handleDragEnter(e, cell.id)}
              onDragLeave={(e) => handleDragLeave(e, cell.id)}
              onDrop={(e) => handleDrop(e, cell.id)}
              onClick={() => handleCellClick(cell)}
              className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                isDragTarget
                  ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 ring-2 ring-teal-500 ring-inset scale-[1.01]'
                  : isHighlighted && subStyle
                  ? `${subStyle.highlightCellBg} ${subStyle.highlightCellBorder} ${subStyle.highlightCellRing} shadow-md`
                  : isCompleted
                  ? 'bg-stone-50/70 dark:bg-zinc-800/30 border-stone-200/60 dark:border-zinc-800 opacity-60'
                  : 'bg-white dark:bg-zinc-800/60 border-stone-200/80 dark:border-zinc-700/60 hover:border-teal-400 dark:hover:border-teal-500'
              } ${isDimmed ? 'opacity-30 grayscale-[20%]' : ''} ${isDraggingThis ? 'opacity-20' : ''}`}
            >
              <div className="flex items-center gap-3">
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleComplete(cell.id);
                  }}
                  className="p-1 text-stone-400 dark:text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                  title={isCompleted ? 'علامت‌گذاری به عنوان انجام نشده' : 'علامت‌گذاری به عنوان انجام شده'}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                {/* Slot index badge */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-stone-700 dark:text-zinc-200">
                      {slotInfo.name}
                    </span>
                    {cellTime.isCustom && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/80">
                        سفارشی
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-stone-500 dark:text-zinc-400 tabular-nums dir-ltr text-right">
                    {cellTime.time}
                  </span>
                </div>

                <div className="h-6 w-[1px] bg-stone-200 dark:bg-zinc-800" />

                {/* Subject Title & Tags */}
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${
                        isCompleted
                          ? 'line-through text-stone-400 dark:text-zinc-600'
                          : isClass
                          ? 'text-cyan-600 dark:text-cyan-400 font-extrabold'
                          : isStudy
                          ? 'text-violet-600 dark:text-violet-400 font-extrabold'
                          : 'text-stone-900 dark:text-white font-extrabold'
                      }`}
                    >
                      {cell.subject || (
                        <span className="text-stone-400 dark:text-zinc-500 font-normal flex items-center gap-1">
                          <Plus className="w-3.5 h-3.5" />
                          <span>پارت خالی</span>
                        </span>
                      )}
                    </span>

                    {/* Session Number Tag */}
                    {cell.sessionNumber !== undefined && cell.sessionNumber !== null && cell.sessionNumber !== '' && (
                      <span
                        className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full text-[10px] font-black bg-stone-100 dark:bg-zinc-800 text-stone-800 dark:text-zinc-200 border border-stone-300 dark:border-zinc-700 tabular-nums leading-none shrink-0"
                        title={`جلسه ${cell.sessionNumber}`}
                      >
                        {toPersianDigits(cell.sessionNumber)}
                      </span>
                    )}

                    {cell.subject && !activeBrush && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleMode(cell.id);
                        }}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1 ${
                          isClass
                            ? 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/40'
                            : isStudy
                            ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/40'
                            : 'bg-stone-100 dark:bg-zinc-700 text-stone-800 dark:text-zinc-100 border border-stone-200/60 dark:border-zinc-600'
                        }`}
                        title={
                          isClass
                            ? 'تغییر به ۲. مطالعه فردی (بنفش)'
                            : isStudy
                            ? 'تغییر به ۳. تمرین (سفید)'
                            : 'تغییر به ۱. کلاس درس (آبی)'
                        }
                      >
                        {isClass ? (
                          <>
                            <GraduationCap className="w-3 h-3 text-cyan-500" />
                            <span>کلاس درس</span>
                          </>
                        ) : isStudy ? (
                          <>
                            <BookOpen className="w-3 h-3 text-violet-500" />
                            <span>مطالعه فردی</span>
                          </>
                        ) : (
                          <>
                            <PenTool className="w-3 h-3 text-stone-500 dark:text-zinc-300" />
                            <span>تمرین</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {cell.notes && (
                    <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">{cell.notes}</p>
                  )}
                </div>
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-1">
                {hasSubject && (
                  <div className="text-stone-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none p-1">
                    <GripVertical className="w-4 h-4" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCellClick(cell);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>ویرایش</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

