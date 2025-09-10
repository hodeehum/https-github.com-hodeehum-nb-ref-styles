import React, { useState, useRef, useEffect } from 'react';
import { AspectRatio } from '../types';
import { ASPECT_RATIO_OPTIONS } from '../constants';

interface AspectRatioSelectProps {
  label: string;
  value: AspectRatio;
  onChange: (value: AspectRatio) => void;
  disabled?: boolean;
  options?: typeof ASPECT_RATIO_OPTIONS;
}

const AspectRatioSelect: React.FC<AspectRatioSelectProps> = ({ label, value, onChange, disabled = false, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const optionsToUse = options || ASPECT_RATIO_OPTIONS;
  const selectedOption = optionsToUse.find(opt => opt.value === value) || optionsToUse[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  
  const handleSelect = (newValue: AspectRatio) => {
    onChange(newValue);
    setIsOpen(false);
  };

  const ChevronDown = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  const ChevronUp = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  );

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <div ref={wrapperRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full bg-gray-700 border rounded-lg p-2.5 text-white transition flex items-center justify-between ${isOpen ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="flex items-center gap-3">
            <span className="w-6 flex items-center justify-center flex-shrink-0">
              <selectedOption.Icon className="w-5 h-5" />
            </span>
            <span className="font-medium w-12 text-left flex-shrink-0">{selectedOption.ratio}</span>
            <span className="text-gray-400">{selectedOption.description}</span>
          </span>
          {isOpen ? <ChevronUp /> : <ChevronDown />}
        </button>
        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg">
            <ul className="py-1 px-1">
              {optionsToUse.map(option => (
                <li
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`px-3 py-2 text-sm text-gray-200 hover:bg-indigo-600 flex items-center gap-3 cursor-pointer rounded-md transition-colors border ${option.value === value ? 'border-indigo-500' : 'border-transparent'}`}
                >
                  <span className="w-6 flex items-center justify-center flex-shrink-0">
                    <option.Icon className="w-5 h-5"/>
                  </span>
                  <span className="font-medium w-12 text-left flex-shrink-0">{option.ratio}</span>
                  <span className="text-gray-400">{option.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AspectRatioSelect;