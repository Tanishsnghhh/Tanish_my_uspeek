/**
 * Thumbnail URL Generation Utilities
 * Helper functions for generating thumbnail URLs
 */

// Enhanced helper function to generate thumbnail URL with options
export function generateThumbnailUrl(
  uploadId: string,
  accountId?: string,
  frameIndex?: number
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  const params = new URLSearchParams();

  if (accountId) {
    params.append('accountId', accountId);
  }

  if (frameIndex !== undefined && frameIndex >= 0) {
    params.append('frameIndex', frameIndex.toString());
  }

  const queryString = params.toString();
  return `${baseUrl}/api/video-analysis/thumbnail/${uploadId}${queryString ? `?${queryString}` : ''}`;
}

// Helper function to generate multiple thumbnail URLs for gallery/carousel
export function generateMultipleThumbnailUrls(
  uploadId: string,
  accountId?: string,
  frameCount: number = 5
): string[] {
  const urls: string[] = [];

  for (let i = 0; i < frameCount; i++) {
    urls.push(generateThumbnailUrl(uploadId, accountId, i));
  }

  return urls;
}
