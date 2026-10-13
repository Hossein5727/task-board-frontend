import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { httpError, manager, member, owner, renderWithProviders } from "@/test/utils";
import { createUser, listUsers, updateUser } from "../api/users-api";
import { UserManagement } from "../components/user-management";

vi.mock("../api/users-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/users-api")>()),
  listUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
}));

describe("UserManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listUsers).mockResolvedValue([owner, manager, member]);
  });

  it.each([manager, member])("shows a forbidden state to $role without requesting users", (user) => {
    renderWithProviders(<UserManagement />, { user });
    expect(screen.getByText("دسترسی ندارید")).toBeInTheDocument();
    expect(listUsers).not.toHaveBeenCalled();
  });

  it("shows the backend's 403 as an error state", async () => {
    vi.mocked(listUsers).mockRejectedValue(httpError(403));
    renderWithProviders(<UserManagement />, { user: owner });
    expect(await screen.findByRole("alert")).toHaveTextContent("شما اجازهٔ انجام این کار را ندارید.");
  });

  it("disables a user only after confirmation", async () => {
    const user = userEvent.setup();
    vi.mocked(updateUser).mockResolvedValue({ ...member, isActive: false });
    renderWithProviders(<UserManagement />, { user: owner });

    await user.click(await screen.findByRole("button", { name: `گزینه‌های کاربر «${member.fullName}»` }));
    await user.click(await screen.findByRole("menuitem", { name: "غیرفعال‌سازی" }));
    const dialog = await screen.findByRole("alertdialog", { name: "غیرفعال‌سازی کاربر" });
    expect(updateUser).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "غیرفعال‌سازی" }));
    await waitFor(() => expect(updateUser).toHaveBeenCalledWith(member.id, { isActive: false }));
    expect(await screen.findByText(`«${member.fullName}» غیرفعال شد.`)).toBeInTheDocument();
  });

  it("does not offer disabling your own account", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserManagement />, { user: owner });
    await user.click(await screen.findByRole("button", { name: `گزینه‌های کاربر «${owner.fullName}»` }));
    expect(await screen.findByRole("menuitem", { name: "ویرایش" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "غیرفعال‌سازی" })).not.toBeInTheDocument();
  });

  it("explains a rejected last-owner downgrade", async () => {
    const user = userEvent.setup();
    vi.mocked(updateUser).mockRejectedValue(httpError(400));
    renderWithProviders(<UserManagement />, { user: { ...owner, id: "someone-else" } });

    await user.click(await screen.findByRole("button", { name: `گزینه‌های کاربر «${owner.fullName}»` }));
    await user.click(await screen.findByRole("menuitem", { name: "ویرایش" }));
    const dialog = await screen.findByRole("dialog", { name: "ویرایش کاربر" });
    await user.click(within(dialog).getByRole("button", { name: /نقش/ }));
    await user.click(await screen.findByRole("option", { name: "عضو" }));
    await user.click(within(dialog).getByRole("button", { name: "ذخیرهٔ تغییرات" }));

    await waitFor(() => expect(updateUser).toHaveBeenCalledWith(owner.id, { role: "member" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("آخرین مالک");
  });

  it("validates and creates users without exposing the owner role", async () => {
    const user = userEvent.setup();
    vi.mocked(createUser).mockResolvedValue({ ...member, id: "new" });
    renderWithProviders(<UserManagement />, { user: owner });

    await user.click(await screen.findByRole("button", { name: "کاربر جدید" }));
    const dialog = await screen.findByRole("dialog", { name: "کاربر جدید" });
    await user.type(within(dialog).getByLabelText("نام و نام خانوادگی"), "علی");
    await user.type(within(dialog).getByLabelText("ایمیل"), "ali@example.com");
    await user.type(within(dialog).getByLabelText("رمز عبور اولیه"), "short");
    await user.click(within(dialog).getByRole("button", { name: "ایجاد کاربر" }));
    expect(await within(dialog).findByText("رمز عبور باید حداقل ۸ کاراکتر باشد.")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /نقش/ }));
    expect(screen.queryByRole("option", { name: "مالک" })).not.toBeInTheDocument();
    await user.click(await screen.findByRole("option", { name: "مدیر" }));

    await user.type(within(dialog).getByLabelText("رمز عبور اولیه"), "-long-enough");
    await user.click(within(dialog).getByRole("button", { name: "ایجاد کاربر" }));
    await waitFor(() =>
      expect(vi.mocked(createUser).mock.calls[0][0]).toEqual({
        fullName: "علی",
        email: "ali@example.com",
        password: "short-long-enough",
        role: "manager",
      }),
    );
  });
});
