/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CORTEX VISION - Face AI / Camera Intelligence
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { 
  Eye, 
  Camera, 
  UserCheck, 
  UserX, 
  AlertTriangle,
  Activity,
  Clock,
  Users,
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';

const CortexVision = () => {
  const [selectedCamera, setSelectedCamera] = useState('main_gate');
  
  const cameras = [
    { id: 'main_gate', name: 'Main Gate', status: 'online', detected: 45 },
    { id: 'back_gate', name: 'Back Gate', status: 'online', detected: 12 },
    { id: 'corridor_1', name: 'Corridor 1', status: 'offline', detected: 0 },
    { id: 'canteen', name: 'Canteen', status: 'online', detected: 28 }
  ];

  const recentDetections = [
    { id: 1, name: 'Rahul Kumar', type: 'student', time: '10:32 AM', confidence: 98, action: 'Entry' },
    { id: 2, name: 'Priya Sharma', type: 'student', time: '10:31 AM', confidence: 96, action: 'Entry' },
    { id: 3, name: 'Unknown Person', type: 'unknown', time: '10:28 AM', confidence: 0, action: 'Alert' },
    { id: 4, name: 'Suresh (Teacher)', type: 'staff', time: '10:25 AM', confidence: 99, action: 'Entry' },
    { id: 5, name: 'Meena B.', type: 'student', time: '10:22 AM', confidence: 94, action: 'Entry' }
  ];

  const stats = [
    { label: 'Total Recognized', value: 234, icon: UserCheck, color: 'green' },
    { label: 'Unknown Faces', value: 3, icon: UserX, color: 'red' },
    { label: 'Cameras Online', value: '3/4', icon: Camera, color: 'blue' },
    { label: 'Avg Accuracy', value: '97%', icon: Activity, color: 'purple' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Eye className="w-7 h-7 text-purple-600" />
            Cortex Vision
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Face recognition and camera intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <Settings className="w-4 h-4" />
            Configure
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                stat.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
                stat.color === 'red' ? 'bg-red-100 dark:bg-red-900/30' :
                stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                'bg-purple-100 dark:bg-purple-900/30'
              }`}>
                <stat.icon className={`w-5 h-5 ${
                  stat.color === 'green' ? 'text-green-600' :
                  stat.color === 'red' ? 'text-red-600' :
                  stat.color === 'blue' ? 'text-blue-600' :
                  'text-purple-600'
                }`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Preview */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-600" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Live Camera Feed</h2>
            </div>
            <select 
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
            >
              {cameras.map((cam) => (
                <option key={cam.id} value={cam.id}>{cam.name}</option>
              ))}
            </select>
          </div>
          <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
            {/* Placeholder for camera feed */}
            <div className="text-center">
              <Camera className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Camera feed preview</p>
              <p className="text-sm text-gray-500">Connect camera to enable live view</p>
            </div>
            {/* Camera Status Overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/50 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-white">Live</span>
            </div>
            <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/50 rounded-full">
              <span className="text-sm text-white">
                {cameras.find(c => c.id === selectedCamera)?.name}
              </span>
            </div>
          </div>
        </div>

        {/* Camera List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Camera Status
            </h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {cameras.map((camera) => (
              <div 
                key={camera.id}
                onClick={() => setSelectedCamera(camera.id)}
                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  selectedCamera === camera.id ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      camera.status === 'online' 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      <Camera className={`w-5 h-5 ${
                        camera.status === 'online' ? 'text-green-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{camera.name}</p>
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 text-xs ${
                          camera.status === 'online' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {camera.status === 'online' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {camera.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{camera.detected}</p>
                    <p className="text-xs text-gray-500">detected</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Detections */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Detections</h2>
          </div>
          <button className="text-sm text-purple-600 hover:text-purple-700">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Person</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Time</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Confidence</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentDetections.map((detection) => (
                <tr key={detection.id} className="border-b border-gray-100 dark:border-gray-700/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        detection.type === 'unknown' 
                          ? 'bg-red-100 dark:bg-red-900/30' 
                          : 'bg-purple-100 dark:bg-purple-900/30'
                      }`}>
                        {detection.type === 'unknown' ? (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        ) : (
                          <UserCheck className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                      <span className={`font-medium ${
                        detection.type === 'unknown' 
                          ? 'text-red-600' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {detection.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      detection.type === 'student' ? 'bg-blue-100 text-blue-700' :
                      detection.type === 'staff' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {detection.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {detection.time}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {detection.confidence > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              detection.confidence >= 95 ? 'bg-green-500' :
                              detection.confidence >= 85 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${detection.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{detection.confidence}%</span>
                      </div>
                    ) : (
                      <span className="text-sm text-red-600">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      detection.action === 'Entry' ? 'bg-green-100 text-green-700' :
                      detection.action === 'Exit' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {detection.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CortexVision;
