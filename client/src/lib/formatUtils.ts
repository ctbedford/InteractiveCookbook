// Format a number as currency (e.g., $1,234.56)
export function formatCurrency(value: number): string {
  // Handle very small numbers to prevent incorrect display
  if (Math.abs(value) < 0.01 && value !== 0) {
    return "$0.01"; // Minimum displayable value
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
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
