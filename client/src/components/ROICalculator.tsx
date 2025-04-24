import { useState, useEffect } from "react";
import InputField from "./InputField";
import ResultsCard from "./ResultsCard";
import { calculateResults } from "@/lib/calculationUtils";
import { formatCurrency } from "@/lib/formatUtils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CalculatorState {
  budget: number;
  stores: number;
  heroBaseline: number; // Annual Baseline ($)
  weeks: number;
  userLiftMin: number; // User input lift % (Lower)
  userLiftMax: number; // User input lift % (Upper)
  lastChanged?: 'budget' | 'stores' | 'heroBaseline' | 'weeks' | 'userLiftMin' | 'userLiftMax'; // Tracks last edited field for locking logic
}

export default function ROICalculator() {
  // State for user inputs and change tracking
  const [state, setState] = useState<CalculatorState>({
    budget: 50000,
    stores: 100,
    heroBaseline: 1000000,
    weeks: 8,
    userLiftMin: 3.5,
    userLiftMax: 7.0,
  });

  // State for locked fields
  const [lockedFields, setLockedFields] = useState<Set<'budget' | 'stores' | 'adSpendPerStoreWeek'>>(
    new Set(['budget', 'stores'] as Array<'budget' | 'stores'>)
  );

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
    
    const lockedASW = results.adSpendPerStoreWeek;
    
    // Scenario 3: Only Ad Spend per Store per Week (ASW) is Locked
    if (lockedFields.has('adSpendPerStoreWeek') && !lockedFields.has('budget') && !lockedFields.has('stores')) {
      if (state.lastChanged === 'budget') {
        // User changes Budget (B) -> Stores (S) automatically recalculates
        const newStores = Math.max(1, Math.round(state.budget / (lockedASW * state.weeks)));
        
        if (newStores !== state.stores) {
          // Update stores without triggering the lastChanged tracking
          setState(prev => ({
            ...prev,
            stores: newStores,
          }));
        }
      } else if (state.lastChanged === 'stores') {
        // User changes Stores (S) -> Budget (B) automatically recalculates
        const newBudget = Math.max(0, Number((lockedASW * state.stores * state.weeks).toFixed(2)));
        
        if (newBudget !== state.budget) {
          setState(prev => ({
            ...prev,
            budget: newBudget,
          }));
        }
      } else if (state.lastChanged === 'weeks') {
        // User changes Weeks (W) -> Stores (S) automatically recalculates
        const newStores = Math.max(1, Math.round(state.budget / (lockedASW * state.weeks)));
        
        if (newStores !== state.stores) {
          setState(prev => ({
            ...prev,
            stores: newStores,
          }));
        }
      }
    }
    
    // Scenario 5: Budget (B) AND Ad Spend per Store per Week (ASW) are Locked
    else if (lockedFields.has('adSpendPerStoreWeek') && lockedFields.has('budget') && !lockedFields.has('stores')) {
      if (state.lastChanged === 'weeks') {
        // User changes Weeks (W) -> Stores (S) automatically recalculates
        const newStores = Math.max(1, Math.round(state.budget / (lockedASW * state.weeks)));
        
        if (newStores !== state.stores) {
          setState(prev => ({
            ...prev,
            stores: newStores,
          }));
        }
      }
    }
    
    // Scenario 6: Stores (S) AND Ad Spend per Store per Week (ASW) are Locked
    else if (lockedFields.has('adSpendPerStoreWeek') && !lockedFields.has('budget') && lockedFields.has('stores')) {
      if (state.lastChanged === 'weeks') {
        // User changes Weeks (W) -> Budget (B) automatically recalculates
        const newBudget = Math.max(0, Number((lockedASW * state.stores * state.weeks).toFixed(2)));
        
        if (newBudget !== state.budget) {
          setState(prev => ({
            ...prev,
            budget: newBudget,
          }));
        }
      }
    }
    
    // Other scenarios (1, 2, 4) don't require auto-adjustments of B, S, or W
    // They just need the ASW to be recalculated, which happens automatically
    
  }, [state.budget, state.stores, state.weeks, lockedFields, state.lastChanged, results.adSpendPerStoreWeek]);

  const handleChange = (field: keyof CalculatorState, value: number) => {
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
      return {
        ...prev,
        [field]: validatedValue,
        lastChanged: field as 'budget' | 'stores' | 'heroBaseline' | 'weeks' | 'userLiftMin' | 'userLiftMax'
      };
    });
  };

  const handleLock = (field: 'budget' | 'stores' | 'adSpendPerStoreWeek') => {
    // Create a new Set with the correct type
    const fieldArray: Array<'budget' | 'stores' | 'adSpendPerStoreWeek'> = [];
    lockedFields.forEach(item => {
      fieldArray.push(item as 'budget' | 'stores' | 'adSpendPerStoreWeek');
    });
    
    const newLockedFields = new Set<'budget' | 'stores' | 'adSpendPerStoreWeek'>(fieldArray);
    
    if (newLockedFields.has(field)) {
      // Unlock the field
      newLockedFields.delete(field);
    } else {
      // Don't allow locking all three parameters
      if (field === 'adSpendPerStoreWeek' && 
          lockedFields.has('budget') && 
          lockedFields.has('stores')) {
        return; // Cannot lock all three
      }
      
      // Lock the field
      newLockedFields.add(field);
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
          
          {/* Derived Weekly Spend & Intensity Feedback */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-wrap justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-primary-700">Ad Spend per Store per Week:</span>
                <span className="text-lg font-semibold text-primary-900">
                  {formatCurrency(results.adSpendPerStoreWeek)}
                </span>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-1 ml-2">
                        <i 
                          className={`${
                            results.intensityFeedback.level === 'Optimal'
                              ? 'ri-checkbox-circle-fill text-success-600'
                              : 'ri-error-warning-fill ' + 
                                (results.intensityFeedback.level.includes('Low') 
                                  ? 'text-warning-600' 
                                  : results.intensityFeedback.level.includes('High') 
                                  ? 'text-warning-600'
                                  : 'text-danger-600')
                          } text-lg`}
                        ></i>
                        <span 
                          className={`text-sm font-medium ${
                            results.intensityFeedback.level === 'Optimal'
                              ? 'text-success-600'
                              : results.intensityFeedback.level.includes('Low')
                              ? 'text-warning-600'
                              : results.intensityFeedback.level.includes('High')
                              ? 'text-warning-600'
                              : 'text-danger-600'
                          }`}
                        >
                          ({results.intensityFeedback.level})
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
