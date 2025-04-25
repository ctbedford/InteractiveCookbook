interface CalculatorState {
  budget: number;
  stores: number;
  heroBaseline: number; // Annual Baseline ($)
  weeks: number;
  userLiftMin: number; // User input lift % (Lower)
  userLiftMax: number; // User input lift % (Upper)
  lastChanged?: keyof Omit<CalculatorState, 'lastChanged'>; // Tracks last edited field for locking logic
}

// Constants
const GENERIC_INTENSITY_THRESHOLDS = { VERY_LOW: 5, LOW: 15, MEDIUM: 30, HIGH: 50 };
const REASONABLE_MAX_LIFT = 15.0; // %

interface CalculationResult {
  expectedCampaignSales: number;
  expectedCampaignSalesPerStorePerWeek: number;
  totalAdSpendPerStore: number;
  adSpendPerStoreWeek: number;
  intensityFeedback: {
    label: string; // e.g., "(Optimal Spend / Realistic Target)"
    icon: '✅' | '⚠️'; // Use actual icon characters or identifiers
    color: 'green' | 'orange' | 'red'; // Conceptual color categories
    message: string; // Detailed tooltip message from logic below
    level: 'Optimal' | 'Low' | 'High' | 'Very Low' | 'Very High'; // Underlying intensity level
  };
  expectedIncrementalSalesValueMin: number; // $ value based on userLiftMin
  expectedIncrementalSalesValueMax: number; // $ value based on userLiftMax
  userLiftMin: number; // Pass through user input %
  userLiftMax: number; // Pass through user input %
  calculatedROASRatio?: number; // Optional Ratio
  calculatedROIPercentage?: number; // Optional %
  // Pass through state values needed for display
  stores: number;
  weeks: number;
  budget: number;
  breakEvenLiftPercent: number; // Break-even lift percentage
  baselineSalesPerStorePerWeek: number; // For profitability assessment
}

// Helper function to get intensity feedback based on spend level
function getIntensityFeedbackLogic(ASW: number, BSW: number, userLiftMin: number, userLiftMax: number): CalculationResult['intensityFeedback'] {
  // Calculate break-even lift percentage
  const breakEvenLiftPercent = (BSW > 0) ? (ASW / BSW) * 100 : Infinity;
  
  // Determine spend level category
  let spendLevelCategory: 'Low' | 'Optimal' | 'High';
  if (ASW < GENERIC_INTENSITY_THRESHOLDS.LOW) {
    spendLevelCategory = 'Low';
  } else if (ASW < GENERIC_INTENSITY_THRESHOLDS.MEDIUM) {
    spendLevelCategory = 'Optimal';
  } else {
    spendLevelCategory = 'High';
  }
  
  // Determine target realism - consider both user lift and break-even requirement
  const targetRealism: 'Realistic' | 'Ambitious' = 
    (userLiftMax <= REASONABLE_MAX_LIFT && breakEvenLiftPercent <= REASONABLE_MAX_LIFT) 
    ? 'Realistic' 
    : 'Ambitious';
  
  // Determine detailed intensity level
  let detailedIntensityLevel: 'Optimal' | 'Low' | 'High' | 'Very Low' | 'Very High';
  if (ASW < GENERIC_INTENSITY_THRESHOLDS.VERY_LOW) {
    detailedIntensityLevel = 'Very Low';
  } else if (ASW < GENERIC_INTENSITY_THRESHOLDS.LOW) {
    detailedIntensityLevel = 'Low';
  } else if (ASW < GENERIC_INTENSITY_THRESHOLDS.MEDIUM) {
    detailedIntensityLevel = 'Optimal';
  } else if (ASW < GENERIC_INTENSITY_THRESHOLDS.HIGH) {
    detailedIntensityLevel = 'High';
  } else {
    detailedIntensityLevel = 'Very High';
  }
  
  // Format user lift range for display
  const liftRangeDisplay = `${userLiftMin.toFixed(1)}%-${userLiftMax.toFixed(1)}%`;
  
  // Construct the feedback based on the scenarios
  let label: string;
  let icon: '✅' | '⚠️';
  let color: 'green' | 'orange' | 'red';
  let message: string;
  
  // Implement the 6 scenarios based on spend and target combinations
  if (spendLevelCategory === 'Optimal' && targetRealism === 'Realistic') {
    // Optimal/Realistic - Very positive
    label = 'Optimal Spend / Realistic Target';
    icon = '✅';
    color = 'green';
  } else if (spendLevelCategory === 'Low' && targetRealism === 'Realistic') {
    // Low/Realistic - Cautious
    label = 'Low Spend / Realistic Target';
    icon = '⚠️';
    color = 'orange';
  } else if (spendLevelCategory === 'High' && targetRealism === 'Realistic') {
    // High/Realistic - Cautious
    label = 'High Spend / Realistic Target';
    icon = '⚠️';
    color = 'orange';
  } else if (spendLevelCategory === 'Optimal' && targetRealism === 'Ambitious') {
    // Optimal/Ambitious - Cautious
    label = 'Optimal Spend / Ambitious Target';
    icon = '⚠️';
    color = 'orange';
  } else if (spendLevelCategory === 'Low' && targetRealism === 'Ambitious') {
    // Low/Ambitious - Warning
    label = 'Low Spend / Ambitious Target';
    icon = '⚠️';
    color = 'red';
  } else {
    // High/Ambitious - Warning
    label = 'High Spend / Ambitious Target';
    icon = '⚠️';
    color = 'red';
  }
  
  // Construct the detailed message based on intensity level
  if (detailedIntensityLevel === 'Very Low') {
    message = `Spending is very low (<$${GENERIC_INTENSITY_THRESHOLDS.VERY_LOW}/store/wk). Break-even requires >${breakEvenLiftPercent.toFixed(1)}% lift. Significant impact is unlikely at this level; consider increasing budget or reducing scope.`;
  } else if (detailedIntensityLevel === 'Low') {
    message = `Spending is low ($${GENERIC_INTENSITY_THRESHOLDS.VERY_LOW}-$${GENERIC_INTENSITY_THRESHOLDS.LOW}/store/wk). Break-even requires >${breakEvenLiftPercent.toFixed(1)}% lift. Achieving target lift (${liftRangeDisplay}) may be challenging; consider a budget increase if lift target is high.`;
  } else if (detailedIntensityLevel === 'Optimal') {
    message = `Spending ($${GENERIC_INTENSITY_THRESHOLDS.LOW}-$${GENERIC_INTENSITY_THRESHOLDS.MEDIUM}/store/wk) is optimal. Break-even requires >${breakEvenLiftPercent.toFixed(1)}% lift. Your target range (${liftRangeDisplay}) appears achievable ${userLiftMax > REASONABLE_MAX_LIFT ? 'though the upper target is ambitious (>15%)' : ''} and potentially profitable.`;
  } else if (detailedIntensityLevel === 'High') {
    message = `Spending is high ($${GENERIC_INTENSITY_THRESHOLDS.MEDIUM}-$${GENERIC_INTENSITY_THRESHOLDS.HIGH}/store/wk). Break-even requires >${breakEvenLiftPercent.toFixed(1)}% lift${breakEvenLiftPercent > REASONABLE_MAX_LIFT ? ', which may be challenging to achieve (>15%)' : ''}. Ensure tactics support this spend level and monitor for diminishing returns. Your target range (${liftRangeDisplay}), while achievable, is below the break-even lift requirement (${breakEvenLiftPercent.toFixed(1)}%) and is unlikely to cover ad spend.`;
  } else {
    message = `Spending is very high (>$${GENERIC_INTENSITY_THRESHOLDS.HIGH}/store/wk). Break-even requires >${breakEvenLiftPercent.toFixed(1)}% lift, which is likely unachievable (>15%). Diminishing returns are very likely. Strongly consider optimizing budget/stores/weeks. Your target range (${liftRangeDisplay}), while achievable, is below the break-even lift requirement (${breakEvenLiftPercent.toFixed(1)}%) and is unlikely to cover ad spend.`;
  }
  
  return {
    label,
    icon,
    color,
    message,
    level: detailedIntensityLevel
  };
}

// Main calculation function
export function calculateResults(state: CalculatorState): CalculationResult {
  // Handle potential zero inputs safely
  const stores = state.stores || 1;
  const weeks = state.weeks || 1;
  const budget = state.budget || 0;
  const heroBaseline = state.heroBaseline || 0;
  
  // Calculate key metrics
  const baselineSalesPerStorePerWeek = (heroBaseline / 52) / (stores || 1);
  const combinedWeeklyBaseline = heroBaseline / 52;
  const expectedCampaignSales = combinedWeeklyBaseline * weeks;
  const expectedCampaignSalesPerStorePerWeek = baselineSalesPerStorePerWeek;
  const totalAdSpendPerStore = budget / stores;
  const adSpendPerStoreWeek = totalAdSpendPerStore / weeks;
  
  // Get intensity feedback
  const intensityFeedback = getIntensityFeedbackLogic(
    adSpendPerStoreWeek, 
    baselineSalesPerStorePerWeek, 
    state.userLiftMin, 
    state.userLiftMax
  );
  
  // Calculate lift values
  const liftMinDecimal = state.userLiftMin / 100;
  const liftMaxDecimal = state.userLiftMax / 100;
  const expectedIncrementalSalesValueMin = liftMinDecimal * expectedCampaignSales;
  const expectedIncrementalSalesValueMax = liftMaxDecimal * expectedCampaignSales;
  
  // Calculate ROI and ROAS
  const calculatedROASRatio = budget > 0 ? expectedIncrementalSalesValueMax / budget : Infinity;
  const calculatedROIPercentage = budget > 0 ? ((expectedIncrementalSalesValueMax - budget) / budget) * 100 : Infinity;
  
  // Calculate the break-even lift percentage
  const breakEvenLiftPercent = (baselineSalesPerStorePerWeek > 0) 
    ? (adSpendPerStoreWeek / baselineSalesPerStorePerWeek) * 100 
    : Infinity;
    
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
    stores,
    weeks,
    budget,
    breakEvenLiftPercent,
    baselineSalesPerStorePerWeek
  };
}
