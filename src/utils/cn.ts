/**
 * Utility function to merge class names
 * Combines Tailwind classes and handles conditional classes
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
