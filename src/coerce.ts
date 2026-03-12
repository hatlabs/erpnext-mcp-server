/**
 * Input coercion for MCP tool arguments.
 *
 * The MCP SDK sometimes passes JSON-serialized strings instead of parsed
 * objects/arrays. These helpers parse stringified inputs back to their
 * expected types, preventing double-encoding when the values are later
 * passed to JSON.stringify() for API calls.
 */

/**
 * Coerce a value to a string array.
 * Handles: string (JSON-parse or wrap), array (pass-through), undefined/null.
 */
export function coerceStringArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* not JSON — wrap as single-element array */
    }
    return [value];
  }
  return undefined;
}

/**
 * Coerce a value to a plain object.
 * Handles: string (JSON-parse), object (pass-through), undefined/null.
 */
export function coerceObject(value: unknown): Record<string, any> | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, any>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) return parsed;
    } catch {
      /* not valid JSON object */
    }
  }
  return undefined;
}

/**
 * Coerce a value to a number.
 * Handles: number (pass-through), string (parse), undefined/null.
 */
export function coerceNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (!isNaN(n)) return n;
  }
  return undefined;
}
