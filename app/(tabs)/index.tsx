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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { createNoteInNotion } from '@/utils/storage';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeColors, FONTS, SPACING, RADIUS } from '@/constants/theme';

export default function WriteScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setWordCount(content.trim() === '' ? 0 : content.trim().split(/\s+/).length);
  }, [content]);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Empty Note', 'Please add some content before saving.');
      return;
    }
    setIsSaving(true);
    try {
      await createNoteInNotion({
        title: title.trim() || 'Untitled Poem',
        content: content.trim(),
        status: 'not published',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Your poem has been saved to the library.', [
        { text: 'Continue Writing' },
        {
          text: 'New Poem',
          onPress: () => {
            setTitle('');
            setContent('');
          },
        },
      ]);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save your poem. Please try again.');
    } finally {
      setIsSaving(false);
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
          <View>
            <Text style={styles.eyebrow}>New Poem</Text>
            <View style={styles.eyebrowRule} />
          </View>
          <Pressable
            style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Feather name="save" size={16} color={colors.onInk} />
            <Text style={styles.saveButtonText}>{isSaving ? 'Saving…' : 'Save'}</Text>
          </Pressable>
        </View>

        {/* Writing area */}
        <View style={styles.writingArea}>
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
            placeholder="Begin writing…"
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
          {(title.trim() || content.trim()) && (
            <Text style={styles.footerMeta}>unsaved</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
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
    },
    eyebrowRule: {
      width: 24,
      height: 2,
      backgroundColor: colors.accent,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.ink,
      paddingHorizontal: SPACING.xl,
      paddingVertical: 14,
      borderRadius: RADIUS.md,
      gap: SPACING.sm,
    },
    saveButtonPressed: {
      opacity: 0.8,
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      fontFamily: FONTS.bold,
      fontSize: 13,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.onInk,
    },
    writingArea: {
      flex: 1,
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING['3xl'],
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
      paddingTop: SPACING.md,
      paddingBottom: 90,
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
