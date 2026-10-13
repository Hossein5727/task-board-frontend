import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DatePickerField } from "./date-picker-field";

describe("DatePickerField", () => {
  it("shows a Gregorian ISO value as a Persian date in a labelled input", () => {
    render(<DatePickerField label="تاریخ سررسید" value="2026-10-13" onChange={() => {}} />);
    expect(screen.getByLabelText("تاریخ سررسید")).toHaveValue("۱۴۰۵/۰۷/۲۱");
  });

  it("clears the value", async () => {
    const onChange = vi.fn();
    render(<DatePickerField label="تاریخ سررسید" value="2026-10-13" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "پاک کردن تاریخ سررسید" }));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("closes when pressing outside, even on elements that stop click propagation", async () => {
    const { container } = render(
      <>
        <DatePickerField label="تاریخ سررسید" value="2026-10-13" onChange={() => {}} />
        <button type="button" onClick={(event) => event.stopPropagation()}>
          دیگر
        </button>
      </>,
    );
    await userEvent.click(screen.getByLabelText("تاریخ سررسید"));
    await waitFor(() => expect(container.querySelector(".rmdp-wrapper")).not.toBeNull());
    await userEvent.click(screen.getByRole("button", { name: "دیگر" }));
    await waitFor(() => expect(container.querySelector(".rmdp-wrapper")).toBeNull());
  });

  it("opens the Persian calendar and returns the picked day as ISO", async () => {
    const onChange = vi.fn();
    render(<DatePickerField label="تاریخ سررسید" value="2026-10-13" onChange={onChange} />);
    await userEvent.click(screen.getByLabelText("تاریخ سررسید"));
    await userEvent.click(await screen.findByText("۲۸"));
    expect(onChange).toHaveBeenCalledWith("2026-10-20");
  });
});
