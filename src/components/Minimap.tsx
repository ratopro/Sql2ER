import React, { useRef, useState, useEffect } from 'react';
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
  const [isDraggingViewport, setIsDraggingViewport] = useState(false);

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

  const worldW = Math.max(maxX - minX, 100);
  const worldH = Math.max(maxY - minY, 100);

  const scaleX = MAP_W / worldW;
  const scaleY = MAP_H / worldH;
  const scale = Math.max(Math.min(scaleX, scaleY), 0.01);

  // Viewport calculation
  const vpWorldX = -pan.x / zoom;
  const vpWorldY = -pan.y / zoom;
  const vpWorldW = (canvasWidth || 800) / zoom;
  const vpWorldH = (canvasHeight || 600) / zoom;

  const vpMapX = (vpWorldX - minX) * scale;
  const vpMapY = (vpWorldY - minY) * scale;
  const vpMapW = vpWorldW * scale;
  const vpMapH = vpWorldH * scale;

  // Handle clicking or dragging on the minimap background
  const handleMapMouseDown = (e: React.MouseEvent) => {
    if (!mapRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = mapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Center viewport on clicked point
    const targetWorldX = minX + clickX / scale;
    const targetWorldY = minY + clickY / scale;

    const initialPanX = -(targetWorldX * zoom - (canvasWidth || 800) / 2);
    const initialPanY = -(targetWorldY * zoom - (canvasHeight || 600) / 2);

    onPanChange({ x: initialPanX, y: initialPanY });
    setIsDraggingViewport(true);

    const startClientX = e.clientX;
    const startClientY = e.clientY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startClientX;
      const deltaY = moveEvent.clientY - startClientY;
      const newPanX = initialPanX - (deltaX / scale) * zoom;
      const newPanY = initialPanY - (deltaY / scale) * zoom;
      onPanChange({ x: newPanX, y: newPanY });
    };

    const handleMouseUp = () => {
      setIsDraggingViewport(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Handle clicking and dragging directly on the yellow viewport box
  const handleViewportMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDraggingViewport(true);

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startPanX = pan.x;
    const startPanY = pan.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startClientX;
      const deltaY = moveEvent.clientY - startClientY;
      const newPanX = startPanX - (deltaX / scale) * zoom;
      const newPanY = startPanY - (deltaY / scale) * zoom;
      onPanChange({ x: newPanX, y: newPanY });
    };

    const handleMouseUp = () => {
      setIsDraggingViewport(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={mapRef}
      onMouseDown={handleMapMouseDown}
      style={{ width: MAP_W, height: MAP_H }}
      className={`absolute right-4 bottom-16 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden select-none transition-shadow ${
        isDraggingViewport ? 'cursor-grabbing ring-2 ring-amber-500/50 shadow-2xl' : 'cursor-crosshair'
      }`}
      title="Minimapa: Arrastra el recuadro amarillo para mover el lienzo"
    >
      {/* Frames preview (rendered at base) */}
      {frames.map(f => {
        const x = (f.x - minX) * scale;
        const y = (f.y - minY) * scale;
        const w = Math.max(f.width * scale, 4);
        const h = Math.max(f.height * scale, 4);
        return (
          <div
            key={f.id}
            style={{ 
              left: x, 
              top: y, 
              width: w, 
              height: h,
              borderColor: f.borderColor || '#94a3b8',
              backgroundColor: f.bgColor && f.bgColor !== 'transparent' ? f.bgColor : undefined,
              borderStyle: f.borderStyle || 'dashed',
            }}
            className="absolute border rounded-sm pointer-events-none"
          />
        );
      })}

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
            className="absolute bg-slate-400 dark:bg-slate-500 rounded-[2px] pointer-events-none"
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
            className="absolute bg-amber-400 dark:bg-amber-500 rounded-[1px] pointer-events-none"
          />
        );
      })}

      {/* Camera Viewport Rectangle (Yellow/Amber box) */}
      <div
        onMouseDown={handleViewportMouseDown}
        style={{
          left: vpMapX,
          top: vpMapY,
          width: Math.max(vpMapW, 14),
          height: Math.max(vpMapH, 10),
        }}
        className={`absolute border-2 border-amber-500 dark:border-amber-400 rounded transition-colors ${
          isDraggingViewport
            ? 'cursor-grabbing bg-amber-500/35 ring-2 ring-amber-400/50 shadow-md'
            : 'cursor-grab bg-amber-500/20 dark:bg-amber-400/25 hover:bg-amber-500/30'
        }`}
      />
    </div>
  );
};
