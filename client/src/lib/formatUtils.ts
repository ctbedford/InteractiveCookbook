// Format a number as currency (e.g., $1,234.56 or $1,235 for large amounts)
export function formatCurrency(value: number, forceDecimals: boolean = false): string {
  // Handle very small numbers to prevent incorrect display
  if (Math.abs(value) < 0.01 && value !== 0) {
    return "$0.01"; // Minimum displayable value
  }
  
  // For large values (over $1000), round to whole dollars unless forceDecimals is true
  const shouldShowDecimals = forceDecimals || value < 1000;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: shouldShowDecimals ? 2 : 0,
    maximumFractionDigits: shouldShowDecimals ? 2 : 0
  }).format(value);
}

// Format a number as percentage (e.g., 12.3%)
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
}
