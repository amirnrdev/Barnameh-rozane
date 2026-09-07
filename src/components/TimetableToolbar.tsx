import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, Printer, Plus, Minus, ArrowLeftRight, Clock, Loader2, Check, ChevronDown, FileDown } from 'lucide-react';
import { toPersianDigits } from '../constants';
import { exportTimetable } from '../utils/exportPdf';
import { ExportModal } from './ExportModal';

interface TimetableToolbarProps {
  onResetToOriginal: () => void;
  direction: 'rtl' | 'ltr';
  onToggleDirection: () => void;
  slotCount: number;
  onAddSlot: () => void;
  onRemoveSlot: () => void;
  slotDurationMinutes: number;
  onChangeDuration: (minutes: number) => void;
}

export const TimetableToolbar: React.FC<TimetableToolbarProps> = ({
  onResetToOriginal,
  direction,
  onToggleDirection,
  slotCount,
  onAddSlot,
  onRemoveSlot,
  slotDurationMinutes,
  onChangeDuration,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isQuickExporting, setIsQuickExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const durationMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    if (!showSettings) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (durationMenuRef.current && !durationMenuRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSettings]);

  const handleResetClick = () => {
    onResetToOriginal();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 2000);
  };

  const handleQuickPdfExport = async () => {
    if (isQuickExporting) return;
    setIsQuickExporting(true);
    setExportSuccess(false);

    try {
      const result = await exportTimetable('schedule-table-printable', {
        format: 'pdf',
        themeMode: 'light', // Light mode is standard and printer-friendly
        slotCount,
        slotDurationMinutes,
      });

      if (result.success) {
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 2500);
      } else {
        // If element not found or another error, open modal so user has options
        setIsExportModalOpen(true);
      }
    } catch (e) {
      setIsExportModalOpen(true);
    } finally {
      setIsQuickExporting(false);
    }
  };

  return (
    <>
      <div className={`bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-stone-200/80 dark:border-zinc-800/80 p-3 mb-5 flex flex-wrap items-center justify-between gap-2.5 transition-colors relative ${showSettings ? 'z-40' : 'z-20'}`}>
        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleResetClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              resetSuccess
                ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                : 'border-stone-200/90 dark:border-zinc-700/80 bg-stone-50/80 dark:bg-zinc-800/60 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300'
            }`}
            title="بازگرداندن به حالت اولیه"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetSuccess ? 'text-teal-600 dark:text-teal-400 rotate-180 transition-transform' : 'text-stone-400 dark:text-zinc-500'}`} />
            <span>{resetSuccess ? 'بازنشانی شد ✓' : 'بازنشانی پیش‌فرض'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleDirection}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200/90 dark:border-zinc-700/80 bg-stone-50/80 dark:bg-zinc-800/60 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 text-xs font-semibold transition-all cursor-pointer"
            title="تغییر جهت چینش روزها"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-500" />
            <span>{direction === 'rtl' ? 'شنبه تا جمعه' : 'چپ به راست'}</span>
          </button>

          {/* Direct PDF Export & Dropdown */}
          <div className="inline-flex items-center rounded-xl border border-teal-600/60 dark:border-teal-700/70 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 text-xs font-bold overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={handleQuickPdfExport}
              disabled={isQuickExporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 hover:bg-teal-100/80 dark:hover:bg-teal-900/50 transition-colors cursor-pointer disabled:opacity-50"
              title="دانلود فایل PDF"
            >
              {isQuickExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
              ) : exportSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <FileDown className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              )}
              <span>
                {isQuickExporting
                  ? 'در حال تولید...'
                  : exportSuccess
                  ? 'دانلود شد!'
                  : 'دانلود PDF'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="px-2 py-1.5 border-r border-teal-200 dark:border-teal-800 hover:bg-teal-100/80 dark:hover:bg-teal-900/50 transition-colors cursor-pointer"
              title="تنظیمات چاپ و تصویر"
            >
              <ChevronDown className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            </button>
          </div>
        </div>

      {/* Settings / Controls */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <div className="flex items-center border border-stone-200/80 dark:border-zinc-700/80 rounded-xl bg-stone-50/90 dark:bg-zinc-800/60 p-1 text-stone-700 dark:text-zinc-300 font-semibold">
          <span className="px-2 text-stone-500 dark:text-zinc-400">زنگ‌ها: {toPersianDigits(slotCount)}</span>
          <button
            type="button"
            onClick={onRemoveSlot}
            disabled={slotCount <= 5}
            className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-lg disabled:opacity-30 transition-colors cursor-pointer"
            title="کاهش یک زنگ"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onAddSlot}
            disabled={slotCount >= 9}
            className="p-1 hover:bg-white dark:hover:bg-zinc-700 rounded-lg disabled:opacity-30 transition-colors cursor-pointer"
            title={slotCount >= 9 ? "حداکثر ۹ زنگ مجاز است (تا ساعت ۱:۳۰ بامداد)" : "افزودن زنگ جدید"}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Duration picker */}
        <div className="relative" ref={durationMenuRef}>
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              showSettings
                ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 ring-1 ring-teal-500'
                : 'border-stone-200/90 dark:border-zinc-700/80 bg-stone-50/80 dark:bg-zinc-800/60 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300'
            } text-xs font-semibold`}
            title="تنظیم و ویرایش مدت زمان هر پارت"
          >
            <Clock className="w-3.5 h-3.5 text-teal-500" />
            <span>هر زنگ: {toPersianDigits(slotDurationMinutes)} دقیقه</span>
          </button>

          {showSettings && (
            <div className="absolute left-0 top-full mt-2 w-64 max-w-[calc(100vw-2.5rem)] p-3.5 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-stone-200/90 dark:border-zinc-800 z-50 space-y-3 text-xs animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-500" />
                  <span>مدت زمان هر پارت (زنگ):</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 text-xs px-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Custom Number Input with - and + */}
              <div className="flex items-center justify-between gap-2 p-1.5 bg-stone-50 dark:bg-zinc-800/60 rounded-xl border border-stone-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => onChangeDuration(Math.max(15, slotDurationMinutes - 5))}
                  className="p-1.5 rounded-lg bg-white dark:bg-zinc-700 hover:bg-stone-200 dark:hover:bg-zinc-600 text-stone-700 dark:text-zinc-200 transition-colors cursor-pointer"
                  title="کاهش ۵ دقیقه"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={15}
                    max={240}
                    step={5}
                    value={slotDurationMinutes}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!isNaN(val) && val >= 10 && val <= 300) {
                        onChangeDuration(val);
                      }
                    }}
                    className="w-16 text-center font-bold text-sm bg-transparent text-stone-900 dark:text-zinc-100 focus:outline-none tabular-nums"
                  />
                  <span className="text-stone-500 dark:text-zinc-400 font-medium">دقیقه</span>
                </div>

                <button
                  type="button"
                  onClick={() => onChangeDuration(Math.min(240, slotDurationMinutes + 5))}
                  className="p-1.5 rounded-lg bg-white dark:bg-zinc-700 hover:bg-stone-200 dark:hover:bg-zinc-600 text-stone-700 dark:text-zinc-200 transition-colors cursor-pointer"
                  title="افزایش ۵ دقیقه"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Presets */}
              <div>
                <div className="text-[11px] text-stone-400 dark:text-zinc-500 mb-1.5">انتخاب سریع:</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[45, 60, 75, 90, 105, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        onChangeDuration(mins);
                      }}
                      className={`py-1.5 px-2 rounded-xl text-center font-bold text-xs transition-all cursor-pointer ${
                        slotDurationMinutes === mins
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300'
                      }`}
                    >
                      {toPersianDigits(mins)}د {mins === 90 && <span className="text-[9px] block font-normal">(پیش‌فرض)</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[10px] text-stone-400 dark:text-zinc-500 pt-1 border-t border-stone-100 dark:border-zinc-800">
                این عدد در محاسبه ساعات کل هفته و زمان‌بندی زنگ‌ها اعمال می‌شود.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Export & Print Options Modal */}
    <ExportModal
      isOpen={isExportModalOpen}
      onClose={() => setIsExportModalOpen(false)}
      slotCount={slotCount}
      slotDurationMinutes={slotDurationMinutes}
    />
  </>
);
};
