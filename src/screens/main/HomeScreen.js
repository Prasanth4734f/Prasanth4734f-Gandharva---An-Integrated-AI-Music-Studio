import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { Search, Sparkles, Music2, Mic2, FileText, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenContainer from '../../components/ScreenContainer';
import GlassCard from '../../components/GlassCard';
import { COLORS, SIZES, SPACING } from '../../constants/theme';

const FEATURE_CARDS = [
  { id: '1', title: 'AI Music', subtitle: 'Generate tracks from prompts', icon: Music2, color: '#06B6D4' },
  { id: '2', title: 'AI Lyrics', subtitle: 'Write songs with AI', icon: FileText, color: '#06B6D4' },
  { id: '3', title: 'Vocal Studio', subtitle: 'Record & Mix with AI', icon: Mic2, color: '#06B6D4' },
];

const TRENDING_MOODS = ['Lofi', 'Phonk', 'Cinematic', 'EDM', 'Chill', 'Sad'];

const HomeScreen = ({ navigation }) => {
  return (
    <LinearGradient colors={['#000000', '#04171A', '#000000']} style={{ flex: 1, paddingTop: 50 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.username}>Creator</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <View style={styles.profilePlaceholder} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search color={COLORS.textMuted} size={20} />
          <TextInput
            placeholder="Search for moods, genres..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
          />
        </View>

        {/* Quick Features */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Create</Text>
          <Sparkles color="#06B6D4" size={20} />
        </View>
        <View style={styles.featuresGrid}>
          {FEATURE_CARDS.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.featureCardWrapper}
              onPress={() => {
                if (item.title === 'AI Music') navigation.navigate('Generate');
                else if (item.title === 'AI Lyrics') navigation.navigate('LyricsGenerator');
                else if (item.title === 'Vocal Studio') navigation.navigate('VocalUpload');
              }}
            >
              <GlassCard style={styles.featureCard}>
                <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
                  <item.icon color={item.color} size={24} />
                </View>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureSubtitle}>{item.subtitle}</Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trending Moods */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Moods</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodsScroll}>
          {TRENDING_MOODS.map((mood, index) => (
            <TouchableOpacity key={index} style={styles.moodChip}>
              <Text style={styles.moodText}>{mood}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recent Generations Placeholder */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Generations</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('MusicPlayer')}>
          <GlassCard style={styles.recentCard}>
            <View style={styles.recentInfo}>
              <View style={styles.recentPlaceholder} />
              <View>
                <Text style={styles.recentTitle}>Midnight City Lofi</Text>
                <Text style={styles.recentMeta}>2:45 • Lofi Chill</Text>
              </View>
            </View>
            <View>
              <ChevronRight color={COLORS.textMuted} size={20} />
            </View>
          </GlassCard>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  greeting: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_md,
  },
  username: {
    color: COLORS.text,
    fontSize: SIZES.font_xl,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: COLORS.surfaceLight,
    padding: 2,
  },
  profilePlaceholder: {
    flex: 1,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 25,
    paddingHorizontal: SPACING.lg,
    height: 55,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.md,
    color: '#FFFFFF',
    fontSize: SIZES.font_md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: SIZES.font_lg,
    fontWeight: '700',
  },
  seeAll: {
    color: '#06B6D4',
    fontSize: SIZES.font_sm,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCardWrapper: {
    width: '48%',
    marginBottom: SPACING.lg,
  },
  featureCard: {
    padding: SPACING.lg,
    height: 160,
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  featureTitle: {
    color: COLORS.text,
    fontSize: SIZES.font_md,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featureSubtitle: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_xs,
  },
  moodsScroll: {
    marginBottom: SPACING.xl,
  },
  moodChip: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.3)',
  },
  moodText: {
    color: '#FFFFFF',
    fontSize: SIZES.font_sm,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  recentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  recentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentPlaceholder: {
    width: 55,
    height: 55,
    borderRadius: 16,
    backgroundColor: '#06B6D4',
    marginRight: SPACING.md,
  },
  recentTitle: {
    color: COLORS.text,
    fontSize: SIZES.font_md,
    fontWeight: '600',
  },
  recentMeta: {
    color: COLORS.textMuted,
    fontSize: SIZES.font_xs,
    marginTop: 2,
  },
});

export default HomeScreen;
