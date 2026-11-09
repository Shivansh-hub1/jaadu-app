import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler
} from 'react-native';
import { BatchesScreen } from './src/components/BatchesScreen';
import { NativePlayerScreen } from './src/components/NativePlayerScreen';
import { DownloadsScreen } from './src/components/DownloadsScreen';
import { TrackerScreen } from './src/components/TrackerScreen';
import { initNotifications } from './src/utils/notifications';
import {
  getCompletedLessons,
  toggleLessonCompleted
} from './src/utils/storage';
import { getDownloadedLessons } from './src/utils/downloader';
import type { Course, Lesson } from './src/types';
import { LayoutGrid, Play, Download, CheckCircle2 } from 'lucide-react-native';

type Tab = 'batches' | 'player' | 'downloads' | 'tracker';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('batches');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [downloadCount, setDownloadCount] = useState<number>(0);

  // Initialize notifications & state
  useEffect(() => {
    initNotifications();
    getCompletedLessons().then(setCompletedLessonIds);
    getDownloadedLessons().then((list) => setDownloadCount(list.length));
  }, []);

  // Update download count when changing tabs
  useEffect(() => {
    getDownloadedLessons().then((list) => setDownloadCount(list.length));
  }, [activeTab]);

  // Handle hardware back button
  useEffect(() => {
    const onBackPress = () => {
      if (activeTab === 'player') {
        setActiveTab('batches');
        return true;
      }
      if (activeTab !== 'batches') {
        setActiveTab('batches');
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [activeTab]);

  const handleToggleComplete = async (lessonId: string) => {
    const updated = await toggleLessonCompleted(lessonId);
    setCompletedLessonIds(updated);
  };

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    const firstLesson = course.sections[0]?.lessons[0] || null;
    setSelectedLesson(firstLesson);
    setActiveTab('player');
  };

  const handlePlayDownloaded = (course: Course, lesson: Lesson) => {
    setSelectedCourse(course);
    setSelectedLesson(lesson);
    setActiveTab('player');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Main Content Area */}
      <View style={styles.content}>
        {activeTab === 'batches' && (
          <BatchesScreen
            onSelectCourse={handleSelectCourse}
            completedLessonIds={completedLessonIds}
          />
        )}

        {activeTab === 'player' && selectedCourse && selectedLesson ? (
          <NativePlayerScreen
            course={selectedCourse}
            initialLesson={selectedLesson}
            onBack={() => setActiveTab('batches')}
            completedLessonIds={completedLessonIds}
            onToggleComplete={handleToggleComplete}
          />
        ) : activeTab === 'player' ? (
          <View style={styles.emptyPlayer}>
            <Play size={48} color="#333" />
            <Text style={styles.emptyPlayerTitle}>No Lecture Selected</Text>
            <Text style={styles.emptyPlayerSubtitle}>
              Select a course batch to start streaming or playing offline
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => setActiveTab('batches')}
            >
              <Text style={styles.browseBtnText}>Browse Batches</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {activeTab === 'downloads' && (
          <DownloadsScreen onPlayLesson={handlePlayDownloaded} />
        )}

        {activeTab === 'tracker' && (
          <TrackerScreen completedLessonCount={completedLessonIds.length} />
        )}
      </View>

      {/* True Native Bottom Navigation Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => setActiveTab('batches')}
        >
          <LayoutGrid
            size={22}
            color={activeTab === 'batches' ? '#2e8cff' : '#777'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'batches' && styles.tabLabelActive
            ]}
          >
            Batches
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => setActiveTab('player')}
        >
          <Play
            size={22}
            color={activeTab === 'player' ? '#2e8cff' : '#777'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'player' && styles.tabLabelActive
            ]}
          >
            Player
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => setActiveTab('downloads')}
        >
          <View>
            <Download
              size={22}
              color={activeTab === 'downloads' ? '#2e8cff' : '#777'}
            />
            {downloadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{downloadCount}</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'downloads' && styles.tabLabelActive
            ]}
          >
            Downloads
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => setActiveTab('tracker')}
        >
          <CheckCircle2
            size={22}
            color={activeTab === 'tracker' ? '#10b981' : '#777'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'tracker' && { color: '#10b981', fontWeight: 'bold' }
            ]}
          >
            Tracker
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212'
  },
  content: {
    flex: 1
  },
  bottomBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#161616',
    borderTopWidth: 1,
    borderTopColor: '#262626',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 4
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  tabLabel: {
    color: '#777',
    fontSize: 10,
    marginTop: 3,
    fontWeight: '500'
  },
  tabLabelActive: {
    color: '#2e8cff',
    fontWeight: 'bold'
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#2e8cff',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold'
  },
  emptyPlayer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  emptyPlayerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16
  },
  emptyPlayerSubtitle: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20
  },
  browseBtn: {
    backgroundColor: '#2e8cff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10
  },
  browseBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  }
});
