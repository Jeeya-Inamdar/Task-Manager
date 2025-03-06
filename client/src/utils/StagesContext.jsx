import { createContext, useContext, useState } from "react";

// Create the context
const StageContext = createContext();

// Create the provider component
export const StageProvider = ({ children }) => {
  const [stage, setStage] = useState("todo");

  return (
    <StageContext.Provider value={{ stage, setStage }}>
      {children}
    </StageContext.Provider>
  );
};

// Custom hook for using the context
export const useStage = () => {
  const context = useContext(StageContext);
  if (!context) {
    throw new Error("useStage must be used within a StageProvider");
  }
  return context;
};
