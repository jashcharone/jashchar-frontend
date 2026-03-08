/**
 * SaveTemplateModal - Save Custom Report Template
 * Allows users to save their report configuration as a reusable template
 * Persist to report_saved_templates table in Supabase
 */

import React, { useState } from 'react';
import { X, Save, Star, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const SaveTemplateModal = ({
  isOpen,
  onClose,
  onSave,
  initialName = '',
  initialDescription = '',
  templateConfig = {},
  saving: externalSaving = false,
  // DB persistence props
  module = '',
  branchId = null,
  organizationId = null,
  sessionId = null,
  userId = null,
  persistToDb = true // Enable DB persistence by default
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a template name');
      return;
    }

    setError('');
    
    const templateData = {
      name: name.trim(),
      description: description.trim(),
      is_favorite: isFavorite,
      config: templateConfig
    };

    // If DB persistence is enabled and context is available, save to DB
    if (persistToDb && branchId && organizationId && userId && module) {
      setSaving(true);
      try {
        const { data, error: dbError } = await supabase
          .from('report_saved_templates')
          .insert({
            organization_id: organizationId,
            branch_id: branchId,
            session_id: sessionId,
            module,
            name: name.trim(),
            description: description.trim(),
            template_config: templateConfig,
            is_favorite: isFavorite,
            is_shared: false,
            created_by: userId
          })
          .select()
          .single();

        if (dbError) {
          console.error('Failed to save template to DB:', dbError);
          setError('Failed to save template. Please try again.');
          setSaving(false);
          return;
        }

        console.log('✅ Template saved to DB:', data);
        
        // Call onSave with the saved template data
        onSave({
          ...templateData,
          id: data.id,
          key: `custom_${data.id}`
        });
        
        setSaving(false);
      } catch (err) {
        console.error('Template save error:', err);
        setError('An error occurred while saving the template.');
        setSaving(false);
        return;
      }
    } else {
      // Fallback to parent callback only (no DB persistence)
      onSave(templateData);
    }
  };

  const handleClose = () => {
    setName(initialName);
    setDescription(initialDescription);
    setIsFavorite(false);
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
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Save className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Save Template</h2>
            </div>
            <button 
              onClick={handleClose} 
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            {/* Template Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Monthly Class Strength Report"
                className={`w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  error ? 'border-red-300 dark:border-red-600' : ''
                }`}
                autoFocus
              />
              {error && <p className="text-sm text-red-500 dark:text-red-400 mt-1">{error}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this report shows..."
                rows={3}
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Favorite Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border dark:border-gray-600 transition ${
                  isFavorite 
                    ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300'
                }`}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-500' : ''}`} />
                <span className="text-sm">Add to Favorites</span>
              </button>
            </div>

            {/* Configuration Summary */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Configuration Summary:
              </div>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                <div>• {templateConfig.columns?.length || 0} columns selected</div>
                <div>• {Object.keys(templateConfig.filters || {}).length} filters applied</div>
                <div>• {templateConfig.groupBy?.length || 0} grouping levels</div>
                <div>• {templateConfig.sortBy?.length || 0} sort rules</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || externalSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
            >
              {(saving || externalSaving) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Template
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SaveTemplateModal;
