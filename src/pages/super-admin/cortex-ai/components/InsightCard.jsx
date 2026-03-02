/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * INSIGHT CARD - Single AI Insight Display
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { ArrowRight } from 'lucide-react';

const InsightCard = ({ insight }) => {
  const { title, value, description, icon: Icon, color } = insight;

  const colorConfig = {
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      iconBg: 'bg-green-100 dark:bg-green-900/40',
      iconColor: 'text-green-600',
      valueColor: 'text-green-700 dark:text-green-400'
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/40',
      iconColor: 'text-yellow-600',
      valueColor: 'text-yellow-700 dark:text-yellow-400'
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconColor: 'text-blue-600',
      valueColor: 'text-blue-700 dark:text-blue-400'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      iconColor: 'text-purple-600',
      valueColor: 'text-purple-700 dark:text-purple-400'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      iconBg: 'bg-red-100 dark:bg-red-900/40',
      iconColor: 'text-red-600',
      valueColor: 'text-red-700 dark:text-red-400'
    }
  };

  const config = colorConfig[color] || colorConfig.blue;

  return (
    <div 
      className={`${config.bg} ${config.border} border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer group`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 ${config.iconBg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      <div className="mt-3">
        <div className={`text-2xl font-bold ${config.valueColor}`}>
          {value}
        </div>
        <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
          {title}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {description}
        </div>
      </div>
    </div>
  );
};

export default InsightCard;
