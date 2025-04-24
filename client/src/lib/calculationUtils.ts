interface CalculatorState {
  budget: number;
  stores: number;
  heroBaseline: number; // Annual Baseline ($)
  weeks: number;
  userLiftMin: number; // User input lift % (Lower)
  userLiftMax: number; // User input lift % (Upper)
  lastChanged?: keyof Omit<CalculatorState, 'lastChanged'>; // Tracks last edited field for locking logic
}

interface CalculationResult {
  expectedCampaignSales: number;
  expectedCampaignSalesPerStorePerWeek: number;
  totalAdSpendPerStore: number;
  adSpendPerStoreWeek: number;
  intensityFeedback: { 
    level: 'Optimal' | 'Low' | 'High' | 'Very Low' | 'Very High'; 
    message: string 
  };
  expectedIncrementalSalesValueMin: number; // $ value
  expectedIncrementalSalesValueMax: number; // $ value
  userLiftMin: number; // % value from input state
  userLiftMax: number; // % value from input state
  calculatedROASRatio?: number; // Optional Ratio
  calculatedROIPercentage?: number; // Optional %
  stores: number; // Added for summary display
}

// Intensity thresholds constants
const GENERIC_INTENSITY_THRESHOLDS = { 
  VERY_LOW: 5, 
  LOW: 15, 
  MEDIUM: 30, 
  HIGH: 50 
};

// Helper function to get intensity feedback based on spend level
function getIntensityFeedbackLogic(weeklySpend: number) {
  if (weeklySpend < GENERIC_INTENSITY_THRESHOLDS.VERY_LOW) {
    return {
      level: 'Very Low' as const,
      message: 'Spending is very low (<$5/store/wk). This may be insufficient to generate awareness and impact. Consider increasing your budget or reducing the number of test stores.'
    };
  } else if (weeklySpend < GENERIC_INTENSITY_THRESHOLDS.LOW) {
    return {
      level: 'Low' as const,
      message: 'Spending is low ($5-$15/store/wk). This may limit your reach and frequency. Consider a modest budget increase if possible.'
    };
  } else if (weeklySpend < GENERIC_INTENSITY_THRESHOLDS.MEDIUM) {
    return {
      level: 'Optimal' as const,
      message: 'Spending is optimal ($15-$30/store/wk). This range balances visibility with efficiency for most retail campaigns.'
    };
  } else if (weeklySpend < GENERIC_INTENSITY_THRESHOLDS.HIGH) {
    return {
      level: 'High' as const,
      message: 'Spending is high ($30-$50/store/wk). While this may drive strong awareness, it could reduce efficiency. Consider testing with a slightly lower budget.'
    };
  } else {
    return {
      level: 'Very High' as const,
      message: 'Spending is very high (>$50/store/wk). Diminishing returns are likely at this level. Consider reducing your budget or expanding to more test stores.'
    };
  }
}

// Main calculation function
export function calculateResults(state: CalculatorState): CalculationResult {
  // Handle potential zero inputs safely
  const stores = state.stores || 1;
  const weeks = state.weeks || 1;
  const budget = state.budget || 0;
  const heroBaseline = state.heroBaseline || 0;
  
  // Calculate key metrics
  const combinedWeeklyBaseline = heroBaseline / 52;
  const expectedCampaignSales = combinedWeeklyBaseline * weeks;
  // Ensure this calculation is correct: heroBaseline / 52 / stores = weekly per store
  const expectedCampaignSalesPerStorePerWeek = combinedWeeklyBaseline / stores;
  const totalAdSpendPerStore = budget / stores;
  const adSpendPerStoreWeek = totalAdSpendPerStore / weeks;
  
  // Get intensity feedback
  const intensityFeedback = getIntensityFeedbackLogic(adSpendPerStoreWeek);
  
  // Calculate lift values
  const liftMinDecimal = state.userLiftMin / 100;
  const liftMaxDecimal = state.userLiftMax / 100;
  const expectedIncrementalSalesValueMin = liftMinDecimal * expectedCampaignSales;
  const expectedIncrementalSalesValueMax = liftMaxDecimal * expectedCampaignSales;
  
  // Calculate ROI and ROAS
  const calculatedROASRatio = budget > 0 ? expectedIncrementalSalesValueMax / budget : Infinity;
  const calculatedROIPercentage = budget > 0 ? ((expectedIncrementalSalesValueMax - budget) / budget) * 100 : Infinity;
  
  return {
    expectedCampaignSales,
    expectedCampaignSalesPerStorePerWeek,
    totalAdSpendPerStore,
    adSpendPerStoreWeek,
    intensityFeedback,
    expectedIncrementalSalesValueMin,
    expectedIncrementalSalesValueMax,
    userLiftMin: state.userLiftMin,
    userLiftMax: state.userLiftMax,
    calculatedROASRatio,
    calculatedROIPercentage,
    stores // Include stores in the result
  };
}
