import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  Alert,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ExpoSharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { captureRef } from 'react-native-view-shot';
import { type PoemNote } from '@/utils/storage';
import { useTheme } from '@/contexts/ThemeContext';
import { useReadingSettings } from '@/contexts/ReadingSettingsContext';
import { ThemeColors, FONTS, SPACING, RADIUS, TIMING } from '@/constants/theme';
import ShareImageCard from '@/components/ShareImageCard';

export default function PoemDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const { resolvedFontSize, resolvedLineHeight } = useReadingSettings();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const shareCardRef = useRef<View>(null);
  const scrollTopOpacity = useRef(new Animated.Value(0)).current;

  const poem: PoemNote = {
    id: params.id as string,
    title: params.title as string,
    content: params.content as string,
    status: params.status as 'writing' | 'not published' | 'Published',
    createdAt: params.createdAt as string,
    updatedAt: params.updatedAt as string,
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const wordCount = poem.content.trim() === '' ? 0 : poem.content.trim().split(/\s+/).length;
  const lineCount = poem.content.split('\n').filter((l) => l.trim()).length;
  const readingMins = Math.max(1, Math.ceil(wordCount / 200));

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/edit/[id]',
      params: {
        id: poem.id,
        title: poem.title,
        content: poem.content,
        status: poem.status,
        createdAt: poem.createdAt,
        updatedAt: poem.updatedAt,
      },
    });
  };

  const handleShareText = async () => {
    try {
      await Share.share({ message: `${poem.title}\n\n${poem.content}` });
    } catch {
      Alert.alert('Error', 'Failed to share.');
    }
  };

  const handleShareImage = async () => {
    try {
      const uri = await captureRef(shareCardRef, { format: 'png', quality: 1 });
      const safeName = poem.title
        .replace(/[^a-z0-9\s]/gi, '')
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase()
        .slice(0, 60) || 'poem';
      const dest = `${FileSystem.cacheDirectory}${safeName}.png`;
      await FileSystem.copyAsync({ from: uri, to: dest });

      const isAvailable = await ExpoSharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing not available', 'Your device does not support sharing files.');
        return;
      }
      await ExpoSharing.shareAsync(dest, { mimeType: 'image/png', dialogTitle: poem.title });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert('Error', 'Failed to create share image.');
    }
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Share', poem.title, [
      { text: 'Share as Image', onPress: handleShareImage },
      { text: 'Share as Text', onPress: handleShareText },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const shouldShow = y > 250;
    if (shouldShow !== showScrollTop) {
      setShowScrollTop(shouldShow);
      Animated.timing(scrollTopOpacity, {
        toValue: shouldShow ? 1 : 0,
        duration: TIMING.medium,
        useNativeDriver: true,
      }).start();
    }
  };

  const scrollToTop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const showEditedLabel = poem.updatedAt && poem.updatedAt !== poem.createdAt;
  const statusLabel = poem.status === 'Published' ? 'Published' : poem.status === 'writing' ? 'Writing' : 'Not Published';

  return (
    <SafeAreaView style={styles.container}>
      {/* Off-screen share card — captured by react-native-view-shot */}
      <ShareImageCard ref={shareCardRef} poem={poem} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
        >
          <Feather name="arrow-left" size={22} color={colors.ink} />
        </Pressable>

        <View style={styles.headerActions}>
          <Pressable
            onPress={handleEdit}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          >
            <Feather name="edit-2" size={20} color={colors.ink} />
          </Pressable>
          <Pressable
            onPress={handleShare}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          >
            <Feather name="share" size={20} color={colors.ink} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Status badge */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, poem.status === 'Published' && styles.statusBadgePublished]}>
            <Text style={[styles.statusText, poem.status === 'Published' && styles.statusTextPublished]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{poem.title}</Text>
        <View style={styles.titleRule} />

        {/* Meta */}
        <Text style={styles.meta}>
          {formatDate(poem.createdAt)} · {wordCount} words · {lineCount} lines · {readingMins} min
        </Text>

        {/* Stats strip */}
        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{wordCount}</Text>
            <Text style={styles.statLabel}>Words</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{lineCount}</Text>
            <Text style={styles.statLabel}>Lines</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{readingMins} min</Text>
            <Text style={styles.statLabel}>Reading</Text>
          </View>
        </View>

        {/* Body — uses reading settings */}
        <Text style={[styles.body, { fontSize: resolvedFontSize, lineHeight: resolvedLineHeight }]}>
          {poem.content}
        </Text>

        {/* Last edited */}
        {showEditedLabel && (
          <Text style={styles.caption}>Last edited {formatDate(poem.updatedAt)}</Text>
        )}
      </ScrollView>

      {/* Scroll to top */}
      <Animated.View style={[styles.scrollTopBtn, { opacity: scrollTopOpacity }]} pointerEvents={showScrollTop ? 'auto' : 'none'}>
        <Pressable style={styles.scrollTopPill} onPress={scrollToTop}>
          <Feather name="arrow-up" size={14} color={colors.onInk} />
          <Text style={styles.scrollTopText}>Top</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.xs,
      paddingBottom: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    headerActions: { flexDirection: 'row', gap: SPACING.md },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.hairline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtnPressed: { backgroundColor: colors.surfaceElevated },
    scrollView: { flex: 1 },
    scrollContent: {
      paddingHorizontal: SPACING['2xl'],
      paddingTop: SPACING['2xl'],
      paddingBottom: SPACING['4xl'],
    },
    statusRow: {
      alignItems: 'flex-start',
      marginBottom: SPACING.lg,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
    },
    statusBadgePublished: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    statusText: {
      fontFamily: FONTS.regular,
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: colors.meta,
    },
    statusTextPublished: { color: colors.accent },
    title: {
      fontFamily: FONTS.bold,
      fontSize: 36,
      lineHeight: 44,
      letterSpacing: -0.6,
      color: colors.ink,
      textAlign: 'center',
      marginBottom: SPACING.lg,
    },
    titleRule: {
      width: 32,
      height: 2,
      backgroundColor: colors.accent,
      alignSelf: 'center',
      marginBottom: SPACING.lg,
    },
    meta: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: colors.meta,
      textAlign: 'center',
      marginBottom: SPACING['3xl'],
    },
    statsRow: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: RADIUS.md,
      marginBottom: SPACING['3xl'],
    },
    statCell: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: SPACING.lg,
      gap: SPACING.xs,
    },
    statValue: { fontFamily: FONTS.bold, fontSize: 18, color: colors.ink },
    statLabel: {
      fontFamily: FONTS.regular,
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: colors.meta,
    },
    statDivider: { width: 1, backgroundColor: colors.hairline },
    body: {
      fontFamily: FONTS.regular,
      color: colors.inkSecondary,
    },
    caption: {
      fontFamily: FONTS.italic,
      fontSize: 12,
      color: colors.meta,
      textAlign: 'center',
      marginTop: SPACING['3xl'],
    },
    scrollTopBtn: {
      position: 'absolute',
      bottom: 24,
      alignSelf: 'center',
    },
    scrollTopPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
      backgroundColor: colors.ink,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: RADIUS.full,
    },
    scrollTopText: {
      fontFamily: FONTS.bold,
      fontSize: 12,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: colors.onInk,
    },
  });
