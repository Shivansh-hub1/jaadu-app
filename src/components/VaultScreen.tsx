import React, { useState, useEffect } from 'react';
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
  type DownloadedLesson
} from '../utils/downloader';
import { getCourseById } from '../data/coursesData';
import type { Course, Lesson } from '../types';
import {
  HardDrive,
  Play,
  Trash2,
  FolderDown,
  Sparkles,
  Clock
} from 'lucide-react-native';

interface VaultProps {
  onPlayLesson: (course: Course, lesson: Lesson) => void;
}

export const VaultScreen: React.FC<VaultProps> = ({ onPlayLesson }) => {
  const [downloadedList, setDownloadedList] = useState<DownloadedLesson[]>([]);
  const [totalBytes, setTotalBytes] = useState<number>(0);

  const loadDownloads = async () => {
    const list = await getDownloadedLessons();
    setDownloadedList(list);
    const sum = list.reduce((acc, item) => acc + (item.fileSizeBytes || 0), 0);
    setTotalBytes(sum);
  };

  useEffect(() => {
    loadDownloads();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handlePlay = (item: DownloadedLesson) => {
    const course = getCourseById(item.courseId);
    if (!course) {
      Alert.alert('Error', 'Course data could not be found.');
      return;
    }
    const lesson: Lesson = {
      id: item.id,
      title: item.title,
      type: 'video',
      duration: item.duration,
      url: `file://${item.localPath}`
    };
    onPlayLesson(course, lesson);
  };

  const handleDelete = (item: DownloadedLesson) => {
    Alert.alert(
      'Remove from Vault',
      `Delete "${item.title}" from device storage?`,
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
    if (downloadedList.length === 0) return;
    Alert.alert(
      'Clear Offline Vault',
      'This will delete all offline lectures from device storage.',
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <View style={styles.vaultTag}>
              <HardDrive size={13} color="#10B981" />
              <Text style={styles.vaultTagText}>AETHER OFFLINE VAULT</Text>
            </View>
            <Text style={styles.mainTitle}>Device Library</Text>
          </View>
          {downloadedList.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
              <Trash2 size={14} color="#EF4444" />
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Storage Bar Card */}
        <View style={styles.storageCard}>
          <View style={styles.storageCardTop}>
            <Text style={styles.storageLabel}>DEVICE STORAGE USED</Text>
            <Text style={styles.storageVal}>{formatSize(totalBytes)}</Text>
          </View>
          <View style={styles.storageTrack}>
            <View
              style={[
                styles.storageFill,
                { width: `${Math.min(100, Math.max(8, (totalBytes / (5 * 1024 * 1024 * 1024)) * 100))}%` }
              ]}
            />
          </View>
          <Text style={styles.storageSub}>
            {downloadedList.length} lecture{downloadedList.length !== 1 ? 's' : ''} available with zero internet required
          </Text>
        </View>
      </View>

      {/* List */}
      {downloadedList.length === 0 ? (
        <View style={styles.emptyWrap}>
          <FolderDown size={48} color="#334155" />
          <Text style={styles.emptyTitle}>Vault is Empty</Text>
          <Text style={styles.emptySub}>
            Download lectures inside the Cinema Player to watch them anywhere without data.
          </Text>
        </View>
      ) : (
        <FlatList
          data={downloadedList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <TouchableOpacity
                onPress={() => handlePlay(item)}
                style={styles.itemPlayArea}
              >
                <View style={styles.playIconBox}>
                  <Play size={16} color="#fff" />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemBatch}>{item.courseTitle.toUpperCase()}</Text>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={styles.itemMetaRow}>
                    <Text style={styles.itemMeta}>{formatTime(item.duration)}</Text>
                    <Text style={styles.itemMetaDot}>•</Text>
                    <Text style={styles.itemMeta}>{formatSize(item.fileSizeBytes)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                style={styles.deleteBtn}
              >
                <Trash2 size={16} color="#64748B" />
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
    backgroundColor: '#07080B'
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#0B0D14',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)'
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  vaultTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4
  },
  vaultTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 1
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC'
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)'
  },
  clearBtnText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '700'
  },
  storageCard: {
    backgroundColor: '#121520',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  storageCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  storageLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8
  },
  storageVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981'
  },
  storageTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6
  },
  storageFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3
  },
  storageSub: {
    fontSize: 10,
    color: '#64748B'
  },
  listContent: {
    padding: 16
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F121A',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  itemPlayArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  playIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  itemInfo: {
    flex: 1,
    marginRight: 8
  },
  itemBatch: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 0.8
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9',
    marginTop: 2
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2
  },
  itemMeta: {
    fontSize: 11,
    color: '#64748B'
  },
  itemMetaDot: {
    fontSize: 10,
    color: '#475569'
  },
  deleteBtn: {
    padding: 8
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
    marginTop: 16
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18
  }
});
