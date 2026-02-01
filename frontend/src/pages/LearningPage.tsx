import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Star, Filter, Search } from 'lucide-react';
import { getLearningModules, LearningModule } from '../services/learningService';

const LearningPage: React.FC = () => {
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  const categories = [
    { value: 'pedagogy', label: 'Pedagogy' },
    { value: 'classroom_management', label: 'Classroom Management' },
    { value: 'subject_specific', label: 'Subject Specific' },
    { value: 'technology_integration', label: 'Technology' },
    { value: 'assessment', label: 'Assessment' },
    { value: 'student_engagement', label: 'Student Engagement' },
    { value: 'differentiation', label: 'Differentiation' },
    { value: 'professional_growth', label: 'Professional Growth' },
  ];

  const difficulties = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  useEffect(() => {
    loadModules();
  }, [selectedCategory, selectedDifficulty, searchTerm, showFeaturedOnly]);

  const loadModules = async () => {
    try {
      setLoading(true);
      const data = await getLearningModules({
        category: selectedCategory || undefined,
        difficulty: selectedDifficulty || undefined,
        search: searchTerm || undefined,
        featured_only: showFeaturedOnly || undefined,
      });
      setModules(data);
    } catch (error) {
      console.error('Failed to load modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800',
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Library</h1>
        <p className="text-gray-600">Explore coaching modules to enhance your teaching practice</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search modules..."
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

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Levels</option>
            {difficulties.map((diff) => (
              <option key={diff.value} value={diff.value}>
                {diff.label}
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

      {/* Modules Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading modules...</p>
          </div>
        </div>
      ) : modules.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No modules found</h3>
          <p className="text-gray-600">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <a
              key={module.id}
              href={`/learning/modules/${module.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(
                      module.difficulty
                    )}`}
                  >
                    {module.difficulty}
                  </span>
                  {module.user_progress?.is_bookmarked && (
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  )}
                </div>

                {/* Title & Description */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {module.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{module.description}</p>

                {/* Meta Info */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{module.duration_minutes} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {renderStars(module.average_rating)}
                    <span className="ml-1">({module.rating_count})</span>
                  </div>
                </div>

                {/* Progress Bar */}
                {module.user_progress && module.user_progress.completion_percentage > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Progress</span>
                      <span className="text-xs font-semibold text-gray-900">
                        {module.user_progress.completion_percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${module.user_progress.completion_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {module.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {module.tags.length > 3 && (
                    <span className="px-2 py-1 text-xs text-gray-500">
                      +{module.tags.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Stats Footer */}
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between text-xs text-gray-600 border-t border-gray-100">
                <span>{module.views} views</span>
                <span>{module.completions} completions</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearningPage;
