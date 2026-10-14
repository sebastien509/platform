import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

interface PortalMenuProps {
  /** The element the menu anchors to. */
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  /** Horizontal alignment relative to the anchor. */
  align?: 'start' | 'end';
  /** Vertical gap in pixels. */
  offset?: number;
  /** Estimated width — used for clamping before the menu measures itself. */
  estimatedWidth?: number;
  className?: string;
  children: ReactNode;
}

/**
 * PortalMenu — a dropdown that renders into document.body and
 * positions itself via the anchor's bounding rect.
 *
 * Why: `position: absolute` inside a transformed or filtered
 * ancestor escapes to the nearest containing block and lands
 * somewhere unexpected. Portaling to body bypasses every ancestor
 * and positions with `position: fixed` against the viewport.
 */
export function PortalMenu({
  anchor,
  open,
  onClose,
  align = 'end',
  offset = 6,
  estimatedWidth = 200,
  className = 'portal-menu',
  children,
}: PortalMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchor) return;
    const rect = anchor.getBoundingClientRect();
    const menuWidth = menuRef.current?.offsetWidth ?? estimatedWidth;
    const menuHeight = menuRef.current?.offsetHeight ?? 0;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = align === 'end' ? rect.right - menuWidth : rect.left;
    // Clamp horizontally
    if (left + menuWidth > vw - 8) left = vw - menuWidth - 8;
    if (left < 8) left = 8;

    // Prefer below the anchor; flip above if it would overflow
    let top = rect.bottom + offset;
    if (menuHeight && top + menuHeight > vh - 8) {
      top = Math.max(8, rect.top - menuHeight - offset);
    }

    setPos({ top, left });
  }, [open, anchor, align, offset, estimatedWidth]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        menuRef.current?.contains(e.target as Node) ||
        anchor?.contains(e.target as Node)
      )
        return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onScroll = () => onClose();

    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, onClose, anchor]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={menuRef}
      className={className}
      style={{
        position: 'fixed',
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        zIndex: 1000,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
