import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LIGHT_COLORS, FONTS, SPACING } from '@/constants/theme';
import { PoemNote } from '@/utils/storage';

interface ShareImageCardProps {
  poem: PoemNote;
}

// Always uses LIGHT_COLORS so the share image looks consistent regardless of user's theme.
// Positioned off-screen (left: -9999) — react-native-view-shot still captures it.
const ShareImageCard = forwardRef<View, ShareImageCardProps>(({ poem }, ref) => {
  const colors = LIGHT_COLORS;
  const preview = poem.content.split('\n').slice(0, 12).join('\n');

  return (
    <View ref={ref} style={styles.card} collapsable={false}>
      {/* Brand */}
      <Text style={styles.brand}>SILENS</Text>
      <View style={styles.brandRule} />

      {/* Title */}
      <Text style={styles.title}>{poem.title}</Text>
      <View style={styles.titleRule} />

      {/* Content */}
      <Text style={styles.body} numberOfLines={12}>{preview}</Text>
    </View>
  );
});

ShareImageCard.displayName = 'ShareImageCard';
export default ShareImageCard;

const colors = LIGHT_COLORS;

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: -9999,
    top: 0,
    width: 390,
    backgroundColor: colors.bg,
    padding: 40,
    paddingBottom: 48,
  },
  brand: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.meta,
    marginBottom: SPACING.sm,
  },
  brandRule: {
    width: 24,
    height: 2,
    backgroundColor: colors.accent,
    marginBottom: 32,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.4,
    color: colors.ink,
    marginBottom: SPACING.md,
  },
  titleRule: {
    width: 32,
    height: 2,
    backgroundColor: colors.accent,
    marginBottom: SPACING.lg,
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 28,
    color: colors.inkSecondary,
  },
});
