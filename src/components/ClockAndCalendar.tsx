import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';
import { toPersianDigits } from '../constants';

const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export function getJalaliParts(date: Date) {
  try {
    const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      weekday: 'long',
    });
    const parts = formatter.formatToParts(date);
    let year = 1405;
    let month = 1;
    let day = 1;
    let weekday = '';

    for (const p of parts) {
      if (p.type === 'year') year = parseInt(p.value, 10);
      if (p.type === 'month') month = parseInt(p.value, 10);
      if (p.type === 'day') day = parseInt(p.value, 10);
      if (p.type === 'weekday') weekday = p.value;
    }
    return { year, month, day, weekday };
  } catch (e) {
    return { year: 1405, month: 6, day: 17, weekday: 'دوشنبه' };
  }
}

interface ClockAndCalendarProps {
  totalSlotsToday?: number;
}

export const ClockAndCalendar: React.FC<ClockAndCalendarProps> = () => {
  const [now, setNow] = useState<Date>(new Date());

  // Live ticker for time
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayJalali = useMemo(() => getJalaliParts(now), [now]);

  // Formatted string time
  const timeFormatted = useMemo(() => {
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return {
      hh: toPersianDigits(hours),
      mm: toPersianDigits(minutes),
      ss: toPersianDigits(seconds),
    };
  }, [now]);

  // Formatted Jalali String
  const todayDateString = useMemo(() => {
    const monthName = JALALI_MONTH_NAMES[todayJalali.month - 1] || 'شهریور';
    return `${todayJalali.weekday}، ${toPersianDigits(todayJalali.day)} ${monthName} ${toPersianDigits(
      todayJalali.year
    )}`;
  }, [todayJalali]);

  return (
    <div
      className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-stone-100/90 dark:bg-zinc-800/90 border border-stone-200/80 dark:border-zinc-700/80 text-stone-800 dark:text-zinc-200 shadow-2xs select-none shrink-0 max-w-full overflow-hidden"
    >
      <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-black text-teal-700 dark:text-teal-400 tabular-nums shrink-0 min-w-[68px] sm:min-w-[82px] justify-center" dir="ltr">
        <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 animate-pulse shrink-0 mr-0.5" />
        <span className="tabular-nums">
          {timeFormatted.hh}:{timeFormatted.mm}
        </span>
        <span className="text-[10px] opacity-75 font-normal tabular-nums">:{timeFormatted.ss}</span>
      </div>

      <div className="h-3.5 w-px bg-stone-300 dark:bg-zinc-700 shrink-0" />

      <div className="flex items-center gap-1 text-xs font-semibold text-stone-700 dark:text-zinc-300 shrink-0">
        <CalendarIcon className="w-3.5 h-3.5 text-stone-500 dark:text-zinc-400 shrink-0" />
        <span className="hidden sm:inline">{todayDateString}</span>
        <span className="sm:hidden">
          {toPersianDigits(todayJalali.day)}{' '}
          {JALALI_MONTH_NAMES[todayJalali.month - 1]}
        </span>
      </div>
    </div>
  );
};
