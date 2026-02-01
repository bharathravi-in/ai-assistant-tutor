import React, { useState, useEffect } from 'react';
import { Lightbulb, Search, ThumbsUp } from 'lucide-react';
import { getScenarios, ScenarioTemplate } from '../services/learningService';

const ScenariosPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  const categories = [
    { value: 'classroom_management', label: 'Classroom Management' },
    { value: 'student_behavior', label: 'Student Behavior' },
    { value: 'engagement', label: 'Engagement' },
    { value: 'differentiation', label: 'Differentiation' },
    { value: 'assessment', label: 'Assessment' },
    { value: 'parent_communication', label: 'Parent Communication' },
    { value: 'technology', label: 'Technology' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    loadScenarios();
  }, [selectedCategory, searchTerm, showFeaturedOnly]);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      const data = await getScenarios({
        category: selectedCategory || undefined,
        search: searchTerm || undefined,
        featured_only: showFeaturedOnly || undefined,
      });
      setScenarios(data);
    } catch (error) {
      console.error('Failed to load scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Classroom Scenarios</h1>
        <p className="text-gray-600">
          Real-world teaching challenges with proven solution frameworks
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search scenarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Featured Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showFeaturedOnly}
              onChange={(e) => setShowFeaturedOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Featured only</span>
          </label>
        </div>
      </div>

      {/* Scenarios List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading scenarios...</p>
          </div>
        </div>
      ) : scenarios.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Lightbulb className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No scenarios found</h3>
          <p className="text-gray-600">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="space-y-6">
          {scenarios.map((scenario) => (
            <a
              key={scenario.id}
              href={`/learning/scenarios/${scenario.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 mb-2">
                      {scenario.category.replace('_', ' ')}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {scenario.title}
                    </h3>
                  </div>
                  <Lightbulb className="h-6 w-6 text-yellow-500" />
                </div>

                {/* Description */}
                <p className="text-gray-700 mb-4">{scenario.description}</p>

                {/* Situation Preview */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Situation:</p>
                  <p className="text-sm text-gray-700 line-clamp-2">{scenario.situation}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{scenario.helpful_count} found helpful</span>
                  </div>
                  <span>{scenario.usage_count} applications</span>
                  {scenario.expert_tips && scenario.expert_tips.length > 0 && (
                    <span>{scenario.expert_tips.length} expert tips</span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScenariosPage;
