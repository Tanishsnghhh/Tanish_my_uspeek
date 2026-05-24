import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string consistently for client-side rendering to avoid hydration errors
 * @param dateString - ISO date string or Date object
 * @param options - Intl.DateTimeFormatOptions (optional)
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }
): string {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}
