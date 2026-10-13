"use client";

import {
  BoldIcon,
  ChatBubbleBottomCenterTextIcon,
  H2Icon,
  H3Icon,
  ItalicIcon,
  LinkIcon,
  LinkSlashIcon,
  ListBulletIcon,
  NumberedListIcon,
} from "@heroicons/react/20/solid";
import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from "@tiptap/react";
import { useId, useState } from "react";
import { normalizeLinkInput, sanitizeDoc } from "@/lib/tiptap/document";
import { richTextExtensions } from "@/lib/tiptap/extensions";
import { cn } from "@/lib/utils/cn";
import { Button } from "../../atoms/button";
import { controlClass } from "../../atoms/control-styles";

interface RichTextEditorProps {
  /** Initial document only; remount (via `key`) to load a different one. */
  value: unknown;
  onChange: (doc: JSONContent) => void;
  labelledBy: string;
}

export function RichTextEditor({ value, onChange, labelledBy }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: richTextExtensions,
    content: sanitizeDoc(value),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "rich-text min-h-36 px-3 py-2.5 focus:outline-none",
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": labelledBy,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });

  return (
    <div className="rounded-lg bg-surface ring-1 ring-inset ring-line focus-within:ring-2 focus-within:ring-brand-600">
      {editor ? <Toolbar editor={editor} /> : <div className="h-11 border-b border-line" />}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      blockquote: e.isActive("blockquote"),
      link: e.isActive("link"),
    }),
  });

  const chain = () => editor.chain().focus();
  const tools = [
    { label: "پررنگ", icon: BoldIcon, active: state.bold, run: () => chain().toggleBold().run() },
    { label: "مورب", icon: ItalicIcon, active: state.italic, run: () => chain().toggleItalic().run() },
    { label: "عنوان سطح ۲", icon: H2Icon, active: state.h2, run: () => chain().toggleHeading({ level: 2 }).run() },
    { label: "عنوان سطح ۳", icon: H3Icon, active: state.h3, run: () => chain().toggleHeading({ level: 3 }).run() },
    { label: "فهرست نقطه‌ای", icon: ListBulletIcon, active: state.bulletList, run: () => chain().toggleBulletList().run() },
    { label: "فهرست شماره‌دار", icon: NumberedListIcon, active: state.orderedList, run: () => chain().toggleOrderedList().run() },
    { label: "نقل‌قول", icon: ChatBubbleBottomCenterTextIcon, active: state.blockquote, run: () => chain().toggleBlockquote().run() },
  ];

  return (
    <div className="border-b border-line">
      <div role="group" aria-label="ابزار قالب‌بندی" className="flex flex-wrap items-center gap-0.5 p-1.5">
        {tools.map(({ label, icon: Icon, active, run }) => (
          <ToolButton key={label} label={label} active={active} onClick={run}>
            <Icon className="size-4" aria-hidden="true" />
          </ToolButton>
        ))}
        <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
        <ToolButton label="افزودن یا ویرایش لینک" active={state.link || linkOpen} onClick={() => setLinkOpen((o) => !o)}>
          <LinkIcon className="size-4" aria-hidden="true" />
        </ToolButton>
        {state.link && (
          <ToolButton label="حذف لینک" active={false} onClick={() => chain().extendMarkRange("link").unsetLink().run()}>
            <LinkSlashIcon className="size-4" aria-hidden="true" />
          </ToolButton>
        )}
      </div>
      {linkOpen && (
        <LinkForm
          initial={(editor.getAttributes("link").href as string | undefined) ?? ""}
          onApply={(href) => {
            chain().extendMarkRange("link").setLink({ href }).run();
            setLinkOpen(false);
          }}
          onCancel={() => {
            setLinkOpen(false);
            editor.commands.focus();
          }}
        />
      )}
    </div>
  );
}

function ToolButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-zinc-100 hover:text-ink",
        active && "bg-brand-50 text-brand-800 hover:bg-brand-100",
      )}
    >
      {children}
    </button>
  );
}

/** Not a <form>: it lives inside the task form, and nested forms are invalid HTML. */
function LinkForm({ initial, onApply, onCancel }: { initial: string; onApply: (href: string) => void; onCancel: () => void }) {
  const id = useId();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const apply = () => {
    const href = normalizeLinkInput(value);
    if (!href) return setError("فقط نشانی‌های معتبر http یا https مجاز است.");
    onApply(href);
  };

  return (
    <div className="flex flex-col gap-1.5 border-t border-line bg-zinc-50/60 p-2">
      <label htmlFor={id} className="sr-only">
        نشانی لینک
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="url"
          dir="ltr"
          autoFocus
          placeholder="https://example.com"
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              onCancel();
            }
          }}
          className={cn(controlClass, "h-8 text-xs")}
        />
        <Button size="sm" onClick={apply}>
          ثبت
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          انصراف
        </Button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}
