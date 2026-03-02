/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QUICK STATS CARD - Small Stat Display Card
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { TrendingUp } from 'lucide-react';

const QuickStatsCard = ({ label, value, icon: Icon, trend }) => {
  const isPositive = trend && trend.startsWith('+');
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-purple-600" />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className={`w-3 h-3 ${!isPositive && 'rotate-180'}`} />
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        {label}
      </div>
    </div>
  );
};

export default QuickStatsCard;
