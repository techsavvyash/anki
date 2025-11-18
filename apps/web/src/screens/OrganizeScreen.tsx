import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { useOrganizationStore } from '../store/useOrganizationStore';
import { SUBJECT_COLORS } from '@anki/constants';

export default function OrganizeScreen() {
  const { subjects, topics, isLoading, fetchSubjects, fetchTopics, createSubject, createTopic } =
    useOrganizationStore();

  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState<string>(SUBJECT_COLORS[0]);
  const [newTopicName, setNewTopicName] = useState('');

  useEffect(() => {
    fetchSubjects();
    fetchTopics();
  }, [fetchSubjects, fetchTopics]);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    try {
      await createSubject(newSubjectName, newSubjectColor);
      setNewSubjectName('');
      setNewSubjectColor(SUBJECT_COLORS[0]);
      setShowSubjectForm(false);
    } catch (error) {
      console.error('Failed to create subject:', error);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim() || !selectedSubjectId) return;

    try {
      await createTopic(newTopicName, selectedSubjectId);
      setNewTopicName('');
      setShowTopicForm(false);
      setSelectedSubjectId(null);
    } catch (error) {
      console.error('Failed to create topic:', error);
    }
  };

  const getTopicsForSubject = (subjectId: string) => {
    return topics.filter((topic) => topic.subject_id === subjectId);
  };

  return (
    <Layout title="Organize">
      <div className="container-mobile py-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Organization</h2>
          <p className="text-gray-600">
            Organize your decks into subjects and topics for better learning structure
          </p>
        </div>

        {/* Create Subject Button */}
        <button
          onClick={() => setShowSubjectForm(!showSubjectForm)}
          className="w-full btn-primary"
        >
          {showSubjectForm ? 'Cancel' : '+ Create Subject'}
        </button>

        {/* Create Subject Form */}
        {showSubjectForm && (
          <Card className="space-y-4 animate-slide-down">
            <h3 className="font-semibold text-gray-900">New Subject</h3>
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g., Languages, Science, Mathematics"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {SUBJECT_COLORS.map((color: string) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewSubjectColor(color)}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        newSubjectColor === color
                          ? 'ring-2 ring-offset-2 ring-gray-900 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full btn-primary" disabled={isLoading}>
                {isLoading ? <LoadingSpinner size="sm" /> : 'Create Subject'}
              </button>
            </form>
          </Card>
        )}

        {/* Subjects List */}
        {isLoading ? (
          <LoadingSpinner size="lg" className="h-64" />
        ) : subjects.length === 0 ? (
          <Card className="text-center py-12 space-y-3">
            <div className="text-5xl">📁</div>
            <h3 className="font-semibold text-gray-900">No Subjects Yet</h3>
            <p className="text-gray-600">Create your first subject to get organized</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {subjects.map((subject) => {
              const subjectTopics = getTopicsForSubject(subject.id);
              return (
                <Card key={subject.id} className="space-y-4">
                  {/* Subject Header */}
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                    <h3 className="flex-1 font-semibold text-gray-900">{subject.name}</h3>
                    <button
                      onClick={() => {
                        setSelectedSubjectId(subject.id);
                        setShowTopicForm(true);
                      }}
                      className="text-sm text-primary-600 font-medium hover:text-primary-700"
                    >
                      + Topic
                    </button>
                  </div>

                  {/* Topics */}
                  {subjectTopics.length > 0 ? (
                    <div className="pl-7 space-y-2">
                      {subjectTopics.map((topic) => (
                        <div
                          key={topic.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="text-gray-900">{topic.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pl-7 text-sm text-gray-500 italic">
                      No topics yet
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Create Topic Modal/Form */}
        {showTopicForm && selectedSubjectId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md space-y-4 animate-slide-up">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">New Topic</h3>
                <button
                  onClick={() => {
                    setShowTopicForm(false);
                    setSelectedSubjectId(null);
                    setNewTopicName('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTopic} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic Name
                  </label>
                  <input
                    type="text"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    placeholder="e.g., Spanish, Biology, Algebra"
                    className="input"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTopicForm(false);
                      setSelectedSubjectId(null);
                      setNewTopicName('');
                    }}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 btn-primary" disabled={isLoading}>
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Create Topic'}
                  </button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
