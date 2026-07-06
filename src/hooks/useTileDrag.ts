"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Pointer-events drag for touch + mouse. HTML5 drag-and-drop is broken on
 * iOS Safari, so tiles use pointer capture and manual hit-testing instead.
 *
 * Tiles spread {...tileProps(id)} (includes touch-action: none). Drop zones
 * register with ref={zoneRef(id)}. On release, onDrop fires with the zone
 * under the pointer (or null) and whether the pointer actually moved —
 * a non-moved release is a tap, which consumers handle as tap-to-place.
 * The dragged tile's transform resets on release; consumers move tiles by
 * re-rendering state, never by keeping transforms.
 */

const TAP_THRESHOLD_PX = 8;

export interface DragState {
  tileId: string;
  dx: number;
  dy: number;
}

interface UseTileDragOptions {
  onDrop: (tileId: string, zoneId: string | null, moved: boolean) => void;
  onPickup?: (tileId: string) => void;
}

export function useTileDrag({ onDrop, onPickup }: UseTileDragOptions) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const originRef = useRef({ x: 0, y: 0 });
  const zonesRef = useRef(new Map<string, HTMLElement>());

  const update = useCallback((d: DragState | null) => {
    dragRef.current = d;
    setDrag(d);
  }, []);

  const zoneRef = useCallback(
    (zoneId: string) => (el: HTMLElement | null) => {
      if (el) zonesRef.current.set(zoneId, el);
      else zonesRef.current.delete(zoneId);
    },
    [],
  );

  const hitTest = useCallback((x: number, y: number): string | null => {
    for (const [zoneId, el] of zonesRef.current) {
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        return zoneId;
      }
    }
    return null;
  }, []);

  const tileProps = useCallback(
    (tileId: string) => {
      const active = drag?.tileId === tileId;
      return {
        onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          originRef.current = { x: e.clientX, y: e.clientY };
          update({ tileId, dx: 0, dy: 0 });
          onPickup?.(tileId);
        },
        onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
          if (dragRef.current?.tileId !== tileId) return;
          update({
            tileId,
            dx: e.clientX - originRef.current.x,
            dy: e.clientY - originRef.current.y,
          });
        },
        onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
          const d = dragRef.current;
          if (d?.tileId !== tileId) return;
          const moved = Math.hypot(d.dx, d.dy) > TAP_THRESHOLD_PX;
          update(null);
          onDrop(tileId, hitTest(e.clientX, e.clientY), moved);
        },
        onPointerCancel: () => {
          if (dragRef.current?.tileId === tileId) update(null);
        },
        style: {
          touchAction: "none" as const,
          ...(active && drag
            ? {
                transform: `translate(${drag.dx}px, ${drag.dy}px) scale(1.08)`,
                zIndex: 50,
                position: "relative" as const,
              }
            : {}),
        },
      };
    },
    [drag, hitTest, onDrop, onPickup, update],
  );

  return { drag, tileProps, zoneRef };
}
