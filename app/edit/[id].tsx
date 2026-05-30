import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { createNoteInNotion, updateNoteInNotion, type PoemNote } from '@/utils/storage';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeColors, FONTS, SPACING, RADIUS } from '@/constants/theme';

type PoemStatus = 'writing' | 'not published' | 'Published';

const STATUS_OPTIONS: { value: PoemStatus; label: string }[] = [
  { value: 'writing', label: 'Writing' },
  { value: 'not published', label: 'Not Published' },
  { value: 'Published', label: 'Published' },
];

export default function EditPoemScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [title, setTitle] = useState(params.title as string || '');
  const [content, setContent] = useState(params.content as string || '');
  const [status, setStatus] = useState<PoemStatus>(
    (params.status as PoemStatus) || 'not published'
  );
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const originalTitle = params.title as string || '';
  const originalContent = params.content as string || '';
  const originalStatus = (params.status as PoemStatus) || 'not published';

  useEffect(() => {
    setWordCount(content.trim() === '' ? 0 : content.trim().split(/\s+/).length);
  }, [content]);

  const hasChanges =
    title.trim() !== originalTitle.trim() ||
    content.trim() !== originalContent.trim() ||
    status !== originalStatus;

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Empty Poem', 'Please add some content before saving.');
      return;
    }
    setIsSaving(true);
    const poemData: PoemNote = {
      id: params.id as string,
      title: title.trim() || 'Untitled Poem',
      content: content.trim(),
      status,
      createdAt: Array.isArray(params.createdAt) ? params.createdAt[0] : params.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      if (params.id) {
        const updated = await updateNoteInNotion(poemData);
        if (!updated) throw new Error('Update failed');
      } else {
        const created = await createNoteInNotion(poemData);
        if (!created) throw new Error('Creation failed');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save your poem. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (hasChanges) {
      Alert.alert('Discard Changes', 'You have unsaved changes. Discard them?', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={handleCancel}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          >
            <Feather name="x" size={22} color={colors.ink} />
          </Pressable>

          <View>
            <Text style={styles.eyebrow}>Edit Poem</Text>
            <View style={styles.eyebrowRule} />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.saveButtonPressed,
              isSaving && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Feather name="save" size={16} color={colors.onInk} />
            <Text style={styles.saveButtonText}>{isSaving ? 'Saving…' : 'Save'}</Text>
          </Pressable>
        </View>

        {/* Status selector */}
        <View style={styles.statusSection}>
          <Text style={styles.statusLabel}>Status</Text>
          <View style={styles.statusPills}>
            {STATUS_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.statusPill, status === opt.value && styles.statusPillActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setStatus(opt.value);
                }}
              >
                <Text style={[styles.statusPillText, status === opt.value && styles.statusPillTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Editing area */}
        <View style={styles.editingArea}>
          <TextInput
            style={styles.titleInput}
            placeholder="Title your poem…"
            placeholderTextColor={colors.metaLight}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <TextInput
            style={styles.contentInput}
            placeholder="Write your poem…"
            placeholderTextColor={colors.metaLight}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            scrollEnabled
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerMeta}>
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </Text>
          {hasChanges && <Text style={styles.footerMeta}>unsaved changes</Text>}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    eyebrow: {
      fontFamily: FONTS.bold,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.meta,
      marginBottom: SPACING.xs,
      textAlign: 'center',
    },
    eyebrowRule: {
      width: 24,
      height: 2,
      backgroundColor: colors.accent,
      alignSelf: 'center',
    },
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
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.ink,
      paddingHorizontal: SPACING.xl,
      paddingVertical: 14,
      borderRadius: RADIUS.md,
      gap: SPACING.sm,
    },
    saveButtonPressed: { opacity: 0.8 },
    saveButtonDisabled: { opacity: 0.5 },
    saveButtonText: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.onInk,
    },
    statusSection: {
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    statusLabel: {
      fontFamily: FONTS.bold,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.meta,
      marginBottom: SPACING.sm,
    },
    statusPills: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    statusPill: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    statusPillActive: {
      backgroundColor: colors.ink,
      borderColor: colors.ink,
    },
    statusPillText: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: colors.ink,
    },
    statusPillTextActive: {
      color: colors.onInk,
      fontFamily: FONTS.bold,
    },
    editingArea: {
      flex: 1,
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING['2xl'],
    },
    titleInput: {
      fontFamily: FONTS.bold,
      fontSize: 22,
      lineHeight: 28,
      letterSpacing: -0.3,
      color: colors.ink,
      marginBottom: SPACING['3xl'],
      paddingBottom: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    contentInput: {
      flex: 1,
      fontFamily: FONTS.regular,
      fontSize: 18,
      lineHeight: 30,
      color: colors.inkSecondary,
      paddingVertical: SPACING.md,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.md,
      borderTopWidth: 1,
      borderTopColor: colors.hairline,
    },
    footerMeta: {
      fontFamily: FONTS.regular,
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: colors.metaLight,
    },
  });
