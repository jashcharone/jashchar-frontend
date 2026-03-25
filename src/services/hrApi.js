/**
 * HR API Service
 * Frontend service for HR Module APIs
 */

import api from '@/lib/api';  // FIXED: Use the authenticated api from lib, not services

const hrApi = {
    // ═══════════════════════════════════════════════════════════════════════════
    // EMPLOYEES
    // ═══════════════════════════════════════════════════════════════════════════
    
    getEmployees: (params) => api.get('/hr-module/employees', { params }),
    getEmployeeById: (id) => api.get(`/hr-module/employees/${id}`),
    createEmployee: (data) => api.post('/hr-module/employees', data),
    updateEmployee: (id, data) => api.put(`/hr-module/employees/${id}`, data),
    deleteEmployee: (id) => api.delete(`/hr-module/employees/${id}`),
    
    // ═══════════════════════════════════════════════════════════════════════════
    // HR DEPARTMENTS
    // ═══════════════════════════════════════════════════════════════════════════
    
    getHrDepartments: (params) => api.get('/hr-module/hr-departments', { params }),
    createHrDepartment: (data) => api.post('/hr-module/hr-departments', data),
    updateHrDepartment: (id, data) => api.put(`/hr-module/hr-departments/${id}`, data),
    deleteHrDepartment: (id) => api.delete(`/hr-module/hr-departments/${id}`),
    
    // ═══════════════════════════════════════════════════════════════════════════
    // HR DESIGNATIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    getHrDesignations: (params) => api.get('/hr-module/hr-designations', { params }),
    createHrDesignation: (data) => api.post('/hr-module/hr-designations', data),
    updateHrDesignation: (id, data) => api.put(`/hr-module/hr-designations/${id}`, data),
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SHIFTS
    // ═══════════════════════════════════════════════════════════════════════════
    
    getShifts: (params) => api.get('/hr-module/shifts', { params }),
    createShift: (data) => api.post('/hr-module/shifts', data),
    updateShift: (id, data) => api.put(`/hr-module/shifts/${id}`, data),
    deleteShift: (id) => api.delete(`/hr-module/shifts/${id}`),
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ATTENDANCE LOGS
    // ═══════════════════════════════════════════════════════════════════════════
    
    getAttendanceLogs: (params) => api.get('/hr-module/attendance-logs', { params }),
    markAttendance: (data) => api.post('/hr-module/attendance-logs', data),
    bulkMarkAttendance: (data) => api.post('/hr-module/attendance-logs/bulk', data),
    
    // ═══════════════════════════════════════════════════════════════════════════
    // LEAVE TYPES
    // ═══════════════════════════════════════════════════════════════════════════
    
    getLeaveTypes: (params) => api.get('/hr-module/leave-types-v2', { params }),
    createLeaveType: (data) => api.post('/hr-module/leave-types-v2', data),
    updateLeaveType: (id, data) => api.put(`/hr-module/leave-types-v2/${id}`, data),
    
    // ═══════════════════════════════════════════════════════════════════════════
    // LEAVE APPLICATIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    getLeaveApplications: (params) => api.get('/hr-module/leave-applications', { params }),
    applyLeave: (data) => api.post('/hr-module/leave-applications', data),
    updateLeaveStatus: (id, data) => api.put(`/hr-module/leave-applications/${id}/status`, data),
    
    // ═══════════════════════════════════════════════════════════════════════════
    // LEAVE BALANCE
    // ═══════════════════════════════════════════════════════════════════════════
    
    getLeaveBalance: (params) => api.get('/hr-module/leave-balance', { params }),
    initializeLeaveBalance: (data) => api.post('/hr-module/leave-balance/initialize', data),
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SALARY COMPONENTS
    // ═══════════════════════════════════════════════════════════════════════════
    
    getSalaryComponents: (params) => api.get('/hr-module/salary-components', { params }),
    createSalaryComponent: (data) => api.post('/hr-module/salary-components', data),
    updateSalaryComponent: (id, data) => api.put(`/hr-module/salary-components/${id}`, data),
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SALARY TEMPLATES
    // ═══════════════════════════════════════════════════════════════════════════
    
    getSalaryTemplates: (params) => api.get('/hr-module/salary-templates', { params }),
    createSalaryTemplate: (data) => api.post('/hr-module/salary-templates', data),
    
    // ═══════════════════════════════════════════════════════════════════════════
    // EMPLOYEE SALARY
    // ═══════════════════════════════════════════════════════════════════════════
    
    getEmployeeSalary: (employeeId) => api.get(`/hr-module/employee-salary/${employeeId}`),
    setEmployeeSalary: (data) => api.post('/hr-module/employee-salary', data),
    
    // ═══════════════════════════════════════════════════════════════════════════
    // EMPLOYEE LOANS
    // ═══════════════════════════════════════════════════════════════════════════
    
    getLoans: (params) => api.get('/hr-module/loans', { params }),
    createLoan: (data) => api.post('/hr-module/loans', data),
    approveLoan: (id, data) => api.put(`/hr-module/loans/${id}/approve`, data),
    getLoanTransactions: (loanId) => api.get(`/hr-module/loans/${loanId}/transactions`),
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PAYROLL RUN
    // ═══════════════════════════════════════════════════════════════════════════
    
    getPayrollRuns: (params) => api.get('/hr-module/payroll-runs', { params }),
    createPayrollRun: (data) => api.post('/hr-module/payroll-runs', data),
    processPayroll: (id) => api.post(`/hr-module/payroll-runs/${id}/process`),
    getPayrollDetails: (payrollId) => api.get(`/hr-module/payroll-runs/${payrollId}/details`),
    approvePayroll: (id, data) => api.put(`/hr-module/payroll-runs/${id}/approve`, data),
    markPayrollPaid: (id, data) => api.put(`/hr-module/payroll-runs/${id}/mark-paid`, data),
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PAYSLIPS
    // ═══════════════════════════════════════════════════════════════════════════
    
    generatePayslips: (payrollId) => api.post(`/hr-module/payroll-runs/${payrollId}/generate-payslips`),
    getPayslip: (params) => api.get('/hr-module/payslip', { params }),
    
    // ═══════════════════════════════════════════════════════════════════════════
    // COMPLIANCE SETTINGS
    // ═══════════════════════════════════════════════════════════════════════════
    
    getPfSettings: (params) => api.get('/hr-module/compliance/pf-settings', { params }),
    savePfSettings: (data) => api.post('/hr-module/compliance/pf-settings', data),
    
    getEsiSettings: (params) => api.get('/hr-module/compliance/esi-settings', { params }),
    saveEsiSettings: (data) => api.post('/hr-module/compliance/esi-settings', data),
    
    getPtSlabs: (params) => api.get('/hr-module/compliance/pt-slabs', { params }),
    savePtSlabs: (data) => api.post('/hr-module/compliance/pt-slabs', data),
    
    getTdsSlabs: (params) => api.get('/hr-module/compliance/tds-slabs', { params }),
    
    // ═══════════════════════════════════════════════════════════════════════════
    // HR SETTINGS
    // ═══════════════════════════════════════════════════════════════════════════
    
    getOrgHrSettings: (params) => api.get('/hr-module/settings/organization', { params }),
    saveOrgHrSettings: (data) => api.post('/hr-module/settings/organization', data),
    
    getBranchHrSettings: (params) => api.get('/hr-module/settings/branch', { params }),
    saveBranchHrSettings: (data) => api.post('/hr-module/settings/branch', data),
    
    // ═══════════════════════════════════════════════════════════════════════════
    // HOLIDAY CALENDAR
    // ═══════════════════════════════════════════════════════════════════════════
    
    getHolidayCalendars: (params) => api.get('/hr-module/holiday-calendars', { params }),
    createHolidayCalendar: (data) => api.post('/hr-module/holiday-calendars', data),
    addHoliday: (data) => api.post('/hr-module/holidays', data),
    deleteHoliday: (id) => api.delete(`/hr-module/holidays/${id}`),

    // ═══════════════════════════════════════════════════════════════════════════
    // EMPLOYEE PERFORMANCE REVIEWS
    // ═══════════════════════════════════════════════════════════════════════════

    getPerformanceReviews: (params) => api.get('/hr-module/performance-reviews', { params }),
    getPerformanceStaffList: (params) => api.get('/hr-module/performance-reviews/staff', { params }),
    createPerformanceReview: (data) => api.post('/hr-module/performance-reviews', data),
};

export default hrApi;
