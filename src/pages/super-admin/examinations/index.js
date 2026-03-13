/**
 * Examination Module Index
 * Export all examination components
 * @date 2026-03-09
 */

// Examination Setup (New Engine)
export { default as BoardConfiguration } from './BoardConfiguration';
export { default as TermManagement } from './TermManagement';
export { default as ExamTypeMaster } from './ExamTypeMaster';
export { default as GradeScaleBuilder } from './GradeScaleBuilder';
export { default as ExamGroupManagement } from './ExamGroupManagement';

// Legacy Examination Components
export { default as ExamGroup } from './ExamGroup';
export { default as ExamList } from './ExamList';
export { default as ExamSchedule } from './ExamSchedule';
export { default as ExamAttendance } from './ExamAttendance';
export { default as MarksEntry } from './MarksEntry';
export { default as MarksDivision } from './MarksDivision';
export { default as MarksGrade } from './MarksGrade';
export { default as GeneralExamResult } from './GeneralExamResult';
export { default as GeneralExamSchedule } from './GeneralExamSchedule';

// Phase 3: Logistics
export { default as RoomManagement } from './RoomManagement';
export { default as InvigilatorDuty } from './InvigilatorDuty';
export { default as SeatingArrangement } from './SeatingArrangement';
export { default as ExamCalendar } from './ExamCalendar';

// Phase 4: Marks Entry
export { default as MarksEntryPageNew } from './MarksEntryPageNew';
export { default as InternalAssessmentEntry } from './InternalAssessmentEntry';
export { default as PracticalMarksEntry } from './PracticalMarksEntry';
export { default as BulkUploadPage } from './BulkUploadPage';

// Phase 5: Moderation & Results
export { default as GraceMarksPage } from './GraceMarksPage';
export { default as ModerationEnginePage } from './ModerationEnginePage';
export { default as ResultCalculationPage } from './ResultCalculationPage';
export { default as RankGenerationPage } from './RankGenerationPage';

// Phase 6: Documents
export { default as AdmitCardDesignerPage } from './AdmitCardDesignerPage';
export { default as MarksheetDesignerPage } from './MarksheetDesignerPage';
export { default as ReportCardDesignerPage } from './ReportCardDesignerPage';
export { default as BulkDocumentGenerator } from './BulkDocumentGenerator';

// Phase 7: Analytics & Online Examination
export { default as PerformanceDashboard } from './PerformanceDashboard';
export { default as QuestionBankPage } from './QuestionBankPage';
export { default as OnlineExamPage } from './OnlineExamPage';
