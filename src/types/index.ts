export interface Lesson {
  id: string;
  title: string;
  type: string;
  duration: number; // in seconds
  url: string; // m3u8 url
}

export interface Section {
  id: string;
  title: string;
  isAvailable: boolean;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  sections: Section[];
}

export interface CatalogItem {
  id: string;
  title: string;
  description: string;
  category: 'alpha' | 'delta' | 'sigma' | 'prime' | 'aptitude' | 'akki' | 'others';
  sectionCount: number;
  lessonCount: number;
  pdfCount?: number;
  videoCount?: number;
  totalDuration: number;
  thumbnail: string;
}

export interface Note {
  id: string;
  courseId: string;
  lessonId: string;
  timestamp: number; // seconds
  text: string;
  createdAt: string;
}

export interface WatchHistoryItem {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  timestamp: number;
  duration: number;
  lastWatched: string;
}

export interface BookmarkItem {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  duration: number;
  savedAt: string;
}

export interface ElectronAPI {
  isDesktop?: boolean;
  getDeviceId?: () => Promise<string>;
  getAppVersion?: () => Promise<string>;
  resolveAkkiMedia?: (
    channelId: string | number,
    messageId: string | number,
    uniqueId: string
  ) => Promise<{ success: boolean; download_link?: string; watch_link?: string; error?: string }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

