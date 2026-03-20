// ╔═══════════════════════════════════════════════════════════════════════════════════╗
// ║  DAY 39: FACE ATTENDANCE HELP & DOCUMENTATION CENTER                             ║
// ║  User Guide, FAQ, Troubleshooting, Setup Instructions                            ║
// ╚═══════════════════════════════════════════════════════════════════════════════════╝

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  BookOpen, Search, HelpCircle, Settings, Camera, Users,
  Shield, Bell, BarChart3, Smartphone, CheckCircle, AlertTriangle,
  ChevronRight, ExternalLink, Lightbulb, Wrench, Monitor
} from 'lucide-react';

// ═══════════════════════════════ HELP DATA ═══════════════════════════════

const setupGuide = [
  {
    step: 1,
    title: 'Install AI Engine',
    description: 'Set up the Python FastAPI AI engine with InsightFace and FAISS',
    details: [
      'Navigate to jashchar-ai-engine directory',
      'Create virtual environment: python -m venv venv',
      'Activate venv and install dependencies: pip install -r requirements.txt',
      'Copy .env.example to .env and configure Supabase credentials',
      'Start engine: python -m uvicorn main:app --host 0.0.0.0 --port 8501',
    ],
    status: 'required',
  },
  {
    step: 2,
    title: 'Configure AI Cameras',
    description: 'Add IP cameras or USB webcams for face recognition',
    details: [
      'Go to AI Camera Management page',
      'Click "Add Camera" and enter camera details (Name, IP/URL, Type)',
      'Select camera location: Entry Gate, Exit Gate, Classroom, Corridor',
      'Set camera purpose: Attendance, Surveillance, Both',
      'Test camera connection and save',
    ],
    status: 'required',
  },
  {
    step: 3,
    title: 'Register Student Faces',
    description: 'Enroll student face photos for recognition',
    details: [
      'Go to Face Registration page',
      'Select student from dropdown',
      'Capture 3-5 photos from different angles',
      'System will extract 512-dimensional face embeddings',
      'Face vectors are stored in FAISS index for fast search',
    ],
    status: 'required',
  },
  {
    step: 4,
    title: 'Build FAISS Index',
    description: 'Build the vector search index for fast face matching',
    details: [
      'Go to FAISS Index Management page',
      'Click "Rebuild Index" to compile all face vectors',
      'Index supports sub-millisecond search across thousands of faces',
      'Recommended: Rebuild index weekly or after bulk registrations',
    ],
    status: 'required',
  },
  {
    step: 5,
    title: 'Configure Attendance Rules',
    description: 'Set up attendance timing and policies',
    details: [
      'Go to Attendance Rules page',
      'Set school start time, late threshold, absence cutoff',
      'Configure entry/exit recognition windows',
      'Set minimum confidence threshold (recommended: 0.6)',
      'Enable/disable liveness detection (anti-spoofing)',
    ],
    status: 'recommended',
  },
  {
    step: 6,
    title: 'Set Up Notifications',
    description: 'Configure parent notifications for attendance events',
    details: [
      'Go to Notification Settings page',
      'Enable SMS, WhatsApp, Email, or Push notification channels',
      'Configure notification types: Arrival, Late, Absent, Departure',
      'Set quiet hours to avoid disturbing parents',
      'Test notifications with sample messages',
    ],
    status: 'optional',
  },
  {
    step: 7,
    title: 'Start Live Attendance',
    description: 'Begin automated face recognition attendance',
    details: [
      'Go to Live Face Attendance page',
      'Select active camera feed',
      'System automatically detects and recognizes faces',
      'Attendance is marked in real-time',
      'Monitor the Analytics Dashboard for insights',
    ],
    status: 'final',
  },
];

const faqData = [
  {
    category: 'General',
    items: [
      {
        q: 'How accurate is the face recognition system?',
        a: 'The system uses ArcFace with InsightFace, achieving 99.8% accuracy on LFW benchmark. In real-world school environments, accuracy typically ranges from 95-99% depending on lighting conditions., camera quality, and face registration quality.',
      },
      {
        q: 'How many faces can the system handle?',
        a: 'FAISS can efficiently search millions of face vectors. For a typical school with 500-5000 students, the system performs sub-millisecond searches. Performance remains excellent up to 100,000+ faces.',
      },
      {
        q: 'Does it work with masks?',
        a: 'The system can detect faces with partial occlusion including masks, but accuracy may decrease. For best results, students should remove masks during recognition. The liveness detection module also checks for mask-based spoofing.',
      },
      {
        q: 'What happens during power outage or network failure?',
        a: 'The AI engine stores recognition data locally in buffer. When connection restores, buffered attendance records are synced to the database. Camera feeds may need to be restarted.',
      },
    ],
  },
  {
    category: 'Setup & Configuration',
    items: [
      {
        q: 'What camera specifications are recommended?',
        a: 'Minimum 720p resolution, 15fps. Recommended: 1080p, 30fps with IR capability for low-light. IP cameras with RTSP support work best. USB webcams can be used for single-point setups.',
      },
      {
        q: 'How many photos needed per student for registration?',
        a: '3-5 high-quality photos from different angles (front, slight left, slight right). More photos improve recognition accuracy. Avoid blurry or poorly-lit photos.',
      },
      {
        q: 'What are the system requirements for the AI engine?',
        a: 'Minimum: 4GB RAM, 2-core CPU. Recommended: 8GB+ RAM, 4-core CPU with GPU support (NVIDIA CUDA). GPU acceleration significantly improves recognition speed for live feeds.',
      },
      {
        q: 'Can I use multiple cameras simultaneously?',
        a: 'Yes! The system supports unlimited cameras. Each camera can be assigned to a specific location (entry gate, exit gate, classroom). Multiple cameras feed into the same recognition pipeline.',
      },
    ],
  },
  {
    category: 'Security & Privacy',
    items: [
      {
        q: 'How is student face data protected?',
        a: 'Face embeddings (512-dimensional vectors) are stored, NOT actual photos. These vectors cannot be reverse-engineered back to photos. Data is encrypted at rest in Supabase with Row Level Security (RLS) policies.',
      },
      {
        q: 'What is liveness detection?',
        a: 'Liveness detection prevents spoofing attacks where someone tries to mark attendance using a printed photo, video, or 3D mask. The system analyzes texture, depth cues, and micro-movements to verify a real face.',
      },
      {
        q: 'Who can access face attendance data?',
        a: 'Access is role-based: Super Admin/Admin can see all data. Teachers see their assigned classes. Parents see only their children. All data is branch-isolated and session-scoped.',
      },
    ],
  },
  {
    category: 'Troubleshooting',
    items: [
      {
        q: 'Face recognition is not working',
        a: 'Check: 1) AI Engine is running (port 8501). 2) FAISS index is built. 3) Camera is connected and active. 4) Student face is registered. Use the System Test Dashboard to diagnose issues.',
      },
      {
        q: 'Recognition accuracy is low',
        a: 'Try: 1) Re-register faces with better lighting. 2) Clean camera lens. 3) Adjust camera angle (face should be at least 100x100 pixels). 4) Lower confidence threshold slightly (not below 0.5). 5) Rebuild FAISS index.',
      },
      {
        q: 'AI Engine crashes or won\'t start',
        a: 'Check: 1) Python venv is activated. 2) All dependencies installed (insightface, faiss-cpu, onnxruntime). 3) Port 8501 is not in use. 4) .env file has correct Supabase URL and key. 5) Check logs for specific error.',
      },
      {
        q: 'Spoof detection is too sensitive',
        a: 'Lower the spoof detection sensitivity in Admin Settings. The default threshold works for most environments. If using old/low-quality cameras, consider reducing sensitivity to avoid false positives.',
      },
      {
        q: 'Notifications are not being sent',
        a: 'Check: 1) Notification channels are enabled. 2) Parent contact information is filled. 3) SMS/Email service credentials are configured. 4) Check notification logs for errors. 5) Verify quiet hours are not blocking.',
      },
    ],
  },
];

const moduleGuide = [
  {
    icon: Camera,
    title: 'AI Camera Management',
    description: 'Add, configure, and monitor IP cameras for face recognition',
    path: 'AI Camera Management sidebar menu',
    features: ['Add/Edit cameras', 'Test camera connection', 'View live feeds', 'Camera health monitoring'],
  },
  {
    icon: Users,
    title: 'Face Registration',
    description: 'Enroll student/staff faces for recognition',
    path: 'Face Registration sidebar menu',
    features: ['Capture face photos', 'Extract face embeddings', 'Multi-angle registration', 'Bulk registration'],
  },
  {
    icon: Monitor,
    title: 'Live Face Attendance',
    description: 'Real-time face recognition and attendance marking',
    path: 'Live Face Attendance sidebar menu',
    features: ['Live camera feed', 'Auto-recognition', 'Confidence scores', 'Liveness verification'],
  },
  {
    icon: Shield,
    title: 'Spoof Alerts',
    description: 'Monitor and manage anti-spoofing detections',
    path: 'Spoof Alerts sidebar menu',
    features: ['Photo attack alerts', 'Video replay alerts', 'Mask detection', 'Incident management'],
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Comprehensive attendance analytics and visualizations',
    path: 'Face Analytics Dashboard sidebar menu',
    features: ['Daily/weekly/monthly trends', 'Class comparisons', 'Recognition heatmaps', 'Late arrival tracking'],
  },
  {
    icon: Bell,
    title: 'Notification Settings',
    description: 'Configure parent notifications for attendance events',
    path: 'Notification Settings sidebar menu',
    features: ['SMS/WhatsApp/Email/Push', 'Event type triggers', 'Quiet hours', 'Notification logs'],
  },
  {
    icon: Smartphone,
    title: 'Mobile Access (Parent)',
    description: 'Parents can monitor attendance on mobile devices',
    path: 'Parent Portal → AI Face Attendance',
    features: ['Today\'s status', 'Monthly history', 'Push notifications', 'Face registration status'],
  },
  {
    icon: Wrench,
    title: 'System Test Dashboard',
    description: 'Diagnose system health and run connectivity tests',
    path: 'System Test Dashboard sidebar menu',
    features: ['AI engine health', 'Database checks', 'Camera status', 'Performance tests'],
  },
];

// ═══════════════════════════════ GUIDE STEP CARD ═══════════════════════════════
const SetupStepCard = ({ step }) => {
  const statusColors = {
    required: 'bg-red-100 text-red-700',
    recommended: 'bg-yellow-100 text-yellow-700',
    optional: 'bg-blue-100 text-blue-700',
    final: 'bg-green-100 text-green-700',
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
              {step.step}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{step.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{step.description}</p>
              <ul className="mt-2 space-y-1">
                {step.details.map((detail, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-400" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <Badge className={statusColors[step.status]}>{step.status}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

// ═══════════════════════════════ MODULE GUIDE CARD ═══════════════════════════════
const ModuleGuideCard = ({ module }) => {
  const Icon = module.icon;
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{module.title}</h3>
            <p className="text-xs text-gray-500 mt-1">{module.description}</p>
            <p className="text-xs text-blue-600 mt-1">📍 {module.path}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {module.features.map((f, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {f}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ═══════════════════════════════ MAIN COMPONENT ═══════════════════════════════
export default function FaceAttendanceHelp() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter FAQ based on search
  const filteredFaq = searchQuery.trim()
    ? faqData.map(cat => ({
        ...cat,
        items: cat.items.filter(
          item =>
            item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.a.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(cat => cat.items.length > 0)
    : faqData;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* ═══════ HEADER ═══════ */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-blue-600" />
            📖 Face Attendance Help & Documentation
          </h1>
          <p className="text-gray-500 mt-1">
            Complete guide for AI Face Attendance System - Setup, Usage, FAQ & Troubleshooting
          </p>
        </div>

        {/* ═══════ SEARCH ═══════ */}
        <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search help topics, FAQ, troubleshooting..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* ═══════ QUICK START ALERT ═══════ */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm text-blue-800">Quick Start</h3>
            <p className="text-xs text-blue-600 mt-1">
              To get started with AI Face Attendance: 1) Start the AI Engine → 2) Add Cameras → 
              3) Register Faces → 4) Build FAISS Index → 5) Start Live Attendance. 
              Follow the Setup Guide below for detailed instructions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ═══════ MAIN TABS ═══════ */}
      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="setup">
            <Settings className="w-4 h-4 mr-1" /> Setup Guide
          </TabsTrigger>
          <TabsTrigger value="modules">
            <Monitor className="w-4 h-4 mr-1" /> Modules
          </TabsTrigger>
          <TabsTrigger value="faq">
            <HelpCircle className="w-4 h-4 mr-1" /> FAQ
          </TabsTrigger>
          <TabsTrigger value="troubleshoot">
            <Wrench className="w-4 h-4 mr-1" /> Troubleshoot
          </TabsTrigger>
        </TabsList>

        {/* ═══════ SETUP GUIDE TAB ═══════ */}
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Step-by-Step Setup Guide</CardTitle>
              <CardDescription>
                Follow these steps to set up the AI Face Attendance system from scratch
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {setupGuide.map(step => (
                <SetupStepCard key={step.step} step={step} />
              ))}
            </CardContent>
          </Card>

          {/* System Architecture Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Architecture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800 text-sm">🐍 AI Engine (Python)</h4>
                  <ul className="text-xs text-purple-600 mt-2 space-y-1">
                    <li>• FastAPI on Port 8501</li>
                    <li>• InsightFace / ArcFace Model</li>
                    <li>• FAISS Vector Search</li>
                    <li>• Liveness Detection</li>
                    <li>• Anti-Spoof Module</li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 text-sm">🟢 Backend (Node.js)</h4>
                  <ul className="text-xs text-green-600 mt-2 space-y-1">
                    <li>• Express.js API Server</li>
                    <li>• Face Analytics Routes</li>
                    <li>• Mobile API Endpoints</li>
                    <li>• Notification Service</li>
                    <li>• Supabase Integration</li>
                  </ul>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 text-sm">⚛️ Frontend (React)</h4>
                  <ul className="text-xs text-blue-600 mt-2 space-y-1">
                    <li>• ShadCN UI Components</li>
                    <li>• Recharts Visualizations</li>
                    <li>• Real-time Camera Feed</li>
                    <li>• Role-based Dashboards</li>
                    <li>• Mobile-Responsive</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ MODULES TAB ═══════ */}
        <TabsContent value="modules" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {moduleGuide.map((mod, i) => (
              <ModuleGuideCard key={i} module={mod} />
            ))}
          </div>
        </TabsContent>

        {/* ═══════ FAQ TAB ═══════ */}
        <TabsContent value="faq" className="space-y-4">
          {filteredFaq.map((category, ci) => (
            <Card key={ci}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-blue-600">{category.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="space-y-1">
                  {category.items.map((item, i) => (
                    <AccordionItem key={i} value={`${ci}-${i}`} className="border rounded-lg px-3">
                      <AccordionTrigger className="text-sm text-left py-3 hover:no-underline">
                        <span className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          {item.q}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-gray-600 pb-3">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
          {filteredFaq.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-gray-400">
                <HelpCircle className="w-8 h-8 mx-auto mb-2" />
                <p>No FAQ items match "{searchQuery}"</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════ TROUBLESHOOT TAB ═══════ */}
        <TabsContent value="troubleshoot" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Common Issues & Solutions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  icon: '🔴',
                  title: 'AI Engine Not Responding',
                  check: 'Port 8501 is not accessible',
                  steps: [
                    'Verify Python virtual environment is activated',
                    'Check if port 8501 is already in use: netstat -ano | findstr :8501',
                    'Kill existing process and restart',
                    'Check .env file for correct configuration',
                    'Review AI engine logs for startup errors',
                  ],
                },
                {
                  icon: '🟡',
                  title: 'Low Recognition Accuracy',
                  check: 'Students not being recognized correctly',
                  steps: [
                    'Re-register faces with better lighting conditions',
                    'Ensure face is at least 100x100 pixels in camera view',
                    'Clean camera lens',
                    'Check and adjust confidence threshold (default: 0.6)',
                    'Rebuild FAISS index after re-registration',
                  ],
                },
                {
                  icon: '🟡',
                  title: 'False Spoof Detections',
                  check: 'Real faces flagged as spoofing',
                  steps: [
                    'Go to Admin Settings and lower spoof sensitivity',
                    'Ensure camera has good lighting (avoid backlighting)',
                    'If using old cameras, consider reducing liveness check strictness',
                    'Update the liveness detection model if available',
                  ],
                },
                {
                  icon: '🔴',
                  title: 'Camera Feed Not Working',
                  check: 'No video from IP camera',
                  steps: [
                    'Verify camera IP address and RTSP URL',
                    'Check camera power and network connection',
                    'Test RTSP URL in VLC media player first',
                    'Check firewall rules for camera port',
                    'Verify camera credentials in camera management',
                  ],
                },
                {
                  icon: '🟡',
                  title: 'FAISS Index Empty or Degraded',
                  check: 'Recognition returns no matches',
                  steps: [
                    'Go to FAISS Index Management',
                    'Check if index has face vectors loaded',
                    'Click "Rebuild Index" to regenerate',
                    'Verify face embeddings exist in database',
                    'Check that branch_id matches current branch',
                  ],
                },
              ].map((issue, i) => (
                <div key={i} className="p-4 border rounded-lg hover:shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{issue.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{issue.title}</h4>
                      <p className="text-xs text-gray-500">{issue.check}</p>
                      <ol className="mt-2 space-y-1">
                        {issue.steps.map((step, j) => (
                          <li key={j} className="text-xs text-gray-600 flex items-start gap-2">
                            <span className="bg-gray-200 rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                              {j + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Diagnostic Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔍 Quick Diagnostic Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: 'AI Engine running on port 8501', critical: true },
                  { label: 'FAISS index built with face vectors', critical: true },
                  { label: 'At least 1 camera configured & active', critical: true },
                  { label: 'Student faces registered (min 3 photos each)', critical: true },
                  { label: 'Attendance rules configured', critical: false },
                  { label: 'Notification channels set up', critical: false },
                  { label: 'Spoof detection sensitivity adjusted', critical: false },
                  { label: 'Test Dashboard showing all green', critical: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 border rounded">
                    <CheckCircle className={`w-4 h-4 ${item.critical ? 'text-red-400' : 'text-gray-300'}`} />
                    <span className="text-sm">{item.label}</span>
                    {item.critical && <Badge variant="outline" className="text-xs text-red-500">Required</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
}
