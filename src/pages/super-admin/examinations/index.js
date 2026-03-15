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

// Phase 8: Advanced Configuration & Compliance
export { default as DivisionConfigPage } from './DivisionConfigPage';
export { default as SubjectWeightagePage } from './SubjectWeightagePage';
export { default as AssessmentPatternBuilder } from './AssessmentPatternBuilder';
export { default as ExamLinkingPage } from './ExamLinkingPage';
export { default as QuestionBlueprintPage } from './QuestionBlueprintPage';
export { default as VerificationDashboard } from './VerificationDashboard';
export { default as RevaluationRequestPage } from './RevaluationRequestPage';
export { default as RevaluationProcessPage } from './RevaluationProcessPage';
export { default as ExamArchivePage } from './ExamArchivePage';
export { default as ComplianceReportsPage } from './ComplianceReportsPage';

export { default as AssignObservation } from './AssignObservation';
export { default as TeacherRemarks } from './TeacherRemarks';
