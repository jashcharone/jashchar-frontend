/**
 * 📊 STUDENT INFORMATION REPORT - WORLD'S BEST COMPREHENSIVE SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 * Total: 28+ Report Types across 6 Categories
 * Features: Charts, Visualizations, Export (Excel/PDF/CSV), Column Toggle
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, GraduationCap, Search, Loader2, Calendar, UserCheck, 
  Baby, Heart, Droplets, MapPin, Church, Languages, Briefcase,
  Bus, Building2, Key, TrendingUp, BarChart3, PieChart,
  FileText, UserPlus, UserMinus, Home, CalendarDays, BookOpen,
  RefreshCw, Filter, Download, ChevronDown, Eye, Layout, Award
} from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import DashboardLayout from '@/components/DashboardLayout';
import DataTableExport from '@/components/DataTableExport';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import api from '@/lib/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartPie, Pie, Cell, Legend, LineChart, Line, Area, AreaChart
} from 'recharts';

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 REPORT CATEGORIES & TYPES CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const REPORT_CATEGORIES = [
  { key: 'basic', label: 'Student Data', icon: Users, color: 'bg-blue-500' },
  { key: 'strength', label: 'Strength Analysis', icon: BarChart3, color: 'bg-green-500' },
  { key: 'admission', label: 'Admission', icon: UserPlus, color: 'bg-purple-500' },
  { key: 'demographics', label: 'Demographics', icon: PieChart, color: 'bg-orange-500' },
  { key: 'credentials', label: 'Credentials', icon: Key, color: 'bg-cyan-500' },
  { key: 'special', label: 'Special', icon: Award, color: 'bg-pink-500' }
];

const REPORT_TYPES = {
  basic: [
    { key: 'student_report', label: 'Student List', icon: Users, endpoint: '/student-report' },
    { key: 'student_profile', label: 'Complete Profile', icon: FileText, endpoint: '/student-profile-complete' },
    { key: 'guardian_report', label: 'Guardian Details', icon: UserCheck, endpoint: '/guardian-report' },
    { key: 'student_history', label: 'Admission History', icon: BookOpen, endpoint: '/student-history' },
    { key: 'sibling_report', label: 'Sibling Report', icon: Users, endpoint: '/sibling-report' }
  ],
  strength: [
    { key: 'class_section_report', label: 'Class & Section', icon: Layout, endpoint: '/class-section-report' },
    { key: 'gender_ratio_report', label: 'Gender Ratio', icon: Users, endpoint: '/gender-ratio-report', hasChart: true },
    { key: 'month_wise_closing', label: 'Month-wise Closing', icon: CalendarDays, endpoint: '/month-wise-closing', hasChart: true },
    { key: 'age_wise_distribution', label: 'Age Distribution', icon: Baby, endpoint: '/age-wise-distribution', hasChart: true },
    { key: 'category_wise_strength', label: 'Category-wise', icon: Award, endpoint: '/category-wise-strength', hasChart: true },
    { key: 'rte_strength', label: 'RTE Students', icon: GraduationCap, endpoint: '/rte-strength', hasChart: true },
    { key: 'house_wise_strength', label: 'House-wise', icon: Home, endpoint: '/house-wise-strength', hasChart: true },
    { key: 'student_teacher_ratio', label: 'Student-Teacher Ratio', icon: GraduationCap, endpoint: '/student-teacher-ratio' }
  ],
  admission: [
    { key: 'admission_report', label: 'New Admissions', icon: UserPlus, endpoint: '/admission-report' },
    { key: 'admission_vacancy', label: 'Vacancy Report', icon: Eye, endpoint: '/admission-vacancy', hasChart: true },
    { key: 'admission_trends', label: 'Admission Trends', icon: TrendingUp, endpoint: '/admission-trends', hasChart: true, chartOnly: true },
    { key: 'new_vs_old_students', label: 'New vs Old', icon: RefreshCw, endpoint: '/new-vs-old-students', hasChart: true },
    { key: 'tc_issued_report', label: 'TC Issued / Left', icon: UserMinus, endpoint: '/tc-issued-report' }
  ],
  demographics: [
    { key: 'birthday_report', label: 'Birthday Report', icon: Baby, endpoint: '/birthday-report' },
    { key: 'blood_group_report', label: 'Blood Group', icon: Droplets, endpoint: '/blood-group-report', hasChart: true },
    { key: 'area_wise_report', label: 'Area / Pincode', icon: MapPin, endpoint: '/area-wise-report', hasChart: true },
    { key: 'religion_caste_report', label: 'Religion & Caste', icon: Church, endpoint: '/religion-caste-report', hasChart: true },
    { key: 'mother_tongue_report', label: 'Mother Tongue', icon: Languages, endpoint: '/mother-tongue-report', hasChart: true },
    { key: 'parent_occupation_report', label: 'Parent Occupation', icon: Briefcase, endpoint: '/parent-occupation-report', hasChart: true }
  ],
  credentials: [
    { key: 'student_login_credential', label: 'Student Login', icon: Key, endpoint: '/login-credential-report' },
    { key: 'parent_login_credential', label: 'Parent Login', icon: Key, endpoint: '/parent-login-credential' }
  ],
  special: [
    { key: 'transport_users_report', label: 'Transport Users', icon: Bus, endpoint: '/transport-users-report' },
    { key: 'hostel_students_report', label: 'Hostel Students', icon: Building2, endpoint: '/hostel-students-report' }
  ]
};

// Chart colors
const CHART_COLORS = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#EF4444', '#84CC16'];

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 CHART COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const GenderRatioChart = ({ data }) => {
  const chartData = data?.classes?.map(c => ({
    name: c.className,
    Boys: c.male,
    Girls: c.female,
    Other: c.other
  })) || [];

  const pieData = [
    { name: 'Boys', value: data?.totals?.male || 0 },
    { name: 'Girls', value: data?.totals?.female || 0 },
    { name: 'Other', value: data?.totals?.other || 0 }
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Class-wise Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" tick={{ fill: 'currentColor' }} />
              <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
              <Bar dataKey="Boys" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Girls" fill="#EC4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Overall Ratio</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <RechartPie>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label>
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartPie>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

const MonthWiseClosingChart = ({ data }) => {
  const chartData = data?.data || [];
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Month-wise Student Strength Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" tick={{ fill: 'currentColor' }} />
            <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
            <Area type="monotone" dataKey="closing" name="Closing" stroke="#3B82F6" fill="#3B82F680" />
            <Area type="monotone" dataKey="newAdmission" name="New Admission" stroke="#10B981" fill="#10B98140" />
            <Area type="monotone" dataKey="tcIssued" name="TC/Left" stroke="#EF4444" fill="#EF444440" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

const AdmissionTrendsChart = ({ data }) => {
  const chartData = data || [];
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Monthly Admission Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" tick={{ fill: 'currentColor' }} />
            <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
            <Line type="monotone" dataKey="admissions" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6', r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

const PieChartComponent = ({ data, dataKey = 'count', nameKey = 'name', title }) => {
  const chartData = Array.isArray(data) ? data : (data?.data || []);
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <RechartPie>
            <Pie 
              data={chartData.slice(0, 8)} 
              cx="50%" cy="50%" 
              outerRadius={100} 
              dataKey={dataKey} 
              nameKey={nameKey}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.slice(0, 8).map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </RechartPie>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

const VacancyChart = ({ data }) => {
  const chartData = data?.data?.map(d => ({
    name: d.className,
    Filled: d.filled,
    Vacant: d.vacant
  })) || [];
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Class-wise Vacancy Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" tick={{ fill: 'currentColor' }} />
            <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
            <Bar dataKey="Filled" stackId="a" fill="#10B981" />
            <Bar dataKey="Vacant" stackId="a" fill="#F59E0B" />
            <Legend />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const StudentInformationReport = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  
  // State
  const [activeCategory, setActiveCategory] = useState('basic');
  const [activeReport, setActiveReport] = useState('student_report');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [searchText, setSearchText] = useState('');
  
  // Filter states
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedRte, setSelectedRte] = useState('');
  const [selectedSearchType, setSelectedSearchType] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('this_month');
  const [admissionYear, setAdmissionYear] = useState('');

  // Get current report info
  const currentReportInfo = useMemo(() => {
    for (const category of Object.values(REPORT_TYPES)) {
      const found = category.find(r => r.key === activeReport);
      if (found) return found;
    }
    return null;
  }, [activeReport]);

  // Load master data
  useEffect(() => {
    const loadMasterData = async () => {
      if (!selectedBranch?.id) return;
      try {
        const branchId = selectedBranch.id;
        console.log('[StudentReport] Loading master data for branch:', branchId);
        
        const [sessRes, classRes, catRes] = await Promise.all([
          api.get(`/academics/sessions?branchId=${branchId}`),
          api.get(`/academics/classes?branchId=${branchId}`),
          api.get(`/academics/student-categories?branchId=${branchId}`)
        ]);
        
        console.log('[StudentReport] Sessions response:', sessRes.data);
        console.log('[StudentReport] Classes response:', classRes.data);
        
        const sessData = Array.isArray(sessRes.data) ? sessRes.data : (sessRes.data?.data || []);
        const classData = Array.isArray(classRes.data) ? classRes.data : (classRes.data?.data || []);
        const catData = Array.isArray(catRes.data) ? catRes.data : (catRes.data?.data || []);
        
        setSessions(sessData);
        setClasses(classData);
        setCategories(catData);
        
        // Set default session - prefer active, fallback to first
        const active = sessData.find(s => s.is_active);
        if (active) {
          console.log('[StudentReport] Setting active session:', active.id);
          setSelectedSession(active.id);
        } else if (sessData.length > 0) {
          console.log('[StudentReport] No active session, using first:', sessData[0].id);
          setSelectedSession(sessData[0].id);
        }
      } catch (err) {
        console.error('Error loading master data:', err);
      }
    };
    loadMasterData();
  }, [selectedBranch?.id]);

  // Load sections when class changes
  useEffect(() => {
    const loadSections = async () => {
      if (!selectedClass || !selectedBranch?.id) { setSections([]); return; }
      try {
        const res = await api.get(`/academics/sections?classId=${selectedClass}&branchId=${selectedBranch.id}`);
        setSections(res.data || []);
      } catch (err) {
        console.error('Error loading sections:', err);
      }
    };
    loadSections();
  }, [selectedClass, selectedBranch?.id]);

  // Reset data when report changes
  useEffect(() => {
    setReportData(null);
    setTableData([]);
    setSearchText('');
  }, [activeReport]);

  // Fetch report
  const fetchReport = async () => {
    if (!selectedSession || !selectedBranch?.id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ 
        sessionId: selectedSession,
        branchId: selectedBranch.id
      });
      
      // Add filters based on report type
      if (selectedClass) params.append('classId', selectedClass);
      if (selectedSection) params.append('sectionId', selectedSection);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (selectedGender) params.append('gender', selectedGender);
      if (selectedRte) params.append('isRte', selectedRte);
      if (selectedSearchType) params.append('searchType', selectedSearchType);
      if (selectedDateRange && activeReport === 'birthday_report') params.append('dateRange', selectedDateRange);
      if (admissionYear) params.append('admissionYear', admissionYear);

      const res = await api.get(`/student-reports${currentReportInfo?.endpoint}?${params}`);
      
      console.log('[StudentReport] Raw API response:', res);
      console.log('[StudentReport] res.data:', res.data);
      
      // Handle different response formats
      const data = res.data?.data || res.data;
      console.log('[StudentReport] Extracted data:', data);
      
      setReportData(data);
      
      // Flatten table data
      if (Array.isArray(data)) {
        console.log('[StudentReport] Data is array, length:', data.length);
        setTableData(data);
      } else if (data?.classes) {
        console.log('[StudentReport] Data has classes');
        setTableData(data.classes);
      } else if (data?.data) {
        console.log('[StudentReport] Data has nested data');
        setTableData(data.data);
      } else {
        console.log('[StudentReport] No matching data format, setting empty');
        setTableData([]);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  // Get columns based on report type
  const getColumns = () => {
    switch (activeReport) {
      case 'student_report':
      case 'student_profile':
        return [
          { key: 'admission_number', label: 'Adm. No' },
          { key: 'name', label: 'Student Name', render: (_, r) => `${r.first_name || ''} ${r.last_name || ''}`.trim() },
          { key: 'class', label: 'Class', render: (_, r) => r.class?.name || '-' },
          { key: 'section', label: 'Section', render: (_, r) => r.section?.name || '-' },
          { key: 'gender', label: 'Gender' },
          { key: 'phone', label: 'Phone' },
          { key: 'father_name', label: 'Father Name' }
        ];
      case 'guardian_report':
        return [
          { key: 'admission_number', label: 'Adm. No' },
          { key: 'name', label: 'Student', render: (_, r) => `${r.first_name || ''} ${r.last_name || ''}`.trim() },
          { key: 'class', label: 'Class', render: (_, r) => r.class?.name || '-' },
          { key: 'father_name', label: 'Father' },
          { key: 'father_phone', label: 'Father Phone' },
          { key: 'mother_name', label: 'Mother' },
          { key: 'mother_phone', label: 'Mother Phone' },
          { key: 'guardian_name', label: 'Guardian' }
        ];
      case 'class_section_report':
        return [
          { key: 'className', label: 'Class' },
          { key: 'totalStudents', label: 'Total Students' },
          { key: 'sections', label: 'Sections', render: (v) => v?.map(s => `${s.sectionName}(${s.students})`).join(', ') || '-' }
        ];
      case 'gender_ratio_report':
        return [
          { key: 'className', label: 'Class' },
          { key: 'male', label: 'Boys' },
          { key: 'female', label: 'Girls' },
          { key: 'other', label: 'Other' },
          { key: 'total', label: 'Total' }
        ];
      case 'month_wise_closing':
        return [
          { key: 'month', label: 'Month' },
          { key: 'opening', label: 'Opening' },
          { key: 'newAdmission', label: 'New Admission' },
          { key: 'tcIssued', label: 'TC Issued' },
          { key: 'leftOther', label: 'Left Other' },
          { key: 'closing', label: 'Closing' }
        ];
      case 'age_wise_distribution':
        return [
          { key: 'ageGroup', label: 'Age Group' },
          { key: 'count', label: 'Students' },
          { key: 'percentage', label: 'Percentage', render: (v) => `${v}%` }
        ];
      case 'category_wise_strength':
        return [
          { key: 'categoryName', label: 'Category' },
          { key: 'count', label: 'Students' },
          { key: 'percentage', label: 'Percentage', render: (v) => `${v}%` }
        ];
      case 'rte_strength':
        return [
          { key: 'className', label: 'Class' },
          { key: 'rte', label: 'RTE' },
          { key: 'nonRte', label: 'Non-RTE' },
          { key: 'total', label: 'Total' }
        ];
      case 'birthday_report':
        return [
          { key: 'admissionNo', label: 'Adm. No' },
          { key: 'name', label: 'Student Name' },
          { key: 'dob', label: 'Date of Birth', render: (v) => formatDate(v) },
          { key: 'age', label: 'Age' },
          { key: 'className', label: 'Class' },
          { key: 'phone', label: 'Phone' }
        ];
      case 'blood_group_report':
        return [
          { key: 'bloodGroup', label: 'Blood Group' },
          { key: 'count', label: 'Students' },
          { key: 'percentage', label: 'Percentage', render: (v) => `${v}%` }
        ];
      case 'area_wise_report':
        return [
          { key: 'area', label: 'Pincode/Area' },
          { key: 'city', label: 'City' },
          { key: 'state', label: 'State' },
          { key: 'count', label: 'Students' },
          { key: 'percentage', label: 'Percentage', render: (v) => `${v}%` }
        ];
      case 'admission_report':
        return [
          { key: 'admission_number', label: 'Adm. No' },
          { key: 'name', label: 'Student', render: (_, r) => `${r.first_name || ''} ${r.last_name || ''}`.trim() },
          { key: 'class', label: 'Class', render: (_, r) => r.class?.name || '-' },
          { key: 'admission_date', label: 'Admission Date', render: (v) => formatDate(v) },
          { key: 'father_name', label: 'Father' },
          { key: 'phone', label: 'Phone' }
        ];
      case 'admission_vacancy':
        return [
          { key: 'className', label: 'Class' },
          { key: 'capacity', label: 'Capacity' },
          { key: 'filled', label: 'Filled' },
          { key: 'vacant', label: 'Vacant' },
          { key: 'fillPercentage', label: 'Fill %', render: (v) => `${v}%` }
        ];
      case 'new_vs_old_students':
        return [
          { key: 'className', label: 'Class' },
          { key: 'newStudents', label: 'New Students' },
          { key: 'oldStudents', label: 'Old Students' },
          { key: 'total', label: 'Total' }
        ];
      case 'tc_issued_report':
        return [
          { key: 'admission_number', label: 'Adm. No' },
          { key: 'name', label: 'Student', render: (_, r) => `${r.first_name || ''} ${r.last_name || ''}`.trim() },
          { key: 'class', label: 'Class', render: (_, r) => r.class?.name || '-' },
          { key: 'left_date', label: 'Left Date', render: (v) => formatDate(v) },
          { key: 'tc_number', label: 'TC No' },
          { key: 'leaving_reason', label: 'Reason' }
        ];
      case 'student_login_credential':
      case 'parent_login_credential':
        return [
          { key: 'admission_number', label: 'Adm. No' },
          { key: 'name', label: 'Student', render: (_, r) => `${r.first_name || ''} ${r.last_name || ''}`.trim() },
          { key: 'class', label: 'Class', render: (_, r) => r.class?.name || '-' },
          { key: 'email', label: 'Login ID / Email' },
          { key: 'phone', label: 'Phone' }
        ];
      case 'transport_users_report':
        return [
          { key: 'admissionNo', label: 'Adm. No' },
          { key: 'name', label: 'Student' },
          { key: 'className', label: 'Class' },
          { key: 'routeName', label: 'Route' },
          { key: 'vehicleNo', label: 'Vehicle' },
          { key: 'pickupPoint', label: 'Pickup Point' },
          { key: 'phone', label: 'Phone' }
        ];
      case 'hostel_students_report':
        return [
          { key: 'admissionNo', label: 'Adm. No' },
          { key: 'name', label: 'Student' },
          { key: 'className', label: 'Class' },
          { key: 'hostelName', label: 'Hostel' },
          { key: 'roomNo', label: 'Room' },
          { key: 'floor', label: 'Floor' },
          { key: 'phone', label: 'Phone' }
        ];
      case 'student_teacher_ratio':
        return [
          { key: 'className', label: 'Class' },
          { key: 'students', label: 'Students' },
          { key: 'teachers', label: 'Teachers' },
          { key: 'ratio', label: 'Ratio' }
        ];
      case 'house_wise_strength':
        return [
          { key: 'name', label: 'House' },
          { key: 'count', label: 'Students' },
          { key: 'percentage', label: 'Percentage', render: (v) => `${v}%` }
        ];
      case 'mother_tongue_report':
        return [
          { key: 'language', label: 'Language' },
          { key: 'count', label: 'Students' },
          { key: 'percentage', label: 'Percentage', render: (v) => `${v}%` }
        ];
      case 'sibling_report':
        return [
          { key: 'fatherName', label: 'Father Name' },
          { key: 'fatherPhone', label: 'Father Phone' },
          { key: 'motherName', label: 'Mother Name' },
          { key: 'students', label: 'Siblings', render: (v) => v?.map(s => `${s.name} (${s.className})`).join(', ') || '-' }
        ];
      case 'student_history':
        return [
          { key: 'admission_number', label: 'Adm. No' },
          { key: 'name', label: 'Student', render: (_, r) => `${r.first_name || ''} ${r.last_name || ''}`.trim() },
          { key: 'class', label: 'Class', render: (_, r) => r.class?.name || '-' },
          { key: 'admission_date', label: 'Admission Date', render: (v) => formatDate(v) },
          { key: 'guardian_name', label: 'Guardian' },
          { key: 'guardian_phone', label: 'Guardian Phone' }
        ];
      case 'religion_caste_report':
        // Special handling - show religion data from reportData.religionData
        return [
          { key: 'name', label: 'Religion/Caste' },
          { key: 'count', label: 'Students' },
          { key: 'percentage', label: 'Percentage', render: (v) => `${v}%` }
        ];
      case 'parent_occupation_report':
        // Special handling - show father occupation data
        return [
          { key: 'occupation', label: 'Occupation' },
          { key: 'count', label: 'Students' }
        ];
      default:
        return [{ key: 'id', label: 'ID' }];
    }
  };

  // Handle special report data formats
  useEffect(() => {
    if (activeReport === 'religion_caste_report' && reportData?.religionData) {
      setTableData(reportData.religionData);
    } else if (activeReport === 'parent_occupation_report' && reportData?.fatherOccupations) {
      setTableData(reportData.fatherOccupations);
    }
  }, [activeReport, reportData]);

  // Render charts
  const renderChart = () => {
    if (!currentReportInfo?.hasChart || !reportData) return null;

    switch (activeReport) {
      case 'gender_ratio_report':
        return <GenderRatioChart data={reportData} />;
      case 'month_wise_closing':
        return <MonthWiseClosingChart data={reportData} />;
      case 'admission_trends':
        return <AdmissionTrendsChart data={reportData} />;
      case 'admission_vacancy':
        return <VacancyChart data={reportData} />;
      case 'age_wise_distribution':
        return <PieChartComponent data={reportData} dataKey="count" nameKey="ageGroup" title="Age Distribution" />;
      case 'category_wise_strength':
        return <PieChartComponent data={reportData} dataKey="count" nameKey="categoryName" title="Category Distribution" />;
      case 'blood_group_report':
        return <PieChartComponent data={reportData} dataKey="count" nameKey="bloodGroup" title="Blood Group Distribution" />;
      case 'rte_strength':
      case 'new_vs_old_students':
        const barData = (reportData?.classes || reportData?.data || []).map(d => ({
          name: d.className,
          value1: d.rte || d.newStudents || 0,
          value2: d.nonRte || d.oldStudents || 0
        }));
        return (
          <Card className="mb-4">
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: 'currentColor' }} />
                  <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                  <Bar dataKey="value1" name={activeReport === 'rte_strength' ? 'RTE' : 'New'} fill="#10B981" />
                  <Bar dataKey="value2" name={activeReport === 'rte_strength' ? 'Non-RTE' : 'Old'} fill="#3B82F6" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      case 'area_wise_report':
      case 'mother_tongue_report':
      case 'house_wise_strength':
        return <PieChartComponent data={reportData} dataKey="count" nameKey={activeReport === 'mother_tongue_report' ? 'language' : (activeReport === 'house_wise_strength' ? 'name' : 'area')} title="Distribution" />;
      case 'religion_caste_report':
        return <PieChartComponent data={reportData?.religionData || []} dataKey="count" nameKey="name" title="Religion Distribution" />;
      case 'parent_occupation_report':
        return <PieChartComponent data={reportData?.fatherOccupations?.slice(0, 10) || []} dataKey="count" nameKey="occupation" title="Parent Occupation Distribution" />;
      default:
        return null;
    }
  };

  // Render totals
  const renderTotals = () => {
    if (!reportData?.totals) return null;
    const t = reportData.totals;
    
    return (
      <div className="mt-3 p-3 bg-muted rounded-lg flex flex-wrap items-center gap-4 text-sm font-semibold">
        {t.male !== undefined && <span className="text-blue-500">Boys: {t.male}</span>}
        {t.female !== undefined && <span className="text-pink-500">Girls: {t.female}</span>}
        {t.rte !== undefined && <span className="text-green-500">RTE: {t.rte}</span>}
        {t.nonRte !== undefined && <span className="text-blue-500">Non-RTE: {t.nonRte}</span>}
        {t.totalNew !== undefined && <span className="text-green-500">New: {t.totalNew}</span>}
        {t.totalOld !== undefined && <span className="text-blue-500">Old: {t.totalOld}</span>}
        {t.totalCapacity !== undefined && <span className="text-orange-500">Capacity: {t.totalCapacity}</span>}
        {t.totalFilled !== undefined && <span className="text-green-500">Filled: {t.totalFilled}</span>}
        {t.totalVacant !== undefined && <span className="text-yellow-500">Vacant: {t.totalVacant}</span>}
        {t.total !== undefined && <span className="text-foreground font-bold">Total: {t.total}</span>}
        {t.grandTotal !== undefined && <span className="text-foreground font-bold">Grand Total: {t.grandTotal}</span>}
      </div>
    );
  };

  // Render filters
  const renderFilters = () => {
    const needsClass = ['student_report', 'student_profile', 'guardian_report', 'student_history', 
                        'student_login_credential', 'parent_login_credential', 'sibling_report', 
                        'birthday_report', 'blood_group_report', 'transport_users_report', 
                        'hostel_students_report'].includes(activeReport);
    const needsDateRange = ['birthday_report'].includes(activeReport);
    const needsSearchType = ['admission_report', 'tc_issued_report'].includes(activeReport);
    const needsYear = ['student_history'].includes(activeReport);
    const needsGenderCategory = ['student_report', 'student_profile'].includes(activeReport);

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {/* Session - Always shown */}
        <div>
          <Label className="text-xs font-medium mb-1 block">Session <span className="text-red-500">*</span></Label>
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger className="h-9">
              <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name} {s.is_active ? '(Active)' : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Class */}
        {needsClass && (
          <div>
            <Label className="text-xs font-medium mb-1 block">Class</Label>
            <Select value={selectedClass} onValueChange={v => { setSelectedClass(v); setSelectedSection(''); }}>
              <SelectTrigger className="h-9"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Section */}
        {needsClass && selectedClass && (
          <div>
            <Label className="text-xs font-medium mb-1 block">Section</Label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="h-9"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Category */}
        {needsGenderCategory && (
          <div>
            <Label className="text-xs font-medium mb-1 block">Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-9"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Gender */}
        {needsGenderCategory && (
          <div>
            <Label className="text-xs font-medium mb-1 block">Gender</Label>
            <Select value={selectedGender} onValueChange={setSelectedGender}>
              <SelectTrigger className="h-9"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date Range for Birthday */}
        {needsDateRange && (
          <div>
            <Label className="text-xs font-medium mb-1 block">Date Range</Label>
            <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="next_month">Next Month</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Search Type for Admission/TC */}
        {needsSearchType && (
          <div>
            <Label className="text-xs font-medium mb-1 block">Time Period</Label>
            <Select value={selectedSearchType} onValueChange={setSelectedSearchType}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Admission Year */}
        {needsYear && (
          <div>
            <Label className="text-xs font-medium mb-1 block">Admission Year</Label>
            <Input
              type="number" placeholder="e.g. 2024" value={admissionYear}
              onChange={e => setAdmissionYear(e.target.value)} className="h-9"
              min="2000" max="2100"
            />
          </div>
        )}

        {/* Generate Button */}
        <div className="flex items-end">
          <Button onClick={fetchReport} className="h-9 bg-blue-600 hover:bg-blue-700" disabled={loading || !selectedSession}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
            Generate
          </Button>
        </div>
      </div>
    );
  };

  const columns = getColumns();

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Student Information Report
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              28+ comprehensive report types across 6 categories
            </p>
          </div>
          <Badge variant="outline" className="self-start">
            {REPORT_CATEGORIES.find(c => c.key === activeCategory)?.label} / {currentReportInfo?.label}
          </Badge>
        </div>

        {/* Category Tabs */}
        <Card>
          <CardContent className="p-3">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2">
                {REPORT_CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => {
                        setActiveCategory(cat.key);
                        setActiveReport(REPORT_TYPES[cat.key][0].key);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                        ${isActive 
                          ? `${cat.color} text-white shadow-md` 
                          : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                    >
                      <Icon className="h-4 w-4" />
                      {cat.label}
                      <Badge variant="secondary" className={`ml-1 ${isActive ? 'bg-white/20 text-white' : ''}`}>
                        {REPORT_TYPES[cat.key].length}
                      </Badge>
                    </button>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Report Types Grid */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {REPORT_TYPES[activeCategory].map(report => {
                const Icon = report.icon;
                const isActive = activeReport === report.key;
                return (
                  <button
                    key={report.key}
                    onClick={() => setActiveReport(report.key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all text-xs font-medium
                      ${isActive
                        ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
                        : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border'
                      }`}
                  >
                    <div className={`p-1.5 rounded ${isActive ? 'bg-white/20' : 'bg-primary/10'}`}>
                      <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
                    </div>
                    <span className="truncate">{report.label}</span>
                    {report.hasChart && (
                      <BarChart3 className={`h-3 w-3 ml-auto ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filter + Results */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {currentReportInfo && <currentReportInfo.icon className="h-5 w-5 text-primary" />}
              {currentReportInfo?.label || 'Report'}
              {tableData.length > 0 && (
                <Badge variant="secondary" className="ml-2">{tableData.length} records</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="bg-muted/50 p-4 rounded-lg border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Select Criteria
              </h3>
              {renderFilters()}
            </div>

            {/* Charts */}
            {renderChart()}

            {/* Results Table */}
            {(tableData.length > 0 || loading) && !currentReportInfo?.chartOnly && (
              <div>
                <DataTableExport
                  data={tableData}
                  columns={columns}
                  loading={loading}
                  title={currentReportInfo?.label || 'Report'}
                  searchText={searchText}
                  onSearchChange={setSearchText}
                />
                
                {/* Actual Table */}
                <div className="mt-4 border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-foreground">#</th>
                          {columns.map(col => (
                            <th key={col.key} className="px-3 py-2 text-left font-semibold text-foreground">
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {loading ? (
                          <tr>
                            <td colSpan={columns.length + 1} className="px-3 py-8 text-center">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                              <p className="mt-2 text-muted-foreground">Loading...</p>
                            </td>
                          </tr>
                        ) : tableData.length === 0 ? (
                          <tr>
                            <td colSpan={columns.length + 1} className="px-3 py-8 text-center text-muted-foreground">
                              No data found
                            </td>
                          </tr>
                        ) : (
                          tableData.map((row, idx) => (
                            <tr key={row.id || idx} className="hover:bg-muted/30">
                              <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                              {columns.map(col => (
                                <td key={col.key} className="px-3 py-2">
                                  {col.render 
                                    ? col.render(row[col.key], row) 
                                    : (row[col.key] ?? '-')}
                                </td>
                              ))}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {renderTotals()}
              </div>
            )}

            {/* Empty State */}
            {!loading && tableData.length === 0 && !currentReportInfo?.chartOnly && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Select criteria and click "Generate" to view report</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentInformationReport;
