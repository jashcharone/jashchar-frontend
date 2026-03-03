// ============================================================================
// JASHCHAR ERP - WORLD'S BEST ONLINE ADMISSION HUB
// Futuristic, Modern, Professional Design
// Version 2.0 - 100 Year Future-Proof Design
// ============================================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useBranch } from '@/contexts/BranchContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { sortClasses } from '@/utils/classOrderUtils';
import frontCmsService from '@/services/frontCmsService';
import DocumentUploadField from '@/components/common/DocumentUploadField';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import QRCode from 'qrcode';
import { format, parseISO, formatDistanceToNow, subDays, startOfMonth, endOfMonth } from 'date-fns';
import {
  Search, Plus, Eye, Edit2, Trash2, MoreHorizontal,
  Clock, CheckCircle2, XCircle, UserPlus, Filter, Download,
  QrCode, Settings, BarChart3, TrendingUp, Users, Calendar,
  RefreshCw, Loader2, Inbox, Copy, Link2, ExternalLink,
  ListFilter, Save, Printer, Share2, Smartphone, Globe,
  Sparkles, Zap, Target, Award, ArrowUpRight, ArrowDownRight,
  PieChart, Activity, FileText, Mail, Phone, MapPin,
  GraduationCap, Building2, Star, Heart, Bookmark,
  Palette, Grid3X3, Circle, Square, Diamond, Hexagon
} from 'lucide-react';

// ============================================================================
// CONFIGURATION - STATUS, FIELDS, QR STYLES
// ============================================================================

const STATUS_CONFIG = {
  'Pending': { 
    label: 'Pending', 
    icon: Clock, 
    color: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/25',
    bgGlow: 'shadow-lg shadow-amber-500/20'
  },
  'Under Review': { 
    label: 'Under Review', 
    icon: Eye, 
    color: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-blue-500/25',
    bgGlow: 'shadow-lg shadow-blue-500/20'
  },
  'Approved': { 
    label: 'Approved', 
    icon: CheckCircle2, 
    color: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-500/25',
    bgGlow: 'shadow-lg shadow-green-500/20'
  },
  'Rejected': { 
    label: 'Rejected', 
    icon: XCircle, 
    color: 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-red-500/25',
    bgGlow: 'shadow-lg shadow-red-500/20'
  },
  'Enrolled': { 
    label: 'Enrolled', 
    icon: UserPlus, 
    color: 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-purple-500/25',
    bgGlow: 'shadow-lg shadow-purple-500/20'
  }
};

const QR_COLOR_PRESETS = [
  { id: 'default', name: 'Classic Black', fg: '#000000', bg: '#FFFFFF' },
  { id: 'blue', name: 'Ocean Blue', fg: '#1e40af', bg: '#FFFFFF' },
  { id: 'purple', name: 'Royal Purple', fg: '#7c3aed', bg: '#FFFFFF' },
  { id: 'green', name: 'Forest Green', fg: '#059669', bg: '#FFFFFF' },
  { id: 'gradient1', name: 'Sunset', fg: '#dc2626', bg: '#FFFFFF' },
  { id: 'dark', name: 'Dark Mode', fg: '#FFFFFF', bg: '#1f2937' }
];

const ADMISSION_FIELDS = [
  { id: 'first_name', label: 'First Name', category: 'Student Info', required: true },
  { id: 'last_name', label: 'Last Name', category: 'Student Info', required: true },
  { id: 'gender', label: 'Gender', category: 'Student Info', required: true },
  { id: 'date_of_birth', label: 'Date of Birth', category: 'Student Info', required: true },
  { id: 'class_id', label: 'Class', category: 'Academic', required: true },
  { id: 'section', label: 'Section', category: 'Academic' },
  { id: 'blood_group', label: 'Blood Group', category: 'Student Info' },
  { id: 'religion', label: 'Religion', category: 'Student Info' },
  { id: 'caste', label: 'Caste', category: 'Student Info' },
  { id: 'mother_tongue', label: 'Mother Tongue', category: 'Student Info' },
  { id: 'aadhar_number', label: 'Aadhar Number', category: 'Identity' },
  { id: 'father_name', label: 'Father Name', category: 'Parent Info', required: true },
  { id: 'father_phone', label: 'Father Phone', category: 'Parent Info' },
  { id: 'father_occupation', label: 'Father Occupation', category: 'Parent Info' },
  { id: 'mother_name', label: 'Mother Name', category: 'Parent Info' },
  { id: 'mother_phone', label: 'Mother Phone', category: 'Parent Info' },
  { id: 'mother_occupation', label: 'Mother Occupation', category: 'Parent Info' },
  { id: 'guardian_name', label: 'Guardian Name', category: 'Guardian Info' },
  { id: 'guardian_relation', label: 'Guardian Relation', category: 'Guardian Info' },
  { id: 'guardian_phone', label: 'Guardian Phone', category: 'Guardian Info' },
  { id: 'guardian_occupation', label: 'Guardian Occupation', category: 'Guardian Info' },
  { id: 'guardian_address', label: 'Guardian Address', category: 'Guardian Info' },
  { id: 'email', label: 'Email', category: 'Contact', required: true },
  { id: 'mobile_number', label: 'Mobile Number', category: 'Contact', required: true },
  { id: 'current_address', label: 'Current Address', category: 'Address', required: true },
  { id: 'permanent_address', label: 'Permanent Address', category: 'Address' },
  { id: 'city', label: 'City', category: 'Address' },
  { id: 'state', label: 'State', category: 'Address' },
  { id: 'pincode', label: 'Pincode', category: 'Address' },
  { id: 'previous_school', label: 'Previous School', category: 'Previous School' },
  { id: 'previous_class', label: 'Previous Class', category: 'Previous School' },
  { id: 'tc_number', label: 'TC Number', category: 'Previous School' },
  { id: 'photo', label: 'Student Photo', category: 'Documents' },
  { id: 'birth_certificate', label: 'Birth Certificate', category: 'Documents' },
  { id: 'transfer_certificate', label: 'Transfer Certificate', category: 'Documents' },
  { id: 'aadhar_card', label: 'Aadhar Card', category: 'Documents' },
  { id: 'marksheet', label: 'Previous Marksheet', category: 'Documents' }
];

// ============================================================================
// ANIMATED STAT CARD COMPONENT
// ============================================================================

const AnimatedStatCard = ({ title, value, icon: Icon, color, trend, trendValue, description }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const stepValue = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);

  return (
    <Card className={`relative overflow-hidden border-0 ${color} transition-all duration-300 hover:scale-105 hover:shadow-2xl`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">{title}</p>
            <p className="text-4xl font-bold text-white mt-2">{displayValue}</p>
            {description && <p className="text-xs text-white/60 mt-1">{description}</p>}
          </div>
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-4">
            {trend === 'up' ? (
              <ArrowUpRight className="h-4 w-4 text-green-300" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-300" />
            )}
            <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-300' : 'text-red-300'}`}>
              {trendValue}
            </span>
            <span className="text-xs text-white/60">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const OnlineAdmissionList = () => {
  const navigate = useNavigate();
  const { roleSlug } = useParams();
  const basePath = roleSlug || 'super-admin';
  const { toast } = useToast();
  const { selectedBranch } = useBranch();
  const { organizationId } = useAuth();
  const qrRef = useRef(null);
  const printRef = useRef(null);
  
  // Current Branch Info - using selectedBranch from BranchContext
  const currentBranchId = selectedBranch?.id || null;
  const currentBranchName = selectedBranch?.branch_name || selectedBranch?.name || 'All Branches';
  const currentBranch = selectedBranch; // Alias for compatibility
  
  // State Management
  const [loading, setLoading] = useState(true);
  const [admissions, setAdmissions] = useState([]);
  // Direct Links branches - fetched from schools table (same as public page)
  const [branches, setBranches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState([]);
  const [activeTab, setActiveTab] = useState('applications');
  
  // QR Code State
  const [qrLoading, setQrLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [admissionLink, setAdmissionLink] = useState('');
  const [selectedBranchForQR, setSelectedBranchForQR] = useState('all');
  const [qrColorPreset, setQrColorPreset] = useState('default');
  const [qrSize, setQrSize] = useState(300);
  
  // Settings State
  const [settingsSearchTerm, setSettingsSearchTerm] = useState('');
  // Convert array to object format for visible_fields
  const defaultVisibleFields = ADMISSION_FIELDS.reduce((acc, f) => ({ ...acc, [f.id]: true }), {});
  
  const [admissionSettings, setAdmissionSettings] = useState({
    online_admission_enabled: false,
    payment_option_enabled: false,
    form_fees: 0,
    instructions: '',
    terms_conditions: '',
    admission_form_file_url: '',
    visible_fields: defaultVisibleFields
  });
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Dialog State
  const [viewDialog, setViewDialog] = useState({ open: false, admission: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    if (currentBranchId) {
      fetchAdmissions();
      fetchSettings();
      fetchClasses();
    }
  }, [statusFilter, currentBranchId]);

  // Fetch branches for Direct Links from schools table (same as public page)
  useEffect(() => {
    const fetchDirectLinkBranches = async () => {
      if (!organizationId) return;
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('id, name, slug, branch_code, logo_url, is_primary')
          .eq('organization_id', organizationId)
          .order('is_primary', { ascending: false });
        
        if (!error && data) setBranches(data);
      } catch (error) {
        console.error('Error fetching direct link branches:', error);
      }
    };
    fetchDirectLinkBranches();
  }, [organizationId]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .eq('branch_id', currentBranchId);
      
      if (!error && data) setClasses(sortClasses(data));
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchAdmissions = async () => {
    if (!currentBranchId) {
      console.log('[OnlineAdmission] No currentBranchId, skipping fetch');
      setAdmissions([]);
      setLoading(false);
      return;
    }
    
    console.log('[OnlineAdmission] Fetching admissions for branch:', currentBranchId);
    setLoading(true);
    try {
      let query = supabase
        .from('online_admissions')
        .select(`
          *,
          class:classes!online_admissions_class_id_fkey(id, name)
        `)
        .eq('branch_id', currentBranchId) // Filter by current branch
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('enrolled_status', statusFilter);
      }

      const { data, error } = await query;
      console.log('[OnlineAdmission] Fetch result:', { count: data?.length, error: error?.message });
      if (error) throw error;
      setAdmissions(data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch admissions', variant: 'destructive' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await frontCmsService.getOnlineAdmissionSettings(currentBranchId);
      console.log('[OnlineAdmission] Settings response:', response);
      // API returns { success: true, data: {...} }
      const settings = response?.data || response;
      if (settings) {
        // Parse visible_fields if it's a string (from database JSON column)
        let visibleFields = settings.visible_fields;
        if (typeof visibleFields === 'string') {
          try {
            visibleFields = JSON.parse(visibleFields);
          } catch (e) {
            console.warn('[OnlineAdmission] Failed to parse visible_fields:', e);
            visibleFields = defaultVisibleFields;
          }
        }
        // Ensure visibleFields is valid object/array, fallback to defaults
        if (!visibleFields || (typeof visibleFields !== 'object')) {
          visibleFields = defaultVisibleFields;
        }
        
        setAdmissionSettings(prev => ({
          ...prev,
          ...settings,
          visible_fields: visibleFields
        }));
        console.log('[OnlineAdmission] Settings loaded:', { 
          online_admission_enabled: settings.online_admission_enabled,
          payment_option_enabled: settings.payment_option_enabled 
        });
      }
    } catch (error) {
      console.error('[OnlineAdmission] Error fetching settings:', error);
    }
  };

  // ============================================================================
  // STATISTICS CALCULATION
  // ============================================================================

  const stats = useMemo(() => {
    const total = admissions.length;
    const pending = admissions.filter(a => a.enrolled_status === 'Pending' || !a.enrolled_status).length;
    const underReview = admissions.filter(a => a.enrolled_status === 'Under Review').length;
    const approved = admissions.filter(a => a.enrolled_status === 'Approved').length;
    const rejected = admissions.filter(a => a.enrolled_status === 'Rejected').length;
    const enrolled = admissions.filter(a => a.enrolled_status === 'Enrolled').length;
    
    const today = new Date();
    const todayCount = admissions.filter(a => {
      const created = new Date(a.created_at);
      return created.toDateString() === today.toDateString();
    }).length;
    
    const thisWeek = admissions.filter(a => {
      const created = new Date(a.created_at);
      const weekAgo = subDays(today, 7);
      return created >= weekAgo;
    }).length;
    
    const thisMonth = admissions.filter(a => {
      const created = new Date(a.created_at);
      return created >= startOfMonth(today) && created <= endOfMonth(today);
    }).length;
    
    return { total, pending, underReview, approved, rejected, enrolled, todayCount, thisWeek, thisMonth };
  }, [admissions]);

  const filteredAdmissions = useMemo(() => {
    return admissions.filter(admission => {
      const matchesSearch = searchTerm === '' || 
        admission.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admission.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admission.reference_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admission.father_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admission.mobile_number?.includes(searchTerm);
      
      return matchesSearch;
    });
  }, [admissions, searchTerm]);

  // ============================================================================
  // QR CODE GENERATION
  // ============================================================================

  const generateQRCode = async () => {
    // Use the currently selected branch from BranchContext
    if (!currentBranchId) {
      toast({ title: 'Error', description: 'Please select a branch first', variant: 'destructive' });
      return;
    }
    
    setQrLoading(true);
    try {
      let baseUrl = window.location.origin;
      let url;
      
      // Generate QR code for the selected branch only
      if (currentBranch?.slug) {
        url = `${baseUrl}/${currentBranch.slug}/online-admission`;
      } else {
        url = `${baseUrl}/online-admission?branch=${currentBranchId}`;
      }
      
      setAdmissionLink(url);
      
      const colorPreset = QR_COLOR_PRESETS.find(p => p.id === qrColorPreset) || QR_COLOR_PRESETS[0];
      
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: qrSize,
        margin: 2,
        color: {
          dark: colorPreset.fg,
          light: colorPreset.bg
        },
        errorCorrectionLevel: 'H'
      });
      
      setQrCodeUrl(qrDataUrl);
      toast({ title: 'Success', description: 'QR Code generated successfully!' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate QR code', variant: 'destructive' });
      console.error(error);
    } finally {
      setQrLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement('a');
    link.download = `admission-qr-${Date.now()}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const copyAdmissionLink = () => {
    if (admissionLink) {
      navigator.clipboard.writeText(admissionLink);
      toast({ title: 'Success', description: 'Link copied to clipboard!' });
    }
  };

  // ============================================================================
  // PRINT QR CODE TEMPLATE
  // ============================================================================

  const printQRCode = () => {
    const printWindow = window.open('', '_blank');
    const schoolName = currentBranchName || 'School Name';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Online Admission QR Code - ${schoolName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body {
            font-family: 'Inter', system-ui, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          
          .card {
            background: white;
            border-radius: 24px;
            padding: 48px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            text-align: center;
          }
          
          .header {
            margin-bottom: 32px;
          }
          
          .school-name {
            font-size: 24px;
            font-weight: 800;
            color: #1f2937;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          
          .subtitle {
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
          }
          
          .qr-container {
            background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
            border-radius: 20px;
            padding: 24px;
            margin: 24px 0;
            display: inline-block;
          }
          
          .qr-code {
            width: 250px;
            height: 250px;
            border-radius: 12px;
          }
          
          .instructions {
            background: linear-gradient(135deg, #fef3c7, #fde68a);
            border-radius: 12px;
            padding: 16px;
            margin: 24px 0;
          }
          
          .instructions h3 {
            font-size: 14px;
            font-weight: 700;
            color: #92400e;
            margin-bottom: 8px;
          }
          
          .instructions ol {
            text-align: left;
            font-size: 12px;
            color: #78350f;
            padding-left: 20px;
          }
          
          .instructions li {
            margin: 4px 0;
          }
          
          .link-section {
            margin-top: 24px;
            padding: 16px;
            background: #f9fafb;
            border-radius: 12px;
          }
          
          .link-label {
            font-size: 11px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
          }
          
          .link-url {
            font-size: 12px;
            color: #4f46e5;
            word-break: break-all;
            font-weight: 500;
          }
          
          .footer {
            margin-top: 32px;
            font-size: 11px;
            color: #9ca3af;
          }
          
          .badge {
            display: inline-block;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 6px 16px;
            border-radius: 50px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 16px;
          }
          
          @media print {
            body { background: white; }
            .card { box-shadow: none; border: 2px solid #e5e7eb; }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="school-name">${schoolName}</div>
            <div class="subtitle">Online Admission Portal</div>
          </div>
          
          <div class="qr-container">
            <img src="${qrCodeUrl}" alt="QR Code" class="qr-code" />
          </div>
          
          <div class="instructions">
            <h3>📱 How to Apply</h3>
            <ol>
              <li>Open your phone camera or QR scanner app</li>
              <li>Point it at the QR code above</li>
              <li>Click the link that appears</li>
              <li>Fill out the admission form</li>
              <li>Submit and note your reference number</li>
            </ol>
          </div>
          
          <div class="link-section">
            <div class="link-label">Direct Link</div>
            <div class="link-url">${admissionLink}</div>
          </div>
          
          <div class="badge">✨ Apply Online Now</div>
          
          <div class="footer">
            Powered by Jashchar ERP • Scan to apply for admission
          </div>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const handleStatusChange = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('online_admissions')
        .update({ enrolled_status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: 'Success', description: `Status updated to ${newStatus}` });
      fetchAdmissions();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('online_admissions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: 'Success', description: 'Application deleted' });
      setDeleteDialog({ open: false, id: null });
      fetchAdmissions();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete application', variant: 'destructive' });
      console.error(error);
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedItems.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('online_admissions')
        .update({ enrolled_status: newStatus })
        .in('id', selectedItems);

      if (error) throw error;
      
      toast({ title: 'Success', description: `${selectedItems.length} applications updated to ${newStatus}` });
      setSelectedItems([]);
      fetchAdmissions();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update applications', variant: 'destructive' });
      console.error(error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    if (!window.confirm(`Delete ${selectedItems.length} applications?`)) return;
    
    try {
      const { error } = await supabase
        .from('online_admissions')
        .delete()
        .in('id', selectedItems);

      if (error) throw error;
      
      toast({ title: 'Success', description: `${selectedItems.length} applications deleted` });
      setSelectedItems([]);
      fetchAdmissions();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete applications', variant: 'destructive' });
      console.error(error);
    }
  };

  const handleSaveSettings = async () => {
    if (!currentBranchId) {
      toast({ title: 'Error', description: 'Please select a branch first', variant: 'destructive' });
      return;
    }
    
    setSavingSettings(true);
    try {
      console.log('[OnlineAdmission] Saving settings:', {
        online_admission_enabled: admissionSettings.online_admission_enabled,
        payment_option_enabled: admissionSettings.payment_option_enabled
      });
      // Save settings for the current branch only
      const response = await frontCmsService.updateOnlineAdmissionSettings(admissionSettings, currentBranchId);
      console.log('[OnlineAdmission] Save response:', response);
      toast({ title: 'Success', description: `Settings saved for ${currentBranchName}!` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
      console.error('[OnlineAdmission] Save error:', error);
    } finally {
      setSavingSettings(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Reference No', 'First Name', 'Last Name', 'Father Name', 'Mobile', 'Email', 'Class', 'Status', 'Applied Date'];
    const rows = filteredAdmissions.map(a => [
      a.reference_no,
      a.first_name,
      a.last_name,
      a.father_name,
      a.mobile_number,
      a.email,
      a.class?.name,
      a.enrolled_status || 'Pending',
      a.created_at ? format(parseISO(a.created_at), 'dd-MMM-yyyy') : ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `online-admissions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    
    toast({ title: 'Success', description: 'Exported to CSV' });
  };

  // Field visibility helpers - supports both array and object formats
  const toggleField = (fieldId) => {
    setAdmissionSettings(prev => {
      const currentFields = prev.visible_fields;
      // Handle object format (from database)
      if (currentFields && typeof currentFields === 'object' && !Array.isArray(currentFields)) {
        return {
          ...prev,
          visible_fields: {
            ...currentFields,
            [fieldId]: !currentFields[fieldId]
          }
        };
      }
      // Handle array format (legacy)
      const fieldsArray = Array.isArray(currentFields) ? currentFields : [];
      return {
        ...prev,
        visible_fields: fieldsArray.includes(fieldId)
          ? fieldsArray.filter(f => f !== fieldId)
          : [...fieldsArray, fieldId]
      };
    });
  };

  const isFieldVisible = (fieldId) => {
    const fields = admissionSettings.visible_fields;
    // Handle object format (from database)
    if (fields && typeof fields === 'object' && !Array.isArray(fields)) {
      return fields[fieldId] === true;
    }
    // Handle array format (legacy)
    return Array.isArray(fields) && fields.includes(fieldId);
  };

  const groupedFields = useMemo(() => {
    const filtered = ADMISSION_FIELDS.filter(f => 
      f.label.toLowerCase().includes(settingsSearchTerm.toLowerCase())
    );
    return filtered.reduce((acc, field) => {
      if (!acc[field.category]) acc[field.category] = [];
      acc[field.category].push(field);
      return acc;
    }, {});
  }, [settingsSearchTerm]);

  // ============================================================================
  // RENDER
  // ============================================================================

  // Show alert if no branch is selected
  if (!currentBranchId) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border-2 border-amber-200 dark:border-amber-800 max-w-md text-center">
              <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-full w-fit mx-auto mb-4">
                <Building2 className="h-12 w-12 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-amber-800 dark:text-amber-200 mb-2">
                ಶಾಖೆ ಆಯ್ಕೆ ಮಾಡಿ / Select a Branch
              </h2>
              <p className="text-amber-700 dark:text-amber-300">
                ದಯವಿಟ್ಟು ಮೇಲಿನ ಹೆಡ್ಡರ್‌ನಿಂದ ಶಾಖೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿ. ಪ್ರತಿ ಶಾಖೆಯು ತನ್ನದೇ ಆದ ದಾಖಲಾತಿ ಸೆಟ್ಟಿಂಗ್‌ಗಳು ಮತ್ತು ಅರ್ಜಿಗಳನ್ನು ಹೊಂದಿದೆ.
              </p>
              <p className="text-amber-600 dark:text-amber-400 text-sm mt-2">
                Please select a branch from the header above. Each branch has its own admission settings and applications.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header with Gradient Background */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,white)]" />
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <GraduationCap className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Online Admission Hub</h1>
                    <p className="text-white/80 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {currentBranchName} - Admission Management
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => {
                    generateQRCode();
                    setActiveTab('qrcode');
                  }}
                  disabled={!currentBranchId}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0"
                >
                  <QrCode className="mr-2 h-4 w-4" /> Generate QR
                </Button>
                <Button 
                  onClick={() => window.open(`/${currentBranch?.slug || currentBranch?.school_alias}/online-admission`, '_blank')}
                  className="bg-white text-purple-600 hover:bg-white/90"
                  disabled={!currentBranch?.slug && !currentBranch?.school_alias}
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> View Form
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <AnimatedStatCard
            title="Total Applications"
            value={stats.total}
            icon={Users}
            color="bg-gradient-to-br from-slate-700 to-slate-900"
            description="All time"
          />
          <AnimatedStatCard
            title="Pending Review"
            value={stats.pending}
            icon={Clock}
            color="bg-gradient-to-br from-amber-500 to-orange-600"
            trend="up"
            trendValue="+12%"
          />
          <AnimatedStatCard
            title="Under Review"
            value={stats.underReview}
            icon={Eye}
            color="bg-gradient-to-br from-blue-500 to-cyan-600"
          />
          <AnimatedStatCard
            title="Approved"
            value={stats.approved}
            icon={CheckCircle2}
            color="bg-gradient-to-br from-green-500 to-emerald-600"
            trend="up"
            trendValue="+8%"
          />
          <AnimatedStatCard
            title="Rejected"
            value={stats.rejected}
            icon={XCircle}
            color="bg-gradient-to-br from-red-500 to-rose-600"
            trend="down"
            trendValue="-3%"
          />
          <AnimatedStatCard
            title="Enrolled"
            value={stats.enrolled}
            icon={UserPlus}
            color="bg-gradient-to-br from-purple-500 to-violet-600"
            trend="up"
            trendValue="+15%"
          />
          <AnimatedStatCard
            title="Today"
            value={stats.todayCount}
            icon={Sparkles}
            color="bg-gradient-to-br from-pink-500 to-rose-600"
            description="New applications"
          />
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border dark:border-gray-700 shadow-lg p-1 rounded-xl">
            <TabsTrigger value="applications" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg px-6">
              <Users className="mr-2 h-4 w-4" /> Applications
            </TabsTrigger>
            <TabsTrigger value="qrcode" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg px-6">
              <QrCode className="mr-2 h-4 w-4" /> QR Code
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg px-6">
              <BarChart3 className="mr-2 h-4 w-4" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg px-6">
              <Settings className="mr-2 h-4 w-4" /> Settings
            </TabsTrigger>
            <TabsTrigger value="fields" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg px-6">
              <ListFilter className="mr-2 h-4 w-4" /> Fields
            </TabsTrigger>
          </TabsList>

          {/* ==================== APPLICATIONS TAB ==================== */}
          <TabsContent value="applications" className="mt-6">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="border-b dark:border-gray-700 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-800 dark:to-gray-900">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl dark:text-white">Application List</CardTitle>
                    <CardDescription className="dark:text-gray-400">Manage all online admission applications</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search applications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[160px] bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedItems.length > 0 && (
                      <>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600">
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Status ({selectedItems.length})
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                              const Icon = config.icon;
                              return (
                                <DropdownMenuItem key={key} onClick={() => handleBulkStatusChange(key)}>
                                  <Icon className="mr-2 h-4 w-4" /> {config.label}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedItems.length})
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm" onClick={exportToCSV} className="bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600">
                      <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchAdmissions} className="bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600">
                      <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                    <p className="text-muted-foreground">Loading applications...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50 dark:bg-gray-700/50">
                          <TableHead className="w-[40px] dark:text-gray-300">
                            <Checkbox
                              checked={selectedItems.length === filteredAdmissions.length && filteredAdmissions.length > 0}
                              onCheckedChange={(checked) => {
                                setSelectedItems(checked ? filteredAdmissions.map(a => a.id) : []);
                              }}
                            />
                          </TableHead>
                          <TableHead className="font-semibold dark:text-gray-300">Reference No</TableHead>
                          <TableHead className="font-semibold dark:text-gray-300">Student Name</TableHead>
                          <TableHead className="font-semibold dark:text-gray-300">Class</TableHead>
                          <TableHead className="font-semibold dark:text-gray-300">Father Name</TableHead>
                          <TableHead className="font-semibold dark:text-gray-300">Mobile</TableHead>
                          <TableHead className="font-semibold dark:text-gray-300">Status</TableHead>
                          <TableHead className="font-semibold dark:text-gray-300">Applied</TableHead>
                          <TableHead className="text-right font-semibold dark:text-gray-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAdmissions.map((admission) => {
                          const statusConfig = STATUS_CONFIG[admission.enrolled_status] || STATUS_CONFIG.Pending;
                          const StatusIcon = statusConfig.icon;
                          
                          return (
                            <TableRow key={admission.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-700/50 transition-colors">
                              <TableCell>
                                <Checkbox
                                  checked={selectedItems.includes(admission.id)}
                                  onCheckedChange={(checked) => {
                                    setSelectedItems(prev => 
                                      checked 
                                        ? [...prev, admission.id]
                                        : prev.filter(id => id !== admission.id)
                                    );
                                  }}
                                />
                              </TableCell>
                              <TableCell className="font-mono text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                {admission.reference_no}
                              </TableCell>
                              <TableCell className="font-medium dark:text-white">
                                {admission.first_name} {admission.last_name}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-slate-100 dark:bg-gray-700 dark:text-gray-200">
                                  {admission.class?.name}
                                </Badge>
                              </TableCell>
                              <TableCell className="dark:text-gray-300">{admission.father_name}</TableCell>
                              <TableCell>
                                <span className="font-mono text-sm dark:text-gray-300">{admission.mobile_number}</span>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${statusConfig.color} flex items-center gap-1 w-fit px-3 py-1`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {statusConfig.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {admission.created_at && formatDistanceToNow(parseISO(admission.created_at), { addSuffix: true })}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => setViewDialog({ open: true, admission })}>
                                      <Eye className="mr-2 h-4 w-4" /> View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate(`/${basePath}/student-information/online-admission/edit/${admission.id}`)}>
                                      <Edit2 className="mr-2 h-4 w-4" /> Edit & Enroll
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                                      const Icon = config.icon;
                                      return (
                                        <DropdownMenuItem key={key} onClick={() => handleStatusChange(admission.id, key)}>
                                          <Icon className="mr-2 h-4 w-4" /> {config.label}
                                        </DropdownMenuItem>
                                      );
                                    })}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="text-red-600"
                                      onClick={() => setDeleteDialog({ open: true, id: admission.id })}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {filteredAdmissions.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-16">
                              <div className="flex flex-col items-center">
                                <div className="p-4 bg-slate-100 dark:bg-gray-700 rounded-full mb-4">
                                  <Inbox className="h-10 w-10 text-slate-400 dark:text-gray-500" />
                                </div>
                                <p className="text-lg font-medium text-slate-600 dark:text-gray-300">No applications found</p>
                                <p className="text-sm text-muted-foreground dark:text-gray-500 mt-1">Applications will appear here when students apply</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== QR CODE TAB ==================== */}
          <TabsContent value="qrcode" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* QR Generator Card */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-b dark:border-gray-700">
                  <CardTitle className="flex items-center gap-2 text-xl dark:text-white">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                      <QrCode className="h-5 w-5 text-white" />
                    </div>
                    QR Code Generator
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Generate beautiful QR codes for online admission
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Current Branch Info - Read only, shows selected branch */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Generating QR for</p>
                        <p className="text-lg font-bold text-blue-800 dark:text-blue-200">{currentBranchName}</p>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-2">
                      QR code will be generated for this branch's admission form. Change branch from the header to generate QR for different branch.
                    </p>
                  </div>

                  {/* Color Preset */}
                  <div className="space-y-2">
                    <Label className="font-medium dark:text-gray-200">Color Preset</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {QR_COLOR_PRESETS.map(preset => (
                        <button
                          key={preset.id}
                          onClick={() => setQrColorPreset(preset.id)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            qrColorPreset === preset.id 
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' 
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 dark:bg-gray-700'
                          }`}
                        >
                          <div 
                            className="w-6 h-6 rounded-full mx-auto mb-1 border"
                            style={{ backgroundColor: preset.fg }}
                          />
                          <p className="text-xs font-medium text-center dark:text-gray-200">{preset.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* QR Size */}
                  <div className="space-y-2">
                    <Label className="font-medium dark:text-gray-200">QR Size: {qrSize}px</Label>
                    <input
                      type="range"
                      min="200"
                      max="500"
                      value={qrSize}
                      onChange={(e) => setQrSize(parseInt(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  {/* Generate Button */}
                  <Button 
                    onClick={() => generateQRCode()} 
                    disabled={qrLoading || !currentBranchId}
                    className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl disabled:opacity-50"
                  >
                    {qrLoading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-5 w-5" />
                    )}
                    Generate QR Code
                  </Button>
                </CardContent>
              </Card>

              {/* QR Preview Card */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-b dark:border-gray-700">
                  <CardTitle className="flex items-center gap-2 text-xl dark:text-white">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                      <Eye className="h-5 w-5 text-white" />
                    </div>
                    QR Preview
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Preview and download your generated QR code
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {qrCodeUrl ? (
                    <div className="space-y-6">
                      {/* QR Code Display */}
                      <div className="flex justify-center">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-30 animate-pulse" />
                          <div className="relative p-6 bg-white dark:bg-gray-700 rounded-2xl shadow-2xl border dark:border-gray-600">
                            <img 
                              src={qrCodeUrl} 
                              alt="Admission QR Code" 
                              className="w-64 h-64 rounded-lg"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Link Display */}
                      <div className="p-4 bg-slate-50 dark:bg-gray-700 rounded-xl">
                        <Label className="text-xs text-muted-foreground dark:text-gray-400 uppercase tracking-wider">Admission Link</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Input 
                            value={admissionLink} 
                            readOnly 
                            className="bg-white dark:bg-gray-600 dark:text-white dark:border-gray-500 font-mono text-sm"
                          />
                          <Button variant="outline" size="icon" onClick={copyAdmissionLink}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => window.open(admissionLink, '_blank')}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Button 
                          variant="outline" 
                          onClick={downloadQRCode}
                          className="h-12 flex-col gap-1 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                        >
                          <Download className="h-4 w-4" />
                          <span className="text-xs">Download</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={printQRCode}
                          className="h-12 flex-col gap-1 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                        >
                          <Printer className="h-4 w-4" />
                          <span className="text-xs">Print</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({ title: 'Online Admission', url: admissionLink });
                            } else {
                              copyAdmissionLink();
                            }
                          }}
                          className="h-12 flex-col gap-1 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                        >
                          <Share2 className="h-4 w-4" />
                          <span className="text-xs">Share</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="p-6 bg-gradient-to-r from-slate-100 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-full mb-4">
                        <QrCode className="h-12 w-12 text-slate-400 dark:text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-slate-600 dark:text-gray-300">No QR Code Generated</p>
                      <p className="text-sm text-muted-foreground dark:text-gray-500 mt-1">Click "Generate QR Code" to create one</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Links Section */}
            <Card className="mt-6 border-0 shadow-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Direct Links for Each Branch
                    </h3>
                    <p className="text-white/80 text-sm mt-1">Share these links directly with parents</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {branches.slice(0, 4).map(branch => (
                      <Button
                        key={branch.id}
                        variant="secondary"
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 text-white border-0"
                        onClick={() => {
                          const link = `${window.location.origin}/${branch.slug}/online-admission`;
                          navigator.clipboard.writeText(link);
                          toast({ title: 'Copied!', description: `Link copied for ${branch.name}` });
                        }}
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        {branch.slug?.toUpperCase() || branch.name?.substring(0, 10)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== ANALYTICS TAB ==================== */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-b dark:border-gray-700">
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                      <PieChart className="h-5 w-5 text-white" />
                    </div>
                    Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                      const count = status === 'Pending' ? stats.pending :
                                   status === 'Under Review' ? stats.underReview :
                                   status === 'Approved' ? stats.approved :
                                   status === 'Enrolled' ? stats.enrolled :
                                   stats.rejected;
                      const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                      const Icon = config.icon;
                      
                      return (
                        <div key={status} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                          <div className={`p-3 rounded-xl ${config.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-2">
                              <span className="font-medium dark:text-gray-200">{config.label}</span>
                              <span className="font-bold text-slate-700 dark:text-gray-300">{count} ({percentage}%)</span>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${config.color} transition-all duration-1000`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              {/* Quick Stats */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-b dark:border-gray-700">
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200 dark:border-green-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">Conversion Rate</p>
                      </div>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {stats.total > 0 ? Math.round((stats.enrolled / stats.total) * 100) : 0}%
                      </p>
                      <p className="text-xs text-green-500 dark:text-green-500 mt-1">Applications → Enrolled</p>
                    </div>
                    <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Pending Rate</p>
                      </div>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%
                      </p>
                      <p className="text-xs text-blue-500 dark:text-blue-500 mt-1">Awaiting review</p>
                    </div>
                    <div className="p-5 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/30 dark:to-violet-900/30 rounded-xl border border-purple-200 dark:border-purple-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <p className="text-sm font-medium text-purple-700 dark:text-purple-400">Approval Rate</p>
                      </div>
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {stats.total > 0 ? Math.round(((stats.approved + stats.enrolled) / stats.total) * 100) : 0}%
                      </p>
                      <p className="text-xs text-purple-500 dark:text-purple-500 mt-1">Approved + Enrolled</p>
                    </div>
                    <div className="p-5 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 rounded-xl border border-red-200 dark:border-red-700">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <p className="text-sm font-medium text-red-700 dark:text-red-400">Rejection Rate</p>
                      </div>
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                        {stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0}%
                      </p>
                      <p className="text-xs text-red-500 dark:text-red-500 mt-1">Applications rejected</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Time-based Stats */}
              <Card className="lg:col-span-2 border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-b dark:border-gray-700">
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    Applications Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                          <Sparkles className="h-6 w-6" />
                        </div>
                        <span className="font-medium">Today</span>
                      </div>
                      <p className="text-4xl font-bold">{stats.todayCount}</p>
                      <p className="text-white/70 text-sm mt-1">New applications</p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-white">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                          <Calendar className="h-6 w-6" />
                        </div>
                        <span className="font-medium">This Week</span>
                      </div>
                      <p className="text-4xl font-bold">{stats.thisWeek}</p>
                      <p className="text-white/70 text-sm mt-1">Last 7 days</p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl text-white">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                          <BarChart3 className="h-6 w-6" />
                        </div>
                        <span className="font-medium">This Month</span>
                      </div>
                      <p className="text-4xl font-bold">{stats.thisMonth}</p>
                      <p className="text-white/70 text-sm mt-1">Current month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ==================== SETTINGS TAB ==================== */}
          <TabsContent value="settings" className="mt-6">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-800 dark:to-gray-900 border-b dark:border-gray-700">
                <CardTitle className="flex items-center gap-2 text-xl dark:text-white">
                  <div className="p-2 bg-gradient-to-r from-slate-600 to-gray-700 rounded-lg">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  Online Admission Settings
                </CardTitle>
                <CardDescription className="dark:text-gray-400">Configure admission form behavior and content</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Enable Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200 dark:border-green-700">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <Globe className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <Label htmlFor="online_admission" className="font-medium dark:text-white">Online Admission</Label>
                        <p className="text-sm text-muted-foreground dark:text-gray-400">Enable/disable the admission form</p>
                      </div>
                    </div>
                    <Switch
                      id="online_admission"
                      checked={admissionSettings.online_admission_enabled}
                      onCheckedChange={async (checked) => {
                        setAdmissionSettings(prev => ({ ...prev, online_admission_enabled: checked }));
                        // Auto-save when toggle changes
                        try {
                          await frontCmsService.updateOnlineAdmissionSettings(
                            { ...admissionSettings, online_admission_enabled: checked },
                            currentBranchId
                          );
                          toast({ title: checked ? 'Enabled' : 'Disabled', description: `Online admission ${checked ? 'enabled' : 'disabled'} successfully!` });
                        } catch (error) {
                          toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
                        }
                      }}
                      className="data-[state=checked]:bg-green-600"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Zap className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <Label htmlFor="payment_option" className="font-medium dark:text-white">Payment Option</Label>
                        <p className="text-sm text-muted-foreground dark:text-gray-400">Enable online payment</p>
                      </div>
                    </div>
                    <Switch
                      id="payment_option"
                      checked={admissionSettings.payment_option_enabled}
                      onCheckedChange={async (checked) => {
                        setAdmissionSettings(prev => ({ ...prev, payment_option_enabled: checked }));
                        // Auto-save when toggle changes
                        try {
                          await frontCmsService.updateOnlineAdmissionSettings(
                            { ...admissionSettings, payment_option_enabled: checked },
                            currentBranchId
                          );
                          toast({ title: checked ? 'Enabled' : 'Disabled', description: `Payment option ${checked ? 'enabled' : 'disabled'} successfully!` });
                        } catch (error) {
                          toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
                        }
                      }}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>
                </div>

                {/* Form Fees */}
                <div className="space-y-2">
                  <Label htmlFor="form_fees" className="font-medium dark:text-gray-200">Admission Form Fees (₹)</Label>
                  <Input
                    id="form_fees"
                    type="number"
                    value={admissionSettings.form_fees}
                    onChange={(e) => setAdmissionSettings(prev => ({ ...prev, form_fees: parseFloat(e.target.value) || 0 }))}
                    className="max-w-xs bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label className="font-medium dark:text-gray-200">Upload Admission Form (PDF)</Label>
                  <div className="max-w-md">
                    <DocumentUploadField
                      onUpload={(url) => setAdmissionSettings(prev => ({ ...prev, admission_form_file_url: url }))}
                      label={admissionSettings.admission_form_file_url ? "Change File" : "Drag and drop a file"}
                    />
                    {admissionSettings.admission_form_file_url && (
                      <a href={admissionSettings.admission_form_file_url} target="_blank" rel="noreferrer" className="text-sm text-primary underline mt-2 inline-flex items-center gap-1">
                        <FileText className="h-3 w-3" /> View Uploaded Form
                      </a>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-2">
                  <Label className="font-medium dark:text-gray-200">Instructions</Label>
                  <ReactQuill
                    theme="snow"
                    value={admissionSettings.instructions || ''}
                    onChange={(value) => setAdmissionSettings(prev => ({ ...prev, instructions: value }))}
                    className="h-40 mb-12 bg-white dark:bg-gray-700 rounded-lg [&_.ql-toolbar]:dark:bg-gray-600 [&_.ql-toolbar]:dark:border-gray-500 [&_.ql-container]:dark:border-gray-500 [&_.ql-editor]:dark:text-white"
                  />
                </div>

                {/* Terms & Conditions */}
                <div className="space-y-2">
                  <Label className="font-medium dark:text-gray-200">Terms & Conditions</Label>
                  <ReactQuill
                    theme="snow"
                    value={admissionSettings.terms_conditions || ''}
                    onChange={(value) => setAdmissionSettings(prev => ({ ...prev, terms_conditions: value }))}
                    className="h-40 mb-12 bg-white dark:bg-gray-700 rounded-lg [&_.ql-toolbar]:dark:bg-gray-600 [&_.ql-toolbar]:dark:border-gray-500 [&_.ql-container]:dark:border-gray-500 [&_.ql-editor]:dark:text-white"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSaveSettings} 
                    disabled={savingSettings} 
                    className="h-12 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {savingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== FIELDS TAB ==================== */}
          <TabsContent value="fields" className="mt-6">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 border-b dark:border-gray-700">
                <CardTitle className="flex items-center gap-2 text-xl dark:text-white">
                  <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg">
                    <ListFilter className="h-5 w-5 text-white" />
                  </div>
                  Admission Form Fields
                </CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Configure which fields to show/hide on the admission form
                </CardDescription>
                <div className="pt-4">
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search fields..."
                      value={settingsSearchTerm}
                      onChange={(e) => setSettingsSearchTerm(e.target.value)}
                      className="pl-9 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {Object.entries(groupedFields).map(([category, fields]) => (
                    <div key={category} className="space-y-3">
                      <h3 className="text-sm font-bold text-violet-700 dark:text-violet-400 border-b border-violet-200 dark:border-violet-700 pb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-violet-500 rounded-full" />
                        {category}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {fields.map((field) => (
                          <div 
                            key={field.id} 
                            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                              isFieldVisible(field.id)
                                ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700'
                                : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium dark:text-white">{field.label}</span>
                              {field.required && (
                                <Badge variant="outline" className="text-xs bg-red-100 text-red-600 border-red-200">
                                  Required
                                </Badge>
                              )}
                            </div>
                            <Switch
                              checked={isFieldVisible(field.id)}
                              onCheckedChange={() => toggleField(field.id)}
                              disabled={field.required}
                              className="data-[state=checked]:bg-green-600"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end pt-6">
                  <Button 
                    onClick={handleSaveSettings} 
                    disabled={savingSettings} 
                    className="h-12 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {savingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Field Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ==================== VIEW DIALOG ==================== */}
        <Dialog open={viewDialog.open} onOpenChange={(open) => setViewDialog({ open, admission: null })}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 -m-6 mb-0 p-6 text-white rounded-t-lg">
              <DialogTitle className="text-xl">Application Details</DialogTitle>
              <DialogDescription className="text-white/80">
                Reference: {viewDialog.admission?.reference_no}
              </DialogDescription>
            </DialogHeader>
            {viewDialog.admission && (
              <div className="grid grid-cols-2 gap-4 text-sm p-4">
                <div className="p-3 bg-slate-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-xs text-muted-foreground dark:text-gray-400 uppercase tracking-wider">Student Name</span>
                  <p className="font-medium mt-1 dark:text-white">{viewDialog.admission.first_name} {viewDialog.admission.last_name}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-xs text-muted-foreground dark:text-gray-400 uppercase tracking-wider">Class</span>
                  <p className="font-medium mt-1 dark:text-white">{viewDialog.admission.class?.name}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-xs text-muted-foreground dark:text-gray-400 uppercase tracking-wider">Father Name</span>
                  <p className="font-medium mt-1 dark:text-white">{viewDialog.admission.father_name}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-xs text-muted-foreground dark:text-gray-400 uppercase tracking-wider">Mother Name</span>
                  <p className="font-medium mt-1 dark:text-white">{viewDialog.admission.mother_name}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-xs text-muted-foreground dark:text-gray-400 uppercase tracking-wider">Mobile</span>
                  <p className="font-medium mt-1 dark:text-white">{viewDialog.admission.mobile_number}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-xs text-muted-foreground dark:text-gray-400 uppercase tracking-wider">Email</span>
                  <p className="font-medium mt-1 dark:text-white">{viewDialog.admission.email}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-xs text-muted-foreground dark:text-gray-400 uppercase tracking-wider">Date of Birth</span>
                  <p className="font-medium mt-1 dark:text-white">{viewDialog.admission.date_of_birth && format(parseISO(viewDialog.admission.date_of_birth), 'dd-MMM-yyyy')}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-xs text-muted-foreground dark:text-gray-400 uppercase tracking-wider">Gender</span>
                  <p className="font-medium mt-1 dark:text-white">{viewDialog.admission.gender}</p>
                </div>
                <div className="col-span-2 p-3 bg-slate-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-xs text-muted-foreground dark:text-gray-400 uppercase tracking-wider">Address</span>
                  <p className="font-medium mt-1 dark:text-white">{viewDialog.admission.current_address}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-xs text-muted-foreground dark:text-gray-400 uppercase tracking-wider">Status</span>
                  <Badge className={`${STATUS_CONFIG[viewDialog.admission.enrolled_status]?.color || STATUS_CONFIG.Pending.color} mt-1`}>
                    {viewDialog.admission.enrolled_status || 'Pending'}
                  </Badge>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-xs text-muted-foreground dark:text-gray-400 uppercase tracking-wider">Applied On</span>
                  <p className="font-medium mt-1 dark:text-white">{viewDialog.admission.created_at && format(parseISO(viewDialog.admission.created_at), 'dd-MMM-yyyy hh:mm a')}</p>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setViewDialog({ open: false, admission: null })}>
                Close
              </Button>
              <Button 
                onClick={() => {
                  navigate(`/${basePath}/student-information/online-admission/edit/${viewDialog.admission?.id}`);
                  setViewDialog({ open: false, admission: null });
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600"
              >
                <Edit2 className="mr-2 h-4 w-4" /> Edit & Enroll
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ==================== DELETE DIALOG ==================== */}
        <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, id: null })}>
          <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Trash2 className="h-5 w-5" />
                Delete Application?
              </DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                This action cannot be undone. The application will be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteDialog({ open: false, id: null })}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteDialog.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default OnlineAdmissionList;
