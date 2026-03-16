/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AI AUTOMATION - Rules & Automated Actions
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useRef } from 'react';
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
  AlertTriangle,
  X,
  Save,
  Settings
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// ═══════════════════════════════════════════════════════════════════════════════
// TRIGGER OPTIONS
// ═══════════════════════════════════════════════════════════════════════════════
const TRIGGER_OPTIONS = [
  { value: 'attendance_low', label: 'Attendance < 75%', category: 'Attendance' },
  { value: 'attendance_absent', label: 'Student absent', category: 'Attendance' },
  { value: 'attendance_late', label: 'Student late arrival', category: 'Attendance' },
  { value: 'fee_due_3days', label: '3 days before due date', category: 'Fees' },
  { value: 'fee_due_today', label: 'Fee due today', category: 'Fees' },
  { value: 'fee_overdue', label: 'Fee overdue', category: 'Fees' },
  { value: 'birthday', label: 'Student birthday', category: 'Events' },
  { value: 'exam_result', label: 'Results published', category: 'Exams' },
  { value: 'exam_schedule', label: 'Exam scheduled', category: 'Exams' },
  { value: 'homework_assigned', label: 'Homework assigned', category: 'Academic' },
  { value: 'grade_drop', label: 'Grade dropped significantly', category: 'Academic' }
];

// ═══════════════════════════════════════════════════════════════════════════════
// ACTION OPTIONS
// ═══════════════════════════════════════════════════════════════════════════════
const ACTION_OPTIONS = [
  { value: 'whatsapp_parent', label: 'Send WhatsApp to parent', icon: MessageSquare },
  { value: 'sms_parent', label: 'Send SMS to parent', icon: MessageSquare },
  { value: 'email_parent', label: 'Send email to parent', icon: Mail },
  { value: 'app_notification', label: 'App notification', icon: Bell },
  { value: 'email_teacher', label: 'Email to class teacher', icon: Mail },
  { value: 'create_task', label: 'Create follow-up task', icon: CheckCircle }
];

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK CREATE TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════
const QUICK_TEMPLATES = [
  { 
    icon: Bell, 
    label: 'Attendance Alert', 
    desc: 'Alert when attendance drops',
    name: 'Low Attendance Alert',
    trigger: 'attendance_low',
    action: 'whatsapp_parent'
  },
  { 
    icon: Mail, 
    label: 'Fee Reminder', 
    desc: 'Automatic fee reminders',
    name: 'Fee Due Reminder',
    trigger: 'fee_due_3days',
    action: 'sms_parent'
  },
  { 
    icon: MessageSquare, 
    label: 'Birthday Wishes', 
    desc: 'Birthday greetings',
    name: 'Birthday Wishes',
    trigger: 'birthday',
    action: 'whatsapp_parent'
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// STORAGE KEY
// ═══════════════════════════════════════════════════════════════════════════════
const STORAGE_KEY = 'cortex_ai_automations';

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT AUTOMATIONS
// ═══════════════════════════════════════════════════════════════════════════════
const DEFAULT_AUTOMATIONS = [
  {
    id: 1,
    name: 'Low Attendance Alert',
    trigger: 'attendance_low',
    triggerLabel: 'Attendance < 75%',
    action: 'whatsapp_parent',
    actionLabel: 'Send WhatsApp to parent',
    status: 'active',
    lastRun: '2 hours ago',
    runsToday: 12
  },
  {
    id: 2,
    name: 'Fee Due Reminder',
    trigger: 'fee_due_3days',
    triggerLabel: '3 days before due date',
    action: 'sms_parent',
    actionLabel: 'Send SMS reminder',
    status: 'active',
    lastRun: '5 hours ago',
    runsToday: 45
  },
  {
    id: 3,
    name: 'Birthday Wishes',
    trigger: 'birthday',
    triggerLabel: 'Student birthday',
    action: 'whatsapp_parent',
    actionLabel: 'Send birthday message',
    status: 'active',
    lastRun: '1 day ago',
    runsToday: 3
  },
  {
    id: 4,
    name: 'Exam Result Notification',
    trigger: 'exam_result',
    triggerLabel: 'Results published',
    action: 'app_notification',
    actionLabel: 'Send result to parents',
    status: 'paused',
    lastRun: '3 days ago',
    runsToday: 0
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Load automations from localStorage
// ═══════════════════════════════════════════════════════════════════════════════
const loadAutomationsFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // Silent fail - will use defaults
  }
  return DEFAULT_AUTOMATIONS;
};

const AIAutomation = () => {
  // ═══════════════════════════════════════════════════════════════════════════════
  // HOOKS
  // ═══════════════════════════════════════════════════════════════════════════════
  const { toast } = useToast();

  // ═══════════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════════
  const [automations, setAutomations] = useState(loadAutomationsFromStorage);

  const [showModal, setShowModal] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    trigger: '',
    action: ''
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // PERSIST TO LOCALSTORAGE (skip first render)
  // ═══════════════════════════════════════════════════════════════════════════════
  const isFirstRender = useRef(true);
  
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(automations));
    } catch (e) {
      // Silent fail
    }
  }, [automations]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════════
  const toggleStatus = (id) => {
    const automation = automations.find(a => a.id === id);
    if (!automation) return;
    
    const newStatus = automation.status === 'active' ? 'paused' : 'active';
    
    setAutomations(prev => prev.map(a => 
      a.id === id ? { ...a, status: newStatus } : a
    ));
    
    toast({
      title: 'Success',
      description: `Automation ${newStatus === 'active' ? 'activated' : 'paused'} successfully!`,
    });
  };

  const openCreateModal = () => {
    setEditingAutomation(null);
    setFormData({ name: '', trigger: '', action: '' });
    setShowModal(true);
  };

  const openEditModal = (automation) => {
    setEditingAutomation(automation);
    setFormData({
      name: automation.name,
      trigger: automation.trigger,
      action: automation.action
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAutomation(null);
    setFormData({ name: '', trigger: '', action: '' });
  };

  const handleSave = () => {
    if (!formData.name || !formData.trigger || !formData.action) {
      toast({
        title: 'Error',
        description: 'Please fill all fields',
        variant: 'destructive'
      });
      return;
    }

    const triggerOption = TRIGGER_OPTIONS.find(t => t.value === formData.trigger);
    const actionOption = ACTION_OPTIONS.find(a => a.value === formData.action);

    if (editingAutomation) {
      // Update existing
      setAutomations(prev => prev.map(a => 
        a.id === editingAutomation.id 
          ? { 
              ...a, 
              name: formData.name,
              trigger: formData.trigger,
              triggerLabel: triggerOption?.label || formData.trigger,
              action: formData.action,
              actionLabel: actionOption?.label || formData.action
            }
          : a
      ));
      toast({
        title: 'Success',
        description: 'Automation updated successfully!'
      });
    } else {
      // Create new
      const newAutomation = {
        id: Date.now(),
        name: formData.name,
        trigger: formData.trigger,
        triggerLabel: triggerOption?.label || formData.trigger,
        action: formData.action,
        actionLabel: actionOption?.label || formData.action,
        status: 'active',
        lastRun: 'Never',
        runsToday: 0
      };
      setAutomations(prev => [...prev, newAutomation]);
      toast({
        title: 'Success',
        description: 'Automation created successfully!'
      });
    }
    closeModal();
  };

  const handleDelete = (id) => {
    setAutomations(prev => prev.filter(a => a.id !== id));
    setDeleteConfirm(null);
    toast({
      title: 'Deleted',
      description: 'Automation deleted successfully!'
    });
  };

  const handleQuickCreate = (template) => {
    const triggerOption = TRIGGER_OPTIONS.find(t => t.value === template.trigger);
    const actionOption = ACTION_OPTIONS.find(a => a.value === template.action);
    
    const newAutomation = {
      id: Date.now(),
      name: template.name,
      trigger: template.trigger,
      triggerLabel: triggerOption?.label || template.trigger,
      action: template.action,
      actionLabel: actionOption?.label || template.action,
      status: 'active',
      lastRun: 'Never',
      runsToday: 0
    };
    setAutomations(prev => [...prev, newAutomation]);
    toast({
      title: 'Created',
      description: `${template.label} automation created!`
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════════════════════
  const stats = [
    { label: 'Total Automations', value: automations.length, icon: Zap },
    { label: 'Active Rules', value: automations.filter(a => a.status === 'active').length, icon: Play },
    { label: 'Actions Today', value: automations.reduce((sum, a) => sum + a.runsToday, 0), icon: CheckCircle },
    { label: 'Alerts Sent', value: 127, icon: Bell }
  ];

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
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Automation
        </button>
      </div>

      {/* Stats - Dynamic */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
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
          {automations.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No automations yet. Create one to get started!</p>
            </div>
          ) : (
            automations.map((automation) => (
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
                          IF: {automation.triggerLabel}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                        <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded text-xs">
                          THEN: {automation.actionLabel}
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
                          ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50'
                          : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50'
                      }`}
                      title={automation.status === 'active' ? 'Pause' : 'Activate'}
                    >
                      {automation.status === 'active' ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                    <button 
                      onClick={() => openEditModal(automation)}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm(automation)}
                      className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Create Section */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Quick Create Automation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {QUICK_TEMPLATES.map((template, index) => (
            <button
              key={index}
              onClick={() => handleQuickCreate(template)}
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

      {/* ═══════════════════════════════════════════════════════════════════════════════
          CREATE / EDIT MODAL
          ═══════════════════════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                {editingAutomation ? 'Edit Automation' : 'Create Automation'}
              </h3>
              <button 
                onClick={closeModal}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Automation Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Low Attendance Alert"
                />
              </div>

              {/* Trigger */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trigger (WHEN) *
                </label>
                <select
                  value={formData.trigger}
                  onChange={(e) => setFormData(prev => ({ ...prev, trigger: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select trigger...</option>
                  {TRIGGER_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      [{opt.category}] {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Action (THEN) *
                </label>
                <select
                  value={formData.action}
                  onChange={(e) => setFormData(prev => ({ ...prev, action: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select action...</option>
                  {ACTION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingAutomation ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════════
          DELETE CONFIRMATION MODAL
          ═══════════════════════════════════════════════════════════════════════════════ */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Delete Automation?
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Are you sure you want to delete "<strong>{deleteConfirm.name}</strong>"? 
                This action cannot be undone.
              </p>
              <div className="flex items-center gap-3 justify-center">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAutomation;
