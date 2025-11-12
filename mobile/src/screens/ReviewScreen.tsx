import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, CardSchedule, Flashcard } from '../types';
import apiClient from '../api/client';
import { IS_TABLET, spacing, responsiveFontSize, getCardMaxWidth } from '../utils/responsive';

type ReviewScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Review'>;

interface Props {
  navigation: ReviewScreenNavigationProp;
}

export default function ReviewScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [dueSchedules, setDueSchedules] = useState<CardSchedule[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loadingCard, setLoadingCard] = useState(false);
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    loadDueCards();
  }, []);

  useEffect(() => {
    if (dueSchedules.length > 0 && currentIndex < dueSchedules.length) {
      loadCurrentCard();
    }
  }, [currentIndex, dueSchedules]);

  const loadDueCards = async () => {
    try {
      const schedules = await apiClient.getDueCards();
      setDueSchedules(schedules);

      if (schedules.length === 0) {
        // No cards to review
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load due cards:', error);
      setLoading(false);
    }
  };

  const loadCurrentCard = async () => {
    if (currentIndex >= dueSchedules.length) {
      return;
    }

    setLoadingCard(true);
    const schedule = dueSchedules[currentIndex];

    try {
      // In a real implementation, you'd fetch the card details
      // For now, we'll need to enhance the API to join cards with schedules
      // Placeholder: set loading to false
      setLoadingCard(false);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load card:', error);
      setLoadingCard(false);
      setLoading(false);
    }
  };

  const handleReview = async (quality: number) => {
    if (!dueSchedules[currentIndex]) return;

    try {
      await apiClient.submitReview(dueSchedules[currentIndex].card_id, quality);

      // Move to next card
      setShowAnswer(false);
      if (currentIndex < dueSchedules.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // All done!
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (dueSchedules.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.doneIcon}>✅</Text>
        <Text style={styles.doneTitle}>All Done!</Text>
        <Text style={styles.doneText}>
          You have no cards due for review right now.{'\n'}
          Come back later!
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const schedule = dueSchedules[currentIndex];
  const progress = ((currentIndex + 1) / dueSchedules.length) * 100;
  const isLandscape = width > height;

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {dueSchedules.length}
        </Text>
      </View>

      <ScrollView
        style={styles.cardContainer}
        contentContainerStyle={[
          styles.cardContent,
          IS_TABLET && styles.cardContentTablet,
        ]}
      >
        <View
          style={[
            styles.card,
            IS_TABLET && styles.cardTablet,
            { maxWidth: getCardMaxWidth() },
          ]}
        >
          <Text style={styles.cardLabel}>Question</Text>
          <View style={[styles.cardTextContainer, IS_TABLET && styles.cardTextContainerTablet]}>
            <Text style={styles.cardText}>
              {/* In a real implementation, this would be the card's front */}
              Card {schedule.card_id}
            </Text>
          </View>

          {showAnswer && (
            <>
              <View style={styles.divider} />
              <Text style={styles.cardLabel}>Answer</Text>
              <View style={[styles.cardTextContainer, IS_TABLET && styles.cardTextContainerTablet]}>
                <Text style={styles.cardText}>
                  {/* In a real implementation, this would be the card's back */}
                  Answer for card {schedule.card_id}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.stateInfo}>
          <Text style={styles.stateText}>
            State: {schedule.state} | Interval: {schedule.interval} days | Ease: {schedule.ease_factor.toFixed(2)}
          </Text>
        </View>
      </ScrollView>

      {!showAnswer ? (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.showAnswerButton, IS_TABLET && styles.showAnswerButtonTablet]}
            onPress={() => setShowAnswer(true)}
          >
            <Text style={styles.showAnswerButtonText}>Show Answer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.buttonContainer, IS_TABLET && isLandscape && styles.buttonContainerLandscape]}>
          <Text style={styles.rateLabel}>How well did you know this?</Text>
          <View style={[
            styles.qualityButtons,
            IS_TABLET && isLandscape && styles.qualityButtonsRow,
          ]}>
            <TouchableOpacity
              style={[styles.qualityButton, styles.againButton, IS_TABLET && styles.qualityButtonTablet]}
              onPress={() => handleReview(0)}
            >
              <Text style={styles.qualityButtonText}>Again</Text>
              <Text style={styles.qualitySubtext}>{'<1m'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.qualityButton, styles.hardButton, IS_TABLET && styles.qualityButtonTablet]}
              onPress={() => handleReview(2)}
            >
              <Text style={styles.qualityButtonText}>Hard</Text>
              <Text style={styles.qualitySubtext}>{'<6m'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.qualityButton, styles.goodButton, IS_TABLET && styles.qualityButtonTablet]}
              onPress={() => handleReview(3)}
            >
              <Text style={styles.qualityButtonText}>Good</Text>
              <Text style={styles.qualitySubtext}>
                {schedule.interval > 0 ? `${schedule.interval}d` : '1d'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.qualityButton, styles.easyButton, IS_TABLET && styles.qualityButtonTablet]}
              onPress={() => handleReview(5)}
            >
              <Text style={styles.qualityButtonText}>Easy</Text>
              <Text style={styles.qualitySubtext}>
                {schedule.interval > 0 ? `${Math.round(schedule.interval * 1.3)}d` : '4d'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: '#f5f5f5',
  },
  progressContainer: {
    padding: spacing.md,
    backgroundColor: '#fff',
  },
  progressBar: {
    height: IS_TABLET ? 12 : 8,
    backgroundColor: '#e0e0e0',
    borderRadius: IS_TABLET ? 6 : 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  progressText: {
    fontSize: responsiveFontSize(14),
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
  },
  cardContainer: {
    flex: 1,
  },
  cardContent: {
    padding: spacing.md,
    alignItems: 'center',
  },
  cardContentTablet: {
    padding: spacing.lg,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.lg,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignSelf: 'center',
  },
  cardTablet: {
    borderRadius: 20,
    padding: spacing.xl,
    shadowRadius: 12,
    elevation: 6,
  },
  cardLabel: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTextContainer: {
    minHeight: 100,
  },
  cardTextContainerTablet: {
    minHeight: IS_TABLET ? 200 : 100,
  },
  cardText: {
    fontSize: IS_TABLET ? 24 : 20,
    color: '#333',
    lineHeight: IS_TABLET ? 38 : 32,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: spacing.lg,
  },
  stateInfo: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: '#f9f9f9',
    borderRadius: IS_TABLET ? 12 : 8,
    width: '100%',
    maxWidth: getCardMaxWidth(),
  },
  stateText: {
    fontSize: responsiveFontSize(12),
    color: '#666',
    textAlign: 'center',
  },
  actionContainer: {
    padding: spacing.md,
    backgroundColor: '#fff',
  },
  showAnswerButton: {
    padding: spacing.md,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  showAnswerButtonTablet: {
    padding: spacing.lg,
    borderRadius: 16,
  },
  showAnswerButtonText: {
    fontSize: responsiveFontSize(18),
    fontWeight: '600',
    color: '#fff',
  },
  buttonContainer: {
    padding: spacing.md,
    backgroundColor: '#fff',
  },
  buttonContainerLandscape: {
    padding: spacing.lg,
  },
  rateLabel: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  qualityButtons: {
    flexDirection: 'row',
    gap: IS_TABLET ? spacing.md : spacing.sm,
  },
  qualityButtonsRow: {
    justifyContent: 'center',
    maxWidth: 800,
    alignSelf: 'center',
  },
  qualityButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: IS_TABLET ? 12 : 8,
    alignItems: 'center',
    minHeight: IS_TABLET ? 80 : 60,
    justifyContent: 'center',
  },
  qualityButtonTablet: {
    padding: spacing.lg,
    minWidth: IS_TABLET ? 150 : undefined,
  },
  againButton: {
    backgroundColor: '#FF3B30',
  },
  hardButton: {
    backgroundColor: '#FF9500',
  },
  goodButton: {
    backgroundColor: '#34C759',
  },
  easyButton: {
    backgroundColor: '#007AFF',
  },
  qualityButtonText: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    color: '#fff',
    marginBottom: spacing.xs,
  },
  qualitySubtext: {
    fontSize: responsiveFontSize(12),
    color: '#fff',
    opacity: 0.9,
  },
  doneIcon: {
    fontSize: IS_TABLET ? 96 : 64,
    marginBottom: spacing.lg,
  },
  doneTitle: {
    fontSize: responsiveFontSize(28),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: spacing.md,
  },
  doneText: {
    fontSize: responsiveFontSize(16),
    color: '#666',
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: responsiveFontSize(24),
    maxWidth: IS_TABLET ? 600 : undefined,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: IS_TABLET ? 16 : 12,
  },
  buttonText: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: '#fff',
  },
});
