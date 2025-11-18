import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { useUserStore } from '../store/useUserStore';
import { useReviewStore } from '../store/useReviewStore';

export default function HomeScreen() {
  const navigate = useNavigate();
  const { initializeUser, isLoading: userLoading } = useUserStore();
  const { dueCards, fetchDueCards, isLoading: reviewLoading } = useReviewStore();

  useEffect(() => {
    const init = async () => {
      await initializeUser();
      await fetchDueCards();
    };
    init();
  }, [initializeUser, fetchDueCards]);

  if (userLoading) {
    return (
      <Layout>
        <LoadingSpinner size="lg" className="h-full" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-mobile py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Anki Flashcards</h1>
          <p className="text-gray-600">Spaced Repetition Learning</p>
        </div>

        {/* Due Cards Stats */}
        <Card className="text-center space-y-3">
          {reviewLoading ? (
            <LoadingSpinner size="lg" />
          ) : (
            <>
              <div className="text-6xl font-bold text-primary-600">
                {dueCards.length}
              </div>
              <div className="text-lg text-gray-600">Cards Due Today</div>
            </>
          )}
        </Card>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            interactive
            onClick={() => navigate('/review')}
            className="text-center space-y-3 bg-gradient-to-br from-primary-50 to-primary-100"
          >
            <div className="text-4xl">🎯</div>
            <div className="font-semibold text-gray-900">Start Review</div>
            <div className="text-sm text-gray-600">Study due cards now</div>
          </Card>

          <Card
            interactive
            onClick={() => navigate('/decks')}
            className="text-center space-y-3 bg-gradient-to-br from-blue-50 to-blue-100"
          >
            <div className="text-4xl">📚</div>
            <div className="font-semibold text-gray-900">Browse Decks</div>
            <div className="text-sm text-gray-600">View all your decks</div>
          </Card>

          <Card
            interactive
            onClick={() => navigate('/upload')}
            className="text-center space-y-3 bg-gradient-to-br from-green-50 to-green-100"
          >
            <div className="text-4xl">⬆️</div>
            <div className="font-semibold text-gray-900">Upload Deck</div>
            <div className="text-sm text-gray-600">Import .apkg files</div>
          </Card>

          <Card
            interactive
            onClick={() => navigate('/organize')}
            className="text-center space-y-3 bg-gradient-to-br from-purple-50 to-purple-100"
          >
            <div className="text-4xl">📁</div>
            <div className="font-semibold text-gray-900">Organize</div>
            <div className="text-sm text-gray-600">Manage subjects & topics</div>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {reviewLoading ? '...' : dueCards.length}
            </div>
            <div className="text-sm text-gray-600">Due Today</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-sm text-gray-600">Studied Today</div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
