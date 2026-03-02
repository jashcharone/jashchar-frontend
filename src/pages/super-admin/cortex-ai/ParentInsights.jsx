/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PARENT INSIGHTS - Live Child Daily Insights for Parents
 * "India's First Thinking ERP - Cortex AI"
 * ═══════════════════════════════════════════════════════════════════════════════
 * Features:
 * - Daily activity summary
 * - Mood/behavior tracking
 * - Learning progress feed
 * - Teacher remarks summary
 */

import React, { useState, useEffect } from 'react';
import { 
  Baby, Calendar, Heart, BookOpen, Award, Clock,
  Smile, Frown, Meh, Activity, MessageCircle, RefreshCw,
  Camera, Bus, Utensils, Moon, Sun, CloudSun, CirclePause
} from 'lucide-react';
import api from '@/services/api';
import { formatDate, formatTime } from '@/utils/dateUtils';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ParentInsights = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [insights, setInsights] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]);

  useEffect(() => {
    fetchInsights();
  }, [selectedDate]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const [insightsRes, feedRes] = await Promise.all([
        api.get(`/cortex/parent/insights/all?date=${selectedDate}`),
        api.get('/cortex/parent/activity-feed')
      ]);
      setInsights(insightsRes.data.data);
      setActivityFeed(feedRes.data.data || []);
    } catch (error) {
      console.error('Error fetching insights:', error);
      // Mock data
      setInsights({
        studentName: 'Arjun Kumar',
        class: '5th A',
        date: selectedDate,
        mood: 'happy',
        overallScore: 85,
        attendance: { status: 'present', checkIn: '08:45 AM', checkOut: '03:30 PM' },
        subjects: [
          { name: 'Math', participation: 5, homework: 'completed', remark: 'Excellent problem solving' },
          { name: 'Science', participation: 4, homework: 'completed', remark: 'Active in experiments' },
          { name: 'English', participation: 3, homework: 'pending', remark: 'Needs practice in grammar' }
        ],
        meals: { breakfast: true, lunch: true },
        transport: { pickup: '08:15 AM', drop: '04:00 PM' },
        teacherRemarks: [
          { teacher: 'Mrs. Sharma', subject: 'Math', remark: 'Very attentive today, solved all problems correctly' },
          { teacher: 'Mr. Reddy', subject: 'Science', remark: 'Participated well in the plant cell experiment' }
        ],
        highlights: [
          { type: 'achievement', text: 'Got star of the day in Math class' },
          { type: 'activity', text: 'Participated in story telling session' }
        ]
      });
      setActivityFeed([
        { id: 1, time: '08:45', type: 'attendance', message: 'Arjun checked in to school', icon: 'check' },
        { id: 2, time: '09:30', type: 'class', message: 'Math class started - Topic: Fractions', icon: 'book' },
        { id: 3, time: '10:15', type: 'achievement', message: 'Received "Star of the Day" badge', icon: 'star' },
        { id: 4, time: '11:00', type: 'break', message: 'Morning break - Snacks consumed', icon: 'coffee' },
        { id: 5, time: '12:30', type: 'lunch', message: 'Lunch break - Full meal consumed', icon: 'utensils' },
        { id: 6, time: '14:00', type: 'class', message: 'Science practical - Plant cell observation', icon: 'microscope' },
        { id: 7, time: '15:30', type: 'attendance', message: 'Arjun checked out from school', icon: 'check' }
      ]);
    }
    setLoading(false);
  };

  const getMoodIcon = (mood) => {
    if (mood === 'happy') return <Smile className="w-8 h-8 text-green-400" />;
    if (mood === 'sad') return <Frown className="w-8 h-8 text-red-400" />;
    return <Meh className="w-8 h-8 text-yellow-400" />;
  };

  const getMoodColor = (mood) => {
    if (mood === 'happy') return 'bg-green-500/20 border-green-500/30 text-green-400';
    if (mood === 'sad') return 'bg-red-500/20 border-red-500/30 text-red-400';
    return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400';
  };

  const getParticipationStars = (level) => {
    return Array(5).fill(0).map((_, idx) => (
      <span key={idx} className={idx < level ? 'text-yellow-400' : 'text-gray-600'}>★</span>
    ));
  };

  const getTimeIcon = (time) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 12) return <Sun className="w-4 h-4 text-yellow-400" />;
    if (hour < 17) return <CloudSun className="w-4 h-4 text-orange-400" />;
    return <Moon className="w-4 h-4 text-blue-400" />;
  };

  const getActivityIcon = (type) => {
    const icons = {
      attendance: Activity,
      class: BookOpen,
      achievement: Award,
      break: CirclePause,
      lunch: Utensils,
      transport: Bus
    };
    return icons[type] || Activity;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-violet-600/20 flex items-center justify-center animate-pulse">
            <Baby className="w-6 h-6 text-violet-400" />
          </div>
          <p className="text-gray-400">Loading child insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-pink-600 rounded-xl flex items-center justify-center">
            <Baby className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Child Daily Insights</h1>
            <p className="text-sm text-gray-400">Activity Feed ≫ Mood Tracking ≫ Teacher Remarks</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
          />
          <button 
            onClick={fetchInsights}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Student Info Card */}
      <div className="bg-gradient-to-br from-violet-600/20 to-pink-600/20 rounded-2xl border border-violet-500/30 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-white text-2xl font-bold">
              {insights?.studentName?.charAt(0) || 'S'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{insights?.studentName}</h2>
              <p className="text-gray-400">{insights?.class} • {formatDate(insights?.date)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Mood */}
            <div className={`px-4 py-3 rounded-xl border ${getMoodColor(insights?.mood)}`}>
              <div className="flex items-center gap-2">
                {getMoodIcon(insights?.mood)}
                <div>
                  <p className="text-sm text-gray-400">Today's Mood</p>
                  <p className="font-medium capitalize">{insights?.mood}</p>
                </div>
              </div>
            </div>

            {/* Overall Score */}
            <div className="px-4 py-3 rounded-xl bg-blue-500/20 border border-blue-500/30">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-400">{insights?.overallScore}%</p>
                <p className="text-sm text-gray-400">Day Score</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Attendance */}
        <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              insights?.attendance?.status === 'present' ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              <Activity className={`w-5 h-5 ${
                insights?.attendance?.status === 'present' ? 'text-green-400' : 'text-red-400'
              }`} />
            </div>
            <div>
              <p className="text-white font-medium">Attendance</p>
              <p className={`text-sm capitalize ${
                insights?.attendance?.status === 'present' ? 'text-green-400' : 'text-red-400'
              }`}>
                {insights?.attendance?.status}
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <p>Check-in: {insights?.attendance?.checkIn}</p>
            <p>Check-out: {insights?.attendance?.checkOut}</p>
          </div>
        </div>

        {/* Transport */}
        <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Bus className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-medium">Transport</p>
              <p className="text-sm text-blue-400">On Schedule</p>
            </div>
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <p>Pickup: {insights?.transport?.pickup}</p>
            <p>Drop: {insights?.transport?.drop}</p>
          </div>
        </div>

        {/* Meals */}
        <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Utensils className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-white font-medium">Meals</p>
              <p className="text-sm text-orange-400">All Consumed</p>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <span className={`px-2 py-1 rounded text-xs ${
              insights?.meals?.breakfast ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
            }`}>Breakfast ✓</span>
            <span className={`px-2 py-1 rounded text-xs ${
              insights?.meals?.lunch ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
            }`}>Lunch ✓</span>
          </div>
        </div>

        {/* Highlights */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-white font-medium">Highlights</p>
              <p className="text-sm text-yellow-400">{insights?.highlights?.length || 0} today</p>
            </div>
          </div>
          {insights?.highlights?.slice(0, 1).map((h, idx) => (
            <p key={idx} className="text-xs text-gray-300 truncate">{h.text}</p>
          ))}
        </div>
      </div>

      {/* Subject Progress & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Progress */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-400" />
            Subject Progress Today
          </h3>
          <div className="space-y-4">
            {insights?.subjects?.map((subject, idx) => (
              <div key={idx} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{subject.name}</span>
                  <div className="flex items-center gap-1">
                    {getParticipationStars(subject.participation)}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className={`px-2 py-0.5 rounded ${
                    subject.homework === 'completed' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    HW: {subject.homework}
                  </span>
                </div>
                {subject.remark && (
                  <p className="text-gray-400 text-sm mt-2 italic">"{subject.remark}"</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Activity Timeline
          </h3>
          <div className="space-y-0">
            {activityFeed.map((activity, idx) => {
              const ActivityIcon = getActivityIcon(activity.type);
              return (
                <div key={activity.id} className="relative pl-8 pb-4">
                  {/* Timeline line */}
                  {idx < activityFeed.length - 1 && (
                    <div className="absolute left-3.5 top-6 w-0.5 h-full bg-gray-700" />
                  )}
                  {/* Timeline dot */}
                  <div className="absolute left-1 top-1 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  {/* Content */}
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 min-w-[60px]">
                      {getTimeIcon(activity.time)}
                      <span className="text-gray-400 text-sm">{activity.time}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{activity.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Teacher Remarks */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-pink-400" />
          Teacher Remarks
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights?.teacherRemarks?.map((remark, idx) => (
            <div key={idx} className="p-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                  <span className="text-pink-400 font-medium">
                    {remark.teacher.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">{remark.teacher}</p>
                  <p className="text-gray-400 text-sm">{remark.subject}</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm italic">"{remark.remark}"</p>
            </div>
          ))}
        </div>
      </div>

      {/* Photo Gallery (Placeholder) */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-cyan-400" />
          Today's Photos
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square bg-gray-700/50 rounded-lg flex items-center justify-center border border-gray-600">
              <Camera className="w-8 h-8 text-gray-500" />
            </div>
          ))}
        </div>
        <p className="text-gray-500 text-sm mt-3 text-center">Photos from classes and activities will appear here</p>
      </div>
    </div>
  );
};

// Coffee icon placeholder
const Coffee = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />
  </svg>
);

export default ParentInsights;
