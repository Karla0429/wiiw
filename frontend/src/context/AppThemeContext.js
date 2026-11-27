import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_THEMES } from '../config/theme';

const STORAGE_KEY = 'app-theme-preference';
const AppThemeContext = createContext(null);

export function AppThemeProvider({ children }) {
  const [themeName, setThemeName] = useState('light');
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let active = true;

    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(STORAGE_KEY);
        if (active && Object.prototype.hasOwnProperty.call(APP_THEMES, savedTheme)) {
          setThemeName(savedTheme);
        }
      } catch (error) {
        console.error('Error loading app theme:', error);
        if (active) setLoadError(error);
      } finally {
        if (active) setIsLoaded(true);
      }
    };

    loadTheme();
    return () => {
      active = false;
    };
  }, []);

  const setTheme = useCallback(async (nextTheme) => {
    if (!Object.prototype.hasOwnProperty.call(APP_THEMES, nextTheme)) {
      throw new Error(`Unknown app theme: ${nextTheme}`);
    }

    await AsyncStorage.setItem(STORAGE_KEY, nextTheme);
    setThemeName(nextTheme);
  }, []);

  const value = useMemo(
    () => ({ themeName, colors: APP_THEMES[themeName], setTheme, isLoaded, loadError }),
    [themeName, setTheme, isLoaded, loadError],
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (!context) throw new Error('useAppTheme debe usarse dentro de AppThemeProvider.');
  return context;
}

export function useAppStyles(createStyles) {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors, createStyles]);
}
