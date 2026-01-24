import React, { useState, useRef, useEffect } from 'react';
import { ChevronsUpDown, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const MultiSelectDropdown = ({ options = [], selectedValues = [], onSelectionChange, placeholder = "Select...", className }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  // Ensure selectedValues is always an array
  const safeSelectedValues = Array.isArray(selectedValues) ? selectedValues : [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (value, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const valueStr = String(value);
    const currentValues = safeSelectedValues.map(v => String(v));
    
    let newValues;
    if (currentValues.includes(valueStr)) {
      newValues = safeSelectedValues.filter(v => String(v) !== valueStr);
    } else {
      newValues = [...safeSelectedValues, value];
    }
    onSelectionChange(newValues);
  };
  
  const isSelected = (value) => {
    return safeSelectedValues.some(v => String(v) === String(value));
  };

  const getDisplayValue = () => {
    if (safeSelectedValues.length === 0) {
      return placeholder;
    }
    const selectedLabels = options
      .filter(opt => isSelected(opt.value))
      .map(opt => opt.label);
    
    if (selectedLabels.length <= 2) {
      return selectedLabels.join(', ');
    }
    return `${selectedLabels.length} selected`;
  };

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={cn("w-full justify-between font-normal", className)}
      >
        <span className="truncate">{getDisplayValue()}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          {/* Search Input */}
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Options List */}
          <div className="max-h-60 overflow-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </div>
            ) : (
              filteredOptions.map((option) => {
                const checked = isSelected(option.value);
                return (
                  <div
                    key={option.value}
                    onClick={(e) => handleSelect(option.value, e)}
                    className={cn(
                      "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer select-none",
                      "hover:bg-accent hover:text-accent-foreground",
                      checked && "bg-accent/50"
                    )}
                  >
                    <div className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border",
                      checked ? "bg-primary border-primary text-primary-foreground" : "border-input"
                    )}>
                      {checked && <Check className="h-3 w-3" />}
                    </div>
                    <span>{option.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
