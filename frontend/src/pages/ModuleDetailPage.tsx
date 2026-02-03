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
      const data = await getModuleDetail(parseInt(id!));
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
      await updateModuleProgress(parseInt(id!), { rating });
      loadModule(); // Reload to get updated average rating
    } catch (error) {
      console.error('Failed to update rating:', error);
    }
  };

  const handleToggleBookmark = async () => {
    try {
      const newBookmarkState = !module?.user_progress?.is_bookmarked;
      await updateModuleProgress(parseInt(id!), { is_bookmarked: newBookmarkState });
      loadModule();
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const handleMarkComplete = async () => {
    try {
      await updateModuleProgress(parseInt(id!), {
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
      await updateModuleProgress(parseInt(id!), { completion_percentage: percentage });
      if (percentage === 100) {
        await updateModuleProgress(parseInt(id!), { is_completed: true });
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
            className={`h-5 w-5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
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
    <div className="min-h-screen bg-slate-50 dark:bg-black transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Back Button */}
        <button
          onClick={() => navigate('/content/browse')}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-8 group transition-all"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">Back to Library</span>
        </button>

        {/* Module Header */}
        <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-3xl p-8 mb-8 shadow-xl">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <span className="inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-500/20 mb-4">
                {module.category}
              </span>
              <h1 className="text-4xl font-black text-zinc-900 dark:text-white leading-tight mb-4 tracking-tighter">
                {module.title}
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed max-w-2xl">
                {module.description}
              </p>
            </div>
            <button
              onClick={handleToggleBookmark}
              className={`p-3 rounded-2xl border transition-all ${module.user_progress?.is_bookmarked
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 shadow-gold/20'
                : 'bg-zinc-50 dark:bg-black border-zinc-200 dark:border-white/10 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                }`}
            >
              <Star
                className={`h-6 w-6 ${module.user_progress?.is_bookmarked ? 'fill-current' : ''
                  }`}
              />
            </button>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-6 mb-8 py-6 border-y border-zinc-100 dark:border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Duration</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">{module.duration_minutes} mins</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-400">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Rating</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">{module.rating_avg.toFixed(1)}</span>
                  {renderStars(module.rating_avg)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Views</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">{module.view_count.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="bg-zinc-50 dark:bg-black/40 rounded-3xl p-6 border border-zinc-100 dark:border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">Your Learning Progress</h3>
              <span className="text-lg font-black text-yellow-600 dark:text-yellow-500">{completionPercentage}%</span>
            </div>

            <div className="relative h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-6">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-gold transition-all duration-1000"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={completionPercentage}
                onChange={(e) => handleUpdateProgress(Number(e.target.value))}
                className="w-full sm:flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
              <div className="flex gap-3 shrink-0">
                {!module.user_progress?.is_completed ? (
                  <button
                    onClick={handleMarkComplete}
                    className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-black rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-yellow-500/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Complete
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-6 py-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl font-black text-xs uppercase tracking-widest border border-emerald-500/20">
                    <CheckCircle className="h-4 w-4" />
                    Finished
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Module Content Grid */}
        <div className="grid grid-cols-1 gap-8 mb-10">
          <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-3xl p-8 shadow-xl">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
              <div className="w-1.5 h-8 bg-yellow-500 rounded-full" />
              Curriculum Details
            </h2>

            {module.content.sections && module.content.sections.length > 0 ? (
              <div className="space-y-12">
                {module.content.sections.map((section: any, index: number) => (
                  <div key={index} className="relative pl-8 group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-100 dark:bg-zinc-800 rounded-full group-hover:bg-yellow-500/50 transition-colors" />
                    <div className="absolute -left-[5px] top-1.5 w-3.5 h-3.5 rounded-full bg-white dark:bg-black border-2 border-zinc-200 dark:border-zinc-700 group-hover:border-yellow-500 transition-colors" />

                    <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors">
                      {section.title}
                    </h3>
                    <div className="prose dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed text-base">
                      {section.content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-zinc-100 dark:border-white/5 rounded-3xl">
                <BookOpen className="w-12 h-12 text-zinc-200 dark:text-zinc-800 mx-auto mb-4" />
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Full content coming soon</p>
              </div>
            )}
          </div>

          {/* Additional Info Cards */}
          {(module.prerequisites && module.prerequisites.length > 0 || module.related_modules && module.related_modules.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {module.prerequisites && module.prerequisites.length > 0 && (
                <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-3xl p-8 shadow-xl">
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-zinc-400" />
                    Prerequisites
                  </h3>
                  <ul className="space-y-3">
                    {module.prerequisites.map((prereq, index) => (
                      <li key={index} className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                        {prereq}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {module.related_modules && module.related_modules.length > 0 && (
                <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-3xl p-8 shadow-xl">
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Star className="w-4 h-4 text-zinc-400" />
                    Related Path
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {module.related_modules.map((relatedId) => (
                      <button
                        key={relatedId}
                        onClick={() => navigate(`/learning/modules/${relatedId}`)}
                        className="px-4 py-2 bg-zinc-50 dark:bg-black text-zinc-600 dark:text-zinc-400 rounded-xl border border-zinc-200 dark:border-white/10 text-xs font-black uppercase tracking-widest hover:bg-yellow-500 hover:text-black hover:border-yellow-500 transition-all"
                      >
                        Launch Module
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Rating */}
        <div className="bg-zinc-900 dark:bg-zinc-900/80 border border-white/5 rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Star className="w-32 h-32 text-yellow-500" />
          </div>
          <p className="text-yellow-500 text-xs font-black uppercase tracking-[0.3em] mb-4">Your Feedback Matters</p>
          <h3 className="text-2xl font-black text-white mb-6 tracking-tight">How would you rate this learning experience?</h3>
          <div className="flex justify-center mb-6">
            {renderStars(userRating, true)}
          </div>
          {userRating > 0 && (
            <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest animate-pulse">
              You've rated this {userRating} stars. Thank you!
            </p>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .shadow-gold {
          box-shadow: 0 4px 20px -2px rgba(234, 179, 8, 0.4);
        }
      `}} />
    </div>
  );
};

export default ModuleDetailPage;
