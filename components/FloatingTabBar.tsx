import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeColors, FONTS, SPACING, RADIUS } from '@/constants/theme';

const TAB_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  index: 'edit-2',
  library: 'book-open',
};

// Loose typing — expo-router and @react-navigation ship duplicate, incompatible BottomTabBarProps types.
interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: { title?: string; tabBarLabel?: any } }>;
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

export default function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const { colors, effective } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => makeStyles(colors, insets.bottom, effective),
    [colors, insets.bottom, effective]
  );

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.pill}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title ?? route.name;
          const isFocused = state.index === index;
          const iconName = TAB_ICONS[route.name] ?? 'circle';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={({ pressed }) => [
                styles.tab,
                isFocused && styles.tabActive,
                pressed && styles.tabPressed,
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <Feather
                name={iconName}
                size={15}
                color={
                  isFocused
                    ? effective === 'dark' ? colors.ink : colors.onInk
                    : effective === 'dark' ? 'rgba(240,237,230,0.5)' : 'rgba(255,255,255,0.55)'
                }
              />
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {String(label)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors, bottomInset: number, effective: 'light' | 'dark') => {
  const isDark = effective === 'dark';
  const pillBg = isDark ? colors.surfaceElevated : colors.ink;
  const textActive = isDark ? colors.ink : colors.onInk;
  const textDim = isDark ? 'rgba(240,237,230,0.5)' : 'rgba(255,255,255,0.55)';
  const activeOverlay = isDark ? 'rgba(240,237,230,0.07)' : 'rgba(255,255,255,0.08)';

  return StyleSheet.create({
    wrapper: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: Math.max(bottomInset, 16),
      alignItems: 'center',
    },
    pill: {
      flexDirection: 'row',
      backgroundColor: pillBg,
      borderRadius: RADIUS.full,
      paddingHorizontal: 6,
      paddingVertical: 6,
      gap: 4,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.5 : 0.22,
      shadowOffset: { width: 0, height: 12 },
      shadowRadius: 24,
      elevation: 12,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? colors.hairline : 'transparent',
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: RADIUS.full,
    },
    tabActive: {
      backgroundColor: activeOverlay,
    },
    tabPressed: {
      opacity: 0.7,
    },
    label: {
      fontFamily: FONTS.bold,
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: textDim,
    },
    labelActive: {
      color: textActive,
    },
  });
};
