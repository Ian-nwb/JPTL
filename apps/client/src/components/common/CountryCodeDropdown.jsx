import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import { getCountries, filterCountries } from '../../services/countryService';

export const CountryCodeDropdown = ({
  value = '+63',
  onChange,
  disabled = false,
  error = false,
  id = 'country-code-select',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [countries, setCountries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Load countries on mount
  useEffect(() => {
    let isMounted = true;
    getCountries().then((data) => {
      if (isMounted) setCountries(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle click outside to dismiss
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto-focus search input when opening
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedCountry = countries.find((c) => c.dialCode === value) || {
    flag: '🌐',
    dialCode: value,
    name: 'Select',
    code: '',
  };

  const filtered = filterCountries(countries, searchQuery);

  const handleSelect = (country) => {
    onChange?.(country.dialCode, country);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`h-full flex items-center gap-1.5 px-3 py-3 rounded-2xl border transition-all duration-150 ${
          error
            ? 'border-rose-500'
            : isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500/20'
            : 'border-slate-300 dark:border-slate-800 hover:border-indigo-500/50'
        } bg-white dark:bg-[#0D111D] text-xs font-semibold text-slate-800 dark:text-white shadow-sm disabled:opacity-50 cursor-pointer`}
        aria-label="Select Country Phone Code"
        aria-expanded={isOpen}
      >
        <span className="text-base leading-none select-none">{selectedCountry.flag}</span>
        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
          {selectedCountry.dialCode}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-500' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-72 sm:w-80 bg-white dark:bg-[#0D111D] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Header */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search country or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Countries List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 overscroll-contain">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No country found for "{searchQuery}"
              </div>
            ) : (
              filtered.map((country, idx) => {
                const isSelected = country.dialCode === value;
                return (
                  <button
                    key={`${country.code}-${country.dialCode}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(country)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="text-base shrink-0 select-none">{country.flag}</span>
                      <span className="truncate">{country.name}</span>
                      <span className="text-xs font-mono text-slate-400 shrink-0 uppercase">
                        {country.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        {country.dialCode}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryCodeDropdown;
