/**
 * Coming Soon Report Generator Placeholder
 * Shows a professional placeholder while the full module is being developed
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, ArrowLeft, Clock, Sparkles, 
  BarChart3, Download, Filter 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const ComingSoonGenerator = ({ 
  title = 'Report Generator',
  description = 'This report module is being developed with 50+ templates',
  icon: Icon = FileText,
  color = 'blue',
  features = []
}) => {
  const navigate = useNavigate();

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    indigo: 'bg-indigo-500',
    pink: 'bg-pink-500',
    teal: 'bg-teal-500',
  };

  const defaultFeatures = [
    { icon: BarChart3, text: '50+ Ready Templates' },
    { icon: Filter, text: 'Advanced Filters & Grouping' },
    { icon: Download, text: 'Excel, PDF, CSV Export' },
    { icon: Sparkles, text: 'Live Preview & Custom Columns' },
  ];

  const displayFeatures = features.length > 0 ? features : defaultFeatures;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className={`${colorClasses[color] || colorClasses.blue} p-8 text-white`}>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-xl">
              <Icon className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="text-white/80 mt-1">Report Generator</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Coming Soon Badge */}
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Coming Soon</span>
            </div>
          </div>

          <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
            {description}
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {displayFeatures.map((feature, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <feature.icon className={`w-5 h-5 text-${color}-500`} />
                <span className="text-sm text-gray-700 dark:text-gray-200">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Available Now Section */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              ✅ Available Now
            </h3>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• Student Information Report Generator (50+ templates)</li>
              <li>• Attendance Report Generator (35+ templates)</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={() => navigate('/super-admin/reports/student-generator')}
              className="flex-1"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Student Reports
            </Button>
            <Button 
              onClick={() => navigate('/super-admin/reports/attendance-generator')}
              variant="outline"
              className="flex-1 dark:border-gray-600 dark:text-gray-200"
            >
              <FileText className="w-4 h-4 mr-2" />
              Attendance Reports
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            World's Best Report Generator • Jashchar ERP
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ComingSoonGenerator;
