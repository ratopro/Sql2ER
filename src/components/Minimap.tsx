import React, { useRef } from 'react';
import { TableNode, StickyNode, FrameNode } from '../types/erd';
import { TABLE_WIDTH, getTableHeight } from '../utils/canvasMath';

interface MinimapProps {
  tables: TableNode[];
  stickies: StickyNode[];
  frames: FrameNode[];
  pan: { x: number; y: number };
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  onPanChange: (newPan: { x: number; y: number }) => void;
}

export const Minimap: React.FC<MinimapProps> = ({
  tables,
  stickies,
  frames,
  pan,
  zoom,
  canvasWidth,
  canvasHeight,
  onPanChange,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const MAP_W = 180;
  const MAP_H = 120;

  // Compute world bounding box
  const allElements = [
    ...tables.map(t => ({ x: t.x, y: t.y, w: t.width || TABLE_WIDTH, h: getTableHeight(t) })),
    ...stickies.map(s => ({ x: s.x, y: s.y, w: s.width, h: s.height })),
    ...frames.map(f => ({ x: f.x, y: f.y, w: f.width, h: f.height })),
  ];

  let minX = -400;
  let minY = -300;
  let maxX = 2000;
  let maxY = 1400;

  if (allElements.length > 0) {
    allElements.forEach(el => {
      minX = Math.min(minX, el.x - 200);
      minY = Math.min(minY, el.y - 200);
      maxX = Math.max(maxX, el.x + el.w + 200);
      maxY = Math.max(maxY, el.y + el.h + 200);
    });
  }

  const worldW = maxX - minX;
  const worldH = maxY - minY;

  const scaleX = MAP_W / worldW;
  const scaleY = MAP_H / worldH;
  const scale = Math.min(scaleX, scaleY);

  // Viewport calculation
  const vpWorldX = -pan.x / zoom;
  const vpWorldY = -pan.y / zoom;
  const vpWorldW = canvasWidth / zoom;
  const vpWorldH = canvasHeight / zoom;

  const vpMapX = (vpWorldX - minX) * scale;
  const vpMapY = (vpWorldY - minY) * scale;
  const vpMapW = vpWorldW * scale;
  const vpMapH = vpWorldH * scale;

  const handleMapClick = (e: React.MouseEvent) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetWorldX = minX + clickX / scale;
    const targetWorldY = minY + clickY / scale;

    const newPanX = -(targetWorldX * zoom - canvasWidth / 2);
    const newPanY = -(targetWorldY * zoom - canvasHeight / 2);

    onPanChange({ x: newPanX, y: newPanY });
  };

  return (
    <div
      ref={mapRef}
      onClick={handleMapClick}
      style={{ width: MAP_W, height: MAP_H }}
      className="absolute right-4 bottom-16 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden cursor-crosshair select-none"
    >
      {/* Tables preview boxes */}
      {tables.map(t => {
        const x = (t.x - minX) * scale;
        const y = (t.y - minY) * scale;
        const w = Math.max((t.width || TABLE_WIDTH) * scale, 3);
        const h = Math.max(getTableHeight(t) * scale, 3);
        return (
          <div
            key={t.id}
            style={{ left: x, top: y, width: w, height: h }}
            className="absolute bg-slate-400 dark:bg-slate-600 rounded-[2px]"
          />
        );
      })}

      {/* Stickies preview */}
      {stickies.map(s => {
        const x = (s.x - minX) * scale;
        const y = (s.y - minY) * scale;
        const w = Math.max(s.width * scale, 2);
        const h = Math.max(s.height * scale, 2);
        return (
          <div
            key={s.id}
            style={{ left: x, top: y, width: w, height: h }}
            className="absolute bg-amber-300 dark:bg-amber-500 rounded-[1px]"
          />
        );
      })}

      {/* Frames preview */}
      {frames.map(f => {
        const x = (f.x - minX) * scale;
        const y = (f.y - minY) * scale;
        const w = f.width * scale;
        const h = f.height * scale;
        return (
          <div
            key={f.id}
            style={{ left: x, top: y, width: w, height: h }}
            className="absolute border border-dashed border-slate-300 dark:border-slate-700 rounded-sm pointer-events-none"
          />
        );
      })}

      {/* Camera Viewport Rectangle */}
      <div
        style={{
          left: Math.max(vpMapX, 0),
          top: Math.max(vpMapY, 0),
          width: Math.min(vpMapW, MAP_W),
          height: Math.min(vpMapH, MAP_H),
        }}
        className="absolute border-2 border-amber-500 bg-amber-500/15 rounded pointer-events-none transition-all duration-75"
      />
    </div>
  );
};
