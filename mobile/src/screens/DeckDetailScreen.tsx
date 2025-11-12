import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, Flashcard } from '../types';
import apiClient from '../api/client';
import { IS_TABLET, spacing, responsiveFontSize } from '../utils/responsive';

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
  const { width, height } = useWindowDimensions();

  const numColumns = IS_TABLET ? (width > height ? 2 : 1) : 1;
  const [key, setKey] = useState(0);

  useEffect(() => {
    navigation.setOptions({ title: deckName });
    loadCards();
  }, [deckId]);

  useEffect(() => {
    setKey(prev => prev + 1);
  }, [width, height]);

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
    <View style={[styles.cardItem, IS_TABLET && styles.cardItemTablet]}>
      <View style={styles.cardNumber}>
        <Text style={styles.cardNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardLabel}>Front:</Text>
        <Text style={styles.cardText} numberOfLines={IS_TABLET ? 3 : 2}>
          {item.front.replace(/<[^>]*>/g, '')}
        </Text>
        <Text style={[styles.cardLabel, styles.backLabel]}>Back:</Text>
        <Text style={styles.cardText} numberOfLines={IS_TABLET ? 3 : 2}>
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
      <View style={[styles.header, IS_TABLET && styles.headerTablet]}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerText}>
            {cards.length} {cards.length === 1 ? 'card' : 'cards'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.reviewButton, IS_TABLET && styles.reviewButtonTablet]}
          onPress={() => navigation.navigate('Review', { deckId })}
        >
          <Text style={styles.reviewButtonText}>Review Deck</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        key={`cards-grid-${key}-${numColumns}`}
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        contentContainerStyle={[
          styles.listContainer,
          IS_TABLET && styles.listContainerTablet,
        ]}
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
    padding: spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTablet: {
    padding: spacing.lg,
  },
  headerInfo: {
    flex: 1,
  },
  headerText: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: '#666',
  },
  reviewButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  reviewButtonTablet: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  reviewButtonText: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    color: '#fff',
  },
  listContainer: {
    padding: spacing.md,
  },
  listContainerTablet: {
    padding: spacing.lg,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  columnWrapper: {
    gap: spacing.md,
  },
  cardItem: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardItemTablet: {
    borderRadius: 16,
    padding: spacing.lg,
    shadowRadius: 8,
    elevation: 5,
  },
  cardNumber: {
    width: IS_TABLET ? 50 : 40,
    height: IS_TABLET ? 50 : 40,
    borderRadius: IS_TABLET ? 25 : 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardNumberText: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: '#fff',
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: responsiveFontSize(12),
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  backLabel: {
    marginTop: spacing.md,
  },
  cardText: {
    fontSize: responsiveFontSize(14),
    color: '#333',
    lineHeight: responsiveFontSize(20),
  },
});
