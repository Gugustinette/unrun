/**
 * Deeply merges two objects, with the second object taking precedence.
 * Arrays are concatenated (not replaced).
 * Undefined values in the source object are ignored (do not override target).
 * @param target The target object to merge into.
 * @param source The source object to merge from.
 * @returns A new object that is the result of deeply merging the source into the target.
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T> | undefined,
): T {
  if (!source) {
    return target;
  }

  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const targetValue = result[key];
      const sourceValue = source[key];

      if (sourceValue === undefined) {
        continue;
      }

      if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
        // Concatenate arrays
        result[key] = [...targetValue, ...sourceValue] as any;
      } else if (
        typeof targetValue === "object" &&
        targetValue !== null &&
        typeof sourceValue === "object" &&
        sourceValue !== null &&
        !Array.isArray(targetValue) &&
        !Array.isArray(sourceValue)
      ) {
        // Recursively merge objects
        result[key] = deepMerge({ ...targetValue }, sourceValue);
      } else {
        // Override with source value
        result[key] = sourceValue as any;
      }
    }
  }

  return result;
}
