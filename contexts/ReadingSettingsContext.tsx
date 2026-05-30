import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FontSizeChoice = 'small' | 'medium' | 'large';
export type LineSpacingChoice = 'compact' | 'standard' | 'relaxed';

export const FONT_SIZE_VALUES: Record<FontSizeChoice, number> = {
  small: 16,
  medium: 18,
  large: 21,
};

export const LINE_SPACING_MULTIPLIERS: Record<LineSpacingChoice, number> = {
  compact: 1.4,
  standard: 1.65,
  relaxed: 1.9,
};

interface ReadingSettingsValue {
  fontSize: FontSizeChoice;
  lineSpacing: LineSpacingChoice;
  setFontSize: (s: FontSizeChoice) => void;
  setLineSpacing: (s: LineSpacingChoice) => void;
  resolvedFontSize: number;
  resolvedLineHeight: number;
}

const KEY = 'silens.reading.v1';

const ReadingSettingsContext = createContext<ReadingSettingsValue>({
  fontSize: 'medium',
  lineSpacing: 'standard',
  setFontSize: () => {},
  setLineSpacing: () => {},
  resolvedFontSize: FONT_SIZE_VALUES.medium,
  resolvedLineHeight: FONT_SIZE_VALUES.medium * LINE_SPACING_MULTIPLIERS.standard,
});

export function ReadingSettingsProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSizeChoice>('medium');
  const [lineSpacing, setLineSpacingState] = useState<LineSpacingChoice>('standard');

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<{ fontSize: FontSizeChoice; lineSpacing: LineSpacingChoice }>;
      if (saved.fontSize && saved.fontSize in FONT_SIZE_VALUES) setFontSizeState(saved.fontSize);
      if (saved.lineSpacing && saved.lineSpacing in LINE_SPACING_MULTIPLIERS) setLineSpacingState(saved.lineSpacing);
    });
  }, []);

  const persist = (patch: Partial<{ fontSize: FontSizeChoice; lineSpacing: LineSpacingChoice }>) => {
    AsyncStorage.getItem(KEY).then((raw) => {
      const prev = raw ? JSON.parse(raw) : {};
      AsyncStorage.setItem(KEY, JSON.stringify({ ...prev, ...patch }));
    });
  };

  const setFontSize = (s: FontSizeChoice) => {
    setFontSizeState(s);
    persist({ fontSize: s });
  };

  const setLineSpacing = (s: LineSpacingChoice) => {
    setLineSpacingState(s);
    persist({ lineSpacing: s });
  };

  const resolvedFontSize = FONT_SIZE_VALUES[fontSize];
  const resolvedLineHeight = resolvedFontSize * LINE_SPACING_MULTIPLIERS[lineSpacing];

  const value = useMemo(
    () => ({ fontSize, lineSpacing, setFontSize, setLineSpacing, resolvedFontSize, resolvedLineHeight }),
    [fontSize, lineSpacing, resolvedFontSize, resolvedLineHeight]
  );

  return <ReadingSettingsContext.Provider value={value}>{children}</ReadingSettingsContext.Provider>;
}

export function useReadingSettings() {
  return useContext(ReadingSettingsContext);
}
