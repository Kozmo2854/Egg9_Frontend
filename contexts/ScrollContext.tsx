import React, { createContext, useContext, useState } from 'react';

interface ScrollContextType {
  scrollY: number;
  setScrollY: (y: number) => void;
}

const ScrollContext = createContext<ScrollContextType>({
  scrollY: 0,
  setScrollY: () => {},
});

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const [scrollY, setScrollY] = useState(0);
  
  return (
    <ScrollContext.Provider value={{ scrollY, setScrollY }}>
      {children}
    </ScrollContext.Provider>
  );
}

export function useScrollContext() {
  return useContext(ScrollContext);
}

