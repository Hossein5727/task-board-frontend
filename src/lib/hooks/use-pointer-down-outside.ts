import { useEffect, type RefObject } from "react";

/**
 * Calls `onOutside` when a pointer press starts outside `ref`. Listens in the capture phase so
 * components that stop propagation (Headless UI, TipTap) cannot swallow the event.
 */
export function usePointerDownOutside(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  onOutside: () => void,
) {
  useEffect(() => {
    if (!enabled) return;
    const handle = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onOutside();
    };
    document.addEventListener("pointerdown", handle, true);
    return () => document.removeEventListener("pointerdown", handle, true);
  }, [ref, enabled, onOutside]);
}
