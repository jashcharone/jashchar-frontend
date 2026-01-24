import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSchoolSlug } from '@/hooks/useSchoolSlug';
import { useSchoolPublicData } from '@/hooks/useSchoolPublicData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2 } from 'lucide-react';

const PublicSignUp = () => {
  const schoolAlias = useSchoolSlug();
  const { schoolData } = useSchoolPublicData(schoolAlias);
  const school = schoolData?.schools;
  const settings = schoolData;
  const { toast } = useToast();
  const [step, setStep] = useState('role');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);

  // Note: Actual public signup usually goes into a "pending approval" table or specific admission flow.
  // Here we simulate a submission for online admission inquiry.

  const handleRegister = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep('success');
      toast({ title: "Application Submitted", description: "Your application has been received." });
    }, 1500);
  };

  if (!school) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Online Admission</h1>
          <p className="text-slate-500">{school.name}</p>
        </div>

        {step === 'role' && (
          <div className="space-y-6">
            <Label className="text-base">I am applying as a:</Label>
            <RadioGroup defaultValue="student" onValueChange={setRole} className="grid grid-cols-2 gap-4">
              <div>
                <RadioGroupItem value="student" id="student" className="peer sr-only" />
                <Label htmlFor="student" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                  <span className="text-lg font-semibold">Student</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="staff" id="staff" className="peer sr-only" />
                <Label htmlFor="staff" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                  <span className="text-lg font-semibold">Staff</span>
                </Label>
              </div>
            </RadioGroup>
            <Button className="w-full" onClick={() => setStep('form')}>Continue</Button>
            <div className="text-center text-sm"><Link to={`/${schoolAlias}/login`} className="text-blue-600 hover:underline">Already registered? Login</Link></div>
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>First Name</Label><Input required /></div>
              <div className="space-y-2"><Label>Last Name</Label><Input required /></div>
            </div>
            <div className="space-y-2"><Label>Email Address</Label><Input type="email" required /></div>
            <div className="space-y-2"><Label>Phone Number</Label><Input type="tel" required /></div>
            {role === 'student' && (
              <div className="space-y-2"><Label>Class Applying For</Label><Input placeholder="e.g. Grade 5" required /></div>
            )}
            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="animate-spin mr-2" /> : null} Submit Application</Button>
              <Button variant="ghost" className="w-full mt-2" onClick={() => setStep('role')}>Back</Button>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4">
            <div className="flex justify-center"><CheckCircle2 className="h-16 w-16 text-green-500" /></div>
            <h2 className="text-xl font-bold">Application Received!</h2>
            <p className="text-slate-600">Thank you for applying to {school.name}. Our admissions team will review your details and contact you shortly.</p>
            <Button asChild className="w-full"><Link to={`/${schoolAlias}`}>Back to Home</Link></Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicSignUp;
