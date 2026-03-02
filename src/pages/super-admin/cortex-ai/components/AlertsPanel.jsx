/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ALERTS PANEL - AI Generated Alerts Display
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X, 
  Clock, 
  ArrowRight,
  Bell
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const AlertsPanel = ({ alerts = [], onDismiss, onAction }) => {
  const getAlertConfig = (type) => {
    switch (type) {
      case 'danger':
        return {
          icon: AlertCircle,
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          iconColor: 'text-red-500',
          textColor: 'text-red-800 dark:text-red-200'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          iconColor: 'text-yellow-500',
          textColor: 'text-yellow-800 dark:text-yellow-200'
        };
      case 'info':
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          iconColor: 'text-blue-500',
          textColor: 'text-blue-800 dark:text-blue-200'
        };
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
            <Bell className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">AI Alerts</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{alerts.length} active alerts</p>
          </div>
        </div>
        {alerts.length > 0 && (
          <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
            View All
          </button>
        )}
      </div>

      {/* Alerts List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No Active Alerts</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              AI is monitoring your school. You're all set!
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const config = getAlertConfig(alert.type);
            const Icon = config.icon;
            
            return (
              <div 
                key={alert.id}
                className={`p-4 ${config.bgColor} border-l-4 ${config.borderColor} transition-all hover:opacity-90`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`font-medium ${config.textColor} truncate`}>
                        {alert.title}
                      </h3>
                      <button
                        onClick={() => onDismiss?.(alert.id)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {alert.message}
                    </p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                      </span>
                      
                      {alert.action && (
                        <button 
                          onClick={() => onAction?.(alert)}
                          className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700"
                        >
                          {alert.action}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;
