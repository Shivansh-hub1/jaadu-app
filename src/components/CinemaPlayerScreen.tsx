import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Modal,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  Alert
} from 'react-native';
import Video from 'react-native-video';
import type { Course, Lesson, Section } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  CheckCircle,
  Bookmark,
  Download,
  ListFilter,
  ArrowLeft,
  HardDrive,
  Sparkles,
  Maximize2,
  Tv,
  ChevronUp,
  ChevronDown,
  Volume2
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
  resolveDirectMediaUrl,
  type DownloadedLesson
} from '../utils/downloader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = Math.round((SCREEN_WIDTH * 9) / 16);
const SPEED_PRESETS = [0.75, 1.0, 1.25, 1.5, 2.0];

interface CinemaPlayerProps {
  course: Course;
  initialLesson: Lesson;
  onBack: () => void;
  completedLessonIds: string[];
  onToggleComplete: (lessonId: string) => void;
}

export const CinemaPlayerScreen: React.FC<CinemaPlayerProps> = ({
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
  const [resolvedStreamUrl, setResolvedStreamUrl] = useState<string>(initialLesson.url);
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);

  // HUD Visibility (auto-hides in 3.2s)
  const [showControls, setShowControls] = useState<boolean>(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hideTimerRef = useRef<any>(null);

  // Drawer / Curriculum
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [activeSectionId, setActiveSectionId] = useState<string>('');

  // Status
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [downloadedInfo, setDownloadedInfo] = useState<DownloadedLesson | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  const videoRef = useRef<any>(null);

  const resetHideTimer = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true
    }).start();
    setShowControls(true);

    hideTimerRef.current = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true
      }).start(() => setShowControls(false));
    }, 3200);
  }, [fadeAnim]);

  const toggleControls = () => {
    if (showControls) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start(() => setShowControls(false));
    } else {
      resetHideTimer();
    }
  };

  // Find active section
  useEffect(() => {
    const parentSec = course.sections.find((sec) =>
      sec.lessons.some((l) => l.id === currentLesson.id)
    );
    if (parentSec) setActiveSectionId(parentSec.id);
  }, [currentLesson.id, course.sections]);

  // Load lesson source: check offline vault first, then resolve direct streaming
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    resetHideTimer();

    getDownloadedLesson(currentLesson.id).then((dl) => {
      if (!isMounted) return;
      if (dl && dl.localPath) {
        setDownloadedInfo(dl);
        setResolvedStreamUrl(`file://${dl.localPath}`);
        setIsLoading(false);
      } else {
        setDownloadedInfo(null);
        resolveDirectMediaUrl(currentLesson.url, currentLesson.title).then((resolved) => {
          if (isMounted) {
            setResolvedStreamUrl(resolved);
            setIsLoading(false);
          }
        });
      }
    });

    getBookmarks().then((bm) => {
      if (isMounted) setIsBookmarked(bm.includes(currentLesson.id));
    });

    getLessonProgress(currentLesson.id).then((savedTime) => {
      if (isMounted && savedTime > 5 && videoRef.current) {
        videoRef.current.seek(savedTime);
      }
    });

    return () => {
      isMounted = false;
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [currentLesson.id, currentLesson.url, currentLesson.title, resetHideTimer]);

  const handleProgress = (data: { currentTime: number; seekableDuration: number }) => {
    setCurrentTime(data.currentTime);
    if (data.seekableDuration > 0) {
      setDuration(data.seekableDuration);
    }
    if (Math.floor(data.currentTime) % 5 === 0) {
      saveWatchProgress(course.id, course.title, currentLesson.id, currentLesson.title, data.currentTime);
    }
  };

  const handleSeek = (delta: number) => {
    resetHideTimer();
    const nextTime = Math.max(0, Math.min(duration, currentTime + delta));
    if (videoRef.current) {
      videoRef.current.seek(nextTime);
      setCurrentTime(nextTime);
    }
  };

  const handleDownload = async () => {
    if (downloadedInfo) {
      Alert.alert('Offline Vault', 'This lecture is already downloaded in your Offline Vault.');
      return;
    }
    try {
      setDownloadProgress(0);
      const res = await downloadLesson(currentLesson, course, (received, total) => {
        if (total > 0) {
          setDownloadProgress(Math.round((received / total) * 100));
        }
      });
      setDownloadedInfo(res);
      setDownloadProgress(null);
      Alert.alert('Vault Saved', `"${currentLesson.title}" is ready for zero-data offline playback.`);
    } catch (err: any) {
      setDownloadProgress(null);
      Alert.alert('Download Error', err.message || 'Failed to download lecture.');
    }
  };

  const handleToggleBookmark = async () => {
    const updated = await toggleBookmark(currentLesson.id);
    setIsBookmarked(updated.includes(currentLesson.id));
  };

  // Find next lesson
  const allLessons = course.sections.flatMap((s) => s.lessons);
  const currentIdx = allLessons.findIndex((l) => l.id === currentLesson.id);
  const nextLesson = currentIdx >= 0 && currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isCompleted = completedLessonIds.includes(currentLesson.id);

  return (
    <View style={[styles.container, isCinemaMode && styles.cinemaBackground]}>
      {/* Top Header */}
      {!isCinemaMode && (
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <ArrowLeft color="#fff" size={20} />
          </TouchableOpacity>
          <View style={styles.topHeaderTitleWrap}>
            <Text style={styles.courseBadgeText} numberOfLines={1}>
              {course.title.toUpperCase()}
            </Text>
            <Text style={styles.lessonHeadingText} numberOfLines={1}>
              {currentLesson.title}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsCinemaMode((prev) => !prev)}
            style={[styles.cinemaPill, isCinemaMode && styles.cinemaPillActive]}
          >
            <Tv size={14} color={isCinemaMode ? '#6366F1' : '#A5B4FC'} />
            <Text style={styles.cinemaPillText}>FOCUS</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Video Theater Canvas */}
      <TouchableWithoutFeedback onPress={toggleControls}>
        <View style={[styles.theaterBox, isCinemaMode && styles.theaterBoxCinema]}>
          <Video
            ref={videoRef}
            source={{ uri: resolvedStreamUrl }}
            style={styles.videoSurface}
            paused={paused}
            rate={rate}
            resizeMode="contain"
            onLoad={(meta) => {
              setIsLoading(false);
              if (meta.duration > 0) setDuration(meta.duration);
            }}
            onProgress={handleProgress}
            onEnd={() => {
              onToggleComplete(currentLesson.id);
              if (nextLesson) setCurrentLesson(nextLesson);
            }}
            onError={(e) => console.warn('Video error:', e)}
          />

          {isLoading && (
            <View style={styles.loaderCenter}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loaderSub}>Buffering Aether Stream...</Text>
            </View>
          )}

          {/* Auto-fading HUD Controls */}
          {showControls && (
            <Animated.View style={[styles.hudOverlay, { opacity: fadeAnim }]}>
              {/* Center Playback Disc */}
              <View style={styles.centerHudRow}>
                <TouchableOpacity
                  style={styles.hudCircleBtn}
                  onPress={() => handleSeek(-10)}
                >
                  <RotateCcw size={22} color="#fff" />
                  <Text style={styles.hudSubText}>10s</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.playDisc}
                  onPress={() => {
                    resetHideTimer();
                    setPaused((p) => !p);
                  }}
                >
                  {paused ? <Play size={28} color="#fff" /> : <Pause size={28} color="#fff" />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.hudCircleBtn}
                  onPress={() => handleSeek(10)}
                >
                  <RotateCw size={22} color="#fff" />
                  <Text style={styles.hudSubText}>10s</Text>
                </TouchableOpacity>
              </View>

              {/* Bottom Scrubber & Presets */}
              <View style={styles.bottomHud}>
                <View style={styles.timeRow}>
                  <Text style={styles.timeTag}>
                    {formatTime(currentTime)} <Text style={styles.timeMuted}>/ {formatTime(duration)}</Text>
                  </Text>
                  {downloadedInfo && (
                    <View style={styles.vaultTag}>
                      <HardDrive size={11} color="#10B981" />
                      <Text style={styles.vaultTagText}>OFFLINE VAULT</Text>
                    </View>
                  )}
                </View>

                {/* Micro Progress Bar */}
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` }
                    ]}
                  />
                </View>

                {/* Speed Presets Strip */}
                <View style={styles.speedRow}>
                  <View style={styles.speedPillsWrap}>
                    {SPEED_PRESETS.map((s) => (
                      <TouchableOpacity
                        key={s}
                        onPress={() => {
                          resetHideTimer();
                          setRate(s);
                        }}
                        style={[styles.speedOption, rate === s && styles.speedOptionActive]}
                      >
                        <Text style={[styles.speedText, rate === s && styles.speedTextActive]}>
                          {s}x
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsCinemaMode((c) => !c)}
                    style={styles.cinemaModeToggle}
                  >
                    <Maximize2 size={16} color="#A5B4FC" />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* Studio Action Strip */}
      <View style={styles.actionStrip}>
        <TouchableOpacity
          onPress={() => onToggleComplete(currentLesson.id)}
          style={[styles.actionChip, isCompleted && styles.actionChipDone]}
        >
          <CheckCircle size={15} color={isCompleted ? '#10B981' : '#94A3B8'} />
          <Text style={[styles.actionChipText, isCompleted && styles.actionChipTextDone]}>
            {isCompleted ? 'COMPLETED' : 'MARK DONE'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleToggleBookmark} style={styles.actionChip}>
          <Bookmark size={15} color={isBookmarked ? '#F59E0B' : '#94A3B8'} />
          <Text style={[styles.actionChipText, isBookmarked && { color: '#F59E0B' }]}>
            {isBookmarked ? 'STARRED' : 'BOOKMARK'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDownload}
          disabled={downloadProgress !== null}
          style={[styles.actionChip, downloadedInfo && styles.actionChipDownloaded]}
        >
          {downloadProgress !== null ? (
            <ActivityIndicator size="small" color="#6366F1" />
          ) : (
            <Download size={15} color={downloadedInfo ? '#10B981' : '#94A3B8'} />
          )}
          <Text
            style={[
              styles.actionChipText,
              downloadedInfo && { color: '#10B981' },
              downloadProgress !== null && { color: '#818CF8' }
            ]}
          >
            {downloadProgress !== null
              ? `${downloadProgress}%`
              : downloadedInfo
              ? 'SAVED'
              : 'DOWNLOAD'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsDrawerOpen(true)}
          style={[styles.actionChip, styles.actionChipHighlight]}
        >
          <ListFilter size={15} color="#A5B4FC" />
          <Text style={[styles.actionChipText, { color: '#A5B4FC' }]}>CURRICULUM</Text>
        </TouchableOpacity>
      </View>

      {/* Up Next Mini Preview */}
      {nextLesson && (
        <TouchableOpacity
          onPress={() => setCurrentLesson(nextLesson)}
          style={styles.upNextCard}
        >
          <View style={styles.upNextLeft}>
            <Text style={styles.upNextLabel}>UP NEXT</Text>
            <Text style={styles.upNextTitle} numberOfLines={1}>
              {nextLesson.title}
            </Text>
          </View>
          <View style={styles.upNextPlayBtn}>
            <Play size={14} color="#fff" />
          </View>
        </TouchableOpacity>
      )}

      {/* Collapsible Curriculum Drawer */}
      <Modal visible={isDrawerOpen} animationType="slide" transparent>
        <View style={styles.drawerOverlay}>
          <View style={styles.drawerSheet}>
            <View style={styles.drawerHeader}>
              <View>
                <Text style={styles.drawerSub}>STUDIO TIMELINE</Text>
                <Text style={styles.drawerTitle} numberOfLines={1}>
                  {course.title}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsDrawerOpen(false)}
                style={styles.closeDrawerBtn}
              >
                <ChevronDown size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Sections & Lessons */}
            <FlatList
              data={course.sections}
              keyExtractor={(s) => s.id}
              contentContainerStyle={styles.drawerListContent}
              renderItem={({ item: section }) => {
                const isCurrentSec = section.id === activeSectionId;
                return (
                  <View style={styles.drawerSectionBox}>
                    <Text style={[styles.drawerSectionTitle, isCurrentSec && styles.secActiveText]}>
                      {section.title}
                    </Text>
                    {section.lessons.map((lesson, idx) => {
                      const isActive = lesson.id === currentLesson.id;
                      const done = completedLessonIds.includes(lesson.id);
                      return (
                        <TouchableOpacity
                          key={lesson.id}
                          onPress={() => {
                            setCurrentLesson(lesson);
                            setIsDrawerOpen(false);
                          }}
                          style={[styles.drawerLessonRow, isActive && styles.drawerLessonActive]}
                        >
                          <View style={styles.lessonIdxBox}>
                            <Text style={styles.lessonIdxText}>{idx + 1}</Text>
                          </View>
                          <View style={styles.lessonInfo}>
                            <Text
                              style={[
                                styles.drawerLessonTitle,
                                isActive && styles.activeTitleText,
                                done && styles.doneTitleText
                              ]}
                              numberOfLines={1}
                            >
                              {lesson.title}
                            </Text>
                            <Text style={styles.drawerLessonDur}>
                              {formatTime(lesson.duration || 1800)} • {lesson.type.toUpperCase()}
                            </Text>
                          </View>
                          {done ? (
                            <CheckCircle size={16} color="#10B981" />
                          ) : isActive ? (
                            <Play size={14} color="#6366F1" />
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07080B'
  },
  cinemaBackground: {
    backgroundColor: '#000'
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0B0D14',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)'
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#161922'
  },
  topHeaderTitleWrap: {
    flex: 1,
    marginHorizontal: 12
  },
  courseBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 1.1
  },
  lessonHeadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 1
  },
  cinemaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    gap: 4
  },
  cinemaPillActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.28)'
  },
  cinemaPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A5B4FC',
    letterSpacing: 0.8
  },
  theaterBox: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center'
  },
  theaterBoxCinema: {
    height: Math.round(VIDEO_HEIGHT * 1.15)
  },
  videoSurface: {
    width: '100%',
    height: '100%'
  },
  loaderCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loaderSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 8,
    letterSpacing: 0.5
  },
  hudOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'space-between',
    padding: 14
  },
  centerHudRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 36,
    marginTop: 20
  },
  hudCircleBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)'
  },
  hudSubText: {
    color: '#E2E8F0',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2
  },
  playDisc: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#6366F1',
    shadowOpacity: 0.5,
    shadowRadius: 12
  },
  bottomHud: {
    width: '100%'
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  timeTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC'
  },
  timeMuted: {
    color: '#64748B'
  },
  vaultTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  vaultTagText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800'
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 2
  },
  speedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8
  },
  speedPillsWrap: {
    flexDirection: 'row',
    gap: 6
  },
  speedOption: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  speedOptionActive: {
    backgroundColor: '#6366F1'
  },
  speedText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700'
  },
  speedTextActive: {
    color: '#fff'
  },
  cinemaModeToggle: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  actionStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#0F121A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)'
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#171B26',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  actionChipDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  actionChipDownloaded: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.25)'
  },
  actionChipHighlight: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'rgba(99, 102, 241, 0.3)'
  },
  actionChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6
  },
  actionChipTextDone: {
    color: '#10B981'
  },
  upNextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#121520',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)'
  },
  upNextLeft: {
    flex: 1,
    marginRight: 10
  },
  upNextLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 1
  },
  upNextTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F1F5F9',
    marginTop: 2
  },
  upNextPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end'
  },
  drawerSheet: {
    height: '70%',
    backgroundColor: '#0F121A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)'
  },
  drawerSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 1.2
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 2,
    maxWidth: SCREEN_WIDTH * 0.75
  },
  closeDrawerBtn: {
    padding: 6
  },
  drawerListContent: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  drawerSectionBox: {
    marginBottom: 16
  },
  drawerSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8
  },
  secActiveText: {
    color: '#A5B4FC'
  },
  drawerLessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#161A26',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)'
  },
  drawerLessonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'rgba(99, 102, 241, 0.4)'
  },
  lessonIdxBox: {
    width: 24,
    alignItems: 'center'
  },
  lessonIdxText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700'
  },
  lessonInfo: {
    flex: 1,
    marginLeft: 8,
    marginRight: 10
  },
  drawerLessonTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0'
  },
  activeTitleText: {
    color: '#A5B4FC',
    fontWeight: '700'
  },
  doneTitleText: {
    color: '#64748B',
    textDecorationLine: 'line-through'
  },
  drawerLessonDur: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2
  }
});
