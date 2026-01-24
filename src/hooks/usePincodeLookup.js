import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';

/**
 * Custom hook for pincode lookup with auto-fill for city, state, and post offices
 * Uses backend proxy API to avoid CORS issues
 * 
 * Usage:
 * const {
 *   pincode, setPincode, pincodeLoading, postOffices,
 *   city, setCity, state, setState, handlePincodeChange
 * } = usePincodeLookup();
 */
export function usePincodeLookup(initialPincode = '', initialCity = '', initialState = '') {
  const [pincode, setPincode] = useState(initialPincode);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [postOffices, setPostOffices] = useState([]);
  const [city, setCity] = useState(initialCity);
  const [state, setState] = useState(initialState);
  const { toast } = useToast();

  // Reset function for post offices
  const resetPostOffices = useCallback(() => {
    setPostOffices([]);
  }, []);

  // Handle pincode input change
  const handlePincodeChange = useCallback((e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPincode(value);
  }, []);

  // Fetch location data when pincode changes
  useEffect(() => {
    const fetchPincodeData = async () => {
      // Only fetch if pincode is exactly 6 digits
      if (pincode.length !== 6) {
        setPostOffices([]);
        return;
      }

      setPincodeLoading(true);
      try {
        let found = false;

        // Use backend public API to avoid CORS issues (no auth required)
        try {
          const response = await api.get(`/public/pincode/${pincode}`);
          const data = response.data;

          // Public API returns array of post offices directly
          if (data && Array.isArray(data) && data.length > 0) {
            found = true;
            // Format already matches: { Name, District, State, Country }
            setPostOffices(data);
            setCity(data[0].District || '');
            setState(data[0].State || '');
          }
        } catch (err) {
          console.log('Public API failed, trying authenticated API...');
          
          // Fallback to authenticated address API
          try {
            const response = await api.get(`/address/pincode/${pincode}`);
            const addrData = response.data;

            if (addrData && addrData.found && Array.isArray(addrData.postOffices) && addrData.postOffices.length > 0) {
              found = true;
              // Transform to match expected format for UI
              const transformedPostOffices = addrData.postOffices.map(po => ({
                Name: po.name,
                District: po.city,
                State: po.state,
                Country: po.country || 'India'
              }));
              setPostOffices(transformedPostOffices);
              setCity(addrData.postOffices[0].city || '');
              setState(addrData.postOffices[0].state || '');
            }
          } catch (addrErr) {
            console.log('Authenticated API also failed');
          }
        }

        if (!found) {
          setPostOffices([]);
          toast({
            variant: 'destructive',
            title: 'Invalid Pincode',
            description: 'No location found for this pincode. Please verify and try again.'
          });
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'API Error',
          description: error.message
        });
      } finally {
        setPincodeLoading(false);
      }
    };

    // Debounce the API call
    const timer = setTimeout(fetchPincodeData, 500);
    return () => clearTimeout(timer);
  }, [pincode, toast]);

  // Set initial values (useful when editing existing data)
  const setInitialValues = useCallback((newPincode, newCity, newState) => {
    if (newPincode) setPincode(newPincode);
    if (newCity) setCity(newCity);
    if (newState) setState(newState);
  }, []);

  return {
    // Pincode state
    pincode,
    setPincode,
    pincodeLoading,
    postOffices,
    
    // City and State
    city,
    setCity,
    state,
    setState,
    
    // Helper functions
    handlePincodeChange,
    resetPostOffices,
    setInitialValues
  };
}

export default usePincodeLookup;
