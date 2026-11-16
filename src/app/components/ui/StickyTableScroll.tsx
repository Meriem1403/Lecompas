import { useEffect, useRef, useState, type ReactNode } from "react";

interface StickyTableScrollProps {
  children: ReactNode;
  hint?: string;
}

/** Le tableau défile à l'horizontale, et le curseur reste collé en bas de l'écran. */
export function StickyTableScroll({ children, hint }: StickyTableScrollProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);
  const [contentWidth, setContentWidth] = useState(0);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const measure = () => setContentWidth(scroller.scrollWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    if (scroller.firstElementChild) observer.observe(scroller.firstElementChild);
    return () => observer.disconnect();
  }, [children]);

  const sync = (from: HTMLDivElement, to: HTMLDivElement | null) => {
    if (!to || syncing.current) return;
    syncing.current = true;
    to.scrollLeft = from.scrollLeft;
    syncing.current = false;
  };

  return (
    <div className="min-w-0">
      <div
        ref={scrollerRef}
        className="w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(event) => sync(event.currentTarget, barRef.current)}
      >
        {children}
      </div>
      <div className="pointer-events-none sticky bottom-0 z-30 border-t border-slate-200 bg-slate-50/95">
        <div
          ref={barRef}
          className="pointer-events-auto overflow-x-auto"
          onScroll={(event) => sync(event.currentTarget, scrollerRef.current)}
        >
          <div style={{ width: contentWidth, height: 14 }} />
        </div>
        {hint ? (
          <p className="truncate px-3 py-1 text-xs text-slate-500">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}
