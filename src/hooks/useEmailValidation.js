import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useEmailValidation = (initialError = '') => {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(initialError);
  const validationTimeout = useRef(null);

  const validateEmail = useCallback((email) => {
    clearTimeout(validationTimeout.current);
    setError('');

    if (!email) {
      setIsChecking(false);
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address.');
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    validationTimeout.current = setTimeout(async () => {
      try {
        const { data, error: rpcError } = await supabase.rpc('check_email_exists', { p_email: email });
        
        if (rpcError) {
          console.error("RPC Error:", rpcError);
        } else if (data) {
          setError('This email address has already been registered.');
        } else {
          setError('');
        }
      } catch (e) {
        console.error("Email validation failed:", e);
      } finally {
        setIsChecking(false);
      }
    }, 800);
  }, []);
  
  const resetValidation = useCallback(() => {
      clearTimeout(validationTimeout.current);
      setIsChecking(false);
      setError('');
  }, []);

  return { isChecking, error, validateEmail, setError, resetValidation };
};
