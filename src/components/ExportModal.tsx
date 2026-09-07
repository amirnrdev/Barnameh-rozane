import React, { useState } from 'react';
import { FileText, Image as ImageIcon, Check, Loader2, X, Printer, Sparkles, Sun, Moon } from 'lucide-react';
import { exportTimetable, ExportOptions } from '../utils/exportPdf';
import { toPersianDigits } from '../constants';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotCount: number;
  slotDurationMinutes: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  slotCount,
  slotDurationMinutes,
}) => {
  const [format, setFormat] = useState<'pdf' | 'png'>('pdf');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'current'>('light');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsSuccess(false);

    try {
      const options: ExportOptions = {
        format,
        themeMode,
        slotCount,
        slotDurationMinutes,
      };

      const result = await exportTimetable('schedule-table-printable', options);

      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          onClose();
        }, 1800);
      } else {
        setErrorMessage(result.error || 'خطا در خروجی');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'خطا در برقراری ارتباط');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden transition-all text-stone-900 dark:text-zinc-100"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200/60 dark:border-teal-800/60">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-stone-900 dark:text-zinc-100">
                خروجی و چاپ برنامه هفتگی
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                {toPersianDigits(slotCount)} زنگ • هر پارت {toPersianDigits(slotDurationMinutes)} دقیقه
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Format selection */}
          <div>
            <label className="block font-bold text-stone-700 dark:text-zinc-300 mb-2">
              فرمت خروجی
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`p-3 rounded-2xl border text-right transition-all flex flex-col gap-1 cursor-pointer ${
                  format === 'pdf'
                    ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-bold ring-1 ring-teal-500'
                    : 'border-stone-200 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-800/40 text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span className="font-bold">فایل PDF (A4)</span>
                  </div>
                  {format === 'pdf' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                </div>
                <span className="text-[10px] opacity-75 font-normal">
                  استاندارد، مناسب پرینت کاغذی و چسباندن روی میز
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('png')}
                className={`p-3 rounded-2xl border text-right transition-all flex flex-col gap-1 cursor-pointer ${
                  format === 'png'
                    ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-bold ring-1 ring-teal-500'
                    : 'border-stone-200 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-800/40 text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span className="font-bold">تصویر باکیفیت PNG</span>
                  </div>
                  {format === 'png' && <Check className="w-3.5 h-3.5 text-teal-600" />}
                </div>
                <span className="text-[10px] opacity-75 font-normal">
                  مناسب ارسال در تلگرام، گالری گوشی و والپیپر
                </span>
              </button>
            </div>
          </div>

          {/* Theme selection */}
          <div>
            <label className="block font-bold text-stone-700 dark:text-zinc-300 mb-2">
              طرح رنگ چاپ
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setThemeMode('light')}
                className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                  themeMode === 'light'
                    ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200 font-bold'
                    : 'border-stone-200 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-800/40 text-stone-600 dark:text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="font-semibold text-xs">قالب روشن (استاندارد)</div>
                    <div className="text-[10px] opacity-70">صرفه‌جویی در جوهر پرینتر</div>
                  </div>
                </div>
                {themeMode === 'light' && <Check className="w-3.5 h-3.5 text-teal-600" />}
              </button>

              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                  themeMode === 'dark'
                    ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200 font-bold'
                    : 'border-stone-200 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-800/40 text-stone-600 dark:text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="font-semibold text-xs">قالب تیره</div>
                    <div className="text-[10px] opacity-70">پس‌زمینه مشکی چشم‌نواز</div>
                  </div>
                </div>
                {themeMode === 'dark' && <Check className="w-3.5 h-3.5 text-teal-600" />}
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-zinc-800/50 border border-stone-200/70 dark:border-zinc-800 text-[11px] text-stone-500 dark:text-zinc-400 space-y-1">
            <div className="flex items-center gap-1 font-semibold text-stone-700 dark:text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span>ویژگی‌های خروجی مستقیم:</span>
            </div>
            <p>
              خروجی به‌صورت فایل مستقل مستقیماً در دانلودهای مرورگر ذخیره می‌شود و حتی داخل آی‌فریم و بدون نیاز به دسترسی پرینتر مرورگر، ۱۰۰٪ تضمینی کار می‌کند.
            </p>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {isSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>فایل با موفقیت تولید و دانلود شد!</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50/70 dark:bg-zinc-800/40 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-zinc-400 hover:bg-stone-200/60 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer"
          >
            انصراف
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال تولید {format === 'pdf' ? 'فایل PDF' : 'تصویر PNG'}...</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                <span>دانلود و خروجی {format === 'pdf' ? 'PDF' : 'تصویر PNG'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
