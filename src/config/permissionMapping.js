// === COMPREHENSIVE PATH-TO-SLUG MAPPING ===
// Maps URL path segments to actual database permission slugs
// Extracted from Sidebar.jsx for performance optimization

export const PATH_TO_SLUG_MAP = {
  // Academics
  'classes': 'classes', // DB: classes
  'promote_student': 'promote_students', // DB: promote_students
  'teacher_timetable': 'teacher_timetable',  // path is teacher-timetable, DB is teacher_timetable (SINGULAR, not teachers)
  'assign_class_teacher': 'assign_class_teacher', // DB: assign_class_teacher
  'sections': 'sections', // DB: sections
  'subjects': 'subjects', // DB: subjects
  'subject_group': 'subject_groups', // DB: subject_groups (PLURAL)
  'class_timetable': 'class_timetable', // DB: class_timetable

  // Human Resource - Major mismatches
  'approve_staff_leave': 'approve_leave_request', // DB: approve_leave_request
  'staff_apply_leave': 'apply_leave', // DB: apply_leave
  'staff_leave_type': 'leave_type', // DB: leave_type
  'departments': 'department', // DB: department
  'designations': 'designation', // DB: designation
  'employee_performance': 'teachers_rating', // Performance = teachers_rating in DB
  'employee_documents': 'staff_documents', // DB: staff_documents (if exists)
  'staff_directory': 'staff_directory', // DB: staff_directory
  'staff_attendance': 'staff_attendance', // DB: staff_attendance
  'payroll': 'payroll', // DB: payroll
  
  // Transport
  'vehicles': 'vehicles', // DB: vehicles
  'routes': 'routes', // DB: routes
  'assign_vehicle': 'assign_vehicle', // DB: assign_vehicle
  
  // Hostel
  'hostel_rooms': 'hostel_rooms', // DB: hostel_rooms
  'room_types': 'room_type',  // path is room-types, DB is room_type
  'hostels': 'hostel_list',        // path is hostels, DB is hostel_list
  
  // Fees
  'collect_fees': 'collect_fees',
  'search_fees_payment': 'search_fees_payment',
  'search_due_fees': 'search_due_fees',
  'fees_master': 'fees_master',
  'fees_group': 'fees_group',
  'fees_type': 'fees_type',
  'fees_discount': 'fees_discount',
  'fees_carry_forward': 'fees_carry_forward',
  'fees_reminder': 'fees_reminder',
  'offline_bank_payments': 'offline_bank_payments',
  
  // Front CMS
  'website_settings': 'website_settings',
  'general': 'general',
  'menus': 'menus',
  'pages': 'pages',
  'news': 'news',
  'notices': 'notices',
  'events': 'events',
  'gallery': 'gallery',
  'media': 'media',
  'banners': 'banners',
  'login_page': 'login_page',
  'layout': 'layout',
  
  // Students
  'admission': 'student_admission',
  'details': 'student_details',
  'categories': 'student_categories',
  'house': 'student_house',
  'disabled_students': 'disabled_students',
  'disable_reason': 'disable_reason',
  'bulk_delete': 'bulk_delete',
  'online_admission': 'online_admission',
  'multi_class': 'multi_class_student',

  // Communicate
  'notice_board': 'notice_board',
  'send_email': 'send_email',
  'send_sms': 'send_sms',
  'email_sms_log': 'email_sms_log',

  // Download Center
  'upload_content': 'upload_content',
  'assignments': 'assignments',
  'study_material': 'study_material',
  'syllabus': 'syllabus',
  'other_downloads': 'other_downloads',

  // Inventory
  'item_stock': 'item_stock',
  'add_item': 'add_item',
  'item_category': 'item_category',
  'item_store': 'item_store',
  'item_supplier': 'item_supplier',
  'issue_item': 'issue_item',

  // Library
  'book_list': 'book_list',
  'issue_return': 'issue_return',
  'add_student': 'add_student',
  'add_staff_member': 'add_staff_member',

  // Reports
  'student_information': 'report_student_information',
  'finance': 'report_finance',
  'attendance': 'report_attendance',
  'examinations': 'report_examinations',
  'online_examinations': 'report_online_examinations',
  'lesson_plan': 'report_lesson_plan',
  'human_resource': 'report_human_resource',
  'library': 'report_library',
  'inventory': 'report_inventory',
  'transport': 'report_transport',
  'hostel': 'report_hostel',
  'alumni': 'report_alumni',
  'user_log': 'user_log',
  'audit_trail': 'audit_trail',

  // Examinations - Phase 1 (Foundation)
  'board_configuration': 'board_configuration',
  'term_management': 'term_management',
  'exam_type_master': 'exam_type_master',
  'grade_scale_builder': 'grade_scale_builder',
  'exam_group_management': 'exam_group_management',
  // Phase 2 (Exam Planning)
  'exam_management': 'exam_management',
  'student_assignment': 'student_assignment',
  // Phase 3 (Scheduling)
  'room_management': 'room_management',
  'invigilator_duty': 'invigilator_duty',
  'seating_arrangement': 'seating_arrangement',
  'exam_calendar': 'exam_calendar',
  // Phase 4 (Evaluation)
  'marks_entry_new': 'marks_entry_new',
  'internal_assessment': 'internal_assessment',
  'practical_marks': 'practical_marks',
  'bulk_upload_marks': 'bulk_upload_marks',
  // Phase 5 (Results)
  'grace_marks': 'grace_marks',
  'moderation_engine': 'moderation_engine',
  'result_calculation': 'result_calculation',
  'rank_generation': 'rank_generation',
  // Phase 6 (Documents)
  'admit_card_designer': 'admit_card_designer',
  'marksheet_designer': 'marksheet_designer',
  'report_card_designer': 'report_card_designer',
  'bulk_document_generator': 'bulk_document_generator',
  // Phase 7 (Analytics & Online)
  'performance_dashboard': 'performance_dashboard',
  'question_bank': 'question_bank',
  'online_exam': 'online_exam',


  // Online Course
  'online_course': 'online_course_list',
  'offline_payment': 'offline_payment',
  'online_course_report': 'course_report',
  'setting': 'online_course_setting', // Assuming setting maps to online_course_setting or similar
  'course_category': 'course_category',

  // Behaviour Records
  'assign_incident': 'assign_incident',
  'incidents': 'incidents',
  'reports': 'behaviour_reports',
  'setting': 'setting',

  // Front Office
  'admission_enquiry': 'admission_enquiry',
  'visitor_book': 'visitor_book',
  'phone_call_log': 'phone_call_log',
  'postal_dispatch': 'postal_dispatch',
  'postal_receive': 'postal_receive',
  'complain': 'complain',
  'setup_front_office': 'setup_front_office',

  // Alumni
  'manage_alumni': 'manage_alumni',
  // 'events': 'alumni_events', // REMOVED: Causes collision with Front CMS Events

  // System Settings
  'general_setting': 'general_setting',
  'session_setting': 'session_setting',
  'notification_setting': 'notification_setting',
  'sms_setting': 'sms_setting',
  'email_setting': 'email_setting',
  'payment_methods': 'payment_methods',
  'print_header_footer': 'print_header_footer',
  'front_cms_setting': 'front_cms_setting',
  'roles_permissions': 'roles_permissions',
  'backup_restore': 'backup_restore',
  'languages': 'languages',
  'currency': 'currency',
  'users': 'users',
  'modules': 'modules',
  'custom_fields': 'custom_fields',
  'captcha_setting': 'captcha_setting',
  'system_fields': 'system_fields',
  'student_profile_update': 'student_profile_update',
  'online_admission_setting': 'online_admission_setting',
  'file_types': 'file_types',
  'sidebar_menu': 'sidebar_menu',
  'system_update': 'system_update',

  // Multi Branch
  'overview': 'branch_list',
  'add': 'add_branch',
  'settings': 'branch_settings',
  'report': 'branch_report',
};
