import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WeekContextType {
  weekStart: string | null;
  weekEnd: string | null;
  setWeekDates: (start: string, end: string) => void;
}

const WeekContext = createContext<WeekContextType>({
  weekStart: null,
  weekEnd: null,
  setWeekDates: () => {},
});

export function WeekProvider({ children }: { children: ReactNode }) {
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [weekEnd, setWeekEnd] = useState<string | null>(null);

  const setWeekDates = (start: string, end: string) => {
    setWeekStart(start);
    setWeekEnd(end);
  };

  return (
    <WeekContext.Provider value={{ weekStart, weekEnd, setWeekDates }}>
      {children}
    </WeekContext.Provider>
  );
}

export function useWeekContext() {
  return useContext(WeekContext);
}

