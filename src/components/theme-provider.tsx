import React from "react";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // You can add your theme logic here (e.g., context, next-themes, etc.)
  return <>{children}</>;
};
