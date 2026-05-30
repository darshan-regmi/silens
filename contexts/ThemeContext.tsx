import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, LIGHT_COLORS, DARK_COLORS } from '@/constants/theme';

type SchemeChoice = 'system' | 'light' | 'dark';
type EffectiveScheme = 'light' | 'dark';

interface ThemeContextValue {
  scheme: SchemeChoice;
  effective: EffectiveScheme;
  colors: ThemeColors;
  setScheme: (s: SchemeChoice) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  scheme: 'system',
  effective: 'light',
  colors: LIGHT_COLORS,
  setScheme: () => {},
});

const STORAGE_KEY = 'silens.theme.v1';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setSchemeState] = useState<SchemeChoice>('system');
  const [systemScheme, setSystemScheme] = useState<EffectiveScheme>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setSchemeState(stored);
      }
    });

    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => sub.remove();
  }, []);

  const effective: EffectiveScheme = scheme === 'system' ? systemScheme : scheme;
  const colors = effective === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  const setScheme = (s: SchemeChoice) => {
    setSchemeState(s);
    AsyncStorage.setItem(STORAGE_KEY, s);
  };

  const value = useMemo(
    () => ({ scheme, effective, colors, setScheme }),
    [scheme, effective, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
