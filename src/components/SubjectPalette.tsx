import React, { useState } from 'react';
import {
  Plus,
  GripVertical,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  BookOpen,
  PenTool,
  Eraser,
  Sparkles,
  Check,
  Hash,
  X,
} from 'lucide-react';
import { ActiveBrush, StudyMode } from '../types';
import { toPersianDigits, getSubjectStyle } from '../constants';

interface SubjectPaletteProps {
  customSubjects: string[];
  onAddCustomSubject: (name: string) => void;
  activeBrush: ActiveBrush | null;
  onSelectBrush: (brush: ActiveBrush | null) => void;
  selectedMode: StudyMode;
  onChangeSelectedMode?: (mode: StudyMode) => void;
  onSelectMode?: (mode: StudyMode) => void;
  highlightedSubject?: string | null;
  onSelectHighlight?: (subject: string | null) => void;
}

export const SubjectPalette: React.FC<SubjectPaletteProps> = ({
  customSubjects,
  onAddCustomSubject,
  activeBrush,
  onSelectBrush,
  selectedMode,
  onChangeSelectedMode,
  onSelectMode,
  highlightedSubject,
  onSelectHighlight,
}) => {
  const setMode = onChangeSelectedMode || onSelectMode || (() => {});
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [sessionInputValue, setSessionInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  const baseSubjects = ['زیست', 'شیمی', 'فیزیک', 'ریاضی', 'زمین', 'جبرانی', 'آزمون'];
  const allSubjects = Array.from(new Set([...baseSubjects, ...customSubjects]));

  const handleAddSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSubjectInput.trim();
    if (trimmed && !allSubjects.includes(trimmed)) {
      onAddCustomSubject(trimmed);
      setNewSubjectInput('');
      setIsAddingSubject(false);
    }
  };

  // When user types in session box, optionally activate or update brush
  const handleSessionInputChange = (val: string) => {
    setSessionInputValue(val);
    const trimmed = val.trim();
    if (trimmed) {
      const parsed = !isNaN(Number(trimmed)) ? Number(trimmed) : trimmed;
      onSelectBrush({
        type: 'session',
        sessionNumber: parsed,
      });
    } else {
      if (activeBrush?.type === 'session') {
        onSelectBrush(null);
      }
    }
  };

  // Drag start for Subject
  const handleSubjectDragStart = (e: React.DragEvent, subject: string) => {
    const payload = {
      type: 'palette-subject',
      subject,
      mode: selectedMode,
    };
    e.dataTransfer.setData('text/plain', JSON.stringify(payload));
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.setData('subject-name', subject);
    e.dataTransfer.setData('subject-mode', selectedMode);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  // Drag start for Session Number
  const handleSessionDragStart = (e: React.DragEvent, sessionNum: number | string | '__CLEAR_SESSION__') => {
    const payload = {
      type: 'palette-session',
      sessionNumber: sessionNum,
    };
    e.dataTransfer.setData('text/plain', JSON.stringify(payload));
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.setData('session-number', String(sessionNum));
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  // Subject Click (Brush toggle & Highlight toggle)
  const handleSubjectClick = (subject: string) => {
    if (activeBrush?.subject === subject && activeBrush.mode === selectedMode && !activeBrush.sessionNumber) {
      onSelectBrush(null); // toggle off
      if (onSelectHighlight) onSelectHighlight(null);
    } else {
      onSelectBrush({
        type: 'subject',
        subject,
        mode: selectedMode,
      });
      if (onSelectHighlight) onSelectHighlight(subject);
    }
  };

  // Session Brush toggle button
  const toggleSessionBrush = () => {
    const trimmed = sessionInputValue.trim();
    if (!trimmed) return;
    const parsed = !isNaN(Number(trimmed)) ? Number(trimmed) : trimmed;

    if (activeBrush?.type === 'session' && activeBrush.sessionNumber === parsed) {
      onSelectBrush(null);
    } else {
      onSelectBrush({
        type: 'session',
        sessionNumber: parsed,
      });
    }
  };

  // Clear Session Click
  const handleClearSessionClick = () => {
    if (activeBrush?.type === 'clear-session') {
      onSelectBrush(null);
    } else {
      onSelectBrush({
        type: 'clear-session',
      });
    }
  };

  const getActiveBrushLabel = () => {
    if (!activeBrush) return '';
    if (activeBrush.subject === '__CLEAR__') return 'پاک‌کن کل پارت';
    if (activeBrush.type === 'clear-session') return 'پاک‌کن شماره جلسه';
    if (activeBrush.type === 'session' && activeBrush.sessionNumber !== undefined) {
      return `قلم جلسه: ${toPersianDigits(activeBrush.sessionNumber)}`;
    }
    if (activeBrush.subject) {
      const modeLabel = activeBrush.mode === 'class' ? 'کلاس' : activeBrush.mode === 'study' ? 'مطالعه' : 'تمرین';
      return `قلم درس: ${activeBrush.subject} (${modeLabel})`;
    }
    return 'قلم فعال';
  };

  const currentSessionNumber = sessionInputValue.trim()
    ? !isNaN(Number(sessionInputValue.trim()))
      ? Number(sessionInputValue.trim())
      : sessionInputValue.trim()
    : null;

  const isSessionBrushActive =
    activeBrush?.type === 'session' &&
    currentSessionNumber !== null &&
    activeBrush.sessionNumber === currentSessionNumber;

  return (
    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-stone-200/80 dark:border-zinc-800/80 p-3.5 mb-4 shadow-xs transition-colors">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-500 ring-4 ring-teal-500/20" />
          <span className="text-xs font-bold text-stone-900 dark:text-zinc-100">
            پالت ابزار و دروس
          </span>
          <span className="text-[11px] text-stone-400 dark:text-zinc-500 hidden sm:inline">
            (برای ثبت سریع، قلم را انتخاب کنید یا بکشید و روی جدول رها کنید)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {activeBrush && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-700/60 text-[11px] text-teal-800 dark:text-teal-300 font-bold animate-in fade-in">
              <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
              <span>{getActiveBrushLabel()}</span>
              <button
                type="button"
                onClick={() => onSelectBrush(null)}
                className="mr-1 text-teal-600 hover:text-teal-900 dark:hover:text-white font-bold cursor-pointer"
                title="لغو حالت قلم"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200 flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <span>{isOpen ? 'بستن' : 'نمایش پالت'}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-stone-100 dark:border-zinc-800/80 space-y-3 animate-in fade-in">
          {/* Section 1: Study Mode Selector */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-stone-500 dark:text-zinc-400 font-medium">نوع پارت:</span>
            <div className="flex items-center p-0.5 bg-stone-100 dark:bg-zinc-800 rounded-xl border border-stone-200/80 dark:border-zinc-700/60">
              <button
                type="button"
                onClick={() => {
                  setMode('class');
                  if (activeBrush?.subject && activeBrush.subject !== '__CLEAR__') {
                    onSelectBrush({ ...activeBrush, mode: 'class' });
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedMode === 'class'
                    ? 'bg-cyan-500 text-white shadow-2xs'
                    : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>۱. کلاس درس (آبی)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('study');
                  if (activeBrush?.subject && activeBrush.subject !== '__CLEAR__') {
                    onSelectBrush({ ...activeBrush, mode: 'study' });
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedMode === 'study'
                    ? 'bg-violet-600 text-white shadow-2xs'
                    : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>۲. مطالعه فردی (بنفش)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('test');
                  if (activeBrush?.subject && activeBrush.subject !== '__CLEAR__') {
                    onSelectBrush({ ...activeBrush, mode: 'test' });
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedMode === 'test'
                    ? 'bg-stone-800 dark:bg-zinc-200 text-white dark:text-zinc-900 shadow-2xs'
                    : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>۳. تمرین (سفید)</span>
              </button>
            </div>
          </div>

          {/* Section 2: Subject Chips */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-stone-500 dark:text-zinc-400 flex items-center gap-1">
              <span>دروس:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {allSubjects.map((sub) => {
                const isSelected = activeBrush?.subject === sub;
                const subStyle = getSubjectStyle(sub);

                return (
                  <div
                    key={sub}
                    draggable
                    onDragStart={(e) => handleSubjectDragStart(e, sub)}
                    onClick={() => handleSubjectClick(sub)}
                    className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border cursor-grab active:cursor-grabbing text-xs font-bold transition-all select-none ${
                      isSelected
                        ? subStyle.paletteActive
                        : subStyle.paletteNormal
                    }`}
                    title="برای جای‌گذاری: بکشید و روی جدول رها کنید، یا کلیک کنید تا در جدول هایلایت و قلم فعال شود"
                  >
                    <GripVertical className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-stone-400 dark:text-zinc-500'}`} />
                    <span>{sub}</span>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                );
              })}

              {/* Eraser / Clear cell tool */}
              <div
                draggable
                onDragStart={(e) => {
                  const payload = { type: 'palette-subject', subject: '__CLEAR__', mode: 'study' };
                  e.dataTransfer.setData('text/plain', JSON.stringify(payload));
                  e.dataTransfer.setData('application/json', JSON.stringify(payload));
                  e.dataTransfer.setData('subject-name', '__CLEAR__');
                  e.dataTransfer.setData('subject-mode', 'study');
                  e.dataTransfer.effectAllowed = 'copyMove';
                }}
                onClick={() => {
                  if (activeBrush?.subject === '__CLEAR__') {
                    onSelectBrush(null);
                  } else {
                    onSelectBrush({ type: 'clear-all', subject: '__CLEAR__', mode: 'study' });
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-grab active:cursor-grabbing transition-all select-none ${
                  activeBrush?.subject === '__CLEAR__'
                    ? 'bg-rose-500 text-white border-rose-600 ring-2 ring-rose-400 ring-offset-1 dark:ring-offset-zinc-900'
                    : 'bg-stone-50 dark:bg-zinc-800/80 border-dashed border-stone-300 dark:border-zinc-700 text-stone-500 dark:text-zinc-400 hover:border-rose-400 hover:text-rose-600'
                }`}
                title="پاک‌کن کل پارت: برای خالی کردن خانه‌ها بکشید یا کلیک کنید"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>پاک‌کن پارت</span>
              </div>

              {/* Add Custom Subject */}
              {isAddingSubject ? (
                <form onSubmit={handleAddSubjectSubmit} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newSubjectInput}
                    onChange={(e) => setNewSubjectInput(e.target.value)}
                    placeholder="نام درس جدید..."
                    autoFocus
                    className="text-xs px-2.5 py-1 rounded-lg border border-teal-500 dark:border-teal-500 dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-xs bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-bold cursor-pointer"
                  >
                    ثبت
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingSubject(false)}
                    className="px-2 py-1 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    لغو
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingSubject(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-dashed border-stone-300 dark:border-zinc-700 text-xs text-stone-500 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-400 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن درس</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 3: Direct Session Number Input Box */}
          <div className="pt-2.5 border-t border-stone-100 dark:border-zinc-800/80 flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-zinc-300">
              <Hash className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>شماره جلسه:</span>
            </div>

            {/* The single input box to type any number */}
            <div className="flex items-center gap-1.5">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={sessionInputValue}
                  onChange={(e) => handleSessionInputChange(e.target.value)}
                  placeholder="عدد جلسه..."
                  className="w-24 px-3 py-1 text-xs font-black text-center tabular-nums rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:font-normal placeholder:text-stone-400"
                />
                {sessionInputValue && (
                  <button
                    type="button"
                    onClick={() => handleSessionInputChange('')}
                    className="absolute left-1 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
                    title="پاک کردن عدد"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* If a session number is typed, show the direct stamp/drag badge */}
              {currentSessionNumber !== null && (
                <div
                  draggable
                  onDragStart={(e) => handleSessionDragStart(e, currentSessionNumber)}
                  onClick={toggleSessionBrush}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border cursor-grab active:cursor-grabbing text-xs font-black tabular-nums transition-all select-none ${
                    isSessionBrushActive
                      ? 'bg-teal-600 text-white border-teal-700 ring-2 ring-teal-400 ring-offset-1 dark:ring-offset-zinc-900 shadow-sm'
                      : 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-700/60 hover:bg-teal-100'
                  }`}
                  title="کلیک کنید تا قلم فعال شود یا عدد را بکشید و روی پارت‌ها رها کنید"
                >
                  <GripVertical className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                  <span>جلسه {toPersianDigits(currentSessionNumber)}</span>
                  {isSessionBrushActive ? (
                    <span className="text-[10px] bg-white/20 px-1 rounded font-bold">قلم فعال</span>
                  ) : (
                    <span className="text-[10px] opacity-75 font-normal">(کلیک/درگ)</span>
                  )}
                </div>
              )}

              {/* Clear Session Number Brush */}
              <button
                type="button"
                draggable
                onDragStart={(e) => handleSessionDragStart(e, '__CLEAR_SESSION__')}
                onClick={handleClearSessionClick}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-bold cursor-grab active:cursor-grabbing transition-all select-none ${
                  activeBrush?.type === 'clear-session'
                    ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400 ring-offset-1 dark:ring-offset-zinc-900'
                    : 'bg-stone-50 dark:bg-zinc-800/80 border-dashed border-stone-300 dark:border-zinc-700 text-stone-500 dark:text-zinc-400 hover:border-amber-400 hover:text-amber-600'
                }`}
                title="پاک‌کن شماره جلسه: برای حذف شماره جلسه از پارت‌ها کلیک یا درگ کنید"
              >
                <Eraser className="w-3 h-3" />
                <span>حذف شماره جلسه</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
