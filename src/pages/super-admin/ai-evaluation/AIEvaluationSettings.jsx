/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AI EVALUATION SETTINGS
 * Configuration and settings for AI paper evaluation
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Brain,
  Eye,
  FileText,
  Shield,
  Bell,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  Key,
  Globe,
  Zap,
  Target
} from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import toast from 'react-hot-toast';

const AIEvaluationSettings = () => {
  const { organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  
  const [settings, setSettings] = useState({
    // OCR Settings
    ocr_engine: 'tesseract',
    ocr_language: 'eng+hin',
    ocr_confidence_threshold: 80,
    
    // AI Model Settings
    ai_model: 'gpt-4o',
    ai_temperature: 0.3,
    ai_max_tokens: 4000,
    evaluation_mode: 'balanced', // strict, balanced, lenient
    
    // Review Settings
    auto_approve_threshold: 95,
    require_review_below: 75,
    highlight_low_confidence: true,
    
    // General Settings
    default_passing_percentage: 33,
    allow_partial_marks: true,
    show_ai_reasoning: true,
    
    // Notifications
    notify_on_completion: true,
    notify_on_low_confidence: true,
    email_notifications: false
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('ocr');

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!selectedBranch?.id) return;
      
      try {
        setLoading(true);
        const response = await api.get('/ai-evaluation/settings');
        
        if (response.data?.success && response.data.data) {
          setSettings(prev => ({ ...prev, ...response.data.data }));
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        // Use defaults
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [selectedBranch?.id]);

  // Save settings
  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await api.put('/ai-evaluation/settings', settings);
      
      if (response.data?.success) {
        toast.success('Settings saved successfully!');
      } else {
        throw new Error(response.data?.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Update setting
  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Section navigation
  const sections = [
    { id: 'ocr', label: 'OCR Settings', icon: Eye },
    { id: 'ai', label: 'AI Model', icon: Brain },
    { id: 'review', label: 'Review Rules', icon: FileText },
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="w-7 h-7 text-gray-400" />
            AI Evaluation Settings
          </h1>
          <p className="text-gray-400 mt-1">Configure OCR, AI model, and evaluation preferences</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Settings
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Sidebar Navigation */}
        <div className="col-span-1">
          <nav className="space-y-1">
            {sections.map(section => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{section.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="col-span-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            {/* OCR Settings */}
            {activeSection === 'ocr' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Eye className="w-6 h-6 text-blue-400" />
                  <h2 className="text-lg font-semibold text-white">OCR Settings</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      OCR Engine
                    </label>
                    <select
                      value={settings.ocr_engine}
                      onChange={(e) => updateSetting('ocr_engine', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="tesseract">Tesseract (Free)</option>
                      <option value="google_vision">Google Vision (Premium)</option>
                      <option value="azure_ocr">Azure OCR (Premium)</option>
                      <option value="aws_textract">AWS Textract (Premium)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Select OCR engine for text extraction</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      OCR Language
                    </label>
                    <select
                      value={settings.ocr_language}
                      onChange={(e) => updateSetting('ocr_language', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="eng">English</option>
                      <option value="hin">Hindi</option>
                      <option value="eng+hin">English + Hindi</option>
                      <option value="kan">Kannada</option>
                      <option value="tel">Telugu</option>
                      <option value="tam">Tamil</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Primary language for handwriting recognition</p>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      OCR Confidence Threshold: {settings.ocr_confidence_threshold}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={settings.ocr_confidence_threshold}
                      onChange={(e) => updateSetting('ocr_confidence_threshold', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum confidence level for OCR text extraction</p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Model Settings */}
            {activeSection === 'ai' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Brain className="w-6 h-6 text-purple-400" />
                  <h2 className="text-lg font-semibold text-white">AI Model Settings</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      AI Model
                    </label>
                    <select
                      value={settings.ai_model}
                      onChange={(e) => updateSetting('ai_model', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="gpt-4o">GPT-4o (Recommended)</option>
                      <option value="gpt-4o-mini">GPT-4o Mini (Faster)</option>
                      <option value="claude-3-opus">Claude 3 Opus</option>
                      <option value="gemini-pro">Gemini Pro</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">AI model for answer evaluation</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Evaluation Mode
                    </label>
                    <select
                      value={settings.evaluation_mode}
                      onChange={(e) => updateSetting('evaluation_mode', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="strict">Strict - High precision</option>
                      <option value="balanced">Balanced - Recommended</option>
                      <option value="lenient">Lenient - Student-friendly</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">How strictly the AI evaluates answers</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      AI Temperature: {settings.ai_temperature}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.ai_temperature}
                      onChange={(e) => updateSetting('ai_temperature', parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Lower = more consistent, Higher = more creative</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Max Tokens
                    </label>
                    <input
                      type="number"
                      value={settings.ai_max_tokens}
                      onChange={(e) => updateSetting('ai_max_tokens', parseInt(e.target.value))}
                      min="1000"
                      max="16000"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum response length for AI</p>
                  </div>
                </div>
              </div>
            )}

            {/* Review Rules */}
            {activeSection === 'review' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="w-6 h-6 text-green-400" />
                  <h2 className="text-lg font-semibold text-white">Review Rules</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Auto-Approve Threshold: {settings.auto_approve_threshold}%
                    </label>
                    <input
                      type="range"
                      min="80"
                      max="100"
                      value={settings.auto_approve_threshold}
                      onChange={(e) => updateSetting('auto_approve_threshold', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Papers above this confidence will be auto-approved</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Require Review Below: {settings.require_review_below}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="90"
                      value={settings.require_review_below}
                      onChange={(e) => updateSetting('require_review_below', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Papers below this confidence require manual review</p>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.highlight_low_confidence}
                        onChange={(e) => updateSetting('highlight_low_confidence', e.target.checked)}
                        className="w-5 h-5 bg-gray-700 border border-gray-600 rounded text-blue-500 focus:ring-blue-500/50"
                      />
                      <span className="text-gray-300">Highlight low confidence answers in review</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* General Settings */}
            {activeSection === 'general' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Settings className="w-6 h-6 text-gray-400" />
                  <h2 className="text-lg font-semibold text-white">General Settings</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Default Passing Percentage
                    </label>
                    <input
                      type="number"
                      value={settings.default_passing_percentage}
                      onChange={(e) => updateSetting('default_passing_percentage', parseInt(e.target.value))}
                      min="20"
                      max="60"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Default passing marks percentage</p>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.allow_partial_marks}
                        onChange={(e) => updateSetting('allow_partial_marks', e.target.checked)}
                        className="w-5 h-5 bg-gray-700 border border-gray-600 rounded text-blue-500 focus:ring-blue-500/50"
                      />
                      <span className="text-gray-300">Allow partial marks (0.5, 1.5, etc.)</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.show_ai_reasoning}
                        onChange={(e) => updateSetting('show_ai_reasoning', e.target.checked)}
                        className="w-5 h-5 bg-gray-700 border border-gray-600 rounded text-blue-500 focus:ring-blue-500/50"
                      />
                      <span className="text-gray-300">Show AI reasoning in review</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Bell className="w-6 h-6 text-yellow-400" />
                  <h2 className="text-lg font-semibold text-white">Notification Settings</h2>
                </div>
                
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.notify_on_completion}
                      onChange={(e) => updateSetting('notify_on_completion', e.target.checked)}
                      className="w-5 h-5 bg-gray-700 border border-gray-600 rounded text-blue-500 focus:ring-blue-500/50"
                    />
                    <div>
                      <span className="text-white font-medium">Notify on Completion</span>
                      <p className="text-sm text-gray-400">Get notified when AI evaluation completes</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.notify_on_low_confidence}
                      onChange={(e) => updateSetting('notify_on_low_confidence', e.target.checked)}
                      className="w-5 h-5 bg-gray-700 border border-gray-600 rounded text-blue-500 focus:ring-blue-500/50"
                    />
                    <div>
                      <span className="text-white font-medium">Low Confidence Alerts</span>
                      <p className="text-sm text-gray-400">Get alerts for papers with low AI confidence</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.email_notifications}
                      onChange={(e) => updateSetting('email_notifications', e.target.checked)}
                      className="w-5 h-5 bg-gray-700 border border-gray-600 rounded text-blue-500 focus:ring-blue-500/50"
                    />
                    <div>
                      <span className="text-white font-medium">Email Notifications</span>
                      <p className="text-sm text-gray-400">Receive notifications via email</p>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIEvaluationSettings;
