import React, { useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Alert,
  Share,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeColors, FONTS, SPACING, RADIUS } from '@/constants/theme';
import { type PoemNote } from '@/utils/storage';

interface NoteCardProps {
  note: PoemNote;
  onDelete: () => void;
  onPress?: () => void;
}

export default function NoteCard({ note, onDelete, onPress }: NoteCardProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const scale = useRef(new Animated.Value(1)).current;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const formatMeta = (dateString: string, content: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    const dateLabel =
      diffDays === 0
        ? 'Today'
        : diffDays === 1
        ? 'Yesterday'
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const words = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
    const mins = Math.max(1, Math.ceil(words / 200));
    return `${dateLabel} · ${words} words · ${mins} min`;
  };

  const getPreview = (content: string) => {
    const first = content.trim().split('\n')[0] ?? '';
    return first.length > 80 ? `"${first.slice(0, 80)}…"` : `"${first}"`;
  };

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.985,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `${note.title}\n\n${note.content}` });
    } catch {
      Alert.alert('Error', 'Failed to share the poem.');
    }
  };

  const handleEdit = () => {
    router.push({
      pathname: '/edit/[id]',
      params: {
        id: note.id,
        title: note.title,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
    });
  };

  const showActionSheet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(note.title, undefined, [
      { text: 'Edit', onPress: handleEdit },
      { text: 'Share', onPress: handleShare },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
      <Pressable
        onPress={handlePress}
        onLongPress={showActionSheet}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: colors.ripple }}
        style={styles.pressable}
      >
        <Text style={styles.title} numberOfLines={2}>
          {note.title}
        </Text>

        <View style={styles.accentRule} />

        <Text style={styles.meta}>{formatMeta(note.createdAt, note.content)}</Text>

        {note.content.trim().length > 0 && (
          <Text style={styles.preview} numberOfLines={2}>
            {getPreview(note.content)}
          </Text>
        )}

        <View style={styles.divider} />

        <View style={styles.footer}>
          <Pressable
            onPress={handleShare}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.iconButton}
          >
            <Feather name="share" size={16} color={colors.meta} />
          </Pressable>

          <Pressable
            onPress={handlePress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.cta}>Read</Text>
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.hairline,
      marginBottom: SPACING.md,
      marginHorizontal: SPACING.xl,
      overflow: 'hidden',
    },
    pressable: {
      padding: SPACING['2xl'],
    },
    title: {
      fontFamily: FONTS.bold,
      fontSize: 22,
      lineHeight: 28,
      letterSpacing: -0.3,
      color: colors.ink,
      marginBottom: SPACING.sm,
    },
    accentRule: {
      width: 32,
      height: 2,
      backgroundColor: colors.accent,
      marginBottom: SPACING.md,
    },
    meta: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: colors.meta,
      marginBottom: SPACING.sm,
    },
    preview: {
      fontFamily: FONTS.italic,
      fontSize: 15,
      lineHeight: 24,
      color: colors.inkSecondary,
      marginBottom: SPACING.lg,
    },
    divider: {
      height: 1,
      backgroundColor: colors.hairline,
      marginBottom: SPACING.lg,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    iconButton: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.hairline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cta: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.ink,
    },
  });
