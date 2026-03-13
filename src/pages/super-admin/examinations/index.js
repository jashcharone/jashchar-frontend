/**
 * Examination Module Index
 * Export all examination components - CLEANED (Phase 1-7 Only)
 * @date 2026-03-13
 */

// Phase 1: Foundation - Examination Setup
export { default as BoardConfiguration } from './BoardConfiguration';
export { default as TermManagement } from './TermManagement';
export { default as ExamTypeMaster } from './ExamTypeMaster';
export { default as GradeScaleBuilder } from './GradeScaleBuilder';
export { default as ExamGroupManagement } from './ExamGroupManagement';

// Phase 2: Exam Planning
export { default as ExamManagement } from './ExamManagement';
export { default as StudentAssignmentPage } from './StudentAssignmentPage';

// Phase 3: Scheduling & Logistics
export { default as RoomManagement } from './RoomManagement';
export { default as InvigilatorDuty } from './InvigilatorDuty';
export { default as SeatingArrangement } from './SeatingArrangement';
export { default as ExamCalendar } from './ExamCalendar';

// Phase 4: Marks Entry (Evaluation Engine)
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

// CBSE Specific (Separate Menu)
export { default as CbseExam } from './CbseExam';
export { default as CbseTerm } from './CbseTerm';
export { default as CbseAssessment } from './CbseAssessment';
export { default as CbseObservation } from './CbseObservation';
export { default as CbseObservationParameter } from './CbseObservationParameter';
export { default as CbseExamGrade } from './CbseExamGrade';
export { default as CbseSettings } from './CbseSettings';
export { default as CbseReports } from './CbseReports';
export { default as AssignObservation } from './AssignObservation';
export { default as TeacherRemarks } from './TeacherRemarks';
