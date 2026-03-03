/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AI SCORE CARD - Animated School AI Health Score Display
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState } from 'react';
import { Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const AIScoreCard = ({ score = 0, isLoading = false, previousScore = 75, breakdown = {} }) => {
  const [displayScore, setDisplayScore] = useState(0);
  const scoreDiff = score - previousScore;
  
  // Animate score on load
  useEffect(() => {
    if (isLoading) return;
    
    let start = 0;
    const end = score;
    const duration = 1500;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentScore = Math.round(start + (end - start) * easeOutQuart);
      
      setDisplayScore(currentScore);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, [score, isLoading]);

  // Get score status and colors
  const getScoreStatus = (score) => {
    if (score >= 80) return { status: 'Excellent', color: 'from-green-500 to-emerald-600', textColor: 'text-green-500' };
    if (score >= 60) return { status: 'Good', color: 'from-blue-500 to-cyan-600', textColor: 'text-blue-500' };
    if (score >= 40) return { status: 'Average', color: 'from-yellow-500 to-orange-500', textColor: 'text-yellow-500' };
    return { status: 'Needs Attention', color: 'from-red-500 to-pink-600', textColor: 'text-red-500' };
  };

  const { status, color, textColor } = getScoreStatus(score);

  // Calculate circle progress
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5`} />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shadow-lg`}>
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">School AI Score</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Overall health</p>
          </div>
        </div>
        
        {/* Trend Indicator */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
          scoreDiff > 0 ? 'bg-green-100 dark:bg-green-900/30' :
          scoreDiff < 0 ? 'bg-red-100 dark:bg-red-900/30' :
          'bg-gray-100 dark:bg-gray-700'
        }`}>
          {scoreDiff > 0 ? (
            <>
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-600">+{scoreDiff}</span>
            </>
          ) : scoreDiff < 0 ? (
            <>
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium text-red-600">{scoreDiff}</span>
            </>
          ) : (
            <>
              <Minus className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500">0</span>
            </>
          )}
        </div>
      </div>

      {/* Score Circle */}
      <div className="flex justify-center py-4 relative">
        <div className="relative w-44 h-44">
          {/* Background Circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="88"
              cy="88"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress Circle */}
            <circle
              cx="88"
              cy="88"
              r="70"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={isLoading ? circumference : strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
            {/* Gradient Definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Score Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isLoading ? (
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {displayScore}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">out of 100</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center mt-2 relative">
        <span className={`text-lg font-semibold ${textColor}`}>
          {status}
        </span>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Based on 24 AI metrics
        </p>
      </div>

      {/* Score Breakdown Preview */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 relative">
        {[
          { label: 'Academic', value: breakdown.attendanceScore || 82 },
          { label: 'Finance', value: breakdown.feeScore || 75 },
          { label: 'Operations', value: breakdown.baseScore || 78 }
        ].map((item, index) => (
          <div key={index} className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}%</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIScoreCard;
