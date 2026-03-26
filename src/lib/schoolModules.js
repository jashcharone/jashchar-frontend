import { Layout } from 'lucide-react';

export const availableSchoolModules = [
  'front_cms', 'academics', 'student_information', 'fees_collection', 'finance',
  'human_resource', 'communicate', 'online_course', 'gmeet_live_classes',
  'library', 'inventory', 'transport', 'hostel', 'certificate',
  'behaviour_records', 'reports', 'system_settings',
  // Missing Core Modules
  'front_office', 'examinations', 'online_examinations', 'attendance',
  // New Modules
  'front_cms_manager', 'multi_branch', 'zoom_live', 'annual_calendar',
  'download_center', 'student_cv', 'alumni', 'system_utilities',
  'advanced_reports', 'lesson_planning_adv', 'online_exam_adv'
];

export const schoolModuleMap = {
  front_cms: {
    label: 'Front CMS',
    role: 'school_owner',
    subModules: {
      website_settings: 'Website Settings',
      banners: 'Banners',
      menus: 'Menus & Footer',
      pages: 'Pages',
      events: 'Events',
      news: 'News',
      gallery: 'Gallery',
      media: 'Media Manager'
    },
    sidebar: {
      title: 'Front CMS',
      icon: Layout,
      submenu: [
        { title: 'Website Settings', path: '/super-admin/front-cms/website-settings' },
        { title: 'Banners', path: '/super-admin/front-cms/banners' },
        { title: 'Menus & Footer', path: '/super-admin/front-cms/menus' },
        { title: 'Pages', path: '/super-admin/front-cms/pages' },
        { title: 'Events', path: '/super-admin/front-cms/events' },
        { title: 'News', path: '/super-admin/front-cms/news' },
        { title: 'Gallery', path: '/super-admin/front-cms/gallery' },
        { title: 'Achievements', path: '/super-admin/front-cms/achievements' },
        { title: 'Media Manager', path: '/super-admin/front-cms/media-manager' }
      ]
    }
  },
  front_office: {
    label: 'Front Office',
    role: 'school_owner',
    subModules: {
      admission_enquiry: 'Admission Enquiry',
      visitor_book: 'Visitor Book',
      phone_call_log: 'Phone Call Log',
      postal_dispatch: 'Postal Dispatch',
      postal_receive: 'Postal Receive',
      complain: 'Complain',
      setup_front_office: 'Setup Front Office'
    }
  },
  examinations: {
    label: 'Examinations',
    role: 'school_owner',
    subModules: {
      // Phase 1 - Foundation
      board_configuration: 'Board Configuration',
      term_management: 'Term Management',
      exam_type_master: 'Exam Type Master',
      grade_scale_builder: 'Grade Scale Builder',
      exam_group_management: 'Exam Group Setup',
      // Phase 2 - Exam Planning
      exam_management: 'Exam Management',
      student_assignment: 'Student Assignment',
      // Phase 3 - Scheduling
      room_management: 'Room Management',
      invigilator_duty: 'Invigilator Duty',
      seating_arrangement: 'Seating Arrangement',
      exam_calendar: 'Exam Calendar',
      // Phase 4 - Evaluation
      marks_entry_new: 'Marks Entry',
      internal_assessment: 'Internal Assessment',
      practical_marks: 'Practical Marks',
      bulk_upload_marks: 'Bulk Upload Marks',
      // Phase 5 - Results
      grace_marks: 'Grace Marks',
      moderation_engine: 'Moderation Engine',
      result_calculation: 'Result Calculation',
      rank_generation: 'Rank Generation',
      // Phase 6 - Documents
      admit_card_designer: 'Admit Card Designer',
      marksheet_designer: 'Marksheet Designer',
      report_card_designer: 'Report Card Designer',
      bulk_document_generator: 'Bulk Document Generator',
      // Phase 7 - Analytics
      performance_dashboard: 'Performance Dashboard',
      question_bank: 'Question Bank',
      online_exam: 'Online Exam'
    }
  },
  academics: { 
    label: 'Academics', 
    role: 'school_owner',
    subModules: {
      class_timetable: 'Class Timetable',
      teacher_timetable: 'Teacher Timetable',
      assign_class_teacher: 'Assign Class Teacher',
      promote_students: 'Promote Students',
      subject_groups: 'Subject Groups',
      subjects: 'Subjects',
      class: 'Class',
      sections: 'Sections'
    }
  },
  student_information: { 
    label: 'Student Information', 
    role: 'school_owner',
    subModules: {
      student_admission: 'Student Admission',
      student_details: 'Student Details',
      online_admission: 'Online Admission',
      // student_categories and student_house moved to Admission Form Settings tabs
      disabled_students: 'Disabled Students',
      disable_reason: 'Disable Reason',
      multi_class_student: 'Multi Class Student',
      bulk_delete: 'Bulk Delete'
    }
  },
  fees_collection: { 
    label: 'Fees Collection', 
    role: 'school_owner',
    subModules: {
      collect_fees: 'Collect Fees',
      offline_bank_payments: 'Offline Bank Payments',
      search_fees_payment: 'Search Fees Payment',
      search_due_fees: 'Search Due Fees',
      fees_master: 'Fees Master',
      fees_group: 'Fees Group',
      fees_type: 'Fees Type',
      fees_discount: 'Fees Discount',
      fees_carry_forward: 'Fees Carry Forward',
      fees_reminder: 'Fees Reminder'
    }
  },
  finance: { 
    label: 'Finance', 
    role: 'school_owner',
    subModules: {
      income: 'Income',
      income_head: 'Income Head',
      expense: 'Expense',
      expense_head: 'Expense Head'
    }
  },
  human_resource: { 
    label: 'Human Resource', 
    role: 'school_owner',
    subModules: {
      staff_directory: 'Staff Directory',
      staff_attendance: 'Staff Attendance',
      payroll: 'Payroll',
      approve_leave_request: 'Approve Leave Request',
      apply_leave: 'Apply Leave',
      leave_type: 'Leave Type',
      teachers_rating: 'Teachers Rating',
      department: 'Department',
      designation: 'Designation'
    }
  },
  communicate: { 
    label: 'Communicate', 
    role: 'school_owner',
    subModules: {
      notice_board: 'Notice Board',
      send_email: 'Send Email',
      send_sms: 'Send SMS',
      email_sms_log: 'Email / SMS Log',
      login_credentials_send: 'Login Credentials Send'
    }
  },
  attendance: { 
    label: 'Attendance', 
    role: 'school_owner',
    subModules: {
      student_attendance: 'Student Attendance',
      attendance_by_date: 'Attendance By Date',
      approve_leave: 'Approve Leave',
      staff_attendance: 'Staff Attendance'
    }
  },
  online_course: { 
    label: 'Online Course', 
    role: 'school_owner',
    subModules: {
      online_course_list: 'Online Course',
      course_category: 'Course Category',
      course_report: 'Course Report',
      setting: 'Setting'
    }
  },
  gmeet_live_classes: { 
    label: 'Gmeet Live Classes', 
    role: 'school_owner',
    subModules: {
      live_class: 'Live Class',
      live_meeting: 'Live Meeting',
      settings: 'Settings'
    }
  },
  library: { 
    label: 'Library', 
    role: 'school_owner',
    subModules: {
      book_list: 'Book List',
      issue_return: 'Issue Return',
      add_student: 'Add Student',
      add_staff_member: 'Add Staff Member'
    }
  },
  inventory: { 
    label: 'Inventory', 
    role: 'school_owner',
    subModules: {
      issue_item: 'Issue Item',
      item_stock: 'Item Stock',
      item_store: 'Item Store',
      item_supplier: 'Item Supplier',
      item_category: 'Item Category'
    }
  },
  transport: { 
    label: 'Transport', 
    role: 'school_owner',
    subModules: {
      routes: 'Routes',
      vehicles: 'Vehicles',
      assign_vehicle: 'Assign Vehicle',
      student_transport_report: 'Student Transport Report'
    }
  },
  hostel: { 
    label: 'Hostel', 
    role: 'school_owner',
    subModules: {
      hostel_rooms: 'Hostel Rooms',
      room_type: 'Room Type',
      hostel_list: 'Hostel'
    }
  },
  certificate: { 
    label: 'Certificate', 
    role: 'school_owner',
    subModules: {
      student_certificate: 'Student Certificate',
      generate_certificate: 'Generate Certificate',
      student_id_card: 'Student ID Card',
      generate_id_card: 'Generate ID Card'
    }
  },
  behaviour_records: { 
    label: 'Behaviour Records', 
    role: 'school_owner',
    subModules: {
      assign_incident: 'Assign Incident',
      incidents: 'Incidents',
      behaviour_reports: 'Reports',
      setting: 'Setting'
    }
  },
  reports: { 
    label: 'Reports', 
    role: 'school_owner',
    subModules: {
      report_student_information: 'Student Information',
      report_finance: 'Finance',
      report_attendance: 'Attendance',
      report_examinations: 'Examinations',
      report_human_resource: 'Human Resource',
      report_library: 'Library',
      report_transport: 'Transport',
      report_hostel: 'Hostel',
      report_homework: 'Homework',
      homework_evaluation: 'Homework Evaluation'
    }
  },
  system_settings: { 
    label: 'System Settings', 
    role: 'school_owner',
    subModules: {
      general_setting: 'General Setting',
      session_setting: 'Session Setting',
      notification_setting: 'Notification Setting',
      sms_setting: 'SMS Setting',
      email_setting: 'Email Setting',
      payment_methods: 'Payment Methods',
      print_header_footer: 'Print Header Footer',
      front_cms_setting: 'Front CMS Setting',
      roles_permissions: 'Roles Permissions',
      backup_restore: 'Backup Restore',
      languages: 'Languages',
      users: 'Users',
      modules: 'Modules',
      custom_fields: 'Custom Fields',
      captcha_setting: 'Captcha Setting',
      system_fields: 'System Fields',
      student_profile_update: 'Student Profile Update',
      online_admission_setting: 'Online Admission Setting',
      file_types: 'File Types'
    }
  },
  // --- NEW MODULES ---
  front_cms_manager: { label: 'Website Manager', role: 'school_owner' },
  multi_branch: { 
    label: 'Multi Branch', 
    role: 'school_owner',
    subModules: {
      branch_list: 'Branch List',
      add_branch: 'Add Branch',
      branch_settings: 'Branch Settings',
      branch_report: 'Branch Report'
    }
  },
  zoom_live: { label: 'Zoom Live Classes', role: 'school_owner' },
  annual_calendar: { label: 'Annual Calendar', role: 'school_owner' },
  download_center: { label: 'Download Center', role: 'school_owner' },
  student_cv: { label: 'Student CV', role: 'school_owner' },
  alumni: { label: 'Alumni', role: 'school_owner' },
  system_utilities: { label: 'System Utilities', role: 'school_owner' },
  advanced_reports: { label: 'Audit & Logs', role: 'school_owner' },
  lesson_planning_adv: { label: 'Lesson Planning (Adv)', role: 'school_owner' },
  online_exam_adv: { label: 'Online Exam Pro', role: 'school_owner' }
};
