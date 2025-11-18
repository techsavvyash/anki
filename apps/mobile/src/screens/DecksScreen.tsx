import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Deck } from '../types';
import apiClient from '../api/client';
import { IS_TABLET, spacing, responsiveFontSize, getGridColumns } from '../utils/responsive';

type DecksScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Decks'>;

interface Props {
  navigation: DecksScreenNavigationProp;
}

export default function DecksScreen({ navigation }: Props) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { width, height } = useWindowDimensions();

  // Calculate columns based on orientation
  const numColumns = IS_TABLET ? (width > height ? 3 : 2) : 1;
  // Force re-render when orientation changes by using key
  const [key, setKey] = useState(0);

  useEffect(() => {
    loadDecks();
  }, []);

  useEffect(() => {
    // Update key when dimensions change to force FlatList re-render with new numColumns
    setKey(prev => prev + 1);
  }, [width, height]);

  const loadDecks = async () => {
    try {
      const data = await apiClient.getDecks();
      setDecks(data);
    } catch (error) {
      console.error('Failed to load decks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDecks();
  };

  const renderDeck = ({ item }: { item: Deck }) => (
    <TouchableOpacity
      style={[
        styles.deckCard,
        IS_TABLET && styles.deckCardTablet,
      ]}
      onPress={() =>
        navigation.navigate('DeckDetail', {
          deckId: item.id,
          deckName: item.name,
        })
      }
    >
      <View style={styles.deckHeader}>
        <Text style={styles.deckName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.cardCountBadge}>
          <Text style={styles.cardCountText}>{item.card_count}</Text>
        </View>
      </View>
      {item.description ? (
        <Text style={styles.deckDescription} numberOfLines={IS_TABLET ? 3 : 2}>
          {item.description}
        </Text>
      ) : null}
      <Text style={styles.deckDate}>
        Added {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (decks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📚</Text>
        <Text style={styles.emptyTitle}>No Decks Yet</Text>
        <Text style={styles.emptyText}>
          Import an .apkg file to get started with your flashcards
        </Text>
        <TouchableOpacity
          style={styles.importButton}
          onPress={() => navigation.navigate('Upload')}
        >
          <Text style={styles.importButtonText}>Import Deck</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        key={`deck-grid-${key}-${numColumns}`} // Force re-render on orientation change
        data={decks}
        keyExtractor={(item) => item.id}
        renderItem={renderDeck}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        contentContainerStyle={[
          styles.listContainer,
          IS_TABLET && styles.listContainerTablet,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      <TouchableOpacity
        style={[styles.fab, IS_TABLET && styles.fabTablet]}
        onPress={() => navigation.navigate('Upload')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: '#f5f5f5',
  },
  emptyIcon: {
    fontSize: IS_TABLET ? 96 : 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: responsiveFontSize(24),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: responsiveFontSize(16),
    color: '#666',
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: responsiveFontSize(24),
    maxWidth: IS_TABLET ? 600 : undefined,
  },
  importButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: IS_TABLET ? 16 : 12,
  },
  importButtonText: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: '#fff',
  },
  listContainer: {
    padding: spacing.md,
  },
  listContainerTablet: {
    padding: spacing.lg,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  columnWrapper: {
    gap: spacing.md,
  },
  deckCard: {
    flex: 1,
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
  deckCardTablet: {
    borderRadius: 16,
    padding: spacing.lg,
    shadowRadius: 8,
    elevation: 5,
  },
  deckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  deckName: {
    fontSize: responsiveFontSize(18),
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: spacing.sm,
  },
  cardCountBadge: {
    backgroundColor: '#007AFF',
    borderRadius: IS_TABLET ? 16 : 12,
    paddingHorizontal: IS_TABLET ? 14 : 12,
    paddingVertical: IS_TABLET ? 6 : 4,
    minWidth: IS_TABLET ? 50 : 40,
    alignItems: 'center',
  },
  cardCountText: {
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    color: '#fff',
  },
  deckDescription: {
    fontSize: responsiveFontSize(14),
    color: '#666',
    marginBottom: spacing.sm,
    lineHeight: responsiveFontSize(20),
  },
  deckDate: {
    fontSize: responsiveFontSize(12),
    color: '#999',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabTablet: {
    width: 72,
    height: 72,
    borderRadius: 36,
    bottom: 30,
    right: 30,
  },
  fabText: {
    fontSize: IS_TABLET ? 40 : 32,
    color: '#fff',
    fontWeight: '300',
  },
});
