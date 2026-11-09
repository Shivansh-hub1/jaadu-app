import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { Flame, CheckCircle, Clock, Calendar, Trophy } from 'lucide-react-native';

interface TrackerScreenProps {
  completedLessonCount: number;
}

export const TrackerScreen: React.FC<TrackerScreenProps> = ({ completedLessonCount }) => {
  // Estimated hours: ~45 mins per lecture
  const totalHours = Math.round((completedLessonCount * 45) / 60);

  // Target target date in days
  const daysLeft = 60; // 60-day target

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Study Tracker</Text>
      <Text style={styles.headerSubtitle}>Monitor your mastery across all engineering tracks</Text>

      {/* Grid of Stats */}
      <View style={styles.statsGrid}>
        {/* Streak */}
        <View style={styles.statBox}>
          <View style={[styles.iconBox, { backgroundColor: '#382218' }]}>
            <Flame size={24} color="#f97316" />
          </View>
          <Text style={styles.statNumber}>3 Days</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>

        {/* Completed */}
        <View style={styles.statBox}>
          <View style={[styles.iconBox, { backgroundColor: '#132e22' }]}>
            <CheckCircle size={24} color="#10b981" />
          </View>
          <Text style={styles.statNumber}>{completedLessonCount}</Text>
          <Text style={styles.statLabel}>Completed Lessons</Text>
        </View>

        {/* Hours */}
        <View style={styles.statBox}>
          <View style={[styles.iconBox, { backgroundColor: '#162738' }]}>
            <Clock size={24} color="#2e8cff" />
          </View>
          <Text style={styles.statNumber}>{totalHours} hrs</Text>
          <Text style={styles.statLabel}>Hours Studied</Text>
        </View>

        {/* Days Left */}
        <View style={styles.statBox}>
          <View style={[styles.iconBox, { backgroundColor: '#2e1c38' }]}>
            <Calendar size={24} color="#a855f7" />
          </View>
          <Text style={styles.statNumber}>{daysLeft} days</Text>
          <Text style={styles.statLabel}>Placement Target</Text>
        </View>
      </View>

      {/* Senior Dev Quote / Advice */}
      <View style={styles.tipCard}>
        <View style={styles.tipHeader}>
          <Trophy size={18} color="#eab308" />
          <Text style={styles.tipTitle}>Senior Dev Tip</Text>
        </View>
        <Text style={styles.tipBody}>
          Consistency beats intensity. 1 high-yield coding lecture with deliberate notes each evening beats cramming 10 lectures on Sunday.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212'
  },
  content: {
    padding: 16
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 13,
    marginBottom: 20
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20
  },
  statBox: {
    width: '48%',
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#262626'
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  statNumber: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2
  },
  statLabel: {
    color: '#888',
    fontSize: 11
  },
  tipCard: {
    backgroundColor: '#191919',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a'
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8
  },
  tipTitle: {
    color: '#eab308',
    fontSize: 14,
    fontWeight: 'bold'
  },
  tipBody: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 19
  }
});
