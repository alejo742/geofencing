'use client';

import { AppContext } from "@/context/AppContext";
import { useContext } from "react";

/**
 * Custom hook to access the StructuresContext.
 * @returns The StructuresContext, which provides access to structures and their management functions.
 */
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useStructures must be used within a StructuresProvider');
  }
  return context;
}