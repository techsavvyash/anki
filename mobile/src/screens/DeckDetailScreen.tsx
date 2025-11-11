import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, Flashcard } from '../types';
import apiClient from '../api/client';

type DeckDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'DeckDetail'>;
type DeckDetailScreenRouteProp = RouteProp<RootStackParamList, 'DeckDetail'>;

interface Props {
  navigation: DeckDetailScreenNavigationProp;
  route: DeckDetailScreenRouteProp;
}

export default function DeckDetailScreen({ navigation, route }: Props) {
  const { deckId, deckName } = route.params;
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: deckName });
    loadCards();
  }, [deckId]);

  const loadCards = async () => {
    try {
      const data = await apiClient.getDeckCards(deckId);
      setCards(data);
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCard = ({ item, index }: { item: Flashcard; index: number }) => (
    <View style={styles.cardItem}>
      <View style={styles.cardNumber}>
        <Text style={styles.cardNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardLabel}>Front:</Text>
        <Text style={styles.cardText} numberOfLines={2}>
          {item.front.replace(/<[^>]*>/g, '')}
        </Text>
        <Text style={[styles.cardLabel, styles.backLabel]}>Back:</Text>
        <Text style={styles.cardText} numberOfLines={2}>
          {item.back.replace(/<[^>]*>/g, '')}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {cards.length} {cards.length === 1 ? 'card' : 'cards'}
        </Text>
        <TouchableOpacity
          style={styles.reviewButton}
          onPress={() => navigation.navigate('Review', { deckId })}
        >
          <Text style={styles.reviewButtonText}>Review Deck</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        contentContainerStyle={styles.listContainer}
      />
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  reviewButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  cardItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  backLabel: {
    marginTop: 12,
  },
  cardText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});
