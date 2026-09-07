import React, { useState, useEffect, useMemo } from 'react';
import { ActiveBrush, ScheduleCell, SubjectCountSummary, StudyMode, SessionModeDetail, User } from './types';
import {
  DAYS_CONFIG,
  INITIAL_SCHEDULE_DATA,
  SUBJECT_METADATA_MAP,
  DEFAULT_SUBJECT_META,
  toPersianDigits,
} from './constants';
import { SummaryStats } from './components/SummaryStats';
import { SubjectPalette } from './components/SubjectPalette';
import { ScheduleTable } from './components/ScheduleTable';
import { EditCellModal } from './components/EditCellModal';
import { TimetableToolbar } from './components/TimetableToolbar';
import { DayKanbanView } from './components/DayKanbanView';
import { ClockAndCalendar } from './components/ClockAndCalendar';
import { PerformanceView } from './components/PerformanceView';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LoginView } from './components/LoginView';
import { UserManagementModal } from './components/UserManagementModal';
import {
  GraduationCap,
  LayoutGrid,
  CheckSquare,
  TrendingUp,
  Sun,
  Moon,
  Users,
  LogOut,
} from 'lucide-react';

const DURATION_KEY = 'study_planner_duration_v5';
const THEME_KEY = 'study_planner_theme_v4';
const SLOT_COUNT_KEY = 'study_planner_slot_count_v3';
const USERS_KEY = 'study_planner_users_v1';
const CURRENT_USER_KEY = 'study_planner_current_user_v1';

export default function App() {
  // --- User & Authentication States ---
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [{ username: 'amir', password: '8383', name: 'امیر' }];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(CURRENT_USER_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Theme state: default to 'dark' to prevent eye strain / headache
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return 'dark';
  });

  // Toggle dark class on html root
  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {}
  }, [theme]);

  // Persist users and current user
  useEffect(() => {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (e) {}
  }, [users]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } catch (e) {}
  }, [currentUser]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleOutsideClick = () => {
      setIsDropdownOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, [isDropdownOpen]);

  // Load initial cells
  const [cells, setCells] = useState<ScheduleCell[]>([]);

  // Track switching of users to reload cells dynamically
  useEffect(() => {
    if (currentUser) {
      try {
        const saved = localStorage.getItem(`study_planner_schedule_v9_${currentUser.username.toLowerCase()}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCells(parsed);
            return;
          }
        }
      } catch (e) {}
      setCells(INITIAL_SCHEDULE_DATA);
    }
  }, [currentUser]);

  // Default to 8 slots
  const [slotCount, setSlotCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(SLOT_COUNT_KEY);
      if (saved) {
        const num = Number(saved);
        if (!isNaN(num) && num >= 5 && num <= 9) return num;
      }
    } catch (e) {}
    return 8; // Default 8 slots
  });

  const [slotDurationMinutes, setSlotDurationMinutes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(DURATION_KEY);
      if (saved) {
        const num = Number(saved);
        if (!isNaN(num) && num > 0) return num;
      }
    } catch (e) {}
    return 90; // Default to 90 minutes
  });

  const [direction, setDirection] = useState<'rtl' | 'ltr'>('rtl');
  const [highlightedSubject, setHighlightedSubject] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'table' | 'performance'>('table');
  const [selectedDayKey, setSelectedDayKey] = useState<string>('sat');
  const [editingCell, setEditingCell] = useState<ScheduleCell | null>(null);
  const [customSubjects, setCustomSubjects] = useState<string[]>([]);
  const [activeBrush, setActiveBrush] = useState<ActiveBrush | null>(null);
  const [selectedPaletteMode, setSelectedPaletteMode] = useState<StudyMode>('class');

  // Persist schedule changes
  useEffect(() => {
    if (!currentUser) return;
    try {
      localStorage.setItem(`study_planner_schedule_v9_${currentUser.username.toLowerCase()}`, JSON.stringify(cells));
    } catch (e) {
      console.error('Failed to save schedule', e);
    }
  }, [cells, currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(SLOT_COUNT_KEY, String(slotCount));
    } catch (e) {}
  }, [slotCount]);

  useEffect(() => {
    try {
      localStorage.setItem(DURATION_KEY, String(slotDurationMinutes));
    } catch (e) {}
  }, [slotDurationMinutes]);

  // Compute live summaries for all subjects (respecting active slotCount)
  const { subjectSummaries, totalActiveSlots, completedSlots } = useMemo(() => {
    const baseSubjectOrder = ['زیست', 'شیمی', 'فیزیک', 'ریاضی', 'زمین', 'جبرانی', 'آزمون'];
    
    interface SubjectDataAcc {
      total: number;
      studyCount: number;
      classCount: number;
      testCount: number;
      classSessionsSet: Set<number | string>;
      studySessionsSet: Set<number | string>;
      testSessionsSet: Set<number | string>;
      sessionBreakdownMap: Map<number | string, { classCount: number; studyCount: number; testCount: number; total: number }>;
    }

    const createEmptyAcc = (): SubjectDataAcc => ({
      total: 0,
      studyCount: 0,
      classCount: 0,
      testCount: 0,
      classSessionsSet: new Set(),
      studySessionsSet: new Set(),
      testSessionsSet: new Set(),
      sessionBreakdownMap: new Map(),
    });

    const countsMap = new Map<string, SubjectDataAcc>();

    baseSubjectOrder.forEach((name) => {
      countsMap.set(name, createEmptyAcc());
    });

    let activeCount = 0;
    let doneCount = 0;

    const sortSessions = (a: number | string, b: number | string) => {
      const numA = Number(a);
      const numB = Number(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return String(a).localeCompare(String(b), 'fa');
    };

    cells.forEach((cell) => {
      if (cell.slotIndex >= slotCount) return; // Only count active slots
      const sub = cell.subject?.trim();
      if (!sub) return;

      activeCount++;
      if (cell.completed) doneCount++;

      let current = countsMap.get(sub);
      if (!current) {
        current = createEmptyAcc();
        countsMap.set(sub, current);
      }

      current.total += 1;
      const sess =
        cell.sessionNumber !== undefined && cell.sessionNumber !== null && cell.sessionNumber !== ''
          ? cell.sessionNumber
          : '_unassigned';

      if (cell.mode === 'class') {
        current.classCount += 1;
        if (sess !== '_unassigned') current.classSessionsSet.add(sess);
      } else if (cell.mode === 'test') {
        current.testCount += 1;
        if (sess !== '_unassigned') current.testSessionsSet.add(sess);
      } else {
        current.studyCount += 1;
        if (sess !== '_unassigned') current.studySessionsSet.add(sess);
      }

      const sessItem = current.sessionBreakdownMap.get(sess) || {
        classCount: 0,
        studyCount: 0,
        testCount: 0,
        total: 0,
      };
      sessItem.total += 1;
      if (cell.mode === 'class') sessItem.classCount += 1;
      else if (cell.mode === 'test') sessItem.testCount += 1;
      else sessItem.studyCount += 1;
      current.sessionBreakdownMap.set(sess, sessItem);
    });

    const summaries: SubjectCountSummary[] = [];

    const formatSummaryItem = (name: string, data: SubjectDataAcc): SubjectCountSummary => {
      const classSessions = Array.from(data.classSessionsSet).sort(sortSessions);
      const studySessions = Array.from(data.studySessionsSet).sort(sortSessions);
      const testSessions = Array.from(data.testSessionsSet).sort(sortSessions);
      const sessionsBreakdown: SessionModeDetail[] = Array.from(data.sessionBreakdownMap.entries())
        .map(([sessionKey, item]) => ({
          sessionNumber: sessionKey === '_unassigned' ? 'بدون شماره' : sessionKey,
          classCount: item.classCount,
          studyCount: item.studyCount,
          testCount: item.testCount,
          total: item.total,
        }))
        .sort((a, b) => {
          if (a.sessionNumber === 'بدون شماره') return 1;
          if (b.sessionNumber === 'بدون شماره') return -1;
          return sortSessions(a.sessionNumber, b.sessionNumber);
        });

      return {
        name,
        total: data.total,
        studyCount: data.studyCount,
        classCount: data.classCount,
        testCount: data.testCount,
        percentage: activeCount > 0 ? (data.total / activeCount) * 100 : 0,
        metadata: SUBJECT_METADATA_MAP[name] || DEFAULT_SUBJECT_META,
        classSessions,
        studySessions,
        testSessions,
        sessionsBreakdown,
      };
    };

    baseSubjectOrder.forEach((name) => {
      const data = countsMap.get(name) || createEmptyAcc();
      summaries.push(formatSummaryItem(name, data));
      countsMap.delete(name);
    });

    countsMap.forEach((data, name) => {
      if (data.total > 0) {
        summaries.push(formatSummaryItem(name, data));
      }
    });

    return {
      subjectSummaries: summaries,
      totalActiveSlots: activeCount,
      completedSlots: doneCount,
    };
  }, [cells, slotCount]);

  // Handle Drag & Drop on cells
  const handleCellDrop = (
    targetCellId: string,
    sourceData: {
      type: 'cell' | 'palette-subject' | 'palette-session';
      id?: string;
      subject?: string;
      mode?: StudyMode;
      sessionNumber?: number | string | '__CLEAR_SESSION__';
    }
  ) => {
    setCells((prev) => {
      const targetIndex = prev.findIndex((c) => c.id === targetCellId);
      if (targetIndex === -1) return prev;

      const newCells = [...prev];
      const targetCell = { ...newCells[targetIndex] };

      if (sourceData.type === 'palette-session') {
        if (sourceData.sessionNumber === '__CLEAR_SESSION__') {
          delete targetCell.sessionNumber;
        } else if (sourceData.sessionNumber !== undefined) {
          targetCell.sessionNumber = sourceData.sessionNumber;
        }
        newCells[targetIndex] = targetCell;
        return newCells;
      }

      if (sourceData.type === 'palette-subject') {
        if (sourceData.subject === '__CLEAR__') {
          targetCell.subject = '';
          targetCell.notes = '';
          targetCell.completed = false;
          targetCell.mode = 'study';
          delete targetCell.sessionNumber;
        } else if (sourceData.subject) {
          targetCell.subject = sourceData.subject;
          if (sourceData.mode) {
            targetCell.mode = sourceData.mode;
          } else if (selectedPaletteMode) {
            targetCell.mode = selectedPaletteMode;
          }
        }
        newCells[targetIndex] = targetCell;
        return newCells;
      }

      if (sourceData.type === 'cell' && sourceData.id) {
        if (sourceData.id === targetCellId) return prev;
        const sourceIndex = prev.findIndex((c) => c.id === sourceData.id);
        if (sourceIndex === -1) return prev;

        const sourceCell = { ...newCells[sourceIndex] };

        const tempSubject = targetCell.subject;
        const tempMode = targetCell.mode;
        const tempNotes = targetCell.notes;
        const tempCompleted = targetCell.completed;
        const tempSessionNumber = targetCell.sessionNumber;

        targetCell.subject = sourceCell.subject;
        targetCell.mode = sourceCell.mode;
        targetCell.notes = sourceCell.notes;
        targetCell.completed = sourceCell.completed;
        targetCell.sessionNumber = sourceCell.sessionNumber;

        sourceCell.subject = tempSubject;
        sourceCell.mode = tempMode;
        sourceCell.notes = tempNotes;
        sourceCell.completed = tempCompleted;
        sourceCell.sessionNumber = tempSessionNumber;

        newCells[targetIndex] = targetCell;
        newCells[sourceIndex] = sourceCell;
        return newCells;
      }

      return prev;
    });
  };

  // Handle clicking cell when an active brush is selected in palette
  const handleApplyBrush = (cellId: string) => {
    if (!activeBrush) return;
    setCells((prev) =>
      prev.map((c) => {
        if (c.id !== cellId) return c;
        if (activeBrush.type === 'clear-all' || activeBrush.subject === '__CLEAR__') {
          return {
            ...c,
            subject: '',
            notes: '',
            completed: false,
            mode: 'study',
            sessionNumber: undefined,
          };
        }
        if (activeBrush.type === 'clear-session') {
          const updated = { ...c };
          delete updated.sessionNumber;
          return updated;
        }
        if (activeBrush.type === 'session' && activeBrush.sessionNumber !== undefined) {
          return {
            ...c,
            sessionNumber: activeBrush.sessionNumber,
          };
        }
        if (activeBrush.subject) {
          return {
            ...c,
            subject: activeBrush.subject,
            mode: activeBrush.mode || 'study',
            ...(activeBrush.sessionNumber !== undefined ? { sessionNumber: activeBrush.sessionNumber } : {}),
          };
        }
        return c;
      })
    );
  };

  const handleSaveCell = (updatedCell: ScheduleCell) => {
    setCells((prev) =>
      prev.map((c) => (c.id === updatedCell.id ? updatedCell : c))
    );
  };

  const handleClearCell = (cellId: string) => {
    setCells((prev) =>
      prev.map((c) =>
        c.id === cellId
          ? { ...c, subject: '', notes: '', completed: false, mode: 'study', sessionNumber: undefined }
          : c
      )
    );
  };

  const handleToggleComplete = (cellId: string) => {
    setCells((prev) =>
      prev.map((c) => (c.id === cellId ? { ...c, completed: !c.completed } : c))
    );
  };

  const handleToggleMode = (cellId: string) => {
    setCells((prev) =>
      prev.map((c) => {
        if (c.id !== cellId) return c;
        let nextMode: StudyMode = 'class';
        if (c.mode === 'class') nextMode = 'study';
        else if (c.mode === 'study') nextMode = 'test';
        else if (c.mode === 'test') nextMode = 'class';
        return { ...c, mode: nextMode };
      })
    );
  };

  const handleResetToOriginal = () => {
    const defaultData = JSON.parse(JSON.stringify(INITIAL_SCHEDULE_DATA));
    setCells(defaultData);
    setSlotCount(8);
    setSlotDurationMinutes(90);
    setHighlightedSubject(null);
    setActiveBrush(null);
    try {
      if (currentUser) {
        localStorage.setItem(`study_planner_schedule_v9_${currentUser.username.toLowerCase()}`, JSON.stringify(defaultData));
      }
      localStorage.setItem(SLOT_COUNT_KEY, '8');
      localStorage.setItem(DURATION_KEY, '90');
    } catch (e) {}
  };

  const handleAddUser = (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
  };

  const handleDeleteUser = (usernameToDelete: string) => {
    setUsers((prev) => prev.filter((u) => u.username.toLowerCase() !== usernameToDelete.toLowerCase()));
    try {
      localStorage.removeItem(`study_planner_schedule_v9_${usernameToDelete.toLowerCase()}`);
    } catch (e) {}
  };

  const handleAddSlot = () => {
    if (slotCount >= 9) return;
    const newIndex = slotCount;
    setSlotCount((prev) => prev + 1);
    setCells((prev) => {
      const added: ScheduleCell[] = DAYS_CONFIG
        .filter((day) => !prev.some((c) => c.day === day.key && c.slotIndex === newIndex))
        .map((day) => ({
          id: `${day.key}-${newIndex}`,
          day: day.key,
          slotIndex: newIndex,
          subject: '',
          mode: 'test',
        }));
      return [...prev, ...added];
    });
  };

  const handleRemoveSlot = () => {
    if (slotCount <= 5) return;
    const removedIndex = slotCount - 1;
    setSlotCount((prev) => prev - 1);
    setCells((prev) => prev.filter((c) => c.slotIndex !== removedIndex));
  };

  const handleAddCustomSubject = (name: string) => {
    if (!customSubjects.includes(name)) {
      setCustomSubjects((prev) => [...prev, name]);
    }
  };

  const displayedDays = direction === 'rtl' ? DAYS_CONFIG : [...DAYS_CONFIG].reverse();

  const todayDayKey = useMemo(() => {
    const jsDay = new Date().getDay();
    const map: Record<number, string> = {
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

  const totalSlotsToday = useMemo(() => {
    return cells.filter(
      (c) => c.day === todayDayKey && c.slotIndex < slotCount && c.subject && c.subject !== 'تعطیل'
    ).length;
  }, [cells, todayDayKey, slotCount]);

  if (!currentUser) {
    return <LoginView onLoginSuccess={setCurrentUser} users={users} />;
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#0e1015] text-stone-900 dark:text-zinc-100 pb-16 font-sans transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-stone-200/80 dark:border-zinc-800/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3 flex-wrap md:flex-nowrap">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h1 className="text-sm sm:text-base font-black text-stone-900 dark:text-zinc-100 tracking-tight shrink-0">
              برنامه‌ریزی هفتگی کنکور
            </h1>
          </div>

          {/* Clock & Calendar Widget */}
          <div className="order-3 md:order-2 w-full md:w-auto flex justify-center my-0.5 md:my-0">
            <ClockAndCalendar totalSlotsToday={totalSlotsToday} />
          </div>

          {/* Controls: View Mode & Dark Theme Toggle */}
          <div className="order-2 md:order-3 flex items-center gap-2 shrink-0">
            {/* View Switcher */}
            <div className="flex items-center p-0.5 bg-stone-100 dark:bg-zinc-800/80 rounded-xl border border-stone-200/80 dark:border-zinc-700/70">
              <button
                type="button"
                onClick={() => setActiveTab('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'table'
                    ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-zinc-100 shadow-2xs font-bold'
                    : 'text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>جدول هفتگی</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('performance')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'performance'
                    ? 'bg-white dark:bg-zinc-700 text-teal-700 dark:text-teal-300 shadow-2xs font-bold'
                    : 'text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>تحلیل عملکرد</span>
              </button>
            </div>

            {/* User Account Dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-zinc-700/80 bg-stone-100 dark:bg-zinc-800/80 text-stone-700 dark:text-zinc-200 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer text-xs font-bold"
              >
                <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center font-black text-[10px] shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <span className="hidden sm:inline">{currentUser.name}</span>
              </button>
              
              {isDropdownOpen && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-lg py-1.5 z-40 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  <div className="px-4 py-1.5 border-b border-stone-100 dark:border-zinc-800/80">
                    <p className="text-[10px] text-stone-400 dark:text-zinc-500">حساب فعال</p>
                    <p className="text-xs font-bold text-stone-800 dark:text-zinc-200 truncate mt-0.5">@{currentUser.username}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserModalOpen(true);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-right px-4 py-2 text-xs text-stone-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800/50 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>مدیریت کاربران</span>
                  </button>
                  <hr className="border-stone-100 dark:border-zinc-800/80 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentUser(null);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-right px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>خروج از حساب</span>
                  </button>
                </div>
              )}
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-xl border border-stone-200 dark:border-zinc-700/80 bg-stone-100 dark:bg-zinc-800/80 text-stone-700 dark:text-zinc-200 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'تغییر به تم روشن' : 'تغییر به تم تاریک'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-stone-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <PWAInstallButton />
        <OfflineIndicator />
        {activeTab === 'performance' ? (
          <PerformanceView
            days={displayedDays}
            cells={cells}
            slotCount={slotCount}
            slotDurationMinutes={slotDurationMinutes}
            onToggleComplete={handleToggleComplete}
            onSaveCell={handleSaveCell}
            onCellClick={(cell) => setEditingCell(cell)}
            highlightedSubject={highlightedSubject}
          />
        ) : (
          <>
            {/* Compact stats summary bar */}
            <SummaryStats
              summaries={subjectSummaries}
              totalSlots={totalActiveSlots}
              completedSlots={completedSlots}
              slotDurationMinutes={slotDurationMinutes}
              highlightedSubject={highlightedSubject}
              onSelectHighlight={setHighlightedSubject}
            />

            {/* Action Toolbar */}
            <TimetableToolbar
              onResetToOriginal={handleResetToOriginal}
              direction={direction}
              onToggleDirection={() => setDirection((d) => (d === 'rtl' ? 'ltr' : 'rtl'))}
              slotCount={slotCount}
              onAddSlot={handleAddSlot}
              onRemoveSlot={handleRemoveSlot}
              slotDurationMinutes={slotDurationMinutes}
              onChangeDuration={setSlotDurationMinutes}
            />

            {/* Collapsible Subject Palette */}
            <SubjectPalette
              customSubjects={customSubjects}
              onAddCustomSubject={handleAddCustomSubject}
              activeBrush={activeBrush}
              onSelectBrush={setActiveBrush}
              selectedMode={selectedPaletteMode}
              onChangeSelectedMode={setSelectedPaletteMode}
              highlightedSubject={highlightedSubject}
              onSelectHighlight={setHighlightedSubject}
            />

            {/* Main View */}
            <ScheduleTable
              days={displayedDays}
              cells={cells}
              onCellClick={(cell) => setEditingCell(cell)}
              onCellDrop={handleCellDrop}
              onClearCell={handleClearCell}
              onToggleComplete={handleToggleComplete}
              onToggleMode={handleToggleMode}
              highlightedSubject={highlightedSubject}
              direction={direction}
              slotCount={slotCount}
              slotDurationMinutes={slotDurationMinutes}
              activeBrush={activeBrush}
              onApplyBrush={handleApplyBrush}
            />
          </>
        )}
      </main>

      {/* Edit Cell Modal */}
      <EditCellModal
        cell={editingCell}
        isOpen={!!editingCell}
        onClose={() => setEditingCell(null)}
        onSave={handleSaveCell}
        onClear={handleClearCell}
        customSubjects={customSubjects}
        slotDurationMinutes={slotDurationMinutes}
      />

      {/* User Management Modal */}
      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        users={users}
        onAddUser={handleAddUser}
        onDeleteUser={handleDeleteUser}
        currentUser={currentUser}
      />
    </div>
  );
}
