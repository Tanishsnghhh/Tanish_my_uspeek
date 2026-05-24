/**
 * Learning Progress Utility Functions
 * Pure functions for calculating progress and completion
 */

/**
 * Calculate video completion percentage
 */
export function calculateVideoCompletion(
  watchedDuration: number,
  totalDuration: number
): number {
  if (totalDuration === 0) return 0;
  return Math.min(Math.round((watchedDuration / totalDuration) * 100), 100);
}

/**
 * Check if video is considered completed
 */
export function isVideoCompleted(
  watchedDuration: number,
  totalDuration: number,
  threshold: number = 0.95 // 95% threshold - close to completion
): boolean {
  if (totalDuration === 0) return false;

  // If watched duration is greater than or equal to total duration, definitely completed
  if (watchedDuration >= totalDuration) return true;

  // Otherwise check against threshold
  return (watchedDuration / totalDuration) >= threshold;
}
