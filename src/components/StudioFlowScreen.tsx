import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { DEV_QUOTES } from '../data/devQuotes';
import {
  Zap,
  Flame,
  Clock,
  Sparkles,
  Target,
  RefreshCw,
  Trophy,
  CheckCircle2
} from 'lucide-react-native';

interface FlowProps {
  completedLessonCount: number;
}

export const StudioFlowScreen: React.FC<FlowProps> = ({
  completedLessonCount
}) => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [targetDays, setTargetDays] = useState<number>(60);

  const currentQuote = DEV_QUOTES[quoteIndex % DEV_QUOTES.length] || 'First, solve the problem. Then, write the code.';

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % DEV_QUOTES.length);
  };

  const estimatedMinutes = completedLessonCount * 22; // ~22 mins average per lecture
  const totalTargetLectures = 780; // Standard batch depth
  const remaining = Math.max(0, totalTargetLectures - completedLessonCount);
  const lecturesPerDay = Math.ceil(remaining / (targetDays || 1));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.badge}>
          <Flame size={12} color="#F59E0B" />
          <Text style={styles.badgeText}>STUDIO PACING & FLOW</Text>
        </View>
        <Text style={styles.title}>Velocity & Momentum</Text>
        <Text style={styles.subtitle}>Daily metrics and pacing to crack product placements</Text>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricIconWrap}>
            <CheckCircle2 size={18} color="#10B981" />
          </View>
          <Text style={styles.metricVal}>{completedLessonCount}</Text>
          <Text style={styles.metricLabel}>COMPLETED</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
            <Clock size={18} color="#6366F1" />
          </View>
          <Text style={styles.metricVal}>{(estimatedMinutes / 60).toFixed(1)}h</Text>
          <Text style={styles.metricLabel}>FOCUSED STUDY</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <Zap size={18} color="#F59E0B" />
          </View>
          <Text style={styles.metricVal}>{lecturesPerDay}/day</Text>
          <Text style={styles.metricLabel}>DAILY TARGET</Text>
        </View>
      </View>

      {/* Target Pacing Calculator */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <Target size={16} color="#6366F1" />
          <Text style={styles.sectionCardTitle}>Pacing Target Calculator</Text>
        </View>
        <Text style={styles.pacingDesc}>
          To finish your target curriculum in {targetDays} days with {remaining} lectures remaining:
        </Text>

        <View style={styles.pacingResultBox}>
          <Text style={styles.pacingBigNumber}>{lecturesPerDay}</Text>
          <Text style={styles.pacingBigLabel}>LECTURES / DAY</Text>
        </View>

        <View style={styles.pacingPillsRow}>
          {[30, 45, 60, 90, 120].map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => setTargetDays(d)}
              style={[styles.pacingPill, targetDays === d && styles.pacingPillActive]}
            >
              <Text style={[styles.pacingPillText, targetDays === d && styles.pacingPillTextActive]}>
                {d} Days
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Developer Wisdom & Humor */}
      <View style={styles.quoteCard}>
        <View style={styles.quoteCardTop}>
          <View style={styles.quoteLabelWrap}>
            <Sparkles size={14} color="#818CF8" />
            <Text style={styles.quoteLabel}>DEV WISDOM</Text>
          </View>
          <TouchableOpacity onPress={handleNextQuote} style={styles.shuffleBtn}>
            <RefreshCw size={13} color="#94A3B8" />
            <Text style={styles.shuffleText}>Shuffle</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.quoteText}>"{currentQuote}"</Text>
        <Text style={styles.quoteAuthor}>— Developer Wisdom</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07080B'
  },
  content: {
    padding: 16,
    paddingBottom: 32
  },
  header: {
    marginBottom: 16
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 1
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC'
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#0F121A',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  metricIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC'
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 0.5
  },
  sectionCard: {
    backgroundColor: '#0F121A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 16
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  sectionCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9'
  },
  pacingDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 12
  },
  pacingResultBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#141722',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    marginBottom: 12
  },
  pacingBigNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#6366F1'
  },
  pacingBigLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A5B4FC',
    letterSpacing: 1,
    marginTop: 2
  },
  pacingPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  pacingPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#161A26',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  pacingPillActive: {
    backgroundColor: '#6366F1',
    borderColor: '#818CF8'
  },
  pacingPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8'
  },
  pacingPillTextActive: {
    color: '#fff'
  },
  quoteCard: {
    backgroundColor: '#111420',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)'
  },
  quoteCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  quoteLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  quoteLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#818CF8',
    letterSpacing: 1
  },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  shuffleText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600'
  },
  quoteText: {
    fontSize: 14,
    color: '#E2E8F0',
    fontStyle: 'italic',
    lineHeight: 21,
    marginBottom: 8
  },
  quoteAuthor: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    textAlign: 'right'
  }
});
