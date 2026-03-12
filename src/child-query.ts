type AnyRecord = Record<string, any>;

// ERPNext field names: word characters only (letters, digits, underscore)
const FIELD_NAME_RE = /^\w+$/;
// ERPNext DocType names: letters, digits, spaces, hyphens, underscores
const DOCTYPE_NAME_RE = /^[\w -]+$/;

export function validateDocTypeName(name: string, label: string): void {
  if (!DOCTYPE_NAME_RE.test(name)) {
    throw new Error(`Invalid ${label}: ${JSON.stringify(name)}`);
  }
}

export function validateFieldName(name: string, label: string): void {
  if (!FIELD_NAME_RE.test(name)) {
    throw new Error(`Invalid field name in ${label}: ${JSON.stringify(name)}`);
  }
}

export function validateChildFilter(filter: unknown): asserts filter is [string, string, string] {
  if (
    !Array.isArray(filter) ||
    filter.length !== 3 ||
    !filter.every((v) => typeof v === "string")
  ) {
    throw new Error(
      `Invalid child_filter entry: expected [field, operator, value] triple, got ${JSON.stringify(filter)}`,
    );
  }
}

export interface ChildQueryArgs {
  parentDoctype: string;
  childDoctype: string;
  parentFields?: unknown;
  childFields?: unknown;
  childFilters?: unknown;
  parentFilters?: AnyRecord;
  limit?: number;
}

/**
 * Coerce an unknown value to a string array.
 * Handles: undefined/null → undefined, string → [string], array → array, other → undefined.
 */
function toStringArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.map(String);
  return undefined;
}

/**
 * Coerce an unknown value to an array of [string, string, string] filter triples.
 * Each element is validated by validateChildFilter.
 */
function toFilterArray(value: unknown): Array<[string, string, string]> | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new Error(
      `Invalid child_filters: expected array of [field, operator, value] triples, got ${typeof value}`,
    );
  }
  value.forEach((f) => validateChildFilter(f));
  return value as Array<[string, string, string]>;
}

export const DEFAULT_LIMIT = 100;

/**
 * Convert {field: value} filter object to Frappe 4-tuple filter list.
 * Values can be scalars (implies "=" operator) or [operator, value] arrays.
 */
function parentFiltersToTuples(
  doctype: string,
  filters: AnyRecord,
): Array<[string, string, string, unknown]> {
  return Object.entries(filters).map(([field, value]) => {
    validateFieldName(field, "parent_filters field");
    if (Array.isArray(value) && value.length === 2 && typeof value[0] === "string") {
      return [doctype, field, value[0], value[1]];
    }
    return [doctype, field, "=", value];
  });
}

/**
 * Build the args object for frappe.client.get_list to query child table rows
 * via a parent-child join.
 */
export function buildChildQueryArgs(input: ChildQueryArgs): AnyRecord {
  validateDocTypeName(input.parentDoctype, "parent_doctype");
  validateDocTypeName(input.childDoctype, "child_doctype");

  const coercedParentFields = toStringArray(input.parentFields);
  const resolvedParentFields =
    coercedParentFields && coercedParentFields.length > 0 ? coercedParentFields : ["name"];
  resolvedParentFields.forEach((f) => validateFieldName(f, "parent_fields"));

  const resolvedChildFields = toStringArray(input.childFields) || [];
  resolvedChildFields.forEach((f) => validateFieldName(f, "child_fields"));

  const resolvedChildFilters = toFilterArray(input.childFilters);
  if (resolvedChildFilters) {
    resolvedChildFilters.forEach((filter) => {
      validateFieldName(filter[0], "child_filters field");
    });
  }

  // Frappe convention: database table name is `tab{DocType}`
  const childTable = `tab${input.childDoctype}`;
  const fields: string[] = [
    ...resolvedParentFields,
    ...resolvedChildFields.map((f) => `\`${childTable}\`.${f}`),
  ];

  const childFilterTuples: Array<[string, string, string, string]> = (
    resolvedChildFilters || []
  ).map(([field, op, value]) => [input.childDoctype, field, op, value]);

  const parentFilterTuples = input.parentFilters
    ? parentFiltersToTuples(input.parentDoctype, input.parentFilters)
    : [];

  const allFilters = [...childFilterTuples, ...parentFilterTuples];

  const args: AnyRecord = {
    doctype: input.parentDoctype,
    fields,
    limit_page_length: input.limit ?? DEFAULT_LIMIT,
  };
  if (allFilters.length) args.filters = allFilters;

  return args;
}
