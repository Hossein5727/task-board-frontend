import { describe, expect, it } from "vitest";
import { dateToIsoDate, isoDateToDate } from "./iso-date";

describe("iso date helpers", () => {
  it("round-trips a date without timezone shifts", () => {
    const date = isoDateToDate("2026-10-20");
    expect(date?.getDate()).toBe(20);
    expect(dateToIsoDate(date!)).toBe("2026-10-20");
  });

  it("rejects empty and malformed input", () => {
    expect(isoDateToDate("")).toBeNull();
    expect(isoDateToDate("20/10/2026")).toBeNull();
  });
});
