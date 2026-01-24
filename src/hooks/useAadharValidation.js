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
        const { data, error: dbError } = await supabase
          .from('profiles')
          .select('id')
          .eq('aadhar_no', aadharNumber)
          .limit(1);

        if (dbError) {
          console.error("Aadhar validation RPC Error:", dbError);
        } else if (data && data.length > 0) {
          setError('This Aadhar number already exists.');
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
