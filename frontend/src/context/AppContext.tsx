import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface AppContextType {
  isTechMode: boolean;
  setIsTechMode: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isTechMode, setIsTechMode] = useState(false);
  return (
    <AppContext.Provider value={{ isTechMode, setIsTechMode }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
