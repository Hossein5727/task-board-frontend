"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { useMemo } from "react";
import { hasText, sanitizeDoc } from "@/lib/tiptap/document";
import { richTextExtensions } from "@/lib/tiptap/extensions";

/** Read-only rendering from the same JSON + extensions as the editor. No HTML is ever injected. */
export function RichTextViewer({ value }: { value: unknown }) {
  const doc = useMemo(() => sanitizeDoc(value), [value]);
  const editor = useEditor(
    {
      extensions: richTextExtensions,
      content: doc,
      editable: false,
      immediatelyRender: false,
      editorProps: {
        attributes: { class: "rich-text focus:outline-none", "aria-readonly": "true", "aria-label": "توضیحات" },
      },
    },
    [doc],
  );

  if (!hasText(doc)) return <p className="text-sm text-ink-subtle">توضیحی ثبت نشده است.</p>;
  return <EditorContent editor={editor} />;
}
