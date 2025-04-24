import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";

interface InputFieldProps {
  label: string;
  type: "text" | "number";
  value: string | number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  icon?: string;
  canLock?: boolean;
  locked?: boolean;
  onLock?: () => void;
  useSlider?: boolean;
}

export default function InputField({
  label,
  type,
  value,
  onChange,
  min,
  max,
  step = 1,
  icon,
  canLock = false,
  locked = false,
  onLock,
  useSlider = false,
}: InputFieldProps) {
  const [sliderValue, setSliderValue] = useState<number[]>([Number(value)]);
  const [displayValue, setDisplayValue] = useState<string | number>(value);

  // Update slider when input value changes
  useEffect(() => {
    setSliderValue([Number(value)]);
    setDisplayValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value === "" ? 0 : parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      setDisplayValue(e.target.value); // Allow empty string in input
      onChange(newValue);
    }
  };

  const handleSliderChange = (newValues: number[]) => {
    const newValue = newValues[0];
    setSliderValue([newValue]);
    setDisplayValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label htmlFor={label.replace(/\s+/g, '')} className="block text-sm font-medium text-primary-700">
          {label}
        </label>
        {canLock && onLock && (
          <div 
            className="flex items-center gap-1 cursor-pointer text-primary-500 hover:text-primary-700"
            onClick={onLock}
          >
            <i className={locked ? "ri-lock-fill text-primary-600" : "ri-lock-unlock-line text-primary-500"}></i>
            <span className="text-xs">{locked ? "Locked" : "Unlock"}</span>
          </div>
        )}
        {useSlider && (
          <span className="text-xs text-primary-500">
            {typeof displayValue === 'number' ? displayValue.toFixed(1) : displayValue}%
          </span>
        )}
      </div>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className={`${icon} text-primary-500`}></i>
          </div>
        )}
        <input
          type={type}
          id={label.replace(/\s+/g, '')}
          value={displayValue}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          disabled={locked}
          className="spin-button-none block w-full pl-10 pr-3 py-2 border border-primary-300 rounded-md shadow-sm focus:ring-info-500 focus:border-info-500 text-primary-900 disabled:opacity-70 disabled:cursor-not-allowed"
        />
      </div>
      
      {useSlider && (
        <Slider
          value={sliderValue}
          min={min || 0}
          max={max || 100}
          step={step}
          className="mt-2"
          onValueChange={handleSliderChange}
          disabled={locked}
        />
      )}
    </div>
  );
}
