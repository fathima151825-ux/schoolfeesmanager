import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentAcademicYear, getAcademicYears } from '../services/feeService';

const AcademicYearContext = createContext(null);

export const AcademicYearProvider = ({ children }) => {
  const [currentAcademicYear, setCurrentAcademicYear] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [current, all] = await Promise.all([
        getCurrentAcademicYear(),
        getAcademicYears()
      ]);
      setCurrentAcademicYear(current);
      setAcademicYears(all || []);
    } catch (err) {
      console.error('[AcademicYearContext] Failed to load academic years:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AcademicYearContext.Provider value={{ currentAcademicYear, academicYears, loading, refresh }}>
      {children}
    </AcademicYearContext.Provider>
  );
};

export const useAcademicYear = () => {
  const ctx = useContext(AcademicYearContext);
  if (!ctx) throw new Error('useAcademicYear must be used within AcademicYearProvider');
  return ctx;
};

export default AcademicYearContext;
