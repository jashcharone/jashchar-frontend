import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { isValidPinCode } from '@/lib/dateUtils';

const AddressForm = ({ value, onChange, errors = {}, disabled = false }) => {
  const [loading, setLoading] = useState(false);
  const [postOffices, setPostOffices] = useState([]);
  const [address, setAddress] = useState({
    address_line1: '',
    address_line2: '',
    pincode: '',
    post_office: '',
    city: '',
    state: '',
    country: 'India'
  });

  // Sync with parent value
  useEffect(() => {
    if (value) {
      setAddress(prev => ({ ...prev, ...value }));
    }
  }, [value]);

  const handlePinChange = async (e) => {
    const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
    
    // Update local state
    const newAddress = { ...address, pincode: pin, post_office: '', city: '', state: '' };
    setAddress(newAddress);
    onChange(newAddress); // Propagate to parent
    setPostOffices([]);

    if (isValidPinCode(pin)) {
      setLoading(true);
      try {
        const response = await fetch(`/api/address/pincode/${pin}`);
        const data = await response.json();
        
        if (data.found && data.postOffices.length > 0) {
          setPostOffices(data.postOffices);
          
          // Auto-select if only one PO
          if (data.postOffices.length === 1) {
            const po = data.postOffices[0];
            const autoFilled = {
                ...newAddress,
                post_office: po.name,
                city: po.city,
                state: po.state
            };
            setAddress(autoFilled);
            onChange(autoFilled);
          }
        }
      } catch (error) {
        console.error("Failed to fetch address details", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePostOfficeSelect = (poName) => {
    const selectedPO = postOffices.find(po => po.name === poName);
    if (selectedPO) {
        const updated = {
            ...address,
            post_office: poName,
            city: selectedPO.city,
            state: selectedPO.state
        };
        setAddress(updated);
        onChange(updated);
    }
  };

  const handleChange = (field, val) => {
    const updated = { ...address, [field]: val };
    setAddress(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* PIN Code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <Label>PIN Code <span className="text-red-500">*</span></Label>
            <div className="relative">
                <Input 
                    value={address.pincode} 
                    onChange={handlePinChange} 
                    placeholder="Enter 6-digit PIN"
                    maxLength={6}
                    disabled={disabled}
                    className={errors.pincode ? "border-red-500" : ""}
                />
                {loading && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-500" />}
            </div>
            {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
        </div>

        {/* Post Office Dropdown */}
        <div>
            <Label>Post Office <span className="text-red-500">*</span></Label>
            <Select 
                value={address.post_office} 
                onValueChange={handlePostOfficeSelect}
                disabled={disabled || postOffices.length === 0}
            >
                <SelectTrigger className={errors.post_office ? "border-red-500" : ""}>
                    <SelectValue placeholder={loading ? "Fetching..." : "Select Post Office"} />
                </SelectTrigger>
                <SelectContent>
                    {postOffices.map((po, idx) => (
                        <SelectItem key={idx} value={po.name}>{po.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {errors.post_office && <p className="text-xs text-red-500 mt-1">{errors.post_office}</p>}
        </div>
      </div>

      {/* Auto-filled City & State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <Label>City / District</Label>
            <Input value={address.city} readOnly className="bg-gray-50" />
        </div>
        <div>
            <Label>State</Label>
            <Input value={address.state} readOnly className="bg-gray-50" />
        </div>
      </div>

      {/* Address Lines */}
      <div>
        <Label>Address Line 1 <span className="text-red-500">*</span></Label>
        <Input 
            value={address.address_line1} 
            onChange={(e) => handleChange('address_line1', e.target.value)} 
            placeholder="House No, Building, Street"
            disabled={disabled}
            className={errors.address_line1 ? "border-red-500" : ""}
        />
        {errors.address_line1 && <p className="text-xs text-red-500 mt-1">{errors.address_line1}</p>}
      </div>

      <div>
        <Label>Address Line 2 (Optional)</Label>
        <Input 
            value={address.address_line2} 
            onChange={(e) => handleChange('address_line2', e.target.value)} 
            placeholder="Landmark, Area"
            disabled={disabled}
        />
      </div>
    </div>
  );
};

export default AddressForm;
