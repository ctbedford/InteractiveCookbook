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
const REASONABLE_MAX_LIFT = 15.0; // %

interface CalculationResult {
  expectedCampaignSales: number;
  expectedCampaignSalesPerStorePerWeek: number;
  totalAdSpendPerStore: number;
  adSpendPerStoreWeek: number;
  intensityFeedback: {
    label: string; // e.g., "(Achievable Target / Profitable)"
    icon: '✅' | '⚠️'; // Use actual icon characters or identifiers
    color: 'green' | 'orange' | 'red'; // Conceptual color categories
    message: string; // Detailed tooltip message
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

// Helper function to get intensity feedback based on target realism and profitability
function getIntensityFeedbackLogic(ASW: number, BSW: number, userLiftMin: number, userLiftMax: number): CalculationResult['intensityFeedback'] {
  // Calculate break-even lift percentage
  const breakEvenLiftPercent = (BSW > 0) ? (ASW / BSW) * 100 : Infinity;
  
  // Determine target realism
  const targetRealism: 'Realistic' | 'Ambitious' = userLiftMax <= REASONABLE_MAX_LIFT ? 'Realistic' : 'Ambitious';
  
  // Determine profitability
  const isProfitable = userLiftMin >= breakEvenLiftPercent;
  const potentiallyProfitable = !isProfitable && userLiftMax >= breakEvenLiftPercent;
  
  // Format user lift range for display
  const liftRangeDisplay = `${userLiftMin.toFixed(1)}%-${userLiftMax.toFixed(1)}%`;
  const breakEvenDisplay = !isFinite(breakEvenLiftPercent) ? 'N/A' : `${breakEvenLiftPercent.toFixed(1)}%`;
  
  // Construct the feedback based on the scenarios
  let label: string;
  let icon: '✅' | '⚠️';
  let color: 'green' | 'orange' | 'red';
  let message: string;
  
  // Implement the 6 scenarios based on realism and profitability
  if (targetRealism === 'Realistic' && isProfitable) {
    // Realistic & Profitable - Very positive
    label = 'Achievable Target / Profitable';
    icon = '✅';
    color = 'green';
    message = `Target lift (${liftRangeDisplay}) is achievable (<=15%) and projected to be profitable (break-even >${breakEvenDisplay}).`;
  } 
  else if (targetRealism === 'Realistic' && potentiallyProfitable) {
    // Realistic & Potentially Profitable - Cautious
    label = 'Achievable Target / Profitability Risk';
    icon = '⚠️';
    color = 'orange';
    message = `Target lift (${liftRangeDisplay}) is achievable (<=15%) but only the upper end is profitable (break-even >${breakEvenDisplay}).`;
  } 
  else if (targetRealism === 'Realistic' && !isProfitable && !potentiallyProfitable) {
    // Realistic & Unprofitable - Warning
    label = 'Achievable Target / Unprofitable';
    icon = '⚠️';
    color = 'red';
    message = `Target lift (${liftRangeDisplay}) is achievable (<=15%) but below the level needed to break even (>${breakEvenDisplay}).`;
  } 
  else if (targetRealism === 'Ambitious' && isProfitable) {
    // Ambitious & Profitable - Cautious
    label = 'Ambitious Target / Profitable';
    icon = '⚠️';
    color = 'orange';
    message = `Target lift (${liftRangeDisplay}) exceeds typical ranges (>15%), making it ambitious, but it is projected to be profitable if achieved (break-even >${breakEvenDisplay}).`;
  } 
  else if (targetRealism === 'Ambitious' && potentiallyProfitable) {
    // Ambitious & Potentially Profitable - Warning
    label = 'Ambitious Target / Profitability Risk';
    icon = '⚠️';
    color = 'red';
    message = `Target lift (${liftRangeDisplay}) exceeds typical ranges (>15%) and only the upper end is profitable (break-even >${breakEvenDisplay}). High risk scenario.`;
  } 
  else {
    // Ambitious & Unprofitable - Severe Warning
    label = 'Ambitious Target / Unprofitable';
    icon = '⚠️';
    color = 'red';
    message = `Target lift (${liftRangeDisplay}) exceeds typical ranges (>15%) AND is below the level needed to break even (>${breakEvenDisplay} lift). Very unlikely to be profitable.`;
  }
  
  return {
    label,
    icon,
    color,
    message
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