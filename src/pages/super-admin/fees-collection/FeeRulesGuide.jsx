import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Brain, Languages, CheckCircle2, Lightbulb } from 'lucide-react';

const workflowCards = [
  {
    en: 'Create rule',
    kn: 'Rule create ಮಾಡಿ',
  },
  {
    en: 'Add conditions',
    kn: 'Conditions ಸೇರಿಸಿ',
  },
  {
    en: 'Choose action',
    kn: 'Action ಆಯ್ಕೆ ಮಾಡಿ',
  },
  {
    en: 'Run and verify',
    kn: 'Run ಮಾಡಿ verify ಮಾಡಿ',
  },
];

const steps = [
  {
    id: 1,
    enTitle: 'Understand purpose of Fee Rules',
    knTitle: 'Fee Rules purpose ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ',
    enPurpose: 'Fee Rules page is used when system should automatically apply fees, discounts, or waivers based on conditions.',
    knPurpose: 'Conditions ಆಧಾರವಾಗಿ fees, discounts, ಅಥವಾ waivers ಅನ್ನು system automatically apply ಮಾಡಬೇಕಾದರೆ Fee Rules page ಬಳಸಲಾಗುತ್ತದೆ.',
    enFill: 'Open Fees Collection -> Fee Rules.',
    knFill: 'Fees Collection -> Fee Rules ತೆರೆಯಿರಿ.',
    enExample: 'Example use case: New admission students should automatically get a fee structure.',
    knExample: 'ಉದಾಹರಣೆ: New admission students ಗೆ system ಸ್ವಯಂಚಾಲಿತವಾಗಿ fee structure assign ಮಾಡಬೇಕು.',
    enResult: 'You understand when this page should be used and when it should not.',
    knResult: 'ಈ page ಯಾವಾಗ ಬಳಸಬೇಕು, ಯಾವಾಗ ಬೇಡ ಎಂಬುದು clear ಆಗುತ್ತದೆ.',
  },
  {
    id: 2,
    enTitle: 'Create Rule basics',
    knTitle: 'Rule basic details ತುಂಬಿ',
    enPurpose: 'Every rule needs a proper name, priority, type, and trigger.',
    knPurpose: 'ಪ್ರತಿ rule ಗೆ ಸರಿಯಾದ name, priority, type, trigger ಬೇಕು.',
    enFill: 'Click Create Rule and fill Rule Name, Priority, Rule Type, and Trigger.',
    knFill: 'Create Rule ಕ್ಲಿಕ್ ಮಾಡಿ Rule Name, Priority, Rule Type, Trigger fill ಮಾಡಿ.',
    enExample: 'Rule Name: New Admission Auto Assign, Priority: 10, Rule Type: Auto Assign, Trigger: Admission.',
    knExample: 'Rule Name: New Admission Auto Assign, Priority: 10, Rule Type: Auto Assign, Trigger: Admission.',
    enResult: 'The system now knows what kind of automation this rule is.',
    knResult: 'ಈ rule ಯಾವ automation ಗಾಗಿ ಅನ್ನೋದು system ಗೆ ಗೊತ್ತಾಗುತ್ತದೆ.',
  },
  {
    id: 3,
    enTitle: 'Add conditions clearly',
    knTitle: 'Conditions ಸ್ಪಷ್ಟವಾಗಿ ಸೇರಿಸಿ',
    enPurpose: 'Conditions decide to whom the rule applies.',
    knPurpose: 'Conditions ಅಂದ್ರೆ rule ಯಾರಿಗೆ apply ಆಗಬೇಕು ಅನ್ನೋದನ್ನು ತೀರ್ಮಾನಿಸುತ್ತದೆ.',
    enFill: 'Choose condition fields like Class, Category, New Admission, Transport Assigned, Hostel Assigned.',
    knFill: 'Class, Category, New Admission, Transport Assigned, Hostel Assigned ಮೊದಲಾದ condition fields ಆಯ್ಕೆ ಮಾಡಿ.',
    enExample: 'Condition: Class = 1st PUC and New Admission = Yes.',
    knExample: 'Condition: Class = 1st PUC ಮತ್ತು New Admission = Yes.',
    enResult: 'Only matching students will be affected.',
    knResult: 'Matching students ಗೆ ಮಾತ್ರ ಈ rule apply ಆಗುತ್ತದೆ.',
  },
  {
    id: 4,
    enTitle: 'Choose action properly',
    knTitle: 'ಸರಿಯಾದ action ಆಯ್ಕೆ ಮಾಡಿ',
    enPurpose: 'Action tells the system what to do after conditions are matched.',
    knPurpose: 'Conditions match ಆದ ನಂತರ system ಏನು ಮಾಡಬೇಕು ಅನ್ನೋದನ್ನು action ನಿರ್ಧರಿಸುತ್ತದೆ.',
    enFill: 'Choose action type like Assign Structure, Apply Discount %, Apply Fixed Discount, Add Fee, Waive Fee.',
    knFill: 'Assign Structure, Apply Discount %, Apply Fixed Discount, Add Fee, Waive Fee action types ನಿಂದ ಸರಿಯಾದುದನ್ನು ಆಯ್ಕೆ ಮಾಡಿ.',
    enExample: 'Action: Assign Fee Structure = PUC Science Structure.',
    knExample: 'Action: Assign Fee Structure = PUC Science Structure.',
    enResult: 'Correct fee action becomes ready for execution.',
    knResult: 'ಸರಿಯಾದ fee action execute ಆಗಲು ready ಆಗುತ್ತದೆ.',
  },
  {
    id: 5,
    enTitle: 'Run only after checking',
    knTitle: 'Check ಮಾಡಿದ ನಂತರ ಮಾತ್ರ run ಮಾಡಿ',
    enPurpose: 'Rules can affect many students, so verify before actual execution.',
    knPurpose: 'Rules ಹಲವಾರು students ಮೇಲೆ ಪರಿಣಾಮ ಬೀರುತ್ತವೆ, ಆದ್ದರಿಂದ actual run ಮುಂಚೆ verify ಮಾಡಬೇಕು.',
    enFill: 'Use Run Preview or check your logic first. Then use Run All Rules.',
    knFill: 'ಮೊದಲು Run Preview ಅಥವಾ logic verify ಮಾಡಿ. ನಂತರ Run All Rules ಬಳಸಿ.',
    enExample: 'First test one discount rule, then activate remaining rules.',
    knExample: 'ಮೊದಲು ಒಂದು discount rule test ಮಾಡಿ, ನಂತರ ಬಾಕಿ rules activate ಮಾಡಿ.',
    enResult: 'Wrong fee actions can be avoided before they affect all students.',
    knResult: 'ಎಲ್ಲ ವಿದ್ಯಾರ್ಥಿಗಳ ಮೇಲೆ ತಪ್ಪು fee action ಹೋಗುವುದನ್ನು ಮುಂಚೆಯೇ ತಪ್ಪಿಸಬಹುದು.',
  },
  {
    id: 6,
    enTitle: 'Disable old or unused rules',
    knTitle: 'ಹಳೆಯ ಅಥವಾ ಬೇಡದ rules disable ಮಾಡಿ',
    enPurpose: 'Inactive rules keep the page clean and avoid accidental execution.',
    knPurpose: 'Inactive rules ಇಟ್ಟರೆ page clean ಆಗಿರುತ್ತದೆ ಮತ್ತು ತಪ್ಪಾಗಿ run ಆಗುವುದನ್ನು ತಪ್ಪಿಸಬಹುದು.',
    enFill: 'If a rule is old or temporary, keep it inactive instead of using it again blindly.',
    knFill: 'ಹಳೆಯ ಅಥವಾ temporary rule ಇದ್ದರೆ ಮತ್ತೆ blindly ಬಳಸುವ ಬದಲು inactive ಇಡಿ.',
    enExample: 'Last year discount rule can remain inactive for reference.',
    knExample: 'ಹಿಂದಿನ ವರ್ಷದ discount rule ಅನ್ನು referenceಗಾಗಿ inactive ಇಡಬಹುದು.',
    enResult: 'Current workflow remains neat and safe.',
    knResult: 'Current workflow neat ಮತ್ತು safe ಆಗಿ ಉಳಿಯುತ್ತದೆ.',
  },
];

const fieldGuide = [
  {
    label: 'Rule Name',
    en: 'Clear rule identity visible to staff.',
    kn: 'Staffಗೆ ಸ್ಪಷ್ಟವಾಗಿ ಕಾಣುವ rule ಹೆಸರು.',
    sample: 'New Admission Auto Assign',
  },
  {
    label: 'Priority',
    en: 'Lower number means higher priority.',
    kn: 'ಕಡಿಮೆ number ಅಂದರೆ ಹೆಚ್ಚು priority.',
    sample: '10',
  },
  {
    label: 'Rule Type',
    en: 'Defines what kind of automation rule it is.',
    kn: 'ಯಾವ ತರದ automation rule ಅನ್ನೋದನ್ನು ಹೇಳುತ್ತದೆ.',
    sample: 'Auto Assign',
  },
  {
    label: 'Trigger',
    en: 'When the rule should start working.',
    kn: 'Rule ಯಾವಾಗ ಕೆಲಸ ಆರಂಭಿಸಬೇಕು.',
    sample: 'Admission',
  },
  {
    label: 'Condition',
    en: 'To whom the rule should apply.',
    kn: 'Rule ಯಾರಿಗೆ apply ಆಗಬೇಕು.',
    sample: 'Class = 1st PUC',
  },
  {
    label: 'Action',
    en: 'What system should do after match.',
    kn: 'Match ಆದ ನಂತರ system ಏನು ಮಾಡಬೇಕು.',
    sample: 'Assign Structure',
  },
];

const demoScript = [
  {
    en: 'Step 1: Create rule name as "New Admission Auto Assign".',
    kn: 'Step 1: Rule name ಅನ್ನು "New Admission Auto Assign" ಎಂದು create ಮಾಡಿ.',
  },
  {
    en: 'Step 2: Set trigger as Admission and priority as 10.',
    kn: 'Step 2: Trigger ಅನ್ನು Admission ಆಗಿ ಮತ್ತು priority ಅನ್ನು 10 ಆಗಿ ಇಡಿ.',
  },
  {
    en: 'Step 3: Add condition for selected class or new admission = yes.',
    kn: 'Step 3: Selected class ಅಥವಾ new admission = yes condition add ಮಾಡಿ.',
  },
  {
    en: 'Step 4: Choose Assign Structure action and save the rule.',
    kn: 'Step 4: Assign Structure action ಆಯ್ಕೆ ಮಾಡಿ rule save ಮಾಡಿ.',
  },
  {
    en: 'Step 5: Run preview, explain result, then run actual rule.',
    kn: 'Step 5: Run preview ಮಾಡಿ, result explain ಮಾಡಿ, ನಂತರ actual rule run ಮಾಡಿ.',
  },
];

const mistakes = [
  {
    en: 'Do not keep two active rules with the same purpose and conflicting priority.',
    kn: 'ಒಂದೇ purpose ಇರುವ conflicting priority rules ಅನ್ನು ಎರಡನ್ನೂ active ಇಡಬೇಡಿ.',
  },
  {
    en: 'Do not run all rules without checking conditions and action once.',
    kn: 'Conditions ಮತ್ತು action check ಮಾಡದೇ ಎಲ್ಲ rules run ಮಾಡಬೇಡಿ.',
  },
  {
    en: 'Do not use vague rule names like Rule 1 or Discount Rule.',
    kn: 'Rule 1 ಅಥವಾ Discount Rule ಅನ್ನುವ vague names ಬಳಸದಿರಿ.',
  },
];

const FeeRulesGuide = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const roleSlug = location.pathname.split('/').filter(Boolean)[0] || 'super-admin';
  const [lang, setLang] = useState('en');
  const isEnglish = lang === 'en';

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Smart Fee Rules Guide
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isEnglish ? 'Pin-to-pin workflow guide to explain fee automation clearly.' : 'Fee automation ಅನ್ನು ಸ್ಪಷ್ಟವಾಗಿ explain ಮಾಡಲು pin-to-pin workflow guide.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant={lang === 'en' ? 'default' : 'outline'} onClick={() => setLang('en')}>
              <Languages className="h-4 w-4 mr-2" />
              English
            </Button>
            <Button type="button" variant={lang === 'kn' ? 'default' : 'outline'} onClick={() => setLang('kn')}>
              ಕನ್ನಡ
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(`/${roleSlug}/fees-collection/fee-rules`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </div>

        <Card className="border-primary/20 bg-gradient-to-r from-sky-50 via-white to-emerald-50 dark:from-sky-950/20 dark:via-background dark:to-emerald-950/20">
          <CardHeader>
            <CardTitle>{isEnglish ? 'What This Page Does' : 'ಈ Page ಏನು ಮಾಡುತ್ತದೆ'}</CardTitle>
            <CardDescription>
              {isEnglish
                ? 'Use this page when the system should automatically assign fees, discounts, add fee components, or waive fees.'
                : 'Fees assign, discount apply, fee add, ಅಥವಾ waive ಅನ್ನು system automatic ಆಗಿ ಮಾಡಬೇಕಾದರೆ ಈ page ಬಳಸಲಾಗುತ್ತದೆ.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {workflowCards.map((item) => (
                <div key={item.en} className="rounded-xl border bg-background p-3 text-center">
                  <p className="text-sm font-semibold">{isEnglish ? item.en : item.kn}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isEnglish ? 'Field Guide' : 'Field Guide'}</CardTitle>
            <CardDescription>
              {isEnglish ? 'What to fill in each important rule field.' : 'ಪ್ರತಿ ಮುಖ್ಯ rule field ನಲ್ಲಿ ಏನು ತುಂಬಬೇಕು.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {fieldGuide.map((field) => (
              <div key={field.label} className="rounded-xl border p-4 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm">{field.label}</p>
                  <Badge variant="outline">Sample</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{isEnglish ? field.en : field.kn}</p>
                <div className="rounded-md bg-background border px-3 py-2 text-sm font-medium">{field.sample}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{isEnglish ? 'Pin-to-Pin Workflow' : 'Pin-to-Pin Workflow'}</h2>
          {steps.map((step) => (
            <Card key={step.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant="secondary">Step {step.id}</Badge>
                  {isEnglish ? step.enTitle : step.knTitle}
                </CardTitle>
                <CardDescription>{isEnglish ? step.knTitle : step.enTitle}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold">{isEnglish ? 'Why' : 'ಯಾಕೆ'}</p>
                  <p className="text-muted-foreground">{isEnglish ? step.enPurpose : step.knPurpose}</p>
                </div>
                <div>
                  <p className="font-semibold">{isEnglish ? 'What to do' : 'ಏನು ಮಾಡಬೇಕು'}</p>
                  <p className="text-muted-foreground">{isEnglish ? step.enFill : step.knFill}</p>
                </div>
                <div>
                  <p className="font-semibold">{isEnglish ? 'Example' : 'ಉದಾಹರಣೆ'}</p>
                  <p className="text-muted-foreground">{isEnglish ? step.enExample : step.knExample}</p>
                </div>
                <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 px-3 py-2">
                  <p className="font-semibold text-emerald-700 dark:text-emerald-300">{isEnglish ? 'What happens next' : 'ನಂತರ ಏನು ಆಗುತ್ತದೆ'}</p>
                  <p className="text-sm mt-1 text-emerald-700 dark:text-emerald-300">{isEnglish ? step.enResult : step.knResult}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              {isEnglish ? 'Live Demo Flow' : 'Live Demo Flow'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {demoScript.map((row, idx) => (
              <div key={idx} className="border rounded-md p-3 bg-muted/30 flex items-start gap-3">
                <Badge variant="secondary">{idx + 1}</Badge>
                <p>{isEnglish ? row.en : row.kn}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              {isEnglish ? 'Common Mistakes to Avoid' : 'ತಪ್ಪಿಸಬೇಕಾದ ಸಾಮಾನ್ಯ ತಪ್ಪುಗಳು'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {mistakes.map((item, index) => (
              <div key={index} className="border-l-2 border-primary pl-3 py-1">
                <p>{isEnglish ? item.en : item.kn}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FeeRulesGuide;
