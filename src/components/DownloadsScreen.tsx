import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import {
  getDownloadedLessons,
  deleteDownloadedLesson,
  clearAllDownloads,
  formatBytes,
  type DownloadedLesson
} from '../utils/downloader';
import { COURSES } from '../data/coursesData';
import type { Course, Lesson } from '../types';
import {
  HardDrive,
  Play,
  Trash2,
  DownloadCloud,
  CheckCircle2,
  Film
} from 'lucide-react-native';

interface DownloadsScreenProps {
  onPlayLesson: (course: Course, lesson: Lesson) => void;
}

export const DownloadsScreen: React.FC<DownloadsScreenProps> = ({ onPlayLesson }) => {
  const [downloads, setDownloads] = useState<DownloadedLesson[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadDownloads = useCallback(async () => {
    const list = await getDownloadedLessons();
    setDownloads(list);
  }, []);

  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDownloads();
    setRefreshing(false);
  };

  const handleDelete = (item: DownloadedLesson) => {
    Alert.alert(
      'Delete Download',
      `Delete "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDownloadedLesson(item.id);
            await loadDownloads();
          }
        }
      ]
    );
  };

  const handleClearAll = () => {
    if (downloads.length === 0) return;
    Alert.alert(
      'Clear All Downloads',
      'Are you sure you want to delete all offline lectures? This will free up storage.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearAllDownloads();
            await loadDownloads();
          }
        }
      ]
    );
  };

  const handlePlay = (item: DownloadedLesson) => {
    const course = COURSES[item.courseId];
    if (course) {
      // Find the lesson object in the course
      for (const s of course.sections) {
        for (const l of s.lessons) {
          if (l.id === item.id) {
            onPlayLesson(course, l);
            return;
          }
        }
      }
      // If not found in structure, create a mock lesson pointing to downloaded item
      onPlayLesson(course, {
        id: item.id,
        title: item.title,
        duration: item.duration,
        url: item.localPath,
        type: 'video'
      });
    }
  };

  const totalBytes = downloads.reduce((acc, cur) => acc + (cur.fileSizeBytes || 0), 0);

  return (
    <View style={styles.container}>
      {/* Storage Header */}
      <View style={styles.storageCard}>
        <View style={styles.storageIconWrapper}>
          <HardDrive size={22} color="#10b981" />
        </View>
        <View style={styles.storageInfo}>
          <Text style={styles.storageTitle}>Offline Device Storage</Text>
          <Text style={styles.storageSubtitle}>
            {downloads.length} lecture{downloads.length === 1 ? '' : 's'} • {formatBytes(totalBytes)} used
          </Text>
        </View>
        {downloads.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearAllBtn}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Downloads List */}
      {downloads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <DownloadCloud size={54} color="#333" />
          <Text style={styles.emptyTitle}>No Offline Downloads</Text>
          <Text style={styles.emptyText}>
            Tap the Download button on any lecture while connected to Wi-Fi to watch it here offline without internet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={downloads}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.downloadItem}>
              <TouchableOpacity
                style={styles.itemLeft}
                onPress={() => handlePlay(item)}
                activeOpacity={0.7}
              >
                <View style={styles.playIconBox}>
                  <Play size={18} color="#2e8cff" />
                </View>
                <View style={styles.itemTextWrapper}>
                  <Text style={styles.itemCourse} numberOfLines={1}>
                    {item.courseTitle}
                  </Text>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={styles.itemMetaRow}>
                    <CheckCircle2 size={11} color="#10b981" />
                    <Text style={styles.itemMetaText}>
                      Ready offline • {formatBytes(item.fileSizeBytes)} • {Math.round(item.duration / 60)}m
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDelete(item)}
                style={styles.deleteBtn}
              >
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212'
  },
  storageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b1b1b',
    margin: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#262626'
  },
  storageIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#16281e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  storageInfo: {
    flex: 1
  },
  storageTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  storageSubtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 2
  },
  clearAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#262626',
    borderRadius: 8
  },
  clearAllText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: 'bold'
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24
  },
  downloadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181818',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#242424'
  },
  itemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  playIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1d2736',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  itemTextWrapper: {
    flex: 1
  },
  itemCourse: {
    color: '#777',
    fontSize: 11,
    fontWeight: '600'
  },
  itemTitle: {
    color: '#eee',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  itemMetaText: {
    color: '#10b981',
    fontSize: 11,
    marginLeft: 4
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 8
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36
  },
  emptyTitle: {
    color: '#bbb',
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 16
  },
  emptyText: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6
  }
});
