import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-redirect";

describe("safeNextPath", () => {
  it("keeps same-origin paths with query strings", () => {
    expect(safeNextPath("/tasks?status=done")).toBe("/tasks?status=done");
    expect(safeNextPath("/users")).toBe("/users");
  });

  it.each([null, "", "https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "tasks", "/login?next=/x"])(
    "falls back to /tasks for %s",
    (value) => expect(safeNextPath(value)).toBe("/tasks"),
  );
});
