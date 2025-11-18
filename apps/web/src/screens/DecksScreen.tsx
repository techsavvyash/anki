import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { useDecksStore } from '../store/useDecksStore';

export default function DecksScreen() {
  const navigate = useNavigate();
  const { decks, isLoading, fetchDecks } = useDecksStore();

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  return (
    <Layout title="Decks">
      <div className="container-mobile py-6">
        {isLoading ? (
          <LoadingSpinner size="lg" className="h-64" />
        ) : decks.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl">📚</div>
            <h2 className="text-xl font-semibold text-gray-900">No Decks Yet</h2>
            <p className="text-gray-600">Upload an .apkg file to get started</p>
            <button
              onClick={() => navigate('/upload')}
              className="btn-primary mx-auto"
            >
              Upload Deck
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                All Decks ({decks.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {decks.map((deck) => (
                <Card
                  key={deck.id}
                  interactive
                  onClick={() => navigate(`/decks/${deck.id}`)}
                  className="space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {deck.name}
                      </h3>
                      {deck.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                          {deck.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Cards: <span className="font-medium text-gray-900">0</span>
                    </span>
                    <span className="text-primary-600 font-medium">
                      View →
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
