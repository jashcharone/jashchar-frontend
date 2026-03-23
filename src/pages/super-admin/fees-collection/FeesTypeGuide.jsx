import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpenText, CheckCircle2, Lightbulb, Languages } from 'lucide-react';

const workflowCards = [
  {
    en: 'Open page',
    kn: 'ಪುಟ ತೆರೆಯಿರಿ',
  },
  {
    en: 'Fill form',
    kn: 'Form ತುಂಬಿ',
  },
  {
    en: 'Save record',
    kn: 'Save ಮಾಡಿ',
  },
  {
    en: 'Verify in list',
    kn: 'List ನಲ್ಲಿ ನೋಡಿ',
  },
];

const steps = [
  {
    id: 1,
    enTitle: 'Open Fees Type page',
    knTitle: 'Fees Type page ತೆರೆಯಿರಿ',
    enPurpose: 'This page is used to create fee names that will be used later in fee master and collection.',
    knPurpose: 'ಈ page ನಲ್ಲಿ ಮುಂದೆ Fee Master ಮತ್ತು collection ನಲ್ಲಿ ಬಳಸುವ fee ಹೆಸರುಗಳನ್ನು create ಮಾಡಲಾಗುತ್ತದೆ.',
    enFill: 'Open Fees Collection -> Fees Type. Look at left form and right list.',
    knFill: 'Fees Collection -> Fees Type ತೆರೆಯಿರಿ. ಎಡಭಾಗದಲ್ಲಿ form, ಬಲಭಾಗದಲ್ಲಿ list ಇರುತ್ತದೆ.',
    enExample: 'Example: Tuition Fee, Lab Fee, Exam Fee, Annual Fee.',
    knExample: 'ಉದಾಹರಣೆ: Tuition Fee, Lab Fee, Exam Fee, Annual Fee.',
    enResult: 'You now know where to add and where to verify.',
    knResult: 'ಇಲ್ಲಿ add ಮಾಡಬೇಕು, list ನಲ್ಲಿ verify ಮಾಡಬೇಕು ಎಂಬುದು clear ಆಗುತ್ತದೆ.',
  },
  {
    id: 2,
    enTitle: 'Fill Name field',
    knTitle: 'Name field ತುಂಬಿ',
    enPurpose: 'Name is the main label staff will use and search later.',
    knPurpose: 'Name ಅನ್ನೋದು ಮುಂದೆ staff ಬಳಸುವ ಮತ್ತು search ಮಾಡುವ ಮುಖ್ಯ ಹೆಸರು.',
    enFill: 'Enter a simple and clear fee name. Do not use confusing short forms.',
    knFill: 'ಸರಳ ಮತ್ತು ಸ್ಪಷ್ಟ fee name ಕೊಡಿ. ಗೊಂದಲ ಉಂಟುಮಾಡುವ short forms ಬೇಡ.',
    enExample: 'Lab Fee',
    knExample: 'Lab Fee',
    enResult: 'The fee type becomes easy to identify in all fees screens.',
    knResult: 'ಮುಂದಿನ ಎಲ್ಲಾ fees screens ನಲ್ಲಿ ಈ fee type ಸುಲಭವಾಗಿ ಗುರುತಿಸಲಾಗುತ್ತದೆ.',
  },
  {
    id: 3,
    enTitle: 'Fill Fees Code field',
    knTitle: 'Fees Code field ತುಂಬಿ',
    enPurpose: 'Fees Code gives a short system-friendly identity.',
    knPurpose: 'Fees Code ಅಂದರೆ system ಗೆ short identity.',
    enFill: 'Use lowercase words separated by hyphen. Keep it unique.',
    knFill: 'Lowercase words ಮತ್ತು hyphen ಬಳಸಿ. Unique ಆಗಿ ಇಡಿ.',
    enExample: 'lab-fee',
    knExample: 'lab-fee',
    enResult: 'System can track the fee type cleanly and avoid confusion.',
    knResult: 'System ಈ fee type ಅನ್ನು ಸ್ಪಷ್ಟವಾಗಿ track ಮಾಡುತ್ತದೆ.',
  },
  {
    id: 4,
    enTitle: 'Fill Description field',
    knTitle: 'Description field ತುಂಬಿ',
    enPurpose: 'Description explains where or why this fee type is used.',
    knPurpose: 'Description ನಲ್ಲಿ ಈ fee type ಯಾಕೆ ಅಥವಾ ಎಲ್ಲಿ ಬಳಸಲಾಗುತ್ತದೆ ಎಂದು ಬರೆಯಬೇಕು.',
    enFill: 'Write one short sentence only.',
    knFill: 'ಒಂದು ಚಿಕ್ಕ sentence ಮಾತ್ರ ಬರೆಯಿರಿ.',
    enExample: 'Used for science laboratory maintenance charges.',
    knExample: 'Science laboratory maintenance charges ಗಾಗಿ ಬಳಸಲಾಗುತ್ತದೆ.',
    enResult: 'New staff can understand the purpose immediately.',
    knResult: 'ಹೊಸ staff ಕೂಡ ಇದಿನ purpose ಅನ್ನು ಬೇಗ ಅರ್ಥಮಾಡಿಕೊಳ್ಳುತ್ತಾರೆ.',
  },
  {
    id: 5,
    enTitle: 'Click Save and verify',
    knTitle: 'Save ಮಾಡಿ verify ಮಾಡಿ',
    enPurpose: 'After saving, you must confirm that the record is created correctly.',
    knPurpose: 'Save ಮಾಡಿದ ನಂತರ record ಸರಿಯಾಗಿ create ಆಗಿದೆಯೇ ಅಂತ check ಮಾಡಬೇಕು.',
    enFill: 'Click Save. Then check the list on the right side.',
    knFill: 'Save ಕ್ಲಿಕ್ ಮಾಡಿ. ನಂತರ ಬಲಭಾಗದ list ನಲ್ಲಿ check ಮಾಡಿ.',
    enExample: 'Search "Lab Fee" and confirm it appears in the list.',
    knExample: '"Lab Fee" search ಮಾಡಿ list ನಲ್ಲಿ ಕಾಣಿಸುತ್ತಿದೆಯೇ ನೋಡಿ.',
    enResult: 'Entry is ready to use in the next fees workflow.',
    knResult: 'ಈ entry ಮುಂದಿನ fees workflow ನಲ್ಲಿ ಬಳಸಲು ready ಆಗುತ್ತದೆ.',
  },
  {
    id: 6,
    enTitle: 'Edit when needed',
    knTitle: 'ಬೇಕಾದರೆ edit ಮಾಡಿ',
    enPurpose: 'If name/code/description is wrong, fix it before using in fee master.',
    knPurpose: 'Name/code/description ತಪ್ಪಿದ್ದರೆ fee master ನಲ್ಲಿ ಬಳಸುವ ಮೊದಲು correct ಮಾಡಿ.',
    enFill: 'Click edit icon, update the field, and save again.',
    knFill: 'Edit icon ಕ್ಲಿಕ್ ಮಾಡಿ, field update ಮಾಡಿ, ಮತ್ತೆ save ಮಾಡಿ.',
    enExample: 'Change "labfee" to "lab-fee".',
    knExample: '"labfee" ಅನ್ನು "lab-fee" ಎಂದು change ಮಾಡಿ.',
    enResult: 'Data remains clean and staff avoids future mistakes.',
    knResult: 'Data clean ಆಗಿರುತ್ತದೆ ಮತ್ತು ಮುಂದಿನ ತಪ್ಪುಗಳು ಕಡಿಮೆಯಾಗುತ್ತವೆ.',
  },
  {
    id: 7,
    enTitle: 'Delete only if safe',
    knTitle: 'Safe ಆಗಿದ್ದರೆ ಮಾತ್ರ delete ಮಾಡಿ',
    enPurpose: 'Some fee types cannot be deleted because they are system or already used.',
    knPurpose: 'ಕೆಲವು fee types system ಆಗಿರಬಹುದು ಅಥವಾ already use ಆಗಿರಬಹುದು, ಆದ್ದರಿಂದ delete ಆಗುವುದಿಲ್ಲ.',
    enFill: 'Delete only unused custom fee types.',
    knFill: 'Use ಆಗದ custom fee types ಅನ್ನು ಮಾತ್ರ delete ಮಾಡಿ.',
    enExample: 'Temporary demo fee type can be deleted after demo.',
    knExample: 'Temporary demo fee type ಅನ್ನು demo ನಂತರ delete ಮಾಡಬಹುದು.',
    enResult: 'Important fee setup remains protected.',
    knResult: 'ಮುಖ್ಯ fee setup safe ಆಗಿ ಉಳಿಯುತ್ತದೆ.',
  },
];

const fieldGuide = [
  {
    label: 'Name',
    en: 'Main visible fee type name.',
    kn: 'ಮುಖ್ಯವಾಗಿ ಕಾಣಿಸುವ fee type ಹೆಸರು.',
    sample: 'Admission Fee',
  },
  {
    label: 'Fees Code',
    en: 'Short system code. Keep unique.',
    kn: 'Short system code. Unique ಆಗಿರಲಿ.',
    sample: 'admission-fee',
  },
  {
    label: 'Description',
    en: 'One-line purpose of the fee type.',
    kn: 'Fee type ಯ purpose ಬಗ್ಗೆ ಒಂದು ಸಾಲು.',
    sample: 'Used during new student admission.',
  },
];

const demoFlow = [
  {
    en: 'Step 1: Create "Admission Fee".',
    kn: 'Step 1: "Admission Fee" create ಮಾಡಿ.',
  },
  {
    en: 'Step 2: Add code as "admission-fee".',
    kn: 'Step 2: code ಅನ್ನು "admission-fee" ಎಂದು ಕೊಡಿ.',
  },
  {
    en: 'Step 3: Add description and click Save.',
    kn: 'Step 3: description ಕೊಟ್ಟು Save ಕ್ಲಿಕ್ ಮಾಡಿ.',
  },
  {
    en: 'Step 4: Search the same record in list and show that it is ready for next setup.',
    kn: 'Step 4: ಅದೇ record ಅನ್ನು list ನಲ್ಲಿ search ಮಾಡಿ, ಮುಂದಿನ setup ಗೆ ready ಇದೆ ಎಂದು ತೋರಿಸಿ.',
  },
];

const mistakes = [
  {
    en: 'Do not use same fee type name for different purposes.',
    kn: 'ಬೇರೆ purposeಗಳಿಗೆ ಒಂದೇ fee type ಹೆಸರು ಬಳಸಬೇಡಿ.',
  },
  {
    en: 'Do not keep code with spaces or random capital letters.',
    kn: 'Code ನಲ್ಲಿ spaces ಅಥವಾ random capital letters ಬಳಸದಿರಿ.',
  },
  {
    en: 'Do not delete a fee type after it is used in further fees setup.',
    kn: 'ಮುಂದಿನ fees setup ನಲ್ಲಿ ಬಳಸಿದ ನಂತರ fee type delete ಮಾಡಬೇಡಿ.',
  },
];

const FeesTypeGuide = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const roleSlug = location.pathname.split('/').filter(Boolean)[0] || 'super-admin';
  const [activeLanguage, setActiveLanguage] = useState('en');
  const isEnglish = activeLanguage === 'en';

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <BookOpenText className="h-6 w-6 text-primary" />
              Fees Type Page Guide
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isEnglish ? 'Pin-to-pin workflow guide for office staff and demo explanation.' : 'Office staff ಮತ್ತು demo explanation ಗಾಗಿ pin-to-pin workflow guide.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={activeLanguage === 'en' ? 'default' : 'outline'}
              onClick={() => setActiveLanguage('en')}
              className="min-w-28"
            >
              <Languages className="h-4 w-4 mr-2" />
              English
            </Button>
            <Button
              type="button"
              variant={activeLanguage === 'kn' ? 'default' : 'outline'}
              onClick={() => setActiveLanguage('kn')}
              className="min-w-28"
            >
              ಕನ್ನಡ
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/${roleSlug}/fees-collection/fees-type`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </div>

        <Card className="border-primary/20 bg-gradient-to-r from-amber-50 via-white to-sky-50 dark:from-amber-950/20 dark:via-background dark:to-sky-950/20">
          <CardHeader>
            <CardTitle>{isEnglish ? 'What This Page Does' : 'ಈ Page ಏನು ಮಾಡುತ್ತದೆ'}</CardTitle>
            <CardDescription>
              {isEnglish
                ? 'Use this page to create fee type names before moving to fee master or fee collection setup.'
                : 'Fee master ಅಥವಾ fee collection setup ಗೆ ಹೋಗುವ ಮೊದಲು fee type names create ಮಾಡಲು ಈ page ಬಳಸಲಾಗುತ್ತದೆ.'}
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
            <CardDescription>{isEnglish ? 'What to enter in each field.' : 'ಪ್ರತಿ field ನಲ್ಲಿ ಏನು enter ಮಾಡಬೇಕು.'}</CardDescription>
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
          <h2 className="text-lg font-semibold">
            {isEnglish ? 'Pin-to-Pin Workflow' : 'Pin-to-Pin Workflow'}
          </h2>
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
            {demoFlow.map((item, index) => (
              <div key={index} className="border rounded-md p-3 bg-muted/30 flex items-start gap-3">
                <Badge variant="secondary">{index + 1}</Badge>
                <p>{isEnglish ? item.en : item.kn}</p>
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
            {mistakes.map((tip, index) => (
              <div key={index} className="border-l-2 border-primary pl-3 py-1">
                <p>{isEnglish ? tip.en : tip.kn}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FeesTypeGuide;
