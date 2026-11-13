import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions
} from 'react-native';
import { CATALOG, getCourseById } from '../data/coursesData';
import type { Course, CatalogItem } from '../types';
import {
  Search,
  Sparkles,
  Layers,
  Clock,
  Play,
  Terminal,
  ChevronRight,
  Tv,
  CheckCircle2
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AetherHubProps {
  onSelectCourse: (course: Course) => void;
  completedLessonIds: string[];
}

const CATEGORY_TABS = [
  { id: 'all', label: 'All' },
  { id: 'delta', label: 'Delta (Web Dev)' },
  { id: 'sigma', label: 'Sigma (DSA/Web)' },
  { id: 'alpha', label: 'Alpha (Java DSA)' },
  { id: 'prime', label: 'AI & ML' },
  { id: 'akki', label: 'Code With Akki' }
];

export const AetherHubScreen: React.FC<AetherHubProps> = ({
  onSelectCourse,
  completedLessonIds
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredCatalog = useMemo(() => {
    return CATALOG.filter((item: CatalogItem) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        activeCategory === 'all' || item.category === activeCategory;

      return matchesSearch && matchesCat;
    });
  }, [searchQuery, activeCategory]);

  const handlePressCourse = (item: CatalogItem) => {
    const fullCourse = getCourseById(item.id);
    if (fullCourse) {
      onSelectCourse(fullCourse);
    }
  };

  const formatHours = (mins: number) => {
    const hrs = (mins / 60).toFixed(1);
    return `${hrs}h`;
  };

  return (
    <View style={styles.container}>
      {/* Studio Header & Brand */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <Terminal size={14} color="#6366F1" />
            <Text style={styles.brandBadgeText}>AETHER STUDIO</Text>
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>CINEMA READY</Text>
          </View>
        </View>
        <Text style={styles.mainTitle}>Command Center</Text>
        <Text style={styles.subTitle}>5,700+ authentic lectures • Zero-data offline vault</Text>

        {/* Command Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search batches, frameworks, topics..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Category Pills */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORY_TABS}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.categoryScroll}
          renderItem={({ item }) => {
            const isActive = activeCategory === item.id;
            return (
              <TouchableOpacity
                onPress={() => setActiveCategory(item.id)}
                style={[styles.catPill, isActive && styles.catPillActive]}
              >
                <Text style={[styles.catPillText, isActive && styles.catPillTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Course Bento Grid */}
      <FlatList
        data={filteredCatalog}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          return (
            <TouchableOpacity
              onPress={() => handlePressCourse(item)}
              activeOpacity={0.82}
              style={styles.bentoCard}
            >
              <View style={styles.bentoTop}>
                <View style={styles.bentoCategoryPill}>
                  <Text style={styles.bentoCategoryText}>
                    {item.category.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.durationTag}>
                  <Clock size={11} color="#94A3B8" />
                  <Text style={styles.durationText}>
                    {formatHours(item.totalDuration)}
                  </Text>
                </View>
              </View>

              <Text style={styles.bentoTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.bentoDesc} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.bentoFooter}>
                <View style={styles.footerLeft}>
                  <Layers size={13} color="#6366F1" />
                  <Text style={styles.lectureCountText}>
                    {item.lessonCount} lectures • {item.sectionCount} topics
                  </Text>
                </View>
                <View style={styles.playArrowPill}>
                  <Play size={12} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
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
    paddingBottom: 12,
    backgroundColor: '#0B0D14',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)'
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)'
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#818CF8',
    letterSpacing: 1
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981'
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.4
  },
  subTitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 12
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141722',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: '#F8FAFC',
    fontSize: 13,
    paddingVertical: 0
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 4
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#141722',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  catPillActive: {
    backgroundColor: '#6366F1',
    borderColor: '#818CF8'
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8'
  },
  catPillTextActive: {
    color: '#fff'
  },
  gridContent: {
    padding: 16,
    gap: 12
  },
  bentoCard: {
    backgroundColor: '#0F121A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 10
  },
  bentoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  bentoCategoryPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  bentoCategoryText: {
    color: '#A5B4FC',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  durationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  durationText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600'
  },
  bentoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4
  },
  bentoDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
    marginBottom: 14
  },
  bentoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    paddingTop: 10
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  lectureCountText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600'
  },
  playArrowPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
