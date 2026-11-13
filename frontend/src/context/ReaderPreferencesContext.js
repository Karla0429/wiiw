import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'reader-preferences';
const DEFAULT_PREFERENCES = { fontFamily: 'Georgia', fontSize: 18, theme: 'paper' };
const ReaderPreferencesContext = createContext(null);

export function ReaderPreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(saved) });
      } catch (error) {
        setLoadError(error);
      }
    };

    loadPreferences();
  }, []);

  const updatePreferences = useCallback(async (updates) => {
    const next = { ...preferences, ...updates };
    setPreferences(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      setPreferences(preferences);
      throw error;
    }
  }, [preferences]);

  const value = useMemo(
    () => ({ preferences, updatePreferences, loadError }),
    [preferences, updatePreferences, loadError],
  );

  return (
    <ReaderPreferencesContext.Provider value={value}>
      {children}
    </ReaderPreferencesContext.Provider>
  );
}

export function useReaderPreferences() {
  const context = useContext(ReaderPreferencesContext);
  if (!context) throw new Error('useReaderPreferences debe usarse dentro de ReaderPreferencesProvider.');
  return context;
}
