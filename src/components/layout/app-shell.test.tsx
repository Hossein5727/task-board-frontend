import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { manager, member, owner, renderWithProviders } from "@/test/utils";
import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/tasks" }));

describe("AppShell role-aware navigation", () => {
  it("shows user management to owners", () => {
    renderWithProviders(<AppShell>محتوا</AppShell>, { user: owner });
    const nav = screen.getByRole("navigation", { name: "ناوبری اصلی" });
    expect(nav).toHaveTextContent("کاربران");
    expect(screen.getByRole("link", { name: "وظایف" })).toHaveAttribute("aria-current", "page");
  });

  it.each([manager, member])("hides user management from $role", (user) => {
    renderWithProviders(<AppShell>محتوا</AppShell>, { user });
    expect(screen.queryByRole("link", { name: "کاربران" })).not.toBeInTheDocument();
    expect(screen.getByText("محتوا")).toBeInTheDocument();
  });

  it("offers a skip link to the main content", () => {
    renderWithProviders(<AppShell>محتوا</AppShell>, { user: owner });
    expect(screen.getByRole("link", { name: "پرش به محتوای اصلی" })).toHaveAttribute("href", "#main");
  });
});
