import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // If already running as an installed PWA or dismissed, hide
  if (isInstalled || isDismissed) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <div className="bg-gradient-to-r from-teal-50 to-teal-100/50 dark:from-zinc-900 dark:to-zinc-800/80 border border-teal-200/80 dark:border-zinc-700/60 rounded-2xl p-4 mb-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-teal-600 rounded-xl text-white shrink-0 shadow-xs">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100">نصب نسخه اپلیکیشن (PWA)</h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 leading-relaxed">
              با نصب اپلیکیشن برنامه‌ریز درسی، بدون نیاز به مرورگر و به صورت آفلاین به برنامه درسی خود دسترسی داشته باشید.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <button
            onClick={() => setIsDismissed(true)}
            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 rounded-xl hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="بستن"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={install}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer w-full sm:w-auto"
          >
            <Download className="w-4 h-4" />
            <span>نصب اپلیکیشن</span>
          </button>
        </div>
      </div>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <div className="bg-gradient-to-r from-teal-50 to-teal-100/50 dark:from-zinc-900 dark:to-zinc-800/80 border border-teal-200/80 dark:border-zinc-700/60 rounded-2xl p-4 mb-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-teal-600 rounded-xl text-white shrink-0 shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100">نصب برنامه‌ریز درسی در آیفون</h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 leading-relaxed">
                این برنامه را روی صفحه اصلی گوشی خود اضافه کنید تا شبیه به یک اپلیکیشن بومی اجرا شود.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <button
              onClick={() => setIsDismissed(true)}
              className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 rounded-xl hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="بستن"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowIOSGuide(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              <span>راهنمای نصب آیفون</span>
            </button>
          </div>
        </div>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-xl border border-stone-100 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-zinc-800">
                <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100">راهنمای نصب در آیفون و آیپد</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-4 text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-[10px] shrink-0">۱</span>
                  <p>در مرورگر سافاری، روی دکمه اشتراک‌گذاری <strong className="text-teal-600 dark:text-teal-400">Share</strong> (آیکون مربع با فلش رو به بالا در پایین صفحه) ضربه بزنید.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-[10px] shrink-0">۲</span>
                  <p>منو را به پایین اسکرول کرده و گزینه <strong className="text-teal-600 dark:text-teal-400">Add to Home Screen</strong> (افزودن به صفحه اصلی) را انتخاب کنید.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-[10px] shrink-0">۳</span>
                  <p>در بالای صفحه روی گزینه <strong className="text-teal-600 dark:text-teal-400">Add</strong> ضربه بزنید تا آیکون برنامه به صفحه گوشی شما اضافه شود.</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 py-2 text-xs font-bold text-stone-800 dark:text-zinc-200 transition-colors cursor-pointer"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
