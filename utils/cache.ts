import AsyncStorage from '@react-native-async-storage/async-storage';
import { PoemNote } from './storage';

const POEMS_KEY = 'silens.poems.v2';

export async function cachePoemsList(poems: PoemNote[]): Promise<void> {
  try {
    await AsyncStorage.setItem(POEMS_KEY, JSON.stringify(poems));
  } catch {}
}

export async function getCachedPoemsList(): Promise<PoemNote[]> {
  try {
    const raw = await AsyncStorage.getItem(POEMS_KEY);
    return raw ? (JSON.parse(raw) as PoemNote[]) : [];
  } catch {
    return [];
  }
}
