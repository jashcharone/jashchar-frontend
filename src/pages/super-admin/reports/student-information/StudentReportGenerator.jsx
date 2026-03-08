/**
 * Student Information Report Generator
 * Main page component for generating student reports
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
  useSavedTemplates,
  REPORT_MODULES
} from '../ReportGeneratorShared';
import { fetchStudentsFromSupabase } from '../ReportGeneratorShared/reportQueries';
import { STUDENT_TEMPLATES, TEMPLATE_CATEGORIES } from './templates';
import { STUDENT_COLUMNS, getColumns, COLUMN_SETS } from './columns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, BarChart3, Download, Filter, RefreshCw, Search } from 'lucide-react';

const StudentReportGenerator = () => {
  const { user, currentSessionId, organizationId } = useAuth();
  const { selectedBranch } = useBranch();
  
  // Module configuration
  const moduleConfig = REPORT_MODULES['student-information'];
  const moduleColor = moduleConfig?.color || 'blue';

  // Master data for filters (from shared hook)
  const { 
    classes, 
    sections, 
    sessions, 
    fetchSectionsByClass,
    selectedSessionId,
    setSelectedSessionId,
    effectiveSessionId,
    refetch: refetchFilterOptions 
  } = useFilterOptions();
  
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
    defaultColumns: COLUMN_SETS.basic  // Store as keys (strings), not objects
  });

  // Fetch saved templates from DB
  const { 
    savedTemplates: dbSavedTemplates, 
    refetch: refetchSavedTemplates,
    deleteTemplate,
    toggleFavorite
  } = useSavedTemplates('student-information');

  // Merge DB saved templates into local state on load
  useEffect(() => {
    if (dbSavedTemplates.length > 0) {
      setSavedTemplates(dbSavedTemplates);
    }
  }, [dbSavedTemplates, setSavedTemplates]);

  // Convert selected column keys to full column objects for table/export
  const selectedColumnsObjects = useMemo(() => {
    return selectedColumns
      .map(key => STUDENT_COLUMNS.find(c => c.key === key))
      .filter(Boolean);
  }, [selectedColumns]);

  // Templates for sidebar - merge built-in templates with saved templates
  const allTemplates = useMemo(() => {
    // Add saved custom templates to the templates list with 'Custom' category
    const customTemplates = savedTemplates.map(t => ({
      ...t,
      category: 'Custom Templates',
      isCustom: true
    }));
    return [...STUDENT_TEMPLATES, ...customTemplates];
  }, [savedTemplates]);

  // Handle template selection - receives full template object from TemplateSidebar
  const handleTemplateSelect = useCallback((template) => {
    if (template) {
      setSelectedTemplate(template);
      // Store column keys, not full objects
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
      const students = await fetchStudentsFromSupabase({
        branchId: selectedBranch.id,
        organizationId,
        sessionId: currentSessionId,
        status: filters.status,
        gender: filters.gender,
        classId: filters.class_id,
        sectionId: filters.section_id,
        search: filters.search
      });

      setData(students);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranch, currentSessionId, organizationId, filters, setIsLoading, setError, setData]);

  // Generate sample data for demo/preview
  const generateSampleData = () => {
    const classes = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    const sections = ['A', 'B', 'C'];
    const statuses = ['active', 'active', 'active', 'left', 'tc_issued'];
    
    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      admission_number: `ADM${2024}${String(i + 1).padStart(4, '0')}`,
      first_name: ['Rahul', 'Priya', 'Amit', 'Sneha', 'Raj', 'Anita', 'Vikram', 'Meena', 'Arun', 'Kavya'][i % 10],
      last_name: ['Sharma', 'Verma', 'Singh', 'Patel', 'Kumar', 'Gupta', 'Rao', 'Reddy', 'Joshi', 'Nair'][i % 10],
      class: { name: classes[i % 10], id: i % 10 + 1 },
      section: { name: sections[i % 3], id: i % 3 + 1 },
      roll_number: String((i % 40) + 1),
      gender: i % 2 === 0 ? 'Male' : 'Female',
      date_of_birth: `${2010 + (i % 10)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      father_name: `${['Rajesh', 'Suresh', 'Mukesh', 'Ramesh', 'Naresh'][i % 5]} ${['Sharma', 'Verma', 'Singh', 'Patel', 'Kumar'][i % 5]}`,
      mother_name: `${['Sunita', 'Anita', 'Kavita', 'Savita', 'Rita'][i % 5]} ${['Sharma', 'Verma', 'Singh', 'Patel', 'Kumar'][i % 5]}`,
      phone: `98${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      email: `student${i + 1}@school.com`,
      address: `${i + 1}, Sample Street, Sample City`,
      city: ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad'][i % 5],
      state: ['Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu', 'Telangana'][i % 5],
      pincode: `5${String(60000 + (i * 10))}`,
      admission_date: `2024-04-${String((i % 28) + 1).padStart(2, '0')}`,
      category: ['General', 'OBC', 'SC', 'ST'][i % 4],
      religion: ['Hindu', 'Muslim', 'Christian', 'Sikh'][i % 4],
      blood_group: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-'][i % 7],
      status: statuses[i % 5],
      photo_url: null
    }));
  };

  // Apply grouping and sorting to data
  const { groupedData, flatData: rawFlatData } = useGroupedData(data, groupBy, sortBy, selectedColumnsObjects);

  // Debug log raw data
  useEffect(() => {
    if (data.length > 0) {
      console.log('[Report Debug] Raw data sample:', data[0]);
      console.log('[Report Debug] Total data count:', data.length);
      const genders = [...new Set(data.map(s => s.gender))];
      console.log('[Report Debug] Unique genders in data:', genders);
    }
  }, [data]);

  // Debug: Log template changes
  useEffect(() => {
    console.log('[Report Debug] Template changed:', {
      key: selectedTemplate?.key,
      isStrengthReport: selectedTemplate?.isStrengthReport,
      columns: selectedTemplate?.columns?.map(c => c.key)
    });
  }, [selectedTemplate]);

  // Aggregate data for strength reports
  const aggregatedStrengthData = useMemo(() => {
    console.log('[Report Debug] aggregatedStrengthData useMemo running:', {
      templateKey: selectedTemplate?.key,
      isStrengthReport: selectedTemplate?.isStrengthReport,
      dataLength: data?.length || 0
    });

    if (!selectedTemplate?.isStrengthReport || !data || data.length === 0) {
      console.log('[Report Debug] Returning null from aggregatedStrengthData:', {
        notStrengthReport: !selectedTemplate?.isStrengthReport,
        noData: !data,
        emptyData: data?.length === 0
      });
      return null;
    }

    // Helper: case-insensitive gender check
    const isMale = (g) => g?.toLowerCase() === 'male';
    const isFemale = (g) => g?.toLowerCase() === 'female';

    const templateKey = selectedTemplate.key;
    
    // Class-wise strength
    if (templateKey === 'class_wise_strength') {
      const classMap = new Map();
      data.forEach(student => {
        const className = student.class?.name || 'Unknown';
        if (!classMap.has(className)) {
          classMap.set(className, { boys: 0, girls: 0 });
        }
        const counts = classMap.get(className);
        if (isMale(student.gender)) counts.boys++;
        else if (isFemale(student.gender)) counts.girls++;
      });
      return Array.from(classMap.entries()).map(([className, counts]) => ({
        class_name: className,
        boys_count: counts.boys,
        girls_count: counts.girls,
        total_count: counts.boys + counts.girls
      })).sort((a, b) => a.class_name.localeCompare(b.class_name));
    }
    
    // Section-wise strength
    if (templateKey === 'section_wise_strength') {
      const sectionMap = new Map();
      data.forEach(student => {
        const className = student.class?.name || 'Unknown';
        const sectionName = student.section?.name || 'Unknown';
        const key = `${className}|${sectionName}`;
        if (!sectionMap.has(key)) {
          sectionMap.set(key, { className, sectionName, boys: 0, girls: 0 });
        }
        const counts = sectionMap.get(key);
        if (isMale(student.gender)) counts.boys++;
        else if (isFemale(student.gender)) counts.girls++;
      });
      return Array.from(sectionMap.values()).map(item => ({
        class_name: item.className,
        section_name: item.sectionName,
        boys_count: item.boys,
        girls_count: item.girls,
        total_count: item.boys + item.girls
      })).sort((a, b) => a.class_name.localeCompare(b.class_name) || a.section_name.localeCompare(b.section_name));
    }

    // Gender ratio analysis
    if (templateKey === 'gender_ratio') {
      const classMap = new Map();
      data.forEach(student => {
        const className = student.class?.name || 'Unknown';
        if (!classMap.has(className)) {
          classMap.set(className, { boys: 0, girls: 0 });
        }
        const counts = classMap.get(className);
        if (isMale(student.gender)) counts.boys++;
        else if (isFemale(student.gender)) counts.girls++;
      });
      return Array.from(classMap.entries()).map(([className, counts]) => {
        const total = counts.boys + counts.girls;
        const ratio = counts.girls > 0 ? (counts.boys / counts.girls).toFixed(2) : 'N/A';
        return {
          class_name: className,
          boys_count: counts.boys,
          girls_count: counts.girls,
          total_count: total,
          ratio: ratio,
          male_percent: total > 0 ? ((counts.boys / total) * 100).toFixed(1) + '%' : '0%',
          female_percent: total > 0 ? ((counts.girls / total) * 100).toFixed(1) + '%' : '0%'
        };
      }).sort((a, b) => a.class_name.localeCompare(b.class_name));
    }

    // Age-wise distribution
    if (templateKey === 'age_wise_distribution') {
      const ageMap = new Map();
      const currentYear = new Date().getFullYear();
      const totalStudents = data.length;
      data.forEach(student => {
        const dob = student.date_of_birth;
        let ageGroup = 'Unknown';
        if (dob) {
          const birthYear = new Date(dob).getFullYear();
          const age = currentYear - birthYear;
          ageGroup = `${age} years`;
        }
        if (!ageMap.has(ageGroup)) {
          ageMap.set(ageGroup, { boys: 0, girls: 0 });
        }
        const counts = ageMap.get(ageGroup);
        if (isMale(student.gender)) counts.boys++;
        else if (isFemale(student.gender)) counts.girls++;
      });
      return Array.from(ageMap.entries()).map(([ageGroup, counts]) => {
        const total = counts.boys + counts.girls;
        return {
          age_group: ageGroup,
          boys_count: counts.boys,
          girls_count: counts.girls,
          total_count: total,
          percentage: totalStudents > 0 ? ((total / totalStudents) * 100).toFixed(1) + '%' : '0%'
        };
      }).sort((a, b) => {
        const ageA = parseInt(a.age_group) || 999;
        const ageB = parseInt(b.age_group) || 999;
        return ageA - ageB;
      });
    }

    // Category-wise strength
    if (templateKey === 'category_wise_strength') {
      const categoryMap = new Map();
      const totalStudents = data.length;
      data.forEach(student => {
        const category = student.category || 'General';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { boys: 0, girls: 0 });
        }
        const counts = categoryMap.get(category);
        if (isMale(student.gender)) counts.boys++;
        else if (isFemale(student.gender)) counts.girls++;
      });
      return Array.from(categoryMap.entries()).map(([category, counts]) => {
        const total = counts.boys + counts.girls;
        return {
          category: category,
          boys_count: counts.boys,
          girls_count: counts.girls,
          total_count: total,
          percentage: totalStudents > 0 ? ((total / totalStudents) * 100).toFixed(1) + '%' : '0%'
        };
      }).sort((a, b) => a.category.localeCompare(b.category));
    }

    // Month-wise closing strength - Student count at end of each month (Apr-Mar)
    if (templateKey === 'month_wise_closing') {
      // Month keys in academic year order (Apr to Mar)
      const monthKeys = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
      // Calendar month indices (0-11): Apr=3, May=4, ..., Dec=11, Jan=0, Feb=1, Mar=2
      const monthIndices = { apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11, jan: 0, feb: 1, mar: 2 };
      
      // Determine current date for comparison
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      // Academic year start: If current month >= April (3), use current year; otherwise previous year
      const academicYearStart = currentMonth >= 3 ? currentYear : currentYear - 1;
      
      const classMap = new Map();
      
      data.forEach(student => {
        const className = student.class?.name || 'Unknown';
        if (!classMap.has(className)) {
          // Initialize all months to 0
          const monthData = {};
          monthKeys.forEach(m => monthData[m] = 0);
          classMap.set(className, monthData);
        }
        
        // Get admission date and left date if available
        const admissionDate = student.admission_date ? new Date(student.admission_date) : null;
        const leftDate = student.left_date ? new Date(student.left_date) : null;
        const isActive = student.status?.toLowerCase() === 'active';
        
        // Skip if no admission date
        if (!admissionDate) return;
        
        const counts = classMap.get(className);
        
        // For each month, check if student was present at the end of that month
        monthKeys.forEach((monthKey) => {
          const calendarMonth = monthIndices[monthKey];
          // Determine the year for this month in academic year
          // Apr-Dec are in academicYearStart, Jan-Mar are in academicYearStart + 1
          const monthYear = calendarMonth >= 3 ? academicYearStart : academicYearStart + 1;
          
          // Last day of the month
          const lastDayOfMonth = new Date(monthYear, calendarMonth + 1, 0);
          
          // Skip future months
          if (lastDayOfMonth > currentDate) return;
          
          // Student is counted if:
          // 1. Admission date is on or before end of this month
          // 2. AND (student is still active OR left date is after this month's end)
          const wasAdmitted = admissionDate <= lastDayOfMonth;
          const stillPresent = isActive || !leftDate || leftDate > lastDayOfMonth;
          
          if (wasAdmitted && stillPresent) {
            counts[monthKey]++;
          }
        });
      });
      
      return Array.from(classMap.entries()).map(([className, monthData]) => ({
        class_name: className,
        ...monthData
      })).sort((a, b) => a.class_name.localeCompare(b.class_name));
    }

    // RTE vs Non-RTE strength
    if (templateKey === 'rte_vs_non_rte') {
      const classMap = new Map();
      data.forEach(student => {
        const className = student.class?.name || 'Unknown';
        if (!classMap.has(className)) {
          classMap.set(className, { rte: 0, nonRte: 0 });
        }
        const counts = classMap.get(className);
        const isRte = student.is_rte === true || student.rte_status?.toLowerCase() === 'yes';
        if (isRte) counts.rte++;
        else counts.nonRte++;
      });
      return Array.from(classMap.entries()).map(([className, counts]) => ({
        class_name: className,
        rte_count: counts.rte,
        non_rte_count: counts.nonRte,
        total_count: counts.rte + counts.nonRte
      })).sort((a, b) => a.class_name.localeCompare(b.class_name));
    }

    // House-wise strength
    if (templateKey === 'house_wise_strength') {
      const houseMap = new Map();
      data.forEach(student => {
        const house = student.house || student.house_name || 'Unassigned';
        if (!houseMap.has(house)) {
          houseMap.set(house, { boys: 0, girls: 0 });
        }
        const counts = houseMap.get(house);
        if (isMale(student.gender)) counts.boys++;
        else if (isFemale(student.gender)) counts.girls++;
      });
      return Array.from(houseMap.entries()).map(([house, counts]) => ({
        house: house,
        boys_count: counts.boys,
        girls_count: counts.girls,
        total_count: counts.boys + counts.girls
      })).sort((a, b) => a.house.localeCompare(b.house));
    }

    // Medium-wise strength
    if (templateKey === 'medium_wise_strength') {
      const mediumMap = new Map();
      const totalStudents = data.length;
      data.forEach(student => {
        const medium = student.medium || student.medium_of_instruction || 'English';
        if (!mediumMap.has(medium)) {
          mediumMap.set(medium, 0);
        }
        mediumMap.set(medium, mediumMap.get(medium) + 1);
      });
      return Array.from(mediumMap.entries()).map(([medium, count]) => ({
        medium: medium,
        total_count: count,
        percentage: totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) + '%' : '0%'
      })).sort((a, b) => a.medium.localeCompare(b.medium));
    }

    // Shift-wise strength
    if (templateKey === 'shift_wise_strength') {
      const shiftMap = new Map();
      const totalStudents = data.length;
      data.forEach(student => {
        const shift = student.shift || 'Morning';
        if (!shiftMap.has(shift)) {
          shiftMap.set(shift, 0);
        }
        shiftMap.set(shift, shiftMap.get(shift) + 1);
      });
      return Array.from(shiftMap.entries()).map(([shift, count]) => ({
        shift: shift,
        total_count: count,
        percentage: totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) + '%' : '0%'
      })).sort((a, b) => a.shift.localeCompare(b.shift));
    }

    // Vacancy Report - seats available per class/section
    if (templateKey === 'vacancy_report') {
      const sectionMap = new Map();
      data.forEach(student => {
        const className = student.class?.name || 'Unknown';
        const sectionName = student.section?.name || 'A';
        const key = `${className}|${sectionName}`;
        if (!sectionMap.has(key)) {
          // Default capacity 40 - can be made configurable
          sectionMap.set(key, { className, sectionName, capacity: 40, filled: 0 });
        }
        sectionMap.get(key).filled++;
      });
      return Array.from(sectionMap.values()).map(item => ({
        class_name: item.className,
        section_name: item.sectionName,
        capacity: item.capacity,
        filled: item.filled,
        vacant: item.capacity - item.filled,
        fill_percent: ((item.filled / item.capacity) * 100).toFixed(1) + '%'
      })).sort((a, b) => a.class_name.localeCompare(b.class_name) || a.section_name.localeCompare(b.section_name));
    }

    // Admission Trends - monthly admission vs left analysis
    if (templateKey === 'admission_trends') {
      const monthNames = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
      const monthMap = new Map();
      monthNames.forEach(m => monthMap.set(m, { newCount: 0, leftCount: 0 }));
      
      data.forEach(student => {
        const admissionDate = student.admission_date ? new Date(student.admission_date) : null;
        const leftDate = student.left_date ? new Date(student.left_date) : null;
        
        if (admissionDate) {
          const month = admissionDate.getMonth();
          // Convert to academic year order (Apr=0, May=1, ..., Mar=11)
          const academicMonth = month >= 3 ? month - 3 : month + 9;
          const monthName = monthNames[academicMonth];
          const counts = monthMap.get(monthName);
          if (counts) counts.newCount++;
        }
        
        if (leftDate) {
          const month = leftDate.getMonth();
          const academicMonth = month >= 3 ? month - 3 : month + 9;
          const monthName = monthNames[academicMonth];
          const counts = monthMap.get(monthName);
          if (counts) counts.leftCount++;
        }
      });
      
      return monthNames.map(month => {
        const counts = monthMap.get(month);
        return {
          month: month,
          new_count: counts.newCount,
          left_count: counts.leftCount,
          net_change: counts.newCount - counts.leftCount
        };
      });
    }

    // Blood Group Distribution
    if (templateKey === 'blood_group_distribution') {
      const bloodMap = new Map();
      data.forEach(student => {
        const bg = student.blood_group || 'Not Specified';
        if (!bloodMap.has(bg)) {
          bloodMap.set(bg, { count: 0, students: [] });
        }
        const entry = bloodMap.get(bg);
        entry.count++;
        if (entry.students.length < 5) {
          entry.students.push(`${student.first_name || ''} ${student.last_name || ''}`.trim());
        }
      });
      return Array.from(bloodMap.entries()).map(([bg, data]) => ({
        blood_group: bg,
        total_count: data.count,
        students: data.students.join(', ') + (data.count > 5 ? '...' : '')
      })).sort((a, b) => a.blood_group.localeCompare(b.blood_group));
    }

    // Religion-wise Report
    if (templateKey === 'religion_wise') {
      const religionMap = new Map();
      const totalStudents = data.length;
      data.forEach(student => {
        const religion = student.religion || 'Not Specified';
        if (!religionMap.has(religion)) {
          religionMap.set(religion, 0);
        }
        religionMap.set(religion, religionMap.get(religion) + 1);
      });
      return Array.from(religionMap.entries()).map(([religion, count]) => ({
        religion: religion,
        total_count: count,
        percentage: totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) + '%' : '0%'
      })).sort((a, b) => b.total_count - a.total_count);
    }

    // Caste-wise Report
    if (templateKey === 'caste_wise') {
      const casteMap = new Map();
      const totalStudents = data.length;
      data.forEach(student => {
        const caste = student.caste || student.sub_caste || 'Not Specified';
        if (!casteMap.has(caste)) {
          casteMap.set(caste, 0);
        }
        casteMap.set(caste, casteMap.get(caste) + 1);
      });
      return Array.from(casteMap.entries()).map(([caste, count]) => ({
        caste: caste,
        total_count: count,
        percentage: totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) + '%' : '0%'
      })).sort((a, b) => b.total_count - a.total_count);
    }

    // Mother Tongue Report
    if (templateKey === 'mother_tongue') {
      const tongueMap = new Map();
      const totalStudents = data.length;
      data.forEach(student => {
        const tongue = student.mother_tongue || student.language || 'Not Specified';
        if (!tongueMap.has(tongue)) {
          tongueMap.set(tongue, 0);
        }
        tongueMap.set(tongue, tongueMap.get(tongue) + 1);
      });
      return Array.from(tongueMap.entries()).map(([tongue, count]) => ({
        mother_tongue: tongue,
        total_count: count,
        percentage: totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) + '%' : '0%'
      })).sort((a, b) => b.total_count - a.total_count);
    }

    // Nationality Report
    if (templateKey === 'nationality_report') {
      const nationalityMap = new Map();
      const totalStudents = data.length;
      data.forEach(student => {
        const nationality = student.nationality || 'Indian';
        if (!nationalityMap.has(nationality)) {
          nationalityMap.set(nationality, 0);
        }
        nationalityMap.set(nationality, nationalityMap.get(nationality) + 1);
      });
      return Array.from(nationalityMap.entries()).map(([nationality, count]) => ({
        nationality: nationality,
        total_count: count,
        percentage: totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) + '%' : '0%'
      })).sort((a, b) => b.total_count - a.total_count);
    }

    // Area/Pincode Analysis
    if (templateKey === 'area_analysis') {
      const areaMap = new Map();
      data.forEach(student => {
        const pincode = student.pincode || 'Not Specified';
        const city = student.city || student.area || 'Unknown';
        const key = `${pincode}|${city}`;
        if (!areaMap.has(key)) {
          areaMap.set(key, { pincode, city, count: 0 });
        }
        areaMap.get(key).count++;
      });
      return Array.from(areaMap.values()).map(item => ({
        pincode: item.pincode,
        city: item.city,
        total_count: item.count
      })).sort((a, b) => b.total_count - a.total_count);
    }

    // Parent Education Level
    if (templateKey === 'parent_education') {
      const eduMap = new Map();
      const totalStudents = data.length;
      data.forEach(student => {
        const edu = student.father_education || student.parent_education || student.mother_education || 'Not Specified';
        if (!eduMap.has(edu)) {
          eduMap.set(edu, 0);
        }
        eduMap.set(edu, eduMap.get(edu) + 1);
      });
      return Array.from(eduMap.entries()).map(([edu, count]) => ({
        education_level: edu,
        total_count: count,
        percentage: totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) + '%' : '0%'
      })).sort((a, b) => b.total_count - a.total_count);
    }

    // Family Income Analysis
    if (templateKey === 'family_income') {
      const incomeSlabs = [
        { min: 0, max: 100000, label: 'Below 1 Lakh' },
        { min: 100000, max: 300000, label: '1-3 Lakhs' },
        { min: 300000, max: 500000, label: '3-5 Lakhs' },
        { min: 500000, max: 1000000, label: '5-10 Lakhs' },
        { min: 1000000, max: Infinity, label: 'Above 10 Lakhs' }
      ];
      const incomeMap = new Map();
      const totalStudents = data.length;
      incomeSlabs.forEach(slab => incomeMap.set(slab.label, 0));
      incomeMap.set('Not Specified', 0);
      
      data.forEach(student => {
        const income = parseInt(student.family_income || student.annual_income || 0);
        if (!income || income === 0) {
          incomeMap.set('Not Specified', incomeMap.get('Not Specified') + 1);
        } else {
          const slab = incomeSlabs.find(s => income >= s.min && income < s.max);
          if (slab) {
            incomeMap.set(slab.label, incomeMap.get(slab.label) + 1);
          }
        }
      });
      
      return Array.from(incomeMap.entries()).map(([slab, count]) => ({
        income_slab: slab,
        total_count: count,
        percentage: totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) + '%' : '0%'
      }));
    }

    // Default fallback for other strength reports - aggregate by class
    const classMap = new Map();
    data.forEach(student => {
      const className = student.class?.name || 'Unknown';
      if (!classMap.has(className)) {
        classMap.set(className, { boys: 0, girls: 0 });
      }
      const counts = classMap.get(className);
      if (isMale(student.gender)) counts.boys++;
      else if (isFemale(student.gender)) counts.girls++;
    });
    return Array.from(classMap.entries()).map(([className, counts]) => ({
      class_name: className,
      boys_count: counts.boys,
      girls_count: counts.girls,
      total_count: counts.boys + counts.girls
    })).sort((a, b) => a.class_name.localeCompare(b.class_name));
  }, [data, selectedTemplate]);

  // Birthday filtered data - filter students by birthday today/week/month
  const birthdayFilteredData = useMemo(() => {
    if (!selectedTemplate?.isBirthdayReport || !rawFlatData || rawFlatData.length === 0) {
      return null;
    }

    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();
    
    // Get start and end of current week (Sunday to Saturday)
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const birthdayType = selectedTemplate.isBirthdayReport;

    return rawFlatData.filter(student => {
      const dob = student.date_of_birth;
      if (!dob) return false;
      
      const dobDate = new Date(dob);
      const dobMonth = dobDate.getMonth();
      const dobDay = dobDate.getDate();

      if (birthdayType === 'today_week') {
        // Check if birthday is today
        const isBirthdayToday = dobMonth === todayMonth && dobDay === todayDate;
        
        // Check if birthday is this week (same month-day falls within this week)
        // Create a date in current year with student's birthday
        const birthdayThisYear = new Date(today.getFullYear(), dobMonth, dobDay);
        const isBirthdayThisWeek = birthdayThisYear >= weekStart && birthdayThisYear <= weekEnd;
        
        return isBirthdayToday || isBirthdayThisWeek;
      }
      
      if (birthdayType === 'current_month') {
        // Check if birthday is in current month
        return dobMonth === todayMonth;
      }

      return false;
    });
  }, [rawFlatData, selectedTemplate]);

  // Debug log aggregated data
  useEffect(() => {
    if (selectedTemplate?.isStrengthReport) {
      console.log('[Report Debug] Selected template:', selectedTemplate.key);
      console.log('[Report Debug] Template columns:', selectedTemplate.columns);
      console.log('[Report Debug] Aggregated data:', aggregatedStrengthData);
    }
    if (selectedTemplate?.isBirthdayReport) {
      console.log('[Birthday Report] Type:', selectedTemplate.isBirthdayReport);
      console.log('[Birthday Report] Filtered count:', birthdayFilteredData?.length);
    }
  }, [selectedTemplate, aggregatedStrengthData, birthdayFilteredData]);

  // Use aggregated data for strength reports, birthday filtered for birthday reports, otherwise use raw data
  const flatData = useMemo(() => {
    if (selectedTemplate?.isStrengthReport && aggregatedStrengthData) {
      return aggregatedStrengthData;
    }
    if (selectedTemplate?.isBirthdayReport && birthdayFilteredData) {
      return birthdayFilteredData;
    }
    return rawFlatData;
  }, [selectedTemplate, aggregatedStrengthData, birthdayFilteredData, rawFlatData]);

  // Debug log final data for table
  useEffect(() => {
    const isUsingAggregated = selectedTemplate?.isStrengthReport && aggregatedStrengthData;
    console.log('[Report Debug] flatData decision:', {
      isStrengthReport: selectedTemplate?.isStrengthReport,
      hasAggregatedData: !!aggregatedStrengthData,
      aggregatedLength: aggregatedStrengthData?.length,
      rawFlatDataLength: rawFlatData?.length,
      isUsingAggregated,
      finalFlatDataLength: flatData?.length
    });
    console.log('[Report Debug] flatData sample:', flatData?.[0]);
  }, [flatData, selectedTemplate, aggregatedStrengthData, rawFlatData]);

  // Export functionality
  const { exportToExcel, exportToPDF, exportToCSV, printReport } = useReportExport();

  // Handle export
  // Get columns for export/display - use template columns for strength reports, otherwise use selected columns
  const displayColumns = useMemo(() => {
    return selectedTemplate?.isStrengthReport ? selectedTemplate.columns : selectedColumnsObjects;
  }, [selectedTemplate, selectedColumnsObjects]);

  const handleExport = useCallback((format) => {
    const title = selectedTemplate?.name || 'Student Report';
    const columnsToUse = displayColumns;
    
    switch (format) {
      case 'excel':
        exportToExcel(flatData, columnsToUse, title);
        break;
      case 'pdf':
        exportToPDF(flatData, columnsToUse, title, moduleColor);
        break;
      case 'csv':
        exportToCSV(flatData, columnsToUse, title);
        break;
      case 'print':
        printReport(flatData, columnsToUse, title);
        break;
      default:
        break;
    }
  }, [flatData, displayColumns, selectedTemplate, moduleColor, exportToExcel, exportToPDF, exportToCSV, printReport]);

  // Initial data load
  useEffect(() => {
    if (selectedBranch?.id && currentSessionId) {
      fetchData();
    }
  // Note: fetchData changes when filters change, which triggers refetch
  }, [selectedBranch?.id, currentSessionId, fetchData]);

  // Handle filter reset
  const handleResetFilters = useCallback(() => {
    setFilters({});
  }, [setFilters]);

  // Quick stats
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const active = data.filter(s => s.status?.toLowerCase() === 'active').length;
    const boys = data.filter(s => s.gender?.toLowerCase() === 'male').length;
    const girls = data.filter(s => s.gender?.toLowerCase() === 'female').length;
    
    return { total: data.length, active, boys, girls };
  }, [data]);

  return (
    <>
    <ReportGeneratorLayout
      title="Student Information Reports"
      subtitle="Generate and export comprehensive student data reports"
      moduleColor={moduleColor}
      showSidebar={showSidebar}
      onToggleSidebar={() => setShowSidebar(!showSidebar)}
      onSave={() => setShowSaveModal(true)}
      onSchedule={() => setShowScheduleModal(true)}
    >
      <div className="flex h-full">
        {/* Template Sidebar */}
        {showSidebar && (
          <div className="w-56 border-r dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50 overflow-hidden flex-shrink-0">
            <TemplateSidebar
              templates={allTemplates}
              selectedTemplate={selectedTemplate?.key}
              onSelectTemplate={handleTemplateSelect}
              recentTemplates={[]}
              favoriteTemplates={[]}
              color={moduleColor}
            />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Quick Stats Bar */}
          {stats && (
            <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total:</span>
                  <Badge variant="outline" className="font-bold dark:border-gray-600 dark:text-gray-200">{stats.total}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Active:</span>
                  <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">{stats.active}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Boys:</span>
                  <Badge className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">{stats.boys}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Girls:</span>
                  <Badge className="bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300">{stats.girls}</Badge>
                </div>
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

          {/* Compact Configuration Toolbar */}
          <div className="px-4 py-2 border-b dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/50">
            {/* Inline Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Session */}
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">Session</label>
                <select
                  value={selectedSessionId || filters.session_id || ''}
                  onChange={(e) => {
                    const newSessionId = e.target.value;
                    setFilters(prev => ({ ...prev, session_id: newSessionId, class_id: '', section_id: '' }));
                    setSelectedSessionId(newSessionId);
                  }}
                  className="px-2 py-1.5 text-sm border dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-gray-200"
                >
                  <option value="">Current</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{s.session_name || s.name}</option>
                  ))}
                </select>
              </div>

              {/* Class */}
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">Class</label>
                <select
                  value={filters.class_id || ''}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, class_id: e.target.value, section_id: '' }));
                    fetchSectionsByClass(e.target.value);
                  }}
                  className="px-2 py-1.5 text-sm border dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-gray-200"
                >
                  <option value="">All Classes</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Section */}
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">Section</label>
                <select
                  value={filters.section_id || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, section_id: e.target.value }))}
                  className="px-2 py-1.5 text-sm border dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-gray-200"
                >
                  <option value="">All Sections</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Status */}
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-2 py-1.5 text-sm border dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-gray-200"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="tc_issued">TC Issued</option>
                </select>
              </div>

              {/* Gender */}
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">Gender</label>
                <select
                  value={filters.gender || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                  className="px-2 py-1.5 text-sm border dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-gray-200"
                >
                  <option value="">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Search */}
              <div className="flex items-center gap-1">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Name, Phone, Admission No..."
                  className="px-2 py-1.5 text-sm border dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-gray-200 w-48"
                />
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

              {/* Columns Button */}
              <ColumnSelector
                availableColumns={STUDENT_COLUMNS}
                selectedColumns={selectedColumns}
                onColumnsChange={setSelectedColumns}
                moduleColor={moduleColor}
                compact
              />

              {/* Divider */}
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

              {/* Group & Sort */}
              <GroupSortPanel
                columns={selectedColumnsObjects}
                groupBy={groupBy}
                sortBy={sortBy}
                onGroupByChange={setGroupBy}
                onSortByChange={setSortBy}
                moduleColor={moduleColor}
                compact
              />
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
              columns={displayColumns}
              title={selectedTemplate?.name || 'Student Report'}
              filename="student_report"
              color={moduleColor}
              // Enhanced props for school header & grand total
              schoolInfo={selectedBranch ? {
                name: selectedBranch.name,
                address: selectedBranch.address,
                phone: selectedBranch.phone,
                email: selectedBranch.email,
                logo: selectedBranch.logo_url,
                district: selectedBranch.district,
                state: selectedBranch.state,
                affiliationNo: selectedBranch.affiliation_no
              } : null}
              showSchoolHeader={true}
              showGrandTotal={false}
              showFilterInfo={true}
              filterInfo={{
                session: sessions?.find(s => s.id === effectiveSessionId)?.name || '',
                className: classes?.find(c => c.id === filters?.classId)?.name || '',
                sectionName: sections?.find(s => s.id === filters?.sectionId)?.name || ''
              }}
              preparedBy=""
              authorizedBy=""
              // History logging props
              saveHistory={true}
              module="student-information"
              templateKey={selectedTemplate?.key || ''}
              branchId={selectedBranch?.id}
              organizationId={organizationId}
              sessionId={effectiveSessionId}
              userId={user?.id}
            />
          </div>

          {/* Data Table */}
          <div className="flex-1 overflow-auto p-4 bg-white dark:bg-gray-800">
            <LivePreviewTable
              data={selectedTemplate?.isStrengthReport || selectedTemplate?.isBirthdayReport ? flatData : groupedData}
              columns={displayColumns}
              groupBy={selectedTemplate?.isStrengthReport || selectedTemplate?.isBirthdayReport ? [] : groupBy}
              loading={isLoading}
              color={moduleColor}
              showSubtotals={!selectedTemplate?.isStrengthReport && !selectedTemplate?.isBirthdayReport && groupBy.length > 0}
            />
          </div>
        </div>
      </div>
    </ReportGeneratorLayout>

    {/* Save Template Modal - Outside layout for proper z-index */}
    <SaveTemplateModal
      isOpen={showSaveModal}
      onClose={() => setShowSaveModal(false)}
      onSave={(templateData) => {
        // Refresh saved templates from DB to include the new template
        refetchSavedTemplates();
        setShowSaveModal(false);
      }}
      templateConfig={{ columns: selectedColumnsObjects, filters, groupBy, sortBy }}
      module="student-information"
      branchId={selectedBranch?.id}
      organizationId={organizationId}
      sessionId={currentSessionId}
      userId={user?.id}
    />

    {/* Schedule Report Modal */}
    <ScheduleReportModal
      isOpen={showScheduleModal}
      onClose={() => setShowScheduleModal(false)}
      onSave={(schedule) => {
        console.log('Schedule created:', schedule);
        setShowScheduleModal(false);
      }}
      reportName={selectedTemplate?.name || 'Custom Report'}
    />
  </>
  );
};

export default StudentReportGenerator;
