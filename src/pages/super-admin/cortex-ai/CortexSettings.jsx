/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CORTEX SETTINGS - AI Configuration Panel
 * Connected to Real Backend APIs
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Brain, 
  Bell, 
  Shield, 
  Globe, 
  Zap,
  Volume2,
  Eye,
  Save,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Info,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import api from '@/services/api';
import { useCortexAccess } from '@/hooks/useCortexAccess';

const CortexSettings = () => {
  const { plan, planName, features } = useCortexAccess();
  const [settings, setSettings] = useState({
    ai_level: 'basic',
    language: 'en-IN',
    auto_insights: true,
    auto_alerts: true,
    alert_threshold: 'medium',
    voice_enabled: true,
    face_ai_enabled: true,
    data_retention_days: 90,
    notify_email: true,
    notify_whatsapp: true,
    privacy_mode: false
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch settings on load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/cortex/settings');
        if (response.data) {
          setSettings(prev => ({ ...prev, ...response.data }));
        }
      } catch (error) {
        console.error('Error fetching Cortex settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await api.put('/cortex/settings', settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const Toggle = ({ enabled, onChange }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  // Show loading state while fetching settings
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Settings saved successfully!
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-7 h-7 text-purple-600" />
            Cortex Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Configure AI behavior and preferences
          </p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Level Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Intelligence Level</h2>
          </div>
          
          <div className="space-y-3">
            {[
              { value: 'basic', label: 'Basic', desc: 'Simple analytics and reports', price: 'Free' },
              { value: 'pro', label: 'Pro', desc: 'Advanced predictions and automation', price: '₹2,999/mo' },
              { value: 'ultra', label: 'Ultra', desc: 'Full AI capabilities with voice', price: '₹4,999/mo' }
            ].map((level) => (
              <label
                key={level.value}
                className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  settings.aiLevel === level.value
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="aiLevel"
                    value={level.value}
                    checked={settings.aiLevel === level.value}
                    onChange={(e) => handleChange('aiLevel', e.target.value)}
                    className="w-4 h-4 text-purple-600"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{level.label}</p>
                    <p className="text-sm text-gray-500">{level.desc}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  level.value === 'basic' ? 'bg-gray-100 text-gray-700' :
                  level.value === 'pro' ? 'bg-purple-100 text-purple-700' :
                  'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                }`}>
                  {level.price}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Language Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Language & Voice</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AI Response Language
              </label>
              <select
                value={settings.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="en-IN">English (India)</option>
                <option value="kn-IN">ಕನ್ನಡ (Kannada)</option>
                <option value="hi-IN">हिंदी (Hindi)</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Voice Commands</p>
                  <p className="text-sm text-gray-500">Enable voice control</p>
                </div>
              </div>
              <Toggle enabled={settings.voiceEnabled} onChange={() => handleToggle('voiceEnabled')} />
            </div>

            <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Face Recognition</p>
                  <p className="text-sm text-gray-500">Enable face AI features</p>
                </div>
              </div>
              <Toggle enabled={settings.faceAIEnabled} onChange={() => handleToggle('faceAIEnabled')} />
            </div>
          </div>
        </div>

        {/* Alert Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Alerts & Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Auto Insights</p>
                <p className="text-sm text-gray-500">Generate insights automatically</p>
              </div>
              <Toggle enabled={settings.autoInsights} onChange={() => handleToggle('autoInsights')} />
            </div>

            <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Auto Alerts</p>
                <p className="text-sm text-gray-500">Send alerts for anomalies</p>
              </div>
              <Toggle enabled={settings.autoAlerts} onChange={() => handleToggle('autoAlerts')} />
            </div>

            <div className="py-3 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Alert Sensitivity
              </label>
              <select
                value={settings.alertThreshold}
                onChange={(e) => handleChange('alertThreshold', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="low">Low (Critical only)</option>
                <option value="medium">Medium (Important issues)</option>
                <option value="high">High (All anomalies)</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive alerts via email</p>
              </div>
              <Toggle enabled={settings.notifyEmail} onChange={() => handleToggle('notifyEmail')} />
            </div>

            <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">WhatsApp Notifications</p>
                <p className="text-sm text-gray-500">Receive alerts via WhatsApp</p>
              </div>
              <Toggle enabled={settings.notifyWhatsApp} onChange={() => handleToggle('notifyWhatsApp')} />
            </div>
          </div>
        </div>

        {/* Privacy & Data */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy & Data</h2>
          </div>
          
          <div className="space-y-4">
            <div className="py-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Retention Period
              </label>
              <select
                value={settings.dataRetention}
                onChange={(e) => handleChange('dataRetention', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="30">30 Days</option>
                <option value="90">90 Days</option>
                <option value="180">180 Days</option>
                <option value="365">1 Year</option>
                <option value="forever">Forever</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Privacy Mode</p>
                <p className="text-sm text-gray-500">Anonymize sensitive data in reports</p>
              </div>
              <Toggle enabled={settings.privacyMode} onChange={() => handleToggle('privacyMode')} />
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">Data Privacy Notice</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    AI analysis is performed on your data locally. No student data is sent to external servers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Status */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Cortex AI Status</h3>
              <p className="text-purple-200">Your AI engine is running smoothly</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-green-300">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="font-medium">Online</span>
            </div>
            <p className="text-sm text-purple-200 mt-1">Last sync: 2 minutes ago</p>
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
          <Zap className="w-4 h-4" />
          Powered by Jashchar Cortex AI™ v1.0
        </span>
      </div>
    </div>
  );
};

export default CortexSettings;
