import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Pressable,
  TouchableWithoutFeedback,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useReadingSettings, FontSizeChoice, LineSpacingChoice } from '@/contexts/ReadingSettingsContext';
import { ThemeColors, FONTS, SPACING, RADIUS, TIMING } from '@/constants/theme';

interface SettingsSheetProps {
  visible: boolean;
  onClose: () => void;
}

type SchemeChoice = 'system' | 'light' | 'dark';

const THEME_OPTIONS: { value: SchemeChoice; label: string }[] = [
  { value: 'system', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const FONT_SIZE_OPTIONS: { value: FontSizeChoice; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const LINE_SPACING_OPTIONS: { value: LineSpacingChoice; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'standard', label: 'Standard' },
  { value: 'relaxed', label: 'Relaxed' },
];

export default function SettingsSheet({ visible, onClose }: SettingsSheetProps) {
  const { colors, scheme, setScheme } = useTheme();
  const { fontSize, lineSpacing, setFontSize, setLineSpacing } = useReadingSettings();
  const translateY = useRef(new Animated.Value(500)).current;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : 500,
      friction: 8,
      tension: 65,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const selectScheme = (s: SchemeChoice) => {
    Haptics.selectionAsync();
    setScheme(s);
  };

  const selectFontSize = (s: FontSizeChoice) => {
    Haptics.selectionAsync();
    setFontSize(s);
  };

  const selectLineSpacing = (s: LineSpacingChoice) => {
    Haptics.selectionAsync();
    setLineSpacing(s);
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <Text style={styles.eyebrow}>Settings</Text>
          <Pressable onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={20} color={colors.meta} />
          </Pressable>
        </View>

        {/* Appearance */}
        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.segmented}>
          {THEME_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.segmentPill, scheme === opt.value && styles.segmentPillActive]}
              onPress={() => selectScheme(opt.value)}
            >
              <Text style={[styles.segmentText, scheme === opt.value && styles.segmentTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Font size */}
        <Text style={styles.sectionLabel}>Font Size</Text>
        <View style={styles.segmented}>
          {FONT_SIZE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.segmentPill, fontSize === opt.value && styles.segmentPillActive]}
              onPress={() => selectFontSize(opt.value)}
            >
              <Text style={[styles.segmentText, fontSize === opt.value && styles.segmentTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Line spacing */}
        <Text style={styles.sectionLabel}>Line Spacing</Text>
        <View style={styles.segmented}>
          {LINE_SPACING_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.segmentPill, lineSpacing === opt.value && styles.segmentPillActive]}
              onPress={() => selectLineSpacing(opt.value)}
            >
              <Text style={[styles.segmentText, lineSpacing === opt.value && styles.segmentTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
    },
    sheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.bg,
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      paddingHorizontal: SPACING['2xl'],
      paddingBottom: 48,
      paddingTop: SPACING.md,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.hairline,
      alignSelf: 'center',
      marginBottom: SPACING.lg,
    },
    sheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING['2xl'],
    },
    eyebrow: {
      fontFamily: FONTS.bold,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.meta,
    },
    sectionLabel: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      letterSpacing: 0.3,
      color: colors.ink,
      marginBottom: SPACING.sm,
    },
    segmented: {
      flexDirection: 'row',
      gap: SPACING.sm,
      marginBottom: SPACING['2xl'],
    },
    segmentPill: {
      flex: 1,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      alignItems: 'center',
    },
    segmentPillActive: {
      backgroundColor: colors.ink,
      borderColor: colors.ink,
    },
    segmentText: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: colors.ink,
    },
    segmentTextActive: {
      color: colors.onInk,
      fontFamily: FONTS.bold,
    },
  });
