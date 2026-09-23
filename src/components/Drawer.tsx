import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

/** Keep focus inside an open panel and restore it to its trigger on dismissal. */
export function Drawer({ title, closeLabel, onClose, children }: {
  title: string; closeLabel: string; onClose: () => void; children: ReactNode;
}) {
  const panel = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLButtonElement>(".drawer-close")?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close.current(); }
      if (event.key !== "Tab") return;
      const controls = Array.from(panel.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]'
      ) ?? []).filter(element => !element.hidden && element.getAttribute("aria-hidden") !== "true");
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keydown);
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
      else document.querySelector<HTMLElement>(".app-shell")?.focus({ preventScroll: true });
    };
  }, []);

  return <>
    <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
    <aside ref={panel} className="side-drawer open" role="dialog" aria-modal="true" aria-label={title}>
      <div className="drawer-header">
        <h2 className="drawer-title">{title}</h2>
        <button className="drawer-close" type="button" onClick={onClose} aria-label={closeLabel}>×</button>
      </div>
      <div className="drawer-content">{children}</div>
    </aside>
  </>;
}
