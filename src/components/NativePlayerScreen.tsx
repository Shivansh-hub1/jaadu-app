import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Modal,
  Dimensions,
  Alert
} from 'react-native';
import Video from 'react-native-video';
import type { ReactVideoSource } from 'react-native-video';
import type { Course, Lesson } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  CheckCircle,
  Bookmark,
  Download,
  List,
  ArrowLeft,
  HardDrive
} from 'lucide-react-native';
import {
  saveWatchProgress,
  getLessonProgress,
  toggleLessonCompleted,
  toggleBookmark,
  getBookmarks
} from '../utils/storage';
import {
  downloadLesson,
  getDownloadedLesson,
  deleteDownloadedLesson,
  type DownloadedLesson
} from '../utils/downloader';

interface NativePlayerScreenProps {
  course: Course;
  initialLesson: Lesson;
  onBack: () => void;
  completedLessonIds: string[];
  onToggleComplete: (lessonId: string) => void;
}

const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0];

export const NativePlayerScreen: React.FC<NativePlayerScreenProps> = ({
  course,
  initialLesson,
  onBack,
  completedLessonIds,
  onToggleComplete
}) => {
  const [currentLesson, setCurrentLesson] = useState<Lesson>(initialLesson);
  const [paused, setPaused] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(initialLesson.duration || 1800);
  const [rate, setRate] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCurriculum, setShowCurriculum] = useState<boolean>(false);
  const [showSpeedModal, setShowSpeedModal] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  // Download state
  const [downloadedInfo, setDownloadedInfo] = useState<DownloadedLesson | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  const videoRef = useRef<any>(null);

  // Check if current lesson is downloaded locally or bookmarked
  useEffect(() => {
    let isMounted = true;
    getDownloadedLesson(currentLesson.id).then((dl) => {
      if (isMounted) setDownloadedInfo(dl);
    });
    getBookmarks().then((bm) => {
      if (isMounted) setIsBookmarked(bm.includes(currentLesson.id));
    });
    getLessonProgress(currentLesson.id).then((savedTime) => {
      if (isMounted && savedTime > 0 && videoRef.current) {
        videoRef.current.seek(savedTime);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [currentLesson.id]);

  // Periodic watch progress save
  const handleProgress = (data: { currentTime: number; seekableDuration: number }) => {
    setCurrentTime(data.currentTime);
    if (data.seekableDuration > 0) {
      setDuration(data.seekableDuration);
    }
    // Save progress every 5 seconds
    if (Math.floor(data.currentTime) % 5 === 0) {
      saveWatchProgress(
        course.id,
        course.title,
        currentLesson.id,
        currentLesson.title,
        data.currentTime
      );
    }
  };

  const handleSeekRelative = (seconds: number) => {
    const nextTime = Math.max(0, Math.min(duration, currentTime + seconds));
    if (videoRef.current) {
      videoRef.current.seek(nextTime);
      setCurrentTime(nextTime);
    }
  };

  const handleDownloadPress = async () => {
    if (downloadedInfo) {
      Alert.alert(
        'Delete Download',
        `Remove "${currentLesson.title}" from your phone storage?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await deleteDownloadedLesson(currentLesson.id);
              setDownloadedInfo(null);
            }
          }
        ]
      );
      return;
    }

    try {
      setDownloadProgress(0);
      const res = await downloadLesson(
        currentLesson,
        course,
        (received, total) => {
          if (total > 0) {
            setDownloadProgress(Math.round((received / total) * 100));
          }
        }
      );
      setDownloadedInfo(res);
      setDownloadProgress(null);
    } catch (err) {
      setDownloadProgress(null);
      Alert.alert('Download Error', 'Could not save lecture. Check connection.');
    }
  };

  const handleBookmarkToggle = async () => {
    const updated = await toggleBookmark(currentLesson.id);
    setIsBookmarked(updated.includes(currentLesson.id));
  };

  // Video source: prioritize local file path if downloaded!
  const videoSource: ReactVideoSource = downloadedInfo
    ? { uri: `file://${downloadedInfo.localPath}` }
    : { uri: currentLesson.url };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = Math.floor(secs % 60);
    return `${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
  };

  const isCompleted = completedLessonIds.includes(currentLesson.id);

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.topBarTitleWrapper}>
          <Text style={styles.topCourseTitle} numberOfLines={1}>
            {course.title}
          </Text>
          <Text style={styles.topLessonTitle} numberOfLines={1}>
            {currentLesson.title}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowCurriculum(true)}
          style={styles.curriculumButton}
        >
          <List size={20} color="#2e8cff" />
        </TouchableOpacity>
      </View>

      {/* Video Container */}
      <View style={styles.playerWrapper}>
        <Video
          ref={videoRef}
          source={videoSource}
          style={styles.video}
          paused={paused}
          rate={rate}
          resizeMode="contain"
          onLoad={(data) => {
            setIsLoading(false);
            if (data.duration > 0) setDuration(data.duration);
          }}
          onProgress={handleProgress}
          onError={(err) => {
            setIsLoading(false);
            console.warn('Video Error:', err);
          }}
          onBuffer={({ isBuffering }) => setIsLoading(isBuffering)}
        />

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#2e8cff" />
          </View>
        )}

        {/* Offline Badge */}
        {downloadedInfo && (
          <View style={styles.offlineBadge}>
            <HardDrive size={12} color="#10b981" />
            <Text style={styles.offlineBadgeText}>Offline Storage</Text>
          </View>
        )}
      </View>

      {/* Video Controls Bar */}
      <View style={styles.controlsBar}>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
          <TouchableOpacity
            style={styles.speedButton}
            onPress={() => setShowSpeedModal(true)}
          >
            <Text style={styles.speedText}>{rate}x</Text>
          </TouchableOpacity>
        </View>

        {/* Center transport buttons */}
        <View style={styles.transportRow}>
          <TouchableOpacity
            onPress={() => handleSeekRelative(-10)}
            style={styles.seekButton}
          >
            <RotateCcw size={22} color="#fff" />
            <Text style={styles.seekLabel}>10s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPaused(!paused)}
            style={styles.playPauseButton}
          >
            {paused ? (
              <Play size={28} color="#fff" />
            ) : (
              <Pause size={28} color="#fff" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleSeekRelative(10)}
            style={styles.seekButton}
          >
            <RotateCw size={22} color="#fff" />
            <Text style={styles.seekLabel}>10s</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Row: Done, Bookmark, Download */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionBtn, isCompleted && styles.actionBtnActive]}
          onPress={() => onToggleComplete(currentLesson.id)}
        >
          <CheckCircle size={18} color={isCompleted ? '#10b981' : '#888'} />
          <Text style={[styles.actionBtnText, isCompleted && styles.actionBtnTextDone]}>
            {isCompleted ? 'Completed' : 'Mark Done'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleBookmarkToggle}
        >
          <Bookmark size={18} color={isBookmarked ? '#f59e0b' : '#888'} />
          <Text style={[styles.actionBtnText, isBookmarked && styles.actionBtnTextActive]}>
            {isBookmarked ? 'Saved' : 'Bookmark'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, downloadedInfo && styles.actionBtnDownloaded]}
          onPress={handleDownloadPress}
        >
          {downloadProgress !== null ? (
            <ActivityIndicator size="small" color="#2e8cff" />
          ) : (
            <Download size={18} color={downloadedInfo ? '#10b981' : '#2e8cff'} />
          )}
          <Text
            style={[
              styles.actionBtnText,
              downloadedInfo && styles.actionBtnTextDone,
              downloadProgress !== null && { color: '#2e8cff' }
            ]}
          >
            {downloadProgress !== null
              ? `${downloadProgress}%`
              : downloadedInfo
              ? 'On Device'
              : 'Download'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Curriculum Modal */}
      <Modal
        visible={showCurriculum}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCurriculum(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Course Curriculum</Text>
              <TouchableOpacity onPress={() => setShowCurriculum(false)}>
                <Text style={styles.modalCloseText}>Done</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={course.sections}
              keyExtractor={(item) => item.id}
              renderItem={({ item: section }) => (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {section.lessons.map((lesson) => {
                    const isSelected = lesson.id === currentLesson.id;
                    const isDone = completedLessonIds.includes(lesson.id);
                    return (
                      <TouchableOpacity
                        key={lesson.id}
                        style={[
                          styles.lessonRow,
                          isSelected && styles.lessonRowSelected
                        ]}
                        onPress={() => {
                          setCurrentLesson(lesson);
                          setShowCurriculum(false);
                          setIsLoading(true);
                        }}
                      >
                        <View style={styles.lessonRowLeft}>
                          {isDone ? (
                            <CheckCircle size={14} color="#10b981" />
                          ) : (
                            <Play size={14} color={isSelected ? '#2e8cff' : '#666'} />
                          )}
                          <Text
                            style={[
                              styles.lessonRowTitle,
                              isSelected && styles.lessonRowTitleSelected
                            ]}
                            numberOfLines={1}
                          >
                            {lesson.title}
                          </Text>
                        </View>
                        <Text style={styles.lessonRowDuration}>
                          {Math.round((lesson.duration || 1800) / 60)}m
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Speed Modal */}
      <Modal
        visible={showSpeedModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSpeedModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSpeedModal(false)}
        >
          <View style={styles.speedModalBox}>
            <Text style={styles.speedModalTitle}>Playback Speed</Text>
            {SPEED_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.speedOption, rate === s && styles.speedOptionSelected]}
                onPress={() => {
                  setRate(s);
                  setShowSpeedModal(false);
                }}
              >
                <Text
                  style={[
                    styles.speedOptionText,
                    rate === s && styles.speedOptionTextSelected
                  ]}
                >
                  {s}x {s === 1.0 ? '(Normal)' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212'
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#181818',
    borderBottomWidth: 1,
    borderBottomColor: '#262626'
  },
  backButton: {
    padding: 6,
    marginRight: 8
  },
  topBarTitleWrapper: {
    flex: 1
  },
  topCourseTitle: {
    color: '#888',
    fontSize: 11,
    fontWeight: '600'
  },
  topLessonTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  curriculumButton: {
    padding: 8
  },
  playerWrapper: {
    width: '100%',
    height: width * 0.5625, // 16:9 aspect ratio
    backgroundColor: '#000',
    position: 'relative'
  },
  video: {
    width: '100%',
    height: '100%'
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  offlineBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  offlineBadgeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4
  },
  controlsBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#161616',
    borderBottomWidth: 1,
    borderBottomColor: '#262626'
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  timeText: {
    color: '#aaa',
    fontSize: 12
  },
  speedButton: {
    backgroundColor: '#262626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  speedText: {
    color: '#2e8cff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  transportRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28
  },
  seekButton: {
    alignItems: 'center'
  },
  seekLabel: {
    color: '#888',
    fontSize: 10,
    marginTop: 2
  },
  playPauseButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2e8cff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#181818',
    borderBottomWidth: 1,
    borderBottomColor: '#262626'
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#202020'
  },
  actionBtnActive: {
    backgroundColor: '#1b2d22'
  },
  actionBtnDownloaded: {
    backgroundColor: '#16281e'
  },
  actionBtnText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6
  },
  actionBtnTextActive: {
    color: '#f59e0b'
  },
  actionBtnTextDone: {
    color: '#10b981'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#1c1c1c',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '75%',
    padding: 16
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a'
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  modalCloseText: {
    color: '#2e8cff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  sectionBlock: {
    marginBottom: 16
  },
  sectionTitle: {
    color: '#2e8cff',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8
  },
  lessonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4
  },
  lessonRowSelected: {
    backgroundColor: '#262626'
  },
  lessonRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12
  },
  lessonRowTitle: {
    color: '#ccc',
    fontSize: 13,
    marginLeft: 8,
    flex: 1
  },
  lessonRowTitleSelected: {
    color: '#2e8cff',
    fontWeight: 'bold'
  },
  lessonRowDuration: {
    color: '#777',
    fontSize: 11
  },
  speedModalBox: {
    backgroundColor: '#202020',
    marginHorizontal: 40,
    marginBottom: 'auto',
    marginTop: 'auto',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333'
  },
  speedModalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 14,
    textAlign: 'center'
  },
  speedOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2b2b2b'
  },
  speedOptionSelected: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8
  },
  speedOptionText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center'
  },
  speedOptionTextSelected: {
    color: '#2e8cff',
    fontWeight: 'bold'
  }
});
