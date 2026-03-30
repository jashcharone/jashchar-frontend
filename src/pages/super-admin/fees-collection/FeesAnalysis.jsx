import React, { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  IndianRupee, Users, Loader2, Download, Printer, Sheet,
  BarChart3, TrendingUp, TrendingDown, Calendar, Filter, RefreshCw,
  AlertCircle, CheckCircle2, Clock, CreditCard, Wallet, PieChart,
  ArrowUpRight, ArrowDownRight, GraduationCap, Search, Undo2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fetchPrintHeaderData, buildOrgHeaderHtml, PRINT_STYLES, downloadReportAsPDF } from '@/utils/printOrgHeader';

// ═══════════════════════════════════════════════════════════
// FEES ANALYSIS - World-Class Fee Analytics Module
// Designed for 500+ schools, built to last 50+ years
// ═══════════════════════════════════════════════════════════

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'text-primary', bgColor = 'bg-primary/10', trend, trendLabel }) => (
  <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className={cn("text-2xl font-bold", color)}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn("p-3 rounded-xl", bgColor)}>
          <Icon className={cn("h-6 w-6", color)} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          {trend >= 0 ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
          <span className={trend >= 0 ? 'text-green-600' : 'text-red-600'}>{Math.abs(trend)}%</span>
          {trendLabel && <span className="text-muted-foreground ml-1">{trendLabel}</span>}
        </div>
      )}
    </CardContent>
  </Card>
);

const FeesAnalysis = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  const { toast } = useToast();
  const printRef = useRef();
  
  // Unified branchId with fallback for staff users
  const branchId = selectedBranch?.id || user?.profile?.branch_id || user?.user_metadata?.branch_id;

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedFeeType, setSelectedFeeType] = useState('all');
  const [feeTypes, setFeeTypes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(currentSessionId);

  // Analytics Data
  const [overview, setOverview] = useState({
    totalAllocated: 0, totalCollected: 0, totalDue: 0, totalDiscount: 0,
    totalFine: 0, totalRefunded: 0, collectionRate: 0, totalStudents: 0, fullyPaid: 0,
    partialPaid: 0, unpaid: 0, totalPayments: 0,
  });
  const [classWiseFees, setClassWiseFees] = useState([]);
  const [feeTypeBreakdown, setFeeTypeBreakdown] = useState([]);
  const [paymentModeSplit, setPaymentModeSplit] = useState([]);
  const [monthlyCollection, setMonthlyCollection] = useState([]);
  const [topDefaulters, setTopDefaulters] = useState([]);
  const [dailyCollection, setDailyCollection] = useState([]);
  const [printHeaderData, setPrintHeaderData] = useState({});

  const fetchClasses = useCallback(async () => {
    if (!branchId) return;
    const { data } = await supabase.from('classes').select('id, name')
      .eq('branch_id', branchId).order('name');
    setClasses(data || []);
  }, [branchId]);

  const fetchFeeTypes = useCallback(async () => {
    if (!branchId || !currentSessionId) return;
    const { data } = await supabase.from('fee_types').select('id, name, is_active')
      .eq('branch_id', branchId)
      .eq('session_id', currentSessionId)
      .eq('is_active', true)
      .order('name');
    setFeeTypes(data || []);
  }, [branchId, currentSessionId]);

  useEffect(() => { fetchClasses(); fetchFeeTypes(); }, [fetchClasses, fetchFeeTypes]);

  // Fetch print header data (org logo, school info) for PDF
  useEffect(() => {
    if (branchId) fetchPrintHeaderData(supabase, branchId).then(setPrintHeaderData);
  }, [branchId]);

  const fetchSessions = useCallback(async () => {
    if (!branchId) return;
    const { data } = await supabase.from('sessions')
      .select('id, name, is_active')
      .eq('branch_id', branchId)
      .order('name', { ascending: false });
    setSessions(data || []);
  }, [branchId]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);
  useEffect(() => { if (currentSessionId) setSelectedSessionId(currentSessionId); }, [currentSessionId]);

  const fetchAnalytics = useCallback(async () => {
    if (!branchId || !selectedSessionId) return;
    setLoading(true);

    try {
      // === 1. GET ALL STUDENTS FOR THIS SESSION (with pagination to bypass 1000 row limit) ===
      let allStudents = [];
      const studentBatchSize = 1000;
      let studentOffset = 0;
      let hasMoreStudents = true;
      
      while (hasMoreStudents) {
        let studentQuery = supabase.from('student_profiles')
          .select('id, full_name, enrollment_id, class_id, classes!student_profiles_class_id_fkey(name), sections!student_profiles_section_id_fkey(name), father_name, phone, father_phone, mother_phone, guardian_name, guardian_phone')
          .eq('branch_id', branchId)
          .eq('session_id', selectedSessionId)
          .range(studentOffset, studentOffset + studentBatchSize - 1);
        
        if (selectedClass !== 'all') studentQuery = studentQuery.eq('class_id', selectedClass);
        const { data: students } = await studentQuery;
        
        if (students && students.length > 0) {
          allStudents.push(...students);
          studentOffset += studentBatchSize;
          hasMoreStudents = students.length === studentBatchSize;
        } else {
          hasMoreStudents = false;
        }
      }
      
      const studentIds = allStudents.map(s => s.id);
      const studentMap = {};
      allStudents.forEach(s => { studentMap[s.id] = s; });

      if (studentIds.length === 0) {
        setOverview({ totalAllocated: 0, totalCollected: 0, totalDue: 0, totalDiscount: 0, totalFine: 0, totalRefunded: 0, collectionRate: 0, totalStudents: 0, fullyPaid: 0, partialPaid: 0, unpaid: 0, totalPayments: 0 });
        setClassWiseFees([]); setFeeTypeBreakdown([]); setPaymentModeSplit([]); setMonthlyCollection([]); setTopDefaulters([]); setDailyCollection([]);
        setLoading(false);
        return;
      }

      // === 2. FETCH ALL ALLOCATIONS ===
      let allAllocations = [];
      const batchSize = 100;
      for (let i = 0; i < studentIds.length; i += batchSize) {
        const batch = studentIds.slice(i, i + batchSize);
        let allocQuery = supabase.from('student_fee_allocations')
          .select('id, student_id, fee_master_id, fee_master:fee_masters(id, amount, fee_type_id, fee_type:fee_types(id, name), fee_group:fee_groups(name))')
          .in('student_id', batch)
          .eq('branch_id', branchId)
          .eq('session_id', selectedSessionId);
        const { data } = await allocQuery;
        if (data) allAllocations.push(...data);
      }

      // Filter by fee type if selected
      if (selectedFeeType !== 'all') {
        allAllocations = allAllocations.filter(a => a.fee_master?.fee_type_id === selectedFeeType);
      }

      // === 3. FETCH ALL PAYMENTS (Academic Fees) ===
      let allPayments = [];
      for (let i = 0; i < studentIds.length; i += batchSize) {
        const batch = studentIds.slice(i, i + batchSize);
        const { data } = await supabase.from('fee_payments')
          .select('id, student_id, amount, discount_amount, fine_paid, payment_mode, payment_date, created_at, fee_master_id')
          .in('student_id', batch)
          .eq('branch_id', branchId)
          .eq('session_id', selectedSessionId)
          .is('reverted_at', null);
        if (data) allPayments.push(...data);
      }

      // If fee type filter applied, filter payments too
      if (selectedFeeType !== 'all') {
        const validMasterIds = new Set(allAllocations.map(a => a.fee_master_id));
        allPayments = allPayments.filter(p => validMasterIds.has(p.fee_master_id));
      }

      // === 3B. FETCH TRANSPORT FEE DATA ===
      let allTransportDetails = [];
      let allTransportPayments = [];
      for (let i = 0; i < studentIds.length; i += batchSize) {
        const batch = studentIds.slice(i, i + batchSize);
        try {
          const [detRes, payRes] = await Promise.all([
            supabase.from('student_transport_details')
              .select('id, student_id, transport_fee')
              .in('student_id', batch),
            supabase.from('transport_fee_payments')
              .select('id, student_id, amount, discount_amount, fine_paid, payment_mode, payment_date, created_at')
              .in('student_id', batch)
              .is('reverted_at', null)
          ]);
          if (detRes.data) allTransportDetails.push(...detRes.data);
          if (payRes.data) allTransportPayments.push(...payRes.data);
        } catch (transportErr) {
          // Transport tables may not exist or RLS may block - continue gracefully
          console.log('Transport fee data not available (table may not exist):', transportErr?.message);
        }
      }

      // === 3C. FETCH HOSTEL FEE DATA ===
      let allHostelDetails = [];
      let allHostelPayments = [];
      for (let i = 0; i < studentIds.length; i += batchSize) {
        const batch = studentIds.slice(i, i + batchSize);
        try {
          const [detRes, payRes] = await Promise.all([
            supabase.from('student_hostel_details')
              .select('id, student_id, hostel_fee')
              .in('student_id', batch),
            supabase.from('hostel_fee_payments')
              .select('id, student_id, amount, discount_amount, fine_paid, payment_mode, payment_date, created_at')
              .in('student_id', batch)
              .is('reverted_at', null)
          ]);
          if (detRes.data) allHostelDetails.push(...detRes.data);
          if (payRes.data) allHostelPayments.push(...payRes.data);
        } catch (hostelErr) {
          // Hostel tables may not exist or RLS may block - continue gracefully
          console.log('Hostel fee data not available (table may not exist):', hostelErr?.message);
        }
      }

      // === 3D. FETCH APPROVED REFUNDS ===
      let allRefunds = [];
      for (let i = 0; i < studentIds.length; i += batchSize) {
        const batch = studentIds.slice(i, i + batchSize);
        try {
          const { data, error } = await supabase.from('fee_refunds')
            .select('id, student_id, refund_amount, refund_type, status')
            .in('student_id', batch)
            .eq('status', 'approved');
          if (!error && data) allRefunds.push(...data);
        } catch (refundErr) {
          // fee_refunds table may not exist - continue gracefully
          console.log('Fee refunds data not available (table may not exist):', refundErr?.message);
        }
      }

      // === 4. COMPUTE OVERVIEW ===
      let totalAllocated = 0, totalDiscount = 0, totalFine = 0;
      allAllocations.forEach(a => { totalAllocated += parseFloat(a.fee_master?.amount || 0); });

      // Transport & Hostel allocated
      let totalTransportAllocated = 0, totalHostelAllocated = 0;
      allTransportDetails.forEach(td => { totalTransportAllocated += parseFloat(td.transport_fee || 0); });
      allHostelDetails.forEach(hd => { totalHostelAllocated += parseFloat(hd.hostel_fee || 0); });

      let totalCollected = 0;
      allPayments.forEach(p => {
        totalCollected += parseFloat(p.amount || 0);
        totalDiscount += parseFloat(p.discount_amount || 0);
        totalFine += parseFloat(p.fine_paid || 0);
      });

      // Transport & Hostel collected
      let totalTransportCollected = 0, totalHostelCollected = 0;
      allTransportPayments.forEach(p => {
        totalTransportCollected += parseFloat(p.amount || 0);
        totalDiscount += parseFloat(p.discount_amount || 0);
        totalFine += parseFloat(p.fine_paid || 0);
      });
      allHostelPayments.forEach(p => {
        totalHostelCollected += parseFloat(p.amount || 0);
        totalDiscount += parseFloat(p.discount_amount || 0);
        totalFine += parseFloat(p.fine_paid || 0);
      });

      // Grand totals (academic + transport + hostel)
      const grandAllocated = totalAllocated + totalTransportAllocated + totalHostelAllocated;
      const grandCollected = totalCollected + totalTransportCollected + totalHostelCollected;
      // Discount reduces what student owes — so effective payment = cash + discount
      const grandEffective = grandCollected + totalDiscount;
      
      // Calculate total refunded (approved refunds = money returned to students)
      const totalRefunded = allRefunds.reduce((sum, r) => sum + parseFloat(r.refund_amount || 0), 0);
      
      // Balance Due = Total Allocated - Effective Paid + Refunded (refund adds back to balance)
      const totalDue = Math.max(0, grandAllocated - grandEffective + totalRefunded);
      const collectionRate = grandAllocated > 0 ? Math.round((grandEffective / grandAllocated) * 100) : 0;

      // Per-student payment status (all fee types combined)
      const studentPaid = {};
      const studentTotal = {};
      // Per-student fee breakdowns
      const studentFeeBreakdown = {};
      allAllocations.forEach(a => {
        studentTotal[a.student_id] = (studentTotal[a.student_id] || 0) + parseFloat(a.fee_master?.amount || 0);
        if (!studentFeeBreakdown[a.student_id]) studentFeeBreakdown[a.student_id] = { academic: 0, academicPaid: 0, transport: 0, transportPaid: 0, hostel: 0, hostelPaid: 0, discount: 0, fine: 0 };
        studentFeeBreakdown[a.student_id].academic += parseFloat(a.fee_master?.amount || 0);
      });
      allPayments.forEach(p => {
        const amt = parseFloat(p.amount || 0);
        const disc = parseFloat(p.discount_amount || 0);
        // Effective payment = cash + discount (discount reduces what student owes)
        studentPaid[p.student_id] = (studentPaid[p.student_id] || 0) + amt + disc;
        if (studentFeeBreakdown[p.student_id]) {
          studentFeeBreakdown[p.student_id].academicPaid += amt + disc;
          studentFeeBreakdown[p.student_id].discount += disc;
          studentFeeBreakdown[p.student_id].fine += parseFloat(p.fine_paid || 0);
        }
      });
      // Transport
      allTransportDetails.forEach(td => {
        const fee = parseFloat(td.transport_fee || 0);
        studentTotal[td.student_id] = (studentTotal[td.student_id] || 0) + fee;
        if (!studentFeeBreakdown[td.student_id]) studentFeeBreakdown[td.student_id] = { academic: 0, academicPaid: 0, transport: 0, transportPaid: 0, hostel: 0, hostelPaid: 0, discount: 0, fine: 0 };
        studentFeeBreakdown[td.student_id].transport += fee;
      });
      allTransportPayments.forEach(p => {
        const amt = parseFloat(p.amount || 0);
        const disc = parseFloat(p.discount_amount || 0);
        studentPaid[p.student_id] = (studentPaid[p.student_id] || 0) + amt + disc;
        if (studentFeeBreakdown[p.student_id]) {
          studentFeeBreakdown[p.student_id].transportPaid += amt + disc;
          studentFeeBreakdown[p.student_id].discount += disc;
          studentFeeBreakdown[p.student_id].fine += parseFloat(p.fine_paid || 0);
        }
      });
      // Hostel
      allHostelDetails.forEach(hd => {
        const fee = parseFloat(hd.hostel_fee || 0);
        studentTotal[hd.student_id] = (studentTotal[hd.student_id] || 0) + fee;
        if (!studentFeeBreakdown[hd.student_id]) studentFeeBreakdown[hd.student_id] = { academic: 0, academicPaid: 0, transport: 0, transportPaid: 0, hostel: 0, hostelPaid: 0, discount: 0, fine: 0 };
        studentFeeBreakdown[hd.student_id].hostel += fee;
      });
      allHostelPayments.forEach(p => {
        const amt = parseFloat(p.amount || 0);
        const disc = parseFloat(p.discount_amount || 0);
        studentPaid[p.student_id] = (studentPaid[p.student_id] || 0) + amt + disc;
        if (studentFeeBreakdown[p.student_id]) {
          studentFeeBreakdown[p.student_id].hostelPaid += amt + disc;
          studentFeeBreakdown[p.student_id].discount += disc;
          studentFeeBreakdown[p.student_id].fine += parseFloat(p.fine_paid || 0);
        }
      });

      let fullyPaid = 0, partialPaid = 0, unpaid = 0;
      studentIds.forEach(id => {
        const total = studentTotal[id] || 0;
        const paid = studentPaid[id] || 0;
        if (total === 0) return;
        if (paid >= total) fullyPaid++;
        else if (paid > 0) partialPaid++;
        else unpaid++;
      });

      // Pre-compute transport & hostel discount totals (needed by setOverview and fee type breakdown)
      let transportDiscTotal = 0;
      allTransportPayments.forEach(p => { transportDiscTotal += parseFloat(p.discount_amount || 0); });
      let hostelDiscTotal = 0;
      allHostelPayments.forEach(p => { hostelDiscTotal += parseFloat(p.discount_amount || 0); });
      const academicDiscTotal = totalDiscount - transportDiscTotal - hostelDiscTotal;

      setOverview({
        totalAllocated: grandAllocated, totalCollected: grandEffective, totalCashCollected: grandCollected, totalDue, totalDiscount, totalFine, totalRefunded,
        collectionRate, totalStudents: allStudents.length, fullyPaid, partialPaid, unpaid,
        totalPayments: allPayments.length + allTransportPayments.length + allHostelPayments.length,
        // Detailed breakdowns (collected = cash + discount for each)
        academicAllocated: totalAllocated, academicCollected: totalCollected + academicDiscTotal,
        transportAllocated: totalTransportAllocated, transportCollected: totalTransportCollected + transportDiscTotal,
        hostelAllocated: totalHostelAllocated, hostelCollected: totalHostelCollected + hostelDiscTotal,
      });

      // === 5. CLASS-WISE FEES (Academic + Transport + Hostel) ===
      const classMap = {};
      allAllocations.forEach(a => {
        const s = studentMap[a.student_id];
        const cn = s?.classes?.name || 'Unassigned';
        if (!classMap[cn]) classMap[cn] = { name: cn, allocated: 0, collected: 0, students: new Set(), fullyPaid: 0, partial: 0, unpaid: 0 };
        classMap[cn].allocated += parseFloat(a.fee_master?.amount || 0);
        classMap[cn].students.add(a.student_id);
      });
      // Add transport allocations
      allTransportDetails.forEach(td => {
        const s = studentMap[td.student_id];
        const cn = s?.classes?.name || 'Unassigned';
        if (!classMap[cn]) classMap[cn] = { name: cn, allocated: 0, collected: 0, students: new Set(), fullyPaid: 0, partial: 0, unpaid: 0 };
        classMap[cn].allocated += parseFloat(td.transport_fee || 0);
        classMap[cn].students.add(td.student_id);
      });
      // Add hostel allocations
      allHostelDetails.forEach(hd => {
        const s = studentMap[hd.student_id];
        const cn = s?.classes?.name || 'Unassigned';
        if (!classMap[cn]) classMap[cn] = { name: cn, allocated: 0, collected: 0, students: new Set(), fullyPaid: 0, partial: 0, unpaid: 0 };
        classMap[cn].allocated += parseFloat(hd.hostel_fee || 0);
        classMap[cn].students.add(hd.student_id);
      });
      // Class-wise collected = cash + discount (effective payment)
      const addToClassCollected = (p) => {
        const s = studentMap[p.student_id];
        const cn = s?.classes?.name || 'Unassigned';
        if (classMap[cn]) classMap[cn].collected += parseFloat(p.amount || 0) + parseFloat(p.discount_amount || 0);
      };
      allPayments.forEach(addToClassCollected);
      allTransportPayments.forEach(addToClassCollected);
      allHostelPayments.forEach(addToClassCollected);
      // Count status per class
      Object.keys(classMap).forEach(cn => {
        classMap[cn].students.forEach(sid => {
          const total = studentTotal[sid] || 0;
          const paid = studentPaid[sid] || 0;
          if (total === 0) return;
          if (paid >= total) classMap[cn].fullyPaid++;
          else if (paid > 0) classMap[cn].partial++;
          else classMap[cn].unpaid++;
        });
        classMap[cn].studentCount = classMap[cn].students.size;
        classMap[cn].due = Math.max(0, classMap[cn].allocated - classMap[cn].collected);
        classMap[cn].rate = classMap[cn].allocated > 0 ? Math.round((classMap[cn].collected / classMap[cn].allocated) * 100) : 0;
      });
      setClassWiseFees(Object.values(classMap).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })));

      // === 6. FEE TYPE BREAKDOWN (includes Transport & Hostel) ===
      const typeMap = {};
      allAllocations.forEach(a => {
        const tn = a.fee_master?.fee_type?.name || 'Other';
        if (!typeMap[tn]) typeMap[tn] = { name: tn, allocated: 0, collected: 0 };
        typeMap[tn].allocated += parseFloat(a.fee_master?.amount || 0);
      });
      // Add Transport Fee as a type
      if (totalTransportAllocated > 0 || allTransportPayments.length > 0) {
        typeMap['🚌 Transport Fee'] = { name: '🚌 Transport Fee', allocated: totalTransportAllocated, collected: totalTransportCollected + transportDiscTotal };
      }
      // Add Hostel Fee as a type
      if (totalHostelAllocated > 0 || allHostelPayments.length > 0) {
        typeMap['🏠 Hostel Fee'] = { name: '🏠 Hostel Fee', allocated: totalHostelAllocated, collected: totalHostelCollected + hostelDiscTotal };
      }
      // Match payments to fee types via fee_master
      const masterToType = {};
      allAllocations.forEach(a => {
        if (a.fee_master_id && a.fee_master?.fee_type?.name) {
          masterToType[a.fee_master_id] = a.fee_master.fee_type.name;
        }
      });
      allPayments.forEach(p => {
        const tn = masterToType[p.fee_master_id] || 'Other';
        if (typeMap[tn]) typeMap[tn].collected += parseFloat(p.amount || 0) + parseFloat(p.discount_amount || 0);
      });
      const typeArr = Object.values(typeMap).map(t => ({
        ...t, due: Math.max(0, t.allocated - t.collected),
        rate: t.allocated > 0 ? Math.round((t.collected / t.allocated) * 100) : 0,
      })).sort((a, b) => b.allocated - a.allocated);
      setFeeTypeBreakdown(typeArr);

      // === 7. PAYMENT MODE SPLIT (all payments combined) ===
      const modeMap = {};
      const addToModeMap = (p) => {
        const mode = p.payment_mode || 'Cash';
        if (!modeMap[mode]) modeMap[mode] = { mode, count: 0, amount: 0 };
        modeMap[mode].count++;
        modeMap[mode].amount += parseFloat(p.amount || 0);
      };
      allPayments.forEach(addToModeMap);
      allTransportPayments.forEach(addToModeMap);
      allHostelPayments.forEach(addToModeMap);
      setPaymentModeSplit(Object.values(modeMap).sort((a, b) => b.amount - a.amount));

      // === 8. MONTHLY COLLECTION (all payments — fill full academic year) ===
      const monthMap = {};
      const addToMonthMap = (p) => {
        const d = new Date(p.payment_date || p.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = format(d, 'MMM yyyy');
        if (!monthMap[key]) monthMap[key] = { key, label, amount: 0, count: 0 };
        monthMap[key].amount += parseFloat(p.amount || 0);
        monthMap[key].count++;
      };
      allPayments.forEach(addToMonthMap);
      allTransportPayments.forEach(addToMonthMap);
      allHostelPayments.forEach(addToMonthMap);
      // Fill empty months across full academic year (Apr to Mar or earliest to current)
      const sessionObj = sessions.find(s => s.id === selectedSessionId);
      const sessionName = sessionObj?.name || '';
      const yearMatch = sessionName.match(/(\d{4})/);
      const startYear = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
      const academicStart = new Date(startYear, 3, 1); // April of start year
      const now = new Date();
      const endMonth = now > new Date(startYear + 1, 2, 1) ? new Date(startYear + 1, 2, 1) : now;
      const allMonths = [];
      const cur = new Date(academicStart);
      while (cur <= endMonth) {
        const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
        const label = format(cur, 'MMM yyyy');
        allMonths.push(monthMap[key] || { key, label, amount: 0, count: 0 });
        cur.setMonth(cur.getMonth() + 1);
      }
      setMonthlyCollection(allMonths);

      // === 9. DAILY COLLECTION (Last 30 days, all payment types) ===
      const last30 = new Date();
      last30.setDate(last30.getDate() - 30);
      const dayMap = {};
      const addToDayMap = (p) => {
        const dt = new Date(p.payment_date || p.created_at);
        if (dt < last30) return;
        const d = format(dt, 'dd MMM');
        if (!dayMap[d]) dayMap[d] = { day: d, amount: 0, count: 0 };
        dayMap[d].amount += parseFloat(p.amount || 0);
        dayMap[d].count++;
      };
      allPayments.forEach(addToDayMap);
      allTransportPayments.forEach(addToDayMap);
      allHostelPayments.forEach(addToDayMap);
      setDailyCollection(Object.values(dayMap));

      // === 10. TOP DEFAULTERS (with full breakdown) ===
      const defaulterList = studentIds
        .map(id => {
          const fb = studentFeeBreakdown[id] || { academic: 0, academicPaid: 0, transport: 0, transportPaid: 0, hostel: 0, hostelPaid: 0, discount: 0, fine: 0 };
          return {
            id, student: studentMap[id],
            total: studentTotal[id] || 0, paid: studentPaid[id] || 0,
            due: Math.max(0, (studentTotal[id] || 0) - (studentPaid[id] || 0)),
            breakdown: fb,
          };
        })
        .filter(d => d.due > 0)
        .sort((a, b) => b.due - a.due)
        .slice(0, 50);
      setTopDefaulters(defaulterList);

    } catch (error) {
      console.error('Fees analytics error:', error);
      toast({ variant: 'destructive', title: 'Error loading fees analytics', description: error.message });
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedSessionId, selectedClass, selectedFeeType, toast]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // === EXPORT ===
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const sessionName = sessions.find(s => s.id === selectedSessionId)?.name || 'Active';
    const orgHeader = buildOrgHeaderHtml(printHeaderData);
    const filterInfo = selectedClass !== 'all' ? ` | <strong>Class:</strong> ${classes.find(c => c.id === selectedClass)?.name || ''}` : '';
    const feeTypeInfo = selectedFeeType !== 'all' ? ` | <strong>Fee Type:</strong> ${feeTypes.find(t => t.id === selectedFeeType)?.name || ''}` : '';
    printWindow.document.write(`
      <html><head><title>Fees Analysis Report - ${selectedBranch?.name || 'School'}</title>
      <style>${PRINT_STYLES}</style></head><body>
      ${orgHeader}
      <h1>💰 Fees Analysis Report</h1>
      <p class="report-meta"><strong>Session:</strong> ${sessionName}${filterInfo}${feeTypeInfo} | <strong>Generated:</strong> ${format(new Date(), 'dd MMM yyyy, hh:mm a')}</p>
      
      <div class="stats-grid">
        <div class="stat-box"><div class="stat-value">₹${overview.totalAllocated.toLocaleString('en-IN')}</div><div class="stat-label">Total Allocated</div></div>
        <div class="stat-box"><div class="stat-value text-green">₹${overview.totalCollected.toLocaleString('en-IN')}</div><div class="stat-label">Collected (Cash+Discount)</div></div>
        <div class="stat-box"><div class="stat-value text-red">₹${overview.totalDue.toLocaleString('en-IN')}</div><div class="stat-label">Due</div></div>
        <div class="stat-box"><div class="stat-value">${overview.collectionRate}%</div><div class="stat-label">Collection Rate</div></div>
      </div>
      ${overview.totalDiscount > 0 || overview.totalFine > 0 ? `<p style="font-size:11px;color:#666;">Discount: <strong class="text-amber">₹${overview.totalDiscount.toLocaleString('en-IN')}</strong> | Fine: <strong class="text-red">₹${overview.totalFine.toLocaleString('en-IN')}</strong> | Cash Collected: <strong class="text-green">₹${(overview.totalCashCollected || 0).toLocaleString('en-IN')}</strong></p>` : ''}

      <h2>Complete Fee Breakdown</h2>
      <table>
        <thead><tr><th>Category</th><th>Allocated</th><th>Collected</th><th>Due</th><th>Rate</th></tr></thead>
        <tbody>
          <tr><td>📚 Academic</td><td>₹${(overview.academicAllocated || 0).toLocaleString('en-IN')}</td><td class="text-green">₹${(overview.academicCollected || 0).toLocaleString('en-IN')}</td><td class="text-red">₹${Math.max(0, (overview.academicAllocated || 0) - (overview.academicCollected || 0)).toLocaleString('en-IN')}</td><td>${(overview.academicAllocated || 0) > 0 ? Math.round(((overview.academicCollected || 0) / (overview.academicAllocated || 1)) * 100) : 0}%</td></tr>
          ${(overview.transportAllocated || 0) > 0 ? `<tr><td>🚌 Transport</td><td>₹${overview.transportAllocated.toLocaleString('en-IN')}</td><td class="text-green">₹${(overview.transportCollected || 0).toLocaleString('en-IN')}</td><td class="text-red">₹${Math.max(0, overview.transportAllocated - (overview.transportCollected || 0)).toLocaleString('en-IN')}</td><td>${Math.round(((overview.transportCollected || 0) / (overview.transportAllocated || 1)) * 100)}%</td></tr>` : ''}
          ${(overview.hostelAllocated || 0) > 0 ? `<tr><td>🏠 Hostel</td><td>₹${overview.hostelAllocated.toLocaleString('en-IN')}</td><td class="text-green">₹${(overview.hostelCollected || 0).toLocaleString('en-IN')}</td><td class="text-red">₹${Math.max(0, overview.hostelAllocated - (overview.hostelCollected || 0)).toLocaleString('en-IN')}</td><td>${Math.round(((overview.hostelCollected || 0) / (overview.hostelAllocated || 1)) * 100)}%</td></tr>` : ''}
          <tr style="font-weight:bold;border-top:2px solid #333;"><td>GRAND TOTAL</td><td>₹${overview.totalAllocated.toLocaleString('en-IN')}</td><td class="text-green">₹${overview.totalCollected.toLocaleString('en-IN')}</td><td class="text-red">₹${overview.totalDue.toLocaleString('en-IN')}</td><td>${overview.collectionRate}%</td></tr>
        </tbody>
      </table>

      <h2>Class-wise Fee Summary</h2>
      <table>
        <thead><tr><th>Class</th><th>Students</th><th>Allocated</th><th>Collected</th><th>Due</th><th>Rate</th><th>Paid</th><th>Partial</th><th>Unpaid</th></tr></thead>
        <tbody>${classWiseFees.map(c => `<tr><td>${c.name}</td><td>${c.studentCount}</td><td>₹${c.allocated.toLocaleString('en-IN')}</td><td class="text-green">₹${c.collected.toLocaleString('en-IN')}</td><td class="text-red">₹${c.due.toLocaleString('en-IN')}</td><td>${c.rate}%</td><td>${c.fullyPaid}</td><td>${c.partial}</td><td>${c.unpaid}</td></tr>`).join('')}
        <tr style="font-weight:bold;border-top:2px solid #333;"><td>TOTAL</td><td>${overview.totalStudents}</td><td>₹${overview.totalAllocated.toLocaleString('en-IN')}</td><td class="text-green">₹${overview.totalCollected.toLocaleString('en-IN')}</td><td class="text-red">₹${overview.totalDue.toLocaleString('en-IN')}</td><td>${overview.collectionRate}%</td><td>${overview.fullyPaid}</td><td>${overview.partialPaid}</td><td>${overview.unpaid}</td></tr></tbody>
      </table>

      <h2>Fee Type Breakdown</h2>
      <table>
        <thead><tr><th>Fee Type</th><th>Allocated</th><th>Collected</th><th>Due</th><th>Rate</th></tr></thead>
        <tbody>${feeTypeBreakdown.map(t => `<tr><td>${t.name}</td><td>₹${t.allocated.toLocaleString('en-IN')}</td><td class="text-green">₹${t.collected.toLocaleString('en-IN')}</td><td class="text-red">₹${t.due.toLocaleString('en-IN')}</td><td>${t.rate}%</td></tr>`).join('')}</tbody>
      </table>

      <h2>Payment Mode Split</h2>
      <table>
        <thead><tr><th>Mode</th><th>Payments</th><th>Amount</th><th>Share</th></tr></thead>
        <tbody>${paymentModeSplit.map(m => `<tr><td>${m.mode}</td><td>${m.count}</td><td>₹${m.amount.toLocaleString('en-IN')}</td><td>${(overview.totalCashCollected || overview.totalCollected) > 0 ? ((m.amount / (overview.totalCashCollected || overview.totalCollected)) * 100).toFixed(1) : 0}%</td></tr>`).join('')}</tbody>
      </table>

      <h2>Fee Defaulters (${topDefaulters.length} students)</h2>
      <table>
        <thead><tr><th>#</th><th>Enroll ID</th><th>Student</th><th>Class</th><th>Father/Guardian</th><th>Mobile</th><th>Academic</th><th>Transport</th><th>Hostel</th><th>Total</th><th>Paid</th><th>Due</th></tr></thead>
        <tbody>${topDefaulters.map((d, i) => {
          const fb = d.breakdown || {};
          return `<tr><td>${i + 1}</td><td>${d.student?.enrollment_id || '-'}</td><td>${d.student?.full_name || '-'}</td><td>${d.student?.classes?.name || '-'}</td><td>${d.student?.father_name || '-'}</td><td>${d.student?.father_phone || d.student?.phone || '-'}</td><td>${fb.academic > 0 ? '₹' + fb.academic.toLocaleString('en-IN') : '-'}</td><td>${fb.transport > 0 ? '₹' + fb.transport.toLocaleString('en-IN') : '-'}</td><td>${fb.hostel > 0 ? '₹' + fb.hostel.toLocaleString('en-IN') : '-'}</td><td>₹${d.total.toLocaleString('en-IN')}</td><td class="text-green">₹${d.paid.toLocaleString('en-IN')}</td><td class="text-red"><strong>₹${d.due.toLocaleString('en-IN')}</strong></td></tr>`;
        }).join('')}</tbody>
      </table>

      <div class="footer">Generated by Jashchar ERP • ${format(new Date(), 'dd MMMM yyyy, hh:mm a')}</div>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  // === DOWNLOAD PDF ===
  const handleDownloadPDF = async () => {
    const sessionName = sessions.find(s => s.id === selectedSessionId)?.name || 'Active';
    const orgHeader = buildOrgHeaderHtml(printHeaderData);
    const filterInfo = selectedClass !== 'all' ? ` | <strong>Class:</strong> ${classes.find(c => c.id === selectedClass)?.name || ''}` : '';
    const feeTypeInfo = selectedFeeType !== 'all' ? ` | <strong>Fee Type:</strong> ${feeTypes.find(t => t.id === selectedFeeType)?.name || ''}` : '';
    const bodyHtml = `
      <h1>💰 Fees Analysis Report</h1>
      <p class="report-meta"><strong>Session:</strong> ${sessionName}${filterInfo}${feeTypeInfo} | <strong>Generated:</strong> ${format(new Date(), 'dd MMM yyyy, hh:mm a')}</p>
      <div class="stats-grid">
        <div class="stat-box"><div class="stat-value">₹${overview.totalAllocated.toLocaleString('en-IN')}</div><div class="stat-label">Total Allocated</div></div>
        <div class="stat-box"><div class="stat-value text-green">₹${overview.totalCollected.toLocaleString('en-IN')}</div><div class="stat-label">Collected (Cash+Discount)</div></div>
        <div class="stat-box"><div class="stat-value text-red">₹${overview.totalDue.toLocaleString('en-IN')}</div><div class="stat-label">Due</div></div>
        <div class="stat-box"><div class="stat-value">${overview.collectionRate}%</div><div class="stat-label">Collection Rate</div></div>
      </div>
      ${overview.totalDiscount > 0 || overview.totalFine > 0 ? `<p style="font-size:11px;color:#666;">Discount: <strong class="text-amber">₹${overview.totalDiscount.toLocaleString('en-IN')}</strong> | Fine: <strong class="text-red">₹${overview.totalFine.toLocaleString('en-IN')}</strong> | Cash Collected: <strong class="text-green">₹${(overview.totalCashCollected || 0).toLocaleString('en-IN')}</strong></p>` : ''}
      <h2>Complete Fee Breakdown</h2>
      <table><thead><tr><th>Category</th><th>Allocated</th><th>Collected</th><th>Due</th><th>Rate</th></tr></thead>
        <tbody>
          <tr><td>📚 Academic</td><td>₹${(overview.academicAllocated || 0).toLocaleString('en-IN')}</td><td class="text-green">₹${(overview.academicCollected || 0).toLocaleString('en-IN')}</td><td class="text-red">₹${Math.max(0, (overview.academicAllocated || 0) - (overview.academicCollected || 0)).toLocaleString('en-IN')}</td><td>${(overview.academicAllocated || 0) > 0 ? Math.round(((overview.academicCollected || 0) / (overview.academicAllocated || 1)) * 100) : 0}%</td></tr>
          ${(overview.transportAllocated || 0) > 0 ? `<tr><td>🚌 Transport</td><td>₹${overview.transportAllocated.toLocaleString('en-IN')}</td><td class="text-green">₹${(overview.transportCollected || 0).toLocaleString('en-IN')}</td><td class="text-red">₹${Math.max(0, overview.transportAllocated - (overview.transportCollected || 0)).toLocaleString('en-IN')}</td><td>${Math.round(((overview.transportCollected || 0) / (overview.transportAllocated || 1)) * 100)}%</td></tr>` : ''}
          ${(overview.hostelAllocated || 0) > 0 ? `<tr><td>🏠 Hostel</td><td>₹${overview.hostelAllocated.toLocaleString('en-IN')}</td><td class="text-green">₹${(overview.hostelCollected || 0).toLocaleString('en-IN')}</td><td class="text-red">₹${Math.max(0, overview.hostelAllocated - (overview.hostelCollected || 0)).toLocaleString('en-IN')}</td><td>${Math.round(((overview.hostelCollected || 0) / (overview.hostelAllocated || 1)) * 100)}%</td></tr>` : ''}
          <tr style="font-weight:bold;border-top:2px solid #333;"><td>GRAND TOTAL</td><td>₹${overview.totalAllocated.toLocaleString('en-IN')}</td><td class="text-green">₹${overview.totalCollected.toLocaleString('en-IN')}</td><td class="text-red">₹${overview.totalDue.toLocaleString('en-IN')}</td><td>${overview.collectionRate}%</td></tr>
        </tbody></table>
      <h2>Class-wise Fee Summary</h2>
      <table><thead><tr><th>Class</th><th>Students</th><th>Allocated</th><th>Collected</th><th>Due</th><th>Rate</th><th>Paid</th><th>Partial</th><th>Unpaid</th></tr></thead>
        <tbody>${classWiseFees.map(c => `<tr><td>${c.name}</td><td>${c.studentCount}</td><td>₹${c.allocated.toLocaleString('en-IN')}</td><td class="text-green">₹${c.collected.toLocaleString('en-IN')}</td><td class="text-red">₹${c.due.toLocaleString('en-IN')}</td><td>${c.rate}%</td><td>${c.fullyPaid}</td><td>${c.partial}</td><td>${c.unpaid}</td></tr>`).join('')}
        <tr style="font-weight:bold;border-top:2px solid #333;"><td>TOTAL</td><td>${overview.totalStudents}</td><td>₹${overview.totalAllocated.toLocaleString('en-IN')}</td><td class="text-green">₹${overview.totalCollected.toLocaleString('en-IN')}</td><td class="text-red">₹${overview.totalDue.toLocaleString('en-IN')}</td><td>${overview.collectionRate}%</td><td>${overview.fullyPaid}</td><td>${overview.partialPaid}</td><td>${overview.unpaid}</td></tr></tbody></table>
      <h2>Fee Defaulters (${topDefaulters.length} students)</h2>
      <table><thead><tr><th>#</th><th>Enroll ID</th><th>Student</th><th>Class</th><th>Father</th><th>Mobile</th><th>Total</th><th>Paid</th><th>Due</th></tr></thead>
        <tbody>${topDefaulters.map((d, i) => `<tr><td>${i + 1}</td><td>${d.student?.enrollment_id || '-'}</td><td>${d.student?.full_name || '-'}</td><td>${d.student?.classes?.name || '-'}</td><td>${d.student?.father_name || '-'}</td><td>${d.student?.father_phone || d.student?.phone || '-'}</td><td>₹${d.total.toLocaleString('en-IN')}</td><td class="text-green">₹${d.paid.toLocaleString('en-IN')}</td><td class="text-red"><strong>₹${d.due.toLocaleString('en-IN')}</strong></td></tr>`).join('')}</tbody></table>
      <div class="footer">Generated by Jashchar ERP • ${format(new Date(), 'dd MMMM yyyy, hh:mm a')}</div>`;
    await downloadReportAsPDF({
      title: `Fees Analysis Report - ${selectedBranch?.name || 'School'}`,
      orgHeader,
      bodyHtml,
      fileName: `Fees_Analysis_${selectedBranch?.name || 'School'}_${format(new Date(), 'yyyy-MM-dd')}`,
    });
  };

  const handleExportExcel = () => {
    // Export class-wise + defaulters to CSV
    const headers = ['Class', 'Students', 'Allocated', 'Collected', 'Due', 'Collection Rate %', 'Fully Paid', 'Partial', 'Unpaid'];
    const rows = classWiseFees.map(c => [c.name, c.studentCount, c.allocated, c.collected, c.due, c.rate, c.fullyPaid, c.partial, c.unpaid]);
    rows.push(['TOTAL', overview.totalStudents, overview.totalAllocated, overview.totalCollected, overview.totalDue, overview.collectionRate, overview.fullyPaid, overview.partialPaid, overview.unpaid]);
    
    let csv = headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
    csv += '\n\n\nTop Defaulters\nEnroll ID,Student,Class,Father/Guardian,Mobile,Academic Fee,Transport Fee,Hostel Fee,Total Fee,Paid,Due,Discount,Fine\n';
    csv += topDefaulters.map(d => {
      const fb = d.breakdown || {};
      return `${d.student?.enrollment_id || ''},${d.student?.full_name || ''},${d.student?.classes?.name || ''},${d.student?.father_name || ''},${d.student?.father_phone || d.student?.phone || ''},${fb.academic || 0},${fb.transport || 0},${fb.hostel || 0},${d.total},${d.paid},${d.due},${fb.discount || 0},${fb.fine || 0}`;
    }).join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Fees_Analysis_${selectedBranch?.name || 'School'}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast({ title: 'Export successful', description: 'Fees analysis exported to CSV' });
  };

  const maxMonthly = Math.max(...monthlyCollection.map(m => m.amount), 1);

  return (
    <DashboardLayout>
      <div ref={printRef}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <IndianRupee className="h-7 w-7 text-green-600" />
              Fees Analysis
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Comprehensive fee collection analytics & insights</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-1" /> Download PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <Sheet className="h-4 w-4 mr-1" /> Export Excel
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1 min-w-[180px]">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Filter className="h-3 w-3" /> Class</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="All Classes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 min-w-[180px]">
                <label className="text-xs font-medium text-muted-foreground">Fee Type</label>
                <Select value={selectedFeeType} onValueChange={setSelectedFeeType}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="All Fee Types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fee Types</SelectItem>
                    {feeTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 min-w-[200px]">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Session</label>
                <Select value={selectedSessionId || ''} onValueChange={setSelectedSessionId}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select Session" /></SelectTrigger>
                  <SelectContent>
                    {sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}{s.is_active ? ' ✦' : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading fees analytics...</span>
          </div>
        ) : (
          <>
            {/* ═══ KEY METRICS ═══ */}
            <div className={`grid grid-cols-2 ${overview.totalRefunded > 0 ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-4 mb-6`}>
              <StatCard title="Total Allocated" value={`₹${overview.totalAllocated.toLocaleString('en-IN')}`} icon={CreditCard} color="text-blue-600" bgColor="bg-blue-100 dark:bg-blue-900/30" subtitle={`${overview.totalStudents} students`} />
              <StatCard title="Collected (Cash+Disc)" value={`₹${overview.totalCollected.toLocaleString('en-IN')}`} icon={CheckCircle2} color="text-green-600" bgColor="bg-green-100 dark:bg-green-900/30" subtitle={`Cash: ₹${(overview.totalCashCollected || 0).toLocaleString('en-IN')}`} />
              {overview.totalRefunded > 0 && (
                <StatCard title="Total Refunded" value={`₹${overview.totalRefunded.toLocaleString('en-IN')}`} icon={Undo2} color="text-amber-600" bgColor="bg-amber-100 dark:bg-amber-900/30" subtitle="Approved refunds" />
              )}
              <StatCard title="Due Balance" value={`₹${overview.totalDue.toLocaleString('en-IN')}`} icon={AlertCircle} color="text-red-600" bgColor="bg-red-100 dark:bg-red-900/30" subtitle={`${overview.unpaid + overview.partialPaid} students`} />
              <StatCard title="Collection Rate" value={`${overview.collectionRate}%`} icon={TrendingUp} color={overview.collectionRate >= 80 ? 'text-green-600' : overview.collectionRate >= 50 ? 'text-amber-600' : 'text-red-600'} bgColor={overview.collectionRate >= 80 ? 'bg-green-100 dark:bg-green-900/30' : overview.collectionRate >= 50 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30'} />
            </div>

            {/* Student Payment Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card className="border-green-200 dark:border-green-800">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30"><CheckCircle2 className="h-6 w-6 text-green-600" /></div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{overview.fullyPaid}</p>
                    <p className="text-xs text-muted-foreground">Fully Paid</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-amber-200 dark:border-amber-800">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30"><Clock className="h-6 w-6 text-amber-600" /></div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{overview.partialPaid}</p>
                    <p className="text-xs text-muted-foreground">Partial Payment</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-red-200 dark:border-red-800">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30"><AlertCircle className="h-6 w-6 text-red-600" /></div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{overview.unpaid}</p>
                    <p className="text-xs text-muted-foreground">Unpaid</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ═══ FEE CATEGORY BREAKDOWN (Academic + Transport + Hostel + Discount + Fine) ═══ */}
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Wallet className="h-5 w-5 text-indigo-500" /> Complete Fee Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left font-semibold">Fee Category</th>
                        <th className="p-3 text-right font-semibold">Allocated</th>
                        <th className="p-3 text-right font-semibold">Collected</th>
                        <th className="p-3 text-right font-semibold">Due</th>
                        <th className="p-3 text-center font-semibold">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-muted/30">
                        <td className="p-3 font-medium">📚 Academic Fee</td>
                        <td className="p-3 text-right">₹{(overview.academicAllocated || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right text-green-600">₹{(overview.academicCollected || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right text-red-600">₹{Math.max(0, (overview.academicAllocated || 0) - (overview.academicCollected || 0)).toLocaleString('en-IN')}</td>
                        <td className="p-3 text-center"><Badge variant={(overview.academicAllocated || 0) > 0 && ((overview.academicCollected || 0) / (overview.academicAllocated || 1) * 100) >= 80 ? 'default' : 'destructive'} className="text-xs">{(overview.academicAllocated || 0) > 0 ? Math.round(((overview.academicCollected || 0) / (overview.academicAllocated || 1)) * 100) : 0}%</Badge></td>
                      </tr>
                      {(overview.transportAllocated || 0) > 0 && (
                        <tr className="border-b hover:bg-muted/30">
                          <td className="p-3 font-medium">🚌 Transport Fee</td>
                          <td className="p-3 text-right">₹{(overview.transportAllocated || 0).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right text-green-600">₹{(overview.transportCollected || 0).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right text-red-600">₹{Math.max(0, (overview.transportAllocated || 0) - (overview.transportCollected || 0)).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-center"><Badge variant={(overview.transportCollected || 0) / (overview.transportAllocated || 1) * 100 >= 80 ? 'default' : 'destructive'} className="text-xs">{Math.round(((overview.transportCollected || 0) / (overview.transportAllocated || 1)) * 100)}%</Badge></td>
                        </tr>
                      )}
                      {(overview.hostelAllocated || 0) > 0 && (
                        <tr className="border-b hover:bg-muted/30">
                          <td className="p-3 font-medium">🏠 Hostel Fee</td>
                          <td className="p-3 text-right">₹{(overview.hostelAllocated || 0).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right text-green-600">₹{(overview.hostelCollected || 0).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right text-red-600">₹{Math.max(0, (overview.hostelAllocated || 0) - (overview.hostelCollected || 0)).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-center"><Badge variant={(overview.hostelCollected || 0) / (overview.hostelAllocated || 1) * 100 >= 80 ? 'default' : 'destructive'} className="text-xs">{Math.round(((overview.hostelCollected || 0) / (overview.hostelAllocated || 1)) * 100)}%</Badge></td>
                        </tr>
                      )}
                      <tr className="border-t-2 font-bold bg-muted/50">
                        <td className="p-3">GRAND TOTAL</td>
                        <td className="p-3 text-right">₹{overview.totalAllocated.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right text-green-600">₹{overview.totalCollected.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right text-red-600">₹{overview.totalDue.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-center"><Badge>{overview.collectionRate}%</Badge></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* Discount & Fine Summary */}
                {(overview.totalDiscount > 0 || overview.totalFine > 0) && (
                  <div className="mt-3 pt-3 border-t flex gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Total Discount Given:</span>
                      <span className="text-sm font-bold text-amber-600">₹{overview.totalDiscount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Total Fine Collected:</span>
                      <span className="text-sm font-bold text-red-600">₹{overview.totalFine.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Overall Progress */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Collection Progress</span>
                  <span className="text-sm font-bold">{overview.collectionRate}%</span>
                </div>
                <Progress value={overview.collectionRate} className="h-4" />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>₹0</span>
                  <span>₹{overview.totalAllocated.toLocaleString('en-IN')}</span>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* ═══ FEE TYPE BREAKDOWN ═══ */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><PieChart className="h-5 w-5 text-violet-500" /> Fee Type Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {feeTypeBreakdown.map((t, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{t.name}</span>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-green-600">₹{t.collected.toLocaleString('en-IN')}</span>
                            <span className="text-muted-foreground">/</span>
                            <span>₹{t.allocated.toLocaleString('en-IN')}</span>
                            <Badge variant={t.rate >= 80 ? 'default' : t.rate >= 50 ? 'secondary' : 'destructive'} className="text-[10px] px-1.5">{t.rate}%</Badge>
                          </div>
                        </div>
                        <Progress value={t.rate} className="h-2" />
                      </div>
                    ))}
                    {feeTypeBreakdown.length === 0 && <p className="text-center text-muted-foreground py-4">No fee type data</p>}
                  </div>
                </CardContent>
              </Card>

              {/* ═══ PAYMENT MODE SPLIT ═══ */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Wallet className="h-5 w-5 text-blue-500" /> Payment Mode Split</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {paymentModeSplit.map((m, i) => {
                      const share = (overview.totalCashCollected || overview.totalCollected) > 0 ? ((m.amount / (overview.totalCashCollected || overview.totalCollected)) * 100).toFixed(1) : 0;
                      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500'];
                      return (
                        <div key={i} className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`} />
                          <div className="flex-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{m.mode}</span>
                              <span className="text-muted-foreground">{m.count} txns</span>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>₹{m.amount.toLocaleString('en-IN')}</span>
                              <span>{share}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {paymentModeSplit.length === 0 && <p className="text-center text-muted-foreground py-4">No payment data</p>}
                  </div>

                  {overview.totalDiscount > 0 || overview.totalFine > 0 ? (
                    <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Total Discount</p>
                        <p className="font-bold text-amber-600">₹{overview.totalDiscount.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Total Fine</p>
                        <p className="font-bold text-red-600">₹{overview.totalFine.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            {/* ═══ MONTHLY COLLECTION CHART ═══ */}
            {monthlyCollection.length > 0 && (
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-5 w-5 text-indigo-500" /> Monthly Collection Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2 h-48 overflow-x-auto pb-2">
                    {monthlyCollection.map((m, i) => {
                      const height = (m.amount / maxMonthly) * 100;
                      return (
                        <div key={i} className="flex flex-col items-center gap-1 min-w-[60px]">
                          <span className="text-[10px] font-bold">₹{m.amount >= 100000 ? `${(m.amount / 100000).toFixed(1)}L` : m.amount >= 1000 ? `${(m.amount / 1000).toFixed(0)}K` : m.amount}</span>
                          <div className="w-10 bg-gradient-to-t from-green-600 to-green-400 rounded-t transition-all" style={{ height: `${Math.max(height, 4)}%` }} />
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{m.label}</span>
                          <span className="text-[9px] text-muted-foreground">{m.count} txns</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ═══ CLASS-WISE FEE TABLE ═══ */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-5 w-5 text-blue-500" /> Class-wise Fee Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left font-semibold">#</th>
                        <th className="p-3 text-left font-semibold">Class</th>
                        <th className="p-3 text-center font-semibold">Students</th>
                        <th className="p-3 text-right font-semibold">Allocated</th>
                        <th className="p-3 text-right font-semibold">Collected</th>
                        <th className="p-3 text-right font-semibold">Due</th>
                        <th className="p-3 text-center font-semibold">Rate</th>
                        <th className="p-3 text-center font-semibold">Paid</th>
                        <th className="p-3 text-center font-semibold">Partial</th>
                        <th className="p-3 text-center font-semibold">Unpaid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classWiseFees.map((c, i) => (
                        <tr key={i} className="border-b hover:bg-muted/30">
                          <td className="p-3 text-muted-foreground">{i + 1}</td>
                          <td className="p-3 font-medium">{c.name}</td>
                          <td className="p-3 text-center">{c.studentCount}</td>
                          <td className="p-3 text-right">₹{c.allocated.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right text-green-600 font-medium">₹{c.collected.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right text-red-600 font-medium">₹{c.due.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-center">
                            <Badge variant={c.rate >= 80 ? 'default' : c.rate >= 50 ? 'secondary' : 'destructive'} className="text-xs">{c.rate}%</Badge>
                          </td>
                          <td className="p-3 text-center text-green-600">{c.fullyPaid}</td>
                          <td className="p-3 text-center text-amber-600">{c.partial}</td>
                          <td className="p-3 text-center text-red-600">{c.unpaid}</td>
                        </tr>
                      ))}
                      {classWiseFees.length > 0 && (
                        <tr className="border-t-2 font-bold bg-muted/50">
                          <td className="p-3" colSpan={2}>TOTAL</td>
                          <td className="p-3 text-center">{overview.totalStudents}</td>
                          <td className="p-3 text-right">₹{overview.totalAllocated.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right text-green-600">₹{overview.totalCollected.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right text-red-600">₹{overview.totalDue.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-center"><Badge>{overview.collectionRate}%</Badge></td>
                          <td className="p-3 text-center text-green-600">{overview.fullyPaid}</td>
                          <td className="p-3 text-center text-amber-600">{overview.partialPaid}</td>
                          <td className="p-3 text-center text-red-600">{overview.unpaid}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* ═══ TOP DEFAULTERS (Enhanced with Phone + Fee Breakdown) ═══ */}
            {topDefaulters.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><AlertCircle className="h-5 w-5 text-red-500" /> Fee Defaulters ({topDefaulters.length} students)</CardTitle>
                  <CardDescription>Students with outstanding balance — includes Academic, Transport & Hostel fees</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-red-50 dark:bg-red-950/20">
                          <th className="p-2 text-left font-semibold">#</th>
                          <th className="p-2 text-left font-semibold">Enroll ID</th>
                          <th className="p-2 text-left font-semibold">Student Name</th>
                          <th className="p-2 text-left font-semibold">Class</th>
                          <th className="p-2 text-left font-semibold">Father/Guardian</th>
                          <th className="p-2 text-left font-semibold">📱 Mobile</th>
                          <th className="p-2 text-right font-semibold">Academic</th>
                          <th className="p-2 text-right font-semibold">Transport</th>
                          <th className="p-2 text-right font-semibold">Hostel</th>
                          <th className="p-2 text-right font-semibold">Total Fee</th>
                          <th className="p-2 text-right font-semibold">Paid</th>
                          <th className="p-2 text-right font-semibold">Due</th>
                          <th className="p-2 text-center font-semibold">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topDefaulters.map((d, i) => {
                          const paidPct = d.total > 0 ? Math.round((d.paid / d.total) * 100) : 0;
                          const fb = d.breakdown || {};
                          const contactPhone = d.student?.father_phone || d.student?.phone || d.student?.guardian_phone || '';
                          return (
                            <tr key={d.id} className="border-b hover:bg-muted/30">
                              <td className="p-2 text-muted-foreground">{i + 1}</td>
                              <td className="p-2 text-xs font-mono">{d.student?.enrollment_id || '-'}</td>
                              <td className="p-2 font-medium">{d.student?.full_name || '-'}</td>
                              <td className="p-2 text-xs">{d.student?.classes?.name || '-'}</td>
                              <td className="p-2 text-xs">{d.student?.father_name || d.student?.guardian_name || '-'}</td>
                              <td className="p-2 text-xs">
                                {contactPhone ? (
                                  <a href={`tel:${contactPhone}`} className="text-blue-500 hover:underline font-medium">{contactPhone}</a>
                                ) : '-'}
                              </td>
                              <td className="p-2 text-right text-xs">{fb.academic > 0 ? `₹${fb.academic.toLocaleString('en-IN')}` : '-'}</td>
                              <td className="p-2 text-right text-xs">{fb.transport > 0 ? `₹${fb.transport.toLocaleString('en-IN')}` : '-'}</td>
                              <td className="p-2 text-right text-xs">{fb.hostel > 0 ? `₹${fb.hostel.toLocaleString('en-IN')}` : '-'}</td>
                              <td className="p-2 text-right font-medium">₹{d.total.toLocaleString('en-IN')}</td>
                              <td className="p-2 text-right text-green-600">₹{d.paid.toLocaleString('en-IN')}</td>
                              <td className="p-2 text-right text-red-600 font-bold">₹{d.due.toLocaleString('en-IN')}</td>
                              <td className="p-2 text-center">
                                <Badge variant={paidPct >= 80 ? 'secondary' : 'destructive'} className="text-[10px]">{paidPct}%</Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FeesAnalysis;
