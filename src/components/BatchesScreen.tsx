import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet
} from 'react-native';
import { CATALOG, COURSES } from '../data/coursesData';
import type { CatalogItem, Course } from '../types';
import { Search, Play, BookOpen, Layers } from 'lucide-react-native';

interface BatchesScreenProps {
  onSelectCourse: (course: Course) => void;
  completedLessonIds: string[];
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'akki', label: 'Akki' },
  { id: 'alpha', label: 'Alpha (DSA)' },
  { id: 'delta', label: 'Delta (Web)' },
  { id: 'sigma', label: 'Sigma (Fullstack)' },
  { id: 'prime', label: 'Prime (AI/ML)' }
];

export const BatchesScreen: React.FC<BatchesScreenProps> = ({
  onSelectCourse,
  completedLessonIds
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredCatalog = useMemo(() => {
    return CATALOG.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat =
        activeCategory === 'all' || item.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [searchQuery, activeCategory]);

  const renderItem = ({ item }: { item: CatalogItem }) => {
    const course = COURSES[item.id];
    const totalLessons = item.lessonCount || 1;
    // Count how many lessons in this course are completed
    let completedInCourse = 0;
    if (course) {
      for (const sec of course.sections) {
        for (const les of sec.lessons) {
          if (completedLessonIds.includes(les.id)) {
            completedInCourse++;
          }
        }
      }
    }
    const percent = Math.min(100, Math.round((completedInCourse / totalLessons) * 100));

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => {
          if (course) onSelectCourse(course);
        }}
      >
        <Image
          source={{ uri: item.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800' }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <View style={styles.cardContent}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category.toUpperCase()}</Text>
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <BookOpen size={14} color="#888" />
              <Text style={styles.metaText}>{item.lessonCount} Lessons</Text>
            </View>
            <View style={styles.metaItem}>
              <Layers size={14} color="#888" />
              <Text style={styles.metaText}>{item.sectionCount} Sections</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {completedInCourse}/{totalLessons} ({percent}%)
            </Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.openButton}
              onPress={() => {
                if (course) onSelectCourse(course);
              }}
            >
              <Play size={14} color="#fff" />
              <Text style={styles.openButtonText}>Start Learning</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <Search size={18} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search 5,700+ lectures & batches..."
          placeholderTextColor="#777"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Chips */}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => {
            const isActive = activeCategory === item.id;
            return (
              <TouchableOpacity
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                onPress={() => setActiveCategory(item.id)}
              >
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {/* Catalog List */}
      <FlatList
        data={filteredCatalog}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212'
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 10
  },
  categoryContainer: {
    height: 44,
    marginBottom: 8
  },
  categoryList: {
    paddingHorizontal: 16,
    alignItems: 'center'
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1c1c1c',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2c2c2c'
  },
  categoryChipActive: {
    backgroundColor: '#2e8cff',
    borderColor: '#2e8cff'
  },
  categoryText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600'
  },
  categoryTextActive: {
    color: '#fff'
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24
  },
  card: {
    backgroundColor: '#1b1b1b',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  thumbnail: {
    width: '100%',
    height: 150
  },
  cardContent: {
    padding: 16
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#262626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8
  },
  categoryBadgeText: {
    color: '#2e8cff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  cardTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6
  },
  cardDescription: {
    color: '#999',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16
  },
  metaText: {
    color: '#888',
    fontSize: 12,
    marginLeft: 6
  },
  progressContainer: {
    marginBottom: 14
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#2c2c2c',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981'
  },
  progressText: {
    color: '#777',
    fontSize: 11,
    textAlign: 'right'
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2e8cff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  openButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6
  }
});
