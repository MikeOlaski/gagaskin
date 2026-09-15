import { GripVertical, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

interface FloatingPanelProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  defaultPosition?: { x: number; y: number };
}

const DEFAULT_POSITION = { x: 24, y: 88 };

/** A draggable, viewport-clamped palette used by focus mode. */
export function FloatingPanel({
  title,
  onClose,
  children,
  defaultPosition = DEFAULT_POSITION,
}: FloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [position, setPosition] = useState(DEFAULT_POSITION);

  const clamp = (x: number, y: number) => {
    const panel = panelRef.current;
    const maxX = window.innerWidth - (panel?.offsetWidth ?? 300);
    const maxY = window.innerHeight - (panel?.offsetHeight ?? 100);
    return {
      x: Math.min(Math.max(x, 0), Math.max(0, maxX)),
      y: Math.min(Math.max(y, 0), Math.max(0, maxY)),
    };
  };

  const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
    };
  };

  const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const { startX, startY, originX, originY } = dragRef.current;
    setPosition(clamp(originX + (e.clientX - startX), originY + (e.clientY - startY)));
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  return (
    <div
      ref={panelRef}
      className="fixed z-50 w-[300px] overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
      style={{ left: position.x, top: position.y }}
    >
      <div
        className="flex touch-none items-center gap-2 border-b border-border bg-muted/50 px-3 py-2 cursor-grab active:cursor-grabbing"
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <GripVertical className="size-4 shrink-0 text-muted-foreground" />
        <span className="text-xs font-semibold text-foreground">{title}</span>
        <button
          type="button"
          aria-label={`Close ${title}`}
          title={`Close ${title}`}
          onClick={onClose}
          className="ml-auto shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="max-h-[calc(100vh-140px)] overflow-y-auto">{children}</div>
    </div>
  );
}
