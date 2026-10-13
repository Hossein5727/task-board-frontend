const DEFAULT_PATH = "/tasks";

/** Accepts only same-origin absolute paths; blocks `//evil.com`, `/\evil.com`, and schemes. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return DEFAULT_PATH;
  if (next.startsWith("/login")) return DEFAULT_PATH;
  return next;
}
