/**
 * Human Resource Report Generator - Column Definitions
 * Module 5: 40 HR Report Templates
 * 
 * Categories:
 * 1. Employee Data (12)
 * 2. Attendance & Leave (10)
 * 3. Payroll Reports (12)
 * 4. Other HR Reports (6)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ALL AVAILABLE COLUMNS FOR HR MODULE
// ═══════════════════════════════════════════════════════════════════════════════

export const HR_COLUMNS = [
  // ─────────────────────────────────────────────────────────────────────────────
  // EMPLOYEE BASIC INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'employee_id', label: 'Employee ID', type: 'text', sortable: true, groupable: false, width: '120px' },
  { key: 'employee_code', label: 'Employee Code', type: 'text', sortable: true, groupable: false, width: '120px' },
  { key: 'employee_name', label: 'Employee Name', type: 'text', sortable: true, groupable: false, width: '180px' },
  { key: 'first_name', label: 'First Name', type: 'text', sortable: true, groupable: false, width: '120px' },
  { key: 'last_name', label: 'Last Name', type: 'text', sortable: true, groupable: false, width: '120px' },
  { key: 'gender', label: 'Gender', type: 'text', sortable: true, groupable: true, width: '80px' },
  { key: 'date_of_birth', label: 'Date of Birth', type: 'date', sortable: true, groupable: false, width: '120px' },
  { key: 'age', label: 'Age', type: 'number', sortable: true, groupable: false, width: '60px' },
  { key: 'photo', label: 'Photo', type: 'image', sortable: false, groupable: false, width: '80px' },
  { key: 'blood_group', label: 'Blood Group', type: 'text', sortable: true, groupable: true, width: '100px' },
  { key: 'marital_status', label: 'Marital Status', type: 'text', sortable: true, groupable: true, width: '120px' },
  { key: 'nationality', label: 'Nationality', type: 'text', sortable: true, groupable: true, width: '100px' },
  { key: 'religion', label: 'Religion', type: 'text', sortable: true, groupable: true, width: '100px' },
  { key: 'caste', label: 'Caste', type: 'text', sortable: true, groupable: true, width: '100px' },
  { key: 'category', label: 'Category', type: 'text', sortable: true, groupable: true, width: '100px' },

  // ─────────────────────────────────────────────────────────────────────────────
  // CONTACT INFORMATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'phone', label: 'Phone', type: 'phone', sortable: false, groupable: false, width: '120px' },
  { key: 'mobile', label: 'Mobile', type: 'phone', sortable: false, groupable: false, width: '120px' },
  { key: 'secondary_mobile', label: 'Alt Phone', type: 'phone', sortable: false, groupable: false, width: '120px' },
  { key: 'email', label: 'Email', type: 'email', sortable: false, groupable: false, width: '200px' },
  { key: 'personal_email', label: 'Personal Email', type: 'email', sortable: false, groupable: false, width: '200px' },
  { key: 'address', label: 'Address', type: 'text', sortable: false, groupable: false, width: '250px' },
  { key: 'permanent_address', label: 'Permanent Address', type: 'text', sortable: false, groupable: false, width: '250px' },
  { key: 'current_address', label: 'Current Address', type: 'text', sortable: false, groupable: false, width: '250px' },
  { key: 'city', label: 'City', type: 'text', sortable: true, groupable: true, width: '120px' },
  { key: 'state', label: 'State', type: 'text', sortable: true, groupable: true, width: '120px' },
  { key: 'pincode', label: 'Pincode', type: 'text', sortable: true, groupable: false, width: '100px' },
  { key: 'emergency_contact', label: 'Emergency Contact', type: 'phone', sortable: false, groupable: false, width: '140px' },
  { key: 'emergency_contact_name', label: 'Emergency Person', type: 'text', sortable: false, groupable: false, width: '150px' },
  { key: 'emergency_relation', label: 'Relation', type: 'text', sortable: false, groupable: false, width: '100px' },

  // ─────────────────────────────────────────────────────────────────────────────
  // EMPLOYMENT DETAILS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'department', label: 'Department', type: 'text', sortable: true, groupable: true, width: '140px' },
  { key: 'designation', label: 'Designation', type: 'text', sortable: true, groupable: true, width: '150px' },
  { key: 'staff_type', label: 'Staff Type', type: 'badge', sortable: true, groupable: true, width: '120px' },
  { key: 'employee_type', label: 'Employee Type', type: 'badge', sortable: true, groupable: true, width: '130px' },
  { key: 'job_title', label: 'Job Title', type: 'text', sortable: true, groupable: true, width: '150px' },
  { key: 'grade', label: 'Grade', type: 'text', sortable: true, groupable: true, width: '100px' },
  { key: 'pay_scale', label: 'Pay Scale', type: 'text', sortable: true, groupable: true, width: '120px' },
  { key: 'joining_date', label: 'Joining Date', type: 'date', sortable: true, groupable: false, width: '120px' },
  { key: 'confirmation_date', label: 'Confirmation Date', type: 'date', sortable: true, groupable: false, width: '140px' },
  { key: 'probation_end_date', label: 'Probation End', type: 'date', sortable: true, groupable: false, width: '130px' },
  { key: 'retirement_date', label: 'Retirement Date', type: 'date', sortable: true, groupable: false, width: '130px' },
  { key: 'resignation_date', label: 'Resignation Date', type: 'date', sortable: true, groupable: false, width: '130px' },
  { key: 'last_working_date', label: 'Last Working Date', type: 'date', sortable: true, groupable: false, width: '140px' },
  { key: 'experience_years', label: 'Experience (Yrs)', type: 'number', sortable: true, groupable: false, width: '130px' },
  { key: 'service_years', label: 'Service Years', type: 'number', sortable: true, groupable: false, width: '120px' },
  { key: 'employment_status', label: 'Status', type: 'badge', sortable: true, groupable: true, width: '100px' },
  { key: 'reporting_to', label: 'Reporting To', type: 'text', sortable: true, groupable: true, width: '150px' },
  { key: 'branch_name', label: 'Branch', type: 'text', sortable: true, groupable: true, width: '140px' },
  { key: 'shift', label: 'Shift', type: 'text', sortable: true, groupable: true, width: '100px' },

  // ─────────────────────────────────────────────────────────────────────────────
  // TEACHING STAFF SPECIFIC
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'is_teaching_staff', label: 'Teaching Staff', type: 'boolean', sortable: true, groupable: true, width: '130px' },
  { key: 'subject_specialization', label: 'Subject Specialization', type: 'text', sortable: true, groupable: true, width: '170px' },
  { key: 'subjects_assigned', label: 'Subjects Assigned', type: 'text', sortable: false, groupable: false, width: '200px' },
  { key: 'classes_assigned', label: 'Classes Assigned', type: 'text', sortable: false, groupable: false, width: '180px' },
  { key: 'class_teacher_of', label: 'Class Teacher Of', type: 'text', sortable: true, groupable: true, width: '140px' },
  { key: 'weekly_workload', label: 'Weekly Hours', type: 'number', sortable: true, groupable: false, width: '110px' },
  { key: 'extra_curricular', label: 'Extra Curricular', type: 'text', sortable: false, groupable: true, width: '150px' },

  // ─────────────────────────────────────────────────────────────────────────────
  // QUALIFICATION & EXPERIENCE
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'highest_qualification', label: 'Qualification', type: 'text', sortable: true, groupable: true, width: '140px' },
  { key: 'degree', label: 'Degree', type: 'text', sortable: true, groupable: true, width: '120px' },
  { key: 'university', label: 'University', type: 'text', sortable: true, groupable: true, width: '180px' },
  { key: 'passing_year', label: 'Passing Year', type: 'text', sortable: true, groupable: true, width: '110px' },
  { key: 'professional_qualification', label: 'Professional Qual.', type: 'text', sortable: true, groupable: true, width: '160px' },
  { key: 'certifications', label: 'Certifications', type: 'text', sortable: false, groupable: false, width: '180px' },
  { key: 'previous_organization', label: 'Previous Org', type: 'text', sortable: true, groupable: false, width: '180px' },
  { key: 'previous_designation', label: 'Previous Designation', type: 'text', sortable: true, groupable: false, width: '160px' },
  { key: 'total_experience', label: 'Total Experience', type: 'text', sortable: true, groupable: false, width: '130px' },

  // ─────────────────────────────────────────────────────────────────────────────
  // IDENTITY DOCUMENTS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'aadhaar_number', label: 'Aadhaar Number', type: 'text', sortable: false, groupable: false, width: '140px' },
  { key: 'pan_number', label: 'PAN Number', type: 'text', sortable: false, groupable: false, width: '130px' },
  { key: 'passport_number', label: 'Passport No', type: 'text', sortable: false, groupable: false, width: '130px' },
  { key: 'voter_id', label: 'Voter ID', type: 'text', sortable: false, groupable: false, width: '130px' },
  { key: 'driving_license', label: 'DL Number', type: 'text', sortable: false, groupable: false, width: '130px' },

  // ─────────────────────────────────────────────────────────────────────────────
  // SALARY & BANK DETAILS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'bank_name', label: 'Bank Name', type: 'text', sortable: true, groupable: true, width: '150px' },
  { key: 'bank_account_no', label: 'Account No', type: 'text', sortable: false, groupable: false, width: '160px' },
  { key: 'ifsc_code', label: 'IFSC Code', type: 'text', sortable: false, groupable: false, width: '120px' },
  { key: 'bank_branch', label: 'Bank Branch', type: 'text', sortable: true, groupable: true, width: '150px' },
  { key: 'pf_number', label: 'PF Number', type: 'text', sortable: false, groupable: false, width: '140px' },
  { key: 'uan_number', label: 'UAN Number', type: 'text', sortable: false, groupable: false, width: '140px' },
  { key: 'esi_number', label: 'ESI Number', type: 'text', sortable: false, groupable: false, width: '140px' },
  { key: 'pf_applicable', label: 'PF Applicable', type: 'boolean', sortable: true, groupable: true, width: '120px' },
  { key: 'esi_applicable', label: 'ESI Applicable', type: 'boolean', sortable: true, groupable: true, width: '120px' },
  { key: 'tds_applicable', label: 'TDS Applicable', type: 'boolean', sortable: true, groupable: true, width: '120px' },
  { key: 'payment_mode', label: 'Payment Mode', type: 'text', sortable: true, groupable: true, width: '130px' },

  // ─────────────────────────────────────────────────────────────────────────────
  // SALARY COMPONENTS - EARNINGS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'basic_salary', label: 'Basic Salary', type: 'currency', sortable: true, groupable: false, width: '130px', aggregate: 'sum' },
  { key: 'gross_salary', label: 'Gross Salary', type: 'currency', sortable: true, groupable: false, width: '130px', aggregate: 'sum' },
  { key: 'net_salary', label: 'Net Salary', type: 'currency', sortable: true, groupable: false, width: '130px', aggregate: 'sum' },
  { key: 'ctc', label: 'CTC', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'da', label: 'DA', type: 'currency', sortable: true, groupable: false, width: '100px', aggregate: 'sum' },
  { key: 'hra', label: 'HRA', type: 'currency', sortable: true, groupable: false, width: '100px', aggregate: 'sum' },
  { key: 'conveyance', label: 'Conveyance', type: 'currency', sortable: true, groupable: false, width: '110px', aggregate: 'sum' },
  { key: 'medical_allowance', label: 'Medical', type: 'currency', sortable: true, groupable: false, width: '100px', aggregate: 'sum' },
  { key: 'special_allowance', label: 'Special Allow.', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'lta', label: 'LTA', type: 'currency', sortable: true, groupable: false, width: '100px', aggregate: 'sum' },
  { key: 'other_allowances', label: 'Other Allow.', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'bonus', label: 'Bonus', type: 'currency', sortable: true, groupable: false, width: '100px', aggregate: 'sum' },
  { key: 'incentive', label: 'Incentive', type: 'currency', sortable: true, groupable: false, width: '100px', aggregate: 'sum' },
  { key: 'overtime', label: 'Overtime', type: 'currency', sortable: true, groupable: false, width: '100px', aggregate: 'sum' },
  { key: 'arrears', label: 'Arrears', type: 'currency', sortable: true, groupable: false, width: '100px', aggregate: 'sum' },
  { key: 'total_earnings', label: 'Total Earnings', type: 'currency', sortable: true, groupable: false, width: '130px', aggregate: 'sum' },

  // ─────────────────────────────────────────────────────────────────────────────
  // SALARY COMPONENTS - DEDUCTIONS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'pf_deduction', label: 'PF Deduction', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'employer_pf', label: 'Employer PF', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'employee_pf', label: 'Employee PF', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'esi_deduction', label: 'ESI Deduction', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'employer_esi', label: 'Employer ESI', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'employee_esi', label: 'Employee ESI', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'professional_tax', label: 'Professional Tax', type: 'currency', sortable: true, groupable: false, width: '130px', aggregate: 'sum' },
  { key: 'tds_deduction', label: 'TDS', type: 'currency', sortable: true, groupable: false, width: '100px', aggregate: 'sum' },
  { key: 'loan_recovery', label: 'Loan Recovery', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'advance_recovery', label: 'Advance Recovery', type: 'currency', sortable: true, groupable: false, width: '140px', aggregate: 'sum' },
  { key: 'other_deductions', label: 'Other Deductions', type: 'currency', sortable: true, groupable: false, width: '140px', aggregate: 'sum' },
  { key: 'total_deductions', label: 'Total Deductions', type: 'currency', sortable: true, groupable: false, width: '140px', aggregate: 'sum' },
  { key: 'lop_deduction', label: 'LOP Deduction', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },

  // ─────────────────────────────────────────────────────────────────────────────
  // ATTENDANCE COLUMNS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'attendance_date', label: 'Date', type: 'date', sortable: true, groupable: true, width: '110px' },
  { key: 'month', label: 'Month', type: 'text', sortable: true, groupable: true, width: '100px' },
  { key: 'year', label: 'Year', type: 'text', sortable: true, groupable: true, width: '80px' },
  { key: 'in_time', label: 'In Time', type: 'time', sortable: true, groupable: false, width: '100px' },
  { key: 'out_time', label: 'Out Time', type: 'time', sortable: true, groupable: false, width: '100px' },
  { key: 'work_hours', label: 'Work Hours', type: 'text', sortable: true, groupable: false, width: '110px' },
  { key: 'overtime_hours', label: 'OT Hours', type: 'number', sortable: true, groupable: false, width: '100px', aggregate: 'sum' },
  { key: 'attendance_status', label: 'Status', type: 'badge', sortable: true, groupable: true, width: '100px' },
  { key: 'present_days', label: 'Present Days', type: 'number', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'absent_days', label: 'Absent Days', type: 'number', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'half_days', label: 'Half Days', type: 'number', sortable: true, groupable: false, width: '100px', aggregate: 'sum' },
  { key: 'late_days', label: 'Late Days', type: 'number', sortable: true, groupable: false, width: '100px', aggregate: 'sum' },
  { key: 'early_leave_days', label: 'Early Leave', type: 'number', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'working_days', label: 'Working Days', type: 'number', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'payable_days', label: 'Payable Days', type: 'number', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'holidays', label: 'Holidays', type: 'number', sortable: true, groupable: false, width: '100px', aggregate: 'sum' },
  { key: 'weekoffs', label: 'Week Off', type: 'number', sortable: true, groupable: false, width: '100px', aggregate: 'sum' },
  { key: 'attendance_percentage', label: 'Attendance %', type: 'percentage', sortable: true, groupable: false, width: '120px' },

  // ─────────────────────────────────────────────────────────────────────────────
  // LEAVE COLUMNS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'leave_type', label: 'Leave Type', type: 'text', sortable: true, groupable: true, width: '120px' },
  { key: 'leave_from', label: 'From Date', type: 'date', sortable: true, groupable: false, width: '110px' },
  { key: 'leave_to', label: 'To Date', type: 'date', sortable: true, groupable: false, width: '110px' },
  { key: 'leave_days', label: 'No. of Days', type: 'number', sortable: true, groupable: false, width: '110px', aggregate: 'sum' },
  { key: 'leave_reason', label: 'Reason', type: 'text', sortable: false, groupable: false, width: '200px' },
  { key: 'leave_status', label: 'Leave Status', type: 'badge', sortable: true, groupable: true, width: '120px' },
  { key: 'approved_by', label: 'Approved By', type: 'text', sortable: true, groupable: true, width: '140px' },
  { key: 'cl_balance', label: 'CL Balance', type: 'number', sortable: true, groupable: false, width: '110px' },
  { key: 'sl_balance', label: 'SL Balance', type: 'number', sortable: true, groupable: false, width: '110px' },
  { key: 'el_balance', label: 'EL Balance', type: 'number', sortable: true, groupable: false, width: '110px' },
  { key: 'ml_balance', label: 'ML Balance', type: 'number', sortable: true, groupable: false, width: '110px' },
  { key: 'comp_off_balance', label: 'Comp Off', type: 'number', sortable: true, groupable: false, width: '110px' },
  { key: 'total_leave_balance', label: 'Total Balance', type: 'number', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'cl_taken', label: 'CL Taken', type: 'number', sortable: true, groupable: false, width: '100px', aggregate: 'sum' },
  { key: 'sl_taken', label: 'SL Taken', type: 'number', sortable: true, groupable: false, width: '100px', aggregate: 'sum' },
  { key: 'el_taken', label: 'EL Taken', type: 'number', sortable: true, groupable: false, width: '100px', aggregate: 'sum' },
  { key: 'lop_days', label: 'LOP Days', type: 'number', sortable: true, groupable: false, width: '100px', aggregate: 'sum' },
  { key: 'leave_application_date', label: 'Applied On', type: 'date', sortable: true, groupable: false, width: '110px' },

  // ─────────────────────────────────────────────────────────────────────────────
  // TRAINING & DEVELOPMENT
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'training_name', label: 'Training Name', type: 'text', sortable: true, groupable: true, width: '180px' },
  { key: 'training_type', label: 'Training Type', type: 'text', sortable: true, groupable: true, width: '130px' },
  { key: 'training_from', label: 'Training From', type: 'date', sortable: true, groupable: false, width: '120px' },
  { key: 'training_to', label: 'Training To', type: 'date', sortable: true, groupable: false, width: '120px' },
  { key: 'training_provider', label: 'Provider', type: 'text', sortable: true, groupable: true, width: '150px' },
  { key: 'training_status', label: 'Training Status', type: 'badge', sortable: true, groupable: true, width: '130px' },
  { key: 'training_cost', label: 'Training Cost', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'certificate_received', label: 'Certificate', type: 'boolean', sortable: true, groupable: true, width: '110px' },

  // ─────────────────────────────────────────────────────────────────────────────
  // PERFORMANCE & APPRAISAL
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'appraisal_year', label: 'Appraisal Year', type: 'text', sortable: true, groupable: true, width: '130px' },
  { key: 'performance_rating', label: 'Rating', type: 'number', sortable: true, groupable: true, width: '100px' },
  { key: 'performance_grade', label: 'Grade', type: 'text', sortable: true, groupable: true, width: '80px' },
  { key: 'increment_percentage', label: 'Increment %', type: 'percentage', sortable: true, groupable: false, width: '110px' },
  { key: 'promotion_status', label: 'Promotion', type: 'badge', sortable: true, groupable: true, width: '110px' },

  // ─────────────────────────────────────────────────────────────────────────────
  // TRANSFER & SEPARATION
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'transfer_date', label: 'Transfer Date', type: 'date', sortable: true, groupable: false, width: '120px' },
  { key: 'from_branch', label: 'From Branch', type: 'text', sortable: true, groupable: true, width: '130px' },
  { key: 'to_branch', label: 'To Branch', type: 'text', sortable: true, groupable: true, width: '130px' },
  { key: 'from_department', label: 'From Dept', type: 'text', sortable: true, groupable: true, width: '130px' },
  { key: 'to_department', label: 'To Dept', type: 'text', sortable: true, groupable: true, width: '130px' },
  { key: 'transfer_reason', label: 'Transfer Reason', type: 'text', sortable: false, groupable: true, width: '150px' },
  { key: 'separation_type', label: 'Separation Type', type: 'badge', sortable: true, groupable: true, width: '130px' },
  { key: 'separation_reason', label: 'Separation Reason', type: 'text', sortable: false, groupable: true, width: '150px' },
  { key: 'notice_period', label: 'Notice Period', type: 'text', sortable: true, groupable: false, width: '120px' },
  { key: 'full_final_status', label: 'F&F Status', type: 'badge', sortable: true, groupable: true, width: '100px' },
  { key: 'full_final_amount', label: 'F&F Amount', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },

  // ─────────────────────────────────────────────────────────────────────────────
  // LOAN & ADVANCE
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'loan_type', label: 'Loan Type', type: 'text', sortable: true, groupable: true, width: '120px' },
  { key: 'loan_amount', label: 'Loan Amount', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'loan_date', label: 'Loan Date', type: 'date', sortable: true, groupable: false, width: '110px' },
  { key: 'loan_balance', label: 'Loan Balance', type: 'currency', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'emi_amount', label: 'EMI Amount', type: 'currency', sortable: true, groupable: false, width: '110px', aggregate: 'sum' },
  { key: 'total_installments', label: 'Total EMI', type: 'number', sortable: true, groupable: false, width: '100px' },
  { key: 'paid_installments', label: 'Paid EMI', type: 'number', sortable: true, groupable: false, width: '100px' },
  { key: 'remaining_installments', label: 'Remaining EMI', type: 'number', sortable: true, groupable: false, width: '120px' },
  { key: 'advance_amount', label: 'Advance Amount', type: 'currency', sortable: true, groupable: false, width: '130px', aggregate: 'sum' },
  { key: 'advance_balance', label: 'Advance Balance', type: 'currency', sortable: true, groupable: false, width: '140px', aggregate: 'sum' },

  // ─────────────────────────────────────────────────────────────────────────────
  // PAYROLL SUMMARY
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'salary_month', label: 'Salary Month', type: 'text', sortable: true, groupable: true, width: '120px' },
  { key: 'salary_year', label: 'Salary Year', type: 'text', sortable: true, groupable: true, width: '110px' },
  { key: 'payslip_no', label: 'Payslip No', type: 'text', sortable: true, groupable: false, width: '120px' },
  { key: 'payslip_date', label: 'Payslip Date', type: 'date', sortable: true, groupable: false, width: '120px' },
  { key: 'payment_date', label: 'Payment Date', type: 'date', sortable: true, groupable: false, width: '120px' },
  { key: 'payment_status', label: 'Payment Status', type: 'badge', sortable: true, groupable: true, width: '130px' },

  // ─────────────────────────────────────────────────────────────────────────────
  // ANALYSIS & COUNTS
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'employee_count', label: 'Employee Count', type: 'number', sortable: true, groupable: false, width: '130px', aggregate: 'sum' },
  { key: 'male_count', label: 'Male Count', type: 'number', sortable: true, groupable: false, width: '110px', aggregate: 'sum' },
  { key: 'female_count', label: 'Female Count', type: 'number', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'active_count', label: 'Active Count', type: 'number', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'resigned_count', label: 'Resigned Count', type: 'number', sortable: true, groupable: false, width: '130px', aggregate: 'sum' },
  { key: 'new_joinee_count', label: 'New Joinees', type: 'number', sortable: true, groupable: false, width: '120px', aggregate: 'sum' },
  { key: 'avg_salary', label: 'Avg Salary', type: 'currency', sortable: true, groupable: false, width: '120px' },
  { key: 'avg_experience', label: 'Avg Experience', type: 'number', sortable: true, groupable: false, width: '130px' },
  { key: 'headcount', label: 'Headcount', type: 'number', sortable: true, groupable: false, width: '110px', aggregate: 'sum' },

  // ─────────────────────────────────────────────────────────────────────────────
  // REMARKS & AUDIT
  // ─────────────────────────────────────────────────────────────────────────────
  { key: 'remarks', label: 'Remarks', type: 'text', sortable: false, groupable: false, width: '200px' },
  { key: 'notes', label: 'Notes', type: 'text', sortable: false, groupable: false, width: '200px' },
  { key: 'created_at', label: 'Created At', type: 'datetime', sortable: true, groupable: false, width: '160px' },
  { key: 'updated_at', label: 'Updated At', type: 'datetime', sortable: true, groupable: false, width: '160px' },
  { key: 'created_by', label: 'Created By', type: 'text', sortable: true, groupable: true, width: '140px' },
  { key: 'updated_by', label: 'Updated By', type: 'text', sortable: true, groupable: true, width: '140px' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN SETS FOR DIFFERENT REPORT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export const COLUMN_SETS = {
  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 1: EMPLOYEE DATA REPORTS (12)
  // ─────────────────────────────────────────────────────────────────────────────

  // 1. Employee Master List
  employee_master_list: [
    'employee_id', 'employee_name', 'department', 'designation',
    'staff_type', 'joining_date', 'employment_status', 'phone', 'email'
  ],

  // 2. Contact Directory
  contact_directory: [
    'employee_id', 'employee_name', 'department', 'designation',
    'phone', 'mobile', 'email', 'emergency_contact', 'emergency_contact_name'
  ],

  // 3. Teaching Staff List
  teaching_staff_list: [
    'employee_id', 'employee_name', 'designation', 'department',
    'subject_specialization', 'classes_assigned', 'class_teacher_of', 'phone'
  ],

  // 4. Non-Teaching Staff List
  non_teaching_staff_list: [
    'employee_id', 'employee_name', 'department', 'designation',
    'staff_type', 'joining_date', 'phone', 'employment_status'
  ],

  // 5. Department-wise List
  department_wise_list: [
    'department', 'employee_id', 'employee_name', 'designation',
    'staff_type', 'joining_date', 'phone', 'email'
  ],

  // 6. Designation-wise Report
  designation_wise_report: [
    'designation', 'employee_id', 'employee_name', 'department',
    'joining_date', 'experience_years', 'basic_salary', 'employment_status'
  ],

  // 7. Qualification Report
  qualification_report: [
    'employee_id', 'employee_name', 'department', 'designation',
    'highest_qualification', 'degree', 'university', 'passing_year', 'certifications'
  ],

  // 8. Birthday & Anniversary Report
  birthday_anniversary_report: [
    'employee_id', 'employee_name', 'department', 'designation',
    'date_of_birth', 'age', 'joining_date', 'service_years', 'phone'
  ],

  // 9. Employee ID Card Data
  employee_id_card: [
    'employee_id', 'employee_name', 'photo', 'department', 'designation',
    'blood_group', 'phone', 'emergency_contact', 'address'
  ],

  // 10. Address List Report
  address_list_report: [
    'employee_id', 'employee_name', 'department', 'designation',
    'current_address', 'permanent_address', 'city', 'state', 'pincode'
  ],

  // 11. Bank Details Report
  bank_details_report: [
    'employee_id', 'employee_name', 'department', 'designation',
    'bank_name', 'bank_account_no', 'ifsc_code', 'bank_branch', 'payment_mode'
  ],

  // 12. Statutory Documents Report
  statutory_documents_report: [
    'employee_id', 'employee_name', 'department', 'designation',
    'aadhaar_number', 'pan_number', 'pf_number', 'uan_number', 'esi_number'
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 2: ATTENDANCE & LEAVE REPORTS (10)
  // ─────────────────────────────────────────────────────────────────────────────

  // 13. Daily Staff Attendance
  daily_staff_attendance: [
    'employee_id', 'employee_name', 'department', 'designation',
    'attendance_date', 'in_time', 'out_time', 'work_hours', 'attendance_status'
  ],

  // 14. Monthly Attendance Summary
  monthly_attendance_summary: [
    'employee_id', 'employee_name', 'department', 'designation',
    'month', 'present_days', 'absent_days', 'half_days', 'late_days',
    'working_days', 'payable_days', 'attendance_percentage'
  ],

  // 15. Absentee Report
  absentee_report: [
    'employee_id', 'employee_name', 'department', 'designation',
    'attendance_date', 'attendance_status', 'leave_type', 'leave_reason'
  ],

  // 16. Late Coming Report
  late_coming_report: [
    'employee_id', 'employee_name', 'department', 'designation',
    'attendance_date', 'in_time', 'late_days', 'remarks'
  ],

  // 17. Leave Balance Report
  leave_balance_report: [
    'employee_id', 'employee_name', 'department', 'designation',
    'cl_balance', 'sl_balance', 'el_balance', 'ml_balance',
    'comp_off_balance', 'total_leave_balance'
  ],

  // 18. Leave Taken Report
  leave_taken_report: [
    'employee_id', 'employee_name', 'department', 'leave_type',
    'leave_from', 'leave_to', 'leave_days', 'leave_status', 'approved_by'
  ],

  // 19. Leave Application Status
  leave_application_status: [
    'employee_id', 'employee_name', 'department', 'leave_type',
    'leave_from', 'leave_to', 'leave_days', 'leave_reason',
    'leave_status', 'leave_application_date', 'approved_by'
  ],

  // 20. Attendance Percentage Report
  attendance_percentage_report: [
    'employee_id', 'employee_name', 'department', 'designation',
    'month', 'working_days', 'present_days', 'absent_days',
    'attendance_percentage', 'remarks'
  ],

  // 21. Overtime Report
  overtime_report: [
    'employee_id', 'employee_name', 'department', 'designation',
    'month', 'overtime_hours', 'overtime', 'remarks'
  ],

  // 22. Biometric Attendance Log
  biometric_attendance_log: [
    'employee_id', 'employee_name', 'department', 'attendance_date',
    'in_time', 'out_time', 'work_hours', 'attendance_status'
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 3: PAYROLL REPORTS (12)
  // ─────────────────────────────────────────────────────────────────────────────

  // 23. Monthly Salary Register
  monthly_salary_register: [
    'employee_id', 'employee_name', 'department', 'designation',
    'basic_salary', 'da', 'hra', 'total_earnings',
    'pf_deduction', 'esi_deduction', 'professional_tax', 'tds_deduction',
    'total_deductions', 'net_salary'
  ],

  // 24. Salary Slip Summary
  salary_slip_summary: [
    'employee_id', 'employee_name', 'department', 'designation',
    'salary_month', 'gross_salary', 'total_deductions', 'net_salary',
    'payable_days', 'payment_status'
  ],

  // 25. PF Report
  pf_report: [
    'employee_id', 'employee_name', 'department', 'designation',
    'pf_number', 'uan_number', 'basic_salary', 'employee_pf',
    'employer_pf', 'pf_deduction'
  ],

  // 26. ESI Report
  esi_report: [
    'employee_id', 'employee_name', 'department', 'designation',
    'esi_number', 'gross_salary', 'employee_esi', 'employer_esi', 'esi_deduction'
  ],

  // 27. Professional Tax Report
  professional_tax_report: [
    'employee_id', 'employee_name', 'department', 'designation',
    'state', 'gross_salary', 'professional_tax', 'salary_month'
  ],

  // 28. TDS Report
  tds_report: [
    'employee_id', 'employee_name', 'department', 'designation',
    'pan_number', 'gross_salary', 'ctc', 'tds_deduction', 'salary_month'
  ],

  // 29. Bank Transfer Report
  bank_transfer_report: [
    'employee_id', 'employee_name', 'department', 'bank_name',
    'bank_account_no', 'ifsc_code', 'net_salary', 'payment_date'
  ],

  // 30. Loan Outstanding Report
  loan_outstanding_report: [
    'employee_id', 'employee_name', 'department', 'designation',
    'loan_type', 'loan_amount', 'loan_balance', 'emi_amount',
    'remaining_installments', 'loan_date'
  ],

  // 31. Advance Payment Report
  advance_payment_report: [
    'employee_id', 'employee_name', 'department', 'designation',
    'advance_amount', 'advance_balance', 'advance_recovery', 'remarks'
  ],

  // 32. Salary Comparison Report
  salary_comparison_report: [
    'employee_id', 'employee_name', 'department', 'designation',
    'previous_salary', 'current_salary', 'increment_percentage', 'effective_date'
  ],

  // 33. Department-wise Salary Summary
  department_salary_summary: [
    'department', 'employee_count', 'total_earnings', 'total_deductions',
    'pf_deduction', 'esi_deduction', 'net_salary', 'avg_salary'
  ],

  // 34. Annual Salary Statement
  annual_salary_statement: [
    'employee_id', 'employee_name', 'department', 'designation',
    'ctc', 'gross_salary', 'total_earnings', 'total_deductions',
    'pf_deduction', 'tds_deduction', 'net_salary'
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 4: OTHER HR REPORTS (6)
  // ─────────────────────────────────────────────────────────────────────────────

  // 35. New Joinee Report
  new_joinee_report: [
    'employee_id', 'employee_name', 'department', 'designation',
    'joining_date', 'staff_type', 'highest_qualification', 'phone', 'email'
  ],

  // 36. Resignation Report
  resignation_report: [
    'employee_id', 'employee_name', 'department', 'designation',
    'joining_date', 'resignation_date', 'last_working_date',
    'service_years', 'separation_reason', 'full_final_status'
  ],

  // 37. Training Report
  training_report: [
    'employee_id', 'employee_name', 'department', 'designation',
    'training_name', 'training_type', 'training_from', 'training_to',
    'training_provider', 'training_status', 'certificate_received'
  ],

  // 38. Transfer Report
  transfer_report: [
    'employee_id', 'employee_name', 'department', 'designation',
    'transfer_date', 'from_branch', 'to_branch', 'from_department',
    'to_department', 'transfer_reason'
  ],

  // 39. Service Certificate Data
  service_certificate_data: [
    'employee_id', 'employee_name', 'department', 'designation',
    'joining_date', 'last_working_date', 'service_years',
    'separation_type', 'remarks'
  ],

  // 40. Employee Strength Analysis
  employee_strength_analysis: [
    'department', 'designation', 'employee_count', 'male_count',
    'female_count', 'active_count', 'avg_experience', 'avg_salary'
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get column definitions by keys
 * @param {string[]} keys - Array of column keys
 * @returns {Object[]} - Array of column definitions
 */
export const getColumns = (keys) => {
  return keys.map(key => {
    const column = HR_COLUMNS.find(col => col.key === key);
    if (!column) {
      console.warn(`HR Column not found: ${key}`);
      return { key, label: key, type: 'text', sortable: true, groupable: false, width: '100px' };
    }
    return { ...column };
  });
};

/**
 * Get all columns grouped by category
 * @returns {Object} - Columns grouped by category
 */
export const getColumnsByCategory = () => {
  return {
    'Employee Basic': HR_COLUMNS.filter(c => 
      ['employee_id', 'employee_code', 'employee_name', 'first_name', 'last_name', 
       'gender', 'date_of_birth', 'age', 'photo', 'blood_group', 'marital_status',
       'nationality', 'religion', 'caste', 'category'].includes(c.key)),
    'Contact Info': HR_COLUMNS.filter(c => 
      ['phone', 'mobile', 'secondary_mobile', 'email', 'personal_email', 'address',
       'permanent_address', 'current_address', 'city', 'state', 'pincode',
       'emergency_contact', 'emergency_contact_name', 'emergency_relation'].includes(c.key)),
    'Employment': HR_COLUMNS.filter(c => 
      ['department', 'designation', 'staff_type', 'employee_type', 'job_title',
       'grade', 'pay_scale', 'joining_date', 'confirmation_date', 'probation_end_date',
       'retirement_date', 'resignation_date', 'last_working_date', 'experience_years',
       'service_years', 'employment_status', 'reporting_to', 'branch_name', 'shift'].includes(c.key)),
    'Teaching Staff': HR_COLUMNS.filter(c => 
      ['is_teaching_staff', 'subject_specialization', 'subjects_assigned',
       'classes_assigned', 'class_teacher_of', 'weekly_workload', 'extra_curricular'].includes(c.key)),
    'Qualification': HR_COLUMNS.filter(c => 
      ['highest_qualification', 'degree', 'university', 'passing_year',
       'professional_qualification', 'certifications', 'previous_organization',
       'previous_designation', 'total_experience'].includes(c.key)),
    'Identity Documents': HR_COLUMNS.filter(c => 
      ['aadhaar_number', 'pan_number', 'passport_number', 'voter_id', 'driving_license'].includes(c.key)),
    'Bank & Salary': HR_COLUMNS.filter(c => 
      ['bank_name', 'bank_account_no', 'ifsc_code', 'bank_branch', 'pf_number',
       'uan_number', 'esi_number', 'pf_applicable', 'esi_applicable', 'tds_applicable', 'payment_mode'].includes(c.key)),
    'Earnings': HR_COLUMNS.filter(c => 
      ['basic_salary', 'gross_salary', 'net_salary', 'ctc', 'da', 'hra',
       'conveyance', 'medical_allowance', 'special_allowance', 'lta',
       'other_allowances', 'bonus', 'incentive', 'overtime', 'arrears', 'total_earnings'].includes(c.key)),
    'Deductions': HR_COLUMNS.filter(c => 
      ['pf_deduction', 'employer_pf', 'employee_pf', 'esi_deduction', 'employer_esi',
       'employee_esi', 'professional_tax', 'tds_deduction', 'loan_recovery',
       'advance_recovery', 'other_deductions', 'total_deductions', 'lop_deduction'].includes(c.key)),
    'Attendance': HR_COLUMNS.filter(c => 
      ['attendance_date', 'month', 'year', 'in_time', 'out_time', 'work_hours',
       'overtime_hours', 'attendance_status', 'present_days', 'absent_days',
       'half_days', 'late_days', 'early_leave_days', 'working_days', 'payable_days',
       'holidays', 'weekoffs', 'attendance_percentage'].includes(c.key)),
    'Leave': HR_COLUMNS.filter(c => 
      ['leave_type', 'leave_from', 'leave_to', 'leave_days', 'leave_reason',
       'leave_status', 'approved_by', 'cl_balance', 'sl_balance', 'el_balance',
       'ml_balance', 'comp_off_balance', 'total_leave_balance', 'cl_taken',
       'sl_taken', 'el_taken', 'lop_days', 'leave_application_date'].includes(c.key)),
  };
};

/**
 * Get columns for export
 * @param {string[]} keys - Array of column keys
 * @returns {Object[]} - Export-friendly column definitions
 */
export const getExportColumns = (keys) => {
  return getColumns(keys).map(col => ({
    key: col.key,
    label: col.label,
    type: col.type,
  }));
};

export default HR_COLUMNS;
