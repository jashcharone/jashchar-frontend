import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useAadharValidation = (initialError = '') => {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(initialError);
  const validationTimeout = useRef(null);

  const validateAadhar = useCallback((aadharNumber) => {
    clearTimeout(validationTimeout.current);
    setError('');

    if (!aadharNumber || aadharNumber.length !== 12) {
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    validationTimeout.current = setTimeout(async () => {
      try {
        // Check in student_profiles table using aadhar_no column
        const { data, error: dbError } = await supabase
          .from('student_profiles')
          .select('id, first_name, last_name')
          .eq('aadhar_no', aadharNumber)
          .limit(1);

        if (dbError) {
          console.error("Aadhar validation error:", dbError);
          // Don't set error message if it's a schema issue - just log it
        } else if (data && data.length > 0) {
          const studentName = `${data[0].first_name || ''} ${data[0].last_name || ''}`.trim();
          setError(`This Aadhar number is already registered to ${studentName || 'another student'}.`);
        } else {
          setError('');
        }
      } catch (e) {
        console.error("Aadhar validation failed:", e);
      } finally {
        setIsChecking(false);
      }
    }, 800); // 800ms debounce
  }, []);
  
  const resetValidation = useCallback(() => {
      clearTimeout(validationTimeout.current);
      setIsChecking(false);
      setError('');
  }, []);

  return { isChecking, error, validateAadhar, setError: setError, resetValidation };
};
