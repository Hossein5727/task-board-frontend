import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SelectField } from "./select-field";

const options = [
  { value: "low", label: "کم" },
  { value: "medium", label: "متوسط" },
  { value: "high", label: "زیاد" },
] as const;

describe("SelectField", () => {
  it("opens on Enter inside a form instead of submitting it, and Enter then selects an option", async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const onChange = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <SelectField label="اولویت" value="medium" onChange={onChange} options={options} />
        <button type="submit">ذخیره</button>
      </form>,
    );

    screen.getByRole("button", { name: /اولویت/ }).focus();
    await userEvent.keyboard("{Enter}");
    expect(await screen.findAllByRole("option")).toHaveLength(3);
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
