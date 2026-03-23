import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Brain, Languages, CheckCircle2, Lightbulb, Zap,
  ArrowRight, AlertTriangle, BookOpen, Target, ShieldCheck,
  Users, GraduationCap, CircleDot, Clock, FileText, Calculator,
  Award, Calendar, Building2, Layers, BarChart3, Settings,
  ClipboardList, PenTool, Printer, Search
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// SECTION 1: WHAT IS THE EXAMINATION MODULE?
// ═══════════════════════════════════════════════════════════════════
const whatIsSection = {
  en: {
    title: 'What is the Examination Module?',
    subtitle: 'The complete engine that manages everything from exam creation to result publication',
    description: 'The Examination Module handles the entire lifecycle of exams — from configuring boards and terms, defining exam types and grade scales, creating exam groups, scheduling exams, entering marks, calculating results, generating rank lists, and printing report cards. Everything is automated and connected.',
    analogy: 'Think of it like a railway system — Tracks (Board + Terms) must be laid first, then Stations (Exam Groups) are built, Trains (Individual Exams) run on schedule, Passengers (Students) board them, Tickets (Marks) are checked, and the Journey Report (Result + Report Card) is generated at the end!',
  },
  kn: {
    title: 'Examination Module ಅಂದ್ರೆ ಏನು?',
    subtitle: 'Exam creation ಇಂದ result publication ವರೆಗೆ ಎಲ್ಲವನ್ನೂ manage ಮಾಡುವ complete engine',
    description: 'Examination Module exams ನ ಇಡೀ lifecycle handle ಮಾಡುತ್ತೆ — boards ಮತ್ತು terms configure ಮಾಡೋದು, exam types ಮತ್ತು grade scales define ಮಾಡೋದು, exam groups create ಮಾಡೋದು, exams schedule ಮಾಡೋದು, marks enter ಮಾಡೋದು, results calculate ಮಾಡೋದು, rank lists generate ಮಾಡೋದು, ಮತ್ತು report cards print ಮಾಡೋದು. ಎಲ್ಲವೂ automated ಮತ್ತು connected.',
    analogy: 'Railway system ಥರ ಯೋಚಿಸಿ — ಮೊದಲು Tracks (Board + Terms) ಹಾಕಬೇಕು, ಆಮೇಲೆ Stations (Exam Groups) ಕಟ್ಟಬೇಕು, Trains (Individual Exams) schedule ಪ್ರಕಾರ ಓಡುತ್ತವೆ, Passengers (Students) ಹತ್ತುತ್ತಾರೆ, Tickets (Marks) check ಆಗುತ್ತೆ, ಮತ್ತು ಕೊನೆಯಲ್ಲಿ Journey Report (Result + Report Card) generate ಆಗುತ್ತೆ!',
  },
};

// ═══════════════════════════════════════════════════════════════════
// SECTION 2: COMPLETE WORKFLOW PHASES
// ═══════════════════════════════════════════════════════════════════
const workflowPhases = [
  { icon: <Settings className="h-5 w-5" />, label: { en: 'Phase 1\nFoundation Setup', kn: 'Phase 1\nFoundation Setup' }, color: 'bg-blue-100 dark:bg-blue-900/30' },
  { icon: <Layers className="h-5 w-5" />, label: { en: 'Phase 2\nExam Planning', kn: 'Phase 2\nExam Planning' }, color: 'bg-indigo-100 dark:bg-indigo-900/30' },
  { icon: <Building2 className="h-5 w-5" />, label: { en: 'Phase 3\nLogistics', kn: 'Phase 3\nLogistics' }, color: 'bg-purple-100 dark:bg-purple-900/30' },
  { icon: <PenTool className="h-5 w-5" />, label: { en: 'Phase 4\nMarks Entry', kn: 'Phase 4\nMarks Entry' }, color: 'bg-amber-100 dark:bg-amber-900/30' },
  { icon: <Calculator className="h-5 w-5" />, label: { en: 'Phase 5\nResults', kn: 'Phase 5\nResults' }, color: 'bg-green-100 dark:bg-green-900/30' },
  { icon: <Printer className="h-5 w-5" />, label: { en: 'Phase 6\nReports', kn: 'Phase 6\nReports' }, color: 'bg-rose-100 dark:bg-rose-900/30' },
];

// ═══════════════════════════════════════════════════════════════════
// SECTION 3: PHASE DETAILS
// ═══════════════════════════════════════════════════════════════════
const phases = [
  {
    phase: 1,
    title: { en: 'Phase 1: Foundation Setup', kn: 'Phase 1: Foundation Setup' },
    subtitle: { en: 'Configure the building blocks before creating any exam', kn: 'Exam create ಮಾಡುವ ಮುಂಚೆ building blocks configure ಮಾಡಿ' },
    color: 'border-blue-300',
    pages: [
      {
        name: 'Board Configuration',
        icon: '🏛️',
        en: 'Set up examination boards like ICSE, CBSE, State Board. Each branch can follow a different board. This decides the overall exam pattern and rules.',
        kn: 'ICSE, CBSE, State Board ಥರ examination boards set up ಮಾಡಿ. ಪ್ರತಿ branch ಬೇರೆ ಬೇರೆ board follow ಮಾಡಬಹುದು. ಇದು overall exam pattern ಮತ್ತು rules decide ಮಾಡುತ್ತೆ.',
      },
      {
        name: 'Term Management',
        icon: '📅',
        en: 'Define academic terms — Term 1, Term 2, Half-Yearly, Annual. Each term has a date range. Exams are organized within terms.',
        kn: 'Academic terms define ಮಾಡಿ — Term 1, Term 2, Half-Yearly, Annual. ಪ್ರತಿ term ಗೆ date range ಇರುತ್ತೆ. Exams terms ಒಳಗೆ organize ಆಗುತ್ತವೆ.',
      },
      {
        name: 'Exam Type Master',
        icon: '📋',
        en: 'Configure types of exams — Unit Test, Mid-Term, Annual, Practical, Internal Assessment. Each type has its own weightage and rules.',
        kn: 'Exam types configure ಮಾಡಿ — Unit Test, Mid-Term, Annual, Practical, Internal Assessment. ಪ್ರತಿ type ಗೆ separate weightage ಮತ್ತು rules ಇರುತ್ತೆ.',
      },
      {
        name: 'Grade Scale Builder',
        icon: '🎯',
        en: 'Define grading scales — A+ (90-100), A (80-89), B+ (70-79), etc. Each board may use different scales. Set grade points for CGPA calculation.',
        kn: 'Grading scales define ಮಾಡಿ — A+ (90-100), A (80-89), B+ (70-79), etc. ಪ್ರತಿ board ಬೇರೆ scales ಬಳಸಬಹುದು. CGPA calculation ಗೆ grade points set ಮಾಡಿ.',
      },
      {
        name: 'Division Config',
        icon: '📊',
        en: 'Configure pass/fail divisions — First Division (60%+), Second Division (45%+), Third Division (33%+). Used in result calculation.',
        kn: 'Pass/fail divisions configure ಮಾಡಿ — First Division (60%+), Second Division (45%+), Third Division (33%+). Result calculation ನಲ್ಲಿ ಬಳಸಲಾಗುತ್ತೆ.',
      },
      {
        name: 'Subject Weightage',
        icon: '⚖️',
        en: 'Set how much each subject contributes to the final result. Main subjects may have higher weightage than optional ones.',
        kn: 'Final result ಗೆ ಪ್ರತಿ subject ಎಷ್ಟು contribute ಮಾಡುತ್ತೆ ಅಂತ set ಮಾಡಿ. Main subjects ಗೆ optional subjects ಗಿಂತ ಹೆಚ್ಚು weightage ಇರಬಹುದು.',
      },
      {
        name: 'Assessment Pattern',
        icon: '📐',
        en: 'Define the assessment breakdown — Written (80%) + Internal (20%), or Theory (70%) + Practical (30%). Controls how final marks are calculated.',
        kn: 'Assessment breakdown define ಮಾಡಿ — Written (80%) + Internal (20%), ಅಥವಾ Theory (70%) + Practical (30%). Final marks ಹೇಗೆ calculate ಆಗುತ್ತೆ ಅನ್ನೋದನ್ನ control ಮಾಡುತ್ತೆ.',
      },
    ],
  },
  {
    phase: 2,
    title: { en: 'Phase 2: Exam Planning', kn: 'Phase 2: Exam Planning' },
    subtitle: { en: 'Create exam groups, individual exams, and schedule them', kn: 'Exam groups create ಮಾಡಿ, individual exams ಮಾಡಿ, schedule ಮಾಡಿ' },
    color: 'border-indigo-300',
    pages: [
      {
        name: 'Exam Group Management',
        icon: '📦',
        en: 'Create exam groups that link a Term + Exam Type + Classes + Subjects together. Example: "Term 1 Unit Test — Class 5 to 10 — All Subjects". This is the container for individual exams.',
        kn: 'Term + Exam Type + Classes + Subjects ಎಲ್ಲವ ಒಟ್ಟಿಗೆ link ಮಾಡುವ exam groups create ಮಾಡಿ. ಉದಾಹರಣೆ: "Term 1 Unit Test — Class 5 to 10 — All Subjects". ಇದು individual exams ನ container.',
      },
      {
        name: 'Exam Management',
        icon: '📝',
        en: 'Create individual exams inside an exam group. Set date, time, maximum marks, passing marks for each subject exam. Example: "Mathematics — 100 marks — Pass: 33".',
        kn: 'Exam group ಒಳಗೆ individual exams create ಮಾಡಿ. ಪ್ರತಿ subject exam ಗೆ date, time, maximum marks, passing marks set ಮಾಡಿ. ಉದಾಹರಣೆ: "Mathematics — 100 marks — Pass: 33".',
      },
      {
        name: 'Exam Calendar',
        icon: '🗓️',
        en: 'Visual calendar view of all scheduled exams. Drag-and-drop to reschedule. Color-coded by exam type. Sync exams from exam groups.',
        kn: 'ಎಲ್ಲ scheduled exams ನ visual calendar view. Reschedule ಮಾಡಲು drag-and-drop. Exam type ಪ್ರಕಾರ color-coded. Exam groups ಇಂದ exams sync.',
      },
      {
        name: 'Exam Linking',
        icon: '🔗',
        en: 'Link related exams together — like linking Unit Test 1 + Unit Test 2 + Mid-Term for cumulative result calculation.',
        kn: 'Related exams ಅನ್ನು link ಮಾಡಿ — Unit Test 1 + Unit Test 2 + Mid-Term cumulative result calculation ಗೆ link ಮಾಡೋದು ಥರ.',
      },
      {
        name: 'Student Assignment',
        icon: '👥',
        en: 'Assign specific students to exams. Auto-assign by class or manually pick students. Handle exam exemptions here.',
        kn: 'Specific students ಅನ್ನು exams ಗೆ assign ಮಾಡಿ. Class ಪ್ರಕಾರ auto-assign ಅಥವಾ manually students ಆಯ್ಕೆ. Exam exemptions ಇಲ್ಲಿ handle.',
      },
    ],
  },
  {
    phase: 3,
    title: { en: 'Phase 3: Exam Logistics', kn: 'Phase 3: Exam Logistics' },
    subtitle: { en: 'Prepare rooms, seating, invigilators, and admit cards', kn: 'Rooms, seating, invigilators, admit cards ಎಲ್ಲ prepare ಮಾಡಿ' },
    color: 'border-purple-300',
    pages: [
      {
        name: 'Room Management',
        icon: '🏫',
        en: 'Configure exam halls/rooms with capacity, facilities (AC, projector, CCTV). Set which rooms are available for exams.',
        kn: 'Exam halls/rooms ಅನ್ನು capacity, facilities (AC, projector, CCTV) ಸಮೇತ configure ಮಾಡಿ. ಯಾವ rooms exams ಗೆ available ಅಂತ set ಮಾಡಿ.',
      },
      {
        name: 'Seating Arrangement',
        icon: '💺',
        en: 'Auto-generate seating charts for exam rooms. Supports random, class-wise, or roll-number based seating. Print seating charts.',
        kn: 'Exam rooms ಗೆ seating charts auto-generate ಮಾಡಿ. Random, class-wise, ಅಥವಾ roll-number based seating support. Seating charts print.',
      },
      {
        name: 'Invigilator Duty',
        icon: '👨‍🏫',
        en: 'Assign teachers as invigilators to exam rooms. Auto-assign based on availability or manually assign. Generate duty charts.',
        kn: 'Teachers ನ exam rooms ಗೆ invigilators ಆಗಿ assign ಮಾಡಿ. Availability ಪ್ರಕಾರ auto-assign ಅಥವಾ manually assign. Duty charts generate.',
      },
      {
        name: 'Admit Card Designer',
        icon: '🎫',
        en: 'Design admit card templates with school logo, student photo, exam schedule, instructions. Bulk print for entire class.',
        kn: 'School logo, student photo, exam schedule, instructions ಸಮೇತ admit card templates design ಮಾಡಿ. ಇಡೀ class ಗೆ bulk print.',
      },
    ],
  },
  {
    phase: 4,
    title: { en: 'Phase 4: Marks Entry & Assessment', kn: 'Phase 4: Marks Entry & Assessment' },
    subtitle: { en: 'Enter marks, internal assessment, practical marks, and observations', kn: 'Marks, internal assessment, practical marks, observations enter ಮಾಡಿ' },
    color: 'border-amber-300',
    pages: [
      {
        name: 'Marks Entry',
        icon: '✏️',
        en: 'The main marks entry interface. Select exam group → exam → subject. Enter marks for each student. Auto-save, draft mode, submit & lock. Shows max marks, pass marks, percentage auto-calculated.',
        kn: 'ಮುಖ್ಯ marks entry interface. Exam group → exam → subject ಆಯ್ಕೆ ಮಾಡಿ. ಪ್ರತಿ student ಗೆ marks enter. Auto-save, draft mode, submit & lock. Max marks, pass marks, percentage auto-calculate.',
      },
      {
        name: 'Internal Assessment',
        icon: '📊',
        en: 'Enter internal/formative assessment marks — class participation, homework, projects, assignments. These combine with written exam marks.',
        kn: 'Internal/formative assessment marks enter — class participation, homework, projects, assignments. ಇವು written exam marks ಜೊತೆ combine.',
      },
      {
        name: 'Practical Marks',
        icon: '🔬',
        en: 'Enter practical/lab exam marks separately. For subjects like Science, Computer, Art. Has its own max marks and passing criteria.',
        kn: 'Practical/lab exam marks separately enter. Science, Computer, Art ಥರ subjects ಗೆ. Separate max marks ಮತ್ತು passing criteria.',
      },
      {
        name: 'Bulk Upload',
        icon: '📤',
        en: 'Upload marks via Excel/CSV file for bulk data entry. Download template, fill marks, upload. Validates data before import.',
        kn: 'Bulk data entry ಗೆ Excel/CSV file ಮೂಲಕ marks upload. Template download, marks fill, upload. Import ಮುಂಚೆ data validate.',
      },
      {
        name: 'Grace Marks',
        icon: '🎁',
        en: 'Add grace marks to students who narrowly failed. Set rules — max 5 grace marks, only if within 3 marks of passing. Requires admin approval.',
        kn: 'Narrowly fail ಆದ students ಗೆ grace marks add. Rules set — max 5 grace marks, passing ಗೆ 3 marks ಒಳಗಿದ್ದರೆ ಮಾತ್ರ. Admin approval ಬೇಕು.',
      },
      {
        name: 'Observations & Remarks',
        icon: '👁️',
        en: 'Assign co-scholastic observations (Art, Sports, Discipline) and teacher remarks per student. Used in ICSE/CBSE report cards.',
        kn: 'Co-scholastic observations (Art, Sports, Discipline) ಮತ್ತು teacher remarks ಪ್ರತಿ student ಗೆ assign. ICSE/CBSE report cards ನಲ್ಲಿ ಬಳಸಲಾಗುತ್ತೆ.',
      },
    ],
  },
  {
    phase: 5,
    title: { en: 'Phase 5: Result Processing', kn: 'Phase 5: Result Processing' },
    subtitle: { en: 'Moderate marks, calculate results, generate ranks, and verify', kn: 'Marks moderate, results calculate, ranks generate, verify ಮಾಡಿ' },
    color: 'border-green-300',
    pages: [
      {
        name: 'Moderation Engine',
        icon: '⚖️',
        en: 'Apply moderation rules — if class average is below 40%, add 5 marks to all. Scaling, normalization, or manual adjustment. Audit trail maintained.',
        kn: 'Moderation rules apply — class average 40% ಕೆಳಗಿದ್ದರೆ ಎಲ್ಲರಿಗೂ 5 marks add. Scaling, normalization, ಅಥವಾ manual adjustment. Audit trail maintain.',
      },
      {
        name: 'Result Calculation',
        icon: '🧮',
        en: 'The brain of the exam module. Combines written + internal + practical marks. Applies weightages. Calculates total, percentage, grade, CGPA, division, pass/fail status.',
        kn: 'Exam module ನ brain. Written + internal + practical marks combine. Weightages apply. Total, percentage, grade, CGPA, division, pass/fail status calculate.',
      },
      {
        name: 'Rank Generation',
        icon: '🏆',
        en: 'Generate class-wise and section-wise ranks. Handles tie-breaking rules. Supports subject-wise toppers list. Rank based on total marks or percentage.',
        kn: 'Class-wise ಮತ್ತು section-wise ranks generate. Tie-breaking rules handle. Subject-wise toppers list support. Total marks ಅಥವಾ percentage ಆಧಾರದ rank.',
      },
      {
        name: 'Verification Dashboard',
        icon: '✅',
        en: 'Final verification before publishing results. Check for missing marks, anomalies, suspicious patterns. Admin sign-off required.',
        kn: 'Results publish ಮಾಡುವ ಮುಂಚೆ final verification. Missing marks, anomalies, suspicious patterns check. Admin sign-off ಬೇಕು.',
      },
    ],
  },
  {
    phase: 6,
    title: { en: 'Phase 6: Reports & Documents', kn: 'Phase 6: Reports & Documents' },
    subtitle: { en: 'Design and print marksheets, report cards, and analysis', kn: 'Marksheets, report cards design ಮಾಡಿ, print ಮಾಡಿ, analysis ಮಾಡಿ' },
    color: 'border-rose-300',
    pages: [
      {
        name: 'Marksheet Designer',
        icon: '📄',
        en: 'Design marksheet templates with school name, student details, subject-wise marks, totals, grades, rank. Customizable layout.',
        kn: 'School name, student details, subject-wise marks, totals, grades, rank ಸಮೇತ marksheet templates design. Customizable layout.',
      },
      {
        name: 'Report Card Designer',
        icon: '📑',
        en: 'Design ICSE/CBSE format report cards with co-scholastic grades, teacher remarks, attendance summary, principal signature area.',
        kn: 'ICSE/CBSE format report cards design — co-scholastic grades, teacher remarks, attendance summary, principal signature area ಸಮೇತ.',
      },
      {
        name: 'Bulk Document Generator',
        icon: '🖨️',
        en: 'Generate marksheets/report cards for entire class in one click. PDF output ready for printing. Progress bar shows generation status.',
        kn: 'ಇಡೀ class ಗೆ ಒಂದೇ click ನಲ್ಲಿ marksheets/report cards generate. Print ready PDF output. Progress bar generation status ತೋರಿಸುತ್ತೆ.',
      },
      {
        name: 'Performance Dashboard',
        icon: '📊',
        en: 'Visual analytics — class average, subject-wise comparison, trend charts, top/bottom performers, pass percentage, grade distribution.',
        kn: 'Visual analytics — class average, subject-wise comparison, trend charts, top/bottom performers, pass percentage, grade distribution.',
      },
      {
        name: 'Compliance Reports',
        icon: '📋',
        en: 'Generate board-required compliance reports. Exam-wise summary, pass percentage reports, subject analysis for educational authorities.',
        kn: 'Board-required compliance reports generate. Exam-wise summary, pass percentage reports, educational authorities ಗೆ subject analysis.',
      },
      {
        name: 'Exam Archive',
        icon: '🗄️',
        en: 'Store past exam data permanently for future reference. Compare year-over-year performance. Historical data for accreditation.',
        kn: 'Past exam data ಅನ್ನು permanently store. Year-over-year performance compare. Accreditation ಗೆ historical data.',
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════
// SECTION 4: ADDITIONAL MODULES
// ═══════════════════════════════════════════════════════════════════
const additionalModules = [
  {
    title: { en: 'Online Examination Suite', kn: 'Online Examination Suite' },
    icon: '💻',
    color: 'border-cyan-300',
    pages: [
      { name: 'Question Bank', en: 'Store questions by subject, chapter, difficulty. Tag with Bloom\'s taxonomy level. Reuse questions across exams.', kn: 'Subject, chapter, difficulty ಪ್ರಕಾರ questions store. Bloom\'s taxonomy level tag. Exams ನಲ್ಲಿ questions reuse.' },
      { name: 'Question Blueprint', en: 'Define paper pattern — how many easy/medium/hard questions, marks distribution, chapter coverage blueprint.', kn: 'Paper pattern define — ಎಷ್ಟು easy/medium/hard questions, marks distribution, chapter coverage blueprint.' },
      { name: 'Online Exam', en: 'Conduct online MCQ/subjective exams. Timer, auto-submit, anti-cheating measures, instant result for MCQs.', kn: 'Online MCQ/subjective exams conduct. Timer, auto-submit, anti-cheating measures, MCQs ಗೆ instant result.' },
    ],
  },
  {
    title: { en: 'Post-Exam Processes', kn: 'Post-Exam Processes' },
    icon: '🔄',
    color: 'border-teal-300',
    pages: [
      { name: 'Revaluation Request', en: 'Students/parents can request re-checking of answer sheets. Track request status, fees paid, deadlines.', kn: 'Students/parents answer sheets re-checking request ಮಾಡಬಹುದು. Request status, fees paid, deadlines track.' },
      { name: 'Revaluation Process', en: 'Admin/teacher re-evaluates the paper. Compare original vs new marks. Approve/reject changes with reason.', kn: 'Admin/teacher paper re-evaluate ಮಾಡುತ್ತಾರೆ. Original vs new marks compare. Reason ಸಮೇತ changes approve/reject.' },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════
// SECTION 5: REAL SCENARIOS
// ═══════════════════════════════════════════════════════════════════
const realScenarios = [
  {
    title: { en: 'Scenario 1: Setting Up Term 1 Unit Test', kn: 'ಸನ್ನಿವೇಶ 1: Term 1 Unit Test Setup' },
    student: 'Class 5 — ICSE Board — 30 Students',
    steps: [
      { en: 'Admin sets Board = ICSE, Term = Term 1 in Foundation Setup', kn: 'Admin Board = ICSE, Term = Term 1 Foundation Setup ನಲ್ಲಿ set ಮಾಡುತ್ತಾರೆ' },
      { en: 'Creates Exam Group: "Term 1 Unit Test — Class 5 — All Subjects"', kn: 'Exam Group create: "Term 1 Unit Test — Class 5 — All Subjects"' },
      { en: 'Creates individual exams: Maths (50 marks), English (50 marks), Science (50 marks)...', kn: 'Individual exams create: Maths (50 marks), English (50 marks), Science (50 marks)...' },
      { en: 'Sets dates on Exam Calendar: Maths = May 10, English = May 12, Science = May 14', kn: 'Exam Calendar ನಲ್ಲಿ dates set: Maths = May 10, English = May 12, Science = May 14' },
      { en: 'Assigns Room 101 (capacity 35), assigns invigilators, generates seating chart', kn: 'Room 101 (capacity 35) assign, invigilators assign, seating chart generate' },
    ],
    result: { en: 'Exam is ready! Admit cards can be printed. Everything is scheduled and organized.', kn: 'Exam ready! Admit cards print ಮಾಡಬಹುದು. ಎಲ್ಲ scheduled ಮತ್ತು organized ಆಗಿದೆ.' },
    color: 'border-blue-300',
  },
  {
    title: { en: 'Scenario 2: Marks Entry → Result', kn: 'ಸನ್ನಿವೇಶ 2: Marks Entry → Result' },
    student: 'Student Rahul — Class 5 — 6 Subjects',
    steps: [
      { en: 'Class teacher opens Marks Entry → selects "Term 1 Unit Test" → Maths', kn: 'Class teacher Marks Entry open → "Term 1 Unit Test" select → Maths' },
      { en: 'Enters Rahul: Written = 42/50, gets auto-saved. Repeats for all subjects.', kn: 'Rahul: Written = 42/50 enter, auto-save. ಎಲ್ಲ subjects ಗೆ repeat.' },
      { en: 'Enters Internal Assessment: Maths = 18/20 (participation + homework)', kn: 'Internal Assessment enter: Maths = 18/20 (participation + homework)' },
      { en: 'Admin runs Result Calculation → Total: 450/600, Percentage: 75%, Grade: A, Rank: 5', kn: 'Admin Result Calculation run → Total: 450/600, Percentage: 75%, Grade: A, Rank: 5' },
      { en: 'Verification Dashboard confirms no anomalies → Results published!', kn: 'Verification Dashboard anomalies ಇಲ್ಲ confirm → Results publish!' },
    ],
    result: { en: 'Rahul scores 75% — Grade A — Rank 5 in class. Report card ready for printing!', kn: 'Rahul 75% score — Grade A — Class ನಲ್ಲಿ Rank 5. Report card print ready!' },
    color: 'border-green-300',
  },
  {
    title: { en: 'Scenario 3: Handling Grace Marks', kn: 'ಸನ್ನಿವೇಶ 3: Grace Marks Handle' },
    student: 'Student Meena — Class 8 — Failed in Maths by 2 marks',
    steps: [
      { en: 'Result calculation shows Meena: Maths = 31/100. Pass mark = 33. Failed!', kn: 'Result calculation show: Meena Maths = 31/100. Pass mark = 33. Fail!' },
      { en: 'Admin opens Grace Marks → System suggests: Meena needs 2 marks in Maths to pass', kn: 'Admin Grace Marks open → System suggest: Meena pass ಆಗಲು Maths ನಲ್ಲಿ 2 marks ಬೇಕು' },
      { en: 'Admin applies 2 grace marks → Maths becomes 33/100 = PASS', kn: 'Admin 2 grace marks apply → Maths 33/100 ಆಗುತ್ತೆ = PASS' },
      { en: 'Result re-calculated automatically. Meena now passes all subjects!', kn: 'Result automatically re-calculate. Meena ಈಗ ಎಲ್ಲ subjects pass!' },
    ],
    result: { en: 'Meena passes with grace marks. Report card shows "GM" indicator next to Maths.', kn: 'Meena grace marks ನಿಂದ pass. Report card Maths ಪಕ್ಕ "GM" indicator ತೋರಿಸುತ್ತೆ.' },
    color: 'border-amber-300',
  },
];

// ═══════════════════════════════════════════════════════════════════
// SECTION 6: COMMON MISTAKES
// ═══════════════════════════════════════════════════════════════════
const mistakes = [
  { icon: '❌', en: 'Creating exams WITHOUT setting up Board, Terms, and Exam Types first — everything breaks!', kn: 'Board, Terms, Exam Types setup ಮಾಡದೆ exams create ಮಾಡೋದು — ಎಲ್ಲ break ಆಗುತ್ತೆ!' },
  { icon: '❌', en: 'Entering marks for wrong exam group — always double-check the selected group before entering!', kn: 'ತಪ್ಪು exam group ಗೆ marks enter — enter ಮಾಡುವ ಮುಂಚೆ selected group ಯಾವಾಗಲೂ double-check ಮಾಡಿ!' },
  { icon: '❌', en: 'Publishing results without running Verification Dashboard — may have missing marks or errors!', kn: 'Verification Dashboard run ಮಾಡದೆ results publish — missing marks ಅಥವಾ errors ಇರಬಹುದು!' },
  { icon: '❌', en: 'Forgetting to set passing marks — system cannot determine pass/fail without it!', kn: 'Passing marks set ಮಾಡೋದು ಮರೆಯೋದು — ಇದಿಲ್ಲದೆ system pass/fail determine ಮಾಡಲು ಆಗಲ್ಲ!' },
  { icon: '❌', en: 'Not locking marks after submission — teachers may accidentally edit final marks!', kn: 'Submit ಆದ ಮೇಲೆ marks lock ಮಾಡದೆ ಇರೋದು — teachers accidentally final marks edit ಮಾಡಬಹುದು!' },
  { icon: '✅', en: 'DO: Follow the phases in order — Setup → Plan → Conduct → Marks → Results → Reports', kn: 'DO: Phases ಅನ್ನು order ಪ್ರಕಾರ follow ಮಾಡಿ — Setup → Plan → Conduct → Marks → Results → Reports' },
  { icon: '✅', en: 'DO: Always verify with one class first, then process all classes', kn: 'DO: ಮೊದಲು ಒಂದು class verify ಮಾಡಿ, ಆಮೇಲೆ ಎಲ್ಲ classes process ಮಾಡಿ' },
];

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
const ExaminationGuide = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const roleSlug = location.pathname.split('/').filter(Boolean)[0] || 'super-admin';
  const [lang, setLang] = useState('kn');
  const isE = lang === 'en';

  const t = (enText, knText) => isE ? enText : knText;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-8 max-w-5xl mx-auto">

        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Brain className="h-7 w-7 text-primary" />
              {t('Examination Module — Complete Guide', 'Examination Module — ಸಂಪೂರ್ಣ Guide')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t(
                'Everything about the exam system — from setup to report card printing.',
                'Exam system ಬಗ್ಗೆ ಎಲ್ಲ — setup ಇಂದ report card print ವರೆಗೆ.'
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant={isE ? 'default' : 'outline'} onClick={() => setLang('en')}>
              <Languages className="h-4 w-4 mr-1" /> English
            </Button>
            <Button size="sm" variant={!isE ? 'default' : 'outline'} onClick={() => setLang('kn')}>
              ಕನ್ನಡ
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> {t('Back', 'ಹಿಂದೆ')}
            </Button>
          </div>
        </div>

        {/* ═══ SECTION 1: WHAT IS IT? ═══ */}
        <Card className="border-primary/30 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50 dark:from-blue-950/20 dark:via-background dark:to-indigo-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              {isE ? whatIsSection.en.title : whatIsSection.kn.title}
            </CardTitle>
            <CardDescription className="text-base">{isE ? whatIsSection.en.subtitle : whatIsSection.kn.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">{isE ? whatIsSection.en.description : whatIsSection.kn.description}</p>
            <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-medium text-primary flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                {t('Analogy', 'ಉಪಮೆ')}
              </p>
              <p className="text-sm mt-1 leading-relaxed">{isE ? whatIsSection.en.analogy : whatIsSection.kn.analogy}</p>
            </div>
          </CardContent>
        </Card>

        {/* ═══ SECTION 2: WORKFLOW PHASES VISUAL ═══ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5" />
              {t('Complete Workflow — 6 Phases', 'Complete Workflow — 6 Phases')}
            </CardTitle>
            <CardDescription>
              {t('Follow these phases in order for a smooth exam cycle', 'Smooth exam cycle ಗೆ ಈ phases ಅನ್ನು order ಪ್ರಕಾರ follow ಮಾಡಿ')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {workflowPhases.map((phase, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />}
                  <div className={`flex flex-col items-center gap-1 rounded-xl border ${phase.color} px-4 py-3 min-w-[110px]`}>
                    {phase.icon}
                    <span className="text-xs font-medium text-center whitespace-pre-line">{isE ? phase.label.en : phase.label.kn}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ═══ SECTION 3: ALL PHASES DETAILED ═══ */}
        {phases.map((phase) => (
          <Card key={phase.phase} className={`${phase.color} border-2`}>
            <CardHeader>
              <CardTitle className="text-lg">{isE ? phase.title.en : phase.title.kn}</CardTitle>
              <CardDescription>{isE ? phase.subtitle.en : phase.subtitle.kn}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {phase.pages.map((p) => (
                <div key={p.name} className="rounded-lg border bg-background/80 p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{p.icon}</span>
                    <div>
                      <h4 className="font-bold text-sm">{p.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{isE ? p.en : p.kn}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* ═══ SECTION 4: ADDITIONAL MODULES ═══ */}
        {additionalModules.map((mod) => (
          <Card key={mod.icon} className={`${mod.color} border-2`}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-xl">{mod.icon}</span>
                {isE ? mod.title.en : mod.title.kn}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mod.pages.map((p) => (
                <div key={p.name} className="rounded-lg border bg-background/80 p-4">
                  <h4 className="font-bold text-sm">{p.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{isE ? p.en : p.kn}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* ═══ SECTION 5: REAL SCENARIOS ═══ */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('Real Scenarios — See How It Works!', 'Real Scenarios — ಹೇಗೆ Work ಆಗುತ್ತೆ ನೋಡಿ!')}
          </h2>
          <div className="space-y-5">
            {realScenarios.map((sc, idx) => (
              <Card key={idx} className={`${sc.color} border-2`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{isE ? sc.title.en : sc.title.kn}</CardTitle>
                  <CardDescription className="font-mono">{sc.student}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {sc.steps.map((step, si) => (
                      <div key={si} className="flex items-start gap-3">
                        <Badge variant="secondary" className="shrink-0 mt-0.5">{si + 1}</Badge>
                        <p className="text-sm">{isE ? step.en : step.kn}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 p-3">
                    <p className="font-bold text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      {t('Final Result:', 'ಅಂತಿಮ ಫಲಿತಾಂಶ:')}
                    </p>
                    <p className="text-sm mt-1 text-emerald-800 dark:text-emerald-300 font-medium">{isE ? sc.result.en : sc.result.kn}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ═══ SECTION 6: COMMON MISTAKES ═══ */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {t('Common Mistakes to Avoid', 'ತಪ್ಪಿಸಬೇಕಾದ ಸಾಮಾನ್ಯ ತಪ್ಪುಗಳು')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mistakes.map((m, i) => (
              <div
                key={i}
                className={`rounded-lg border p-3 text-sm flex items-start gap-3 ${
                  m.icon === '✅'
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                }`}
              >
                <span className="text-lg shrink-0">{m.icon}</span>
                <p>{isE ? m.en : m.kn}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ═══ QUICK SUMMARY ═══ */}
        <Card className="border-primary/30 bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50 dark:from-indigo-950/20 dark:via-background dark:to-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              {t('Quick Summary', 'ಸಂಕ್ಷಿಪ್ತ ಸಾರಾಂಶ')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="font-bold">{t('Phase 1: Board + Terms + Types + Grades', 'Phase 1: Board + Terms + Types + Grades')}</p>
                <p className="font-bold">{t('Phase 2: Exam Groups + Exams + Calendar', 'Phase 2: Exam Groups + Exams + Calendar')}</p>
                <p className="font-bold">{t('Phase 3: Rooms + Seating + Invigilators', 'Phase 3: Rooms + Seating + Invigilators')}</p>
              </div>
              <div className="space-y-2">
                <p className="font-bold">{t('Phase 4: Marks + Internal + Practical', 'Phase 4: Marks + Internal + Practical')}</p>
                <p className="font-bold">{t('Phase 5: Moderation + Results + Ranks', 'Phase 5: Moderation + Results + Ranks')}</p>
                <p className="font-bold">{t('Phase 6: Marksheets + Report Cards + Analytics', 'Phase 6: Marksheets + Report Cards + Analytics')}</p>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
              <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">
                {t(
                  '💡 Golden Rule: ALWAYS follow phases in order. You cannot enter marks without creating exams, and you cannot calculate results without entering marks!',
                  '💡 Golden Rule: ALWAYS phases order ಪ್ರಕಾರ follow ಮಾಡಿ. Exams create ಮಾಡದೆ marks enter ಮಾಡಲು ಆಗಲ್ಲ, marks enter ಮಾಡದೆ results calculate ಮಾಡಲು ಆಗಲ್ಲ!'
                )}
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default ExaminationGuide;
