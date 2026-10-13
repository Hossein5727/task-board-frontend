import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listUsers } from "@/features/users/api/users-api";
import { httpError, makeTask, manager, member, owner, renderWithProviders } from "@/test/utils";
import { createTask, deleteTask, getTask, listTasks, updateTask } from "../api/tasks-api";
import { TaskBoard } from "../components/task-board";

const replace = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/tasks",
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock("../api/tasks-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/tasks-api")>()),
  listTasks: vi.fn(),
  getTask: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));
vi.mock("@/features/users/api/users-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/users/api/users-api")>()),
  listUsers: vi.fn(),
}));

const memberSummary = { id: member.id, fullName: member.fullName, email: member.email };
const tasks = [
  makeTask({ id: "t1", title: "نوشتن مستندات", status: "todo", priority: "high", assigneeId: member.id, assignee: memberSummary }),
  makeTask({ id: "t2", title: "رفع باگ ورود", status: "in_progress", createdById: member.id }),
  makeTask({ id: "t3", title: "انتشار نسخه", status: "done", createdById: manager.id }),
];

const column = (name: string) => screen.getByRole("region", { name: new RegExp(name) });

describe("TaskBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    search = "";
    vi.mocked(listTasks).mockResolvedValue(tasks);
    vi.mocked(listUsers).mockResolvedValue([owner, manager, member]);
    vi.mocked(getTask).mockImplementation(async (id) => tasks.find((t) => t.id === id)!);
  });

  it("groups tasks into status columns", async () => {
    renderWithProviders(<TaskBoard />, { user: owner });
    expect(await screen.findByText("نوشتن مستندات")).toBeInTheDocument();
    expect(within(column("برای انجام")).getByText("نوشتن مستندات")).toBeInTheDocument();
    expect(within(column("در حال انجام")).getByText("رفع باگ ورود")).toBeInTheDocument();
    expect(within(column("انجام‌شده")).getByText("انتشار نسخه")).toBeInTheDocument();
  });

  it("applies status and assignee filters from the URL", async () => {
    search = `status=todo&assignee=${member.id}`;
    renderWithProviders(<TaskBoard />, { user: owner });
    expect(await screen.findByText("نوشتن مستندات")).toBeInTheDocument();
    expect(screen.queryByText("رفع باگ ورود")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /در حال انجام/ })).not.toBeInTheDocument();
  });

  it("writes filter changes to the URL via the status listbox", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TaskBoard />, { user: owner });
    await screen.findByText("نوشتن مستندات");

    await user.click(screen.getByRole("button", { name: /وضعیت/ }));
    await user.click(await screen.findByRole("option", { name: "انجام‌شده" }));
    expect(replace).toHaveBeenCalledWith("/tasks?status=done", { scroll: false });
  });

  it("shows an empty-filter state with a reset action", async () => {
    search = "status=done&assignee=unassigned";
    vi.mocked(listTasks).mockResolvedValue([tasks[0]]);
    renderWithProviders(<TaskBoard />, { user: owner });
    expect(await screen.findByText("وظیفه‌ای با این فیلترها پیدا نشد")).toBeInTheDocument();
  });

  it("shows a retryable error state when loading fails", async () => {
    vi.mocked(listTasks).mockRejectedValueOnce(httpError(500)).mockResolvedValueOnce(tasks);
    renderWithProviders(<TaskBoard />, { user: owner });
    await userEvent.click(await screen.findByRole("button", { name: "تلاش دوباره" }));
    expect(await screen.findByText("نوشتن مستندات")).toBeInTheDocument();
  });

  it("validates and creates a task with a TipTap JSON description", async () => {
    const user = userEvent.setup();
    vi.mocked(createTask).mockResolvedValue(makeTask({ id: "new" }));
    renderWithProviders(<TaskBoard />, { user: owner });
    await screen.findByText("نوشتن مستندات");

    await user.click(screen.getByRole("button", { name: "وظیفهٔ جدید" }));
    const dialog = await screen.findByRole("dialog", { name: "وظیفهٔ جدید" });
    const title = within(dialog).getByLabelText("عنوان");
    expect(title).toHaveFocus();

    await user.click(within(dialog).getByRole("button", { name: "ایجاد وظیفه" }));
    expect(await within(dialog).findByText("عنوان وظیفه را وارد کنید.")).toBeInTheDocument();
    expect(createTask).not.toHaveBeenCalled();

    await user.type(title, "  تست وظیفه  ");
    await user.click(within(dialog).getByRole("button", { name: "ایجاد وظیفه" }));

    await waitFor(() => expect(createTask).toHaveBeenCalledTimes(1));
    expect(vi.mocked(createTask).mock.calls[0][0]).toEqual({
      title: "تست وظیفه",
      status: "todo",
      priority: "medium",
      assigneeId: null,
      dueDate: null,
      description: { type: "doc", content: [{ type: "paragraph" }] },
    });
    expect(await screen.findByText("وظیفه ایجاد شد.")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("keeps the dialog open with input preserved when saving fails", async () => {
    const user = userEvent.setup();
    vi.mocked(createTask).mockRejectedValue(httpError(403));
    renderWithProviders(<TaskBoard />, { user: owner });
    await screen.findByText("نوشتن مستندات");

    await user.click(screen.getByRole("button", { name: "وظیفهٔ جدید" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("عنوان"), "وظیفهٔ ممنوع");
    await user.click(within(dialog).getByRole("button", { name: "ایجاد وظیفه" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("اجازه");
    expect(within(dialog).getByLabelText("عنوان")).toHaveValue("وظیفهٔ ممنوع");
  });

  it("restores existing values when editing and sends a PATCH", async () => {
    const user = userEvent.setup();
    vi.mocked(updateTask).mockResolvedValue({ ...tasks[0], title: "عنوان تازه" });
    renderWithProviders(<TaskBoard />, { user: owner });
    await screen.findByText("نوشتن مستندات");

    await user.click(screen.getByRole("button", { name: "گزینه‌های وظیفهٔ «نوشتن مستندات»" }));
    await user.click(await screen.findByRole("menuitem", { name: "ویرایش" }));
    const dialog = await screen.findByRole("dialog", { name: "ویرایش وظیفه" });
    const title = within(dialog).getByLabelText("عنوان");
    expect(title).toHaveValue("نوشتن مستندات");

    await user.clear(title);
    await user.type(title, "عنوان تازه");
    await user.click(within(dialog).getByRole("button", { name: "ذخیرهٔ تغییرات" }));

    await waitFor(() => expect(updateTask).toHaveBeenCalledTimes(1));
    expect(vi.mocked(updateTask).mock.calls[0]).toEqual([
      "t1",
      expect.objectContaining({ title: "عنوان تازه", priority: "high", assigneeId: member.id }),
    ]);
  });

  it("closes the dialog with Escape and restores focus", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TaskBoard />, { user: owner });
    await screen.findByText("نوشتن مستندات");
    const trigger = screen.getByRole("button", { name: "وظیفهٔ جدید" });

    await user.click(trigger);
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("asks for confirmation before deleting and reports failure", async () => {
    const user = userEvent.setup();
    vi.mocked(deleteTask).mockRejectedValueOnce(httpError(403)).mockResolvedValueOnce();
    renderWithProviders(<TaskBoard />, { user: owner });
    await screen.findByText("نوشتن مستندات");

    await user.click(screen.getByRole("button", { name: "گزینه‌های وظیفهٔ «نوشتن مستندات»" }));
    await user.click(await screen.findByRole("menuitem", { name: "حذف" }));
    const confirm = await screen.findByRole("alertdialog", { name: "حذف وظیفه" });
    expect(within(confirm).getByRole("button", { name: "انصراف" })).toHaveFocus();
    expect(deleteTask).not.toHaveBeenCalled();

    await user.click(within(confirm).getByRole("button", { name: "حذف وظیفه" }));
    expect(await screen.findByText("شما اجازهٔ انجام این کار را ندارید.")).toBeInTheDocument();

    await user.click(within(confirm).getByRole("button", { name: "حذف وظیفه" }));
    await waitFor(() => expect(deleteTask).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("وظیفه حذف شد.")).toBeInTheDocument();
  });

  it("hides delete for members on tasks they did not create, and limits assignees to themselves", async () => {
    const user = userEvent.setup();
    vi.mocked(listTasks).mockResolvedValue([tasks[0], tasks[1]]);
    renderWithProviders(<TaskBoard />, { user: member });
    await screen.findByText("نوشتن مستندات");

    await user.click(screen.getByRole("button", { name: "گزینه‌های وظیفهٔ «نوشتن مستندات»" }));
    expect(await screen.findByRole("menuitem", { name: "ویرایش" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "حذف" })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "گزینه‌های وظیفهٔ «رفع باگ ورود»" }));
    expect(await screen.findByRole("menuitem", { name: "حذف" })).toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "وظیفهٔ جدید" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /مسئول/ }));
    expect(await screen.findAllByRole("option")).toHaveLength(2);
    expect(screen.getByRole("option", { name: "بدون مسئول" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: `${member.fullName} (من)` })).toBeInTheDocument();
    expect(listUsers).not.toHaveBeenCalled();
  });
});
