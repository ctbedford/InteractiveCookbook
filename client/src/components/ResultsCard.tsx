import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatPercentage } from "@/lib/formatUtils";
import { Card } from "@/components/ui/card";

interface ResultsCardProps {
  expectedCampaignSales: number;
  expectedCampaignSalesPerStorePerWeek: number;
  totalAdSpendPerStore: number;
  adSpendPerStoreWeek: number;
  intensityFeedback: { 
    level: 'Optimal' | 'Low' | 'High' | 'Very Low' | 'Very High'; 
    message: string 
  };
  expectedIncrementalSalesValueMin: number;
  expectedIncrementalSalesValueMax: number;
  userLiftMin: number;
  userLiftMax: number;
  calculatedROASRatio?: number;
  calculatedROIPercentage?: number;
  stores: number; // Added stores for correct summary display
}

export default function ResultsCard(props: ResultsCardProps) {
  const [activeTab, setActiveTab] = useState('totals');
  
  const formatROAS = (value?: number) => {
    if (value === undefined || !isFinite(value)) return "N/A";
    return `${value.toFixed(2)}:1`;
  };
  
  const formatROI = (value?: number) => {
    if (value === undefined || !isFinite(value)) return "N/A";
    return `${value.toFixed(1)}%`;
  };

  const intensityClass = props.intensityFeedback.level === 'Optimal' 
    ? 'text-success-600' 
    : 'text-warning-600';

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
              {formatCurrency(props.expectedCampaignSales)}
            </span>
          </div>
          
          {/* Expected Incremental Sales Range */}
          <div>
            <span className="block text-sm text-primary-500">Expected Incremental Sales Range</span>
            <span className="block text-2xl font-bold text-primary-900">
              {formatCurrency(props.expectedIncrementalSalesValueMin)} - {formatCurrency(props.expectedIncrementalSalesValueMax)}
            </span>
            <span className="block text-xs text-primary-500">
              Based on +{props.userLiftMin.toFixed(1)}% to +{props.userLiftMax.toFixed(1)}% lift
            </span>
          </div>
          
          {/* Expected Campaign Sales Per Store Per Week */}
          <div>
            <span className="block text-sm text-primary-500">Expected Campaign Sales Per Store Per Week</span>
            <span className="block text-2xl font-bold text-primary-900">
              {formatCurrency(props.expectedCampaignSalesPerStorePerWeek)}
            </span>
          </div>
          
          {/* Total Ad Spend Per Store */}
          <div>
            <span className="block text-sm text-primary-500">Total Ad Spend Per Store</span>
            <span className="block text-2xl font-bold text-primary-900">
              {formatCurrency(props.totalAdSpendPerStore)}
            </span>
          </div>
          
          {/* Dynamic Summary Text */}
          <div className="pt-2 border-t border-primary-200">
            <p className="text-sm text-primary-700 leading-relaxed">
              With a <span className="font-medium">{formatCurrency(props.totalAdSpendPerStore * props.stores)}</span> budget 
              across <span className="font-medium">{props.stores}</span> stores
              for <span className="font-medium">{Math.round(props.totalAdSpendPerStore / props.adSpendPerStoreWeek)}</span> weeks, 
              your ad spend of <span className="font-medium">{formatCurrency(props.adSpendPerStoreWeek)}</span> per store per week
              is in the <span className={`font-medium ${intensityClass}`}>{props.intensityFeedback.level.toLowerCase()}</span> range. 
              {props.intensityFeedback.message}
            </p>
          </div>
          
          {/* Performance Metrics */}
          <div className="pt-2 border-t border-primary-200 space-y-2">
            <h3 className="text-sm font-semibold text-primary-700">Additional Performance Metrics</h3>
            
            <div className="flex justify-between">
              <span className="text-sm text-primary-600">Estimated ROI:</span>
              <span className="text-sm font-medium text-primary-900">
                {formatROI(props.calculatedROIPercentage)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-primary-600">Estimated ROAS:</span>
              <span className="text-sm font-medium text-primary-900">
                {formatROAS(props.calculatedROASRatio)}
              </span>
            </div>
            
            <p className="text-xs text-primary-500">
              Based on your maximum lift input of +{props.userLiftMax.toFixed(1)}%
            </p>
          </div>
          
          {/* Notes Section */}
          <div className="pt-2 border-t border-primary-200">
            <p className="text-xs text-primary-500 mb-1">
              Actual results may vary based on execution, market conditions, and other factors.
            </p>
            <p className="text-xs text-primary-500">
              ROI calculated as (Incremental Sales - Campaign Budget) / Campaign Budget.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="weekly" className="p-5 space-y-4">
          {/* Weekly content would be similar but with weekly averages */}
          {/* Expected Weekly Campaign Sales */}
          <div>
            <span className="block text-sm text-primary-500">Expected Weekly Campaign Sales</span>
            <span className="block text-2xl font-bold text-primary-900">
              {formatCurrency(props.expectedCampaignSales / (props.totalAdSpendPerStore / props.adSpendPerStoreWeek))}
            </span>
          </div>
          
          {/* Expected Weekly Incremental Sales Range */}
          <div>
            <span className="block text-sm text-primary-500">Expected Weekly Incremental Sales Range</span>
            <span className="block text-2xl font-bold text-primary-900">
              {formatCurrency(props.expectedIncrementalSalesValueMin / (props.totalAdSpendPerStore / props.adSpendPerStoreWeek))} - 
              {formatCurrency(props.expectedIncrementalSalesValueMax / (props.totalAdSpendPerStore / props.adSpendPerStoreWeek))}
            </span>
            <span className="block text-xs text-primary-500">
              Based on +{props.userLiftMin.toFixed(1)}% to +{props.userLiftMax.toFixed(1)}% lift
            </span>
          </div>
          
          {/* Expected Campaign Sales Per Store */}
          <div>
            <span className="block text-sm text-primary-500">Expected Sales Per Store Per Week</span>
            <span className="block text-2xl font-bold text-primary-900">
              {formatCurrency(props.expectedCampaignSalesPerStorePerWeek)}
            </span>
          </div>
          
          {/* Weekly Ad Spend Per Store */}
          <div>
            <span className="block text-sm text-primary-500">Weekly Ad Spend Per Store</span>
            <span className="block text-2xl font-bold text-primary-900">
              {formatCurrency(props.adSpendPerStoreWeek)}
            </span>
          </div>
          
          {/* Performance Metrics */}
          <div className="pt-2 border-t border-primary-200 space-y-2">
            <h3 className="text-sm font-semibold text-primary-700">Additional Performance Metrics</h3>
            
            <div className="flex justify-between">
              <span className="text-sm text-primary-600">Estimated ROI:</span>
              <span className="text-sm font-medium text-primary-900">
                {formatROI(props.calculatedROIPercentage)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-primary-600">Estimated ROAS:</span>
              <span className="text-sm font-medium text-primary-900">
                {formatROAS(props.calculatedROASRatio)}
              </span>
            </div>
          </div>
          
          {/* Notes Section */}
          <div className="pt-2 border-t border-primary-200">
            <p className="text-xs text-primary-500 mb-1">
              Actual results may vary based on execution, market conditions, and other factors.
            </p>
            <p className="text-xs text-primary-500">
              ROI calculated as (Incremental Sales - Campaign Budget) / Campaign Budget.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
