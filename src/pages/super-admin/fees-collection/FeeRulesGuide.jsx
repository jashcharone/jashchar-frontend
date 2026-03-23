import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Brain, Languages, CheckCircle2, Lightbulb, Zap,
  ArrowRight, AlertTriangle, BookOpen, Target, ShieldCheck,
  Users, IndianRupee, GraduationCap, CircleDot, Clock
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// SECTION 1: WHAT IS A FEE RULE?
// ═══════════════════════════════════════════════════════════════════
const whatIsSection = {
  en: {
    title: 'What is a Fee Rule?',
    subtitle: 'Think of it as an intelligent assistant that auto-applies fees',
    description: 'A Fee Rule is an automation instruction you give to the system. Instead of manually assigning fees to each student one-by-one, you create a rule that says: "When THIS condition is met, DO this action automatically."',
    analogy: 'Just like a traffic signal automatically controls cars — Green means GO, Red means STOP — a Fee Rule automatically controls fees. You set it once, and it works for hundreds of students!',
  },
  kn: {
    title: 'Fee Rule ಅಂದ್ರೆ ಏನು?',
    subtitle: 'ಇದು fees ಅನ್ನು auto-apply ಮಾಡುವ ಒಂದು intelligent assistant ಥರ',
    description: 'Fee Rule ಅಂದ್ರೆ system ಗೆ ನೀವು ಕೊಡುವ automation instruction. ಪ್ರತಿ student ಗೆ manually fees assign ಮಾಡುವ ಬದಲು, ನೀವು ಒಂದು rule create ಮಾಡಿ ಹೇಳ್ತೀರಿ: "ಈ condition match ಆದಾಗ, ಈ action automatically ಮಾಡು."',
    analogy: 'Traffic signal ಹೇಗೆ automatically cars ನ control ಮಾಡುತ್ತೆ — Green ಅಂದ್ರೆ GO, Red ಅಂದ್ರೆ STOP — ಅದೇ ತರ Fee Rule automatically fees ನ control ಮಾಡುತ್ತೆ. ಒಂದ್ಸಲ set ಮಾಡಿ, ನೂರಾರು students ಗೆ work ಆಗುತ್ತೆ!',
  },
};

// ═══════════════════════════════════════════════════════════════════
// SECTION 2: EACH FIELD EXPLAINED
// ═══════════════════════════════════════════════════════════════════
const fieldGuide = [
  {
    icon: '📝',
    label: 'Rule Name',
    en: {
      what: 'A clear, descriptive name for the rule.',
      why: 'So staff can quickly understand what this rule does at a glance.',
      good: 'Auto-Assign Class 5 Fee (₹44,000)',
      bad: 'Rule 1, Discount, Fee Rule',
    },
    kn: {
      what: 'Rule ಗೆ ಒಂದು clear, descriptive ಹೆಸರು.',
      why: 'Staff ಒಂದೇ ನೋಟದಲ್ಲಿ ಈ rule ಏನು ಮಾಡುತ್ತೆ ಅಂತ ಅರ್ಥ ಆಗಬೇಕು.',
      good: 'Auto-Assign Class 5 Fee (₹44,000)',
      bad: 'Rule 1, Discount, Fee Rule',
    },
  },
  {
    icon: '🎯',
    label: 'Priority (1 = Highest)',
    en: {
      what: 'A number that decides the ORDER in which rules execute. Lower number = runs FIRST.',
      why: 'When a student matches multiple rules, Priority decides which rule runs first. Fee must be assigned BEFORE a discount can be applied to it.',
      good: 'P1 = Fee Assign, P5 = Staff Discount, P6 = Sibling Discount',
      bad: 'All rules having same priority like P1, P1, P1',
    },
    kn: {
      what: 'Rules ಯಾವ ORDER ನಲ್ಲಿ execute ಆಗಬೇಕು ಅನ್ನೋದನ್ನ decide ಮಾಡುವ number. ಕಡಿಮೆ number = ಮೊದಲು run ಆಗುತ್ತೆ.',
      why: 'ಒಬ್ಬ student multiple rules ಗೆ match ಆದಾಗ, Priority decide ಮಾಡುತ್ತೆ ಯಾವುದು ಮೊದಲು run ಆಗಬೇಕು ಅಂತ. Discount ಕೊಡುವ ಮುಂಚೆ Fee assign ಆಗಿರಬೇಕು.',
      good: 'P1 = Fee Assign, P5 = Staff Discount, P6 = Sibling Discount',
      bad: 'ಎಲ್ಲ rules ಗೆ same priority P1, P1, P1',
    },
  },
  {
    icon: '⚙️',
    label: 'Rule Type',
    en: {
      what: 'What KIND of automation this rule performs.',
      why: 'Different types trigger different system behaviors.',
      good: 'Auto-Assign = assign fee package, Auto-Discount = apply discount, Auto-Waive = full waiver',
      bad: 'Choosing wrong type (Auto-Assign when you want discount)',
    },
    kn: {
      what: 'ಈ rule ಯಾವ TYPE ದ automation ಮಾಡುತ್ತೆ.',
      why: 'ಬೇರೆ ಬೇರೆ types system ನಲ್ಲಿ ಬೇರೆ ಬೇರೆ behaviors trigger ಮಾಡುತ್ತೆ.',
      good: 'Auto-Assign = fee package assign, Auto-Discount = discount apply, Auto-Waive = full waiver',
      bad: 'Discount ಬೇಕಿರುವಾಗ Auto-Assign ಆಯ್ಕೆ ಮಾಡೋದು',
    },
  },
  {
    icon: '🔔',
    label: 'Trigger On',
    en: {
      what: 'WHEN should this rule activate? You can select multiple triggers.',
      why: 'Controls exactly when the rule fires — only on admission, session start, or manual trigger.',
      good: 'New Admission + Session Start (covers both new and existing students)',
      bad: 'Selecting all triggers when rule should only work on new admissions',
    },
    kn: {
      what: 'ಈ rule ಯಾವಾಗ activate ಆಗಬೇಕು? Multiple triggers ಆಯ್ಕೆ ಮಾಡಬಹುದು.',
      why: 'Rule ಯಾವಾಗ fire ಆಗಬೇಕು ಅನ್ನೋದನ್ನ exactly control ಮಾಡುತ್ತೆ — admission ಆದಾಗ, session start ಆದಾಗ, ಅಥವಾ manual ಆಗಿ.',
      good: 'New Admission + Session Start (new ಮತ್ತು existing students ಇಬ್ಬರಿಗೂ cover)',
      bad: 'ಎಲ್ಲ triggers select ಮಾಡೋದು, rule only new admissions ಗೆ ಬೇಕಿರುವಾಗ',
    },
  },
  {
    icon: '🎪',
    label: 'Conditions',
    en: {
      what: 'Filters that decide WHICH students this rule applies to. ALL conditions must match.',
      why: 'Without conditions, rule will apply to ALL students. Conditions narrow it down to specific students.',
      good: 'IF Class = Class 5 → Only Class 5 students get this fee',
      bad: 'No conditions = every student gets the fee (dangerous!)',
    },
    kn: {
      what: 'ಈ rule ಯಾವ students ಗೆ apply ಆಗಬೇಕು ಅನ್ನೋದನ್ನ decide ಮಾಡುವ filters. ಎಲ್ಲ conditions match ಆಗಬೇಕು.',
      why: 'Conditions ಇಲ್ಲದಿದ್ದರೆ, rule ಎಲ್ಲ students ಗೆ apply ಆಗುತ್ತೆ. Conditions specific students ಗೆ narrow ಮಾಡುತ್ತೆ.',
      good: 'IF Class = Class 5 → Class 5 students ಗೆ ಮಾತ್ರ ಈ fee ಬರುತ್ತೆ',
      bad: 'Conditions ಇಲ್ಲದಿದ್ದರೆ = ಎಲ್ಲ students ಗೆ fee ಹೋಗುತ್ತೆ (dangerous!)',
    },
  },
  {
    icon: '⚡',
    label: 'Action Config',
    en: {
      what: 'The ACTUAL THING the system does when conditions match. Depends on Rule Type.',
      why: 'This is the heart of the rule — assigns a fee structure, applies discount %, or sets a fixed discount amount.',
      good: 'Assign Structure → "Class 5 Fee 2026-27" OR Discount % → 50',
      bad: 'Forgetting to select fee structure in action config',
    },
    kn: {
      what: 'Conditions match ಆದಾಗ system ACTUALLY ಏನು ಮಾಡಬೇಕು. Rule Type ಮೇಲೆ depend ಆಗುತ್ತೆ.',
      why: 'ಇದು rule ದ heart — fee structure assign ಮಾಡುತ್ತೆ, discount % apply ಮಾಡುತ್ತೆ, ಅಥವಾ fixed discount amount set ಮಾಡುತ್ತೆ.',
      good: 'Assign Structure → "Class 5 Fee 2026-27" ಅಥವಾ Discount % → 50',
      bad: 'Action config ನಲ್ಲಿ fee structure ಆಯ್ಕೆ ಮಾಡೋದು ಮರೆಯೋದು',
    },
  },
  {
    icon: '🔐',
    label: 'Requires Approval',
    en: {
      what: 'If checked, admin must approve before the rule action takes effect.',
      why: 'Safety check for high-impact rules like 50% discount — prevents accidental mass changes.',
      good: 'ON for discount/waiver rules (₹₹₹ impact)',
      bad: 'ON for fee assign rules (slows down normal workflow)',
    },
    kn: {
      what: 'Check ಮಾಡಿದರೆ, rule action effect ಆಗುವ ಮುಂಚೆ admin approve ಮಾಡಬೇಕು.',
      why: '50% discount ಥರ high-impact rules ಗೆ safety check — accidental mass changes ತಪ್ಪಿಸುತ್ತೆ.',
      good: 'Discount/waiver rules ಗೆ ON (₹₹₹ impact ಇರುತ್ತೆ)',
      bad: 'Fee assign rules ಗೆ ON (normal workflow slow ಆಗುತ್ತೆ)',
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// SECTION 3: PRIORITY EXPLAINED WITH VISUAL
// ═══════════════════════════════════════════════════════════════════
const priorityExamples = [
  { priority: 1, name: 'Auto-Assign Pre KG Fee', type: 'assign', amount: '₹20,000', color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300' },
  { priority: 3, name: 'SC/ST Full Fee Waiver', type: 'waive', amount: '100%', color: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300' },
  { priority: 5, name: 'Staff Child 50% Discount', type: 'discount', amount: '50%', color: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300' },
  { priority: 6, name: 'Sibling 10% Discount', type: 'discount', amount: '10%', color: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300' },
  { priority: 20, name: 'Auto-Assign LKG Fee', type: 'assign', amount: '₹30,000', color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300' },
  { priority: 80, name: 'Auto-Assign Class 5 Fee', type: 'assign', amount: '₹44,000', color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300' },
  { priority: 130, name: 'Auto-Assign Class 10 Fee', type: 'assign', amount: '₹66,000', color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300' },
];

// ═══════════════════════════════════════════════════════════════════
// SECTION 4: RULE TYPES
// ═══════════════════════════════════════════════════════════════════
const ruleTypes = [
  {
    type: 'Auto-Assign',
    icon: '📦',
    color: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200',
    en: { what: 'Assigns a complete fee package to the student', example: 'Student admitted to Class 5 → System assigns "Class 5 Fee 2026-27 (₹44,000)" with 3 installments, due dates, and late fees automatically' },
    kn: { what: 'Student ಗೆ ಒಂದು complete fee package assign ಮಾಡುತ್ತೆ', example: 'Student Class 5 ಗೆ admission ಆದಾಗ → System "Class 5 Fee 2026-27 (₹44,000)" 3 installments, due dates, late fees ಎಲ್ಲ automatically assign ಮಾಡುತ್ತೆ' },
  },
  {
    type: 'Auto-Discount',
    icon: '💰',
    color: 'bg-green-50 dark:bg-green-950/30 border-green-200',
    en: { what: 'Applies a percentage or fixed discount on existing fees', example: 'Staff child in Class 5 (₹44,000 fee) → System applies 50% discount → Student pays only ₹22,000' },
    kn: { what: 'Existing fees ಮೇಲೆ percentage ಅಥವಾ fixed discount apply ಮಾಡುತ್ತೆ', example: 'Staff child Class 5 ನಲ್ಲಿದ್ದರೆ (₹44,000 fee) → System 50% discount apply ಮಾಡುತ್ತೆ → Student ₹22,000 ಮಾತ್ರ ಕಟ್ಟಬೇಕು' },
  },
  {
    type: 'Auto-Waive',
    icon: '🎁',
    color: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200',
    en: { what: 'Completely waives (removes) the fee — 100% free', example: 'SC/ST category student → System waives entire fee → Student pays ₹0 (as per government norms)' },
    kn: { what: 'Fee ನ ಸಂಪೂರ್ಣವಾಗಿ waive (remove) ಮಾಡುತ್ತೆ — 100% free', example: 'SC/ST category student → System ಇಡೀ fee waive ಮಾಡುತ್ತೆ → Student ₹0 ಕಟ್ಟಬೇಕು (government norms ಪ್ರಕಾರ)' },
  },
  {
    type: 'Auto-Add Fee',
    icon: '➕',
    color: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200',
    en: { what: 'Adds an EXTRA fee component on top of existing fees', example: 'Student assigned to hostel → System adds "Hostel Fee ₹35,000" on top of regular tuition fee' },
    kn: { what: 'Existing fees ಮೇಲೆ ಒಂದು EXTRA fee component add ಮಾಡುತ್ತೆ', example: 'Student hostel ಗೆ assign ಆದಾಗ → System regular tuition fee ಮೇಲೆ "Hostel Fee ₹35,000" add ಮಾಡುತ್ತೆ' },
  },
];

// ═══════════════════════════════════════════════════════════════════
// SECTION 5: TRIGGER TYPES
// ═══════════════════════════════════════════════════════════════════
const triggers = [
  {
    name: 'New Admission',
    icon: '🎓',
    en: 'Rule fires when a NEW student is admitted. Best for auto-assigning fees at admission time.',
    kn: 'NEW student admission ಆದಾಗ rule fire ಆಗುತ್ತೆ. Admission time ನಲ್ಲಿ fees auto-assign ಮಾಡಲು best.',
  },
  {
    name: 'Session Start',
    icon: '📅',
    en: 'Rule fires when a new academic session begins. Best for promoting students and assigning new year fees.',
    kn: 'ಹೊಸ academic session start ಆದಾಗ rule fire ಆಗುತ್ತೆ. Students promote ಮಾಡಿ new year fees assign ಮಾಡಲು best.',
  },
  {
    name: 'Manual Only',
    icon: '👆',
    en: 'Rule fires only when admin clicks "Run Rules" manually. Best for one-time special rules.',
    kn: 'Admin "Run Rules" manually click ಮಾಡಿದಾಗ ಮಾತ್ರ fire ಆಗುತ್ತೆ. One-time special rules ಗೆ best.',
  },
  {
    name: 'Hostel Assignment',
    icon: '🏠',
    en: 'Rule fires when student is assigned to a hostel. Best for auto-adding hostel fee.',
    kn: 'Student hostel ಗೆ assign ಆದಾಗ rule fire ಆಗುತ್ತೆ. Hostel fee auto-add ಮಾಡಲು best.',
  },
  {
    name: 'Transport Assignment',
    icon: '🚌',
    en: 'Rule fires when student is assigned to a transport route. Best for auto-adding transport fee.',
    kn: 'Student transport route ಗೆ assign ಆದಾಗ rule fire ಆಗುತ್ತೆ. Transport fee auto-add ಮಾಡಲು best.',
  },
];

// ═══════════════════════════════════════════════════════════════════
// SECTION 6: CONDITION FIELDS
// ═══════════════════════════════════════════════════════════════════
const conditionFields = [
  {
    field: 'Class',
    operators: 'in / not in',
    en: 'Which class the student belongs to. Most commonly used condition.',
    kn: 'Student ಯಾವ class ನಲ್ಲಿದ್ದಾರೆ. ಅತಿ ಹೆಚ್ಚು ಬಳಸುವ condition.',
    example: 'IF Class IN [Class 5] → Assign Class 5 fee package',
  },
  {
    field: 'Category',
    operators: 'in / not in',
    en: 'Student caste/category (General, OBC, SC, ST). Used for government scholarship rules.',
    kn: 'Student caste/category (General, OBC, SC, ST). Government scholarship rules ಗೆ ಬಳಸುತ್ತೆ.',
    example: 'IF Category IN [SC, ST] → Waive full fee',
  },
  {
    field: 'Gender',
    operators: 'equals / not equals',
    en: 'Male or Female. Used for gender-specific fee schemes.',
    kn: 'Male ಅಥವಾ Female. Gender-specific fee schemes ಗೆ ಬಳಸುತ್ತೆ.',
    example: 'IF Gender = Female → Apply 25% scholarship',
  },
  {
    field: 'New Admission',
    operators: 'equals',
    en: 'Whether student is newly admitted this session. Used for admission-specific fees.',
    kn: 'Student ಈ session ನಲ್ಲಿ new admission ಆಗಿದ್ದಾರಾ. Admission-specific fees ಗೆ ಬಳಸುತ್ತೆ.',
    example: 'IF New Admission = Yes → Add admission processing fee',
  },
  {
    field: 'Staff Ward',
    operators: 'equals',
    en: 'Whether student is a staff member\'s child. Used for staff discount rules.',
    kn: 'Student staff member ಮಗ/ಮಗಳಾ. Staff discount rules ಗೆ ಬಳಸುತ್ತೆ.',
    example: 'IF Staff Ward = Yes → Apply 50% discount',
  },
  {
    field: 'Hostel Assigned',
    operators: 'equals',
    en: 'Whether student has been assigned to a hostel room.',
    kn: 'Student hostel room ಗೆ assign ಆಗಿದ್ದಾರಾ.',
    example: 'IF Hostel Assigned = Yes → Add Hostel Fee ₹35,000',
  },
  {
    field: 'Transport Assigned',
    operators: 'equals',
    en: 'Whether student has been assigned to a transport route.',
    kn: 'Student transport route ಗೆ assign ಆಗಿದ್ದಾರಾ.',
    example: 'IF Transport Assigned = Yes → Add Transport Fee ₹15,000',
  },
];

// ═══════════════════════════════════════════════════════════════════
// SECTION 7: REAL SCENARIOS
// ═══════════════════════════════════════════════════════════════════
const realScenarios = [
  {
    title: { en: 'Scenario 1: Normal Student Admission', kn: 'ಸನ್ನಿವೇಶ 1: ಸಾಮಾನ್ಯ Student Admission' },
    student: 'Rahul Kumar — Class 5, General Category',
    steps: [
      { en: 'Admin admits Rahul to Class 5', kn: 'Admin Rahul ನ Class 5 ಗೆ admit ಮಾಡುತ್ತಾರೆ' },
      { en: 'P80: Auto-Assign Class 5 Fee fires → ₹44,000 fee assigned (3 installments)', kn: 'P80: Auto-Assign Class 5 Fee fire ಆಗುತ್ತೆ → ₹44,000 fee assign (3 installments)' },
      { en: 'No other rules match (not staff child, not SC/ST, no sibling)', kn: 'ಬೇರೆ ಯಾವ rules match ಆಗಲ್ಲ (staff child ಅಲ್ಲ, SC/ST ಅಲ್ಲ, sibling ಇಲ್ಲ)' },
    ],
    result: { en: 'Rahul pays full ₹44,000 in 3 installments: May ₹14,500 + Sep ₹14,500 + Jan ₹15,000', kn: 'Rahul ₹44,000 ಪೂರ್ತಿ 3 installments ನಲ್ಲಿ ಕಟ್ಟಬೇಕು: May ₹14,500 + Sep ₹14,500 + Jan ₹15,000' },
    color: 'border-blue-300',
  },
  {
    title: { en: 'Scenario 2: Staff Child Admission', kn: 'ಸನ್ನಿವೇಶ 2: Staff ಮಗ/ಮಗಳ Admission' },
    student: 'Priya (Teacher Geetha\'s daughter) — Class 3',
    steps: [
      { en: 'Admin admits Priya to Class 3, marks "Staff Ward = Yes"', kn: 'Admin Priya ನ Class 3 ಗೆ admit ಮಾಡಿ "Staff Ward = Yes" mark ಮಾಡುತ್ತಾರೆ' },
      { en: 'P60: Auto-Assign Class 3 Fee fires → ₹42,000 fee assigned', kn: 'P60: Auto-Assign Class 3 Fee fire ಆಗುತ್ತೆ → ₹42,000 fee assign' },
      { en: 'P5: Staff Child 50% Discount fires → 50% discount applied → ₹21,000 discount', kn: 'P5: Staff Child 50% Discount fire ಆಗುತ್ತೆ → 50% discount apply → ₹21,000 discount' },
      { en: 'Admin gets approval notification (requires_approval = true)', kn: 'Admin ಗೆ approval notification ಬರುತ್ತೆ (requires_approval = true)' },
    ],
    result: { en: 'After approval, Priya pays only ₹21,000 instead of ₹42,000 — 50% saved!', kn: 'Approve ಆದ ಮೇಲೆ, Priya ₹42,000 ಬದಲು ₹21,000 ಮಾತ್ರ ಕಟ್ಟಬೇಕು — 50% save!' },
    color: 'border-green-300',
  },
  {
    title: { en: 'Scenario 3: Sibling Admission', kn: 'ಸನ್ನಿವೇಶ 3: Sibling (ಅಣ್ಣ/ತಮ್ಮ) Admission' },
    student: 'Arun (elder brother already in Class 8) — Class 1',
    steps: [
      { en: 'Admin admits Arun to Class 1, links him as sibling', kn: 'Admin Arun ನ Class 1 ಗೆ admit ಮಾಡಿ sibling link ಮಾಡುತ್ತಾರೆ' },
      { en: 'P40: Auto-Assign Class 1 Fee fires → ₹40,000 fee assigned', kn: 'P40: Auto-Assign Class 1 Fee fire ಆಗುತ್ತೆ → ₹40,000 fee assign' },
      { en: 'P6: Sibling 10% Discount fires → ₹4,000 discount applied', kn: 'P6: Sibling 10% Discount fire ಆಗುತ್ತೆ → ₹4,000 discount apply' },
    ],
    result: { en: 'Arun pays ₹36,000 instead of ₹40,000 — ₹4,000 saved for sibling benefit!', kn: 'Arun ₹40,000 ಬದಲು ₹36,000 ಕಟ್ಟಬೇಕು — Sibling benefit ನಿಂದ ₹4,000 save!' },
    color: 'border-amber-300',
  },
  {
    title: { en: 'Scenario 4: SC/ST Student Waiver', kn: 'ಸನ್ನಿವೇಶ 4: SC/ST Student Fee Waiver' },
    student: 'Manoj — Class 10, SC Category',
    steps: [
      { en: 'Admin admits Manoj to Class 10 with category = SC', kn: 'Admin Manoj ನ Class 10 ಗೆ category = SC ಅಂತ admit ಮಾಡುತ್ತಾರೆ' },
      { en: 'P130: Auto-Assign Class 10 Fee fires → ₹66,000 fee assigned', kn: 'P130: Auto-Assign Class 10 Fee fire ಆಗುತ್ತೆ → ₹66,000 fee assign' },
      { en: 'P3: SC/ST Waiver fires → 100% waiver applied → Full fee waived', kn: 'P3: SC/ST Waiver fire ಆಗುತ್ತೆ → 100% waiver apply → ಪೂರ್ತಿ fee waive' },
      { en: 'Admin must approve (high-impact decision)', kn: 'Admin approve ಮಾಡಬೇಕು (high-impact decision)' },
    ],
    result: { en: 'After approval, Manoj pays ₹0 — government SC/ST benefit applied.', kn: 'Approve ಆದ ಮೇಲೆ, Manoj ₹0 ಕಟ್ಟಬೇಕು — government SC/ST benefit apply ಆಗಿದೆ.' },
    color: 'border-purple-300',
  },
];

// ═══════════════════════════════════════════════════════════════════
// SECTION 8: FEE STRUCTURE TABLE
// ═══════════════════════════════════════════════════════════════════
const feeTable = [
  { cls: 'Pre KG (Nursery)', fee: '₹20,000', inst: 2, due: 'May + Sep' },
  { cls: 'LKG', fee: '₹30,000', inst: 2, due: 'May + Sep' },
  { cls: 'UKG', fee: '₹32,000', inst: 2, due: 'May + Sep' },
  { cls: 'Class 1', fee: '₹40,000', inst: 3, due: 'May + Sep + Jan' },
  { cls: 'Class 2', fee: '₹41,000', inst: 3, due: 'May + Sep + Jan' },
  { cls: 'Class 3', fee: '₹42,000', inst: 3, due: 'May + Sep + Jan' },
  { cls: 'Class 4', fee: '₹42,500', inst: 3, due: 'May + Sep + Jan' },
  { cls: 'Class 5', fee: '₹44,000', inst: 3, due: 'May + Sep + Jan' },
  { cls: 'Class 6', fee: '₹44,500', inst: 3, due: 'May + Sep + Jan' },
  { cls: 'Class 7', fee: '₹45,500', inst: 3, due: 'May + Sep + Jan' },
  { cls: 'Class 8', fee: '₹48,500', inst: 3, due: 'May + Sep + Jan' },
  { cls: 'Class 9', fee: '₹55,000', inst: 3, due: 'May + Sep + Jan' },
  { cls: 'Class 10', fee: '₹66,000', inst: 3, due: 'May + Sep + Jan' },
];

// ═══════════════════════════════════════════════════════════════════
// SECTION 9: COMMON MISTAKES
// ═══════════════════════════════════════════════════════════════════
const mistakes = [
  {
    icon: '❌',
    en: 'Creating a fee rule WITHOUT conditions — this will assign fee to ALL students of ALL classes!',
    kn: 'Conditions ಇಲ್ಲದೆ fee rule create ಮಾಡೋದು — ಇದು ALL classes ನ ALL students ಗೆ fee assign ಮಾಡುತ್ತೆ!',
  },
  {
    icon: '❌',
    en: 'Setting Discount Rule priority LOWER than Fee Assign Rule — discount will try to apply BEFORE fee exists!',
    kn: 'Discount Rule priority ಅನ್ನು Fee Assign Rule ಗಿಂತ LOWER ಇಡೋದು — fee ಇಲ್ಲದೆ discount apply ಆಗಲು try ಮಾಡುತ್ತೆ!',
  },
  {
    icon: '❌',
    en: 'Using same priority number for multiple rules — execution order becomes unpredictable!',
    kn: 'Multiple rules ಗೆ same priority number ಕೊಡೋದು — execution order unpredictable ಆಗುತ್ತೆ!',
  },
  {
    icon: '❌',
    en: 'Keeping old session rules active — they may interfere with current session rules!',
    kn: 'ಹಳೆ session rules ನ active ಇಡೋದು — current session rules ಗೆ interfere ಆಗಬಹುದು!',
  },
  {
    icon: '❌',
    en: 'Not using "Requires Approval" for discount/waiver rules — mass discounts without admin checking!',
    kn: 'Discount/waiver rules ಗೆ "Requires Approval" ಹಾಕದೆ ಇರೋದು — admin check ಇಲ್ಲದೆ mass discounts!',
  },
  {
    icon: '✅',
    en: 'DO: Always test with one student first, verify result, then apply to all.',
    kn: 'DO: ಮೊದಲು ಒಬ್ಬ student ನಲ್ಲಿ test ಮಾಡಿ, result verify ಮಾಡಿ, ಆಮೇಲೆ ಎಲ್ಲರಿಗೂ apply ಮಾಡಿ.',
  },
];

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
const FeeRulesGuide = () => {
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
              {t('Fee Rules — Complete Guide', 'Fee Rules — ಸಂಪೂರ್ಣ Guide')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t(
                'Everything you need to understand about fee automation rules — with real examples.',
                'Fee automation rules ಬಗ್ಗೆ ನಿಮಗೆ ಬೇಕಾದ ಎಲ್ಲ ಮಾಹಿತಿ — real examples ಸಮೇತ.'
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
            <Button size="sm" variant="outline" onClick={() => navigate(`/${roleSlug}/fees-collection/fee-rules`)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> {t('Back to Rules', 'Rules ಗೆ ಹಿಂದೆ')}
            </Button>
          </div>
        </div>

        {/* ═══ SECTION 1: WHAT IS A FEE RULE? ═══ */}
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

            {/* Visual Flow */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {[
                { icon: <GraduationCap className="h-5 w-5" />, label: t('Student Admitted', 'Student Admit') },
                null,
                { icon: <Target className="h-5 w-5" />, label: t('Conditions Check', 'Conditions Check') },
                null,
                { icon: <Zap className="h-5 w-5" />, label: t('Rule Fires', 'Rule Fire') },
                null,
                { icon: <IndianRupee className="h-5 w-5" />, label: t('Fee Auto-Applied', 'Fee Auto-Apply') },
              ].map((item, i) => item === null ? (
                <ArrowRight key={i} className="h-5 w-5 text-muted-foreground" />
              ) : (
                <div key={i} className="flex flex-col items-center gap-1 rounded-xl border bg-background px-4 py-3 min-w-[110px]">
                  {item.icon}
                  <span className="text-xs font-medium text-center">{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ═══ SECTION 2: EACH FIELD EXPLAINED ═══ */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5" />
            {t('Every Field Explained', 'ಪ್ರತಿ Field ನ ವಿವರಣೆ')}
          </h2>
          <div className="space-y-4">
            {fieldGuide.map((f) => {
              const data = isE ? f.en : f.kn;
              return (
                <Card key={f.label}>
                  <CardContent className="pt-5">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{f.icon}</span>
                      <div className="flex-1 space-y-3">
                        <h3 className="font-bold text-base">{f.label}</h3>
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground">{t('What is it?', 'ಇದು ಏನು?')}</p>
                          <p className="text-sm">{data.what}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground">{t('Why important?', 'ಯಾಕೆ important?')}</p>
                          <p className="text-sm">{data.why}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-3">
                            <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-1">✅ {t('Good Example', 'ಒಳ್ಳೆಯ ಉದಾಹರಣೆ')}</p>
                            <p className="text-sm text-green-800 dark:text-green-300">{data.good}</p>
                          </div>
                          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-3">
                            <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-1">❌ {t('Bad Example', 'ಕೆಟ್ಟ ಉದಾಹರಣೆ')}</p>
                            <p className="text-sm text-red-800 dark:text-red-300">{data.bad}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* ═══ SECTION 3: PRIORITY VISUAL ═══ */}
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-amber-600" />
              {t('Priority — Execution Order Explained', 'Priority — Execution Order ವಿವರಣೆ')}
            </CardTitle>
            <CardDescription>
              {t(
                'Priority = Queue Number. Smaller number = runs FIRST. Think of it like a hospital token — Token 1 goes first, Token 100 goes last.',
                'Priority = ಕ್ಯೂ ನಂಬರ್. ಚಿಕ್ಕ number = ಮೊದಲು run. Hospital token ಥರ ಯೋಚಿಸಿ — Token 1 ಮೊದಲು, Token 100 ಕೊನೆಗೆ.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {priorityExamples.map((p, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-lg border p-3 ${p.color}`}>
                  <div className="font-mono font-bold text-lg min-w-[50px] text-center">P{p.priority}</div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.type === 'assign' ? t('Assigns fee', 'Fee assign') : p.type === 'discount' ? t('Applies discount', 'Discount apply') : t('Waives fee', 'Fee waive')}</p>
                  </div>
                  <Badge variant="secondary" className="font-mono">{p.amount}</Badge>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4">
              <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {t('Why Order Matters', 'Order ಯಾಕೆ ಮುಖ್ಯ')}
              </p>
              <p className="text-sm mt-1 text-amber-700 dark:text-amber-400">
                {t(
                  'Fee MUST be assigned FIRST (P1, P20, P80...), then discount can be applied AFTER (P5, P6). You cannot give 50% discount on ₹0 — there must be a fee to discount!',
                  'ಮೊದಲು Fee assign ಆಗಬೇಕು (P1, P20, P80...), ಆಮೇಲೆ discount apply ಆಗುತ್ತೆ (P5, P6). ₹0 ಮೇಲೆ 50% discount ಕೊಡಕ್ಕೆ ಆಗಲ್ಲ — discount ಕೊಡಲು ಮೊದಲು fee ಇರಬೇಕು!'
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ═══ SECTION 4: RULE TYPES ═══ */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {t('Rule Types — What Each One Does', 'Rule Types — ಪ್ರತಿಯೊಂದು ಏನು ಮಾಡುತ್ತೆ')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ruleTypes.map((rt) => {
              const data = isE ? rt.en : rt.kn;
              return (
                <Card key={rt.type} className={`${rt.color}`}>
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{rt.icon}</span>
                      <h3 className="font-bold">{rt.type}</h3>
                    </div>
                    <p className="text-sm">{data.what}</p>
                    <div className="rounded-lg bg-background/80 border p-3">
                      <p className="text-xs font-bold text-muted-foreground mb-1">{t('Real Example:', 'ನಿಜ ಉದಾಹರಣೆ:')}</p>
                      <p className="text-sm">{data.example}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* ═══ SECTION 5: TRIGGERS ═══ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CircleDot className="h-5 w-5" />
              {t('Trigger Types — When Does Rule Fire?', 'Trigger Types — Rule ಯಾವಾಗ Fire ಆಗುತ್ತೆ?')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {triggers.map((tr) => (
                <div key={tr.name} className="rounded-xl border p-4 space-y-2 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{tr.icon}</span>
                    <h4 className="font-bold text-sm">{tr.name}</h4>
                  </div>
                  <p className="text-xs leading-relaxed">{isE ? tr.en : tr.kn}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ═══ SECTION 6: CONDITIONS ═══ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5" />
              {t('Condition Fields — Filter Which Students', 'Condition Fields — ಯಾವ Students ಗೆ Apply ಆಗಬೇಕು')}
            </CardTitle>
            <CardDescription>
              {t(
                'Conditions filter students. ALL conditions must match for the rule to fire. No conditions = applies to ALL students (dangerous!).',
                'Conditions students ನಲ್ಲಿ filter ಮಾಡುತ್ತೆ. ಎಲ್ಲ conditions match ಆಗಬೇಕು rule fire ಆಗಲು. Conditions ಇಲ್ಲದಿದ್ದರೆ = ಎಲ್ಲ students ಗೆ apply (dangerous!).'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-semibold">{t('Condition Field', 'Condition Field')}</th>
                    <th className="text-left p-3 font-semibold">{t('Operators', 'Operators')}</th>
                    <th className="text-left p-3 font-semibold">{t('Description', 'ವಿವರಣೆ')}</th>
                    <th className="text-left p-3 font-semibold">{t('Example', 'ಉದಾಹರಣೆ')}</th>
                  </tr>
                </thead>
                <tbody>
                  {conditionFields.map((cf) => (
                    <tr key={cf.field} className="border-b hover:bg-muted/20">
                      <td className="p-3 font-semibold">{cf.field}</td>
                      <td className="p-3"><Badge variant="outline" className="font-mono text-xs">{cf.operators}</Badge></td>
                      <td className="p-3 text-muted-foreground">{isE ? cf.en : cf.kn}</td>
                      <td className="p-3"><code className="text-xs bg-muted px-2 py-1 rounded">{cf.example}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ═══ SECTION 7: REAL SCENARIOS ═══ */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('Real Scenarios — See Rules in Action!', 'Real Scenarios — Rules ಹೇಗೆ Work ಆಗುತ್ತೆ ನೋಡಿ!')}
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

        {/* ═══ SECTION 8: FEE TABLE ═══ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <IndianRupee className="h-5 w-5" />
              {t('Fee Structure Reference — 2026-27 Session', 'Fee Structure Reference — 2026-27 Session')}
            </CardTitle>
            <CardDescription>
              {t(
                'Each class has its own fee structure with installments and due dates. Late fee: ₹50/day.',
                'ಪ್ರತಿ class ಗೆ separate fee structure ಇದೆ, installments ಮತ್ತು due dates ಸಮೇತ. Late fee: ₹50/day.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-semibold">{t('Class', 'Class')}</th>
                    <th className="text-right p-3 font-semibold">{t('Annual Fee', 'ವಾರ್ಷಿಕ Fee')}</th>
                    <th className="text-center p-3 font-semibold">{t('Installments', 'Installments')}</th>
                    <th className="text-left p-3 font-semibold">{t('Due Months', 'Due Months')}</th>
                  </tr>
                </thead>
                <tbody>
                  {feeTable.map((row) => (
                    <tr key={row.cls} className="border-b hover:bg-muted/20">
                      <td className="p-3 font-medium">{row.cls}</td>
                      <td className="p-3 text-right font-mono font-bold">{row.fee}</td>
                      <td className="p-3 text-center"><Badge variant="secondary">{row.inst}</Badge></td>
                      <td className="p-3 text-muted-foreground">{row.due}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ═══ SECTION 9: MISTAKES ═══ */}
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

        {/* ═══ QUICK SUMMARY BOX ═══ */}
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
                <p className="font-bold">{t('Rule = IF this THEN do that', 'Rule = IF ಇದು THEN ಅದು ಮಾಡು')}</p>
                <p className="font-bold">{t('Priority = Queue number (1 = first)', 'Priority = ಕ್ಯೂ ನಂಬರ್ (1 = ಮೊದಲು)')}</p>
                <p className="font-bold">{t('Condition = WHO gets affected', 'Condition = ಯಾರಿಗೆ apply ಆಗುತ್ತೆ')}</p>
                <p className="font-bold">{t('Action = WHAT happens', 'Action = ಏನಾಗುತ್ತೆ')}</p>
              </div>
              <div className="space-y-2">
                <p className="font-bold">{t('Trigger = WHEN it runs', 'Trigger = ಯಾವಾಗ run ಆಗುತ್ತೆ')}</p>
                <p className="font-bold">{t('Approval = Safety check for ₹₹₹', 'Approval = ₹₹₹ ಗೆ safety check')}</p>
                <p className="font-bold">{t('Active/Inactive = ON/OFF switch', 'Active/Inactive = ON/OFF switch')}</p>
                <p className="font-bold">{t('Test first, then apply to all!', 'ಮೊದಲು test, ಆಮೇಲೆ ಎಲ್ಲರಿಗೂ apply!')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default FeeRulesGuide;
