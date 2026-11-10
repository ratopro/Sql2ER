import React from 'react';
import { Minus, Plus, Maximize2, Map, Type } from 'lucide-react';

interface ZoomBarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToScreen: () => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  fontSizePercent: number;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  onResetFontSize: () => void;
}

export const ZoomBar: React.FC<ZoomBarProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToScreen,
  showMinimap,
  onToggleMinimap,
  fontSizePercent,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onResetFontSize,
}) => {
  const percentage = Math.round(zoom * 100);

  return (
    <div className="absolute right-4 bottom-4 z-20 flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-lg select-none text-slate-700 dark:text-slate-300">
      {/* Canvas Zoom Section */}
      <button
        onClick={onZoomOut}
        title="Reducir zoom de lienzo (-)"
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      {/* Percentage click to 100% */}
      <button
        onClick={onResetZoom}
        title="Restablecer zoom de lienzo al 100%"
        className="px-2 py-1 text-xs font-mono font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors tabular-nums min-w-[50px] text-center"
      >
        {percentage}%
      </button>

      {/* Zoom in */}
      <button
        onClick={onZoomIn}
        title="Aumentar zoom de lienzo (+)"
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 my-auto mx-0.5" />

      {/* Text Size Scale Section (Ctrl + / Ctrl -) */}
      <button
        onClick={onDecreaseFontSize}
        title="Reducir texto de la app (Ctrl + -)"
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <span className="text-[10px] font-mono font-bold">A-</span>
      </button>

      <button
        onClick={onResetFontSize}
        title="Tamaño de texto: clic para restablecer al 100% (Ctrl + 0)"
        className={`px-1.5 py-1 text-xs font-mono font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors tabular-nums flex items-center gap-1 ${
          fontSizePercent !== 100 ? 'text-amber-600 dark:text-amber-400 font-bold' : ''
        }`}
      >
        <Type className="w-3 h-3 text-slate-400" />
        <span>{fontSizePercent}%</span>
      </button>

      <button
        onClick={onIncreaseFontSize}
        title="Aumentar texto de la app (Ctrl + +)"
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <span className="text-[10px] font-mono font-bold">A+</span>
      </button>

      <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 my-auto mx-0.5" />

      {/* Fit to content */}
      <button
        onClick={onFitToScreen}
        title="Ajustar diagrama a la pantalla"
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>

      {/* Minimap toggle */}
      <button
        onClick={onToggleMinimap}
        title={showMinimap ? "Ocultar minimapa" : "Mostrar minimapa"}
        className={`p-1.5 rounded-lg transition-colors ${
          showMinimap
            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
        }`}
      >
        <Map className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
