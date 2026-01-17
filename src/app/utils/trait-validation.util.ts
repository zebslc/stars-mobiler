/**
 * Utility functions for validating racial trait requirements
 */

/**
 * Check if source contains all required values
 * @param source - Array of traits the player/species has
 * @param required - Array of traits that are required
 * @returns true if source contains ALL required values, or if required is empty
 */
export function hasAll(
  source: ReadonlyArray<string> | undefined | null,
  required?: ReadonlyArray<string>,
): boolean {
  if (!required || required.length === 0) return true;
  if (!source || source.length === 0) return false;
  return required.every((value) => source.includes(value));
}

/**
 * Check if source lacks any forbidden values (OR logic for forbidden traits)
 * @param source - Array of traits the player/species has
 * @param forbidden - Array of traits that are forbidden
 * @returns true if source contains NONE of the forbidden values, or if forbidden is empty
 */
export function lacksAny(
  source: ReadonlyArray<string> | undefined | null,
  forbidden?: ReadonlyArray<string>,
): boolean {
  if (!forbidden || forbidden.length === 0) return true;
  if (!source || source.length === 0) return true;
  return !forbidden.some((value) => source.includes(value));
}
