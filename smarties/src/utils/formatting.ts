/**
 * Data formatting utilities
 * Provides formatting functions for display and data processing
 */

/**
 * Format UPC for display
 */
export function formatUPC(upc: string): string {
  if (!upc) return '';
  
  const cleanUPC = upc.replace(/[\s-]/g, '');
  
  if (cleanUPC.length === 12) {
    // Format UPC-A: 0-12345-67890-1
    return `${cleanUPC.slice(0, 1)}-${cleanUPC.slice(1, 6)}-${cleanUPC.slice(6, 11)}-${cleanUPC.slice(11)}`;
  } else if (cleanUPC.length === 8) {
    // Format UPC-E: 01234567
    return cleanUPC;
  }
  
  return upc; // Return original if not standard length
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format nutritional value for display
 */
export function formatNutritionalValue(value: number, unit: string): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'N/A';
  }
  
  // Round to appropriate decimal places
  const rounded = Math.round(value * 100) / 100;
  
  return `${rounded}${unit}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}