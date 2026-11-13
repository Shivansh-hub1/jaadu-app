import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { notifyDownloadComplete } from './notifications';

export interface DownloadedLesson {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  localPath: string;
  fileSizeBytes: number;
  duration: number;
  downloadedAt: string;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const DOWNLOADS_KEY = '@aether_vault_downloads';
const DOWNLOAD_DIR = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/aether_vault`;

export async function getDownloadedLessons(): Promise<DownloadedLesson[]> {
  try {
    const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getDownloadedLesson(lessonId: string): Promise<DownloadedLesson | null> {
  const all = await getDownloadedLessons();
  return all.find((d) => d.id === lessonId) || null;
}

/**
 * Resolves authentic direct progressive MP4 stream URL from Wistia API
 * instead of raw m3u8 playlist manifest.
 */
export async function resolveDirectMediaUrl(url: string, title?: string): Promise<string> {
  if (!url) return '';
  const wistiaMatch = url.match(/(?:embed\/medias\/|iframe\/|wvideo=)([a-zA-Z0-9]+)/);
  if (wistiaMatch) {
    const mediaId = wistiaMatch[1];
    try {
      const res = await fetch(`https://fast.wistia.com/embed/medias/${mediaId}.json`);
      if (res.ok) {
        const data = await res.json();
        const assets: any[] = data.media?.assets || [];
        // Prioritize 720p HD or 1080p progressive MP4
        const chosen =
          assets.find((a: any) => a.height === 720 && a.type !== 'original') ||
          assets.find((a: any) => a.height === 1080 && a.type !== 'original') ||
          assets.find((a: any) => a.url && a.url.includes('.bin')) ||
          assets[0];

        if (chosen && chosen.url) {
          const cleanTitle = (title || 'video').replace(/[\\/:*?"<>|]/g, '_').trim();
          return `${chosen.url.replace(/\.bin$/, '')}/${encodeURIComponent(cleanTitle)}.mp4`;
        }
      }
    } catch (e) {
      console.warn('Direct media resolution fallback:', e);
    }
  }
  return url;
}

export async function downloadLesson(
  lesson: { id: string; title: string; url: string; duration?: number },
  course: { id: string; title: string },
  onProgress?: (receivedBytes: number, totalBytes: number) => void
): Promise<DownloadedLesson> {
  const exists = await ReactNativeBlobUtil.fs.exists(DOWNLOAD_DIR);
  if (!exists) {
    await ReactNativeBlobUtil.fs.mkdir(DOWNLOAD_DIR);
  }

  // Resolve to direct MP4 for true offline device playback
  const directUrl = await resolveDirectMediaUrl(lesson.url, lesson.title);

  const safeFileName = `${lesson.id.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`;
  const destPath = `${DOWNLOAD_DIR}/${safeFileName}`;

  const task = ReactNativeBlobUtil.config({
    path: destPath,
    overwrite: true
  }).fetch('GET', directUrl);

  if (onProgress) {
    task.progress((received, total) => {
      onProgress(Number(received), Number(total));
    });
  }

  const res = await task;
  const filePath = res.path() || destPath;
  const stat = await ReactNativeBlobUtil.fs.stat(filePath);

  const downloadedItem: DownloadedLesson = {
    id: lesson.id,
    courseId: course.id,
    courseTitle: course.title,
    title: lesson.title,
    localPath: filePath,
    fileSizeBytes: Number(stat.size) || 0,
    duration: lesson.duration || 1800,
    downloadedAt: new Date().toISOString()
  };

  const current = await getDownloadedLessons();
  const updated = [downloadedItem, ...current.filter((d) => d.id !== lesson.id)];
  await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(updated));

  await notifyDownloadComplete(lesson.title);
  return downloadedItem;
}

export async function deleteDownloadedLesson(lessonId: string): Promise<void> {
  try {
    const current = await getDownloadedLessons();
    const target = current.find((d) => d.id === lessonId);
    if (target && (await ReactNativeBlobUtil.fs.exists(target.localPath))) {
      await ReactNativeBlobUtil.fs.unlink(target.localPath);
    }
    const updated = current.filter((d) => d.id !== lessonId);
    await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Error deleting downloaded lesson:', err);
  }
}

export async function clearAllDownloads(): Promise<void> {
  try {
    if (await ReactNativeBlobUtil.fs.exists(DOWNLOAD_DIR)) {
      await ReactNativeBlobUtil.fs.unlink(DOWNLOAD_DIR);
      await ReactNativeBlobUtil.fs.mkdir(DOWNLOAD_DIR);
    }
    await AsyncStorage.removeItem(DOWNLOADS_KEY);
  } catch (err) {
    console.warn('Error clearing downloads:', err);
  }
}
