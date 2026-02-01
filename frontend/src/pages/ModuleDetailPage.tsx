import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Star, ArrowLeft, CheckCircle } from 'lucide-react';
import { getModuleDetail, updateModuleProgress, ModuleDetail } from '../services/learningService';

const ModuleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [module, setModule] = useState<ModuleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    if (id) {
      loadModule();
    }
  }, [id]);

  const loadModule = async () => {
    try {
      setLoading(true);
      const data = await getModuleDetail(id!);
      setModule(data);
      if (data.user_progress) {
        setUserRating(data.user_progress.rating || 0);
        setCompletionPercentage(data.user_progress.completion_percentage);
      }
    } catch (error) {
      console.error('Failed to load module:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (rating: number) => {
    try {
      setUserRating(rating);
      await updateModuleProgress(id!, { rating });
      loadModule(); // Reload to get updated average rating
    } catch (error) {
      console.error('Failed to update rating:', error);
    }
  };

  const handleToggleBookmark = async () => {
    try {
      const newBookmarkState = !module?.user_progress?.is_bookmarked;
      await updateModuleProgress(id!, { is_bookmarked: newBookmarkState });
      loadModule();
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const handleMarkComplete = async () => {
    try {
      await updateModuleProgress(id!, {
        is_completed: true,
        completion_percentage: 100,
      });
      loadModule();
    } catch (error) {
      console.error('Failed to mark as complete:', error);
    }
  };

  const handleUpdateProgress = async (percentage: number) => {
    try {
      setCompletionPercentage(percentage);
      await updateModuleProgress(id!, { completion_percentage: percentage });
      if (percentage === 100) {
        await updateModuleProgress(id!, { is_completed: true });
      }
      loadModule();
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => interactive && handleRating(star)}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading module...</p>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Module not found</h2>
        <button
          onClick={() => navigate('/learning')}
          className="text-blue-600 hover:text-blue-700"
        >
          Back to Learning Library
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/learning')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to Library
      </button>

      {/* Module Header */}
      <div className="bg-white rounded-lg shadow p-8 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800 mb-3">
              {module.category}
            </span>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{module.title}</h1>
            <p className="text-gray-600 mb-4">{module.description}</p>
          </div>
          <button
            onClick={handleToggleBookmark}
            className={`p-2 rounded-full transition-colors ${
              module.user_progress?.is_bookmarked
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Star
              className={`h-6 w-6 ${
                module.user_progress?.is_bookmarked ? 'fill-current' : ''
              }`}
            />
          </button>
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-400" />
            <span className="text-gray-700">{module.duration_minutes} minutes</span>
          </div>
          <div className="flex items-center gap-2">
            {renderStars(module.average_rating)}
            <span className="text-gray-700">
              {module.average_rating.toFixed(1)} ({module.rating_count} ratings)
            </span>
          </div>
          <span className="text-gray-600">{module.views} views</span>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Your Progress</span>
            <span className="text-sm font-semibold text-gray-900">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={completionPercentage}
            onChange={(e) => handleUpdateProgress(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!module.user_progress?.is_completed && (
            <button
              onClick={handleMarkComplete}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="h-5 w-5" />
              Mark as Complete
            </button>
          )}
          {module.user_progress?.is_completed && (
            <div className="flex items-center gap-2 px-6 py-3 bg-green-100 text-green-800 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              Completed
            </div>
          )}
        </div>

        {/* Rate this module */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Rate this module:</p>
          {renderStars(userRating, true)}
          {userRating > 0 && (
            <p className="text-sm text-gray-600 mt-1">You rated this module {userRating} stars</p>
          )}
        </div>
      </div>

      {/* Module Content */}
      <div className="bg-white rounded-lg shadow p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Module Content</h2>
        {module.content.sections && module.content.sections.length > 0 ? (
          <div className="space-y-6">
            {module.content.sections.map((section: any, index: number) => (
              <div key={index} className="border-l-4 border-blue-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{section.title}</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{section.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">Content will be available soon.</p>
        )}
      </div>

      {/* Additional Info */}
      {(module.prerequisites.length > 0 || module.related_modules.length > 0) && (
        <div className="bg-white rounded-lg shadow p-8">
          {module.prerequisites.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Prerequisites</h3>
              <ul className="list-disc list-inside space-y-1">
                {module.prerequisites.map((prereq, index) => (
                  <li key={index} className="text-gray-700">
                    {prereq}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {module.related_modules.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Related Modules</h3>
              <div className="flex flex-wrap gap-2">
                {module.related_modules.map((relatedId) => (
                  <a
                    key={relatedId}
                    href={`/learning/modules/${relatedId}`}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    View Module
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModuleDetailPage;
