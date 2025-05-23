import { useState, useEffect, useCallback } from "react";
import InputField from "./InputField";
import ResultsCard from "./ResultsCard";
import { calculateResults } from "@/lib/calculationUtils";
import { formatCurrency } from "@/lib/formatUtils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import debounce from "lodash.debounce";

type LockableField = 'budget' | 'stores' | 'adSpendPerStoreWeek';
type LastChangedField = 'budget' | 'stores' | 'heroBaseline' | 'weeks' | 'userLiftMin' | 'userLiftMax';

interface CalculatorState {
  budget: number;
  stores: number;
  heroBaseline: number; // Annual Baseline ($)
  weeks: number;
  userLiftMin: number; // User input lift % (Lower)
  userLiftMax: number; // User input lift % (Upper)
  lastChanged?: LastChangedField; // Tracks last edited field for locking logic
}

export default function ROICalculator() {
  // State for user inputs and change tracking
  const [state, setState] = useState<CalculatorState>({
    budget: 50000,
    stores: 1000,
    heroBaseline: 10000000,
    weeks: 8,
    userLiftMin: 3.5,
    userLiftMax: 7.0,
  });

  // State for locked fields
  const [lockedFields, setLockedFields] = useState(
    new Set<LockableField>([])
  );

  // Store the locked ASW value separately
  const [lockedASWValue, setLockedASWValue] = useState<number | null>(null);

  // State for calculation results
  const [results, setResults] = useState(calculateResults(state));

  // Primary calculation trigger
  useEffect(() => {
    setResults(calculateResults(state));
  }, [state]);

  // Handle locking interdependencies
  useEffect(() => {
    // Safety check
    if (!state.lastChanged) return;
    
    // Use the stored locked ASW value if available, otherwise use the current calculated value
    const effectiveASW = lockedFields.has('adSpendPerStoreWeek')
      ? (lockedASWValue ?? results.adSpendPerStoreWeek)
      : results.adSpendPerStoreWeek;
    
    // Budget Fixed Priority Logic:
    // When ASW is locked and Weeks change, prioritize Budget and recalculate Stores
    if (lockedFields.has('adSpendPerStoreWeek')) {
      if (state.lastChanged === 'weeks') {
        // User changes Weeks (W) -> Stores (S) automatically recalculates
        const newStores = Math.max(1, Math.round(state.budget / (effectiveASW * state.weeks)));
        
        if (newStores !== state.stores) {
          setState(prev => {
            return {
              ...prev,
              stores: newStores,
              lastChanged: undefined // Reset lastChanged to prevent loops
            };
          });
        }
      } 
      else if (state.lastChanged === 'budget' && !lockedFields.has('stores')) {
        // User changes Budget (B) -> Stores (S) automatically recalculates
        const newStores = Math.max(1, Math.round(state.budget / (effectiveASW * state.weeks)));
        
        if (newStores !== state.stores) {
          setState(prev => {
            return {
              ...prev,
              stores: newStores,
              lastChanged: undefined
            };
          });
        }
      }
      else if (state.lastChanged === 'stores' && !lockedFields.has('budget')) {
        // User changes Stores (S) -> Budget (B) automatically recalculates
        const newBudget = Math.max(0, Number((effectiveASW * state.stores * state.weeks).toFixed(2)));
        
        if (newBudget !== state.budget) {
          setState(prev => {
            return {
              ...prev,
              budget: newBudget,
              lastChanged: undefined
            };
          });
        }
      }
    }
    
  }, [state.budget, state.stores, state.weeks, lockedFields, state.lastChanged, lockedASWValue, results.adSpendPerStoreWeek]);

  // Debounce the change handler for smoother slider interaction
  const debouncedHandleChange = useCallback(
    debounce((field: keyof CalculatorState, value: number) => {
      // Basic validation
      let validatedValue = value;
      
      // Field-specific validations
      if (field === 'budget' || field === 'heroBaseline') {
        validatedValue = Math.max(0, value);
      } else if (field === 'stores') {
        validatedValue = Math.max(1, value);
      } else if (field === 'weeks') {
        validatedValue = Math.min(Math.max(1, value), 52);
      } else if (field === 'userLiftMin') {
        validatedValue = Math.min(Math.max(0, value), state.userLiftMax);
      } else if (field === 'userLiftMax') {
        validatedValue = Math.min(Math.max(state.userLiftMin, value), 25);
      }

      // Update state with validated value and track the last changed field
      setState(prev => {
        if (field === 'budget' || field === 'stores' || field === 'heroBaseline' || 
            field === 'weeks' || field === 'userLiftMin' || field === 'userLiftMax') {
          const lastChanged = field as LastChangedField;
          return {
            ...prev,
            [field]: validatedValue,
            lastChanged
          };
        }
        return prev;
      });
    }, 150),
    [state.userLiftMax, state.userLiftMin]
  );

  // Regular handler for immediate changes
  const handleChange = (field: keyof CalculatorState, value: number) => {
    // For sliders (userLiftMin, userLiftMax), use the debounced handler
    if (field === 'userLiftMin' || field === 'userLiftMax') {
      debouncedHandleChange(field, value);
    } else {
      // For other inputs, apply changes immediately
      // Basic validation
      let validatedValue = value;
      
      // Field-specific validations
      if (field === 'budget' || field === 'heroBaseline') {
        validatedValue = Math.max(0, value);
      } else if (field === 'stores') {
        validatedValue = Math.max(1, value);
      } else if (field === 'weeks') {
        validatedValue = Math.min(Math.max(1, value), 52);
      }

      // Update state with validated value and track the last changed field
      setState(prev => {
        const lastChanged = field as LastChangedField;
        return {
          ...prev,
          [field]: validatedValue,
          lastChanged
        };
      });
    }
  };

  const handleLock = (field: LockableField) => {
    // Create a new Set for locked fields
    const newLockedFields = new Set(lockedFields);
    
    if (newLockedFields.has(field)) {
      // Unlock the field
      newLockedFields.delete(field);
      
      // If we're unlocking adSpendPerStoreWeek, clear the stored value
      if (field === 'adSpendPerStoreWeek') {
        setLockedASWValue(null);
      }
    } else {
      // Don't allow locking all three parameters
      if (field === 'adSpendPerStoreWeek' && 
          lockedFields.has('budget') && 
          lockedFields.has('stores')) {
        return; // Cannot lock all three
      }
      
      // Lock the field
      newLockedFields.add(field);
      
      // If we're locking adSpendPerStoreWeek, store its current value
      if (field === 'adSpendPerStoreWeek') {
        setLockedASWValue(results.adSpendPerStoreWeek);
      }
    }
    
    setLockedFields(newLockedFields);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header Section */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary-900 mb-2">
          Estimate Your Retail Campaign ROI Instantly
        </h1>
        <p className="text-primary-600 max-w-3xl mx-auto">
          Interactive tool for CPG brands & agencies to optimize campaign parameters and predict performance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section - 2/3 width on large screens */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Parameters Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Column 1: Campaign Parameters */}
              <div>
                <h2 className="text-lg font-semibold text-primary-800 mb-4">Campaign Parameters</h2>
                
                <InputField
                  label="Total Campaign Budget ($)"
                  type="number"
                  value={state.budget}
                  onChange={(value) => handleChange('budget', value)}
                  min={0}
                  step={5000}
                  icon="ri-money-dollar-circle-line"
                  canLock={!(lockedFields.has('adSpendPerStoreWeek') && lockedFields.has('stores'))}
                  locked={lockedFields.has('budget')}
                  onLock={() => handleLock('budget')}
                />
                
                <InputField
                  label="Number of Target Test Stores"
                  type="number"
                  value={state.stores}
                  onChange={(value) => handleChange('stores', value)}
                  min={1}
                  step={100}
                  icon="ri-store-2-line"
                  canLock={!(lockedFields.has('adSpendPerStoreWeek') && lockedFields.has('budget'))}
                  locked={lockedFields.has('stores')}
                  onLock={() => handleLock('stores')}
                />
                
                <InputField
                  label="Baseline Annual Sales ($)"
                  type="number"
                  value={state.heroBaseline}
                  onChange={(value) => handleChange('heroBaseline', value)}
                  min={0}
                  step={1000000}
                  icon="ri-money-dollar-circle-line"
                  canLock={false}
                />
              </div>
              
              {/* Column 2: Campaign Details */}
              <div>
                <h2 className="text-lg font-semibold text-primary-800 mb-4">Campaign Details</h2>
                
                <InputField
                  label="Number of Weeks for Campaign"
                  type="number"
                  value={state.weeks}
                  onChange={(value) => handleChange('weeks', value)}
                  min={1}
                  max={52}
                  icon="ri-calendar-line"
                  canLock={false}
                />
                
                <InputField
                  label="Expected Sales Lift % (Lower Bound)"
                  type="number"
                  value={state.userLiftMin}
                  onChange={(value) => handleChange('userLiftMin', value)}
                  min={0}
                  max={25}
                  step={0.1}
                  useSlider={true}
                  icon="ri-percent-line"
                  canLock={false}
                />
                
                <InputField
                  label="Expected Sales Lift % (Upper Bound)"
                  type="number"
                  value={state.userLiftMax}
                  onChange={(value) => handleChange('userLiftMax', value)}
                  min={state.userLiftMin}
                  max={25}
                  step={0.1}
                  useSlider={true}
                  icon="ri-percent-line"
                  canLock={false}
                />
              </div>
            </div>
          </div>
          
          {/* Derived Weekly Spend & Feedback */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-wrap justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-primary-700">Ad Spend per Store per Week:</span>
                <span className="text-lg font-semibold text-primary-900">
                  {formatCurrency(results.adSpendPerStoreWeek, true)}
                </span>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-1 ml-2">
                        <i className={`${
                          results.intensityFeedback.icon === '✅'
                            ? 'ri-checkbox-circle-fill'
                            : 'ri-error-warning-fill'
                        } ${
                          results.intensityFeedback.color === 'green'
                            ? 'text-green-600'
                            : results.intensityFeedback.color === 'orange'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        } text-lg`}></i>
                        <span className={`text-sm font-medium ${
                          results.intensityFeedback.color === 'green'
                            ? 'text-green-600'
                            : results.intensityFeedback.color === 'orange'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}>
                          ({results.intensityFeedback.label})
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-xs">{results.intensityFeedback.message}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div 
                className={`flex items-center space-x-1 ${
                  lockedFields.has('budget') && lockedFields.has('stores') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer text-primary-600 hover:text-primary-800'
                }`}
                onClick={() => {
                  if (!(lockedFields.has('budget') && lockedFields.has('stores'))) {
                    handleLock('adSpendPerStoreWeek');
                  }
                }}
              >
                <i className={lockedFields.has('adSpendPerStoreWeek') ? "ri-lock-fill" : "ri-lock-unlock-line"}></i>
                <span className="text-sm">{lockedFields.has('adSpendPerStoreWeek') ? 'Locked' : 'Lock'}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Results Card - 1/3 width on large screens */}
        <div className="lg:col-span-1">
          <ResultsCard {...results} />
        </div>
      </div>
    </div>
  );
}