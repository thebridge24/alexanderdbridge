export interface ReadingCompletion {
  dateString: string;
  dayOfYear: number;
  reference: string;
  timestamp: number;
}

export interface StudyPlanState {
  version: number;
  joined: boolean;
  joinDate?: string;
  completedDates: Record<string, ReadingCompletion>; // Keyed by YYYY-DDD
}

const STORAGE_KEY = 'bridge-daily-365-bible-study-v1';

const DEFAULT_STATE: StudyPlanState = {
  version: 1,
  joined: false,
  completedDates: {},
};

export function getStudyStorageData(): StudyPlanState {
  return getStoredState();
}

export function getStoredState(): StudyPlanState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return DEFAULT_STATE;
    const parsed = JSON.parse(data);
    return parsed?.version === 1 ? parsed : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export function joinMovement(): StudyPlanState {
  const state = getStoredState();
  const newState: StudyPlanState = {
    ...state,
    joined: true,
    joinDate: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  }
  return newState;
}

export function markDayCompleted(dayOfYear: number, reference: string): StudyPlanState {
  const state = getStoredState();
  const dateKey = `${new Date().getFullYear()}-${dayOfYear}`;
  
  const newState: StudyPlanState = {
    ...state,
    joined: true,
    completedDates: {
      ...state.completedDates,
      [dateKey]: {
        dateString: new Date().toISOString().split('T')[0],
        dayOfYear,
        reference,
        timestamp: Date.now(),
      },
    },
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  }
  return newState;
}

export function isDayCompleted(dayOfYear: number): boolean {
  const state = getStoredState();
  const dateKey = `${new Date().getFullYear()}-${dayOfYear}`;
  return Boolean(state.completedDates[dateKey]);
}