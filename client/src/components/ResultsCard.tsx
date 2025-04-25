import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatPercentage, formatROI, formatROAS } from "@/lib/formatUtils";
import { Card } from "@/components/ui/card";

interface ResultsCardProps {
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
  expectedIncrementalSalesValueMin: number;
  expectedIncrementalSalesValueMax: number;
  userLiftMin: number;
  userLiftMax: number;
  calculatedROASRatio?: number;
  calculatedROIPercentage?: number;
  stores: number;
  weeks: number;
  budget: number;
  breakEvenLiftPercent: number;
  baselineSalesPerStorePerWeek: number;
}

export default function ResultsCard(props: ResultsCardProps) {
  const [activeTab, setActiveTab] = useState('totals');
  
  // Get the appropriate CSS class for the intensity feedback color
  const getColorClass = (color: 'green' | 'orange' | 'red') => {
    switch (color) {
      case 'green': return 'text-green-600';
      case 'orange': return 'text-yellow-600';
      case 'red': return 'text-red-600';
      default: return 'text-primary-600';
    }
  };
  
  const intensityColorClass = getColorClass(props.intensityFeedback.color);
  
  // Format break-even for display
  const breakEvenDisplay = !isFinite(props.breakEvenLiftPercent) ? 'N/A' : `${props.breakEvenLiftPercent.toFixed(1)}%`;
  const liftRangeDisplay = `${props.userLiftMin.toFixed(1)}%-${props.userLiftMax.toFixed(1)}%`;

  // Determine profitability conclusion based on lift range vs break-even
  let profitabilityConclusion = "";
  let profitabilityColorClass = "text-primary-700"; // Default color
  let profitabilityEmoji = "";
  
  if (props.breakEvenLiftPercent === Infinity || props.baselineSalesPerStorePerWeek <= 0) {
    profitabilityConclusion = "Profitability cannot be assessed due to zero baseline sales.";
    profitabilityColorClass = "text-gray-600";
  } else if (props.userLiftMin >= props.breakEvenLiftPercent) {
    profitabilityConclusion = `Your target range (${liftRangeDisplay}) is above the break-even lift requirement (${breakEvenDisplay}) and appears profitable.`;
    profitabilityColorClass = "text-green-600";
    profitabilityEmoji = " ✓";
  } else if (props.userLiftMax >= props.breakEvenLiftPercent) {
    profitabilityConclusion = `Your target range (${liftRangeDisplay}) crosses the break-even lift requirement (${breakEvenDisplay}) and may be profitable if the upper lift is achieved.`;
    profitabilityColorClass = "text-yellow-600";
    profitabilityEmoji = " ⚠️";
  } else {
    profitabilityConclusion = `Your target range (${liftRangeDisplay}), while achievable, is below the break-even lift requirement (${breakEvenDisplay}) and is unlikely to cover ad spend.`;
    profitabilityColorClass = "text-red-600";
    profitabilityEmoji = " ❌";
  }

  // Determine incremental sales range emoji
  const salesRangeEmoji = props.expectedIncrementalSalesValueMin > 0 ? " 📈" : " 📉";

  return (
    <Card className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Tabs */}
      <Tabs defaultValue="totals" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="totals" className="text-sm">Totals</TabsTrigger>
          <TabsTrigger value="weekly" className="text-sm">Weekly Averages</TabsTrigger>
        </TabsList>
        
        <TabsContent value="totals" className="p-5 space-y-4">
          {/* Expected Campaign Sales */}
          <div>
            <span className="block text-sm text-primary-500">Expected Campaign Sales</span>
            <span className="block text-2xl font-bold text-primary-900">
              {formatCurrency(props.expectedCampaignSales, false)}
            </span>
          </div>
          
          {/* Expected Incremental Sales Range */}
          <div>
            <span className="block text-sm text-primary-500">Expected Incremental Sales Range {salesRangeEmoji}</span>
            <span className="block text-2xl font-bold text-primary-900">
              {formatCurrency(props.expectedIncrementalSalesValueMin, false)} - {formatCurrency(props.expectedIncrementalSalesValueMax, false)}
            </span>
            <span className="block text-xs text-primary-500">
              Based on +{props.userLiftMin.toFixed(1)}% to +{props.userLiftMax.toFixed(1)}% lift
            </span>
          </div>
          
          {/* Expected Campaign Sales Per Store Per Week */}
          <div>
            <span className="block text-sm text-primary-500">Expected Campaign Sales Per Store Per Week</span>
            <span className="block text-2xl font-bold text-primary-900">
              {formatCurrency(props.expectedCampaignSalesPerStorePerWeek, true)}
            </span>
          </div>
          
          {/* Total Ad Spend Per Store */}
          <div>
            <span className="block text-sm text-primary-500">Total Ad Spend Per Store</span>
            <span className="block text-2xl font-bold text-primary-900">
              {formatCurrency(props.totalAdSpendPerStore, true)}
            </span>
          </div>
          
          {/* Dynamic Summary Text */}
          <div className="pt-2 border-t border-primary-200">
            <p className="text-sm text-primary-700 leading-relaxed">
              With a <span className="font-medium">{formatCurrency(props.budget)}</span> budget 
              across <span className="font-medium">{props.stores}</span> stores
              for <span className="font-medium">{props.weeks}</span> weeks, 
              your ad spend is <span className="font-medium">{formatCurrency(props.adSpendPerStoreWeek)}</span> per store per week.
            </p>
            <p className={`text-sm ${profitabilityColorClass} leading-relaxed font-medium mt-2`}>
              {profitabilityConclusion}{profitabilityEmoji}
            </p>
          </div>
          
          {/* Performance Metrics */}
          <div className="pt-2 border-t border-primary-200 space-y-2">
            <h3 className="text-sm font-semibold text-primary-700">Additional Performance Metrics</h3>
            
            <div className="flex justify-between">
              <span className="text-sm text-primary-600">Estimated ROI:</span>
              <span className={`text-sm font-medium ${props.calculatedROIPercentage && props.calculatedROIPercentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatROI(props.calculatedROIPercentage)} {props.calculatedROIPercentage && props.calculatedROIPercentage > 0 ? '↑' : '↓'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-primary-600">Estimated ROAS:</span>
              <span className={`text-sm font-medium ${props.calculatedROASRatio && props.calculatedROASRatio >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                {formatROAS(props.calculatedROASRatio)} {props.calculatedROASRatio && props.calculatedROASRatio >= 1 ? '✓' : '⚠️'}
              </span>
            </div>
            
            <p className="text-xs text-primary-500">
              Based on your maximum lift input of +{props.userLiftMax.toFixed(1)}%
            </p>
          </div>
          
          {/* Notes Section */}
          <div className="pt-2 border-t border-primary-200">
            <p className="text-xs text-primary-500">
              Actual results may vary based on execution, market conditions, and other factors. ROI calculated as (Incremental Sales - Campaign Budget) / Campaign Budget.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="weekly" className="p-5 space-y-4">
          {/* Weekly content */}
          {/* Expected Weekly Campaign Sales */}
          <div>
            <span className="block text-sm text-primary-500">Expected Weekly Campaign Sales</span>
            <span className="block text-2xl font-bold text-primary-900">
              {formatCurrency(props.expectedCampaignSales / props.weeks, false)}
            </span>
          </div>
          
          {/* Expected Weekly Incremental Sales Range */}
          <div>
            <span className="block text-sm text-primary-500">Expected Weekly Incremental Sales Range {salesRangeEmoji}</span>
            <span className="block text-2xl font-bold text-primary-900">
              {formatCurrency(props.expectedIncrementalSalesValueMin / props.weeks, false)} - 
              {formatCurrency(props.expectedIncrementalSalesValueMax / props.weeks, false)}
            </span>
            <span className="block text-xs text-primary-500">
              Based on +{props.userLiftMin.toFixed(1)}% to +{props.userLiftMax.toFixed(1)}% lift
            </span>
          </div>
          
          {/* Expected Campaign Sales Per Store */}
          <div>
            <span className="block text-sm text-primary-500">Expected Sales Per Store Per Week</span>
            <span className="block text-2xl font-bold text-primary-900">
              {formatCurrency(props.expectedCampaignSalesPerStorePerWeek, true)}
            </span>
          </div>
          
          {/* Weekly Ad Spend Per Store */}
          <div>
            <span className="block text-sm text-primary-500">Weekly Ad Spend Per Store</span>
            <span className="block text-2xl font-bold text-primary-900">
              {formatCurrency(props.adSpendPerStoreWeek, true)}
            </span>
          </div>
          
          {/* Dynamic Summary Text */}
          <div className="pt-2 border-t border-primary-200">
            <p className="text-sm text-primary-700 leading-relaxed">
              With a <span className="font-medium">{formatCurrency(props.budget)}</span> budget 
              across <span className="font-medium">{props.stores}</span> stores
              for <span className="font-medium">{props.weeks}</span> weeks, 
              your ad spend is <span className="font-medium">{formatCurrency(props.adSpendPerStoreWeek)}</span> per store per week.
            </p>
            <p className={`text-sm ${profitabilityColorClass} leading-relaxed font-medium mt-2`}>
              {profitabilityConclusion}{profitabilityEmoji}
            </p>
          </div>
          
          {/* Performance Metrics */}
          <div className="pt-2 border-t border-primary-200 space-y-2">
            <h3 className="text-sm font-semibold text-primary-700">Additional Performance Metrics</h3>
            
            <div className="flex justify-between">
              <span className="text-sm text-primary-600">Estimated ROI:</span>
              <span className={`text-sm font-medium ${props.calculatedROIPercentage && props.calculatedROIPercentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatROI(props.calculatedROIPercentage)} {props.calculatedROIPercentage && props.calculatedROIPercentage > 0 ? '↑' : '↓'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-primary-600">Estimated ROAS:</span>
              <span className={`text-sm font-medium ${props.calculatedROASRatio && props.calculatedROASRatio >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                {formatROAS(props.calculatedROASRatio)} {props.calculatedROASRatio && props.calculatedROASRatio >= 1 ? '✓' : '⚠️'}
              </span>
            </div>
            
            <p className="text-xs text-primary-500">
              Based on your maximum lift input of +{props.userLiftMax.toFixed(1)}%
            </p>
          </div>
          
          {/* Notes Section */}
          <div className="pt-2 border-t border-primary-200">
            <p className="text-xs text-primary-500">
              Actual results may vary based on execution, market conditions, and other factors. ROI calculated as (Incremental Sales - Campaign Budget) / Campaign Budget.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}