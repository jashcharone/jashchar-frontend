import React from 'react';

// Import all diagnostics targets
// NOTE: SchoolOwnerDiagnostics is purposefully NOT imported here to avoid circular dependency.
// It is injected manually in the SchoolOwnerDiagnostics.jsx file.

// Front Office
import AdmissionEnquiry from '@/pages/super-admin/front-office/AdmissionEnquiry';
import VisitorBook from '@/pages/super-admin/front-office/VisitorBook';
import PhoneCallLog from '@/pages/super-admin/front-office/PhoneCallLog';
import PostalDispatch from '@/pages/super-admin/front-office/PostalDispatch';
import PostalReceive from '@/pages/super-admin/front-office/PostalReceive';
import Complain from '@/pages/super-admin/front-office/Complain';
import SetupFrontOffice from '@/pages/super-admin/front-office/SetupFrontOffice';

// Student Info
import StudentDetails from '@/pages/super-admin/student-information/StudentDetails';
import StudentAdmission from '@/pages/super-admin/student-information/StudentAdmission';
import OnlineAdmission from '@/pages/public/OnlineAdmission'; // Note: using public one for now as it seems shared
import DisabledStudents from '@/pages/super-admin/student-information/DisabledStudents';
import BulkDelete from '@/pages/super-admin/student-information/BulkDelete';
// StudentCategories and StudentHouse - embedded in AdmissionFormSettings tabs only
import DisableReason from '@/pages/super-admin/student-information/DisableReason';
import AdmissionFormSettings from '@/pages/super-admin/student-information/AdmissionFormSettings';
import MultiClassStudent from '@/pages/super-admin/student-information/MultiClassStudent';

// Fees
import CollectFees from '@/pages/super-admin/fees-collection/CollectFees';
import SearchFeesPayment from '@/pages/super-admin/fees-collection/SearchFeesPayment';
import SearchDueFees from '@/pages/super-admin/fees-collection/SearchDueFees';
import FeesMaster from '@/pages/super-admin/fees-collection/FeesMaster';
import FeesGroup from '@/pages/super-admin/fees-collection/FeesGroup';
import FeesType from '@/pages/super-admin/fees-collection/FeesType';
import FeesDiscount from '@/pages/super-admin/fees-collection/FeesDiscount';
import FeesCarryForward from '@/pages/super-admin/fees-collection/FeesCarryForward';
import FeesReminder from '@/pages/super-admin/fees-collection/FeesReminder';

// Finance
import Income from '@/pages/super-admin/finance/Income';
import Expense from '@/pages/super-admin/finance/Expense';
import IncomeHead from '@/pages/super-admin/finance/IncomeHead';
import ExpenseHead from '@/pages/super-admin/finance/ExpenseHead';

// Attendance
import StudentAttendance from '@/pages/super-admin/attendance/StudentAttendance';
import AttendanceByDate from '@/pages/super-admin/attendance/AttendanceByDate';
import ApproveLeave from '@/pages/super-admin/attendance/ApproveStudentLeave';

// Examinations (New Examination Engine)
import ExamGroupManagement from '@/pages/super-admin/examinations/ExamGroupManagement';
import ExamCalendar from '@/pages/super-admin/examinations/ExamCalendar';
import ResultCalculationPage from '@/pages/super-admin/examinations/ResultCalculationPage';
import MarksheetDesignerPage from '@/pages/super-admin/examinations/MarksheetDesignerPage';
import GradeScaleBuilder from '@/pages/super-admin/examinations/GradeScaleBuilder';

// Academics
import ClassTimetable from '@/pages/super-admin/academics/ClassTimetable';
import TeacherTimetable from '@/pages/super-admin/academics/TeacherTimetable';
import AssignClassTeacher from '@/pages/super-admin/academics/AssignClassTeacher';
import PromoteStudents from '@/pages/super-admin/academics/PromoteStudent';
import Subjects from '@/pages/super-admin/academics/Subjects';
import Classes from '@/pages/super-admin/academics/Classes';
import Sections from '@/pages/super-admin/academics/Sections';
import SubjectGroup from '@/pages/super-admin/academics/SubjectGroup';

// HR
import StaffDirectory from '@/pages/super-admin/human-resource/StaffDirectory';
import StaffAttendance from '@/pages/super-admin/human-resource/StaffAttendance';
import ApproveLeaveRequest from '@/pages/super-admin/human-resource/ApproveStaffLeave';
import ApplyLeave from '@/pages/super-admin/human-resource/StaffApplyLeave';
import LeaveTypes from '@/pages/super-admin/human-resource/StaffLeaveType';
import Departments from '@/pages/super-admin/human-resource/Departments';
import Designations from '@/pages/super-admin/human-resource/Designations';

// Communicate
import NoticeBoard from '@/pages/super-admin/communicate/NoticeBoard';
import SendEmail from '@/pages/super-admin/communicate/SendEmail';
import SendSMS from '@/pages/super-admin/communicate/SendSms';
import EmailLog from '@/pages/super-admin/communicate/EmailSmsLog';

// Library
import BookList from '@/pages/super-admin/library/BookList';
import IssueReturn from '@/pages/super-admin/library/IssueReturn';
import AddStudent from '@/pages/super-admin/library/AddStudent';
import AddStaff from '@/pages/super-admin/library/AddStaffMember';

// Inventory
import IssueItem from '@/pages/super-admin/inventory/IssueItem';
import AddItemStock from '@/pages/super-admin/inventory/AddItemStock';
import AddItem from '@/pages/super-admin/inventory/AddItem';
import ItemCategory from '@/pages/super-admin/inventory/ItemCategory';
import ItemStore from '@/pages/super-admin/inventory/ItemStore';
import ItemSupplier from '@/pages/super-admin/inventory/ItemSupplier';

// Transport
import Routes from '@/pages/super-admin/transport/TransportRoutes';
import Vehicles from '@/pages/super-admin/transport/TransportVehicles';
import AssignVehicle from '@/pages/super-admin/transport/AssignVehicle';
import StudentTransportFees from '@/pages/super-admin/transport/StudentTransportFees';

// Hostel
import HostelRooms from '@/pages/super-admin/hostel/HostelRooms';
import RoomType from '@/pages/super-admin/hostel/RoomTypes';
import Hostel from '@/pages/super-admin/hostel/Hostels';

// Certificate
import StudentCertificate from '@/pages/super-admin/certificate/StudentCertificate';
import GenerateCertificate from '@/pages/super-admin/certificate/GenerateCertificate';
import StudentIDCard from '@/pages/super-admin/certificate/StudentIDCard';
import GenerateIDCard from '@/pages/super-admin/certificate/GenerateIDCard';

// Front CMS
import CmsSetting from '@/pages/super-admin/front-cms/FrontCMSSetting';
import Menus from '@/pages/super-admin/front-cms/Menus';
import BannerImages from '@/pages/super-admin/front-cms/BannerImages';
import Pages from '@/pages/super-admin/front-cms/Pages';
import News from '@/pages/super-admin/front-cms/News';
import Gallery from '@/pages/super-admin/front-cms/Gallery';
import Events from '@/pages/super-admin/front-cms/Events';
import MediaManager from '@/pages/super-admin/front-cms/MediaManager';
import FrontCmsSchoolOwner from '@/pages/super-admin/front-cms/FrontCmsSchoolOwner'; // NEW Phase 1C
import FrontCMSSetting from '@/pages/super-admin/front-cms/FrontCMSSetting';

// Reports
import StudentInformationReport from '@/pages/super-admin/reports/student-information/StudentInformationReport';
import FinanceReport from '@/pages/super-admin/reports/finance/IncomeReport'; // Using Income Report as placeholder for general finance
import AttendanceReport from '@/pages/super-admin/reports/attendance/StudentAttendanceTypeReport';
import ExaminationsReport from '@/pages/super-admin/examinations/ResultCalculationPage'; // Placeholder
import LibraryReport from '@/pages/super-admin/reports/library/BookInventoryReport';
import InventoryReport from '@/pages/super-admin/reports/library/BookInventoryReport'; // Placeholder
import HostelReport from '@/pages/super-admin/reports/HostelReport';
import TransportReport from '@/pages/super-admin/reports/StudentTransportReport';
import HumanResourceReport from '@/pages/super-admin/reports/finance/PayrollReport';

// System Settings
import GeneralSetting from '@/pages/super-admin/system-settings/GeneralSetting';
import RolePermissionSchool from '@/pages/super-admin/system-settings/RolePermission';
import SessionSetting from '@/pages/super-admin/system-settings/SessionSetting';
import NotificationSetting from '@/pages/super-admin/system-settings/NotificationSetting';
import SmsSetting from '@/pages/super-admin/system-settings/SmsSetting';
import EmailSetting from '@/pages/super-admin/system-settings/EmailSetting';
import PaymentMethods from '@/pages/super-admin/system-settings/PaymentMethods';
import PrintHeaderFooter from '@/pages/super-admin/system-settings/PrintHeaderFooter';
import BackupRestore from '@/pages/super-admin/system-settings/BackupRestore';

// Profile
import SchoolOwnerProfile from '@/pages/super-admin/SchoolOwnerProfile';
import MySubscription from '@/pages/super-admin/subscription/MySubscriptionPlan';

// Others
import Homework from '@/pages/super-admin/homework/HomeworkList';
import GMeetLiveClasses from '@/pages/super-admin/gmeet-live-classes/LiveClasses';
import LiveMeeting from '@/pages/super-admin/gmeet-live-classes/LiveMeeting';
import LiveClassesReport from '@/pages/super-admin/gmeet-live-classes/LiveClassesReport';
import LiveMeetingReport from '@/pages/super-admin/gmeet-live-classes/LiveMeetingReport';
import GmeetSetting from '@/pages/super-admin/gmeet-live-classes/GmeetSetting';
import OnlineCourse from '@/pages/super-admin/online-course/OnlineCourse';
import OnlineCourseReport from '@/pages/super-admin/online-course/OnlineCourseReport';
import OnlineCourseSetting from '@/pages/super-admin/online-course/Setting';
import AssignIncident from '@/pages/super-admin/behaviour-records/AssignIncident';
import BehaviourIncidents from '@/pages/super-admin/behaviour-records/Incidents';
import BehaviourReports from '@/pages/super-admin/behaviour-records/Reports';
import BehaviourSetting from '@/pages/super-admin/behaviour-records/BehaviourSetting';
import Alumni from '@/pages/super-admin/Alumni';
import Calendar from '@/pages/super-admin/Calendar';
import MultiBranch from '@/pages/super-admin/MultiBranch';
import OnlineExam from '@/pages/super-admin/OnlineExam';
import LessonPlan from '@/pages/super-admin/LessonPlan';
import DownloadCenter from '@/pages/super-admin/DownloadCenter';
import ZoomLiveClasses from '@/pages/super-admin/ZoomLiveClasses';
import QrCodeAttendance from '@/pages/super-admin/QrCodeAttendance';
import OfflineBankPayment from '@/pages/super-admin/OfflineBankPayment';
import QuestionBank from '@/pages/super-admin/QuestionBank';

// Master Admin Imports
import MasterAdminDashboard from '@/pages/master-admin/MasterAdminDashboard';
import SchoolsPage from '@/pages/master-admin/SchoolsPage';
import SchoolRequests from '@/pages/master-admin/SchoolRequests';
import Articles from '@/pages/master-admin/articles/Articles';
import SubscriptionPlans from '@/pages/master-admin/subscriptions/SubscriptionPlans';
import SubscriptionsList from '@/pages/master-admin/subscriptions/SubscriptionsList';
import SubscriptionInvoices from '@/pages/master-admin/subscriptions/SubscriptionInvoices';
import SubscriptionTransactions from '@/pages/master-admin/subscriptions/SubscriptionTransactions';
import BillingAudit from '@/pages/master-admin/subscriptions/BillingAudit';
import GenerateBill from '@/pages/master-admin/subscriptions/GenerateBill';
import BulkInvoiceGenerator from '@/pages/master-admin/subscriptions/BulkInvoiceGenerator';
import QueriesFinder from '@/pages/master-admin/system-settings/QueriesFinder';
import DomainList from '@/pages/master-admin/custom-domain/DomainList';
import RolePermission from '@/pages/master-admin/RolePermission';
import CommunicationSettings from '@/pages/master-admin/system-settings/CommunicationSettings';
import EmailSettings from '@/pages/master-admin/system-settings/EmailSettings';
import PaymentSettings from '@/pages/master-admin/system-settings/PaymentSettings';
import LoginPageSettings from '@/pages/master-admin/system-settings/LoginPageSettings';
import SessionSettingMaster from '@/pages/master-admin/system-settings/SessionSetting';
import MasterDataSettings from '@/pages/master-admin/system-settings/MasterDataSettings';
import ExportImport from '@/pages/master-admin/system-settings/ExportImport';
import ModuleHealth from '@/pages/master-admin/ModuleHealth';
import DemoAutomationV2 from '@/pages/master-admin/DemoAutomationV2';
import EnterpriseHealthMonitor from '@/pages/master-admin/EnterpriseHealthMonitor';
import SaasWebsiteSettings from '@/pages/master-admin/SaasWebsiteSettings';
import FrontCmsMasterAdmin from '@/pages/master-admin/front-cms/FrontCmsMasterAdmin';
import SchoolBranches from '@/pages/master-admin/branch-management/SchoolBranches';
import WhatsAppManager from '@/pages/master-admin/whatsapp/WhatsAppManager';

export const ROUTE_COMPONENT_MAP = {
  // Master Admin Routes
  '/master-admin/dashboard': MasterAdminDashboard,
  '/master-admin/schools': SchoolsPage,
  '/master-admin/school-requests': SchoolRequests,
  '/master-admin/branch-management': SchoolBranches,
  '/master-admin/articles': Articles,
  '/master-admin/subscription-plans': SubscriptionPlans,
  '/master-admin/subscriptions': SubscriptionsList,
  '/master-admin/subscription-invoices': SubscriptionInvoices,
  '/master-admin/subscription-transactions': SubscriptionTransactions,
  '/master-admin/billing-audit': BillingAudit,
  '/master-admin/subscriptions/bill/new': GenerateBill,
  '/master-admin/subscriptions/bulk-invoice': BulkInvoiceGenerator,
  '/master-admin/queries-finder': QueriesFinder,
  '/master-admin/custom-domain': DomainList,
  '/master-admin/role-permission': RolePermission,
  '/master-admin/communication-settings': CommunicationSettings,
  '/master-admin/whatsapp-manager': WhatsAppManager,
  '/master-admin/email-settings': EmailSettings,
  '/master-admin/payment-settings': PaymentSettings,
  '/master-admin/login-page-settings': LoginPageSettings,
  '/master-admin/session-setting': SessionSettingMaster,
  '/master-admin/master-data-settings': MasterDataSettings,
  '/master-admin/export-import': ExportImport,
  '/master-admin/module-health': ModuleHealth,
  '/master-admin/demo-automation-v2': DemoAutomationV2,
  '/master-admin/enterprise-health-monitor': EnterpriseHealthMonitor,
  '/master-admin/saas-website-settings': SaasWebsiteSettings,
  '/master-admin/front-cms': FrontCmsMasterAdmin,
  '/master-admin/front-cms/website-settings': FrontCmsMasterAdmin,
  '/master-admin/front-cms/menus': FrontCmsMasterAdmin,
  '/master-admin/front-cms/pages': FrontCmsMasterAdmin,
  '/master-admin/front-cms/gallery': FrontCmsMasterAdmin,
  '/master-admin/front-cms/news': FrontCmsMasterAdmin,
  '/master-admin/front-cms/media': FrontCmsMasterAdmin,
  '/master-admin/front-cms/banners': FrontCmsMasterAdmin,

  // Self-reference removed to prevent circular dependency
  // '/master-admin/school-owner-diagnostics': SchoolOwnerDiagnostics,
  
  // Front Office
  '/school-owner/front-office/admission-enquiry': AdmissionEnquiry,
  '/school-owner/front-office/visitor-book': VisitorBook,
  '/school-owner/front-office/phone-call-log': PhoneCallLog,
  '/school-owner/front-office/postal-dispatch': PostalDispatch,
  '/school-owner/front-office/postal-receive': PostalReceive,
  '/school-owner/front-office/complain': Complain,
  '/school-owner/front-office/setup-front-office': SetupFrontOffice,

  // Student Information
  '/school-owner/student-information/student-details': StudentDetails,
  '/school-owner/student-information/student-admission': StudentAdmission,
  '/school-owner/student-information/online-admission': OnlineAdmission,
  '/school-owner/student-information/disabled-students': DisabledStudents,
  '/school-owner/student-information/bulk-delete': BulkDelete,
  // student-categories and student-house moved to admission-form-settings tabs
  '/school-owner/student-information/disable-reason': DisableReason,
  '/school-owner/student-information/admission-form-settings': AdmissionFormSettings,
  '/school-owner/student-information/multi-class': MultiClassStudent,

  // Behaviour Records
  '/school-owner/behaviour-records/assign-incident': AssignIncident,
  '/school-owner/behaviour-records/incidents': BehaviourIncidents,
  '/school-owner/behaviour-records/reports': BehaviourReports,
  '/school-owner/behaviour-records/setting': BehaviourSetting,

  // Fees Collection
  '/school-owner/fees-collection/collect-fees': CollectFees,
  '/school-owner/online-course/offline-payment': OfflineBankPayment,
  '/school-owner/online-course/online-course-report': OnlineCourseReport,
  '/school-owner/online-course/setting': OnlineCourseSetting,

  // Gmeet Live Classes
  '/school-owner/gmeet-live-classes/live-classes': GMeetLiveClasses,
  '/school-owner/gmeet-live-classes/live-meeting': LiveMeeting,
  '/school-owner/gmeet-live-classes/live-classes-report': LiveClassesReport,
  '/school-owner/gmeet-live-classes/live-meeting-report': LiveMeetingReport,
  '/school-owner/gmeet-live-classes/setting': GmeetSetting,
  '/school-owner/fees-collection/search-fees-payment': SearchFeesPayment,
  '/school-owner/fees-collection/search-due-fees': SearchDueFees,
  '/school-owner/fees-collection/fees-master': FeesMaster,
  '/school-owner/fees-collection/fees-group': FeesGroup,
  '/school-owner/fees-collection/fees-type': FeesType,
  '/school-owner/fees-collection/fees-discount': FeesDiscount,
  '/school-owner/fees-collection/fees-carry-forward': FeesCarryForward,
  '/school-owner/fees-collection/fees-reminder': FeesReminder,

  // Finance
  '/school-owner/finance/income': Income,
  '/school-owner/finance/expense': Expense,
  '/school-owner/finance/income-head': IncomeHead,
  '/school-owner/finance/expense-head': ExpenseHead,

  // Attendance
  '/school-owner/attendance/student-attendance': StudentAttendance,
  '/school-owner/attendance/attendance-by-date': AttendanceByDate,
  '/school-owner/attendance/approve-leave': ApproveLeave,

  // Examinations (New Examination Engine)
  '/school-owner/examinations/exam-group': ExamGroupManagement,
  '/school-owner/examinations/exam-schedule': ExamCalendar,
  '/school-owner/examinations/exam-result': ResultCalculationPage,
  '/school-owner/examinations/design-marksheet': MarksheetDesignerPage,
  '/school-owner/examinations/print-marksheet': MarksheetDesignerPage,
  '/school-owner/examinations/marks-grade': GradeScaleBuilder,

  // Academics
  '/school-owner/academics/class-timetable': ClassTimetable,
  '/school-owner/academics/teacher-timetable': TeacherTimetable,
  '/school-owner/academics/assign-class-teacher': AssignClassTeacher,
  '/school-owner/academics/promote-student': PromoteStudents,
  '/school-owner/academics/subjects': Subjects,
  '/school-owner/academics/classes': Classes,
  '/school-owner/academics/sections': Sections,
  '/school-owner/academics/subject-group': SubjectGroup,

  // Human Resource
  '/school-owner/human-resource/staff-directory': StaffDirectory,
  '/school-owner/human-resource/staff-attendance': StaffAttendance,
  '/school-owner/human-resource/approve-leave-request': ApproveLeaveRequest,
  '/school-owner/human-resource/apply-leave': ApplyLeave,
  '/school-owner/human-resource/leave-types': LeaveTypes,
  '/school-owner/human-resource/departments': Departments,
  '/school-owner/human-resource/designations': Designations,

  // Communicate
  '/school-owner/communicate/notice-board': NoticeBoard,
  '/school-owner/communicate/send-email': SendEmail,
  '/school-owner/communicate/send-sms': SendSMS,
  '/school-owner/communicate/email-sms-log': EmailLog,

  // Library
  '/school-owner/library/book-list': BookList,
  '/school-owner/library/issue-return': IssueReturn,
  '/school-owner/library/add-student': AddStudent,
  '/school-owner/library/add-staff': AddStaff,

  // Inventory
  '/school-owner/inventory/issue-item': IssueItem,
  '/school-owner/inventory/add-item-stock': AddItemStock,
  '/school-owner/inventory/add-item': AddItem,
  '/school-owner/inventory/item-category': ItemCategory,
  '/school-owner/inventory/item-store': ItemStore,
  '/school-owner/inventory/item-supplier': ItemSupplier,

  // Transport
  '/school-owner/transport/routes': Routes,
  '/school-owner/transport/vehicles': Vehicles,
  '/school-owner/transport/assign-vehicle': AssignVehicle,
  '/school-owner/transport/student-transport-fees': StudentTransportFees,

  // Hostel
  '/school-owner/hostel/hostel-rooms': HostelRooms,
  '/school-owner/hostel/room-type': RoomType,
  '/school-owner/hostel/hostel': Hostel,

  // Certificate
  '/school-owner/certificate/student-certificate': StudentCertificate,
  '/school-owner/certificate/generate-certificate': GenerateCertificate,
  '/school-owner/certificate/student-id-card': StudentIDCard,
  '/school-owner/certificate/generate-id-card': GenerateIDCard,

  // Front CMS (Phase 1C)
  '/school-owner/front-cms': FrontCmsSchoolOwner,
  '/school-owner/front-cms/website-settings': FrontCMSSetting,
  '/school-owner/front-cms/login-settings': FrontCMSSetting,
};

