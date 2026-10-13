import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RichTextEditor } from "./rich-text-editor";
import { RichTextViewer } from "./rich-text-viewer";

const stored = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "هدف" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "مهم", marks: [{ type: "bold" }] },
        { type: "text", text: " و " },
        { type: "text", text: "تأکیدی", marks: [{ type: "italic" }] },
        { type: "text", text: " " },
        { type: "text", text: "مستندات", marks: [{ type: "link", attrs: { href: "https://example.com/docs" } }] },
        { type: "text", text: " " },
        { type: "text", text: "خطرناک", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] },
      ],
    },
    { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "مورد" }] }] }] },
    { type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: "نقل‌قول" }] }] },
  ],
};

describe("RichTextViewer", () => {
  it("renders stored JSON with all supported formatting", async () => {
    const { container } = render(<RichTextViewer value={stored} />);
    expect(await screen.findByRole("heading", { level: 2, name: "هدف" })).toBeInTheDocument();
    expect(screen.getByText("مهم").tagName).toBe("STRONG");
    expect(screen.getByText("تأکیدی").tagName).toBe("EM");
    expect(screen.getByRole("listitem")).toHaveTextContent("مورد");
    expect(container.querySelector("blockquote")).toHaveTextContent("نقل‌قول");
    const content = screen.getByRole("textbox", { name: "توضیحات" });
    expect(content).toHaveAttribute("contenteditable", "false");
    expect(content).toHaveAttribute("aria-readonly", "true");

    const link = screen.getByRole("link", { name: "مستندات" });
    expect(link).toHaveAttribute("href", "https://example.com/docs");
    expect(link).toHaveAttribute("rel", "noopener noreferrer nofollow");
  });

  it("never renders unsafe links", async () => {
    render(<RichTextViewer value={stored} />);
    await screen.findByRole("heading");
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("textbox", { name: "توضیحات" })).toHaveTextContent("خطرناک");
    expect(document.querySelector('a[href^="javascript"]')).toBeNull();
  });

  it("shows a friendly message for empty or malformed documents", () => {
    const { rerender } = render(<RichTextViewer value={{ type: "doc", content: [{ type: "paragraph" }] }} />);
    expect(screen.getByText("توضیحی ثبت نشده است.")).toBeInTheDocument();
    rerender(<RichTextViewer value="<script>alert(1)</script>" />);
    expect(screen.getByText("توضیحی ثبت نشده است.")).toBeInTheDocument();
  });
});

describe("RichTextEditor", () => {
  const setup = (value: unknown = stored) => {
    const onChange = vi.fn();
    render(
      <>
        <span id="lbl">توضیحات</span>
        <RichTextEditor value={value} onChange={onChange} labelledBy="lbl" />
      </>,
    );
    return { onChange };
  };

  it("restores existing JSON into an editable, labelled textbox", async () => {
    const { onChange } = setup();
    const textbox = await screen.findByRole("textbox", { name: "توضیحات" });
    expect(textbox).toHaveAttribute("contenteditable", "true");
    expect(textbox).toHaveAttribute("aria-multiline", "true");
    expect(screen.getByRole("heading", { level: 2, name: "هدف" })).toBeInTheDocument();
    expect(screen.getByText("مهم").tagName).toBe("STRONG");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("exposes accessible formatting controls for every supported format", async () => {
    setup();
    const toolbar = await screen.findByRole("group", { name: "ابزار قالب‌بندی" });
    for (const name of ["پررنگ", "مورب", "عنوان سطح ۲", "عنوان سطح ۳", "فهرست نقطه‌ای", "فهرست شماره‌دار", "نقل‌قول", "افزودن یا ویرایش لینک"]) {
      expect(screen.getByRole("button", { name })).toHaveAttribute("aria-pressed");
    }
    expect(toolbar).toBeInTheDocument();
  });

  it("emits TipTap JSON (not HTML) when content changes", async () => {
    const { onChange } = setup({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "متن" }] }] });
    await screen.findByRole("textbox");
    await userEvent.click(screen.getByRole("button", { name: "فهرست نقطه‌ای" }));

    const doc = onChange.mock.lastCall?.[0];
    expect(doc.type).toBe("doc");
    expect(doc.content[0]).toEqual({
      type: "bulletList",
      content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "متن" }] }] }],
    });
  });

  it("rejects non-http(s) links", async () => {
    const user = userEvent.setup();
    setup(undefined);
    await user.click(await screen.findByRole("button", { name: "افزودن یا ویرایش لینک" }));
    await user.type(screen.getByLabelText("نشانی لینک"), "javascript:alert(1){Enter}");
    expect(screen.getByRole("alert")).toHaveTextContent("فقط نشانی‌های معتبر http یا https مجاز است.");
  });
});
