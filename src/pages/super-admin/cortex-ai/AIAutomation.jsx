/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AI AUTOMATION - Rules & Automated Actions
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { 
  Zap, 
  Plus, 
  Play, 
  Pause,
  Trash2,
  Edit2,
  ArrowRight,
  Bell,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const AIAutomation = () => {
  const [automations, setAutomations] = useState([
    {
      id: 1,
      name: 'Low Attendance Alert',
      trigger: 'Attendance < 75%',
      action: 'Send WhatsApp to parent',
      status: 'active',
      lastRun: '2 hours ago',
      runsToday: 12
    },
    {
      id: 2,
      name: 'Fee Due Reminder',
      trigger: '3 days before due date',
      action: 'Send SMS reminder',
      status: 'active',
      lastRun: '5 hours ago',
      runsToday: 45
    },
    {
      id: 3,
      name: 'Birthday Wishes',
      trigger: 'Student birthday',
      action: 'Send birthday message',
      status: 'active',
      lastRun: '1 day ago',
      runsToday: 3
    },
    {
      id: 4,
      name: 'Exam Result Notification',
      trigger: 'Results published',
      action: 'Send result to parents',
      status: 'paused',
      lastRun: '3 days ago',
      runsToday: 0
    }
  ]);

  const toggleStatus = (id) => {
    setAutomations(prev => prev.map(a => 
      a.id === id ? { ...a, status: a.status === 'active' ? 'paused' : 'active' } : a
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-7 h-7 text-purple-600" />
            AI Automation
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Set up automated rules and actions
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
          <Plus className="w-4 h-4" />
          Create Automation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Automations', value: 4, icon: Zap },
          { label: 'Active Rules', value: 3, icon: Play },
          { label: 'Actions Today', value: 60, icon: CheckCircle },
          { label: 'Alerts Sent', value: 127, icon: Bell }
        ].map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Automation Rules */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Automation Rules
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {automations.map((automation) => (
            <div key={automation.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    automation.status === 'active' 
                      ? 'bg-green-100 dark:bg-green-900/30' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Zap className={`w-6 h-6 ${
                      automation.status === 'active' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {automation.name}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        automation.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {automation.status === 'active' ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded text-xs">
                        IF: {automation.trigger}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                      <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded text-xs">
                        THEN: {automation.action}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 dark:text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last run: {automation.lastRun}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {automation.runsToday} runs today
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStatus(automation.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      automation.status === 'active'
                        ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                    title={automation.status === 'active' ? 'Pause' : 'Activate'}
                  >
                    {automation.status === 'active' ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Create Section */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Quick Create Automation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Bell, label: 'Attendance Alert', desc: 'Alert when attendance drops' },
            { icon: Mail, label: 'Fee Reminder', desc: 'Automatic fee reminders' },
            { icon: MessageSquare, label: 'Parent Update', desc: 'Daily parent updates' }
          ].map((template, index) => (
            <button
              key={index}
              className="flex items-center gap-3 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <template.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium">{template.label}</div>
                <div className="text-sm text-purple-200">{template.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIAutomation;
