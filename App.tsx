import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler
} from 'react-native';
import { AetherHubScreen } from './src/components/AetherHubScreen';
import { CinemaPlayerScreen } from './src/components/CinemaPlayerScreen';
import { VaultScreen } from './src/components/VaultScreen';
import { StudioFlowScreen } from './src/components/StudioFlowScreen';
import { initNotifications } from './src/utils/notifications';
import {
  getCompletedLessons,
  toggleLessonCompleted
} from './src/utils/storage';
import { getDownloadedLessons } from './src/utils/downloader';
import type { Course, Lesson } from './src/types';
import {
  Compass,
  Play,
  HardDrive,
  Flame,
  Tv
} from 'lucide-react-native';

type Tab = 'hub' | 'theater' | 'vault' | 'flow';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('hub');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [vaultCount, setVaultCount] = useState<number>(0);

  useEffect(() => {
    initNotifications();
    getCompletedLessons().then(setCompletedLessonIds);
    getDownloadedLessons().then((l) => setVaultCount(l.length));
  }, []);

  useEffect(() => {
    getDownloadedLessons().then((l) => setVaultCount(l.length));
  }, [activeTab]);

  // Hardware Back Button
  useEffect(() => {
    const onBackPress = () => {
      if (activeTab === 'theater') {
        setActiveTab('hub');
        return true;
      }
      if (activeTab !== 'hub') {
        setActiveTab('hub');
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
    setActiveTab('theater');
  };

  const handlePlayFromVault = (course: Course, lesson: Lesson) => {
    setSelectedCourse(course);
    setSelectedLesson(lesson);
    setActiveTab('theater');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Screen Body */}
      <View style={styles.content}>
        {activeTab === 'hub' && (
          <AetherHubScreen
            onSelectCourse={handleSelectCourse}
            completedLessonIds={completedLessonIds}
          />
        )}

        {activeTab === 'theater' && selectedCourse && selectedLesson ? (
          <CinemaPlayerScreen
            course={selectedCourse}
            initialLesson={selectedLesson}
            onBack={() => setActiveTab('hub')}
            completedLessonIds={completedLessonIds}
            onToggleComplete={handleToggleComplete}
          />
        ) : activeTab === 'theater' ? (
          <View style={styles.emptyTheater}>
            <Tv size={48} color="#334155" />
            <Text style={styles.emptyTitle}>Theater Inactive</Text>
            <Text style={styles.emptySub}>
              Select any lecture from Command Hub or Offline Vault to enter Studio Cinema mode.
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => setActiveTab('hub')}
            >
              <Text style={styles.browseBtnText}>Explore Batches</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {activeTab === 'vault' && (
          <VaultScreen onPlayLesson={handlePlayFromVault} />
        )}

        {activeTab === 'flow' && (
          <StudioFlowScreen completedLessonCount={completedLessonIds.length} />
        )}
      </View>

      {/* Aether Floating Dock */}
      <View style={styles.bottomDock}>
        <TouchableOpacity
          onPress={() => setActiveTab('hub')}
          style={[styles.dockItem, activeTab === 'hub' && styles.dockItemActive]}
        >
          <Compass size={18} color={activeTab === 'hub' ? '#6366F1' : '#64748B'} />
          <Text style={[styles.dockLabel, activeTab === 'hub' && styles.dockLabelActive]}>
            Command Hub
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('theater')}
          style={[styles.dockItem, activeTab === 'theater' && styles.dockItemActive]}
        >
          <Tv size={18} color={activeTab === 'theater' ? '#6366F1' : '#64748B'} />
          <Text style={[styles.dockLabel, activeTab === 'theater' && styles.dockLabelActive]}>
            Cinema
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('vault')}
          style={[styles.dockItem, activeTab === 'vault' && styles.dockItemActive]}
        >
          <HardDrive size={18} color={activeTab === 'vault' ? '#10B981' : '#64748B'} />
          <Text style={[styles.dockLabel, activeTab === 'vault' && styles.dockLabelActive]}>
            Vault {vaultCount > 0 ? `(${vaultCount})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('flow')}
          style={[styles.dockItem, activeTab === 'flow' && styles.dockItemActive]}
        >
          <Flame size={18} color={activeTab === 'flow' ? '#F59E0B' : '#64748B'} />
          <Text style={[styles.dockLabel, activeTab === 'flow' && styles.dockLabelActive]}>
            Flow
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#07080B'
  },
  content: {
    flex: 1
  },
  bottomDock: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#0A0C13',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)'
  },
  dockItem: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12
  },
  dockItemActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)'
  },
  dockLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 3
  },
  dockLabelActive: {
    color: '#F8FAFC'
  },
  emptyTheater: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 16
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    marginBottom: 20
  },
  browseBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#6366F1'
  },
  browseBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700'
  }
});
