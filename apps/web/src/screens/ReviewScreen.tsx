import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { useReviewStore } from '../store/useReviewStore';

const qualityButtons = [
  { quality: 0, label: 'Again', color: 'bg-red-600 hover:bg-red-700', description: 'Complete blackout' },
  { quality: 1, label: 'Hard', color: 'bg-orange-600 hover:bg-orange-700', description: 'Incorrect, but remembered' },
  { quality: 3, label: 'Good', color: 'bg-green-600 hover:bg-green-700', description: 'Correct, some hesitation' },
  { quality: 5, label: 'Easy', color: 'bg-blue-600 hover:bg-blue-700', description: 'Perfect recall' },
];

export default function ReviewScreen() {
  const navigate = useNavigate();
  const {
    dueCards,
    currentCard,
    currentCardIndex,
    showAnswer,
    isLoading,
    fetchDueCards,
    submitReview,
    toggleAnswer,
    resetReview,
  } = useReviewStore();

  useEffect(() => {
    fetchDueCards();
    return () => resetReview();
  }, [fetchDueCards, resetReview]);

  const handleQualitySelect = async (quality: number) => {
    await submitReview(quality);
  };

  if (isLoading) {
    return (
      <Layout title="Review">
        <LoadingSpinner size="lg" className="h-full" />
      </Layout>
    );
  }

  if (dueCards.length === 0) {
    return (
      <Layout title="Review">
        <div className="container-mobile h-full flex items-center justify-center">
          <div className="text-center space-y-4 py-12">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900">All Caught Up!</h2>
            <p className="text-gray-600">No cards due for review right now</p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary mx-auto"
            >
              Back to Home
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!currentCard) {
    return (
      <Layout title="Review">
        <div className="container-mobile h-full flex items-center justify-center">
          <div className="text-center space-y-4 py-12">
            <div className="text-6xl">✅</div>
            <h2 className="text-2xl font-bold text-gray-900">Review Complete!</h2>
            <p className="text-gray-600">
              You've reviewed {dueCards.length} card{dueCards.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary mx-auto"
            >
              Back to Home
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Review" showBackButton>
      <div className="container-mobile h-full flex flex-col py-6">
        {/* Progress indicator */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Card {currentCardIndex + 1} of {dueCards.length}</span>
            <span>{Math.round(((currentCardIndex) / dueCards.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentCardIndex) / dueCards.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Flashcard */}
        <div className="flex-1 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col justify-center items-center p-6 sm:p-8 lg:p-12 space-y-6">
            {/* Question */}
            <div className="w-full text-center space-y-2">
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Question
              </div>
              <div
                className="text-xl sm:text-2xl lg:text-3xl font-medium text-gray-900 break-words"
                dangerouslySetInnerHTML={{ __html: currentCard.front }}
              />
            </div>

            {/* Divider */}
            {showAnswer && (
              <div className="w-full border-t-2 border-dashed border-gray-300" />
            )}

            {/* Answer */}
            {showAnswer && (
              <div className="w-full text-center space-y-2 animate-slide-up">
                <div className="text-sm font-medium text-primary-600 uppercase tracking-wide">
                  Answer
                </div>
                <div
                  className="text-xl sm:text-2xl lg:text-3xl font-medium text-gray-900 break-words"
                  dangerouslySetInnerHTML={{ __html: currentCard.back }}
                />
              </div>
            )}
          </Card>

          {/* Action buttons */}
          <div className="mt-6 space-y-3">
            {!showAnswer ? (
              <button
                onClick={toggleAnswer}
                className="w-full btn-primary text-lg py-4"
              >
                Show Answer
              </button>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {qualityButtons.map(({ quality, label, color, description }) => (
                  <button
                    key={quality}
                    onClick={() => handleQualitySelect(quality)}
                    className={`${color} text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={isLoading}
                  >
                    <div className="text-base font-bold">{label}</div>
                    <div className="text-xs opacity-90 mt-1 hidden sm:block">
                      {description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
