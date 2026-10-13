import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { httpError, renderWithProviders } from "@/test/utils";
import { login } from "../api/auth-api";
import { LoginForm } from "../components/login-form";

const replace = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock("../api/auth-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/auth-api")>()),
  login: vi.fn(),
}));

const fill = async (email: string, password: string) => {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByLabelText("ایمیل"), email);
  if (password) await user.type(screen.getByLabelText("رمز عبور"), password);
  return user;
};

describe("LoginForm", () => {
  beforeEach(() => {
    vi.mocked(login).mockReset();
    replace.mockReset();
    search = "";
  });

  it("validates required fields before calling the API", async () => {
    renderWithProviders(<LoginForm />);
    await userEvent.click(screen.getByRole("button", { name: "ورود" }));

    expect(await screen.findByText("ایمیل را وارد کنید.")).toBeInTheDocument();
    expect(screen.getByText("رمز عبور را وارد کنید.")).toBeInTheDocument();
    expect(screen.getByLabelText("ایمیل")).toHaveAttribute("aria-invalid", "true");
    expect(login).not.toHaveBeenCalled();
  });

  it("rejects an invalid email", async () => {
    renderWithProviders(<LoginForm />);
    const user = await fill("not-an-email", "secret");
    await user.click(screen.getByRole("button", { name: "ورود" }));
    expect(await screen.findByText("ایمیل معتبر نیست.")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("logs in and redirects only to a safe `next` path", async () => {
    search = "next=%2F%2Fevil.com";
    vi.mocked(login).mockResolvedValue();
    renderWithProviders(<LoginForm />);
    const user = await fill("owner@example.com", "secret");
    await user.click(screen.getByRole("button", { name: "ورود" }));

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/tasks"));
    expect(vi.mocked(login).mock.calls[0][0]).toEqual({ email: "owner@example.com", password: "secret" });
  });

  it("shows a Persian error for wrong credentials and keeps the input", async () => {
    vi.mocked(login).mockRejectedValue(httpError(401));
    renderWithProviders(<LoginForm />);
    const user = await fill("owner@example.com", "wrong");
    await user.click(screen.getByRole("button", { name: "ورود" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("ایمیل یا رمز عبور نادرست است.");
    expect(screen.getByLabelText("ایمیل")).toHaveValue("owner@example.com");
    expect(replace).not.toHaveBeenCalled();
  });

  it("explains a disabled account", async () => {
    vi.mocked(login).mockRejectedValue(httpError(403));
    renderWithProviders(<LoginForm />);
    const user = await fill("member@example.com", "secret");
    await user.click(screen.getByRole("button", { name: "ورود" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("غیرفعال");
  });

  it("disables the button while submitting to prevent duplicate requests", async () => {
    vi.mocked(login).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<LoginForm />);
    const user = await fill("owner@example.com", "secret");
    const button = screen.getByRole("button", { name: "ورود" });
    await user.click(button);
    await user.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(login).toHaveBeenCalledTimes(1);
  });

  it("tells the user when the session expired", () => {
    search = "reason=expired";
    renderWithProviders(<LoginForm />);
    expect(screen.getByRole("status")).toHaveTextContent("دوباره وارد حساب کاربری خود شوید");
  });
});
