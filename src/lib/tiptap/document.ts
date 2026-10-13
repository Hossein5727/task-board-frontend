import type { JSONContent } from "@tiptap/react";

/** Same shape TipTap produces for an empty editor; a valid, empty description. */
export const EMPTY_DOC: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

const BLOCKS = new Set(["paragraph", "heading", "bulletList", "orderedList", "blockquote"]);
const INLINE = new Set(["text"]);
const LIST_ITEMS = new Set(["listItem"]);

const ALLOWED_CHILDREN: Record<string, Set<string>> = {
  doc: BLOCKS,
  blockquote: BLOCKS,
  listItem: BLOCKS,
  bulletList: LIST_ITEMS,
  orderedList: LIST_ITEMS,
  paragraph: INLINE,
  heading: INLINE,
};

export const HEADING_LEVELS = [2, 3] as const;

type UnknownRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is UnknownRecord => typeof value === "object" && value !== null;

export function isSafeHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/** Adds `https://` to scheme-less input like `example.com`; returns null for anything not http(s). */
export function normalizeLinkInput(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`;
  return isSafeHttpUrl(withScheme) ? withScheme : null;
}

function sanitizeMarks(marks: unknown): JSONContent["marks"] {
  if (!Array.isArray(marks)) return [];
  const result: NonNullable<JSONContent["marks"]> = [];
  for (const mark of marks) {
    if (!isRecord(mark)) continue;
    if (mark.type === "bold" || mark.type === "italic") result.push({ type: mark.type });
    if (mark.type === "link") {
      const href = isRecord(mark.attrs) ? mark.attrs.href : undefined;
      if (typeof href === "string" && isSafeHttpUrl(href)) result.push({ type: "link", attrs: { href } });
    }
  }
  return result;
}

function sanitizeChildren(nodes: unknown, parentType: string): JSONContent[] {
  if (!Array.isArray(nodes)) return [];
  const allowed = ALLOWED_CHILDREN[parentType];
  return nodes.flatMap((node) => {
    if (!isRecord(node) || typeof node.type !== "string" || !allowed?.has(node.type)) return [];
    const clean = sanitizeNode(node);
    return clean ? [clean] : [];
  });
}

function sanitizeNode(node: UnknownRecord): JSONContent | null {
  const type = node.type as string;

  if (type === "text") {
    if (typeof node.text !== "string" || node.text === "") return null;
    const marks = sanitizeMarks(node.marks);
    return marks?.length ? { type, text: node.text, marks } : { type, text: node.text };
  }

  const content = sanitizeChildren(node.content, type);
  const result: JSONContent = { type };

  if (type === "heading") {
    const level = isRecord(node.attrs) ? node.attrs.level : undefined;
    result.attrs = { level: level === 3 ? 3 : 2 };
  }
  if (type === "orderedList" && isRecord(node.attrs) && Number.isInteger(node.attrs.start)) {
    result.attrs = { start: node.attrs.start };
  }

  if (content.length) result.content = content;
  else if (type === "bulletList" || type === "orderedList") return null;
  else if (type === "listItem" || type === "blockquote") result.content = [{ type: "paragraph" }];

  return result;
}

/**
 * Whitelists the agreed TipTap schema (paragraph, heading 2–3, lists, blockquote, bold, italic,
 * http/https links). Unknown or malformed input degrades to a valid document instead of throwing.
 * The backend must still validate independently.
 */
export function sanitizeDoc(value: unknown): JSONContent {
  if (!isRecord(value) || value.type !== "doc") return EMPTY_DOC;
  const content = sanitizeChildren(value.content, "doc");
  return content.length ? { type: "doc", content } : EMPTY_DOC;
}

export function hasText(node: JSONContent): boolean {
  return Boolean(node.text?.trim()) || (node.content ?? []).some(hasText);
}
