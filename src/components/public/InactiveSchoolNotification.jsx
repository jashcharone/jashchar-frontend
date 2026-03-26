import React from 'react';
import { X, Mail, Phone } from 'lucide-react';

const InactiveSchoolNotification = ({ settings }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <X className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            School Website Temporarily Unavailable
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            This school website is currently inactive.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-left">
            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium mb-2">
               ️ What this means:
            </p>
            <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1 list-disc list-inside">
              <li>The school website is temporarily unavailable</li>
              <li>Please contact the school administration for more information</li>
              <li>The website will be accessible once the school is reactivated</li>
            </ul>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            For inquiries, please contact:
          </p>
          {settings?.contact_info?.email && (
            <a 
              href={`mailto:${settings.contact_info.email}`}
              className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Mail className="h-4 w-4" />
              {settings.contact_info.email}
            </a>
          )}
          {settings?.contact_info?.phone && (
            <a 
              href={`tel:${settings.contact_info.phone}`}
              className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Phone className="h-4 w-4" />
              {settings.contact_info.phone}
            </a>
          )}
          {(!settings?.contact_info?.email && !settings?.contact_info?.phone) && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please contact the school administration directly.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InactiveSchoolNotification;

