/**
 * ScheduleReportModal - Schedule Automated Report Delivery
 * Allows users to schedule reports to be emailed at specific times
 */

import React, { useState } from 'react';
import { X, Clock, Mail, Calendar, Loader2, Plus, Trash2, Check } from 'lucide-react';
import { SCHEDULE_FREQUENCIES, DAYS_OF_WEEK, EXPORT_FORMATS } from './constants';

const ScheduleReportModal = ({
  isOpen,
  onClose,
  onSave,
  reportName = 'Report',
  saving = false
}) => {
  const [frequency, setFrequency] = useState('weekly');
  const [selectedDays, setSelectedDays] = useState([1]); // Monday
  const [monthDay, setMonthDay] = useState(1);
  const [time, setTime] = useState('09:00');
  const [format, setFormat] = useState('excel');
  const [recipients, setRecipients] = useState(['']);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');

  // Toggle day selection
  const toggleDay = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  // Add recipient
  const addRecipient = () => {
    setRecipients([...recipients, '']);
  };

  // Update recipient
  const updateRecipient = (index, value) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };

  // Remove recipient
  const removeRecipient = (index) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  // Validate and save
  const handleSave = () => {
    // Validate recipients
    const validRecipients = recipients.filter(r => r.trim() && isValidEmail(r));
    if (validRecipients.length === 0) {
      setError('Please add at least one valid email recipient');
      return;
    }

    // Validate days for weekly
    if (frequency === 'weekly' && selectedDays.length === 0) {
      setError('Please select at least one day');
      return;
    }

    setError('');
    onSave({
      frequency,
      days: frequency === 'weekly' ? selectedDays : [monthDay],
      time,
      format,
      recipients: validRecipients,
      is_active: isActive
    });
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        {/* Modal */}
        <div 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Schedule Report</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{reportName}</p>
              </div>
            </div>
            <button 
              onClick={handleClose} 
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-5">
            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Frequency Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Frequency
              </label>
              <div className="flex gap-2">
                {Object.entries(SCHEDULE_FREQUENCIES).map(([key, config]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFrequency(key)}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg border dark:border-gray-600 transition ${
                      frequency === key
                        ? 'bg-purple-50 dark:bg-purple-900/50 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Weekly Day Selection */}
            {frequency === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`px-3 py-2 text-sm rounded-lg border dark:border-gray-600 transition ${
                        selectedDays.includes(day.value)
                          ? 'bg-purple-500 border-purple-500 text-white'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Day Selection */}
            {frequency === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Day of Month
                </label>
                <select
                  value={monthDay}
                  onChange={(e) => setMonthDay(Number(e.target.value))}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-purple-500"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Export Format
              </label>
              <div className="flex gap-2">
                {['excel', 'pdf', 'csv'].map(fmt => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormat(fmt)}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg border dark:border-gray-600 transition capitalize ${
                      format === fmt
                        ? 'bg-purple-50 dark:bg-purple-900/50 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipients */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Recipients
                </label>
                <button
                  type="button"
                  onClick={addRecipient}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {recipients.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => updateRecipient(index, e.target.value)}
                        placeholder="email@example.com"
                        className="w-full pl-9 pr-4 py-2 text-sm border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    {recipients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRecipient(index)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Schedule Active</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Enable automatic delivery</div>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative w-12 h-6 rounded-full transition ${
                  isActive ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
                    isActive ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Summary */}
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-sm text-purple-700 dark:text-purple-300">
              <Calendar className="w-4 h-4 inline-block mr-2" />
              {getScheduleSummary(frequency, selectedDays, monthDay, time)}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-2xl sticky bottom-0">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
                  Schedule Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Helper: Validate email
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Helper: Generate schedule summary
const getScheduleSummary = (frequency, days, monthDay, time) => {
  const timeStr = formatTime12h(time);
  
  if (frequency === 'daily') {
    return `Report will be sent daily at ${timeStr}`;
  }
  
  if (frequency === 'weekly') {
    const dayNames = days
      .sort((a, b) => a - b)
      .map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label)
      .filter(Boolean)
      .join(', ');
    return `Report will be sent every ${dayNames} at ${timeStr}`;
  }
  
  if (frequency === 'monthly') {
    const suffix = getOrdinalSuffix(monthDay);
    return `Report will be sent on the ${monthDay}${suffix} of every month at ${timeStr}`;
  }
  
  return '';
};

// Helper: Format time to 12-hour
const formatTime12h = (time) => {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${suffix}`;
};

// Helper: Get ordinal suffix
const getOrdinalSuffix = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

export default ScheduleReportModal;
