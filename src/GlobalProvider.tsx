import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface GlobalContextType {
  ADDRESS: string;
  setADDRESS: React.Dispatch<React.SetStateAction<string>>;
}

const GlobalContext = createContext<GlobalContextType | null>(null);

const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  
  const [ADDRESS, setADDRESS] = useState<string>('disconnected');

  return (
    <GlobalContext.Provider
      value={{
        ADDRESS: ADDRESS,
        setADDRESS: setADDRESS
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};


export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }
  return context;
};

export default GlobalProvider;