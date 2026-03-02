/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SUGGESTIONS PANEL - AI Generated Action Suggestions
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { 
  Lightbulb, 
  ArrowRight, 
  CheckCircle, 
  Zap,
  TrendingUp,
  Clock
} from 'lucide-react';

const SuggestionsPanel = ({ suggestions = [], onAct, onDismiss }) => {
  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'high':
        return {
          badge: 'High Priority',
          badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
          borderColor: 'border-l-red-500'
        };
      case 'medium':
        return {
          badge: 'Medium',
          badgeColor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
          borderColor: 'border-l-yellow-500'
        };
      case 'low':
      default:
        return {
          badge: 'Low',
          badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
          borderColor: 'border-l-green-500'
        };
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">AI Suggestions</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{suggestions.length} recommendations</p>
          </div>
        </div>
        {suggestions.length > 0 && (
          <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
            View All
          </button>
        )}
      </div>

      {/* Suggestions List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
        {suggestions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">All Caught Up!</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              No pending suggestions at this time.
            </p>
          </div>
        ) : (
          suggestions.map((suggestion) => {
            const config = getPriorityConfig(suggestion.priority);
            
            return (
              <div 
                key={suggestion.id}
                className={`p-4 border-l-4 ${config.borderColor} hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {suggestion.title}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.badgeColor}`}>
                        {config.badge}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {suggestion.description}
                    </p>
                    
                    {/* Impact Badge */}
                    {suggestion.impact && (
                      <div className="flex items-center gap-1.5 mt-2 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-md w-fit">
                        <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-xs font-medium text-green-700 dark:text-green-400">
                          {suggestion.impact}
                        </span>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-3">
                      <button 
                        onClick={() => onAct?.(suggestion.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Take Action
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDismiss?.(suggestion.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      >
                        <Clock className="w-4 h-4" />
                        Later
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* AI Footer */}
      {suggestions.length > 0 && (
        <div className="px-6 py-3 bg-purple-50 dark:bg-purple-900/20 border-t border-purple-100 dark:border-purple-800">
          <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" />
            AI analyzes your data daily to provide actionable insights
          </p>
        </div>
      )}
    </div>
  );
};

export default SuggestionsPanel;
