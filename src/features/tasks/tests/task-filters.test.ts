import { describe, expect, it } from "vitest";
import { makeTask, manager, member } from "@/test/utils";
import { toFormValues, toPayload } from "../schemas/task-schema";
import { isOverdue } from "../utils/dates";
import { canDeleteTask } from "../utils/permissions";
import { filterTasks, parseFilters } from "../utils/task-filters";

const tasks = [
  makeTask({ id: "a", status: "todo", assigneeId: member.id, createdById: manager.id }),
  makeTask({ id: "b", status: "in_progress", assigneeId: null, createdById: member.id }),
  makeTask({ id: "c", status: "done", assigneeId: manager.id, createdById: manager.id }),
];
const ids = (list: { id: string }[]) => list.map((t) => t.id);

describe("parseFilters", () => {
  it("reads valid values and ignores invalid status", () => {
    expect(parseFilters(new URLSearchParams("status=done&assignee=u1"))).toEqual({ status: "done", assignee: "u1" });
    expect(parseFilters(new URLSearchParams("status=hacked"))).toEqual({ status: "all", assignee: "all" });
  });
});

describe("filterTasks", () => {
  it("filters by status", () => {
    expect(ids(filterTasks(tasks, { status: "done", assignee: "all" }, manager))).toEqual(["c"]);
  });

  it("filters by assignee and by unassigned", () => {
    expect(ids(filterTasks(tasks, { status: "all", assignee: member.id }, manager))).toEqual(["a"]);
    expect(ids(filterTasks(tasks, { status: "all", assignee: "unassigned" }, manager))).toEqual(["b"]);
  });

  it("combines status and assignee", () => {
    expect(filterTasks(tasks, { status: "done", assignee: member.id }, manager)).toEqual([]);
  });

  it("never shows members tasks they neither created nor are assigned to", () => {
    expect(ids(filterTasks(tasks, { status: "all", assignee: "all" }, member))).toEqual(["a", "b"]);
  });
});

describe("task permissions (UX only)", () => {
  it("lets members delete only their own tasks", () => {
    expect(canDeleteTask(member, tasks[0])).toBe(false);
    expect(canDeleteTask(member, tasks[1])).toBe(true);
    expect(canDeleteTask(manager, tasks[0])).toBe(true);
  });
});

describe("task form mapping", () => {
  it("round-trips a task through the form without losing data", () => {
    const task = makeTask({
      assigneeId: member.id,
      dueDate: "2026-11-05T00:00:00.000Z",
      description: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "سلام" }] }] },
    });
    expect(toPayload(toFormValues(task))).toEqual({
      title: task.title,
      status: task.status,
      priority: task.priority,
      assigneeId: member.id,
      dueDate: "2026-11-05",
      description: task.description,
    });
  });

  it("maps empty optional fields to null and keeps an empty doc valid", () => {
    const payload = toPayload(toFormValues());
    expect(payload).toMatchObject({ assigneeId: null, dueDate: null, description: { type: "doc" } });
  });
});

describe("isOverdue", () => {
  const today = new Date(2026, 9, 13);
  it("compares dates only", () => {
    expect(isOverdue("2026-10-12", today)).toBe(true);
    expect(isOverdue("2026-10-13", today)).toBe(false);
    expect(isOverdue("2026-10-14T23:00:00Z", today)).toBe(false);
  });
});
