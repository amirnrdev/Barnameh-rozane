import React, { useState, useEffect } from 'react';
import { ScheduleCell, StudyMode } from '../types';
import {
  DAYS_CONFIG,
  getSlotInfo,
  toPersianDigits,
  parseTimeToMinutes,
  formatMinutesToPersianTime,
  formatMinutesToStandardTime,
  isTimeForbidden,
} from '../constants';
import {
  X,
  Check,
  Trash2,
  BookOpen,
  GraduationCap,
  PenTool,
  CheckCircle2,
  Clock,
  RotateCcw,
} from 'lucide-react';

interface EditCellModalProps {
  cell: ScheduleCell | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCell: ScheduleCell) => void;
  onClear: (cellId: string) => void;
  customSubjects: string[];
  slotDurationMinutes?: number;
}

const COMMON_START_TIMES = [
  '07:30',
  '08:00',
  '08:30',
  '10:15',
  '12:00',
  '14:30',
  '16:15',
  '18:00',
  '20:15',
  '22:00',
];

const COMMON_DURATIONS = [45, 60, 75, 90, 105, 120];

export const EditCellModal: React.FC<EditCellModalProps> = ({
  cell,
  isOpen,
  onClose,
  onSave,
  onClear,
  customSubjects,
  slotDurationMinutes = 90,
}) => {
  const [subject, setSubject] = useState('');
  const [sessionNumber, setSessionNumber] = useState('');
  const [mode, setMode] = useState<StudyMode>('test');
  const [notes, setNotes] = useState('');
  const [completed, setCompleted] = useState(false);
  const [customStartTime, setCustomStartTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(slotDurationMinutes);
  const [showAdvancedTime, setShowAdvancedTime] = useState(false);

  useEffect(() => {
    if (cell) {
      setSubject(cell.subject || '');
      setSessionNumber(
        cell.sessionNumber !== undefined && cell.sessionNumber !== null
          ? String(cell.sessionNumber)
          : ''
      );
      setMode(cell.mode || 'test');
      setNotes(cell.notes || '');
      setCompleted(!!cell.completed);
      setCustomStartTime(cell.customStartTime || '');
      setDuration(cell.durationMinutes || slotDurationMinutes);
      setShowAdvancedTime(Boolean(cell.customStartTime || (cell.durationMinutes && cell.durationMinutes !== slotDurationMinutes)));
    }
  }, [cell, slotDurationMinutes]);

  if (!isOpen || !cell) return null;

  const dayInfo = DAYS_CONFIG.find((d) => d.key === cell.day);
  const slotInfo = getSlotInfo(cell.slotIndex, slotDurationMinutes);
  const quickSubjects = Array.from(new Set(['زیست', 'شیمی', 'فیزیک', 'ریاضی', 'زمین', 'جبرانی', ...customSubjects]));

  // Calculate live effective time
  const effectiveStartMinutes = customStartTime
    ? parseTimeToMinutes(customStartTime) ?? slotInfo.startTotalMinutes
    : slotInfo.startTotalMinutes;
  const effectiveEndMinutes = effectiveStartMinutes + (duration || slotDurationMinutes);
  const computedStartStr = formatMinutesToPersianTime(effectiveStartMinutes);
  const computedEndStr = formatMinutesToPersianTime(effectiveEndMinutes);
  const isCustomTimeActive = Boolean(customStartTime || duration !== slotDurationMinutes);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSession = sessionNumber.trim();
    
    let finalDuration = duration > 0 ? duration : slotDurationMinutes;
    const finalStart = customStartTime.trim() ? customStartTime.trim() : undefined;
    const parsedStart = finalStart ? parseTimeToMinutes(finalStart) : slotInfo.startTotalMinutes;
    if (parsedStart !== null) {
      let parsedEnd = parsedStart + finalDuration;
      if (isTimeForbidden(parsedEnd)) {
        const maxAllowedEnd = parsedStart >= 420 ? 1530 : 90;
        if (parsedEnd > maxAllowedEnd) {
          parsedEnd = maxAllowedEnd;
          finalDuration = Math.max(10, parsedEnd - parsedStart);
        }
      }
    }

    onSave({
      ...cell,
      subject: subject.trim(),
      sessionNumber: cleanSession ? (!isNaN(Number(cleanSession)) ? Number(cleanSession) : cleanSession) : undefined,
      mode,
      notes: notes.trim(),
      completed,
      customStartTime: finalStart,
      durationMinutes: finalDuration,
    });
    onClose();
  };

  const handleClearCell = () => {
    onClear(cell.id);
    onClose();
  };

  const handleResetTimeToSlotDefault = () => {
    setCustomStartTime('');
    setDuration(slotDurationMinutes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-zinc-800 overflow-hidden text-stone-900 dark:text-zinc-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-stone-50/80 dark:bg-zinc-800/60 border-b border-stone-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold">ویرایش پارت مطالعاتی</h3>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300">
                {dayInfo?.label}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5 tabular-nums">
              {slotInfo.name} • {computedStartStr} تا {computedEndStr} ({toPersianDigits(duration)} دقیقه)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Subject and Session Number selection */}
          <div>
            <div className="grid grid-cols-4 gap-2.5">
              <div className="col-span-3">
                <label className="block font-bold text-stone-700 dark:text-zinc-300 mb-1">
                  نام درس
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="زیست، شیمی، فیزیک..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-zinc-700 bg-stone-50/50 dark:bg-zinc-800/60 text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-sm"
                  autoFocus
                />
              </div>

              <div className="col-span-1">
                <label className="block font-bold text-stone-700 dark:text-zinc-300 mb-1 truncate" title="شماره جلسه">
                  شماره جلسه
                </label>
                <input
                  type="text"
                  value={sessionNumber}
                  onChange={(e) => setSessionNumber(e.target.value)}
                  placeholder="مثلاً ۱"
                  className="w-full px-2.5 py-2 rounded-xl border border-stone-300 dark:border-zinc-700 bg-stone-50/50 dark:bg-zinc-800/60 text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-sm text-center tabular-nums"
                />
              </div>
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickSubjects.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSubject(sub)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    subject === sub
                      ? 'bg-teal-600 text-white border-teal-600 font-bold'
                      : 'bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 border-stone-200 dark:border-zinc-700 hover:bg-stone-50 dark:hover:bg-zinc-700'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Time & Duration Editor Section */}
          <div className="p-3 bg-stone-50 dark:bg-zinc-800/50 rounded-xl border border-stone-200/80 dark:border-zinc-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-stone-800 dark:text-zinc-200">
                <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>ساعت شروع و مدت زمان</span>
              </div>
              {isCustomTimeActive && (
                <button
                  type="button"
                  onClick={handleResetTimeToSlotDefault}
                  className="flex items-center gap-1 text-[11px] text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>زمان پیش‌فرض ({slotInfo.rawStartTime})</span>
                </button>
              )}
            </div>

            {/* Start Time Input & Presets */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-stone-600 dark:text-zinc-400 font-medium">
                  ساعت شروع:
                </label>
                <input
                  type="text"
                  placeholder="07:00"
                  value={customStartTime || slotInfo.rawStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                  className="px-2.5 py-1 w-20 text-center rounded-lg border border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 font-bold text-xs text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500 tabular-nums"
                  title="ساعت شروع به فرمت ۲۴ ساعته (مثال: 14:30)"
                />
                <span className="text-[11px] text-stone-400 dark:text-zinc-500 font-semibold tabular-nums">
                  (فرمت ۲۴ ساعته • پایان: {computedEndStr})
                </span>
              </div>

              {isTimeForbidden(effectiveEndMinutes) && (
                <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mb-2 p-1.5 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-200/50 dark:border-rose-900/30">
                  ⚠️ پایان این پارت بعد از ۰۱:۳۰ بامداد است که مجاز نیست. در صورت ذخیره، زمان به طور خودکار به ۰۱:۳۰ تغییر داده می‌شود.
                </div>
              )}

              {/* Quick Start Time Chips */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-stone-400 dark:text-zinc-500 ml-1">سریع:</span>
                {COMMON_START_TIMES.map((timeStr) => {
                  const isSelected = (customStartTime || slotInfo.rawStartTime) === timeStr;
                  return (
                    <button
                      key={timeStr}
                      type="button"
                      onClick={() => setCustomStartTime(timeStr)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold tabular-nums transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-600 text-white font-bold'
                          : 'bg-white dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700 hover:border-teal-400'
                      }`}
                    >
                      {toPersianDigits(timeStr)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration Input & Presets */}
            <div className="pt-2 border-t border-stone-200/60 dark:border-zinc-700/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-stone-600 dark:text-zinc-400 font-medium">
                  مدت زمان این پارت:
                </span>
                <span className="font-bold text-stone-800 dark:text-zinc-200 tabular-nums">
                  {toPersianDigits(duration)} دقیقه
                </span>
              </div>

              <div className="flex flex-wrap gap-1">
                {COMMON_DURATIONS.map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setDuration(dur)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums transition-all cursor-pointer ${
                      duration === dur
                        ? 'bg-stone-800 dark:bg-zinc-200 text-white dark:text-zinc-900 shadow-2xs'
                        : 'bg-white dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700 hover:bg-stone-50 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {toPersianDigits(dur)} دقیقه
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mode Selection: 1. کلاس, 2. مطالعه, 3. تست */}
          <div>
            <label className="block font-bold text-stone-700 dark:text-zinc-300 mb-1.5">
              نوع پارت مطالعاتی
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* ۱. کلاس درس (آبی) */}
              <button
                type="button"
                onClick={() => setMode('class')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                  mode === 'class'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/50 text-cyan-900 dark:text-cyan-200 font-bold ring-1 ring-cyan-500'
                    : 'border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-700/50'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-cyan-500 shrink-0" />
                <div>
                  <div className="text-xs text-cyan-600 dark:text-cyan-400 font-bold">۱. کلاس درس</div>
                  <div className="text-[10px] text-cyan-500 font-medium">فونت آبی (مطابق تصویر)</div>
                </div>
              </button>

              {/* ۲. مطالعه فردی (بنفش) */}
              <button
                type="button"
                onClick={() => setMode('study')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                  mode === 'study'
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-900 dark:text-violet-200 font-bold ring-1 ring-violet-500'
                    : 'border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-700/50'
                }`}
              >
                <BookOpen className="w-4 h-4 text-violet-500 shrink-0" />
                <div>
                  <div className="text-xs text-violet-600 dark:text-violet-400 font-bold">۲. مطالعه فردی</div>
                  <div className="text-[10px] text-violet-500 font-medium">فونت بنفش / درسنامه</div>
                </div>
              </button>

              {/* ۳. تمرین (سفید) */}
              <button
                type="button"
                onClick={() => setMode('test')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                  mode === 'test'
                    ? 'border-stone-800 dark:border-zinc-200 bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold ring-1 ring-stone-800 dark:ring-zinc-200 shadow-sm'
                    : 'border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-700/50'
                }`}
              >
                <PenTool className="w-4 h-4 shrink-0" />
                <div>
                  <div className="text-xs font-bold">۳. تمرین</div>
                  <div className="text-[10px] opacity-70">فونت سفید / حل تمرین</div>
                </div>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-stone-700 dark:text-zinc-300 mb-1">
              توضیحات و مباحث (اختیاری)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="مثلاً: حل تست‌های کنکور سراسری..."
              className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-zinc-700 bg-stone-50/50 dark:bg-zinc-800/60 text-stone-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          {/* Completed Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="completedCheck"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-stone-300 cursor-pointer"
            />
            <label
              htmlFor="completedCheck"
              className="font-semibold text-stone-700 dark:text-zinc-300 select-none cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${completed ? 'text-emerald-500' : 'text-stone-400'}`} />
              این پارت مطالعه شده است
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleClearCell}
              className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              خالی کردن خانه
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                ذخیره
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
