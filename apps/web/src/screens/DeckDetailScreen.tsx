import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { useDecksStore } from '../store/useDecksStore';
import apiClient from '../services/api';
import type { CardNote } from '@anki/types';

export default function DeckDetailScreen() {
  const { deckId } = useParams<{ deckId: string }>();
  const { currentDeck, currentDeckCards, isLoading, fetchDeckCards } = useDecksStore();
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [cardNotes, setCardNotes] = useState<Record<string, CardNote | null>>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    if (deckId) {
      fetchDeckCards(deckId);
    }
  }, [deckId, fetchDeckCards]);

  const toggleCardExpand = async (cardId: string) => {
    if (expandedCardId === cardId) {
      setExpandedCardId(null);
    } else {
      setExpandedCardId(cardId);
      // Fetch note if not already loaded
      if (!cardNotes[cardId]) {
        const note = await apiClient.getCardNote(cardId);
        setCardNotes((prev) => ({ ...prev, [cardId]: note }));
      }
    }
  };

  const handleSaveNote = async (cardId: string) => {
    try {
      const note = await apiClient.saveCardNote(cardId, noteContent);
      setCardNotes((prev) => ({ ...prev, [cardId]: note }));
      setEditingNoteId(null);
      setNoteContent('');
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const handleEditNote = (cardId: string) => {
    setEditingNoteId(cardId);
    setNoteContent(cardNotes[cardId]?.note || '');
  };

  if (isLoading) {
    return (
      <Layout title="Deck Details" showBackButton>
        <LoadingSpinner size="lg" className="h-full" />
      </Layout>
    );
  }

  return (
    <Layout title={currentDeck?.name || 'Deck Details'} showBackButton>
      <div className="container-mobile py-6 space-y-6">
        {/* Deck Info */}
        {currentDeck && (
          <Card className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">{currentDeck.name}</h2>
            {currentDeck.description && (
              <p className="text-gray-600">{currentDeck.description}</p>
            )}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>📊 {currentDeckCards.length} cards</span>
            </div>
          </Card>
        )}

        {/* Cards List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Cards</h3>
          {currentDeckCards.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-gray-600">No cards in this deck</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {currentDeckCards.map((card, index) => (
                <Card key={card.id} className="space-y-3">
                  {/* Card Header */}
                  <button
                    onClick={() => toggleCardExpand(card.id)}
                    className="w-full text-left space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-500 mb-1">Card #{index + 1}</div>
                        <div
                          className="text-gray-900 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: card.front }}
                        />
                      </div>
                      <div className="ml-3 text-primary-600">
                        {expandedCardId === card.id ? '▼' : '▶'}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {expandedCardId === card.id && (
                    <div className="space-y-4 pt-3 border-t border-gray-200 animate-slide-down">
                      {/* Answer */}
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Answer</div>
                        <div
                          className="text-gray-900 p-3 bg-gray-50 rounded-lg"
                          dangerouslySetInnerHTML={{ __html: card.back }}
                        />
                      </div>

                      {/* Notes */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-gray-700">My Notes</div>
                          {!editingNoteId && (
                            <button
                              onClick={() => handleEditNote(card.id)}
                              className="text-sm text-primary-600 font-medium"
                            >
                              {cardNotes[card.id] ? 'Edit' : '+ Add Note'}
                            </button>
                          )}
                        </div>

                        {editingNoteId === card.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={noteContent}
                              onChange={(e) => setNoteContent(e.target.value)}
                              placeholder="Add your personal notes here..."
                              className="w-full input min-h-[100px]"
                              rows={4}
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleSaveNote(card.id)}
                                className="btn-primary"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingNoteId(null);
                                  setNoteContent('');
                                }}
                                className="btn-secondary"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : cardNotes[card.id] ? (
                          <div className="p-3 bg-blue-50 rounded-lg text-gray-900">
                            {cardNotes[card.id]?.note}
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-lg text-gray-500 italic text-sm">
                            No notes yet
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
