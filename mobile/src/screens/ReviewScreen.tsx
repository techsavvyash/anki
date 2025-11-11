import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, CardSchedule, Flashcard } from '../types';
import apiClient from '../api/client';
import RenderHtml from 'react-native-render-html';

type ReviewScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Review'>;

interface Props {
  navigation: ReviewScreenNavigationProp;
}

const { width } = Dimensions.get('window');

export default function ReviewScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [dueSchedules, setDueSchedules] = useState<CardSchedule[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loadingCard, setLoadingCard] = useState(false);

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

      <ScrollView style={styles.cardContainer} contentContainerStyle={styles.cardContent}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Question</Text>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardText}>
              {/* In a real implementation, this would be the card's front */}
              Card {schedule.card_id}
            </Text>
          </View>

          {showAnswer && (
            <>
              <View style={styles.divider} />
              <Text style={styles.cardLabel}>Answer</Text>
              <View style={styles.cardTextContainer}>
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
            State: {schedule.state} | Interval: {schedule.interval} days
          </Text>
        </View>
      </ScrollView>

      {!showAnswer ? (
        <TouchableOpacity
          style={styles.showAnswerButton}
          onPress={() => setShowAnswer(true)}
        >
          <Text style={styles.showAnswerButtonText}>Show Answer</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.buttonContainer}>
          <Text style={styles.rateLabel}>How well did you know this?</Text>
          <View style={styles.qualityButtons}>
            <TouchableOpacity
              style={[styles.qualityButton, styles.againButton]}
              onPress={() => handleReview(0)}
            >
              <Text style={styles.qualityButtonText}>Again</Text>
              <Text style={styles.qualitySubtext}>{'<1m'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.qualityButton, styles.hardButton]}
              onPress={() => handleReview(2)}
            >
              <Text style={styles.qualityButtonText}>Hard</Text>
              <Text style={styles.qualitySubtext}>{'<6m'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.qualityButton, styles.goodButton]}
              onPress={() => handleReview(3)}
            >
              <Text style={styles.qualityButtonText}>Good</Text>
              <Text style={styles.qualitySubtext}>
                {schedule.interval > 0 ? `${schedule.interval}d` : '1d'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.qualityButton, styles.easyButton]}
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
    padding: 40,
    backgroundColor: '#f5f5f5',
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  cardContainer: {
    flex: 1,
  },
  cardContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  cardTextContainer: {
    minHeight: 100,
  },
  cardText: {
    fontSize: 20,
    color: '#333',
    lineHeight: 32,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },
  stateInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  stateText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  showAnswerButton: {
    margin: 20,
    padding: 18,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  showAnswerButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  rateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  qualityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  qualityButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  qualitySubtext: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  doneIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  doneTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  doneText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
