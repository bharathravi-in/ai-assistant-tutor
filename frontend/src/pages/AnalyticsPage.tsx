import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, BookOpen, MessageSquare, Calendar } from 'lucide-react';
import { getTeacherUsageStats, getContentEngagement, UsageStats, ContentEngagement } from '../services/analyticsService';

const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [engagement, setEngagement] = useState<ContentEngagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usageData, engagementData] = await Promise.all([
        getTeacherUsageStats(period),
        getContentEngagement()
      ]);
      setStats(usageData);
      setEngagement(engagementData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">My Analytics</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {stats && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Queries</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_queries}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Content Created</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.content_created}</p>
                </div>
                <BookOpen className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Chat Messages</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.chat.messages}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.reflections.success_rate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Queries by Mode */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Queries by Mode</h2>
            <div className="space-y-3">
              {Object.entries(stats.queries_by_mode).map(([mode, count]) => (
                <div key={mode} className="flex items-center justify-between">
                  <span className="text-gray-700 capitalize">{mode}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-64 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(count / stats.total_queries) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-900 font-semibold w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Subjects */}
          {stats.top_subjects.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Most Used Subjects</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {stats.top_subjects.map((subject) => (
                  <div key={subject.subject} className="border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-700 font-medium">{subject.subject}</p>
                    <p className="text-2xl font-bold text-blue-600">{subject.count}</p>
                    <p className="text-sm text-gray-500">queries</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reflections */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reflections Summary</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{stats.reflections.total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{stats.reflections.worked}</p>
                <p className="text-sm text-gray-600">Worked</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{stats.reflections.not_worked}</p>
                <p className="text-sm text-gray-600">Not Worked</p>
              </div>
            </div>
          </div>
        </>
      )}

      {engagement && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Content</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Views</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Likes</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Downloads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {engagement.recent_content.map((content) => (
                  <tr key={content.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{content.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{content.type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        content.status === 'approved' ? 'bg-green-100 text-green-800' :
                        content.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {content.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{content.views}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{content.likes}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{content.downloads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
