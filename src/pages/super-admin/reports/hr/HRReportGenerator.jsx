/**
 * Human Resource Report Generator
 * Module 5: 40 HR Report Templates
 * Categories: Employee Data, Attendance & Leave, Payroll Reports, Other HR Reports
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { supabase } from '@/lib/customSupabaseClient';
import {
  ReportGeneratorLayout,
  TemplateSidebar,
  FilterPanel,
  ColumnSelector,
  GroupSortPanel,
  LivePreviewTable,
  ExportButtons,
  SaveTemplateModal,
  ScheduleReportModal,
  useReportState,
  useFetchReport,
  useReportExport,
  useGroupedData,
  useFilterOptions,
  REPORT_MODULES
} from '../ReportGeneratorShared';
import { HR_TEMPLATES, HR_CATEGORIES, getPopularTemplates } from './templates';
import { HR_COLUMNS, COLUMN_SETS, getColumns } from './columns';
import { fetchHRDataFromSupabase } from '../ReportGeneratorShared/reportQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  Users, 
  Clock, 
  IndianRupee, 
  Filter, 
  RefreshCw,
  BarChart3,
  FileText,
  Calendar,
  UserCheck,
  UserX,
  TrendingUp
} from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';

const HRReportGenerator = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  
  // Module configuration
  const moduleConfig = REPORT_MODULES['human-resource'];
  const moduleColor = moduleConfig?.color || 'cyan';

  // Master data for filters (from shared hook)
  const { classes, sections, sessions } = useFilterOptions();
  
  // Report state management
  const {
    showSidebar, setShowSidebar,
    selectedTemplate, setSelectedTemplate,
    selectedColumns, setSelectedColumns,
    filters, setFilters,
    groupBy, setGroupBy,
    sortBy, setSortBy,
    isLoading, setIsLoading,
    data, setData,
    error, setError,
    savedTemplates, setSavedTemplates,
    showSaveModal, setShowSaveModal,
    showScheduleModal, setShowScheduleModal,
    resetState
  } = useReportState({
    defaultColumns: COLUMN_SETS.employee_master_list  // Store as keys (strings), not objects
  });

  // Convert selected column keys to full column objects for table/export
  const selectedColumnsObjects = useMemo(() => {
    return selectedColumns
      .map(key => HR_COLUMNS.find(c => c.key === key))
      .filter(Boolean);
  }, [selectedColumns]);

  // Templates for sidebar
  const allTemplates = useMemo(() => HR_TEMPLATES, []);

  // Handle template selection - receives full template object from TemplateSidebar
  const handleTemplateSelect = useCallback((template) => {
    if (template) {
      setSelectedTemplate(template);
      setSelectedColumns(template.columns.map(c => c.key));
      setFilters(template.defaultFilters || {});
      setGroupBy(template.defaultGroupBy || []);
      setSortBy(template.defaultSortBy || []);
    }
  }, [setSelectedTemplate, setSelectedColumns, setFilters, setGroupBy, setSortBy]);

  // Fetch data directly from Supabase (no backend required)
  const fetchData = useCallback(async () => {
    if (!selectedBranch?.id || !currentSessionId || !organizationId) {
      setError('Please select branch and session');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const hrData = await fetchHRDataFromSupabase({
        branchId: selectedBranch.id,
        organizationId,
        sessionId: currentSessionId,
        departmentId: filters.department_id,
        designationId: filters.designation_id,
        status: filters.status,
        employeeType: filters.employee_type
      });

      setData(hrData);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranch, currentSessionId, organizationId, filters, setIsLoading, setError, setData]);

  // Generate sample data based on template category
  const generateSampleData = () => {
    const category = selectedTemplate?.category || 'employee_data';
    
    if (category === 'employee_data') {
      return generateEmployeeData();
    } else if (category === 'attendance_leave') {
      return generateAttendanceLeaveData();
    } else if (category === 'payroll') {
      return generatePayrollData();
    } else {
      return generateOtherHRData();
    }
  };

  // Employee Data sample data
  const generateEmployeeData = () => {
    const departments = ['Primary', 'Secondary', 'Higher Secondary', 'Administration', 'Sports', 'Library'];
    const designations = ['Teacher', 'Senior Teacher', 'HOD', 'Principal', 'Admin Officer', 'Clerk', 'Librarian', 'Coach'];
    const staffTypes = ['Teaching', 'Non-Teaching', 'Administrative'];
    const qualifications = ['B.Ed', 'M.Ed', 'M.A.', 'M.Sc.', 'Ph.D', 'B.Com', 'M.Com'];
    const genders = ['Male', 'Female'];
    const statuses = ['Active', 'On Leave', 'Resigned'];
    const subjects = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer', 'Physical Education'];
    const banks = ['SBI', 'HDFC', 'ICICI', 'Axis', 'PNB', 'Canara'];
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      employee_id: `EMP${String(1001 + i).padStart(5, '0')}`,
      employee_code: `JE${String(1001 + i).padStart(4, '0')}`,
      employee_name: [
        'Rajesh Kumar', 'Priya Sharma', 'Amit Verma', 'Sunita Patel', 'Mukesh Singh',
        'Anita Gupta', 'Ramesh Yadav', 'Kavita Reddy', 'Suresh Nair', 'Deepa Joshi'
      ][i % 10],
      gender: genders[i % 2],
      date_of_birth: `19${70 + (i % 25)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      age: 30 + (i % 30),
      blood_group: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-'][i % 6],
      phone: `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      mobile: `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      email: `employee${i + 1}@school.edu.in`,
      current_address: `${100 + i}, Sector ${(i % 50) + 1}, City ${(i % 5) + 1}`,
      permanent_address: `Village ${i + 1}, District ${(i % 10) + 1}`,
      city: ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad'][i % 5],
      state: ['Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu', 'Telangana'][i % 5],
      pincode: `5${String(60000 + i).padStart(5, '0')}`,
      emergency_contact: `97${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      emergency_contact_name: ['Spouse', 'Father', 'Mother', 'Brother', 'Sister'][i % 5],
      department: departments[i % 6],
      designation: designations[i % 8],
      staff_type: staffTypes[i % 3],
      employee_type: ['Permanent', 'Contract', 'Probation'][i % 3],
      joining_date: `20${String(15 + (i % 10)).padStart(2, '0')}-${String((i % 12) + 1).padStart(2, '0')}-01`,
      service_years: i % 10 + 1,
      experience_years: i % 15 + 2,
      employment_status: statuses[i % 3],
      reporting_to: ['Principal', 'HOD', 'Admin Head'][i % 3],
      is_teaching_staff: i % 3 === 0 || i % 3 === 1,
      subject_specialization: subjects[i % 7],
      subjects_assigned: `${subjects[i % 7]}, ${subjects[(i + 1) % 7]}`,
      classes_assigned: `${['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'][(i % 3) * 3]}-${['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'][(i % 3) * 3 + 2]}`,
      class_teacher_of: i % 5 === 0 ? `${['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'][i % 10]} ${['A', 'B', 'C'][i % 3]}` : null,
      highest_qualification: qualifications[i % 7],
      degree: qualifications[i % 7],
      university: ['BU', 'MU', 'DU', 'AU', 'JNTU'][i % 5],
      passing_year: String(2000 + (i % 20)),
      aadhaar_number: `${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
      pan_number: `ABCDE${String(1000 + i).padStart(4, '0')}F`,
      pf_number: `KA/BLR/${String(10000 + i).padStart(7, '0')}`,
      uan_number: `1001${String(10000000 + i).padStart(8, '0')}`,
      esi_number: i % 2 === 0 ? `51${String(10000000 + i).padStart(10, '0')}` : null,
      bank_name: banks[i % 6],
      bank_account_no: `${String(Math.floor(10000000000 + Math.random() * 90000000000))}`,
      ifsc_code: `${banks[i % 6].substring(0, 4)}0001234`,
      bank_branch: `${['Bangalore', 'Mumbai', 'Delhi'][i % 3]} Main`,
      basic_salary: 25000 + (i * 1000) + (i % 10) * 500,
      gross_salary: 35000 + (i * 1500) + (i % 10) * 500,
      net_salary: 30000 + (i * 1200) + (i % 10) * 400,
    }));
  };

  // Attendance & Leave sample data
  const generateAttendanceLeaveData = () => {
    const departments = ['Primary', 'Secondary', 'Higher Secondary', 'Administration', 'Sports', 'Library'];
    const designations = ['Teacher', 'Senior Teacher', 'HOD', 'Admin Officer', 'Clerk'];
    const leaveTypes = ['CL', 'SL', 'EL', 'ML', 'Comp Off', 'LOP'];
    const leaveStatuses = ['Approved', 'Pending', 'Rejected'];
    const attendanceStatuses = ['Present', 'Absent', 'Half Day', 'On Leave', 'Late'];
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      employee_id: `EMP${String(1001 + i).padStart(5, '0')}`,
      employee_name: [
        'Rajesh Kumar', 'Priya Sharma', 'Amit Verma', 'Sunita Patel', 'Mukesh Singh',
        'Anita Gupta', 'Ramesh Yadav', 'Kavita Reddy', 'Suresh Nair', 'Deepa Joshi'
      ][i % 10],
      department: departments[i % 6],
      designation: designations[i % 5],
      attendance_date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      month: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][i % 12],
      year: '2024',
      in_time: `0${8 + (i % 2)}:${String((i * 5) % 60).padStart(2, '0')}`,
      out_time: `${17 + (i % 2)}:${String((i * 7) % 60).padStart(2, '0')}`,
      work_hours: `${8 + (i % 2)}:${String((i * 3) % 60).padStart(2, '0')}`,
      overtime_hours: i % 5 === 0 ? 1 + (i % 3) : 0,
      attendance_status: attendanceStatuses[i % 5],
      present_days: 20 + (i % 6),
      absent_days: i % 4,
      half_days: i % 3,
      late_days: i % 5,
      early_leave_days: i % 4,
      working_days: 26,
      payable_days: 24 + (i % 4),
      holidays: 4,
      weekoffs: 4,
      attendance_percentage: 85 + (i % 15),
      leave_type: leaveTypes[i % 6],
      leave_from: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 15) + 1).padStart(2, '0')}`,
      leave_to: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 15) + 3).padStart(2, '0')}`,
      leave_days: 1 + (i % 5),
      leave_reason: ['Personal', 'Medical', 'Family Emergency', 'Training', 'Vacation'][i % 5],
      leave_status: leaveStatuses[i % 3],
      approved_by: ['Principal', 'HOD', 'Admin Head'][i % 3],
      cl_balance: 12 - (i % 5),
      sl_balance: 12 - (i % 4),
      el_balance: 15 - (i % 6),
      ml_balance: i % 2 === 0 ? 30 : 0,
      comp_off_balance: i % 3,
      total_leave_balance: 30 + (i % 10),
      cl_taken: i % 5,
      sl_taken: i % 4,
      el_taken: i % 6,
      lop_days: i % 2,
      leave_application_date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 10) + 1).padStart(2, '0')}`,
    }));
  };

  // Payroll sample data
  const generatePayrollData = () => {
    const departments = ['Primary', 'Secondary', 'Higher Secondary', 'Administration', 'Sports', 'Library'];
    const designations = ['Teacher', 'Senior Teacher', 'HOD', 'Principal', 'Admin Officer', 'Clerk'];
    const banks = ['SBI', 'HDFC', 'ICICI', 'Axis', 'PNB', 'Canara'];
    const loanTypes = ['Personal Loan', 'Home Loan', 'Vehicle Loan', 'Emergency Loan'];
    const states = ['Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu', 'Telangana'];
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      employee_id: `EMP${String(1001 + i).padStart(5, '0')}`,
      employee_name: [
        'Rajesh Kumar', 'Priya Sharma', 'Amit Verma', 'Sunita Patel', 'Mukesh Singh',
        'Anita Gupta', 'Ramesh Yadav', 'Kavita Reddy', 'Suresh Nair', 'Deepa Joshi'
      ][i % 10],
      department: departments[i % 6],
      designation: designations[i % 6],
      salary_month: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][i % 12],
      salary_year: '2024',
      payslip_no: `PS${2024}${String(i + 1).padStart(5, '0')}`,
      payslip_date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String(Math.min((i % 28) + 1, 28)).padStart(2, '0')}`,
      basic_salary: 25000 + (i * 1000) + (i % 10) * 500,
      da: Math.round((25000 + (i * 1000)) * 0.1),
      hra: Math.round((25000 + (i * 1000)) * 0.15),
      conveyance: 1600,
      medical_allowance: 1250,
      special_allowance: 3000 + (i % 5) * 500,
      lta: 2000,
      other_allowances: 1000 + (i % 3) * 500,
      total_earnings: 38000 + (i * 1200),
      gross_salary: 38000 + (i * 1200),
      pf_number: `KA/BLR/${String(10000 + i).padStart(7, '0')}`,
      uan_number: `1001${String(10000000 + i).padStart(8, '0')}`,
      employee_pf: Math.round((25000 + (i * 1000)) * 0.12),
      employer_pf: Math.round((25000 + (i * 1000)) * 0.12),
      pf_deduction: Math.round((25000 + (i * 1000)) * 0.12),
      esi_number: i % 3 === 0 ? `51${String(10000000 + i).padStart(10, '0')}` : null,
      employee_esi: i % 3 === 0 ? Math.round((38000 + (i * 1200)) * 0.0075) : 0,
      employer_esi: i % 3 === 0 ? Math.round((38000 + (i * 1200)) * 0.0325) : 0,
      esi_deduction: i % 3 === 0 ? Math.round((38000 + (i * 1200)) * 0.0075) : 0,
      professional_tax: 200,
      pan_number: `ABCDE${String(1000 + i).padStart(4, '0')}F`,
      tds_deduction: i % 4 === 0 ? Math.round((38000 + (i * 1200)) * 12 * 0.05) / 12 : 0,
      loan_recovery: i % 5 === 0 ? 5000 : 0,
      advance_recovery: i % 7 === 0 ? 2000 : 0,
      other_deductions: 0,
      total_deductions: 5000 + (i % 3) * 1000,
      lop_deduction: 0,
      net_salary: 33000 + (i * 1000),
      ctc: 45000 + (i * 1500),
      bank_name: banks[i % 6],
      bank_account_no: `${String(Math.floor(10000000000 + Math.random() * 90000000000))}`,
      ifsc_code: `${banks[i % 6].substring(0, 4)}0001234`,
      payment_date: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String(Math.min((i % 5) + 1, 5)).padStart(2, '0')}`,
      payment_status: ['Paid', 'Pending', 'Processing'][i % 3 === 0 ? 0 : i % 10 === 0 ? 1 : 0],
      payable_days: 26 - (i % 3),
      working_days: 26,
      loan_type: i % 5 === 0 ? loanTypes[i % 4] : null,
      loan_amount: i % 5 === 0 ? 100000 + (i * 10000) : 0,
      loan_balance: i % 5 === 0 ? 80000 + (i * 5000) : 0,
      emi_amount: i % 5 === 0 ? 5000 : 0,
      total_installments: i % 5 === 0 ? 24 : 0,
      paid_installments: i % 5 === 0 ? i % 12 : 0,
      remaining_installments: i % 5 === 0 ? 24 - (i % 12) : 0,
      advance_amount: i % 7 === 0 ? 10000 : 0,
      advance_balance: i % 7 === 0 ? 6000 : 0,
      state: states[i % 5],
      employee_count: 50,
      avg_salary: 35000,
    }));
  };

  // Other HR sample data
  const generateOtherHRData = () => {
    const departments = ['Primary', 'Secondary', 'Higher Secondary', 'Administration', 'Sports', 'Library'];
    const designations = ['Teacher', 'Senior Teacher', 'HOD', 'Admin Officer', 'Clerk'];
    const trainingTypes = ['Pedagogy', 'Technology', 'Leadership', 'Soft Skills', 'Subject Knowledge'];
    const trainingStatuses = ['Completed', 'In Progress', 'Scheduled'];
    const separationTypes = ['Resignation', 'Retirement', 'Termination', 'Contract End'];
    const separationReasons = ['Better Opportunity', 'Personal Reasons', 'Health', 'Relocation', 'Retirement'];
    const branches = ['Main Campus', 'East Campus', 'West Campus', 'North Campus'];
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      employee_id: `EMP${String(1001 + i).padStart(5, '0')}`,
      employee_name: [
        'Rajesh Kumar', 'Priya Sharma', 'Amit Verma', 'Sunita Patel', 'Mukesh Singh',
        'Anita Gupta', 'Ramesh Yadav', 'Kavita Reddy', 'Suresh Nair', 'Deepa Joshi'
      ][i % 10],
      department: departments[i % 6],
      designation: designations[i % 5],
      staff_type: ['Teaching', 'Non-Teaching', 'Administrative'][i % 3],
      joining_date: `20${String(20 + (i % 5)).padStart(2, '0')}-${String((i % 12) + 1).padStart(2, '0')}-01`,
      highest_qualification: ['B.Ed', 'M.Ed', 'M.A.', 'M.Sc.', 'Ph.D'][i % 5],
      phone: `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      email: `employee${i + 1}@school.edu.in`,
      // Training fields
      training_name: ['Classroom Management', 'Digital Teaching', 'Student Assessment', 'Communication Skills', 'Subject Enrichment'][i % 5],
      training_type: trainingTypes[i % 5],
      training_from: `2024-${String((i % 6) + 1).padStart(2, '0')}-01`,
      training_to: `2024-${String((i % 6) + 1).padStart(2, '0')}-05`,
      training_provider: ['Internal', 'CBSE', 'Cambridge', 'Microsoft', 'Google'][i % 5],
      training_status: trainingStatuses[i % 3],
      training_cost: 5000 + (i * 500),
      certificate_received: i % 3 !== 1,
      // Resignation fields
      resignation_date: i % 10 === 0 ? `2024-${String((i % 6) + 1).padStart(2, '0')}-15` : null,
      last_working_date: i % 10 === 0 ? `2024-${String((i % 6) + 2).padStart(2, '0')}-15` : null,
      service_years: 5 + (i % 10),
      separation_type: i % 10 === 0 ? separationTypes[i % 4] : null,
      separation_reason: i % 10 === 0 ? separationReasons[i % 5] : null,
      full_final_status: i % 10 === 0 ? ['Pending', 'Processed', 'Completed'][i % 3] : null,
      full_final_amount: i % 10 === 0 ? 50000 + (i * 2000) : 0,
      // Transfer fields
      transfer_date: i % 8 === 0 ? `2024-${String((i % 6) + 1).padStart(2, '0')}-01` : null,
      from_branch: i % 8 === 0 ? branches[i % 4] : null,
      to_branch: i % 8 === 0 ? branches[(i + 1) % 4] : null,
      from_department: i % 8 === 0 ? departments[i % 6] : null,
      to_department: i % 8 === 0 ? departments[(i + 1) % 6] : null,
      transfer_reason: i % 8 === 0 ? ['Admin Decision', 'Request', 'Promotion', 'Restructuring'][i % 4] : null,
      // Analysis fields
      employee_count: 50 - (i % 20),
      male_count: 30 - (i % 12),
      female_count: 20 - (i % 8),
      active_count: 45 - (i % 15),
      resigned_count: 5 + (i % 5),
      new_joinee_count: 3 + (i % 3),
      avg_experience: 8 + (i % 5),
      avg_salary: 35000 + (i * 500),
    }));
  };

  // Apply grouping and sorting to data
  const { groupedData, flatData } = useGroupedData(data, groupBy, sortBy, selectedColumnsObjects);

  // Export functionality
  const { exportToExcel, exportToPDF, exportToCSV, printReport } = useReportExport();

  // Handle export
  const handleExport = useCallback((format) => {
    const title = selectedTemplate?.name || 'HR Report';
    
    switch (format) {
      case 'excel':
        exportToExcel(flatData, selectedColumnsObjects, title);
        break;
      case 'pdf':
        exportToPDF(flatData, selectedColumnsObjects, title, moduleColor);
        break;
      case 'csv':
        exportToCSV(flatData, selectedColumnsObjects, title);
        break;
      case 'print':
        printReport(flatData, selectedColumnsObjects, title);
        break;
      default:
        break;
    }
  }, [flatData, selectedColumns, selectedTemplate, moduleColor, exportToExcel, exportToPDF, exportToCSV, printReport]);

  // Initial data load
  useEffect(() => {
    if (selectedBranch?.id && currentSessionId) {
      fetchData();
    }
  }, [selectedBranch?.id, currentSessionId, fetchData]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const totalEmployees = data.length;
    const activeEmployees = data.filter(row => row.employment_status === 'Active' || !row.employment_status).length;
    const teachingStaff = data.filter(row => row.is_teaching_staff || row.staff_type === 'Teaching').length;
    const totalSalary = data.reduce((sum, row) => sum + (row.net_salary || row.gross_salary || 0), 0);
    const presentToday = data.filter(row => row.attendance_status === 'Present').length;
    
    return { 
      total: totalEmployees, 
      active: activeEmployees,
      teaching: teachingStaff,
      nonTeaching: totalEmployees - teachingStaff,
      totalSalary,
      present: presentToday
    };
  }, [data]);

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <ReportGeneratorLayout
      title="Human Resource Reports"
      subtitle="Comprehensive HR, payroll and attendance reports"
      moduleColor={moduleColor}
      showSidebar={showSidebar}
      onToggleSidebar={() => setShowSidebar(!showSidebar)}
      onSave={() => setShowSaveModal(true)}
      onSchedule={() => setShowScheduleModal(true)}
    >
      <div className="flex h-full">
        {/* Template Sidebar */}
        {showSidebar && (
          <div className="w-80 border-r dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50 overflow-hidden flex-shrink-0">
            <TemplateSidebar
              templates={allTemplates}
              categories={HR_CATEGORIES}
              selectedTemplate={selectedTemplate?.id}
              onSelectTemplate={handleTemplateSelect}
              recentTemplates={[]}
              favoriteTemplates={[]}
              color={moduleColor}
            />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Stats Bar */}
          {stats && (
            <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Staff:</span>
                  <Badge variant="outline" className="font-bold dark:border-gray-600 dark:text-gray-200">{stats.total}</Badge>
                </div>
                {stats.active > 0 && (
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Active:</span>
                    <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                      {stats.active}
                    </Badge>
                  </div>
                )}
                {stats.teaching > 0 && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Teaching:</span>
                    <Badge className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                      {stats.teaching}
                    </Badge>
                  </div>
                )}
                {stats.nonTeaching > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Non-Teaching:</span>
                    <Badge className="bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300">
                      {stats.nonTeaching}
                    </Badge>
                  </div>
                )}
                {stats.totalSalary > 0 && (
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total Salary:</span>
                    <Badge className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(stats.totalSalary)}
                    </Badge>
                  </div>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchData}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Panels */}
          <div className="p-4 border-b dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/50">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Filters */}
              <Card className="shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-orange-500" />
                    <CardTitle className="text-sm dark:text-gray-200">Filters</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <FilterPanel
                    filters={filters}
                    onFiltersChange={setFilters}
                    onReset={() => setFilters({})}
                    sessions={sessions}
                    filterConfig={{
                      session: true,
                      department: true,
                      designation: true,
                      staffType: true,
                      employmentStatus: true,
                      dateRange: true,
                      month: selectedTemplate?.category === 'attendance_leave' || selectedTemplate?.category === 'payroll'
                    }}
                    color={moduleColor}
                    compact
                  />
                </CardContent>
              </Card>

              {/* Columns */}
              <Card className="shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <CardTitle className="text-sm dark:text-gray-200">Columns ({selectedColumns.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <ColumnSelector
                    availableColumns={HR_COLUMNS}
                    selectedColumns={selectedColumns}
                    onColumnsChange={setSelectedColumns}
                    moduleColor={moduleColor}
                    compact
                  />
                </CardContent>
              </Card>

              {/* Group & Sort */}
              <Card className="shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-purple-500" />
                    <CardTitle className="text-sm dark:text-gray-200">Group & Sort</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <GroupSortPanel
                    columns={selectedColumnsObjects}
                    groupBy={groupBy}
                    sortBy={sortBy}
                    onGroupByChange={setGroupBy}
                    onSortByChange={setSortBy}
                    moduleColor={moduleColor}
                    compact
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Export Bar */}
          <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedTemplate ? (
                  <>
                    <span className="font-medium text-gray-700 dark:text-gray-200">{selectedTemplate.name}</span>
                    <span className="mx-2">•</span>
                  </>
                ) : null}
                {flatData.length} records
              </span>
            </div>
            <ExportButtons
              data={flatData}
              columns={selectedColumnsObjects}
              title={selectedTemplate?.name || 'HR Report'}
              filename="hr_report"
              color={moduleColor}
            />
          </div>

          {/* Data Table */}
          <div className="flex-1 overflow-auto p-4 bg-white dark:bg-gray-800">
            <LivePreviewTable
              data={groupedData}
              columns={selectedColumnsObjects}
              groupBy={groupBy}
              isLoading={isLoading}
              error={error}
              moduleColor={moduleColor}
              showGroupTotals={groupBy.length > 0}
            />
          </div>
        </div>
      </div>

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={(name, description, isFavorite) => {
          const newTemplate = {
            id: `custom_${Date.now()}`,
            name,
            description,
            columns: selectedColumnsObjects,
            filters,
            groupBy,
            sortBy,
            isFavorite,
            createdAt: new Date().toISOString()
          };
          setSavedTemplates([...savedTemplates, newTemplate]);
          setShowSaveModal(false);
        }}
        config={{ columns: selectedColumnsObjects, filters, groupBy, sortBy }}
        moduleColor={moduleColor}
      />

      {/* Schedule Report Modal */}
      <ScheduleReportModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSave={(schedule) => {
          console.log('Schedule created:', schedule);
          setShowScheduleModal(false);
        }}
        reportName={selectedTemplate?.name || 'Custom HR Report'}
      />
    </ReportGeneratorLayout>
  );
};

export default HRReportGenerator;
