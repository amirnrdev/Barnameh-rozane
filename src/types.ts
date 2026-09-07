export type DayKey = 'sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri';

export type StudyMode = 'study' | 'class' | 'test' | 'review' | 'free';

export interface DayConfig {
  key: DayKey;
  label: string;
  shortLabel: string;
  isWeekend?: boolean;
}

export interface ScheduleCell {
  id: string;
  day: DayKey;
  slotIndex: number; // 0 to 8 (9 slots)
  subject: string;
  mode: StudyMode;
  notes?: string;
  sessionNumber?: number | string; // e.g. 1, 2, 3 or "3"
  durationMinutes?: number;
  customStartTime?: string; // e.g. "07:00"
  completed?: boolean;
}

export interface SubjectMetadata {
  name: string;
  colorName: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  accentClass: string;
  lightBgClass: string;
  badgeBgClass: string;
  description?: string;
}

export interface ActiveBrush {
  type?: 'subject' | 'session' | 'clear-session' | 'clear-all';
  subject?: string;
  mode?: StudyMode;
  sessionNumber?: number | string | null;
}

export interface SessionModeDetail {
  sessionNumber: number | string;
  classCount: number;
  studyCount: number;
  testCount: number;
  total: number;
}

export interface User {
  username: string;
  password?: string;
  name: string;
}

export interface SubjectCountSummary {
  name: string;
  total: number;
  studyCount: number;
  classCount: number;
  testCount: number;
  percentage: number;
  metadata: SubjectMetadata;
  classSessions: (number | string)[];
  studySessions: (number | string)[];
  testSessions: (number | string)[];
  sessionsBreakdown: SessionModeDetail[];
}
