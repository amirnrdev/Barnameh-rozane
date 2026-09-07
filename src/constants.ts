import { DayConfig, DayKey, ScheduleCell, SubjectMetadata } from './types';

export const DAYS_CONFIG: DayConfig[] = [
  { key: 'sat', label: 'شنبه', shortLabel: 'شن' },
  { key: 'sun', label: 'یکشنبه', shortLabel: 'یک' },
  { key: 'mon', label: 'دوشنبه', shortLabel: 'دو' },
  { key: 'tue', label: 'سه‌شنبه', shortLabel: 'سه‌' },
  { key: 'wed', label: 'چهارشنبه', shortLabel: 'چهار' },
  { key: 'thu', label: 'پنجشنبه', shortLabel: 'پنج' },
  { key: 'fri', label: 'جمعه', shortLabel: 'جم', isWeekend: true },
];

export const SLOT_NAMES = [
  'زنگ اول',
  'زنگ دوم',
  'زنگ سوم',
  'زنگ چهارم',
  'زنگ پنجم',
  'زنگ ششم',
  'زنگ هفتم',
  'زنگ هشتم',
  'زنگ نهم (فوق‌العاده شبانه / حداکثر تا ۱:۳۰ بامداد)',
];

export function isTimeForbidden(totalMins: number): boolean {
  const normalized = ((totalMins % (24 * 60)) + (24 * 60)) % (24 * 60);
  // Forbidden range is after 01:30 AM (90 mins) up to before morning 07:00 AM (420 mins)
  return normalized > 90 && normalized < 420;
}

export function formatMinutesToPersianTime(totalMins: number) {
  const totalNormalized = ((totalMins % (24 * 60)) + (24 * 60)) % (24 * 60);
  const h = Math.floor(totalNormalized / 60);
  const m = totalNormalized % 60;
  const hStr = h < 10 ? `۰${toPersianDigits(h)}` : toPersianDigits(h);
  const mStr = m < 10 ? `۰${toPersianDigits(m)}` : toPersianDigits(m);
  return `${hStr}:${mStr}`;
}

export function formatMinutesToStandardTime(totalMins: number) {
  const totalNormalized = ((totalMins % (24 * 60)) + (24 * 60)) % (24 * 60);
  const h = Math.floor(totalNormalized / 60);
  const m = totalNormalized % 60;
  const hStr = h < 10 ? `0${h}` : `${h}`;
  const mStr = m < 10 ? `0${m}` : `${m}`;
  return `${hStr}:${mStr}`;
}

export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  // Convert Persian numbers to English if any
  const normalized = timeStr.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()).trim();
  const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  if (isNaN(hours) || isNaN(mins) || hours < 0 || hours > 23 || mins < 0 || mins > 59) return null;
  return hours * 60 + mins;
}

export function getSlotDefaultMinutes(slotIndex: number, durationMinutes = 90) {
  const startOfDay = 7 * 60; // 07:00
  // Custom breaks: 15m regular breaks, 60m lunch break after slot 3 (12:00-13:00), 45m dinner break after slot 6 (18:00-18:45)
  const defaultBreaks = [15, 15, 60, 15, 15, 45, 15, 15, 15, 15];

  let startTotalMinutes = startOfDay;
  for (let i = 0; i < slotIndex; i++) {
    const breakTime = defaultBreaks[i] !== undefined ? defaultBreaks[i] : 15;
    startTotalMinutes += durationMinutes + breakTime;
  }
  const endTotalMinutes = startTotalMinutes + durationMinutes;
  return { startTotalMinutes, endTotalMinutes };
}

export function getSlotInfo(slotIndex: number, durationMinutes = 90) {
  const name = SLOT_NAMES[slotIndex] || `زنگ ${toPersianDigits(slotIndex + 1)}`;
  const { startTotalMinutes, endTotalMinutes } = getSlotDefaultMinutes(slotIndex, durationMinutes);

  const startTimeStr = formatMinutesToPersianTime(startTotalMinutes);
  const endTimeStr = formatMinutesToPersianTime(endTotalMinutes);
  const time = `${startTimeStr} - ${endTimeStr}`;

  return {
    index: slotIndex,
    name,
    time,
    durationMinutes,
    startTotalMinutes,
    endTotalMinutes,
    rawStartTime: formatMinutesToStandardTime(startTotalMinutes),
    rawEndTime: formatMinutesToStandardTime(endTotalMinutes),
  };
}

export function getCellTimeInfo(cell: ScheduleCell, defaultSlotDuration = 90) {
  const isCustomTime = Boolean(cell.customStartTime && cell.customStartTime.trim() !== '');
  let duration = cell.durationMinutes && cell.durationMinutes > 0 ? cell.durationMinutes : defaultSlotDuration;

  if (isCustomTime && cell.customStartTime) {
    const parsedStart = parseTimeToMinutes(cell.customStartTime);
    if (parsedStart !== null) {
      let parsedEnd = parsedStart + duration;
      if (isTimeForbidden(parsedEnd)) {
        const maxAllowedEnd = parsedStart >= 420 ? 1530 : 90;
        if (parsedEnd > maxAllowedEnd) {
          parsedEnd = maxAllowedEnd;
          duration = Math.max(10, parsedEnd - parsedStart);
        }
      }
      const startPersian = formatMinutesToPersianTime(parsedStart);
      const endPersian = formatMinutesToPersianTime(parsedEnd);
      return {
        isCustom: true,
        startTimeStr: startPersian,
        endTimeStr: endPersian,
        time: `${startPersian} - ${endPersian}`,
        durationMinutes: duration,
        rawStartTime: formatMinutesToStandardTime(parsedStart),
        rawEndTime: formatMinutesToStandardTime(parsedEnd),
      };
    }
  }

  const slotInfo = getSlotInfo(cell.slotIndex, duration);
  let startTotalMins = slotInfo.startTotalMinutes;
  let endTotalMins = slotInfo.endTotalMinutes;
  if (isTimeForbidden(endTotalMins)) {
    const maxAllowedEnd = startTotalMins >= 420 ? 1530 : 90;
    if (endTotalMins > maxAllowedEnd) {
      endTotalMins = maxAllowedEnd;
      duration = Math.max(10, endTotalMins - startTotalMins);
    }
  }

  return {
    isCustom: Boolean(cell.durationMinutes && cell.durationMinutes !== defaultSlotDuration),
    startTimeStr: formatMinutesToPersianTime(startTotalMins),
    endTimeStr: formatMinutesToPersianTime(endTotalMins),
    time: `${formatMinutesToPersianTime(startTotalMins)} - ${formatMinutesToPersianTime(endTotalMins)}`,
    durationMinutes: duration,
    rawStartTime: formatMinutesToStandardTime(startTotalMins),
    rawEndTime: formatMinutesToStandardTime(endTotalMins),
  };
}

export const TIME_SLOTS = Array.from({ length: 12 }).map((_, idx) => getSlotInfo(idx, 90));

export const SUBJECT_METADATA_MAP: Record<string, SubjectMetadata> = {
  'زیست': {
    name: 'زیست',
    colorName: 'emerald',
    bgClass: 'bg-emerald-50 hover:bg-emerald-100/80',
    borderClass: 'border-emerald-200',
    textClass: 'text-emerald-900',
    accentClass: 'text-cyan-600 font-bold',
    lightBgClass: 'bg-emerald-100/70',
    badgeBgClass: 'bg-emerald-500 text-white',
    description: 'زیست‌شناسی تجربی',
  },
  'شیمی': {
    name: 'شیمی',
    colorName: 'amber',
    bgClass: 'bg-amber-50 hover:bg-amber-100/80',
    borderClass: 'border-amber-200',
    textClass: 'text-amber-900',
    accentClass: 'text-cyan-600 font-bold',
    lightBgClass: 'bg-amber-100/70',
    badgeBgClass: 'bg-amber-500 text-white',
    description: 'شیمی کنکور',
  },
  'فیزیک': {
    name: 'فیزیک',
    colorName: 'indigo',
    bgClass: 'bg-indigo-50 hover:bg-indigo-100/80',
    borderClass: 'border-indigo-200',
    textClass: 'text-indigo-900',
    accentClass: 'text-cyan-600 font-bold',
    lightBgClass: 'bg-indigo-100/70',
    badgeBgClass: 'bg-indigo-500 text-white',
    description: 'فیزیک جامع',
  },
  'ریاضی': {
    name: 'ریاضی',
    colorName: 'rose',
    bgClass: 'bg-rose-50 hover:bg-rose-100/80',
    borderClass: 'border-rose-200',
    textClass: 'text-rose-900',
    accentClass: 'text-cyan-600 font-bold',
    lightBgClass: 'bg-rose-100/70',
    badgeBgClass: 'bg-rose-500 text-white',
    description: 'ریاضیات تجربی',
  },
  'زمین': {
    name: 'زمین',
    colorName: 'teal',
    bgClass: 'bg-teal-50 hover:bg-teal-100/80',
    borderClass: 'border-teal-200',
    textClass: 'text-teal-900',
    accentClass: 'text-cyan-600 font-bold',
    lightBgClass: 'bg-teal-100/70',
    badgeBgClass: 'bg-teal-600 text-white',
    description: 'زمین‌شناسی',
  },
  'جبرانی': {
    name: 'جبرانی',
    colorName: 'slate',
    bgClass: 'bg-slate-50 hover:bg-slate-100/80',
    borderClass: 'border-slate-200',
    textClass: 'text-slate-800',
    accentClass: 'text-cyan-600 font-bold',
    lightBgClass: 'bg-slate-100',
    badgeBgClass: 'bg-slate-500 text-white',
    description: 'زمان جبرانی و استراحت',
  },
};

export const DEFAULT_SUBJECT_META: SubjectMetadata = {
  name: 'عمومی',
  colorName: 'stone',
  bgClass: 'bg-stone-50 hover:bg-stone-100',
  borderClass: 'border-stone-200',
  textClass: 'text-stone-800',
  accentClass: 'text-cyan-600 font-bold',
  lightBgClass: 'bg-stone-100',
  badgeBgClass: 'bg-stone-500 text-white',
};

export interface SubjectStyleConfig {
  name: string;
  dotColor: string;
  paletteNormal: string;
  paletteActive: string;
  highlightCellBg: string;
  highlightCellBorder: string;
  highlightCellRing: string;
  highlightCellText: string;
  badgeBg: string;
  statsCardBg: string;
  statsCardBorder: string;
}

export function getSubjectStyle(subject: string): SubjectStyleConfig {
  const name = subject?.trim() || '';
  switch (name) {
    case 'زیست':
      return {
        name,
        dotColor: 'bg-emerald-500',
        paletteNormal: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50',
        paletteActive: 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400 dark:ring-emerald-500',
        highlightCellBg: 'bg-emerald-100/95 dark:bg-emerald-950/90',
        highlightCellBorder: 'border-emerald-500 dark:border-emerald-500',
        highlightCellRing: 'ring-2 ring-emerald-500 shadow-md shadow-emerald-500/20',
        highlightCellText: 'text-emerald-950 dark:text-emerald-100',
        badgeBg: 'bg-emerald-600 text-white',
        statsCardBg: 'bg-emerald-50 dark:bg-emerald-950/40',
        statsCardBorder: 'border-emerald-400 dark:border-emerald-600',
      };
    case 'شیمی':
      return {
        name,
        dotColor: 'bg-amber-500',
        paletteNormal: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50',
        paletteActive: 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-400 dark:ring-amber-500',
        highlightCellBg: 'bg-amber-100/95 dark:bg-amber-950/90',
        highlightCellBorder: 'border-amber-500 dark:border-amber-500',
        highlightCellRing: 'ring-2 ring-amber-500 shadow-md shadow-amber-500/20',
        highlightCellText: 'text-amber-950 dark:text-amber-100',
        badgeBg: 'bg-amber-600 text-white',
        statsCardBg: 'bg-amber-50 dark:bg-amber-950/40',
        statsCardBorder: 'border-amber-400 dark:border-amber-600',
      };
    case 'فیزیک':
      return {
        name,
        dotColor: 'bg-indigo-500',
        paletteNormal: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700/60 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50',
        paletteActive: 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400 dark:ring-indigo-500',
        highlightCellBg: 'bg-indigo-100/95 dark:bg-indigo-950/90',
        highlightCellBorder: 'border-indigo-500 dark:border-indigo-500',
        highlightCellRing: 'ring-2 ring-indigo-500 shadow-md shadow-indigo-500/20',
        highlightCellText: 'text-indigo-950 dark:text-indigo-100',
        badgeBg: 'bg-indigo-600 text-white',
        statsCardBg: 'bg-indigo-50 dark:bg-indigo-950/40',
        statsCardBorder: 'border-indigo-400 dark:border-indigo-600',
      };
    case 'ریاضی':
      return {
        name,
        dotColor: 'bg-rose-500',
        paletteNormal: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700/60 text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50',
        paletteActive: 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-400 dark:ring-rose-500',
        highlightCellBg: 'bg-rose-100/95 dark:bg-rose-950/90',
        highlightCellBorder: 'border-rose-500 dark:border-rose-500',
        highlightCellRing: 'ring-2 ring-rose-500 shadow-md shadow-rose-500/20',
        highlightCellText: 'text-rose-950 dark:text-rose-100',
        badgeBg: 'bg-rose-600 text-white',
        statsCardBg: 'bg-rose-50 dark:bg-rose-950/40',
        statsCardBorder: 'border-rose-400 dark:border-rose-600',
      };
    case 'زمین':
      return {
        name,
        dotColor: 'bg-teal-500',
        paletteNormal: 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700/60 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50',
        paletteActive: 'bg-teal-600 text-white border-teal-700 shadow-md ring-2 ring-teal-400 dark:ring-teal-500',
        highlightCellBg: 'bg-teal-100/95 dark:bg-teal-950/90',
        highlightCellBorder: 'border-teal-500 dark:border-teal-500',
        highlightCellRing: 'ring-2 ring-teal-500 shadow-md shadow-teal-500/20',
        highlightCellText: 'text-teal-950 dark:text-teal-100',
        badgeBg: 'bg-teal-600 text-white',
        statsCardBg: 'bg-teal-50 dark:bg-teal-950/40',
        statsCardBorder: 'border-teal-400 dark:border-teal-600',
      };
    case 'آزمون':
      return {
        name,
        dotColor: 'bg-sky-500',
        paletteNormal: 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-700/60 text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50',
        paletteActive: 'bg-sky-600 text-white border-sky-700 shadow-md ring-2 ring-sky-400 dark:ring-sky-500',
        highlightCellBg: 'bg-sky-100/95 dark:bg-sky-950/90',
        highlightCellBorder: 'border-sky-500 dark:border-sky-500',
        highlightCellRing: 'ring-2 ring-sky-500 shadow-md shadow-sky-500/20',
        highlightCellText: 'text-sky-950 dark:text-sky-100',
        badgeBg: 'bg-sky-600 text-white',
        statsCardBg: 'bg-sky-50 dark:bg-sky-950/40',
        statsCardBorder: 'border-sky-400 dark:border-sky-600',
      };
    case 'جبرانی':
      return {
        name,
        dotColor: 'bg-slate-500',
        paletteNormal: 'bg-slate-100 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700',
        paletteActive: 'bg-slate-700 dark:bg-zinc-200 text-white dark:text-zinc-900 border-slate-800 shadow-md ring-2 ring-slate-400',
        highlightCellBg: 'bg-slate-200/95 dark:bg-zinc-800/95',
        highlightCellBorder: 'border-slate-500 dark:border-zinc-500',
        highlightCellRing: 'ring-2 ring-slate-500 dark:ring-zinc-400 shadow-md shadow-slate-500/20',
        highlightCellText: 'text-slate-950 dark:text-zinc-100',
        badgeBg: 'bg-slate-600 text-white',
        statsCardBg: 'bg-slate-100 dark:bg-zinc-800/60',
        statsCardBorder: 'border-slate-400 dark:border-zinc-600',
      };
    default:
      return {
        name,
        dotColor: 'bg-cyan-500',
        paletteNormal: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-700/60 text-cyan-800 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/50',
        paletteActive: 'bg-cyan-600 text-white border-cyan-700 shadow-md ring-2 ring-cyan-400 dark:ring-cyan-500',
        highlightCellBg: 'bg-cyan-100/95 dark:bg-cyan-950/90',
        highlightCellBorder: 'border-cyan-500 dark:border-cyan-500',
        highlightCellRing: 'ring-2 ring-cyan-500 shadow-md shadow-cyan-500/20',
        highlightCellText: 'text-cyan-950 dark:text-cyan-100',
        badgeBg: 'bg-cyan-600 text-white',
        statsCardBg: 'bg-cyan-50 dark:bg-cyan-950/40',
        statsCardBorder: 'border-cyan-400 dark:border-cyan-600',
      };
  }
}

// Initial state strictly matching the user's provided schedule image
// Blue text items in user's image represent class sessions (کلاس)
// White/regular text items represent test-taking sessions (تست و تمرین)
// Dedicated reading/textbook sessions can be toggled to purple (مطالعه فردی)
export const INITIAL_SCHEDULE_DATA: ScheduleCell[] = [
  // --- شنبه (Saturday) ---
  { id: 'sat-0', day: 'sat', slotIndex: 0, subject: 'شیمی', mode: 'test' },
  { id: 'sat-1', day: 'sat', slotIndex: 1, subject: 'شیمی', mode: 'test' },
  { id: 'sat-2', day: 'sat', slotIndex: 2, subject: 'ریاضی', mode: 'test' },
  { id: 'sat-3', day: 'sat', slotIndex: 3, subject: 'زیست', mode: 'test' },
  { id: 'sat-4', day: 'sat', slotIndex: 4, subject: 'زیست', mode: 'class' },
  { id: 'sat-5', day: 'sat', slotIndex: 5, subject: 'زیست', mode: 'class' },
  { id: 'sat-6', day: 'sat', slotIndex: 6, subject: 'فیزیک', mode: 'class' },
  { id: 'sat-7', day: 'sat', slotIndex: 7, subject: 'فیزیک', mode: 'class' },
  { id: 'sat-8', day: 'sat', slotIndex: 8, subject: 'جبرانی', mode: 'test' },

  // --- یکشنبه (Sunday) ---
  { id: 'sun-0', day: 'sun', slotIndex: 0, subject: 'زیست', mode: 'test' },
  { id: 'sun-1', day: 'sun', slotIndex: 1, subject: 'زیست', mode: 'test' },
  { id: 'sun-2', day: 'sun', slotIndex: 2, subject: 'فیزیک', mode: 'test' },
  { id: 'sun-3', day: 'sun', slotIndex: 3, subject: 'فیزیک', mode: 'test' },
  { id: 'sun-4', day: 'sun', slotIndex: 4, subject: 'شیمی', mode: 'test' },
  { id: 'sun-5', day: 'sun', slotIndex: 5, subject: 'زمین', mode: 'class' },
  { id: 'sun-6', day: 'sun', slotIndex: 6, subject: 'ریاضی', mode: 'class' },
  { id: 'sun-7', day: 'sun', slotIndex: 7, subject: 'ریاضی', mode: 'class' },
  { id: 'sun-8', day: 'sun', slotIndex: 8, subject: 'جبرانی', mode: 'class' },

  // --- دوشنبه (Monday) ---
  { id: 'mon-0', day: 'mon', slotIndex: 0, subject: 'ریاضی', mode: 'test' },
  { id: 'mon-1', day: 'mon', slotIndex: 1, subject: 'زیست', mode: 'test' },
  { id: 'mon-2', day: 'mon', slotIndex: 2, subject: 'فیزیک', mode: 'test' },
  { id: 'mon-3', day: 'mon', slotIndex: 3, subject: 'شیمی', mode: 'test' },
  { id: 'mon-4', day: 'mon', slotIndex: 4, subject: 'شیمی', mode: 'class' },
  { id: 'mon-5', day: 'mon', slotIndex: 5, subject: 'شیمی', mode: 'class' },
  { id: 'mon-6', day: 'mon', slotIndex: 6, subject: 'فیزیک', mode: 'class' },
  { id: 'mon-7', day: 'mon', slotIndex: 7, subject: 'فیزیک', mode: 'class' },
  { id: 'mon-8', day: 'mon', slotIndex: 8, subject: 'جبرانی', mode: 'class' },

  // --- سه‌شنبه (Tuesday) ---
  { id: 'tue-0', day: 'tue', slotIndex: 0, subject: 'شیمی', mode: 'test' },
  { id: 'tue-1', day: 'tue', slotIndex: 1, subject: 'شیمی', mode: 'test' },
  { id: 'tue-2', day: 'tue', slotIndex: 2, subject: 'زمین', mode: 'test' },
  { id: 'tue-3', day: 'tue', slotIndex: 3, subject: 'فیزیک', mode: 'test' },
  { id: 'tue-4', day: 'tue', slotIndex: 4, subject: 'ریاضی', mode: 'test' },
  { id: 'tue-5', day: 'tue', slotIndex: 5, subject: 'زیست', mode: 'test' },
  { id: 'tue-6', day: 'tue', slotIndex: 6, subject: 'زیست', mode: 'class' },
  { id: 'tue-7', day: 'tue', slotIndex: 7, subject: 'زیست', mode: 'class' },
  { id: 'tue-8', day: 'tue', slotIndex: 8, subject: 'جبرانی', mode: 'class' },

  // --- چهارشنبه (Wednesday) ---
  { id: 'wed-0', day: 'wed', slotIndex: 0, subject: 'زیست', mode: 'test' },
  { id: 'wed-1', day: 'wed', slotIndex: 1, subject: 'زیست', mode: 'test' },
  { id: 'wed-2', day: 'wed', slotIndex: 2, subject: 'شیمی', mode: 'test' },
  { id: 'wed-3', day: 'wed', slotIndex: 3, subject: 'فیزیک', mode: 'test' },
  { id: 'wed-4', day: 'wed', slotIndex: 4, subject: 'ریاضی', mode: 'class' },
  { id: 'wed-5', day: 'wed', slotIndex: 5, subject: 'ریاضی', mode: 'class' },
  { id: 'wed-6', day: 'wed', slotIndex: 6, subject: 'شیمی', mode: 'class' },
  { id: 'wed-7', day: 'wed', slotIndex: 7, subject: 'شیمی', mode: 'class' },
  { id: 'wed-8', day: 'wed', slotIndex: 8, subject: 'جبرانی', mode: 'class' },

  // --- پنجشنبه (Thursday) ---
  { id: 'thu-0', day: 'thu', slotIndex: 0, subject: 'جبرانی', mode: 'test' },
  { id: 'thu-1', day: 'thu', slotIndex: 1, subject: 'جبرانی', mode: 'test' },
  { id: 'thu-2', day: 'thu', slotIndex: 2, subject: 'زیست', mode: 'class' },
  { id: 'thu-3', day: 'thu', slotIndex: 3, subject: 'زیست', mode: 'class' },
  { id: 'thu-4', day: 'thu', slotIndex: 4, subject: 'ریاضی', mode: 'test' },
  { id: 'thu-5', day: 'thu', slotIndex: 5, subject: 'ریاضی', mode: 'test' },
  { id: 'thu-6', day: 'thu', slotIndex: 6, subject: 'فیزیک', mode: 'test' },
  { id: 'thu-7', day: 'thu', slotIndex: 7, subject: 'شیمی', mode: 'test' },
  { id: 'thu-8', day: 'thu', slotIndex: 8, subject: 'جبرانی', mode: 'test' },

  // --- جمعه (Friday) ---
  { id: 'fri-0', day: 'fri', slotIndex: 0, subject: 'آزمون', mode: 'test' },
  { id: 'fri-1', day: 'fri', slotIndex: 1, subject: 'آزمون', mode: 'test' },
  { id: 'fri-2', day: 'fri', slotIndex: 2, subject: 'جبرانی', mode: 'test' },
  { id: 'fri-3', day: 'fri', slotIndex: 3, subject: 'جبرانی', mode: 'test' },
  { id: 'fri-4', day: 'fri', slotIndex: 4, subject: 'زیست', mode: 'test' },
  { id: 'fri-5', day: 'fri', slotIndex: 5, subject: 'زیست', mode: 'test' },
  { id: 'fri-6', day: 'fri', slotIndex: 6, subject: 'شیمی', mode: 'test' },
  { id: 'fri-7', day: 'fri', slotIndex: 7, subject: 'ریاضی', mode: 'test' },
  { id: 'fri-8', day: 'fri', slotIndex: 8, subject: 'جبرانی', mode: 'test' },
];

export function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .replace(/\d/g, (char) => persianDigits[parseInt(char, 10)]);
}
