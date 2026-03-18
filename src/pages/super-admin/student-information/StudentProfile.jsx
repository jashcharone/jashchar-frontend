/**
 * 🌟 WORLD-CLASS STUDENT PROFILE PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Designed for 100+ years of use - The most comprehensive student profile system
 * Features: Beautiful UI, All Information, Print/Export, QR Code, Timeline, etc.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { supabase } from '@/lib/customSupabaseClient';
import api from '@/lib/api';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, User, Calendar, MapPin, Phone, Mail, BookOpen, Bus, Home, Download, 
  Printer, QrCode, FileText, UserCog, Shield, Files, Building, BedDouble, 
  GraduationCap, Edit, Share2, MoreVertical, Heart, Activity, Award, 
  Clock, CreditCard, CheckCircle2, AlertCircle, XCircle, TrendingUp,
  Users, IndianRupee, Percent, Star, ChevronRight, Eye, Camera, 
  Fingerprint, Globe, Flag, Hash, CalendarDays, School, Briefcase,
  MessageSquare, Bell, Settings, History, FileCheck, Upload, ArrowLeft,
  CircleDot, Sparkles, Zap, Target, BarChart3, PieChart, LineChart, Brain, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInYears, differenceInMonths } from 'date-fns';
import StudentProfileFeesTab from './StudentProfileFeesTab';
import StudentProfileAttendanceTab from './StudentProfileAttendanceTab';
import StudentProfileHealthTab from './StudentProfileHealthTab';
import StudentProfileBehaviorTab from './StudentProfileBehaviorTab';
import StudentProfileDocChecklistSection from './StudentProfileDocChecklistSection';
import StudentProfileAcademicTracker from './StudentProfileAcademicTracker';
import StudentProfileSiblingsTab from './StudentProfileSiblingsTab';
import StudentProfileTimeline from './StudentProfileTimeline';
import StudentProfileAIInsightsTab from './StudentProfileAIInsightsTab';
import DocumentUploadField from '@/components/common/DocumentUploadField';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 PREMIUM COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const GlassCard = ({ children, className, gradient = false, hover = true, ...props }) => (
  <div 
    className={cn(
      "relative overflow-hidden rounded-2xl border border-white/20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl",
      gradient && "bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-gray-900/90 dark:via-gray-900/80 dark:to-gray-900/70",
      hover && "transition-all duration-500 hover:shadow-2xl hover:scale-[1.01] hover:border-primary/30",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

const StatCard = ({ icon: Icon, label, value, subValue, trend, color = "blue", onClick }) => {
  const colorClasses = {
    blue: "from-blue-500 to-indigo-600 text-blue-600 bg-blue-50 dark:bg-blue-950/30",
    green: "from-emerald-500 to-green-600 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
    orange: "from-orange-500 to-amber-600 text-orange-600 bg-orange-50 dark:bg-orange-950/30",
    purple: "from-purple-500 to-violet-600 text-purple-600 bg-purple-50 dark:bg-purple-950/30",
    red: "from-red-500 to-rose-600 text-red-600 bg-red-50 dark:bg-red-950/30",
    pink: "from-pink-500 to-rose-600 text-pink-600 bg-pink-50 dark:bg-pink-950/30",
  };
  
  return (
    <GlassCard 
      className={cn("p-5 cursor-pointer group", onClick && "cursor-pointer")} 
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className={cn("p-3 rounded-xl", colorClasses[color].split(' ').slice(2).join(' '))}>
          <Icon className={cn("h-6 w-6", colorClasses[color].split(' ')[2])} />
        </div>
        {trend && (
          <Badge variant={trend > 0 ? "success" : "destructive"} className="text-xs">
            {trend > 0 ? '+' : ''}{trend}%
          </Badge>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{value}</p>
        {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
      </div>
      <div className="absolute bottom-0 right-0 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-full h-full" />
      </div>
    </GlassCard>
  );
};

const InfoItem = ({ icon: Icon, label, value, copyable = false, className = "" }) => {
  const { toast } = useToast();
  
  const handleCopy = () => {
    if (copyable && value) {
      navigator.clipboard.writeText(value);
      toast({ title: "Copied!", description: `${label} copied to clipboard` });
    }
  };
  
  return (
    <div className={cn("flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group", className)}>
      <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className={cn(
          "text-sm font-semibold mt-0.5 break-words",
          !value && "text-muted-foreground italic"
        )}>
          {value || 'Not Provided'}
        </p>
      </div>
      {copyable && value && (
        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8" onClick={handleCopy}>
          <Files className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
};

const SectionTitle = ({ icon: Icon, title, subtitle, action }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

const TimelineItem = ({ icon: Icon, title, description, date, status = "completed" }) => {
  const statusColors = {
    completed: "bg-emerald-500",
    pending: "bg-amber-500",
    cancelled: "bg-red-500",
  };
  
  return (
    <div className="flex gap-4 pb-6 last:pb-0">
      <div className="flex flex-col items-center">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white", statusColors[status])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="w-0.5 flex-1 bg-border mt-2" />
      </div>
      <div className="flex-1 pb-4">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <Calendar className="h-3 w-3" /> {date}
        </p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const StudentProfile = () => {
  const { studentId, roleSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, currentSessionId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  
  // Dynamic base path for navigation
  const basePath = roleSlug || 'super-admin';
  
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formSections, setFormSections] = useState([]);
  const [allFields, setAllFields] = useState([]);
  const [customData, setCustomData] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [feesSummary, setFeesSummary] = useState({ total: 0, paid: 0, balance: 0 });
  const [attendanceSummary, setAttendanceSummary] = useState({ present: 0, absent: 0, total: 0 });
  const [behaviorSummary, setBehaviorSummary] = useState({ total: 0, positive: 0, negative: 0, score: 0 });
  const [examSummary, setExamSummary] = useState({ avgPercent: 0, rank: null, totalExams: 0 });
  const [refreshKey, setRefreshKey] = useState(0); // For forcing refresh
  const [isExporting, setIsExporting] = useState(false); // PDF export loading state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false); // Document upload dialog
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [newDocumentUrl, setNewDocumentUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(''); // TC-60: QR Code data URL for display

  // Validate studentId is a proper UUID (not a route template like ':studentId')
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const validStudentId = studentId && uuidRegex.test(studentId) ? studentId : null;
  const targetId = validStudentId || user?.id;
  // Use selectedBranch.id consistently (same as Edit page)
  // For students viewing their own profile, branch_id comes from user_metadata
  const branchId = selectedBranch?.id || user?.profile?.branch_id || user?.user_metadata?.branch_id;
  
  // Check if viewing own profile (student role)
  const isViewingOwnProfile = !studentId && user?.role === 'student';

  // 🖨️ PDF Export ref and handler
  const printRef = useRef();
  
  // Get school/branch name for PDF
  const schoolName = selectedBranch?.name || 'Jashchar School';
  
  const handleExportPDF = async () => {
    if (!student) return;
    
    setIsExporting(true);
    toast({
      title: "Generating PDF...",
      description: "Please wait while we create your PDF",
    });

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 12;
      const contentWidth = pageWidth - (margin * 2);
      let y = margin;

      // Helper functions
      const addText = (text, x, yPos, options = {}) => {
        const { fontSize = 10, fontStyle = 'normal', color = [51, 51, 51], align = 'left' } = options;
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', fontStyle);
        pdf.setTextColor(...color);
        pdf.text(text || 'N/A', x, yPos, { align });
        return yPos;
      };

      const addLine = (yPos, color = [200, 200, 200]) => {
        pdf.setDrawColor(...color);
        pdf.setLineWidth(0.3);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        return yPos + 2;
      };

      const addSection = (title, yPos) => {
        if (yPos > pageHeight - 40) {
          pdf.addPage();
          yPos = margin + 10;
        }
        pdf.setFillColor(30, 64, 175); // Deep blue background
        pdf.roundedRect(margin, yPos, contentWidth, 7, 1.5, 1.5, 'F');
        addText(title.toUpperCase(), margin + 4, yPos + 5, { fontSize: 9, fontStyle: 'bold', color: [255, 255, 255] });
        return yPos + 10;
      };

      const addField = (label, value, x, yPos, width = 85) => {
        addText(label + ':', x, yPos, { fontSize: 8, color: [100, 100, 100] });
        addText(String(value || 'Not Provided'), x + 1, yPos + 4, { fontSize: 9, fontStyle: 'bold', color: [30, 30, 30] });
        return yPos;
      };

      const checkPageBreak = (currentY, neededSpace = 30) => {
        if (currentY + neededSpace > pageHeight - margin) {
          pdf.addPage();
          return margin;
        }
        return currentY;
      };

      // ═══════════════════════════════════════════════════════════════════════════
      // HEADER - School Logo & Title
      // ═══════════════════════════════════════════════════════════════════════════
      pdf.setFillColor(30, 64, 175); // Deep blue header
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      // School Name
      addText(schoolName.toUpperCase(), pageWidth / 2, 14, { 
        fontSize: 16, fontStyle: 'bold', color: [255, 255, 255], align: 'center' 
      });
      addText('STUDENT PROFILE REPORT', pageWidth / 2, 23, { 
        fontSize: 12, fontStyle: 'bold', color: [191, 219, 254], align: 'center' 
      });
      addText(`Academic Session: ${new Date().getFullYear()}-${new Date().getFullYear() + 1}  |  Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, pageWidth / 2, 32, { 
        fontSize: 8, color: [191, 219, 254], align: 'center' 
      });

      y = 48;

      // ═══════════════════════════════════════════════════════════════════════════
      // STUDENT BASIC INFO CARD
      // ═══════════════════════════════════════════════════════════════════════════
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(margin, y, contentWidth, 32, 2, 2, 'F');
      pdf.setDrawColor(200, 210, 230);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(margin, y, contentWidth, 32, 2, 2, 'S');

      // Photo - TC-59 FIX: Add actual student photo to PDF
      if (student.photo_url) {
        try {
          // Convert image URL to base64 for PDF
          const response = await fetch(student.photo_url);
          const blob = await response.blob();
          const reader = new FileReader();
          await new Promise((resolve) => {
            reader.onloadend = () => {
              try {
                pdf.addImage(reader.result, 'JPEG', margin + 4, y + 4, 24, 24);
              } catch (imgError) {
                console.log('Could not add image to PDF:', imgError);
                // Fallback to placeholder
                pdf.setFillColor(220, 230, 245);
                pdf.roundedRect(margin + 4, y + 4, 24, 24, 2, 2, 'F');
                addText('PHOTO', margin + 9, y + 18, { fontSize: 7, color: [120, 140, 170] });
              }
              resolve();
            };
            reader.onerror = () => {
              pdf.setFillColor(220, 230, 245);
              pdf.roundedRect(margin + 4, y + 4, 24, 24, 2, 2, 'F');
              addText('PHOTO', margin + 9, y + 18, { fontSize: 7, color: [120, 140, 170] });
              resolve();
            };
            reader.readAsDataURL(blob);
          });
        } catch (photoError) {
          console.log('Photo fetch error:', photoError);
          pdf.setFillColor(220, 230, 245);
          pdf.roundedRect(margin + 4, y + 4, 24, 24, 2, 2, 'F');
          addText('PHOTO', margin + 9, y + 18, { fontSize: 7, color: [120, 140, 170] });
        }
      } else {
        // No photo - show placeholder
        pdf.setFillColor(220, 230, 245);
        pdf.roundedRect(margin + 4, y + 4, 24, 24, 2, 2, 'F');
        addText('PHOTO', margin + 9, y + 18, { fontSize: 7, color: [120, 140, 170] });
      }

      // Student Name & Class
      addText(student.full_name || 'Student Name', margin + 34, y + 10, { fontSize: 14, fontStyle: 'bold', color: [30, 41, 59] });
      addText(`Class: ${student.class?.name || 'N/A'}  |  Section: ${student.section?.name || 'N/A'}`, margin + 34, y + 17, { fontSize: 9, color: [80, 100, 130] });
      
      // Admission & Roll Number
      addText(`Admission No: ${student.school_code || 'N/A'}  |  Roll No: ${student.roll_number || 'N/A'}`, margin + 34, y + 24, { fontSize: 9, fontStyle: 'bold', color: [50, 70, 100] });
      
      // Status Badge
      pdf.setFillColor(34, 197, 94);
      pdf.roundedRect(pageWidth - margin - 22, y + 5, 18, 5, 1.5, 1.5, 'F');
      addText('ACTIVE', pageWidth - margin - 20, y + 8.5, { fontSize: 6, fontStyle: 'bold', color: [255, 255, 255] });

      y += 38;

      // ═══════════════════════════════════════════════════════════════════════════
      // PERSONAL INFORMATION (No emoji - jsPDF doesn't support it)
      // ═══════════════════════════════════════════════════════════════════════════
      y = addSection('PERSONAL INFORMATION', y);
      
      const col1 = margin + 3;
      const col2 = margin + 65;
      const col3 = margin + 127;

      addField('Full Name', student.full_name, col1, y);
      addField('Date of Birth', student.date_of_birth ? format(parseISO(student.date_of_birth), 'dd MMMM yyyy') : null, col2, y);
      addField('Gender', student.gender, col3, y);
      y += 14;

      addField('Blood Group', student.blood_group, col1, y);
      addField('Nationality', student.nationality || 'Indian', col2, y);
      addField('Religion', student.religion, col3, y);
      y += 14;

      addField('Aadhaar Number', student.aadhaar_number, col1, y);
      // TC-59 FIX: Use category.name since category is an object from student_categories relation
      addField('Admission Type', student.category?.name, col2, y);
      addField('Mother Tongue', student.mother_tongue, col3, y);
      y += 14;

      addField('Phone', student.phone, col1, y);
      addField('Email', student.email, col2, y);
      addField('RTE Student', student.is_rte_student ? 'Yes' : 'No', col3, y);
      y += 18;

      // ═══════════════════════════════════════════════════════════════════════════
      // PARENT/GUARDIAN INFORMATION
      // ═══════════════════════════════════════════════════════════════════════════
      y = checkPageBreak(y, 60);
      y = addSection('PARENT / GUARDIAN INFORMATION', y);

      // Father Details
      pdf.setFillColor(254, 249, 195);
      pdf.roundedRect(margin, y, contentWidth / 2 - 3, 35, 2, 2, 'F');
      addText('FATHER DETAILS', margin + 5, y + 6, { fontSize: 8, fontStyle: 'bold', color: [161, 98, 7] });
      addField('Name', student.father_name, margin + 5, y + 12, 80);
      addField('Phone', student.father_phone, margin + 5, y + 24, 40);
      addField('Occupation', student.father_occupation, margin + 50, y + 24, 40);

      // Mother Details
      const motherX = margin + contentWidth / 2 + 3;
      pdf.setFillColor(254, 226, 226);
      pdf.roundedRect(motherX, y, contentWidth / 2 - 3, 35, 2, 2, 'F');
      addText('MOTHER DETAILS', motherX + 5, y + 6, { fontSize: 8, fontStyle: 'bold', color: [185, 28, 28] });
      addField('Name', student.mother_name, motherX + 5, y + 12, 80);
      addField('Phone', student.mother_phone, motherX + 5, y + 24, 40);
      addField('Occupation', student.mother_occupation, motherX + 50, y + 24, 40);

      y += 42;

      // Guardian Details (if available)
      if (student.guardian_name) {
        pdf.setFillColor(219, 234, 254);
        pdf.roundedRect(margin, y, contentWidth, 20, 2, 2, 'F');
        addText('GUARDIAN DETAILS', margin + 5, y + 6, { fontSize: 8, fontStyle: 'bold', color: [30, 64, 175] });
        addField('Name', student.guardian_name, margin + 5, y + 12, 60);
        addField('Phone', student.guardian_phone, margin + 70, y + 12, 50);
        addField('Relation', student.guardian_relation, margin + 125, y + 12, 50);
        y += 26;
      }

      // ═══════════════════════════════════════════════════════════════════════════
      // ADDRESS INFORMATION
      // ═══════════════════════════════════════════════════════════════════════════
      y = checkPageBreak(y, 50);
      y = addSection('ADDRESS INFORMATION', y);

      addField('Present Address', student.present_address, col1, y, 170);
      y += 14;
      
      addField('City', student.city, col1, y);
      addField('State', student.state, col2, y);
      addField('Pincode', student.pincode, col3, y);
      y += 14;

      addField('Country', student.country || 'India', col1, y);
      addField('Permanent Address', student.permanent_address || 'Same as Present', col2, y, 110);
      y += 18;

      // ═══════════════════════════════════════════════════════════════════════════
      // ACADEMIC INFORMATION
      // ═══════════════════════════════════════════════════════════════════════════
      y = checkPageBreak(y, 45);
      y = addSection('ACADEMIC INFORMATION', y);

      addField('Class', student.class?.name, col1, y);
      addField('Section', student.section?.name, col2, y);
      addField('Roll Number', student.roll_number, col3, y);
      y += 14;

      addField('Admission Date', student.admission_date ? format(parseISO(student.admission_date), 'dd MMM yyyy') : null, col1, y);
      addField('Previous School', student.previous_school, col2, y, 110);
      y += 18;

      // ═══════════════════════════════════════════════════════════════════════════
      // FEE SUMMARY
      // ═══════════════════════════════════════════════════════════════════════════
      y = checkPageBreak(y, 35);
      y = addSection('FEE SUMMARY (Current Session)', y);

      // Fee boxes
      const feeBoxWidth = (contentWidth - 10) / 3;
      
      // Total Fees
      pdf.setFillColor(239, 246, 255);
      pdf.roundedRect(margin, y, feeBoxWidth, 18, 2, 2, 'F');
      addText('Total Fees', margin + feeBoxWidth / 2, y + 5, { fontSize: 8, color: [59, 130, 246], align: 'center' });
      addText('Rs. ' + feesSummary.total.toLocaleString(), margin + feeBoxWidth / 2, y + 13, { fontSize: 11, fontStyle: 'bold', color: [30, 64, 175], align: 'center' });

      // Paid
      pdf.setFillColor(220, 252, 231);
      pdf.roundedRect(margin + feeBoxWidth + 5, y, feeBoxWidth, 18, 2, 2, 'F');
      addText('Paid', margin + feeBoxWidth * 1.5 + 5, y + 5, { fontSize: 8, color: [34, 197, 94], align: 'center' });
      addText('Rs. ' + feesSummary.paid.toLocaleString(), margin + feeBoxWidth * 1.5 + 5, y + 13, { fontSize: 11, fontStyle: 'bold', color: [22, 101, 52], align: 'center' });

      // Balance
      pdf.setFillColor(254, 226, 226);
      pdf.roundedRect(margin + (feeBoxWidth + 5) * 2, y, feeBoxWidth, 18, 2, 2, 'F');
      addText('Balance', margin + feeBoxWidth * 2.5 + 10, y + 5, { fontSize: 8, color: [239, 68, 68], align: 'center' });
      addText('Rs. ' + feesSummary.balance.toLocaleString(), margin + feeBoxWidth * 2.5 + 10, y + 13, { fontSize: 11, fontStyle: 'bold', color: [153, 27, 27], align: 'center' });

      y += 25;

      // ═══════════════════════════════════════════════════════════════════════════
      // TRANSPORT DETAILS (if available)
      // ═══════════════════════════════════════════════════════════════════════════
      if (student.transport_route || student.pickup_point) {
        y = checkPageBreak(y, 30);
        y = addSection('TRANSPORT DETAILS', y);
        addField('Route', student.transport_route, col1, y);
        addField('Pickup Point', student.pickup_point, col2, y);
        addField('Vehicle No', student.vehicle_number, col3, y);
        y += 18;
      }

      // ═══════════════════════════════════════════════════════════════════════════
      // HOSTEL DETAILS (if available)
      // ═══════════════════════════════════════════════════════════════════════════
      if (student.hostel || student.room_number) {
        y = checkPageBreak(y, 30);
        y = addSection('HOSTEL DETAILS', y);
        addField('Hostel Name', student.hostel?.name, col1, y);
        addField('Room Number', student.room_number, col2, y);
        addField('Bed Number', student.bed_number, col3, y);
        y += 18;
      }

      // ═══════════════════════════════════════════════════════════════════════════
      // FOOTER
      // ═══════════════════════════════════════════════════════════════════════════
      const footerY = pageHeight - 12;
      addLine(footerY - 5, [180, 180, 180]);
      addText('This is a computer generated document. No signature required.', pageWidth / 2, footerY, { fontSize: 7, color: [130, 130, 130], align: 'center' });
      addText(schoolName + '  |  Powered by Jashchar ERP', pageWidth / 2, footerY + 4, { fontSize: 7, fontStyle: 'bold', color: [100, 100, 100], align: 'center' });

      // Download the PDF
      const fileName = `Student-Profile-${student.school_code || student.full_name || 'export'}.pdf`;
      pdf.save(fileName);

      toast({
        title: "PDF Downloaded!",
        description: `${fileName} has been saved successfully`,
      });
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Could not generate PDF. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // 📄 Handle Document Upload
  const handleDocumentUpload = async () => {
    if (!newDocumentName.trim()) {
      toast({
        variant: "destructive",
        title: "Document name required",
        description: "Please enter a name for the document"
      });
      return;
    }
    if (!newDocumentUrl) {
      toast({
        variant: "destructive",
        title: "No file uploaded",
        description: "Please upload a document first"
      });
      return;
    }

    setUploadingDocument(true);
    try {
      // Get current uploaded_documents array or create new one
      const currentDocs = student.uploaded_documents || [];
      const newDoc = {
        name: newDocumentName.trim(),
        url: newDocumentUrl,
        uploaded_at: new Date().toISOString()
      };
      const updatedDocs = [...currentDocs, newDoc];

      // Also update documents_received checklist
      const currentReceived = student.documents_received || {};
      const updatedReceived = { ...currentReceived, [newDocumentName.trim()]: true };

      // Update student profile in database
      const { error } = await supabase
        .from('student_profiles')
        .update({ 
          uploaded_documents: updatedDocs,
          documents_received: updatedReceived
        })
        .eq('id', targetId);

      if (error) throw error;

      // Update local state
      setStudent(prev => ({ 
        ...prev, 
        uploaded_documents: updatedDocs,
        documents_received: updatedReceived
      }));

      toast({
        title: "Document uploaded!",
        description: `${newDocumentName} has been saved successfully`
      });

      // Reset and close dialog
      setNewDocumentName('');
      setNewDocumentUrl('');
      setUploadDialogOpen(false);
    } catch (error) {
      console.error('Document upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Could not save document. Please try again."
      });
    } finally {
      setUploadingDocument(false);
    }
  };

  // ✅ FIX: Only refresh when navigating back from Edit page with new state
  // Removed visibilitychange listener that was causing unwanted refreshes on tab switch
  // The location.state?.refreshTime check below is sufficient for Edit page returns
  
  // Refresh when navigating back from Edit page with new state
  useEffect(() => {
    if (location.state?.refreshTime) {
      setRefreshKey(prev => prev + 1);
    }
  }, [location.state?.refreshTime]);

  // Calculate age
  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    try {
      const birthDate = typeof dob === 'string' ? parseISO(dob) : dob;
      const years = differenceInYears(new Date(), birthDate);
      const months = differenceInMonths(new Date(), birthDate) % 12;
      return `${years} years ${months} months`;
    } catch (e) {
      return 'N/A';
    }
  };

  // Fetch Student Data - with refreshKey for forcing refetch after edit
  useEffect(() => {
    if (!branchId || !targetId) return;

    const init = async () => {
      setLoading(true);
      try {
        // 1. Fetch Form Settings
        const settingsRes = await api.get('/form-settings', {
          params: { branchId, module: 'student_admission' }
        });
        
        if (settingsRes.data?.success) {
          setFormSections(settingsRes.data.sections || []);
          setAllFields([...(settingsRes.data.systemFields || []), ...(settingsRes.data.customFields || [])]);
        }

        // 2. Fetch Student Data with Relations
        // TC-32 FIX: Added caste_category and sub_caste relations to properly display caste info
        const { data, error } = await supabase
          .from('student_profiles')
          .select(`
            *,
            class:classes!student_profiles_class_id_fkey(id, name),
            section:sections!student_profiles_section_id_fkey(id, name),
            category:student_categories(id, name),
            session:sessions!student_profiles_session_id_fkey(id, name),
            caste_category:caste_categories(id, name, reservation_percent),
            sub_caste:sub_castes(id, name)
          `)
          .eq('id', targetId)
          .single();

        if (error) throw error;
        
        // 3. Fetch Transport Details
        const { data: transportData } = await supabase
          .from('student_transport_details')
          .select('*, route:transport_routes(route_title), pickup:transport_pickup_points(name)')
          .eq('student_id', targetId)
          .maybeSingle();
        
        // 4. Fetch Hostel Details
        const { data: hostelData } = await supabase
          .from('student_hostel_details')
          .select('*, hostel:hostels(name)')
          .eq('student_id', targetId)
          .maybeSingle();
        
        // 5. Fetch Fees Summary
        const { data: feesData } = await supabase
          .from('student_fee_allocations')
          .select('fee_master:fee_masters(amount)')
          .eq('student_id', targetId)
          .eq('branch_id', branchId);
        
        const { data: paymentsData } = await supabase
          .from('fee_payments')
          .select('amount, discount_amount')
          .eq('student_id', targetId)
          .eq('branch_id', branchId)
          .is('reverted_at', null);
        
        // Fetch refunds for this student (approved = money was returned)
        const { data: refundsData } = await supabase
          .from('fee_refunds')
          .select('refund_amount')
          .eq('student_id', targetId)
          .eq('branch_id', branchId)
          .eq('status', 'approved');
        
        const totalFees = (feesData || []).reduce((sum, item) => sum + (item.fee_master?.amount || 0), 0);
        const totalPaid = (paymentsData || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const totalDiscount = (paymentsData || []).reduce((sum, p) => sum + (Number(p.discount_amount) || 0), 0);
        const totalRefunded = (refundsData || []).reduce((sum, r) => sum + (Number(r.refund_amount) || 0), 0);
        // Balance = Total - Paid - Discount + Refunded (refunds add back to balance)
        // ✅ FIXED: Balance cannot be negative (cap at 0)
        const balance = Math.max(0, totalFees - totalPaid - totalDiscount + totalRefunded);
        setFeesSummary({ total: totalFees, paid: totalPaid, discount: totalDiscount, refunded: totalRefunded, balance });
        
        // 6. Fetch Siblings
        let siblings = [];
        if (data.sibling_group_id) {
          const { data: siblingData } = await supabase
            .from('student_profiles')
            .select('id, full_name, photo_url, class:classes!student_profiles_class_id_fkey(name)')
            .eq('sibling_group_id', data.sibling_group_id)
            .neq('id', targetId);
          siblings = siblingData || [];
        }
        
        // Attach all data
        data.transport = transportData;
        data.hostel = hostelData;
        data.siblings = siblings;
        
        // TC-32 FIX: Derive first_name and last_name from full_name if not present
        // This handles cases where older student records may not have these fields populated separately
        if (!data.first_name && data.full_name) {
          const nameParts = data.full_name.trim().split(/\s+/);
          data.first_name = nameParts[0] || '';
          data.last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        }
        
        setStudent(data);
        
        // TC-60 FIX: Generate QR Code for student profile
        try {
          const profileUrl = `${window.location.origin}/${basePath}/student-information/profile/${targetId}`;
          const qrDataUrl = await QRCode.toDataURL(profileUrl, {
            width: 200,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' }
          });
          setQrCodeDataUrl(qrDataUrl);
        } catch (qrError) {
          console.log('QR Code generation error:', qrError);
        }

        // 7. Fetch Custom Data
        const { data: cData } = await supabase
          .from('student_custom_data')
          .select('custom_data')
          .eq('student_id', targetId)
          .eq('branch_id', branchId)
          .maybeSingle();
        if (cData?.custom_data) setCustomData(cData.custom_data);

        // 8. Fetch Attendance Summary (current session)
        try {
          const { data: attData } = await supabase
            .from('student_attendance')
            .select('status')
            .eq('student_id', targetId)
            .eq('branch_id', branchId)
            .eq('session_id', currentSessionId);
          if (attData) {
            const total = attData.length;
            const present = attData.filter(a => a.status === 'present' || a.status === 'late' || a.status === 'half_day').length;
            const absent = attData.filter(a => a.status === 'absent').length;
            setAttendanceSummary({ present, absent, total });
          }
        } catch (e) { console.log('Attendance summary fetch error:', e); }

        // 9. Fetch Behavior Summary
        try {
          const { data: behData } = await supabase
            .from('student_behaviour_incidents')
            .select('type, points')
            .eq('student_id', targetId)
            .eq('branch_id', branchId);
          if (behData) {
            const positive = behData.filter(b => b.type === 'positive').length;
            const negative = behData.filter(b => b.type === 'negative').length;
            const score = behData.reduce((sum, b) => sum + (b.points || 0), 0);
            setBehaviorSummary({ total: behData.length, positive, negative, score });
          }
        } catch (e) { console.log('Behavior summary fetch error:', e); }

        // 10. Fetch Exam Summary (average percentage from latest marks)
        try {
          const { data: examData } = await supabase
            .from('exam_marks_v2')
            .select('percentage, total_marks')
            .eq('student_id', targetId)
            .eq('branch_id', branchId)
            .in('status', ['submitted', 'verified', 'locked']);
          if (examData && examData.length > 0) {
            const validMarks = examData.filter(e => e.percentage != null);
            const avgPercent = validMarks.length > 0
              ? Math.round(validMarks.reduce((sum, e) => sum + Number(e.percentage), 0) / validMarks.length)
              : 0;
            setExamSummary({ avgPercent, rank: null, totalExams: validMarks.length });
          }
        } catch (e) { console.log('Exam summary fetch error:', e); }

      } catch (err) {
        console.error("Profile Load Error:", err);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load student profile' });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [branchId, targetId, toast, refreshKey]);

  // Get field value helper
  const getFieldValue = (field) => {
    if (field.is_system) {
      const fieldMapping = {
        'dob': 'date_of_birth',
        'mobile_no': 'phone',
        'current_address': 'present_address',
        'national_id_no': 'aadhar_no'
      };
      const dbFieldName = fieldMapping[field.field_name] || field.field_name;
      const val = student[dbFieldName];
      
      switch(field.field_name) {
        case 'class': return student.class?.name;
        case 'section': return student.section?.name;
        case 'category': return student.category?.name;
        default: return val;
      }
    }
    return customData[field.field_key];
  };

  // Loading State
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col justify-center items-center h-[80vh] gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full blur-xl animate-pulse" />
            <Loader2 className="w-12 h-12 animate-spin text-primary relative" />
          </div>
          <p className="text-muted-foreground animate-pulse">Loading student profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Not Found State
  if (!student) {
    return (
      <DashboardLayout>
        <div className="flex flex-col justify-center items-center h-[80vh] gap-4">
          <div className="p-6 bg-muted/50 rounded-full">
            <User className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">Student Not Found</h2>
          <p className="text-muted-foreground">The requested student profile does not exist.</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const feePaymentPercent = feesSummary.total > 0 ? Math.round((feesSummary.paid / feesSummary.total) * 100) : 0;

  return (
    <DashboardLayout>
      <div ref={printRef} className="space-y-6 pb-8">
        
        {/* ═══════════════════════════════════════════════════════════════════════════════ */}
        {/* 🎯 HERO SECTION */}
        {/* ═══════════════════════════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-purple-600 p-8 text-white">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>
          
          {/* Content */}
          <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-8">
            {/* Profile Photo */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-xl group-hover:blur-2xl transition-all" />
              <Avatar className="h-36 w-36 border-4 border-white/30 shadow-2xl ring-4 ring-white/10 ring-offset-4 ring-offset-primary">
                <AvatarImage src={student.photo_url} className="object-cover" />
                <AvatarFallback className="text-5xl bg-white/20 text-white font-bold">
                  {student.full_name?.charAt(0) || 'S'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-2 shadow-lg">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            
            {/* Info */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{student.full_name}</h1>
                  {student.is_rte_student && (
                    <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white border-0">RTE Student</Badge>
                  )}
                  <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
                    {student.status || 'Active'}
                  </Badge>
                </div>
                <p className="text-white/80 text-lg">
                  Class {student.class?.name || 'N/A'} - Section {student.section?.name || 'N/A'}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                  <Hash className="h-4 w-4" />
                  <span className="font-semibold">{student.school_code}</span>
                  <span className="text-white/60">Admission No</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                  <GraduationCap className="h-4 w-4" />
                  <span className="font-semibold">{student.roll_number || 'N/A'}</span>
                  <span className="text-white/60">Roll No</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                  <Calendar className="h-4 w-4" />
                  <span className="font-semibold">{student.date_of_birth ? format(parseISO(student.date_of_birth), 'dd MMM yyyy') : 'N/A'}</span>
                  <span className="text-white/60">DOB</span>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex flex-col gap-3 no-print">
              <Button 
                variant="secondary" 
                className="bg-white/20 hover:bg-white/30 text-white border-0 shadow-lg"
                onClick={() => navigate(`/${basePath}/student-information/edit/${targetId}`)}
              >
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
              <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 shadow-lg no-print">
                <Printer className="mr-2 h-4 w-4" /> Print ID Card
              </Button>
              <Button 
                variant="secondary" 
                className="bg-white/20 hover:bg-white/30 text-white border-0 shadow-lg"
                onClick={handleExportPDF}
                disabled={isExporting}
              >
                {isExporting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exporting...</>
                ) : (
                  <><Download className="mr-2 h-4 w-4" /> Export PDF</>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════════════ */}
        {/* 📊 QUICK STATS */}
        {/* ═══════════════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard 
            icon={IndianRupee} 
            label="Total Fees" 
            value={`₹${feesSummary.total.toLocaleString()}`}
            subValue={`Balance: ₹${feesSummary.balance.toLocaleString()}`}
            color="blue"
            onClick={() => setActiveTab('fees')}
          />
          <StatCard 
            icon={Percent} 
            label="Fee Paid" 
            value={`${feePaymentPercent}%`}
            subValue={`₹${feesSummary.paid.toLocaleString()} paid`}
            color={feePaymentPercent >= 75 ? "green" : feePaymentPercent >= 50 ? "orange" : "red"}
          />
          <StatCard 
            icon={Calendar} 
            label="Attendance" 
            value={attendanceSummary.total > 0 ? `${Math.round((attendanceSummary.present / attendanceSummary.total) * 100)}%` : 'N/A'}
            subValue={attendanceSummary.total > 0 ? `${attendanceSummary.present}/${attendanceSummary.total} days` : 'No data'}
            color={attendanceSummary.total > 0 && (attendanceSummary.present / attendanceSummary.total) >= 0.75 ? "green" : "orange"}
            onClick={() => setActiveTab('attendance')}
          />
          <StatCard 
            icon={Award} 
            label="Avg Score" 
            value={examSummary.totalExams > 0 ? `${examSummary.avgPercent}%` : 'N/A'}
            subValue={examSummary.totalExams > 0 ? `${examSummary.totalExams} subjects` : 'No exams yet'}
            color="purple"
            onClick={() => setActiveTab('academic')}
          />
          <StatCard 
            icon={Clock} 
            label="Age" 
            value={calculateAge(student.date_of_birth)}
            color="pink"
          />
          <StatCard 
            icon={Users} 
            label="Siblings" 
            value={student.siblings?.length || 0}
            subValue={student.siblings?.length > 0 ? "In same school" : "No siblings"}
            color="orange"
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════════════ */}
        {/* 📑 MAIN CONTENT TABS */}
        {/* ═══════════════════════════════════════════════════════════════════════════════ */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg pb-4 -mt-2 pt-2">
            <TabsList className="h-auto p-1.5 bg-muted/50 backdrop-blur rounded-xl w-full justify-start overflow-x-auto flex-nowrap">
              <TabsTrigger value="overview" className="px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-lg">
                <User className="mr-2 h-4 w-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="personal" className="px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-lg">
                <Heart className="mr-2 h-4 w-4" /> Personal
              </TabsTrigger>
              <TabsTrigger value="academic" className="px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-lg">
                <GraduationCap className="mr-2 h-4 w-4" /> Academic
              </TabsTrigger>
              <TabsTrigger value="parents" className="px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-lg">
                <Users className="mr-2 h-4 w-4" /> Parents
              </TabsTrigger>
              <TabsTrigger value="family" className="px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-lg">
                <Users className="mr-2 h-4 w-4" /> Family
              </TabsTrigger>
              <TabsTrigger value="fees" className="px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-lg">
                <CreditCard className="mr-2 h-4 w-4" /> Fees
              </TabsTrigger>
              <TabsTrigger value="attendance" className="px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-lg">
                <CalendarDays className="mr-2 h-4 w-4" /> Attendance
              </TabsTrigger>
              <TabsTrigger value="exams" className="px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-lg">
                <BookOpen className="mr-2 h-4 w-4" /> Exams
              </TabsTrigger>
              <TabsTrigger value="transport" className="px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-lg">
                <Bus className="mr-2 h-4 w-4" /> Transport
              </TabsTrigger>
              <TabsTrigger value="hostel" className="px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-lg">
                <BedDouble className="mr-2 h-4 w-4" /> Hostel
              </TabsTrigger>
              <TabsTrigger value="documents" className="px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-lg">
                <Files className="mr-2 h-4 w-4" /> Documents
              </TabsTrigger>
              <TabsTrigger value="health" className="px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-lg">
                <Heart className="mr-2 h-4 w-4" /> Health
              </TabsTrigger>
              <TabsTrigger value="behavior" className="px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-lg">
                <AlertTriangle className="mr-2 h-4 w-4" /> Behavior
              </TabsTrigger>
              <TabsTrigger value="timeline" className="px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-lg">
                <History className="mr-2 h-4 w-4" /> Timeline
              </TabsTrigger>
              <TabsTrigger value="ai-insights" className="px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-lg">
                <Brain className="mr-2 h-4 w-4" /> AI Insights
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          {/* 📋 OVERVIEW TAB */}
          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="overview" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Quick Glance Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900 cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab('attendance')}>
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Attendance</span>
                </div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {attendanceSummary.total > 0 ? `${Math.round((attendanceSummary.present / attendanceSummary.total) * 100)}%` : '—'}
                </p>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                  {attendanceSummary.total > 0 ? `${attendanceSummary.present} of ${attendanceSummary.total} days` : 'No records yet'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border border-purple-100 dark:border-purple-900 cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab('academic')}>
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-400">Academics</span>
                </div>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {examSummary.totalExams > 0 ? `${examSummary.avgPercent}%` : '—'}
                </p>
                <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
                  {examSummary.totalExams > 0 ? `Avg across ${examSummary.totalExams} subjects` : 'No exams yet'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-100 dark:border-amber-900 cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab('behavior')}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Behavior</span>
                </div>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {behaviorSummary.total > 0 ? (behaviorSummary.score > 0 ? `+${behaviorSummary.score}` : behaviorSummary.score) : '—'}
                </p>
                <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
                  {behaviorSummary.total > 0 ? `${behaviorSummary.positive} good · ${behaviorSummary.negative} concerns` : 'No incidents'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border border-emerald-100 dark:border-emerald-900 cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab('fees')}>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Fee Status</span>
                </div>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{feePaymentPercent}%</p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                  {feesSummary.balance > 0 ? `₹${feesSummary.balance.toLocaleString()} due` : 'Fully paid'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column - Basic Info */}
              <div className="lg:col-span-2 space-y-6">
                <GlassCard className="p-6" gradient>
                  <SectionTitle icon={User} title="Basic Information" subtitle="Student's primary details" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoItem icon={User} label="Full Name" value={student.full_name} />
                    <InfoItem icon={Hash} label="Admission No" value={student.school_code} copyable />
                    <InfoItem icon={GraduationCap} label="Roll Number" value={student.roll_number} />
                    <InfoItem icon={Calendar} label="Date of Birth" value={student.date_of_birth ? format(parseISO(student.date_of_birth), 'dd MMMM yyyy') : null} />
                    <InfoItem icon={User} label="Gender" value={student.gender?.charAt(0).toUpperCase() + student.gender?.slice(1)} />
                    <InfoItem icon={Heart} label="Blood Group" value={student.blood_group} />
                    <InfoItem icon={Phone} label="Phone" value={student.phone} copyable />
                    <InfoItem icon={Mail} label="Email" value={student.email} copyable />
                    <InfoItem icon={Flag} label="Nationality" value={student.nationality || 'Indian'} />
                    <InfoItem icon={Globe} label="Religion" value={student.religion} />
                    <InfoItem icon={Fingerprint} label="Aadhaar Number" value={student.aadhar_no} copyable />
                    <InfoItem icon={School} label="Admission Type" value={student.category?.name} />
                  </div>
                </GlassCard>

                <GlassCard className="p-6" gradient>
                  <SectionTitle icon={MapPin} title="Address Information" subtitle="Residential details" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoItem icon={Home} label="Present Address" value={student.present_address || student.address} className="md:col-span-2" />
                    <InfoItem icon={MapPin} label="City" value={student.city} />
                    <InfoItem icon={MapPin} label="State" value={student.state} />
                    <InfoItem icon={Hash} label="Pincode" value={student.pincode} />
                    <InfoItem icon={Globe} label="Country" value={student.country || 'India'} />
                    <InfoItem icon={Home} label="Permanent Address" value={student.permanent_address} className="md:col-span-2" />
                  </div>
                </GlassCard>
              </div>
              
              {/* Right Column - Quick Info */}
              <div className="space-y-6">
                {/* QR Code Card - TC-60 FIX: Display actual scannable QR code */}
                <GlassCard className="p-6 text-center" gradient>
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-white rounded-xl shadow-inner">
                      {qrCodeDataUrl ? (
                        <img 
                          src={qrCodeDataUrl} 
                          alt="Student Profile QR Code" 
                          className="h-32 w-32"
                          title="Scan this QR code to access student profile"
                        />
                      ) : (
                        <QrCode className="h-32 w-32 text-gray-800" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{student.school_code || student.roll_number || 'Student ID'}</p>
                      <p className="text-xs text-muted-foreground">Scan for quick access</p>
                    </div>
                  </div>
                </GlassCard>
                
                {/* Siblings */}
                {student.siblings && student.siblings.length > 0 && (
                  <GlassCard className="p-6" gradient>
                    <SectionTitle icon={Users} title="Siblings" subtitle={`${student.siblings.length} sibling(s) in school`} />
                    <div className="space-y-3">
                      {student.siblings.map((sibling) => (
                        <div 
                          key={sibling.id} 
                          className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/${basePath}/student-information/profile/${sibling.id}`)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={sibling.photo_url} />
                            <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{sibling.full_name}</p>
                            <p className="text-xs text-muted-foreground">Class {sibling.class?.name || 'N/A'}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* Fee Progress */}
                <GlassCard className="p-6" gradient>
                  <SectionTitle icon={CreditCard} title="Fee Status" subtitle="Current session" />
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment Progress</span>
                      <span className="font-semibold">{feePaymentPercent}%</span>
                    </div>
                    <Progress value={feePaymentPercent} className="h-3" />
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                        <p className="text-xl font-bold text-emerald-600">₹{feesSummary.paid.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Paid</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-xl">
                        <p className="text-xl font-bold text-red-600">₹{feesSummary.balance.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Balance</p>
                      </div>
                    </div>
                    <Button className="w-full" onClick={() => setActiveTab('fees')}>
                      View Fee Details <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </GlassCard>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          {/* 👤 PERSONAL TAB */}
          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="personal" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GlassCard className="p-6" gradient>
              <SectionTitle icon={User} title="Personal Details" subtitle="Complete personal information" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoItem icon={User} label="Full Name" value={student.full_name} />
                <InfoItem icon={User} label="First Name" value={student.first_name} />
                <InfoItem icon={User} label="Last Name" value={student.last_name} />
                <InfoItem icon={User} label="First Name (Kannada)" value={student.first_name_kannada} />
                <InfoItem icon={User} label="Last Name (Kannada)" value={student.last_name_kannada} />
                <InfoItem icon={Calendar} label="Date of Birth" value={student.date_of_birth ? format(parseISO(student.date_of_birth), 'dd MMMM yyyy') : null} />
                <InfoItem icon={Clock} label="Age" value={calculateAge(student.date_of_birth)} />
                <InfoItem icon={User} label="Gender" value={student.gender} />
                <InfoItem icon={Heart} label="Blood Group" value={student.blood_group} />
                <InfoItem icon={Globe} label="Religion" value={student.religion} />
                <InfoItem icon={Flag} label="Caste Category" value={student.caste_category?.name || student.caste} />
                <InfoItem icon={Flag} label="Sub Caste" value={student.sub_caste?.name} />
                <InfoItem icon={School} label="Admission Type" value={student.category?.name} />
                <InfoItem icon={Flag} label="Nationality" value={student.nationality} />
                <InfoItem icon={Globe} label="Mother Tongue" value={student.mother_tongue} />
                <InfoItem icon={Fingerprint} label="Aadhaar Number" value={student.aadhar_no} copyable />
                <InfoItem icon={Phone} label="Mobile Number" value={student.phone} copyable />
                <InfoItem icon={Mail} label="Email Address" value={student.email} copyable />
              </div>
            </GlassCard>
            
            <GlassCard className="p-6" gradient>
              <SectionTitle icon={MapPin} title="Address Details" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <InfoItem icon={Home} label="Present Address" value={student.present_address || student.address} />
                </div>
                <InfoItem icon={MapPin} label="City" value={student.city} />
                <InfoItem icon={MapPin} label="State" value={student.state} />
                <InfoItem icon={Hash} label="Pincode" value={student.pincode} />
                <InfoItem icon={Globe} label="Country" value={student.country || 'India'} />
                <div className="md:col-span-2">
                  <InfoItem icon={Home} label="Permanent Address" value={student.permanent_address} />
                </div>
              </div>
            </GlassCard>
            
            <GlassCard className="p-6" gradient>
              <SectionTitle icon={Heart} title="Medical Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem icon={Heart} label="Medical Conditions" value={student.medical_conditions} />
                <InfoItem icon={AlertCircle} label="Allergies" value={student.allergies} />
                <InfoItem icon={Phone} label="Emergency Contact" value={student.emergency_contact} />
                <InfoItem icon={Phone} label="Emergency Phone" value={student.emergency_phone} copyable />
              </div>
            </GlassCard>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          {/* 🎓 ACADEMIC TAB */}
          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="academic" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GlassCard className="p-6" gradient>
              <SectionTitle icon={GraduationCap} title="Current Academic Details" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoItem icon={Hash} label="Admission Number" value={student.school_code} copyable />
                <InfoItem icon={GraduationCap} label="Roll Number" value={student.roll_number} />
                <InfoItem icon={Calendar} label="Admission Date" value={student.admission_date ? format(parseISO(student.admission_date), 'dd MMM yyyy') : null} />
                <InfoItem icon={School} label="Class" value={student.class?.name} />
                <InfoItem icon={Users} label="Section" value={student.section?.name} />
                <InfoItem icon={CalendarDays} label="Session" value={student.session?.name} />
                <InfoItem icon={School} label="Student Category" value={student.category?.name} />
                <InfoItem icon={CheckCircle2} label="Status" value={student.status || 'Active'} />
                <InfoItem icon={Shield} label="RTE Student" value={student.is_rte_student ? 'Yes' : 'No'} />
              </div>
            </GlassCard>
            
            <GlassCard className="p-6" gradient>
              <SectionTitle icon={School} title="Previous School Details" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem icon={School} label="Previous School Name" value={student.previous_school_name} />
                <InfoItem icon={GraduationCap} label="Previous Class" value={student.previous_class} />
                <InfoItem icon={FileText} label="TC Number" value={student.tc_number} />
                <InfoItem icon={Calendar} label="TC Date" value={student.tc_date ? format(parseISO(student.tc_date), 'dd MMM yyyy') : null} />
              </div>
            </GlassCard>

            {/* Academic Performance Tracker */}
            <GlassCard className="p-6" gradient>
              <SectionTitle icon={BarChart3} title="Academic Performance" subtitle="Exam results & subject analysis" />
              <div className="mt-4">
                <StudentProfileAcademicTracker studentId={targetId} />
              </div>
            </GlassCard>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          {/* 👨‍👩‍👧 PARENTS TAB */}
          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="parents" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Father Details */}
            <GlassCard className="p-6" gradient>
              <div className="flex items-center gap-6 mb-6">
                <Avatar className="h-20 w-20 border-4 border-blue-100">
                  <AvatarImage src={student.father_photo_url} />
                  <AvatarFallback className="bg-blue-50 text-blue-600 text-2xl">F</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{student.father_name || 'Father'}</h3>
                  <p className="text-muted-foreground">Father</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoItem icon={User} label="Father Name" value={student.father_name} />
                <InfoItem icon={User} label="Name (Kannada)" value={student.father_name_kannada} />
                <InfoItem icon={Phone} label="Phone" value={student.father_phone} copyable />
                <InfoItem icon={Mail} label="Email" value={student.father_email} copyable />
                <InfoItem icon={Briefcase} label="Occupation" value={student.father_occupation} />
                <InfoItem icon={Fingerprint} label="Aadhaar Number" value={student.father_aadhar_no} />
              </div>
            </GlassCard>
            
            {/* Mother Details */}
            <GlassCard className="p-6" gradient>
              <div className="flex items-center gap-6 mb-6">
                <Avatar className="h-20 w-20 border-4 border-pink-100">
                  <AvatarImage src={student.mother_photo_url} />
                  <AvatarFallback className="bg-pink-50 text-pink-600 text-2xl">M</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{student.mother_name || 'Mother'}</h3>
                  <p className="text-muted-foreground">Mother</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoItem icon={User} label="Mother Name" value={student.mother_name} />
                <InfoItem icon={User} label="Name (Kannada)" value={student.mother_name_kannada} />
                <InfoItem icon={Phone} label="Phone" value={student.mother_phone} copyable />
                <InfoItem icon={Mail} label="Email" value={student.mother_email} />
                <InfoItem icon={Briefcase} label="Occupation" value={student.mother_occupation} />
                <InfoItem icon={Fingerprint} label="Aadhaar Number" value={student.mother_aadhar_no} />
              </div>
            </GlassCard>
            
            {/* Guardian Details */}
            {student.guardian_name && (
              <GlassCard className="p-6" gradient>
                <div className="flex items-center gap-6 mb-6">
                  <Avatar className="h-20 w-20 border-4 border-emerald-100">
                    <AvatarImage src={student.guardian_photo_url} />
                    <AvatarFallback className="bg-emerald-50 text-emerald-600 text-2xl">G</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{student.guardian_name}</h3>
                    <p className="text-muted-foreground">Guardian ({student.guardian_relation})</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <InfoItem icon={User} label="Guardian Name" value={student.guardian_name} />
                  <InfoItem icon={Users} label="Relation" value={student.guardian_relation} />
                  <InfoItem icon={Phone} label="Phone" value={student.guardian_phone} copyable />
                  <InfoItem icon={Mail} label="Email" value={student.guardian_email} />
                  <InfoItem icon={Briefcase} label="Occupation" value={student.guardian_occupation} />
                  <InfoItem icon={MapPin} label="Address" value={student.guardian_address} />
                </div>
              </GlassCard>
            )}
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          {/* �‍👩‍👧‍👦 FAMILY / SIBLINGS TAB */}
          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="family" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StudentProfileSiblingsTab studentId={targetId} />
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          {/* �💰 FEES TAB */}
          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="fees" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StudentProfileFeesTab studentId={targetId} />
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          {/* 📅 ATTENDANCE TAB */}
          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="attendance" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StudentProfileAttendanceTab studentId={targetId} />
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          {/* 📝 EXAMS TAB */}
          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="exams" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GlassCard className="p-6" gradient>
              <SectionTitle icon={BookOpen} title="Examination Results" subtitle="Marks, grades & performance analysis" />
              <div className="mt-4">
                <StudentProfileAcademicTracker studentId={targetId} />
              </div>
            </GlassCard>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          {/* 🚌 TRANSPORT TAB */}
          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="transport" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {student.transport ? (
              <GlassCard className="p-6" gradient>
                <SectionTitle icon={Bus} title="Transport Details" subtitle="School bus information" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <InfoItem icon={Bus} label="Route Name" value={student.transport?.route?.route_title} />
                  <InfoItem icon={MapPin} label="Pickup Point" value={student.transport?.pickup?.name} />
                  <InfoItem icon={Clock} label="Pickup Time" value={student.transport?.pickup_time} />
                  <InfoItem icon={Clock} label="Drop Time" value={student.transport?.drop_time} />
                  <InfoItem icon={Bus} label="Vehicle Number" value={student.transport?.vehicle_number} />
                  <InfoItem icon={User} label="Driver Name" value={student.transport?.driver_name} />
                  <InfoItem icon={Phone} label="Driver Contact" value={student.transport?.driver_contact} copyable />
                  <InfoItem icon={IndianRupee} label="Transport Fee" value={student.transport?.transport_fee ? `₹${student.transport.transport_fee}` : null} />
                  <InfoItem icon={FileText} label="Special Instructions" value={student.transport?.special_instructions} className="md:col-span-2 lg:col-span-3" />
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="p-8">
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <div className="p-6 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950/50 dark:to-blue-900/30 rounded-full mb-6">
                    <Bus className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No Transport Facility</h3>
                  <p className="text-muted-foreground max-w-md">
                    This student has not opted for school transport facility.
                  </p>
                </div>
              </GlassCard>
            )}
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          {/* 🏨 HOSTEL TAB */}
          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="hostel" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {student.hostel ? (
              <GlassCard className="p-6" gradient>
                <SectionTitle icon={BedDouble} title="Hostel Details" subtitle="Boarding information" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <InfoItem icon={Building} label="Hostel Name" value={student.hostel?.hostel?.name} />
                  <InfoItem icon={BedDouble} label="Room Type" value={student.hostel?.room_type} />
                  <InfoItem icon={Hash} label="Room Number" value={student.hostel?.room_number} />
                  <InfoItem icon={Hash} label="Bed Number" value={student.hostel?.bed_number} />
                  <InfoItem icon={Calendar} label="Check-in Date" value={student.hostel?.check_in_date ? format(parseISO(student.hostel.check_in_date), 'dd MMM yyyy') : null} />
                  <InfoItem icon={Calendar} label="Check-out Date" value={student.hostel?.check_out_date ? format(parseISO(student.hostel.check_out_date), 'dd MMM yyyy') : null} />
                  <InfoItem icon={IndianRupee} label="Hostel Fee" value={student.hostel?.hostel_fee ? `₹${student.hostel.hostel_fee}` : null} />
                  <InfoItem icon={Phone} label="Guardian Contact" value={student.hostel?.guardian_contact} copyable />
                  <InfoItem icon={Phone} label="Emergency Contact" value={student.hostel?.emergency_contact} copyable />
                  <InfoItem icon={FileText} label="Special Requirements" value={student.hostel?.special_requirements} className="md:col-span-2 lg:col-span-3" />
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="p-8">
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <div className="p-6 bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-950/50 dark:to-purple-900/30 rounded-full mb-6">
                    <BedDouble className="h-12 w-12 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No Hostel Facility</h3>
                  <p className="text-muted-foreground max-w-md">
                    This student has not opted for hostel facility.
                  </p>
                </div>
              </GlassCard>
            )}
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          {/* 🏥 HEALTH TAB */}
          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="health" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StudentProfileHealthTab studentId={targetId} />
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          {/* ⚠️ BEHAVIOR TAB */}
          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="behavior" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StudentProfileBehaviorTab studentId={targetId} />
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          {/* 📄 DOCUMENTS TAB */}
          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="documents" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GlassCard className="p-6" gradient>
              <StudentProfileDocChecklistSection studentId={targetId} />
              <SectionTitle 
                icon={Files} 
                title="Documents Received" 
                subtitle="Submitted documents checklist"
                action={
                  <Button variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" /> Upload Document
                  </Button>
                }
              />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {student.documents_received && Object.entries(student.documents_received).map(([docName, received]) => (
                  <div 
                    key={docName}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md",
                      received 
                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" 
                        : "bg-muted/30 border-border"
                    )}
                    onClick={() => {
                      // Find uploaded document URL if exists
                      const uploadedDoc = student.uploaded_documents?.find(d => d.name === docName);
                      if (uploadedDoc?.url) {
                        window.open(uploadedDoc.url, '_blank');
                      }
                    }}
                  >
                    {received ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-sm font-medium flex-1">{docName}</span>
                    {student.uploaded_documents?.find(d => d.name === docName)?.url && (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
                {(!student.documents_received || Object.keys(student.documents_received).length === 0) && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No document records found. Click "Upload Document" to add documents.
                  </div>
                )}
              </div>

              {/* Uploaded Documents List */}
              {student.uploaded_documents && student.uploaded_documents.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Uploaded Files
                  </h4>
                  <div className="space-y-2">
                    {student.uploaded_documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{doc.name}</p>
                            {doc.uploaded_at && (
                              <p className="text-xs text-muted-foreground">
                                Uploaded: {format(parseISO(doc.uploaded_at), 'dd MMM yyyy, hh:mm a')}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => window.open(doc.url, '_blank')}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Document Upload Dialog */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" /> Upload Document
                  </DialogTitle>
                  <DialogDescription>
                    Upload a document for {student?.full_name || 'this student'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="docName">Document Name *</Label>
                    <Input 
                      id="docName"
                      placeholder="e.g., Birth Certificate, Aadhar Card, TC..."
                      value={newDocumentName}
                      onChange={(e) => setNewDocumentName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Upload File *</Label>
                    <DocumentUploadField 
                      label=""
                      bucketName="student-photos"
                      folderPath={`documents/${targetId}/`}
                      onUploadComplete={(url) => setNewDocumentUrl(url)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setUploadDialogOpen(false);
                    setNewDocumentName('');
                    setNewDocumentUrl('');
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleDocumentUpload} disabled={uploadingDocument || !newDocumentName || !newDocumentUrl}>
                    {uploadingDocument ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Save Document
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          {/* ⏳ TIMELINE TAB */}
          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="timeline" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StudentProfileTimeline studentId={targetId} student={student} />
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          {/* 🧠 AI INSIGHTS TAB */}
          {/* ═══════════════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="ai-insights" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StudentProfileAIInsightsTab studentId={targetId} />
          </TabsContent>

        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default StudentProfile;
