import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Note, WatchHistoryItem } from '../types';

const COMPLETED_LESSONS_KEY = '@jaadu_completed_lessons';
const WATCH_HISTORY_KEY = '@jaadu_watch_history';
const BOOKMARKS_KEY = '@jaadu_bookmarks';
const NOTES_KEY = '@jaadu_notes';
const LESSON_PROGRESS_KEY = '@jaadu_lesson_progress_';

export async function getCompletedLessons(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(COMPLETED_LESSONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function toggleLessonCompleted(lessonId: string): Promise<string[]> {
  try {
    const current = await getCompletedLessons();
    const updated = current.includes(lessonId)
      ? current.filter((id) => id !== lessonId)
      : [...current, lessonId];
    await AsyncStorage.setItem(COMPLETED_LESSONS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export async function getWatchHistory(): Promise<WatchHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(WATCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveWatchProgress(
  courseId: string,
  courseTitle: string,
  lessonId: string,
  lessonTitle: string,
  timestamp: number
): Promise<void> {
  try {
    const history = await getWatchHistory();
    const filtered = history.filter((h) => !(h.courseId === courseId && h.lessonId === lessonId));
    filtered.unshift({
      courseId,
      courseTitle,
      lessonId,
      lessonTitle,
      timestamp: Math.floor(timestamp),
      duration: 1800,
      lastWatched: new Date().toISOString()
    });
    await AsyncStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(filtered.slice(0, 50)));
    await AsyncStorage.setItem(`${LESSON_PROGRESS_KEY}${lessonId}`, String(Math.floor(timestamp)));
  } catch {}
}

export async function getLessonProgress(lessonId: string): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(`${LESSON_PROGRESS_KEY}${lessonId}`);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

export async function getNotes(lessonId?: string): Promise<Note[]> {
  try {
    const raw = await AsyncStorage.getItem(NOTES_KEY);
    const all: Note[] = raw ? JSON.parse(raw) : [];
    return lessonId ? all.filter((n) => n.lessonId === lessonId) : all;
  } catch {
    return [];
  }
}

export async function addNote(note: Omit<Note, 'id' | 'createdAt'>): Promise<Note[]> {
  try {
    const all = await getNotes();
    const newNote: Note = {
      ...note,
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newNote, ...all];
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export async function deleteNote(id: string): Promise<void> {
  try {
    const all = await getNotes();
    const filtered = all.filter((n) => n.id !== id);
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(filtered));
  } catch {}
}

export async function getBookmarks(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function toggleBookmark(lessonId: string): Promise<string[]> {
  try {
    const bookmarks = await getBookmarks();
    const updated = bookmarks.includes(lessonId)
      ? bookmarks.filter((id) => id !== lessonId)
      : [...bookmarks, lessonId];
    await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}
