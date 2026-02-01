import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lightbulb, ArrowLeft, ThumbsUp, AlertTriangle, BookOpen } from 'lucide-react';
import { getScenarioDetail, applyScenario, markScenarioHelpful, ScenarioDetail } from '../services/learningService';

const ScenarioDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState<ScenarioDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMarkedHelpful, setHasMarkedHelpful] = useState(false);

  useEffect(() => {
    if (id) {
      loadScenario();
    }
  }, [id]);

  const loadScenario = async () => {
    try {
      setLoading(true);
      const data = await getScenarioDetail(id!);
      setScenario(data);
    } catch (error) {
      console.error('Failed to load scenario:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      await applyScenario(id!);
      loadScenario(); // Reload to get updated usage count
    } catch (error) {
      console.error('Failed to mark as applied:', error);
    }
  };

  const handleMarkHelpful = async () => {
    try {
      await markScenarioHelpful(id!);
      setHasMarkedHelpful(true);
      loadScenario(); // Reload to get updated helpful count
    } catch (error) {
      console.error('Failed to mark as helpful:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading scenario...</p>
        </div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <Lightbulb className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Scenario not found</h2>
        <button
          onClick={() => navigate('/learning/scenarios')}
          className="text-blue-600 hover:text-blue-700"
        >
          Back to Scenarios
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/learning/scenarios')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to Scenarios
      </button>

      {/* Scenario Header */}
      <div className="bg-white rounded-lg shadow p-8 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-yellow-100 rounded-lg">
            <Lightbulb className="h-8 w-8 text-yellow-600" />
          </div>
          <div className="flex-1">
            <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800 mb-2">
              {scenario.category.replace('_', ' ')}
            </span>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{scenario.title}</h1>
            <p className="text-gray-600">{scenario.description}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm text-gray-600 mb-6">
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4" />
            <span>{scenario.helpful_count} found helpful</span>
          </div>
          <span>{scenario.usage_count} teachers applied this</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleApply}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            I Applied This
          </button>
          <button
            onClick={handleMarkHelpful}
            disabled={hasMarkedHelpful}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              hasMarkedHelpful
                ? 'bg-green-100 text-green-800 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ThumbsUp className={`h-5 w-5 ${hasMarkedHelpful ? 'fill-current' : ''}`} />
            {hasMarkedHelpful ? 'Marked as Helpful' : 'Mark as Helpful'}
          </button>
        </div>
      </div>

      {/* Situation & Context */}
      <div className="bg-white rounded-lg shadow p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">The Situation</h2>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-6">
          <p className="text-gray-800 whitespace-pre-wrap">{scenario.situation}</p>
        </div>

        {scenario.context && (
          <>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Context</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{scenario.context}</p>
          </>
        )}
      </div>

      {/* Solution Framework */}
      {scenario.solution_framework && (
        <div className="bg-white rounded-lg shadow p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Solution Framework</h2>
          {scenario.solution_framework.steps && scenario.solution_framework.steps.length > 0 && (
            <div className="space-y-6">
              {scenario.solution_framework.steps.map((step: any, index: number) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {scenario.solution_framework.key_points && scenario.solution_framework.key_points.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Points</h3>
              <ul className="space-y-2">
                {scenario.solution_framework.key_points.map((point: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Expert Tips */}
      {scenario.expert_tips && scenario.expert_tips.length > 0 && (
        <div className="bg-white rounded-lg shadow p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Expert Tips</h2>
          <div className="space-y-4">
            {scenario.expert_tips.map((tip, index) => (
              <div key={index} className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <p className="text-gray-800">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common Mistakes */}
      {scenario.common_mistakes && scenario.common_mistakes.length > 0 && (
        <div className="bg-white rounded-lg shadow p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            Common Mistakes to Avoid
          </h2>
          <div className="space-y-4">
            {scenario.common_mistakes.map((mistake, index) => (
              <div key={index} className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                <p className="text-gray-800">{mistake}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Resources */}
      {(scenario.related_modules.length > 0 || scenario.related_resources.length > 0) && (
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Related Resources
          </h2>

          {scenario.related_modules.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Learning Modules</h3>
              <div className="flex flex-wrap gap-3">
                {scenario.related_modules.map((moduleId) => (
                  <a
                    key={moduleId}
                    href={`/learning/modules/${moduleId}`}
                    className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    View Module →
                  </a>
                ))}
              </div>
            </div>
          )}

          {scenario.related_resources.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Resources</h3>
              <ul className="space-y-2">
                {scenario.related_resources.map((resource, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                    <span className="text-gray-700">{resource}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScenarioDetailPage;
