import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Alert,
  Animated,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { getNotesFromNotion, deleteNoteInNotion, type PoemNote } from '@/utils/storage';
import { getCachedPoemsList, cachePoemsList } from '@/utils/cache';
import NoteCard from '@/components/NoteCard';
import SettingsSheet from '@/components/SettingsSheet';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeColors, FONTS, SPACING, RADIUS, TIMING } from '@/constants/theme';

type StatusFilter = 'all' | 'writing' | 'not published' | 'Published';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'writing', label: 'Writing' },
  { value: 'not published', label: 'Not Published' },
  { value: 'Published', label: 'Published' },
];

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  if (!q) return true;
  // Check if all query characters appear in order (fuzzy) OR as substring
  if (t.includes(q)) return true;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

export default function LibraryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();

  const [notes, setNotes] = useState<PoemNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const searchRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);
  const searchFocused = useRef(false);
  const borderAnim = useRef(new Animated.Value(0)).current;
  const scrollTopOpacity = useRef(new Animated.Value(0)).current;

  // Offline-first: show cache immediately, then sync in background
  const loadNotes = useCallback(async () => {
    const cached = await getCachedPoemsList();
    if (cached.length > 0) {
      setNotes(cached);
      setLoading(false);
    }

    try {
      const fresh = await getNotesFromNotion();
      setNotes(fresh);
      await cachePoemsList(fresh);
      setIsOffline(false);
    } catch {
      setIsOffline(cached.length > 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadNotes(); }, [loadNotes]));

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const fresh = await getNotesFromNotion();
      setNotes(fresh);
      await cachePoemsList(fresh);
      setIsOffline(false);
    } catch {
      setIsOffline(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (n.status ?? '').toLowerCase() === String(statusFilter).toLowerCase();
      const matchesQuery =
        !searchQuery.trim() ||
        fuzzyMatch(searchQuery, n.title) ||
        fuzzyMatch(searchQuery, n.content);
      return matchesStatus && matchesQuery;
    });
  }, [notes, searchQuery, statusFilter]);

  const handleFocus = () => {
    searchFocused.current = true;
    Animated.timing(borderAnim, { toValue: 1, duration: TIMING.fast, useNativeDriver: false }).start();
  };

  const handleBlur = () => {
    searchFocused.current = false;
    Animated.timing(borderAnim, { toValue: 0, duration: TIMING.fast, useNativeDriver: false }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.hairline, colors.accent],
  });

  const borderWidth = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2],
  });

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const shouldShow = y > 300;
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
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert('Delete Poem', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteNoteInNotion(noteId);
            await loadNotes();
          } catch {
            Alert.alert('Error', 'Failed to delete the poem.');
          }
        },
      },
    ]);
  };

  const handleViewPoem = (note: PoemNote) => {
    router.push({
      pathname: '/poem/[id]',
      params: {
        id: note.id,
        title: note.title,
        content: note.content,
        status: note.status,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
    });
  };

  const renderNote = useCallback(
    ({ item }: { item: PoemNote }) => (
      <NoteCard
        note={item}
        onDelete={() => handleDeleteNote(item.id)}
        onPress={() => handleViewPoem(item)}
      />
    ),
    [notes]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed header — stays above the list so TextInput never loses focus */}
      <View style={styles.header}>
        <View style={styles.wordmarkRow}>
          <Text style={styles.wordmark}>Silens</Text>
          <View style={styles.headerRight}>
            {isOffline && (
              <View style={styles.offlineBadge}>
                <Feather name="wifi-off" size={11} color={colors.meta} />
                <Text style={styles.offlineText}>Cached</Text>
              </View>
            )}
            <Text style={styles.poemCount}>
              {filteredNotes.length} {filteredNotes.length === 1 ? 'poem' : 'poems'}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
              onPress={() => setSettingsVisible(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="sliders" size={18} color={colors.ink} />
            </Pressable>
          </View>
        </View>
        <View style={styles.wordmarkRule} />

        {/* Search — above the list, always stable */}
        <Animated.View style={[styles.searchRow, { borderBottomColor: borderColor, borderBottomWidth: borderWidth }]}>
          <Feather name="search" size={18} color={searchFocused.current ? colors.accent : colors.meta} />
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            placeholder="Search your poems…"
            placeholderTextColor={colors.metaLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={18} color={colors.meta} />
            </Pressable>
          )}
        </Animated.View>

        {/* Status filter pills */}
        <View style={styles.filterRow}>
          {STATUS_FILTERS.map((f) => (
            <Pressable
              key={f.value}
              style={[styles.filterPill, statusFilter === f.value && styles.filterPillActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setStatusFilter(f.value);
              }}
            >
              <Text style={[styles.filterText, statusFilter === f.value && styles.filterTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* List */}
      {loading && filteredNotes.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading your library…</Text>
        </View>
      ) : filteredNotes.length === 0 ? (
        <View style={styles.centered}>
          <Feather name="book-open" size={40} color={colors.metaLight} />
          <View style={styles.emptyRule} />
          <Text style={styles.emptyTitle}>
            {searchQuery || statusFilter !== 'all' ? 'No poems found' : 'Your library is empty'}
          </Text>
          <Text style={styles.emptyBody}>
            {searchQuery
              ? 'Try different search terms'
              : statusFilter !== 'all'
              ? 'No poems with this status yet'
              : 'Start writing your first poem in the Write tab'}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredNotes}
          renderItem={renderNote}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
              progressBackgroundColor={colors.surface}
            />
          }
        />
      )}

      {/* Scroll to top */}
      <Animated.View style={[styles.scrollTopBtn, { opacity: scrollTopOpacity }]} pointerEvents={showScrollTop ? 'auto' : 'none'}>
        <Pressable style={styles.scrollTopPill} onPress={scrollToTop}>
          <Feather name="arrow-up" size={14} color={colors.onInk} />
          <Text style={styles.scrollTopText}>Top</Text>
        </Pressable>
      </Animated.View>

      <SettingsSheet visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.sm,
      backgroundColor: colors.bg,
    },
    wordmarkRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: SPACING.xs,
    },
    wordmark: {
      fontFamily: FONTS.bold,
      fontSize: 28,
      letterSpacing: -0.5,
      color: colors.ink,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    offlineBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surfaceElevated,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 3,
      borderRadius: RADIUS.full,
    },
    offlineText: {
      fontFamily: FONTS.regular,
      fontSize: 11,
      color: colors.meta,
    },
    poemCount: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: colors.meta,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.hairline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtnPressed: { backgroundColor: colors.surfaceElevated },
    wordmarkRule: {
      width: 32,
      height: 2,
      backgroundColor: colors.accent,
      marginTop: SPACING.xs,
      marginBottom: SPACING.lg,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.md,
      marginBottom: SPACING.md,
    },
    searchInput: {
      flex: 1,
      fontFamily: FONTS.regular,
      fontSize: 16,
      color: colors.ink,
      marginLeft: SPACING.sm,
      marginRight: SPACING.sm,
    },
    filterRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
      paddingBottom: SPACING.md,
      flexWrap: 'wrap',
    },
    filterPill: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    filterPillActive: {
      backgroundColor: colors.ink,
      borderColor: colors.ink,
    },
    filterText: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: colors.ink,
    },
    filterTextActive: {
      color: colors.onInk,
      fontFamily: FONTS.bold,
    },
    listContent: {
      paddingTop: SPACING.sm,
      paddingBottom: 140,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: SPACING['4xl'],
    },
    emptyRule: {
      width: 24,
      height: 2,
      backgroundColor: colors.accent,
      marginTop: SPACING.lg,
      marginBottom: SPACING.lg,
    },
    emptyTitle: {
      fontFamily: FONTS.bold,
      fontSize: 22,
      letterSpacing: -0.3,
      color: colors.ink,
      textAlign: 'center',
      marginBottom: SPACING.sm,
    },
    emptyBody: {
      fontFamily: FONTS.regular,
      fontSize: 15,
      lineHeight: 24,
      color: colors.meta,
      textAlign: 'center',
      maxWidth: 280,
    },
    loadingText: {
      fontFamily: FONTS.italic,
      fontSize: 15,
      color: colors.meta,
    },
    scrollTopBtn: {
      position: 'absolute',
      bottom: 100,
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
