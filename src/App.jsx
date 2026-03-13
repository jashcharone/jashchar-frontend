import React, { useEffect, Suspense, lazy } from 'react';
window.deploymentTimestamp = '2025-02-05-chunk-retry-fix';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import ProtectedRoute from '@/components/ProtectedRoute';
import SecurityHeaders from '@/components/SecurityHeaders';
import { lazyWithRetry } from '@/utils/lazyWithRetry';
import { ROUTES } from '@/registry/routeRegistry';
import { MASTER_ADMIN_ROUTES } from '@/routes/masterAdminRoutes';
import StaffModuleRoute from '@/components/StaffModuleRoute';
import NewModuleRoutes from '@/routes/routes.new.jsx';
import { NEW_MODULES } from '@/modules/moduleRegistry.append.jsx';
import DemoAutomationDialog from '@/components/DemoAutomationDialog';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { PermissionProvider } from '@/contexts/PermissionContext';
import { RecoveryProvider } from '@/contexts/RecoveryContext';
import { EnvStatusProvider } from '@/contexts/EnvStatusContext';
import { ParentChildProvider } from '@/contexts/ParentChildContext';
import { JashSyncSocketProvider } from '@/contexts/JashSyncSocketContext';
import OfflineIndicator from '@/components/OfflineIndicator';
import EnvWarningBanner from '@/components/EnvWarningBanner';
import PwaUpdater from '@/components/PwaUpdater';
// PushNotificationManager - Now integrated with Header Bell icon
import { initDevTools } from '@/utils/devTools';
import { getSubdomain } from '@/utils/subdomain';
import LoadingFallback from '@/components/LoadingFallback';
import FaviconUpdater from '@/components/FaviconUpdater';
import MobileAppShell from '@/components/mobile/MobileAppShell';

// ? CRITICAL: Keep these as eager imports for initial page load
import Homepage from '@/pages/Homepage';
import Login from '@/pages/Login';
import SchoolLogin from '@/pages/SchoolLogin';
import NotFound from '@/pages/NotFound';
import MasterAdminDashboard from '@/pages/master-admin/MasterAdminDashboard';

// ? LAZY LOAD: Auth pages
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const UpdatePassword = lazy(() => import('@/pages/UpdatePassword'));
const SchoolHomepage = lazy(() => import('@/pages/SchoolHomepage'));

// ? LAZY LOAD: Public Pages
const PublicSchoolLogin = lazy(() => import('@/pages/public/PublicSchoolLogin'));
const LoginV2 = lazy(() => import('@/pages/LoginV2')); // 🆕 V2 Auth (Mobile + Face + PIN)
const DemoLoginPage = lazy(() => import('@/pages/public/DemoLoginPage'));
const PublicForgotPassword = lazy(() => import('@/pages/public/PublicForgotPassword'));
const PublicSignUp = lazy(() => import('@/pages/public/PublicSignUp'));
const PublicPageDetail = lazy(() => import('@/pages/public/PublicPageDetail'));
const PublicEvents = lazy(() => import('@/pages/public/PublicEvents'));
const PublicNews = lazy(() => import('@/pages/public/PublicNews'));
const PublicNewsDetail = lazy(() => import('@/pages/public/PublicNewsDetail'));
const PublicGallery = lazy(() => import('@/pages/public/PublicGallery'));
const PublicExamResult = lazy(() => import('@/pages/public/PublicExamResult'));
const ExamResultPage = lazy(() => import('@/pages/public/ExamResultPage'));
const CBSEExamResult = lazy(() => import('@/pages/public/CBSEExamResult'));
const SchoolServicesHub = lazy(() => import('@/pages/public/SchoolServicesHub'));
const OnlineCourseFrontSite = lazy(() => import('@/pages/public/OnlineCourseFrontSite'));
const OnlineAdmission = lazy(() => import('@/pages/public/OnlineAdmission'));
const SchoolPublicHome = lazy(() => import('@/pages/public/SchoolPublicHome'));
const RegisterSchool = lazy(() => import('@/pages/public/RegisterSchool'));
const NewSchoolHomepage = lazy(() => import('@/pages/public/SchoolHomepage'));
const SchoolSubpage = lazy(() => import('@/pages/public/SchoolSubpage'));
const SchoolMobileApp = lazy(() => import('@/pages/SchoolMobileApp'));
const SaasPublicPage = lazy(() => import('@/pages/SaasPublicPage'));

// ? LAZY LOAD: Dashboards
// const MasterAdminDashboard = lazy(() => import('@/pages/master-admin/MasterAdminDashboard'));
const SchoolsPage = lazy(() => import('@/pages/master-admin/SchoolsPage'));
const AddNewSchool = lazy(() => import('@/pages/master-admin/AddNewSchool'));
const CreateOrganization = lazy(() => import('@/pages/master-admin/CreateOrganization'));
const EditSchool = lazy(() => import('@/pages/master-admin/EditSchool'));
const SchoolDetails = lazy(() => import('@/pages/master-admin/SchoolDetails'));
const Articles = lazy(() => import('@/pages/master-admin/articles/Articles'));
const CreateArticle = lazy(() => import('@/pages/master-admin/articles/CreateArticle'));
const EditArticle = lazy(() => import('@/pages/master-admin/articles/EditArticle'));
const ViewArticle = lazy(() => import('@/pages/master-admin/articles/ViewArticle'));
const ArticlesDocumentation = lazy(() => import('@/pages/master-admin/articles/ArticlesDocumentation'));
const SchoolOwnerDashboard = lazy(() => import('@/pages/super-admin/SchoolOwnerDashboard'));
const BranchList = lazy(() => import('@/pages/super-admin/multi-branch/BranchList'));
const AddBranch = lazy(() => import('@/pages/super-admin/multi-branch/AddBranch'));
const EditBranch = lazy(() => import('@/pages/super-admin/multi-branch/EditBranch'));
const BranchSettings = lazy(() => import('@/pages/super-admin/multi-branch/BranchSettings'));
const BranchReport = lazy(() => import('@/pages/super-admin/multi-branch/BranchReport'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const StaffDashboard = lazy(() => import('@/pages/StaffDashboard'));
const StudentDashboard = lazy(() => import('@/pages/student/StudentDashboard'));
const ParentDashboard = lazy(() => import('@/pages/ParentDashboard'));
const ParentProfile = lazy(() => import('@/pages/parent/ParentProfile'));
// Parent Module Pages
const ParentFees = lazy(() => import('@/pages/parent/ParentFees'));
const ParentAttendance = lazy(() => import('@/pages/parent/ParentAttendance'));
const ParentExamSchedule = lazy(() => import('@/pages/parent/ParentExamSchedule'));
const ParentExamResult = lazy(() => import('@/pages/parent/ParentExamResult'));
const ParentTransport = lazy(() => import('@/pages/parent/ParentTransport'));
const ParentHostel = lazy(() => import('@/pages/parent/ParentHostel'));
const ParentHomework = lazy(() => import('@/pages/parent/ParentHomework'));
const ParentTimetable = lazy(() => import('@/pages/parent/ParentTimetable'));
const ParentApplyLeave = lazy(() => import('@/pages/parent/ParentApplyLeave'));
const ParentNoticeBoard = lazy(() => import('@/pages/parent/ParentNoticeBoard'));
// ? Role-specific Dashboards
const PrincipalDashboard = lazy(() => import('@/pages/PrincipalDashboard'));
const AccountantDashboard = lazy(() => import('@/pages/AccountantDashboard'));
const ReceptionistDashboard = lazy(() => import('@/pages/ReceptionistDashboard'));
const TeacherDashboard = lazy(() => import('@/pages/TeacherDashboard'));
const LibrarianDashboard = lazy(() => import('@/pages/LibrarianDashboard'));
// New Role-specific Dashboards (21 Comprehensive System Roles)
const VicePrincipalDashboard = lazy(() => import('@/pages/VicePrincipalDashboard'));
const CoordinatorDashboard = lazy(() => import('@/pages/CoordinatorDashboard'));
const CashierDashboard = lazy(() => import('@/pages/CashierDashboard'));
const ClassTeacherDashboard = lazy(() => import('@/pages/ClassTeacherDashboard'));
const LabAssistantDashboard = lazy(() => import('@/pages/LabAssistantDashboard'));
const DriverDashboard = lazy(() => import('@/pages/DriverDashboard'));
const HostelWardenDashboard = lazy(() => import('@/pages/HostelWardenDashboard'));
const SportsCoachDashboard = lazy(() => import('@/pages/SportsCoachDashboard'));
const SecurityGuardDashboard = lazy(() => import('@/pages/SecurityGuardDashboard'));
const MaintenanceStaffDashboard = lazy(() => import('@/pages/MaintenanceStaffDashboard'));
const PeonDashboard = lazy(() => import('@/pages/PeonDashboard'));

// ? Finance
const Income = lazy(() => import('@/pages/super-admin/finance/Income'));
const AddIncome = lazy(() => import('@/pages/super-admin/finance/AddIncome'));
const SearchIncome = lazy(() => import('@/pages/super-admin/finance/SearchIncome'));
const IncomeHead = lazy(() => import('@/pages/super-admin/finance/IncomeHead'));
const Expense = lazy(() => import('@/pages/super-admin/finance/Expense'));
const AddExpense = lazy(() => import('@/pages/super-admin/finance/AddExpense'));
const SearchExpense = lazy(() => import('@/pages/super-admin/finance/SearchExpense'));
const ExpenseHead = lazy(() => import('@/pages/super-admin/finance/ExpenseHead'));

// ? Finance Reports
const IncomeReport = lazy(() => import('@/pages/super-admin/reports/finance/IncomeReport'));
const ExpenseReport = lazy(() => import('@/pages/super-admin/reports/finance/ExpenseReport'));
const IncomeGroupReport = lazy(() => import('@/pages/super-admin/reports/finance/IncomeGroupReport'));
const ExpenseGroupReport = lazy(() => import('@/pages/super-admin/reports/finance/ExpenseGroupReport'));
const IncomeExpenseBalanceReport = lazy(() => import('@/pages/super-admin/reports/finance/IncomeExpenseBalanceReport'));
const DailyCollectionReport = lazy(() => import('@/pages/super-admin/reports/finance/DailyCollectionReport'));
const FeesCollectionReport = lazy(() => import('@/pages/super-admin/reports/finance/FeesCollectionReport'));
const FeesStatementReport = lazy(() => import('@/pages/super-admin/reports/finance/FeesStatementReport'));
const BalanceFeesReport = lazy(() => import('@/pages/super-admin/reports/finance/BalanceFeesReport'));
const BalanceFeesStatementReport = lazy(() => import('@/pages/super-admin/reports/finance/BalanceFeesStatementReport'));
const BalanceFeesWithRemarkReport = lazy(() => import('@/pages/super-admin/reports/finance/BalanceFeesWithRemarkReport'));
const OnlineFeesCollectionReport = lazy(() => import('@/pages/super-admin/reports/finance/OnlineFeesCollectionReport'));
const PayrollReport = lazy(() => import('@/pages/super-admin/reports/finance/PayrollReport'));
const StudentInformationReport = lazy(() => import('@/pages/super-admin/reports/student-information/StudentInformationReportV2'));
const StudentReportGenerator = lazy(() => import('@/pages/super-admin/reports/student-information/StudentReportGenerator'));
const AttendanceReportGenerator = lazy(() => import('@/pages/super-admin/reports/attendance/AttendanceReportGenerator'));

// Report Generators (Coming Soon placeholders)
const FinanceReportGenerator = lazy(() => import('@/pages/super-admin/reports/finance/FinanceReportGenerator'));
const ExamReportGenerator = lazy(() => import('@/pages/super-admin/reports/examinations/ExamReportGenerator'));
const HRReportGenerator = lazy(() => import('@/pages/super-admin/reports/hr/HRReportGenerator'));
const LibraryReportGenerator = lazy(() => import('@/pages/super-admin/reports/library/LibraryReportGenerator'));
const TransportReportGenerator = lazy(() => import('@/pages/super-admin/reports/transport/TransportReportGenerator'));
const HostelReportGenerator = lazy(() => import('@/pages/super-admin/reports/hostel/HostelReportGenerator'));
const FeesReportGenerator = lazy(() => import('@/pages/super-admin/reports/fees/FeesReportGenerator'));
const OnlineExamReportGenerator = lazy(() => import('@/pages/super-admin/reports/online-exam/OnlineExamReportGenerator'));
const ReportCenterRoutes = lazy(() => import('@/pages/super-admin/reports/ReportCenterRoutes'));

// ? Fees Collection
const CollectFees = lazy(() => import('@/pages/super-admin/fees-collection/CollectFees'));
const OfflineBankPayments = lazy(() => import('@/pages/super-admin/fees-collection/OfflineBankPayments'));

// ? Behaviour Records
const AssignIncident = lazy(() => import('@/pages/super-admin/behaviour-records/AssignIncident'));
const Incidents = lazy(() => import('@/pages/super-admin/behaviour-records/Incidents'));
const BehaviourReports = lazy(() => import('@/pages/super-admin/behaviour-records/Reports'));
const BehaviourSetting = lazy(() => import('@/pages/super-admin/behaviour-records/BehaviourSetting'));

const DemoAutomationV2 = lazy(() => import('@/pages/master-admin/DemoAutomationV2'));
const SchoolOwnerDiagnostics = lazy(() => import('@/pages/master-admin/SchoolOwnerDiagnostics'));
const WhatsAppManager = lazy(() => import('@/pages/master-admin/whatsapp/WhatsAppManager'));
const JashSyncControlMain = lazy(() => import('@/pages/master-admin/jashsync-control/JashSyncControlMain'));

const DomainList = lazy(() => import('@/pages/master-admin/custom-domain/DomainList'));
const DomainSettings = lazy(() => import('@/pages/master-admin/custom-domain/DomainSettings'));

// ? Master Admin Pages (Extended)
const MasterAdminProfile = lazy(() => import('@/pages/master-admin/MasterAdminProfile'));
const MasterAdminResetPassword = lazy(() => import('@/pages/master-admin/MasterAdminResetPassword'));
const SubscriptionPlans = lazy(() => import('@/pages/master-admin/subscriptions/SubscriptionPlans'));
const AddSubscriptionPlan = lazy(() => import('@/pages/master-admin/subscriptions/AddSubscriptionPlan'));
const EditSubscriptionPlan = lazy(() => import('@/pages/master-admin/subscriptions/EditSubscriptionPlan'));
// 🧬 Permission DNA - Revolutionary Role Permission System
const RolePermission = lazy(() => import('@/pages/master-admin/role-permission/PermissionDNA'));
const AssignPermission = lazy(() => import('@/pages/master-admin/AssignPermission'));
const SchoolRequests = lazy(() => import('@/pages/master-admin/SchoolRequests'));
const EditSchoolRequest = lazy(() => import('@/pages/master-admin/EditSchoolRequest'));
const SubscriptionsList = lazy(() => import('@/pages/master-admin/subscriptions/SubscriptionsList'));
const SubscriptionInvoices = lazy(() => import('@/pages/master-admin/subscriptions/SubscriptionInvoices'));
const SubscriptionTransactions = lazy(() => import('@/pages/master-admin/subscriptions/SubscriptionTransactions'));
const BillingAudit = lazy(() => import('@/pages/master-admin/subscriptions/BillingAudit'));
const GenerateBill = lazy(() => import('@/pages/master-admin/subscriptions/GenerateBill'));
const BulkInvoiceGenerator = lazy(() => import('@/pages/master-admin/subscriptions/BulkInvoiceGenerator'));
const EstimatesList = lazy(() => import('@/pages/master-admin/subscriptions/EstimatesList'));
const GenerateEstimate = lazy(() => import('@/pages/master-admin/subscriptions/GenerateEstimate'));
const QueriesFinder = lazyWithRetry(() => import('@/pages/master-admin/system-settings/QueriesFinder'), 'QueriesFinder'); // With retry
const CommunicationSettingsMaster = lazy(() => import('@/pages/master-admin/system-settings/CommunicationSettings'));
// const WhatsAppManager = lazy(() => import('@/pages/master-admin/whatsapp/WhatsAppManager')); // Already declared above
const EmailSettingsMaster = lazy(() => import('@/pages/master-admin/system-settings/EmailSettings'));
const PaymentSettingsMaster = lazy(() => import('@/pages/master-admin/system-settings/PaymentSettings'));
const LoginPageSettings = lazy(() => import('@/pages/master-admin/system-settings/LoginPageSettings'));
const FileTypeSettings = lazy(() => import('@/pages/master-admin/system-settings/FileTypeSettings'));
const MasterSchoolLoginSettings = lazy(() => import('@/pages/master-admin/front-cms/MasterSchoolLoginSettings'));
const SessionSettingMaster = lazy(() => import('@/pages/master-admin/system-settings/SessionSetting'));
const ExportImport = lazy(() => import('@/pages/master-admin/system-settings/ExportImport'));
const MasterDataSettings = lazy(() => import('@/pages/master-admin/system-settings/MasterDataSettings'));
const SaasWebsiteSettings = lazy(() => import('@/pages/master-admin/SaasWebsiteSettings'));
const FileManager = lazy(() => import('@/pages/master-admin/website-management/FileManager'));
const FrontCmsMasterAdmin = lazy(() => import('@/pages/master-admin/front-cms/FrontCmsMasterAdmin'));
const MasterAdminMenus = lazy(() => import('@/pages/master-admin/front-cms/Menus'));
const MasterAdminMenuItems = lazy(() => import('@/pages/master-admin/front-cms/MenuItems'));
const FrontCmsSchoolOwner = lazy(() => import('@/pages/super-admin/front-cms/FrontCmsSchoolOwner'));
const Menus = lazy(() => import('@/pages/super-admin/front-cms/Menus'));
const MenuItems = lazy(() => import('@/pages/super-admin/front-cms/MenuItems'));
const Pages = lazy(() => import('@/pages/super-admin/front-cms/Pages'));
const AddEditPage = lazy(() => import('@/pages/super-admin/front-cms/AddEditPage'));
const Events = lazy(() => import('@/pages/super-admin/front-cms/Events'));
const AddEditEvent = lazy(() => import('@/pages/super-admin/front-cms/AddEditEvent'));
const Gallery = lazy(() => import('@/pages/super-admin/front-cms/Gallery'));
const AddEditGallery = lazy(() => import('@/pages/super-admin/front-cms/AddEditGallery'));
const News = lazy(() => import('@/pages/super-admin/front-cms/News'));
const AddEditNews = lazy(() => import('@/pages/super-admin/front-cms/AddEditNews'));
const BannerImages = lazy(() => import('@/pages/super-admin/front-cms/BannerImages'));
const MediaManager = lazy(() => import('@/pages/super-admin/front-cms/MediaManager'));
const FrontCMSSetting = lazy(() => import('@/pages/super-admin/front-cms/FrontCMSSetting'));
const FrontCmsOnlineAdmissionSetting = lazy(() => import('@/pages/super-admin/front-cms/OnlineAdmissionSetting'));
const ModuleHealth = lazy(() => import('@/pages/master-admin/ModuleHealth'));
const EnterpriseHealthMonitor = lazy(() => import('@/pages/master-admin/EnterpriseHealthMonitor'));
const PlaceholderModule = lazy(() => import('@/components/common/PlaceholderModule'));

// ? Module Registry (NEW - Centralized Module Management)
const ModuleRegistryDashboard = lazy(() => import('@/pages/master-admin/module-registry/ModuleRegistryDashboard'));
const AddEditModule = lazy(() => import('@/pages/master-admin/module-registry/AddEditModule'));
const SyncCenter = lazy(() => import('@/pages/master-admin/module-registry/SyncCenter'));
const VersionHistory = lazy(() => import('@/pages/master-admin/module-registry/VersionHistory'));
const ModuleRegistryAuditLog = lazy(() => import('@/pages/master-admin/module-registry/AuditLog'));

// ? Master Admin Branch Management
const SchoolBranchesOverview = lazy(() => import('@/pages/master-admin/branch-management/SchoolBranchesOverview'));
const SchoolBranches = lazy(() => import('@/pages/master-admin/branch-management/SchoolBranches'));
const AddBranchForSchool = lazy(() => import('@/pages/master-admin/branch-management/AddBranchForSchool'));
const EditBranchForSchool = lazy(() => import('@/pages/master-admin/branch-management/EditBranchForSchool'));

// ? School Owner Pages (Extended)
const SchoolOwnerProfile = lazy(() => import('@/pages/super-admin/SchoolOwnerProfile'));
const SchoolOwnerResetPassword = lazy(() => import('@/pages/super-admin/SchoolOwnerResetPassword'));
const MySubscriptionPlan = lazy(() => import('@/pages/super-admin/subscription/MySubscriptionPlan'));

// Front Office
const SetupFrontOffice = lazy(() => import('@/pages/super-admin/front-office/SetupFrontOffice'));
const AdmissionEnquiry = lazy(() => import('@/pages/super-admin/front-office/AdmissionEnquiry'));
const VisitorBook = lazy(() => import('@/pages/super-admin/front-office/VisitorBook'));
const PhoneCallLog = lazy(() => import('@/pages/super-admin/front-office/PhoneCallLog'));
const PostalDispatch = lazy(() => import('@/pages/super-admin/front-office/PostalDispatch'));
const PostalReceive = lazy(() => import('@/pages/super-admin/front-office/PostalReceive'));
const Complain = lazy(() => import('@/pages/super-admin/front-office/Complain'));

// Online Course
const OnlineCourse = lazy(() => import('@/pages/super-admin/online-course/OnlineCourse'));
const OfflinePayment = lazy(() => import('@/pages/super-admin/online-course/OfflinePayment'));
const OnlineCourseReport = lazy(() => import('@/pages/super-admin/online-course/OnlineCourseReport'));
const OnlineCourseSetting = lazy(() => import('@/pages/super-admin/online-course/Setting'));

// Academics
const Classes = lazy(() => import('@/pages/super-admin/academics/Classes'));
const Sections = lazy(() => import('@/pages/super-admin/academics/Sections'));
const Subjects = lazy(() => import('@/pages/super-admin/academics/Subjects'));
const SubjectGroup = lazy(() => import('@/pages/super-admin/academics/SubjectGroup'));
const ClassTimetable = lazy(() => import('@/pages/super-admin/academics/ClassTimetable'));
const TeacherTimetable = lazy(() => import('@/pages/super-admin/academics/TeacherTimetable'));
const Timetable = lazy(() => import('@/pages/super-admin/academics/Timetable'));
const ClassTeacher = lazy(() => import('@/pages/super-admin/academics/ClassTeacher'));
const SubjectTeacher = lazy(() => import('@/pages/super-admin/academics/SubjectTeacher'));
const AssignClassTeacher = lazy(() => import('@/pages/super-admin/academics/AssignClassTeacher'));
const PromoteStudent = lazy(() => import('@/pages/super-admin/academics/PromoteStudent'));
const AcademicAnalysis = lazy(() => import('@/pages/super-admin/academics/AcademicAnalysis'));

// Student Info
const StudentAdmission = lazy(() => import('@/pages/super-admin/student-information/StudentAdmission'));
const AdmissionFormSettings = lazy(() => import('@/pages/super-admin/student-information/AdmissionFormSettings'));
const StudentDetails = lazy(() => import('@/pages/super-admin/student-information/StudentDetails'));
const StudentProfile = lazy(() => import('@/pages/super-admin/student-information/StudentProfile'));
const EditStudentProfile = lazy(() => import('@/pages/super-admin/student-information/EditStudentProfile'));
const OnlineAdmissionList = lazy(() => import('@/pages/super-admin/student-information/OnlineAdmissionList'));
const EditOnlineAdmission = lazy(() => import('@/pages/super-admin/student-information/EditOnlineAdmission'));
// StudentCategories and StudentHouse - embedded in AdmissionFormSettings tabs only
const DisabledStudents = lazy(() => import('@/pages/super-admin/student-information/DisabledStudents'));
const DisableReason = lazy(() => import('@/pages/super-admin/student-information/DisableReason'));
const MultiClassStudent = lazy(() => import('@/pages/super-admin/student-information/MultiClassStudent'));
const BulkDelete = lazy(() => import('@/pages/super-admin/student-information/BulkDelete'));
const BulkUpload = lazy(() => import('@/pages/super-admin/student-information/BulkUpload'));
const StudentIdCard = lazy(() => import('@/pages/super-admin/student-information/StudentIdCard'));
const StudentAnalysis = lazy(() => import('@/pages/super-admin/student-information/StudentAnalysis'));

// HR
const EmployeeFormSettings = lazy(() => import('@/pages/super-admin/human-resource/EmployeeFormSettings.jsx'));
const Departments = lazy(() => import('@/pages/super-admin/human-resource/Departments'));
const EmploymentCategory = lazy(() => import('@/pages/super-admin/human-resource/EmploymentCategory'));
const Designations = lazy(() => import('@/pages/super-admin/human-resource/Designations'));
const AddEmployee = lazy(() => import('@/pages/super-admin/human-resource/AddEmployee'));
const EditEmployee = lazy(() => import('@/pages/super-admin/human-resource/EditEmployee'));
const EmployeeList = lazy(() => import('@/pages/super-admin/human-resource/EmployeeList'));
const StaffDirectory = lazy(() => import('@/pages/super-admin/human-resource/StaffDirectory'));
const StaffProfile = lazy(() => import('@/pages/super-admin/human-resource/StaffProfile'));
const ImportStaff = lazy(() => import('@/pages/super-admin/human-resource/ImportStaff'));
const StaffLeaveType = lazy(() => import('@/pages/super-admin/human-resource/StaffLeaveType'));
const StaffApplyLeave = lazy(() => import('@/pages/super-admin/human-resource/StaffApplyLeave'));
const ApproveStaffLeave = lazy(() => import('@/pages/super-admin/human-resource/ApproveStaffLeave'));
const EmployeeDocuments = lazy(() => import('@/pages/super-admin/human-resource/EmployeeDocuments'));
const EmployeePerformance = lazy(() => import('@/pages/super-admin/human-resource/EmployeePerformance'));
const EmployeePayroll = lazy(() => import('@/pages/super-admin/human-resource/EmployeePayroll'));
const LeaveManagement = lazy(() => import('@/pages/super-admin/human-resource/LeaveManagement'));

// Attendance
const StudentAttendance = lazy(() => import('@/pages/super-admin/attendance/StudentAttendance'));
const LiveClasses = lazy(() => import('@/pages/super-admin/gmeet-live-classes/LiveClasses')); // ? Import LiveClasses
const AttendanceByDate = lazy(() => import('@/pages/super-admin/attendance/AttendanceByDate'));
const ApproveStudentLeave = lazy(() => import('@/pages/super-admin/attendance/ApproveStudentLeave'));
const StaffAttendance = lazy(() => import('@/pages/super-admin/attendance/StaffAttendance'));
const AttendanceReport = lazy(() => import('@/pages/super-admin/attendance/AttendanceReport'));
// Advanced Attendance (Futuristic Module)
const LiveAttendanceDashboard = lazy(() => import('@/pages/super-admin/attendance/LiveAttendanceDashboard'));
const QRCodeGenerator = lazy(() => import('@/pages/super-admin/attendance/QRCodeGenerator'));
const DeviceManagement = lazy(() => import('@/pages/super-admin/attendance/DeviceManagement'));
const CardManagement = lazy(() => import('@/pages/super-admin/attendance/CardManagement'));
const FaceRegistration = lazy(() => import('@/pages/super-admin/attendance/FaceRegistration'));
const LiveFaceAttendance = lazy(() => import('@/pages/super-admin/attendance/LiveFaceAttendance'));
const AttendanceRules = lazy(() => import('@/pages/super-admin/attendance/AttendanceRules'));
const GeoFenceSetup = lazy(() => import('@/pages/super-admin/attendance/GeoFenceSetup'));
const AttendanceAnalytics = lazy(() => import('@/pages/super-admin/attendance/AttendanceAnalytics'));
const WearableDevices = lazy(() => import('@/pages/super-admin/attendance/WearableDevices'));

// Fees (Remaining)
const FeesGroup = lazy(() => import('@/pages/super-admin/fees-collection/FeesGroup'));
const FeeStructures = lazy(() => import('@/pages/super-admin/fees-collection/FeeStructures'));
const FeeRules = lazy(() => import('@/pages/super-admin/fees-collection/FeeRules'));
const FeesType = lazy(() => import('@/pages/super-admin/fees-collection/FeesType'));
const FeesMaster = lazy(() => import('@/pages/super-admin/fees-collection/FeesMaster'));
const AssignFeeGroup = lazy(() => import('@/pages/super-admin/fees-collection/AssignFeeGroup'));
const StudentFees = lazy(() => import('@/pages/super-admin/fees-collection/StudentFees'));
const SearchFeesPayment = lazy(() => import('@/pages/super-admin/fees-collection/SearchFeesPayment'));
const SearchDueFees = lazy(() => import('@/pages/super-admin/fees-collection/SearchDueFees'));
const FeesDiscount = lazy(() => import('@/pages/super-admin/fees-collection/FeesDiscount'));
const FeesCarryForward = lazy(() => import('@/pages/super-admin/fees-collection/FeesCarryForward'));
const FeesReminder = lazy(() => import('@/pages/super-admin/fees-collection/FeesReminder'));
// 🧾 Unified Print Receipt (All-in-One: Fees, Hostel, Transport, Refund)
const PrintReceipt = lazy(() => import('@/pages/super-admin/fees-collection/PrintReceipt'));
const QuickFees = lazy(() => import('@/pages/super-admin/fees-collection/QuickFees'));
const OnlinePayment = lazy(() => import('@/pages/super-admin/fees-collection/OnlinePayment'));
const FeesAnalysis = lazy(() => import('@/pages/super-admin/fees-collection/FeesAnalysis'));
const RefundApprovals = lazy(() => import('@/pages/super-admin/fees-collection/RefundApprovals'));
// 🌟 Fee Dashboard (Simplified)
const FeeDashboard = lazy(() => import('@/pages/super-admin/fees-collection/FeeDashboard'));

// Examinations
const ExamGroup = lazy(() => import('@/pages/super-admin/examinations/ExamGroup'));
const ExamList = lazy(() => import('@/pages/super-admin/examinations/ExamList'));
const ExamSchedule = lazy(() => import('@/pages/super-admin/examinations/ExamSchedule'));
const ExamAttendance = lazy(() => import('@/pages/super-admin/examinations/ExamAttendance'));
const MarksEntry = lazy(() => import('@/pages/super-admin/examinations/MarksEntry'));
const MarksDivision = lazy(() => import('@/pages/super-admin/examinations/MarksDivision'));
const MarksGrade = lazy(() => import('@/pages/super-admin/examinations/MarksGrade'));
const GeneralExamResult = lazy(() => import('@/pages/super-admin/examinations/GeneralExamResult'));
const GeneralExamSchedule = lazy(() => import('@/pages/super-admin/examinations/GeneralExamSchedule'));
const CbseExam = lazy(() => import('@/pages/super-admin/examinations/CbseExam'));
const CbseSettings = lazy(() => import('@/pages/super-admin/examinations/CbseSettings'));
const CbseTerm = lazy(() => import('@/pages/super-admin/examinations/CbseTerm'));
const CbseAssessment = lazy(() => import('@/pages/super-admin/examinations/CbseAssessment'));
const CbseObservation = lazy(() => import('@/pages/super-admin/examinations/CbseObservation'));
const CbseObservationParameter = lazy(() => import('@/pages/super-admin/examinations/CbseObservationParameter'));
const CbseExamGrade = lazy(() => import('@/pages/super-admin/examinations/CbseExamGrade'));
const AddExamSubjects = lazy(() => import('@/pages/super-admin/examinations/AddExamSubjects'));
const AssignStudents = lazy(() => import('@/pages/super-admin/examinations/AssignStudents'));
const EnterMarks = lazy(() => import('@/pages/super-admin/examinations/EnterMarks'));
const LinkExam = lazy(() => import('@/pages/super-admin/examinations/LinkExam'));
const GenerateRank = lazy(() => import('@/pages/super-admin/examinations/GenerateRank'));
const GenerateTemplateRank = lazy(() => import('@/pages/super-admin/examinations/GenerateTemplateRank'));
const MarksheetTemplate = lazy(() => import('@/pages/super-admin/examinations/MarksheetTemplate'));
const PrintMarksheet = lazy(() => import('@/pages/super-admin/examinations/PrintMarksheet'));
const PrintMarksheetGeneral = lazy(() => import('@/pages/super-admin/examinations/PrintMarksheetGeneral'));
const PrintAdmitCard = lazy(() => import('@/pages/super-admin/examinations/PrintAdmitCard'));
const DesignMarksheet = lazy(() => import('@/pages/super-admin/examinations/DesignMarksheet'));
const DesignAdmitCard = lazy(() => import('@/pages/super-admin/examinations/DesignAdmitCard'));
const TeacherRemarks = lazy(() => import('@/pages/super-admin/examinations/TeacherRemarks'));
const AssignObservation = lazy(() => import('@/pages/super-admin/examinations/AssignObservation'));
const CbseReports = lazy(() => import('@/pages/super-admin/examinations/CbseReports'));
const ReportCard = lazy(() => import('@/pages/super-admin/examinations/ReportCard'));
// Examination Setup (New Engine)
const BoardConfiguration = lazy(() => import('@/pages/super-admin/examinations/BoardConfiguration'));
const TermManagement = lazy(() => import('@/pages/super-admin/examinations/TermManagement'));
const ExamTypeMaster = lazy(() => import('@/pages/super-admin/examinations/ExamTypeMaster'));
const GradeScaleBuilder = lazy(() => import('@/pages/super-admin/examinations/GradeScaleBuilder'));
const ExamGroupManagement = lazy(() => import('@/pages/super-admin/examinations/ExamGroupManagement'));

// Library
const LibraryBooks = lazy(() => import('@/pages/super-admin/library/LibraryBooks'));
const LibraryBookIssued = lazy(() => import('@/pages/super-admin/library/LibraryBookIssued'));
const LibraryMembers = lazy(() => import('@/pages/super-admin/library/LibraryMembers'));
const LibraryIssueReturn = lazy(() => import('@/pages/super-admin/library/LibraryIssueReturn'));

// Hostel
const Hostels = lazy(() => import('@/pages/super-admin/hostel/Hostels'));
const HostelRooms = lazy(() => import('@/pages/super-admin/hostel/HostelRooms'));
const RoomTypes = lazy(() => import('@/pages/super-admin/hostel/RoomTypes'));
const HostelFee = lazy(() => import('@/pages/super-admin/hostel/HostelFee'));
const HostelAnalysis = lazy(() => import('@/pages/super-admin/hostel/HostelAnalysis'));

// Transport
const TransportRoutes = lazy(() => import('@/pages/super-admin/transport/TransportRoutes'));
const TransportVehicles = lazy(() => import('@/pages/super-admin/transport/TransportVehicles'));
const PickupPoints = lazy(() => import('@/pages/super-admin/transport/PickupPoints'));
const RoutePickupPoint = lazy(() => import('@/pages/super-admin/transport/RoutePickupPoint'));
const AssignVehicle = lazy(() => import('@/pages/super-admin/transport/AssignVehicle'));
const StudentTransportFees = lazy(() => import('@/pages/super-admin/transport/StudentTransportFees'));
const TransportFeesMaster = lazy(() => import('@/pages/super-admin/transport/TransportFeesMaster'));
const TransportAnalysis = lazy(() => import('@/pages/super-admin/transport/TransportAnalysis'));

// Communicate
const NoticeBoard = lazy(() => import('@/pages/super-admin/communicate/NoticeBoard'));
const SendEmail = lazy(() => import('@/pages/super-admin/communicate/SendEmail'));
const SendSms = lazy(() => import('@/pages/super-admin/communicate/SendSms'));
const ComposeMessage = lazy(() => import('@/pages/super-admin/communicate/ComposeMessage'));
const EmailSmsLog = lazy(() => import('@/pages/super-admin/communicate/EmailSmsLog'));
const WhatsAppDashboard = lazy(() => import('@/pages/super-admin/whatsapp/WhatsAppDashboard'));
const JashSyncMain = lazy(() => import('@/pages/super-admin/jashsync/JashSyncMain'));

// QR
const QrAttendanceSetting = lazy(() => import('@/pages/super-admin/qr-code-attendance/QrAttendanceSetting'));
const QrAttendanceScan = lazy(() => import('@/pages/super-admin/qr-code-attendance/QrAttendanceScan'));

// Alumni
const AlumniList = lazy(() => import('@/pages/super-admin/alumni/AlumniList'));
const AlumniEvents = lazy(() => import('@/pages/super-admin/alumni/AlumniEvents'));

// Download Center
const DownloadCenter = lazy(() => import('@/pages/super-admin/DownloadCenter'));

// System Settings
const GeneralSetting = lazy(() => import('@/pages/super-admin/system-settings/GeneralSetting'));
const SchoolOwnerRolePermission = lazy(() => import('@/pages/super-admin/system-settings/RolePermission'));
const PrintHeaderFooter = lazy(() => import('@/pages/super-admin/system-settings/PrintHeaderFooter'));
const AssignPermissionSchoolPage = lazy(() => import('@/pages/super-admin/system-settings/AssignPermission'));
const SessionSetting = lazy(() => import('@/pages/super-admin/system-settings/SessionSetting'));
const BranchAttendanceConfig = lazy(() => import('@/pages/master-admin/system-settings/BranchAttendanceConfig')); // Master Admin - Branch Attendance Config

// Homework
const HomeworkList = lazy(() => import('@/pages/super-admin/homework/HomeworkList'));

// Inventory
const AddItem = lazy(() => import('@/pages/super-admin/inventory/AddItem'));
const AddItemStock = lazy(() => import('@/pages/super-admin/inventory/AddItemStock'));
const IssueItem = lazy(() => import('@/pages/super-admin/inventory/IssueItem'));
const ItemCategory = lazy(() => import('@/pages/super-admin/inventory/ItemCategory'));
const ItemStore = lazy(() => import('@/pages/super-admin/inventory/ItemStore'));
const ItemSupplier = lazy(() => import('@/pages/super-admin/inventory/ItemSupplier'));

// Certificate
const CertificateTemplates = lazy(() => import('@/pages/super-admin/certificate/CertificateTemplates'));
const GenerateCertificate = lazy(() => import('@/pages/super-admin/certificate/GenerateCertificate'));
const CertificateHistory = lazy(() => import('@/pages/super-admin/certificate/CertificateHistory'));
const StudentCertificate = lazy(() => import('@/pages/super-admin/certificate/StudentCertificate'));
const GenerateIDCard = lazy(() => import('@/pages/super-admin/certificate/GenerateIDCard'));
const StaffIDCard = lazy(() => import('@/pages/super-admin/certificate/StaffIDCard'));
const GenerateStaffIDCard = lazy(() => import('@/pages/super-admin/certificate/GenerateStaffIDCard'));
const StudentIDCard = lazy(() => import('@/pages/super-admin/certificate/StudentIDCard'));

// Student Panel
const StudentPanelProfile = lazy(() => import('@/pages/student/StudentPanelProfile'));
const EditStudentPanelProfile = lazy(() => import('@/pages/student/EditStudentPanelProfile'));
const StudentPanelFees = lazy(() => import('@/pages/student/StudentPanelFees'));
const StudentExamSchedule = lazy(() => import('@/pages/student/ExamSchedule'));
const StudentExamResult = lazy(() => import('@/pages/student/ExamResult'));
const StudentHostelRooms = lazy(() => import('@/pages/student/StudentHostelRooms'));
const StudentTransportRoutes = lazy(() => import('@/pages/student/TransportRoutes'));
const StudentAttendanceView = lazy(() => import('@/pages/student/Attendance'));
const ApplyLeave = lazy(() => import('@/pages/student/ApplyLeave'));

// ? Task Management
const TaskDashboard = lazy(() => import('@/pages/super-admin/task-management/TaskDashboard'));
const TaskList = lazy(() => import('@/pages/super-admin/task-management/TaskList'));
const TaskDetail = lazy(() => import('@/pages/super-admin/task-management/TaskDetail'));
const CreateEditTask = lazy(() => import('@/pages/super-admin/task-management/CreateEditTask'));
const MyTasks = lazy(() => import('@/pages/super-admin/task-management/MyTasks'));
const TaskCategories = lazy(() => import('@/pages/super-admin/task-management/TaskCategories'));
const TaskPriorities = lazy(() => import('@/pages/super-admin/task-management/TaskPriorities'));

// ? Advanced Analytics & AI
const AdvancedAnalytics = lazy(() => import('@/pages/super-admin/AdvancedAnalytics'));
const MasterAdminAnalytics = lazy(() => import('@/pages/master-admin/MasterAdminAnalytics'));

// ? Cortex AI - India's First Thinking ERP
const CortexAI = lazy(() => import('@/pages/super-admin/cortex-ai'));

// ? AI Evaluation (Cortex Evaluate™) - AI Paper Valuation
const AIEvaluation = lazy(() => import('@/pages/super-admin/ai-evaluation'));

// AIChatbot moved to DashboardLayout for header control

function App() {
  const { loading } = useAuth();
  const subdomain = getSubdomain();
  const isSubdomain = !!subdomain;

  // Capacitor native app detection — skip marketing Homepage, go straight to Login
  const isCapacitorNative = (() => {
    try { if (Capacitor.isNativePlatform()) return true; } catch(e) {}
    if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) return true;
    if (typeof window !== 'undefined' && window.location.hostname === 'app.jashchar.local') return true;
    return false;
  })();

  // ? Initialize Dev Tools on App Mount
  useEffect(() => {
    initDevTools();
  }, []);

  // ? Loading UI
  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <RecoveryProvider>
      <EnvStatusProvider>
        <SecurityHeaders />
        <DemoAutomationDialog />
        <OfflineIndicator />
        <EnvWarningBanner />
        <FaviconUpdater />
        <PwaUpdater />
        {/* PushNotificationManager moved - Bell icon in Header handles notifications */}
        {/* AIChatbot moved to DashboardLayout - controlled via Header icon */}
        <PermissionProvider>
          <ParentChildProvider>
          <JashSyncSocketProvider>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
            {/* ? Demo Login Page - Marketing */}
            <Route path="/demo" element={<DemoLoginPage />} />
            <Route path="/demo-login" element={<DemoLoginPage />} />
            
            {/* ? Public Routes - Subdomain Logic */}
            {isSubdomain ? (
              <>
                <Route path="/" element={<SchoolPublicHome />} />
                <Route path="/login" element={<PublicSchoolLogin />} />
                <Route path="/forgot-password" element={<PublicForgotPassword />} />
                <Route path="/signup" element={<PublicSignUp />} />
                <Route path="/exam-result" element={<ExamResultPage />} />
                <Route path="/cbse-exam-result" element={<CBSEExamResult />} />
                <Route path="/services" element={<SchoolServicesHub />} />
                <Route path="/pages/:pageSlug" element={<PublicPageDetail />} />
                <Route path="/events" element={<PublicEvents />} />
                <Route path="/news" element={<PublicNews />} />
                <Route path="/news/:newsSlug" element={<PublicNewsDetail />} />
                <Route path="/gallery" element={<PublicGallery />} />
                <Route path="/online-course" element={<OnlineCourseFrontSite />} />
                <Route path="/admission" element={<OnlineAdmission />} />
              </>
            ) : (
              <>
                {/* Capacitor native → skip marketing homepage, go to login */}
                <Route path={ROUTES.PUBLIC.HOME} element={isCapacitorNative ? <Navigate to="/login" replace /> : <Homepage />} />
                <Route path={ROUTES.PUBLIC.LOGIN} element={<Login />} />
                <Route path={ROUTES.PUBLIC.FORGOT_PASSWORD} element={<ForgotPassword />} />
                <Route path={ROUTES.PUBLIC.RESET_PASSWORD} element={<ResetPassword />} />
                <Route path="/update-password" element={<UpdatePassword />} /> {/* ? Route for Supabase Reset Link */}
                <Route path={ROUTES.PUBLIC.SCHOOL_LOGIN} element={<SchoolLogin />} />
                <Route path="/register-school" element={<RegisterSchool />} />
                <Route path="/register-organization" element={<RegisterSchool />} />
                <Route path={ROUTES.PUBLIC.SCHOOL_HOMEPAGE} element={<SchoolHomepage />} />
                <Route path="/school-mobile-app" element={<SchoolMobileApp />} />
                <Route path="/school-erp" element={<SaasPublicPage slug="school-erp" />} />
                <Route path="/School-erp" element={<SaasPublicPage slug="school-erp" />} />
                <Route path="/page/:pageSlug" element={<SaasPublicPage />} />
                
                {/* ? New Dynamic School Homepage (Testing Route) */}
                <Route path="/s/:domain" element={<NewSchoolHomepage />} />
                <Route path="/s/:domain/login" element={<PublicSchoolLogin />} />
                <Route path="/s/:domain/login-v2" element={<LoginV2 />} /> {/* 🆕 V2 Auth */}
                
                {/* 🆕 Standalone V2 Login Route */}
                <Route path="/login-v2" element={<LoginV2 />} />
                <Route path="/login-v2/:alias" element={<LoginV2 />} />
                
                {/* Explicit /school/slug routes requested by user */}
                <Route path="/school/:schoolSlug" element={<SchoolPublicHome />} />
                <Route path="/school/:schoolSlug/login" element={<PublicSchoolLogin />} />
                <Route path="/school/:schoolSlug/news" element={<PublicNews />} />
                <Route path="/school/:schoolSlug/news/:newsSlug" element={<PublicNewsDetail />} />
                <Route path="/school/:schoolSlug/events" element={<PublicEvents />} />
                <Route path="/school/:schoolSlug/page/:pageSlug" element={<PublicPageDetail />} />

                <Route path="/s/:domain/forgot-password" element={<PublicForgotPassword />} />
                <Route path="/s/:domain/signup" element={<PublicSignUp />} />
                <Route path="/s/:domain/online_course" element={<SchoolSubpage variant="online_course" />} />
                <Route path="/s/:domain/online_admission" element={<SchoolSubpage variant="online_admission" />} />
                <Route path="/s/:domain/cbseexam" element={<SchoolSubpage variant="cbseexam" />} />
                <Route path="/s/:domain/examresult" element={<SchoolSubpage variant="examresult" />} />
                <Route path="/s/:domain/annual_calendar" element={<SchoolSubpage variant="annual_calendar" />} />
                <Route path="/s/:domain/page/:pageSlug" element={<SchoolSubpage variant="page" />} />

              </>
            )}

            {/* ? Master Admin */}
            <Route
              path={ROUTES.MASTER_ADMIN.DASHBOARD}
              element={
                <ProtectedRoute allowedRoles={['master_admin']}>
                  <MasterAdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.MASTER_ADMIN.DEMO_AUTOMATION_V2}
              element={
                <ProtectedRoute allowedRoles={['master_admin']}>
                  <DemoAutomationV2 />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.MASTER_ADMIN.SCHOOL_OWNER_DIAGNOSTICS}
              element={
                <ProtectedRoute allowedRoles={['master_admin']}>
                  <SchoolOwnerDiagnostics />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.MASTER_ADMIN.SCHOOLS}
              element={
                <ProtectedRoute allowedRoles={['master_admin']}>
                  <SchoolsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.MASTER_ADMIN.SCHOOL_REQUESTS}
              element={
                <ProtectedRoute allowedRoles={['master_admin']}>
                  <SchoolRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/master-admin/organization-requests/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['master_admin']}>
                  <EditSchoolRequest />
                </ProtectedRoute>
              }
            />
            {/* Backward compatibility */}
            <Route
              path="/master-admin/school-requests/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['master_admin']}>
                  <EditSchoolRequest />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.MASTER_ADMIN.CREATE_ORGANIZATION}
              element={
                <ProtectedRoute allowedRoles={['master_admin']}>
                  <CreateOrganization />
                </ProtectedRoute>
              }
            />
            {/* ADD_SCHOOL route removed - schools are created through School Requests approval flow
            <Route
              path={ROUTES.MASTER_ADMIN.ADD_SCHOOL}
              element={
                <ProtectedRoute allowedRoles={['master_admin']}>
                  <AddNewSchool />
                </ProtectedRoute>
              }
            />
            */}
            <Route
              path={ROUTES.MASTER_ADMIN.WHATSAPP_MANAGER}
              element={
                <ProtectedRoute allowedRoles={['master_admin']}>
                  <WhatsAppManager />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.MASTER_ADMIN.JASHSYNC_CONTROL}
              element={
                <ProtectedRoute allowedRoles={['master_admin']}>
                  <JashSyncControlMain />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.MASTER_ADMIN.EDIT_SCHOOL}
              element={
                <ProtectedRoute allowedRoles={['master_admin']}>
                  <EditSchool />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.MASTER_ADMIN.SCHOOL_DETAILS}
              element={
                <ProtectedRoute allowedRoles={['master_admin']}>
                  <SchoolDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.MASTER_ADMIN.ARTICLES}
              element={
                <ProtectedRoute allowedRoles={['master_admin']}>
                  <Articles />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.MASTER_ADMIN.CREATE_ARTICLE}
              element={
                <ProtectedRoute allowedRoles={['master_admin']}>
                  <CreateArticle />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.MASTER_ADMIN.EDIT_ARTICLE}
              element={
                <ProtectedRoute allowedRoles={['master_admin']}>
                  <EditArticle />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.MASTER_ADMIN.VIEW_ARTICLE}
              element={
                <ProtectedRoute allowedRoles={['master_admin']}>
                  <ViewArticle />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.MASTER_ADMIN.ARTICLES_DOCS}
              element={
                <ProtectedRoute allowedRoles={['master_admin']}>
                  <ArticlesDocumentation />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.MASTER_ADMIN.ROLE_PERMISSION}
              element={
                <ProtectedRoute allowedRoles={['master_admin']}>
                  <RolePermission />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.MASTER_ADMIN.ASSIGN_PERMISSION}
              element={
                <ProtectedRoute allowedRoles={['master_admin']}>
                  <AssignPermission />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.MASTER_ADMIN.ASSIGN_PERMISSION_ID}
              element={
                <ProtectedRoute allowedRoles={['master_admin']}>
                  <AssignPermission />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.MASTER_ADMIN.ASSIGN_PERMISSION_FULL}
              element={
                <ProtectedRoute allowedRoles={['master_admin']}>
                  <AssignPermission />
                </ProtectedRoute>
              }
            />

            {/* ✅ School Owner - Redirect all to school dashboard */}
            <Route path="/school-owner" element={<Navigate to={ROUTES.SUPER_ADMIN.DASHBOARD} replace />} />
            <Route path="/school-owner/*" element={<Navigate to={ROUTES.SUPER_ADMIN.DASHBOARD} replace />} />
            
            {/* Redirect organization-owner to school dashboard */}
            <Route path="/organization-owner/dashboard" element={<Navigate to={ROUTES.SUPER_ADMIN.DASHBOARD} replace />} />
            <Route path="/organization-owner/*" element={<Navigate to={ROUTES.SUPER_ADMIN.DASHBOARD} replace />} />

            {/* ✅ Remove old redirect - we now keep /super-admin/ URLs */}
            {/* Each role gets their own dashboard URL */}

            {/* ✅ Role-specific dashboard routes */}
            <Route path="/Admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><SchoolOwnerDashboard /></ProtectedRoute>} />
            <Route path="/Admin/*" element={<Navigate to="/Admin/dashboard" replace />} />
            
            <Route path="/Principal/dashboard" element={<ProtectedRoute allowedRoles={['principal']}><PrincipalDashboard /></ProtectedRoute>} />
            {/* Principal Module Routes - /principal/ prefix */}
            <Route path={ROUTES.PRINCIPAL.STUDENT_DETAILS} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="student_information"><StudentDetails /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.STUDENT_ADMISSION} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="student_information"><StudentAdmission /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.ONLINE_ADMISSION_LIST} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="student_information"><OnlineAdmissionList /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.DISABLED_STUDENTS} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="student_information"><DisabledStudents /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.STAFF_DIRECTORY} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="human_resource"><StaffDirectory /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.DEPARTMENTS} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="human_resource"><Departments /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.DESIGNATIONS} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="human_resource"><Designations /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.LEAVE_MANAGEMENT} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="human_resource"><LeaveManagement /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.APPROVE_STAFF_LEAVE} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="human_resource"><ApproveStaffLeave /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.STUDENT_ATTENDANCE} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="attendance"><StudentAttendance /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.STAFF_ATTENDANCE} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="attendance"><StaffAttendance /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.APPROVE_LEAVE} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="attendance"><ApproveStudentLeave /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.ATTENDANCE_REPORT} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="attendance"><AttendanceReport /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.CLASSES} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="academics"><Classes /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.SECTIONS} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="academics"><Sections /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.CLASS_TIMETABLE} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="academics"><ClassTimetable /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.TEACHER_TIMETABLE} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="academics"><TeacherTimetable /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.ASSIGN_CLASS_TEACHER} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="academics"><AssignClassTeacher /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.SUBJECT_TEACHER} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="academics"><SubjectTeacher /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.EXAM_GROUP} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="examinations"><ExamGroup /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.EXAM_SCHEDULE} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="examinations"><ExamSchedule /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.GENERAL_EXAM_RESULT} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="examinations"><GeneralExamResult /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.MARKS_ENTRY} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="examinations"><MarksEntry /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.REPORT_CARD} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="examinations"><ReportCard /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.CBSE_REPORTS} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="examinations"><CbseReports /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.ASSIGN_INCIDENT} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="behaviour_records"><AssignIncident /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.INCIDENTS} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="behaviour_records"><Incidents /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.BEHAVIOUR_REPORTS} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="behaviour_records"><BehaviourReports /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.NOTICE_BOARD} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="communicate"><NoticeBoard /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.SEND_EMAIL} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="communicate"><SendEmail /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.SEND_SMS} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="communicate"><SendSms /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.SEARCH_FEES_PAYMENT} element={<ProtectedRoute allowedRoles={['principal']}><SearchFeesPayment /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.SEARCH_DUE_FEES} element={<ProtectedRoute allowedRoles={['principal']}><SearchDueFees /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.FEES_REMINDER} element={<ProtectedRoute allowedRoles={['principal']}><FeesReminder /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.REPORT_STUDENT_INFO} element={<ProtectedRoute allowedRoles={['principal']}><StudentInformationReport /></ProtectedRoute>} />
            <Route path={ROUTES.PRINCIPAL.REPORT_PAYROLL} element={<ProtectedRoute allowedRoles={['principal']} requiredModule="human_resource"><PayrollReport /></ProtectedRoute>} />
            <Route path="/Principal/*" element={<Navigate to="/Principal/dashboard" replace />} />
            
            <Route path="/VicePrincipal/dashboard" element={<ProtectedRoute allowedRoles={['vice_principal']}><VicePrincipalDashboard /></ProtectedRoute>} />
            
            <Route path="/Coordinator/dashboard" element={<ProtectedRoute allowedRoles={['coordinator']}><CoordinatorDashboard /></ProtectedRoute>} />
            
            <Route path="/Teacher/dashboard" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
            
            <Route path="/ClassTeacher/dashboard" element={<ProtectedRoute allowedRoles={['class_teacher']}><ClassTeacherDashboard /></ProtectedRoute>} />
            
            <Route path="/SubjectTeacher/dashboard" element={<ProtectedRoute allowedRoles={['subject_teacher']}><TeacherDashboard /></ProtectedRoute>} />
            
            <Route path="/Accountant/dashboard" element={<ProtectedRoute allowedRoles={['accountant']}><AccountantDashboard /></ProtectedRoute>} />
            
            <Route path="/Cashier/dashboard" element={<ProtectedRoute allowedRoles={['cashier']}><CashierDashboard /></ProtectedRoute>} />
            
            <Route path="/Receptionist/dashboard" element={<ProtectedRoute allowedRoles={['receptionist']}><ReceptionistDashboard /></ProtectedRoute>} />
            
            <Route path="/Librarian/dashboard" element={<ProtectedRoute allowedRoles={['librarian']}><LibrarianDashboard /></ProtectedRoute>} />
            
            <Route path="/LabAssistant/dashboard" element={<ProtectedRoute allowedRoles={['lab_assistant']}><LabAssistantDashboard /></ProtectedRoute>} />
            
            <Route path="/Driver/dashboard" element={<ProtectedRoute allowedRoles={['driver']}><DriverDashboard /></ProtectedRoute>} />
            
            <Route path="/HostelWarden/dashboard" element={<ProtectedRoute allowedRoles={['hostel_warden']}><HostelWardenDashboard /></ProtectedRoute>} />
            
            <Route path="/SportsCoach/dashboard" element={<ProtectedRoute allowedRoles={['sports_coach']}><SportsCoachDashboard /></ProtectedRoute>} />
            
            <Route path="/SecurityGuard/dashboard" element={<ProtectedRoute allowedRoles={['security_guard']}><SecurityGuardDashboard /></ProtectedRoute>} />
            
            <Route path="/MaintenanceStaff/dashboard" element={<ProtectedRoute allowedRoles={['maintenance', 'maintenance_staff']}><MaintenanceStaffDashboard /></ProtectedRoute>} />
            
            <Route path="/Peon/dashboard" element={<ProtectedRoute allowedRoles={['peon']}><PeonDashboard /></ProtectedRoute>} />
            
            <Route path="/Parent/dashboard" element={<ProtectedRoute allowedRoles={['parent']}><ParentDashboard /></ProtectedRoute>} />
            <Route path={ROUTES.PARENT.PROFILE} element={<ProtectedRoute allowedRoles={['parent']}><ParentProfile /></ProtectedRoute>} />
            <Route path={ROUTES.PARENT.FEES} element={<ProtectedRoute allowedRoles={['parent']}><ParentFees /></ProtectedRoute>} />
            <Route path={ROUTES.PARENT.PAY_ONLINE} element={<ProtectedRoute allowedRoles={['parent']}><ParentFees /></ProtectedRoute>} />
            <Route path={ROUTES.PARENT.HOMEWORK} element={<ProtectedRoute allowedRoles={['parent']}><ParentHomework /></ProtectedRoute>} />
            <Route path={ROUTES.PARENT.TIMETABLE} element={<ProtectedRoute allowedRoles={['parent']}><ParentTimetable /></ProtectedRoute>} />
            <Route path={ROUTES.PARENT.EXAM_SCHEDULE} element={<ProtectedRoute allowedRoles={['parent']}><ParentExamSchedule /></ProtectedRoute>} />
            <Route path={ROUTES.PARENT.EXAM_RESULT} element={<ProtectedRoute allowedRoles={['parent']}><ParentExamResult /></ProtectedRoute>} />
            <Route path={ROUTES.PARENT.ATTENDANCE} element={<ProtectedRoute allowedRoles={['parent']}><ParentAttendance /></ProtectedRoute>} />
            <Route path={ROUTES.PARENT.APPLY_LEAVE} element={<ProtectedRoute allowedRoles={['parent']}><ParentApplyLeave /></ProtectedRoute>} />
            <Route path={ROUTES.PARENT.TRANSPORT} element={<ProtectedRoute allowedRoles={['parent']}><ParentTransport /></ProtectedRoute>} />
            <Route path={ROUTES.PARENT.HOSTEL} element={<ProtectedRoute allowedRoles={['parent']}><ParentHostel /></ProtectedRoute>} />
            <Route path={ROUTES.PARENT.NOTICE_BOARD} element={<ProtectedRoute allowedRoles={['parent']}><ParentNoticeBoard /></ProtectedRoute>} />
            <Route path="/Parent/*" element={<Navigate to="/Parent/dashboard" replace />} />
            
            {/* ✅ Student Portal Routes */}
            <Route path="/Student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
            <Route path={ROUTES.STUDENT.PROFILE} element={<ProtectedRoute allowedRoles={['student']}><StudentPanelProfile /></ProtectedRoute>} />
            <Route path={ROUTES.STUDENT.EDIT_PROFILE} element={<ProtectedRoute allowedRoles={['student']}><EditStudentPanelProfile /></ProtectedRoute>} />
            <Route path={ROUTES.STUDENT.FEES} element={<ProtectedRoute allowedRoles={['student']}><StudentPanelFees /></ProtectedRoute>} />
            <Route path={ROUTES.STUDENT.EXAM_SCHEDULE} element={<ProtectedRoute allowedRoles={['student']}><StudentExamSchedule /></ProtectedRoute>} />
            <Route path={ROUTES.STUDENT.EXAM_RESULT} element={<ProtectedRoute allowedRoles={['student']}><StudentExamResult /></ProtectedRoute>} />
            <Route path={ROUTES.STUDENT.HOSTEL_ROOMS} element={<ProtectedRoute allowedRoles={['student']}><StudentHostelRooms /></ProtectedRoute>} />
            <Route path={ROUTES.STUDENT.TRANSPORT_ROUTES} element={<ProtectedRoute allowedRoles={['student']}><StudentTransportRoutes /></ProtectedRoute>} />
            <Route path={ROUTES.STUDENT.ATTENDANCE} element={<ProtectedRoute allowedRoles={['student']}><StudentAttendanceView /></ProtectedRoute>} />
            <Route path={ROUTES.STUDENT.APPLY_LEAVE} element={<ProtectedRoute allowedRoles={['student', 'parent']}><ApplyLeave /></ProtectedRoute>} />

            {/* ✅ School Dashboard - All school staff use this */}
            <Route
              path={ROUTES.SUPER_ADMIN.DASHBOARD}
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'organization_owner', 'school_owner', 'principal', 'teacher', 'accountant', 'receptionist', 'librarian']}>
                  <SchoolOwnerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Multi Branch */}
            <Route
              path="/super-admin/multi-branch"
              element={<Navigate to={ROUTES.SUPER_ADMIN.BRANCH_LIST} replace />}
            />
            <Route
              path={ROUTES.SUPER_ADMIN.BRANCH_LIST}
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                  <BranchList />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.SUPER_ADMIN.ADD_BRANCH}
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                  <AddBranch />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.SUPER_ADMIN.EDIT_BRANCH}
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                  <EditBranch />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.SUPER_ADMIN.BRANCH_SETTINGS}
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                  <BranchSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.SUPER_ADMIN.BRANCH_SETTINGS_ROOT}
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                  <BranchSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.SUPER_ADMIN.BRANCH_REPORT}
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                  <BranchReport />
                </ProtectedRoute>
              }
            />
            
            {/* Assign Permission (School Owner) */}
            <Route
              path="/super-admin/system-settings/assign-permission"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                  <AssignPermissionSchoolPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/system-settings/assign-permission/:roleId"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                  <AssignPermissionSchoolPage />
                </ProtectedRoute>
              }
            />

            {/* ? Student */}
            <Route
              path={ROUTES.STUDENT.DASHBOARD}
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            {/* ? Teacher */}
            <Route
              path={ROUTES.TEACHER.DASHBOARD}
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />

            {/* ? Admin Role - Uses same dashboard as Super Admin */}
            <Route
              path={ROUTES.ADMIN.DASHBOARD}
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <SchoolOwnerDashboard />
                </ProtectedRoute>
              }
            />

            {/* ? Parent */}
            <Route
              path={ROUTES.PARENT.DASHBOARD}
              element={
                <ProtectedRoute allowedRoles={['parent']}>
                  <ParentDashboard />
                </ProtectedRoute>
              }
            />

            {/* ? Principal */}
            <Route
              path={ROUTES.PRINCIPAL.DASHBOARD}
              element={
                <ProtectedRoute allowedRoles={['principal']}>
                  <PrincipalDashboard />
                </ProtectedRoute>
              }
            />
            {/* Legacy Principal route */}
            <Route
              path={ROUTES.STAFF.PRINCIPAL}
              element={
                <ProtectedRoute allowedRoles={['principal']}>
                  <PrincipalDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* ? Accountant */}
            <Route
              path={ROUTES.ACCOUNTANT.DASHBOARD}
              element={
                <ProtectedRoute allowedRoles={['accountant']}>
                  <AccountantDashboard />
                </ProtectedRoute>
              }
            />
            {/* Legacy Accountant route */}
            <Route
              path={ROUTES.STAFF.ACCOUNTANT}
              element={
                <ProtectedRoute allowedRoles={['accountant']}>
                  <AccountantDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* ? Librarian */}
            <Route
              path={ROUTES.LIBRARIAN.DASHBOARD}
              element={
                <ProtectedRoute allowedRoles={['librarian']}>
                  <LibrarianDashboard />
                </ProtectedRoute>
              }
            />
            {/* Legacy Librarian route */}
            <Route
              path={ROUTES.STAFF.LIBRARIAN}
              element={
                <ProtectedRoute allowedRoles={['librarian']}>
                  <LibrarianDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* ? Receptionist */}
            <Route
              path={ROUTES.RECEPTIONIST.DASHBOARD}
              element={
                <ProtectedRoute allowedRoles={['receptionist']}>
                  <ReceptionistDashboard />
                </ProtectedRoute>
              }
            />
            {/* Legacy Receptionist route */}
            <Route
              path={ROUTES.STAFF.RECEPTIONIST}
              element={
                <ProtectedRoute allowedRoles={['receptionist']}>
                  <ReceptionistDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* ? Generic Staff/Employee */}
            <Route
              path={ROUTES.STAFF.DASHBOARD}
              element={
                <ProtectedRoute allowedRoles={['employee', 'staff']}>
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />

            {/* ? Advanced Analytics Dashboard - School Admins */}
            <Route
              path="/super-admin/advanced-analytics"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                  <AdvancedAnalytics />
                </ProtectedRoute>
              }
            />

            {/* ? Advanced Analytics Dashboard - Master Admin (platform-wide view) */}
            <Route
              path="/master-admin/advanced-analytics"
              element={
                <ProtectedRoute allowedRoles={['master_admin']}>
                  <MasterAdminAnalytics />
                </ProtectedRoute>
              }
            />

            {/* ? GMeet Live Classes */}
            <Route path={ROUTES.SUPER_ADMIN.LIVE_CLASSES} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'student']} requiredModule="gmeet_live_classes"><LiveClasses /></ProtectedRoute>} />
            
            {/* ? Online Course */}
            <Route path={ROUTES.SUPER_ADMIN.ONLINE_COURSE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'student']} requiredModule="online_course"><OnlineCourse /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.OFFLINE_PAYMENT} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="online_course"><OfflinePayment /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.ONLINE_COURSE_SETTING} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="online_course"><OnlineCourseSetting /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.ONLINE_COURSE_REPORT} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="online_course"><OnlineCourseReport /></ProtectedRoute>} />

            {/* ? Income */}
            <Route
              path={ROUTES.SUPER_ADMIN.INCOME}
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']} requiredModule="income">
                  <Income />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.SUPER_ADMIN.ADD_INCOME}
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']} requiredModule="income">
                  <AddIncome />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.SUPER_ADMIN.SEARCH_INCOME}
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']} requiredModule="income">
                  <SearchIncome />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.SUPER_ADMIN.INCOME_HEAD}
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']} requiredModule="income">
                  <IncomeHead />
                </ProtectedRoute>
              }
            />
             {/* ? Expenses */}
             <Route
              path={ROUTES.SUPER_ADMIN.EXPENSE}
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']} requiredModule="expenses">
                  <Expense />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.SUPER_ADMIN.ADD_EXPENSE}
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']} requiredModule="expenses">
                  <AddExpense />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.SUPER_ADMIN.SEARCH_EXPENSE}
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']} requiredModule="expenses">
                  <SearchExpense />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.SUPER_ADMIN.EXPENSE_HEAD}
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']} requiredModule="expenses">
                  <ExpenseHead />
                </ProtectedRoute>
              }
            />

            {/* ? Finance Reports */}
            <Route path={ROUTES.SUPER_ADMIN.REPORT_INCOME} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']} requiredModule="income"><IncomeReport /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.REPORT_EXPENSE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']} requiredModule="expenses"><ExpenseReport /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.REPORT_INCOME_GROUP} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']} requiredModule="income"><IncomeGroupReport /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.REPORT_EXPENSE_GROUP} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']} requiredModule="expenses"><ExpenseGroupReport /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.REPORT_INC_EXP_BALANCE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']} requiredModule="income"><IncomeExpenseBalanceReport /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.REPORT_DAILY_COLLECTION} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']} requiredModule="fees_collection"><DailyCollectionReport /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.REPORT_FEES_COLLECTION} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']} requiredModule="fees_collection"><FeesCollectionReport /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.REPORT_FEES_STATEMENT} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']} requiredModule="fees_collection"><FeesStatementReport /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.REPORT_BALANCE_FEES} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']} requiredModule="fees_collection"><BalanceFeesReport /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.REPORT_BALANCE_FEES_STATEMENT} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']} requiredModule="fees_collection"><BalanceFeesStatementReport /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.REPORT_BALANCE_FEES_REMARK} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']} requiredModule="fees_collection"><BalanceFeesWithRemarkReport /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.REPORT_ONLINE_FEES} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']} requiredModule="fees_collection"><OnlineFeesCollectionReport /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.REPORT_PAYROLL} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant', 'principal']} requiredModule="human_resource"><PayrollReport /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.REPORT_STUDENT_INFO} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']}><StudentInformationReport /></ProtectedRoute>} />
            {/* 📊 NEW Report Generator V3 - Test Route */}
            <Route path="/super-admin/reports/student-generator" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']}><StudentReportGenerator /></ProtectedRoute>} />
            <Route path="/super-admin/reports/attendance-generator" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']}><AttendanceReportGenerator /></ProtectedRoute>} />
            <Route path="/super-admin/reports/finance-generator" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}><FinanceReportGenerator /></ProtectedRoute>} />
            <Route path="/super-admin/reports/exam-generator" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']}><ExamReportGenerator /></ProtectedRoute>} />
            <Route path="/super-admin/reports/hr-generator" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><HRReportGenerator /></ProtectedRoute>} />
            <Route path="/super-admin/reports/library-generator" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'librarian']}><LibraryReportGenerator /></ProtectedRoute>} />
            <Route path="/super-admin/reports/transport-generator" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><TransportReportGenerator /></ProtectedRoute>} />
            <Route path="/super-admin/reports/hostel-generator" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><HostelReportGenerator /></ProtectedRoute>} />
            <Route path="/super-admin/reports/fees-generator" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}><FeesReportGenerator /></ProtectedRoute>} />
            <Route path="/super-admin/reports/online-exam-generator" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']}><OnlineExamReportGenerator /></ProtectedRoute>} />
            
            {/* 📊 Report Center - Dashboard & Unified Reports */}
            <Route path="/super-admin/reports/*" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal', 'accountant']}><ReportCenterRoutes /></ProtectedRoute>} />

            {/* ? Fees Collection */}
            <Route
              path={ROUTES.SUPER_ADMIN.COLLECT_FEES}
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']} requiredModule="fees_collection">
                  <CollectFees />
                </ProtectedRoute>
              }
            />

            {/* ? Behaviour Records */}
            <Route
              path={ROUTES.SUPER_ADMIN.ASSIGN_INCIDENT}
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'principal']} requiredModule="behaviour_records">
                  <AssignIncident />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.SUPER_ADMIN.INCIDENTS}
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'principal']} requiredModule="behaviour_records">
                  <Incidents />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.SUPER_ADMIN.BEHAVIOUR_REPORTS}
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']} requiredModule="behaviour_records">
                  <BehaviourReports />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.SUPER_ADMIN.BEHAVIOUR_SETTING}
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="behaviour_records">
                  <BehaviourSetting />
                </ProtectedRoute>
              }
            />

            {/* ? Master Admin (Extended) */}
            <Route path={ROUTES.MASTER_ADMIN.PROFILE} element={<ProtectedRoute allowedRoles={['master_admin']}><MasterAdminProfile /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.RESET_PASSWORD} element={<ProtectedRoute allowedRoles={['master_admin']}><MasterAdminResetPassword /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.SUBSCRIPTION_PLANS} element={<ProtectedRoute allowedRoles={['master_admin']}><SubscriptionPlans /></ProtectedRoute>} />
            <Route path="/master-admin/organization-requests" element={<ProtectedRoute allowedRoles={['master_admin']}><SchoolRequests /></ProtectedRoute>} />
            {/* Backward compatibility */}
            <Route path="/master-admin/school-requests" element={<ProtectedRoute allowedRoles={['master_admin']}><SchoolRequests /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.ADD_SUBSCRIPTION_PLAN} element={<ProtectedRoute allowedRoles={['master_admin']}><AddSubscriptionPlan /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.EDIT_SUBSCRIPTION_PLAN} element={<ProtectedRoute allowedRoles={['master_admin']}><EditSubscriptionPlan /></ProtectedRoute>} />
            {/* Alternative route for edit plan */}
            <Route path="/master-admin/subscriptions/plans/:id/edit" element={<ProtectedRoute allowedRoles={['master_admin']}><EditSubscriptionPlan /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.SUBSCRIPTIONS} element={<ProtectedRoute allowedRoles={['master_admin']}><SubscriptionsList /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.SUBSCRIPTION_INVOICES} element={<ProtectedRoute allowedRoles={['master_admin']}><SubscriptionInvoices /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.SUBSCRIPTION_TRANSACTIONS} element={<ProtectedRoute allowedRoles={['master_admin']}><SubscriptionTransactions /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.BILLING_AUDIT} element={<ProtectedRoute allowedRoles={['master_admin']}><BillingAudit /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.GENERATE_BILL} element={<ProtectedRoute allowedRoles={['master_admin']}><GenerateBill /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.BULK_INVOICE} element={<ProtectedRoute allowedRoles={['master_admin']}><BulkInvoiceGenerator /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.ESTIMATES_LIST} element={<ProtectedRoute allowedRoles={['master_admin']}><EstimatesList /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.GENERATE_ESTIMATE} element={<ProtectedRoute allowedRoles={['master_admin']}><GenerateEstimate /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.QUERIES_FINDER} element={<ProtectedRoute allowedRoles={['master_admin']}><QueriesFinder /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.COMMUNICATION_SETTINGS} element={<ProtectedRoute allowedRoles={['master_admin']}><CommunicationSettingsMaster /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.EMAIL_SETTINGS} element={<ProtectedRoute allowedRoles={['master_admin']}><EmailSettingsMaster /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.PAYMENT_SETTINGS} element={<ProtectedRoute allowedRoles={['master_admin']}><PaymentSettingsMaster /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.LOGIN_PAGE_SETTINGS} element={<ProtectedRoute allowedRoles={['master_admin']}><LoginPageSettings /></ProtectedRoute>} />
            <Route path="/master-admin/system-settings/file-type" element={<ProtectedRoute allowedRoles={['master_admin']}><FileTypeSettings /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.MASTER_SCHOOL_LOGIN_SETTINGS} element={<ProtectedRoute allowedRoles={['master_admin']}><MasterSchoolLoginSettings /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.SESSION_SETTING} element={<ProtectedRoute allowedRoles={['master_admin']}><SessionSettingMaster /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.MASTER_DATA_SETTINGS} element={<ProtectedRoute allowedRoles={['master_admin']}><MasterDataSettings /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.EXPORT_IMPORT} element={<ProtectedRoute allowedRoles={['master_admin']}><ExportImport /></ProtectedRoute>} />
            <Route path="/master-admin/system-settings/branch-attendance-config" element={<ProtectedRoute allowedRoles={['master_admin']}><BranchAttendanceConfig /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.SAAS_WEBSITE_SETTINGS} element={<ProtectedRoute allowedRoles={['master_admin']}><SaasWebsiteSettings /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.FILE_MANAGER} element={<ProtectedRoute allowedRoles={['master_admin']}><FileManager /></ProtectedRoute>} />
            {/* ? Front CMS - Specific routes first to avoid route conflicts */}
            <Route path="/master-admin/front-cms/menus/:menuId/items" element={<ProtectedRoute allowedRoles={['master_admin']}><MasterAdminMenuItems /></ProtectedRoute>} />
            <Route path="/master-admin/front-cms/banners" element={<ProtectedRoute allowedRoles={['master_admin']}><BannerImages /></ProtectedRoute>} />
            <Route path="/master-admin/front-cms/media-manager" element={<ProtectedRoute allowedRoles={['master_admin']}><MediaManager /></ProtectedRoute>} />
            {/* <Route path="/master-admin/front-cms/menus" element={<ProtectedRoute allowedRoles={['master_admin']}><MasterAdminMenus /></ProtectedRoute>} /> */}
            <Route path={ROUTES.MASTER_ADMIN.FRONT_CMS} element={<ProtectedRoute allowedRoles={['master_admin']}><FrontCmsMasterAdmin /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.MODULE_HEALTH} element={<ProtectedRoute allowedRoles={['master_admin']}><ModuleHealth /></ProtectedRoute>} />
            <Route path={ROUTES.MASTER_ADMIN.ENTERPRISE_HEALTH} element={<ProtectedRoute allowedRoles={['master_admin']}><EnterpriseHealthMonitor /></ProtectedRoute>} />
            
            {/* ? Module Registry (NEW - Centralized Module Management) */}
            <Route path="/master-admin/module-registry" element={<ProtectedRoute allowedRoles={['master_admin']}><ModuleRegistryDashboard /></ProtectedRoute>} />
            <Route path="/master-admin/module-registry/add" element={<ProtectedRoute allowedRoles={['master_admin']}><AddEditModule /></ProtectedRoute>} />
            <Route path="/master-admin/module-registry/edit/:slug" element={<ProtectedRoute allowedRoles={['master_admin']}><AddEditModule /></ProtectedRoute>} />
            <Route path="/master-admin/module-registry/sync" element={<ProtectedRoute allowedRoles={['master_admin']}><SyncCenter /></ProtectedRoute>} />
            <Route path="/master-admin/module-registry/versions" element={<ProtectedRoute allowedRoles={['master_admin']}><VersionHistory /></ProtectedRoute>} />
            <Route path="/master-admin/module-registry/audit" element={<ProtectedRoute allowedRoles={['master_admin']}><ModuleRegistryAuditLog /></ProtectedRoute>} />
            
            {/* ? Custom Domain - REMOVED AS PER REQUEST */}
            {/* <Route path="/master-admin/custom-domain" element={<ProtectedRoute allowedRoles={['master_admin']}><DomainList /></ProtectedRoute>} /> */}
            {/* <Route path="/master-admin/custom-domain/instruction" element={<ProtectedRoute allowedRoles={['master_admin']}><DomainSettings /></ProtectedRoute>} /> */}

            {/* ? Master Admin Branch Management */}
            <Route path="/master-admin/branch-management" element={<ProtectedRoute allowedRoles={['master_admin']}><SchoolBranchesOverview /></ProtectedRoute>} />
            <Route path="/master-admin/branch-management/schools/:schoolId/branches" element={<ProtectedRoute allowedRoles={['master_admin']}><SchoolBranches /></ProtectedRoute>} />
            <Route path="/master-admin/branch-management/schools/:schoolId/branches/add" element={<ProtectedRoute allowedRoles={['master_admin']}><AddBranchForSchool /></ProtectedRoute>} />
            <Route path="/master-admin/branch-management/schools/:schoolId/branches/:branchId/edit" element={<ProtectedRoute allowedRoles={['master_admin']}><EditBranchForSchool /></ProtectedRoute>} />

            {/* ? School Owner Profile & Subscription */}
            <Route path={ROUTES.SUPER_ADMIN.PROFILE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'organization_owner', 'school_owner', 'principal', 'teacher', 'accountant', 'receptionist', 'librarian']}><SchoolOwnerProfile /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.RESET_PASSWORD} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'organization_owner', 'school_owner', 'principal', 'teacher', 'accountant', 'receptionist', 'librarian']}><SchoolOwnerResetPassword /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.MY_SUBSCRIPTION} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'organization_owner']}><MySubscriptionPlan /></ProtectedRoute>} />

            {/* ? Front Office */}
            <Route path={ROUTES.SUPER_ADMIN.SETUP_FRONT_OFFICE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'receptionist']} requiredModule="front_office"><SetupFrontOffice /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.ADMISSION_ENQUIRY} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'receptionist']} requiredModule="front_office"><AdmissionEnquiry /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.VISITOR_BOOK} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'receptionist']} requiredModule="front_office"><VisitorBook /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.PHONE_CALL_LOG} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'receptionist']} requiredModule="front_office"><PhoneCallLog /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.POSTAL_DISPATCH} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'receptionist']} requiredModule="front_office"><PostalDispatch /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.POSTAL_RECEIVE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'receptionist']} requiredModule="front_office"><PostalReceive /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.COMPLAIN} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'receptionist']} requiredModule="front_office"><Complain /></ProtectedRoute>} />

            {/* ? Academics */}
            <Route path={ROUTES.SUPER_ADMIN.CLASSES} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'principal']} requiredModule="academics"><Classes /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.SECTIONS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'principal']} requiredModule="academics"><Sections /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.SUBJECTS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']} requiredModule="academics"><Subjects /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.SUBJECT_GROUP} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']} requiredModule="academics"><SubjectGroup /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.SUBJECT_TEACHER} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']} requiredModule="academics"><SubjectTeacher /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.CLASS_TEACHER} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="academics"><ClassTeacher /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.CLASS_TIMETABLE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'student', 'parent', 'principal']} requiredModule="academics"><ClassTimetable /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.TEACHER_TIMETABLE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'principal']} requiredModule="academics"><TeacherTimetable /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.TIMETABLE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']} requiredModule="academics"><Timetable /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.ASSIGN_CLASS_TEACHER} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']} requiredModule="academics"><AssignClassTeacher /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.PROMOTE_STUDENT} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="academics"><PromoteStudent /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.ACADEMIC_ANALYSIS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']} requiredModule="academics"><AcademicAnalysis /></ProtectedRoute>} />

            {/* ? Student Information */}
            <Route path={ROUTES.SUPER_ADMIN.STUDENT_ADMISSION} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']} requiredModule="student_information"><StudentAdmission /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.ADMISSION_FORM_SETTINGS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="student_information"><AdmissionFormSettings /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.STUDENT_DETAILS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'accountant', 'receptionist', 'principal']} requiredModule="student_information"><StudentDetails /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.STUDENT_PROFILE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'accountant', 'receptionist', 'principal']} requiredModule="student_information"><StudentProfile /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.EDIT_STUDENT} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="student_information"><EditStudentProfile /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.ONLINE_ADMISSION_LIST} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']} requiredModule="student_information"><OnlineAdmissionList /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.EDIT_ONLINE_ADMISSION} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="student_information"><EditOnlineAdmission /></ProtectedRoute>} />
            {/* StudentCategories and StudentHouse moved to Admission Form Settings tabs - no separate routes needed */}
            <Route path={ROUTES.SUPER_ADMIN.DISABLED_STUDENTS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']} requiredModule="student_information"><DisabledStudents /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.DISABLE_REASON} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="student_information"><DisableReason /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.MULTI_CLASS_STUDENT} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="student_information"><MultiClassStudent /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.BULK_DELETE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="student_information"><BulkDelete /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.STUDENT_BULK_UPLOAD} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="student_information"><BulkUpload /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.STUDENT_ID_CARD} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="student_information"><StudentIdCard /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.STUDENT_ANALYSIS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']} requiredModule="student_information"><StudentAnalysis /></ProtectedRoute>} />

            {/* ? HR */}
            <Route path={ROUTES.SUPER_ADMIN.EMPLOYEE_FORM_SETTINGS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="human_resource"><EmployeeFormSettings /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.DEPARTMENTS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']} requiredModule="human_resource"><Departments /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.EMPLOYMENT_CATEGORY} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="human_resource"><EmploymentCategory /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.DESIGNATIONS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']} requiredModule="human_resource"><Designations /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.ADD_EMPLOYEE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="human_resource"><AddEmployee /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.EDIT_EMPLOYEE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="human_resource"><EditEmployee /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.EMPLOYEE_LIST} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="human_resource"><EmployeeList /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.STAFF_DIRECTORY} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'student', 'parent', 'principal']} requiredModule="human_resource"><StaffDirectory /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.STAFF_PROFILE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="human_resource"><StaffProfile /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.IMPORT_STAFF} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="human_resource"><ImportStaff /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.STAFF_LEAVE_TYPE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="human_resource"><StaffLeaveType /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.STAFF_APPLY_LEAVE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'employee']} requiredModule="human_resource"><StaffApplyLeave /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.APPROVE_STAFF_LEAVE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']} requiredModule="human_resource"><ApproveStaffLeave /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.EMPLOYEE_DOCUMENTS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="human_resource"><EmployeeDocuments /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.EMPLOYEE_PERFORMANCE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="human_resource"><EmployeePerformance /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.EMPLOYEE_PAYROLL} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']} requiredModule="human_resource"><EmployeePayroll /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.LEAVE_MANAGEMENT} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']} requiredModule="human_resource"><LeaveManagement /></ProtectedRoute>} />

            {/* ? Attendance */}
            <Route path={ROUTES.SUPER_ADMIN.STUDENT_ATTENDANCE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'principal']} requiredModule="attendance"><StudentAttendance /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.ATTENDANCE_BY_DATE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']} requiredModule="attendance"><AttendanceByDate /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.APPROVE_LEAVE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'principal']} requiredModule="attendance"><ApproveStudentLeave /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.STAFF_ATTENDANCE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']} requiredModule="attendance"><StaffAttendance /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.ATTENDANCE_REPORT} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'principal']} requiredModule="attendance"><AttendanceReport /></ProtectedRoute>} />
            {/* Advanced Attendance (Futuristic) */}
            <Route path={ROUTES.SUPER_ADMIN.LIVE_ATTENDANCE_DASHBOARD} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="attendance"><LiveAttendanceDashboard /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.QR_CODE_GENERATOR} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']} requiredModule="attendance"><QRCodeGenerator /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.DEVICE_MANAGEMENT} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="attendance"><DeviceManagement /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.CARD_MANAGEMENT} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="attendance"><CardManagement /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.FACE_REGISTRATION} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="attendance"><FaceRegistration /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.LIVE_FACE_ATTENDANCE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']} requiredModule="attendance"><LiveFaceAttendance /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.ATTENDANCE_RULES} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="attendance"><AttendanceRules /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.GEO_FENCE_SETUP} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="attendance"><GeoFenceSetup /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.WEARABLE_DEVICES} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="attendance"><WearableDevices /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.ATTENDANCE_ANALYTICS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']} requiredModule="attendance"><AttendanceAnalytics /></ProtectedRoute>} />

            {/* ? Task Management - Available to ALL 21 Staff Roles */}
            <Route path="/super-admin/task-management" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal', 'vice_principal', 'coordinator', 'accountant', 'cashier', 'receptionist', 'teacher', 'class_teacher', 'subject_teacher', 'librarian', 'lab_assistant', 'driver', 'hostel_warden', 'sports_coach', 'security_guard', 'maintenance_staff', 'peon']} requiredModule="task_management"><TaskDashboard /></ProtectedRoute>} />
            <Route path="/super-admin/task-management/dashboard" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal', 'vice_principal', 'coordinator', 'accountant', 'cashier', 'receptionist', 'teacher', 'class_teacher', 'subject_teacher', 'librarian', 'lab_assistant', 'driver', 'hostel_warden', 'sports_coach', 'security_guard', 'maintenance_staff', 'peon']} requiredModule="task_management.dashboard"><TaskDashboard /></ProtectedRoute>} />
            <Route path="/super-admin/task-management/tasks" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal', 'vice_principal', 'coordinator', 'accountant', 'cashier', 'receptionist', 'teacher', 'class_teacher', 'subject_teacher', 'librarian', 'lab_assistant', 'driver', 'hostel_warden', 'sports_coach', 'security_guard', 'maintenance_staff', 'peon']} requiredModule="task_management.tasks"><TaskList /></ProtectedRoute>} />
            <Route path="/super-admin/task-management/tasks/create" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal', 'vice_principal', 'coordinator']} requiredModule="task_management.tasks"><CreateEditTask /></ProtectedRoute>} />
            <Route path="/super-admin/task-management/tasks/:taskId" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal', 'vice_principal', 'coordinator', 'accountant', 'cashier', 'receptionist', 'teacher', 'class_teacher', 'subject_teacher', 'librarian', 'lab_assistant', 'driver', 'hostel_warden', 'sports_coach', 'security_guard', 'maintenance_staff', 'peon']} requiredModule="task_management.tasks"><TaskDetail /></ProtectedRoute>} />
            <Route path="/super-admin/task-management/tasks/:taskId/edit" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal', 'vice_principal', 'coordinator']} requiredModule="task_management.tasks"><CreateEditTask /></ProtectedRoute>} />
            <Route path="/super-admin/task-management/my-tasks" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal', 'vice_principal', 'coordinator', 'accountant', 'cashier', 'receptionist', 'teacher', 'class_teacher', 'subject_teacher', 'librarian', 'lab_assistant', 'driver', 'hostel_warden', 'sports_coach', 'security_guard', 'maintenance_staff', 'peon', 'employee', 'staff']} requiredModule="task_management.my_tasks"><MyTasks /></ProtectedRoute>} />
            <Route path="/super-admin/task-management/categories" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']} requiredModule="task_management.categories"><TaskCategories /></ProtectedRoute>} />
            <Route path="/super-admin/task-management/priorities" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']} requiredModule="task_management.priorities"><TaskPriorities /></ProtectedRoute>} />

            {/* ⚡ Cortex AI - India's First Thinking ERP (Add-on billing - NOT module permission) */}
            <Route path="/super-admin/cortex-ai/*" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']}><CortexAI /></ProtectedRoute>} />

            {/* 🧠 AI Evaluation (Cortex Evaluate™) - AI Paper Valuation System */}
            <Route path="/super-admin/ai-evaluation/*" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal', 'teacher', 'class_teacher', 'subject_teacher']}><AIEvaluation /></ProtectedRoute>} />

            {/* ? Fees (Remaining) */}
            <Route path={ROUTES.SUPER_ADMIN.COLLECT_FEES} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}><CollectFees /></ProtectedRoute>} />
            <Route path="/super-admin/fees-collection/fee-structures" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}><FeeStructures /></ProtectedRoute>} />
            <Route path="/super-admin/fees-collection/fee-rules" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}><FeeRules /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.FEES_GROUP} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}><FeesGroup /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.FEES_TYPE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}><FeesType /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.FEES_MASTER} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}><FeesMaster /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.ASSIGN_FEE_MASTER} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}><AssignFeeGroup /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.ASSIGN_FEE_GROUP} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}><AssignFeeGroup /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.STUDENT_FEES} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}><StudentFees /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.SEARCH_FEES_PAYMENT} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant', 'principal']}><SearchFeesPayment /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.SEARCH_DUE_FEES} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant', 'principal']}><SearchDueFees /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.FEES_DISCOUNT} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}><FeesDiscount /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.FEES_CARRY_FORWARD} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}><FeesCarryForward /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.FEES_REMINDER} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant', 'principal']}><FeesReminder /></ProtectedRoute>} />
            {/* 🧾 Unified Print Receipt - All types (fees, hostel, transport, refund) */}
            <Route path="/super-admin/fees-collection/print-receipt/combined" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}><PrintReceipt /></ProtectedRoute>} />
            <Route path="/super-admin/fees-collection/print-receipt/:type/:paymentId" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}><PrintReceipt /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.QUICK_FEES} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}><QuickFees /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.ONLINE_PAYMENT} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}><OnlinePayment /></ProtectedRoute>} />
            <Route path="/super-admin/fees-collection/offline-bank-payments" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant']}><OfflineBankPayments /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.FEES_ANALYSIS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant', 'principal']}><FeesAnalysis /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.REFUND_APPROVALS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']}><RefundApprovals /></ProtectedRoute>} />
            {/* 🌟 Fee Dashboard (Simplified) */}
            <Route path="/super-admin/fees-collection/fee-dashboard" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'accountant', 'principal']}><FeeDashboard /></ProtectedRoute>} />

            {/* ? Examinations */}
            <Route path={ROUTES.SUPER_ADMIN.EXAM_GROUP} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'principal']} requiredModule="examinations"><ExamGroup /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.EXAM_LIST} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']} requiredModule="examinations"><ExamList /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.EXAM_SCHEDULE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'student', 'parent', 'principal']} requiredModule="examinations"><ExamSchedule /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.EXAM_ATTENDANCE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']} requiredModule="examinations"><ExamAttendance /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.MARKS_ENTRY} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'principal']} requiredModule="examinations"><MarksEntry /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.MARKS_DIVISION} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><MarksDivision /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.MARKS_GRADE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><MarksGrade /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.GENERAL_EXAM_RESULT} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'principal']} requiredModule="examinations"><GeneralExamResult /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.GENERAL_EXAM_SCHEDULE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']} requiredModule="examinations"><GeneralExamSchedule /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.CBSE_EXAM} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><CbseExam /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.CBSE_SETTINGS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><CbseSettings /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.CBSE_TERM} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><CbseTerm /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.CBSE_ASSESSMENT} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><CbseAssessment /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.CBSE_OBSERVATION} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><CbseObservation /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.CBSE_OBSERVATION_PARAM} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><CbseObservationParameter /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.CBSE_EXAM_GRADE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><CbseExamGrade /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.ADD_EXAM_SUBJECTS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><AddExamSubjects /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.ASSIGN_STUDENTS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><AssignStudents /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.ENTER_MARKS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']} requiredModule="examinations"><EnterMarks /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.LINK_EXAM} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><LinkExam /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.GENERATE_RANK} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><GenerateRank /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.GENERATE_TEMPLATE_RANK} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><GenerateTemplateRank /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.MARKSHEET_TEMPLATE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><MarksheetTemplate /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.PRINT_MARKSHEET} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><PrintMarksheet /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.PRINT_MARKSHEET_GENERAL} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><PrintMarksheetGeneral /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.PRINT_ADMIT_CARD} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><PrintAdmitCard /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.DESIGN_MARKSHEET} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><DesignMarksheet /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.DESIGN_ADMIT_CARD} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><DesignAdmitCard /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.TEACHER_REMARKS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']} requiredModule="examinations"><TeacherRemarks /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.ASSIGN_OBSERVATION} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><AssignObservation /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.CBSE_REPORTS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']} requiredModule="examinations"><CbseReports /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.REPORT_CARD} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']} requiredModule="examinations"><ReportCard /></ProtectedRoute>} />
            {/* Examination Setup (New Engine) */}
            <Route path={ROUTES.SUPER_ADMIN.BOARD_CONFIGURATION} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><BoardConfiguration /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.TERM_MANAGEMENT} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><TermManagement /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.EXAM_TYPE_MASTER} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><ExamTypeMaster /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.GRADE_SCALE_BUILDER} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><GradeScaleBuilder /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.EXAM_GROUP_MANAGEMENT} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="examinations"><ExamGroupManagement /></ProtectedRoute>} />

            {/* ? Library */}
            <Route path={ROUTES.SUPER_ADMIN.LIBRARY_BOOKS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'librarian']} requiredModule="library"><LibraryBooks /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.LIBRARY_BOOK_ISSUED} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'librarian']} requiredModule="library"><LibraryBookIssued /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.LIBRARY_MEMBERS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'librarian']} requiredModule="library"><LibraryMembers /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.LIBRARY_ISSUE_RETURN} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'librarian']} requiredModule="library"><LibraryIssueReturn /></ProtectedRoute>} />

            {/* ? Hostel */}
            <Route path={ROUTES.SUPER_ADMIN.HOSTELS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="hostel"><Hostels /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.HOSTEL_ROOMS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="hostel"><HostelRooms /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.ROOM_TYPES} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="hostel"><RoomTypes /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.HOSTEL_FEE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="hostel"><HostelFee /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.HOSTEL_ANALYSIS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="hostel"><HostelAnalysis /></ProtectedRoute>} />

            {/* ? Transport */}
            <Route path={ROUTES.SUPER_ADMIN.TRANSPORT_ROUTES} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="transport"><TransportRoutes /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.TRANSPORT_VEHICLES} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="transport"><TransportVehicles /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.PICKUP_POINTS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="transport"><PickupPoints /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.ROUTE_PICKUP_POINT} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="transport"><RoutePickupPoint /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.ASSIGN_VEHICLE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="transport"><AssignVehicle /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.STUDENT_TRANSPORT_FEES} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="transport"><StudentTransportFees /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.TRANSPORT_FEES_MASTER} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="transport"><TransportFeesMaster /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.TRANSPORT_ANALYSIS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="transport"><TransportAnalysis /></ProtectedRoute>} />

            {/* ? Communicate */}
            <Route path={ROUTES.SUPER_ADMIN.NOTICE_BOARD} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'student', 'parent', 'principal']} requiredModule="communicate"><NoticeBoard /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.SEND_EMAIL} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']} requiredModule="communicate"><SendEmail /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.SEND_SMS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal']} requiredModule="communicate"><SendSms /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.COMPOSE_MESSAGE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="communicate"><ComposeMessage /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.EMAIL_SMS_LOG} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="communicate"><EmailSmsLog /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.WHATSAPP} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="communicate"><WhatsAppDashboard /></ProtectedRoute>} />

            {/* ? JashSync - Brain-Connected Messenger (Separate Module) */}
            <Route path={ROUTES.SUPER_ADMIN.JASHSYNC} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'principal', 'class_teacher', 'subject_teacher']}><JashSyncMain /></ProtectedRoute>} />

            {/* ? QR Attendance */}
            <Route path={ROUTES.SUPER_ADMIN.QR_ATTENDANCE_SETTING} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="qr_code_attendance"><QrAttendanceSetting /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.QR_ATTENDANCE_SCAN} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="qr_code_attendance"><QrAttendanceScan /></ProtectedRoute>} />

            {/* ? Alumni */}
            <Route path={ROUTES.SUPER_ADMIN.ALUMNI_LIST} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="alumni"><AlumniList /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.ALUMNI_EVENTS} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="alumni"><AlumniEvents /></ProtectedRoute>} />

            {/* ? Download Center */}
            <Route path={ROUTES.SUPER_ADMIN.DOWNLOAD_CENTER} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="download_center"><DownloadCenter /></ProtectedRoute>} />

            {/* ? System Settings */}
            <Route path={ROUTES.SUPER_ADMIN.SETTINGS_GENERAL} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="system_settings"><GeneralSetting /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.SETTINGS_ROLE_PERMISSION} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="system_settings"><SchoolOwnerRolePermission /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.SETTINGS_PRINT_HEADER} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="system_settings"><PrintHeaderFooter /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.SETTINGS_SESSION} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="system_settings"><SessionSetting /></ProtectedRoute>} />

            {/* ? School Owner Assign Permission (Deep Link) */}
            <Route path="/super-admin/system-settings/assign-permission" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="system_settings"><AssignPermissionSchoolPage /></ProtectedRoute>} />
            <Route path="/super-admin/system-settings/assign-permission/:roleId" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="system_settings"><AssignPermissionSchoolPage /></ProtectedRoute>} />

            {/* Front CMS - Specific routes first to avoid route conflicts */}
            <Route path="/super-admin/front-cms/menus/:menuId/items" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="front_cms"><MenuItems /></ProtectedRoute>} />
            <Route path="/super-admin/front-cms/menus" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="front_cms"><Menus /></ProtectedRoute>} />
            
            <Route path="/super-admin/front-cms/pages/add" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="front_cms"><AddEditPage /></ProtectedRoute>} />
            <Route path="/super-admin/front-cms/pages/edit/:pageId" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="front_cms"><AddEditPage /></ProtectedRoute>} />
            <Route path="/super-admin/front-cms/pages" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="front_cms"><Pages /></ProtectedRoute>} />
            
            <Route path="/super-admin/front-cms/events/add" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="front_cms"><AddEditEvent /></ProtectedRoute>} />
            <Route path="/super-admin/front-cms/events/edit/:eventId" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="front_cms"><AddEditEvent /></ProtectedRoute>} />
            <Route path="/super-admin/front-cms/events" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="front_cms"><Events /></ProtectedRoute>} />
            
            <Route path="/super-admin/front-cms/gallery/add" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="front_cms"><AddEditGallery /></ProtectedRoute>} />
            <Route path="/super-admin/front-cms/gallery/edit/:galleryId" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="front_cms"><AddEditGallery /></ProtectedRoute>} />
            <Route path="/super-admin/front-cms/gallery" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="front_cms"><Gallery /></ProtectedRoute>} />
            
            <Route path="/super-admin/front-cms/news/add" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="front_cms"><AddEditNews /></ProtectedRoute>} />
            <Route path="/super-admin/front-cms/news/edit/:newsId" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="front_cms"><AddEditNews /></ProtectedRoute>} />
            <Route path="/super-admin/front-cms/news" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="front_cms"><News /></ProtectedRoute>} />
            <Route path="/super-admin/front-cms/banners" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="front_cms.banner_images"><BannerImages /></ProtectedRoute>} />
            <Route path="/super-admin/front-cms/banner-images" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="front_cms.banner_images"><BannerImages /></ProtectedRoute>} />
            <Route path="/super-admin/front-cms/media-manager" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="front_cms.media_manager"><MediaManager /></ProtectedRoute>} />
            <Route path="/super-admin/front-cms/settings" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="front_cms"><FrontCMSSetting /></ProtectedRoute>} />
            <Route path="/super-admin/front-cms/online-admission-setting" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="front_cms"><FrontCmsOnlineAdmissionSetting /></ProtectedRoute>} />
            {/* Front CMS Editor - must be last to avoid catching /menus route */}
            <Route path="/super-admin/front-cms/:tab?" element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="front_cms"><FrontCmsSchoolOwner /></ProtectedRoute>} />

            {/* ? Homework */}
            <Route path={ROUTES.SUPER_ADMIN.HOMEWORK_LIST} element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'student', 'parent']} requiredModule="homework"><HomeworkList /></ProtectedRoute>} />

            {/* ? Inventory */}
            <Route path={ROUTES.SUPER_ADMIN.INV_ADD_ITEM} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="inventory"><AddItem /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.INV_ADD_STOCK} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="inventory"><AddItemStock /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.INV_ISSUE_ITEM} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="inventory"><IssueItem /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.INV_CATEGORY} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="inventory"><ItemCategory /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.INV_STORE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="inventory"><ItemStore /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.INV_SUPPLIER} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="inventory"><ItemSupplier /></ProtectedRoute>} />

            {/* ? Certificate */}
            <Route path={ROUTES.SUPER_ADMIN.CERT_TEMPLATES} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="certificate"><CertificateTemplates /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.CERT_GENERATE} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="certificate"><GenerateCertificate /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.CERT_HISTORY} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="certificate"><CertificateHistory /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.CERT_STUDENT} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="certificate"><StudentCertificate /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.CERT_GENERATE_ID} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="certificate"><GenerateIDCard /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.CERT_STAFF_ID} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="certificate"><StaffIDCard /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.CERT_GENERATE_STAFF_ID} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="certificate"><GenerateStaffIDCard /></ProtectedRoute>} />
            <Route path={ROUTES.SUPER_ADMIN.CERT_STUDENT_ID} element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} requiredModule="certificate"><StudentIDCard /></ProtectedRoute>} />

            {/* ═══════════════════════════════════════════════════════════════════════════
                SHARED STAFF MODULE ROUTES - Dynamic /:roleSlug/ prefix
                These routes work for ALL 20 staff roles with their own URL prefix.
                The StaffModuleRoute component validates the URL's roleSlug matches
                the logged-in user's actual role.
                ═══════════════════════════════════════════════════════════════════════════ */}
            
            {/* Student Information */}
            <Route path="/:roleSlug/student-information/details" element={<StaffModuleRoute requiredModule="student_information"><StudentDetails /></StaffModuleRoute>} />
            <Route path="/:roleSlug/student-information/admission" element={<StaffModuleRoute requiredModule="student_information"><StudentAdmission /></StaffModuleRoute>} />
            <Route path="/:roleSlug/student-information/online-admission" element={<StaffModuleRoute requiredModule="student_information"><OnlineAdmissionList /></StaffModuleRoute>} />
            <Route path="/:roleSlug/student-information/disabled-students" element={<StaffModuleRoute requiredModule="student_information"><DisabledStudents /></StaffModuleRoute>} />
            <Route path="/:roleSlug/student-information/profile/:studentId" element={<StaffModuleRoute requiredModule="student_information"><StudentProfile /></StaffModuleRoute>} />
            <Route path="/:roleSlug/student-information/id-card" element={<StaffModuleRoute requiredModule="student_information"><StudentIdCard /></StaffModuleRoute>} />
            
            {/* Front Office */}
            <Route path="/:roleSlug/front-office/admission-enquiry" element={<StaffModuleRoute requiredModule="front_office"><AdmissionEnquiry /></StaffModuleRoute>} />
            <Route path="/:roleSlug/front-office/visitor-book" element={<StaffModuleRoute requiredModule="front_office"><VisitorBook /></StaffModuleRoute>} />
            <Route path="/:roleSlug/front-office/phone-call-log" element={<StaffModuleRoute requiredModule="front_office"><PhoneCallLog /></StaffModuleRoute>} />
            <Route path="/:roleSlug/front-office/postal-dispatch" element={<StaffModuleRoute requiredModule="front_office"><PostalDispatch /></StaffModuleRoute>} />
            <Route path="/:roleSlug/front-office/postal-receive" element={<StaffModuleRoute requiredModule="front_office"><PostalReceive /></StaffModuleRoute>} />
            <Route path="/:roleSlug/front-office/complain" element={<StaffModuleRoute requiredModule="front_office"><Complain /></StaffModuleRoute>} />
            <Route path="/:roleSlug/front-office/setup" element={<StaffModuleRoute requiredModule="front_office"><SetupFrontOffice /></StaffModuleRoute>} />
            
            {/* Academics */}
            <Route path="/:roleSlug/academics/classes" element={<StaffModuleRoute requiredModule="academics"><Classes /></StaffModuleRoute>} />
            <Route path="/:roleSlug/academics/sections" element={<StaffModuleRoute requiredModule="academics"><Sections /></StaffModuleRoute>} />
            <Route path="/:roleSlug/academics/subjects" element={<StaffModuleRoute requiredModule="academics"><Subjects /></StaffModuleRoute>} />
            <Route path="/:roleSlug/academics/subject-group" element={<StaffModuleRoute requiredModule="academics"><SubjectGroup /></StaffModuleRoute>} />
            <Route path="/:roleSlug/academics/class-timetable" element={<StaffModuleRoute requiredModule="academics"><ClassTimetable /></StaffModuleRoute>} />
            <Route path="/:roleSlug/academics/teacher-timetable" element={<StaffModuleRoute requiredModule="academics"><TeacherTimetable /></StaffModuleRoute>} />
            <Route path="/:roleSlug/academics/assign-class-teacher" element={<StaffModuleRoute requiredModule="academics"><AssignClassTeacher /></StaffModuleRoute>} />
            <Route path="/:roleSlug/academics/subject-teacher" element={<StaffModuleRoute requiredModule="academics"><SubjectTeacher /></StaffModuleRoute>} />
            
            {/* Attendance */}
            <Route path="/:roleSlug/attendance/student-attendance" element={<StaffModuleRoute requiredModule="attendance"><StudentAttendance /></StaffModuleRoute>} />
            <Route path="/:roleSlug/attendance/attendance-by-date" element={<StaffModuleRoute requiredModule="attendance"><AttendanceByDate /></StaffModuleRoute>} />
            <Route path="/:roleSlug/attendance/approve-student-leave" element={<StaffModuleRoute requiredModule="attendance"><ApproveStudentLeave /></StaffModuleRoute>} />
            <Route path="/:roleSlug/attendance/staff-attendance" element={<StaffModuleRoute requiredModule="attendance"><StaffAttendance /></StaffModuleRoute>} />
            <Route path="/:roleSlug/attendance/attendance-report" element={<StaffModuleRoute requiredModule="attendance"><AttendanceReport /></StaffModuleRoute>} />
            
            {/* Examinations */}
            <Route path="/:roleSlug/examinations/exam-group" element={<StaffModuleRoute requiredModule="examinations"><ExamGroup /></StaffModuleRoute>} />
            <Route path="/:roleSlug/examinations/exam-group/:groupId/exams" element={<StaffModuleRoute requiredModule="examinations"><ExamList /></StaffModuleRoute>} />
            <Route path="/:roleSlug/examinations/exam-schedule" element={<StaffModuleRoute requiredModule="examinations"><ExamSchedule /></StaffModuleRoute>} />
            <Route path="/:roleSlug/examinations/general-exam-result" element={<StaffModuleRoute requiredModule="examinations"><GeneralExamResult /></StaffModuleRoute>} />
            <Route path="/:roleSlug/examinations/marks-entry" element={<StaffModuleRoute requiredModule="examinations"><MarksEntry /></StaffModuleRoute>} />
            <Route path="/:roleSlug/examinations/enter-marks" element={<StaffModuleRoute requiredModule="examinations"><EnterMarks /></StaffModuleRoute>} />
            <Route path="/:roleSlug/examinations/report-card" element={<StaffModuleRoute requiredModule="examinations"><ReportCard /></StaffModuleRoute>} />
            <Route path="/:roleSlug/examinations/cbse-reports" element={<StaffModuleRoute requiredModule="examinations"><CbseReports /></StaffModuleRoute>} />
            
            {/* Behaviour Records */}
            <Route path="/:roleSlug/behaviour-records/assign-incident" element={<StaffModuleRoute requiredModule="behaviour_records"><AssignIncident /></StaffModuleRoute>} />
            <Route path="/:roleSlug/behaviour-records/incidents" element={<StaffModuleRoute requiredModule="behaviour_records"><Incidents /></StaffModuleRoute>} />
            <Route path="/:roleSlug/behaviour-records/reports" element={<StaffModuleRoute requiredModule="behaviour_records"><BehaviourReports /></StaffModuleRoute>} />
            
            {/* Fees Collection */}
            <Route path="/:roleSlug/fees-collection/collect-fees" element={<StaffModuleRoute requiredModule="fees_collection"><CollectFees /></StaffModuleRoute>} />
            <Route path="/:roleSlug/fees-collection/fee-structures" element={<StaffModuleRoute requiredModule="fees_collection"><FeeStructures /></StaffModuleRoute>} />
            <Route path="/:roleSlug/fees-collection/fee-rules" element={<StaffModuleRoute requiredModule="fees_collection"><FeeRules /></StaffModuleRoute>} />
            <Route path="/:roleSlug/fees-collection/search-fees-payment" element={<StaffModuleRoute><SearchFeesPayment /></StaffModuleRoute>} />
            <Route path="/:roleSlug/fees-collection/search-due-fees" element={<StaffModuleRoute><SearchDueFees /></StaffModuleRoute>} />
            <Route path="/:roleSlug/fees-collection/fees-master" element={<StaffModuleRoute requiredModule="fees_collection"><FeesMaster /></StaffModuleRoute>} />
            <Route path="/:roleSlug/fees-collection/fees-group" element={<StaffModuleRoute requiredModule="fees_collection"><FeesGroup /></StaffModuleRoute>} />
            <Route path="/:roleSlug/fees-collection/fees-type" element={<StaffModuleRoute requiredModule="fees_collection"><FeesType /></StaffModuleRoute>} />
            <Route path="/:roleSlug/fees-collection/fees-discount" element={<StaffModuleRoute requiredModule="fees_collection"><FeesDiscount /></StaffModuleRoute>} />
            <Route path="/:roleSlug/fees-collection/fees-reminder" element={<StaffModuleRoute><FeesReminder /></StaffModuleRoute>} />
            <Route path="/:roleSlug/fees-collection/quick-fees" element={<StaffModuleRoute requiredModule="fees_collection"><QuickFees /></StaffModuleRoute>} />
            <Route path="/:roleSlug/fees-collection/offline-bank-payments" element={<StaffModuleRoute requiredModule="fees_collection"><OfflineBankPayments /></StaffModuleRoute>} />
            <Route path="/:roleSlug/fees-collection/online-payment" element={<StaffModuleRoute requiredModule="fees_collection"><OnlinePayment /></StaffModuleRoute>} />
            <Route path="/:roleSlug/fees-collection/student-fees/:studentId" element={<StaffModuleRoute requiredModule="fees_collection"><StudentFees /></StaffModuleRoute>} />
            {/* 🧾 Unified Print Receipt - Staff routes */}
            <Route path="/:roleSlug/fees-collection/print-receipt/combined" element={<StaffModuleRoute><PrintReceipt /></StaffModuleRoute>} />
            <Route path="/:roleSlug/fees-collection/print-receipt/:type/:paymentId" element={<StaffModuleRoute><PrintReceipt /></StaffModuleRoute>} />
            {/* 🌟 Fee Dashboard (Simplified) */}
            <Route path="/:roleSlug/fees-collection/fee-dashboard" element={<StaffModuleRoute requiredModule="fees_collection"><FeeDashboard /></StaffModuleRoute>} />
            
            {/* Finance */}
            <Route path="/:roleSlug/finance/income" element={<StaffModuleRoute requiredModule="income"><Income /></StaffModuleRoute>} />
            <Route path="/:roleSlug/finance/add-income" element={<StaffModuleRoute requiredModule="income"><AddIncome /></StaffModuleRoute>} />
            <Route path="/:roleSlug/finance/search-income" element={<StaffModuleRoute requiredModule="income"><SearchIncome /></StaffModuleRoute>} />
            <Route path="/:roleSlug/finance/income-head" element={<StaffModuleRoute requiredModule="income"><IncomeHead /></StaffModuleRoute>} />
            <Route path="/:roleSlug/finance/expense" element={<StaffModuleRoute requiredModule="expenses"><Expense /></StaffModuleRoute>} />
            <Route path="/:roleSlug/finance/add-expense" element={<StaffModuleRoute requiredModule="expenses"><AddExpense /></StaffModuleRoute>} />
            <Route path="/:roleSlug/finance/search-expense" element={<StaffModuleRoute requiredModule="expenses"><SearchExpense /></StaffModuleRoute>} />
            <Route path="/:roleSlug/finance/expense-head" element={<StaffModuleRoute requiredModule="expenses"><ExpenseHead /></StaffModuleRoute>} />
            
            {/* Human Resource */}
            <Route path="/:roleSlug/human-resource/staff-directory" element={<StaffModuleRoute requiredModule="human_resource"><StaffDirectory /></StaffModuleRoute>} />
            <Route path="/:roleSlug/human-resource/departments" element={<StaffModuleRoute requiredModule="human_resource"><Departments /></StaffModuleRoute>} />
            <Route path="/:roleSlug/human-resource/designations" element={<StaffModuleRoute requiredModule="human_resource"><Designations /></StaffModuleRoute>} />
            <Route path="/:roleSlug/human-resource/leave-management" element={<StaffModuleRoute requiredModule="human_resource"><LeaveManagement /></StaffModuleRoute>} />
            <Route path="/:roleSlug/human-resource/approve-staff-leave" element={<StaffModuleRoute requiredModule="human_resource"><ApproveStaffLeave /></StaffModuleRoute>} />
            <Route path="/:roleSlug/human-resource/staff-apply-leave" element={<StaffModuleRoute requiredModule="human_resource"><StaffApplyLeave /></StaffModuleRoute>} />
            <Route path="/:roleSlug/human-resource/payroll" element={<StaffModuleRoute requiredModule="human_resource"><EmployeePayroll /></StaffModuleRoute>} />
            <Route path="/:roleSlug/human-resource/staff-profile/:employeeId" element={<StaffModuleRoute requiredModule="human_resource"><StaffProfile /></StaffModuleRoute>} />
            
            {/* Communicate */}
            <Route path="/:roleSlug/communicate/notice-board" element={<StaffModuleRoute requiredModule="communicate"><NoticeBoard /></StaffModuleRoute>} />
            <Route path="/:roleSlug/communicate/send-email" element={<StaffModuleRoute requiredModule="communicate"><SendEmail /></StaffModuleRoute>} />
            <Route path="/:roleSlug/communicate/send-sms" element={<StaffModuleRoute requiredModule="communicate"><SendSms /></StaffModuleRoute>} />
            
            {/* Library */}
            <Route path="/:roleSlug/library/book-list" element={<StaffModuleRoute requiredModule="library"><LibraryBooks /></StaffModuleRoute>} />
            <Route path="/:roleSlug/library/books" element={<StaffModuleRoute requiredModule="library"><LibraryBooks /></StaffModuleRoute>} />
            <Route path="/:roleSlug/library/book-issued" element={<StaffModuleRoute requiredModule="library"><LibraryBookIssued /></StaffModuleRoute>} />
            <Route path="/:roleSlug/library/members" element={<StaffModuleRoute requiredModule="library"><LibraryMembers /></StaffModuleRoute>} />
            <Route path="/:roleSlug/library/issue-return" element={<StaffModuleRoute requiredModule="library"><LibraryIssueReturn /></StaffModuleRoute>} />
            <Route path="/:roleSlug/library/add-book" element={<StaffModuleRoute requiredModule="library"><LibraryBooks /></StaffModuleRoute>} />
            <Route path="/:roleSlug/library/library-card" element={<StaffModuleRoute requiredModule="library"><LibraryBooks /></StaffModuleRoute>} />
            
            {/* Hostel */}
            <Route path="/:roleSlug/hostel/hostels" element={<StaffModuleRoute requiredModule="hostel"><Hostels /></StaffModuleRoute>} />
            <Route path="/:roleSlug/hostel/hostel-rooms" element={<StaffModuleRoute requiredModule="hostel"><HostelRooms /></StaffModuleRoute>} />
            <Route path="/:roleSlug/hostel/room-types" element={<StaffModuleRoute requiredModule="hostel"><RoomTypes /></StaffModuleRoute>} />
            <Route path="/:roleSlug/hostel/hostel-fee" element={<StaffModuleRoute requiredModule="hostel"><HostelFee /></StaffModuleRoute>} />
            <Route path="/:roleSlug/hostel/hostel-analysis" element={<StaffModuleRoute requiredModule="hostel"><HostelAnalysis /></StaffModuleRoute>} />
            
            {/* Transport */}
            <Route path="/:roleSlug/transport/transport-routes" element={<StaffModuleRoute requiredModule="transport"><TransportRoutes /></StaffModuleRoute>} />
            <Route path="/:roleSlug/transport/transport-vehicles" element={<StaffModuleRoute requiredModule="transport"><TransportVehicles /></StaffModuleRoute>} />
            <Route path="/:roleSlug/transport/pickup-points" element={<StaffModuleRoute requiredModule="transport"><PickupPoints /></StaffModuleRoute>} />
            <Route path="/:roleSlug/transport/route-pickup-point" element={<StaffModuleRoute requiredModule="transport"><RoutePickupPoint /></StaffModuleRoute>} />
            <Route path="/:roleSlug/transport/assign-vehicle" element={<StaffModuleRoute requiredModule="transport"><AssignVehicle /></StaffModuleRoute>} />
            <Route path="/:roleSlug/transport/student-transport-fees" element={<StaffModuleRoute requiredModule="transport"><StudentTransportFees /></StaffModuleRoute>} />
            <Route path="/:roleSlug/transport/transport-fees-master" element={<StaffModuleRoute requiredModule="transport"><TransportFeesMaster /></StaffModuleRoute>} />
            <Route path="/:roleSlug/transport/transport-analysis" element={<StaffModuleRoute requiredModule="transport"><TransportAnalysis /></StaffModuleRoute>} />
            
            {/* Inventory */}
            <Route path="/:roleSlug/inventory/issue-item" element={<StaffModuleRoute requiredModule="inventory"><IssueItem /></StaffModuleRoute>} />
            <Route path="/:roleSlug/inventory/add-item-stock" element={<StaffModuleRoute requiredModule="inventory"><AddItemStock /></StaffModuleRoute>} />
            <Route path="/:roleSlug/inventory/item-stock" element={<StaffModuleRoute requiredModule="inventory"><AddItemStock /></StaffModuleRoute>} />
            <Route path="/:roleSlug/inventory/add-item" element={<StaffModuleRoute requiredModule="inventory"><AddItem /></StaffModuleRoute>} />
            <Route path="/:roleSlug/inventory/item-category" element={<StaffModuleRoute requiredModule="inventory"><ItemCategory /></StaffModuleRoute>} />
            <Route path="/:roleSlug/inventory/item-store" element={<StaffModuleRoute requiredModule="inventory"><ItemStore /></StaffModuleRoute>} />
            <Route path="/:roleSlug/inventory/item-supplier" element={<StaffModuleRoute requiredModule="inventory"><ItemSupplier /></StaffModuleRoute>} />
            
            {/* Homework & Lesson Plan */}
            <Route path="/:roleSlug/homework/add-homework" element={<StaffModuleRoute requiredModule="homework"><HomeworkList /></StaffModuleRoute>} />
            <Route path="/:roleSlug/homework/homework-list" element={<StaffModuleRoute requiredModule="homework"><HomeworkList /></StaffModuleRoute>} />
            <Route path="/:roleSlug/homework/evaluate-homework" element={<StaffModuleRoute requiredModule="homework"><HomeworkList /></StaffModuleRoute>} />
            <Route path="/:roleSlug/lesson-plan/manage-lessons" element={<StaffModuleRoute requiredModule="homework"><HomeworkList /></StaffModuleRoute>} />
            <Route path="/:roleSlug/lesson-plan/syllabus-status" element={<StaffModuleRoute requiredModule="homework"><HomeworkList /></StaffModuleRoute>} />
            
            {/* Live Classes */}
            <Route path="/:roleSlug/gmeet-live-classes/live-classes" element={<StaffModuleRoute requiredModule="gmeet_live_classes"><LiveClasses /></StaffModuleRoute>} />
            <Route path="/:roleSlug/gmeet-live-classes/live-meeting" element={<StaffModuleRoute requiredModule="gmeet_live_classes"><LiveClasses /></StaffModuleRoute>} />
            
            {/* Online Course */}
            <Route path="/:roleSlug/online-course" element={<StaffModuleRoute requiredModule="online_course"><OnlineCourse /></StaffModuleRoute>} />
            
            {/* Reports */}
            <Route path="/:roleSlug/reports/student-information-report" element={<StaffModuleRoute><StudentInformationReport /></StaffModuleRoute>} />
            <Route path="/:roleSlug/reports/attendance-report" element={<StaffModuleRoute requiredModule="attendance"><AttendanceReport /></StaffModuleRoute>} />
            <Route path="/:roleSlug/reports/payroll-report" element={<StaffModuleRoute requiredModule="human_resource"><PayrollReport /></StaffModuleRoute>} />
            <Route path="/:roleSlug/reports/income-report" element={<StaffModuleRoute requiredModule="income"><IncomeReport /></StaffModuleRoute>} />
            <Route path="/:roleSlug/reports/expense-report" element={<StaffModuleRoute requiredModule="expenses"><ExpenseReport /></StaffModuleRoute>} />
            <Route path="/:roleSlug/reports/income-expense-balance-report" element={<StaffModuleRoute requiredModule="income"><IncomeExpenseBalanceReport /></StaffModuleRoute>} />
            <Route path="/:roleSlug/reports/daily-collection-report" element={<StaffModuleRoute requiredModule="fees_collection"><DailyCollectionReport /></StaffModuleRoute>} />
            <Route path="/:roleSlug/reports/fees-collection-report" element={<StaffModuleRoute requiredModule="fees_collection"><FeesCollectionReport /></StaffModuleRoute>} />
            <Route path="/:roleSlug/reports/fees-statement-report" element={<StaffModuleRoute requiredModule="fees_collection"><FeesStatementReport /></StaffModuleRoute>} />
            <Route path="/:roleSlug/reports/balance-fees-report" element={<StaffModuleRoute requiredModule="fees_collection"><BalanceFeesReport /></StaffModuleRoute>} />
            <Route path="/:roleSlug/reports/library/book-issue" element={<StaffModuleRoute requiredModule="library"><LibraryBookIssued /></StaffModuleRoute>} />
            
            {/* Profile & Password (available to all staff) */}
            <Route path="/:roleSlug/profile" element={<StaffModuleRoute><SchoolOwnerProfile /></StaffModuleRoute>} />
            <Route path="/:roleSlug/reset-password" element={<StaffModuleRoute><SchoolOwnerResetPassword /></StaffModuleRoute>} />

            {/* ? DYNAMIC NEW MODULES */}
            {NEW_MODULES.map((module) => (
              <React.Fragment key={module.key}>
                <Route 
                  path={module.route.path} 
                  element={
                    <ProtectedRoute allowedRoles={[module.role]} requiredModule={module.key}>
                      {module.route.element}
                    </ProtectedRoute>
                  } 
                />
                {!module.ignoreSubmenuRoutes && module.sidebar?.submenu?.map((sub, idx) => (
                  <Route
                    key={`${module.key}-sub-${idx}`}
                    path={sub.path}
                    element={
                      <ProtectedRoute allowedRoles={[module.role]} requiredModule={module.key}>
                        <PlaceholderModule title={sub.title} moduleName={`${module.key}.${sub.path.split('/').filter(Boolean).pop()?.replace(/-/g, '_')}`} />
                      </ProtectedRoute>
                    }
                  />
                ))}
              </React.Fragment>
            ))}

            {/* Fallback for path-based access on main domain (Moved to bottom) */}
            <Route path="/:schoolSlug" element={<SchoolPublicHome />} />
            <Route path={ROUTES.PUBLIC.DYNAMIC_LOGIN} element={<PublicSchoolLogin />} />
            <Route path={ROUTES.PUBLIC.DYNAMIC_FORGOT_PASSWORD} element={<PublicForgotPassword />} />
            <Route path={ROUTES.PUBLIC.DYNAMIC_SIGNUP} element={<PublicSignUp />} />
            <Route path={ROUTES.PUBLIC.DYNAMIC_EXAM_RESULT} element={<ExamResultPage />} />
            <Route path={ROUTES.PUBLIC.DYNAMIC_PAGE} element={<PublicPageDetail />} />
            <Route path={ROUTES.PUBLIC.DYNAMIC_EVENTS} element={<PublicEvents />} />
            <Route path={ROUTES.PUBLIC.DYNAMIC_NEWS} element={<PublicNews />} />
            <Route path={ROUTES.PUBLIC.DYNAMIC_NEWS_DETAIL} element={<PublicNewsDetail />} />
            <Route path={ROUTES.PUBLIC.DYNAMIC_GALLERY} element={<PublicGallery />} />
            <Route path={ROUTES.PUBLIC.DYNAMIC_ONLINE_COURSE} element={<OnlineCourseFrontSite />} />
            <Route path={ROUTES.PUBLIC.DYNAMIC_ADMISSION} element={<OnlineAdmission />} />
            <Route path={ROUTES.PUBLIC.DYNAMIC_ONLINE_ADMISSION} element={<OnlineAdmission />} />
            <Route path={ROUTES.PUBLIC.DYNAMIC_CBSE_EXAM_RESULT} element={<CBSEExamResult />} />
            <Route path={ROUTES.PUBLIC.DYNAMIC_SERVICES_HUB} element={<SchoolServicesHub />} />

            {/* ? Dynamic New Module Routes (Moved to bottom to prevent blocking) */}
            <Route path="/*" element={<NewModuleRoutes />} />

            {/* ? Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          {/* Bottom Nav — global for ALL Capacitor pages (authenticated only) */}
          <MobileAppShell />
          </JashSyncSocketProvider>
          </ParentChildProvider>
        </PermissionProvider>
      </EnvStatusProvider>
    </RecoveryProvider>
  );
}

export default App;

