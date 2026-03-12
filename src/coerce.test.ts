import { describe, it, expect } from "vitest";
import { coerceStringArray, coerceObject, coerceNumber } from "./coerce.js";

describe("coerceStringArray", () => {
  it("returns undefined for undefined/null", () => {
    expect(coerceStringArray(undefined)).toBeUndefined();
    expect(coerceStringArray(null)).toBeUndefined();
  });

  it("passes through arrays", () => {
    expect(coerceStringArray(["name", "item_code"])).toEqual(["name", "item_code"]);
  });

  it("parses JSON string arrays", () => {
    expect(coerceStringArray('["name", "account_name"]')).toEqual(["name", "account_name"]);
  });

  it("wraps plain strings as single-element array", () => {
    expect(coerceStringArray("name")).toEqual(["name"]);
  });

  it("returns undefined for non-array/string types", () => {
    expect(coerceStringArray(42)).toBeUndefined();
    expect(coerceStringArray({})).toBeUndefined();
  });
});

describe("coerceObject", () => {
  it("returns undefined for undefined/null", () => {
    expect(coerceObject(undefined)).toBeUndefined();
    expect(coerceObject(null)).toBeUndefined();
  });

  it("passes through objects", () => {
    expect(coerceObject({ account_number: "5205" })).toEqual({ account_number: "5205" });
  });

  it("parses JSON string objects", () => {
    expect(coerceObject('{"account_number": "5205"}')).toEqual({ account_number: "5205" });
  });

  it("parses nested filter values", () => {
    expect(coerceObject('{"name": ["like", "%5205%"]}')).toEqual({ name: ["like", "%5205%"] });
  });

  it("returns undefined for arrays", () => {
    expect(coerceObject([1, 2, 3])).toBeUndefined();
  });

  it("returns undefined for JSON arrays in strings", () => {
    expect(coerceObject('["name"]')).toBeUndefined();
  });

  it("returns undefined for invalid JSON strings", () => {
    expect(coerceObject("not json")).toBeUndefined();
  });

  it("handles empty object string", () => {
    expect(coerceObject("{}")).toEqual({});
  });
});

describe("coerceNumber", () => {
  it("returns undefined for undefined/null", () => {
    expect(coerceNumber(undefined)).toBeUndefined();
    expect(coerceNumber(null)).toBeUndefined();
  });

  it("passes through numbers", () => {
    expect(coerceNumber(5)).toBe(5);
  });

  it("parses numeric strings", () => {
    expect(coerceNumber("5")).toBe(5);
    expect(coerceNumber("100")).toBe(100);
  });

  it("returns undefined for non-numeric strings", () => {
    expect(coerceNumber("abc")).toBeUndefined();
  });
});
