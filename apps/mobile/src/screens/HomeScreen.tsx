import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import apiClient from '../api/client';
import { IS_TABLET, spacing, responsiveFontSize, getCardMaxWidth } from '../utils/responsive';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
  const [dueCount, setDueCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      let uid = await apiClient.getUserId();

      if (!uid) {
        // Create a demo user
        const user = await apiClient.createUser('demo@example.com');
        uid = user.id;
      }

      setUserId(uid);
      await loadDueCards();
    } catch (error) {
      console.error('Failed to initialize user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDueCards = async () => {
    try {
      const dueCards = await apiClient.getDueCards();
      setDueCount(dueCards.length);
    } catch (error) {
      console.error('Failed to load due cards:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={IS_TABLET ? styles.contentContainerTablet : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Anki Flashcards</Text>
        <Text style={styles.subtitle}>Spaced Repetition Learning</Text>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>{dueCount}</Text>
          <Text style={styles.statsLabel}>Cards Due Today</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, IS_TABLET && styles.buttonTablet]}
            onPress={() => navigation.navigate('Review')}
            disabled={dueCount === 0}
          >
            <Text style={styles.primaryButtonIcon}>🎯</Text>
            <Text style={styles.buttonText}>
              {dueCount > 0 ? 'Start Review' : 'No Cards Due'}
            </Text>
          </TouchableOpacity>

          <View style={IS_TABLET ? styles.secondaryButtonsRow : undefined}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.secondaryButton,
                IS_TABLET && styles.buttonTablet,
                IS_TABLET && styles.buttonTabletSecondary,
              ]}
              onPress={() => navigation.navigate('Decks')}
            >
              <Text style={styles.secondaryButtonIcon}>📚</Text>
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                My Decks
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.secondaryButton,
                IS_TABLET && styles.buttonTablet,
                IS_TABLET && styles.buttonTabletSecondary,
              ]}
              onPress={() => navigation.navigate('Upload')}
            >
              <Text style={styles.secondaryButtonIcon}>📁</Text>
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Import .apkg File
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <View style={IS_TABLET ? styles.infoRowTablet : undefined}>
            <View style={IS_TABLET ? styles.infoColumn : styles.infoItem}>
              <Text style={styles.infoNumber}>1</Text>
              <Text style={styles.infoText}>Import your Anki .apkg files</Text>
            </View>
            <View style={IS_TABLET ? styles.infoColumn : styles.infoItem}>
              <Text style={styles.infoNumber}>2</Text>
              <Text style={styles.infoText}>Review cards using spaced repetition</Text>
            </View>
            <View style={IS_TABLET ? styles.infoColumn : styles.infoItem}>
              <Text style={styles.infoNumber}>3</Text>
              <Text style={styles.infoText}>Build long-term memory retention</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainerTablet: {
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: spacing.xl,
    paddingTop: IS_TABLET ? spacing.xxl : 60,
    alignItems: 'center',
  },
  title: {
    fontSize: IS_TABLET ? 48 : 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: IS_TABLET ? 20 : 16,
    color: '#fff',
    opacity: 0.9,
  },
  mainContent: {
    padding: spacing.md,
  },
  statsCard: {
    backgroundColor: '#fff',
    margin: IS_TABLET ? spacing.lg : spacing.md,
    padding: IS_TABLET ? spacing.xxl : spacing.xl,
    borderRadius: IS_TABLET ? 20 : 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: IS_TABLET ? 8 : 4,
    elevation: IS_TABLET ? 5 : 3,
  },
  statsNumber: {
    fontSize: IS_TABLET ? 72 : 48,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statsLabel: {
    fontSize: IS_TABLET ? 20 : 16,
    color: '#666',
    marginTop: spacing.sm,
  },
  buttonContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    padding: spacing.md,
    borderRadius: IS_TABLET ? 16 : 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTablet: {
    padding: spacing.lg,
  },
  buttonTabletSecondary: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonIcon: {
    fontSize: IS_TABLET ? 48 : 32,
    marginBottom: spacing.sm,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  secondaryButtonIcon: {
    fontSize: IS_TABLET ? 36 : 24,
    marginBottom: spacing.xs,
  },
  buttonText: {
    fontSize: responsiveFontSize(18),
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  infoSection: {
    margin: spacing.md,
    padding: spacing.lg,
    backgroundColor: '#fff',
    borderRadius: IS_TABLET ? 20 : 12,
  },
  infoTitle: {
    fontSize: responsiveFontSize(18),
    fontWeight: '600',
    color: '#333',
    marginBottom: spacing.md,
  },
  infoRowTablet: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  infoColumn: {
    flex: 1,
    alignItems: 'center',
  },
  infoItem: {
    marginBottom: spacing.md,
  },
  infoNumber: {
    fontSize: IS_TABLET ? 32 : 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: responsiveFontSize(15),
    color: '#666',
    lineHeight: responsiveFontSize(24),
    textAlign: IS_TABLET ? 'center' : 'left',
  },
});
