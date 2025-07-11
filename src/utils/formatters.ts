/**
 * Format a date string into a readable format
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Format a number of meters into a readable distance
 */
export function formatDistance(meters: number): string {
  if (meters < 1) {
    return `${(meters * 100).toFixed(0)} cm`;
  } else if (meters < 1000) {
    return `${meters.toFixed(1)} m`;
  } else {
    return `${(meters / 1000).toFixed(2)} km`;
  }
}

/**
 * Format a number of square meters into a readable area
 */
export function formatArea(squareMeters: number): string {
  if (squareMeters < 1) {
    return `${(squareMeters * 10000).toFixed(0)} cm²`;
  } else if (squareMeters < 10000) {
    return `${squareMeters.toFixed(1)} m²`;
  } else {
    return `${(squareMeters / 10000).toFixed(2)} ha`;
  }
}